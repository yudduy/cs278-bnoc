/**
 * Notification Configuration
 * 
 * Setup and configuration for push notifications in the app.
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import firebaseService from '../firebase';

/**
 * Configure notifications behavior
 */
export const configureNotifications = async (): Promise<void> => {
  // Set how notifications are handled when the app is in the foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  
  // Register for push notifications if possible
  if (Device.isDevice) {
    await registerForPushNotifications();
  } else {
    console.log('Push notifications are not available in the simulator');
  }
};

/**
 * Register for push notifications and store the token
 */
export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    // Check permission status
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // If not determined, request permissions
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    // If not granted, exit
    if (finalStatus !== 'granted') {
      console.log('Permission not granted for push notifications');
      return null;
    }
    
    // Get the token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    let token;
    
    if (Platform.OS === 'android') {
      // For Android, we need to configure the notification channel
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    
    token = (await Notifications.getExpoPushTokenAsync({
      projectId,
    })).data;
    
    console.log('Push token:', token);
    
    // Store the token in Firebase (in a real app)
    // This is mocked in our implementation
    if (token) {
      const currentUser = await firebaseService.getCurrentUser();
      if (currentUser) {
        await firebaseService.updateUserPushToken(currentUser.id, token);
      }
    }
    
    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

/**
 * Schedule a local notification
 */
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  data?: any,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string> => {
  try {
    // Use notification icon and sound from assets
    const notificationRequest = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'notification-sound.wav', // From assets folder
        badge: 1,
      },
      trigger: trigger || null, // null means send immediately
    });
    
    return notificationRequest;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
};

/**
 * Cancel a scheduled notification
 */
export const cancelScheduledNotification = async (
  notificationId: string
): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
    throw error;
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
    throw error;
  }
};

/**
 * Get all scheduled notifications
 */
export const getAllScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    throw error;
  }
};

/**
 * Get badge count
 */
export const getBadgeCount = async (): Promise<number> => {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error('Error getting badge count:', error);
    throw error;
  }
};

/**
 * Set badge count
 */
export const setBadgeCount = async (count: number): Promise<void> => {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error setting badge count:', error);
    throw error;
  }
};

export default {
  configureNotifications,
  registerForPushNotifications,
  scheduleLocalNotification,
  cancelScheduledNotification,
  cancelAllNotifications,
  getAllScheduledNotifications,
  getBadgeCount,
  setBadgeCount,
};