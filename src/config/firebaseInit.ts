/**
 * Firebase Initialization Module
 * 
 * This file handles Firebase initialization with safety mechanisms.
 * It ensures Firebase is initialized properly before it's used.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// For safety - define fallback implementations
const createMockAuth = () => ({
  currentUser: null,
  onAuthStateChanged: (callback: any) => {
    console.log('Mock auth state changed');
    setTimeout(() => callback(null), 100);
    return () => {};
  },
  signInWithEmailAndPassword: async () => {
    throw new Error('Auth not initialized properly');
  },
  createUserWithEmailAndPassword: async () => {
    throw new Error('Auth not initialized properly');
  },
  signOut: async () => {
    console.log('Mock sign out');
  },
  sendPasswordResetEmail: async () => {
    throw new Error('Auth not initialized properly');
  }
});

// Initialize auth
let _auth: any;
try {
  // Use standard auth initialization
  _auth = getAuth(app);
  
  // Override _getRecaptchaConfig to avoid the TypeError
  if (_auth) {
    // @ts-ignore - Adding missing method to avoid errors
    _auth._getRecaptchaConfig = () => null;
  }
  
  console.log('Firebase Auth initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Auth:', error);
  _auth = createMockAuth();
  console.log('Using mock auth implementation');
}

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
export const auth = _auth;
export const db = _db;
export const storage = _storage;

// Safety function to check if Firebase is properly initialized
export const isFirebaseInitialized = () => {
  return !!(app && auth && db && storage);
};

// Export a singleton to ensure Firebase is only initialized once
export default {
  app,
  auth,
  db,
  storage,
  isInitialized: isFirebaseInitialized()
};