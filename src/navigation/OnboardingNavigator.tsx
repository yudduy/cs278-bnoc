/**
 * OnboardingNavigator
 * 
 * Navigation stack for onboarding screens shown after authentication
 * but before main app access. Updated with black and white theme and
 * smooth transitions.
 */

import React from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { COLORS } from '../config/theme';

// Import mock screens (create placeholder screens for demo)
import WelcomeScreen from '../screens/Onboarding/WelcomeScreen';
import PermissionsScreen from '../screens/Onboarding/PermissionsScreen';
import ProfileSetupScreen from '../screens/Onboarding/ProfileSetupScreen';
import CompletionScreen from '../screens/Onboarding/CompletionScreen';

// Create stack navigator
const Stack = createStackNavigator();

const OnboardingNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: COLORS.background },
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        // Add transition animation options
        transitionSpec: {
          open: {
            animation: 'timing',
            config: {
              duration: 300,
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 300,
            },
          },
        },
        // Disable gesture navigation in onboarding flow for more guided experience
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Permissions" component={PermissionsScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="Completion" component={CompletionScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;