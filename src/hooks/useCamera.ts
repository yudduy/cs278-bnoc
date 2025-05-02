/**
 * useCamera Hook
 * 
 * Custom hook for managing camera functionality, including
 * dual-camera capture, device compatibility, and image processing.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, PhotoFile } from 'react-native-vision-camera';
import { 
  checkDualCameraSupport, 
  stitchImages, 
  calculateTimeRemaining 
} from '../utils/camera/cameraUtils';

export type CaptureResult = {
  frontImage: string;
  backImage: string;
  stitchedImage: string | null;
};

export type UseCameraResult = {
  // Camera references
  frontCameraRef: React.RefObject<Camera>;
  backCameraRef: React.RefObject<Camera>;
  
  // State
  capturing: boolean;
  dualCameraSupported: boolean | null;
  captureResult: CaptureResult | null;
  timeRemaining: {
    timeString: string;
    isExpired: boolean;
    hoursRemaining: number;
    minutesRemaining: number;
  };
  error: string | null;
  
  // Actions
  captureImages: () => Promise<void>;
  resetCapture: () => void;
  retryCapture: () => void;
  takeSequentialCapture: () => Promise<void>;
  getStitchedImage: () => Promise<string>;
};

/**
 * Custom hook for camera functionality
 */
export const useCamera = (): UseCameraResult => {
  // Camera references
  const frontCameraRef = useRef<Camera>(null);
  const backCameraRef = useRef<Camera>(null);
  
  // State
  const [capturing, setCapturing] = useState(false);
  const [dualCameraSupported, setDualCameraSupported] = useState<boolean | null>(null);
  const [captureResult, setCaptureResult] = useState<CaptureResult | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining());
  const [error, setError] = useState<string | null>(null);
  
  // Check dual camera support when the hook is first used
  useEffect(() => {
    const checkSupport = async () => {
      try {
        const isSupported = await checkDualCameraSupport();
        setDualCameraSupported(isSupported);
      } catch (err) {
        console.error('Error checking dual camera support:', err);
        setDualCameraSupported(false);
        setError('Failed to check camera capabilities.');
      }
    };
    
    checkSupport();
  }, []);
  
  // Update time remaining every minute
  useEffect(() => {
    const updateTimeRemaining = () => {
      setTimeRemaining(calculateTimeRemaining());
    };
    
    // Update immediately
    updateTimeRemaining();
    
    // Then update every minute
    const interval = setInterval(updateTimeRemaining, 60000);
    return () => clearInterval(interval);
  }, []);
  
  /**
   * Capture images from both cameras simultaneously
   */
  const captureImages = async () => {
    try {
      setCapturing(true);
      setError(null);
      
      // Check if both camera refs are valid
      if (!frontCameraRef.current || !backCameraRef.current) {
        throw new Error('Camera not ready');
      }
      
      // Take photos from both cameras
      const [frontPhoto, backPhoto] = await Promise.all([
        frontCameraRef.current.takePhoto({
          flash: 'off',
          qualityPrioritization: 'balanced',
          enableShutterSound: false,
        }),
        backCameraRef.current.takePhoto({
          flash: 'off',
          qualityPrioritization: 'balanced',
          enableShutterSound: false,
        }),
      ]);
      
      // Process the captured photos
      const frontUri = `file://${frontPhoto.path}`;
      const backUri = `file://${backPhoto.path}`;
      
      // Stitch the images together
      const stitchedImageUri = await stitchImages(frontUri, backUri);
      
      // Set the result
      setCaptureResult({
        frontImage: frontUri,
        backImage: backUri,
        stitchedImage: stitchedImageUri,
      });
    } catch (err) {
      console.error('Error capturing photos:', err);
      setError('Failed to capture photos. Please try again.');
    } finally {
      setCapturing(false);
    }
  };
  
  /**
   * Take photos sequentially (one after the other)
   * Used as a fallback for devices that don't support dual camera
   */
  const takeSequentialCapture = async () => {
    try {
      setCapturing(true);
      setError(null);
      
      // Check if front camera ref is valid (we'll use just the front camera first)
      if (!frontCameraRef.current) {
        throw new Error('Camera not ready');
      }
      
      // First take back camera photo
      const backPhoto = await backCameraRef.current?.takePhoto({
        flash: 'off',
        qualityPrioritization: 'balanced',
        enableShutterSound: false,
      });
      
      // Short delay to allow user to reposition
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Then take front camera photo
      const frontPhoto = await frontCameraRef.current?.takePhoto({
        flash: 'off',
        qualityPrioritization: 'balanced',
        enableShutterSound: false,
      });
      
      if (!frontPhoto || !backPhoto) {
        throw new Error('Failed to capture one or both photos');
      }
      
      // Process the captured photos
      const frontUri = `file://${frontPhoto.path}`;
      const backUri = `file://${backPhoto.path}`;
      
      // Stitch the images together
      const stitchedImageUri = await stitchImages(frontUri, backUri);
      
      // Set the result
      setCaptureResult({
        frontImage: frontUri,
        backImage: backUri,
        stitchedImage: stitchedImageUri,
      });
    } catch (err) {
      console.error('Error in sequential capture:', err);
      setError('Failed to capture photos. Please try again.');
    } finally {
      setCapturing(false);
    }
  };
  
  /**
   * Reset the capture state
   */
  const resetCapture = useCallback(() => {
    setCaptureResult(null);
    setError(null);
  }, []);
  
  /**
   * Retry the capture
   */
  const retryCapture = useCallback(() => {
    resetCapture();
  }, [resetCapture]);
  
  /**
   * Get the stitched image (or create it if it doesn't exist)
   */
  const getStitchedImage = async (): Promise<string> => {
    if (!captureResult) {
      throw new Error('No capture result available');
    }
    
    if (captureResult.stitchedImage) {
      return captureResult.stitchedImage;
    }
    
    // Stitch the images on demand if not already done
    const stitchedUri = await stitchImages(
      captureResult.frontImage,
      captureResult.backImage
    );
    
    // Update the capture result with the stitched image
    setCaptureResult({
      ...captureResult,
      stitchedImage: stitchedUri,
    });
    
    return stitchedUri;
  };
  
  return {
    frontCameraRef,
    backCameraRef,
    capturing,
    dualCameraSupported,
    captureResult,
    timeRemaining,
    error,
    captureImages,
    resetCapture,
    retryCapture,
    takeSequentialCapture,
    getStitchedImage,
  };
};