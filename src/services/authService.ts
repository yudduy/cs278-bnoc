/**
 * Simplified Authentication Service
 * 
 * Direct Firestore query-based authentication without Firebase Auth.
 */

import { 
  collection,
  query,
  where,
  getDocs,
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  Timestamp,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple password hashing function (in a real app, use a proper hashing library)
// Note: In a production app, hashing should be done server-side
const hashPassword = (password: string): string => {
  // This is a very basic hash and NOT secure for production
  // In real apps, use bcrypt or similar
  return password; // For demo purposes only, we're not actually hashing
};

/**
 * Sign in with username and password using direct Firestore query
 */
export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    console.log('Attempting sign in with:', email);
    
    // Query Firestore for user with matching email and password
    const userQuery = query(
      collection(db, 'users'),
      where('email', '==', email),
      where('password', '==', password) // In a real app, you'd query by email only, then compare hashed passwords
    );
    
    const querySnapshot = await getDocs(userQuery);
    
    if (querySnapshot.empty) {
      console.log('No matching user found');
      throw new Error('Invalid email or password');
    }
    
    // Get the first matching user
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data() as User;
    
    console.log('User found:', userDoc.id);
    
    // Update last login time
    try {
      await updateDoc(doc(db, 'users', userDoc.id), {
        lastActive: serverTimestamp()
      });
    } catch (updateError) {
      console.warn('Could not update last login time:', updateError);
    }
    
    // Store authentication in AsyncStorage
    await AsyncStorage.setItem('authenticatedUser', JSON.stringify({
      ...userData,
      id: userDoc.id
    }));
    
    // Return user data
    return {
      ...userData,
      id: userDoc.id
    };
  } catch (error: any) {
    console.error('Sign in error:', error);
    
    // Add more descriptive error messages
    if (!error.message) {
      error.message = 'Authentication failed. Please try again.';
    }
    
    throw error;
  }
};

/**
 * Sign up with email, password, and username
 */
export const signUp = async (
  email: string, 
  password: string, 
  username: string
): Promise<User> => {
  try {
    console.log('Attempting to create new user:', username);
    
    // Check for Stanford email
    if (!email.toLowerCase().endsWith('@stanford.edu')) {
      throw new Error('Please use a Stanford email address');
    }
    
    // Check if email already exists
    const emailCheck = query(
      collection(db, 'users'),
      where('email', '==', email)
    );
    
    const emailSnapshot = await getDocs(emailCheck);
    if (!emailSnapshot.empty) {
      throw new Error('This email is already in use');
    }
    
    // Check if username already exists
    const usernameCheck = query(
      collection(db, 'users'),
      where('username', '==', username)
    );
    
    const usernameSnapshot = await getDocs(usernameCheck);
    if (!usernameSnapshot.empty) {
      throw new Error('This username is already taken');
    }
    
    // Create user in Firestore
    const newUser: Omit<User, 'id'> & { password: string } = {
      email: email,
      username: username,
      displayName: username,
      password: password, // In a real app, this should be hashed
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
    
    const createdUser = {
      ...newUser,
      id: userRef.id,
    } as unknown as User;
    
    // Store authentication in AsyncStorage
    await AsyncStorage.setItem('authenticatedUser', JSON.stringify(createdUser));
    
    return createdUser;
  } catch (error: any) {
    console.error('Sign up error:', error);
    
    if (!error.message) {
      error.message = 'Failed to create account. Please try again.';
    }
    
    throw error;
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  try {
    // Simply remove the stored authentication
    await AsyncStorage.removeItem('authenticatedUser');
    console.log('User signed out successfully');
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

/**
 * Send password reset email - simplified
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    // Check for Stanford email
    if (!email.toLowerCase().endsWith('@stanford.edu')) {
      throw new Error('Please use a Stanford email address');
    }
    
    // Find user with this email
    const userQuery = query(
      collection(db, 'users'),
      where('email', '==', email)
    );
    
    const querySnapshot = await getDocs(userQuery);
    
    if (querySnapshot.empty) {
      throw new Error('No account found with this email');
    }
    
    // In a real app, this would send an actual email
    // Here we're just simulating the process
    console.log('Password reset requested for:', email);
    
    // Success - no actual email sent in this mock implementation
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw error;
  }
};

/**
 * Load the authenticated user from storage
 */
export const loadStoredAuth = async (): Promise<User | null> => {
  try {
    const storedUser = await AsyncStorage.getItem('authenticatedUser');
    if (storedUser) {
      return JSON.parse(storedUser) as User;
    }
    return null;
  } catch (error) {
    console.error('Error loading stored auth:', error);
    return null;
  }
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Remove password from returned data
      if ('password' in userData) {
        delete userData.password;
      }
      
      return {
        ...userData,
        id: uid
      } as User;
    }
    
    return null;
  } catch (error) {
    console.error('Get user profile error:', error);
    return null;
  }
};

/**
 * Check if a username already exists
 */
export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  try {
    const usernameCheck = query(
      collection(db, 'users'),
      where('username', '==', username)
    );
    
    const snapshot = await getDocs(usernameCheck);
    return snapshot.empty;
  } catch (error) {
    console.error('Error checking username availability:', error);
    return false;
  }
};