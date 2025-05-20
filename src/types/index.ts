/**
 * Core Type Definitions
 * 
 * Centralized and optimized type definitions for the app.
 * This file serves as the main entry point for all type definitions.
 */

import { Timestamp } from 'firebase/firestore';

// -----------------------------
// USER RELATED TYPES
// -----------------------------

/**
 * Base user interface with common properties
 */
export interface BaseUser {
  email: string;
  username: string;
  displayName?: string;
  photoURL?: string;
  isActive: boolean;
}

/**
 * Complete user interface for app usage
 */
export interface User extends BaseUser {
  id: string; // Firestore document ID
  createdAt: Timestamp;
  lastActive: Timestamp;
  flakeStreak: number;
  maxFlakeStreak: number;
  connections: string[];
  blockedIds: string[];
  notificationSettings: NotificationSettings;
  fcmToken?: string;
  pushToken?: string;
  waitlistedToday?: boolean;
  priorityNextPairing?: boolean;
  snoozeTokensRemaining?: number;
  snoozeTokenLastRefilled?: Timestamp;
  privacySettings?: PrivacySettings;
  lastUpdated?: Timestamp;
}

/**
 * User interface with password for authentication/storage
 */
export interface AuthUser extends Omit<User, 'id'> {
  password: string; // Stored directly in Firestore
}

/**
 * User profile for display purposes
 */
export interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
  photoURL?: string;
  pairingCount: number;
  flakeStreak: number;
  maxFlakeStreak: number;
  joinedAt: Timestamp;
  lastActive: Timestamp;
}

/**
 * User statistics
 */
export interface UserStats {
  totalPairings: number;
  completedPairings: number;
  flakedPairings: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  totalLikes?: number;
  totalComments?: number;
  uniqueConnectionsMade?: number;
  avgResponseTime?: number;
}

/**
 * User settings
 */
export interface UserSettings {
  notificationSettings: NotificationSettings;
  theme: 'light' | 'dark' | 'system';
  privacySettings: PrivacySettings;
}

/**
 * Privacy settings
 */
export interface PrivacySettings {
  globalFeedOptIn: boolean;
  autoPrivateMode?: boolean;
  hideFromDiscovery?: boolean;
  showOnlyToFriends?: boolean;
}

/**
 * Authentication credentials
 */
export interface UserCredentials {
  email: string;
  password: string;
}

/**
 * Registration data
 */
export interface UserRegistration extends UserCredentials {
  username: string;
  displayName?: string;
}

/**
 * Blocked user information
 */
export interface BlockedUser {
  id: string;
  username: string;
  displayName?: string;
  photoURL?: string;
  blockedAt: Timestamp;
}

// -----------------------------
// NOTIFICATION RELATED TYPES
// -----------------------------

/**
 * Notification settings
 */
export interface NotificationSettings {
  pairingNotification: boolean;
  reminderNotification: boolean;
  chatNotification: boolean;
  partnerPhotoSubmittedNotification?: boolean;
  socialNotifications?: boolean;
  completionNotification?: boolean;
  quietHoursStart: number; // 0-23 hour (local time)
  quietHoursEnd: number; // 0-23 hour (local time)
}

/**
 * Notification types
 */
export type NotificationType = 'pairing' | 'reminder' | 'completion' | 'like' | 'comment' | 'final_reminder' | 'social';

/**
 * Push notification
 */
export interface PushNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: {
    pairingId?: string;
    userId?: string;
    actorId?: string;
    actorName?: string;
    commentId?: string;
    commentText?: string;
    urgent?: boolean;
  };
  createdAt: Timestamp;
  read: boolean;
}

/**
 * Social notification
 */
export interface SocialNotification {
  id: string;
  type: 'like' | 'comment';
  actorId: string;
  recipientId: string;
  pairingId: string;
  commentId?: string;
  commentText?: string;
  createdAt: Timestamp;
  read: boolean;
}

/**
 * Notification data
 */
export interface NotificationData {
  type: NotificationType;
  pairingId?: string;
  senderId?: string;
  title: string;
  body: string;
  data?: any;
}

/**
 * Notification token
 */
export interface NotificationToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  device: string;
  updatedAt: Timestamp;
}

// -----------------------------
// PAIRING RELATED TYPES
// -----------------------------

/**
 * Pairing status
 */
export type PairingStatus = 'pending' | 'user1_submitted' | 'user2_submitted' | 'completed' | 'flaked';

/**
 * Pairing data
 */
export interface Pairing {
  id: string;
  date: Timestamp;
  users: string[]; // Array of user IDs involved in the pairing
  user1_id: string;
  user2_id: string;
  status: PairingStatus;
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
 * Pairing Feed Item (extended pairing with user profile info)
 */
export interface PairingFeedItem extends Pairing {
  user1?: {
    id: string;
    username: string;
    displayName?: string;
    photoURL?: string;
  };
  user2?: {
    id: string;
    username: string;
    displayName?: string;
    photoURL?: string;
  };
}

// -----------------------------
// CHAT RELATED TYPES
// -----------------------------

/**
 * Chat message
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
 * Chat room
 */
export interface ChatRoom {
  id: string;
  pairingId: string;
  userIds: string[];
  createdAt: Timestamp;
  lastMessage: string | null;
  lastActivityAt: Timestamp;
}

// -----------------------------
// FEED RELATED TYPES
// -----------------------------

/**
 * User feed item (denormalized for efficient queries)
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
 * Comment
 */
export interface Comment {
  id: string;
  text: string;
  userId: string;
  username: string;
  userPhotoURL?: string;
  createdAt: Timestamp;
}

// -----------------------------
// NAVIGATION TYPES
// -----------------------------

/**
 * Root stack navigation params
 */
export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

/**
 * Auth stack navigation params
 */
export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

/**
 * Onboarding stack navigation params
 */
export type OnboardingStackParamList = {
  Welcome: undefined;
  Permissions: undefined;
  Username: undefined;
  ProfileSetup: undefined;
  Completion: undefined;
};

/**
 * Main stack navigation params
 */
export type MainStackParamList = {
  TabNavigator: undefined;
  Camera: undefined;
  PairingDetail: { pairingId: string };
  EditProfile: undefined;
  Settings: undefined;
  Waiting: { pairingId: string };
};

/**
 * Tab navigation params
 */
export type TabParamList = {
  Feed: undefined;
  Profile: { userId?: string };
};

/**
 * Submit photo parameters
 * @deprecated Import from './pairing' instead
 */
export interface SubmitPhotoParams {
  photoURL: string;
  isPrivate: boolean;
}

// Export auth and pairing types
export * from './auth';
export * from './pairing';