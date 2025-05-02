/**
 * Type Definitions
 * 
 * Centralized type definitions for the Daily Meetup Selfie app.
 */

import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// User type definition
export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  photoURL?: string;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  lastActive: FirebaseFirestoreTypes.Timestamp;
  isActive: boolean;
  flakeStreak: number;
  maxFlakeStreak: number;
  blockedIds: string[];
  notificationSettings: NotificationSettings;
  snoozeTokensRemaining: number;
  snoozeTokenLastRefilled: FirebaseFirestoreTypes.Timestamp;
}

// Notification settings type
export interface NotificationSettings {
  pairingNotification: boolean;
  reminderNotification: boolean;
  completionNotification: boolean;
  quietHoursStart: number; // Hour of day (0-23)
  quietHoursEnd: number; // Hour of day (0-23)
}

// Privacy settings type
export interface UserPrivacySettings {
  globalFeedOptIn: boolean;
  blockedIds: string[];
}

// Pairing type definition
export interface Pairing {
  id: string;
  date: FirebaseFirestoreTypes.Timestamp;
  expiresAt: FirebaseFirestoreTypes.Timestamp;
  users: string[]; // User IDs
  status: 'pending' | 'completed' | 'flaked' | 'snoozed';
  selfieURL?: string;
  frontImage?: string;
  backImage?: string;
  completedAt?: FirebaseFirestoreTypes.Timestamp;
  isPrivate: boolean;
  likes: number;
  likedBy: string[]; // User IDs
  comments?: Comment[];
  virtualMeetingLink?: string;
}

// Comment type definition
export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  username: string;
  userPhotoURL?: string;
}

// User feed item for denormalized storage
export interface UserFeedItem {
  pairingId: string;
  date: FirebaseFirestoreTypes.Timestamp;
  users: string[]; // User IDs
  selfieURL?: string;
  isPrivate: boolean;
  status: 'pending' | 'completed' | 'flaked' | 'snoozed';
  likes: number;
  commentCount: number;
}

// User stats type
export interface UserStats {
  totalPairings: number;
  completedPairings: number;
  flakedPairings: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  uniqueConnections: number;
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
