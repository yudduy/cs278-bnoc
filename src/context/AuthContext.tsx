/**
 * AuthContext
 * 
 * Context for managing user authentication - modified for demo bypass.
 */

import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User } from '../types';

// Create a mock user for demo purposes
const DEMO_USER: User = {
  id: 'currentuser',
  email: 'demo@example.com',
  username: 'demo',
  displayName: 'Demo User',
  photoURL: 'https://picsum.photos/100/100?random=user',
  createdAt: { seconds: Date.now() / 1000 } as any,
  lastActive: { seconds: Date.now() / 1000 } as any,
  isActive: true,
  flakeStreak: 1,
  maxFlakeStreak: 3,
  blockedIds: [],
  notificationSettings: {
    pairingNotification: true,
    reminderNotification: true,
    completionNotification: true,
    quietHoursStart: 22,
    quietHoursEnd: 8
  },
  snoozeTokensRemaining: 1,
  snoozeTokenLastRefilled: { seconds: Date.now() / 1000 } as any,
};

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

// Create context with default values and mock user for demo
const AuthContext = createContext<AuthContextType>({
  user: DEMO_USER, // Always provide the demo user
  isAuthenticated: true, // Always authenticated for demo
  isLoading: false,
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

// AuthProvider component - simplified for demo
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // For demo purposes, we'll start with the user already authenticated
  const [user, setUser] = useState<User | null>(DEMO_USER);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Simplified mock methods
  const signIn = async () => {
    setUser(DEMO_USER);
    setIsAuthenticated(true);
  };
  
  const signUp = async () => {
    setUser(DEMO_USER);
    setIsAuthenticated(true);
  };
  
  const signOut = async () => {
    // For demo, we'll just keep the user authenticated
    console.log('Sign out attempted - bypassed for demo');
  };
  
  const resetPassword = async () => {
    console.log('Password reset attempted - bypassed for demo');
  };
  
  const updateUserProfile = async (data: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...data } : DEMO_USER);
  };
  
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};