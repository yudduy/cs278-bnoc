/**
 * PairingContext
 * 
 * Provides context for managing pairings throughout the app.
 * Implements real Firebase service calls for pairing operations.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Alert } from 'react-native';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../config/firebase';
import firebaseService from '../services/firebase';
import { useAuth } from './AuthContext';
import { Pairing, SubmitPhotoParams, Comment, PairingStatus } from '../types';
import { Timestamp } from 'firebase/firestore';

// Context type definition
interface PairingContextType {
  // Current pairing state
  currentPairing: Pairing | null;
  pairingStatus: 'idle' | 'loading' | 'uploading' | 'waiting' | 'completed' | 'error';
  pairingError: string | null;
  waitingForUser: string | null; // ID of the user we're waiting for
  partnerUsername: string | null; // Username of the partner
  
  // Introduction tracking
  hasSeenTodaysPairingIntro: boolean;
  
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
  markPairingIntroAsSeen: () => void;
  clearPairingError: () => void;
  
  // Planner mode functions
  setPhotoMode: (mode: 'together') => Promise<void>;
  getPhotoModeStatus: () => {
    hasChoice: boolean;
    mode: 'together' | null;
    chosenBy: string | null;
    chosenByUsername: string | null;
    isCurrentUserChoice: boolean;
  };
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
  const [hasSeenTodaysPairingIntro, setHasSeenTodaysPairingIntro] = useState<boolean>(false);
  const [lastPairingDate, setLastPairingDate] = useState<string | null>(null);
  const [hasLoggedNoPairing, setHasLoggedNoPairing] = useState<boolean>(false);
  const [hasLoggedCurrentPairingDebug, setHasLoggedCurrentPairingDebug] = useState<boolean>(false);
  
  // Real-time listener cleanup
  const [pairingListener, setPairingListener] = useState<Unsubscribe | null>(null);
  
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
      // Clean up listener if user logs out
      if (pairingListener) {
        pairingListener();
        setPairingListener(null);
      }
    }
    
    // Cleanup listener on unmount
    return () => {
      if (pairingListener) {
        pairingListener();
        setPairingListener(null);
      }
    };
  }, [user?.id]);
  
  // Set up real-time listener for current pairing when it changes
  useEffect(() => {
    if (currentPairing?.id && user?.id) {
      console.log('DEBUG: Setting up real-time listener for pairing:', currentPairing.id);
      setupPairingListener(currentPairing.id);
    } else {
      // Clean up listener if no current pairing
      if (pairingListener) {
        console.log('DEBUG: Cleaning up pairing listener - no current pairing');
        pairingListener();
        setPairingListener(null);
      }
    }
    
    return () => {
      if (pairingListener) {
        pairingListener();
        setPairingListener(null);
      }
    };
  }, [currentPairing?.id, user?.id]); // Add user?.id as dependency for safety
  
  /**
   * Set up real-time listener for pairing updates
   */
  const setupPairingListener = (pairingId: string) => {
    // Clean up existing listener
    if (pairingListener) {
      console.log('DEBUG: Cleaning up existing pairing listener');
      pairingListener();
    }
    
    console.log('DEBUG: Setting up new real-time listener for pairing:', pairingId);
    const pairingRef = doc(db, 'pairings', pairingId);
    const unsubscribe = onSnapshot(pairingRef, (doc) => {
      if (doc.exists() && user?.id) {
        const pairingData = { id: doc.id, ...doc.data() } as Pairing;
        console.log('DEBUG: Real-time update received for pairing:', pairingId, {
          status: pairingData.status,
          photoMode: pairingData.photoMode,
          user1_photoURL: !!pairingData.user1_photoURL,
          user2_photoURL: !!pairingData.user2_photoURL
        });
        
        // Update the current pairing data
        setCurrentPairing(pairingData);
        
        // Update status based on real-time pairing state
        updatePairingStatus(pairingData);
      } else if (!doc.exists()) {
        console.log('DEBUG: Pairing document no longer exists:', pairingId);
        // Pairing was deleted, reload to find new current pairing
        loadCurrentPairing();
      }
    }, (error) => {
      console.error('Error listening to pairing updates:', error);
      // On error, try to reload the current pairing
      setTimeout(() => {
        console.log('DEBUG: Retrying to load current pairing after listener error');
        loadCurrentPairing();
      }, 2000);
    });
    
    setPairingListener(unsubscribe);
  };
  
  /**
   * Update pairing status based on current pairing data
   */
  const updatePairingStatus = async (pairing: Pairing) => {
    if (!user?.id) return;
    
    try {
      // Determine the partner's ID and fetch their info
      const partnerId = pairing.user1_id === user.id ? pairing.user2_id : pairing.user1_id;
      const partnerUser = await firebaseService.getUserById(partnerId);
      
      // If partner doesn't exist, gracefully handle by treating as no pairing
      if (!partnerUser) {
        console.warn('DEBUG: Partner user does not exist:', partnerId, 'for pairing:', pairing.id, '- treating as no pairing');
        
        setCurrentPairing(null);
        setPairingStatus('idle');
        setPairingError(null);
        setWaitingForUser(null);
        setPartnerUsername(null);
        return;
      }
      
      setPartnerUsername(partnerUser.username || partnerUser.displayName || 'Your partner');
      
      console.log('DEBUG: Updating pairing status', {
        pairingId: pairing.id,
        status: pairing.status,
        photoMode: pairing.photoMode,
        user1_photoURL: !!pairing.user1_photoURL,
        user2_photoURL: !!pairing.user2_photoURL,
        userId: user.id,
        user1_id: pairing.user1_id,
        user2_id: pairing.user2_id
      });
      
      // PRIORITY 1: Check if already completed
      if (pairing.status === 'completed') {
        console.log('DEBUG: Pairing is completed');
        setPairingStatus('completed');
        setWaitingForUser(null);
        return;
      }
      
      // PRIORITY 2: Handle together mode - both users must submit
      if (pairing.status === 'user1_submitted' && pairing.user1_id === user.id) {
        console.log('DEBUG: Together mode - current user submitted, waiting for partner');
        setPairingStatus('waiting');
        setWaitingForUser(pairing.user2_id);
      } else if (pairing.status === 'user2_submitted' && pairing.user2_id === user.id) {
        console.log('DEBUG: Together mode - current user submitted, waiting for partner');
        setPairingStatus('waiting');
        setWaitingForUser(pairing.user1_id);
      } else if (pairing.status === 'user1_submitted' && pairing.user2_id === user.id) {
        console.log('DEBUG: Together mode - partner submitted, current user needs to submit');
        setPairingStatus('idle');
        setWaitingForUser(null);
      } else if (pairing.status === 'user2_submitted' && pairing.user1_id === user.id) {
        console.log('DEBUG: Together mode - partner submitted, current user needs to submit');
        setPairingStatus('idle');
        setWaitingForUser(null);
      } else {
        console.log('DEBUG: No photos submitted yet or waiting state');
        setPairingStatus('idle');
        setWaitingForUser(null);
      }
    } catch (error) {
      console.error('Error updating pairing status:', error);
    }
  };
  
  /**
   * Load the current pairing for today
   */
  const loadCurrentPairing = useCallback(async (): Promise<void> => {
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
      
      // If no pairing for today, that's perfectly normal - user just doesn't have a partner today
      if (!pairing) {
        if (!hasLoggedNoPairing) {
          console.log('DEBUG: No pairing found for today - user has no partner assigned');
          setHasLoggedNoPairing(true);
        }
        setCurrentPairing(null);
        setPairingStatus('idle');
        setPairingError(null); // Clear any previous errors
        setWaitingForUser(null);
        setPartnerUsername(null);
        return;
      }
      
      // Reset the logging flag if we do have a pairing
      setHasLoggedNoPairing(false);
      
      // Validate pairing and partner existence ONLY if we have a pairing
      // Determine the partner's ID
      const partnerId = pairing.user1_id === user.id ? pairing.user2_id : pairing.user1_id;
      
      // Validate that the partner user actually exists (only for existing pairings)
      const partnerUser = await firebaseService.getUserById(partnerId);
      if (!partnerUser) {
        console.warn('DEBUG: Partner user does not exist:', partnerId, 'for pairing:', pairing.id, '- treating as no pairing');
        
        // Instead of throwing an error, gracefully handle invalid pairings
        // by treating the user as having no partner for today
        setCurrentPairing(null);
        setPairingStatus('idle');
        setPairingError(null); // Don't show error to user
        setWaitingForUser(null);
        setPartnerUsername(null);
        
        return;
      }
      
      if (!hasLoggedCurrentPairingDebug) {
        console.log('DEBUG: Valid partner found:', {
          partnerId,
          partnerUsername: partnerUser.username || partnerUser.displayName,
          partnerPhotoURL: !!partnerUser.photoURL
        });
        setHasLoggedCurrentPairingDebug(true);
      }
      
      setPartnerUsername(partnerUser.username || partnerUser.displayName || 'Your partner');
      
      // IMPORTANT: Always update the pairing state, even if it's the same ID
      // This ensures we get the latest status updates
      const previousPairingId = currentPairing?.id;
      setCurrentPairing(pairing);
      
      // If pairing ID changed, reset listener
      if (previousPairingId !== pairing.id) {
        console.log('DEBUG: Pairing changed from', previousPairingId, 'to', pairing.id);
        // The useEffect will handle setting up the new listener
      }
      
      // Check if this is a new pairing date and reset intro flag if needed
      if (pairing) {
        const pairingDate = pairing.date instanceof Date 
          ? pairing.date.toDateString() 
          : new Date(pairing.date.seconds * 1000).toDateString();
        
        if (lastPairingDate !== pairingDate) {
          setLastPairingDate(pairingDate);
          setHasSeenTodaysPairingIntro(false); // Reset intro flag for new pairing date
        }
      }
      
      // Update status based on pairing state (this will be called again by the real-time listener)
      await updatePairingStatus(pairing);
      
    } catch (error) {
      console.error('Error loading current pairing:', error);
      setPairingError('Failed to load today\'s pairing');
      setPairingStatus('error');
    }
  }, [user?.id, hasLoggedNoPairing, hasLoggedCurrentPairingDebug, lastPairingDate, currentPairing?.id]);
  
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
      
      console.log('DEBUG: Submitting photo for pairing:', currentPairing.id);
      
      // Upload the photo using Firebase service
      await firebaseService.submitPairingPhoto(
        currentPairing.id,
        user.id,
        params.photoURL,
        params.isPrivate || false
      );
      
      console.log('DEBUG: Photo submitted successfully, waiting for real-time updates');
      
      // Don't manually update state here - let the real-time listener handle it
      // The real-time listener will pick up the changes and update the status accordingly
      
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
   * Mark today's pairing introduction as seen
   */
  const markPairingIntroAsSeen = (): void => {
    setHasSeenTodaysPairingIntro(true);
  };
  
  /**
   * Clear pairing error
   */
  const clearPairingError = (): void => {
    setPairingError(null);
  };
  
  /**
   * Set photo mode for the current pairing (planner mode)
   */
  const setPhotoMode = async (mode: 'together'): Promise<void> => {
    if (!user?.id || !currentPairing) {
      setPairingError('No active pairing found');
      return;
    }
    
    try {
      setPairingError(null);
      
      // Update the pairing in Firebase with the photo mode choice
      await firebaseService.updatePairingPhotoMode(currentPairing.id, mode, user.id);
      
      // Refresh the current pairing to get the updated state
      await loadCurrentPairing();
    } catch (error) {
      console.error('Error setting photo mode:', error);
      setPairingError('Failed to set photo mode');
    }
  };
  
  /**
   * Get photo mode status for the current pairing
   */
  const getPhotoModeStatus = () => {
    if (!currentPairing || !user?.id) {
      return {
        hasChoice: false,
        mode: null,
        chosenBy: null,
        chosenByUsername: null,
        isCurrentUserChoice: false,
      };
    }
    
    const hasChoice = !!currentPairing.photoMode;
    // Only support 'together' mode now, treat any other mode as null
    const mode: 'together' | null = currentPairing.photoMode === 'together' ? 'together' : null;
    const chosenBy = currentPairing.photoModeChosenBy || null;
    const isCurrentUserChoice = chosenBy === user.id;
    
    // Determine the username of who made the choice
    let chosenByUsername = null;
    if (chosenBy) {
      if (chosenBy === user.id) {
        chosenByUsername = 'You';
      } else {
        chosenByUsername = partnerUsername || 'Your partner';
      }
    }
    
    return {
      hasChoice,
      mode,
      chosenBy,
      chosenByUsername,
      isCurrentUserChoice,
    };
  };
  
  // Context value
  const value: PairingContextType = {
    currentPairing,
    pairingStatus,
    pairingError,
    waitingForUser,
    partnerUsername,
    hasSeenTodaysPairingIntro,
    pairingHistory,
    historyLoading,
    loadCurrentPairing,
    loadPairingHistory,
    submitPhoto,
    toggleLikePairing,
    addCommentToPairing,
    sendReminder,
    markPairingIntroAsSeen,
    clearPairingError,
    setPhotoMode,
    getPhotoModeStatus,
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