/**
 * PhotoPreviewScreen
 * 
 * Displays a preview of the captured photo with options to use or retake.
 * Uses the reusable CameraPreview component from src/components/camera.
 * Includes duplicate prevention and enhanced error handling.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { usePairing } from '../../context/PairingContext';
import CameraPreview from '../../components/camera/CameraPreview';
import { COLORS } from '../../config/colors';
import firebaseService from '../../services/firebase';

interface PhotoPreviewRouteParams {
  photoUri: string;
  pairingId: string;
}

export default function PhotoPreviewScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { photoUri, pairingId } = route.params as PhotoPreviewRouteParams;
  
  const { user } = useAuth();
  const { currentPairing } = usePairing();
  const [submitting, setSubmitting] = useState(false);
  
  // Track submission attempts to prevent duplicates
  const submitAttemptRef = useRef<string | null>(null);
  const [hasSubmittedSuccessfully, setHasSubmittedSuccessfully] = useState(false);

  // Validate parameters on mount
  useEffect(() => {
    if (!photoUri || !pairingId || !user?.id) {
      console.error('PhotoPreviewScreen: Missing required parameters', {
        hasPhotoUri: !!photoUri,
        hasPairingId: !!pairingId,
        hasUserId: !!user?.id
      });
      
      Alert.alert(
        'Error',
        'Invalid photo or pairing information. Returning to camera.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [photoUri, pairingId, user?.id, navigation]);

  // Check if user has already submitted for this pairing
  useEffect(() => {
    if (currentPairing && user?.id) {
      const isUser1 = currentPairing.user1_id === user.id;
      const hasAlreadySubmitted = isUser1 
        ? !!currentPairing.user1_photoURL 
        : !!currentPairing.user2_photoURL;
      
      if (hasAlreadySubmitted) {
        Alert.alert(
          'Already Submitted',
          'You have already submitted a photo for this pairing.',
          [{ text: 'OK', onPress: () => navigation.navigate('Main', { screen: 'TabNavigator' }) }]
        );
      }
    }
  }, [currentPairing, user?.id, navigation]);
  
  // Handle submitting the current photo with duplicate prevention
  const handleSubmit = async (isPrivate: boolean, photoUrl: string) => {
    // Prevent duplicate submissions
    if (submitting || hasSubmittedSuccessfully) {
      console.warn('PhotoPreviewScreen: Submission already in progress or completed');
      return;
    }

    // Validate required parameters
    if (!user?.id || !photoUrl || !pairingId) {
      Alert.alert('Error', 'Missing required information to submit photo.');
      return;
    }

    // Create unique submission key to prevent exact duplicate submissions
    const submissionKey = `${user.id}-${pairingId}-${Date.now()}`;
    
    // Check if we're already processing this exact submission
    if (submitAttemptRef.current === submissionKey) {
      console.warn('PhotoPreviewScreen: Duplicate submission attempt detected');
      return;
    }
    
    try {
      setSubmitting(true);
      submitAttemptRef.current = submissionKey;
      
      console.log('PhotoPreviewScreen: Starting photo submission', {
        pairingId,
        userId: user.id,
        isPrivate,
        submissionKey
      });
      
      // Submit photo using Firebase service
      await firebaseService.submitPairingPhoto(
        pairingId,
        user.id,
        photoUrl,
        isPrivate
      );
      
      console.log('PhotoPreviewScreen: Photo submitted successfully');
      setHasSubmittedSuccessfully(true);
      
      // Success feedback
      Alert.alert(
        'Success!', 
        'Photo uploaded successfully!',
        [{ 
          text: 'OK', 
          onPress: () => navigation.navigate('Main', { screen: 'TabNavigator' })
        }]
      );
    } catch (error) {
      console.error('PhotoPreviewScreen: Error submitting photo:', error);
      
      // Reset submission tracking on error so user can retry
      submitAttemptRef.current = null;
      
      // Provide user-friendly error messages
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'Permission denied. Please check your account status.';
        } else if (error.message.includes('already submitted')) {
          errorMessage = 'You have already submitted a photo for this pairing.';
          setHasSubmittedSuccessfully(true); // Prevent further attempts
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle retaking the photo
  const handleRetake = () => {
    if (submitting) {
      Alert.alert(
        'Submission in Progress',
        'Please wait for the current submission to complete before retaking.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    navigation.goBack(); // Return to the camera screen
  };

  // Handle canceling the preview
  const handleCancel = () => {
    if (submitting) {
      Alert.alert(
        'Submission in Progress',
        'Are you sure you want to cancel? Your photo submission will be lost.',
        [
          { text: 'Continue Submitting', style: 'cancel' },
          { text: 'Cancel Submission', onPress: () => navigation.goBack() }
        ]
      );
      return;
    }
    
    navigation.goBack();
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <CameraPreview
        imageUri={photoUri}
        onSubmit={handleSubmit}
        onRetake={handleRetake}
        onCancel={handleCancel}
        uploading={submitting}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark || '#000',
  },
}); 