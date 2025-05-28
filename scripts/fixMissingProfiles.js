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

const auth = admin.auth();
const db = admin.firestore();

/**
 * Create missing Firestore profiles for Firebase Auth users
 */
async function fixMissingProfiles() {
  console.log('🔧 Fixing missing Firestore profiles...');
  
  try {
    // Get all Firebase Auth users
    const authUsers = await auth.listUsers(1000);
    console.log(`Found ${authUsers.users.length} Firebase Auth users`);
    
    let profilesCreated = 0;
    let profilesSkipped = 0;
    
    for (const userRecord of authUsers.users) {
      const uid = userRecord.uid;
      const email = userRecord.email;
      
      // Check if Firestore profile exists
      const profileDoc = await db.collection('users').doc(uid).get();
      
      if (profileDoc.exists) {
        console.log(`✅ ${email} - Profile already exists`);
        profilesSkipped++;
        continue;
      }
      
      // Create missing profile
      console.log(`🔧 Creating profile for ${email} (${uid})`);
      
      // Generate username from email
      const username = email ? email.split('@')[0] : `user_${uid.slice(0, 8)}`;
      
      const profileData = {
        email: email || '',
        username: username,
        displayName: userRecord.displayName || username,
        photoURL: userRecord.photoURL || null,
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
          completionNotification: true,
          quietHoursStart: 22,
          quietHoursEnd: 8
        },
        privacySettings: {
          globalFeedOptIn: true
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastActive: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        fcmToken: null,
        pushToken: null
      };
      
      await db.collection('users').doc(uid).set(profileData);
      console.log(`✅ Profile created for ${email} with username: ${username}`);
      profilesCreated++;
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`✅ Profiles created: ${profilesCreated}`);
    console.log(`⏭️  Profiles skipped: ${profilesSkipped}`);
    console.log(`🎉 All Firebase Auth users now have Firestore profiles!`);
    
    return { profilesCreated, profilesSkipped };
    
  } catch (error) {
    console.error('❌ Error fixing profiles:', error);
    throw error;
  }
}

/**
 * Verify all profiles exist
 */
async function verifyProfiles() {
  console.log('🔍 Verifying all profiles exist...');
  
  try {
    const authUsers = await auth.listUsers(1000);
    let allProfilesExist = true;
    
    for (const userRecord of authUsers.users) {
      const profileDoc = await db.collection('users').doc(userRecord.uid).get();
      
      if (!profileDoc.exists) {
        console.log(`❌ Missing profile for ${userRecord.email} (${userRecord.uid})`);
        allProfilesExist = false;
      }
    }
    
    if (allProfilesExist) {
      console.log('✅ All Firebase Auth users have Firestore profiles!');
    } else {
      console.log('❌ Some profiles are still missing');
    }
    
    return allProfilesExist;
    
  } catch (error) {
    console.error('❌ Error verifying profiles:', error);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    await fixMissingProfiles();
    console.log('');
    await verifyProfiles();
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  fixMissingProfiles,
  verifyProfiles
}; 