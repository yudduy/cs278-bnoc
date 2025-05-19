/**
 * Firebase Initialization Module - Simplified
 * 
 * This file handles Firebase initialization without Auth-specific code.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhUJt5HOOrR6MRiKKiLZ86unk8V6jKUx4",
  authDomain: "bnoc.firebaseapp.com",
  projectId: "stone-bison-446302-p0",
  storageBucket: "stone-bison-446302-p0.appspot.com",
  messagingSenderId: "314188937187",
  appId: "1:314188937187:ios:3401193ce380339069d2d6",
  databaseURL: "https://stone-bison-446302-p0-default-rtdb.firebaseio.com"
};

// Initialize the app
const app = initializeApp(firebaseConfig);
console.log('Firebase app initialized successfully');

// Initialize Firestore
let _db: any;
try {
  _db = getFirestore(app);
  console.log('Firebase Firestore initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Firestore:', error);
  _db = {
    collection: () => ({}),
    doc: () => ({}),
  };
}

// Initialize Storage
let _storage: any;
try {
  _storage = getStorage(app);
  console.log('Firebase Storage initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Storage:', error);
  _storage = {
    ref: () => ({}),
  };
}

// Export initialized services
export const firebaseApp = app;
export const db = _db;
export const storage = _storage;

// Safety function to check if Firebase is properly initialized
export const isFirebaseInitialized = () => {
  return !!(app && db && storage);
};

// Export a singleton to ensure Firebase is only initialized once
export default {
  app,
  db,
  storage,
  isInitialized: isFirebaseInitialized()
};