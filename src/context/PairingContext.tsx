/**
 * PairingContext
 * 
 * Provides context for managing pairings throughout the app.
 * Implements real Firebase service calls for pairing operations.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import firebaseService from '../services/firebase';
import { useAuth } from './AuthContext';
import { Pairing, SubmitPhotoParams, Comment } from '../types';

// Context type definition
interface PairingContextType {
  // Current pairing state
  currentPairing: Pairing | null;
  pairingStatus: 'idle' | 'loading' | 'uploading' | 'waiting' | 'completed' | 'error';
  pairingError: string | null;
  waitingForUser: string | null; // ID of the user we're waiting for
  partnerUsername: string | null; // Username of the partner
  
  // History
  pairingHistory: Pairing[];
  historyLoading: boolean;
  
  // Actions
  loadCurrentPairing: () => Promise<void>;
  loadPairingHistory: () => Promise<void>;
  submitPhoto: (params: SubmitPhotoParams) => Promise<void>;
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
  // State for pairing management
  const [currentPairing, setCurrentPairing] = useState<Pairing | null>(null);
  const [pairingStatus, setPairingStatus] = useState<'idle' | 'loading' | 'uploading' | 'waiting' | 'completed' | 'error'>('idle');
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [pairingHistory, setPairingHistory] = useState<Pairing[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [waitingForUser, setWaitingForUser] = useState<string | null>(null);
  const [partnerUsername, setPartnerUsername] = useState<string | null>(null);
  
  // Get auth context
  const { user } = useAuth();
  
  // Load current pairing and history when component mounts or user changes
  useEffect(() => {
    if (user?.id) {
      loadCurrentPairing();
      loadPairingHistory();
    } else {
      setCurrentPairing(null);
      setPairingHistory([]);
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
      setWaitingForUser(null);
      setPartnerUsername(null);
      
      // Fetch the current pairing from Firebase
      const pairing = await firebaseService.getCurrentPairing(user.id);
      setCurrentPairing(pairing);
      
      // Update status based on pairing state
      if (pairing) {
        // Determine the partner's ID
        const partnerId = pairing.user1_id === user.id ? pairing.user2_id : pairing.user1_id;
        
        // Fetch the partner's profile to get their username
        const partnerUser = await firebaseService.getUserById(partnerId);
        if (partnerUser) {
          setPartnerUsername(partnerUser.username || partnerUser.displayName || 'Your partner');
        }
        
        if (pairing.status === 'completed') {
          setPairingStatus('completed');
        } else if (pairing.status === 'user1_submitted' && pairing.user1_id === user.id) {
          // Current user has submitted, waiting for partner
          setPairingStatus('waiting');
          setWaitingForUser(pairing.user2_id);
        } else if (pairing.status === 'user2_submitted' && pairing.user2_id === user.id) {
          // Current user has submitted, waiting for partner
          setPairingStatus('waiting');
          setWaitingForUser(pairing.user1_id);
        } else {
          setPairingStatus('idle');
        }
      } else {
        setPairingStatus('idle');
      }
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
   * Submit a photo for a pairing
   */
  const submitPhoto = async (params: SubmitPhotoParams): Promise<void> => {
    if (!user?.id || !currentPairing) {
      setPairingError('No active pairing found');
      return;
    }
    
    try {
      setPairingStatus('uploading');
      setPairingError(null);
      
      console.log('Submitting photo for pairing:', currentPairing.id);
      
      // Upload the photo using Firebase service
      await firebaseService.submitPairingPhoto(
        currentPairing.id,
        user.id,
        params.photoURL,
        params.isPrivate || false
      );
      
      console.log('Photo submitted successfully');
      
      // Refresh the current pairing to get updated status
      await loadCurrentPairing();
      
      // Update status based on new pairing state
      const refreshedPairing = await firebaseService.getPairingById(currentPairing.id);
      if (refreshedPairing) {
        if (refreshedPairing.status === 'completed') {
          setPairingStatus('completed');
        } else {
          // Determine if we're waiting for the partner
          const isUser1 = refreshedPairing.user1_id === user.id;
          const isUser2 = refreshedPairing.user2_id === user.id;
          const partnerId = isUser1 ? refreshedPairing.user2_id : refreshedPairing.user1_id;
          
          if ((isUser1 && refreshedPairing.status === 'user1_submitted') ||
              (isUser2 && refreshedPairing.status === 'user2_submitted')) {
            setPairingStatus('waiting');
            setWaitingForUser(partnerId);
            
            // Fetch partner username if not already set
            if (!partnerUsername) {
              try {
                const partnerUser = await firebaseService.getUserById(partnerId);
                if (partnerUser) {
                  setPartnerUsername(partnerUser.username || partnerUser.displayName || 'Your partner');
                }
              } catch (error) {
                console.error('Error fetching partner username:', error);
              }
            }
          } else {
            setPairingStatus('idle');
          }
        }
      } else {
        setPairingStatus('idle');
      }
    } catch (error) {
      console.error('Error submitting photo:', error);
      setPairingError('Failed to upload photo: ' + (error instanceof Error ? error.message : String(error)));
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
      // Use Firebase service to toggle like
      await firebaseService.toggleLikePairing(pairingId, user.id);
      
      // Refresh current pairing if it matches the toggled one
      if (currentPairing?.id === pairingId) {
        await loadCurrentPairing();
      }
      
      // Refresh pairing history to reflect the change
      await loadPairingHistory();
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
      // Use Firebase service to add the comment
      await firebaseService.addCommentToPairing(pairingId, user.id, commentText.trim());
      
      // Refresh data to reflect changes
      if (currentPairing?.id === pairingId) {
        await loadCurrentPairing();
      }
      
      // Refresh pairing history if needed
      const matchingHistoryItem = pairingHistory.find(p => p.id === pairingId);
      if (matchingHistoryItem) {
        await loadPairingHistory();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    }
  };
  
  /**
   * Send a reminder to a partner
   */
  const sendReminder = async (pairingId: string, partnerId: string): Promise<void> => {
    if (!user?.id) {
      setPairingError('User not authenticated');
      return;
    }
    
    try {
      // Start loading state
      setPairingStatus('loading');
      
      // Call the notification service to send reminder
      await firebaseService.sendPairingReminder(pairingId, user.id, partnerId);
      
      // Show confirmation to user
      Alert.alert('Reminder Sent', 'A reminder has been sent to your partner.');
      
      // Reset status
      if (currentPairing?.status === 'user1_submitted' || currentPairing?.status === 'user2_submitted') {
        setPairingStatus('waiting');
      } else {
        setPairingStatus('idle');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      setPairingError('Failed to send reminder. Please try again.');
      setPairingStatus('error');
      Alert.alert('Error', 'Failed to send reminder. Please try again.');
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
    waitingForUser,
    partnerUsername,
    pairingHistory,
    historyLoading,
    loadCurrentPairing,
    loadPairingHistory,
    submitPhoto,
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