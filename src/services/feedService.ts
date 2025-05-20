// src/services/feedService.ts

import { collection, doc, getDoc, getDocs, query, where, orderBy, limit as limitFirestore, startAfter, DocumentSnapshot, Timestamp, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Pairing, UserFeedItem } from '../types';
import { db } from '../config/firebase';

/**
 * Get personalized feed for a user
 */
export const getFeed = async (userId: string, limit: number = 10, startAfter?: DocumentSnapshot): Promise<{
  pairings: Pairing[];
  lastVisible: DocumentSnapshot | null;
  hasMore: boolean;
}> => {
  try {
    // Get user's feed collection
    let feedQuery;
    
    if (startAfter) {
      feedQuery = query(
        collection(db, `users/${userId}/feed`),
        orderBy('date', 'desc'),
        startAfter(startAfter),
        limitFirestore(Number(limit))
      );
    } else {
      feedQuery = query(
        collection(db, `users/${userId}/feed`),
        orderBy('date', 'desc'),
        limitFirestore(Number(limit))
      );
    }
    
    const feedSnapshot = await getDocs(feedQuery);
    const pairingIds = feedSnapshot.docs.map(doc => doc.data().pairingId);
    
    // Get the actual pairings
    const pairings: Pairing[] = [];
    
    for (const pairingId of pairingIds) {
      const pairingDoc = await getDoc(doc(db, 'pairings', pairingId));
      if (pairingDoc.exists()) {
        pairings.push({
          id: pairingDoc.id,
          ...pairingDoc.data()
        } as Pairing);
      }
    }
    
    return {
      pairings,
      lastVisible: feedSnapshot.docs.length > 0 ? feedSnapshot.docs[feedSnapshot.docs.length - 1] : null,
      hasMore: feedSnapshot.docs.length === limit
    };
  } catch (error) {
    console.error('Error getting feed:', error);
    return {
      pairings: [],
      lastVisible: null,
      hasMore: false
    };
  }
};

/**
 * Get global feed of public pairings
 */
export const getGlobalFeed = async (limit: number = 10, startAfterDoc?: DocumentSnapshot): Promise<{
  pairings: Pairing[];
  lastVisible: DocumentSnapshot | null;
  hasMore: boolean;
}> => {
  try {
    let globalFeedQuery;
    
    if (startAfterDoc) {
      globalFeedQuery = query(
        collection(db, 'globalFeed'),
        orderBy('date', 'desc'),
        startAfter(startAfterDoc),
        limitFirestore(Number(limit))
      );
    } else {
      globalFeedQuery = query(
        collection(db, 'globalFeed'),
        orderBy('date', 'desc'),
        limitFirestore(Number(limit))
      );
    }
    
    const feedSnapshot = await getDocs(globalFeedQuery);
    
    if (feedSnapshot.empty) {
      return {
        pairings: [],
        lastVisible: null,
        hasMore: false
      };
    }
    
    const pairingIds = feedSnapshot.docs.map(doc => doc.data().pairingId);
    
    // Batch fetch the pairings using Promise.all for efficiency
    const pairingPromises = pairingIds.map(pairingId => 
      getDoc(doc(db, 'pairings', pairingId))
    );
    
    const pairingDocs = await Promise.all(pairingPromises);
    
    // Map to properly structured pairing objects and filter out any that don't exist
    const pairings: Pairing[] = pairingDocs
      .filter(doc => doc.exists())
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Pairing));
    
    return {
      pairings,
      lastVisible: feedSnapshot.docs.length > 0 ? feedSnapshot.docs[feedSnapshot.docs.length - 1] : null,
      hasMore: feedSnapshot.docs.length === limit
    };
  } catch (error) {
    console.error('Error getting global feed:', error);
    return {
      pairings: [],
      lastVisible: null,
      hasMore: false
    };
  }
};

/**
 * Add an item to a user's feed
 */
export const addToUserFeed = async (userId: string, feedItem: UserFeedItem): Promise<void> => {
  try {
    await addDoc(collection(db, `users/${userId}/feed`), feedItem);
  } catch (error) {
    console.error('Error adding to user feed:', error);
    throw error;
  }
};

/**
 * Add a pairing to the global feed and to each user's personal feed
 */
export const publishPairingToFeed = async (pairing: Pairing): Promise<void> => {
  try {
    if (pairing.status !== 'completed' || !pairing.completedAt) {
      throw new Error('Cannot publish incomplete pairing to feed');
    }
    
    // Check if this pairing is already in the global feed
    const globalFeedQuery = query(
      collection(db, 'globalFeed'),
      where('pairingId', '==', pairing.id),
      limitFirestore(1)
    );
    
    const globalFeedSnapshot = await getDocs(globalFeedQuery);
    
    // Use batch writes for efficiency and atomicity
    const batch = writeBatch(db);
    
    // Only add to global feed if not private and not already there
    if (!pairing.isPrivate && globalFeedSnapshot.empty) {
      // Create a new document reference for the global feed
      const globalFeedRef = doc(collection(db, 'globalFeed'));
      
      batch.set(globalFeedRef, {
        pairingId: pairing.id,
        date: pairing.date,
        completedAt: pairing.completedAt,
        users: pairing.users,
        user1_id: pairing.user1_id,
        user2_id: pairing.user2_id,
        createdAt: serverTimestamp()
      });
    }
    
    // Add to each user's personal feed if not already there
    for (const userId of pairing.users) {
      // Check if already in user's feed
      const userFeedQuery = query(
        collection(db, `users/${userId}/feed`),
        where('pairingId', '==', pairing.id),
        limitFirestore(1)
      );
      
      const userFeedSnapshot = await getDocs(userFeedQuery);
      
      if (userFeedSnapshot.empty) {
        // Get usernames for feed item
        const userFeedRef = doc(collection(db, `users/${userId}/feed`));
        
        batch.set(userFeedRef, {
          pairingId: pairing.id,
          date: pairing.date,
          users: pairing.users,
          status: 'completed',
          likesCount: pairing.likesCount || 0,
          commentsCount: pairing.commentsCount || 0,
          isPrivate: pairing.isPrivate,
          createdAt: serverTimestamp()
        });
      }
    }
    
    // Commit all the writes
    await batch.commit();
    
    console.log(`Pairing ${pairing.id} published to feed`);
  } catch (error) {
    console.error('Error publishing pairing to feed:', error);
    throw error;
  }
};

// Import the missing Firebase function
import { addDoc } from 'firebase/firestore';