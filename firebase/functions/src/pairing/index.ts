/**
 * Pairing Cloud Functions
 * 
 * Handles daily user pairing algorithm and expiration.
 * Updated for PRD v3 with individual photo submissions and chat integration.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Pairing, User } from '../../../src/types';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Pairs users daily based on an optimized algorithm
 * Runs every day at 12:00 AM PT
 */
export const pairUsersDaily = functions.pubsub
  .schedule('0 0 * * *') // Every day at midnight
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    try {
      console.log('Starting daily pairing algorithm');
      
      // Get all active users
      const usersSnapshot = await db.collection('users')
        .where('isActive', '==', true)
        .get();
      
      if (usersSnapshot.empty) {
        console.log('No active users found');
        return null;
      }
      
      const activeUsers: User[] = [];
      usersSnapshot.forEach(doc => {
        activeUsers.push({
          ...doc.data() as User,
          id: doc.id
        });
      });
      
      console.log(`Found ${activeUsers.length} active users`);
      
      // Prioritize users who were waitlisted yesterday
      const priorityUsers = activeUsers.filter(user => user.priorityNextPairing === true);
      const regularUsers = activeUsers.filter(user => user.priorityNextPairing !== true);
      
      console.log(`Priority users: ${priorityUsers.length}, Regular users: ${regularUsers.length}`);
      
      // Shuffle both arrays to randomize pairing order
      const shuffledPriorityUsers = shuffleArray(priorityUsers);
      const shuffledRegularUsers = shuffleArray(regularUsers);
      
      // Combine arrays with priority users first
      const orderedUsers = [...shuffledPriorityUsers, ...shuffledRegularUsers];
      
      // Create pairs and handle odd number of users
      const pairs: [User, User][] = [];
      const waitlisted: User[] = [];
      
      // Get recent pairings to avoid repeats (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const recentPairingsSnapshot = await db.collection('pairings')
        .where('date', '>=', admin.firestore.Timestamp.fromDate(oneWeekAgo))
        .get();
      
      const recentPairings = recentPairingsSnapshot.docs.map(doc => doc.data() as Pairing);
      
      // Build a map of recent partners for each user
      const recentPartners: Record<string, Set<string>> = {};
      
      recentPairings.forEach(pairing => {
        const [user1Id, user2Id] = pairing.users;
        
        if (!recentPartners[user1Id]) {
          recentPartners[user1Id] = new Set<string>();
        }
        if (!recentPartners[user2Id]) {
          recentPartners[user2Id] = new Set<string>();
        }
        
        recentPartners[user1Id].add(user2Id);
        recentPartners[user2Id].add(user1Id);
      });
      
      // Helper to check if users can be paired (not blocked, not recent partners)
      const canBePaired = (user1: User, user2: User): boolean => {
        // Check if either user has blocked the other
        if (
          user1.blockedIds?.includes(user2.id) || 
          user2.blockedIds?.includes(user1.id)
        ) {
          return false;
        }
        
        // Check if they were recently paired
        if (
          recentPartners[user1.id]?.has(user2.id) ||
          recentPartners[user2.id]?.has(user1.id)
        ) {
          return false;
        }
        
        return true;
      };
      
      // Try to create pairs
      const pairedUserIds = new Set<string>();
      
      // First, try to pair priority users with each other
      for (let i = 0; i < shuffledPriorityUsers.length; i++) {
        if (pairedUserIds.has(shuffledPriorityUsers[i].id)) continue;
        
        let foundPartner = false;
        
        for (let j = i + 1; j < shuffledPriorityUsers.length; j++) {
          if (pairedUserIds.has(shuffledPriorityUsers[j].id)) continue;
          
          if (canBePaired(shuffledPriorityUsers[i], shuffledPriorityUsers[j])) {
            pairs.push([shuffledPriorityUsers[i], shuffledPriorityUsers[j]]);
            pairedUserIds.add(shuffledPriorityUsers[i].id);
            pairedUserIds.add(shuffledPriorityUsers[j].id);
            foundPartner = true;
            break;
          }
        }
        
        // If priority user couldn't be paired with another priority user,
        // we'll try to pair them with regular users in the next phase
      }
      
      // Then pair remaining priority users with regular users
      for (const priorityUser of shuffledPriorityUsers) {
        if (pairedUserIds.has(priorityUser.id)) continue;
        
        let foundPartner = false;
        
        for (const regularUser of shuffledRegularUsers) {
          if (pairedUserIds.has(regularUser.id)) continue;
          
          if (canBePaired(priorityUser, regularUser)) {
            pairs.push([priorityUser, regularUser]);
            pairedUserIds.add(priorityUser.id);
            pairedUserIds.add(regularUser.id);
            foundPartner = true;
            break;
          }
        }
        
        // If still couldn't pair, add to waitlisted
        if (!foundPartner) {
          waitlisted.push(priorityUser);
        }
      }
      
      // Finally, pair remaining regular users
      for (let i = 0; i < shuffledRegularUsers.length; i++) {
        if (pairedUserIds.has(shuffledRegularUsers[i].id)) continue;
        
        let foundPartner = false;
        
        for (let j = i + 1; j < shuffledRegularUsers.length; j++) {
          if (pairedUserIds.has(shuffledRegularUsers[j].id)) continue;
          
          if (canBePaired(shuffledRegularUsers[i], shuffledRegularUsers[j])) {
            pairs.push([shuffledRegularUsers[i], shuffledRegularUsers[j]]);
            pairedUserIds.add(shuffledRegularUsers[i].id);
            pairedUserIds.add(shuffledRegularUsers[j].id);
            foundPartner = true;
            break;
          }
        }
        
        // If couldn't pair, add to waitlisted
        if (!foundPartner) {
          waitlisted.push(shuffledRegularUsers[i]);
        }
      }
      
      console.log(`Created ${pairs.length} pairs, ${waitlisted.length} users waitlisted`);
      
      // Create pairings in Firestore
      const batch = db.batch();
      const today = new Date();
      const expiresAt = new Date(today);
      expiresAt.setHours(22, 0, 0, 0); // Expires at 10:00 PM today
      
      // Create unique chat ID
      const createChatId = (): string => {
        return 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
      };
      
      // Create a virtual meeting link
      const createVirtualMeetingLink = (pairingId: string): string => {
        return `https://meet.jitsi.si/DailyMeetupSelfie-${pairingId}`;
      };
      
      // Create all pairing documents
      for (const [user1, user2] of pairs) {
        const pairingId = db.collection('pairings').doc().id;
        const chatId = createChatId();
        const virtualMeetingLink = createVirtualMeetingLink(pairingId);
        
        const pairingData: Pairing = {
          id: pairingId,
          date: admin.firestore.Timestamp.fromDate(today) as any,
          expiresAt: admin.firestore.Timestamp.fromDate(expiresAt) as any,
          users: [user1.id, user2.id],
          user1_id: user1.id,
          user2_id: user2.id,
          status: 'pending',
          user1_photoURL: null,
          user2_photoURL: null,
          user1_submittedAt: null,
          user2_submittedAt: null,
          chatId,
          likesCount: 0,
          likedBy: [],
          commentsCount: 0,
          isPrivate: false,
          virtualMeetingLink
        };
        
        // Add pairing to batch
        batch.set(db.collection('pairings').doc(pairingId), pairingData);
        
        // Create chat room
        batch.set(db.collection('chats').doc(chatId), {
          id: chatId,
          pairingId,
          userIds: [user1.id, user2.id],
          createdAt: admin.firestore.Timestamp.fromDate(today),
          lastMessage: null,
          lastActivityAt: admin.firestore.Timestamp.fromDate(today)
        });
        
        // Reset priority for paired users
        batch.update(db.collection('users').doc(user1.id), {
          priorityNextPairing: false,
          waitlistedToday: false
        });
        
        batch.update(db.collection('users').doc(user2.id), {
          priorityNextPairing: false,
          waitlistedToday: false
        });
      }
      
      // Mark waitlisted users
      for (const user of waitlisted) {
        batch.update(db.collection('users').doc(user.id), {
          priorityNextPairing: true,
          waitlistedToday: true
        });
      }
      
      // Commit all changes
      await batch.commit();
      
      console.log(`Successfully committed ${pairs.length} pairings and updated ${waitlisted.length} waitlisted users`);
      
      return {
        success: true,
        pairsCreated: pairs.length,
        waitlistedUsers: waitlisted.length
      };
    } catch (error) {
      console.error('Error in pairUsersDaily:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

/**
 * Mark expired pairings as flaked for users who didn't submit photos
 * Runs every day at 11:00 PM PT
 */
export const markExpiredPairingsAsFlaked = functions.pubsub
  .schedule('0 23 * * *') // Every day at 11:00 PM
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    try {
      console.log('Starting expired pairings check');
      
      const now = admin.firestore.Timestamp.now();
      
      // Find all pending or partially completed pairings that have expired
      const expiredPairingsSnapshot = await db.collection('pairings')
        .where('expiresAt', '<', now)
        .where('status', 'in', ['pending', 'user1_submitted', 'user2_submitted'])
        .get();
      
      if (expiredPairingsSnapshot.empty) {
        console.log('No expired pairings found');
        return null;
      }
      
      console.log(`Found ${expiredPairingsSnapshot.size} expired pairings`);
      
      const batch = db.batch();
      
      // Update flake streaks for users who didn't submit
      for (const doc of expiredPairingsSnapshot.docs) {
        const pairing = doc.data() as Pairing;
        
        // Mark pairing as flaked
        batch.update(doc.ref, {
          status: 'flaked'
        });
        
        // Update flake streaks for users who didn't submit
        if (pairing.status === 'pending' || pairing.status === 'user2_submitted') {
          // User 1 didn't submit
          const user1Doc = await db.collection('users').doc(pairing.user1_id).get();
          const user1Data = user1Doc.data() as User;
          
          const newStreak = (user1Data.flakeStreak || 0) + 1;
          const newMaxStreak = Math.max(newStreak, user1Data.maxFlakeStreak || 0);
          
          batch.update(user1Doc.ref, {
            flakeStreak: newStreak,
            maxFlakeStreak: newMaxStreak
          });
        }
        
        if (pairing.status === 'pending' || pairing.status === 'user1_submitted') {
          // User 2 didn't submit
          const user2Doc = await db.collection('users').doc(pairing.user2_id).get();
          const user2Data = user2Doc.data() as User;
          
          const newStreak = (user2Data.flakeStreak || 0) + 1;
          const newMaxStreak = Math.max(newStreak, user2Data.maxFlakeStreak || 0);
          
          batch.update(user2Doc.ref, {
            flakeStreak: newStreak,
            maxFlakeStreak: newMaxStreak
          });
        }
      }
      
      await batch.commit();
      
      console.log(`Successfully updated ${expiredPairingsSnapshot.size} expired pairings to flaked status`);
      
      return {
        success: true,
        pairingsUpdated: expiredPairingsSnapshot.size
      };
    } catch (error) {
      console.error('Error in markExpiredPairingsAsFlaked:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

/**
 * Utility function to shuffle an array
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
} 