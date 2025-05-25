import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TabNavigator } from './MainNavigator';
import CameraScreen from '../screens/Camera/CameraScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import PrivacyScreen from '../screens/Settings/PrivacyScreen';
import HelpScreen from '../screens/Settings/HelpScreen';
import AboutScreen from '../screens/About/AboutScreen';
import PairingScreen from '../screens/Pairing/PairingScreen';
import DailyPairingScreen from '../screens/Pairing/DailyPairingScreen';
import ViewSelfiesScreen from '../screens/Pairing/ViewSelfiesScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import FindFriendsScreen from '../screens/Friends/FindFriendsScreen';
import BlockedUsersScreen from '../screens/Settings/BlockedUsersScreen';

import { MainStackParamList } from '../types/navigation';

const Stack = createStackNavigator<MainStackParamList>();

const MainStack = () => {
  return (
    <Stack.Navigator 
      initialRouteName="TabNavigator"
      screenOptions={{ 
        headerShown: false,
        presentation: 'card',
      }}
    >
      <Stack.Screen name="TabNavigator" component={TabNavigator} />
      <Stack.Screen name="Camera" component={CameraScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="DailyPairing" component={DailyPairingScreen} />
      <Stack.Screen name="ViewSelfies" component={ViewSelfiesScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Pairing" component={PairingScreen} />
      <Stack.Screen name="FindFriends" component={FindFriendsScreen} />
      <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
    </Stack.Navigator>
  );
};

export default MainStack; 