/**
 * Cloud function that runs daily to check for flaked pairings.
 * Marks pairings as flaked if they are not completed by the end of the day.
 * Increments flake count and streak for users who flaked.
 */
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export const checkFlakesDaily = onSchedule({
  schedule: '1 22 * * *', // Run at 22:01 PT daily (10:01 PM)
  timeZone: 'America/Los_Angeles',
}, async (event) => {
  const db = admin.firestore();
  
  // Get today's date at the start of the day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get today's date at the end of the day
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  
  // Query for pairings that expired today but aren't completed
  const pairingsQuery = await db.collection('pairings')
    .where('date', '>=', Timestamp.fromDate(today))
    .where('date', '<=', Timestamp.fromDate(todayEnd))
    .where('status', 'not-in', ['completed']) // Any status other than completed
    .get();
  
  if (pairingsQuery.empty) {
    console.log('No expired pairings found for today');
    return;
  }
  
  const batch = db.batch();
  const userFlakeCounts = new Map(); // Track flake counts for users
  
  // Process each pairing
  pairingsQuery.forEach(doc => {
    const pairingData = doc.data();
    
    // Skip pairings that are already flaked or snoozed
    if (pairingData.status === 'flaked') {
      return;
    }
    
    // Mark pairing as flaked
    batch.update(doc.ref, { 
      status: 'flaked', 
      flakedAt: admin.firestore.FieldValue.serverTimestamp() 
    });
    
    // Determine which users flaked
    const flakers = new Set<string>();
    
    // If user1 didn't submit
    if (!pairingData.user1_submittedAt && pairingData.user1_id) {
      flakers.add(pairingData.user1_id);
    }
    
    // If user2 didn't submit
    if (!pairingData.user2_submittedAt && pairingData.user2_id) {
      flakers.add(pairingData.user2_id);
    }
    
    // If neither submitted photos, both are flakers
    if (!pairingData.user1_submittedAt && !pairingData.user2_submittedAt) {
      pairingData.users.forEach((userId: string) => flakers.add(userId));
    }
    
    // Update user flake counts
    flakers.forEach(userId => {
      userFlakeCounts.set(
        userId, 
        (userFlakeCounts.get(userId) || 0) + 1
      );
    });
  });
  
  // Update user flake counts in the database
  const userPromises = [];
  
  for (const [userId, flakeCount] of userFlakeCounts.entries()) {
    const userRef = db.collection('users').doc(userId);
    
    // Get current user data to check if we need to update maxFlakeStreak
    const userPromise = userRef.get().then(userDoc => {
      if (userDoc.exists) {
        const userData = userDoc.data() || {};
        const currentStreak = (userData.flakeStreak || 0) + 1;
        const maxStreak = userData.maxFlakeStreak || 0;
        
        batch.update(userRef, {
          flakeCount: admin.firestore.FieldValue.increment(flakeCount),
          flakeStreak: currentStreak,
          maxFlakeStreak: currentStreak > maxStreak ? currentStreak : maxStreak
        });
      }
    });
    
    userPromises.push(userPromise);
  }
  
  // Wait for all user data to be processed
  await Promise.all(userPromises);
  
  // Commit all changes in one batch
  await batch.commit();
  console.log(`Processed ${pairingsQuery.size} expired pairings, updated ${userFlakeCounts.size} user flake counts`);
});
