/**
 * SignInScreen
 * 
 * Handles user authentication with Stanford email validation.
 * Follows the black and white theme of the app.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, BORDER_RADIUS } from '../../config/theme';

const SignInScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { signIn, isLoading, error, clearError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localErrors, setLocalErrors] = useState<{email?: string; password?: string}>({});

  const validateForm = () => {
    const errors: {email?: string; password?: string} = {};
    
    if (!email) {
      errors.email = 'Email is required';
    } else if (!email.toLowerCase().endsWith('@stanford.edu')) {
      errors.email = 'Please use your Stanford email address';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    }
    
    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;
    
    clearError();
    try {
      await signIn(email.toLowerCase().trim(), password);
    } catch (err) {
      console.error('Sign in error:', err);
    }
  };

  const navigateToSignUp = () => {
    navigation.navigate('SignUp');
  };

  const navigateToForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.logo}>BNOC</Text>
              <Text style={styles.subtitle}>Sign in to your account</Text>
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            
            {/* Form */}
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Stanford Email</Text>
                <TextInput
                  style={[styles.input, localErrors.email && styles.inputError]}
                  placeholder="your.name@stanford.edu"
                  placeholderTextColor={COLORS.textSecondary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (localErrors.email) {
                      setLocalErrors(prev => ({ ...prev, email: undefined }));
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                {localErrors.email && (
                  <Text style={styles.inputErrorText}>{localErrors.email}</Text>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.passwordInput, localErrors.password && styles.inputError]}
                    placeholder="Enter your password"
                    placeholderTextColor={COLORS.textSecondary}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (localErrors.password) {
                        setLocalErrors(prev => ({ ...prev, password: undefined }));
                      }
                    }}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={24}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                {localErrors.password && (
                  <Text style={styles.inputErrorText}>{localErrors.password}</Text>
                )}
              </View>

              {/* Sign In Button */}
              <TouchableOpacity
                style={[styles.signInButton, isLoading && styles.disabledButton]}
                onPress={handleSignIn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={COLORS.background} />
                ) : (
                  <Text style={styles.signInButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              {/* Forgot Password Link */}
              <TouchableOpacity
                style={styles.linkButton}
                onPress={navigateToForgotPassword}
                disabled={isLoading}
              >
                <Text style={styles.linkText}>Forgot your password?</Text>
              </TouchableOpacity>
            </View>

            {/* Sign Up Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={navigateToSignUp} disabled={isLoading}>
                <Text style={styles.footerLinkText}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Test Credentials for Development */}
            {__DEV__ && (
              <View style={styles.testCredentials}>
                <Text style={styles.testTitle}>Test Credentials:</Text>
                <Text style={styles.testText}>Email: test@stanford.edu</Text>
                <Text style={styles.testText}>Password: test123</Text>
              </View>
            )}
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontFamily: FONTS.bold,
    fontSize: 48,
    color: COLORS.primary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.md,
    padding: 16,
    marginBottom: 24,
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
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
  inputError: {
    borderColor: COLORS.primary,
  },
  inputErrorText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 4,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingRight: 56,
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  signInButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  signInButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.background,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  footerLinkText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.primary,
  },
  testCredentials: {
    marginTop: 32,
    padding: 16,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.md,
  },
  testTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: 8,
  },
  testText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
});

export default SignInScreen;