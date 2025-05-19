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
import { COLORS, FONTS, BORDER_RADIUS, SHADOWS } from '../../config/theme'; 
import { globalStyles } from '../../styles/globalStyles';
import CameraCapture from '../../components/camera/Camera';
import CameraPreview from '../../components/camera/CameraPreview';
import { uploadImage } from '../../services/storageService';
import { CaptureResult } from '../../hooks/useCamera';
import { MainStackParamList } from '../../types/navigation'; 

// Define screen states
type CameraFlowState = 'capturing' | 'previewing' | 'uploading' | 'error';

// REVISED: Define navigation params based on MainStackParamList
type CameraScreenRouteProp = RouteProp<MainStackParamList, 'Camera'>;

export default function CameraScreen() {
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>(); 
  const route = useRoute<CameraScreenRouteProp>();
  
  const { pairingId, userId: routeUserId, submissionType } = route.params || {};

  const { user: authUser } = useAuth(); 
  const currentUserId = routeUserId || authUser?.id;

  const [flowState, setFlowState] = useState<CameraFlowState>('capturing');
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (submissionType === 'pairing' && (!pairingId || !currentUserId)) {
      Alert.alert(
        'Error',
        'Pairing ID or User ID is missing. Cannot proceed with pairing photo submission.'
      );
      setErrorMessage('Required information for pairing photo is missing.');
      setFlowState('error');
    }
  }, [route.params, pairingId, currentUserId, submissionType, navigation]);

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
    if (!currentUserId) {
      Alert.alert('Error', 'User not identified. Cannot upload photo.');
      setFlowState('capturing');
      return;
    }

    if (submissionType === 'pairing') {
      if (!pairingId) {
        Alert.alert('Error', 'Pairing information missing. Cannot upload photo for pairing.');
        setFlowState('capturing');
        return;
      }
      setFlowState('uploading');
      setUploadProgress(0);
      setErrorMessage(null);

      try {
        console.log('Uploading image to Firebase Storage...');
        const downloadURL = await uploadImage(imageUri, currentUserId, (progress) => {
          setUploadProgress(progress);
        });
        console.log('Image uploaded successfully:', downloadURL);
        await firebaseService.updatePairingWithPhoto(pairingId, currentUserId, downloadURL, isPrivate);
        
        Alert.alert('Success', 'Photo uploaded and pairing updated!');
        navigation.navigate('TabNavigator', { 
          screen: 'Feed', 
          params: { scrollToPairingId: pairingId, refresh: true } 
        });

      } catch (error: any) {
        console.error('Pairing photo upload or Firestore update failed:', error);
        setErrorMessage(error.message || 'Failed to upload photo or update pairing.');
        setFlowState('error');
      }
    } else {
      Alert.alert('Info', 'Submission type not fully handled yet.');
      setFlowState('capturing');
    }
  };

  const handlePreviewRetake = () => {
    setCapturedImageUri(null);
    setFlowState('capturing');
    setErrorMessage(null);
  };

  const handleCancel = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  if (!currentUserId && flowState !== 'error') { 
    return (
      <SafeAreaView style={styles.containerCentered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.statusText}>Loading user information...</Text>
      </SafeAreaView>
    );
  }

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
        setFlowState('capturing'); 
        return null;
      }
      return (
        <CameraPreview
          imageUri={capturedImageUri}
          onSubmit={handlePreviewSubmit}
          onRetake={handlePreviewRetake}
          onCancel={handleCancel}
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
          <Text style={styles.errorTextTitle}>Operation Failed</Text>
          <Text style={styles.errorText}>{errorMessage || 'An unknown error occurred.'}</Text>
          {capturedImageUri && submissionType === 'pairing' && (
            <TouchableOpacity style={styles.button} onPress={handlePreviewRetake}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          )}
          {!capturedImageUri && submissionType === 'pairing' && (
             <TouchableOpacity style={styles.button} onPress={() => setFlowState('capturing')}>
               <Text style={styles.buttonText}>Retry Capture</Text>
             </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    default:
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
    backgroundColor: COLORS.background, 
    padding: 20,
  },
  statusText: {
    marginTop: 20,
    fontSize: 16,
    color: COLORS.text, // Use theme color
    fontFamily: FONTS.regular, // Use theme font
  },
  errorTextTitle: {
    fontSize: 20,
    // fontWeight: 'bold', // Handled by font family if available
    color: COLORS.error, 
    marginBottom: 10,
    fontFamily: FONTS.bold, // Use theme font
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary, // Use theme color
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: FONTS.regular, // Use theme font
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: BORDER_RADIUS.md, // Use theme border radius
    marginTop: 10,
    width: '80%',
    alignItems: 'center',
    ...SHADOWS.small, // Added shadow for buttons
  },
  cancelButton: {
    backgroundColor: COLORS.borderDark, // Assuming borderDark is a suitable dark gray
  },
  buttonText: {
    color: COLORS.background, // Text on primary button (white) should be dark
    fontSize: 16,
    fontFamily: FONTS.bold, // Use theme font
  },
});
