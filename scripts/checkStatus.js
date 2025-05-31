const admin = require('firebase-admin');

// Quick Database Status Check Script
// This script helps verify the current state of your BNOC Firebase database

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

async function checkDatabaseStatus() {
  console.log('=== BNOC Database Status Check ===\n');
  
  try {
    // Check Users
    console.log('👥 USERS STATUS:');
    const usersSnapshot = await db.collection('users').get();
    console.log(`   Total users: ${usersSnapshot.size}`);
    
    const activeUsers = [];
    const userMap = {}; // Create a map for user lookups
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      userMap[doc.id] = userData; // Store in map for later use
      if (userData.isActive) {
        activeUsers.push({
          id: doc.id,
          username: userData.username,
          email: userData.email,
          lastActive: userData.lastActive?.toDate?.() || 'Unknown'
        });
      }
    });
    
    console.log(`   Active users: ${activeUsers.length}`);
    activeUsers.forEach(user => {
      console.log(`     - ${user.username} (${user.email}) - Last active: ${user.lastActive}`);
    });
    
    // Check Today's Pairings with enhanced debugging
    console.log('\n🤝 TODAY\'S PAIRINGS:');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysPairings = await db.collection('pairings')
      .where('date', '>=', admin.firestore.Timestamp.fromDate(today))
      .get();
    
    console.log(`   Total pairings today: ${todaysPairings.size}`);
    
    if (todaysPairings.size > 0) {
      const pairingsByStatus = {};
      const pairingDetails = [];
      const invalidPairings = [];
      
      todaysPairings.forEach(doc => {
        const pairing = doc.data();
        const status = pairing.status;
        
        if (!pairingsByStatus[status]) {
          pairingsByStatus[status] = 0;
        }
        pairingsByStatus[status]++;
        
        // Enhanced pairing debugging
        const user1_id = pairing.user1_id;
        const user2_id = pairing.user2_id;
        const users_array = pairing.users;
        
        // Check data integrity
        let dataIntegrityIssues = [];
        if (!user1_id) dataIntegrityIssues.push('missing user1_id');
        if (!user2_id) dataIntegrityIssues.push('missing user2_id');
        if (!users_array || !Array.isArray(users_array)) dataIntegrityIssues.push('missing/invalid users array');
        if (users_array && Array.isArray(users_array) && users_array.length !== 2) dataIntegrityIssues.push(`users array length: ${users_array.length}`);
        
        // Check if users exist
        const user1_exists = user1_id && userMap[user1_id];
        const user2_exists = user2_id && userMap[user2_id];
        if (user1_id && !user1_exists) dataIntegrityIssues.push('user1 does not exist');
        if (user2_id && !user2_exists) dataIntegrityIssues.push('user2 does not exist');
        
        const user1_username = user1_exists ? (userMap[user1_id].username || userMap[user1_id].displayName || 'unknown') : 'missing';
        const user2_username = user2_exists ? (userMap[user2_id].username || userMap[user2_id].displayName || 'unknown') : 'missing';
        
        const pairingDetail = {
          id: doc.id.substring(0, 8) + '...',
          user1_id: user1_id || 'undefined',
          user2_id: user2_id || 'undefined',
          user1_username,
          user2_username,
          users_array: users_array || 'undefined',
          status: pairing.status,
          expires: pairing.expiresAt?.toDate?.() || 'Unknown',
          photoMode: pairing.photoMode || 'not set',
          hasPhotos: {
            user1: !!pairing.user1_photoURL,
            user2: !!pairing.user2_photoURL
          },
          dataIntegrityIssues
        };
        
        if (dataIntegrityIssues.length > 0) {
          invalidPairings.push(pairingDetail);
        }
        
        pairingDetails.push(pairingDetail);
      });
      
      console.log('   Status breakdown:');
      Object.entries(pairingsByStatus).forEach(([status, count]) => {
        console.log(`     - ${status}: ${count}`);
      });
      
      console.log('\n   📊 DETAILED PAIRING ANALYSIS:');
      pairingDetails.forEach(p => {
        console.log(`     ${p.id}: ${p.user1_username} + ${p.user2_username} | ${p.status} | Mode: ${p.photoMode}`);
        console.log(`       Photos: U1=${p.hasPhotos.user1}, U2=${p.hasPhotos.user2} | Expires: ${p.expires}`);
        if (p.dataIntegrityIssues.length > 0) {
          console.log(`       ⚠️  Issues: ${p.dataIntegrityIssues.join(', ')}`);
        }
      });
      
      if (invalidPairings.length > 0) {
        console.log(`\n   ❌ FOUND ${invalidPairings.length} PAIRINGS WITH DATA INTEGRITY ISSUES:`);
        invalidPairings.forEach(p => {
          console.log(`     ${p.id}: ${p.dataIntegrityIssues.join(', ')}`);
          console.log(`       Raw data: user1_id=${p.user1_id}, user2_id=${p.user2_id}, users=${JSON.stringify(p.users_array)}`);
        });
      }
      
    } else {
      console.log('   ❌ No pairings found for today!');
      console.log('   💡 Run "node manualPairing.js" to create test pairings');
    }
    
    // Test getCurrentPairing function for each active user
    console.log('\n🔍 TESTING getCurrentPairing FUNCTION:');
    for (const user of activeUsers) {
      console.log(`   Testing getCurrentPairing for user: ${user.username} (${user.id})`);
      
      // Simulate the getCurrentPairing query
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const userPairingsQuery = await db.collection('pairings')
        .where('users', 'array-contains', user.id)
        .where('date', '>=', admin.firestore.Timestamp.fromDate(today))
        .orderBy('date', 'desc')
        .limit(1)
        .get();
      
      if (!userPairingsQuery.empty) {
        const pairingDoc = userPairingsQuery.docs[0];
        const pairingData = pairingDoc.data();
        console.log(`     ✅ Found pairing: ${pairingDoc.id}`);
        console.log(`       Status: ${pairingData.status}, Users: ${JSON.stringify(pairingData.users)}`);
        console.log(`       user1_id: ${pairingData.user1_id}, user2_id: ${pairingData.user2_id}`);
        
        // Validate users array
        if (!pairingData.users || !Array.isArray(pairingData.users) || !pairingData.users.includes(user.id)) {
          console.log(`     ⚠️  WARNING: User ${user.id} not properly included in users array`);
        }
      } else {
        console.log(`     ❌ No pairing found for ${user.username}`);
      }
    }
    
    // Check Global Feed
    console.log('\n📱 GLOBAL FEED:');
    const globalFeedSnapshot = await db.collection('globalFeed').get();
    console.log(`   Total feed items: ${globalFeedSnapshot.size}`);
    
    // Check Chat Rooms
    console.log('\n💬 CHAT ROOMS:');
    const chatRoomsSnapshot = await db.collection('chatRooms').get();
    console.log(`   Total chat rooms: ${chatRoomsSnapshot.size}`);
    
    // Check Notifications
    console.log('\n🔔 NOTIFICATIONS:');
    const notificationsSnapshot = await db.collection('notifications').get();
    console.log(`   Total notifications: ${notificationsSnapshot.size}`);
    
    const unreadNotifications = [];
    notificationsSnapshot.forEach(doc => {
      const notification = doc.data();
      if (!notification.read) {
        unreadNotifications.push({
          userId: notification.userId,
          type: notification.type,
          title: notification.title,
          createdAt: notification.createdAt?.toDate?.() || 'Unknown'
        });
      }
    });
    
    console.log(`   Unread notifications: ${unreadNotifications.length}`);
    if (unreadNotifications.length > 0) {
      unreadNotifications.forEach(notif => {
        console.log(`     - ${notif.userId}: ${notif.type} - "${notif.title}"`);
      });
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`   ✅ ${activeUsers.length} active users`);
    console.log(`   ✅ ${todaysPairings.size} pairings today`);
    console.log(`   ✅ ${globalFeedSnapshot.size} feed items`);
    console.log(`   ✅ ${chatRoomsSnapshot.size} chat rooms`);
    console.log(`   ✅ ${unreadNotifications.length} unread notifications`);
    
    if (todaysPairings.size === 0) {
      console.log('\n⚠️  NO PAIRINGS FOR TODAY!');
      console.log('   Run: node manualPairing.js');
    } else {
      console.log('\n🎉 Database looks good for testing!');
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
}

async function main() {
  await checkDatabaseStatus();
  process.exit(0);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { checkDatabaseStatus };
