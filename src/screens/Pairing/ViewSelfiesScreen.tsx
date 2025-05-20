/**
 * ViewSelfiesScreen
 * 
 * Screen to display both user's and partner's submitted selfies side-by-side
 * with options to retake or approve.
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, FONTS, BORDER_RADIUS } from '../../config/theme';
import { usePairing } from '../../context/PairingContext';
import { useAuth } from '../../context/AuthContext';
import PrimaryButton from '../../components/buttons/PrimaryButton';
import SecondaryButton from '../../components/buttons/SecondaryButton';
import { MainStackParamList } from '../../types/navigation';
import firebaseService from '../../services/firebase';

type ViewSelfiesRouteProp = RouteProp<MainStackParamList, 'ViewSelfies'>;
type ViewSelfiesNavigationProp = StackNavigationProp<MainStackParamList>;

const ViewSelfiesScreen: React.FC = () => {
  const navigation = useNavigation<ViewSelfiesNavigationProp>();
  const route = useRoute<ViewSelfiesRouteProp>();
  const { pairingId } = route.params || {};
  
  const { user } = useAuth();
  const { currentPairing, loadCurrentPairing } = usePairing();
  
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<any>(null);
  
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
  
  // Load pairing data if needed
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // If no pairingId was passed, or we don't have current pairing, load it
      if (!currentPairing || (pairingId && pairingId !== currentPairing.id)) {
        try {
          await loadCurrentPairing();
        } catch (error) {
          console.error('Failed to load pairing data:', error);
        }
      }
      
      // Load partner data if we have a partner ID
      if (partnerId) {
        try {
          const partnerData = await firebaseService.getUserById(partnerId);
          setPartner(partnerData);
        } catch (error) {
          console.error('Failed to load partner data:', error);
        }
      }
      
      setLoading(false);
    };
    
    loadData();
  }, [pairingId, currentPairing, loadCurrentPairing, partnerId]);
  
  // Handle retake photo
  const handleRetakePhoto = () => {
    if (currentPairing && user) {
      navigation.navigate('Camera', { 
        pairingId: currentPairing.id,
        userId: user.id,
        submissionType: 'pairing'
      });
    }
  };
  
  // Handle going back to pairing screen
  const handleDone = () => {
    navigation.navigate('DailyPairing', undefined);
  };
  
  // Handle going back to feed
  const handleGoToFeed = () => {
    navigation.navigate('TabNavigator', { 
      screen: 'Feed',
      params: { refresh: true }
    });
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading photos...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!currentPairing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={COLORS.primary} />
          <Text style={styles.errorTitle}>No Pairing Found</Text>
          <Text style={styles.errorText}>Unable to locate the pairing details.</Text>
          <SecondaryButton 
            text="Go to Feed" 
            onPress={handleGoToFeed}
            style={{ marginTop: 24 }}
          />
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleDone}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Today's Selfies</Text>
        <View style={{ width: 24 }} /> {/* Empty space for balance */}
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>
            {currentUserPairingPhotoURL && partnerPairingPhotoURL 
              ? "Both selfies submitted!" 
              : currentUserPairingPhotoURL 
                ? "Your selfie is ready" 
                : "No selfies yet"}
          </Text>
          
          <View style={styles.photosContainer}>
            {/* Your Photo */}
            <View style={styles.photoWrapper}>
              <Text style={styles.photoLabel}>Your Selfie</Text>
              {currentUserPairingPhotoURL ? (
                <Image
                  source={{ uri: currentUserPairingPhotoURL }}
                  style={styles.photo}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.photo, styles.placeholderPhoto]}>
                  <Ionicons name="camera-outline" size={40} color={COLORS.textSecondary} />
                  <Text style={styles.placeholderText}>No photo yet</Text>
                </View>
              )}
            </View>
            
            {/* Partner's Photo */}
            <View style={styles.photoWrapper}>
              <Text style={styles.photoLabel}>{partner?.displayName || 'Partner'}'s Selfie</Text>
              {partnerPairingPhotoURL ? (
                <Image
                  source={{ uri: partnerPairingPhotoURL }}
                  style={styles.photo}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.photo, styles.placeholderPhoto]}>
                  <Ionicons name="time-outline" size={40} color={COLORS.textSecondary} />
                  <Text style={styles.placeholderText}>Waiting...</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.buttonContainer}>
            {currentUserPairingPhotoURL && (
              <SecondaryButton 
                text="Retake My Snap" 
                icon="camera-reverse-outline"
                onPress={handleRetakePhoto} 
                style={styles.button}
              />
            )}
            
            <PrimaryButton 
              text={currentUserPairingPhotoURL ? "Looks Good" : "Take Selfie"}
              icon={currentUserPairingPhotoURL ? "checkmark-outline" : "camera-outline"}
              onPress={currentUserPairingPhotoURL ? handleDone : handleRetakePhoto}
              style={styles.button}
            />
            
            <TouchableOpacity 
              style={styles.textButton} 
              onPress={handleGoToFeed}
            >
              <Text style={styles.textButtonText}>Back to Feed</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.primary,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: COLORS.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
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
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.text,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: COLORS.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  photosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 32,
  },
  photoWrapper: {
    alignItems: 'center',
    width: '45%',
  },
  photoLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundLight,
  },
  placeholderPhoto: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
  },
  button: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 16,
  },
  textButton: {
    marginTop: 8,
    paddingVertical: 12,
  },
  textButtonText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },
});

export default ViewSelfiesScreen; 