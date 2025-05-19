/**
 * AuthScreen
 * 
 * Authentication screen with Stanford email validation.
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
  Alert,
  ScrollView,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/colors';
import { globalStyles } from '../../styles/globalStyles';
import { useAuth } from '../../context/AuthContext';

// Form validation types
type FormMode = 'signIn' | 'signUp';
type FormErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  username?: string;
};

const AuthScreen: React.FC = () => {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState<FormMode>('signIn');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  
  // Authentication context
  const { signIn, signUp, error, isLoading, clearError } = useAuth();
  
  // Clear form errors when switching modes
  useEffect(() => {
    setErrors({});
    clearError();
  }, [mode]);
  
  /**
   * Validate Stanford email
   */
  const isStanfordEmail = (email: string): boolean => {
    return email.toLowerCase().endsWith('@stanford.edu');
  };
  
  /**
   * Check username availability
   */
  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    if (username.length < 3) {
      return false;
    }
    
    setIsCheckingUsername(true);
    
    try {
      // In a real app, this would check against Firebase
      // For demo, simulate availability check
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // For demo, only 'demo' username is taken
      const isAvailable = username.toLowerCase() !== 'demo';
      setIsUsernameAvailable(isAvailable);
      return isAvailable;
    } catch (error) {
      console.error('Error checking username:', error);
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
        await signIn(email, password);
      } else {
        // One final username availability check
        const isAvailable = await checkUsernameAvailability(username);
        if (!isAvailable) {
          setErrors(prev => ({
            ...prev,
            username: 'Username is already taken'
          }));
          return;
        }
        
        await signUp(email, password, username);
      }
    } catch (error) {
      // Error is handled by AuthContext
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
   * Render username availability indicator
   */
  const renderUsernameAvailability = () => {
    if (username.length < 3) {
      return null;
    }
    
    if (isCheckingUsername) {
      return (
        <ActivityIndicator size="small" color={COLORS.textSecondary} />
      );
    }
    
    if (isUsernameAvailable === true) {
      return (
        <View style={styles.availabilityIndicator}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
          <Text style={[styles.availabilityText, { color: COLORS.success }]}>Available</Text>
        </View>
      );
    }
    
    if (isUsernameAvailable === false) {
      return (
        <View style={styles.availabilityIndicator}>
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
                onChangeText={setEmail}
              />
              {errors.email ? (
                <Text style={styles.errorText}>{errors.email}</Text>
              ) : null}
            </View>
            
            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.password ? styles.inputError : null
                ]}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.textSecondary}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              {errors.password ? (
                <Text style={styles.errorText}>{errors.password}</Text>
              ) : null}
            </View>
            
            {/* Sign Up Fields */}
            {mode === 'signUp' && (
              <>
                {/* Confirm Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <TextInput
                    style={[
                      styles.input,
                      errors.confirmPassword ? styles.inputError : null
                    ]}
                    placeholder="Confirm your password"
                    placeholderTextColor={COLORS.textSecondary}
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  {errors.confirmPassword ? (
                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                  ) : null}
                </View>
                
                {/* Username Input */}
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
              </>
            )}
            
            {/* Error Message from Auth Context */}
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={COLORS.error} />
                <Text style={styles.authErrorText}>{error}</Text>
              </View>
            ) : null}
            
            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
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
    fontFamily: 'ChivoBold',
    fontSize: 36,
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'ChivoRegular',
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  formContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 20,
    color: COLORS.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.text,
    fontFamily: 'ChivoRegular',
    fontSize: 16,
  },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 1,
  },
  errorText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.error,
    marginTop: 4,
  },
  helperText: {
    fontFamily: 'ChivoRegular',
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
  },
  availabilityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  availabilityText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    marginLeft: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  authErrorText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.error,
    marginLeft: 8,
    flex: 1,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  toggleContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  toggleText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.primary,
  },
});

export default AuthScreen;