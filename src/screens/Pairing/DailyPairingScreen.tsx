/**
 * DailyPairingScreen
 * 
 * Shows users their daily pairing with another user, following the black and white theme.
 * Displays both users' profile pictures and provides options to go to chat or return home.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, BORDER_RADIUS } from '../../config/theme';
import { usePairing } from '../../context/PairingContext';
import { useAuth } from '../../context/AuthContext';
import PrimaryButton from '../../components/buttons/PrimaryButton';
import SecondaryButton from '../../components/buttons/SecondaryButton';
import { DAILY_PAIRING_MESSAGES } from '../../config/constants';

const DailyPairingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { currentPairing, loadCurrentPairing } = usePairing();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [partnerName, setPartnerName] = useState('Your Partner');
  const [partnerPhoto, setPartnerPhoto] = useState<string | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  
  // Load current pairing data
  useEffect(() => {
    const loadPairing = async () => {
      try {
        setLoading(true);
        await loadCurrentPairing();
        
        // For demo, mock partner data
        if (currentPairing) {
          const isUser1 = currentPairing.user1_id === user?.id;
          setPartnerName(isUser1 ? 'Duy' : 'Justin');
          setPartnerPhoto(isUser1 
            ? 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fduy.jpeg?alt=media&token=e6e88f85-a09d-45cc-b6a4-cad438d1b2f6'
            : 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fjustin.jpeg?alt=media&token=e6e88f85-a09d-45cc-b6a4-cad438d1b2f6'
          );
          setUserPhoto(user?.photoURL || null);
        }
        
        // Select random welcome message
        const randomIndex = Math.floor(Math.random() * DAILY_PAIRING_MESSAGES.length);
        setWelcomeMessage(DAILY_PAIRING_MESSAGES[randomIndex]);
      } catch (error) {
        console.error('Error loading pairing:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadPairing();
  }, []);
  
  const handleGoToChat = () => {
    if (!currentPairing) return;
    
    navigation.navigate('Chat', {
      pairingId: currentPairing.id,
      chatId: currentPairing.chatId,
      partnerId: currentPairing.user1_id === user?.id 
        ? currentPairing.user2_id 
        : currentPairing.user1_id,
      partnerName
    });
  };
  
  const handleGoHome = () => {
    navigation.navigate('Feed');
  };
  
  if (loading) {
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
  
  if (!currentPairing) {
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
      <View style={styles.content}>
        <Text style={styles.welcomeMessage}>{welcomeMessage}</Text>
        
        <View style={styles.profilesContainer}>
          {/* User Profile */}
          <View style={styles.profileWrapper}>
            <View style={styles.profileImageContainer}>
              {userPhoto ? (
                <Image 
                  source={{ uri: userPhoto }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Text style={styles.placeholderText}>
                    {user?.displayName?.charAt(0) || '?'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.username}>You</Text>
          </View>
          
          {/* Connector */}
          <View style={styles.connector}>
            <Ionicons name="swap-horizontal-outline" size={24} color={COLORS.primary} />
          </View>
          
          {/* Partner Profile */}
          <View style={styles.profileWrapper}>
            <View style={styles.profileImageContainer}>
              {partnerPhoto ? (
                <Image 
                  source={{ uri: partnerPhoto }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Text style={styles.placeholderText}>
                    {partnerName.charAt(0) || '?'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.username}>{partnerName}</Text>
          </View>
        </View>
        
        <View style={styles.buttonsContainer}>
          <PrimaryButton
            text="Go To Chat"
            onPress={handleGoToChat}
            icon="chatbubble-outline"
          />
          
          <View style={styles.buttonSpacer} />
          
          <SecondaryButton
            text="Back Home"
            onPress={handleGoHome}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    fontSize: 28,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 48,
    letterSpacing: 1,
  },
  profilesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 64,
  },
  profileWrapper: {
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: FONTS.bold,
    fontSize: 40,
    color: COLORS.primary,
  },
  username: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.primary,
    marginTop: 8,
  },
  connector: {
    marginHorizontal: 16,
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 300,
    alignItems: 'stretch',
  },
  buttonSpacer: {
    height: 16,
  },
});

export default DailyPairingScreen; 