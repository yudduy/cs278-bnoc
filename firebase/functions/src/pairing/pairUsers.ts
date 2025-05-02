/**
 * Daily User Pairing Function
 * 
 * Cloud Function that runs daily at 5:00 AM PT to:
 * 1. Get active users who are eligible for pairing
 * 2. Match users into pairs, avoiding recent repeats
 * 3. Create pairing documents in Firestore
 * 4. Handle waitlist for odd number of users
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

// Firestore database reference
const db = admin.firestore();

/**
 * Interface for User data from Firestore
 */
interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  photoURL?: string;
  lastActive: Timestamp;
  isActive: boolean;
  flakeStreak: number;
  blockedIds: string[];
}

/**
 * Interface for PairingHistory data
 */
interface PairingHistory {
  userId: string;
  pairedWith: Array<{
    userId: string;
    date: Timestamp;
    status: 'completed' | 'flaked';
  }>;
}

/**
 * Interface for a new Pairing
 */
interface Pairing {
  id?: string;
  date: Timestamp;
  expiresAt: Timestamp;
  users: string[];
  status: 'pending' | 'completed' | 'flaked';
  isPrivate: boolean;
  likes: number;
  likedBy: string[];
  comments: any[];
  virtualMeetingLink?: string;
  createdAt: Timestamp;
}

/**
 * Helper function to shuffle an array using Fisher-Yates algorithm
 * @param array - Array to shuffle
 * @returns Shuffled copy of the array
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Helper function to check if two users have been paired recently
 * @param userId1 - First user ID
 * @param userId2 - Second user ID
 * @param history - Map of pairing history by user ID
 * @param daysToCheck - Number of past days to check
 * @returns Boolean indicating if users were recently paired
 */
async function wereRecentlyPaired(
  userId1: string,
  userId2: string,
  history: Map<string, PairingHistory>,
  daysToCheck: number = 7
): Promise<boolean> {
  const user1History = history.get(userId1);
  if (!user1History) return false;
  
  const now = admin.firestore.Timestamp.now();
  const cutoffDate = new Date(now.toDate().getTime() - daysToCheck * 24 * 60 * 60 * 1000);
  const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffDate);
  
  // Check if users were paired within the cutoff period
  return user1History.pairedWith.some(pairing => 
    pairing.userId === userId2 && pairing.date.toDate() >= cutoffTimestamp.toDate()
  );
}

/**
 * Generate a virtual meeting link for the pairing
 */
function generateVirtualMeetingLink(pairingId: string): string {
  return `https://meet.jitsi.si/DailyMeetupSelfie-${pairingId}`;
}

/**
 * Cloud Function that runs daily to create pairings between users
 */
export const pairUsers = functions.pubsub
  .schedule('0 5 * * *') // Run at 5:00 AM every day
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    const batch = db.batch();
    const pairingDate = admin.firestore.Timestamp.now();
    
    // Calculate expiration time (10:00 PM PT today)
    const expiresAt = new Date(pairingDate.toDate());
    expiresAt.setHours(22, 0, 0, 0); // 10:00 PM
    const expirationTimestamp = admin.firestore.Timestamp.fromDate(expiresAt);
    
    const pairingResults = {
      totalUsers: 0,
      activePaired: 0,
      waitlisted: 0,
      skipped: 0,
    };
    
    try {
      // Get active users
      const activeUsersSnapshot = await db.collection('users')
        .where('isActive', '==', true)
        .where('lastActive', '>', admin.firestore.Timestamp.fromDate(
          new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
        ))
        .where('flakeStreak', '<', 5) // Skip users with high flake streak
        .get();
      
      if (activeUsersSnapshot.empty) {
        console.log('No active users found for pairing');
        return { success: true, message: 'No active users to pair', results: pairingResults };
      }
      
      // Transform to array of users with their IDs
      const activeUsers: User[] = activeUsersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
      
      pairingResults.totalUsers = activeUsers.length;
      
      // Get all users' pairing history
      const historyMap = new Map<string, PairingHistory>();
      for (const user of activeUsers) {
        const historyDoc = await db.collection('pairingHistory').doc(user.id).get();
        if (historyDoc.exists) {
          historyMap.set(user.id, historyDoc.data() as PairingHistory);
        } else {
          // Create empty history if none exists
          historyMap.set(user.id, {
            userId: user.id,
            pairedWith: []
          });
        }
      }
      
      // Get users who were waitlisted yesterday (they get priority today)
      const waitlistDoc = await db.collection('system').doc('waitlist').get();
      const waitlist = waitlistDoc.exists ? waitlistDoc.data()?.userIds || [] : [];
      console.log(`${waitlist.length} users on waitlist from yesterday`);
      
      // Create a new waitlist for today (will be populated as we go)
      const newWaitlist: string[] = [];
      
      // First, add waitlisted users to the active pool with priority
      const waitlistedUsers: User[] = [];
      const regularUsers: User[] = [];
      
      for (const user of activeUsers) {
        if (waitlist.includes(user.id)) {
          waitlistedUsers.push(user);
        } else {
          regularUsers.push(user);
        }
      }
      
      // Shuffle both lists for randomness
      const shuffledRegularUsers = shuffleArray(regularUsers);
      
      // Combine lists with waitlisted users first
      const orderedUsers = [...waitlistedUsers, ...shuffledRegularUsers];
      
      // Create pairs, avoiding recently paired users and respecting blocks
      const pairs: [User, User][] = [];
      const pairedUserIds = new Set<string>();
      
      // For each user, try to find a match
      for (let i = 0; i < orderedUsers.length; i++) {
        const user1 = orderedUsers[i];
        
        // Skip if already paired today
        if (pairedUserIds.has(user1.id)) continue;
        
        let foundMatch = false;
        
        // Look for a match among remaining users
        for (let j = i + 1; j < orderedUsers.length; j++) {
          const user2 = orderedUsers[j];
          
          // Skip if already paired today
          if (pairedUserIds.has(user2.id)) continue;
          
          // Skip if either user has blocked the other
          if (
            user1.blockedIds?.includes(user2.id) || 
            user2.blockedIds?.includes(user1.id)
          ) {
            continue;
          }
          
          // Skip if recently paired
          const recentlyPaired = await wereRecentlyPaired(user1.id, user2.id, historyMap);
          if (recentlyPaired) continue;
          
          // Found a match!
          pairs.push([user1, user2]);
          pairedUserIds.add(user1.id);
          pairedUserIds.add(user2.id);
          foundMatch = true;
          break;
        }
        
        // If no match found, add to waitlist
        if (!foundMatch && !pairedUserIds.has(user1.id)) {
          newWaitlist.push(user1.id);
          pairingResults.waitlisted++;
        }
      }
      
      // Create pairing documents
      for (const [user1, user2] of pairs) {
        const pairingRef = db.collection('pairings').doc();
        const pairing: Pairing = {
          date: pairingDate,
          expiresAt: expirationTimestamp,
          users: [user1.id, user2.id],
          status: 'pending',
          isPrivate: false,
          likes: 0,
          likedBy: [],
          comments: [],
          virtualMeetingLink: generateVirtualMeetingLink(pairingRef.id),
          createdAt: pairingDate
        };
        
        batch.set(pairingRef, pairing);
        
        // Create denormalized copies in each user's feed
        batch.set(
          db.collection('users').doc(user1.id).collection('feed').doc(pairingRef.id),
          { pairingId: pairingRef.id, date: pairingDate }
        );
        
        batch.set(
          db.collection('users').doc(user2.id).collection('feed').doc(pairingRef.id),
          { pairingId: pairingRef.id, date: pairingDate }
        );
        
        // Update pairing history
        const user1History = historyMap.get(user1.id) || { userId: user1.id, pairedWith: [] };
        const user2History = historyMap.get(user2.id) || { userId: user2.id, pairedWith: [] };
        
        user1History.pairedWith.push({
          userId: user2.id,
          date: pairingDate,
          status: 'pending'
        });
        
        user2History.pairedWith.push({
          userId: user1.id,
          date: pairingDate,
          status: 'pending'
        });
        
        batch.set(db.collection('pairingHistory').doc(user1.id), user1History);
        batch.set(db.collection('pairingHistory').doc(user2.id), user2History);
        
        pairingResults.activePaired += 2; // Count both users
      }
      
      // Update waitlist for tomorrow
      batch.set(db.collection('system').doc('waitlist'), {
        userIds: newWaitlist,
        updatedAt: pairingDate
      });
      
      // Commit all changes in one batch
      await batch.commit();
      
      return { 
        success: true, 
        message: `Created ${pairs.length} pairings`,
        results: pairingResults
      };
    } catch (error) {
      console.error('Error in pairUsers function:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        results: pairingResults
      };
    }
  });

/**
 * Cloud Function that runs at 10:05 PM PT to mark expired pairings as flaked
 */
export const markExpiredPairingsAsFlaked = functions.pubsub
  .schedule('5 22 * * *')  // 10:05 PM PT daily
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    console.log('Running markExpiredPairingsAsFlaked function');
    
    try {
      // Get today's date boundaries
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = admin.firestore.Timestamp.fromDate(today);
      
      // Get current time
      const now = admin.firestore.Timestamp.now();
      
      // Get all pending pairings from today
      const pendingPairingsSnapshot = await db.collection('pairings')
        .where('date', '>=', todayTimestamp)
        .where('status', '==', 'pending')
        .get();
        
      console.log(`Found ${pendingPairingsSnapshot.size} pending pairings to mark as flaked`);
      
      // No pairings to process
      if (pendingPairingsSnapshot.empty) {
        return { success: true, flakedCount: 0 };
      }
      
      // Process in batches to avoid exceeding limits
      const batchSize = 450; // Firestore limit is 500 operations per batch
      let operationsCount = 0;
      let currentBatch = db.batch();
      let flakedCount = 0;
      
      // Process each pairing
      for (const pairingDoc of pendingPairingsSnapshot.docs) {
        const pairingData = pairingDoc.data() as Pairing;
        const pairingRef = pairingDoc.ref;
        
        // Mark pairing as flaked
        currentBatch.update(pairingRef, {
          status: 'flaked',
          updatedAt: now
        });
        operationsCount++;
        
        // Increment flake streak for each user
        for (const userId of pairingData.users) {
          const userRef = db.collection('users').doc(userId);
          
          currentBatch.update(userRef, {
            flakeStreak: FieldValue.increment(1),
            maxFlakeStreak: admin.firestore.FieldValue.increment(1), // This is simplified, should really compare with current max
            updatedAt: now
          });
          operationsCount += 2; // Two operations: increments count as separate operations
          
          // Commit batch if approaching limit
          if (operationsCount >= batchSize) {
            await currentBatch.commit();
            currentBatch = db.batch();
            operationsCount = 0;
          }
        }
        
        flakedCount++;
      }
      
      // Commit any remaining operations
      if (operationsCount > 0) {
        await currentBatch.commit();
      }
      
      return { 
        success: true, 
        flakedCount
      };
    } catch (error) {
      console.error('Error marking expired pairings as flaked:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });