// src/services/feedService.ts

import { collection, doc, getDoc, getDocs, query, where, orderBy, limit as limitFirestore, startAfter, DocumentSnapshot } from 'firebase/firestore';
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
export const getGlobalFeed = async (limit: number = 10, startAfter?: DocumentSnapshot): Promise<{
  pairings: Pairing[];
  lastVisible: DocumentSnapshot | null;
  hasMore: boolean;
}> => {
  try {
    let globalFeedQuery;
    
    if (startAfter) {
      globalFeedQuery = query(
        collection(db, 'globalFeed'),
        orderBy('date', 'desc'),
        startAfter(startAfter),
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

// Import the missing Firebase function
import { addDoc } from 'firebase/firestore';