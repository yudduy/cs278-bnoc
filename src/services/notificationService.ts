/**
 * Notification Service
 * 
 * Handles push notification registration, permission handling,
 * and notification related functionality for the app.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { collection, addDoc, query, where, orderBy, getDocs, updateDoc, doc, Timestamp, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User, NotificationType } from '../types';

/**
 * Configure notification handling for the app
 */
export const configureNotifications = () => {
  // Set up handler for received notifications
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true
    }),
  });
  
  // Configure notification channel for Android
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'Daily Meetup Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF5A5A', // App's primary color
    });
  }
};

/**
 * Register for push notifications
 */
export const registerForPushNotifications = async (): Promise<string | null> => {
  if (!Device.isDevice) {
    console.log('Push Notifications are not available in the simulator');
    return null;
  }
  
  try {
    // Check for existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // If we don't already have permission, ask for it
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    // If permission was not granted, exit the function
    if (finalStatus !== 'granted') {
      console.log('Failed to get push notification permissions');
      return null;
    }
    
    // Get the push token
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'unknown', // Use configured project ID
    })).data;
    
    console.log('Push notification token:', token);
    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
};

/**
 * Update user's notification token
 */
export const updateUserPushToken = async (userId: string, token: string): Promise<void> => {
  try {
    // Make sure we have a valid user ID and token
    if (!userId || !token) {
      console.error('Missing userId or token for updateUserPushToken');
      return;
    }
    
    // Update the user document with the new token
    await updateDoc(doc(db, 'users', userId), {
      fcmToken: token,
      lastTokenUpdate: Timestamp.now()
    });
    
    console.log(`Updated push token for user ${userId}`);
  } catch (error) {
    console.error('Error updating user push token:', error);
  }
};

/**
 * Create a notification in Firestore
 */
export const createNotification = async (
  recipientId: string,
  type: NotificationType,
  title: string,
  body: string,
  data: { [key: string]: any } = {},
  senderId?: string
): Promise<string | null> => {
  try {
    // Check for required fields
    if (!recipientId || !type || !title || !body) {
      console.error('Missing required notification fields');
      return null;
    }
    
    // Create notification document
    const notificationRef = await addDoc(collection(db, 'notifications'), {
      userId: recipientId,
      type,
      title,
      body,
      data,
      senderId: senderId || null,
      createdAt: Timestamp.now(),
      read: false
    });
    
    return notificationRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

/**
 * Get user's recent notifications
 */
export const getUserNotifications = async (
  userId: string,
  limitCount: number = 20
): Promise<any[]> => {
  try {
    // Create query for recent notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    // Get notifications
    const snapshot = await getDocs(notificationsQuery);
    
    // Map the results
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return [];
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
      readAt: Timestamp.now()
    });
  } catch (error) {
    console.error(`Error marking notification ${notificationId} as read:`, error);
  }
};

/**
 * Send a pairing reminder notification
 */
export const sendPairingReminder = async (
  pairingId: string,
  sender: User,
  recipientId: string
): Promise<void> => {
  try {
    // Create notification for the recipient
    const title = 'Pairing Reminder';
    const body = `${sender.username || 'Your partner'} is waiting for your photo! Complete your pairing soon.`;
    
    await createNotification(
      recipientId,
      'reminder',
      title,
      body,
      {
        pairingId,
        senderId: sender.id,
        urgent: true
      },
      sender.id
    );
    
    // Update the pairing document to record that a reminder was sent
    await updateDoc(doc(db, 'pairings', pairingId), {
      lastReminderAt: Timestamp.now(),
      lastReminderBy: sender.id
    });
    
    console.log(`Pairing reminder sent from ${sender.id} to ${recipientId}`);
  } catch (error) {
    console.error('Error sending pairing reminder:', error);
    throw error;
  }
};

/**
 * Schedule a local notification for later today
 */
export const scheduleReminderForToday = async (
  title: string,
  body: string,
  hoursFromNow: number = 2
): Promise<string | null> => {
  try {
    // Schedule the notification - use seconds from now instead of Date object
    const secondsFromNow = hoursFromNow * 60 * 60;
    
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        seconds: secondsFromNow,
      },
    });
    
    return id;
  } catch (error) {
    console.error('Error scheduling local reminder:', error);
    return null;
  }
};

export default {
  configureNotifications,
  registerForPushNotifications,
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  sendPairingReminder,
  scheduleReminderForToday,
  updateUserPushToken
};