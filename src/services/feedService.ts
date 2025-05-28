// src/services/feedService.ts

import { collection, doc, getDoc, getDocs, query, where, orderBy, limit as limitFirestore, startAfter as startAfterConstraint, DocumentSnapshot, Timestamp, writeBatch, serverTimestamp, addDoc } from 'firebase/firestore';
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
    console.log('DEBUG: getFeed called for user:', userId, 'limit:', limit);
    
    // ALWAYS try connections-based feed first for better social experience
    // This ensures users see their friends' content even if they have personal feed items
    console.log('DEBUG: Trying connections-based feed first');
    const connectionsFeed = await getConnectionsBasedFeed(userId, limit, startAfter);
    
    if (connectionsFeed.pairings.length > 0) {
      console.log('DEBUG: Connections-based feed returned', connectionsFeed.pairings.length, 'pairings');
      return connectionsFeed;
    }
    
    console.log('DEBUG: Connections-based feed was empty, trying personal feed collection');
    
    // Fallback to personal feed collection if connections feed is empty
    let feedQuery;
    
    if (startAfter) {
      feedQuery = query(
        collection(db, `users/${userId}/feed`),
        orderBy('date', 'desc'),
        startAfterConstraint(startAfter),
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
    
    console.log('DEBUG: Personal feed query results:', {
      isEmpty: feedSnapshot.empty,
      docsCount: feedSnapshot.docs.length
    });
    
    if (feedSnapshot.empty) {
      console.log('DEBUG: Personal feed also empty, trying global feed');
      return await getGlobalFeed(limit, startAfter);
    }
    
    const pairingIds = feedSnapshot.docs.map(doc => {
      const data = doc.data();
      return (data as any).pairingId;
    });
    
    console.log('DEBUG: Personal feed pairingIds:', pairingIds);
    
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
    
    console.log('DEBUG: Personal feed returned', pairings.length, 'pairings');
    
    return {
      pairings,
      lastVisible: feedSnapshot.docs.length > 0 ? feedSnapshot.docs[feedSnapshot.docs.length - 1] : null,
      hasMore: feedSnapshot.docs.length === limit
    };
  } catch (error) {
    console.error('Error getting feed:', error);
    // Fall back to connections-based feed on error
    console.log('DEBUG: Error occurred, falling back to connections-based feed');
    return await getConnectionsBasedFeed(userId, limit, startAfter);
  }
};

/**
 * Get feed based on user's connections when personal feed is empty
 */
export const getConnectionsBasedFeed = async (userId: string, limit: number = 10, startAfter?: DocumentSnapshot): Promise<{
  pairings: Pairing[];
  lastVisible: DocumentSnapshot | null;
  hasMore: boolean;
}> => {
  try {
    // Get user's connections first
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      console.error('User not found:', userId);
      return { pairings: [], lastVisible: null, hasMore: false };
    }
    
    const userData = userDoc.data();
    const connections = userData.connections || [];
    
    console.log('DEBUG: User connections:', {
      userId,
      connectionsCount: connections.length,
      connections: connections.slice(0, 5) // Show first 5 connections for debugging
    });
    
    if (connections.length === 0) {
      console.log('DEBUG: User has no connections, showing global feed');
      return await getGlobalFeed(limit, startAfter);
    }
    
    // Include the user themselves in the feed
    const usersToInclude = [userId, ...connections];
    
    console.log('DEBUG: Loading feed for connections:', {
      connectionsCount: connections.length,
      usersToIncludeCount: usersToInclude.length,
      firstFewUsers: usersToInclude.slice(0, 3)
    });
    
    // Firestore array-contains-any has a limit of 10 items, so we need to handle this limitation
    const maxUsers = Math.min(usersToInclude.length, 10);
    const usersForQuery = usersToInclude.slice(0, maxUsers);
    
    console.log('DEBUG: Users for query:', { maxUsers, usersForQuery });
    
    // Try the main query with completedAt ordering
    let pairingsQuery;
    
    try {
      if (startAfter) {
        pairingsQuery = query(
          collection(db, 'pairings'),
          where('status', '==', 'completed'),
          where('users', 'array-contains-any', usersForQuery),
          orderBy('completedAt', 'desc'),
          startAfterConstraint(startAfter),
          limitFirestore(Number(limit))
        );
      } else {
        pairingsQuery = query(
          collection(db, 'pairings'),
          where('status', '==', 'completed'),
          where('users', 'array-contains-any', usersForQuery),
          orderBy('completedAt', 'desc'),
          limitFirestore(Number(limit))
        );
      }
      
      console.log('DEBUG: Executing connections query with completedAt ordering');
      const pairingsSnapshot = await getDocs(pairingsQuery);
      
      console.log('DEBUG: Query results:', {
        isEmpty: pairingsSnapshot.empty,
        docsCount: pairingsSnapshot.docs.length
      });
      
      if (!pairingsSnapshot.empty) {
        const pairings: Pairing[] = pairingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Pairing, 'id'>)
        } as Pairing));
        
        console.log('DEBUG: Found pairings via completedAt query:', {
          count: pairings.length,
          firstPairingId: pairings[0]?.id,
          firstPairingUsers: pairings[0]?.users
        });
        
        return {
          pairings,
          lastVisible: pairingsSnapshot.docs.length > 0 ? pairingsSnapshot.docs[pairingsSnapshot.docs.length - 1] : null,
          hasMore: pairingsSnapshot.docs.length === limit
        };
      }
    } catch (queryError) {
      console.warn('DEBUG: completedAt query failed, trying fallback with date ordering:', queryError);
    }
    
    // Fallback query using 'date' field instead of 'completedAt'
    try {
      let fallbackQuery;
      
      if (startAfter) {
        fallbackQuery = query(
          collection(db, 'pairings'),
          where('status', '==', 'completed'),
          where('users', 'array-contains-any', usersForQuery),
          orderBy('date', 'desc'),
          startAfterConstraint(startAfter),
          limitFirestore(Number(limit))
        );
      } else {
        fallbackQuery = query(
          collection(db, 'pairings'),
          where('status', '==', 'completed'),
          where('users', 'array-contains-any', usersForQuery),
          orderBy('date', 'desc'),
          limitFirestore(Number(limit))
        );
      }
      
      console.log('DEBUG: Executing fallback connections query with date ordering');
      const fallbackSnapshot = await getDocs(fallbackQuery);
      
      console.log('DEBUG: Fallback query results:', {
        isEmpty: fallbackSnapshot.empty,
        docsCount: fallbackSnapshot.docs.length
      });
      
      if (!fallbackSnapshot.empty) {
        const pairings: Pairing[] = fallbackSnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Pairing, 'id'>)
        } as Pairing));
        
        console.log('DEBUG: Found pairings via date fallback query:', {
          count: pairings.length,
          firstPairingId: pairings[0]?.id,
          firstPairingUsers: pairings[0]?.users
        });
        
        return {
          pairings,
          lastVisible: fallbackSnapshot.docs.length > 0 ? fallbackSnapshot.docs[fallbackSnapshot.docs.length - 1] : null,
          hasMore: fallbackSnapshot.docs.length === limit
        };
      }
    } catch (fallbackError) {
      console.error('DEBUG: Both queries failed:', fallbackError);
    }
    
    // If both queries failed or returned empty, try a simple query without ordering
    try {
      console.log('DEBUG: Trying simple query without ordering');
      const simpleQuery = query(
        collection(db, 'pairings'),
        where('status', '==', 'completed'),
        where('users', 'array-contains-any', usersForQuery),
        limitFirestore(Number(limit))
      );
      
      const simpleSnapshot = await getDocs(simpleQuery);
      
      console.log('DEBUG: Simple query results:', {
        isEmpty: simpleSnapshot.empty,
        docsCount: simpleSnapshot.docs.length
      });
      
      if (!simpleSnapshot.empty) {
        const pairings: Pairing[] = simpleSnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Pairing, 'id'>)
        } as Pairing));
        
        console.log('DEBUG: Found pairings via simple query:', {
          count: pairings.length,
          firstPairingId: pairings[0]?.id,
          firstPairingUsers: pairings[0]?.users
        });
        
        return {
          pairings,
          lastVisible: simpleSnapshot.docs.length > 0 ? simpleSnapshot.docs[simpleSnapshot.docs.length - 1] : null,
          hasMore: simpleSnapshot.docs.length === limit
        };
      }
    } catch (simpleError) {
      console.error('DEBUG: Simple query also failed:', simpleError);
    }
    
    console.log('DEBUG: No pairings found for connections, showing global feed');
    return await getGlobalFeed(limit, startAfter);
  } catch (error) {
    console.error('Error getting connections-based feed:', error);
    // Final fallback to global feed
    return await getGlobalFeed(limit, startAfter);
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
        startAfterConstraint(startAfterDoc),
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
    
    const pairingIds = feedSnapshot.docs.map(doc => {
      const data = doc.data();
      return (data as any).pairingId;
    });
    
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
        // Create a new document reference for the user's feed
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