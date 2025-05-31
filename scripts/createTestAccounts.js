/**
 * Create Test Accounts Script
 * 
 * Utility script to create test accounts for the BNOC app.
 * Run this script to create test accounts that can be paired with new users.
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin SDK
const serviceAccount = require('../config/serviceAccountKey.json'); // You'll need to add this

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project-id.firebaseio.com" // Replace with your project URL
});

const auth = admin.auth();
const db = admin.firestore();

// Default photo URL for test accounts
const DEFAULT_PHOTO_URL = 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fmb.jpeg?alt=media&token=e6e88f85-a09d-45cc-b6a4-cad438d1b2f6';

const createTestAccount = async (testNumber) => {
  try {
    const username = `test_${testNumber}`;
    const email = `${username}@testuser.bnoc.stanford.edu`;
    const displayName = `Test User ${testNumber}`;
    const password = 'password123';
    
    console.log(`Creating test account: ${username}`);
    
    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: displayName,
      photoURL: DEFAULT_PHOTO_URL,
    });
    
    console.log(`✅ Created Firebase Auth user: ${userRecord.uid}`);
    
    // Create Firestore user document
    const userData = {
      email: email,
      username: username,
      displayName: displayName,
      photoURL: DEFAULT_PHOTO_URL,
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
      fcmToken: "none",
      pushToken: "none"
    };
    
    await db.collection('users').doc(userRecord.uid).set(userData);
    
    console.log(`✅ Created Firestore user document for: ${username}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`📷 Photo URL: ${DEFAULT_PHOTO_URL}`);
    console.log(`🆔 User ID: ${userRecord.uid}`);
    console.log('---');
    
    return {
      uid: userRecord.uid,
      email: email,
      username: username,
      password: password,
      photoURL: DEFAULT_PHOTO_URL
    };
  } catch (error) {
    console.error(`❌ Error creating test account ${testNumber}:`, error.message);
    return null;
  }
};

const main = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (prompt) => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  };
  
  try {
    console.log('🚀 BNOC Test Account Creator');
    console.log('============================');
    
    const numAccounts = await question('How many test accounts do you want to create? (default: 5): ');
    const count = parseInt(numAccounts) || 5;
    
    const startNumber = await question('Starting number for test accounts? (default: 1): ');
    const start = parseInt(startNumber) || 1;
    
    console.log(`\nCreating ${count} test accounts starting from test_${start}...\n`);
    
    const createdAccounts = [];
    
    for (let i = 0; i < count; i++) {
      const testNumber = start + i;
      const account = await createTestAccount(testNumber);
      
      if (account) {
        createdAccounts.push(account);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n🎉 Test account creation completed!');
    console.log(`✅ Successfully created: ${createdAccounts.length}/${count} accounts`);
    
    if (createdAccounts.length > 0) {
      console.log('\n📋 Summary:');
      createdAccounts.forEach(account => {
        console.log(`  • ${account.username} (${account.email}) - ${account.password}`);
      });
    }
    
    console.log('\n💡 These accounts can now be automatically paired with new users!');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  } finally {
    rl.close();
    process.exit(0);
  }
};

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n👋 Script terminated by user');
  process.exit(0);
});

// Run the script
main().catch(console.error); 