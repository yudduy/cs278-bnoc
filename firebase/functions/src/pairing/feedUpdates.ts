/**
 * Feed Update Functions
 * 
 * Cloud functions for updating feed items:
 * - Creating feed items when pairings are completed
 * - Archiving old feed items
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Pairing, UserFeedItem } from '../../../src/types';

// This ensures Firebase is initialized only once
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Creates or updates feed items when a pairing status changes
 */
export const updateFeedsOnPairingUpdate = functions.firestore
  .document('pairings/{pairingId}')
  .onUpdate(async (change, context) => {
    try {
      const pairingBefore = change.before.data() as Pairing;
      const pairingAfter = change.after.data() as Pairing;
      const pairingId = context.params.pairingId;
      const db = admin.firestore();
      
      // Only process if the status has changed to 'completed' or 'flaked'
      if (
        (pairingAfter.status === 'completed' || pairingAfter.status === 'flaked') &&
        pairingBefore.status !== pairingAfter.status
      ) {
        const batch = db.batch();
        
        // Get user details for denormalization
        const user1Doc = await db.collection('users').doc(pairingAfter.user1_id).get();
        const user2Doc = await db.collection('users').doc(pairingAfter.user2_id).get();
        
        if (!user1Doc.exists || !user2Doc.exists) {
          console.error(`One or more users not found: ${pairingAfter.user1_id}, ${pairingAfter.user2_id}`);
          return null;
        }
        
        const user1Data = user1Doc.data() || {};
        const user2Data = user2Doc.data() || {};
        
        // Create the feed item
        const feedItem: UserFeedItem = {
          pairingId,
          date: pairingAfter.status === 'completed' 
            ? (pairingAfter.user1_submittedAt && pairingAfter.user2_submittedAt 
              ? (pairingAfter.user1_submittedAt.toMillis() > pairingAfter.user2_submittedAt.toMillis() 
                ? pairingAfter.user1_submittedAt 
                : pairingAfter.user2_submittedAt) 
              : pairingAfter.date) 
            : pairingAfter.expiresAt,
          user1_id: pairingAfter.user1_id,
          user1_username: user1Data.username || 'User',
          user1_photoURL: pairingAfter.user1_photoURL || null,
          user1_profilePicURL: user1Data.photoURL || null,
          user2_id: pairingAfter.user2_id,
          user2_username: user2Data.username || 'User',
          user2_photoURL: pairingAfter.user2_photoURL || null,
          user2_profilePicURL: user2Data.photoURL || null,
          status: pairingAfter.status as 'completed' | 'flaked',
          likesCount: pairingAfter.likesCount || 0,
          commentsCount: pairingAfter.commentsCount || 0,
        };
        
        // Add to user feeds
        batch.set(
          db.collection('userFeeds').doc(pairingAfter.user1_id).collection('items').doc(pairingId),
          feedItem
        );
        
        batch.set(
          db.collection('userFeeds').doc(pairingAfter.user2_id).collection('items').doc(pairingId),
          feedItem
        );
        
        // Check if eligible for global feed (based on user privacy settings)
        // Note: For MVP, this is simplified. In production, we'd check
        // the privacy settings of both users
        try {
          const user1Privacy = user1Data.privacySettings || {};
          const user2Privacy = user2Data.privacySettings || {};
          
          if (
            pairingAfter.status === 'completed' &&
            !pairingAfter.isPrivate &&
            user1Privacy.globalFeedOptIn !== false &&
            user2Privacy.globalFeedOptIn !== false
          ) {
            // Add to global feed
            batch.set(
              db.collection('globalFeed').doc(pairingId),
              feedItem
            );
          }
        } catch (error) {
          console.error('Error checking privacy settings:', error);
          // Continue with user feeds even if global feed fails
        }
        
        // Update connected users' feeds (mutual connections)
        // This is more complex and would be implemented in a full solution
        
        await batch.commit();
        console.log(`Feed items created for pairing ${pairingId}`);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating feeds:', error);
      return { success: false, error: (error as Error).message };
    }
  });

/**
 * Archives old feed items (runs daily)
 */
export const archiveOldFeedItems = functions.pubsub
  .schedule('0 0 * * *') // Every day at midnight
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    try {
      const db = admin.firestore();
      const cutoffDate = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
      );
      
      // Get all users
      const usersSnapshot = await db.collection('users').get();
      const batch = db.batch();
      let operationCount = 0;
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        
        // Get feed items older than cutoff date
        const oldItemsSnapshot = await db.collection('userFeeds')
          .doc(userId)
          .collection('items')
          .where('date', '<', cutoffDate)
          .limit(500) // Process in batches to avoid exceeding limits
          .get();
        
        if (oldItemsSnapshot.empty) continue;
        
        for (const itemDoc of oldItemsSnapshot.docs) {
          const itemData = itemDoc.data();
          
          // Add to archive
          const archiveRef = db.collection('userFeeds')
            .doc(userId)
            .collection('archive')
            .doc(itemDoc.id);
            
          batch.set(archiveRef, itemData);
          
          // Remove from active items
          const itemRef = db.collection('userFeeds')
            .doc(userId)
            .collection('items')
            .doc(itemDoc.id);
            
          batch.delete(itemRef);
          
          operationCount += 2;
          
          // Commit batch when approaching limits
          if (operationCount >= 450) {
            await batch.commit();
            console.log(`Committed batch of ${operationCount} operations`);
            // Reset for next batch
            operationCount = 0;
          }
        }
      }
      
      // Commit any remaining operations
      if (operationCount > 0) {
        await batch.commit();
        console.log(`Committed final batch of ${operationCount} operations`);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error archiving feed items:', error);
      return { success: false, error: (error as Error).message };
    }
  }); 