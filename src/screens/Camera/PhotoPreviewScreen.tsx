/**
 * PhotoPreviewScreen
 * 
 * Displays a preview of the captured photo with options to use or retake.
 * Uses the reusable CameraPreview component from src/components/camera.
 */

import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
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
  const [submitting, setSubmitting] = useState(false);
  
  // Handle submitting the current photo
  const handleSubmit = async (isPrivate: boolean, photoUrl: string) => {
    if (!user?.id || !photoUrl || !pairingId) {
      Alert.alert('Error', 'Missing required information to submit photo.');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Use firebaseService directly since we have pairingId from route params
      await firebaseService.submitPairingPhoto(
        pairingId,
        user.id,
        photoUrl,
        isPrivate
      );
      
      // If successful, navigate back to the main screen
      Alert.alert('Success', 'Photo uploaded successfully!');
      navigation.navigate('Main', { screen: 'TabNavigator' });
    } catch (error) {
      console.error('Error submitting photo:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle retaking the photo
  const handleRetake = () => {
    navigation.goBack(); // Return to the camera screen
  };

  // Handle canceling the preview
  const handleCancel = () => {
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