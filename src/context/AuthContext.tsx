/**
 * AuthContext - Simplified Version
 * 
 * Context for managing user authentication using direct Firestore queries instead of Firebase Auth.
 */

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
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
        console.log('Loading stored authentication');
        const storedUser = await authService.loadStoredAuth();
        
        if (storedUser) {
          console.log('Found stored user:', storedUser.id);
          setUser(storedUser);
          setIsAuthenticated(true);
        } else {
          console.log('No stored authentication found');
        }
      } catch (err) {
        console.error('Error loading authentication:', err);
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
      
      const userData = await authService.signIn(email, password);
      
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err: any) {
      console.error('Sign in error:', err);
      
      // Set error message
      setError(err.message || 'Failed to sign in. Please try again.');
      
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
      
      const userData = await authService.signUp(email, password, username);
      
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err: any) {
      console.error('Sign up error:', err);
      
      // Set error message
      setError(err.message || 'Failed to create account. Please try again.');
      
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
      await authService.signOut();
      
      // Update state
      setUser(null);
      setIsAuthenticated(false);
    } catch (err: any) {
      console.error('Sign out error:', err);
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
      
      await authService.resetPassword(email);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send password reset email');
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
      setIsLoading(true);
      // In a real app, you would update the user profile in the database
      // For this simplified version, we're just updating local state
      
      // Update local state
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      
      // In a real app, you would also update AsyncStorage
    } catch (err: any) {
      console.error('Profile update error:', err);
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
    console.error('useAuth must be used within an AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};