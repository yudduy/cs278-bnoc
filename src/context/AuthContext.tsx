/**
 * AuthContext - Simplified Version
 * 
 * Context for managing user authentication using direct Firestore queries instead of Firebase Auth.
 */

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User } from '../types/user';
import * as authService from '../services/authService';
import logger from '../utils/logger';

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

// AuthProvider component - simplified implementation
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load stored authentication on mount
  useEffect(() => {
    const loadAuth = async () => {
      try {
        logger.info('Loading stored authentication');
        const storedUser = await authService.loadStoredAuth();
        
        if (storedUser) {
          logger.info(`Found stored user: ${storedUser.id}`);
          setUser(storedUser);
          setIsAuthenticated(true);
        } else {
          logger.info('No stored authentication found');
        }
      } catch (err) {
        logger.error('Error loading authentication:', err);
        setError('Failed to load authentication data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAuth();
  }, []);
  
  // Sign in method
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!email || !password) {
        setError('Email and password are required');
        setIsLoading(false);
        return;
      }
      
      logger.debug('Attempting to sign in user', { email });
      const userData = await authService.signIn(email, password);
      
      if (!userData) {
        throw new Error('No user data returned after sign in');
      }
      
      logger.info(`User signed in successfully: ${userData.id}`);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err: any) {
      logger.error('Sign in error:', err);
      
      // Set user-friendly error message based on error type
      if (err.message?.includes('credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (err.message?.includes('network')) {
        setError('Network error. Please check your connection.');
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
      if (!email.toLowerCase().endsWith('@stanford.edu')) {
        setError('Please use a Stanford email address');
        setIsLoading(false);
        return;
      }
      
      if (!username || username.length < 3) {
        setError('Username must be at least 3 characters long');
        setIsLoading(false);
        return;
      }
      
      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters long');
        setIsLoading(false);
        return;
      }
      
      logger.debug('Attempting to sign up user', { email, username });
      const userData = await authService.signUp(email, password, username);
      
      if (!userData) {
        throw new Error('No user data returned after sign up');
      }
      
      logger.info(`User registered successfully: ${userData.id}`);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err: any) {
      logger.error('Sign up error:', err);
      
      // Set user-friendly error message based on error type
      if (err.message?.includes('email')) {
        setError('This email is already in use. Please try another.');
      } else if (err.message?.includes('username')) {
        setError('This username is already taken. Please try another.');
      } else if (err.message?.includes('network')) {
        setError('Network error. Please check your connection.');
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
      setIsLoading(true);
      logger.debug('Signing out user', { userId: user?.id });
      await authService.signOut();
      
      // Update state
      setUser(null);
      setIsAuthenticated(false);
      logger.info('User signed out successfully');
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
      
      if (!email) {
        setError('Email is required');
        setIsLoading(false);
        return;
      }
      
      // Basic validation
      if (!email.toLowerCase().endsWith('@stanford.edu')) {
        setError('Please use a Stanford email address');
        setIsLoading(false);
        return;
      }
      
      logger.debug('Requesting password reset', { email });
      await authService.resetPassword(email);
      logger.info(`Password reset email sent to ${email}`);
    } catch (err: any) {
      logger.error('Password reset error:', err);
      
      if (err.message?.includes('user') || err.message?.includes('email')) {
        setError('No account found with this email address');
      } else if (err.message?.includes('network')) {
        setError('Network error. Please check your connection.');
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
      setIsLoading(true);
      const errorMsg = 'Cannot update profile: No user authenticated';
      logger.error(errorMsg);
      setError(errorMsg);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      logger.debug('Updating user profile', { userId: user.id, fields: Object.keys(data) });
      
      // In a real app, you would update the user profile in the database
      // and await the result here before updating local state
      
      // Update local state
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      
      logger.info(`User profile updated successfully: ${user.id}`);
    } catch (err: any) {
      logger.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
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
    logger.error('useAuth must be used within an AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};