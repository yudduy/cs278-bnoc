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
    // Get active users with a simpler query to avoid index issues
    // Temporarily removing complex filters while indexes build
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
    
    // Shuffle users for random pairing
    const shuffledUsers = shuffleArray(activeUsers);
    
    // Get pairing history to avoid recent repeats
    const pairingHistory = await getPairingHistory(7); // Last 7 days
    
    // Pair users while avoiding recent repeats
    const { pairings, waitlist } = createPairings(shuffledUsers, pairingHistory);
    
    console.log(`✨ Created ${pairings.length} pairings with ${waitlist.length} users on waitlist`);
    
    // Calculate pairing date and deadline
    const pairingDate = forceDate ? new Date(forceDate) : new Date();
    pairingDate.setHours(0, 0, 0, 0);
    
    const expiresAt = new Date(pairingDate);
    expiresAt.setHours(22, 0, 0, 0); // 10:00 PM
    
    // Create pairing documents using batch
    const batch = db.batch();
    const createdPairings = [];
    
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
      console.log(`   🤝 ${p.user1} + ${p.user2} (${p.id})`);
    });
    
    if (waitlist.length > 0) {
      console.log(`⏰ Waitlisted users: ${waitlist.map(u => u.username).join(', ')}`);
    }
    
    return {
      success: true,
      pairingsCreated: pairings.length,
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
    console.log(`📊 Stats: ${result.pairingsCreated} pairings, ${result.waitlistedUsers} waitlisted`);
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
