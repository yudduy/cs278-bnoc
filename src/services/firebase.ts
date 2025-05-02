/**
 * Firebase Service
 * 
 * Enhanced mock implementation of Firebase service for demonstration purposes.
 * In a real app, this would interact with actual Firebase services.
 */

import { User, Pairing, Comment, NotificationSettings, UserPrivacySettings, UserFeedItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Mock data
const mockUsers: Record<string, User> = {
  'user1': {
    id: 'user1',
    email: 'justin@stanford.edu',
    username: 'justin',
    displayName: 'Justin',
    createdAt: new Date() as any,
    lastActive: new Date() as any,
    isActive: true,
    flakeStreak: 0,
    maxFlakeStreak: 2,
    photoURL: require('../../assets/images/justin.jpg'),
    blockedIds: [],
    notificationSettings: {
      pairingNotification: true,
      reminderNotification: true,
      completionNotification: true,
      quietHoursStart: 22,
      quietHoursEnd: 8
    },
    snoozeTokensRemaining: 1,
    snoozeTokenLastRefilled: new Date() as any,
  },
  'user2': {
    id: 'user2',
    email: 'duy@stanford.edu',
    username: 'duy',
    displayName: 'Duy',
    createdAt: new Date() as any,
    lastActive: new Date() as any,
    isActive: true,
    flakeStreak: 0,
    maxFlakeStreak: 5,
    photoURL: require('../../assets/images/duy.jpg'),
    blockedIds: [],
    notificationSettings: {
      pairingNotification: true,
      reminderNotification: true,
      completionNotification: true,
      quietHoursStart: 22,
      quietHoursEnd: 8
    },
    snoozeTokensRemaining: 1,
    snoozeTokenLastRefilled: new Date() as any,
  },
  'user3': {
    id: 'user3',
    email: 'kelvin@stanford.edu',
    username: 'kelvin',
    displayName: 'Kelvin',
    createdAt: new Date() as any,
    lastActive: new Date() as any,
    isActive: true,
    flakeStreak: 0,
    maxFlakeStreak: 3,
    photoURL: require('../../assets/images/kelvin.jpg'),
    blockedIds: [],
    notificationSettings: {
      pairingNotification: true,
      reminderNotification: true,
      completionNotification: true,
      quietHoursStart: 22,
      quietHoursEnd: 8
    },
    snoozeTokensRemaining: 1,
    snoozeTokenLastRefilled: new Date() as any,
  },
  'user4': {
    id: 'user4',
    email: 'vivian@stanford.edu',
    username: 'vivian',
    displayName: 'Vivian',
    createdAt: new Date() as any,
    lastActive: new Date() as any,
    isActive: true,
    flakeStreak: 0,
    maxFlakeStreak: 1,
    photoURL: require('../../assets/images/vivian.jpg'),
    blockedIds: [],
    notificationSettings: {
      pairingNotification: true,
      reminderNotification: true,
      completionNotification: true,
      quietHoursStart: 22,
      quietHoursEnd: 8
    },
    snoozeTokensRemaining: 1,
    snoozeTokenLastRefilled: new Date() as any,
  },
  'currentuser': {
    id: 'currentuser',
    email: 'me@stanford.edu',
    username: 'mbernstein',
    displayName: 'Michael Bernstein',
    createdAt: new Date() as any,
    lastActive: new Date() as any,
    isActive: true,
    flakeStreak: 1,
    maxFlakeStreak: 3,
    photoURL: require('../../assets/images/michael.jpg'),
    blockedIds: [],
    notificationSettings: {
      pairingNotification: true,
      reminderNotification: true,
      completionNotification: true,
      quietHoursStart: 22,
      quietHoursEnd: 8
    },
    snoozeTokensRemaining: 1,
    snoozeTokenLastRefilled: new Date() as any,
  }
};

// Mock pairings
const now = new Date();
const yesterday = new Date(now);
yesterday.setDate(yesterday.getDate() - 1);
const twoDaysAgo = new Date(now);
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

const mockPairings: Record<string, Pairing> = {
  'pairing1': {
    id: 'pairing1',
    date: now as any,
    expiresAt: new Date(now.setHours(22, 0, 0, 0)) as any,
    users: ['currentuser', 'user2'],
    status: 'pending',
    selfieURL: '',
    isPrivate: false,
    likes: 0,
    likedBy: [],
    comments: [],
    virtualMeetingLink: 'https://meet.jitsi.si/DailyMeetupSelfie-pairing1'
  },
  'pairing2': {
    id: 'pairing2',
    date: yesterday as any,
    expiresAt: new Date(yesterday.setHours(22, 0, 0, 0)) as any,
    users: ['user3', 'user4'],
    status: 'completed',
    selfieURL: require('../../assets/images/pairing2.jpg'),
    frontImage: require('../../assets/images/pairing2_front.jpg'),
    backImage: require('../../assets/images/pairing2_back.jpg'),
    completedAt: yesterday as any,
    isPrivate: false,
    likes: 3,
    likedBy: ['user1', 'currentuser'],
    comments: [
      {
        id: 'comment2',
        userId: 'user1',
        text: 'Awesome shot! Where was this taken?',
        createdAt: yesterday as any,
        username: 'justin',
        userPhotoURL: require('../../assets/images/justin.jpg')
      },
      {
        id: 'comment3',
        userId: 'currentuser',
        text: 'Looks like fun! 😊',
        createdAt: yesterday as any,
        username: 'mbernstein',
        userPhotoURL: require('../../assets/images/michael.jpg')
      }
    ],
    virtualMeetingLink: 'https://meet.jitsi.si/DailyMeetupSelfie-pairing2'
  },
  'pairing3': {
    id: 'pairing3',
    date: twoDaysAgo as any,
    expiresAt: new Date(twoDaysAgo.setHours(22, 0, 0, 0)) as any,
    users: ['currentuser', 'user3'],
    status: 'completed',
    selfieURL: require('../../assets/images/pairing3.jpg'),
    frontImage: require('../../assets/images/pairing3_front.jpg'),
    backImage: require('../../assets/images/pairing3_back.jpg'),
    completedAt: twoDaysAgo as any,
    isPrivate: false,
    likes: 4,
    likedBy: ['user1', 'user2', 'user4'],
    comments: [],
    virtualMeetingLink: 'https://meet.jitsi.si/DailyMeetupSelfie-pairing3'
  },
  'pairing4': {
    id: 'pairing4',
    date: twoDaysAgo as any,
    expiresAt: new Date(twoDaysAgo.setHours(22, 0, 0, 0)) as any,
    users: ['user1', 'user4'],
    status: 'flaked',
    selfieURL: '', // No image for flaked pairings
    isPrivate: false,
    likes: 0,
    likedBy: [],
    comments: [],
    virtualMeetingLink: 'https://meet.jitsi.si/DailyMeetupSelfie-pairing4'
  }
};

// Mock privacy settings
const mockPrivacySettings: Record<string, UserPrivacySettings> = {
  'currentuser': {
    globalFeedOptIn: true,
    blockedIds: []
  },
  'user1': {
    globalFeedOptIn: true,
    blockedIds: []
  },
  'user2': {
    globalFeedOptIn: true,
    blockedIds: []
  },
  'user3': {
    globalFeedOptIn: true,
    blockedIds: []
  },
  'user4': {
    globalFeedOptIn: true,
    blockedIds: []
  }
};

// Mock feed items
const mockFeedItems: Record<string, UserFeedItem[]> = {
  'currentuser': [
    {
      pairingId: 'pairing2',
      date: yesterday as any,
      users: ['user3', 'user4'],
      selfieURL: require('../../assets/images/pairing2.jpg'),
      isPrivate: false,
      status: 'completed',
      likes: 3,
      commentCount: 2
    },
    {
      pairingId: 'pairing3',
      date: twoDaysAgo as any,
      users: ['currentuser', 'user3'],
      selfieURL: require('../../assets/images/pairing3.jpg'),
      isPrivate: false,
      status: 'completed',
      likes: 4,
      commentCount: 0
    },
    {
      pairingId: 'pairing4',
      date: twoDaysAgo as any,
      users: ['user1', 'user4'],
      selfieURL: '', // No image for flaked pairings
      isPrivate: false,
      status: 'flaked',
      likes: 0,
      commentCount: 0
    }
  ]
};

// Mock push tokens
const mockPushTokens: Record<string, string> = {
  'currentuser': 'ExponentPushToken[XXXXXXXXXXXXXXXXXXXXXX]',
  'user1': 'ExponentPushToken[XXXXXXXXXXXXXXXXXXXXXX]',
  'user2': 'ExponentPushToken[XXXXXXXXXXXXXXXXXXXXXX]',
  'user3': 'ExponentPushToken[XXXXXXXXXXXXXXXXXXXXXX]',
  'user4': 'ExponentPushToken[XXXXXXXXXXXXXXXXXXXXXX]',
};

/**
 * Enhanced Firebase service with social features
 */
const firebaseService = {
  /**
   * Get current user
   */
  getCurrentUser: async (): Promise<User | null> => {
    // In a real app, would use Firebase Auth
    // For demo, return mock user
    return mockUsers['currentuser'];
  },
  
  /**
   * Get user by ID
   */
  getUserById: async (userId: string): Promise<User | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return mock user if exists
    return mockUsers[userId] || null;
  },
  
  /**
   * Get current pairing for a user
   */
  getCurrentPairing: async (userId: string): Promise<Pairing | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock pairing if exists
    return mockPairings['pairing1'];
  },
  
  /**
   * Get pairing history for a user
   */
  getPairingHistory: async (userId: string, limit: number = 10): Promise<Pairing[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock pairings
    return Object.values(mockPairings).filter(pairing => 
      pairing.users.includes(userId) && pairing.status === 'completed'
    ).slice(0, limit);
  },
  
  /**
   * Get pairing by ID
   */
  getPairingById: async (pairingId: string): Promise<Pairing | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return mock pairing if exists
    return mockPairings[pairingId] || null;
  },
  
  /**
   * Get user stats
   */
  getUserStats: async (userId: string): Promise<any> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Return mock stats
    return {
      totalPairings: 27,
      completedPairings: 23,
      flakedPairings: 4,
      completionRate: 0.85,
      currentStreak: mockUsers[userId]?.flakeStreak || 0,
      longestStreak: mockUsers[userId]?.maxFlakeStreak || 0,
      uniqueConnections: 14
    };
  },
  
  /**
   * Get user pairing history
   */
  getUserPairingHistory: async (userId: string, limit: number = 10): Promise<Pairing[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Filter pairings where user is a participant
    return Object.values(mockPairings)
      .filter(pairing => pairing.users.includes(userId))
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date.seconds * 1000);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date.seconds * 1000);
        return dateB.getTime() - dateA.getTime(); // Descending (newest first)
      })
      .slice(0, limit);
  },
  
  /**
   * Get feed
   */
  getFeed: async (userId: string, limit: number = 10, startAfter?: any): Promise<{
    pairings: Pairing[];
    lastVisible: any;
    hasMore: boolean;
  }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Get feed items
    const feedItems = mockFeedItems[userId] || [];
    
    // Get full pairing data for each feed item
    const pairings = await Promise.all(
      feedItems.map(async (item) => {
        const pairing = mockPairings[item.pairingId];
        return pairing || null;
      })
    );
    
    // Filter out null values
    const validPairings = pairings.filter(Boolean) as Pairing[];
    
    return {
      pairings: validPairings.slice(0, limit),
      lastVisible: null,
      hasMore: false
    };
  },
  
  /**
   * Get global feed
   */
  getGlobalFeed: async (limit: number = 10, startAfter?: any): Promise<{
    pairings: Pairing[];
    lastVisible: any;
    hasMore: boolean;
  }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Filter public pairings
    const publicPairings = Object.values(mockPairings)
      .filter(pairing => !pairing.isPrivate && pairing.status === 'completed')
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date.seconds * 1000);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date.seconds * 1000);
        return dateB.getTime() - dateA.getTime(); // Descending (newest first)
      });
    
    return {
      pairings: publicPairings.slice(0, limit),
      lastVisible: null,
      hasMore: publicPairings.length > limit
    };
  },
  
  /**
   * Complete pairing
   */
  completePairing: async (
    pairingId: string,
    userId: string,
    frontImage: string,
    backImage: string,
    isPrivate: boolean
  ): Promise<void> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // In a real app, would upload images to storage and update Firestore
    // For demo, just update mock pairing
    const pairing = mockPairings[pairingId];
    if (pairing) {
      pairing.status = 'completed';
      pairing.frontImage = frontImage;
      pairing.backImage = backImage;
      pairing.selfieURL = frontImage; // In real app, would be stitched image
      pairing.isPrivate = isPrivate;
      pairing.completedAt = new Date() as any;
    }
  },
  
  /**
   * Toggle like on a pairing
   */
  toggleLikePairing: async (pairingId: string, userId: string): Promise<void> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // In a real app, would update Firestore
    // For demo, just update mock pairing
    const pairing = mockPairings[pairingId];
    if (pairing) {
      const userLikeIndex = pairing.likedBy.indexOf(userId);
      if (userLikeIndex === -1) {
        // Add like
        pairing.likedBy.push(userId);
        pairing.likes += 1;
      } else {
        // Remove like
        pairing.likedBy.splice(userLikeIndex, 1);
        pairing.likes = Math.max(0, pairing.likes - 1);
      }
    }
  },
  
  /**
   * Add comment to a pairing
   */
  addCommentToPairing: async (
    pairingId: string,
    userId: string,
    text: string
  ): Promise<Comment> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create comment
    const user = mockUsers[userId];
    const comment: Comment = {
      id: uuidv4(),
      userId,
      text,
      createdAt: new Date() as any,
      username: user?.username || 'User',
      userPhotoURL: user?.photoURL || require('../../assets/images/michael.jpg')
    };
    
    // In a real app, would update Firestore
    // For demo, just update mock pairing
    const pairing = mockPairings[pairingId];
    if (pairing) {
      if (!pairing.comments) {
        pairing.comments = [];
      }
      pairing.comments.push(comment);
    }
    
    return comment;
  },
  
  /**
   * Update feed item comment count
   */
  updateFeedItemCommentCount: async (pairingId: string, excludeUserId?: string): Promise<void> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // In a real app, would update Firestore
    // For demo, log the action
    console.log(`Updating comment count for pairing ${pairingId}`);
  },
  
  /**
   * Apply snooze token
   */
  applySnoozeToken: async (userId: string, pairingId: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 700));
    
    // Check if user has tokens
    const user = mockUsers[userId];
    if (!user || user.snoozeTokensRemaining <= 0) {
      return false;
    }
    
    // Update user tokens
    user.snoozeTokensRemaining -= 1;
    
    // Update pairing status
    const pairing = mockPairings[pairingId];
    if (pairing) {
      pairing.status = 'snoozed';
    }
    
    return true;
  },
  
  /**
   * Send pairing reminder
   */
  sendPairingReminder: async (
    pairingId: string,
    senderId: string,
    recipientId: string
  ): Promise<void> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 700));
    
    // In a real app, would send push notification
    console.log(`Reminder sent from ${senderId} to ${recipientId} for pairing ${pairingId}`);
  },
  
  /**
   * Get user notification settings
   */
  getUserNotificationSettings: async (userId: string): Promise<NotificationSettings | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return mock settings
    return mockUsers[userId]?.notificationSettings || null;
  },
  
  /**
   * Get user privacy settings
   */
  getUserPrivacySettings: async (userId: string): Promise<UserPrivacySettings | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return mock settings
    return mockPrivacySettings[userId] || null;
  },
  
  /**
   * Get user push token
   */
  getUserPushToken: async (userId: string): Promise<string | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Return mock token
    return mockPushTokens[userId] || null;
  },
  
  /**
   * Update user push token
   */
  updateUserPushToken: async (userId: string, token: string): Promise<void> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // In a real app, would update Firestore
    mockPushTokens[userId] = token;
    console.log(`Updated push token for ${userId}: ${token}`);
  },
  
  /**
   * Update user notification settings
   */
  updateUserNotificationSettings: async (
    userId: string,
    settings: Partial<NotificationSettings>
  ): Promise<void> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In a real app, would update Firestore
    // For demo, just update mock user
    const user = mockUsers[userId];
    if (user && user.notificationSettings) {
      user.notificationSettings = {
        ...user.notificationSettings,
        ...settings
      };
    }
  },
  
  /**
   * Update user privacy settings
   */
  updateUserPrivacySettings: async (
    userId: string,
    settings: Partial<UserPrivacySettings>
  ): Promise<void> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // In a real app, would update Firestore
    // For demo, update mock settings
    const currentSettings = mockPrivacySettings[userId] || {
      globalFeedOptIn: true,
      blockedIds: []
    };
    
    mockPrivacySettings[userId] = {
      ...currentSettings,
      ...settings
    };
    
    console.log(`Updated privacy settings for ${userId}:`, mockPrivacySettings[userId]);
  },
  
  /**
   * Block user
   */
  blockUser: async (userId: string, blockedUserId: string): Promise<void> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update privacy settings
    const settings = mockPrivacySettings[userId] || {
      globalFeedOptIn: true,
      blockedIds: []
    };
    
    if (!settings.blockedIds.includes(blockedUserId)) {
      settings.blockedIds.push(blockedUserId);
    }
    
    mockPrivacySettings[userId] = settings;
    
    // Update user's blockedIds
    const user = mockUsers[userId];
    if (user) {
      if (!user.blockedIds) {
        user.blockedIds = [];
      }
      
      if (!user.blockedIds.includes(blockedUserId)) {
        user.blockedIds.push(blockedUserId);
      }
    }
  },
  
  /**
   * Unblock user
   */
  unblockUser: async (userId: string, blockedUserId: string): Promise<void> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update privacy settings
    const settings = mockPrivacySettings[userId];
    if (settings && settings.blockedIds) {
      settings.blockedIds = settings.blockedIds.filter(id => id !== blockedUserId);
    }
    
    // Update user's blockedIds
    const user = mockUsers[userId];
    if (user && user.blockedIds) {
      user.blockedIds = user.blockedIds.filter(id => id !== blockedUserId);
    }
  },
  
  /**
   * Get blocked users
   */
  getBlockedUsers: async (userId: string): Promise<User[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Get blocked IDs
    const settings = mockPrivacySettings[userId];
    const blockedIds = settings?.blockedIds || [];
    
    // Get user data for each blocked ID
    const blockedUsers: User[] = [];
    
    for (const id of blockedIds) {
      const user = mockUsers[id];
      if (user) {
        blockedUsers.push(user);
      }
    }
    
    return blockedUsers;
  },
  
  /**
   * Update pairing privacy
   */
  updatePairingPrivacy: async (
    pairingId: string,
    isPrivate: boolean,
    userId: string
  ): Promise<void> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Update pairing
    const pairing = mockPairings[pairingId];
    if (pairing) {
      // Check if user is a participant
      if (!pairing.users.includes(userId)) {
        throw new Error('Unauthorized');
      }
      
      pairing.isPrivate = isPrivate;
    }
  },
  
  /**
   * Sign in user
   */
  signIn: async (email: string, password: string): Promise<User> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In a real app, would use Firebase Auth
    // For demo, return mock user
    if (email === 'demo@example.com' && password === 'password') {
      return mockUsers['currentuser'];
    }
    
    throw new Error('Invalid email or password');
  },
  
  /**
   * Sign out user
   */
  signOut: async (): Promise<void> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // In a real app, would use Firebase Auth
    console.log('User signed out');
  },
};

export default firebaseService;