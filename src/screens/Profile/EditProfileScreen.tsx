/**
 * EditProfileScreen
 * 
 * Allows users to edit their profile information including:
 * - Display name
 * - Username
 * - Profile picture
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../config/colors';
import { globalStyles } from '../../styles/globalStyles';
import { useAuth } from '../../hooks/useAuth';
import firebaseService from '../../services/firebase';

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const { user, updateUserProfile } = useAuth();
  
  // Form state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [profileImage, setProfileImage] = useState<string | null>(user?.photoURL || null);
  const [imageChanged, setImageChanged] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  
  // Handle username input
  const handleUsernameChange = (text: string) => {
    // Remove spaces and special characters except underscores
    const formattedUsername = text.toLowerCase().replace(/[^a-z0-9_]/gi, '');
    setUsername(formattedUsername);
    
    // Validate username
    if (formattedUsername.length > 0 && formattedUsername.length < 3) {
      setUsernameError('Username must be at least 3 characters');
    } else if (formattedUsername.length > 20) {
      setUsernameError('Username must be less than 20 characters');
    } else {
      setUsernameError(null);
    }
  };
  
  // Handle display name input
  const handleDisplayNameChange = (text: string) => {
    setDisplayName(text);
    
    // Validate display name
    if (text.length > 0 && text.length < 2) {
      setDisplayNameError('Display name must be at least 2 characters');
    } else if (text.length > 30) {
      setDisplayNameError('Display name must be less than 30 characters');
    } else {
      setDisplayNameError(null);
    }
  };
  
  // Pick image from gallery
  const handlePickImage = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow access to your photo library to change your profile picture.');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
        setImageChanged(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  
  // Take photo with camera
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
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
        setImageChanged(true);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };
  
  // Handle saving profile
  const handleSaveProfile = async () => {
    // Validate inputs
    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }
    
    if (displayName.length < 2) {
      setDisplayNameError('Display name must be at least 2 characters');
      return;
    }
    
    try {
      setLoading(true);
      
             // Check if username is available (skip if unchanged)
       if (username !== user?.username) {
         // In a production app, this would check if the username is available
         // For demo, we'll assume it's available
         const isUsernameAvailable = true;
         
         if (!isUsernameAvailable) {
           setUsernameError('Username is already taken');
           setLoading(false);
           return;
         }
       }
      
      // Upload new profile image if changed
      let photoURL = user?.photoURL;
      
      if (imageChanged && profileImage) {
        // In production, this would upload to Firebase Storage
        // For demo, we'll just use the local URI
        photoURL = profileImage;
      }
      
      // Update user profile
      await updateUserProfile({
        displayName,
        username,
        photoURL,
      });
      
      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={handleSaveProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.profileImageContainer}>
          <Image
            source={profileImage ? { uri: profileImage } : { uri: 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fmb.jpeg?alt=media&token=e6e88f85-a09d-45cc-b6a4-cad438d1b2f6' }}
            style={styles.profileImage}
          />
          
          <View style={styles.imageActions}>
            <TouchableOpacity
              style={styles.imageActionButton}
              onPress={handlePickImage}
              disabled={loading}
            >
              <Ionicons name="images" size={20} color={COLORS.primary} />
              <Text style={styles.imageActionText}>Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.imageActionButton}
              onPress={handleTakePhoto}
              disabled={loading}
            >
              <Ionicons name="camera" size={20} color={COLORS.primary} />
              <Text style={styles.imageActionText}>Camera</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Display Name</Text>
            <TextInput
              style={[styles.input, displayNameError && styles.inputError]}
              value={displayName}
              onChangeText={handleDisplayNameChange}
                            placeholder="Your display name"
               placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="words"
              editable={!loading}
            />
            {displayNameError && (
              <Text style={styles.errorText}>{displayNameError}</Text>
            )}
            <Text style={styles.inputHelper}>This is your public name visible to others</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username</Text>
            <View style={styles.usernameInputContainer}>
              <Text style={styles.atSymbol}>@</Text>
              <TextInput
                style={[
                  styles.usernameInput,
                  usernameError && styles.inputError
                ]}
                value={username}
                onChangeText={handleUsernameChange}
                                placeholder="username"
                 placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
            {usernameError && (
              <Text style={styles.errorText}>{usernameError}</Text>
            )}
            <Text style={styles.inputHelper}>
              Only letters, numbers, and underscores. 3-20 characters.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  imageActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imageActionText: {
    marginLeft: 4,
    color: COLORS.primary,
    fontWeight: '500',
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    height: 48,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  usernameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
  },
  atSymbol: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  usernameInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: COLORS.text,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
  },
  inputHelper: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});

export default EditProfileScreen; 