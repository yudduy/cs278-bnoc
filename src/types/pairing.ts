/**
 * Pairing Types
 * 
 * Type definitions for pairing-related data.
 */

import { Timestamp, Comment } from './index';

export interface Pairing {
  id: string;
  date: Timestamp;
  expiresAt: Timestamp;
  users: string[];
  status: 'pending' | 'completed' | 'flaked';
  selfieURL?: string;
  frontImage?: string;
  backImage?: string;
  completedAt?: Timestamp;
  isPrivate: boolean;
  likes: number;
  likedBy: string[];
  comments: Comment[];
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

export interface CompletePairingParams {
  pairingId: string;
  userId: string;
  frontImage: string;
  backImage: string;
  isPrivate: boolean;
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