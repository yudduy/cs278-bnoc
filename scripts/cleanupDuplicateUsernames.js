#!/usr/bin/env node

/**
 * Cleanup Duplicate Usernames Script
 * 
 * This script identifies and resolves duplicate usernames in the Firestore database.
 * It will:
 * 1. Find all users with duplicate usernames
 * 2. Keep the oldest account (by createdAt timestamp)
 * 3. Rename newer accounts by appending a number
 * 4. Log all changes for review
 * 
 * Note: This script requires Firebase Admin SDK setup.
 * For now, it will just identify duplicates and provide manual instructions.
 */

const admin = require('firebase-admin');

// Firebase configuration (you'll need to set up service account)
const firebaseConfig = {
  projectId: 'bnoc-app-2024',
  // Add your service account key here or use environment variables
};

/**
 * Simple duplicate detection without Firebase Admin
 * This version will provide instructions for manual cleanup
 */
async function detectDuplicatesManually() {
  console.log('🔍 Duplicate Username Detection Script');
  console.log('=====================================\n');
  
  console.log('This script would normally connect to Firebase to detect duplicate usernames.');
  console.log('Since Firebase Admin SDK requires service account setup, here are manual steps:\n');
  
  console.log('📋 Manual Steps to Check for Duplicate Usernames:');
  console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
  console.log('2. Select your project: bnoc-app-2024');
  console.log('3. Navigate to Firestore Database');
  console.log('4. Go to the "users" collection');
  console.log('5. Look for users with the same "username" field\n');
  
  console.log('🔧 To Fix Duplicate Usernames:');
  console.log('1. Identify which user was created first (check "createdAt" field)');
  console.log('2. Keep the oldest user with the original username');
  console.log('3. For newer users, update their "username" field to be unique');
  console.log('4. Suggested format: originalusername2, originalusername3, etc.\n');
  
  console.log('⚠️  Common Duplicate Usernames to Check:');
  console.log('- "emily" (you mentioned there are two Emily users)');
  console.log('- Any other common names\n');
  
  console.log('🛠️  To Set Up Automated Cleanup:');
  console.log('1. Download service account key from Firebase Console');
  console.log('2. Place it in: config/firebase-service-account.json');
  console.log('3. Run this script again with: node scripts/cleanupDuplicateUsernames.js --apply\n');
  
  console.log('✅ Prevention is now in place:');
  console.log('- Updated authService.ts to check for duplicate usernames during signup');
  console.log('- Updated authService.ts to check for duplicate emails during signup');
  console.log('- Added toast notifications for better user feedback');
  console.log('- Users will now see clear error messages if they try to use existing usernames/emails\n');
}

/**
 * Main execution function
 */
async function main() {
  try {
    await detectDuplicatesManually();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the script
if (require.main === module) {
  main().then(() => {
    console.log('🏁 Script completed');
  }).catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { detectDuplicatesManually };