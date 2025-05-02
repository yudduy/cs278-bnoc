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
  Image,
  Alert,
  FlatList,
  Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../../context/AuthContext';
import firebaseService from '../../services/firebase';
import { COLORS } from '../../config/theme';
import { globalStyles } from '../../styles/globalStyles';

const OnboardingScreen = ({ navigation }) => {
  const { user, firebaseUser } = useAuth();
  const scrollViewRef = useRef(null);
  
  // User profile state
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [photoURI, setPhotoURI] = useState(null);
  
  // Permissions state
  const [cameraPermission, setCameraPermission] = useState(null);
  const [notificationsPermission, setNotificationsPermission] = useState(null);
  
  // UI state
  const [currentStep, setCurrentStep] = useState(0);
  const [usernameError, setUsernameError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Onboarding steps
  const steps = [
    'Welcome',       // 0: Welcome screen
    'Permissions',   // 1: Request permissions
    'Username',      // 2: Set username
    'Profile',       // 3: Set display name and photo (optional)
    'Complete'       // 4: Onboarding complete
  ];
  
  // Request permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
      // Check and request camera permission
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(cameraStatus.status === 'granted');
      
      // Check and request notification permission
      const notificationStatus = await Notifications.requestPermissionsAsync();
      setNotificationsPermission(notificationStatus.status === 'granted');
    };
    
    requestPermissions();
  }, []);

  // Check if username exists as user types (with debounce)
  useEffect(() => {
    if (!username || username.length < 3) return;
    
    const timer = setTimeout(async () => {
      setIsChecking(true);
      try {
        const isAvailable = await firebaseService.isUsernameAvailable(username);
        setUsernameError(isAvailable ? '' : 'Username already taken');
      } catch (error) {
        console.error('Error checking username:', error);
      }
      setIsChecking(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [username]);
  
  // Advance to next onboarding step
  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      // Scroll to next step
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: nextStep * Dimensions.get('window').width, animated: true });
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
        scrollViewRef.current.scrollTo({ x: prevStep * Dimensions.get('window').width, animated: true });
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
      
      if (!result.canceled) {
        setPhotoURI(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };
  
  // Handle username submission
  const validateUsername = () => {
    if (!username || username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }
    
    if (usernameError) {
      return false;
    }
    
    return true;
  };
  
  // Request camera permission again if denied
  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setCameraPermission(status === 'granted');
    return status === 'granted';
  };
  
  // Request notifications permission again if denied
  const requestNotificationsPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setNotificationsPermission(status === 'granted');
    return status === 'granted';
  };
  
  // Complete onboarding and save user data
  const completeOnboarding = async () => {
    if (!validateUsername()) {
      // Go back to username step if validation fails
      setCurrentStep(2);
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: 2 * Dimensions.get('window').width, animated: true });
      }
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First, update username
      await firebaseService.updateUsername(firebaseUser.uid, username);
      
      // Then update display name if provided
      if (displayName.trim()) {
        await firebaseService.updateUser({
          ...user,
          displayName: displayName.trim()
        });
      }
      
      // Upload profile photo if selected (not implementing in this phase)
      // In a real implementation, we would upload the photo to Firebase Storage
      // and update the user's photoURL
      
      // Register for push notifications
      if (notificationsPermission) {
        try {
          const token = await Notifications.getExpoPushTokenAsync();
          await firebaseService.registerDeviceForNotifications(firebaseUser.uid, token.data);
        } catch (error) {
          console.error('Error registering for notifications:', error);
          // Non-critical error, continue with onboarding
        }
      }
      
      // Mark user as active
      await firebaseService.updateUserActivity(firebaseUser.uid);
      
      // Navigate to main app
      navigation.replace('Main');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Welcome step
  const renderWelcomeStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.welcomeContent}>
        <Text style={styles.heading}>Welcome to Daily Meetup</Text>
        <Text style={styles.subheading}>Let's set up your profile</Text>
        
        <View style={styles.welcomeImageContainer}>
          <Ionicons name="people" size={80} color={COLORS.primary} />
        </View>
        
        <Text style={styles.welcomeText}>
          Daily Meetup connects Stanford students for daily in-person or virtual meetups, 
          helping you expand your social circle and make meaningful connections.
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
      <Text style={styles.subheading}>We need a few permissions to provide the best experience</Text>
      
      <View style={styles.permissionsContainer}>
        <View style={styles.permissionItem}>
          <View style={[styles.permissionIcon, cameraPermission ? styles.permissionGranted : null]}>
            <Ionicons 
              name="camera" 
              size={28} 
              color={cameraPermission ? COLORS.background : COLORS.text} 
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
              color={notificationsPermission ? COLORS.background : COLORS.text} 
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
  
  // Username step
  const renderUsernameStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.heading}>Choose a Username</Text>
      <Text style={styles.subheading}>This is how other users will find you</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={COLORS.textSecondary}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isChecking && <ActivityIndicator size="small" color={COLORS.primary} />}
      </View>
      
      {usernameError ? (
        <Text style={styles.errorText}>{usernameError}</Text>
      ) : (
        username.length >= 3 && !isChecking && (
          <Text style={styles.successText}>Username available!</Text>
        )
      )}
      
      <Text style={styles.inputHelper}>
        Choose a username with at least 3 characters. This cannot be changed later.
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
          style={[
            styles.button,
            (!username || username.length < 3 || isChecking || usernameError) && styles.buttonDisabled
          ]}
          onPress={() => {
            if (validateUsername()) {
              goToNextStep();
            }
          }}
          disabled={!username || username.length < 3 || isChecking || !!usernameError}
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
        <TouchableOpacity onPress={pickImage} style={styles.photoButton}>
          {photoURI ? (
            <Image source={{ uri: photoURI }} style={styles.profilePhoto} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="person" size={40} color={COLORS.textSecondary} />
              <Text style={styles.photoText}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      <Text style={styles.inputLabel}>Display Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Your Name (optional)"
        placeholderTextColor={COLORS.textSecondary}
        value={displayName}
        onChangeText={setDisplayName}
        autoCapitalize="words"
      />
      
      <Text style={styles.inputHelper}>
        Your display name will be shown to your daily pairings. You can change this later.
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
          <Text style={styles.completeInfoValue}>@{username}</Text>
          
          {displayName && (
            <>
              <Text style={styles.completeInfoLabel}>Display Name:</Text>
              <Text style={styles.completeInfoValue}>{displayName}</Text>
            </>
          )}
          
          <Text style={styles.completeInfoLabel}>Permissions:</Text>
          <Text style={styles.completeInfoValue}>
            Camera: {cameraPermission ? 'Granted' : 'Denied'} | 
            Notifications: {notificationsPermission ? 'Granted' : 'Denied'}
          </Text>
        </View>
        
        <Text style={styles.completeText}>
          Tomorrow, you'll be paired with another Stanford student for your first meetup!
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={completeOnboarding}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color={COLORS.background} />
        ) : (
          <Text style={styles.buttonText}>Start Using App</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={globalStyles.container}
    >
      <StatusBar style="light" />
      
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
        {renderUsernameStep()}
        {renderProfileStep()}
        {renderCompleteStep()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  // Common styles
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.card,
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
    width: Dimensions.get('window').width,
    padding: 24,
    justifyContent: 'space-between',
  },
  heading: {
    fontFamily: 'ChivoBold',
    fontSize: 28,
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subheading: {
    fontFamily: 'ChivoRegular',
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.primary,
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  buttonDisabled: {
    backgroundColor: COLORS.secondary,
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: COLORS.background,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  backButtonText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 4,
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
  welcomeImageContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(177, 170, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 32,
  },
  welcomeText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Permissions step styles
  permissionsContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginVertical: 24,
    padding: 16,
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
    backgroundColor: COLORS.cardActive,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  permissionGranted: {
    backgroundColor: COLORS.primary,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 4,
  },
  permissionDesc: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  permissionButton: {
    backgroundColor: COLORS.cardActive,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  permissionButtonText: {
    fontFamily: 'ChivoRegular',
    fontSize: 12,
    color: COLORS.primary,
  },
  permissionDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  permissionNote: {
    fontFamily: 'ChivoRegular',
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  
  // Username step styles
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    height: 54,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.text,
    marginRight: 8,
  },
  inputHelper: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  errorText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.error,
    marginBottom: 8,
  },
  successText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: '#7CFC00',
    marginBottom: 8,
  },
  
  // Profile step styles
  inputLabel: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 16,
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
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
  },
  photoText: {
    fontFamily: 'ChivoRegular',
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
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
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginVertical: 24,
  },
  completeInfoLabel: {
    fontFamily: 'ChivoBold',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  completeInfoValue: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 16,
  },
  completeText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default OnboardingScreen;