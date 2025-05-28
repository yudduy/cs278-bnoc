import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TabNavigator } from './MainNavigator';
import CameraScreen from '../screens/Camera/CameraScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import PairingDetailScreen from '../screens/Feed/PairingDetailScreen';
import SettingsScreen from '../screens/Profile/SettingsScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import AboutScreen from '../screens/About/AboutScreen';
import { MainStackParamList } from '../types/navigation';

const Stack = createStackNavigator<MainStackParamList>();

const MainStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="TabNavigator"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      <Stack.Screen name="TabNavigator" component={TabNavigator} />
      <Stack.Screen name="Camera" component={CameraScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="PairingDetail" component={PairingDetailScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
    </Stack.Navigator>
  );
};

export default MainStack; 