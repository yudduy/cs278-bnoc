/**
 * Notification Types
 * 
 * Type definitions for notification-related data.
 */

import { Timestamp } from './index';

export interface NotificationSettings {
  pairingNotification: boolean; // For new pairing assignment
  chatNotification: boolean; // For new messages in pairing chat
  partnerPhotoSubmittedNotification: boolean; // When partner submits their photo
  reminderNotification: boolean; // For incomplete pairings
  socialNotifications: boolean; // Likes, comments on their posts
  quietHoursStart?: number; // 0-23 hour (local time)
  quietHoursEnd?: number; // 0-23 hour (local time)
}

export interface PushNotification {
  id: string;
  type: 'pairing' | 'reminder' | 'final_reminder' | 'completion' | 'social';
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

export interface NotificationToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  device: string;
  updatedAt: Timestamp;
}

export interface NotificationResult {
  successCount: number;
  failureCount: number;
}

export interface NotificationPayload {
  token: string;
  notification: {
    title: string;
    body: string;
  };
  data: {
    [key: string]: string;
  };
}

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

export interface NotificationResponse {
  type: 'success' | 'error';
  message: string;
  data?: any;
}