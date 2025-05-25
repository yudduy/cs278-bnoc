/**
 * Firebase Authentication Service
 * 
 * Complete Firebase Auth integration with Firestore profile management.
 * Includes profile photo upload and real password reset.
 */

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject 
} from 'firebase/storage';
import { auth, db, storage } from '../config/firebase';
import { User } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

// Storage keys
const STORAGE_KEYS = {
  USER: 'authenticated_user',
  AUTH_STATE: 'auth_state'
};

/**
 * Create user profile in Firestore
 */
const createUserProfile = async (
  firebaseUser: FirebaseUser, 
  additionalData: {
    username: string;
    displayName?: string;
  }
): Promise<User> => {
  const userRef = doc(db, 'users', firebaseUser.uid);
  
  const userData: Omit<User, 'id'> = {
    email: firebaseUser.email!,
    username: additionalData.username,
    displayName: additionalData.displayName || additionalData.username,
    photoURL: firebaseUser.photoURL || undefined,
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
    createdAt: Timestamp.now(),
    lastActive: Timestamp.now(),
    lastUpdated: Timestamp.now(),
    fcmToken: undefined,
    pushToken: undefined
  };
  
  await setDoc(userRef, userData);
  
  return {
    id: firebaseUser.uid,
    ...userData
  };
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        id: uid,
        ...userData
      } as User;
    }
    
    return null;
  } catch (error) {
    logger.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Sign up with Firebase Auth
 */
export const signUp = async (
  email: string, 
  password: string, 
  username: string,
  displayName?: string
): Promise<User> => {
  try {
    // Validate Stanford email
    if (!email.toLowerCase().endsWith('@stanford.edu')) {
      throw new Error('Please use a Stanford email address');
    }
    
    // Check email availability
    const emailAvailable = await isEmailAvailable(email);
    if (!emailAvailable) {
      throw new Error('This email is already registered. Please sign in instead.');
    }
    
    // Check username availability
    const usernameAvailable = await isUsernameAvailable(username);
    if (!usernameAvailable) {
      throw new Error('Username is already taken. Please choose a different one.');
    }
    
    // Create Firebase Auth user
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth, 
      email, 
      password
    );
    
    // Update Firebase Auth profile
    await updateProfile(userCredential.user, {
      displayName: displayName || username
    });
    
    // Create Firestore profile
    const userProfile = await createUserProfile(userCredential.user, {
      username,
      displayName
    });
    
    // Store auth state
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userProfile));
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_STATE, 'authenticated');
    
    logger.info('User signed up successfully:', userProfile.id);
    return userProfile;
    
  } catch (error: any) {
    logger.error('Sign up error:', error);
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered. Please sign in instead.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use at least 6 characters.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    }
    
    throw error;
  }
};

/**
 * Sign in with Firebase Auth
 */
export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    // Sign in with Firebase Auth
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth, 
      email, 
      password
    );
    
    // Get user profile from Firestore
    const userProfile = await getUserProfile(userCredential.user.uid);
    
    if (!userProfile) {
      throw new Error('User profile not found. Please contact support.');
    }
    
    // Update last active
    await updateDoc(doc(db, 'users', userCredential.user.uid), {
      lastActive: serverTimestamp()
    });
    
    // Store auth state
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userProfile));
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_STATE, 'authenticated');
    
    logger.info('User signed in successfully:', userProfile.id);
    return userProfile;
    
  } catch (error: any) {
    logger.error('Sign in error:', error);
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email address.');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Incorrect password. Please try again.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    } else if (error.code === 'auth/user-disabled') {
      throw new Error('This account has been disabled. Please contact support.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed attempts. Please try again later.');
    } else if (error.code === 'auth/invalid-credential') {
      throw new Error('Invalid email or password. Please check your credentials.');
    }
    
    throw error;
  }
};

/**
 * Sign out
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
    
    // Clear stored auth state
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
    
    logger.info('User signed out successfully');
  } catch (error) {
    logger.error('Sign out error:', error);
    throw error;
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    // Validate Stanford email
    if (!email.toLowerCase().endsWith('@stanford.edu')) {
      throw new Error('Please use a Stanford email address');
    }
    
    await sendPasswordResetEmail(auth, email);
    logger.info('Password reset email sent to:', email);
    
  } catch (error: any) {
    logger.error('Password reset error:', error);
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email address.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    }
    
    throw error;
  }
};

/**
 * Upload profile photo to Firebase Storage
 */
export const uploadProfilePhoto = async (
  userId: string, 
  imageUri: string
): Promise<string> => {
  try {
    // Create unique filename
    const timestamp = Date.now();
    const filename = `profile_${userId}_${timestamp}.jpg`;
    const storageRef = ref(storage, `profile_photos/${filename}`);
    
    // Convert image URI to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Upload to Firebase Storage
    const snapshot = await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    logger.info('Profile photo uploaded successfully:', downloadURL);
    return downloadURL;
    
  } catch (error) {
    logger.error('Profile photo upload error:', error);
    throw new Error('Failed to upload profile photo. Please try again.');
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string, 
  updates: Partial<User>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Add timestamp
    const updateData = {
      ...updates,
      lastUpdated: serverTimestamp()
    };
    
    await updateDoc(userRef, updateData);
    
    // Update Firebase Auth profile if display name changed
    if (updates.displayName && auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: updates.displayName
      });
    }
    
    logger.info('User profile updated successfully:', userId);
    
  } catch (error) {
    logger.error('Profile update error:', error);
    throw error;
  }
};

/**
 * Check username availability
 */
export const isUsernameAvailable = async (username: string): Promise<boolean> => {
  try {
    const usernameQuery = query(
      collection(db, 'users'),
      where('username', '==', username)
    );
    
    const snapshot = await getDocs(usernameQuery);
    return snapshot.empty;
    
  } catch (error) {
    logger.error('Username availability check error:', error);
    return false;
  }
};

/**
 * Check email availability
 */
export const isEmailAvailable = async (email: string): Promise<boolean> => {
  try {
    const emailQuery = query(
      collection(db, 'users'),
      where('email', '==', email.toLowerCase())
    );
    
    const snapshot = await getDocs(emailQuery);
    return snapshot.empty;
    
  } catch (error) {
    logger.error('Email availability check error:', error);
    return false;
  }
};

/**
 * Load stored authentication state
 */
export const loadStoredAuth = async (): Promise<User | null> => {
  try {
    const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    const authState = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_STATE);
    
    if (storedUser && authState === 'authenticated') {
      const user = JSON.parse(storedUser) as User;
      
      // Verify user still exists in Firestore
      const currentProfile = await getUserProfile(user.id);
      if (currentProfile) {
        return currentProfile;
      }
    }
    
    return null;
  } catch (error) {
    logger.error('Error loading stored auth:', error);
    return null;
  }
};

/**
 * Get current Firebase Auth user
 */
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

/**
 * Delete old profile photo from storage
 */
export const deleteProfilePhoto = async (photoURL: string): Promise<void> => {
  try {
    if (photoURL && photoURL.includes('firebase')) {
      // Extract file path from URL
      const decodedUrl = decodeURIComponent(photoURL);
      const pathMatch = decodedUrl.match(/profile_photos%2F([^?]+)/);
      
      if (pathMatch) {
        const filePath = `profile_photos/${pathMatch[1]}`;
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
        logger.info('Old profile photo deleted:', filePath);
      }
    }
  } catch (error) {
    logger.warn('Could not delete old profile photo:', error);
    // Don't throw error - this is not critical
  }
};

/**
 * Update profile photo
 */
export const updateProfilePhoto = async (
  userId: string,
  imageUri: string,
  oldPhotoURL?: string
): Promise<string> => {
  try {
    // Delete old photo if exists
    if (oldPhotoURL) {
      await deleteProfilePhoto(oldPhotoURL);
    }
    
    // Upload new photo
    const newPhotoURL = await uploadProfilePhoto(userId, imageUri);
    
    // Update user profile
    await updateUserProfile(userId, { photoURL: newPhotoURL });
    
    // Update Firebase Auth profile
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        photoURL: newPhotoURL
      });
    }
    
    return newPhotoURL;
    
  } catch (error) {
    logger.error('Profile photo update error:', error);
    throw error;
  }
};
