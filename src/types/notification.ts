/**
 * Notification Types
 * 
 * Type definitions for notification-related data.
 */

import { Timestamp } from './index';

export interface NotificationSettings {
  pairingNotification: boolean;
  reminderNotification: boolean;
  completionNotification: boolean;
  quietHoursStart: number; // 0-23 hours
  quietHoursEnd: number; // 0-23 hours
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