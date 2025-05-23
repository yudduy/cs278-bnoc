const admin = require('firebase-admin');

// Production User Registration Utility
// For adding real users to the BNOC system

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

/**
 * Register a new user in the BNOC system
 * @param {Object} userData - User data object
 * @param {string} userData.email - Stanford email address
 * @param {string} userData.username - Unique username
 * @param {string} userData.displayName - Display name
 * @param {string} userData.password - User password
 * @param {string} userData.photoURL - Optional profile photo URL
 */
async function registerUser(userData) {
  console.log(`🔄 Registering user: ${userData.username} (${userData.email})`);
  
  try {
    // Validate required fields
    if (!userData.email || !userData.username || !userData.password) {
      throw new Error('Missing required fields: email, username, password');
    }
    
    // Validate Stanford email
    if (!userData.email.endsWith('@stanford.edu')) {
      throw new Error('Email must be a Stanford email address (@stanford.edu)');
    }
    
    // Check if user already exists by email
    const existingEmailQuery = await db.collection('users')
      .where('email', '==', userData.email)
      .get();
    
    if (!existingEmailQuery.empty) {
      throw new Error(`User with email ${userData.email} already exists`);
    }
    
    // Check if username is already taken
    const existingUsernameQuery = await db.collection('users')
      .where('username', '==', userData.username)
      .get();
    
    if (!existingUsernameQuery.empty) {
      throw new Error(`Username ${userData.username} is already taken`);
    }
    
    // Generate user ID
    const userId = userData.username.toLowerCase();
    
    // Create user document
    const userDoc = {
      id: userId,
      email: userData.email,
      username: userData.username,
      displayName: userData.displayName || userData.username,
      password: userData.password, // Keep current auth system
      photoURL: userData.photoURL || null,
      isActive: true,
      flakeStreak: 0,
      maxFlakeStreak: 0,
      connections: [], // Array of friend connections
      blockedIds: [], // Array of blocked user IDs
      snoozeTokensRemaining: 1,
      notificationSettings: {
        pairingNotification: true,
        chatNotification: true,
        reminderNotification: true,
        socialNotification: true,
        completionNotification: true,
        quietHoursStart: 22,
        quietHoursEnd: 8
      },
      privacySettings: {
        globalFeedOptIn: true
      },
      fcmToken: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActive: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Save to Firestore
    await db.collection('users').doc(userId).set(userDoc);
    
    console.log(`✅ Successfully registered user: ${userId}`);
    return { success: true, userId };
    
  } catch (error) {
    console.error(`❌ Failed to register user: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Register multiple users from an array
 * @param {Array} users - Array of user data objects
 */
async function registerMultipleUsers(users) {
  console.log(`🔄 Registering ${users.length} users...`);
  
  const results = {
    success: [],
    failed: []
  };
  
  for (const userData of users) {
    const result = await registerUser(userData);
    
    if (result.success) {
      results.success.push(result.userId);
    } else {
      results.failed.push({
        email: userData.email,
        username: userData.username,
        error: result.error
      });
    }
  }
  
  console.log(`\n📊 Registration Summary:`);
  console.log(`✅ Successful: ${results.success.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log(`\n❌ Failed registrations:`);
    results.failed.forEach(fail => {
      console.log(`  - ${fail.username} (${fail.email}): ${fail.error}`);
    });
  }
  
  return results;
}

/**
 * Example usage - Register users from command line arguments or predefined list
 */
async function main() {
  console.log('=== BNOC User Registration Utility ===\n');
  
  // Example: Register single user (uncomment and modify as needed)
  /*
  const newUser = {
    email: 'student@stanford.edu',
    username: 'student123',
    displayName: 'Student Name',
    password: 'secure_password_123',
    photoURL: 'https://example.com/photo.jpg' // Optional
  };
  
  await registerUser(newUser);
  */
  
  // Example: Register multiple users (uncomment and modify as needed)
  /*
  const newUsers = [
    {
      email: 'alice@stanford.edu',
      username: 'alice',
      displayName: 'Alice Smith',
      password: 'alice_password'
    },
    {
      email: 'bob@stanford.edu', 
      username: 'bob',
      displayName: 'Bob Johnson',
      password: 'bob_password'
    }
  ];
  
  await registerMultipleUsers(newUsers);
  */
  
  console.log('✅ User registration utility ready');
  console.log('📝 Modify the main() function to register users');
  console.log('💡 Uncomment example code above and customize for your needs');
  
  process.exit(0);
}

// Export functions for use in other scripts
module.exports = {
  registerUser,
  registerMultipleUsers
};

// Run main if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Registration utility failed:', error);
    process.exit(1);
  });
}
