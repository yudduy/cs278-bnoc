const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid'); // For generating pairing IDs

// IMPORTANT: Replace with the actual path to your Firebase Admin SDK service account key
// Ensure this file is NOT committed to your repository if it's public.
// Download from Firebase Console: Project settings > Service accounts > Generate new private key
const serviceAccount = require('./<YOUR_SERVICE_ACCOUNT_KEY_FILENAME>.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

const usersToCreate = [
  {
    id: 'user1',
    email: 'duy@stanford.edu',
    password: 'password123', // Set a temporary password
    username: 'duy',
    displayName: 'Duy Nguyen',
    photoURL: 'https://firebasestorage.googleapis.com/v0/b/bnoc-app-57647.appspot.com/o/profile_images%2Fduy.jpg?alt=media&token=d8e9a0a8-2f2e-4d95-8c88-1c63c303a08b',
    // ... other fields from FIREBASE.md matching User type
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
    email: 'justin@stanford.edu',
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
  },
  {
    id: 'user4',
    email: 'vivian@stanford.edu',
    password: 'password123',
    username: 'vivian',
    displayName: 'Vivian Zhou',
    photoURL: 'https://firebasestorage.googleapis.com/v0/b/bnoc-app-57647.appspot.com/o/profile_images%2Fvivian.jpg?alt=media&token=6f8b0c5a-1e2d-4f8a-9c7b-3a0d8c1e4f5b',
    isActive: true, flakeStreak: 0, maxFlakeStreak: 0, connections: [], blockedIds: [], snoozeTokensRemaining: 1,
    notificationSettings: { pairingNotification: true, chatNotification: true, reminderNotification: true, socialNotification: true, completionNotification: true, quietHoursStart: 22, quietHoursEnd: 8 },
    privacySettings: { globalFeedOptIn: true }, fcmToken: 'dummy_fcm_token_user4',
  },
];

const createUsers = async () => {
  console.log('Starting user creation...');
  for (const userData of usersToCreate) {
    const { id, email, password, username, displayName, photoURL, ...firestoreData } = userData;
    try {
      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        uid: id,
        email: email,
        password: password,
        displayName: displayName,
        photoURL: photoURL,
        emailVerified: true, // Assuming Stanford emails are pre-verified for testing
      });
      console.log(`Successfully created auth user: ${userRecord.uid} (${email})`);

      // Create user document in Firestore
      await db.collection('users').doc(id).set({
        id: id, // Ensure id is part of the document data
        email: email,
        username: username,
        displayName: displayName,
        photoURL: photoURL,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        ...firestoreData, // Spread the rest of the data (isActive, settings, etc.)
      });
      console.log(`Successfully created Firestore user document for: ${id}`);
    } catch (error) {
      if (error.code === 'auth/uid-already-exists' || error.code === 'auth/email-already-exists') {
        console.warn(`Auth user ${id} (${email}) likely already exists. Skipping auth creation.`);
        // Still try to create/update Firestore doc if auth user exists
        try {
            await db.collection('users').doc(id).set({
                id: id, email, username, displayName, photoURL,
                createdAt: admin.firestore.FieldValue.serverTimestamp(), // Or use existing if updating
                lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                ...firestoreData
            }, { merge: true }); // Use merge to avoid overwriting if only updating
            console.log(`Updated/verified Firestore user document for: ${id}`);
        } catch (dbError) {
            console.error(`Error creating/updating Firestore document for existing auth user ${id}:`, dbError);
        }
      } else {
        console.error(`Error creating user ${id} (${email}):`, error);
      }
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
      // Pairing 2: user3 and user4, user3 submitted
      user1_id: 'user3', 
      user2_id: 'user4',
      status: 'user1_submitted',
      user1_photoURL: 'https://firebasestorage.googleapis.com/v0/b/bnoc-app-57647.appspot.com/o/sample_photos%2Fkelvin_sample.jpg?alt=media&token=a1b2c3d4-e5f6-7890-1234-abcdef123456', // Placeholder submitted photo
      user1_submittedAt: admin.firestore.Timestamp.fromDate(new Date(today.getTime() - (60 * 60 * 1000))), // 1 hour ago
    },
    {
      // Pairing 3: user1 and user3, user2 (user3) submitted - to test logic if user1 is user2_id in a pairing
      user1_id: 'user4', // Let's make user4 as user1 in this pairing for variety
      user2_id: 'user1',
      status: 'user2_submitted', 
      user2_photoURL: 'https://firebasestorage.googleapis.com/v0/b/bnoc-app-57647.appspot.com/o/sample_photos%2Fduy_sample.jpg?alt=media&token=b2c3d4e5-f6a7-8901-2345-bcdefa123456', // Placeholder submitted photo for user1 (acting as user2)
      user2_submittedAt: admin.firestore.Timestamp.fromDate(new Date(today.getTime() - (2 * 60 * 60 * 1000))), // 2 hours ago
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
      await db.collection('pairings').doc(pairingId).set(newPairing);
      console.log(`Successfully created pairing ${pairingId} between ${pData.user1_id} and ${pData.user2_id}. Status: ${pData.status}`);
    } catch (error) {
      console.error(`Error creating pairing ${pairingId}:`, error);
    }
  }
  console.log('Test pairing creation process finished.\n');
};

const main = async () => {
  console.log('--- Firebase Test Data Setup Script ---');
  await createUsers();
  await createTestPairings();
  console.log('--- Script Finished ---');
  process.exit(0); // Exit script cleanly
};

main().catch(error => {
  console.error("Unhandled error in main script execution:", error);
  process.exit(1);
}); 