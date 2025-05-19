/**
 * Authentication Service
 * 
 * Handles user authentication with Firebase Authentication.
 */

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  User as FirebaseUser,
  UserCredential,
  Auth
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types/user';

/**
 * Sign in with email and password
 */
export const signIn = async (email: string, password: string): Promise<{
  user: User;
  credential: UserCredential;
}> => {
  try {
    // Check if auth is initialized
    if (!auth) {
      throw new Error('Authentication service is not properly initialized');
    }
    
    // Sign in with Firebase Auth
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = credential.user;

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (userDoc.exists()) {
      // Update last login
      try {
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          lastActive: serverTimestamp()
        });
      } catch (updateError) {
        console.warn('Could not update last login time:', updateError);
        // Don't fail the sign-in process for this
      }
      
      // Return user data
      const userData = userDoc.data() as User;
      return {
        user: {
          ...userData,
          id: firebaseUser.uid
        },
        credential
      };
    } else {
      // Create user document if it doesn't exist (rare case)
      // This handles the edge case where a user might have an auth account but no document
      const newUser: User = {
        id: firebaseUser.uid,
        email: email,
        username: email.split('@')[0],
        displayName: email.split('@')[0],
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
      
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      } catch (setDocError) {
        console.error('Error creating user document:', setDocError);
        // Still return the user data even if Firestore fails
      }
      
      return {
        user: newUser,
        credential
      };
    }
  } catch (error: any) {
    console.error('Sign in error:', error);
    
    // Add more descriptive error messages
    if (error.code === 'auth/invalid-credential') {
      error.message = 'Invalid email or password';
    } else if (error.code === 'auth/user-not-found') {
      error.message = 'No account found with this email';
    } else if (error.code === 'auth/too-many-requests') {
      error.message = 'Too many failed attempts. Please try again later';
    } else if (!error.message) {
      error.message = 'Authentication failed. Please try again.';
    }
    
    throw error;
  }
};

/**
 * Sign up with email and password
 */
export const signUp = async (
  email: string, 
  password: string, 
  username: string
): Promise<{
  user: User;
  credential: UserCredential;
}> => {
  try {
    // Check if auth is initialized
    if (!auth) {
      throw new Error('Authentication service is not properly initialized');
    }
    
    // Check for Stanford email
    if (!email.toLowerCase().endsWith('@stanford.edu')) {
      throw new Error('Please use a Stanford email address');
    }
    
    // Create user in Firebase Auth
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = credential.user;
    
    // Create user in Firestore
    const newUser: User = {
      id: firebaseUser.uid,
      email: email,
      username: username,
      displayName: username,
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
    
    try {
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
    } catch (setDocError) {
      console.error('Error creating user document:', setDocError);
      // Continue with the sign up even if Firestore fails
    }
    
    return {
      user: newUser,
      credential
    };
  } catch (error: any) {
    console.error('Sign up error:', error);
    
    // Add more descriptive error messages
    if (error.code === 'auth/email-already-in-use') {
      error.message = 'This email is already in use';
    } else if (error.code === 'auth/weak-password') {
      error.message = 'Password is too weak';
    } else if (!error.message) {
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
    if (!auth) {
      throw new Error('Authentication service is not properly initialized');
    }
    
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    if (!auth) {
      throw new Error('Authentication service is not properly initialized');
    }
    
    // Check for Stanford email
    if (!email.toLowerCase().endsWith('@stanford.edu')) {
      throw new Error('Please use a Stanford email address');
    }
    
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Password reset error:', error);
    
    // Add more descriptive error messages
    if (error.code === 'auth/user-not-found') {
      error.message = 'No account found with this email';
    } else if (!error.message) {
      error.message = 'Failed to send password reset email. Please try again.';
    }
    
    throw error;
  }
};

/**
 * Get the current Firebase user from auth state
 */
export const getCurrentFirebaseUser = (): FirebaseUser | null => {
  if (!auth) {
    console.error('Auth service not initialized');
    return null;
  }
  return auth.currentUser;
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (userDoc.exists()) {
      return {
        ...userDoc.data(),
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
  // In a real implementation, this would query Firestore for matching usernames
  // For this implementation, we'll simply assume usernames are available
  return true;
}; 