/**
 * DailyPairingScreen
 * 
 * Shows users their daily pairing with another user, following the black and white theme.
 * Displays both users' profile pictures and provides options to go to chat or return home.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  RefreshControl
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
type DailyPairingScreenNavigationProp = StackNavigationProp<MainStackParamList, 'Pairing'>;

const DailyPairingScreen: React.FC = () => {
  const navigation = useNavigation<DailyPairingScreenNavigationProp>();
  const { currentPairing, loadCurrentPairing } = usePairing();
  const { user } = useAuth();
  
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [partner, setPartner] = useState<User | null>(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
  }, [user, currentPairing, loadCurrentPairing, partnerId]); // Added partnerId dependency

  useEffect(() => {
    const fetchPartnerDetails = async () => {
      if (partnerId) {
        setLocalLoading(true); // Ensure loading is true when fetching partner
        try {
          const partnerData = await firebaseService.getUserById(partnerId);
          setPartner(partnerData || null);
        } catch (error) {
          console.error('Error fetching partner details:', error);
          setPartner(null);
        } finally {
          setLocalLoading(false); // Stop loading once partner fetch is done or fails
        }
      } else {
        setPartner(null); 
        // If no partnerId, and currentPairing might be loaded (or not found), ensure loading stops.
        if (currentPairing !== undefined) { // Check if currentPairing has been determined (even if null)
            setLocalLoading(false);
        }
      }
    };

    // Only fetch if currentPairing is available (meaning partnerId would be derived)
    // or if currentPairing is explicitly null (meaning no pairing, so stop loading)
    if (currentPairing !== undefined) { 
        fetchPartnerDetails();
    }
  }, [partnerId, currentPairing]);

  const handleGoToChat = () => {
    if (!currentPairing || !partner) return;
    navigation.navigate('Chat', {
      pairingId: currentPairing.id,
      chatId: currentPairing.chatId,
    });
  };
    const handleGoHome = () => {
    // Navigate to the Feed tab
    navigation.navigate('TabNavigator', {
      screen: 'Feed',
      params: {}
    });
  };

  const handleTakePhoto = () => {
    if (currentPairing && user) {
      navigation.navigate('Camera', {
        pairingId: currentPairing.id,
        userId: user.id,
        submissionType: 'pairing',
      });
    } else {
      console.warn("Cannot navigate to camera: missing currentPairing or user.");
    }
  };
  
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
            <>
              <View style={styles.feedStyleProfilesContainer}>
                {/* Partner Profile - Displayed at the top */}
                <View style={styles.feedStyleProfileWrapper}>
                  <Text style={styles.feedStyleUsername}>{partner?.displayName || 'Your Partner'}</Text>
                  <View style={styles.feedStyleProfileImageContainer}>
                    {partnerPairingPhotoURL ? (
                      <Image 
                        source={{ uri: partnerPairingPhotoURL }}
                        style={styles.feedStyleProfileImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.feedStyleProfileImage, styles.photoMissingPlaceholder]}>
                        <Text style={styles.photoMissingText}>
                          {partner ? `${partner.displayName || 'Partner'} hasn't submitted yet.` : "Waiting for partner..."}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                
                {/* Your Profile - Displayed below partner */}
                <View style={styles.feedStyleProfileWrapper}>
                  <Text style={styles.feedStyleUsername}>You</Text>
                  <View style={styles.feedStyleProfileImageContainer}>
                    {currentUserPairingPhotoURL ? (
                      <Image 
                        source={{ uri: currentUserPairingPhotoURL }}
                        style={styles.feedStyleProfileImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.feedStyleProfileImage, styles.photoMissingPlaceholder]}>
                        <Text style={styles.photoMissingText}>Your photo</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              
              <View style={styles.buttonsContainer}>
                <PrimaryButton
                  text="Go To Chat"
                  onPress={handleGoToChat}
                  icon="chatbubble-outline"
                  disabled={!partner} // Disable chat if partner details not loaded
                />
                <View style={styles.buttonSpacer} />
                <SecondaryButton
                  text={currentUserPairingPhotoURL ? "Retake Pairing Photo" : "Take Pairing Photo"}
                  onPress={handleTakePhoto}
                  icon="camera-outline"
                />
                <View style={styles.buttonSpacer} />
                <SecondaryButton
                  text="Back Home"
                  onPress={handleGoHome}
                />
              </View>
            </>
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
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
  placeholderText: {
    fontFamily: FONTS.bold,
    fontSize: 48,
    color: COLORS.primary,
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
});

export default DailyPairingScreen;