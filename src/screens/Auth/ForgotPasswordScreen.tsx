/**
 * ForgotPasswordScreen
 * 
 * Screen for resetting user password with black and white theme.
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, BORDER_RADIUS } from '../../config/theme';
import { globalStyles } from '../../styles/globalStyles';
import { useAuth } from '../../context/AuthContext';

const ForgotPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { resetPassword, error, isLoading, clearError } = useAuth();
  const navigation = useNavigation<any>();

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
      await resetPassword(email.toLowerCase().trim());
      setSubmitted(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setLocalError(err.message || 'Password reset failed. Please try again.');
    }
  };

  // Success screen after submitting
  if (submitted) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Check Your Email</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.successContainer}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={80} color={COLORS.primary} />
            </View>
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successText}>
              We've sent password reset instructions to{'\n'}
              <Text style={styles.emailText}>{email}</Text>
              {'\n\n'}Please check your inbox and follow the instructions to reset your password.
            </Text>
            <TouchableOpacity
              style={styles.returnButton}
              onPress={() => navigation.navigate('Auth')}
            >
              <Text style={styles.returnButtonText}>Return to Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Reset Password</Text>
              <View style={styles.headerSpacer} />
            </View>

            {/* Main Content */}
            <View style={styles.mainContent}>
              {/* Instructions */}
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructions}>
                  Enter your Stanford email address and we'll send you a link to reset your password.
                </Text>
              </View>

              {/* Error message */}
              {(localError || error) && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color={COLORS.primary} />
                  <Text style={styles.errorText}>{localError || error}</Text>
                  <TouchableOpacity 
                    onPress={() => {
                      setLocalError(null);
                      clearError();
                    }} 
                    style={styles.errorCloseButton}
                  >
                    <Ionicons name="close-circle" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Form */}
              <View style={styles.form}>
                {/* Email input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Stanford Email</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="your.email@stanford.edu"
                      placeholderTextColor={COLORS.textSecondary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (localError) {
                          setLocalError(null);
                        }
                        if (error) {
                          clearError();
                        }
                      }}
                      editable={!isLoading}
                    />
                  </View>
                </View>

                {/* Reset password button */}
                <TouchableOpacity
                  style={[styles.resetButton, (!email || isLoading) && styles.disabledButton]}
                  onPress={handleResetPassword}
                  disabled={!email || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.background} size="small" />
                  ) : (
                    <Text style={styles.resetButtonText}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>

                {/* Sign in link */}
                <TouchableOpacity
                  style={styles.linkContainer}
                  onPress={() => navigation.navigate('Auth')}
                  disabled={isLoading}
                >
                  <Text style={styles.linkText}>
                    Remember your password? <Text style={styles.linkTextBold}>Sign In</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    marginTop: 8,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  headerSpacer: {
    width: 40,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },
  instructionsContainer: {
    marginBottom: 32,
  },
  instructions: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.md,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  errorText: {
    color: COLORS.primary,
    fontFamily: FONTS.regular,
    fontSize: 14,
    flex: 1,
    marginLeft: 12,
  },
  errorCloseButton: {
    marginLeft: 8,
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: 16,
    paddingVertical: 16,
  },
  resetButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: COLORS.background,
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    fontSize: 16,
    textAlign: 'center',
  },
  linkTextBold: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  successIconContainer: {
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  emailText: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
  returnButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: BORDER_RADIUS.md,
  },
  returnButtonText: {
    color: COLORS.background,
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
});

export default ForgotPasswordScreen;