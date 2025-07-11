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
    photoURL?: string;
  }
): Promise<User> => {
  const userRef = doc(db, 'users', firebaseUser.uid);
  
  const userData: Omit<User, 'id'> = {
    email: firebaseUser.email!,
    username: additionalData.username,
    displayName: additionalData.displayName || additionalData.username,
    photoURL: additionalData.photoURL || firebaseUser.photoURL || undefined,
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
    fcmToken: "none",
    pushToken: "none"
  };
  
  // Create the document data with server timestamps
  const firestoreData = {
    ...userData,
    createdAt: serverTimestamp(),
    lastActive: serverTimestamp(),
    lastUpdated: serverTimestamp(),
  };
  
  try {
    await setDoc(userRef, firestoreData);
    logger.info('Firestore profile created successfully for user:', firebaseUser.uid);
    
    // Return the user with the actual timestamp values
    return {
      id: firebaseUser.uid,
      ...userData,
      createdAt: Timestamp.now(),
      lastActive: Timestamp.now(),
      lastUpdated: Timestamp.now(),
    };
  } catch (error) {
    logger.error('Error creating Firestore profile:', error);
    throw new Error('Failed to create user profile. Please try again.');
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
  displayName?: string,
  profileImageUri?: string
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
    
    let photoURL: string | undefined;
    
    // Upload profile photo if provided
    if (profileImageUri) {
      try {
        photoURL = await uploadProfilePhoto(userCredential.user.uid, profileImageUri);
        logger.info('Profile photo uploaded successfully:', photoURL);
      } catch (photoError) {
        logger.error('Profile photo upload failed:', photoError);
        // Continue with user creation even if photo upload fails
        logger.warn('Continuing user creation without profile photo');
      }
    }
    
    // Update Firebase Auth profile
    await updateProfile(userCredential.user, {
      displayName: displayName || username,
      photoURL: photoURL
    });
    
    // Create Firestore profile
    const userProfile = await createUserProfile(userCredential.user, {
      username,
      displayName,
      photoURL
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
 * Find user by username and return their email
 */
export const getUserEmailByUsername = async (username: string): Promise<string | null> => {
  try {
    const usernameQuery = query(
      collection(db, 'users'),
      where('username', '==', username)
    );
    
    const snapshot = await getDocs(usernameQuery);
    
    if (!snapshot.empty) {
      const userData = snapshot.docs[0].data();
      return userData.email;
    }
    
    return null;
  } catch (error) {
    logger.error('Error finding user by username:', error);
    return null;
  }
};

/**
 * Sign in with Firebase Auth - supports both email and username
 */
export const signIn = async (emailOrUsername: string, password: string): Promise<User> => {
  try {
    let email = emailOrUsername;
    
    // Check if input is username (doesn't contain @) and convert to email
    if (!emailOrUsername.includes('@')) {
      const foundEmail = await getUserEmailByUsername(emailOrUsername);
      if (!foundEmail) {
        throw new Error('Username not found. Please check your username or use your email address.');
      }
      email = foundEmail;
    }
    
    // Sign in with Firebase Auth using email
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
 * Check email availability - checks both Firebase Auth and Firestore
 */
export const isEmailAvailable = async (email: string): Promise<boolean> => {
  try {
    // First check Firestore
    const emailQuery = query(
      collection(db, 'users'),
      where('email', '==', email.toLowerCase())
    );
    
    const snapshot = await getDocs(emailQuery);
    if (!snapshot.empty) {
      return false; // Email exists in Firestore
    }
    
    // Also check Firebase Auth by attempting to fetch sign-in methods
    // This is a more reliable way to check if email exists in Firebase Auth
    try {
      const { fetchSignInMethodsForEmail } = await import('firebase/auth');
      const signInMethods = await fetchSignInMethodsForEmail(auth, email.toLowerCase());
      return signInMethods.length === 0; // Available if no sign-in methods exist
    } catch (authError: any) {
      // If the error is about user not found, email is available
      if (authError.code === 'auth/user-not-found') {
        return true;
      }
      // For other errors, assume email might be taken to be safe
      logger.warn('Error checking Firebase Auth for email:', authError);
      return false;
    }
    
  } catch (error) {
    logger.error('Email availability check error:', error);
    return false; // Assume not available on error to be safe
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
