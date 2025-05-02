/**
 * AuthScreen
 * 
 * Simplified authentication screen for demo purposes.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../config/colors';
import { globalStyles } from '../../styles/globalStyles';
import { Ionicons } from '@expo/vector-icons';

const AuthScreen: React.FC = () => {
  // State
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password');
  const [isSignIn, setIsSignIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Auth context
  const { signIn, signUp, isLoading } = useAuth();
  
  // Handle sign in
  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // For demo purposes, we're using the mock signIn method
      await signIn(email, password);
      console.log("Sign in successful");
    } catch (error: any) {
      console.error('Error signing in:', error);
      setError(error.message || 'Invalid email or password');
      Alert.alert('Sign In Error', error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle sign up
  const handleSignUp = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // For demo, use a simple username from the email
      const username = email.split('@')[0];
      await signUp(email, password, username);
      console.log("Sign up successful");
    } catch (error: any) {
      console.error('Error signing up:', error);
      setError(error.message || 'Failed to create account');
      Alert.alert('Sign Up Error', error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle between sign in and sign up
  const toggleAuthMode = () => {
    setIsSignIn(!isSignIn);
    setError(null);
  };
  
  return (
    <SafeAreaView style={globalStyles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Image
              source={{ uri: 'https://picsum.photos/200/200?random=logo' }}
              style={styles.logo}
            />
            <Text style={styles.title}>Daily Meetup</Text>
            <Text style={styles.subtitle}>
              Connect with Stanford peers every day
            </Text>
          </View>
          
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              {isSignIn ? 'Sign In' : 'Create Account'}
            </Text>
            
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Stanford Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="name@stanford.edu"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                secureTextEntry
              />
            </View>
            
            {isSignIn ? (
              <TouchableOpacity style={styles.forgotPasswordButton}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.termsText}>
                By signing up, you agree to our Terms of Service and Privacy Policy
              </Text>
            )}
            
            <TouchableOpacity
              style={styles.authButton}
              onPress={isSignIn ? handleSignIn : handleSignUp}
              disabled={loading || isLoading}
            >
              {loading || isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.authButtonText}>
                  {isSignIn ? 'Sign In' : 'Sign Up'}
                </Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {isSignIn ? "Don't have an account?" : "Already have an account?"}
              </Text>
              <TouchableOpacity onPress={toggleAuthMode}>
                <Text style={styles.toggleButton}>
                  {isSignIn ? 'Sign Up' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.authOptions}>
            <Text style={styles.orText}>OR</Text>
            
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-google" size={20} color={COLORS.text} />
              <Text style={styles.socialButtonText}>
                {isSignIn ? 'Sign in with Google' : 'Sign up with Google'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-apple" size={20} color={COLORS.text} />
              <Text style={styles.socialButtonText}>
                {isSignIn ? 'Sign in with Apple' : 'Sign up with Apple'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.demoNote}>
            For demo, use demo@example.com / password
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'ChivoBold',
    fontSize: 28,
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  formContainer: {
    marginBottom: 24,
  },
  formTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 20,
    color: COLORS.text,
    marginBottom: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.error,
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: 'ChivoBold',
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    height: 48,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.text,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.primary,
  },
  termsText: {
    fontFamily: 'ChivoRegular',
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  authButton: {
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  authButtonText: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  toggleButton: {
    fontFamily: 'ChivoBold',
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 4,
  },
  authOptions: {
    marginBottom: 24,
  },
  orText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  socialButton: {
    height: 48,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  socialButtonText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 8,
  },
  demoNote: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.accent,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default AuthScreen;