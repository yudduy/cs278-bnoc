/**
 * SignInScreen
 * 
 * Screen for user sign in with Stanford email validation.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/colors';
import { useAuth } from '../../context/AuthContext';

const SignInScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { signIn, error, isLoading, clearError } = useAuth();
  const navigation = useNavigation();

  // Clear auth context error when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Show auth context error if it exists
  useEffect(() => {
    if (error) {
      setLocalError(error);
    }
  }, [error]);

  const handleSignIn = async () => {
    // Clear previous errors
    setLocalError(null);
    clearError();
    
    if (!email || !password) {
      setLocalError('Please enter both email and password');
      return;
    }
    
    // Validate Stanford email
    if (!email.toLowerCase().endsWith('@stanford.edu')) {
      setLocalError('Please use your Stanford email address (@stanford.edu)');
      return;
    }
    
    try {
      await signIn(email, password);
    } catch (err: any) {
      console.error('Sign in error:', err);
      setLocalError(err.message || 'Sign in failed. Please check your credentials.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Text style={styles.appName}>BNOC</Text>
              <Text style={styles.tagline}>Daily Meetup Selfie</Text>
            </View>

            {/* Error message */}
            {(localError || error) && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{localError || error}</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setLocalError(null);
                    clearError();
                  }} 
                  style={styles.errorCloseButton}
                >
                  <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}

            {/* Sign in form */}
            <View style={styles.form}>
              {/* Email input */}
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Stanford Email"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              {/* Password input */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={COLORS.textSecondary}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Forgot password */}
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={() => navigation.navigate('ForgotPassword' as never)}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Sign in button */}
              <TouchableOpacity
                style={[styles.signInButton, (!email || !password || isLoading) && styles.disabledButton]}
                onPress={handleSignIn}
                disabled={!email || !password || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.signInButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              {/* Sign up link */}
              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('SignUp' as never)}>
                  <Text style={styles.signUpLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Testing credentials */}
          <View style={styles.testCredentialsContainer}>
            <Text style={styles.testCredentialsTitle}>Test Credentials</Text>
            <Text style={styles.testCredentials}>Email: duy@stanford.edu</Text>
            <Text style={styles.testCredentials}>Password: password123</Text>
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
    marginTop: 40,
  },
  appName: {
    fontSize: 32,
    fontFamily: 'ChivoBold',
    color: COLORS.text,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    fontFamily: 'ChivoLight',
    color: COLORS.textSecondary,
  },
  form: {
    width: '100%',
  },
  errorContainer: {
    backgroundColor: COLORS.error,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#FFFFFF',
    fontFamily: 'ChivoRegular',
    flex: 1,
  },
  errorCloseButton: {
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontFamily: 'ChivoRegular',
    height: '100%',
  },
  passwordToggle: {
    padding: 8,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontFamily: 'ChivoRegular',
  },
  signInButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  signInButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontFamily: 'ChivoBold',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signUpText: {
    color: COLORS.textSecondary,
    fontFamily: 'ChivoRegular',
  },
  signUpLink: {
    color: COLORS.primary,
    fontFamily: 'ChivoRegular',
  },
  testCredentialsContainer: {
    padding: 16,
    backgroundColor: COLORS.card,
    marginHorizontal: 24,
    marginBottom: 24,
    marginTop: 32,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  testCredentialsTitle: {
    fontFamily: 'ChivoBold',
    color: COLORS.text,
    marginBottom: 8,
  },
  testCredentials: {
    fontFamily: 'ChivoRegular',
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});

export default SignInScreen;