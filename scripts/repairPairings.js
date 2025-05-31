const admin = require('firebase-admin');

// Pairing Data Repair Script
// This script fixes data integrity issues in the pairings collection

try {
  const serviceAccount = require('../serviceAccountKey.json');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error.message);
  process.exit(1);
}

const db = admin.firestore();

async function repairPairings() {
  console.log('=== BNOC Pairing Data Repair ===\n');
  
  try {
    // Get all users for validation
    console.log('📥 Loading users...');
    const usersSnapshot = await db.collection('users').get();
    const userMap = {};
    usersSnapshot.forEach(doc => {
      userMap[doc.id] = doc.data();
    });
    console.log(`   Found ${Object.keys(userMap).length} users`);
    
    // Get all pairings that need repair
    console.log('\n📥 Loading pairings...');
    const pairingsSnapshot = await db.collection('pairings').get();
    console.log(`   Found ${pairingsSnapshot.size} total pairings`);
    
    let repairedCount = 0;
    let deletedCount = 0;
    let validCount = 0;
    
    for (const doc of pairingsSnapshot.docs) {
      const pairingId = doc.id;
      const pairingData = doc.data();
      
      // Check if this pairing needs repair
      const needsRepair = !pairingData.user1_id || !pairingData.user2_id;
      const hasValidUsers = pairingData.users && Array.isArray(pairingData.users) && pairingData.users.length === 2;
      
      if (needsRepair && hasValidUsers) {
        // Attempt to repair by populating user1_id and user2_id from users array
        const [user1_id, user2_id] = pairingData.users;
        
        // Validate that both users exist
        const user1Exists = userMap[user1_id];
        const user2Exists = userMap[user2_id];
        
        if (user1Exists && user2Exists) {
          // Repair the pairing
          const updateData = {
            user1_id: user1_id,
            user2_id: user2_id,
            lastUpdatedAt: admin.firestore.Timestamp.now()
          };
          
          await db.collection('pairings').doc(pairingId).update(updateData);
          console.log(`✅ Repaired pairing ${pairingId.substring(0, 8)}... (${userMap[user1_id].username || 'unknown'} + ${userMap[user2_id].username || 'unknown'})`);
          repairedCount++;
        } else {
          // Delete pairings with non-existent users
          console.log(`❌ Deleting pairing ${pairingId.substring(0, 8)}... (users don't exist: ${!user1Exists ? user1_id : ''} ${!user2Exists ? user2_id : ''})`);
          await db.collection('pairings').doc(pairingId).delete();
          deletedCount++;
        }
      } else if (!hasValidUsers) {
        // Delete pairings with invalid users array
        console.log(`❌ Deleting pairing ${pairingId.substring(0, 8)}... (invalid users array: ${JSON.stringify(pairingData.users)})`);
        await db.collection('pairings').doc(pairingId).delete();
        deletedCount++;
      } else if (pairingData.user1_id && pairingData.user2_id) {
        // Check if users in user1_id and user2_id actually exist (for pairings that seem complete)
        const user1Exists = userMap[pairingData.user1_id];
        const user2Exists = userMap[pairingData.user2_id];
        
        if (!user1Exists || !user2Exists) {
          console.log(`❌ Deleting pairing ${pairingId.substring(0, 8)}... (referenced users don't exist: ${!user1Exists ? pairingData.user1_id : ''} ${!user2Exists ? pairingData.user2_id : ''})`);
          await db.collection('pairings').doc(pairingId).delete();
          deletedCount++;
        } else {
          // Pairing is valid
          validCount++;
        }
      } else {
        // Pairing is already valid
        validCount++;
      }
    }
    
    console.log('\n📊 REPAIR SUMMARY:');
    console.log(`   ✅ ${repairedCount} pairings repaired`);
    console.log(`   ❌ ${deletedCount} invalid pairings deleted`);
    console.log(`   ✓ ${validCount} pairings were already valid`);
    console.log(`   📝 Total processed: ${repairedCount + deletedCount + validCount}`);
    
  } catch (error) {
    console.error('❌ Error during repair:', error);
    throw error;
  }
}

async function main() {
  await repairPairings();
  console.log('\n🎉 Pairing repair completed!');
  console.log('💡 Run "node checkStatus.js" to verify the repairs');
  process.exit(0);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Repair script failed:', error);
    process.exit(1);
  });
}

module.exports = { repairPairings }; 