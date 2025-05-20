/**
 * Firebase Initialization Module - Simplified
 * 
 * This file handles Firebase initialization without Auth-specific code.
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
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

// Initialize the app
let firestoreDb: any;
let _storage: any;

try {
  // Initialize Firebase app if it hasn't been initialized yet
  if (!getApps().length) {
    initializeApp(firebaseConfig);
    logger.info('Firebase app initialized successfully');
  }
  
  // Initialize Firestore
  firestoreDb = getFirestore();
  logger.info('Firebase Firestore initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Firestore:', error);
  firestoreDb = {
    collection: () => ({}),
    doc: () => ({}),
    // Minimal fallback implementation
  };
}

// Initialize Storage
try {
  _storage = getStorage();
  logger.info('Firebase Storage initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Storage:', error);
  _storage = {
    ref: () => ({}),
  };
}

// Export initialized services
export const firebaseApp = initializeApp(firebaseConfig);
export const db = firestoreDb;
export const storage = _storage;

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