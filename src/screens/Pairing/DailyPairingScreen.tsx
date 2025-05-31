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
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../../config/firebase';
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
import { MainStackParamList, PairingStackParamList } from '../../types/navigation';
import logger from '../../utils/logger';

// Type for navigation props - use PairingStackParamList since we're navigating within the stack
type DailyPairingScreenNavigationProp = StackNavigationProp<PairingStackParamList, 'DailyPairing'>;

const DailyPairingScreen: React.FC = () => {
  const navigation = useNavigation<DailyPairingScreenNavigationProp>();
  const { currentPairing, loadCurrentPairing, markPairingIntroAsSeen } = usePairing();
  const { user } = useAuth();
  
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [partner, setPartner] = useState<User | null>(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [useRealtimeListener, setUseRealtimeListener] = useState(true);
  
  // Animation for Let's Go button
  const buttonScale = useRef(new Animated.Value(1)).current;
  
  // Refs for managing Firebase listeners
  const pairingListener = useRef<Unsubscribe | null>(null);
  const partnerListener = useRef<Unsubscribe | null>(null);

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
  
  // FIXED: Use useCallback to stabilize function references
  const fetchPartnerDetails = useCallback(async (id: string) => {
    try {
      const partnerData = await firebaseService.getUserById(id);
      setPartner(partnerData || null);
    } catch (error) {
      logger.error('Error fetching partner details', error);
      setPartner(null);
    }
  }, []);

  const selectRandomWelcomeMessage = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * DAILY_PAIRING_MESSAGES.length);
    setWelcomeMessage(DAILY_PAIRING_MESSAGES[randomIndex]);
  }, []);
  
  // Setup real-time listener for current pairing
  const setupPairingListener = useCallback(async () => {
    if (!currentPairing?.id || !user?.id || !useRealtimeListener) {
      console.log('DEBUG: DailyPairingScreen - Skipping pairing listener setup:', {
        pairingId: currentPairing?.id,
        userId: user?.id,
        useRealtimeListener
      });
      return;
    }
    
    try {
      console.log('DEBUG: DailyPairingScreen - Setting up pairing listener for:', currentPairing.id);
      
      // Listen to pairing document changes
      const pairingRef = doc(db, 'pairings', currentPairing.id);
      
      pairingListener.current = onSnapshot(
        pairingRef,
        async (docSnapshot) => {
          if (docSnapshot.exists()) {
            const updatedPairing = { id: docSnapshot.id, ...docSnapshot.data() } as any;
            console.log('DEBUG: DailyPairingScreen - Pairing updated:', updatedPairing);
            
            // Update partner data if pairing changed
            if (partnerId) {
              try {
                const partnerData = await firebaseService.getUserById(partnerId);
                setPartner(partnerData || null);
                console.log('DEBUG: DailyPairingScreen - Partner data updated via real-time:', partnerData?.displayName);
              } catch (error) {
                console.error('Failed to load updated partner data:', error);
              }
            }
          }
        },
        (error) => {
          console.error('DailyPairingScreen pairing listener error:', error);
          logger.error('DailyPairingScreen pairing listener failed', error);
          
          // Fallback to manual loading on error
          setUseRealtimeListener(false);
          if (partnerId) {
            fetchPartnerDetails(partnerId);
          }
        }
      );
      
    } catch (error) {
      console.error('Failed to setup pairing listener:', error);
      logger.error('DailyPairingScreen pairing listener setup failed', error);
      
      // Fallback to manual loading
      setUseRealtimeListener(false);
      if (partnerId) {
        fetchPartnerDetails(partnerId);
      }
    }
  }, [currentPairing?.id, user?.id, useRealtimeListener, partnerId, fetchPartnerDetails]);

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
      selectRandomWelcomeMessage();
    } catch (error) {
      logger.error('Error refreshing data', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadCurrentPairing, partnerId, fetchPartnerDetails, selectRandomWelcomeMessage]);

  // FIXED: Single consolidated useEffect to prevent loops
  useEffect(() => {
    let isMounted = true;

    const initializeScreen = async () => {
      if (!user) return;

      setLocalLoading(true);

      try {
        // Load current pairing if not already loaded
        if (currentPairing === undefined) {
          await loadCurrentPairing();
        }

        // Set welcome message once
        if (!welcomeMessage) {
          selectRandomWelcomeMessage();
        }

        // Setup real-time listeners if we have a pairing and real-time is enabled
        if (useRealtimeListener && currentPairing?.id && isMounted) {
          console.log('DEBUG: DailyPairingScreen - Setting up real-time listeners');
          setupPairingListener();
        } else if (partnerId && !partner && isMounted && !useRealtimeListener) {
          // Load partner details manually if not using real-time
          await fetchPartnerDetails(partnerId);
        }

      } catch (error) {
        logger.error('Error initializing screen', error);
      } finally {
        if (isMounted) {
          setLocalLoading(false);
        }
      }
    };

    initializeScreen();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
      cleanupListeners();
    };
  }, [
    user?.id, 
    currentPairing === undefined ? 'loading' : currentPairing?.id, // Only depend on pairing ID changes, not the full object
    partnerId, 
    !partner && partnerId ? 'need-partner' : 'have-partner', // Simplified partner loading state
    !welcomeMessage ? 'need-message' : 'have-message', // Simplified message state
    useRealtimeListener,
    setupPairingListener,
    cleanupListeners
  ]);

  const handleGoToChat = useCallback(() => {
    if (!currentPairing || !partner) return;
    // Chat is in the MainStack, so navigate up from PairingStack
    (navigation as any).navigate('Chat', {
      pairingId: currentPairing.id,
      chatId: currentPairing.chatId,
    });
  }, [currentPairing?.id, currentPairing?.chatId, partner, navigation]);
    const handleGoHome = useCallback(() => {
    // FIXED: Use CommonActions.reset to prevent navigation loops
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'TabNavigator',
            state: {
              routes: [
                { name: 'Feed' },
                { name: 'Today' },
                { name: 'Profile' },
              ],
              index: 0, // Navigate to Feed tab
            },
          },
        ],
      })
    );
  }, [navigation]);

  const handleTakePhoto = useCallback(() => {
    if (currentPairing && user) {
      // Camera is in the MainStack, so navigate up from PairingStack
      (navigation as any).navigate('Camera', {
        pairingId: currentPairing.id,
        userId: user.id,
        submissionType: 'pairing',
      });
    } else {
      logger.warn("Cannot navigate to camera: missing currentPairing or user.");
    }
  }, [currentPairing?.id, user?.id, navigation]);
  
  const handleLetsGo = useCallback(() => {
    // Add button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Mark the intro as seen and navigate to the status screen
    markPairingIntroAsSeen();
    navigation.navigate('CurrentPairing');
  }, [markPairingIntroAsSeen, navigation, buttonScale]);
  
  // isLoading is now primarily localLoading. 
  // It's true at the start, and during distinct loading phases (initial, partner fetch).
  const isLoading = localLoading;

  if (isLoading && currentPairing === undefined) { // Show loading if currentPairing is not yet determined
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
          <Ionicons name="calendar-outline" size={48} color={COLORS.primary} style={styles.calendarIcon} />
          <SecondaryButton
            text="Go Home"
            onPress={handleGoHome}
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
        // FIXED: Add bounces={false} to prevent scroll bounce conflicts
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <Text style={styles.matchTitle}>Today's Match:</Text>
          
          {/* Vertical Stacked Portraits */}
          <View style={styles.stackedPortraitsContainer}>
            {/* Current User Portrait */}
            <View style={styles.portraitWrapper}>
              <Text style={styles.portraitLabel}>You</Text>
              <View style={styles.circularPortraitContainer}>
                {user?.photoURL ? (
                  <Image 
                    source={{ uri: user.photoURL }}
                    style={styles.circularPortrait}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.circularPortrait, styles.placeholderPortrait]}>
                    <Ionicons name="person-outline" size={32} color={COLORS.primary} />
                  </View>
                )}
              </View>
            </View>
            
            {/* Partner Portrait */}
            <View style={styles.portraitWrapper}>
              <Text style={styles.portraitLabel}>{partner?.displayName || 'Partner'}</Text>
              <View style={styles.circularPortraitContainer}>
                {partner?.photoURL ? (
                  <Image 
                    source={{ uri: partner.photoURL }}
                    style={styles.circularPortrait}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.circularPortrait, styles.placeholderPortrait]}>
                    <Ionicons name="person-outline" size={32} color={COLORS.primary} />
                  </View>
                )}
              </View>
            </View>
          </View>
          
          {/* Description Text */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>
              {partner?.displayName || 'Your partner'} and you have been matched for today's BNOC selfie! 
              Ready to capture your moment together?
            </Text>
          </View>
          
          {/* Let's Go Button */}
          <Animated.View 
            style={[
              styles.buttonContainer,
              { transform: [{ scale: buttonScale }] }
            ]}
          >
            <PrimaryButton
              text="Let's go"
              onPress={handleLetsGo}
              style={styles.letsGoButton}
            />
          </Animated.View>
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
    padding: 24,
  },
  emptyLogo: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: COLORS.primary,
    marginBottom: 32,
    letterSpacing: 1,
  },
  noMatchTitle: {
    fontFamily: FONTS.bold,
    fontSize: 22, 
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  noMatchSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: 32,
    textAlign: 'center',
  },
  calendarIcon: {
    marginBottom: 40,
    marginTop: 16,
  },
  welcomeMessage: {
    fontFamily: FONTS.bold,
    fontSize: 28, // Adjusted for prominence
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 40, // Increased margin
    letterSpacing: 0.5,
  },
  takePhotoContainer: { // New Style
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  promptText: { // New Style
    fontFamily: FONTS.regular,
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionButton: { // Style for main action buttons
    width: '80%',
    paddingVertical: 12,
  },
  // Original horizontal layout (not used with new design)
  profilesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 48,
    width: '100%',
  },
  profileWrapper: {
    alignItems: 'center',
    maxWidth: 130,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.primary,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  username: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: COLORS.text,
    marginTop: 12,
    textAlign: 'center',
  },
  connector: {
    marginHorizontal: 8,
  },
  // New vertical feed-style layout
  feedStyleProfilesContainer: {
    width: '100%',
    marginBottom: 32,
    alignItems: 'center',
  },
  feedStyleProfileWrapper: {
    width: '100%',
    marginBottom: 24,
    alignItems: 'center',
  },
  feedStyleProfileImageContainer: {
    width: 280,
    height: 350,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  feedStyleProfileImage: {
    width: '100%',
    height: '100%',
  },
  feedStyleUsername: {
    fontFamily: FONTS.medium,
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },

  photoMissingPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  photoMissingText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'stretch',
  },
  buttonSpacer: {
    height: 16,
  },
  matchTitle: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: COLORS.primary,
    marginBottom: 32,
    textAlign: 'center',
  },
  stackedPortraitsContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  portraitWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  portraitLabel: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  circularPortraitContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularPortrait: {
    width: '100%',
    height: '100%',
  },
  placeholderPortrait: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
  },
  descriptionContainer: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  descriptionText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
  },
  letsGoButton: {
    width: '100%',
    paddingVertical: 16,
  },
});

export default DailyPairingScreen;