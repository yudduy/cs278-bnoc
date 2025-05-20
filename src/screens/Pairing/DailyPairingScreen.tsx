/**
 * DailyPairingScreen
 * 
 * Shows users their daily pairing with another user, following the black and white theme.
 * Displays both users' profile pictures and provides options to go to chat or return home.
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
import { DAILY_PAIRING_MESSAGES } from '../../config/constants';
import firebaseService from '../../services/firebase';
import { User } from '../../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../types/navigation';

// Type for navigation props
type DailyPairingNavigationProp = StackNavigationProp<MainStackParamList>;

const DailyPairingScreen: React.FC = () => {
  const navigation = useNavigation<DailyPairingNavigationProp>();
  const { currentPairing, loadCurrentPairing } = usePairing();
  const { user } = useAuth();
  
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [partner, setPartner] = useState<User | null>(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeUntilNextPairing, setTimeUntilNextPairing] = useState<string>('');
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [isFirstLoad, setIsFirstLoad] = useState<boolean>(true);
  
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
      
      // Select new random welcome message
      const randomIndex = Math.floor(Math.random() * DAILY_PAIRING_MESSAGES.length);
      setWelcomeMessage(DAILY_PAIRING_MESSAGES[randomIndex]);
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

  // Show notification on first load if there's a new pairing
  useEffect(() => {
    if (isFirstLoad && currentPairing && !refreshing) {
      setShowNotification(true);
      setIsFirstLoad(false);
      
      // Hide notification after 5 seconds
      const timeout = setTimeout(() => {
        setShowNotification(false);
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [currentPairing, isFirstLoad, refreshing]);

  useEffect(() => {
    const loadScreenData = async () => {
      setLocalLoading(true);
      if (user && !currentPairing) { // Check if currentPairing is null
        await loadCurrentPairing(); 
        // After attempting to load, currentPairing might still be null if no pairing exists
        // or it will be populated. The subsequent useEffect for partner details will handle its part.
      }
      // Select random welcome message
      const randomIndex = Math.floor(Math.random() * DAILY_PAIRING_MESSAGES.length);
      setWelcomeMessage(DAILY_PAIRING_MESSAGES[randomIndex]);
      
      // If there's no partnerId (derived from currentPairing), we might not need to wait for partner details.
      if (!partnerId) {
        setLocalLoading(false);
      }
      // If currentPairing is still null after load attempt, and no partnerId, stop loading.
      // If currentPairing is populated, partnerId will be set, and the other useEffect will manage loading.
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
  
  // Navigate to camera screen
  const handleTakePhoto = () => {
    if (currentPairing) {
      navigation.navigate('Camera', { pairingId: currentPairing.id });
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

  // View partner profile
  const handleViewProfile = () => {
    if (partnerId) {
      navigation.navigate('TabNavigator', {
        screen: 'Profile',
        params: { userId: partnerId }
      });
    }
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
      
      {/* New Pairing Notification */}
      {showNotification && (
        <View style={styles.notification}>
          <Ionicons name="person-outline" size={20} color={COLORS.background} />
          <Text style={styles.notificationText}>Check out your match for today!</Text>
        </View>
      )}
      
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
          <Text style={styles.welcomeMessage}>{welcomeMessage}</Text>
          
          {!currentUserPairingPhotoURL ? (
            <View style={styles.takePhotoContainer}>
              <Ionicons name="camera-reverse-outline" size={60} color={COLORS.primary} style={{marginBottom: 20}} />
              <Text style={styles.promptText}>It's time for your daily pairing photo!</Text>
              <PrimaryButton
                text="Take Pairing Photo"
                onPress={handleTakePhoto}
                icon="camera-outline"
                style={styles.actionButton}
              />
              <View style={{ marginTop: 16 }}>
                <SecondaryButton
                  text="Maybe Later (Home)"
                  onPress={handleGoHome}
                />
              </View>
            </View>
          ) : (
            <View style={styles.pairingCompleteContainer}>
              <Text style={styles.submittedText}>You've submitted your photo!</Text>
              
              {partnerPairingPhotoURL ? (
                <View style={styles.bothSubmitted}>
                  <Text style={styles.completedText}>Both of you have submitted photos!</Text>
                  <View style={styles.previewContainer}>
                    <Image 
                      source={{ uri: currentUserPairingPhotoURL }} 
                      style={styles.previewImage}
                    />
                    <Image 
                      source={{ uri: partnerPairingPhotoURL }} 
                      style={styles.previewImage}
                    />
                  </View>
                  <Text style={styles.completedSubtext}>
                    Check the feed to see your pairing displayed!
                  </Text>
                </View>
              ) : (
                <View style={styles.waitingContainer}>
                  <Text style={styles.waitingText}>
                    Waiting for {partner?.username || partner?.displayName || 'your partner'} to submit their photo...
                  </Text>
                  
                  <View style={styles.chatPromptContainer}>
                    <Text style={styles.chatPrompt}>
                      Send a friendly reminder in chat!
                    </Text>
                    <PrimaryButton
                      text="Open Chat"
                      onPress={handleOpenChat}
                      icon="chatbubble-outline"
                      style={styles.actionButton}
                    />
                  </View>
                </View>
              )}
              
              <View style={styles.userInfoContainer}>
                <TouchableOpacity 
                  style={styles.userInfo}
                  onPress={handleViewProfile}
                >
                  <Image 
                    source={{ uri: partner?.photoURL || 'https://via.placeholder.com/100' }}
                    style={styles.userAvatar}
                  />
                  <View>
                    <Text style={styles.userName}>
                      {partner?.displayName || partner?.username || 'Your Partner'}
                    </Text>
                    <Text style={styles.userUsername}>
                      @{partner?.username || 'user'}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <SecondaryButton
                  text="Go Home"
                  onPress={handleGoHome}
                  style={{ marginTop: 16 }}
                />
              </View>
            </View>
          )}
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
  welcomeMessage: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 40,
    marginHorizontal: 20,
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
  calendarIcon: {
    marginBottom: 30,
    marginTop: 10,
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
  takePhotoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
  },
  promptText: {
    fontFamily: FONTS.regular,
    fontSize: 18,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 30,
  },
  actionButton: {
    minWidth: 200,
  },
  pairingCompleteContainer: {
    width: '100%',
    alignItems: 'center',
  },
  submittedText: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.primary,
    marginBottom: 20,
  },
  waitingContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  waitingText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  chatPromptContainer: {
    alignItems: 'center',
    backgroundColor: '#222222',
    borderRadius: BORDER_RADIUS.lg,
    padding: 20,
    marginVertical: 20,
    width: '100%',
  },
  chatPrompt: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  userInfoContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222222',
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    width: '100%',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  userName: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.primary,
  },
  userUsername: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  bothSubmitted: {
    alignItems: 'center',
    marginBottom: 30,
  },
  completedText: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.success,
    marginBottom: 20,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  previewImage: {
    width: 130,
    height: 130,
    borderRadius: BORDER_RADIUS.md,
    margin: 10,
  },
  completedSubtext: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  notification: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    zIndex: 100,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  notificationText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.background,
    marginLeft: 8,
  }
});

export default DailyPairingScreen;