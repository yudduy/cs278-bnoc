/**
 * Create Firebase Test User
 * 
 * This script creates a test user in Firebase Authentication and Firestore
 * for easy testing of the authentication flow.
 * 
 * Usage:
 * node scripts/createTestUser.js
 */

const { initializeApp } = require('firebase/app');
const { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword 
} = require('firebase/auth');
const { 
  getFirestore, 
  doc, 
  setDoc, 
  serverTimestamp 
} = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhUJt5HOOrR6MRiKKiLZ86unk8V6jKUx4",
  authDomain: "bnoc.firebaseapp.com",
  projectId: "stone-bison-446302-p0",
  storageBucket: "stone-bison-446302-p0.appspot.com",
  messagingSenderId: "314188937187",
  appId: "1:314188937187:ios:3401193ce380339069d2d6",
  databaseURL: "https://stone-bison-446302-p0-default-rtdb.firebaseio.com"
};

// Test user credentials
const TEST_EMAIL = 'test@stanford.edu';
const TEST_PASSWORD = 'password123';
const TEST_USERNAME = 'testuser';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createTestUser() {
  try {
    console.log(`Creating test user: ${TEST_EMAIL}`);
    
    // Try to sign in first to see if the user already exists
    try {
      await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
      console.log('Test user already exists, no need to create');
      process.exit(0);
    } catch (signInError) {
      // User doesn't exist, we need to create it
      console.log('User does not exist, creating new user...');
    }
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    const user = userCredential.user;
    
    console.log(`User created with UID: ${user.uid}`);
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      id: user.uid,
      email: TEST_EMAIL,
      username: TEST_USERNAME,
      displayName: 'Test User',
      photoURL: 'https://i.pravatar.cc/300',
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      isActive: true,
      flakeStreak: 0,
      maxFlakeStreak: 0,
      connections: [],
      notificationSettings: {
        pairingNotification: true,
        reminderNotification: true,
        chatNotification: true,
        partnerPhotoSubmittedNotification: true,
        socialNotifications: true,
        quietHoursStart: 22,
        quietHoursEnd: 8
      },
      blockedIds: [],
    });
    
    console.log('User document created in Firestore');
    console.log('-----------------------------');
    console.log('TEST USER CREDENTIALS:');
    console.log(`Email: ${TEST_EMAIL}`);
    console.log(`Password: ${TEST_PASSWORD}`);
    console.log('-----------------------------');
    console.log('Successfully created test user!');
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    process.exit(0);
  }
}

// Run the function
createTestUser(); 