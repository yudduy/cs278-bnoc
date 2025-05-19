// src/services/firebase.ts

/**
 * Helper function for Firestore operations with retry logic
 * Helps handle WebChannelConnection RPC errors
 */
const executeWithRetry = async (operation: Function, maxRetries = 3): Promise<any> => {
  let attempt = 0;
  let lastError;
  
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      attempt++;
      
      // Log the retry attempt
      console.log(`Retry attempt ${attempt}/${maxRetries} for Firestore operation`);
      
      // Wait a bit longer between each retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  // If we've exhausted all retries, throw the last error
  throw lastError;
};

/**
 * Firebase Service - Facade
 * 
 * This module serves as a facade for all Firebase related services.
 * It maintains the same interface as the previous implementation for backward compatibility,
 * while using the real Firebase implementation from specialized services.
 */

// Import all specialized services
import * as UserService from './userService';
import * as PairingService from './pairingService';
import * as FeedService from './feedService';

// Import types
import { User, Pairing, Comment, NotificationSettings, PrivacySettings as UserPrivacySettings, UserFeedItem } from '../types';

// Firebase imports
import { Timestamp, addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';

/**
 * Firebase service facade
 */
const firebaseService = {
  /**
   * User-related methods
   */
  getCurrentUser: async (): Promise<User | null> => {
    // For this implementation, we'll need to get the current user ID from auth
    // and then use that to fetch the user document
    try {
      const authUserId = "currentuser"; // This should be replaced with actual auth.currentUser.uid
      return await UserService.getUserById(authUserId);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },
  
  getUserById: async (userId: string): Promise<User | null> => {
    return UserService.getUserById(userId);
  },
  
  /**
   * Pairing-related methods
   */
  getCurrentPairing: async (userId: string): Promise<Pairing | null> => {
    return PairingService.getCurrentPairing(userId);
  },
  
  getPairingHistory: async (userId: string): Promise<Pairing[]> => {
    return PairingService.getUserPairingHistory(userId);
  },
  
  getPairingById: async (pairingId: string): Promise<Pairing | null> => {
    return PairingService.getPairingById(pairingId);
  },
  
  getUserStats: async (userId: string): Promise<any> => {
    return PairingService.getUserStats(userId);
  },
  
  getUserPairingHistory: async (userId: string, limit: number = 10): Promise<Pairing[]> => {
    return PairingService.getUserPairingHistory(userId, limit);
  },
  
  /**
   * Feed-related methods
   */
  getFeed: async (userId: string, limit: number = 10, startAfter?: any): Promise<{
    pairings: Pairing[];
    lastVisible: any;
    hasMore: boolean;
  }> => {
    return executeWithRetry(() => FeedService.getFeed(userId, limit, startAfter));
  },
  
  getGlobalFeed: async (limit: number = 10, startAfter?: any): Promise<{
    pairings: Pairing[];
    lastVisible: any;
    hasMore: boolean;
  }> => {
    return executeWithRetry(() => FeedService.getGlobalFeed(limit, startAfter));
  },
  
  /**
   * Pairing interaction methods
   */
  completePairing: async (
    pairingId: string,
    userId: string,
    frontImage: string,
    backImage: string,
    isPrivate: boolean
  ): Promise<void> => {
    return PairingService.completePairing(pairingId, userId, frontImage, backImage, isPrivate);
  },
  
  toggleLikePairing: async (pairingId: string, userId: string): Promise<void> => {
    return PairingService.toggleLikePairing(pairingId, userId);
  },
  
  addCommentToPairing: async (
    pairingId: string,
    userId: string,
    text: string
  ): Promise<Comment> => {
    const user = await UserService.getUserById(userId);
    if (!user) throw new Error('User not found');
    
    return PairingService.addCommentToPairing(
      pairingId, 
      userId, 
      user.username || 'User', 
      user.photoURL || '', 
      text
    );
  },
  
  updateFeedItemCommentCount: async (pairingId: string, excludeUserId?: string): Promise<void> => {
    console.log('updateFeedItemCommentCount not yet implemented');
  },
  
  applySnoozeToken: async (userId: string, pairingId: string): Promise<boolean> => {
    return PairingService.applySnoozeToken(userId, pairingId);
  },
  
  sendPairingReminder: async (
    pairingId: string,
    senderId: string,
    recipientId: string
  ): Promise<void> => {
    try {
      // Get the recipient's push token
      const recipient = await UserService.getUserById(recipientId);
      if (!recipient) throw new Error('Recipient not found');
      
      // Get the sender's name for the notification
      const sender = await UserService.getUserById(senderId);
      const senderName = sender ? (sender.displayName || sender.username) : 'Your partner';
      
      // In a real implementation, this would send a push notification
      // For now, we'll just record it in the database
      await addDoc(collection(db, 'reminders'), {
        pairingId,
        senderId,
        recipientId,
        createdAt: Timestamp.now(),
        message: `${senderName} is waiting for your photo. Complete your pairing before it expires!`
      });
      
      // Update the pairing to indicate a reminder was sent
      const pairingRef = doc(db, 'pairings', pairingId);
      await updateDoc(pairingRef, {
        lastReminderAt: Timestamp.now(),
        lastReminderBy: senderId
      });
      
      console.log(`Reminder sent from ${senderId} to ${recipientId} for pairing ${pairingId}`);
    } catch (error) {
      console.error('Error sending pairing reminder:', error);
      throw error;
    }
  },
  
  /**
   * User settings methods
   */
  getUserNotificationSettings: async (userId: string): Promise<NotificationSettings | null> => {
    return UserService.getUserNotificationSettings(userId);
  },
  
  getUserPrivacySettings: async (userId: string): Promise<UserPrivacySettings | null> => {
    console.log('getUserPrivacySettings not yet implemented');
    return null;
  },
  
  getUserPushToken: async (userId: string): Promise<string | null> => {
    const user = await UserService.getUserById(userId);
    return user?.fcmToken || null;
  },
  
  updateUserPushToken: async (userId: string, token: string): Promise<void> => {
    return UserService.updateUserFcmToken(userId, token);
  },
  
  updateUserNotificationSettings: async (
    userId: string,
    settings: Partial<NotificationSettings>
  ): Promise<void> => {
    return UserService.updateUserNotificationSettings(userId, settings);
  },
  
  updateUserPrivacySettings: async (
    userId: string,
    settings: Partial<UserPrivacySettings>
  ): Promise<void> => {
    console.log('updateUserPrivacySettings not yet implemented');
  },
  
  blockUser: async (userId: string, blockedUserId: string): Promise<void> => {
    return UserService.updateBlockedUser(userId, blockedUserId, 'block');
  },
  
  unblockUser: async (userId: string, blockedUserId: string): Promise<void> => {
    return UserService.updateBlockedUser(userId, blockedUserId, 'unblock');
  },
  
  getBlockedUsers: async (userId: string): Promise<User[]> => {
    const blockedIds = await UserService.getBlockedUsers(userId);
    const blockedUsers: User[] = [];
    for (const id of blockedIds) {
      const user = await UserService.getUserById(id);
      if (user) blockedUsers.push(user);
    }
    return blockedUsers;
  },
  
  updatePairingPrivacy: async (
    pairingId: string,
    isPrivate: boolean,
    userId: string
  ): Promise<void> => {
    return PairingService.updatePairingPrivacy(pairingId, isPrivate, userId);
  },
  
  /**
   * Authentication methods 
   */
  signIn: async (email: string, password: string): Promise<User> => {
    const now = Timestamp.now();
    const mockUser: User = {
      id: 'currentuser',
      email: email,
      username: 'demo',
      displayName: 'Demo User',
      photoURL: 'https://example.com/demo.jpg',
      createdAt: now,
      lastUpdated: now,
      isActive: true,
      flakeStreak: 0,
      maxFlakeStreak: 0,
      connections: [],
      snoozeTokensRemaining: 0,
      privacySettings: { globalFeedOptIn: true },
      notificationSettings: {
        pairingNotification: true,
        chatNotification: true,
        reminderNotification: true,
        socialNotification: true,
        completionNotification: true,
        quietHoursStart: 22,
        quietHoursEnd: 8
      },
      blockedIds: [],
      fcmToken: ''
    };
    return mockUser;
  },
  
  signOut: async (): Promise<void> => {
    console.log('Sign out called');
  },

  /**
   * Updates a pairing document with the photo URL and privacy status.
   * This now calls the method in PairingService.
   */
  updatePairingWithPhoto: async (
    pairingId: string,
    userId: string,
    photoUrl: string,
    isPrivate: boolean
  ): Promise<void> => {
    // Delegate to PairingService
    return PairingService.updatePairingWithPhoto(pairingId, userId, photoUrl, isPrivate);
  },
  
  /**
   * Submit a photo for a pairing - handles the full process from image URI to completion
   */
  submitPairingPhoto: async (
    pairingId: string,
    userId: string,
    photoUri: string,
    isPrivate: boolean = false
  ): Promise<void> => {
    // Step 1: Upload the image to Firebase Storage
    const imageRef = ref(storage, `pairings/${pairingId}/${userId}_photo.jpg`);
    const imageBlob = await (await fetch(photoUri)).blob();
    await uploadBytes(imageRef, imageBlob);
    const photoUrl = await getDownloadURL(imageRef);
    
    // Step 2: Update the pairing with the photo URL
    return PairingService.updatePairingWithPhoto(pairingId, userId, photoUrl, isPrivate);
  },
};

export default firebaseService;