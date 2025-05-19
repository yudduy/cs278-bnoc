import { Timestamp } from 'firebase/firestore';

// Represents a comment on a pairing
// To be stored in /pairings/{pairingId}/comments/{commentId}
export interface Comment {
  id: string; // Unique ID for the comment
  pairingId: string; // Parent pairing
  userId: string; // UID of commenter
  username: string; // Username of commenter (denormalized)
  userPhotoURL?: string; // Profile photo of commenter (denormalized)
  text: string;
  createdAt: Timestamp;
  likesCount?: number;
  likedBy?: string[];
} 