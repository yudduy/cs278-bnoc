/**
 * Camera Utilities
 * 
 * Utility functions for camera operations, device compatibility checks,
 * and image processing for the dual-camera feature.
 */

import { Platform } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Device from 'expo-device';
import * as FileSystem from 'expo-file-system';

/**
 * Check if the device supports dual-camera capture
 */
export const checkDualCameraSupport = async (): Promise<boolean> => {
  try {
    // Check camera permission
    const cameraPermission = await Camera.getCameraPermissionStatus();
    if (cameraPermission !== 'authorized') {
      await Camera.requestCameraPermission();
      const newPermission = await Camera.getCameraPermissionStatus();
      if (newPermission !== 'authorized') {
        return false;
      }
    }
    
    // Get available camera devices
    const devices = await Camera.getAvailableCameraDevices();
    const hasFront = devices.some(d => d.position === 'front');
    const hasBack = devices.some(d => d.position === 'back');
    
    // Basic requirement: both front and back cameras exist
    if (!hasFront || !hasBack) {
      return false;
    }
    
    // Additional device-specific checks
    const deviceInfo = await Device.getDeviceTypeAsync();
    
    // Check OS version - dual camera generally requires newer OS
    const osVersion = Platform.OS === 'ios' 
      ? parseInt(Platform.Version as string, 10) 
      : Platform.Version;
    
    // For iOS, dual camera requires iOS 13+ with iPhone X or newer
    if (Platform.OS === 'ios') {
      // iOS 13+ required
      if (osVersion < 13) {
        return false;
      }
      
      // Check for newer iPhone models
      // This is a simplified check - in production would use more precise model detection
      return Device.modelId?.includes('iPhone') && deviceInfo !== Device.DeviceType.PHONE_OLD;
    }
    
    // For Android, require Android 9+ and check manufacturer/model for known good devices
    if (Platform.OS === 'android') {
      // Android 9+ (API 28+) required
      if (typeof osVersion === 'number' && osVersion < 28) {
        return false;
      }
      
      // This is a simplified check - in production would use a more extensive list
      const supportedManufacturers = [
        'samsung', 'google', 'oneplus', 'huawei', 'xiaomi', 'oppo'
      ];
      
      const manufacturer = (await Device.getManufacturerAsync())?.toLowerCase();
      return supportedManufacturers.some(m => manufacturer?.includes(m));
    }
    
    return false;
  } catch (error) {
    console.error('Error checking dual camera support:', error);
    return false;
  }
};

/**
 * Stitch two images (front and back camera) side by side
 */
export const stitchImages = async (
  frontUri: string, 
  backUri: string,
  orientation: 'horizontal' | 'vertical' = 'horizontal'
): Promise<string> => {
  try {
    // Determine if this is a low-end device
    const isLowEndDevice = await isLowPerformanceDevice();
    
    // If it's a low-end device, resize images before stitching to improve performance
    if (isLowEndDevice) {
      frontUri = await resizeImage(frontUri, 600);
      backUri = await resizeImage(backUri, 600);
    }
    
    // First convert URIs to image info to get dimensions
    const [frontInfo, backInfo] = await Promise.all([
      ImageManipulator.manipulateAsync(frontUri, [], { base64: false }),
      ImageManipulator.manipulateAsync(backUri, [], { base64: false })
    ]);
    
    // Calculate output dimensions
    const outputWidth = orientation === 'horizontal' 
      ? frontInfo.width + backInfo.width 
      : Math.max(frontInfo.width, backInfo.width);
      
    const outputHeight = orientation === 'horizontal'
      ? Math.max(frontInfo.height, backInfo.height)
      : frontInfo.height + backInfo.height;
    
    // Create a new image with both images side by side
    // This is done by overlaying the second image at an appropriate offset
    const actions: ImageManipulator.Action[] = [
      { 
        crop: { 
          originX: 0, 
          originY: 0, 
          width: outputWidth, 
          height: outputHeight 
        } 
      },
      {
        overlay: {
          uri: frontUri,
          positionX: 0,
          positionY: 0,
          width: frontInfo.width,
          height: frontInfo.height
        }
      },
      {
        overlay: {
          uri: backUri,
          positionX: orientation === 'horizontal' ? frontInfo.width : 0,
          positionY: orientation === 'horizontal' ? 0 : frontInfo.height,
          width: backInfo.width,
          height: backInfo.height
        }
      }
    ];
    
    // Create a transparent background image to start with
    const backgroundImageUri = `${FileSystem.cacheDirectory}transparent_background.png`;
    
    // Create stitched image
    const result = await ImageManipulator.manipulateAsync(
      frontUri, // We'll replace this completely
      actions,
      {
        format: ImageManipulator.SaveFormat.JPEG,
        compress: 0.85
      }
    );
    
    return result.uri;
  } catch (error) {
    console.error('Error stitching images:', error);
    throw new Error('Failed to stitch images');
  }
};

/**
 * Resize an image to improve performance
 */
const resizeImage = async (uri: string, maxDimension: number): Promise<string> => {
  const info = await ImageManipulator.manipulateAsync(uri, [], { base64: false });
  const { width, height } = info;
  
  // Only resize if the image is larger than maxDimension
  if (width <= maxDimension && height <= maxDimension) {
    return uri;
  }
  
  // Calculate new dimensions while maintaining aspect ratio
  const aspectRatio = width / height;
  let newWidth, newHeight;
  
  if (width > height) {
    newWidth = maxDimension;
    newHeight = maxDimension / aspectRatio;
  } else {
    newHeight = maxDimension;
    newWidth = maxDimension * aspectRatio;
  }
  
  // Resize the image
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: newWidth, height: newHeight } }],
    { compress: 0.85 }
  );
  
  return result.uri;
};

/**
 * Check if the device is low-performance
 */
const isLowPerformanceDevice = async (): Promise<boolean> => {
  // Simple heuristic for determining if the device is low-performance
  // In a production app, you'd want more sophisticated detection
  const deviceInfo = await Device.getDeviceTypeAsync();
  const totalMemory = await Device.getTotalMemoryAsync();
  
  // Consider a device low-performance if:
  // - It's classified as an old phone or tablet
  // - It has less than 2GB of RAM
  return deviceInfo === Device.DeviceType.PHONE_OLD || 
         deviceInfo === Device.DeviceType.TABLET_OLD ||
         totalMemory < 2 * 1024 * 1024 * 1024; // 2GB in bytes
};

/**
 * Calculate time remaining until deadline (10:00 PM PT)
 */
export const calculateTimeRemaining = (): { 
  timeString: string;
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
  // This is a simplified conversion that only works in certain cases
  const pacificOffset = -7; // Pacific Time UTC-7 (PDT)
  const localOffset = now.getTimezoneOffset() / 60;
  const hoursDifference = localOffset + pacificOffset;
  
  // Set to 10 PM PT
  deadline.setHours(22 - hoursDifference, 0, 0, 0);
  
  // If it's already past 10 PM PT, the deadline is expired
  if (now > deadline) {
    return {
      timeString: 'Expired',
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
    timeString: `${diffHrs}h ${diffMins}m remaining`,
    isExpired: false,
    hoursRemaining: diffHrs,
    minutesRemaining: diffMins
  };
};