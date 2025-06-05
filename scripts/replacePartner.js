const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

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
 * Find a user by username
 */
const findUserByUsername = async (username) => {
  const usersSnapshot = await db.collection('users')
    .where('username', '==', username)
    .get();
  
  if (usersSnapshot.empty) {
    return null;
  }
  
  return {
    id: usersSnapshot.docs[0].id,
    ...usersSnapshot.docs[0].data()
  };
};

/**
 * Find current pairing for a user today
 */
const findCurrentPairing = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Query all pairings from today for this user
  const pairingsSnapshot = await db.collection('pairings')
    .where('users', 'array-contains', userId)
    .get();
  
  if (pairingsSnapshot.empty) {
    return null;
  }
  
  // Filter to today's pairings and active status in memory
  const todayStart = admin.firestore.Timestamp.fromDate(today);
  const activePairings = pairingsSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(pairing => {
      // Check if pairing is from today
      const pairingDate = pairing.date.toDate();
      pairingDate.setHours(0, 0, 0, 0);
      const isTodaysPairing = pairingDate.getTime() === today.getTime();
      return isTodaysPairing && ['pending', 'user1_submitted', 'user2_submitted'].includes(pairing.status);
    });
  
  return activePairings.length > 0 ? activePairings[0] : null;
};

/**
 * Find waitlisted users
 */
const findWaitlistedUsers = async () => {
  const usersSnapshot = await db.collection('users')
    .where('waitlistedToday', '==', true)
    .get();
  
  return usersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

/**
 * Replace justin22's partner with someone from waitlist
 */
async function replaceJustin22Partner() {
  console.log('=== Replace Justin22 Partner Script ===\n');
  
  try {
    // Find justin22
    const justin22 = await findUserByUsername('justin22');
    if (!justin22) {
      console.error('❌ justin22 not found');
      return;
    }
    
    console.log(`✅ Found justin22: ${justin22.id}`);
    
    // Find justin22's current pairing
    const currentPairing = await findCurrentPairing(justin22.id);
    if (!currentPairing) {
      console.error('❌ justin22 has no current pairing');
      return;
    }
    
    console.log(`📋 Found current pairing: ${currentPairing.id}`);
    console.log(`📋 Status: ${currentPairing.status}`);
    
    // Find current partner
    const currentPartnerId = currentPairing.users.find(id => id !== justin22.id);
    const currentPartnerDoc = await db.collection('users').doc(currentPartnerId).get();
    const currentPartner = currentPartnerDoc.exists ? 
      { id: currentPartnerDoc.id, ...currentPartnerDoc.data() } : null;
    
    if (currentPartner) {
      console.log(`👤 Current partner: ${currentPartner.username || currentPartner.id}`);
    }
    
    // Find waitlisted users
    const waitlistedUsers = await findWaitlistedUsers();
    if (waitlistedUsers.length === 0) {
      console.error('❌ No waitlisted users found');
      return;
    }
    
    console.log(`⏰ Found ${waitlistedUsers.length} waitlisted users:`);
    waitlistedUsers.forEach(user => {
      console.log(`   - ${user.username || user.id}`);
    });
    
    // Select the first waitlisted user
    const newPartner = waitlistedUsers[0];
    console.log(`\n🔄 Selected new partner: ${newPartner.username || newPartner.id}`);
    
    // Determine if justin22 has submitted a photo
    const justin22HasPhoto = currentPairing.user1_id === justin22.id ? 
      !!currentPairing.user1_photoURL : !!currentPairing.user2_photoURL;
    const justin22PhotoURL = currentPairing.user1_id === justin22.id ? 
      currentPairing.user1_photoURL : currentPairing.user2_photoURL;
    const justin22SubmittedAt = currentPairing.user1_id === justin22.id ? 
      currentPairing.user1_submittedAt : currentPairing.user2_submittedAt;
    
    console.log(`📸 Justin22 has photo: ${justin22HasPhoto ? 'YES' : 'NO'}`);
    
    // Create new pairing
    const newPairingId = uuidv4();
    const chatId = `chat_${newPairingId}`;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiresAt = new Date(today);
    expiresAt.setHours(22, 0, 0, 0);
    
    const newPairingDoc = {
      id: newPairingId,
      date: admin.firestore.Timestamp.fromDate(today),
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      users: [justin22.id, newPartner.id],
      user1_id: justin22.id,
      user2_id: newPartner.id,
      status: justin22HasPhoto ? 'user1_submitted' : 'pending',
      user1_photoURL: justin22HasPhoto ? justin22PhotoURL : null,
      user2_photoURL: null,
      user1_submittedAt: justin22HasPhoto ? justin22SubmittedAt : null,
      user2_submittedAt: null,
      completedAt: null,
      chatId: chatId,
      likesCount: 0,
      likedBy: [],
      commentsCount: 0,
      isPrivate: false,
      virtualMeetingLink: `https://meet.jitsi.si/DailyMeetupSelfie-${newPairingId}`,
      lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      replacedFrom: currentPairing.id, // Track that this replaced another pairing
    };
    
    // Start batch operation
    const batch = db.batch();
    
    // Create new pairing
    const newPairingRef = db.collection('pairings').doc(newPairingId);
    batch.set(newPairingRef, newPairingDoc);
    
    // Create new chat room
    const chatRef = db.collection('chatRooms').doc(chatId);
    batch.set(chatRef, {
      id: chatId,
      pairingId: newPairingId,
      userIds: [justin22.id, newPartner.id],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastMessage: null,
      lastActivityAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Mark old pairing as replaced
    const oldPairingRef = db.collection('pairings').doc(currentPairing.id);
    batch.update(oldPairingRef, {
      status: 'replaced',
      replacedBy: newPairingId,
      lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Remove new partner from waitlist
    const newPartnerRef = db.collection('users').doc(newPartner.id);
    batch.update(newPartnerRef, {
      waitlistedToday: false,
      priorityNextPairing: false,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Put old partner on waitlist (if they exist and are active)
    if (currentPartner && currentPartner.isActive) {
      const oldPartnerRef = db.collection('users').doc(currentPartner.id);
      batch.update(oldPartnerRef, {
        waitlistedToday: true,
        waitlistedAt: admin.firestore.FieldValue.serverTimestamp(),
        priorityNextPairing: true,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // Commit all changes
    await batch.commit();
    
    console.log('\n✅ Partner replacement completed successfully!');
    console.log(`🔄 Old pairing ${currentPairing.id} marked as replaced`);
    console.log(`🆕 New pairing ${newPairingId} created`);
    console.log(`👥 justin22 + ${newPartner.username || newPartner.id}`);
    
    if (currentPartner) {
      console.log(`⏰ ${currentPartner.username || currentPartner.id} moved to waitlist`);
    }
    
    if (justin22HasPhoto) {
      console.log(`📸 Justin22's photo preserved in new pairing`);
    }
    
  } catch (error) {
    console.error('❌ Error replacing partner:', error);
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length > 0 && args[0] === '--help') {
    console.log('=== Replace Partner Script ===');
    console.log('Usage: node replacePartner.js');
    console.log('');
    console.log('This script will:');
    console.log('1. Find justin22\'s current pairing');
    console.log('2. Take the first waitlisted user');
    console.log('3. Create a new pairing between justin22 and waitlisted user');
    console.log('4. Move the old partner to waitlist');
    console.log('5. Preserve any existing photo from justin22');
    process.exit(0);
  }
  
  await replaceJustin22Partner();
  process.exit(0);
}

// Export the function for use in other scripts
module.exports = { replaceJustin22Partner };

// Run main if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
} 