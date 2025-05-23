const admin = require('firebase-admin');

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
 * Standardize User Data Structure
 * Fix arrays that are stored as strings and ensure proper data types
 */
async function standardizeUserData() {
  console.log('\n=== BNOC User Data Standardization ===\n');
  
  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    console.log(`📊 Found ${usersSnapshot.size} users to process`);
    
    const batch = db.batch();
    let updatedCount = 0;
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const userId = doc.id;
      const updates = {};
      let needsUpdate = false;
      
      // Fix connections array
      if (userData.connections) {
        if (typeof userData.connections === 'string') {
          try {
            // Parse string that looks like "[user1, user2, user3]"
            const connectionsStr = userData.connections.replace(/[\[\]]/g, '');
            const connectionsArray = connectionsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
            updates.connections = connectionsArray;
            needsUpdate = true;
            console.log(`  🔧 ${userId}: Fixed connections array`);
          } catch (error) {
            console.log(`  ⚠️ ${userId}: Could not parse connections: ${userData.connections}`);
            updates.connections = [];
            needsUpdate = true;
          }
        }
      } else {
        updates.connections = [];
        needsUpdate = true;
      }
      
      // Fix blockedIds array
      if (userData.blockedIds) {
        if (typeof userData.blockedIds === 'string') {
          try {
            if (userData.blockedIds === '[]' || userData.blockedIds === '') {
              updates.blockedIds = [];
            } else {
              const blockedStr = userData.blockedIds.replace(/[\[\]]/g, '');
              const blockedArray = blockedStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
              updates.blockedIds = blockedArray;
            }
            needsUpdate = true;
            console.log(`  🔧 ${userId}: Fixed blockedIds array`);
          } catch (error) {
            console.log(`  ⚠️ ${userId}: Could not parse blockedIds: ${userData.blockedIds}`);
            updates.blockedIds = [];
            needsUpdate = true;
          }
        }
      } else {
        updates.blockedIds = [];
        needsUpdate = true;
      }
      
      // Fix notificationSettings object
      if (userData.notificationSettings) {
        if (typeof userData.notificationSettings === 'string') {
          try {
            // If it's a string like "[Object]", create default settings
            updates.notificationSettings = {
              pairingNotification: true,
              chatNotification: true,
              reminderNotification: true,
              socialNotification: true,
              completionNotification: true,
              quietHoursStart: 22,
              quietHoursEnd: 8
            };
            needsUpdate = true;
            console.log(`  🔧 ${userId}: Fixed notificationSettings object`);
          } catch (error) {
            console.log(`  ⚠️ ${userId}: Could not parse notificationSettings`);
          }
        }
      } else {
        updates.notificationSettings = {
          pairingNotification: true,
          chatNotification: true,
          reminderNotification: true,
          socialNotification: true,
          completionNotification: true,
          quietHoursStart: 22,
          quietHoursEnd: 8
        };
        needsUpdate = true;
      }
      
      // Fix privacySettings object
      if (userData.privacySettings) {
        if (typeof userData.privacySettings === 'string') {
          updates.privacySettings = {
            globalFeedOptIn: true
          };
          needsUpdate = true;
          console.log(`  🔧 ${userId}: Fixed privacySettings object`);
        }
      } else {
        updates.privacySettings = {
          globalFeedOptIn: true
        };
        needsUpdate = true;
      }
      
      // Ensure required fields exist
      if (!userData.flakeStreak && userData.flakeStreak !== 0) {
        updates.flakeStreak = 0;
        needsUpdate = true;
      }
      
      if (!userData.maxFlakeStreak && userData.maxFlakeStreak !== 0) {
        updates.maxFlakeStreak = 0;
        needsUpdate = true;
      }
      
      if (!userData.snoozeTokensRemaining && userData.snoozeTokensRemaining !== 0) {
        updates.snoozeTokensRemaining = 1;
        needsUpdate = true;
      }
      
      // Add lastUpdated timestamp
      updates.lastUpdated = admin.firestore.FieldValue.serverTimestamp();
      needsUpdate = true;
      
      if (needsUpdate) {
        batch.update(doc.ref, updates);
        updatedCount++;
      }
    }
    
    // Commit all updates
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`\n✅ Successfully updated ${updatedCount} users`);
    } else {
      console.log(`\n✅ All users already have correct data structure`);
    }
    
  } catch (error) {
    console.error('❌ Error standardizing user data:', error);
  }
}

/**
 * Verify data structure after standardization
 */
async function verifyDataStructure() {
  console.log('\n=== Verification ===\n');
  
  try {
    const usersSnapshot = await db.collection('users').limit(3).get();
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`📋 User ${doc.id}:`);
      console.log(`  - connections: ${Array.isArray(data.connections) ? '✅ Array' : '❌ Not Array'} (${data.connections?.length || 0} items)`);
      console.log(`  - blockedIds: ${Array.isArray(data.blockedIds) ? '✅ Array' : '❌ Not Array'} (${data.blockedIds?.length || 0} items)`);
      console.log(`  - notificationSettings: ${typeof data.notificationSettings === 'object' && data.notificationSettings !== null ? '✅ Object' : '❌ Not Object'}`);
      console.log(`  - privacySettings: ${typeof data.privacySettings === 'object' && data.privacySettings !== null ? '✅ Object' : '❌ Not Object'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

// Main execution
async function main() {
  await standardizeUserData();
  await verifyDataStructure();
  console.log('=== Standardization Complete ===');
  process.exit(0);
}

main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
