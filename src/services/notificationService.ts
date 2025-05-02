/**
 * Notification Service
 * 
 * Handles push notification registration, permission handling,
 * and notification related functionality for the app.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

/**
 * Configure notification handling
 */
export const configureNotifications = () => {
  // Set up handler for received notifications
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  
  // Configure notification channel for Android
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'Daily Meetup Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#990000',
    });
  }
};

/**
 * Register device for push notifications
 * @param userId User ID to associate with push token
 * @returns Promise resolving to push token or null if not available
 */
export const registerForPushNotifications = async (userId: string): Promise<string | null> => {
  // Check if device is physical (emulators/simulators can't receive push notifications)
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }
  
  // Check permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  // Request permissions if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  // Exit if permission was denied
  if (finalStatus !== 'granted') {
    console.log('Failed to get push notification permissions');
    return null;
  }
  
  try {
    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '1314188937187', // Replace with your actual project ID
    });
    const token = tokenData.data;
    
    // Store token in Firestore
    await storeUserPushToken(userId, token);
    
    console.log('Push notification token:', token);
    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
};

/**
 * Store user's push token in Firestore
 * @param userId User ID to associate with token
 * @param token Push notification token
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
    
    console.log('Push token stored successfully');
  } catch (error) {
    console.error('Error storing push token:', error);
    throw error;
  }
};

/**
 * Update user's notification settings
 * @param userId User ID
 * @param settings Notification settings object
 */
export const updateNotificationSettings = async (
  userId: string, 
  settings: {
    pairingNotification: boolean;
    reminderNotification: boolean;
    completionNotification: boolean;
    quietHoursStart: number;
    quietHoursEnd: number;
  }
): Promise<void> => {
  try {
    await firebase.firestore()
      .collection('users')
      .doc(userId)
      .update({
        notificationSettings: settings,
      });
    
    console.log('Notification settings updated');
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw error;
  }
};

/**
 * Send a partner reminder notification
 * @param pairingId ID of the pairing
 * @param partnerId ID of the partner to remind
 */
export const sendPartnerReminder = async (pairingId: string, partnerId: string): Promise<void> => {
  try {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) throw new Error('User not authenticated');
    
    // Create Cloud Function payload
    const payload = {
      pairingId,
      toUserId: partnerId,
      fromUserId: currentUser.uid,
      type: 'manual_reminder',
    };
    
    // Call backend API (in production this would call a Cloud Function)
    console.log('Sending partner reminder:', payload);
    
    // Placeholder for actual Cloud Function call
    // In production, this would be an HTTP request to a Cloud Function
    // For now, we'll just log it
    
    console.log('Partner reminder sent successfully');
  } catch (error) {
    console.error('Error sending partner reminder:', error);
    throw error;
  }
};

export default {
  configureNotifications,
  registerForPushNotifications,
  updateNotificationSettings,
  sendPartnerReminder,
};