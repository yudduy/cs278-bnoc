/**
 * AuthScreen - Combined Authentication
 * 
 * Combined authentication screen with Stanford email validation.
 * Adapted for black and white theme.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, BORDER_RADIUS } from '../../config/theme';
import { globalStyles } from '../../styles/globalStyles';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import * as authService from '../../services/authService';

// Form validation types
type FormMode = 'signIn' | 'signUp';
type FormErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  username?: string;
};

const AuthScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState<FormMode>('signIn');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Authentication context
  const { signIn, signUp, error, isLoading, clearError } = useAuth();
  
  // Toast notifications
  const { showError, showSuccess } = useToast();
  
  // Clear form errors when switching modes
  useEffect(() => {
    setErrors({});
    clearError();
    // Clear fields when switching modes
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    setIsUsernameAvailable(null);
  }, [mode, clearError]);
  
  /**
   * Validate Stanford email
   */
  const isStanfordEmail = (email: string): boolean => {
    return email.toLowerCase().endsWith('@stanford.edu');
  };
  
  /**
   * Check username availability using authService
   */
  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    if (username.length < 3) {
      return false;
    }
    
    setIsCheckingUsername(true);
    
    try {
      const isAvailable = await authService.isUsernameAvailable(username);
      setIsUsernameAvailable(isAvailable);
      return isAvailable;
    } catch (error) {
      console.error('Error checking username:', error);
      showError('Unable to check username availability. Please try again.');
      setIsUsernameAvailable(null);
      return false;
    } finally {
      setIsCheckingUsername(false);
    }
  };
  
  /**
   * Handle username change with availability check
   */
  const handleUsernameChange = (text: string) => {
    setUsername(text);
    setIsUsernameAvailable(null);
    
    // Only check availability if username is at least 3 characters
    if (text.length >= 3) {
      checkUsernameAvailability(text);
    }
  };
  
  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    const formErrors: FormErrors = {};
    
    // Email validation
    if (!email.trim()) {
      formErrors.email = 'Email is required';
    } else if (!isStanfordEmail(email)) {
      formErrors.email = 'Must use a Stanford email (@stanford.edu)';
    }
    
    // Password validation
    if (!password) {
      formErrors.password = 'Password is required';
    } else if (password.length < 6) {
      formErrors.password = 'Password must be at least 6 characters';
    }
    
    // Sign up specific validations
    if (mode === 'signUp') {
      if (password !== confirmPassword) {
        formErrors.confirmPassword = 'Passwords do not match';
      }
      
      if (!username.trim()) {
        formErrors.username = 'Username is required';
      } else if (username.length < 3) {
        formErrors.username = 'Username must be at least 3 characters';
      } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        formErrors.username = 'Username can only contain letters, numbers, and underscores';
      } else if (isUsernameAvailable === false) {
        formErrors.username = 'Username is already taken';
      }
    }
    
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };
  
  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      if (mode === 'signIn') {
        await signIn(email.toLowerCase().trim(), password);
        showSuccess('Welcome back!');
      } else {
        // One final username availability check
        const isAvailable = await checkUsernameAvailability(username);
        if (!isAvailable) {
          setErrors(prev => ({
            ...prev,
            username: 'Username is already taken'
          }));
          showError('Username is already taken. Please choose a different one.');
          return;
        }
        
        await signUp(email.toLowerCase().trim(), password, username);
        showSuccess('Account created successfully! Welcome to BNOC!');
        // Note: Navigation to onboarding will be handled by the auth context
        // and the main App.tsx component will redirect new users to onboarding
      }
    } catch (error: any) {
      // Show toast notification for auth errors
      const errorMessage = error?.message || 'An unexpected error occurred. Please try again.';
      showError(errorMessage);
      console.error('Authentication error:', error);
    }
  };
  
  /**
   * Toggle between sign in and sign up modes
   */
  const toggleMode = () => {
    setMode(prev => prev === 'signIn' ? 'signUp' : 'signIn');
  };
  
  /**
   * Navigate to forgot password
   */
  const navigateToForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };
  
  /**
   * Render username availability indicator
   */
  const renderUsernameAvailability = () => {
    if (username.length < 3) {
      return null;
    }
    
    if (isCheckingUsername) {
      return (
        <ActivityIndicator size="small" color={COLORS.textSecondary} style={styles.availabilityIndicator} />
      );
    }
    
    if (isUsernameAvailable === true) {
      return (
        <View style={styles.availabilityContainer}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
          <Text style={[styles.availabilityText, { color: COLORS.primary }]}>Available</Text>
        </View>
      );
    }
    
    if (isUsernameAvailable === false) {
      return (
        <View style={styles.availabilityContainer}>
          <Ionicons name="close-circle" size={20} color={COLORS.error} />
          <Text style={[styles.availabilityText, { color: COLORS.error }]}>Taken</Text>
        </View>
      );
    }
    
    return null;
  };
  
  return (
    <SafeAreaView style={globalStyles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo and Title */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>BNOC</Text>
            <Text style={styles.subtitle}>Daily Meetup Selfies</Text>
          </View>
          
          {/* Form Container */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              {mode === 'signIn' ? 'Sign In to Your Account' : 'Create a New Account'}
            </Text>
            
            {/* Error Message from Auth Context */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={COLORS.primary} />
                <Text style={styles.authErrorText}>{error}</Text>
              </View>
            )}
            
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Stanford Email</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.email ? styles.inputError : null
                ]}
                placeholder="netid@stanford.edu"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) {
                    setErrors(prev => ({ ...prev, email: undefined }));
                  }
                }}
                editable={!isLoading}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>
            
            {/* Username Input - Only for Sign Up */}
            {mode === 'signUp' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <View style={styles.usernameContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.usernameInput,
                      errors.username ? styles.inputError : null
                    ]}
                    placeholder="Choose a username (min 3 characters)"
                    placeholderTextColor={COLORS.textSecondary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={username}
                    onChangeText={handleUsernameChange}
                    editable={!isLoading}
                  />
                  {renderUsernameAvailability()}
                </View>
                {errors.username ? (
                  <Text style={styles.errorText}>{errors.username}</Text>
                ) : (
                  <Text style={styles.helperText}>
                    Username can contain letters, numbers, and underscores
                  </Text>
                )}
              </View>
            )}
            
            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    errors.password ? styles.inputError : null
                  ]}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.textSecondary}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors(prev => ({ ...prev, password: undefined }));
                    }
                  }}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>
            
            {/* Confirm Password Input - Only for Sign Up */}
            {mode === 'signUp' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.confirmPassword ? styles.inputError : null
                  ]}
                  placeholder="Confirm your password"
                  placeholderTextColor={COLORS.textSecondary}
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) {
                      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                    }
                  }}
                  editable={!isLoading}
                />
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>
            )}
            
            {/* Forgot Password Link - Only for Sign In */}
            {mode === 'signIn' && (
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={navigateToForgotPassword}
                disabled={isLoading}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}
            
            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === 'signIn' ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>
            
            {/* Toggle Mode Link */}
            <TouchableOpacity
              style={styles.toggleContainer}
              onPress={toggleMode}
              disabled={isLoading}
            >
              <Text style={styles.toggleText}>
                {mode === 'signIn'
                  ? 'Don\'t have an account? Sign Up'
                  : 'Already have an account? Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 48,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 36,
    color: COLORS.primary,
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  formContainer: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: 24,
    marginBottom: 24,
  },
  formTitle: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  authErrorText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 8,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputError: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 4,
  },
  helperText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernameInput: {
    flex: 1,
    marginRight: 8,
  },
  availabilityIndicator: {
    marginLeft: 8,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  availabilityText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    marginLeft: 4,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingRight: 56,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.background,
  },
  toggleContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  toggleText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});

export default AuthScreen;