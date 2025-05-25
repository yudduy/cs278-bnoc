const admin = require('firebase-admin');

// Firebase Auth Testing Script
// Test authentication functionality and create fresh pairings

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

const auth = admin.auth();
const db = admin.firestore();

/**
 * Test Firebase Auth user creation
 */
async function testUserCreation() {
  console.log('🧪 Testing Firebase Auth user creation...');
  
  const testEmail = 'firebasetest@stanford.edu';
  const testPassword = 'testing123';
  const testUsername = 'firebasetest';
  
  try {
    // Try to create a test user
    const userRecord = await auth.createUser({
      email: testEmail,
      password: testPassword,
      displayName: 'Firebase Test User',
      emailVerified: false
    });
    
    console.log('✅ Test user created successfully:', userRecord.uid);
    
    // Create Firestore profile
    await db.collection('users').doc(userRecord.uid).set({
      email: testEmail,
      username: testUsername,
      displayName: 'Firebase Test User',
      photoURL: null,
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
      pushToken: null
    });
    
    console.log('✅ Test user Firestore profile created');
    
    // Clean up - delete the test user
    await auth.deleteUser(userRecord.uid);
    await db.collection('users').doc(userRecord.uid).delete();
    
    console.log('✅ Test user cleaned up');
    return true;
    
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('⚠️  Test user already exists, cleaning up...');
      try {
        const existingUser = await auth.getUserByEmail(testEmail);
        await auth.deleteUser(existingUser.uid);
        await db.collection('users').doc(existingUser.uid).delete();
        console.log('✅ Existing test user cleaned up');
        return await testUserCreation(); // Retry
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup existing test user:', cleanupError);
        return false;
      }
    } else {
      console.error('❌ User creation test failed:', error);
      return false;
    }
  }
}

/**
 * Test password reset functionality
 */
async function testPasswordReset() {
  console.log('🧪 Testing password reset functionality...');
  
  try {
    // This will succeed even for non-existent users (Firebase security feature)
    const resetLink = await auth.generatePasswordResetLink('test@stanford.edu');
    console.log('✅ Password reset link generated successfully');
    console.log('🔗 Reset link:', resetLink);
    return true;
  } catch (error) {
    console.error('❌ Password reset test failed:', error);
    return false;
  }
}

/**
 * List all Firebase Auth users
 */
async function listAuthUsers() {
  console.log('📋 Listing Firebase Auth users...');
  
  try {
    const listUsersResult = await auth.listUsers(1000);
    console.log(`Found ${listUsersResult.users.length} Firebase Auth users:`);
    
    listUsersResult.users.forEach((userRecord, index) => {
      console.log(`${index + 1}. ${userRecord.email} (${userRecord.uid})`);
      console.log(`   Created: ${new Date(userRecord.metadata.creationTime)}`);
      console.log(`   Last Sign In: ${userRecord.metadata.lastSignInTime ? new Date(userRecord.metadata.lastSignInTime) : 'Never'}`);
      console.log(`   Email Verified: ${userRecord.emailVerified}`);
      console.log('');
    });
    
    return listUsersResult.users;
  } catch (error) {
    console.error('❌ Failed to list users:', error);
    return [];
  }
}

/**
 * Check Firestore profiles for Firebase Auth users
 */
async function checkFirestoreProfiles() {
  console.log('🔍 Checking Firestore profiles...');
  
  try {
    const authUsers = await auth.listUsers(1000);
    const authUserIds = authUsers.users.map(user => user.uid);
    
    console.log(`Checking Firestore profiles for ${authUserIds.length} Firebase Auth users...`);
    
    let profilesFound = 0;
    let profilesMissing = 0;
    
    for (const uid of authUserIds) {
      const profileDoc = await db.collection('users').doc(uid).get();
      
      if (profileDoc.exists) {
        const profileData = profileDoc.data();
        console.log(`✅ ${profileData.email} (${profileData.username}) - Profile exists`);
        profilesFound++;
      } else {
        console.log(`❌ ${uid} - Missing Firestore profile`);
        profilesMissing++;
      }
    }
    
    console.log(`\n📊 Profile Status:`);
    console.log(`✅ Profiles found: ${profilesFound}`);
    console.log(`❌ Profiles missing: ${profilesMissing}`);
    
    return { profilesFound, profilesMissing };
    
  } catch (error) {
    console.error('❌ Failed to check Firestore profiles:', error);
    return { profilesFound: 0, profilesMissing: 0 };
  }
}

/**
 * Create fresh pairings with Firebase Auth UIDs
 */
async function createFreshPairings() {
  console.log('🤝 Creating fresh pairings with Firebase Auth users...');
  
  try {
    // Get all active users from Firestore
    const usersSnapshot = await db.collection('users')
      .where('isActive', '==', true)
      .get();
    
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id, // This is now the Firebase Auth UID
      ...doc.data()
    }));
    
    console.log(`Found ${users.length} active users for pairing`);
    
    if (users.length < 2) {
      console.log('❌ Not enough users for pairings');
      return;
    }
    
    // Shuffle users
    const shuffledUsers = [...users].sort(() => Math.random() - 0.5);
    
    // Create pairings
    const pairings = [];
    for (let i = 0; i < shuffledUsers.length - 1; i += 2) {
      if (shuffledUsers[i + 1]) {
        pairings.push({
          user1: shuffledUsers[i],
          user2: shuffledUsers[i + 1]
        });
      }
    }
    
    console.log(`Creating ${pairings.length} pairings...`);
    
    // Calculate today's deadline
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiresAt = new Date(today);
    expiresAt.setHours(22, 0, 0, 0); // 10:00 PM
    
    const batch = db.batch();
    const createdPairings = [];
    
    for (const pairing of pairings) {
      const pairingId = db.collection('pairings').doc().id;
      const pairingRef = db.collection('pairings').doc(pairingId);
      const chatId = `chat_${pairingId}`;
      
      const pairingDoc = {
        id: pairingId,
        date: admin.firestore.Timestamp.fromDate(today),
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        users: [pairing.user1.id, pairing.user2.id], // Firebase Auth UIDs
        user1_id: pairing.user1.id,
        user2_id: pairing.user2.id,
        status: 'pending',
        user1_photoURL: null,
        user2_photoURL: null,
        user1_submittedAt: null,
        user2_submittedAt: null,
        completedAt: null,
        chatId: chatId,
        likesCount: 0,
        likedBy: [],
        commentsCount: 0,
        isPrivate: false,
        virtualMeetingLink: `https://meet.jitsi.si/DailyMeetupSelfie-${pairingId}`,
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      batch.set(pairingRef, pairingDoc);
      
      // Create chat room
      const chatRef = db.collection('chatRooms').doc(chatId);
      batch.set(chatRef, {
        id: chatId,
        pairingId: pairingId,
        userIds: [pairing.user1.id, pairing.user2.id],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessage: null,
        lastActivityAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      createdPairings.push({
        id: pairingId,
        user1: pairing.user1.username,
        user2: pairing.user2.username,
      });
    }
    
    await batch.commit();
    
    console.log('✅ Pairings created successfully:');
    createdPairings.forEach(p => {
      console.log(`   🤝 ${p.user1} + ${p.user2} (${p.id})`);
    });
    
    return createdPairings;
    
  } catch (error) {
    console.error('❌ Failed to create pairings:', error);
    return [];
  }
}

/**
 * Test complete authentication flow
 */
async function runCompleteTest() {
  console.log('=== Firebase Auth Complete Test ===\n');
  
  const results = {
    userCreation: false,
    passwordReset: false,
    authUsers: [],
    profileCheck: { profilesFound: 0, profilesMissing: 0 },
    pairings: []
  };
  
  // Test user creation
  results.userCreation = await testUserCreation();
  console.log('');
  
  // Test password reset
  results.passwordReset = await testPasswordReset();
  console.log('');
  
  // List auth users
  results.authUsers = await listAuthUsers();
  console.log('');
  
  // Check Firestore profiles
  results.profileCheck = await checkFirestoreProfiles();
  console.log('');
  
  // Create fresh pairings
  results.pairings = await createFreshPairings();
  console.log('');
  
  // Summary
  console.log('📊 Test Summary:');
  console.log(`✅ User creation: ${results.userCreation ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Password reset: ${results.passwordReset ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Auth users found: ${results.authUsers.length}`);
  console.log(`✅ Firestore profiles: ${results.profileCheck.profilesFound}/${results.profileCheck.profilesFound + results.profileCheck.profilesMissing}`);
  console.log(`✅ Pairings created: ${results.pairings.length}`);
  
  const allTestsPassed = results.userCreation && 
                        results.passwordReset && 
                        results.authUsers.length > 0 && 
                        results.profileCheck.profilesMissing === 0;
  
  console.log(`\n🎯 Overall Status: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '⚠️  SOME ISSUES FOUND'}`);
  
  if (allTestsPassed) {
    console.log('🎉 Firebase Auth is ready for production use!');
  } else {
    console.log('🔧 Please address the issues above before proceeding.');
  }
  
  return results;
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'test':
        await runCompleteTest();
        break;
      case 'users':
        await listAuthUsers();
        break;
      case 'profiles':
        await checkFirestoreProfiles();
        break;
      case 'pairings':
        await createFreshPairings();
        break;
      case 'reset':
        await testPasswordReset();
        break;
      default:
        console.log('Firebase Auth Testing Commands:');
        console.log('  test      - Run complete test suite');
        console.log('  users     - List Firebase Auth users');
        console.log('  profiles  - Check Firestore profiles');
        console.log('  pairings  - Create fresh pairings');
        console.log('  reset     - Test password reset');
        console.log('');
        console.log('Example: node testFirebaseAuth.js test');
        break;
    }
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  testUserCreation,
  testPasswordReset,
  listAuthUsers,
  checkFirestoreProfiles,
  createFreshPairings,
  runCompleteTest
};
