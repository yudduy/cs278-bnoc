const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid'); // For generating pairing IDs

// IMPORTANT: Replace with the actual path to your Firebase Admin SDK service account key
// Ensure this file is NOT committed to your repository if it's public.
// Download from Firebase Console: Project settings > Service accounts > Generate new private key
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Modified users array - now storing passwords directly in Firestore
// and not using Firebase Auth at all
const usersToCreate = [
  {
    id: 'user1',
    email: 'duynguy@stanford.edu',
    password: 'password123', // Now stored directly in Firestore
    username: 'duy',
    displayName: 'Duy Nguyen',
    photoURL: 'https://firebasestorage.googleapis.com/v0/b/bnoc-app-57647.appspot.com/o/profile_images%2Fduy.jpg?alt=media&token=d8e9a0a8-2f2e-4d95-8c88-1c63c303a08b',
    isActive: true,
    flakeStreak: 0,
    maxFlakeStreak: 0,
    connections: [],
    blockedIds: [],
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
    privacySettings: { globalFeedOptIn: true },
    fcmToken: 'dummy_fcm_token_user1',
  },
  {
    id: 'user2',
    email: 'jleong22@stanford.edu',
    password: 'password123',
    username: 'justin',
    displayName: 'Justin Leong',
    photoURL: 'https://firebasestorage.googleapis.com/v0/b/bnoc-app-57647.appspot.com/o/profile_images%2Fjustin.jpg?alt=media&token=01c27d1f-255a-4a1b-8b1e-1808f73f50c7',
    isActive: true, flakeStreak: 0, maxFlakeStreak: 0, connections: [], blockedIds: [], snoozeTokensRemaining: 1,
    notificationSettings: { pairingNotification: true, chatNotification: true, reminderNotification: true, socialNotification: true, completionNotification: true, quietHoursStart: 22, quietHoursEnd: 8 },
    privacySettings: { globalFeedOptIn: true }, fcmToken: 'dummy_fcm_token_user2',
  },
  {
    id: 'user3',
    email: 'kelvin@stanford.edu',
    password: 'password123',
    username: 'kelvin',
    displayName: 'Kelvin Nguyen',
    photoURL: 'https://firebasestorage.googleapis.com/v0/b/bnoc-app-57647.appspot.com/o/profile_images%2Fkelvin.jpg?alt=media&token=9e7d9f7a-0d6e-4b3a-8c3e-0f5d8e0c7b2a',
    isActive: true, flakeStreak: 0, maxFlakeStreak: 0, connections: [], blockedIds: [], snoozeTokensRemaining: 1,
    notificationSettings: { pairingNotification: true, chatNotification: true, reminderNotification: true, socialNotification: true, completionNotification: true, quietHoursStart: 22, quietHoursEnd: 8 },
    privacySettings: { globalFeedOptIn: true }, fcmToken: 'dummy_fcm_token_user3',
  }
];

// Modified to create users without Firebase Auth
const createUsers = async () => {
  console.log('Starting user creation (direct Firestore approach)...');
  for (const userData of usersToCreate) {
    const { id, ...firestoreData } = userData;
    try {
      // Check if user already exists in Firestore by email
      const userByEmailQuery = await db.collection('users')
        .where('email', '==', userData.email)
        .get();
      
      if (!userByEmailQuery.empty) {
        console.warn(`User with email ${userData.email} already exists. Skipping...`);
        continue;
      }
      
      // Check if user already exists in Firestore by username
      const userByUsernameQuery = await db.collection('users')
        .where('username', '==', userData.username)
        .get();
      
      if (!userByUsernameQuery.empty) {
        console.warn(`User with username ${userData.username} already exists. Skipping...`);
        continue;
      }

      // Create user document with password directly in Firestore
      await db.collection('users').doc(id).set({
        id: id, // Include ID in the document data
        ...firestoreData, // Include all user data including password
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastActive: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`Successfully created user: ${id} (${userData.email})`);
    } catch (error) {
      console.error(`Error creating user ${id} (${userData.email}):`, error);
    }
  }
  console.log('User creation process finished.\n');
};

const createTestPairings = async () => {
  console.log('Starting test pairing creation...');
  const today = new Date();
  today.setHours(0,0,0,0);

  const pairingsToCreate = [
    {
      // Pairing 1: user1 and user2, pending (neither submitted)
      user1_id: 'user1', 
      user2_id: 'user2',
      status: 'pending',
    },
    {
      // Pairing 2: user3 and user1, user3 submitted
      user1_id: 'user3', 
      user2_id: 'user1',
      status: 'user1_submitted',
      user1_photoURL: 'https://firebasestorage.googleapis.com/v0/b/bnoc-app-57647.appspot.com/o/sample_photos%2Fkelvin_sample.jpg?alt=media&token=a1b2c3d4-e5f6-7890-1234-abcdef123456', // Placeholder submitted photo
      user1_submittedAt: admin.firestore.Timestamp.fromDate(new Date(today.getTime() - (60 * 60 * 1000))), // 1 hour ago
    },
    {
      // Pairing 3: user2 and user3, user2 submitted
      user1_id: 'user2',
      user2_id: 'user3',
      status: 'user1_submitted', 
      user1_photoURL: 'https://firebasestorage.googleapis.com/v0/b/bnoc-app-57647.appspot.com/o/sample_photos%2Fjustin_sample.jpg?alt=media&token=b2c3d4e5-f6a7-8901-2345-bcdefa123456',
      user1_submittedAt: admin.firestore.Timestamp.fromDate(new Date(today.getTime() - (2 * 60 * 60 * 1000))), // 2 hours ago
    }
  ];

  for (const pData of pairingsToCreate) {
    const pairingId = uuidv4();
    const expiresAt = new Date(today); // Today
    expiresAt.setHours(22,0,0,0); // Expires at 10 PM today

    const newPairing = {
      id: pairingId,
      date: admin.firestore.Timestamp.fromDate(today),
      users: [pData.user1_id, pData.user2_id].sort(), // Store sorted user IDs
      user1_id: pData.user1_id,
      user2_id: pData.user2_id,
      status: pData.status,
      user1_photoURL: pData.user1_photoURL || null,
      user2_photoURL: pData.user2_photoURL || null,
      user1_submittedAt: pData.user1_submittedAt || null,
      user2_submittedAt: pData.user2_submittedAt || null,
      completedAt: null,
      chatId: `chat_${pairingId}`, // Simple chat ID generation
      likesCount: 0,
      likedBy: [],
      commentsCount: 0,
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      isPrivate: false,
      lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    try {
      // Create chat room document
      const chatRoom = {
        id: newPairing.chatId,
        pairingId: pairingId,
        userIds: [pData.user1_id, pData.user2_id],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessage: null,
        lastActivityAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('chatRooms').doc(newPairing.chatId).set(chatRoom);
      
      // Create pairing document
      await db.collection('pairings').doc(pairingId).set(newPairing);
      console.log(`Successfully created pairing ${pairingId} between ${pData.user1_id} and ${pData.user2_id}. Status: ${pData.status}`);
    } catch (error) {
      console.error(`Error creating pairing ${pairingId}:`, error);
    }
  }
  console.log('Test pairing creation process finished.\n');
};

const main = async () => {
  console.log('--- Firebase Test Data Setup Script (Direct Firestore Auth) ---');
  await createUsers();
  await createTestPairings();
  console.log('--- Script Finished ---');
  process.exit(0); // Exit script cleanly
};

main().catch(error => {
  console.error("Unhandled error in main script execution:", error);
  process.exit(1);
});