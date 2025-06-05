const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

// Manual Pairing Script - For Testing Purposes
// This script simulates the daily pairing algorithm that should run via Cloud Functions

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
 * Shuffle array using Fisher-Yates algorithm
 */
const shuffleArray = (array) => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * Get pairing history for last N days to avoid repeats
 */
const getPairingHistory = async (days) => {
  const cutoffDate = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  );
  
  const pairingsSnapshot = await db.collection('pairings')
    .where('date', '>', cutoffDate)
    .get();
  
  return pairingsSnapshot.docs.map(doc => ({
    id: doc.id,
    users: doc.data().users,
    date: doc.data().date,
  }));
};

/**
 * Get existing incomplete pairings for today
 */
const getIncompletePairings = async (today) => {
  // Use a simpler query to avoid complex index requirements
  const pairingsSnapshot = await db.collection('pairings')
    .where('date', '>=', admin.firestore.Timestamp.fromDate(today))
    .get();
    
  // Filter in memory to avoid complex index requirements
  return pairingsSnapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    .filter(pairing => 
      ['pending', 'user1_submitted', 'user2_submitted'].includes(pairing.status)
    );
};

/**
 * Check if user has submitted a photo in an incomplete pairing today
 */
const hasPhotoInIncompletePairing = (userId, incompletePairings) => {
  return incompletePairings.find(pairing => {
    const isUser1 = pairing.user1_id === userId;
    const isUser2 = pairing.user2_id === userId;
    
    if (isUser1 && pairing.user1_photoURL) return pairing;
    if (isUser2 && pairing.user2_photoURL) return pairing;
    return null;
  });
};

/**
 * Complete incomplete pairings by pairing users who have submitted photos
 */
const completeIncompletePairings = async (incompletePairings, availableUsers) => {
  const completedPairings = [];
  const usedUserIds = new Set();
  
  // Find users who have submitted photos but their partner hasn't
  const usersWithPhotos = [];
  
  for (const pairing of incompletePairings) {
    const user1HasPhoto = !!pairing.user1_photoURL;
    const user2HasPhoto = !!pairing.user2_photoURL;
    
    // Skip if both have photos or neither has photos
    if ((user1HasPhoto && user2HasPhoto) || (!user1HasPhoto && !user2HasPhoto)) {
      continue;
    }
    
    // Find the user who has submitted a photo
    const userWhoHasPhoto = user1HasPhoto ? pairing.user1_id : pairing.user2_id;
    const userWhoNeedsToSubmit = user1HasPhoto ? pairing.user2_id : pairing.user1_id;
    
    // Get the user data for the one who has submitted
    const userWhoHasPhotoData = availableUsers.find(u => u.id === userWhoHasPhoto);
    
    if (userWhoHasPhotoData && !usedUserIds.has(userWhoHasPhoto)) {
      usersWithPhotos.push({
        user: userWhoHasPhotoData,
        pairing: pairing,
        needsNewPartner: true,
        originalPartner: userWhoNeedsToSubmit
      });
      
      console.log(`🔄 Found user ${userWhoHasPhotoData.username || userWhoHasPhoto.substring(0,8)} with photo waiting for ${userWhoNeedsToSubmit.substring(0,8)}`);
    }
  }
  
  console.log(`🔄 Found ${usersWithPhotos.length} users with photos needing new partners`);
  
  // Pair users who have photos with available users
  for (const userWithPhoto of usersWithPhotos) {
    if (usedUserIds.has(userWithPhoto.user.id)) continue;
    
    // Find an available partner (excluding the original partner and already used users)
    const availablePartner = availableUsers.find(user => 
      !usedUserIds.has(user.id) && 
      user.id !== userWithPhoto.user.id &&
      user.id !== userWithPhoto.originalPartner && // Don't pair with original partner
      !userWithPhoto.user.blockedIds?.includes(user.id) &&
      !user.blockedIds?.includes(userWithPhoto.user.id)
    );
    
    if (availablePartner) {
      // Create a new pairing but transfer the existing photo
      const pairingId = uuidv4();
      const chatId = `chat_${pairingId}`;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiresAt = new Date(today);
      expiresAt.setHours(22, 0, 0, 0);
      
      // Determine which user gets which slot and transfer the photo
      const user1_id = userWithPhoto.user.id;
      const user2_id = availablePartner.id;
      const user1_photoURL = userWithPhoto.pairing.user1_id === userWithPhoto.user.id 
        ? userWithPhoto.pairing.user1_photoURL 
        : userWithPhoto.pairing.user2_photoURL;
      const user1_submittedAt = userWithPhoto.pairing.user1_id === userWithPhoto.user.id
        ? userWithPhoto.pairing.user1_submittedAt
        : userWithPhoto.pairing.user2_submittedAt;
      
      const newPairingDoc = {
        id: pairingId,
        date: admin.firestore.Timestamp.fromDate(today),
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        users: [user1_id, user2_id],
        user1_id: user1_id,
        user2_id: user2_id,
        status: 'user1_submitted', // User1 (the one with photo) has already submitted
        user1_photoURL: user1_photoURL,
        user2_photoURL: null,
        user1_submittedAt: user1_submittedAt,
        user2_submittedAt: null,
        completedAt: null,
        chatId: chatId,
        likesCount: 0,
        likedBy: [],
        commentsCount: 0,
        isPrivate: false,
        virtualMeetingLink: `https://meet.jitsi.si/DailyMeetupSelfie-${pairingId}`,
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        migratedFrom: userWithPhoto.pairing.id, // Track that this was migrated
      };
      
      completedPairings.push({
        pairingDoc: newPairingDoc,
        chatId: chatId,
        user1: userWithPhoto.user,
        user2: availablePartner,
        oldPairingId: userWithPhoto.pairing.id
      });
      
      usedUserIds.add(userWithPhoto.user.id);
      usedUserIds.add(availablePartner.id);
      
      console.log(`🔄 Migrating photo from ${userWithPhoto.user.username || userWithPhoto.user.id.substring(0,8)} to new pairing with ${availablePartner.username || availablePartner.id.substring(0,8)}`);
    } else {
      console.log(`⚠️ No available partner found for ${userWithPhoto.user.username || userWithPhoto.user.id.substring(0,8)} with photo`);
    }
  }
  
  return { completedPairings, usedUserIds };
};

/**
 * Create pairings while avoiding recent repeats
 */
const createPairings = (users, history) => {
  // Sort users to prioritize those who were on waitlist yesterday
  users.sort((a, b) => {
    if (a.priorityNextPairing && !b.priorityNextPairing) return -1;
    if (!a.priorityNextPairing && b.priorityNextPairing) return 1;
    return 0;
  });
  
  const pairings = [];
  const paired = new Set();
  const waitlist = [];
  
  // Create a map of recent pairings for quick lookup
  const recentPairings = new Map();
  
  history.forEach(pairing => {
    const [user1, user2] = pairing.users;
    
    if (!recentPairings.has(user1)) {
      recentPairings.set(user1, new Set());
    }
    if (!recentPairings.has(user2)) {
      recentPairings.set(user2, new Set());
    }
    
    recentPairings.get(user1)?.add(user2);
    recentPairings.get(user2)?.add(user1);
  });
  
  // Try to pair each user
  for (let i = 0; i < users.length; i++) {
    const user1 = users[i];
    
    // Skip if already paired
    if (paired.has(user1.id)) continue;
    
    // Try to find a suitable partner
    let foundPartner = false;
    
    for (let j = 0; j < users.length; j++) {
      if (i === j) continue;
      
      const user2 = users[j];
      
      // Skip if already paired or blocked
      if (paired.has(user2.id)) continue;
      if (user1.blockedIds?.includes(user2.id) || user2.blockedIds?.includes(user1.id)) continue;
      
      // Skip if recently paired
      const recentPartners1 = recentPairings.get(user1.id) || new Set();
      if (recentPartners1.has(user2.id)) continue;
      
      // Create pairing
      pairings.push({ user1, user2 });
      paired.add(user1.id);
      paired.add(user2.id);
      foundPartner = true;
      break;
    }
    
    // Add to waitlist if no partner found
    if (!foundPartner && !paired.has(user1.id)) {
      waitlist.push(user1);
    }
  }
  
  return { pairings, waitlist };
};

/**
 * Generate virtual meeting link
 */
const generateVirtualMeetingLink = (pairingId) => {
  return `https://meet.jitsi.si/DailyMeetupSelfie-${pairingId}`;
};

/**
 * Main pairing function
 */
async function createDailyPairings(forceDate = null) {
  console.log('🔄 Starting manual pairing algorithm...');
  
  try {
    // Calculate pairing date
    const pairingDate = forceDate ? new Date(forceDate) : new Date();
    pairingDate.setHours(0, 0, 0, 0);
    
    // Get existing incomplete pairings for today
    const incompletePairings = await getIncompletePairings(pairingDate);
    console.log(`📋 Found ${incompletePairings.length} incomplete pairings to check`);
    
    // Get active users with a simpler query to avoid index issues
    const activeUsersSnapshot = await db.collection('users')
      .where('isActive', '==', true)
      .get();
    
    const activeUsers = activeUsersSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(user => {
        // Apply filters in code instead of query to avoid index requirements
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const hasRecentActivity = user.lastActive && user.lastActive.toDate() > threeDaysAgo;
        const hasLowFlakeStreak = (user.flakeStreak || 0) < 5;
        return hasRecentActivity && hasLowFlakeStreak;
      });
    
    console.log(`📋 Found ${activeUsers.length} active users to pair`);
    
    if (activeUsers.length < 2) {
      console.log('❌ Not enough active users to pair');
      return { success: false, reason: 'Not enough users' };
    }
    
    // STEP 1: Handle users with existing photo submissions
    const { completedPairings, usedUserIds } = await completeIncompletePairings(incompletePairings, activeUsers);
    
    // STEP 2: Filter out users who already have incomplete pairings with photos OR were just paired
    const usersNeedingNewPairings = activeUsers.filter(user => {
      // Skip if already used in migration
      if (usedUserIds.has(user.id)) return false;
      
      // Skip if user has submitted a photo in an incomplete pairing
      const hasPhoto = hasPhotoInIncompletePairing(user.id, incompletePairings);
      if (hasPhoto) {
        console.log(`⏭️ Skipping ${user.username} - already has photo in incomplete pairing`);
        return false;
      }
      
      // Skip if user has an incomplete pairing but no photo yet (give them time to submit)
      const hasIncompletePairing = incompletePairings.find(pairing => 
        pairing.users.includes(user.id)
      );
      if (hasIncompletePairing) {
        console.log(`⏳ Skipping ${user.username} - has incomplete pairing, giving time to submit`);
        return false;
      }
      
      return true;
    });
    
    console.log(`📋 ${usersNeedingNewPairings.length} users need new pairings`);
    
    // STEP 3: Create new pairings for remaining users
    const shuffledUsers = shuffleArray(usersNeedingNewPairings);
    const pairingHistory = await getPairingHistory(7); // Last 7 days
    const { pairings, waitlist } = createPairings(shuffledUsers, pairingHistory);
    
    console.log(`✨ Created ${pairings.length} new pairings with ${waitlist.length} users on waitlist`);
    console.log(`🔄 Migrated ${completedPairings.length} existing photo submissions`);
    
    // STEP 4: Create all pairing documents using batch
    const expiresAt = new Date(pairingDate);
    expiresAt.setHours(22, 0, 0, 0); // 10:00 PM
    
    const batch = db.batch();
    const createdPairings = [];
    
    // Add migrated pairings (with existing photos)
    for (const migration of completedPairings) {
      const pairingRef = db.collection('pairings').doc(migration.pairingDoc.id);
      batch.set(pairingRef, migration.pairingDoc);
      
      // Create new chat room
      const chatRef = db.collection('chatRooms').doc(migration.chatId);
      batch.set(chatRef, {
        id: migration.chatId,
        pairingId: migration.pairingDoc.id,
        userIds: [migration.user1.id, migration.user2.id],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessage: null,
        lastActivityAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Mark old pairing as migrated (optional - for cleanup)
      const oldPairingRef = db.collection('pairings').doc(migration.oldPairingId);
      batch.update(oldPairingRef, {
        status: 'migrated',
        migratedTo: migration.pairingDoc.id,
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      createdPairings.push({
        id: migration.pairingDoc.id,
        user1: migration.user1.username,
        user2: migration.user2.username,
        type: 'migrated'
      });
    }
    
    // Add new pairings
    for (const pairing of pairings) {
      const pairingId = uuidv4();
      const pairingRef = db.collection('pairings').doc(pairingId);
      const chatId = `chat_${pairingId}`;
      
      const pairingDoc = {
        id: pairingId,
        date: admin.firestore.Timestamp.fromDate(pairingDate),
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        users: [pairing.user1.id, pairing.user2.id],
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
        virtualMeetingLink: generateVirtualMeetingLink(pairingId),
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
        type: 'new'
      });
    }
    
    // Handle waitlist users
    for (const waitlistUser of waitlist) {
      const userRef = db.collection('users').doc(waitlistUser.id);
      batch.update(userRef, {
        waitlistedToday: true,
        waitlistedAt: admin.firestore.FieldValue.serverTimestamp(),
        priorityNextPairing: true // Give priority next time
      });
    }
    
    // Commit all changes
    await batch.commit();
    
    console.log('✅ Successfully created pairings:');
    createdPairings.forEach(p => {
      const type = p.type === 'migrated' ? '🔄' : '🆕';
      console.log(`   ${type} ${p.user1} + ${p.user2} (${p.id})`);
    });
    
    if (waitlist.length > 0) {
      console.log(`⏰ Waitlisted users: ${waitlist.map(u => u.username).join(', ')}`);
    }
    
    return {
      success: true,
      pairingsCreated: pairings.length,
      migratedPairings: completedPairings.length,
      waitlistedUsers: waitlist.length,
      details: createdPairings
    };
    
  } catch (error) {
    console.error('❌ Error in pairing algorithm:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Command line interface
 */
async function main() {
  console.log('=== BNOC Manual Pairing Script ===\n');
  
  const args = process.argv.slice(2);
  const forceDate = args[0]; // Optional: pass a date like "2025-05-25"
  
  if (forceDate) {
    console.log(`📅 Creating pairings for date: ${forceDate}`);
  }
  
  const result = await createDailyPairings(forceDate);
  
  if (result.success) {
    console.log(`\n🎉 Pairing completed successfully!`);
    console.log(`📊 Stats: ${result.pairingsCreated} pairings, ${result.migratedPairings} migrated, ${result.waitlistedUsers} waitlisted`);
  } else {
    console.log(`\n❌ Pairing failed: ${result.reason || result.error}`);
  }
  
  process.exit(0);
}

// Export the function for use in other scripts
module.exports = { createDailyPairings };

// Run main if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}
