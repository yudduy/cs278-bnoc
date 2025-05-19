/**
 * useCamera Hook
 * 
 * Custom hook for managing camera functionality, including
 * dual-camera capture, device compatibility, and image processing.
 */

import { useState, useRef, useEffect } from 'react';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';

export interface CaptureResult {
  imageUri: string | null;
  error: string | null;
}

export const useCamera = () => {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [captureResult, setCaptureResult] = useState<CaptureResult | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const captureImage = async () => {
    if (!cameraRef.current || isCapturing) {
      setCaptureResult({ imageUri: null, error: 'Camera not ready or already capturing.' });
      return;
    }
    if (!permission?.granted) {
      setCaptureResult({ imageUri: null, error: 'Camera permission not granted.' });
      return;
    }
    setIsCapturing(true);
    setCaptureResult(null); // Clear previous result
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
      });
      setCaptureResult({ imageUri: photo.uri, error: null });
    } catch (error) {
      console.error('Error capturing image:', error);
      setCaptureResult({ imageUri: null, error: 'Failed to capture image.' });
    } finally {
      setIsCapturing(false);
    }
  };

  const toggleCameraType = () => {
    setCameraType((prevType: CameraType) => (prevType === 'back' ? 'front' : 'back'));
  };

  const cycleFlashMode = () => {
    setFlashMode((prevMode: FlashMode) => {
      if (prevMode === 'off') return 'on';
      if (prevMode === 'on') return 'auto';
      if (prevMode === 'auto') return 'off';
      return 'off';
    });
  };

  return {
    cameraRef,
    hasPermission: permission?.granted ?? null,
    requestPermission,
    captureImage,
    captureResult,
    isCapturing,
    cameraType,
    toggleCameraType,
    flashMode,
    cycleFlashMode,
    CameraViewComponent: CameraView, // Exporting CameraView for direct use in the component
  };
};