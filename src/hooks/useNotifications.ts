/**
 * useNotifications Hook
 * 
 * Custom hook for managing push notifications, notification permissions,
 * and notification handling in the app.
 */

import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import firebaseService from '../services/firebase';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export type UseNotificationsResult = {
  // State
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  notificationsEnabled: boolean;
  permissionStatus: Notifications.PermissionStatus | null;
  
  // Actions
  registerForPushNotifications: () => Promise<boolean>;
  toggleNotifications: () => Promise<boolean>;
  updateQuietHours: (start: number, end: number) => Promise<boolean>;
  sendLocalNotification: (title: string, body: string, data?: object) => Promise<string>;
  dismissAllNotifications: () => Promise<void>;
};

/**
 * Custom hook for notifications functionality
 */
export const useNotifications = (): UseNotificationsResult => {
  // State
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
  
  // Get auth context
  const { user } = useAuth();
  
  // Refs for notification listeners
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  
  // Effect to initialize notifications on mount
  useEffect(() => {
    // Register for push notifications if the user is logged in
    if (user?.id) {
      registerForPushNotifications();
    }
    
    // Set up notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });
    
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      // Handle notification response based on type
      if (data?.type === 'pairing') {
        // Navigate to camera screen
        // Note: Navigation should be handled in the component using this hook
      } else if (data?.type === 'completion') {
        // Navigate to feed screen
        // Note: Navigation should be handled in the component using this hook
      }
    });
    
    // Clean up listeners on unmount
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user?.id]);
  
  /**
   * Register for push notifications
   */
  const registerForPushNotifications = async (): Promise<boolean> => {
    if (!user?.id) {
      console.log('User not logged in, cannot register for push notifications');
      return false;
    }
    
    if (!Device.isDevice) {
      console.log('Must use physical device for push notifications');
      return false;
    }
    
    try {
      // Check current permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      setPermissionStatus(finalStatus);
      
      // If not granted, exit
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        setNotificationsEnabled(false);
        return false;
      }
      
      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID, // Make sure this is set in your environment
      });
      
      const token = tokenData.data;
      setExpoPushToken(token);
      
      // Store token in Firestore
      await firebaseService.updateUserPushToken(user.id, token);
      
      // Update notification settings
      const userSettings = await firebaseService.getUserNotificationSettings(user.id);
      setNotificationsEnabled(
        userSettings?.pairingNotification && 
        userSettings?.reminderNotification && 
        userSettings?.completionNotification
      );
      
      // Configure Android channel
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#990000',
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return false;
    }
  };
  
  /**
   * Toggle notifications on/off
   */
  const toggleNotifications = async (): Promise<boolean> => {
    if (!user?.id) {
      console.log('User not logged in, cannot toggle notifications');
      return false;
    }
    
    try {
      const newValue = !notificationsEnabled;
      
      // Update user notification settings in Firestore
      await firebaseService.updateUserNotificationSettings(user.id, {
        pairingNotification: newValue,
        reminderNotification: newValue,
        completionNotification: newValue,
      });
      
      setNotificationsEnabled(newValue);
      return true;
    } catch (error) {
      console.error('Error toggling notifications:', error);
      return false;
    }
  };
  
  /**
   * Update quiet hours
   */
  const updateQuietHours = async (start: number, end: number): Promise<boolean> => {
    if (!user?.id) {
      console.log('User not logged in, cannot update quiet hours');
      return false;
    }
    
    try {
      // Validate input
      if (start < 0 || start > 23 || end < 0 || end > 23) {
        throw new Error('Invalid quiet hours. Must be between 0-23.');
      }
      
      // Update user notification settings in Firestore
      await firebaseService.updateUserNotificationSettings(user.id, {
        quietHoursStart: start,
        quietHoursEnd: end,
      });
      
      return true;
    } catch (error) {
      console.error('Error updating quiet hours:', error);
      return false;
    }
  };
  
  /**
   * Send a local notification
   */
  const sendLocalNotification = async (
    title: string,
    body: string,
    data: object = {}
  ): Promise<string> => {
    // Schedule notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Send immediately
    });
    
    return notificationId;
  };
  
  /**
   * Dismiss all notifications
   */
  const dismissAllNotifications = async (): Promise<void> => {
    await Notifications.dismissAllNotificationsAsync();
  };
  
  return {
    expoPushToken,
    notification,
    notificationsEnabled,
    permissionStatus,
    registerForPushNotifications,
    toggleNotifications,
    updateQuietHours,
    sendLocalNotification,
    dismissAllNotifications,
  };
};