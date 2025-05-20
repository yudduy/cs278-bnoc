/**
 * Pairing Types
 * 
 * Type definitions for pairing-related data.
 */

import { Timestamp } from 'firebase/firestore';

export interface Pairing {
  id: string; // Unique ID for the pairing document
  date: Timestamp; // Date the pairing was created
  expiresAt: Timestamp; // Deadline for photo submissions (typically 22:00 PT)
  users: [string, string]; // Array exactly two user IDs
  status: 'pending' | 'user1_submitted' | 'user2_submitted' | 'completed' | 'flaked';
  user1_id: string; // UID of first user
  user1_photoURL?: string; // URL of photo submitted by user1
  user1_submittedAt?: Timestamp;
  user2_id: string; // UID of second user
  user2_photoURL?: string; // URL of photo submitted by user2
  user2_submittedAt?: Timestamp;
  chatId: string; // ID of the associated chat room in Firestore
  likesCount: number; // Aggregated count
  likedBy: string[]; // Array of UIDs who liked this pairing
  commentsCount: number; // Aggregated count of comments
  completedAt?: Timestamp; // When both users completed their submissions
  isPrivate: boolean; // Whether this pairing is private or visible to connections
  virtualMeetingLink: string;
}

export interface PairingHistory {
  id: string;
  users: string[];
  date: Timestamp;
}

export interface PairingRequest {
  userId: string;
  requestedUserId: string;
  createdAt: Timestamp;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
}

export interface PairingResult {
  pairings: { user1Id: string; user2Id: string }[];
  waitlist: string[];
}

export interface SubmitPhotoParams {
  pairingId: string;
  userId: string;
  photoURL: string;
  isPrivate?: boolean;
}

export interface PairingStats {
  totalCompletedToday: number;
  totalPendingToday: number;
  totalFlakedToday: number;
  completionRateToday: number;
  totalPairingsAllTime: number;
  completionRateAllTime: number;
}

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