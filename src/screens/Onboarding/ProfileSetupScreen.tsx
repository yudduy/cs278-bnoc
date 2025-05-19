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
  Image,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/theme';
import { onboardingStyles } from './OnboardingStyles';

const ProfileSetupScreen: React.FC = () => {
  const navigation = useNavigation();
  
  // State for profile fields
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  // Track input focus for styling
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  
  const handleDisplayNameChange = (text: string) => {
    setDisplayName(text);
  };
  
  const handleUsernameChange = (text: string) => {
    // Remove spaces and special characters
    setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''));
  };
  
  const handleImageSelect = () => {
    // In a real app, would open image picker
    // For demo, just use a random image
    setProfileImage(`https://picsum.photos/200/200?random=${Math.random()}`);
  };
  
  const handleNext = () => {
    // Validate inputs
    if (!displayName.trim()) {
      alert('Please enter your display name');
      return;
    }
    
    if (!username.trim()) {
      alert('Please enter a username');
      return;
    }
    
    // @ts-ignore - Navigation typing
    navigation.navigate('Completion');
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
                onPress={handleImageSelect}
              >
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={onboardingStyles.profileImage}
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
              <TouchableOpacity
                style={[
                  onboardingStyles.primaryButton,
                  (!displayName.trim() || !username.trim()) && onboardingStyles.disabledButton
                ]}
                onPress={handleNext}
                disabled={!displayName.trim() || !username.trim()}
              >
                <Text style={onboardingStyles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={{ alignItems: 'center', marginTop: 8 }}
                onPress={handleBack}
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