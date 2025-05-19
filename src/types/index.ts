/**
 * Type Definitions
 * 
 * Centralized type definitions for the Daily Meetup Selfie app.
 */

import { Timestamp } from 'firebase/firestore';

/**
 * User interface
 */
export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
  isActive: boolean;
  connections: string[];
  blockedIds: string[];
  flakeStreak: number;
  maxFlakeStreak: number;
  snoozeTokensRemaining: number;
  snoozeTokenLastRefilled?: Timestamp;
  notificationSettings: NotificationSettings;
  privacySettings: PrivacySettings;
  fcmToken?: string;
  waitlistedToday?: boolean;
  priorityNextPairing?: boolean;
  lastUpdated?: Timestamp;
}

/**
 * Notification settings interface
 */
export interface NotificationSettings {
  pairingNotification: boolean;
  reminderNotification: boolean;
  completionNotification: boolean;
  chatNotification?: boolean;
  socialNotification?: boolean;
  quietHoursStart: number; // Hour of day (0-23)
  quietHoursEnd: number; // Hour of day (0-23)
}

/**
 * Privacy settings interface
 */
export interface PrivacySettings {
  globalFeedOptIn: boolean;
}

/**
 * Pairing interface
 */
export interface Pairing {
  id: string;
  date: Timestamp;
  users: string[]; // Array of user IDs involved in the pairing
  user1_id: string;
  user2_id: string;
  status: 'pending' | 'user1_submitted' | 'user2_submitted' | 'completed' | 'flaked';
  user1_photoURL: string | null;
  user2_photoURL: string | null;
  user1_submittedAt: Timestamp | null;
  user2_submittedAt: Timestamp | null;
  completedAt?: Timestamp | null;
  chatId: string;
  likesCount: number;
  likedBy: string[];
  commentsCount: number;
  expiresAt: Timestamp;
  isPrivate: boolean;
  virtualMeetingLink?: string;
  completedPhotoURL?: string | null;
  lastUpdatedAt?: Timestamp;
}

/**
 * Comment interface
 */
export interface Comment {
  id: string;
  text: string;
  userId: string;
  username: string;
  userPhotoURL?: string;
  createdAt: Timestamp;
}

/**
 * Chat message interface
 */
export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  createdAt: Timestamp;
  isSystemMessage?: boolean;
  isRead?: boolean;
}

/**
 * Chat room interface
 */
export interface ChatRoom {
  id: string;
  pairingId: string;
  userIds: string[];
  createdAt: Timestamp;
  lastMessage: string | null;
  lastActivityAt: Timestamp;
}

/**
 * User feed item interface (denormalized for O(1) feed queries)
 */
export interface UserFeedItem {
  pairingId: string;
  date: Timestamp;
  user1_id: string;
  user1_username: string;
  user1_photoURL?: string;
  user1_profilePicURL?: string;
  user2_id: string;
  user2_username: string;
  user2_photoURL?: string;
  user2_profilePicURL?: string;
  status: 'completed' | 'flaked';
  likesCount: number;
  commentsCount: number;
}

/**
 * User stats interface
 */
export interface UserStats {
  totalPairings: number;
  completedPairings: number;
  completionRate: number;
  uniqueConnectionsMade: number;
  avgResponseTime?: number;
}

// Notification type definitions
export type NotificationType = 'pairing' | 'reminder' | 'completion' | 'like' | 'comment';

export interface NotificationData {
  type: NotificationType;
  pairingId?: string;
  senderId?: string;
  title: string;
  body: string;
  data?: any;
}

// Navigation param lists
export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  Permissions: undefined;
  Username: undefined;
  ProfileSetup: undefined;
  Completion: undefined;
};

export type MainStackParamList = {
  TabNavigator: undefined;
  Camera: undefined;
  PairingDetail: { pairingId: string };
  EditProfile: undefined;
  Settings: undefined;
  Waiting: { pairingId: string };
};

export type TabParamList = {
  Feed: undefined;
  Profile: { userId?: string };
};

// export * from './auth'; // Will be uncommented when auth.ts is defined/updated
export * from './user';
export * from './pairing';
export * from './notification';
export * from './navigation';
export * from './chat';
export * from './comment';
export * from './feed';

// Note: Timestamp should be imported directly from 'firebase/firestore' in files that need it.
// We are not re-exporting Timestamp here to avoid potential issues and stick to direct imports.
