/**
 * Notification Utilities
 * 
 * Helper functions for handling notifications on the client side.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Configure notification handler for the app
 */
export const configureNotifications = (): void => {
  // Set notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  
  // Configure Android notification channel
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#990000',
    });
  }
};

/**
 * Check if the current time is within quiet hours
 */
export const isInQuietHours = (
  quietHoursStart: number, 
  quietHoursEnd: number
): boolean => {
  const currentHour = new Date().getHours();
  
  if (quietHoursStart <= quietHoursEnd) {
    // Simple case: start time is before end time (e.g., 10:00 to 18:00)
    return currentHour >= quietHoursStart && currentHour < quietHoursEnd;
  } else {
    // Wrap around case: start time is after end time (e.g., 22:00 to 8:00)
    return currentHour >= quietHoursStart || currentHour < quietHoursEnd;
  }
};

/**
 * Get formatted time remaining until deadline (10 PM PT)
 */
export const getTimeRemainingUntilDeadline = (): {
  formatted: string;
  isExpired: boolean;
  hoursRemaining: number;
  minutesRemaining: number;
} => {
  // Current time in local timezone
  const now = new Date();
  
  // Create deadline time (10:00 PM PT today)
  const deadline = new Date(now);
  
  // Convert to Pacific Time for the deadline
  // Note: In a production app, use a proper timezone library like date-fns-tz
  // This is a simplified conversion that assumes PT is UTC-7
  const pacificOffset = -7; // Pacific Time UTC-7 (PDT)
  const localOffset = -now.getTimezoneOffset() / 60;
  const hoursDifference = localOffset - pacificOffset;
  
  // Set to 10 PM PT (which is 10 PM + hoursDifference in local time)
  deadline.setHours(22 + hoursDifference, 0, 0, 0);
  
  // If it's already past 10 PM PT, the deadline is expired
  if (now > deadline) {
    return {
      formatted: 'Expired',
      isExpired: true,
      hoursRemaining: 0,
      minutesRemaining: 0
    };
  }
  
  // Calculate time difference
  const diffMs = deadline.getTime() - now.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return {
    formatted: `${diffHrs}h ${diffMins}m remaining`,
    isExpired: false,
    hoursRemaining: diffHrs,
    minutesRemaining: diffMins
  };
};

/**
 * Send a local notification
 */
export const sendLocalNotification = async (
  title: string,
  body: string,
  data: Record<string, any> = {}
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
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

/**
 * Get the Expo push token for this device
 */
export const getExpoPushToken = async (): Promise<string | null> => {
  try {
    if (!Constants.expoConfig?.extra?.eas?.projectId) {
      console.warn('Missing projectId for push notifications');
      return null;
    }
    
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
    });
    
    return token.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
};

/**
 * Register for push notifications
 */
export const registerForPushNotifications = async (): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> => {
  try {
    // Check permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    // Return if permissions not granted
    if (finalStatus !== 'granted') {
      return {
        success: false,
        error: 'Permission not granted'
      };
    }
    
    // Get token
    const token = await getExpoPushToken();
    
    if (!token) {
      return {
        success: false,
        error: 'Failed to get push token'
      };
    }
    
    return {
      success: true,
      token
    };
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return {
      success: false,
      error: error?.toString() || 'Unknown error'
    };
  }
};