/**
 * Camera Utility Functions
 * 
 * Provides utility functions for camera operations including:
 * - Device compatibility checking
 * - Time calculations for pairing deadlines
 * - Image processing functions
 */

import { Camera } from 'react-native-vision-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { format, differenceInMilliseconds } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Check if the device supports dual camera capture
 * @returns Promise resolving to boolean indicating dual camera support
 */
export const checkDualCameraSupport = async (): Promise<boolean> => {
  try {
    // Check camera permission
    const cameraPermission = await Camera.getCameraPermissionStatus();
    if (cameraPermission !== 'granted') {
      await Camera.requestCameraPermission();
    }

    // Get available camera devices
    const devices = await Camera.getAvailableCameraDevices();
    const hasFrontCamera = devices.some(d => d.position === 'front');
    const hasBackCamera = devices.some(d => d.position === 'back');

    // Check device hardware support for dual camera
    let canUseDualCamera = hasFrontCamera && hasBackCamera;
    
    // Additional OS-specific checks
    if (Platform.OS === 'ios') {
      const iosVersion = parseInt(Platform.Version.toString(), 10);
      canUseDualCamera = canUseDualCamera && iosVersion >= 13;
    } else if (Platform.OS === 'android') {
      const androidVersion = parseInt(Platform.Version.toString(), 10);
      canUseDualCamera = canUseDualCamera && androidVersion >= 28;
    }

    return canUseDualCamera;
  } catch (error) {
    console.error('Error checking dual camera support:', error);
    return false;
  }
};

/**
 * Stitch two images (front and back) side by side
 * @param frontUri URI to front camera image
 * @param backUri URI to back camera image
 * @returns Promise resolving to URI of stitched image
 */
export const stitchImages = async (frontUri: string, backUri: string): Promise<string> => {
  try {
    // For now, we'll use a simple side-by-side approach
    // In a production app, this would be more sophisticated with better layout and processing
    
    // First, resize both images to have the same height
    const resizedFront = await ImageManipulator.manipulateAsync(
      frontUri,
      [{ resize: { height: 600 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    const resizedBack = await ImageManipulator.manipulateAsync(
      backUri,
      [{ resize: { height: 600 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    // Side-by-side combination implementation would go here
    // This would typically be done with a Canvas or a native module
    // For the MVP, we'll just return the front image with a note
    // that in production this would be a properly stitched image
    
    console.log('In production, images would be stitched side by side here');
    return resizedFront.uri;
  } catch (error) {
    console.error('Error stitching images:', error);
    throw new Error('Failed to stitch images');
  }
};

/**
 * Format the time remaining until the pairing deadline
 * @param expiresAt Expiration timestamp (10:00 PM PT)
 * @returns Formatted string showing remaining time
 */
export const formatTimeRemaining = (expiresAt: Date | null): string => {
  if (!expiresAt) return 'Unknown';
  
  const now = new Date();
  
  // If already expired
  if (now > expiresAt) {
    return 'Expired';
  }
  
  // Calculate time difference
  const diffMs = differenceInMilliseconds(expiresAt, now);
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHrs > 0) {
    return `${diffHrs}h ${diffMins}m remaining`;
  } else if (diffMins > 0) {
    return `${diffMins}m remaining`;
  } else {
    return 'Less than 1 minute remaining';
  }
};

/**
 * Calculate the deadline time (10:00 PM PT) for today's pairing
 * @returns Date object representing today's deadline
 */
export const calculatePairingDeadline = (): Date => {
  // Create a date object for 10:00 PM PT today
  const now = new Date();
  const deadline = new Date(now);
  deadline.setHours(22, 0, 0, 0); // 10:00 PM
  
  // Format in PT timezone
  const pacificTime = formatInTimeZone(deadline, 'America/Los_Angeles', 'yyyy-MM-dd HH:mm:ss');
  console.log('Deadline (PT):', pacificTime);
  
  return deadline;
};

/**
 * Create a virtual meeting link for remote pairings
 * @param pairingId Unique ID of the pairing
 * @returns Meeting link URL
 */
export const createVirtualMeetingLink = (pairingId: string): string => {
  return `https://meet.jitsi.si/DailyMeetupSelfie-${pairingId}`;
};
