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
import * as userService from '../services/userService';
import * as autoPairingService from '../services/autoPairingService';
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
  signUp: (email: string, password: string, username: string, displayName?: string, profileImageUri?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  uploadProfilePhoto: (imageUri: string) => Promise<string>;
  completeOnboarding: () => void;
  clearError: () => void;
  refreshUserData: () => Promise<void>;
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
  refreshUserData: async () => {},
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
    
    try {      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        try {
          logger.debug('AuthContext: onAuthStateChanged triggered, firebaseUser:', firebaseUser?.uid || 'null');
          setIsLoading(true);
          setFirebaseUser(firebaseUser);
          
          if (firebaseUser) {
            logger.info('Firebase user authenticated:', firebaseUser.uid);
            
            // Get user profile from Firestore
            logger.debug('AuthContext: Fetching user profile from Firestore');
            const userProfile = await authService.getUserProfile(firebaseUser.uid);
            
            if (userProfile) {
              logger.info('AuthContext: User profile loaded successfully:', userProfile.id);
              setUser(userProfile);
              setIsAuthenticated(true);
              setIsNewUser(false); // Existing user
              logger.info('AuthContext: Authentication state updated - isAuthenticated: true');
              
              // Check if user needs auto-pairing (for existing users without pairings today)
              try {
                const needsPairing = await autoPairingService.needsAutoPairing(userProfile.id);
                if (needsPairing) {
                  logger.info('Existing user needs auto-pairing:', userProfile.id);
                  const autoPairingSuccess = await autoPairingService.autoPairNewUser(userProfile.id);
                  
                  if (autoPairingSuccess) {
                    logger.info('Auto-pairing successful for existing user:', userProfile.id);
                  } else {
                    logger.warn('Auto-pairing failed for existing user:', userProfile.id);
                  }
                }
              } catch (autoPairingError) {
                logger.error('Auto-pairing check error for existing user:', userProfile.id, autoPairingError);
                // Don't fail the login process if auto-pairing fails
              }
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
          logger.debug('AuthContext: Setting isLoading to false');
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
      setError(null);
      
      logger.debug('Attempting to sign in user:', email);
      const userData = await authService.signIn(email, password);
      
      // Force check auth state after successful sign in
      logger.info('Sign in successful, checking current auth state:', userData.id);
      
      // Give Firebase a moment to update, then check current user
      setTimeout(async () => {
        try {
          const currentUser = auth.currentUser;
          logger.debug('Current Firebase user after sign-in:', currentUser?.uid);
          
          if (currentUser) {
            const userProfile = await authService.getUserProfile(currentUser.uid);
            if (userProfile) {
              logger.info('Manually updating auth state after sign-in');
              setUser(userProfile);
              setIsAuthenticated(true);
              setIsNewUser(false);
              setIsLoading(false);
            }
          }
        } catch (err) {
          logger.error('Error in manual auth state check:', err);
        }
      }, 100);
      
    } catch (err: any) {
      logger.error('Sign in error:', err);
      setError(err.message || 'Failed to sign in. Please try again.');
      setIsLoading(false); // Only set loading false on error
    }
  };
    // Sign up method
  const signUp = async (
    email: string, 
    password: string, 
    username: string, 
    displayName?: string,
    profileImageUri?: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      logger.debug('Attempting to sign up user:', email, username);
      const userData = await authService.signUp(email, password, username, displayName, profileImageUri);
      
      // Mark as new user for onboarding
      setIsNewUser(true);
      
      // State will be updated by onAuthStateChanged listener
      logger.info('Sign up successful:', userData.id);
      
      // Auto-pairing is now handled automatically by Firestore trigger
      // No manual function call needed - it will trigger when the user document is created
      logger.info('Auto-pairing will be handled automatically by Firestore trigger');
      
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
  
  // Refresh user data from Firebase (e.g., after adding friends)
  const refreshUserData = async () => {
    if (!user) {
      return;
    }
    
    try {
      logger.debug('Refreshing user data from Firebase:', user.id);
      const refreshedUser = await userService.getUserById(user.id);
      
      if (refreshedUser) {
        setUser(refreshedUser);
        logger.info('User data refreshed successfully, connections:', refreshedUser.connections?.length || 0);
      }
    } catch (err: any) {
      logger.error('Error refreshing user data:', err);
      // Don't throw here - it's a background refresh
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
    refreshUserData,
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
