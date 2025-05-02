/**
 * Cloud Functions for Daily Meetup Selfie App
 * 
 * This file serves as the entry point for all Firebase Cloud Functions.
 * It initializes Firebase Admin SDK and exports all functions.
 */

import * as admin from 'firebase-admin';
admin.initializeApp();

// Import pairing functions
import { pairUsers, markExpiredPairingsAsFlaked } from './pairing/pairUsers';

// Import notification functions
import { 
  sendPairingNotifications,
  sendReminderNotifications,
  sendFinalReminderNotifications
} from './notifications/pairingNotifications';

// Export all functions
export {
  // Pairing functions
  pairUsers,
  markExpiredPairingsAsFlaked,
  
  // Notification functions
  sendPairingNotifications,
  sendReminderNotifications,
  sendFinalReminderNotifications
};