/**
 * Firebase type declarations to ensure proper TypeScript typing
 */

import { Auth } from 'firebase/auth';

// Extend the global namespace for module augmentation
declare module '../config/firebase' {
  export const auth: Auth;
} 