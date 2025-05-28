/**
 * Debug script to test pairing function logic
 * Run with: npm run debug
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();

async function debugPairingFunction() {
  const db = admin.firestore();
  
  try {
    console.log('🔍 Testing database connectivity and query...');
    
    // Test the query that was failing
    const activeUsersSnapshot = await db.collection('users')
      .where('isActive', '==', true)
      .where('lastActive', '>', admin.firestore.Timestamp.fromDate(
        new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      ))
      .where('flakeStreak', '<', 5) // Skip users with high flake streak
      .get();
    
    console.log(`✅ Query successful! Found ${activeUsersSnapshot.size} active users`);
    
    if (activeUsersSnapshot.size > 0) {
      console.log('📝 Sample users:');
      activeUsersSnapshot.docs.slice(0, 3).forEach(doc => {
        const userData = doc.data();
        console.log(`  - ${userData.username} (${userData.email}), last active: ${userData.lastActive?.toDate()}, flake streak: ${userData.flakeStreak || 0}`);
      });
    }
    
    // Test pairings query
    console.log('\n🔍 Testing pairings query...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const pairingsSnapshot = await db.collection('pairings')
      .where('date', '>=', admin.firestore.Timestamp.fromDate(today))
      .where('status', '==', 'pending')
      .get();
    
    console.log(`✅ Pairings query successful! Found ${pairingsSnapshot.size} pending pairings today`);
    
    if (pairingsSnapshot.size > 0) {
      console.log('📝 Sample pairings:');
      pairingsSnapshot.docs.slice(0, 3).forEach(doc => {
        const pairingData = doc.data();
        console.log(`  - Pairing ${doc.id}: users [${pairingData.users.join(', ')}], status: ${pairingData.status}`);
      });
    }
    
    console.log('\n✅ All database queries working! The indexes are properly deployed.');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error testing database:', error);
    if (error instanceof Error && error.message.includes('index')) {
      console.log('🔧 Indexes are still building. Please wait a few minutes and try again.');
    }
    process.exit(1);
  }
}

debugPairingFunction(); 