/**
 * Daily Meetup Selfie App
 * 
 * Main App component with proper Firebase Auth integration.
 */

import React, { useState, useEffect } from 'react';
import { LogBox, StyleSheet, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

// Import NavigationService
import NavigationService, { navigationRef } from './src/navigation/NavigationService';

// Firebase
import FirebaseProvider from './src/providers/FirebaseProvider';
import { isFirebaseInitialized } from './src/config/firebaseInit';

// Contexts
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { PairingProvider } from './src/context/PairingContext';
import { FeedProvider } from './src/context/FeedContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { ChatProvider } from './src/context/ChatContext';
import { ToastProvider } from './src/context/ToastContext';

// Navigation
import MainNavigator from './src/navigation/MainNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import OnboardingScreen from './src/screens/Auth/OnboardingScreen';

// Import font component
import AppFonts from './src/components/AppFonts';

// Ignore specific warnings
LogBox.ignoreLogs([
  // Ignore the AsyncStorage warning from Firebase
  "AsyncStorage has been extracted from react-native",
  // Ignore "componentWillReceiveProps" warning from 3rd party dependencies
  "componentWillReceiveProps has been renamed",
  // Ignore "componentWillMount" warnings 
  "componentWillMount has been renamed",
  // Ignore manifest assets warning
  "Unable to resolve manifest assets",
  // Ignore firebase paths warning
  "The \"paths[1]\" argument must be of type string"
]);

// Main App component with conditional navigator based on auth state
const App: React.FC = () => {
  return (
    <FirebaseProvider>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AppFonts>
          <NavigationContainer ref={navigationRef}>
            <ToastProvider>
              <AuthProvider>
                <AppContent />
              </AuthProvider>
            </ToastProvider>
          </NavigationContainer>
        </AppFonts>
      </SafeAreaProvider>
    </FirebaseProvider>
  );
};

// Content component that determines which navigator to show based on auth state
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, isNewUser, user } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Debug logging for auth state changes
  useEffect(() => {
    console.log('🔄 AppContent: Auth state changed:', {
      isAuthenticated,
      isLoading,
      isNewUser,
      hasUser: !!user,
      userId: user?.id
    });
  }, [isAuthenticated, isLoading, isNewUser, user]);
  
  // Verify Firebase initialization
  useEffect(() => {
    const checkFirebaseInit = () => {
      try {
        const isInitialized = isFirebaseInitialized();
        if (!isInitialized) {
          console.warn('Firebase is not properly initialized');
          setAuthError('Firebase services are not initialized properly. Please try again.');
        } else {
          setAuthError(null);
        }
      } catch (error) {
        console.error('Error checking Firebase initialization:', error);
        setAuthError('Failed to check Firebase initialization: ' + String(error));
      }
    };
    
    checkFirebaseInit();
  }, [retryCount]);
  
  // Handle retry
  const handleRetry = () => {
    setAuthError(null);
    setRetryCount(prev => prev + 1);
  };
  
  if (authError) {
    // Show an error screen if auth initialization failed
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Authentication Error</Text>
        <Text style={styles.loadingText}>{authError}</Text>
        <View style={{marginTop: 20}}>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleRetry}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  if (isLoading) {
    // Show loading screen while checking auth state
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
  
  return (
    <>
      {!isAuthenticated ? (
        // User is not authenticated, show auth screens
        <AuthNavigator />
      ) : isNewUser ? (
        // User is authenticated but new, show onboarding
        <OnboardingScreen />
      ) : (
        // User is authenticated and not new, show main app
        <PairingProvider>
          <ChatProvider>
            <FeedProvider initialPageSize={10}>
              <NotificationProvider
                onNotificationReceived={() => {}}
                onNotificationResponse={() => {}}
              >
                <MainNavigator />
              </NotificationProvider>
            </FeedProvider>
          </ChatProvider>
        </PairingProvider>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'ChivoRegular',
    color: '#777777'
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'ChivoBold',
    color: '#FF3B30',
    marginBottom: 8
  },
  retryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  retryButtonText: {
    color: '#000000',
    fontFamily: 'ChivoBold',
    fontSize: 16
  }
});

export default App;