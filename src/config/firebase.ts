/**
 * Firebase configuration module
 * 
 * This file re-exports services from firebaseInit.ts
 * to maintain compatibility with existing imports.
 */

// Import all Firebase services from the initialization module
import { firebaseApp, auth, db, storage } from './firebaseInit';

// Re-export everything for backward compatibility
export { auth, db, storage };
export default firebaseApp;
