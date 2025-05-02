/**
 * Notification Dispatcher
 * 
 * Handles sending push notifications for new pairings, reminders, 
 * and social interactions.
 */

import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Types
export interface User {
  id: string;
  displayName?: string;
  username: string;
  email: string;
  pushToken?: string;
  notificationSettings: {
    pairingNotification: boolean;
    reminderNotification: boolean;
    completionNotification: boolean;
    quietHoursStart: number;
    quietHoursEnd: number;
  };
}

export interface Pairing {
  id: string;
  date: Timestamp;
  expiresAt: Timestamp;
  users: string[];
  status: 'pending' | 'completed' | 'flaked';
}

export interface NotificationResult {
  successCount: number;
  failureCount: number;
}

/**
 * Check if notification should be sent based on settings and quiet hours
 */
export const shouldSendNotification = (
  user: User, 
  type: 'pairing' | 'reminder' | 'completion' = 'pairing'
): boolean => {
  if (!user.notificationSettings) return true;
  
  // Check notification type setting
  if (type === 'pairing' && user.notificationSettings.pairingNotification === false) {
    return false;
  }
  if (type === 'reminder' && user.notificationSettings.reminderNotification === false) {
    return false;
  }
  if (type === 'completion' && user.notificationSettings.completionNotification === false) {
    return false;
  }
  
  // Check quiet hours
  const { quietHoursStart, quietHoursEnd } = user.notificationSettings;
  const currentHour = new Date().getHours();
  
  if (quietHoursStart <= quietHoursEnd) {
    // Simple case: start time is before end time (e.g., 22:00 to 8:00)
    if (currentHour >= quietHoursStart && currentHour < quietHoursEnd) {
      return false;
    }
  } else {
    // Wrap around case: start time is after end time (e.g., 22:00 to 8:00)
    if (currentHour >= quietHoursStart || currentHour < quietHoursEnd) {
      return false;
    }
  }
  
  return true;
};

/**
 * Send notifications in batches to avoid quota limits
 */
export const sendNotificationsInBatches = async (
  notifications: any[]
): Promise<NotificationResult> => {
  let successCount = 0;
  let failureCount = 0;
  
  // Send in batches of 500 (FCM limit)
  const batchSize = 500;
  
  for (let i = 0; i < notifications.length; i += batchSize) {
    const batch = notifications.slice(i, i + batchSize);
    
    // Skip empty batches
    if (batch.length === 0) continue;
    
    try {
      // Use multicast to send to multiple tokens
      const response = await admin.messaging().sendAll(batch);
      
      // Track success and failure counts
      successCount += response.successCount;
      failureCount += response.failureCount;
      
      console.log(`Notification batch ${i / batchSize + 1}: ${response.successCount} success, ${response.failureCount} failure`);
    } catch (error) {
      console.error(`Error sending notification batch ${i / batchSize + 1}:`, error);
      failureCount += batch.length;
    }
  }
  
  return { successCount, failureCount };
};

/**
 * Get today's pending pairings
 */
export const getTodaysPendingPairings = async (): Promise<Pairing[]> => {
  const db = admin.firestore();
  
  // Get today's date boundaries
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const pairingsSnapshot = await db.collection('pairings')
    .where('date', '>=', admin.firestore.Timestamp.fromDate(today))
    .where('status', '==', 'pending')
    .get();
  
  return pairingsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Pairing[];
};

/**
 * Create pairing notifications
 */
export const createPairingNotifications = async (): Promise<NotificationResult> => {
  const db = admin.firestore();
  
  try {
    console.log('Starting pairing notifications...');
    
    // Get today's pairings
    const pairings = await getTodaysPendingPairings();
    
    console.log(`Found ${pairings.length} pairings to send notifications for`);
    
    // Process each pairing
    const notifications = [];
    
    for (const pairing of pairings) {
      // Get user data for both users
      const [user1Doc, user2Doc] = await Promise.all([
        db.collection('users').doc(pairing.users[0]).get(),
        db.collection('users').doc(pairing.users[1]).get(),
      ]);
      
      const user1 = { id: user1Doc.id, ...user1Doc.data() } as User;
      const user2 = { id: user2Doc.id, ...user2Doc.data() } as User;
      
      // Check notification settings and quiet hours
      if (shouldSendNotification(user1) && user1.pushToken) {
        notifications.push({
          token: user1.pushToken,
          notification: {
            title: '📸 Today\'s Selfie Partner',
            body: `You're paired with ${user2.displayName || user2.username} today! Take a selfie together before 10:00 PM PT.`,
          },
          data: { 
            pairingId: pairing.id, 
            type: 'pairing',
            partnerName: user2.displayName || user2.username 
          },
        });
      }
      
      if (shouldSendNotification(user2) && user2.pushToken) {
        notifications.push({
          token: user2.pushToken,
          notification: {
            title: '📸 Today\'s Selfie Partner',
            body: `You're paired with ${user1.displayName || user1.username} today! Take a selfie together before 10:00 PM PT.`,
          },
          data: { 
            pairingId: pairing.id, 
            type: 'pairing',
            partnerName: user1.displayName || user1.username 
          },
        });
      }
    }
    
    console.log(`Sending ${notifications.length} notifications`);
    
    // Send notifications in batches
    return await sendNotificationsInBatches(notifications);
  } catch (error) {
    console.error('Error sending pairing notifications:', error);
    return { successCount: 0, failureCount: 0 };
  }
};

/**
 * Create reminder notifications
 */
export const createReminderNotifications = async (
  isFinalReminder: boolean = false
): Promise<NotificationResult> => {
  const db = admin.firestore();
  
  try {
    console.log(`Starting ${isFinalReminder ? 'final' : 'afternoon'} reminder notifications...`);
    
    // Get today's pending pairings
    const pairings = await getTodaysPendingPairings();
    
    console.log(`Found ${pairings.length} pending pairings to send reminders for`);
    
    // Process each pairing
    const notifications = [];
    
    for (const pairing of pairings) {
      // Get user data for both users
      const [user1Doc, user2Doc] = await Promise.all([
        db.collection('users').doc(pairing.users[0]).get(),
        db.collection('users').doc(pairing.users[1]).get(),
      ]);
      
      const user1 = { id: user1Doc.id, ...user1Doc.data() } as User;
      const user2 = { id: user2Doc.id, ...user2Doc.data() } as User;
      
      // Check notification settings and quiet hours
      if (shouldSendNotification(user1, 'reminder') && user1.pushToken) {
        notifications.push({
          token: user1.pushToken,
          notification: {
            title: isFinalReminder ? '🚨 Final Reminder' : '⏰ Selfie Reminder',
            body: isFinalReminder
              ? `Only 3 hours left to take a selfie with ${user2.displayName || user2.username} today!`
              : `Don't forget to take a selfie with ${user2.displayName || user2.username} today! You have until 10:00 PM PT.`,
          },
          data: { 
            pairingId: pairing.id, 
            type: isFinalReminder ? 'final_reminder' : 'reminder',
            partnerName: user2.displayName || user2.username,
            urgent: isFinalReminder ? 'true' : 'false'
          },
        });
      }
      
      if (shouldSendNotification(user2, 'reminder') && user2.pushToken) {
        notifications.push({
          token: user2.pushToken,
          notification: {
            title: isFinalReminder ? '🚨 Final Reminder' : '⏰ Selfie Reminder',
            body: isFinalReminder
              ? `Only 3 hours left to take a selfie with ${user1.displayName || user1.username} today!`
              : `Don't forget to take a selfie with ${user1.displayName || user1.username} today! You have until 10:00 PM PT.`,
          },
          data: { 
            pairingId: pairing.id, 
            type: isFinalReminder ? 'final_reminder' : 'reminder',
            partnerName: user1.displayName || user1.username,
            urgent: isFinalReminder ? 'true' : 'false'
          },
        });
      }
    }
    
    console.log(`Sending ${notifications.length} reminder notifications`);
    
    // Send notifications in batches
    return await sendNotificationsInBatches(notifications);
  } catch (error) {
    console.error(`Error sending ${isFinalReminder ? 'final' : ''} reminder notifications:`, error);
    return { successCount: 0, failureCount: 0 };
  }
};

/**
 * Send a completion notification when pairing is completed
 */
export const sendCompletionNotifications = async (
  pairingId: string
): Promise<NotificationResult> => {
  const db = admin.firestore();
  
  try {
    console.log(`Sending completion notifications for pairing ${pairingId}`);
    
    // Get pairing data
    const pairingDoc = await db.collection('pairings').doc(pairingId).get();
    if (!pairingDoc.exists) {
      throw new Error(`Pairing ${pairingId} not found`);
    }
    
    const pairing = { id: pairingDoc.id, ...pairingDoc.data() } as Pairing;
    
    // Get user data for both users
    const [user1Doc, user2Doc] = await Promise.all([
      db.collection('users').doc(pairing.users[0]).get(),
      db.collection('users').doc(pairing.users[1]).get(),
    ]);
    
    const user1 = { id: user1Doc.id, ...user1Doc.data() } as User;
    const user2 = { id: user2Doc.id, ...user2Doc.data() } as User;
    
    // Reset flake streak for both users
    await Promise.all([
      db.collection('users').doc(user1.id).update({ flakeStreak: 0 }),
      db.collection('users').doc(user2.id).update({ flakeStreak: 0 }),
    ]);
    
    // Prepare notifications
    const notifications = [];
    
    // Send notifications to both users (if they have tokens)
    if (shouldSendNotification(user1, 'completion') && user1.pushToken) {
      notifications.push({
        token: user1.pushToken,
        notification: {
          title: '✅ Selfie Completed',
          body: `Your selfie with ${user2.displayName || user2.username} has been posted!`,
        },
        data: { 
          pairingId: pairingId, 
          type: 'completion'
        },
      });
    }
    
    if (shouldSendNotification(user2, 'completion') && user2.pushToken) {
      notifications.push({
        token: user2.pushToken,
        notification: {
          title: '✅ Selfie Completed',
          body: `Your selfie with ${user1.displayName || user1.username} has been posted!`,
        },
        data: { 
          pairingId: pairingId, 
          type: 'completion'
        },
      });
    }
    
    // Send notifications
    if (notifications.length > 0) {
      return await sendNotificationsInBatches(notifications);
    } else {
      return { successCount: 0, failureCount: 0 };
    }
  } catch (error) {
    console.error(`Error sending completion notifications for pairing ${pairingId}:`, error);
    return { successCount: 0, failureCount: 0 };
  }
};

/**
 * Send a social activity notification (like, comment)
 */
export const sendSocialNotification = async (
  pairingId: string,
  actorId: string,
  recipientId: string,
  action: 'like' | 'comment',
  commentText?: string
): Promise<NotificationResult> => {
  const db = admin.firestore();
  
  try {
    console.log(`Sending ${action} notification for pairing ${pairingId}`);
    
    // Get user data
    const [actorDoc, recipientDoc] = await Promise.all([
      db.collection('users').doc(actorId).get(),
      db.collection('users').doc(recipientId).get(),
    ]);
    
    if (!actorDoc.exists || !recipientDoc.exists) {
      throw new Error('User not found');
    }
    
    const actor = { id: actorDoc.id, ...actorDoc.data() } as User;
    const recipient = { id: recipientDoc.id, ...recipientDoc.data() } as User;
    
    // Skip if actor is recipient
    if (actorId === recipientId) {
      return { successCount: 0, failureCount: 0 };
    }
    
    // Check if recipient has token and wants notifications
    if (!recipient.pushToken) {
      return { successCount: 0, failureCount: 0 };
    }
    
    // Create notification
    const notification = {
      token: recipient.pushToken,
      notification: {
        title: action === 'like' 
          ? '❤️ New Like' 
          : '💬 New Comment',
        body: action === 'like'
          ? `${actor.displayName || actor.username} liked your selfie`
          : `${actor.displayName || actor.username} commented: ${commentText?.substring(0, 50)}${commentText && commentText.length > 50 ? '...' : ''}`,
      },
      data: {
        pairingId,
        type: action,
        actorId,
        actorName: actor.displayName || actor.username,
        ...(action === 'comment' && commentText && { commentText: commentText.substring(0, 100) })
      },
    };
    
    // Send notification
    return await sendNotificationsInBatches([notification]);
  } catch (error) {
    console.error(`Error sending ${action} notification:`, error);
    return { successCount: 0, failureCount: 0 };
  }
};