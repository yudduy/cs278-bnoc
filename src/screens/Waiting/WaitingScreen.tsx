/**
 * WaitingScreen
 * 
 * Screen to show when waiting for a partner to post their selfie.
 * Displays partner info, time remaining, and allows sending reminders.
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  SafeAreaView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { usePairing } from '../../context/PairingContext';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../config/theme';
import { globalStyles } from '../../styles/globalStyles';
import { getTimeRemainingUntilDeadline } from '../../utils/notifications/notificationUtils';
import { useNotification } from '../../context/NotificationContext';
import { RouteProp } from '@react-navigation/native';
import { CameraStackParamList } from '../../types/navigation';
import firebaseService from '../../services/firebase';
import logger from '../../utils/logger';

const WaitingScreen: React.FC = () => {
  // Navigation and route
  const navigation = useNavigation();
  const route = useRoute<RouteProp<CameraStackParamList, 'WaitingScreen'>>();
  const pairingId = route.params?.pairingId;
  
  // Contexts
  const { user } = useAuth();
  const { currentPairing, sendReminder } = usePairing();
  const { sendLocalNotification } = useNotification();
  
  // State
  const [reminding, setReminding] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemainingUntilDeadline());
  const [lastReminderSent, setLastReminderSent] = useState<number | null>(null);
  const [partner, setPartner] = useState<any | null>(null);
  const [timeToNextPairing, setTimeToNextPairing] = useState<string>('');
  
  // Animations
  const pulseAnimation = new Animated.Value(1);
  
  // Get partner user id
  const partnerId = currentPairing?.users.find(id => id !== user?.id);
  
  // Pulse animation for the waiting indicator
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.3,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  
  // Update time remaining
  useEffect(() => {
    const updateTimeRemaining = () => {
      setTimeRemaining(getTimeRemainingUntilDeadline());
    };
    
    // Update immediately
    updateTimeRemaining();
    
    // Then update every minute
    const interval = setInterval(updateTimeRemaining, 60000);
    return () => clearInterval(interval);
  }, []);
  
  // Load partner data
  useEffect(() => {
    const loadPartnerData = async () => {
      if (!partnerId) return;
      
      try {
        // Fetch real partner data from Firebase
        const partnerData = await firebaseService.getUserById(partnerId);
        if (partnerData) {
          setPartner({
            id: partnerData.id,
            displayName: partnerData.displayName || partnerData.username,
            photoURL: partnerData.photoURL,
            username: partnerData.username,
          });
        }
      } catch (error) {
        logger.error('Error loading partner data', error);
      }
    };
    
    loadPartnerData();
  }, [partnerId]);
  
  // Calculate time to next pairing (midnight)
  useEffect(() => {
    const calculateTimeToNextPairing = () => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diffMs = tomorrow.getTime() - now.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeToNextPairing(`${diffHrs}h ${diffMins}m`);
    };
    
    calculateTimeToNextPairing();
    const interval = setInterval(calculateTimeToNextPairing, 60000);
    return () => clearInterval(interval);
  }, []);
  
  // Handle send reminder
  const handleSendReminder = async () => {
    if (!partnerId || !currentPairing) return;
    
    // Check if reminder was sent in the last 15 minutes
    const now = Date.now();
    if (lastReminderSent && now - lastReminderSent < 15 * 60 * 1000) {
      // Show message that reminder was recently sent
      sendLocalNotification(
        'Reminder Limit',
        'You can only send one reminder every 15 minutes.',
        { type: 'reminder_limit' }
      );
      return;
    }
    
    try {
      setReminding(true);
      
      // Send reminder
      await sendReminder(currentPairing.id, partnerId);
      
      // Update last reminder sent time
      setLastReminderSent(now);
      
      // Show success notification
      sendLocalNotification(
        'Reminder Sent',
        `We've notified ${partner?.displayName || 'your partner'} to take their selfie.`,
        { type: 'reminder_sent' }
      );
    } catch (error) {
      logger.error('Error sending reminder', error);
      
      // Show error notification
      sendLocalNotification(
        'Reminder Failed',
        'Failed to send reminder. Please try again later.',
        { type: 'reminder_error' }
      );
    } finally {
      setReminding(false);
    }
  };
  
  // Go back to feed screen
  const handleBack = () => {
    navigation.goBack();
  };
  
  // Start virtual meeting
  const handleStartVirtualMeeting = () => {
    if (!currentPairing?.virtualMeetingLink) return;
    
    // In a real app, would open the virtual meeting link
    logger.info('Starting virtual meeting', { virtualMeetingLink: currentPairing.virtualMeetingLink });
    
    // Show notification
    sendLocalNotification(
      'Virtual Meeting',
      'Opening virtual meeting...',
      { type: 'virtual_meeting' }
    );
  };
  
  // Render no pairing available state
  const renderNoPairingState = () => {
    return (
      <View style={styles.noPairingContainer}>
        <Animated.View 
          style={[
            styles.waitingIcon,
            {
              transform: [{ scale: pulseAnimation }]
            }
          ]}
        >
          <Ionicons name="time-outline" size={64} color={COLORS.primary} />
        </Animated.View>
        
        <Text style={styles.noPairingTitle}>
          No Pairing Yet
        </Text>
        
        <Text style={styles.noPairingText}>
          You don't have a pairing for today yet. The next pairing will be assigned in:
        </Text>
        
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownText}>{timeToNextPairing}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={handleBack}
        >
          <Text style={styles.refreshButtonText}>Check Again</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Waiting for Partner</Text>
          <View style={styles.placeholder} />
        </View>
        
        {/* Content */}
        {!currentPairing ? renderNoPairingState() : (
          <View style={styles.content}>
            <View style={styles.card}>
              <Text style={styles.title}>
                Waiting for {partner?.displayName || 'partner'}
              </Text>
              
              <View style={styles.avatarContainer}>
                {partner?.photoURL ? (
                  <Image 
                    source={{ uri: partner.photoURL }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatar, styles.placeholderAvatar]}>
                    <Text style={styles.placeholderText}>
                      {partner?.displayName?.charAt(0) || '?'}
                    </Text>
                  </View>
                )}
                
                <Animated.View 
                  style={[
                    styles.pulsingDot,
                    {
                      transform: [{ scale: pulseAnimation }]
                    }
                  ]}
                />
              </View>
              
              <Text style={styles.timeRemaining}>
                {timeRemaining.formatted}
              </Text>
              
              <Text style={styles.waitingText}>
                Your partner hasn't posted their selfie yet. Send them a reminder or try again later.
              </Text>
              
              <TouchableOpacity 
                style={styles.reminderButton}
                onPress={handleSendReminder}
                disabled={reminding}
              >
                {reminding ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.reminderButtonText}>Send Reminder</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.virtualMeetingButton}
                onPress={handleStartVirtualMeeting}
              >
                <Ionicons name="videocam-outline" size={20} color={COLORS.primary} />
                <Text style={styles.virtualMeetingText}>Start Virtual Meeting</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.backButton}
                onPress={handleBack}
              >
                <Text style={styles.backButtonText}>Back to Feed</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 18,
    color: COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontFamily: 'ChivoBold',
    fontSize: 22,
    color: COLORS.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.backgroundLight,
  },
  placeholderAvatar: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: 'ChivoBold',
    fontSize: 48,
    color: '#FFFFFF',
  },
  pulsingDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    borderWidth: 4,
    borderColor: COLORS.card,
  },
  timeRemaining: {
    fontFamily: 'ChivoBold',
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 16,
  },
  waitingText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '100%',
    marginBottom: 16,
  },
  reminderButtonText: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  virtualMeetingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  virtualMeetingText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 8,
  },
  backButtonText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },
  noPairingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  waitingIcon: {
    marginBottom: 24,
  },
  noPairingTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 24,
    color: COLORS.text,
    marginBottom: 16,
  },
  noPairingText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  countdownContainer: {
    backgroundColor: COLORS.card,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 32,
  },
  countdownText: {
    fontFamily: 'ChivoBold',
    fontSize: 32,
    color: COLORS.primary,
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  refreshButtonText: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: COLORS.background,
  },
});

export default WaitingScreen;