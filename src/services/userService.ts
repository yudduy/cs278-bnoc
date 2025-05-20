// src/services/userService.ts

import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, arrayUnion, arrayRemove, Timestamp, writeBatch, increment } from 'firebase/firestore';
import { User, NotificationSettings } from '../types';
import { db } from '../config/firebase';

/**
 * Create a new user document in Firestore after successful Firebase Auth registration
 */
export const createUserDocument = async (uid: string, email: string, username: string, photoURL?: string): Promise<void> => {
  const userRef = doc(db, 'users', uid);

  const defaultNotificationSettings: NotificationSettings = {
    pairingNotification: true,
    chatNotification: true,
    partnerPhotoSubmittedNotification: true,
    reminderNotification: true,
    socialNotifications: true,
    quietHoursStart: 22, // Default: 10 PM
    quietHoursEnd: 8     // Default: 8 AM
  };

  const userData: User = {
    id: uid,
    email,
    username,
    photoURL: photoURL || '',
    createdAt: Timestamp.now(),
    lastActive: Timestamp.now(),
    isActive: true,
    flakeStreak: 0,
    maxFlakeStreak: 0,
    connections: [],
    notificationSettings: defaultNotificationSettings,
    blockedIds: [], // Initialize as empty array
    fcmToken: '', // Initialize as empty string
  };

  await setDoc(userRef, userData);
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, updates);
};

/**
 * Check username availability
 */
export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  const usersCollection = collection(db, 'users');
  const q = query(usersCollection, where('username', '==', username));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty;
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  const userRef = doc(db, 'users', userId);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    return { ...docSnap.data(), id: docSnap.id } as User;
  } else {
    return null;
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async (userId: string): Promise<User | null> => {
  return getUserById(userId);
};

/**
 * Update a connection between two users (add or remove)
 */
export const updateConnection = async (
  userId: string,
  targetUserId: string,
  action: 'add' | 'remove'
): Promise<void> => {
  try {
    if (!userId || !targetUserId) {
      throw new Error('Both user IDs are required');
    }
    
    if (userId === targetUserId) {
      throw new Error('Cannot connect a user to themselves');
    }
    
    // References to both user documents
    const userRef = doc(db, 'users', userId);
    const targetUserRef = doc(db, 'users', targetUserId);
    
    // Verify both users exist
    const [userDoc, targetUserDoc] = await Promise.all([
      getDoc(userRef),
      getDoc(targetUserRef)
    ]);
    
    if (!userDoc.exists()) {
      throw new Error(`User ${userId} does not exist`);
    }
    
    if (!targetUserDoc.exists()) {
      throw new Error(`Target user ${targetUserId} does not exist`);
    }
    
    // Batch write to update both documents atomically
    const batch = writeBatch(db);
    
    if (action === 'add') {
      // Add connection to both users
      batch.update(userRef, {
        connections: arrayUnion(targetUserId),
        connectionCount: increment(1)
      });
      
      batch.update(targetUserRef, {
        connections: arrayUnion(userId),
        connectionCount: increment(1)
      });
      
      console.log(`Adding connection between ${userId} and ${targetUserId}`);
    } else {
      // Remove connection from both users
      // We need to manually handle array removal since arrayRemove might cause issues
      // if the array doesn't contain the element
      
      const userData = userDoc.data();
      const targetUserData = targetUserDoc.data();
      
      // Update user's connections
      if (userData && Array.isArray(userData.connections)) {
        const updatedConnections = userData.connections.filter(
          (id: string) => id !== targetUserId
        );
        
        batch.update(userRef, {
          connections: updatedConnections,
          connectionCount: increment(-1)
        });
      }
      
      // Update target user's connections
      if (targetUserData && Array.isArray(targetUserData.connections)) {
        const updatedTargetConnections = targetUserData.connections.filter(
          (id: string) => id !== userId
        );
        
        batch.update(targetUserRef, {
          connections: updatedTargetConnections,
          connectionCount: increment(-1)
        });
      }
      
      console.log(`Removing connection between ${userId} and ${targetUserId}`);
    }
    
    // Commit the batch
    await batch.commit();
    console.log(`Successfully ${action === 'add' ? 'added' : 'removed'} connection between users`);
  } catch (error) {
    console.error(`Error ${action === 'add' ? 'adding' : 'removing'} connection:`, error);
    throw error;
  }
};

/**
 * Update user notification settings
 */
export const updateUserNotificationSettings = async (
  userId: string,
  settings: Partial<NotificationSettings>
): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  const docSnap = await getDoc(userRef);
  
  if (docSnap.exists()) {
    const userData = docSnap.data();
    const currentSettings = userData.notificationSettings || {};
    
    await updateDoc(userRef, {
      notificationSettings: {
        ...currentSettings,
        ...settings
      }
    });
  }
};

/**
 * Get user notification settings
 */
export const getUserNotificationSettings = async (userId: string): Promise<NotificationSettings | null> => {
  const userRef = doc(db, 'users', userId);
  const docSnap = await getDoc(userRef);
  
  if (docSnap.exists()) {
    const userData = docSnap.data();
    return userData.notificationSettings || null;
  }
  
  return null;
};

/**
 * Block/unblock user
 */
export const updateBlockedUser = async (currentUserId: string, targetUserId: string, action: 'block' | 'unblock'): Promise<void> => {
  const currentUserRef = doc(db, 'users', currentUserId);

  if (action === 'block') {
    await updateDoc(currentUserRef, {
      blockedIds: arrayUnion(targetUserId)
    });
  } else if (action === 'unblock') {
    await updateDoc(currentUserRef, {
      blockedIds: arrayRemove(targetUserId)
    });
  }
};

/**
 * Get blocked users
 */
export const getBlockedUsers = async (userId: string): Promise<string[]> => {
  const userRef = doc(db, 'users', userId);
  const docSnap = await getDoc(userRef);
  
  if (docSnap.exists()) {
    const userData = docSnap.data();
    return userData.blockedIds || [];
  }
  
  return [];
};

/**
 * Update user FCM token for push notifications
 */
export const updateUserFcmToken = async (userId: string, token: string): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    fcmToken: token
  });
};

/**
 * Get all users
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as User));
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
};