/**
 * Create Test Users Script
 * 
 * Run this script to populate the database with test users.
 * For development purposes only.
 */

import { createStandardTestUsers, deleteAllTestUsers } from '../utils/userDatabaseUtil';

// Self-executing async function
(async () => {
  try {
    console.log('Starting test user creation...');
    
    // Uncomment to clean up existing test users first
    // await deleteAllTestUsers();
    
    // Create standard test users
    const users = await createStandardTestUsers();
    
    console.log(`Successfully created ${users.length} test users:`);
    users.forEach(user => {
      console.log(`- ${user.username} (${user.email})`);
    });
    
    console.log('\nTest User Credentials:');
    console.log('1. Regular User:');
    console.log('   Email: user1@test.stanford.edu');
    console.log('   Password: password123');
    console.log('   Username: testuser1');
    console.log('\n2. Alternative User:');
    console.log('   Email: user2@test.stanford.edu');
    console.log('   Password: password123');
    console.log('   Username: testuser2');
    console.log('\n3. Admin User:');
    console.log('   Email: admin@test.stanford.edu');
    console.log('   Password: admin123');
    console.log('   Username: admin');
    
  } catch (error) {
    console.error('Error creating test users:', error);
  }
})();