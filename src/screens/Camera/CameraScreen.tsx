/**
 * CameraScreen
 * 
 * Mock implementation of dual camera screen for demo purposes.
 * Since react-native-vision-camera isn't supported in Expo Go,
 * this uses static images to simulate the camera functionality.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Animated,
  Dimensions,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { usePairing } from '../../context/PairingContext';
import { COLORS } from '../../config/colors';
import { globalStyles } from '../../styles/globalStyles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Mock image URLs for simulating camera capture
const MOCK_FRONT_IMAGES = [
  'https://picsum.photos/600/800?random=front1',
  'https://picsum.photos/600/800?random=front2',
  'https://picsum.photos/600/800?random=front3',
  'https://picsum.photos/600/800?random=front4',
];

const MOCK_BACK_IMAGES = [
  'https://picsum.photos/600/800?random=back1',
  'https://picsum.photos/600/800?random=back2',
  'https://picsum.photos/600/800?random=back3',
  'https://picsum.photos/600/800?random=back4',
];

const CameraScreen: React.FC = () => {
  const navigation = useNavigation();
  const { currentPairing, completePairing, pairingStatus } = usePairing();
  
  // State
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  
  // Animation values
  const shutterAnimation = useRef(new Animated.Value(1)).current;
  const previewSlideAnimation = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  
  // Timer for expiration
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  
  // Calculate time remaining
  useEffect(() => {
    if (!currentPairing?.expiresAt) return;
    
    const updateTimeRemaining = () => {
      if (!currentPairing?.expiresAt) return;
      
      const now = new Date();
      const expiresAt = new Date(currentPairing.expiresAt.seconds * 1000);
      const diffMs = expiresAt.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        setTimeRemaining('Expired');
        return;
      }
      
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeRemaining(`${diffHrs}h ${diffMins}m remaining`);
    };
    
    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [currentPairing]);
  
  // Simulate camera capture
  const handleCapture = () => {
    if (isCapturing || isPreview) return;
    
    setIsCapturing(true);
    
    // Animate shutter
    Animated.sequence([
      Animated.timing(shutterAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shutterAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Simulate camera delay
    setTimeout(() => {
      // Get random images to simulate camera capture
      const randomFrontIndex = Math.floor(Math.random() * MOCK_FRONT_IMAGES.length);
      const randomBackIndex = Math.floor(Math.random() * MOCK_BACK_IMAGES.length);
      
      setFrontImage(MOCK_FRONT_IMAGES[randomFrontIndex]);
      setBackImage(MOCK_BACK_IMAGES[randomBackIndex]);
      setIsCapturing(false);
      setIsPreview(true);
      
      // Animate preview slide up
      Animated.spring(previewSlideAnimation, {
        toValue: 0,
        tension: 50,
        friction: 9,
        useNativeDriver: true,
      }).start();
    }, 500);
  };
  
  // Handle retake
  const handleRetake = () => {
    // Animate preview slide down
    Animated.timing(previewSlideAnimation, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsPreview(false);
      setFrontImage(null);
      setBackImage(null);
    });
  };
  
  // Handle save
  const handleSave = async () => {
    if (!frontImage || !backImage || !currentPairing) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      return;
    }
    
    try {
      await completePairing({
        frontImage,
        backImage,
        isPrivate,
      });
      
      Alert.alert(
        'Success',
        'Your selfie has been uploaded!',
        [
          {
            text: 'View in Feed',
            onPress: () => {
              // @ts-ignore - Navigation typing
              navigation.navigate('Feed');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error saving pairing:', error);
      Alert.alert('Error', 'Failed to save selfie. Please try again.');
    }
  };
  
  // Handle close
  const handleClose = () => {
    navigation.goBack();
  };
  
  // Toggle privacy setting
  const togglePrivacy = () => {
    setIsPrivate(!isPrivate);
  };
  
  // Check if partner info is available
  const partnerName = currentPairing?.users ? 
    (currentPairing.users[0] === 'user1' ? 'Max' : 'Sergey') : 
    'Partner';
  
  return (
    <SafeAreaView style={[globalStyles.container, { backgroundColor: '#000' }]}>
      {isPreview ? (
        // Preview mode
        <Animated.View
          style={[
            styles.previewContainer,
            { transform: [{ translateY: previewSlideAnimation }] }
          ]}
        >
          <View style={styles.previewHeader}>
            <TouchableOpacity onPress={handleRetake} style={styles.previewButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              <Text style={styles.previewButtonText}>Retake</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.privacyButton, isPrivate && styles.privateActive]}
              onPress={togglePrivacy}
            >
              <Ionicons 
                name={isPrivate ? "lock-closed" : "lock-open"} 
                size={16} 
                color={isPrivate ? "#FFFFFF" : "#CCCCCC"} 
              />
              <Text style={[
                styles.privacyButtonText,
                isPrivate && styles.privateActiveText
              ]}>
                {isPrivate ? 'Private' : 'Public'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView>
            <View style={styles.imagesContainer}>
              <Image source={{ uri: frontImage || '' }} style={styles.previewImage} />
              <View style={styles.imageDivider} />
              <Image source={{ uri: backImage || '' }} style={styles.previewImage} />
            </View>
            
            <View style={styles.previewInfo}>
              <Text style={styles.previewTitle}>Ready to share your selfie?</Text>
              <Text style={styles.previewDescription}>
                This selfie will be posted to your profile and feed.
                {isPrivate 
                  ? ' Since it\'s private, only you and your partner can see it.' 
                  : ' It will also appear in the global feed.'}
              </Text>
            </View>
          </ScrollView>
          
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={pairingStatus === 'uploading'}
          >
            {pairingStatus === 'uploading' ? (
              <Text style={styles.saveButtonText}>Uploading...</Text>
            ) : (
              <Text style={styles.saveButtonText}>Share Selfie</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      ) : (
        // Camera mode
        <View style={styles.cameraContainer}>
          {/* Mock camera view */}
          <Image
            source={{ uri: 'https://picsum.photos/600/800?random=camera' }}
            style={styles.mockCameraView}
          />
          
          {/* Front camera preview overlay */}
          <View style={styles.frontCameraPreview}>
            <Image
              source={{ uri: 'https://picsum.photos/200/200?random=front-preview' }}
              style={styles.frontPreviewImage}
            />
          </View>
          
          {/* Header info */}
          <View style={styles.headerContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.pairingInfo}>
              <Text style={styles.pairingTitle}>
                Today's pairing with {partnerName}
              </Text>
              <Text style={styles.timeRemaining}>{timeRemaining}</Text>
            </View>
          </View>
          
          {/* Camera controls */}
          <View style={styles.controlsContainer}>
            <View style={styles.controlsRow}>
              <TouchableOpacity style={styles.flipButton}>
                <Ionicons name="camera-reverse" size={28} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.captureButton}
                onPress={handleCapture}
                disabled={isCapturing}
              >
                <Animated.View 
                  style={[
                    styles.captureButtonInner,
                    { opacity: shutterAnimation }
                  ]}
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.flashButton}>
                <Ionicons name="flash-off" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.captureHint}>
              Take a selfie with {partnerName}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  mockCameraView: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    top: 0,
    left: 0,
  },
  frontCameraPreview: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  frontPreviewImage: {
    width: '100%',
    height: '100%',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  pairingInfo: {
    alignItems: 'center',
    marginTop: 20,
  },
  pairingTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  timeRemaining: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 50,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  flipButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
  },
  flashButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureHint: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewButtonText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 8,
  },
  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundLight,
  },
  privateActive: {
    backgroundColor: COLORS.primary,
  },
  privacyButtonText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  privateActiveText: {
    color: '#FFFFFF',
  },
  imagesContainer: {
    width: '100%',
    padding: 16,
  },
  previewImage: {
    width: '100%',
    height: 400,
    borderRadius: 12,
    marginBottom: 8,
  },
  imageDivider: {
    height: 16,
  },
  previewInfo: {
    padding: 16,
    marginBottom: 100,
  },
  previewTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 20,
    color: COLORS.text,
    marginBottom: 8,
  },
  previewDescription: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  saveButton: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: 'ChivoBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
});

export default CameraScreen;