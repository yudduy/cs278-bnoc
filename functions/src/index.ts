/**
 * Cloud Functions for Daily Meetup Selfie App
 * 
 * Handles the daily pairing algorithm, push notifications,
 * and pairing expiration checks.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Types
interface User {
  id: string;
  displayName?: string;
  username: string;
  email: string;
  createdAt: Timestamp;
  lastActive: Timestamp;
  isActive: boolean;
  flakeStreak: number;
  maxFlakeStreak: number;
  blockedIds: string[];
  pushToken?: string;
  notificationSettings: {
    pairingNotification: boolean;
    reminderNotification: boolean;
    completionNotification: boolean;
    quietHoursStart: number;
    quietHoursEnd: number;
  };
}

interface Pairing {
  id: string;
  date: Timestamp;
  expiresAt: Timestamp;
  users: string[];
  status: 'pending' | 'completed' | 'flaked';
  isPrivate: boolean;
  likes: number;
  likedBy: string[];
  comments: any[];
  virtualMeetingLink: string;
}

interface PairingHistory {
  id: string;
  users: string[];
  date: Timestamp;
}

/**
 * Daily pairing function that runs at 5:00 AM PT
 * Creates pairings for all active users
 */
export const pairUsers = functions.pubsub
  .schedule('0 5 * * *') // 5:00 AM PT daily
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    const db = admin.firestore();
    const batch = db.batch();
    
    try {
      console.log('Starting daily pairing algorithm...');
      
      // Get active users
      const activeUsersSnapshot = await db.collection('users')
        .where('isActive', '==', true)
        .where('lastActive', '>', admin.firestore.Timestamp.fromDate(
          new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
        ))
        .where('flakeStreak', '<', 5) // Skip users with high flake streak
        .get();
      
      const activeUsers = activeUsersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      
      console.log(`Found ${activeUsers.length} active users to pair`);
      
      // Check if any users to pair
      if (activeUsers.length < 2) {
        console.log('Not enough active users to pair');
        return { success: false, message: 'Not enough active users to pair' };
      }
      
      // Shuffle users for random pairing
      const shuffledUsers = shuffleArray(activeUsers);
      
      // Get pairing history to avoid recent repeats
      const pairingHistoryData = await getPairingHistory(7); // Last 7 days
      
      // Pair users while avoiding recent repeats
      const { pairings, waitlist } = createPairings(shuffledUsers, pairingHistoryData);
      
      console.log(`Created ${pairings.length} pairings with ${waitlist.length} users on waitlist`);
      
      // Calculate today's deadline (10:00 PM PT)
      const today = new Date();
      const expiresAt = new Date(today);
      expiresAt.setHours(22, 0, 0, 0); // 10:00 PM
      
      // Create pairing documents
      for (const pairing of pairings) {
        const pairingRef = db.collection('pairings').doc();
        
        batch.set(pairingRef, {
          id: pairingRef.id,
          date: admin.firestore.Timestamp.now(),
          expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
          users: [pairing.user1.id, pairing.user2.id],
          status: 'pending',
          isPrivate: false,
          likes: 0,
          likedBy: [],
          comments: [],
          virtualMeetingLink: generateVirtualMeetingLink(pairingRef.id),
        });
        
        // Also add to each user's pairings subcollection for faster queries
        batch.set(
          db.collection('users').doc(pairing.user1.id).collection('pairings').doc(pairingRef.id),
          { pairingId: pairingRef.id, date: admin.firestore.Timestamp.now() }
        );
        batch.set(
          db.collection('users').doc(pairing.user2.id).collection('pairings').doc(pairingRef.id),
          { pairingId: pairingRef.id, date: admin.firestore.Timestamp.now() }
        );
      }
      
      // Handle waitlist users
      for (const waitlistUser of waitlist) {
        // Flag user as on waitlist today
        batch.update(db.collection('users').doc(waitlistUser.id), {
          waitlistedToday: true,
          waitlistedAt: admin.firestore.Timestamp.now(),
          priorityNextPairing: true, // Give priority for tomorrow
        });
      }
      
      // Commit all changes
      await batch.commit();
      
      console.log('Successfully created pairings and updated waitlist');
      
      // Return success with statistics
      return {
        success: true,
        totalUsers: activeUsers.length,
        totalPairings: pairings.length,
        waitlistCount: waitlist.length,
      };
    } catch (error) {
      console.error('Error in pairUsers function:', error);
      return { success: false, error: error.message };
    }
  });

/**
 * Mark expired pairings as flaked at 10:05 PM PT
 * Increments flake streak for users who didn't complete their pairing
 */
export const markExpiredPairingsAsFlaked = functions.pubsub
  .schedule('5 22 * * *') // 10:05 PM PT daily
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    const db = admin.firestore();
    const batch = db.batch();
    
    try {
      console.log('Starting check for expired pairings...');
      
      // Get today's date boundaries
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get all pending pairings from today
      const pendingPairingsSnapshot = await db.collection('pairings')
        .where('date', '>=', admin.firestore.Timestamp.fromDate(today))
        .where('status', '==', 'pending')
        .get();
        
      console.log(`Found ${pendingPairingsSnapshot.size} pending pairings to mark as flaked`);
      
      // Mark each pairing as flaked and increment flake streaks for both users
      for (const pairingDoc of pendingPairingsSnapshot.docs) {
        const pairingData = pairingDoc.data() as Pairing;
        const pairingRef = pairingDoc.ref;
        
        // Mark pairing as flaked
        batch.update(pairingRef, {
          status: 'flaked',
          updatedAt: admin.firestore.Timestamp.now()
        });
        
        // Increment flake streak for each user
        for (const userId of pairingData.users) {
          const userRef = db.collection('users').doc(userId);
          const userDoc = await userRef.get();
          
          if (userDoc.exists) {
            const userData = userDoc.data() as User;
            const newFlakeStreak = (userData.flakeStreak || 0) + 1;
            const maxFlakeStreak = Math.max(userData.maxFlakeStreak || 0, newFlakeStreak);
            
            batch.update(userRef, {
              flakeStreak: newFlakeStreak,
              maxFlakeStreak: maxFlakeStreak,
              updatedAt: admin.firestore.Timestamp.now()
            });
          }
        }
      }
      
      // Commit all the updates
      await batch.commit();
      
      console.log(`Successfully marked ${pendingPairingsSnapshot.size} pairings as flaked`);
      
      return { 
        success: true, 
        flakedCount: pendingPairingsSnapshot.size 
      };
    } catch (error) {
      console.error('Error marking expired pairings as flaked:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  });

/**
 * Send pairing notifications at 7:00 AM PT
 * Notifies users of their daily pairing
 */
export const sendPairingNotifications = functions.pubsub
  .schedule('0 7 * * *')
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    const db = admin.firestore();
    
    try {
      console.log('Starting pairing notifications...');
      
      // Get today's pairings
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const pairingsSnapshot = await db.collection('pairings')
        .where('date', '>=', admin.firestore.Timestamp.fromDate(today))
        .where('status', '==', 'pending')
        .get();
      
      console.log(`Found ${pairingsSnapshot.size} pairings to send notifications for`);
      
      // Process each pairing
      const notifications = [];
      
      for (const pairingDoc of pairingsSnapshot.docs) {
        const pairing = { id: pairingDoc.id, ...pairingDoc.data() } as Pairing;
        
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
      const results = await sendNotificationsInBatches(notifications);
      
      return { 
        success: true, 
        sent: results.successCount,
        failed: results.failureCount
      };
    } catch (error) {
      console.error('Error sending pairing notifications:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  });

/**
 * Send reminder notifications at 3:00 PM PT for incomplete pairings
 */
export const sendReminderNotifications = functions.pubsub
  .schedule('0 15 * * *')
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    const db = admin.firestore();
    
    try {
      console.log('Starting afternoon reminder notifications...');
      
      // Get today's pending pairings
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const pendingPairingsSnapshot = await db.collection('pairings')
        .where('date', '>=', admin.firestore.Timestamp.fromDate(today))
        .where('status', '==', 'pending')
        .get();
      
      console.log(`Found ${pendingPairingsSnapshot.size} pending pairings to send reminders for`);
      
      // Process each pairing
      const notifications = [];
      
      for (const pairingDoc of pendingPairingsSnapshot.docs) {
        const pairing = { id: pairingDoc.id, ...pairingDoc.data() } as Pairing;
        
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
              title: '⏰ Selfie Reminder',
              body: `Don't forget to take a selfie with ${user2.displayName || user2.username} today! You have until 10:00 PM PT.`,
            },
            data: { 
              pairingId: pairing.id, 
              type: 'reminder',
              partnerName: user2.displayName || user2.username 
            },
          });
        }
        
        if (shouldSendNotification(user2, 'reminder') && user2.pushToken) {
          notifications.push({
            token: user2.pushToken,
            notification: {
              title: '⏰ Selfie Reminder',
              body: `Don't forget to take a selfie with ${user1.displayName || user1.username} today! You have until 10:00 PM PT.`,
            },
            data: { 
              pairingId: pairing.id, 
              type: 'reminder',
              partnerName: user1.displayName || user1.username 
            },
          });
        }
      }
      
      console.log(`Sending ${notifications.length} reminder notifications`);
      
      // Send notifications in batches
      const results = await sendNotificationsInBatches(notifications);
      
      return { 
        success: true, 
        sent: results.successCount,
        failed: results.failureCount
      };
    } catch (error) {
      console.error('Error sending reminder notifications:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  });

/**
 * Send final reminder notifications at 7:00 PM PT for incomplete pairings
 */
export const sendFinalReminderNotifications = functions.pubsub
  .schedule('0 19 * * *')
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    const db = admin.firestore();
    
    try {
      console.log('Starting final reminder notifications...');
      
      // Get today's pending pairings
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const pendingPairingsSnapshot = await db.collection('pairings')
        .where('date', '>=', admin.firestore.Timestamp.fromDate(today))
        .where('status', '==', 'pending')
        .get();
      
      console.log(`Found ${pendingPairingsSnapshot.size} pending pairings to send final reminders for`);
      
      // Process each pairing
      const notifications = [];
      
      for (const pairingDoc of pendingPairingsSnapshot.docs) {
        const pairing = { id: pairingDoc.id, ...pairingDoc.data() } as Pairing;
        
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
              title: '🚨 Final Reminder',
              body: `Only 3 hours left to take a selfie with ${user2.displayName || user2.username} today!`,
            },
            data: { 
              pairingId: pairing.id, 
              type: 'final_reminder',
              partnerName: user2.displayName || user2.username,
              urgent: 'true'
            },
          });
        }
        
        if (shouldSendNotification(user2, 'reminder') && user2.pushToken) {
          notifications.push({
            token: user2.pushToken,
            notification: {
              title: '🚨 Final Reminder',
              body: `Only 3 hours left to take a selfie with ${user1.displayName || user1.username} today!`,
            },
            data: { 
              pairingId: pairing.id, 
              type: 'final_reminder',
              partnerName: user1.displayName || user1.username,
              urgent: 'true'
            },
          });
        }
      }
      
      console.log(`Sending ${notifications.length} final reminder notifications`);
      
      // Send notifications in batches
      const results = await sendNotificationsInBatches(notifications);
      
      return { 
        success: true, 
        sent: results.successCount,
        failed: results.failureCount
      };
    } catch (error) {
      console.error('Error sending final reminder notifications:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  });

/**
 * Send notification when a pairing is completed
 */
export const onPairingCompleted = functions.firestore
  .document('pairings/{pairingId}')
  .onUpdate(async (change, context) => {
    const db = admin.firestore();
    
    try {
      const before = change.before.data() as Pairing;
      const after = change.after.data() as Pairing;
      
      // Check if status changed from pending to completed
      if (before.status === 'pending' && after.status === 'completed') {
        console.log(`Pairing ${change.after.id} completed, sending notifications`);
        
        // Get user data for both users
        const [user1Doc, user2Doc] = await Promise.all([
          db.collection('users').doc(after.users[0]).get(),
          db.collection('users').doc(after.users[1]).get(),
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
              pairingId: change.after.id, 
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
              pairingId: change.after.id, 
              type: 'completion'
            },
          });
        }
        
        // Send notifications
        if (notifications.length > 0) {
          await sendNotificationsInBatches(notifications);
        }
        
        return { success: true };
      }
      
      return null;
    } catch (error) {
      console.error('Error in onPairingCompleted function:', error);
      return { success: false, error: error.message };
    }
  });

// Helper functions

/**
 * Shuffle array using Fisher-Yates algorithm
 */
const shuffleArray = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * Get pairing history for last N days
 */
const getPairingHistory = async (days: number): Promise<PairingHistory[]> => {
  const db = admin.firestore();
  const cutoffDate = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  );
  
  const pairingsSnapshot = await db.collection('pairings')
    .where('date', '>', cutoffDate)
    .get();
  
  return pairingsSnapshot.docs.map(doc => ({
    id: doc.id,
    users: doc.data().users,
    date: doc.data().date,
  }));
};

/**
 * Create pairings while avoiding recent repeats
 */
const createPairings = (
  users: User[], 
  history: PairingHistory[]
): { 
  pairings: { user1: User; user2: User }[];
  waitlist: User[];
} => {
  // Sort users to prioritize those who were on waitlist yesterday
  users.sort((a, b) => {
    if (a.priorityNextPairing && !b.priorityNextPairing) return -1;
    if (!a.priorityNextPairing && b.priorityNextPairing) return 1;
    return 0;
  });
  
  const pairings: { user1: User; user2: User }[] = [];
  const paired = new Set<string>();
  const waitlist: User[] = [];
  
  // Create a map of recent pairings for quick lookup
  const recentPairings = new Map<string, Set<string>>();
  
  history.forEach(pairing => {
    const [user1, user2] = pairing.users;
    
    if (!recentPairings.has(user1)) {
      recentPairings.set(user1, new Set());
    }
    if (!recentPairings.has(user2)) {
      recentPairings.set(user2, new Set());
    }
    
    recentPairings.get(user1)?.add(user2);
    recentPairings.get(user2)?.add(user1);
  });
  
  // Try to pair each user
  for (let i = 0; i < users.length; i++) {
    const user1 = users[i];
    
    // Skip if already paired
    if (paired.has(user1.id)) continue;
    
    // Try to find a suitable partner
    let foundPartner = false;
    
    for (let j = 0; j < users.length; j++) {
      if (i === j) continue;
      
      const user2 = users[j];
      
      // Skip if already paired or blocked
      if (paired.has(user2.id)) continue;
      if (user1.blockedIds?.includes(user2.id) || user2.blockedIds?.includes(user1.id)) continue;
      
      // Skip if recently paired
      const recentPartners1 = recentPairings.get(user1.id) || new Set();
      if (recentPartners1.has(user2.id)) continue;
      
      // Create pairing
      pairings.push({ user1, user2 });
      paired.add(user1.id);
      paired.add(user2.id);
      foundPartner = true;
      break;
    }
    
    // Add to waitlist if no partner found
    if (!foundPartner && !paired.has(user1.id)) {
      waitlist.push(user1);
    }
  }
  
  return { pairings, waitlist };
};

/**
 * Generate virtual meeting link
 */
const generateVirtualMeetingLink = (pairingId: string): string => {
  return `https://meet.jitsi.si/DailyMeetupSelfie-${pairingId}`;
};

/**
 * Check if notification should be sent based on settings and quiet hours
 */
const shouldSendNotification = (
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
const sendNotificationsInBatches = async (
  notifications: any[]
): Promise<{ successCount: number; failureCount: number }> => {
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