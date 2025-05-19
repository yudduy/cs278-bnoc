/**
 * AuthContext
 * 
 * Context for managing user authentication - fixed for proper Firebase Auth integration.
 */

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { User } from '../types/user';
import * as authService from '../services/authService';

// Context type definitions
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updateUserProfile: async () => {},
  clearError: () => {},
});

// Provider props interface
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider component - real Firebase Auth integration
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Using real authentication state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Set to true initially while we check auth state
  const [error, setError] = useState<string | null>(null);
  
  // Subscribe to Firebase auth state changes
  useEffect(() => {
    console.log("AuthContext subscribing to auth state changes");
    let unsubscribe: (() => void) | undefined;
    
    // If auth is not initialized properly, set loading to false after a timeout
    const authFallbackTimer = setTimeout(() => {
      console.log("AuthContext: Fallback timer triggered, setting loading to false");
      setIsLoading(false);
    }, 2000);
    
    try {
      // Set up auth state listener
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log("Auth state change detected in AuthContext:", firebaseUser?.uid);
        
        // Clear the fallback timer as we got a response
        clearTimeout(authFallbackTimer);
        
        if (firebaseUser) {
          try {
            // Fetch user profile from Firestore
            const userProfile = await authService.getUserProfile(firebaseUser.uid);
            
            if (userProfile) {
              setUser(userProfile);
              setIsAuthenticated(true);
            } else {
              console.log('User authenticated but no document found:', firebaseUser.uid);
              // Create a minimal user profile if document not found
              const minimalUser: User = {
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'user',
                displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                createdAt: Timestamp.now(),
                lastActive: Timestamp.now(),
                isActive: true,
                flakeStreak: 0,
                maxFlakeStreak: 0,
                connections: [],
                notificationSettings: {
                  pairingNotification: true,
                  reminderNotification: true,
                  chatNotification: true,
                  partnerPhotoSubmittedNotification: true,
                  socialNotifications: true,
                  quietHoursStart: 22,
                  quietHoursEnd: 8
                },
                blockedIds: [],
              };
              setUser(minimalUser);
              setIsAuthenticated(true);
            }
          } catch (error) {
            console.error('Error fetching user document:', error);
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          // No user is signed in
          setUser(null);
          setIsAuthenticated(false);
        }
        
        setIsLoading(false);
      });
    } catch (error) {
      console.error("Error setting up auth state listener:", error);
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false); // Ensure loading is set to false on error
      clearTimeout(authFallbackTimer);
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
      clearTimeout(authFallbackTimer);
    };
  }, []);
  
  // Sign in method
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await authService.signIn(email, password);
      setUser(result.user);
      setIsAuthenticated(true);
    } catch (err: any) {
      console.error('Sign in error:', err);
      
      // Provide a more user-friendly error message
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up first.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError(err.message || 'Failed to sign in. Please try again.');
      }
      
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sign up method
  const signUp = async (email: string, password: string, username: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Basic validation
      if (!email.endsWith('@stanford.edu')) {
        setError('Please use a Stanford email address');
        setIsLoading(false);
        return;
      }
      
      const result = await authService.signUp(email, password, username);
      setUser(result.user);
      setIsAuthenticated(true);
    } catch (err: any) {
      console.error('Sign up error:', err);
      
      // Provide a more user-friendly error message
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Try signing in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
      }
      
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sign out method
  const signOut = async () => {
    try {
      await authService.signOut();
      
      // Let the auth state listener handle the state update
      // It will automatically set user to null and isAuthenticated to false
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err.message || 'Failed to sign out');
      
      // Force sign out state even if there's an error
      setUser(null);
      setIsAuthenticated(false);
    }
  };
  
  // Reset password method
  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await authService.resetPassword(email);
    } catch (err: any) {
      console.error('Password reset error:', err);
      
      // Provide a more user-friendly error message
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else {
        setError(err.message || 'Failed to send password reset email');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update user profile method
  const updateUserProfile = async (data: Partial<User>) => {
    if (!user || !user.id) {
      setError('Cannot update profile: No user authenticated');
      return;
    }
    
    try {
      // Let authService handle the update
      const updatedProfile = await authService.getUserProfile(user.id);
      
      if (updatedProfile) {
        setUser(updatedProfile);
      }
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile');
    }
  };
  
  // Clear error method
  const clearError = () => {
    setError(null);
  };
  
  // Context value
  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUserProfile,
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
    console.error('useAuth must be used within an AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};