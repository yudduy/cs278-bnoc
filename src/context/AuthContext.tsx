/**
 * AuthContext - Firebase Authentication Integration
 * 
 * Complete Firebase Auth integration with authentication state management.
 * Fixed for Expo SDK 53 compatibility.
 */

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useFirebase } from '../providers/FirebaseProvider';
import { User } from '../types';
import * as authService from '../services/authService';
import logger from '../utils/logger';

// Context type definitions
interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isNewUser: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  uploadProfilePhoto: (imageUri: string) => Promise<string>;
  completeOnboarding: () => void;
  clearError: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  isNewUser: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updateUserProfile: async () => {},
  uploadProfilePhoto: async () => '',
  completeOnboarding: () => {},
  clearError: () => {},
});

// Provider props
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  
  // Get Firebase services from context
  const { auth } = useFirebase();
  
  // Firebase Auth state listener
  useEffect(() => {
    logger.debug('AuthContext: Setting up auth state listener');
    
    // Check if auth is properly initialized
    if (!auth) {
      logger.error('AuthContext: Auth instance is undefined');
      setError('Authentication service not initialized');
      setIsLoading(false);
      return;
    }
    
    logger.debug('AuthContext: Auth instance is available, setting up listener');
    
    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        try {
          setIsLoading(true);
          setFirebaseUser(firebaseUser);
          
          if (firebaseUser) {
            logger.info('Firebase user authenticated:', firebaseUser.uid);
            
            // Get user profile from Firestore
            const userProfile = await authService.getUserProfile(firebaseUser.uid);
            
            if (userProfile) {
              setUser(userProfile);
              setIsAuthenticated(true);
              setIsNewUser(false); // Existing user
              logger.info('User profile loaded:', userProfile.id);
            } else {
              // This shouldn't happen with proper signup flow
              logger.warn('No user profile found for authenticated user');
              setUser(null);
              setIsAuthenticated(false);
              setError('User profile not found. Please sign up again.');
            }
          } else {
            logger.info('No Firebase user authenticated');
            setUser(null);
            setIsAuthenticated(false);
            setIsNewUser(false);
          }
        } catch (err: any) {
          logger.error('Auth state change error:', err);
          setError(err.message || 'Authentication error occurred');
          setUser(null);
          setIsAuthenticated(false);
        } finally {
          setIsLoading(false);
        }
      });
      
      logger.debug('AuthContext: Auth listener set up successfully');
      return unsubscribe;
    } catch (error) {
      logger.error('AuthContext: Failed to set up auth listener:', error);
      setError('Failed to initialize authentication listener');
      setIsLoading(false);
    }
  }, [auth]); // Add auth as dependency
  
  // Sign in method
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      logger.debug('Attempting to sign in user:', email);
      const userData = await authService.signIn(email, password);
      
      // State will be updated by onAuthStateChanged listener
      logger.info('Sign in successful:', userData.id);
      
    } catch (err: any) {
      logger.error('Sign in error:', err);
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sign up method
  const signUp = async (
    email: string, 
    password: string, 
    username: string, 
    displayName?: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      logger.debug('Attempting to sign up user:', email, username);
      const userData = await authService.signUp(email, password, username, displayName);
      
      // Mark as new user for onboarding
      setIsNewUser(true);
      
      // State will be updated by onAuthStateChanged listener
      logger.info('Sign up successful:', userData.id);
      
    } catch (err: any) {
      logger.error('Sign up error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sign out method
  const signOut = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      logger.debug('Signing out user');
      await authService.signOut();
      
      // State will be updated by onAuthStateChanged listener
      logger.info('Sign out successful');
      
    } catch (err: any) {
      logger.error('Sign out error:', err);
      setError(err.message || 'Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset password method
  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      logger.debug('Requesting password reset for:', email);
      await authService.resetPassword(email);
      
      logger.info('Password reset email sent successfully');
      
    } catch (err: any) {
      logger.error('Password reset error:', err);
      setError(err.message || 'Failed to send password reset email');
      throw err; // Re-throw so the component can handle success state
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update user profile method
  const updateUserProfile = async (data: Partial<User>) => {
    if (!user) {
      throw new Error('No user authenticated');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      logger.debug('Updating user profile:', user.id, Object.keys(data));
      await authService.updateUserProfile(user.id, data);
      
      // Update local state
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      
      logger.info('User profile updated successfully');
      
    } catch (err: any) {
      logger.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Upload profile photo method
  const uploadProfilePhoto = async (imageUri: string): Promise<string> => {
    if (!user) {
      throw new Error('No user authenticated');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      logger.debug('Uploading profile photo for user:', user.id);
      const photoURL = await authService.updateProfilePhoto(
        user.id, 
        imageUri, 
        user.photoURL || undefined
      );
      
      // Update local state
      const updatedUser = { ...user, photoURL };
      setUser(updatedUser);
      
      logger.info('Profile photo uploaded successfully');
      return photoURL;
      
    } catch (err: any) {
      logger.error('Profile photo upload error:', err);
      setError(err.message || 'Failed to upload profile photo');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Complete onboarding method
  const completeOnboarding = () => {
    setIsNewUser(false);
    logger.info('Onboarding completed');
  };
  
  // Clear error method
  const clearError = () => {
    setError(null);
  };
  
  // Context value
  const value: AuthContextType = {
    user,
    firebaseUser,
    isAuthenticated,
    isLoading,
    error,
    isNewUser,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUserProfile,
    uploadProfilePhoto,
    completeOnboarding,
    clearError,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
