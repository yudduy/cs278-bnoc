// src/services/pairingService.ts

import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, updateDoc, addDoc, arrayUnion, Timestamp, DocumentSnapshot, increment, startAfter, QueryConstraint, deleteDoc, documentId, arrayRemove, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { Pairing, Comment, User, PairingFeedItem, UserProfile } from '../types';
import { db, storage } from '../config/firebase';
import { getUserById } from './userService';
import * as feedService from './feedService';
import * as notificationService from './notificationService';
import logger from '../utils/logger';

/**
 * Get current pairing for a user
 */
export const getCurrentPairing = async (userId: string): Promise<Pairing | null> => {
  try {
    if (!userId) {
      logger.error('getCurrentPairing called without a valid userId');
      return null;
    }

    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    logger.debug(`Getting current pairing for user ${userId} after ${today.toISOString()}`);
    
    // Query pairings for today where the user is included in the users array
    const pairingsQuery = query(
      collection(db, 'pairings'),
      where('users', 'array-contains', userId),
      where('date', '>=', today),
      orderBy('date', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(pairingsQuery);
    
    // If no pairings found, return null
    if (snapshot.empty) {
      logger.info(`No active pairing found for user ${userId}`);
      return null;
    }
    
    // Get the first (and should be only) pairing
    const pairingDoc = snapshot.docs[0];
    const pairingData = pairingDoc.data();
    
    // Validate that the pairing data has the required fields
    if (!pairingData || !pairingData.users || !Array.isArray(pairingData.users)) {
      logger.error(`Invalid pairing data for pairing ${pairingDoc.id}:`, pairingData);
      return null;
    }
    
    // Additional validation to ensure the user is part of this pairing
    if (!pairingData.users.includes(userId)) {
      logger.error(`User ${userId} not found in pairing ${pairingDoc.id} users array:`, pairingData.users);
      return null;
    }
    
    // Ensure user is properly assigned as either user1 or user2
    if (pairingData.user1_id !== userId && pairingData.user2_id !== userId) {
      logger.error(`User ${userId} found in users array but not assigned as user1_id or user2_id in pairing ${pairingDoc.id}`);
      return null;
    }
    
    // Return the pairing with its ID
    return {
      id: pairingDoc.id,
      ...pairingData
    } as Pairing;
  } catch (error) {
    logger.error('Error getting current pairing:', error);
    return null;
  }
};

/**
 * Get a specific pairing by ID
 */
export const getPairingById = async (pairingId: string): Promise<Pairing | null> => {
  try {
    if (!pairingId) {
      logger.error('getPairingById called without pairingId');
      return null;
    }
    
    const pairingRef = doc(db, 'pairings', pairingId);
    const pairingDoc = await getDoc(pairingRef);
    
    if (!pairingDoc.exists()) {
      logger.info(`No pairing found with ID ${pairingId}`);
      return null;
    }
    
    return {
      id: pairingDoc.id,
      ...pairingDoc.data()
    } as Pairing;
  } catch (error) {
    logger.error(`Error getting pairing ${pairingId}:`, error);
    return null;
  }
};

/**
 * Get user's pairing history
 */
export const getUserPairingHistory = async (userId: string, limitCount: number = 10): Promise<Pairing[]> => {
  try {
    if (!userId) {
      logger.error('getUserPairingHistory called without userId');
      return [];
    }
    
    // Query for pairings involving this user, ordered by date
    const pairingsQuery = query(
      collection(db, 'pairings'),
      where('users', 'array-contains', userId),
      where('status', '==', 'completed'),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(pairingsQuery);
    
    // Map snapshot to Pairing objects
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Pairing));
  } catch (error) {
    logger.error('Error getting user pairing history:', error);
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
        logger.warn(`Pairing ${docData.id} has malformed 'users' field:`, usersArray);
        return null; // Skip this pairing
      }
      const validUsersTuple = usersArray as [string, string];

      // Validate required string fields, providing defaults or logging issues
      const user1_id = pairingData.user1_id as string;
      const user2_id = pairingData.user2_id as string;
      const chatId = pairingData.chatId as string;
      if (!user1_id || !user2_id) {
        logger.warn(`Pairing ${docData.id} is missing user1_id or user2_id.`);
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
    logger.error('Error getting recent pairings feed:', error);
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
  logger.warn("DEPRECATED: completePairing is called. Review for new single camera flow.");
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
    logger.error('Error in deprecated completePairing:', error);
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
    const user1Submitted = 
      (pairingData.user1_id === userId) || 
      (!!pairingData.user1_photoURL && pairingData.user1_submittedAt !== null);
      
    const user2Submitted = 
      (pairingData.user2_id === userId) || 
      (!!pairingData.user2_photoURL && pairingData.user2_submittedAt !== null);
      
    // If this submission completes the pairing
    if (user1Submitted && user2Submitted) {
      logger.info(`Both users have submitted photos for pairing ${pairingId}. Marking as completed.`);
      updateData.status = 'completed';
      updateData.completedAt = Timestamp.now();
    } else {
      updateData.status = newStatus;
      logger.info(`User ${userId} submitted photo for pairing ${pairingId}. Status: ${newStatus}`);
    }

    await updateDoc(pairingRef, updateData);
    
    // If pairing is now complete, publish to feeds
    if (updateData.status === 'completed') {
      try {
        // Fetch the updated pairing to ensure we have all data
        const updatedPairingDoc = await getDoc(pairingRef);
        if (updatedPairingDoc.exists()) {
          const updatedPairing = { id: updatedPairingDoc.id, ...updatedPairingDoc.data() } as Pairing;
          
          // Use the new publishPairingToFeed function from feedService
          await feedService.publishPairingToFeed(updatedPairing);
          
          // Create notifications for both users
          const otherUserId = userId === updatedPairing.user1_id ? updatedPairing.user2_id : updatedPairing.user1_id;
          
          // Get user details for notification
          const currentUser = await getUserById(userId);
          const otherUser = await getUserById(otherUserId);
          
          if (currentUser && otherUser) {
            // Create completion notification for the other user
            await notificationService.createNotification(
              otherUserId,
              'completion',
              'Pairing Completed!',
              `Your pairing with ${currentUser.username || 'your partner'} is now complete!`,
              {
                pairingId: pairingId,
                senderId: userId
              },
              userId
            );
            
            // Send a completion notification to the current user as well
            await notificationService.createNotification(
              userId,
              'completion',
              'Pairing Completed!',
              `Your pairing with ${otherUser.username || 'your partner'} is now complete!`,
              {
                pairingId: pairingId,
                senderId: otherUserId
              },
              otherUserId
            );
          }
        }
      } catch (error) {
        logger.error(`Error publishing completed pairing ${pairingId} to feed:`, error);
        // Don't throw here - the pairing was successfully updated, so we just log the error
      }
    } else if (updateData.status === 'user1_submitted' || updateData.status === 'user2_submitted') {
      // If one user has submitted, notify the other user that it's their turn
      const otherUserId = userId === pairingData.user1_id ? pairingData.user2_id : pairingData.user1_id;
      const currentUser = await getUserById(userId);
      
      if (currentUser) {
        try {
          await notificationService.createNotification(
            otherUserId,
            'pairing',
            'Your Turn!',
            `${currentUser.username || 'Your partner'} has submitted their photo! It's your turn now.`,
            {
              pairingId: pairingId,
              senderId: userId,
              urgent: true
            },
            userId
          );
        } catch (notificationError) {
          logger.error('Error sending submission notification:', notificationError);
        }
      }
    }
  } catch (error) {
    logger.error(`Error updating pairing ${pairingId} with photo:`, error);
    throw error;
  }
};

/**
 * Toggle like on a pairing
 */
export const toggleLikePairing = async (pairingId: string, userId: string): Promise<boolean> => {
  if (!pairingId || !userId) {
    logger.error('toggleLikePairing called with invalid parameters', { pairingId, userId });
    throw new Error('Invalid parameters for toggleLikePairing: pairingId and userId are required');
  }

  try {
    const pairingRef = doc(db, 'pairings', pairingId);
    const pairingDoc = await getDoc(pairingRef);
    
    if (!pairingDoc.exists()) {
      logger.warn(`toggleLikePairing: Pairing not found with ID ${pairingId}`);
      throw new Error(`Pairing not found with ID ${pairingId}`);
    }
    
    const pairingData = pairingDoc.data();
    if (!pairingData) {
      logger.warn(`toggleLikePairing: Pairing data is empty for ID ${pairingId}`);
      throw new Error('Pairing data not found');
    }
    
    const likedBy = pairingData.likedBy || [];
    let newLikesCount = pairingData.likesCount || 0;
    let isLiked = false;
    
    // Use a batch operation for atomic updates
    const batch = writeBatch(db);
    
    if (likedBy.includes(userId)) {
      // Remove like
      const updatedLikedBy = likedBy.filter((id: string) => id !== userId);
      newLikesCount = Math.max(0, newLikesCount - 1);
      batch.update(pairingRef, {
        likedBy: updatedLikedBy,
        likesCount: newLikesCount
      });
      isLiked = false;
      logger.debug(`User ${userId} removed like from pairing ${pairingId}`);
    } else {
      // Add like
      const updatedLikedBy = [...likedBy, userId];
      newLikesCount += 1;
      batch.update(pairingRef, {
        likedBy: updatedLikedBy,
        likesCount: newLikesCount
      });
      isLiked = true;
      logger.debug(`User ${userId} liked pairing ${pairingId}`);
    }
    
    // Commit the batch
    await batch.commit();
    
    return isLiked;
  } catch (error) {
    logger.error(`Error toggling like for pairing ${pairingId} by user ${userId}:`, error);
    throw error;
  }
};

/**
 * Add comment to a pairing
 * @param pairingId - ID of the pairing to comment on
 * @param userId - ID of the user making the comment
 * @param username - Username of the commenter
 * @param userPhotoURL - Profile photo URL of the commenter
 * @param text - Text content of the comment
 * @returns Promise resolving to the created Comment object
 * @throws Error if parameters are invalid or comment creation fails
 */
export const addCommentToPairing = async (
  pairingId: string,
  userId: string,
  username: string,
  userPhotoURL: string,
  text: string
): Promise<Comment> => {
  // Validate parameters
  if (!pairingId || !userId) {
    logger.error('addCommentToPairing called with invalid parameters', { pairingId, userId });
    throw new Error('Invalid parameters for addCommentToPairing: pairingId and userId are required');
  }
  
  if (!text || text.trim().length === 0) {
    logger.warn('addCommentToPairing called with empty comment text', { pairingId, userId });
    throw new Error('Comment text cannot be empty');
  }
  
  try {
    // Check if pairing exists first
    const pairingRef = doc(db, 'pairings', pairingId);
    const pairingDoc = await getDoc(pairingRef);
    
    if (!pairingDoc.exists()) {
      logger.warn(`addCommentToPairing: Pairing not found with ID ${pairingId}`);
      throw new Error(`Pairing not found with ID ${pairingId}`);
    }
    
    const pairingData = pairingDoc.data();
    
    // Create comment data with proper typing
    const commentData: Omit<Comment, 'id'> = {
      userId,
      text: text.trim(),
      username: username || 'User', // Provide fallback
      userPhotoURL: userPhotoURL || '', // Provide fallback
      createdAt: Timestamp.now(),
    };
    
    logger.debug(`Adding comment to pairing ${pairingId} by user ${userId}`);
    
    // Use a batch operation for atomic updates
    const batch = writeBatch(db);
    
    // Add to the comments subcollection
    const commentsCollectionRef = collection(db, `pairings/${pairingId}/comments`);
    const newCommentRef = doc(commentsCollectionRef);
    batch.set(newCommentRef, commentData);
    
    // Update the comment count on the pairing document
    batch.update(pairingRef, {
      commentsCount: increment(1)
    });
    
    // Commit the batch
    await batch.commit();
    
    logger.info(`Comment added successfully to pairing ${pairingId}`);
    
    // Return the created comment with its ID
    return {
      id: newCommentRef.id,
      ...commentData
    };
  } catch (error) {
    logger.error(`Error adding comment to pairing ${pairingId} by user ${userId}:`, error);
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
    logger.error('Error updating pairing privacy:', error);
    throw error;
  }
};

/**
 * Get user stats related to pairings
 */
export const getUserStats = async (userId: string): Promise<any> => {
  try {
    if (!userId) {
      logger.error('getUserStats called without userId');
      return {};
    }
    
    // Query for completed pairings involving this user
    const completedPairingsQuery = query(
      collection(db, 'pairings'),
      where('users', 'array-contains', userId),
      where('status', '==', 'completed')
    );
    
    // Query for flaked pairings involving this user
    const flakedPairingsQuery = query(
      collection(db, 'pairings'),
      where('users', 'array-contains', userId),
      where('status', '==', 'flaked')
    );
    
    // Execute both queries
    const [completedSnapshot, flakedSnapshot] = await Promise.all([
      getDocs(completedPairingsQuery),
      getDocs(flakedPairingsQuery)
    ]);
    
    // Return stats object
    return {
      totalPairings: completedSnapshot.size,
      flakedPairings: flakedSnapshot.size
    };
  } catch (error) {
    logger.error('Error getting user stats:', error);
    return {
      totalPairings: 0,
      flakedPairings: 0
    };
  }
};

/**
 * Apply snooze token to skip a pairing
 */
export const applySnoozeToken = async (userId: string, pairingId: string): Promise<boolean> => {
  logger.info('Applying snooze token for user:', userId, 'to pairing:', pairingId);
  return true;
};