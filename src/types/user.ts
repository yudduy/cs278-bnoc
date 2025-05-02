/**
 * User Types
 * 
 * Type definitions for user-related data.
 */

import { Timestamp, NotificationSettings } from './index';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
  lastActive: Timestamp;
  isActive: boolean;
  flakeStreak: number;
  maxFlakeStreak: number;
  blockedIds: string[];
  pushToken?: string;
  notificationSettings: NotificationSettings;
  snoozeTokensRemaining: number;
  snoozeTokenLastRefilled: Timestamp;
  waitlistedToday?: boolean;
  priorityNextPairing?: boolean;
}

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

export interface UserCredentials {
  email: string;
  password: string;
}

export interface UserRegistration extends UserCredentials {
  username: string;
  displayName?: string;
}

export interface UserStats {
  totalPairings: number;
  completedPairings: number;
  flakedPairings: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  totalLikes: number;
  totalComments: number;
}

export interface UserSettings {
  notificationSettings: NotificationSettings;
  theme: 'light' | 'dark' | 'system';
  privacySettings: {
    autoPrivateMode: boolean;
    hideFromDiscovery: boolean;
    showOnlyToFriends: boolean;
  };
}

export interface BlockedUser {
  id: string;
  username: string;
  displayName?: string;
  photoURL?: string;
  blockedAt: Timestamp;
}