/**
 * ForgotPasswordScreen
 * 
 * Screen for resetting user password.
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
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/colors';
import { useAuth } from '../../context/AuthContext';

const ForgotPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { resetPassword, error, isLoading, clearError } = useAuth();
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

  const handleResetPassword = async () => {
    // Clear previous errors
    setLocalError(null);
    clearError();
    
    if (!email) {
      setLocalError('Please enter your email address');
      return;
    }

    // Validate Stanford email
    if (!email.toLowerCase().endsWith('@stanford.edu')) {
      setLocalError('Please use your Stanford email address (@stanford.edu)');
      return;
    }

    try {
      await resetPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setLocalError(err.message || 'Password reset failed. Please try again.');
    }
  };

  // Success screen after submitting
  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={64} color={COLORS.primary} />
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successText}>
              We've sent password reset instructions to {email}. Please check your inbox.
            </Text>
            <TouchableOpacity
              style={styles.returnButton}
              onPress={() => navigation.navigate('SignIn' as never)}
            >
              <Text style={styles.returnButtonText}>Return to Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Forgot Password</Text>
            <View style={styles.headerSpacer} />
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

          {/* Instructions */}
          <Text style={styles.instructions}>
            Enter your Stanford email address and we'll send you a link to reset your password.
          </Text>

          {/* Form */}
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

            {/* Reset password button */}
            <TouchableOpacity
              style={[styles.resetButton, (!email || isLoading) && styles.disabledButton]}
              onPress={handleResetPassword}
              disabled={!email || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.resetButtonText}>Reset Password</Text>
              )}
            </TouchableOpacity>

            {/* Sign in link */}
            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Remember your password? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignIn' as never)}>
                <Text style={styles.signInLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'ChivoBold',
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
  instructions: {
    fontFamily: 'ChivoRegular',
    color: COLORS.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
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
    marginBottom: 24,
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
  resetButton: {
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
  resetButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontFamily: 'ChivoBold',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signInText: {
    color: COLORS.textSecondary,
    fontFamily: 'ChivoRegular',
  },
  signInLink: {
    color: COLORS.primary,
    fontFamily: 'ChivoRegular',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: 'ChivoBold',
    color: COLORS.text,
    marginTop: 24,
    marginBottom: 16,
  },
  successText: {
    fontSize: 16,
    fontFamily: 'ChivoRegular',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  returnButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  returnButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontFamily: 'ChivoBold',
  },
});

export default ForgotPasswordScreen;