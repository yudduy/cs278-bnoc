#!/usr/bin/env node

/**
 * Complete Incomplete Pairings Script
 * 
 * This script identifies incomplete pairings where one user submitted a photo
 * but their partner didn't respond, and creates artificial completions by:
 * 
 * 1. Finding all incomplete pairings (user1_submitted or user2_submitted status)
 * 2. Using the responding partner's photo as the placeholder for the non-responding partner
 * 3. Updating the pairing status to 'completed'
 * 4. Adding the completed pairing to the global feed
 * 5. Updating user profiles with the completed pairing
 * 
 * Usage: node complete-incomplete-pairings.js [--dry-run]
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin SDK
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://stone-bison-446302-p0-default-rtdb.firebaseio.com/',
  storageBucket: 'stone-bison-446302-p0.firebasestorage.app'
});

const db = admin.firestore();
const storage = admin.storage();
const bucket = storage.bucket();

// Command line options
const isDryRun = process.argv.includes('--dry-run');

/**
 * Find all incomplete pairings
 */
async function findIncompletePairings() {
  console.log('🔍 Finding incomplete pairings...');
  
  const pairingsRef = db.collection('pairings');
  
  // Find pairings with user1_submitted or user2_submitted status
  const user1SubmittedQuery = pairingsRef.where('status', '==', 'user1_submitted');
  const user2SubmittedQuery = pairingsRef.where('status', '==', 'user2_submitted');
  
  const [user1Results, user2Results] = await Promise.all([
    user1SubmittedQuery.get(),
    user2SubmittedQuery.get()
  ]);
  
  const incompletePairings = [];
  
  // Process user1_submitted pairings
  user1Results.forEach(doc => {
    const data = doc.data();
    incompletePairings.push({
      id: doc.id,
      ...data,
      submittedBy: 'user1',
      waitingUser: 'user2',
      submittedPhotoURL: data.user1_photoURL,
      missingPhotoField: 'user2_photoURL'
    });
  });
  
  // Process user2_submitted pairings
  user2Results.forEach(doc => {
    const data = doc.data();
    incompletePairings.push({
      id: doc.id,
      ...data,
      submittedBy: 'user2',
      waitingUser: 'user1',
      submittedPhotoURL: data.user2_photoURL,
      missingPhotoField: 'user1_photoURL'
    });
  });
  
  console.log(`Found ${incompletePairings.length} incomplete pairing(s)`);
  return incompletePairings;
}

/**
 * Get user information
 */
async function getUserInfo(userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return null;
    }
    return { id: userId, ...userDoc.data() };
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error.message);
    return null;
  }
}

/**
 * Create artificial photo URL using the same image as the responding partner
 */
function createArtificialPhotoURL(submittedPhotoURL, pairingId, waitingUserId) {
  // Extract the original filename and token from the submitted photo URL
  const urlParts = submittedPhotoURL.split('/');
  const filenamePart = urlParts[urlParts.length - 1]; // Gets the filename with query params
  const [filename, queryParams] = filenamePart.split('?');
  
  // Extract the original timestamp from the submitted photo filename
  const originalTimestamp = filename.split('_').pop().split('.')[0];
  
  // Create new filename for the artificial completion
  const artificialFilename = `user_${waitingUserId}_artificial_${originalTimestamp}.jpg`;
  
  // Create the artificial photo URL pointing to the same image content
  const artificialPhotoURL = submittedPhotoURL.replace(
    filename,
    artificialFilename
  ).replace(
    /token=[^&]+/,
    `token=artificial-${Date.now()}`
  );
  
  return artificialPhotoURL;
}

/**
 * Complete an incomplete pairing
 */
async function completeIncompletePairing(pairing) {
  const { id, submittedBy, waitingUser, submittedPhotoURL, missingPhotoField } = pairing;
  
  console.log(`\n🔄 Processing pairing ${id}`);
  
  // Get user information
  const user1 = await getUserInfo(pairing.user1_id);
  const user2 = await getUserInfo(pairing.user2_id);
  
  if (!user1 || !user2) {
    console.log(`   ⚠️  Skipping - missing user data`);
    return false;
  }
  
  const submittingUser = submittedBy === 'user1' ? user1 : user2;
  const waitingUserInfo = waitingUser === 'user1' ? user1 : user2;
  
  console.log(`   📸 ${submittingUser.username} submitted photo`);
  console.log(`   ⏰ ${waitingUserInfo.username} didn't respond - using ${submittingUser.username}'s photo`);
  
  if (isDryRun) {
    console.log(`   🔍 [DRY RUN] Would complete this pairing artificially`);
    console.log(`   🔍 [DRY RUN] Would use photo: ${submittedPhotoURL}`);
    return true;
  }
  
  try {
    // Create artificial photo URL using the same image as the responding partner
    const artificialPhotoURL = createArtificialPhotoURL(
      submittedPhotoURL, 
      id, 
      waitingUserInfo.id
    );
    
    // Prepare update data
    const updateData = {
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isArtificialCompletion: true,
      artificialCompletionReason: 'Partner did not respond - using responding partner\'s photo'
    };
    
    // Set the artificial photo URL for the waiting user
    updateData[missingPhotoField] = artificialPhotoURL;
    
    if (waitingUser === 'user1') {
      updateData.user1_submittedAt = admin.firestore.FieldValue.serverTimestamp();
    } else {
      updateData.user2_submittedAt = admin.firestore.FieldValue.serverTimestamp();
    }
    
    // Update the pairing
    await db.collection('pairings').doc(id).update(updateData);
    
    // Add to global feed
    const completedPairing = { ...pairing, ...updateData };
    await addToGlobalFeed(completedPairing, user1, user2, true);
    
    console.log(`   ✅ Completed pairing artificially using ${submittingUser.username}'s photo`);
    return true;
    
  } catch (error) {
    console.error(`   ❌ Error completing pairing ${id}:`, error.message);
    return false;
  }
}

/**
 * Add completed pairing to global feed
 */
async function addToGlobalFeed(pairing, user1, user2, isArtificial = false) {
  try {
    const feedData = {
      pairingId: pairing.id,
      user1_id: user1.id,
      user2_id: user2.id,
      user1_username: user1.username,
      user2_username: user2.username,
      user1_displayName: user1.displayName || user1.username,
      user2_displayName: user2.displayName || user2.username,
      user1_photoURL: pairing.user1_photoURL,
      user2_photoURL: pairing.user2_photoURL,
      date: pairing.date,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      likesCount: 0,
      likedBy: [],
      commentsCount: 0,
      isPrivate: pairing.isPrivate || false,
      isArtificialCompletion: isArtificial,
      artificialCompletionReason: isArtificial ? pairing.artificialCompletionReason : null
    };
    
    await db.collection('globalFeed').add(feedData);
    console.log(`   📱 Added to global feed`);
    
  } catch (error) {
    console.error(`   ⚠️  Error adding to global feed:`, error.message);
  }
}

/**
 * Display summary of incomplete pairings
 */
async function displaySummary(pairings) {
  console.log('\n📊 INCOMPLETE PAIRINGS SUMMARY\n');
  
  for (let i = 0; i < pairings.length; i++) {
    const pairing = pairings[i];
    
    const user1 = await getUserInfo(pairing.user1_id);
    const user2 = await getUserInfo(pairing.user2_id);
    
    if (!user1 || !user2) continue;
    
    const submittingUser = pairing.submittedBy === 'user1' ? user1 : user2;
    const waitingUserInfo = pairing.waitingUser === 'user1' ? user1 : user2;
    
    console.log(`${i + 1}. Pairing ${pairing.id.substring(0, 8)}...`);
    console.log(`   📸 ${submittingUser.username} (@${submittingUser.username}) - SUBMITTED`);
    console.log(`   ⏰ ${waitingUserInfo.username} (@${waitingUserInfo.username}) - WAITING`);
    console.log(`   📅 Date: ${pairing.date}`);
    console.log(`   📊 Status: ${pairing.status}`);
    console.log(`   🔄 Will use ${submittingUser.username}'s photo for both users\n`);
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 INCOMPLETE PAIRINGS COMPLETION SCRIPT');
    console.log('=====================================\n');
    
    if (isDryRun) {
      console.log('🔍 RUNNING IN DRY RUN MODE - No changes will be made\n');
    }
    
    // Find all incomplete pairings
    const incompletePairings = await findIncompletePairings();
    
    if (incompletePairings.length === 0) {
      console.log('✅ No incomplete pairings found - all clean!');
      return;
    }
    
    // Display summary
    await displaySummary(incompletePairings);
    
    if (!isDryRun) {
      // Prompt for confirmation
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const question = `⚠️  Are you sure you want to complete ${incompletePairings.length} incomplete pairing(s) artificially?\nEach will use the responding partner's photo for both users.\nType "COMPLETE" to confirm: `;
      
      rl.question(question, async (answer) => {
        if (answer !== 'COMPLETE') {
          console.log('❌ Operation cancelled');
          rl.close();
          return;
        }
        
        // Process all incomplete pairings
        console.log(`\n🔄 Processing ${incompletePairings.length} incomplete pairing(s)...\n`);
        
        let completed = 0;
        let failed = 0;
        
        for (const pairing of incompletePairings) {
          const success = await completeIncompletePairing(pairing);
          if (success) {
            completed++;
          } else {
            failed++;
          }
        }
        
        console.log(`\n✅ COMPLETION SUMMARY:`);
        console.log(`   - Successfully completed: ${completed}`);
        console.log(`   - Failed: ${failed}`);
        console.log(`   - Total processed: ${incompletePairings.length}`);
        console.log(`\n💡 Each completed pairing now shows the same photo for both users.`);
        console.log(`   The responding partner's photo was used for the artificial completion.`);
        
        rl.close();
      });
    } else {
      console.log(`\n🔍 DRY RUN COMPLETE:`);
      console.log(`   - Found ${incompletePairings.length} incomplete pairing(s)`);
      console.log(`   - Each would use the responding partner's photo for both users`);
      console.log(`   - Run without --dry-run to actually complete them`);
    }
    
  } catch (error) {
    console.error('❌ Script error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n❌ Process interrupted');
  process.exit(0);
});

// Run the script
main();
