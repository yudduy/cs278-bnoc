// Firebase Database Population Script
// This script will populate your Firebase database with sample users and pairings

const admin = require('firebase-admin');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const serviceAccount = require('../serviceAccountKey.json'); // You'll need to place this file in your project root

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore();

// Utility function to create a Firestore timestamp from a date
const createTimestamp = (date) => {
  return Timestamp.fromDate(date || new Date());
};

// Sample users data
const users = [
  {
    id: 'user1',
    email: 'duynguy@stanford.edu',
    username: 'duy',
    displayName: 'Duy Nguyen',
    photoURL: 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fduy.png?alt=media&token=34c26f11-830d-437d-a57c-ee7c6b7f0a05',
    createdAt: createTimestamp(new Date()),
    lastActive: createTimestamp(new Date()),
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
      quietHoursStart: 22,
      quietHoursEnd: 8
    },
    snoozeTokensRemaining: 2,
    snoozeTokenLastRefilled: createTimestamp(new Date())
  },
  {
    id: 'user2',
    email: 'jleong22@stanford.edu',
    username: 'justin',
    displayName: 'Justin Leong',
    photoURL: 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fjustin.png?alt=media&token=50b948ef-8e64-4d6c-a109-ed76366c8c0c',
    createdAt: createTimestamp(new Date()),
    lastActive: createTimestamp(new Date()),
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
      quietHoursStart: 22,
      quietHoursEnd: 8
    },
    snoozeTokensRemaining: 2,
    snoozeTokenLastRefilled: createTimestamp(new Date())
  },
  {
    id: 'user3',
    email: 'kelvinkn@stanford.edu',
    username: 'kelvin',
    displayName: 'Kelvin Nguyen',
    photoURL: 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fkelvin.png?alt=media&token=9dfee19b-79ef-4533-88e6-8a7b10e85dd7',
    createdAt: createTimestamp(new Date()),
    lastActive: createTimestamp(new Date()),
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
      quietHoursStart: 22,
      quietHoursEnd: 8
    },
    snoozeTokensRemaining: 2,
    snoozeTokenLastRefilled: createTimestamp(new Date())
  }
];

// Create a pairing for today between user1 and user2
const today = new Date();
const todayPairing = {
  id: 'pairing1',
  date: createTimestamp(today),
  expiresAt: createTimestamp(new Date(today.setHours(22, 0, 0, 0))),
  users: ['user1', 'user2'],
  user1_id: 'user1',
  user2_id: 'user2',
  status: 'pending',
  user1_photoURL: null,
  user2_photoURL: null,
  user1_submittedAt: null,
  user2_submittedAt: null,
  completedAt: null,
  chatId: 'chat1',
  likesCount: 0,
  likedBy: [],
  commentsCount: 0,
  isPrivate: false,
  lastUpdatedAt: createTimestamp(new Date())
};

// Create a completed pairing from yesterday between user2 and user3
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayPairing = {
  id: 'pairing2',
  date: createTimestamp(yesterday),
  expiresAt: createTimestamp(new Date(yesterday.setHours(22, 0, 0, 0))),
  users: ['user2', 'user3'],
  user1_id: 'user2',
  user2_id: 'user3',
  status: 'completed',
  user1_photoURL: 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/pairing%2Fpairing2.jpg?alt=media&token=c048bc2d-d2ea-466b-b5ba-708310b9e150',
  user2_photoURL: 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/pairing%2Fpairing1.jpg?alt=media&token=7b551441-71b6-4f61-8a77-8682ba17895d',
  user1_submittedAt: createTimestamp(yesterday),
  user2_submittedAt: createTimestamp(yesterday),
  completedAt: createTimestamp(yesterday),
  chatId: 'chat2',
  likesCount: 2,
  likedBy: ['user1'],
  commentsCount: 1,
  isPrivate: false,
  lastUpdatedAt: createTimestamp(yesterday)
};

// Comments for the completed pairing
const comments = [
  {
    id: 'comment1',
    pairingId: 'pairing2',
    userId: 'user1',
    username: 'duy',
    text: 'Great meetup!',
    createdAt: createTimestamp(yesterday),
    userPhotoURL: 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fduy.png?alt=media&token=34c26f11-830d-437d-a57c-ee7c6b7f0a05'
  }
];

// Populate database
async function populateDatabase() {
  const batch = db.batch();
  
  // Add users
  console.log('Adding users...');
  for (const user of users) {
    const userRef = db.collection('users').doc(user.id);
    batch.set(userRef, user);
  }
  
  // Add today's pairing
  console.log('Adding today\'s pairing...');
  const todayPairingRef = db.collection('pairings').doc(todayPairing.id);
  batch.set(todayPairingRef, todayPairing);
  
  // Add yesterday's completed pairing
  console.log('Adding yesterday\'s pairing...');
  const yesterdayPairingRef = db.collection('pairings').doc(yesterdayPairing.id);
  batch.set(yesterdayPairingRef, yesterdayPairing);
  
  // Add comments for yesterday's pairing
  console.log('Adding comments...');
  for (const comment of comments) {
    const commentRef = db.collection(`pairings/${comment.pairingId}/comments`).doc(comment.id);
    batch.set(commentRef, comment);
  }
  
  // Add to global feed
  console.log('Adding to global feed...');
  const globalFeedRef = db.collection('globalFeed').doc(yesterdayPairing.id);
  batch.set(globalFeedRef, {
    pairingId: yesterdayPairing.id,
    date: yesterdayPairing.date,
    users: yesterdayPairing.users,
    user1_id: yesterdayPairing.user1_id,
    user2_id: yesterdayPairing.user2_id,
    user1_photoURL: yesterdayPairing.user1_photoURL,
    user2_photoURL: yesterdayPairing.user2_photoURL,
    likesCount: yesterdayPairing.likesCount,
    commentsCount: yesterdayPairing.commentsCount
  });
  
  // Add to user feeds
  console.log('Adding to user feeds...');
  for (const userId of yesterdayPairing.users) {
    const feedRef = db.collection(`users/${userId}/feed`).doc(yesterdayPairing.id);
    batch.set(feedRef, {
      pairingId: yesterdayPairing.id,
      date: yesterdayPairing.date,
      seen: false
    });
  }
  
  // Execute the batch
  try {
    await batch.commit();
    console.log('Database populated successfully!');
  } catch (error) {
    console.error('Error populating database:', error);
  }
}

// Run the script
populateDatabase();
