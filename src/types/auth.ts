/**
 * Authentication Types
 * 
 * Centralized type definitions for authentication-related functionality.
 */

import { User } from './index';

/**
 * Authentication result returned from sign-in/sign-up operations
 */
export interface AuthResult {
  user: User;
  token?: string; // Optional token for future use
}

/**
 * Authentication context state
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Authentication provider props
 */
export interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Authentication context value
 */
export interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

/**
 * Authentication error types
 */
export type AuthErrorType = 
  | 'invalid_credentials'
  | 'user_not_found'
  | 'email_already_exists'
  | 'username_already_exists'
  | 'weak_password'
  | 'network_error'
  | 'unknown_error';

/**
 * Authentication error
 */
export class AuthError extends Error {
  constructor(
    public type: AuthErrorType,
    message: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}