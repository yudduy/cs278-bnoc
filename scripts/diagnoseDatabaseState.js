const admin = require('firebase-admin');

// Initialize Firebase Admin
try {
  const serviceAccount = require('../serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error.message);
  process.exit(1);
}

const db = admin.firestore();

async function diagnoseDatabaseState() {
  console.log('\n=== BNOC Database Diagnostic ===\n');
  
  try {
    // Check users collection
    const usersSnapshot = await db.collection('users').limit(5).get();
    console.log(`📊 Users Collection: ${usersSnapshot.size} documents found`);
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${doc.id}: ${data.email} (${data.username})`);
    });
    
    // Check pairings collection
    const pairingsSnapshot = await db.collection('pairings').limit(5).get();
    console.log(`\n📊 Pairings Collection: ${pairingsSnapshot.size} documents found`);
    
    pairingsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${doc.id}: ${data.user1_id} + ${data.user2_id} (${data.status})`);
    });
    
    // Check chatRooms collection
    const chatRoomsSnapshot = await db.collection('chatRooms').limit(5).get();
    console.log(`\n📊 ChatRooms Collection: ${chatRoomsSnapshot.size} documents found`);
    
    // Check data type issues
    console.log('\n=== Data Type Issues ===');
    const user = usersSnapshot.docs[0]?.data();
    if (user) {
      console.log('Connections type:', typeof user.connections, user.connections);
      console.log('BlockedIds type:', typeof user.blockedIds, user.blockedIds);
      console.log('NotificationSettings type:', typeof user.notificationSettings);
    }
    
    console.log('\n✅ Your database has data! The script worked.');
    console.log('🔧 You may need to fix data type inconsistencies.');
    
  } catch (error) {
    console.error('❌ Error reading database:', error);
  }
}

diagnoseDatabaseState().then(() => {
  console.log('\n=== Diagnostic Complete ===');
  process.exit(0);
}).catch(error => {
  console.error('Diagnostic failed:', error);
  process.exit(1);
});
