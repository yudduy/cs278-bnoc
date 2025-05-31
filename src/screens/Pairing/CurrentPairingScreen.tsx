/**
 * CurrentPairingScreen
 * 
 * Central screen for daily pairing interactions.
 * Shows partner information, status of photo submissions,
 * and provides buttons for chat and photo submission.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { usePairing } from '../../context/PairingContext';
import { useFeed } from '../../context/FeedContext';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, BORDER_RADIUS } from '../../config/theme';
import firebaseService from '../../services/firebase';
import { User } from '../../types';
import logger from '../../utils/logger';
import PairingInstructionsModal from '../../components/modals/PairingInstructionsModal';
import CountdownTimer from '../../components/common/CountdownTimer';

export default function CurrentPairingScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { currentPairing, pairingStatus, getPhotoModeStatus, loadCurrentPairing } = usePairing();
  const { refreshFeed } = useFeed();
  
  const [partner, setPartner] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [useRealtimeListener, setUseRealtimeListener] = useState(true);
  
  // Refs for managing Firebase listeners
  const pairingListener = React.useRef<Unsubscribe | null>(null);
  const partnerListener = React.useRef<Unsubscribe | null>(null);
  
  // Cleanup function for listeners
  const cleanupListeners = useCallback(() => {
    if (pairingListener.current) {
      pairingListener.current();
      pairingListener.current = null;
    }
    if (partnerListener.current) {
      partnerListener.current();
      partnerListener.current = null;
    }
  }, []);
  
  // Setup real-time listener for current pairing
  const setupPairingListener = useCallback(async () => {
    if (!currentPairing?.id || !user?.id || !useRealtimeListener) {
      console.log('DEBUG: CurrentPairingScreen - Skipping pairing listener setup:', {
        pairingId: currentPairing?.id,
        userId: user?.id,
        useRealtimeListener
      });
      return;
    }
    
    try {
      console.log('DEBUG: CurrentPairingScreen - Setting up pairing listener for:', currentPairing.id);
      
      // Listen to pairing document changes
      const pairingRef = doc(db, 'pairings', currentPairing.id);
      
      pairingListener.current = onSnapshot(
        pairingRef,
        async (docSnapshot) => {
          if (docSnapshot.exists()) {
            const updatedPairing = { id: docSnapshot.id, ...docSnapshot.data() } as any;
            console.log('DEBUG: CurrentPairingScreen - Pairing updated:', updatedPairing);
            
            // Update partner data if pairing changed
            const isUser1 = updatedPairing.user1_id === user.id;
            const partnerId = isUser1 ? updatedPairing.user2_id : updatedPairing.user1_id;
            
            try {
              const partnerData = await firebaseService.getUserById(partnerId);
              setPartner(partnerData);
              console.log('DEBUG: CurrentPairingScreen - Partner data updated:', partnerData?.displayName);
            } catch (error) {
              console.error('Failed to load updated partner data:', error);
            }
            
            // If pairing just completed, refresh the feed
            if (updatedPairing.status === 'completed' && updatedPairing.user1_photoURL && updatedPairing.user2_photoURL) {
              console.log('DEBUG: CurrentPairingScreen - Pairing completed via real-time update, refreshing feed');
              try {
                await refreshFeed();
              } catch (error) {
                console.error('Failed to refresh feed after pairing completion:', error);
              }
            }
          }
        },
        (error) => {
          console.error('CurrentPairingScreen pairing listener error:', error);
          logger.error('CurrentPairingScreen pairing listener failed', error);
          
          // Fallback to manual loading on error
          setUseRealtimeListener(false);
          loadPartnerData();
        }
      );
      
    } catch (error) {
      console.error('Failed to setup pairing listener:', error);
      logger.error('CurrentPairingScreen pairing listener setup failed', error);
      
      // Fallback to manual loading
      setUseRealtimeListener(false);
      loadPartnerData();
    }
  }, [currentPairing?.id, user?.id, useRealtimeListener, refreshFeed]);
  
  // Load partner data once when component mounts
  const loadPartnerData = useCallback(async () => {
    if (!currentPairing || !user) {
      setLoading(false);
      return;
    }
    
    try {
      const isUser1 = currentPairing.user1_id === user.id;
      const partnerId = isUser1 ? currentPairing.user2_id : currentPairing.user1_id;
      
      const partnerData = await firebaseService.getUserById(partnerId);
      setPartner(partnerData);
      console.log('DEBUG: CurrentPairingScreen - Manual partner data loaded:', partnerData?.displayName);
    } catch (error) {
      logger.error('Failed to load partner data', error);
    } finally {
      setLoading(false);
    }
  }, [currentPairing?.id, user?.id]);
  
  useEffect(() => {
    loadPartnerData();
  }, [loadPartnerData]);
  
  // Setup real-time listeners when pairing or user changes
  useEffect(() => {
    if (!user) return;
    
    // Cleanup existing listeners first
    cleanupListeners();
    
    if (useRealtimeListener && currentPairing?.id) {
      console.log('DEBUG: CurrentPairingScreen - Setting up real-time listeners');
      setupPairingListener();
    } else if (currentPairing && !useRealtimeListener) {
      console.log('DEBUG: CurrentPairingScreen - Using manual loading (real-time disabled)');
      loadPartnerData();
    }
    
    // Cleanup on unmount or when dependencies change
    return () => {
      cleanupListeners();
    };
  }, [currentPairing?.id, user?.id, useRealtimeListener, setupPairingListener, cleanupListeners]);
  
  // Add effect to reload partner data when currentPairing changes (real-time updates)
  useEffect(() => {
    if (currentPairing && user && !useRealtimeListener) {
      console.log('DEBUG: CurrentPairing changed, reloading partner data (manual mode)');
      loadPartnerData();
      
      // If pairing just completed, refresh the feed
      if (currentPairing.status === 'completed') {
        console.log('DEBUG: Pairing completed, refreshing feed');
        refreshFeed().catch(error => {
          console.error('Failed to refresh feed after pairing completion:', error);
        });
      }
    }
  }, [currentPairing?.id, currentPairing?.status, currentPairing?.user1_photoURL, currentPairing?.user2_photoURL, useRealtimeListener]);
  
  // Handle refresh (pull-to-refresh functionality like profile screen)
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    
    // Temporarily disable real-time listeners during manual refresh
    const wasUsingRealtime = useRealtimeListener;
    if (wasUsingRealtime) {
      setUseRealtimeListener(false);
      cleanupListeners();
    }
    
    try {
      // Force reload the current pairing to get the latest state
      await loadCurrentPairing();
      
      // Reload partner data after pairing refresh
      if (currentPairing && user) {
        const isUser1 = currentPairing.user1_id === user.id;
        const partnerId = isUser1 ? currentPairing.user2_id : currentPairing.user1_id;
        
        const partnerData = await firebaseService.getUserById(partnerId);
        setPartner(partnerData);
        console.log('DEBUG: CurrentPairingScreen - Manual refresh completed');
      }
    } catch (error) {
      logger.error('Failed to refresh pairing data', error);
    } finally {
      setRefreshing(false);
      
      // Re-enable real-time listeners if they were enabled before
      if (wasUsingRealtime) {
        setUseRealtimeListener(true);
      }
    }
  }, [loadCurrentPairing, currentPairing?.id, user?.id, useRealtimeListener, cleanupListeners]);
  
  // Toggle between real-time and manual refresh modes
  const toggleRealtimeMode = useCallback(() => {
    const newMode = !useRealtimeListener;
    console.log('DEBUG: CurrentPairingScreen - Toggling real-time mode:', newMode);
    setUseRealtimeListener(newMode);
    
    if (!newMode) {
      // Switching to manual mode - cleanup listeners and load data manually
      cleanupListeners();
      loadPartnerData();
    }
    // If switching to real-time mode, the useEffect will handle setting up listeners
  }, [useRealtimeListener, cleanupListeners, loadPartnerData]);
  
  // Get pairing photo URLs
  const isUser1 = currentPairing?.user1_id === user?.id;
  const userPhotoURL = isUser1 
    ? currentPairing?.user1_photoURL 
    : currentPairing?.user2_photoURL;
  const partnerPhotoURL = isUser1
    ? currentPairing?.user2_photoURL
    : currentPairing?.user1_photoURL;
  
  // Get photo mode status for planner mode functionality
  const photoModeStatus = getPhotoModeStatus();
  
  // Timer calculation functions
  const getMatchEndTime = (): Date => {
    const today = new Date();
    const endTime = new Date(today);
    endTime.setHours(23, 0, 0, 0); // 11 PM today
    
    // If past 11 PM, set to 11 PM tomorrow
    if (today > endTime) {
      endTime.setDate(endTime.getDate() + 1);
    }
    return endTime;
  };

  const getNextMatchTime = (): Date => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(5, 0, 0, 0); // 5 AM next day
    return tomorrow;
  };

  // Determine timer state and content
  const getTimerInfo = () => {
    if (!currentPairing) return null;
    
    const bothPhotosSubmitted = userPhotoURL && partnerPhotoURL;
    
    if (bothPhotosSubmitted) {
      // Both users have submitted - show next match timer
      return {
        targetDate: getNextMatchTime(),
        title: 'Next match in',
        subtitle: 'Your daily pairing will arrive at 5 AM',
        iconName: 'calendar-outline'
      };
    } else {
      // Still waiting for photos - show current match end timer
      return {
        targetDate: getMatchEndTime(),
        title: 'Current match ends in',
        subtitle: 'Complete your pairing before it expires',
        iconName: 'hourglass-outline'
      };
    }
  };

  const timerInfo = getTimerInfo();
  
  // Navigation handlers
  const handleTakePhoto = () => {
    setShowInstructionsModal(true);
  };
  
  const handleProceedToCamera = () => {
    setShowInstructionsModal(false);
    
    if (currentPairing && user) {
      // Camera is in the MainStack, so navigate up from PairingStack
      (navigation as any).navigate('Camera', {
        pairingId: currentPairing.id,
        userId: user.id,
        submissionType: 'pairing',
        photoMode: 'together' // Always use together mode now
      });
    }
  };
  
  const handleCloseInstructionsModal = () => {
    setShowInstructionsModal(false);
  };
  
  const handleOpenChat = () => {
    if (currentPairing) {
      // Use the pairing's chatId, or fallback to pairingId if chatId is missing
      const chatId = currentPairing.chatId || currentPairing.id;
      
      console.log('DEBUG: Opening chat', {
        pairingId: currentPairing.id,
        chatId: chatId,
        partnerId: partner?.id,
        partnerName: partner?.displayName || partner?.username
      });
      
      (navigation as any).navigate('Chat', {
        pairingId: currentPairing.id,
        chatId: chatId, // Add the missing chatId parameter
        partnerId: partner?.id,
        partnerName: partner?.displayName || partner?.username || 'Your Partner'
      });
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading pairing...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!currentPairing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>You're all set for today!</Text>
          <Text style={styles.emptyText}>
            No pairing assigned today. Enjoy browsing your friends' posts in the feed!
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const bothPhotosSubmitted = userPhotoURL && partnerPhotoURL;
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Partner Info */}
        <View style={styles.partnerSection}>
          <Text style={styles.partnerName}>
            {partner?.displayName || 'Your Partner'}
          </Text>
        </View>
        
        {/* Photo Display */}
        <View style={styles.photoContainer}>
          {pairingStatus === 'completed' ? (
            // Both photos submitted and pairing completed
            bothPhotosSubmitted ? (
              <View style={styles.combinedPhotoContainer}>
                <Image 
                  source={{ uri: userPhotoURL }}
                  style={styles.combinedPhoto}
                  resizeMode="cover"
                />
                <Image 
                  source={{ uri: partnerPhotoURL }}
                  style={styles.combinedPhoto}
                  resizeMode="cover"
                />
              </View>
            ) : (
              // This shouldn't happen in completed state, but handle gracefully
              <View style={styles.placeholderContainer}>
                <Ionicons name="camera-outline" size={48} color={COLORS.textSecondary} />
                <Text style={styles.placeholderText}>
                  Take your together selfie to get started
                </Text>
              </View>
            )
          ) : userPhotoURL && !partnerPhotoURL ? (
            // Current user has submitted, waiting for partner
            <View style={styles.singlePhotoContainer}>
              <Image 
                source={{ uri: userPhotoURL }}
                style={styles.singlePhoto}
                resizeMode="cover"
              />
              <Text style={styles.waitingText}>
                You've submitted! Waiting for {partner?.displayName || 'partner'}...
              </Text>
            </View>
          ) : !userPhotoURL && partnerPhotoURL ? (
            // Partner has submitted, current user needs to submit
            <View style={styles.singlePhotoContainer}>
              <Image 
                source={{ uri: partnerPhotoURL }}
                style={styles.singlePhoto}
                resizeMode="cover"
              />
              <Text style={styles.waitingText}>
                {partner?.displayName || 'Your partner'} has submitted! Your turn to take a photo.
              </Text>
            </View>
          ) : userPhotoURL && partnerPhotoURL ? (
            // Both submitted but not yet marked completed
            <View style={styles.combinedPhotoContainer}>
              <Image 
                source={{ uri: userPhotoURL }}
                style={styles.combinedPhoto}
                resizeMode="cover"
              />
              <Image 
                source={{ uri: partnerPhotoURL }}
                style={styles.combinedPhoto}
                resizeMode="cover"
              />
            </View>
          ) : (
            // Neither user has submitted yet
            <View style={styles.placeholderContainer}>
              <Ionicons name="camera-outline" size={48} color={COLORS.textSecondary} />
              <Text style={styles.placeholderText}>
                Take your together selfie to get started
              </Text>
            </View>
          )}
        </View>
        
        {/* Completion Message */}
        {pairingStatus === 'completed' && bothPhotosSubmitted && (
          <View style={styles.completionMessageContainer}>
            <Text style={styles.completedText}>
              Pairing completed! 🎉
            </Text>
          </View>
        )}
        
        {/* Countdown Timer */}
        {timerInfo && (
          <View style={styles.timerContainer}>
            <CountdownTimer
              targetDate={timerInfo.targetDate}
              title={timerInfo.title}
              subtitle={timerInfo.subtitle}
              iconName={timerInfo.iconName}
              onExpire={() => {
                // Could refresh pairing or show notification
                console.log('Timer expired');
              }}
            />
          </View>
        )}
        
        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {(!userPhotoURL) && (
            <TouchableOpacity style={styles.actionButton} onPress={handleTakePhoto}>
              <Ionicons name="camera" size={28} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.actionButton} onPress={handleOpenChat}>
            <Ionicons name="chatbubble-outline" size={28} color={COLORS.primary} />
          </TouchableOpacity>
          
          {/* Real-time mode toggle */}
          <TouchableOpacity 
            style={[styles.actionButton, useRealtimeListener && styles.actionButtonActive]} 
            onPress={toggleRealtimeMode}
          >
            <Ionicons 
              name={useRealtimeListener ? "flash" : "flash-off"} 
              size={28} 
              color={useRealtimeListener ? COLORS.background : COLORS.primary} 
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
      <PairingInstructionsModal
        visible={showInstructionsModal}
        onProceed={handleProceedToCamera}
        onCancel={handleCloseInstructionsModal}
        partnerName={partner?.displayName || partner?.username}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.primary,
    fontFamily: FONTS.regular,
    fontSize: 16,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyText: {
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: 18,
    textAlign: 'center',
  },
  partnerSection: {
    marginBottom: 32,
  },
  partnerName: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: COLORS.primary,
    textAlign: 'center',
  },
  photoContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 32,
  },
  combinedPhotoContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  combinedPhoto: {
    flex: 1,
    height: 200,
    borderRadius: BORDER_RADIUS.md,
  },
  singlePhotoContainer: {
    alignItems: 'center',
  },
  singlePhoto: {
    width: '100%',
    height: 300,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: 16,
  },
  waitingText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  completedText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.primary,
    textAlign: 'center',
  },
  placeholderContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.lg,
  },
  placeholderText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  timerContainer: {
    width: '100%',
    marginBottom: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 24,
    justifyContent: 'center',
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.backgroundDark,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: COLORS.primary,
  },
  completionMessageContainer: {
    marginBottom: 24,
  },
}); 