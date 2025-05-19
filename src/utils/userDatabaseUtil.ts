/**
 * User Database Utility
 * 
 * Utility functions to manage users in Firebase database.
 * Includes test user creation for development purposes.
 */

import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  doc, 
  Timestamp,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AuthUser, User } from '../types/user';

/**
 * Create a test user in the database
 */
export const createTestUser = async (
  email: string,
  password: string,
  username: string,
  displayName?: string
): Promise<User> => {
  try {
    // Check if email already exists
    const emailCheck = query(
      collection(db, 'users'),
      where('email', '==', email)
    );
    
    const emailSnapshot = await getDocs(emailCheck);
    if (!emailSnapshot.empty) {
      throw new Error(`Email ${email} already exists in the database`);
    }
    
    // Check if username already exists
    const usernameCheck = query(
      collection(db, 'users'),
      where('username', '==', username)
    );
    
    const usernameSnapshot = await getDocs(usernameCheck);
    if (!usernameSnapshot.empty) {
      throw new Error(`Username ${username} already exists in the database`);
    }
    
    // Create user in Firestore
    const newUser: AuthUser = {
      email: email,
      password: password, // In a real app, this should be hashed
      username: username,
      displayName: displayName || username,
      createdAt: Timestamp.now(),
      lastActive: Timestamp.now(),
      isActive: true,
      flakeStreak: 0,
      maxFlakeStreak: 0,
      connections: [],
      notificationSettings: {
        pairingNotification: true,
        reminderNotification: true,
        chatNotification: true,
        partnerPhotoSubmittedNotification: true,
        socialNotifications: true,
        quietHoursStart: 22,
        quietHoursEnd: 8
      },
      blockedIds: [],
    };
    
    // Add new user to collection
    const userRef = await addDoc(collection(db, 'users'), newUser);
    
    // Return user with ID
    return {
      ...newUser,
      id: userRef.id,
    } as User;
  } catch (error: any) {
    console.error('Create test user error:', error);
    throw error;
  }
};

/**
 * Create multiple test users at once
 */
export const createTestUsers = async (users: Array<{
  email: string;
  password: string;
  username: string;
  displayName?: string;
}>): Promise<User[]> => {
  const createdUsers: User[] = [];
  
  for (const user of users) {
    try {
      const createdUser = await createTestUser(
        user.email,
        user.password,
        user.username,
        user.displayName
      );
      
      createdUsers.push(createdUser);
      console.log(`Created test user: ${user.username}`);
    } catch (error) {
      console.error(`Error creating test user ${user.username}:`, error);
    }
  }
  
  return createdUsers;
};

/**
 * Delete a test user
 */
export const deleteTestUser = async (email: string): Promise<void> => {
  try {
    // Find user by email
    const userQuery = query(
      collection(db, 'users'),
      where('email', '==', email)
    );
    
    const querySnapshot = await getDocs(userQuery);
    
    if (querySnapshot.empty) {
      throw new Error(`No user found with email ${email}`);
    }
    
    // Delete the user
    for (const docSnapshot of querySnapshot.docs) {
      await deleteDoc(doc(db, 'users', docSnapshot.id));
      console.log(`Deleted user with email ${email}`);
    }
  } catch (error) {
    console.error('Delete test user error:', error);
    throw error;
  }
};

/**
 * Delete all test users
 * Use this with caution - only for development environments
 */
export const deleteAllTestUsers = async (testEmailDomain: string = 'test.stanford.edu'): Promise<number> => {
  try {
    // Find all test users by email domain
    const userQuery = query(
      collection(db, 'users'),
      where('email', '>=', `@${testEmailDomain}`),
      where('email', '<=', `@${testEmailDomain}\uf8ff`)
    );
    
    const querySnapshot = await getDocs(userQuery);
    let deletedCount = 0;
    
    // Delete all found users
    for (const docSnapshot of querySnapshot.docs) {
      await deleteDoc(doc(db, 'users', docSnapshot.id));
      deletedCount++;
    }
    
    console.log(`Deleted ${deletedCount} test users`);
    return deletedCount;
  } catch (error) {
    console.error('Delete all test users error:', error);
    throw error;
  }
};

/**
 * Create a set of standard test users
 */
export const createStandardTestUsers = async (): Promise<User[]> => {
  const standardUsers = [
    {
      email: 'user1@test.stanford.edu',
      password: 'password123',
      username: 'testuser1',
      displayName: 'Test User 1'
    },
    {
      email: 'user2@test.stanford.edu',
      password: 'password123',
      username: 'testuser2',
      displayName: 'Test User 2'
    },
    {
      email: 'admin@test.stanford.edu',
      password: 'admin123',
      username: 'admin',
      displayName: 'Admin User'
    }
  ];
  
  return await createTestUsers(standardUsers);
};

// Export all functions
export default {
  createTestUser,
  createTestUsers,
  deleteTestUser,
  deleteAllTestUsers,
  createStandardTestUsers
};