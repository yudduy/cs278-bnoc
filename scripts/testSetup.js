const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

// Comprehensive Test Setup Script for BNOC App Testing
// Creates test users, pairings, and sample data for app development

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
const auth = admin.auth();

// Test users with known passwords for testing
const testUsers = [
  {
    email: 'duynguy@stanford.edu',
    password: 'hardcarry1738',
    username: 'duy',
    displayName: 'Duy Nguyen',
    photoURL: 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fduy.png?alt=media&token=34c26f11-830d-437d-a57c-ee7c6b7f0a05'
  },
  {
    email: 'jleong22@stanford.edu',
    password: 'abbabb6969',
    username: 'justin',
    displayName: 'Justin Leong',
    photoURL: 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fjustin.png?alt=media&token=50b948ef-8e64-4d6c-a109-ed76366c8c0c'
  },
  {
    email: 'kelvinknguyen@stanford.edu',
    password: 'seaside123',
    username: 'kelvin',
    displayName: 'Kelvin Nguyen',
    photoURL: 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fkelvin.png?alt=media&token=9dfee19b-79ef-4533-88e6-8a7b10e85dd7'
  },
  {
    email: 'ehsu24@stanford.edu',
    password: 'goodta',
    username: 'emily',
    displayName: 'Emily Hsu',
    photoURL: 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Femily.jpeg?alt=media&token=5957b31c-9351-4734-b59d-63444c6e6dac'
  },
  {
    email: 'mb@stanford.edu',
    password: 'goodteacher',
    username: 'michael',
    displayName: 'Michael Bernstein',
    photoURL: 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fmb.jpeg?alt=media&token=e6e88f85-a09d-45cc-b6a4-cad438d1b2f6'
  }
];

/**
 * Create Firebase Auth user and Firestore profile
 */
async function createTestUser(userData) {
  try {
    // Check if user already exists
    try {
      const existingUser = await auth.getUserByEmail(userData.email);
      console.log(`   ⚠️  User already exists: ${userData.email}`);
      return { success: true, uid: existingUser.uid, created: false };
    } catch (error) {
      if (error.code !== 'auth/user-not-found') throw error;
    }
    
    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName,
      photoURL: userData.photoURL || null,
      emailVerified: true // Set as verified for testing
    });
    
    // Create Firestore profile
    await db.collection('users').doc(userRecord.uid).set({
      email: userData.email,
      username: userData.username,
      displayName: userData.displayName,
      photoURL: userData.photoURL || null,
      isActive: true,
      flakeStreak: 0,
      maxFlakeStreak: 0,
      connections: [],
      blockedIds: [],
      notificationSettings: {
        pairingNotification: true,
        reminderNotification: true,
        chatNotification: true,
        partnerPhotoSubmittedNotification: true,
        socialNotifications: true,
        completionNotification: true,
        quietHoursStart: 22,
        quietHoursEnd: 8
      },
      privacySettings: {
        globalFeedOptIn: true
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActive: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      fcmToken: null,
      pushToken: null,
      snoozeTokensRemaining: 1
    });
    
    console.log(`   ✅ Created: ${userData.username} (${userData.email})`);
    return { success: true, uid: userRecord.uid, created: true };
    
  } catch (error) {
    console.error(`   ❌ Failed to create ${userData.email}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Create friend connections between users
 */
async function createFriendConnections(userIds) {
  console.log('\n👥 Setting up friend connections...');
  
  if (userIds.length === 0) {
    console.log('   ⚠️  No user IDs provided for friend connections');
    return;
  }
  
  console.log(`   📋 User IDs to connect: ${userIds.join(', ')}`);
  
  const batch = db.batch();
  
  // Make everyone friends with everyone for testing
  for (let i = 0; i < userIds.length; i++) {
    const user1Id = userIds[i];
    const connections = userIds.filter(id => id !== user1Id); // All other users
    
    // Verify user document exists before updating
    try {
      const userDoc = await db.collection('users').doc(user1Id).get();
      if (!userDoc.exists) {
        console.log(`   ❌ User document does not exist: ${user1Id}`);
        continue;
      }
      
      const userRef = db.collection('users').doc(user1Id);
      batch.update(userRef, { connections });
      
      console.log(`   🤝 ${user1Id.substring(0, 8)}...: Connected to ${connections.length} friends`);
    } catch (error) {
      console.error(`   ❌ Error checking user ${user1Id}:`, error.message);
      continue;
    }
  }
  
  try {
    await batch.commit();
    console.log('   ✅ Friend connections created');
  } catch (error) {
    console.error('   ❌ Error committing friend connections:', error.message);
    throw error;
  }
}

/**
 * Create test pairings with different statuses
 */
async function createTestPairings(userIds) {
  console.log('\n🤝 Creating test pairings...');
  
  if (userIds.length < 4) {
    console.log('   ⚠️  Need at least 4 users to create meaningful pairings');
    return;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  const pairings = [
    // Today's pairing - pending
    {
      date: today,
      user1_id: userIds[0],
      user2_id: userIds[1],
      status: 'pending',
      description: 'Today - Pending (test photo submission)'
    },
    
    // Yesterday's pairing - one user submitted
    {
      date: yesterday,
      user1_id: userIds[2],
      user2_id: userIds[3],
      status: 'user1_submitted',
      user1_photoURL: 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fkelvin.png?alt=media&token=sample',
      user1_submittedAt: admin.firestore.Timestamp.fromDate(new Date(yesterday.getTime() + 2 * 60 * 60 * 1000)),
      description: 'Yesterday - Partial submission'
    },
    
    // Two days ago - completed
    {
      date: twoDaysAgo,
      user1_id: userIds[0],
      user2_id: userIds[2],
      status: 'completed',
      user1_photoURL: 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fduy.png?alt=media&token=sample1',
      user2_photoURL: 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fkelvin.png?alt=media&token=sample2',
      user1_submittedAt: admin.firestore.Timestamp.fromDate(new Date(twoDaysAgo.getTime() + 3 * 60 * 60 * 1000)),
      user2_submittedAt: admin.firestore.Timestamp.fromDate(new Date(twoDaysAgo.getTime() + 4 * 60 * 60 * 1000)),
      completedAt: admin.firestore.Timestamp.fromDate(new Date(twoDaysAgo.getTime() + 4 * 60 * 60 * 1000)),
      likesCount: 2,
      likedBy: [userIds[1], userIds[3]],
      commentsCount: 1,
      description: 'Two days ago - Completed with likes'
    }
  ];
  
  for (const pairingData of pairings) {
    const pairingId = uuidv4();
    const expiresAt = new Date(pairingData.date);
    expiresAt.setHours(22, 0, 0, 0);
    
    const pairing = {
      id: pairingId,
      date: admin.firestore.Timestamp.fromDate(pairingData.date),
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      users: [pairingData.user1_id, pairingData.user2_id],
      user1_id: pairingData.user1_id,
      user2_id: pairingData.user2_id,
      status: pairingData.status,
      user1_photoURL: pairingData.user1_photoURL || null,
      user2_photoURL: pairingData.user2_photoURL || null,
      user1_submittedAt: pairingData.user1_submittedAt || null,
      user2_submittedAt: pairingData.user2_submittedAt || null,
      completedAt: pairingData.completedAt || null,
      chatId: `chat_${pairingId}`,
      likesCount: pairingData.likesCount || 0,
      likedBy: pairingData.likedBy || [],
      commentsCount: pairingData.commentsCount || 0,
      isPrivate: false,
      virtualMeetingLink: `https://meet.jitsi.si/DailyMeetupSelfie-${pairingId}`,
      lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('pairings').doc(pairingId).set(pairing);
    
    // Create chat room
    await db.collection('chatRooms').doc(`chat_${pairingId}`).set({
      id: `chat_${pairingId}`,
      pairingId: pairingId,
      userIds: [pairingData.user1_id, pairingData.user2_id],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastMessage: null,
      lastActivityAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Add to global feed if completed
    if (pairingData.status === 'completed') {
      await db.collection('globalFeed').doc(pairingId).set({
        pairingId: pairingId,
        date: admin.firestore.Timestamp.fromDate(pairingData.date),
        users: [pairingData.user1_id, pairingData.user2_id],
        user1_photoURL: pairingData.user1_photoURL,
        user2_photoURL: pairingData.user2_photoURL,
        likesCount: pairingData.likesCount || 0,
        commentsCount: pairingData.commentsCount || 0,
        isPrivate: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    console.log(`   ✅ ${pairingData.description} - ID: ${pairingId}`);
  }
}

/**
 * Add sample comments to completed pairings
 */
async function addSampleComments(userIds) {
  console.log('\n💬 Adding sample comments...');
  
  try {
    // Find completed pairings
    const completedPairings = await db.collection('pairings')
      .where('status', '==', 'completed')
      .limit(1)
      .get();
    
    if (completedPairings.empty) {
      console.log('   ⚠️  No completed pairings found');
      return;
    }
    
    const pairingDoc = completedPairings.docs[0];
    const pairingId = pairingDoc.id;
    
    const sampleComments = [
      {
        userId: userIds[1],
        text: 'Great photo! 📸',
        username: 'justin'
      }
    ];
    
    for (const comment of sampleComments) {
      const commentId = uuidv4();
      await db.collection('pairings').doc(pairingId).collection('comments').doc(commentId).set({
        id: commentId,
        userId: comment.userId,
        text: comment.text,
        username: comment.username,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    console.log(`   ✅ Added ${sampleComments.length} sample comments`);
    
  } catch (error) {
    console.error('   ❌ Error adding comments:', error);
  }
}

/**
 * Main test setup function
 */
async function setupTestEnvironment(options = {}) {
  const {
    createUsers = true,
    createConnections = true,
    createPairings = true,
    addComments = true
  } = options;
  
  console.log('🚀 BNOC TEST ENVIRONMENT SETUP');
  console.log('=' .repeat(50));
  
  const createdUserIds = [];
  
  try {
    // Step 1: Create test users
    if (createUsers) {
      console.log('\n👤 Creating test users...');
      
      for (const userData of testUsers) {
        const result = await createTestUser(userData);
        if (result.success) {
          createdUserIds.push(result.uid);
          console.log(`     🏷️  Added UID to list: ${result.uid}`);
        } else {
          console.log(`     ❌ Failed to create user: ${userData.email}`);
        }
      }
      
      console.log(`   ✅ ${createdUserIds.length} users ready for testing`);
      console.log(`   📋 Collected UIDs: ${createdUserIds.map(id => id.substring(0, 8) + '...').join(', ')}`);
    }
    
    // Step 2: Create friend connections
    if (createConnections && createdUserIds.length > 0) {
      await createFriendConnections(createdUserIds);
    }
    
    // Step 3: Create test pairings
    if (createPairings && createdUserIds.length > 0) {
      await createTestPairings(createdUserIds);
    }
    
    // Step 4: Add sample comments
    if (addComments && createdUserIds.length > 0) {
      await addSampleComments(createdUserIds);
    }
    
    // Final summary
    console.log('\n📋 TEST ENVIRONMENT READY!');
    console.log('=' .repeat(50));
    console.log('\n🧪 TEST CREDENTIALS:');
    testUsers.forEach(user => {
      console.log(`   📧 ${user.email} | 🔑 ${user.password}`);
    });
    
    console.log('\n📱 TESTING SCENARIOS:');
    console.log('   1. Sign up new account (use different @stanford.edu email)');
    console.log('   2. Sign in with existing accounts');
    console.log('   3. Test daily pairing flow (pending pairing available)');
    console.log('   4. Test photo submission');
    console.log('   5. View feed with completed pairings');
    console.log('   6. Test likes and comments');
    console.log('   7. Test chat functionality');
    
    console.log('\n🎯 RECOMMENDED TEST FLOW:');
    console.log('   1. Sign in as: duy@stanford.edu / hardcarry1738');
    console.log('   2. Check today\'s pairing (should be pending)');
    console.log('   3. Take and submit photo');
    console.log('   4. Sign in as partner to complete pairing');
    console.log('   5. Check feed for completed pairings');
    
    return {
      usersCreated: createdUserIds.length,
      testCredentials: testUsers.map(u => ({ email: u.email, password: u.password }))
    };
    
  } catch (error) {
    console.error('\n❌ Test setup failed:', error);
    throw error;
  }
}

/**
 * Command line interface
 */
async function main() {
  const args = process.argv.slice(2);
  
  const options = {
    createUsers: !args.includes('--skip-users'),
    createConnections: !args.includes('--skip-connections'),
    createPairings: !args.includes('--skip-pairings'),
    addComments: !args.includes('--skip-comments')
  };
  
  if (args.includes('--help')) {
    console.log('BNOC Test Environment Setup Script');
    console.log('');
    console.log('Usage:');
    console.log('  node testSetup.js                # Full setup');
    console.log('  node testSetup.js --skip-users   # Skip user creation');
    console.log('  node testSetup.js --skip-pairings # Skip pairing creation');
    console.log('');
    console.log('This script creates a complete test environment with:');
    console.log('- Test users with known passwords');
    console.log('- Friend connections between users');
    console.log('- Sample pairings in different states');
    console.log('- Sample comments and interactions');
    return;
  }
  
  await setupTestEnvironment(options);
  process.exit(0);
}

// Run main if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { setupTestEnvironment, createTestUser };
