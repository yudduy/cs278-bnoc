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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePairing } from '../../context/PairingContext';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, BORDER_RADIUS } from '../../config/theme';
import firebaseService from '../../services/firebase';
import { User } from '../../types';
import logger from '../../utils/logger';
import PhotoModeSelectionModal, { PhotoMode } from '../../components/modals/PhotoModeSelectionModal';
import CountdownTimer from '../../components/common/CountdownTimer';

export default function CurrentPairingScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { currentPairing, pairingStatus, getPhotoModeStatus } = usePairing();
  
  const [partner, setPartner] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPhotoModeModal, setShowPhotoModeModal] = useState(false);
  
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
    } catch (error) {
      logger.error('Failed to load partner data', error);
    } finally {
      setLoading(false);
    }
  }, [currentPairing?.id, user?.id]); // Only depend on IDs, not full objects
  
  useEffect(() => {
    loadPartnerData();
  }, [loadPartnerData]);
  
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
    setShowPhotoModeModal(true);
  };
  
  const handlePhotoModeSelection = (mode: PhotoMode) => {
    setShowPhotoModeModal(false);
    
    if (currentPairing && user) {
      // Camera is in the MainStack, so navigate up from PairingStack
      (navigation as any).navigate('Camera', {
        pairingId: currentPairing.id,
        userId: user.id,
        submissionType: 'pairing',
        photoMode: mode
      });
    }
  };
  
  const handleClosePhotoModeModal = () => {
    setShowPhotoModeModal(false);
  };
  
  const handleOpenChat = () => {
    if (currentPairing) {
      (navigation as any).navigate('Chat', {
        pairingId: currentPairing.id,
        partnerId: partner?.id,
        partnerName: partner?.displayName || partner?.username
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
          <Text style={styles.emptyText}>No active pairing for today.</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const bothPhotosSubmitted = userPhotoURL && partnerPhotoURL;
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Partner Info */}
        <View style={styles.partnerSection}>
          <Text style={styles.partnerName}>
            {partner?.displayName || 'Your Partner'}
          </Text>
        </View>
        
        {/* Photo Display */}
        <View style={styles.photoContainer}>
          {bothPhotosSubmitted ? (
            // Show combined photo when both submitted
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
          ) : userPhotoURL ? (
            // Show user's photo when only user submitted
            <View style={styles.singlePhotoContainer}>
              <Image 
                source={{ uri: userPhotoURL }}
                style={styles.singlePhoto}
                resizeMode="cover"
              />
              <Text style={styles.waitingText}>
                Waiting for {partner?.displayName || 'partner'}...
              </Text>
            </View>
          ) : (
            // Show placeholder when no photos
            <View style={styles.placeholderContainer}>
              <Ionicons name="camera-outline" size={48} color={COLORS.textSecondary} />
              <Text style={styles.placeholderText}>
                Take your selfie to get started
              </Text>
            </View>
          )}
        </View>
        
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
          {!userPhotoURL && (
            <TouchableOpacity style={styles.actionButton} onPress={handleTakePhoto}>
              <Ionicons name="camera" size={28} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.actionButton} onPress={handleOpenChat}>
            <Ionicons name="chatbubble-outline" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
      <PhotoModeSelectionModal
        visible={showPhotoModeModal}
        onSelectMode={handlePhotoModeSelection}
        onCancel={handleClosePhotoModeModal}
        partnerName={partner?.displayName || partner?.username}
        isPlannerMode={!photoModeStatus.hasChoice}
        accessibilityLabel={
          photoModeStatus.hasChoice 
            ? 'Photo mode selection - mode already chosen'
            : 'Photo mode selection - planner mode'
        }
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
}); 