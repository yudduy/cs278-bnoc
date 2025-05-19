import { Timestamp } from 'firebase/firestore';

// Represents a brief summary of the last message for chat room previews
export interface ChatMessageBrief {
  text: string;
  senderId: string;
  createdAt: Timestamp;
}

// Represents a chat room for a pairing
export interface ChatRoom {
  id: string; // Usually same as pairingId for easy linking
  pairingId: string;
  userIds: [string, string]; // Participants
  createdAt: Timestamp;
  lastMessage?: ChatMessageBrief; // For quick preview in chat lists
}

// Represents a single message within a chat room
export interface ChatMessage {
  id: string; // Unique ID for the message
  chatRoomId: string;
  senderId: string;
  text: string;
  createdAt: Timestamp;
  readBy?: string[]; // Optional: for read receipts
} 