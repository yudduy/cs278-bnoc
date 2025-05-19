/**
 * Cloud Functions for Daily Meetup Selfie app
 * 
 * Main index file exports all functions
 */

// Import function groups
import * as pairingFunctions from './pairing';
import * as notificationFunctions from './notifications';
import * as feedFunctions from './pairing/feedUpdates';

// Export all functions
export const pairUsersDaily = pairingFunctions.pairUsersDaily;
export const markExpiredPairingsAsFlaked = pairingFunctions.markExpiredPairingsAsFlaked;

export const onNewChatMessage = notificationFunctions.onNewChatMessage;
export const onPhotoSubmission = notificationFunctions.onPhotoSubmission;
export const onPairingCompleted = notificationFunctions.onPairingCompleted;

export const updateFeedsOnPairingUpdate = feedFunctions.updateFeedsOnPairingUpdate;
export const archiveOldFeedItems = feedFunctions.archiveOldFeedItems;