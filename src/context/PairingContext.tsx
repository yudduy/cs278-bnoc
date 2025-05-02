/**
 * PairingContext
 * 
 * Provides context for managing pairings throughout the app.
 * Modified for demo bypass.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import firebaseService from '../services/firebase';
import { useAuth } from './AuthContext';
import { Pairing, Comment } from '../types';

// Create mock pairing for immediate demo
const now = new Date();
const MOCK_CURRENT_PAIRING: Pairing = {
  id: 'pairing1',
  date: now as any,
  expiresAt: new Date(now.setHours(22, 0, 0, 0)) as any,
  users: ['currentuser', 'user2'],
  status: 'pending',
  selfieURL: '',
  isPrivate: false,
  likes: 0,
  likedBy: [],
  comments: [],
  virtualMeetingLink: 'https://meet.jitsi.si/DailyMeetupSelfie-pairing1'
};

// Context type definition
interface PairingContextType {
  // Current pairing state
  currentPairing: Pairing | null;
  pairingStatus: 'idle' | 'loading' | 'uploading' | 'completed' | 'error';
  pairingError: string | null;
  
  // History
  pairingHistory: Pairing[];
  historyLoading: boolean;
  
  // Actions
  loadCurrentPairing: () => Promise<void>;
  loadPairingHistory: () => Promise<void>;
  completePairing: (data: { 
    frontImage: string; 
    backImage: string; 
    isPrivate: boolean;
  }) => Promise<void>;
  toggleLikePairing: (pairingId: string) => Promise<void>;
  addCommentToPairing: (pairingId: string, commentText: string) => Promise<void>;
  sendReminder: (pairingId: string, partnerId: string) => Promise<void>;
  clearPairingError: () => void;
}

// Create the context
const PairingContext = createContext<PairingContextType | undefined>(undefined);

// Provider props type
interface PairingProviderProps {
  children: ReactNode;
}

// Provider component
export const PairingProvider: React.FC<PairingProviderProps> = ({ children }) => {
  // State - pre-populated for demo
  const [currentPairing, setCurrentPairing] = useState<Pairing | null>(MOCK_CURRENT_PAIRING);
  const [pairingStatus, setPairingStatus] = useState<'idle' | 'loading' | 'uploading' | 'completed' | 'error'>('idle');
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [pairingHistory, setPairingHistory] = useState<Pairing[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  
  // Get auth context
  const { user } = useAuth();
  
  // Load pairing history when component mounts - for demo
  useEffect(() => {
    if (user?.id) {
      loadPairingHistory();
    }
  }, [user?.id]);
  
  /**
   * Load the current pairing for today
   */
  const loadCurrentPairing = async (): Promise<void> => {
    if (!user?.id) {
      setPairingError('User not authenticated');
      return;
    }
    
    try {
      setPairingStatus('loading');
      setPairingError(null);
      
      // For demo, use the mock pairing
      setCurrentPairing(MOCK_CURRENT_PAIRING);
      setPairingStatus('idle');
    } catch (error) {
      console.error('Error loading current pairing:', error);
      setPairingError('Failed to load today\'s pairing');
      setPairingStatus('error');
    }
  };
  
  /**
   * Load pairing history for the current user
   */
  const loadPairingHistory = async (): Promise<void> => {
    if (!user?.id) {
      return;
    }
    
    try {
      setHistoryLoading(true);
      
      const history = await firebaseService.getPairingHistory(user.id);
      setPairingHistory(history);
    } catch (error) {
      console.error('Error loading pairing history:', error);
      Alert.alert('Error', 'Failed to load pairing history');
    } finally {
      setHistoryLoading(false);
    }
  };
  
  /**
   * Complete a pairing by uploading selfie images
   */
  const completePairing = async (data: { 
    frontImage: string; 
    backImage: string; 
    isPrivate: boolean;
  }): Promise<void> => {
    if (!user?.id || !currentPairing) {
      setPairingError('No active pairing found');
      return;
    }
    
    try {
      setPairingStatus('uploading');
      setPairingError(null);
      
      // For demo, just update local state
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate upload delay
      
      // Update the current pairing
      setCurrentPairing(prev => prev ? {
        ...prev,
        status: 'completed',
        frontImage: data.frontImage,
        backImage: data.backImage,
        selfieURL: data.frontImage, // This will be replaced by the stitched image URL in production
        isPrivate: data.isPrivate,
        completedAt: new Date() as any
      } : null);
      
      setPairingStatus('completed');
    } catch (error) {
      console.error('Error completing pairing:', error);
      setPairingError('Failed to upload selfie');
      setPairingStatus('error');
    }
  };
  
  /**
   * Toggle like on a pairing
   */
  const toggleLikePairing = async (pairingId: string): Promise<void> => {
    if (!user?.id) {
      return;
    }
    
    try {
      // For demo, just update local state
      
      // Update current pairing if it matches
      if (currentPairing?.id === pairingId) {
        setCurrentPairing(prev => {
          if (!prev) return null;
          
          const userLiked = prev.likedBy?.includes(user.id);
          const newLikedBy = userLiked 
            ? prev.likedBy.filter(id => id !== user.id)
            : [...(prev.likedBy || []), user.id];
          
          return {
            ...prev,
            likes: userLiked ? Math.max(0, prev.likes - 1) : prev.likes + 1,
            likedBy: newLikedBy
          };
        });
      }
      
      // Update history state if the pairing is in history
      setPairingHistory(prev => {
        return prev.map(p => {
          if (p.id !== pairingId) return p;
          
          const userLiked = p.likedBy?.includes(user.id);
          const newLikedBy = userLiked 
            ? p.likedBy.filter(id => id !== user.id)
            : [...(p.likedBy || []), user.id];
          
          return {
            ...p,
            likes: userLiked ? Math.max(0, p.likes - 1) : p.likes + 1,
            likedBy: newLikedBy
          };
        });
      });
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to like pairing');
    }
  };
  
  /**
   * Add a comment to a pairing
   */
  const addCommentToPairing = async (pairingId: string, commentText: string): Promise<void> => {
    if (!user?.id || !commentText.trim()) {
      return;
    }
    
    try {
      // Create a comment object for demo
      const newComment: Comment = {
        id: Math.random().toString(),
        userId: user.id,
        text: commentText.trim(),
        createdAt: new Date() as any,
        username: user.username,
        userPhotoURL: user.photoURL || 'https://picsum.photos/100/100?random=me'
      };
      
      // Update local state if it's the current pairing
      if (currentPairing?.id === pairingId) {
        setCurrentPairing(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            comments: [...(prev.comments || []), newComment]
          };
        });
      }
      
      // Update history state if the pairing is in history
      setPairingHistory(prev => {
        return prev.map(p => {
          if (p.id !== pairingId) return p;
          
          return {
            ...p,
            comments: [...(p.comments || []), newComment]
          };
        });
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    }
  };
  
  /**
   * Send a reminder to a partner
   */
  const sendReminder = async (pairingId: string, partnerId: string): Promise<void> => {
    try {
      // For demo, just show a success message
      Alert.alert('Success', 'Reminder sent to your partner');
    } catch (error) {
      console.error('Error sending reminder:', error);
      Alert.alert('Error', 'Failed to send reminder');
    }
  };
  
  /**
   * Clear pairing error
   */
  const clearPairingError = (): void => {
    setPairingError(null);
    setPairingStatus('idle');
  };
  
  // Context value
  const value: PairingContextType = {
    currentPairing,
    pairingStatus,
    pairingError,
    pairingHistory,
    historyLoading,
    loadCurrentPairing,
    loadPairingHistory,
    completePairing,
    toggleLikePairing,
    addCommentToPairing,
    sendReminder,
    clearPairingError,
  };
  
  return (
    <PairingContext.Provider value={value}>
      {children}
    </PairingContext.Provider>
  );
};

// Custom hook to use the pairing context
export const usePairing = (): PairingContextType => {
  const context = useContext(PairingContext);
  
  if (context === undefined) {
    throw new Error('usePairing must be used within a PairingProvider');
  }
  
  return context;
};