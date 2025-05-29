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
  
  // Handle connections stored as JSON string or array
  let connectionsArray = [];
  if (typeof userConnections === 'string') {
    try {
      connectionsArray = JSON.parse(userConnections);
    } catch (error) {
      console.log(`   ⚠️  Invalid connections data format, skipping connection cleanup`);
      return;
    }
  } else if (Array.isArray(userConnections)) {
    connectionsArray = userConnections;
  }
  
  if (!connectionsArray || connectionsArray.length === 0) {
    console.log(`   ✅ User has no connections to clean up`);
    return;
  }
  
  console.log(`   Found ${connectionsArray.length} connection(s) to update`);
  
  const batch = db.batch();
  let updatedConnections = 0;
  
  for (const connectionId of connectionsArray) {
    try {
      const connectionRef = db.collection('users').doc(connectionId);
      const connectionDoc = await connectionRef.get();
      
      if (connectionDoc.exists) {
        const connectionData = connectionDoc.data();
        console.log(`   - Removing from user: ${connectionData.username || connectionId}`);
        
        // Handle connections that might be stored as JSON string
        let currentConnections = connectionData.connections || [];
        if (typeof currentConnections === 'string') {
          try {
            currentConnections = JSON.parse(currentConnections);
          } catch (parseError) {
            console.log(`   ⚠️  Could not parse connections for ${connectionId}, skipping`);
            continue;
          }
        }
        
        // Remove the deleted user from the connections array
        const updatedConnections = currentConnections.filter(id => id !== userId);
        
        batch.update(connectionRef, {
          connections: JSON.stringify(updatedConnections),
          connectionCount: Math.max(0, (connectionData.connectionCount || 0) - 1)
        });
        
        updatedConnections++;
      } else {
        console.log(`   ⚠️  Connection user ${connectionId} not found, skipping`);
      }
    } catch (error) {
      console.error(`   ⚠️  Error updating connection ${connectionId}:`, error.message);
    }
  }
  
  if (updatedConnections > 0) {
    await batch.commit();
    console.log(`   ✅ Updated ${updatedConnections} connection(s)`);
  } else {
    console.log(`   ⚠️  No connections were updated`);
  }
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
 * Clean up user's notification settings and notifications
 */
async function cleanupNotificationSettings(userId) {
  console.log(`\n🔄 Cleaning up notification settings and notifications...`);
  
  let cleanupCount = 0;
  
  try {
    // Clean up notification settings
    const notificationRef = db.collection('notificationSettings').doc(userId);
    const notificationDoc = await notificationRef.get();
    
    if (notificationDoc.exists) {
      await notificationRef.delete();
      console.log(`   ✅ Deleted notification settings`);
      cleanupCount++;
    } else {
      console.log(`   ✅ No notification settings found`);
    }
  } catch (error) {
    console.error(`   ⚠️  Error cleaning up notification settings:`, error.message);
  }
  
  try {
    // Clean up user's notifications
    const notificationsRef = db.collection('notifications');
    const userNotifications = await notificationsRef.where('userId', '==', userId).get();
    
    if (!userNotifications.empty) {
      const batch = db.batch();
      userNotifications.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`   ✅ Deleted ${userNotifications.size} notification(s)`);
      cleanupCount += userNotifications.size;
    } else {
      console.log(`   ✅ No notifications found for user`);
    }
  } catch (error) {
    console.error(`   ⚠️  Error cleaning up notifications:`, error.message);
  }
  
  return cleanupCount;
}

/**
 * Clean up chat rooms and messages where user was a participant
 */
async function cleanupUserChats(userId) {
  console.log(`\n🔄 Cleaning up user's chat rooms...`);
  
  try {
    const chatRoomsRef = db.collection('chatRooms');
    const userChats = await chatRoomsRef.where('userIds', 'array-contains', userId).get();
    
    if (userChats.empty) {
      console.log(`   ✅ No chat rooms found for user`);
      return 0;
    }
    
    console.log(`   Found ${userChats.size} chat room(s) to clean up`);
    
    const batch = db.batch();
    let cleanedChats = 0;
    
    for (const chatDoc of userChats.docs) {
      const chatData = chatDoc.data();
      const chatId = chatDoc.id;
      
      // Delete all messages in the chat room
      const messagesRef = db.collection('chatRooms').doc(chatId).collection('messages');
      const messages = await messagesRef.get();
      
      messages.forEach(messageDoc => {
        batch.delete(messageDoc.ref);
      });
      
      // Delete the chat room itself
      batch.delete(chatDoc.ref);
      cleanedChats++;
      
      console.log(`   - Cleaning chat room: ${chatId} (${messages.size} messages)`);
    }
    
    await batch.commit();
    console.log(`   ✅ Cleaned up ${cleanedChats} chat room(s)`);
    return cleanedChats;
    
  } catch (error) {
    console.error(`   ⚠️  Error cleaning up chat rooms:`, error.message);
    return 0;
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
        
        // Step 3: Clean up chat rooms and messages
        const cleanedChats = await cleanupUserChats(user.id);
        
        // Step 4: Clean up notification settings and notifications
        const cleanedNotifications = await cleanupNotificationSettings(user.id);
        
        // Step 5: Delete from Firestore
        await deleteUserFromFirestore(user.id);
        
        // Step 6: Delete from Firebase Auth
        await deleteUserFromAuth(user.id);
        
        console.log(`\n✅ Successfully deleted user: ${username}`);
        console.log(`\n📊 Summary:`);
        console.log(`   - User removed from Firebase Auth`);
        console.log(`   - User document deleted from Firestore`);
        console.log(`   - User removed from active pairings`);
        
        // Handle connections count display
        let connectionsCount = 0;
        if (user.connections) {
          if (typeof user.connections === 'string') {
            try {
              const parsed = JSON.parse(user.connections);
              connectionsCount = Array.isArray(parsed) ? parsed.length : 0;
            } catch (e) {
              connectionsCount = 0;
            }
          } else if (Array.isArray(user.connections)) {
            connectionsCount = user.connections.length;
          }
        }
        
        console.log(`   - User removed from ${connectionsCount} connection(s)`);
        console.log(`   - Cleaned up ${cleanedChats} chat room(s)`);
        console.log(`   - Cleaned up ${cleanedNotifications} notification(s) and settings`);
        
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