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
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
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
    
    // Check Today's Pairings
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
      
      todaysPairings.forEach(doc => {
        const pairing = doc.data();
        const status = pairing.status;
        
        if (!pairingsByStatus[status]) {
          pairingsByStatus[status] = 0;
        }
        pairingsByStatus[status]++;
        
        pairingDetails.push({
          id: doc.id.substring(0, 8) + '...',
          user1: pairing.user1_id,
          user2: pairing.user2_id,
          status: pairing.status,
          expires: pairing.expiresAt?.toDate?.() || 'Unknown'
        });
      });
      
      console.log('   Status breakdown:');
      Object.entries(pairingsByStatus).forEach(([status, count]) => {
        console.log(`     - ${status}: ${count}`);
      });
      
      console.log('\n   Pairing details:');
      pairingDetails.forEach(p => {
        console.log(`     ${p.user1} + ${p.user2} | ${p.status} | Expires: ${p.expires}`);
      });
    } else {
      console.log('   ❌ No pairings found for today!');
      console.log('   💡 Run "node manualPairing.js" to create test pairings');
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
