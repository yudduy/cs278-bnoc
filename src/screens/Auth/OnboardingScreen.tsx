/**
 * OnboardingScreen - Updated with Profile Photo Upload
 * 
 * Multi-step onboarding flow for new users with Firebase Auth integration.
 * Includes real profile photo upload to Firebase Storage.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, BORDER_RADIUS } from '../../config/theme';
import { globalStyles } from '../../styles/globalStyles';

const { width } = Dimensions.get('window');

const OnboardingScreen: React.FC = () => {
  const { user, updateUserProfile, uploadProfilePhoto, completeOnboarding } = useAuth();
  const navigation = useNavigation<any>();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // User profile state
  const [displayName, setDisplayName] = useState('');
  const [photoURI, setPhotoURI] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
  // Permissions state
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [notificationsPermission, setNotificationsPermission] = useState<boolean | null>(null);
  
  // UI state
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Onboarding steps
  const steps = [
    'Welcome',       // 0: Welcome screen
    'Permissions',   // 1: Request permissions
    'Profile',       // 2: Set display name and photo (optional)
    'Complete'       // 3: Onboarding complete
  ];
  
  // Request permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        // Check and request camera permission
        const cameraStatus = await Camera.requestCameraPermissionsAsync();
        setCameraPermission(cameraStatus.status === 'granted');
        
        // Check and request notification permission
        const notificationStatus = await Notifications.requestPermissionsAsync();
        setNotificationsPermission(notificationStatus.status === 'granted');
      } catch (error) {
        console.error('Error requesting permissions:', error);
        setCameraPermission(false);
        setNotificationsPermission(false);
      }
    };
    
    requestPermissions();
  }, []);
  
  // Advance to next onboarding step
  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      // Scroll to next step
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: nextStep * width, animated: true });
      }
    }
  };
  
  // Go back to previous step
  const goToPreviousStep = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      
      // Scroll to previous step
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: prevStep * width, animated: true });
      }
    }
  };

  // Handle photo selection
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        setPhotoURI(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        setPhotoURI(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // Show photo selection options
  const showPhotoOptions = () => {
    Alert.alert(
      'Profile Photo',
      'Choose how to add your profile photo',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };
  
  // Request camera permission again if denied
  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(status === 'granted');
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  };
  
  // Request notifications permission again if denied
  const requestNotificationsPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationsPermission(status === 'granted');
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notifications permission:', error);
      return false;
    }
  };
  
  // Complete onboarding
  const handleCompleteOnboarding = async () => {
    if (!user) {
      Alert.alert('Error', 'User not found. Please try again.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      let photoURL = user.photoURL;
      
      // Upload profile photo if selected
      if (photoURI) {
        setIsUploadingPhoto(true);
        try {
          photoURL = await uploadProfilePhoto(photoURI);
          console.log('Profile photo uploaded successfully:', photoURL);
        } catch (photoError) {
          console.error('Profile photo upload failed:', photoError);
          Alert.alert(
            'Photo Upload Failed', 
            'We couldn\'t upload your profile photo, but you can add one later in your profile settings.'
          );
        } finally {
          setIsUploadingPhoto(false);
        }
      }
      
      // Update user profile if display name was provided
      if (displayName.trim()) {
        await updateUserProfile({
          displayName: displayName.trim(),
          ...(photoURL && { photoURL })
        });
      }
      
      // Mark onboarding as complete
      completeOnboarding();
      
      console.log('Onboarding completed successfully');
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsUploadingPhoto(false);
    }
  };

  // Welcome step
  const renderWelcomeStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.welcomeContent}>
        <Text style={styles.heading}>Welcome to BNOC</Text>
        <Text style={styles.subheading}>Let's get you set up</Text>
        
        <View style={styles.welcomeIconContainer}>
          <Ionicons name="people" size={80} color={COLORS.primary} />
        </View>
        
        <Text style={styles.welcomeText}>
          BNOC connects Stanford students for daily meetups, helping you expand your social circle and make meaningful connections.
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={goToNextStep}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Permissions step
  const renderPermissionsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.heading}>App Permissions</Text>
      <Text style={styles.subheading}>We need a few permissions for the best experience</Text>
      
      <View style={styles.permissionsContainer}>
        <View style={styles.permissionItem}>
          <View style={[styles.permissionIcon, cameraPermission ? styles.permissionGranted : null]}>
            <Ionicons 
              name="camera" 
              size={28} 
              color={cameraPermission ? COLORS.background : COLORS.primary} 
            />
          </View>
          
          <View style={styles.permissionContent}>
            <Text style={styles.permissionTitle}>Camera Access</Text>
            <Text style={styles.permissionDesc}>
              Required to capture selfies for your daily meetups
            </Text>
            
            {!cameraPermission && (
              <TouchableOpacity 
                style={styles.permissionButton}
                onPress={requestCameraPermission}
              >
                <Text style={styles.permissionButtonText}>Grant Access</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <View style={styles.permissionDivider} />
        
        <View style={styles.permissionItem}>
          <View style={[styles.permissionIcon, notificationsPermission ? styles.permissionGranted : null]}>
            <Ionicons 
              name="notifications" 
              size={28} 
              color={notificationsPermission ? COLORS.background : COLORS.primary} 
            />
          </View>
          
          <View style={styles.permissionContent}>
            <Text style={styles.permissionTitle}>Notifications</Text>
            <Text style={styles.permissionDesc}>
              To alert you about new pairings and reminders
            </Text>
            
            {!notificationsPermission && (
              <TouchableOpacity 
                style={styles.permissionButton}
                onPress={requestNotificationsPermission}
              >
                <Text style={styles.permissionButtonText}>Grant Access</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      
      <Text style={styles.permissionNote}>
        You can change these permissions later in your device settings.
      </Text>
      
      <View style={styles.navigationButtons}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={goToPreviousStep}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={goToNextStep}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Profile step
  const renderProfileStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.heading}>Your Profile</Text>
      <Text style={styles.subheading}>Add some details about yourself (optional)</Text>
      
      <View style={styles.photoContainer}>
        <TouchableOpacity onPress={showPhotoOptions} style={styles.photoButton}>
          {photoURI ? (
            <Image source={{ uri: photoURI }} style={styles.profilePhoto} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera" size={40} color={COLORS.textSecondary} />
              <Text style={styles.photoText}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>
        
        {photoURI && (
          <TouchableOpacity 
            style={styles.changePhotoButton}
            onPress={showPhotoOptions}
          >
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Display Name (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="How should others see your name?"
          placeholderTextColor={COLORS.textSecondary}
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
        />
        <Text style={styles.inputHelper}>
          Your display name will be shown to your daily pairings. You can change this later.
        </Text>
      </View>
      
      <View style={styles.navigationButtons}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={goToPreviousStep}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={goToNextStep}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Complete step
  const renderCompleteStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.completeContent}>
        <View style={styles.completeIcon}>
          <Ionicons name="checkmark-circle" size={80} color={COLORS.primary} />
        </View>
        
        <Text style={styles.heading}>All Set!</Text>
        <Text style={styles.subheading}>You're ready to start meeting new people</Text>
        
        <View style={styles.completeSummary}>
          <Text style={styles.completeInfoLabel}>Username:</Text>
          <Text style={styles.completeInfoValue}>@{user?.username}</Text>
          
          {displayName && (
            <>
              <Text style={styles.completeInfoLabel}>Display Name:</Text>
              <Text style={styles.completeInfoValue}>{displayName}</Text>
            </>
          )}
          
          {photoURI && (
            <>
              <Text style={styles.completeInfoLabel}>Profile Photo:</Text>
              <Text style={styles.completeInfoValue}>Ready to upload</Text>
            </>
          )}
          
          <Text style={styles.completeInfoLabel}>Permissions:</Text>
          <Text style={styles.completeInfoValue}>
            Camera: {cameraPermission ? 'Granted' : 'Denied'} | 
            Notifications: {notificationsPermission ? 'Granted' : 'Denied'}
          </Text>
        </View>
        
        <Text style={styles.completeText}>
          You'll be paired with other Stanford students for daily meetups. Your first pairing will appear tomorrow!
        </Text>
        
        {isUploadingPhoto && (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.uploadingText}>Uploading profile photo...</Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity 
        style={[styles.button, (isSubmitting || isUploadingPhoto) && styles.disabledButton]}
        onPress={handleCompleteOnboarding}
        disabled={isSubmitting || isUploadingPhoto}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color={COLORS.background} />
        ) : (
          <Text style={styles.buttonText}>Start Using BNOC</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={globalStyles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          {steps.map((_, index) => (
            <View 
              key={index}
              style={[
                styles.progressDot,
                index === currentStep && styles.progressDotActive
              ]}
            />
          ))}
        </View>
        
        {/* Horizontal scroll view for steps */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          style={styles.stepScroll}
        >
          {renderWelcomeStep()}
          {renderPermissionsStep()}
          {renderProfileStep()}
          {renderCompleteStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Progress indicator
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepScroll: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    width: width,
    padding: 24,
    justifyContent: 'space-between',
  },
  heading: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subheading: {
    fontFamily: FONTS.regular,
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.background,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  backButtonText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 8,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  
  // Welcome step styles
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeIconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 32,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  welcomeText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Permissions step styles
  permissionsContainer: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.md,
    marginVertical: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  permissionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  permissionGranted: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 4,
  },
  permissionDesc: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  permissionButton: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  permissionButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: COLORS.primary,
  },
  permissionDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  permissionNote: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  
  // Profile step styles
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputHelper: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  photoContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  photoButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  photoText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  changePhotoButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  changePhotoText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.primary,
  },
  
  // Complete step styles
  completeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeIcon: {
    marginBottom: 24,
  },
  completeSummary: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.md,
    padding: 20,
    width: '100%',
    marginVertical: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  completeInfoLabel: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  completeInfoValue: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 16,
  },
  completeText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  uploadingText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
});

export default OnboardingScreen;
