/**
 * WaitingScreen
 * 
 * Screen to show when waiting for a partner to post their selfie.
 * Displays partner info, time remaining, and allows chatting.
 * Automatically redirects to feed when pairing is completed.
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Animated,
  Easing,
  Platform,
  SafeAreaView,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { usePairing } from '../../context/PairingContext';
import { useFeed } from '../../context/FeedContext';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../config/theme';
import { globalStyles } from '../../styles/globalStyles';
import { getTimeRemainingUntilDeadline } from '../../utils/notifications/notificationUtils';
import { RouteProp } from '@react-navigation/native';
import { MainStackParamList } from '../../types/navigation';
import { db } from '../../config/firebase';
import firebaseService from '../../services/firebase';
import logger from '../../utils/logger';

const WaitingScreen: React.FC = () => {
  // Navigation and route
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MainStackParamList, 'Waiting'>>();
  const pairingId = route.params?.pairingId;
  
  // Contexts
  const { user } = useAuth();
  const { currentPairing, loadCurrentPairing } = usePairing();
  const { refreshFeed } = useFeed();
  
  // State
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemainingUntilDeadline());
  const [partner, setPartner] = useState<any | null>(null);
  const [timeToNextPairing, setTimeToNextPairing] = useState<string>('');
  const [pairingData, setPairingData] = useState<any>(null);
  const [hasHandledCompletion, setHasHandledCompletion] = useState(false);
  
  // Animations
  const pulseAnimation = new Animated.Value(1);
  
  // Get partner user id
  const partnerId = currentPairing?.users.find(id => id !== user?.id);
  
  // Reset completion tracking when pairingId changes
  useEffect(() => {
    setHasHandledCompletion(false);
  }, [pairingId]);
  
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
  
  // Real-time listener for pairing completion
  useEffect(() => {
    if (!pairingId) return;
    
    // Set up real-time listener for the pairing using Firebase onSnapshot
    const pairingRef = doc(db, 'pairings', pairingId);
    
    const unsubscribe = onSnapshot(
      pairingRef,
      (doc) => {
        if (doc.exists()) {
          const pairing = { id: doc.id, ...doc.data() } as any;
          console.log('DEBUG: WaitingScreen - Pairing update received:', pairing);
          setPairingData(pairing);
          
          // Check if both users have submitted photos
          const bothPhotosSubmitted = pairing.user1_photoURL && pairing.user2_photoURL;
          const isPairingCompleted = pairing.status === 'completed';
          
          if (bothPhotosSubmitted && isPairingCompleted && !hasHandledCompletion) {
            console.log('DEBUG: WaitingScreen - Both photos submitted, redirecting to feed');
            
            // Show success message
            Alert.alert(
              'Pairing Completed! 🎉',
              'Both photos have been submitted. Your pairing is now live in the feed!',
              [
                {
                  text: 'View in Feed',
                  onPress: () => {
                    // Refresh feed and navigate to it
                    refreshFeed().then(() => {
                      (navigation as any).navigate('TabNavigator', {
                        screen: 'Feed',
                        params: {
                          scrollToPairingId: pairingId,
                          refresh: true
                        }
                      });
                    });
                    setHasHandledCompletion(true);
                  }
                }
              ]
            );
          }
        }
      },
      (error) => {
        console.error('Error listening to pairing updates:', error);
        logger.error('WaitingScreen pairing listener error', error);
      }
    );
    
    return () => {
      unsubscribe();
    };
  }, [pairingId, navigation, refreshFeed, hasHandledCompletion]);
  
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
  
  // Handle going back to feed
  const handleGoToFeed = () => {
    (navigation as any).navigate('TabNavigator', {
      screen: 'Feed'
    });
  };

  // Handle going back to pairing screen
  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Fallback to pairing screen
      (navigation as any).navigate('TabNavigator', {
        screen: 'Pairing'
      });
    }
  };
  
  // Handle chat navigation
  const handleOpenChat = () => {
    if (currentPairing) {
      // Use the pairing's chatId, or fallback to pairingId if chatId is missing
      const chatId = currentPairing.chatId || currentPairing.id;
      
      console.log('DEBUG: Opening chat from waiting screen', {
        pairingId: currentPairing.id,
        chatId: chatId,
        partnerId: partner?.id,
        partnerName: partner?.displayName || partner?.username
      });
      
      (navigation as any).navigate('Chat', {
        pairingId: currentPairing.id,
        chatId: chatId,
        partnerId: partner?.id,
        partnerName: partner?.displayName || partner?.username || 'Your Partner'
      });
    }
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
          style={styles.feedButton}
          onPress={handleGoToFeed}
        >
          <Ionicons name="home-outline" size={20} color={COLORS.primary} />
          <Text style={styles.feedButtonText}>Go to Feed</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Waiting for Partner</Text>
          
          <TouchableOpacity style={styles.headerButton} onPress={handleGoToFeed}>
            <Ionicons name="home-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
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
                Your partner hasn't posted their selfie yet. Chat with them while you wait!
              </Text>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.chatButton}
                  onPress={handleOpenChat}
                >
                  <Ionicons name="chatbubble-outline" size={20} color={COLORS.text} />
                  <Text style={styles.chatButtonText}>Open Chat</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.feedButton}
                  onPress={handleGoToFeed}
                >
                  <Ionicons name="home-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.feedButtonText}>Go to Feed</Text>
                </TouchableOpacity>
              </View>
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
  headerTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 18,
    color: COLORS.text,
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
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    flex: 1,
  },
  chatButtonText: {
    fontFamily: 'ChivoBold',
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
  },
  feedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
    flex: 1,
  },
  feedButtonText: {
    fontFamily: 'ChivoBold',
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 8,
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
  headerButton: {
    padding: 8,
    minWidth: 40,
  },
});

export default WaitingScreen;