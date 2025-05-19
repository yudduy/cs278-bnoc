// src/services/userService.ts

import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, arrayUnion, arrayRemove, Timestamp } from 'firebase/firestore';
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
    // quietHoursStart and quietHoursEnd are optional and can be undefined initially
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
 * Add/remove user from connections list
 */
export const updateConnection = async (currentUserId: string, targetUserId: string, action: 'add' | 'remove'): Promise<void> => {
  const currentUserRef = doc(db, 'users', currentUserId);

  if (action === 'add') {
    await updateDoc(currentUserRef, {
      connections: arrayUnion(targetUserId)
    });
  } else if (action === 'remove') {
    await updateDoc(currentUserRef, {
      connections: arrayRemove(targetUserId)
    });
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