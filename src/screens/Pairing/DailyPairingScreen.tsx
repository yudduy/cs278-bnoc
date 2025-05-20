/**
 * DailyPairingScreen
 * 
 * Shows users their daily pairing with another user, following the black and white theme.
 * Displays both users' profile pictures side-by-side and provides options to take a photo,
 * open chat, or return to the feed.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Animated
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, BORDER_RADIUS } from '../../config/theme';
import { usePairing } from '../../context/PairingContext';
import { useAuth } from '../../context/AuthContext';
import PrimaryButton from '../../components/buttons/PrimaryButton';
import SecondaryButton from '../../components/buttons/SecondaryButton';
import firebaseService from '../../services/firebase';
import { User } from '../../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../types/navigation';

// Type for navigation props
type DailyPairingNavigationProp = StackNavigationProp<MainStackParamList>;

// Array of randomized greeting messages to use for daily pairings
const GREETING_MESSAGES = [
  "Surprise! Meet your BNOC match for today:",
  "Ready for a new connection? Say hello to:",
  "Today's networking opportunity is with:",
  "Your daily BNOC challenge: Connect with:",
  "Time to expand your network with:",
  "Meet someone new today:",
  "Your Stanford connection for today:",
  "Your BNOC adventure today is with:",
  "Today's random match is with:",
  "Broaden your network with:",
  "Someone new to meet today:",
  "Get ready to connect with:",
  "Today's meaningful connection:",
  "Meet a new face at Stanford:",
  "Step outside your comfort zone with:"
];

const DailyPairingScreen: React.FC = () => {
  const navigation = useNavigation<DailyPairingNavigationProp>();
  const { currentPairing, loadCurrentPairing } = usePairing();
  const { user } = useAuth();
  
  const [partner, setPartner] = useState<User | null>(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeUntilNextPairing, setTimeUntilNextPairing] = useState<string>('');
  
  // Get a random greeting message for this session
  const [greetingMessage] = useState(() => {
    const randomIndex = Math.floor(Math.random() * GREETING_MESSAGES.length);
    return GREETING_MESSAGES[randomIndex];
  });
  
  // Animation for the countdown pulse effect
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  
  // Start the pulse animation
  useEffect(() => {
    if (!currentPairing) {
      const pulse = Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ]);
      
      Animated.loop(pulse).start();
    }
    
    return () => {
      pulseAnimation.stopAnimation();
    };
  }, [currentPairing]);

  // Determine if the current user is user1 in the pairing
  const isUser1 = useMemo(() => currentPairing?.user1_id === user?.id, [currentPairing, user]);

  // Get current user's pairing photo URL
  const currentUserPairingPhotoURL = useMemo(() => {
    if (!currentPairing || !user) return null;
    return isUser1 ? currentPairing.user1_photoURL : currentPairing.user2_photoURL;
  }, [currentPairing, user, isUser1]);

  // Get partner's pairing photo URL
  const partnerPairingPhotoURL = useMemo(() => {
    if (!currentPairing || !user) return null;
    return isUser1 ? currentPairing.user2_photoURL : currentPairing.user1_photoURL;
  }, [currentPairing, user, isUser1]);

  // Get partner's ID
  const partnerId = useMemo(() => {
    if (!currentPairing || !user) return null;
    return isUser1 ? currentPairing.user2_id : currentPairing.user1_id;
  }, [currentPairing, user, isUser1]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Reload all data
      await loadCurrentPairing();
      
      // Reset partner to force reload
      if (partnerId) {
        const partnerData = await firebaseService.getUserById(partnerId);
        setPartner(partnerData || null);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadCurrentPairing, partnerId]);

  // Calculate time until next pairing
  useEffect(() => {
    if (!currentPairing) {
      // If no current pairing, calculate time until next pairing (5AM tomorrow)
      const updateCountdown = () => {
        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(5, 0, 0, 0); // Next pairings happen at 5AM
        
        const diffMs = tomorrow.getTime() - now.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        setTimeUntilNextPairing(`${diffHrs}h ${diffMins}m`);
      };
      
      // Update immediately and then every minute
      updateCountdown();
      const interval = setInterval(updateCountdown, 60000);
      
      return () => clearInterval(interval);
    }
  }, [currentPairing]);

  useEffect(() => {
    const loadScreenData = async () => {
      setLocalLoading(true);
      if (user && !currentPairing) {
        await loadCurrentPairing(); 
      }
      
      // If there's no partnerId (derived from currentPairing), we might not need to wait for partner details.
      if (!partnerId) {
        setLocalLoading(false);
      }
    };
    loadScreenData();
  }, [user, currentPairing, loadCurrentPairing, partnerId]);
  
  // Load partner details when partnerId changes
  useEffect(() => {
    const getPartnerDetails = async () => {
      if (partnerId) {
        try {
          const partnerData = await firebaseService.getUserById(partnerId);
          setPartner(partnerData);
        } catch (error) {
          console.error('Error loading partner details:', error);
        } finally {
          setLocalLoading(false);
        }
      }
    };
    
    getPartnerDetails();
  }, [partnerId]);
  
  // Get submission status message
  const getSubmissionStatusMessage = useMemo(() => {
    if (!currentPairing) return "";
    
    const userSubmitted = !!currentUserPairingPhotoURL;
    const partnerSubmitted = !!partnerPairingPhotoURL;
    
    if (userSubmitted && partnerSubmitted) {
      return "You've both snapped for today!";
    } else if (userSubmitted && !partnerSubmitted) {
      return `Your snap is in! Waiting for ${partner?.displayName || 'your partner'}.`;
    } else if (!userSubmitted && partnerSubmitted) {
      return `${partner?.displayName || 'Your partner'} has snapped! Your turn.`;
    } else {
      return "Time to snap your daily selfies!";
    }
  }, [currentPairing, currentUserPairingPhotoURL, partnerPairingPhotoURL, partner]);
  
  // Get secondary button config based on submission status
  const getSecondaryButtonConfig = useMemo(() => {
    if (!currentUserPairingPhotoURL) {
      return {
        text: `Snap with ${partner?.displayName || 'Partner'}`,
        action: handleTakePhoto
      };
    } else {
      return {
        text: "View/Retake Snap",
        action: handleViewSelfies
      };
    }
  }, [currentUserPairingPhotoURL, partner]);
  
  // Navigate to camera screen
  const handleTakePhoto = () => {
    if (currentPairing) {
      navigation.navigate('Camera', { pairingId: currentPairing.id });
    }
  };
  
  // Navigate to view/retake selfies screen
  const handleViewSelfies = () => {
    if (currentPairing) {
      navigation.navigate('ViewSelfies', { pairingId: currentPairing.id });
    }
  };
  
  // Navigate to chat screen
  const handleOpenChat = () => {
    if (currentPairing && partner && partnerId) {
      navigation.navigate('Chat', {
        chatId: currentPairing.chatId || `chat_${currentPairing.id}`,
        pairingId: currentPairing.id
      });
    }
  };
  
  // Navigate back to feed screen
  const handleGoHome = () => {
    navigation.navigate('TabNavigator', { 
      screen: 'Feed',
      params: { refresh: true }
    });
  };
  
  if (localLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your daily pairing...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!currentPairing) { // This handles the case where currentPairing is null (no pairing found)
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyLogo}>BNOC</Text>
          <Text style={styles.noMatchTitle}>No new match for you today.</Text>
          <Text style={styles.noMatchSubtitle}>Check back tomorrow for your next BNOC connection!</Text>
          
          <Animated.View style={{ transform: [{ scale: pulseAnimation }], marginVertical: 24 }}>
            <Ionicons name="time-outline" size={48} color={COLORS.primary} />
          </Animated.View>
          
          <Text style={styles.countdownTitle}>Next match in:</Text>
          <Text style={styles.countdownValue}>{timeUntilNextPairing}</Text>
          <Text style={styles.excitedText}>Excited?</Text>
          
          <SecondaryButton
            text="Go Home"
            onPress={handleGoHome}
            style={{ marginTop: 32 }}
          />
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={styles.content}>
          {/* Random Greeting Message */}
          <Text style={styles.greetingMessage}>
            {greetingMessage}
          </Text>
          
          {/* Large Heading with Partner's Name */}
          <Text style={styles.partnerName}>
            {partner?.displayName || 'Your Partner'}
          </Text>
          
          {/* Central Area with User Photos */}
          <View style={styles.photoContainer}>
            {/* Current User's Photo */}
            <View style={styles.photoWrapper}>
              {currentUserPairingPhotoURL ? (
                <Image
                  source={{ uri: currentUserPairingPhotoURL }}
                  style={styles.userPhoto}
                />
              ) : (
                <View style={[styles.userPhoto, styles.placeholderPhoto]}>
                  <Ionicons name="person" size={50} color={COLORS.textSecondary} />
                </View>
              )}
              <Text style={styles.photoLabel}>You</Text>
            </View>
            
            {/* Partner's Photo */}
            <View style={styles.photoWrapper}>
              {partnerPairingPhotoURL ? (
                <Image
                  source={{ uri: partnerPairingPhotoURL }}
                  style={styles.userPhoto}
                />
              ) : (
                <View style={[styles.userPhoto, styles.placeholderPhoto]}>
                  <Ionicons name="person" size={50} color={COLORS.textSecondary} />
                </View>
              )}
              <Text style={styles.photoLabel}>{partner?.displayName || 'Partner'}</Text>
            </View>
          </View>
          
          {/* Status Message */}
          <Text style={styles.statusMessage}>
            {getSubmissionStatusMessage}
          </Text>
          
          {/* Button Stack */}
          <View style={styles.buttonStack}>
            <PrimaryButton
              text="Open Chat"
              onPress={handleOpenChat}
              icon="chatbubble-outline"
              style={styles.actionButton}
            />
            
            <SecondaryButton
              text={getSecondaryButtonConfig.text}
              onPress={getSecondaryButtonConfig.action}
              icon={!currentUserPairingPhotoURL ? "camera-outline" : "eye-outline"}
              style={styles.actionButton}
            />
            
            <TouchableOpacity 
              style={styles.backTextButton} 
              onPress={handleGoHome}
            >
              <Text style={styles.backButtonText}>Back to BNOC</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  partnerName: {
    fontFamily: FONTS.bold,
    fontSize: 32,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 30,
    marginHorizontal: 20,
  },
  photoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  photoWrapper: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  userPhoto: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.backgroundLight,
    marginBottom: 10,
  },
  placeholderPhoto: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  photoLabel: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  statusMessage: {
    fontFamily: FONTS.regular,
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 40,
    marginHorizontal: 20,
  },
  buttonStack: {
    width: '100%',
    maxWidth: 320,
    marginTop: 20,
  },
  actionButton: {
    marginBottom: 16,
    width: '100%',
  },
  backTextButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  backButtonText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.primary,
    marginTop: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyLogo: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    letterSpacing: 1,
    color: COLORS.primary,
    marginBottom: 30,
  },
  noMatchTitle: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  noMatchSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  countdownTitle: {
    fontFamily: FONTS.regular,
    fontSize: 18,
    color: COLORS.primary,
    marginBottom: 8,
  },
  countdownValue: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    color: COLORS.primary,
    marginBottom: 16,
  },
  excitedText: {
    fontFamily: FONTS.italic,
    fontSize: 20,
    color: COLORS.primary,
    marginBottom: 20,
  },
  greetingMessage: {
    fontFamily: FONTS.regular,
    fontSize: 18,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 12,
    marginHorizontal: 20,
  },
});

export default DailyPairingScreen;