import { Timestamp } from 'firebase/firestore';

// Represents a denormalized item in a user's feed
export interface UserFeedItem {
  pairingId: string;
  date: Timestamp;
  user1_id: string;
  user1_photoURL?: string;
  user2_id: string;
  user2_photoURL?: string;
  status: 'completed' | 'flaked'; // Only completed/flaked appear in historical feed
  likesCount: number;
  commentsCount: number;
} 