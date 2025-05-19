import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../context/AuthContext';
import firebaseService from '../../services/firebase';
import { COLORS } from '../../config/colors';
import { globalStyles } from '../../styles/globalStyles';
import CameraCapture from '../../components/camera/Camera';
import CameraPreview from '../../components/camera/CameraPreview';
import { uploadImage } from '../../services/storageService';
import { CaptureResult } from '../../hooks/useCamera';

// Define screen states
type CameraFlowState = 'capturing' | 'previewing' | 'uploading' | 'error';

// Define navigation params if any (e.g., pairingId from route)
// This depends on your navigation setup. For now, let's assume pairingId comes from route.
// Replace 'YourStackParamList' with your actual stack param list type
type CameraScreenRouteProp = RouteProp<{ params: { pairingId?: string } }, 'params'>;
// type CameraScreenNavigationProp = StackNavigationProp<YourStackParamList, 'CameraScreen'>;

export default function CameraScreen() {
  const navigation = useNavigation(); // Or use typed navigation if available
  const route = useRoute<CameraScreenRouteProp>();
  const pairingId = route.params?.pairingId;

  const { user } = useAuth(); // Get user for userId

  const [flowState, setFlowState] = useState<CameraFlowState>('capturing');
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCaptureComplete = (result: CaptureResult) => {
    if (result.imageUri && !result.error) {
      setCapturedImageUri(result.imageUri);
      setFlowState('previewing');
      setErrorMessage(null);
    } else {
      setErrorMessage(result.error || 'Failed to capture image. Please try again.');
      setFlowState('error');
      setCapturedImageUri(null);
    }
  };

  const handlePreviewSubmit = async (isPrivate: boolean, imageUri: string) => {
    if (!user || !user.id) {
      Alert.alert('Error', 'User not authenticated. Cannot upload photo.');
      setFlowState('capturing'); // Reset flow
      return;
    }
    if (!pairingId) {
      Alert.alert('Error', 'Pairing information missing. Cannot upload photo.');
      setFlowState('capturing'); // Reset flow
      return;
    }

    setFlowState('uploading');
    setUploadProgress(0);
    setErrorMessage(null);

    try {
      const downloadURL = await uploadImage(imageUri, user.id, (progress) => {
        setUploadProgress(progress);
      });

      // Now update the pairing information in Firestore
      await firebaseService.updatePairingWithPhoto(pairingId, user.id, downloadURL, isPrivate);
      
      Alert.alert('Success', 'Photo uploaded and pairing updated!');
      // Navigate to a success screen, feed, or back to the previous screen
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        // navigation.navigate('Feed'); // Example
      }
    } catch (error: any) {
      console.error('Upload or Firestore update failed:', error);
      setErrorMessage(error.message || 'Failed to upload photo or update pairing.');
      setFlowState('error');
    } finally {
      // If not error, flowState is handled by navigation, otherwise it stays 'error'
      // If it was an error, we might want to allow retrying from preview or capture
    }
  };

  const handlePreviewRetake = () => {
    setCapturedImageUri(null);
    setFlowState('capturing');
    setErrorMessage(null);
  };

  const handleCancel = () => {
    // Navigate back or to a different screen
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  if (!user) {
    // Optional: Handle case where user is not loaded yet, though AuthContext should manage this
    return (
      <SafeAreaView style={styles.containerCentered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={globalStyles.bodyText}>Loading user...</Text>
      </SafeAreaView>
    );
  }

  // Render based on flow state
  switch (flowState) {
    case 'capturing':
      return (
        <CameraCapture 
          onCaptureComplete={handleCaptureComplete} 
          onCancel={handleCancel} 
        />
      );
    case 'previewing':
      if (!capturedImageUri) {
        // Should not happen if logic is correct, but handle defensively
        setFlowState('capturing'); 
        return null;
      }
      return (
        <CameraPreview
          imageUri={capturedImageUri}
          onSubmit={handlePreviewSubmit}
          onRetake={handlePreviewRetake}
          onCancel={handleCancel} // Or could be handlePreviewRetake for cancel from preview
          uploading={false} // This will be true when flowState is 'uploading',
                            // but CameraPreview isn't rendered then. This prop might be redundant here.
        />
      );
    case 'uploading':
      return (
        <SafeAreaView style={styles.containerCentered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.statusText}>Uploading: {uploadProgress.toFixed(0)}%</Text>
        </SafeAreaView>
      );
    case 'error':
      return (
        <SafeAreaView style={styles.containerCentered}>
          <Text style={styles.errorTextTitle}>Upload Failed</Text>
          <Text style={styles.errorText}>{errorMessage || 'An unknown error occurred.'}</Text>
          <TouchableOpacity style={styles.button} onPress={handlePreviewRetake}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    default:
      // Fallback or initial loading state if needed
      return (
        <SafeAreaView style={styles.containerCentered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </SafeAreaView>
      );
  }
}

const styles = StyleSheet.create({
  containerCentered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background, // Assuming COLORS.background exists
    padding: 20,
  },
  statusText: {
    marginTop: 20,
    fontSize: 16,
    color: COLORS.text,
    fontFamily: globalStyles.bodyText.fontFamily,
  },
  errorTextTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.error, // Assuming COLORS.error exists
    marginBottom: 10,
    fontFamily: globalStyles.title.fontFamily,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: globalStyles.bodyText.fontFamily,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 10,
    width: '80%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.secondary, // Assuming COLORS.secondary for cancel
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: globalStyles.primaryButtonText.fontFamily,
  },
});
