/**
 * ProfileSetupScreen
 * 
 * Allows users to set up their profile during onboarding.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/colors';
import { globalStyles } from '../../styles/globalStyles';

const ProfileSetupScreen: React.FC = () => {
  const navigation = useNavigation();
  
  // State for profile fields
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [profileImage, setProfileImage] = useState('https://picsum.photos/200/200?random=user');
  
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
  
  return (
    <SafeAreaView style={globalStyles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile Setup</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>Create Your Profile</Text>
            <Text style={styles.subtitle}>
              Set up your profile so other users can recognize you.
            </Text>
            
            <View style={styles.imageSection}>
              <TouchableOpacity
                style={styles.imageContainer}
                onPress={handleImageSelect}
              >
                <Image
                  source={{ uri: profileImage }}
                  style={styles.profileImage}
                />
                <View style={styles.imageBadge}>
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <Text style={styles.imageHint}>Tap to choose a profile photo</Text>
            </View>
            
            <View style={styles.formSection}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Display Name</Text>
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={handleDisplayNameChange}
                  placeholder="Enter your name"
                  placeholderTextColor={COLORS.textLight}
                  autoCapitalize="words"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={handleUsernameChange}
                  placeholder="Choose a username"
                  placeholderTextColor={COLORS.textLight}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.inputHint}>
                  Only letters, numbers, and underscores. No spaces.
                </Text>
              </View>
            </View>
            
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle-outline" size={24} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>
                You can change your profile information later in the app settings.
              </Text>
            </View>
          </ScrollView>
          
          <TouchableOpacity
            style={[
              styles.nextButton,
              (!displayName.trim() || !username.trim()) && styles.disabledButton
            ]}
            onPress={handleNext}
            disabled={!displayName.trim() || !username.trim()}
          >
            <Text style={styles.nextButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    fontFamily: 'ChivoBold',
    fontSize: 18,
    color: COLORS.text,
  },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  title: {
    fontFamily: 'ChivoBold',
    fontSize: 24,
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.backgroundLight,
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imageBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  imageHint: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  formSection: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    height: 48,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.text,
  },
  inputHint: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  nextButton: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.disabled,
  },
  nextButtonText: {
    fontFamily: 'ChivoBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
});

export default ProfileSetupScreen;