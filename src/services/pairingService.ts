// src/services/pairingService.ts

import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, updateDoc, addDoc, arrayUnion, Timestamp, DocumentSnapshot, increment, startAfter, QueryConstraint } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { Pairing, Comment, PairingFeedItem, User } from '../types';
import { db, storage } from '../config/firebase';
import { getUserById } from './userService';

/**
 * Get current pairing for a user
 */
export const getCurrentPairing = async (userId: string): Promise<Pairing | null> => {
  try {
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Query pairings for today
    const pairingsQuery = query(
      collection(db, 'pairings'),
      where('users', 'array-contains', userId),
      where('date', '>=', today),
      orderBy('date', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(pairingsQuery);
    if (snapshot.empty) return null;
    
    const pairingDoc = snapshot.docs[0];
    return {
      id: pairingDoc.id,
      ...pairingDoc.data()
    } as Pairing;
  } catch (error) {
    console.error('Error getting current pairing:', error);
    return null;
  }
};

/**
 * Get pairing by ID
 */
export const getPairingById = async (pairingId: string): Promise<Pairing | null> => {
  try {
    const pairingDoc = await getDoc(doc(db, 'pairings', pairingId));
    if (!pairingDoc.exists()) return null;
    
    return {
      id: pairingDoc.id,
      ...pairingDoc.data()
    } as Pairing;
  } catch (error) {
    console.error('Error getting pairing by ID:', error);
    return null;
  }
};

/**
 * Get user pairing history
 */
export const getUserPairingHistory = async (userId: string, limitNum: number = 10): Promise<Pairing[]> => {
  try {
    const pairingsQuery = query(
      collection(db, 'pairings'),
      where('users', 'array-contains', userId),
      orderBy('date', 'desc'),
      limit(limitNum)
    );
    
    const snapshot = await getDocs(pairingsQuery);
    return snapshot.docs.map(docData => ({
      id: docData.id,
      ...docData.data()
    })) as Pairing[];
  } catch (error) {
    console.error('Error getting user pairing history:', error);
    return [];
  }
};

/**
 * Get the most recent pairings for a feed, optionally for a specific user or their connections.
 *
 * @param count - Number of pairings to retrieve.
 * @param forUserId - (Optional) If provided, fetches recent pairings involving this user.
 * @param afterDoc - (Optional) DocumentSnapshot to start after for pagination.
 * @returns A promise that resolves to an array of PairingFeedItem objects.
 */
export const getRecentPairingsFeed = async (
  count: number = 10,
  forUserId?: string,
  afterDoc?: DocumentSnapshot 
): Promise<PairingFeedItem[]> => {
  try {
    const pairingsCollectionRef = collection(db, 'pairings');
    
    const queryConstraints: QueryConstraint[] = [
      where('status', '==', 'completed'),
      orderBy('completedAt', 'desc'),
      limit(count)
    ];

    if (forUserId) {
      queryConstraints.unshift(where('users', 'array-contains', forUserId));
    } else {
      // If not for a specific user, only show public pairings by default
      queryConstraints.unshift(where('isPrivate', '==', false));
    }

    if (afterDoc) {
      queryConstraints.push(startAfter(afterDoc));
    }

    const q = query(pairingsCollectionRef, ...queryConstraints);

    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];

    const feedItemsPromises = snapshot.docs.map(async (docData): Promise<PairingFeedItem | null> => {
      const pairingData = docData.data();
      
      // Validate users field
      const usersArray = pairingData.users;
      if (!Array.isArray(usersArray) || usersArray.length !== 2 || !usersArray.every(u => typeof u === 'string')) {
        console.warn(`Pairing ${docData.id} has malformed 'users' field:`, usersArray);
        return null; // Skip this pairing
      }
      const validUsersTuple = usersArray as [string, string];

      // Validate required string fields, providing defaults or logging issues
      const user1_id = pairingData.user1_id as string;
      const user2_id = pairingData.user2_id as string;
      const chatId = pairingData.chatId as string;
      if (!user1_id || !user2_id) {
        console.warn(`Pairing ${docData.id} is missing user1_id or user2_id.`);
        return null;
      }

      const basePairing: Pairing = {
        id: docData.id,
        date: pairingData.date as Timestamp, // Assuming it's always a Timestamp
        expiresAt: pairingData.expiresAt as Timestamp, // Assuming it's always a Timestamp
        users: validUsersTuple,
        status: pairingData.status as Pairing['status'], // Type assertion for known set of statuses
        user1_id: user1_id,
        // Correctly handle fields that can be string | undefined or Timestamp | undefined in Firestore data
        // and align with Pairing type which uses optional (e.g. user1_photoURL?: string)
        user1_photoURL: pairingData.user1_photoURL ?? undefined, 
        user1_submittedAt: pairingData.user1_submittedAt ?? undefined,
        user2_id: user2_id,
        user2_photoURL: pairingData.user2_photoURL ?? undefined,
        user2_submittedAt: pairingData.user2_submittedAt ?? undefined,
        chatId: chatId || '',
        likesCount: (pairingData.likesCount || 0) as number,
        likedBy: (pairingData.likedBy || []) as string[],
        commentsCount: (pairingData.commentsCount || 0) as number,
        completedAt: pairingData.completedAt ?? undefined,
        isPrivate: pairingData.isPrivate as boolean, // Assuming it's always a boolean
        virtualMeetingLink: (pairingData.virtualMeetingLink || '') as string, // Provide default if can be missing
      };
      
      let user1Profile: User | null = null;
      let user2Profile: User | null = null;

      // user1_id and user2_id are validated above to be strings
      user1Profile = await getUserById(basePairing.user1_id);
      user2Profile = await getUserById(basePairing.user2_id);

      // If user profiles are essential and not found, you might choose to return null
      // For now, we allow them to be undefined in PairingFeedItem

      const feedItem: PairingFeedItem = {
        ...basePairing,
        user1: user1Profile ? {
          id: user1Profile.id,
          username: user1Profile.username,
          displayName: user1Profile.displayName,
          photoURL: user1Profile.photoURL,
        } : undefined,
        user2: user2Profile ? {
          id: user2Profile.id,
          username: user2Profile.username,
          displayName: user2Profile.displayName,
          photoURL: user2Profile.photoURL,
        } : undefined,
      };
      return feedItem;
    });

    const resolvedItems = await Promise.all(feedItemsPromises);
    // Explicitly type `item` in the filter function
    const feedItems = resolvedItems.filter((item: PairingFeedItem | null): item is PairingFeedItem => item !== null);
    return feedItems;
  } catch (error) {
    console.error('Error getting recent pairings feed:', error);
    return [];
  }
};


/**
 * DEPRECATED / NEEDS REVIEW: Original completePairing for dual camera system.
 * The new flow uses storageService.uploadImage then pairingService.updatePairingWithPhoto.
 */
export const completePairing = async (
  pairingId: string,
  userId: string,
  frontImage: string,
  backImage: string,
  isPrivate: boolean
): Promise<void> => {
  console.warn("DEPRECATED: completePairing is called. Review for new single camera flow.");
  try {
    // Check if user is part of this pairing
    const pairingDoc = await getDoc(doc(db, 'pairings', pairingId));
    if (!pairingDoc.exists()) throw new Error('Pairing not found');
    
    const pairingData = pairingDoc.data();
    if (!pairingData?.users.includes(userId)) {
      throw new Error('User not part of this pairing or pairing data missing');
    }
    
    // Check which user this is (user1 or user2)
    const isUser1 = pairingData.user1_id === userId;
    const isUser2 = pairingData.user2_id === userId;
    
    if (!isUser1 && !isUser2) {
      throw new Error('User not properly assigned in pairing');
    }
    
    // Upload images to storage
    let frontImageURL = '';
    let backImageURL = '';
    
    // Handle front image
    if (frontImage) {
      const frontImageRef = ref(storage, `pairings/${pairingId}/${userId}_photo.jpg`);
      const frontImageBlob = await (await fetch(frontImage)).blob();
      await uploadBytes(frontImageRef, frontImageBlob);
      frontImageURL = await getDownloadURL(frontImageRef);
    }
    
    // Handle back image
    if (backImage) {
      const backImageRef = ref(storage, `pairings/${pairingId}/${userId}_photo.jpg`);
      const backImageBlob = await (await fetch(backImage)).blob();
      await uploadBytes(backImageRef, backImageBlob);
      backImageURL = await getDownloadURL(backImageRef);
    }
    
    // Update the pairing document
    const updateData: any = {
      isPrivate
    };
    
    if (isUser1) {
      updateData.user1_photoURL = frontImageURL;
      updateData.user1_submittedAt = Timestamp.now();
    } else {
      updateData.user2_photoURL = frontImageURL;
      updateData.user2_submittedAt = Timestamp.now();
    }
    
    await updateDoc(doc(db, 'pairings', pairingId), updateData);
    
    // Check if both users have submitted photos, and if so, mark as completed
    const updatedPairingDoc = await getDoc(doc(db, 'pairings', pairingId));
    const updatedPairing = updatedPairingDoc.data();
    
    if (updatedPairing && updatedPairing.user1_photoURL && updatedPairing.user2_photoURL) {
      await updateDoc(doc(db, 'pairings', pairingId), {
        status: 'completed',
        completedAt: Timestamp.now(),
        // In a real implementation, you might generate a combined selfie here
        selfieURL: frontImageURL // For simplicity, use the front image
      });
      
      // If not private, add to global feed
      if (!isPrivate) {
        await addDoc(collection(db, 'globalFeed'), {
          pairingId,
          date: updatedPairing.date,
          users: updatedPairing.users,
          selfieURL: frontImageURL,
          likes: 0,
          commentCount: 0
        });
      }
    }
  } catch (error) {
    console.error('Error in deprecated completePairing:', error);
    throw error;
  }
};

/**
 * Updates a pairing document with the photo URL and privacy status after image upload.
 * This is part of the new single camera flow.
 */
export const updatePairingWithPhoto = async (
  pairingId: string,
  userId: string,
  photoUrl: string,
  isPrivate: boolean
): Promise<void> => {
  if (!pairingId) {
    throw new Error('Pairing ID is required.');
  }
  if (!userId) {
    throw new Error('User ID is required to update pairing with photo.');
  }
  const pairingRef = doc(db, 'pairings', pairingId);

  try {
    const pairingDoc = await getDoc(pairingRef);
    if (!pairingDoc.exists()) {
      throw new Error(`Pairing with ID ${pairingId} not found.`);
    }

    const pairingData = pairingDoc.data() as Pairing; // Cast to Pairing type

    const updateData: Partial<Pairing> = {
      isPrivate: isPrivate, // Update privacy setting regardless
      lastUpdatedAt: Timestamp.now(),
    };

    let newStatus: Pairing['status'] = pairingData.status;

    if (pairingData.user1_id === userId) {
      updateData.user1_photoURL = photoUrl;
      updateData.user1_submittedAt = Timestamp.now();
      newStatus = 'user1_submitted';
    } else if (pairingData.user2_id === userId) {
      updateData.user2_photoURL = photoUrl;
      updateData.user2_submittedAt = Timestamp.now();
      newStatus = 'user2_submitted';
    } else {
      throw new Error(`User ${userId} is not part of pairing ${pairingId}.`);
    }

    // Check if both users have now submitted
    const otherUserSubmitted = 
      (pairingData.user1_id === userId && !!pairingData.user2_photoURL) || 
      (pairingData.user2_id === userId && !!pairingData.user1_photoURL);
      
    // If this submission completes the pairing
    if ((newStatus === 'user1_submitted' && pairingData.user2_photoURL) || 
        (newStatus === 'user2_submitted' && pairingData.user1_photoURL)) {
      updateData.status = 'completed';
      updateData.completedAt = Timestamp.now(); // Uncommented: Assuming Pairing type has completedAt
    } else {
      updateData.status = newStatus;
    }
    
    // If the type Pairing has completedAt, uncomment the line above and ensure it's in the type.
    // For now, if not in type, the status 'completed' marks completion.
    // Also, if `completedAt` is critical, ensure it is part of the `Pairing` type in `src/types/index.ts`

    await updateDoc(pairingRef, updateData);
    console.log(`Pairing ${pairingId} updated by user ${userId}. Status: ${updateData.status}`);

  } catch (error) {
    console.error(`Error updating pairing ${pairingId} for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Toggle like on a pairing
 */
export const toggleLikePairing = async (pairingId: string, userId: string): Promise<void> => {
  try {
    const pairingRef = doc(db, 'pairings', pairingId);
    const pairingDoc = await getDoc(pairingRef);
    
    if (!pairingDoc.exists()) throw new Error('Pairing not found');
    
    const pairingData = pairingDoc.data();
    if (!pairingData) throw new Error('Pairing data not found');
    const likedBy = pairingData.likedBy || [];
    
    let newLikesCount = pairingData.likesCount || 0;
    
    if (likedBy.includes(userId)) {
      // Remove like
      const updatedLikedBy = likedBy.filter((id: string) => id !== userId);
      newLikesCount = Math.max(0, newLikesCount - 1);
      await updateDoc(pairingRef, {
        likedBy: updatedLikedBy,
        likesCount: newLikesCount
      });
    } else {
      // Add like
      const updatedLikedBy = [...likedBy, userId];
      newLikesCount += 1;
      await updateDoc(pairingRef, {
        likedBy: updatedLikedBy,
        likesCount: newLikesCount
      });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};

/**
 * Add comment to a pairing
 */
export const addCommentToPairing = async (
  pairingId: string,
  userId: string,
  username: string,
  userPhotoURL: string,
  text: string
): Promise<Comment> => {
  try {
    const commentData: Omit<Comment, 'id' | 'createdAt'> & { createdAt: Timestamp } = {
      userId,
      text,
      username,
      userPhotoURL,
      createdAt: Timestamp.now(),
    };
    
    // Add to the comments subcollection, Firestore will generate ID
    const commentRef = await addDoc(collection(db, `pairings/${pairingId}/comments`), commentData);
    
    const pairingRef = doc(db, 'pairings', pairingId);
    await updateDoc(pairingRef, {
      commentsCount: increment(1)
    });
    
    return {
      id: commentRef.id, // Get the auto-generated ID
      ...commentData
    } as Comment;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

/**
 * Update pairing privacy
 */
export const updatePairingPrivacy = async (
  pairingId: string,
  isPrivate: boolean,
  userId: string
): Promise<void> => {
  try {
    // Get the pairing
    const pairingRef = doc(db, 'pairings', pairingId);
    const pairingDoc = await getDoc(pairingRef);
    
    if (!pairingDoc.exists()) throw new Error('Pairing not found');
    
    const pairingData = pairingDoc.data();
    if (!pairingData.users.includes(userId)) {
      throw new Error('User not authorized to update this pairing');
    }
    
    // Update privacy setting
    await updateDoc(pairingRef, {
      isPrivate
    });
  } catch (error) {
    console.error('Error updating pairing privacy:', error);
    throw error;
  }
};

/**
 * Get user stats based on pairings
 */
export const getUserStats = async (userId: string): Promise<any> => {
  try {
    // Get all of the user's pairings
    const pairingsQuery = query(
      collection(db, 'pairings'),
      where('users', 'array-contains', userId)
    );
    
    const snapshot = await getDocs(pairingsQuery);
    const pairings = snapshot.docs.map(doc => doc.data());
    
    // Calculate stats
    const totalPairings = pairings.length;
    const completedPairings = pairings.filter(p => p.status === 'completed').length;
    const flakedPairings = pairings.filter(p => p.status === 'flaked').length;
    const completionRate = totalPairings > 0 ? completedPairings / totalPairings : 0;
    
    // Get unique connections
    const uniqueConnections = new Set();
    pairings.forEach(pairing => {
      pairing.users.forEach((uid: string) => {
        if (uid !== userId) uniqueConnections.add(uid);
      });
    });
    
    return {
      totalPairings,
      completedPairings,
      flakedPairings,
      completionRate,
      uniqueConnections: uniqueConnections.size
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      totalPairings: 0,
      completedPairings: 0,
      flakedPairings: 0,
      completionRate: 0,
      uniqueConnections: 0
    };
  }
};

/**
 * Apply snooze token to skip a pairing
 */
export const applySnoozeToken = async (userId: string, pairingId: string): Promise<boolean> => {
  console.log('Applying snooze token for user:', userId, 'to pairing:', pairingId);
  return true;
};