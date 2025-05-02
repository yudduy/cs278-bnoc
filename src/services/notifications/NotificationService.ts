/**
 * NotificationService
 * 
 * Service for handling push notifications, tokens, and local notifications.
 * Provides methods for registering, managing, and responding to notifications.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import firebase from 'firebase/app';
import 'firebase/firestore';

// Types
export interface NotificationSettings {
  pairingNotification: boolean;
  reminderNotification: boolean;
  completionNotification: boolean;
  quietHoursStart: number; // 0-23 hours
  quietHoursEnd: number; // 0-23 hours
}

/**
 * Register for push notifications
 */
export const registerForPushNotifications = async (userId: string): Promise<string | null> => {
  if (!Device.isDevice) {
    console.log('Physical device is required for Push Notifications');
    return null;
  }
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return null;
  }
  
  // Get the token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PROJECT_ID, // Make sure this is set in your environment
  });
  
  const token = tokenData.data;
  
  // Store the token in Firestore
  await storeUserPushToken(userId, token);
  
  // Platform-specific notification channel
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#990000',
    });
  }
  
  return token;
};

/**
 * Store user push token in Firestore
 */
const storeUserPushToken = async (userId: string, token: string): Promise<void> => {
  try {
    await firebase.firestore()
      .collection('users')
      .doc(userId)
      .update({
        pushToken: token,
        tokenUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
  } catch (error) {
    console.error('Error storing push token:', error);
    throw error;
  }
};

/**
 * Update user notification settings
 */
export const updateNotificationSettings = async (
  userId: string, 
  settings: Partial<NotificationSettings>
): Promise<void> => {
  try {
    await firebase.firestore()
      .collection('users')
      .doc(userId)
      .update({
        notificationSettings: firebase.firestore.FieldValue.arrayUnion(settings),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw error;
  }
};

/**
 * Get user notification settings
 */
export const getUserNotificationSettings = async (
  userId: string
): Promise<NotificationSettings | null> => {
  try {
    const userDoc = await firebase.firestore()
      .collection('users')
      .doc(userId)
      .get();
    
    if (!userDoc.exists) {
      return null;
    }
    
    const userData = userDoc.data();
    return userData?.notificationSettings as NotificationSettings || null;
  } catch (error) {
    console.error('Error getting notification settings:', error);
    throw error;
  }
};

/**
 * Check if the current time is within quiet hours
 */
export const isInQuietHours = async (userId: string): Promise<boolean> => {
  try {
    const settings = await getUserNotificationSettings(userId);
    
    if (!settings) {
      return false;
    }
    
    const { quietHoursStart, quietHoursEnd } = settings;
    const currentHour = new Date().getHours();
    
    if (quietHoursStart <= quietHoursEnd) {
      // Simple case: start time is before end time
      return currentHour >= quietHoursStart && currentHour < quietHoursEnd;
    } else {
      // Wrap around case: start time is after end time (e.g., 22:00 to 6:00)
      return currentHour >= quietHoursStart || currentHour < quietHoursEnd;
    }
  } catch (error) {
    console.error('Error checking quiet hours:', error);
    return false;
  }
};

/**
 * Send a local notification
 */
export const sendLocalNotification = async (
  title: string,
  body: string,
  data: object = {}
): Promise<string> => {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Send immediately
  });
};

/**
 * Configure notification handler
 */
export const configureNotificationHandler = (): void => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
};