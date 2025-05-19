/**
 * PhotoPreviewScreen
 * 
 * Displays a preview of the captured photo with options to use or retake.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { usePairing } from '../../context/PairingContext';
import { useAuth } from '../../context/AuthContext';
import AntDesign from "@expo/vector-icons/AntDesign";

interface PhotoPreviewRouteParams {
  photoUri: string;
  pairingId: string;
}

export default function PhotoPreviewScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { photoUri, pairingId } = route.params as PhotoPreviewRouteParams;
  
  const { user } = useAuth();
  const { submitPhoto, pairingStatus, pairingError, clearPairingError } = usePairing();
  
  const [submitting, setSubmitting] = useState(false);
  
  // Handle using the current photo
  const handleUsePhoto = async () => {
    if (!user?.id || !photoUri || !pairingId) {
      Alert.alert('Error', 'Missing required information to submit photo.');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Call submitPhoto from PairingContext
      await submitPhoto({
        pairingId,
        userId: user.id,
        photoURL: photoUri,
      });
      
      // If successful, navigate back to the pairing screen
      if (pairingStatus !== 'error') {
        // Navigate to the appropriate screen (could be CurrentPairingScreen)
        navigation.navigate('Main', { screen: 'TabNavigator' });
      } else {
        // Show error
        Alert.alert('Error', pairingError || 'Failed to submit photo.');
        clearPairingError();
      }
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
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={submitting}
        >
          <AntDesign name="arrowleft" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photo Preview</Text>
        <View style={styles.placeholder} />
      </View>
      
      <View style={styles.previewContainer}>
        <Image
          source={{ uri: photoUri }}
          style={styles.previewImage}
          resizeMode="contain"
        />
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.retakeButton]}
          onPress={handleRetake}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>Retake</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.useButton]}
          onPress={handleUsePhoto}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Use Photo</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  previewContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retakeButton: {
    backgroundColor: '#333',
    marginRight: 8,
  },
  useButton: {
    backgroundColor: '#006E51', // Stanford green
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 