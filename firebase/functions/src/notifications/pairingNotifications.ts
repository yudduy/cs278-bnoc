/**
 * Pairing Notification Functions
 * 
 * Cloud Functions for sending push notifications related to pairings:
 * 1. Morning notification at 7:00 AM with new pairing info
 * 2. Mid-day reminder at 3:00 PM if pairing is still pending
 * 3. Final reminder at 7:00 PM if pairing is still pending
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Firestore database reference
const db = admin.firestore();

/**
 * Interface for simplified User for notification purposes
 */
interface NotificationUser {
  id: string;
  displayName?: string;
  username: string;
  photoURL?: string;
  pushToken?: string;
  notificationSettings?: {
    pairingNotification: boolean;
    reminderNotification: boolean;
    completionNotification: boolean;
    quietHoursStart: number;
    quietHoursEnd: number;
  };
}

/**
 * Interface for simplified Pairing for notification purposes
 */
interface Pairing {
  id: string;
  users: string[];
  status: 'pending' | 'completed' | 'flaked';
  date: FirebaseFirestore.Timestamp;
  expiresAt: FirebaseFirestore.Timestamp;
}

/**
 * Helper function to chunk an array into smaller arrays
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Check if notification should be sent based on user settings and quiet hours
 */
function shouldSendNotification(user: NotificationUser): boolean {
  // Check if notifications are enabled at all
  if (!user.notificationSettings) return true;
  
  // Check if specific notification type is enabled (default to true)
  const { pairingNotification = true } = user.notificationSettings;
  if (!pairingNotification) return false;
  
  // Check quiet hours
  const now = new Date();
  const userTime = now; // In production, convert to user's local time
  const hour = userTime.getHours();
  
  const quietStart = user.notificationSettings.quietHoursStart || 22;
  const quietEnd = user.notificationSettings.quietHoursEnd || 8;
  
  // Handle wraparound for overnight quiet hours
  if (quietStart <= quietEnd) {
    return hour < quietStart && hour >= quietEnd;
  } else {
    return hour < quietStart || hour >= quietEnd;
  }
}

/**
 * Morning notification at 7:00 AM PT for new daily pairings
 */
export const sendPairingNotifications = functions.pubsub
  .schedule('0 7 * * *')  // 7:00 AM PT daily
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    console.log('Running sendPairingNotifications function');
    
    try {
      // Get today's date boundaries
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = admin.firestore.Timestamp.fromDate(today);
      
      // Get today's pairings
      const pairingsSnapshot = await db.collection('pairings')
        .where('date', '>=', todayTimestamp)
        .where('status', '==', 'pending')
        .get();
      
      console.log(`Found ${pairingsSnapshot.size} pending pairings for notifications`);
      
      // Prepare notifications
      const notifications = [];
      
      // Process each pairing
      for (const pairingDoc of pairingsSnapshot.docs) {
        const pairing = { id: pairingDoc.id, ...pairingDoc.data() } as Pairing;
        
        // Get user data for both users
        const [user1Doc, user2Doc] = await Promise.all([
          db.collection('users').doc(pairing.users[0]).get(),
          db.collection('users').doc(pairing.users[1]).get(),
        ]);
        
        if (!user1Doc.exists || !user2Doc.exists) {
          console.log(`Skipping pairing ${pairing.id} - one or both users not found`);
          continue;
        }
        
        const user1 = { id: user1Doc.id, ...user1Doc.data() } as NotificationUser;
        const user2 = { id: user2Doc.id, ...user2Doc.data() } as NotificationUser;
        
        // Format time until expiration (10:00 PM PT)
        const expiresAt = pairing.expiresAt.toDate();
        const hoursRemaining = Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60));
        
        // Prepare and send notification to user1 if they have a push token
        if (user1.pushToken && shouldSendNotification(user1)) {
          notifications.push({
            token: user1.pushToken,
            notification: {
              title: '📸 Today\'s Selfie Partner',
              body: `You're paired with ${user2.displayName || user2.username} today! Take a selfie together before 10:00 PM PT.`,
            },
            data: {
              pairingId: pairing.id,
              type: 'pairing',
              partnerId: user2.id,
              partnerName: user2.displayName || user2.username,
              expiration: expiresAt.toISOString(),
              hoursRemaining: hoursRemaining.toString(),
            },
            android: {
              notification: {
                color: '#990000',
                priority: 'high',
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                },
              },
            },
          });
        }
        
        // Prepare and send notification to user2 if they have a push token
        if (user2.pushToken && shouldSendNotification(user2)) {
          notifications.push({
            token: user2.pushToken,
            notification: {
              title: '📸 Today\'s Selfie Partner',
              body: `You're paired with ${user1.displayName || user1.username} today! Take a selfie together before 10:00 PM PT.`,
            },
            data: {
              pairingId: pairing.id,
              type: 'pairing',
              partnerId: user1.id,
              partnerName: user1.displayName || user1.username,
              expiration: expiresAt.toISOString(),
              hoursRemaining: hoursRemaining.toString(),
            },
            android: {
              notification: {
                color: '#990000',
                priority: 'high',
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                },
              },
            },
          });
        }
      }
      
      // Send notifications in batches (FCM has a limit of 500 per batch)
      if (notifications.length > 0) {
        const chunks = chunkArray(notifications, 500);
        for (const chunk of chunks) {
          await admin.messaging().sendEach(chunk);
        }
      }
      
      return { 
        success: true, 
        sentCount: notifications.length 
      };
    } catch (error) {
      console.error('Error sending pairing notifications:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

/**
 * Mid-day reminder at 3:00 PM PT for incomplete pairings
 */
export const sendReminderNotifications = functions.pubsub
  .schedule('0 15 * * *')  // 3:00 PM PT daily
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    console.log('Running sendReminderNotifications function');
    
    try {
      // Get today's date boundaries
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = admin.firestore.Timestamp.fromDate(today);
      
      // Get all pending pairings from today
      const pendingPairingsSnapshot = await db.collection('pairings')
        .where('date', '>=', todayTimestamp)
        .where('status', '==', 'pending')
        .get();
        
      console.log(`Found ${pendingPairingsSnapshot.size} pending pairings for reminders`);
      
      // Prepare notifications
      const notifications = [];
      
      // Process each pairing
      for (const pairingDoc of pendingPairingsSnapshot.docs) {
        const pairing = { id: pairingDoc.id, ...pairingDoc.data() } as Pairing;
        
        // Get user data for both users
        const [user1Doc, user2Doc] = await Promise.all([
          db.collection('users').doc(pairing.users[0]).get(),
          db.collection('users').doc(pairing.users[1]).get(),
        ]);
        
        if (!user1Doc.exists || !user2Doc.exists) {
          console.log(`Skipping pairing ${pairing.id} - one or both users not found`);
          continue;
        }
        
        const user1 = { id: user1Doc.id, ...user1Doc.data() } as NotificationUser;
        const user2 = { id: user2Doc.id, ...user2Doc.data() } as NotificationUser;
        
        // Format time until expiration (10:00 PM PT)
        const expiresAt = pairing.expiresAt.toDate();
        const hoursRemaining = Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60));
        
        // Only send if reminder notification is enabled
        const user1Reminders = user1.notificationSettings?.reminderNotification !== false;
        const user2Reminders = user2.notificationSettings?.reminderNotification !== false;
        
        // Prepare and send notification to user1 if they have a push token
        if (user1.pushToken && user1Reminders && shouldSendNotification(user1)) {
          notifications.push({
            token: user1.pushToken,
            notification: {
              title: '⏰ Reminder: Today\'s Selfie',
              body: `Don't forget to take a selfie with ${user2.displayName || user2.username} before 10:00 PM PT. ${hoursRemaining} hours left!`,
            },
            data: {
              pairingId: pairing.id,
              type: 'reminder',
              partnerId: user2.id,
              partnerName: user2.displayName || user2.username,
              expiration: expiresAt.toISOString(),
              hoursRemaining: hoursRemaining.toString(),
            },
            android: {
              notification: {
                color: '#990000',
                priority: 'high',
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                },
              },
            },
          });
        }
        
        // Prepare and send notification to user2 if they have a push token
        if (user2.pushToken && user2Reminders && shouldSendNotification(user2)) {
          notifications.push({
            token: user2.pushToken,
            notification: {
              title: '⏰ Reminder: Today\'s Selfie',
              body: `Don't forget to take a selfie with ${user1.displayName || user1.username} before 10:00 PM PT. ${hoursRemaining} hours left!`,
            },
            data: {
              pairingId: pairing.id,
              type: 'reminder',
              partnerId: user1.id,
              partnerName: user1.displayName || user1.username,
              expiration: expiresAt.toISOString(),
              hoursRemaining: hoursRemaining.toString(),
            },
            android: {
              notification: {
                color: '#990000',
                priority: 'high',
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                },
              },
            },
          });
        }
      }
      
      // Send notifications in batches
      if (notifications.length > 0) {
        const chunks = chunkArray(notifications, 500);
        for (const chunk of chunks) {
          await admin.messaging().sendEach(chunk);
        }
      }
      
      return { 
        success: true, 
        sentCount: notifications.length 
      };
    } catch (error) {
      console.error('Error sending reminder notifications:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

/**
 * Final reminder at 7:00 PM PT for incomplete pairings (3 hours before deadline)
 */
export const sendFinalReminderNotifications = functions.pubsub
  .schedule('0 19 * * *')  // 7:00 PM PT daily
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    console.log('Running sendFinalReminderNotifications function');
    
    try {
      // Get today's date boundaries
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = admin.firestore.Timestamp.fromDate(today);
      
      // Get all pending pairings from today
      const pendingPairingsSnapshot = await db.collection('pairings')
        .where('date', '>=', todayTimestamp)
        .where('status', '==', 'pending')
        .get();
        
      console.log(`Found ${pendingPairingsSnapshot.size} pending pairings for final reminders`);
      
      // Prepare notifications
      const notifications = [];
      
      // Process each pairing
      for (const pairingDoc of pendingPairingsSnapshot.docs) {
        const pairing = { id: pairingDoc.id, ...pairingDoc.data() } as Pairing;
        
        // Get user data for both users
        const [user1Doc, user2Doc] = await Promise.all([
          db.collection('users').doc(pairing.users[0]).get(),
          db.collection('users').doc(pairing.users[1]).get(),
        ]);
        
        if (!user1Doc.exists || !user2Doc.exists) {
          console.log(`Skipping pairing ${pairing.id} - one or both users not found`);
          continue;
        }
        
        const user1 = { id: user1Doc.id, ...user1Doc.data() } as NotificationUser;
        const user2 = { id: user2Doc.id, ...user2Doc.data() } as NotificationUser;
        
        // Only send if reminder notification is enabled
        const user1Reminders = user1.notificationSettings?.reminderNotification !== false;
        const user2Reminders = user2.notificationSettings?.reminderNotification !== false;
        
        // Prepare and send notification to user1 if they have a push token
        if (user1.pushToken && user1Reminders && shouldSendNotification(user1)) {
          notifications.push({
            token: user1.pushToken,
            notification: {
              title: '⚠️ Final Reminder: Today\'s Selfie',
              body: `Only 3 hours left to take a selfie with ${user2.displayName || user2.username}! Don't miss the 10:00 PM deadline.`,
            },
            data: {
              pairingId: pairing.id,
              type: 'final_reminder',
              partnerId: user2.id,
              partnerName: user2.displayName || user2.username,
              hoursRemaining: '3',
            },
            android: {
              notification: {
                color: '#990000',
                priority: 'high',
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                },
              },
            },
          });
        }
        
        // Prepare and send notification to user2 if they have a push token
        if (user2.pushToken && user2Reminders && shouldSendNotification(user2)) {
          notifications.push({
            token: user2.pushToken,
            notification: {
              title: '⚠️ Final Reminder: Today\'s Selfie',
              body: `Only 3 hours left to take a selfie with ${user1.displayName || user1.username}! Don't miss the 10:00 PM deadline.`,
            },
            data: {
              pairingId: pairing.id,
              type: 'final_reminder',
              partnerId: user1.id,
              partnerName: user1.displayName || user1.username,
              hoursRemaining: '3',
            },
            android: {
              notification: {
                color: '#990000',
                priority: 'high',
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                },
              },
            },
          });
        }
      }
      
      // Send notifications in batches
      if (notifications.length > 0) {
        const chunks = chunkArray(notifications, 500);
        for (const chunk of chunks) {
          await admin.messaging().sendEach(chunk);
        }
      }
      
      return { 
        success: true, 
        sentCount: notifications.length 
      };
    } catch (error) {
      console.error('Error sending final reminder notifications:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });