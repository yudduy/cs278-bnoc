/**
 * Firebase Initialization Module - Simplified
 * 
 * This file handles Firebase initialization without Auth-specific code.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import logger from '../utils/logger';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhUJt5HOOrR6MRiKKiLZ86unk8V6jKUx4",
  authDomain: "bnoc.firebaseapp.com",
  projectId: "stone-bison-446302-p0",
  storageBucket: "stone-bison-446302-p0.firebasestorage.app", // #kelvin: ts was wrong, it said appspot
  messagingSenderId: "314188937187",
  appId: "1:314188937187:ios:3401193ce380339069d2d6",
  databaseURL: "https://stone-bison-446302-p0-default-rtdb.firebaseio.com"
};

// Initialize with empty defaults to avoid "used before assigned" errors
let firebaseAppInstance: FirebaseApp;
let firestoreDb: Firestore;
let storageInstance: FirebaseStorage;

// Initialize Firebase app
try {
  // Initialize Firebase app if it hasn't been initialized yet
  if (!getApps().length) {
    firebaseAppInstance = initializeApp(firebaseConfig);
    logger.info('Firebase app initialized successfully');
  } else {
    firebaseAppInstance = getApp(); // Get the existing app instance
    logger.info('Using existing Firebase app instance');
  }
} catch (error) {
  logger.error('Error initializing Firebase app:', error);
  firebaseAppInstance = {} as FirebaseApp;
}

// Initialize Firestore
try {
  firestoreDb = getFirestore();
  logger.info('Firebase Firestore initialized successfully');
} catch (error) {
  logger.error('Error initializing Firebase Firestore:', error);
  firestoreDb = {
    collection: () => ({}),
    doc: () => ({}),
    // Minimal fallback implementation
  } as unknown as Firestore;
}

// Initialize Storage
try {
  storageInstance = getStorage();
  logger.info('Firebase Storage initialized successfully');
} catch (error) {
  logger.error('Error initializing Firebase Storage:', error);
  storageInstance = {
    ref: () => ({}),
  } as unknown as FirebaseStorage;
}

// Export initialized services
export const firebaseApp = firebaseAppInstance;
export const db = firestoreDb;
export const storage = storageInstance;

// Safety function to check if Firebase is properly initialized
export const isFirebaseInitialized = () => {
  return !!(firebaseApp && db && storage);
};

// Export a singleton to ensure Firebase is only initialized once
export default {
  app: firebaseApp,
  db,
  storage,
  isInitialized: isFirebaseInitialized()
};