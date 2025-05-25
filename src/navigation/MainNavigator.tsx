/**
 * MainNavigator
 * 
 * Main navigation stack for the app after authentication and onboarding.
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../config/colors';

// Import screens
import FeedScreen from '../screens/Feed/FeedScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import CameraScreen from '../screens/Camera/CameraScreen';
import PhotoPreviewScreen from '../screens/Camera/PhotoPreviewScreen';
import PairingDetailScreen from '../screens/Feed/PairingDetailScreen';
import CurrentPairingScreen from '../screens/Pairing/CurrentPairingScreen';
import DailyPairingScreen from '../screens/Pairing/DailyPairingScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import FindFriendsScreen from '../screens/Feed/FindFriendsScreen';
import SettingsScreen from '../screens/Profile/SettingsScreen';
import BlockedUsersScreen from '../screens/Profile/Settings/BlockedUsersScreen';

// Import the pairing context hook
import { usePairing } from '../context/PairingContext';

// Create navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const PairingStack = createStackNavigator();
const ChatStack = createStackNavigator();

// Pairing Stack Navigator
const PairingNavigator = () => {
  const { hasSeenTodaysPairingIntro } = usePairing();
  
  return (
    <PairingStack.Navigator
      initialRouteName={hasSeenTodaysPairingIntro ? "CurrentPairing" : "DailyPairing"}
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: COLORS.background }
      }}
    >
      <PairingStack.Screen name="CurrentPairing" component={CurrentPairingScreen} />
      <PairingStack.Screen name="DailyPairing" component={DailyPairingScreen} />
    </PairingStack.Navigator>
  );
};

// Chat Stack Navigator
const ChatNavigator = () => {
  return (
    <ChatStack.Navigator
      initialRouteName="ChatScreen"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: COLORS.background }
      }}
    >
      <ChatStack.Screen name="ChatScreen" component={ChatScreen} />
    </ChatStack.Navigator>
  );
};

// Tab Navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Feed') {
            iconName = focused ? 'home' : 'home-outline';
            return <Ionicons name={iconName as any} size={size} color={color} />;
          } else if (route.name === 'Today') {
            iconName = focused ? 'today' : 'today';
            return <MaterialIcons name={iconName as any} size={size} color={color} />;
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
            return <Ionicons name={iconName as any} size={size} color={color} />;
          }
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontFamily: 'ChivoRegular',
          fontSize: 12,
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Today" component={PairingNavigator} />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          unmountOnBlur: true // Forces component to remount on focus
        }}
      />
    </Tab.Navigator>
  );
};

// Main Stack Navigator
const MainNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="TabNavigator"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: COLORS.background }
      }}
    >
      <Stack.Screen name="TabNavigator" component={TabNavigator} />
      <Stack.Screen name="Camera" component={CameraScreen} />
      <Stack.Screen name="PhotoPreview" component={PhotoPreviewScreen} />
      <Stack.Screen name="PairingDetail" component={PairingDetailScreen} />
      <Stack.Screen name="Pairing" component={PairingNavigator} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="FindFriends" component={FindFriendsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
    </Stack.Navigator>
  );
};

export default MainNavigator;
export { TabNavigator };