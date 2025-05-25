/**
 * AuthNavigator
 * 
 * Navigation stack for authentication screens.
 * Updated to include combined AuthScreen and OnboardingScreen.
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../config/colors';

// Import screens
import AuthScreen from '../screens/Auth/AuthScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import OnboardingScreen from '../screens/Auth/OnboardingScreen';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Auth"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: COLORS.background },
        animationEnabled: true,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;