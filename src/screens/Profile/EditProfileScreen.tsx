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
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../config/colors';
import { globalStyles } from '../../styles/globalStyles';
import { useAuth } from '../../hooks/useAuth';
import { uploadUserProfileImage } from '../../services/storageService';
import firebaseService from '../../services/firebase';

// Default profile image
const DEFAULT_PROFILE_IMAGE = 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fdefault-profile.jpg?alt=media&token=e6e88f85-a09d-45cc-b6a4-cad438d1b2f6';

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
  const [uploadProgress, setUploadProgress] = useState(0);
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
      let photoURL: string | undefined = user?.photoURL || undefined;
      
      if (imageChanged && profileImage && user?.id) {
        try {
          // Reset upload progress
          setUploadProgress(0);
          
          // Upload to Firebase Storage using our enhanced function
          photoURL = await uploadUserProfileImage(
            profileImage,
            user.id,
            (progress) => setUploadProgress(progress)
          );
          
          console.log('Profile image uploaded successfully:', photoURL);
        } catch (error) {
          console.error('Error uploading profile image:', error);
          Alert.alert('Upload Error', 'Failed to upload profile image, but we will save your other profile changes.');
          // Continue with saving other profile information
        }
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
  
  // Show profile image options
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
          onPress: handlePickImage,
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
          <TouchableOpacity onPress={showImageOptions} disabled={loading}>
          <Image
              source={{ uri: profileImage || DEFAULT_PROFILE_IMAGE }}
            style={styles.profileImage}
              contentFit="cover"
              transition={300}
              cachePolicy="memory-disk"
              placeholder={{ uri: profileImage || DEFAULT_PROFILE_IMAGE }}
            />
            
            {/* Upload progress indicator overlay */}
            {loading && imageChanged && (
              <View style={styles.progressOverlay}>
                <Text style={styles.progressText}>{uploadProgress.toFixed(0)}%</Text>
              </View>
            )}
            
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={18} color={COLORS.background} />
            </View>
          </TouchableOpacity>
          
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
              placeholderTextColor={COLORS.textLight}
              maxLength={30}
              editable={!loading}
            />
            {displayNameError && (
              <Text style={styles.errorText}>{displayNameError}</Text>
            )}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username</Text>
              <TextInput
              style={[styles.input, usernameError && styles.inputError]}
                value={username}
                onChangeText={handleUsernameChange}
              placeholder="Your username"
              placeholderTextColor={COLORS.textLight}
                autoCapitalize="none"
                autoCorrect={false}
              maxLength={20}
                editable={!loading}
              />
            {usernameError && (
              <Text style={styles.errorText}>{usernameError}</Text>
            )}
            <Text style={styles.inputHelperText}>
              Letters, numbers, and underscores only
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.border,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  progressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 60,
  },
  progressText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageActions: {
    flexDirection: 'row',
    marginTop: 15,
  },
  imageActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  imageActionText: {
    color: COLORS.text,
    marginLeft: 5,
    fontSize: 14,
  },
  formContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 5,
  },
  inputHelperText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 5,
  },
});

export default EditProfileScreen; 