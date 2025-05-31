/**
 * Test Auto-Pairing Script
 * 
 * Quick script to test the auto-pairing functionality manually.
 * Useful for debugging auto-pairing issues.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK (if not already initialized)
if (!admin.apps.length) {
  const serviceAccount = require('../config/serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://your-project-id.firebaseio.com"
  });
}

const db = admin.firestore();

const testAutoPairing = async (userId) => {
  console.log('🧪 Testing auto-pairing for user:', userId);
  
  try {
    // Check if user exists
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.error('❌ User not found:', userId);
      return false;
    }
    
    const userData = userDoc.data();
    console.log('✅ User found:', userData.username || userData.displayName);
    
    // Check if user already has a pairing today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const pairingsQuery = db.collection('pairings')
      .where('users', 'array-contains', userId)
      .where('date', '>=', admin.firestore.Timestamp.fromDate(today));
    
    const pairingsSnapshot = await pairingsQuery.get();
    
    if (!pairingsSnapshot.empty) {
      console.log('ℹ️ User already has pairing(s) today:');
      pairingsSnapshot.forEach(doc => {
        const pairing = doc.data();
        console.log(`  - Pairing ${doc.id}: status=${pairing.status}, users=${pairing.users}`);
      });
      return true;
    }
    
    console.log('📅 User needs pairing today');
    
    // Check if jleong222 exists
    const jleongQuery = db.collection('users').where('username', '==', 'jleong222');
    const jleongSnapshot = await jleongQuery.get();
    
    if (jleongSnapshot.empty) {
      console.log('⚠️ jleong222 not found - would create test account');
    } else {
      const jleongUser = jleongSnapshot.docs[0];
      console.log('✅ Found jleong222:', jleongUser.id);
      
      // Check if jleong222 is available
      const jleongPairingsQuery = db.collection('pairings')
        .where('users', 'array-contains', jleongUser.id)
        .where('date', '>=', admin.firestore.Timestamp.fromDate(today))
        .where('status', 'in', ['pending', 'user1_submitted', 'user2_submitted']);
      
      const jleongPairingsSnapshot = await jleongPairingsQuery.get();
      
      if (jleongPairingsSnapshot.empty) {
        console.log('✅ jleong222 is available - would pair with them');
      } else {
        console.log('⏰ jleong222 is busy - would create test account');
      }
    }
    
    console.log('🎯 Auto-pairing test completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Error testing auto-pairing:', error);
    return false;
  }
};

// Main execution
const main = async () => {
  const userId = process.argv[2];
  
  if (!userId) {
    console.log('Usage: node testAutoPairing.js <userId>');
    console.log('Example: node testAutoPairing.js abc123def456');
    process.exit(1);
  }
  
  const success = await testAutoPairing(userId);
  process.exit(success ? 0 : 1);
};

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n👋 Test terminated by user');
  process.exit(0);
});

main().catch(console.error); 