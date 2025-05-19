/**
 * Firebase type declarations for direct authentication
 * 
 * Updated to remove Firebase Auth dependencies.
 */

// Declare the firebaseInit exports for TypeScript
declare module '../config/firebase' {
  import { Firestore } from 'firebase/firestore';
  import { FirebaseStorage } from 'firebase/storage';
  import { FirebaseApp } from 'firebase/app';
  
  export const db: Firestore;
  export const storage: FirebaseStorage;
  export const firebaseApp: FirebaseApp;
  export function isFirebaseInitialized(): boolean;
}