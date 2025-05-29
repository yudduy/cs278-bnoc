/**
 * Firebase Initialization Module - With Authentication
 * This file handles Firebase initialization including Auth, Firestore, and Storage.
 * Fixed for Expo SDK 53 compatibility.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import logger from '../utils/logger'; // Assuming this path is correct

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhUJt5HOOrR6MRiKKiLZ86unk8V6jKUx4", // IMPORTANT: Consider environment variables
  authDomain: "bnoc.firebaseapp.com",
  projectId: "stone-bison-446302-p0",
  storageBucket: "stone-bison-446302-p0.firebasestorage.app",
  messagingSenderId: "314188937187",
  appId: "1:314188937187:ios:3401193ce380339069d2d6",
  databaseURL: "https://stone-bison-446302-p0-default-rtdb.firebaseio.com"
};

// Global variables to hold Firebase instances
let firebaseAppInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let firestoreDb: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

// Initialize Firebase app
const initializeFirebaseApp = (): FirebaseApp => {
  try {
    if (!getApps().length) {
      firebaseAppInstance = initializeApp(firebaseConfig);
      logger.info('Firebase app initialized successfully');
    } else {
      firebaseAppInstance = getApp();
      logger.info('Using existing Firebase app instance');
    }
    return firebaseAppInstance;
  } catch (error) {
    logger.error('Error initializing Firebase app:', error);
    throw new Error('Failed to initialize Firebase app');
  }
};

// Initialize Firebase Auth - Working approach for Expo SDK 53
const initializeFirebaseAuth = (app: FirebaseApp): Auth => {
  try {
    // Use simple getAuth for Expo - authentication works successfully
    authInstance = getAuth(app);
    logger.info('Firebase Auth initialized successfully');
    return authInstance;
  } catch (error: any) {
    logger.error('Error initializing Firebase Auth:', error);
    throw new Error(`Failed to initialize Firebase Auth: ${error.message || error}`);
  }
};

// Initialize Firebase services
const initializeFirebaseServices = () => {
  try {
    // Initialize app first
    const app = initializeFirebaseApp();
    
    // Initialize Auth
    authInstance = initializeFirebaseAuth(app);
    
    // Initialize Firestore
    try {
      firestoreDb = getFirestore(app);
      logger.info('Firebase Firestore initialized successfully');
    } catch (error: any) {
      logger.error('Error initializing Firebase Firestore:', error);
      throw new Error(`Failed to initialize Firestore: ${error.message || error}`);
    }
    
    // Initialize Storage
    try {
      storageInstance = getStorage(app);
      logger.info('Firebase Storage initialized successfully');
    } catch (error: any) {
      logger.error('Error initializing Firebase Storage:', error);
      throw new Error(`Failed to initialize Storage: ${error.message || error}`);
    }
    
    firebaseAppInstance = app;
    
  } catch (error: any) {
    logger.error('Critical error during Firebase initialization:', error);
    throw error;
  }
};

// Initialize Firebase services immediately
initializeFirebaseServices();

// Export initialized services with proper error handling and type casting
export const firebaseApp: FirebaseApp = (() => {
  if (!firebaseAppInstance) {
    throw new Error('Firebase app not initialized');
  }
  return firebaseAppInstance;
})();

export const auth: Auth = (() => {
  if (!authInstance) {
    throw new Error('Firebase Auth not initialized');
  }
  return authInstance;
})();

export const db: Firestore = (() => {
  if (!firestoreDb) {
    throw new Error('Firebase Firestore not initialized');
  }
  return firestoreDb;
})();

export const storage: FirebaseStorage = (() => {
  if (!storageInstance) {
    throw new Error('Firebase Storage not initialized');
  }
  return storageInstance;
})();

// Safety function to check if Firebase is properly initialized
export const isFirebaseInitialized = (): boolean => {
  return !!(firebaseAppInstance && authInstance && firestoreDb && storageInstance && getApps().length > 0);
};

// Export a singleton to ensure Firebase is only initialized once
export default {
  app: firebaseApp,
  auth,
  db,
  storage,
  isInitialized: isFirebaseInitialized()
};