/**
 * Daily Meetup Selfie App
 * 
 * Main App component with auth bypass for demo purposes.
 */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

// Contexts
import { AuthProvider } from './src/context/AuthContext';
import { PairingProvider } from './src/context/PairingContext';
import { FeedProvider } from './src/context/FeedContext';
import { NotificationProvider } from './src/context/NotificationContext';

// Navigation - directly import MainNavigator to bypass auth
import MainNavigator from './src/navigation/MainNavigator';

// Main App component - bypassing auth completely for demo
const App: React.FC = () => {
  // Skip all auth checks and render main navigator directly
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <AuthProvider>
          <PairingProvider>
            <FeedProvider initialPageSize={10}>
              <NotificationProvider
                onNotificationReceived={() => {}}
                onNotificationResponse={() => {}}
              >
                {/* Bypass auth by directly rendering MainNavigator */}
                <MainNavigator />
              </NotificationProvider>
            </FeedProvider>
          </PairingProvider>
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;