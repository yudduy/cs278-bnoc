/**
 * Social Notifications Service
 * 
 * Handles notifications for social interactions like likes, comments, etc.
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import firebaseService from '../firebase';
import { User, Pairing } from '../../types';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Send a like notification to relevant users
 */
export const sendLikeNotification = async (
  pairing: Pairing,
  likedByUserId: string,
  currentUserId: string
): Promise<void> => {
  try {
    // Get user who liked the pairing
    const likedByUser = await firebaseService.getUserById(likedByUserId);
    
    if (!likedByUser) {
      console.error('User who liked not found');
      return;
    }
    
    // Don't notify yourself
    const recipientIds = pairing.users.filter(id => id !== likedByUserId);
    
    // No need to continue if no recipients
    if (recipientIds.length === 0) return;
    
    // For each recipient, check if they want notifications and send
    for (const recipientId of recipientIds) {
      // Skip current user (e.g., when looking at pairings in feed)
      if (recipientId === currentUserId) continue;
      
      const recipient = await firebaseService.getUserById(recipientId);
      
      if (!recipient || !recipient.notificationSettings?.completionNotification) {
        continue;
      }
      
      // Check quiet hours (should be implemented with proper time zone handling)
      if (isInQuietHours(recipient)) {
        continue;
      }
      
      // Get push token (in a real app, would be stored in user document)
      const pushToken = await firebaseService.getUserPushToken(recipientId);
      
      if (!pushToken) continue;
      
      // Prepare and send notification
      await sendPushNotification({
        to: pushToken,
        title: 'New Like 👍',
        body: `${likedByUser.displayName || likedByUser.username} liked your pairing`,
        data: {
          type: 'like',
          pairingId: pairing.id,
          senderId: likedByUserId,
        },
      });
    }
  } catch (error) {
    console.error('Error sending like notification:', error);
  }
};

/**
 * Send a comment notification to relevant users
 */
export const sendCommentNotification = async (
  pairing: Pairing,
  commentUserId: string,
  commentText: string,
  currentUserId: string
): Promise<void> => {
  try {
    // Get user who commented
    const commentUser = await firebaseService.getUserById(commentUserId);
    
    if (!commentUser) {
      console.error('Comment user not found');
      return;
    }
    
    // Don't notify yourself
    const recipientIds = pairing.users.filter(id => id !== commentUserId);
    
    // Also notify other commenters (except the current commenter)
    const otherCommenters = pairing.comments
      ?.map(comment => comment.userId)
      .filter(id => id !== commentUserId && !recipientIds.includes(id)) || [];
    
    // Combine recipients - pairing participants and previous commenters
    const allRecipients = [...new Set([...recipientIds, ...otherCommenters])];
    
    // No need to continue if no recipients
    if (allRecipients.length === 0) return;
    
    // Truncate comment text if too long
    const truncatedText = commentText.length > 50
      ? `${commentText.substring(0, 47)}...`
      : commentText;
    
    // For each recipient, check if they want notifications and send
    for (const recipientId of allRecipients) {
      // Skip current user (e.g., when looking at pairings in feed)
      if (recipientId === currentUserId) continue;
      
      const recipient = await firebaseService.getUserById(recipientId);
      
      if (!recipient || !recipient.notificationSettings?.completionNotification) {
        continue;
      }
      
      // Check quiet hours
      if (isInQuietHours(recipient)) {
        continue;
      }
      
      // Get push token (in a real app, would be stored in user document)
      const pushToken = await firebaseService.getUserPushToken(recipientId);
      
      if (!pushToken) continue;
      
      // Different message for pairing participants vs. other commenters
      const isParticipant = pairing.users.includes(recipientId);
      const body = isParticipant
        ? `${commentUser.displayName || commentUser.username} commented on your pairing: "${truncatedText}"`
        : `${commentUser.displayName || commentUser.username} also commented: "${truncatedText}"`;
      
      // Prepare and send notification
      await sendPushNotification({
        to: pushToken,
        title: 'New Comment 💬',
        body,
        data: {
          type: 'comment',
          pairingId: pairing.id,
          senderId: commentUserId,
        },
      });
    }
  } catch (error) {
    console.error('Error sending comment notification:', error);
  }
};

/**
 * Send a reminder notification
 */
export const sendReminderNotification = async (
  pairing: Pairing,
  senderId: string,
  recipientId: string
): Promise<void> => {
  try {
    // Get sender and recipient information
    const sender = await firebaseService.getUserById(senderId);
    const recipient = await firebaseService.getUserById(recipientId);
    
    if (!sender || !recipient) {
      console.error('Sender or recipient not found');
      return;
    }
    
    // Check if recipient allows reminder notifications
    if (!recipient.notificationSettings?.reminderNotification) {
      return;
    }
    
    // Check quiet hours
    if (isInQuietHours(recipient)) {
      return;
    }
    
    // Get push token (in a real app, would be stored in user document)
    const pushToken = await firebaseService.getUserPushToken(recipientId);
    
    if (!pushToken) return;
    
    // Calculate hours remaining until deadline
    const now = new Date();
    const expiresAt = pairing.expiresAt
      ? new Date(pairing.expiresAt.seconds * 1000)
      : new Date(now.setHours(22, 0, 0, 0));
    
    const hoursRemaining = Math.max(
      0,
      Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60))
    );
    
    // Prepare and send notification
    await sendPushNotification({
      to: pushToken,
      title: 'Pairing Reminder 🔔',
      body: `${sender.displayName || sender.username} is waiting for your selfie! ${hoursRemaining > 0 ? `${hoursRemaining} hours remaining.` : 'Last chance to complete today\'s pairing!'}`,
      data: {
        type: 'reminder',
        pairingId: pairing.id,
        senderId,
      },
    });
  } catch (error) {
    console.error('Error sending reminder notification:', error);
  }
};

/**
 * Check if the current time is within user's quiet hours
 */
const isInQuietHours = (user: User): boolean => {
  if (!user.notificationSettings) return false;
  
  const { quietHoursStart, quietHoursEnd } = user.notificationSettings;
  
  // Get current hour
  const now = new Date();
  const currentHour = now.getHours();
  
  // Handle wraparound (e.g., 22:00 to 08:00)
  if (quietHoursStart > quietHoursEnd) {
    return currentHour >= quietHoursStart || currentHour < quietHoursEnd;
  }
  
  // Normal range (e.g., 01:00 to 05:00)
  return currentHour >= quietHoursStart && currentHour < quietHoursEnd;
};

/**
 * Send a push notification using Expo Notifications
 */
export interface PushNotification {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export const sendPushNotification = async (notification: PushNotification): Promise<void> => {
  // For development/demo, log notification instead of sending
  console.log('Sending notification:', notification);
  
  // In a real app, we would use Expo's push notification API or Firebase Cloud Messaging
  try {
    // Mock implementation - in a real app, we would send to Expo push service
    // Add these details if actually sending
    const message = {
      to: notification.to,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      _displayInForeground: true,
    };
    
    // Just log for demo purposes
    console.log('Push notification would be sent:', message);
    
    // In a real app:
    // await fetch('https://exp.host/--/api/v2/push/send', {
    //   method: 'POST',
    //   headers: {
    //     Accept: 'application/json',
    //     'Accept-encoding': 'gzip, deflate',
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(message),
    // });
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
};

export default {
  sendLikeNotification,
  sendCommentNotification,
  sendReminderNotification,
  sendPushNotification,
};
