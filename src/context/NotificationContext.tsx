/**
 * NotificationContext
 * 
 * Context for managing app notifications and push notifications.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';

// Default notification handler configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Context type definitions
interface NotificationContextType {
  hasPushPermission: boolean;
  pushToken: string | null;
  lastNotification: Notifications.Notification | null;
  requestPushPermission: () => Promise<boolean>;
  scheduleLocalNotification: (
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ) => Promise<string>;
  dismissAllNotifications: () => Promise<void>;
}

// Create context with default values
const NotificationContext = createContext<NotificationContextType>({
  hasPushPermission: false,
  pushToken: null,
  lastNotification: null,
  requestPushPermission: async () => false,
  scheduleLocalNotification: async () => '',
  dismissAllNotifications: async () => {},
});

// Provider props interface
interface NotificationProviderProps {
  children: ReactNode;
  onNotificationReceived?: (notification: Notifications.Notification) => void;
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void;
}

// NotificationProvider component
export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  onNotificationReceived,
  onNotificationResponse,
}) => {
  // State
  const [hasPushPermission, setHasPushPermission] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<Notifications.Notification | null>(null);
  
  // Get auth context
  const { user } = useAuth();
  
  // Initialize and set up notification listeners
  useEffect(() => {
    // Check initial permission status
    checkPermissionStatus();
    
    // Set up notification received listener
    const notificationReceivedListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        setLastNotification(notification);
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }
      }
    );
    
    // Set up notification response listener
    const notificationResponseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        if (onNotificationResponse) {
          onNotificationResponse(response);
        }
      }
    );
    
    // Cleanup listeners on unmount
    return () => {
      Notifications.removeNotificationSubscription(notificationReceivedListener);
      Notifications.removeNotificationSubscription(notificationResponseListener);
    };
  }, [onNotificationReceived, onNotificationResponse]);
  
  // Check and update permission status
  const checkPermissionStatus = async (): Promise<void> => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setHasPushPermission(status === 'granted');
      
      if (status === 'granted') {
        registerForPushNotifications();
      }
    } catch (error) {
      console.error('Error checking notification permissions:', error);
    }
  };
  
  // Register for push notifications
  const registerForPushNotifications = async (): Promise<void> => {
    try {
      // Skip for simulator
      if (!Platform.OS === 'web') {
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        setPushToken(token);
        
        // Update user's push token if authenticated
        if (user?.id) {
          // In a real app, would save token to Firestore
          console.log('Would update push token for user:', user.id, token);
        }
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };
  
  // Request push permission
  const requestPushPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setHasPushPermission(status === 'granted');
      
      if (status === 'granted') {
        await registerForPushNotifications();
      }
      
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  };
  
  // Schedule a local notification
  const scheduleLocalNotification = async (
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> => {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
        },
        trigger: trigger || null, // null means send immediately
      });
      
      return id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  };
  
  // Dismiss all notifications
  const dismissAllNotifications = async (): Promise<void> => {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Error dismissing notifications:', error);
      throw error;
    }
  };
  
  // Context value
  const value: NotificationContextType = {
    hasPushPermission,
    pushToken,
    lastNotification,
    requestPushPermission,
    scheduleLocalNotification,
    dismissAllNotifications,
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  
  return context;
};