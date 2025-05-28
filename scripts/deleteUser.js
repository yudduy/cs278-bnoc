#!/usr/bin/env node

/**
 * User Deletion Script for BNOC App
 * 
 * This script deletes a user account and handles all associated cleanup:
 * - Remove user from Firebase Authentication
 * - Delete user document from Firestore
 * - Remove user from active pairings
 * - Remove user from all other users' connections arrays
 * - Clean up any orphaned data
 * 
 * Usage: node deleteUser.js <username>
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin SDK
const path = require('path');
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://stone-bison-446302-p0-default-rtdb.firebaseio.com/',
  storageBucket: 'stone-bison-446302-p0.firebasestorage.app'
});

const db = admin.firestore();
const auth = admin.auth();

// Get username from command line arguments
const username = process.argv[2];

if (!username) {
  console.error('Usage: node deleteUser.js <username>');
  process.exit(1);
}

// Create readline interface for confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Find user by username
 */
async function findUserByUsername(username) {
  console.log(`🔍 Searching for user with username: ${username}`);
  
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('username', '==', username).get();
  
  if (snapshot.empty) {
    console.log(`❌ No user found with username: ${username}`);
    return null;
  }
  
  if (snapshot.size > 1) {
    console.log(`⚠️  Multiple users found with username: ${username}`);
    snapshot.forEach(doc => {
      const userData = doc.data();
      console.log(`   - User ID: ${doc.id}, Email: ${userData.email}`);
    });
    return null;
  }
  
  const userDoc = snapshot.docs[0];
  const userData = userDoc.data();
  
  console.log(`✅ Found user:`);
  console.log(`   - User ID: ${userDoc.id}`);
  console.log(`   - Email: ${userData.email}`);
  console.log(`   - Display Name: ${userData.displayName || 'N/A'}`);
  console.log(`   - Created: ${userData.createdAt?.toDate()?.toLocaleDateString() || 'N/A'}`);
  console.log(`   - Connections: ${userData.connections?.length || 0}`);
  
  return {
    id: userDoc.id,
    ...userData
  };
}

/**
 * Remove user from all active pairings
 */
async function removeUserFromPairings(userId) {
  console.log(`\n🔄 Removing user from active pairings...`);
  
  const pairingsRef = db.collection('pairings');
  const snapshot = await pairingsRef.where('users', 'array-contains', userId).get();
  
  if (snapshot.empty) {
    console.log(`   ✅ No active pairings found for user`);
    return;
  }
  
  console.log(`   Found ${snapshot.size} pairing(s) to update`);
  
  const batch = db.batch();
  let updatedPairings = 0;
  
  snapshot.forEach(doc => {
    const pairingData = doc.data();
    
    // If this is a pairing between two users, we need to handle it carefully
    if (pairingData.users?.length === 2) {
      console.log(`   - Updating pairing ${doc.id} (status: ${pairingData.status})`);
      
      // Mark the pairing as cancelled due to user deletion
      batch.update(doc.ref, {
        status: 'cancelled_user_deleted',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        deletedUserId: userId
      });
      
      updatedPairings++;
    }
  });
  
  if (updatedPairings > 0) {
    await batch.commit();
    console.log(`   ✅ Updated ${updatedPairings} pairing(s)`);
  }
}

/**
 * Remove user from all other users' connections arrays
 */
async function removeUserFromConnections(userId, userConnections = []) {
  console.log(`\n🔄 Removing user from other users' connections...`);
  
  if (!userConnections || userConnections.length === 0) {
    console.log(`   ✅ User has no connections to clean up`);
    return;
  }
  
  console.log(`   Found ${userConnections.length} connection(s) to update`);
  
  const batch = db.batch();
  
  for (const connectionId of userConnections) {
    try {
      const connectionRef = db.collection('users').doc(connectionId);
      const connectionDoc = await connectionRef.get();
      
      if (connectionDoc.exists()) {
        const connectionData = connectionDoc.data();
        console.log(`   - Removing from user: ${connectionData.username || connectionId}`);
        
        batch.update(connectionRef, {
          connections: admin.firestore.FieldValue.arrayRemove(userId),
          connectionCount: admin.firestore.FieldValue.increment(-1)
        });
      }
    } catch (error) {
      console.error(`   ⚠️  Error updating connection ${connectionId}:`, error.message);
    }
  }
  
  await batch.commit();
  console.log(`   ✅ Updated connections`);
}

/**
 * Delete user from Firebase Auth
 */
async function deleteUserFromAuth(userId) {
  console.log(`\n🔄 Deleting user from Firebase Authentication...`);
  
  try {
    await auth.deleteUser(userId);
    console.log(`   ✅ Deleted user from Firebase Auth`);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log(`   ⚠️  User not found in Firebase Auth (may have been already deleted)`);
    } else {
      console.error(`   ❌ Error deleting user from Firebase Auth:`, error.message);
      throw error;
    }
  }
}

/**
 * Delete user document from Firestore
 */
async function deleteUserFromFirestore(userId) {
  console.log(`\n🔄 Deleting user document from Firestore...`);
  
  try {
    await db.collection('users').doc(userId).delete();
    console.log(`   ✅ Deleted user document from Firestore`);
  } catch (error) {
    console.error(`   ❌ Error deleting user document:`, error.message);
    throw error;
  }
}

/**
 * Clean up user's notification settings
 */
async function cleanupNotificationSettings(userId) {
  console.log(`\n🔄 Cleaning up notification settings...`);
  
  try {
    const notificationRef = db.collection('notificationSettings').doc(userId);
    const notificationDoc = await notificationRef.get();
    
    if (notificationDoc.exists()) {
      await notificationRef.delete();
      console.log(`   ✅ Deleted notification settings`);
    } else {
      console.log(`   ✅ No notification settings found`);
    }
  } catch (error) {
    console.error(`   ⚠️  Error cleaning up notification settings:`, error.message);
  }
}

/**
 * Main deletion function
 */
async function deleteUser() {
  try {
    // Find the user
    const user = await findUserByUsername(username);
    if (!user) {
      process.exit(1);
    }
    
    // Confirm deletion
    const question = `\n⚠️  Are you sure you want to DELETE user "${username}" (${user.email})?\nThis action cannot be undone! Type "DELETE" to confirm: `;
    
    rl.question(question, async (answer) => {
      if (answer !== 'DELETE') {
        console.log('❌ Deletion cancelled');
        rl.close();
        process.exit(0);
      }
      
      try {
        console.log(`\n🚀 Starting deletion process for user: ${username}`);
        
        // Step 1: Remove from pairings
        await removeUserFromPairings(user.id);
        
        // Step 2: Remove from other users' connections
        await removeUserFromConnections(user.id, user.connections);
        
        // Step 3: Clean up notification settings
        await cleanupNotificationSettings(user.id);
        
        // Step 4: Delete from Firestore
        await deleteUserFromFirestore(user.id);
        
        // Step 5: Delete from Firebase Auth
        await deleteUserFromAuth(user.id);
        
        console.log(`\n✅ Successfully deleted user: ${username}`);
        console.log(`\n📊 Summary:`);
        console.log(`   - User removed from Firebase Auth`);
        console.log(`   - User document deleted from Firestore`);
        console.log(`   - User removed from active pairings`);
        console.log(`   - User removed from ${user.connections?.length || 0} connection(s)`);
        console.log(`   - Notification settings cleaned up`);
        
      } catch (error) {
        console.error(`\n❌ Error during deletion process:`, error.message);
        console.error(error.stack);
      } finally {
        rl.close();
        process.exit(0);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n❌ Process interrupted');
  rl.close();
  process.exit(0);
});

// Run the deletion
deleteUser(); 