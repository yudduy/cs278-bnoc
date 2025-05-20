/**
 * ProfileSetupScreen
 * 
 * Allows users to set up their profile during onboarding.
 * Updated with black and white theme.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../config/theme';
import { onboardingStyles } from './OnboardingStyles';
import { uploadUserProfileImage } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';

// Default profile image URL
const DEFAULT_PROFILE_IMAGE = 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fdefault-profile.jpg?alt=media&token=e6e88f85-a09d-45cc-b6a4-cad438d1b2f6';

const ProfileSetupScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  
  // State for profile fields
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Track input focus for styling
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  
  const handleDisplayNameChange = (text: string) => {
    setDisplayName(text);
  };
  
  const handleUsernameChange = (text: string) => {
    // Remove spaces and special characters
    setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''));
  };
  
  const handleImageSelect = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow access to your photo library to select a profile picture.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      // Check if selection was successful
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  
  const handleTakePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow access to your camera to take a profile picture.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      // Check if photo was taken
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };
  
  const handleNext = async () => {
    // Validate inputs
    if (!displayName.trim()) {
      Alert.alert('Missing Display Name', 'Please enter your display name');
      return;
    }
    
    if (!username.trim()) {
      Alert.alert('Missing Username', 'Please enter a username');
      return;
    }
    
    if (!profileImage) {
      Alert.alert('Missing Profile Picture', 'Please select a profile picture');
      return;
    }
    
    // Upload profile image if user is authenticated
    if (user?.id && profileImage) {
      try {
        setIsUploading(true);
        
        // Upload profile image to Firebase Storage
        const downloadURL = await uploadUserProfileImage(
          profileImage,
          user.id,
          (progress) => console.log(`Upload progress: ${progress}%`)
        );
        
        // Store the profile data in context or temporary storage for completion
        // In a real implementation, this would save to Firestore and update the AuthContext
        console.log('Profile image uploaded:', downloadURL);
        
        // Navigate to completion screen
        navigation.navigate('Completion' as never);
      } catch (error) {
        console.error('Error uploading profile image:', error);
        Alert.alert('Upload Error', 'Failed to upload profile image. Please try again.');
      } finally {
        setIsUploading(false);
      }
    } else {
      // For development/testing purposes when user might not be authenticated yet
      console.log('No user ID available. In production, would require authentication.');
      navigation.navigate('Completion' as never);
    }
  };
  
  const handleBack = () => {
    navigation.goBack();
  };
  
  const handleInputFocus = (inputName: string) => {
    setFocusedInput(inputName);
  };
  
  const handleInputBlur = () => {
    setFocusedInput(null);
  };
  
  // Show options for profile image selection
  const showImageOptions = () => {
    Alert.alert(
      'Profile Picture',
      'Choose a profile picture',
      [
        {
          text: 'Take Photo',
          onPress: handleTakePhoto,
        },
        {
          text: 'Choose from Library',
          onPress: handleImageSelect,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };
  
  return (
    <SafeAreaView style={onboardingStyles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={onboardingStyles.container}>
          {/* Header with back button */}
          <View style={onboardingStyles.header}>
            <TouchableOpacity
              style={onboardingStyles.backButton}
              onPress={handleBack}
              disabled={isUploading}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={onboardingStyles.headerTitle}>Create Profile</Text>
            <View style={{ width: 40 }} />
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Progress indicator */}
            <View style={onboardingStyles.progressContainer}>
              <View style={onboardingStyles.progressDot} />
              <View style={onboardingStyles.progressDot} />
              <View style={[onboardingStyles.progressDot, onboardingStyles.progressDotActive]} />
              <View style={onboardingStyles.progressDot} />
            </View>
            
            {/* Profile image section */}
            <View style={onboardingStyles.imageSection}>
              <TouchableOpacity
                style={onboardingStyles.imageContainer}
                onPress={showImageOptions}
                disabled={isUploading}
              >
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={onboardingStyles.profileImage}
                    contentFit="cover"
                    transition={300}
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <View style={[onboardingStyles.profileImage, { alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="person-outline" size={40} color={COLORS.textSecondary} />
                  </View>
                )}
                <View style={onboardingStyles.imageBadge}>
                  <Ionicons name="camera-outline" size={20} color={COLORS.primary} />
                </View>
              </TouchableOpacity>
              <Text style={onboardingStyles.imageHint}>Tap to choose a profile photo</Text>
            </View>
            
            {/* Form fields */}
            <View style={{ marginBottom: 32 }}>
              {/* Display Name Input */}
              <View style={onboardingStyles.inputContainer}>
                <Text style={onboardingStyles.inputLabel}>Display Name</Text>
                <TextInput
                  style={[
                    onboardingStyles.input,
                    focusedInput === 'displayName' && onboardingStyles.inputFocused
                  ]}
                  value={displayName}
                  onChangeText={handleDisplayNameChange}
                  placeholder="Your name"
                  placeholderTextColor={COLORS.textSecondary}
                  autoCapitalize="words"
                  onFocus={() => handleInputFocus('displayName')}
                  onBlur={handleInputBlur}
                  selectionColor={COLORS.primary}
                  editable={!isUploading}
                />
              </View>
              
              {/* Username Input */}
              <View style={onboardingStyles.inputContainer}>
                <Text style={onboardingStyles.inputLabel}>Username</Text>
                <TextInput
                  style={[
                    onboardingStyles.input,
                    focusedInput === 'username' && onboardingStyles.inputFocused
                  ]}
                  value={username}
                  onChangeText={handleUsernameChange}
                  placeholder="Choose a unique username"
                  placeholderTextColor={COLORS.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => handleInputFocus('username')}
                  onBlur={handleInputBlur}
                  selectionColor={COLORS.primary}
                  editable={!isUploading}
                />
                <Text style={onboardingStyles.inputHint}>
                  Letters, numbers, and underscores only. No spaces.
                </Text>
              </View>
            </View>
            
            {/* Info message */}
            <View style={onboardingStyles.infoContainer}>
              <Ionicons name="information-circle-outline" size={24} color={COLORS.textSecondary} />
              <Text style={onboardingStyles.infoText}>
                You can change your profile information later in settings.
              </Text>
            </View>
            
            {/* Navigation buttons */}
            <View style={{ marginTop: 32, marginBottom: 24 }}>
              {isUploading ? (
                <View style={[onboardingStyles.primaryButton, { justifyContent: 'center' }]}>
                  <ActivityIndicator size="small" color={COLORS.background} />
                </View>
              ) : (
              <TouchableOpacity
                style={[
                  onboardingStyles.primaryButton,
                    (!displayName.trim() || !username.trim() || !profileImage) && onboardingStyles.disabledButton
                ]}
                onPress={handleNext}
                  disabled={!displayName.trim() || !username.trim() || !profileImage || isUploading}
              >
                <Text style={onboardingStyles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={{ alignItems: 'center', marginTop: 8 }}
                onPress={handleBack}
                disabled={isUploading}
              >
                <Text style={{ color: COLORS.textSecondary, fontFamily: 'ChivoRegular' }}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ProfileSetupScreen;