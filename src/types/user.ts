/**
 * User Types
 * 
 * Type definitions for user-related data.
 */

import { Timestamp } from 'firebase/firestore';
import { NotificationSettings } from './notification';

// Represents the structure of a user in the application
export interface User {
  id: string; // UID from Firebase Auth
  email: string; // Stanford email, verified
  displayName?: string; // Optional
  username: string; // Unique, chosen by user
  photoURL?: string; // URL to profile picture
  createdAt: Timestamp;
  lastActive: Timestamp;
  isActive: boolean; // Used for pairing eligibility
  flakeStreak: number; // Current consecutive flakes
  maxFlakeStreak: number; // All-time max flake streak
  connections: string[]; // Array of friend UIDs
  blockedIds?: string[]; // Array of UIDs of users blocked by this user
  notificationSettings: NotificationSettings;
  fcmToken?: string; // For push notifications
  pushToken?: string;
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