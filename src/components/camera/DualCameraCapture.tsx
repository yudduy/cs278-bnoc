/**
 * DualCameraCapture Component
 * 
 * Component for capturing photos from front and back cameras simultaneously.
 * Includes fallback for devices that don't support dual-camera capture.
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { Ionicons } from '@expo/vector-icons';
import { useCamera } from '../../hooks/useCamera';
import { calculateTimeRemaining } from '../../utils/camera/cameraUtils';
import { COLORS } from '../../config/theme';
import { globalStyles } from '../../styles/globalStyles';

interface DualCameraCaptureProps {
  onCaptureComplete: (frontUri: string, backUri: string) => void;
  onCancel: () => void;
  pairingId?: string;
}

const DualCameraCapture: React.FC<DualCameraCaptureProps> = ({
  onCaptureComplete,
  onCancel,
  pairingId,
}) => {
  // Get camera devices
  const devices = useCameraDevices();
  const frontDevice = devices.front;
  const backDevice = devices.back;
  
  // Get camera hook functionality
  const { 
    frontCameraRef,
    backCameraRef,
    capturing,
    dualCameraSupported,
    captureResult,
    timeRemaining,
    error,
    captureImages,
    resetCapture,
    takeSequentialCapture,
  } = useCamera();
  
  // Sequential capture state
  const [sequentialCaptureMode, setSequentialCaptureMode] = useState<'none' | 'back' | 'front'>('none');
  const [sequentialBackImage, setSequentialBackImage] = useState<string | null>(null);
  
  // Handle camera permissions
  const [cameraPermission, setCameraPermission] = useState<string | null>(null);
  
  // Screen dimensions
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Check camera permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      const status = await Camera.getCameraPermissionStatus();
      setCameraPermission(status);
      
      if (status !== 'authorized') {
        const newStatus = await Camera.requestCameraPermission();
        setCameraPermission(newStatus);
        
        if (newStatus !== 'authorized') {
          Alert.alert(
            'Camera Permission Required',
            'Please grant camera permission to capture selfies.',
            [{ text: 'OK', onPress: onCancel }]
          );
        }
      }
    };
    
    checkPermission();
  }, [onCancel]);
  
  // Handle capture result
  useEffect(() => {
    if (captureResult?.frontImage && captureResult?.backImage) {
      onCaptureComplete(captureResult.frontImage, captureResult.backImage);
    }
  }, [captureResult, onCaptureComplete]);
  
  // Handle sequential capture
  const handleSequentialCapture = async () => {
    if (sequentialCaptureMode === 'none') {
      // Start with back camera
      setSequentialCaptureMode('back');
    } else if (sequentialCaptureMode === 'back' && backCameraRef.current) {
      try {
        // Capture back image
        const photo = await backCameraRef.current.takePhoto({
          flash: 'off',
          qualityPrioritization: 'balanced',
          enableShutterSound: false,
        });
        
        const uri = `file://${photo.path}`;
        setSequentialBackImage(uri);
        
        // Switch to front camera
        setSequentialCaptureMode('front');
        
        // Show instructions to switch position
        Alert.alert(
          'Switch Position',
          'Now get ready to take your front-facing selfie!',
          [{ text: 'OK' }]
        );
      } catch (err) {
        console.error('Error in sequential back capture:', err);
        Alert.alert('Error', 'Failed to capture back photo. Please try again.');
        setSequentialCaptureMode('none');
      }
    } else if (sequentialCaptureMode === 'front' && frontCameraRef.current && sequentialBackImage) {
      try {
        // Capture front image
        const photo = await frontCameraRef.current.takePhoto({
          flash: 'off',
          qualityPrioritization: 'balanced',
          enableShutterSound: false,
        });
        
        const uri = `file://${photo.path}`;
        
        // Complete the sequential capture
        onCaptureComplete(uri, sequentialBackImage);
        
        // Reset sequential capture state
        setSequentialCaptureMode('none');
        setSequentialBackImage(null);
      } catch (err) {
        console.error('Error in sequential front capture:', err);
        Alert.alert('Error', 'Failed to capture front photo. Please try again.');
        setSequentialCaptureMode('none');
        setSequentialBackImage(null);
      }
    }
  };
  
  // Determine which camera to show based on sequential capture mode
  const currentDevice = sequentialCaptureMode === 'front' ? frontDevice : backDevice;
  
  // Show loading indicator if devices are not ready
  if (!frontDevice || !backDevice || dualCameraSupported === null) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Initializing camera...</Text>
      </View>
    );
  }
  
  // Show permission denied message if camera permission not granted
  if (cameraPermission !== 'authorized') {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="camera-off-outline" size={64} color={COLORS.error} />
        <Text style={styles.errorText}>Camera permission denied</Text>
        <TouchableOpacity style={styles.button} onPress={onCancel}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Render sequential capture mode
  if (dualCameraSupported === false || sequentialCaptureMode !== 'none') {
    return (
      <View style={styles.container}>
        {/* Sequential camera */}
        {currentDevice && (
          <Camera
            ref={sequentialCaptureMode === 'front' ? frontCameraRef : backCameraRef}
            style={styles.fullScreenCamera}
            device={currentDevice}
            isActive={true}
            photo={true}
            orientation="portrait"
            enableZoomGesture={false}
          />
        )}
        
        {/* Overlay elements */}
        <View style={styles.overlay}>
          {/* Time remaining */}
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={20} color="#FFFFFF" />
            <Text style={styles.timeText}>{timeRemaining.timeString}</Text>
          </View>
          
          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              {sequentialCaptureMode === 'back'
                ? 'Position yourself to capture your surroundings'
                : sequentialCaptureMode === 'front'
                ? 'Now take your selfie!'
                : 'Your device will take photos one at a time'}
            </Text>
          </View>
          
          {/* Capture and cancel buttons */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity 
              style={styles.captureButton}
              onPress={handleSequentialCapture}
              disabled={capturing}
            >
              {capturing ? (
                <ActivityIndicator size="large" color="#FFFFFF" />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={onCancel}
              disabled={capturing}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
  
  // Render dual camera mode
  return (
    <View style={styles.container}>
      {/* Front camera (smaller) */}
      <View style={styles.frontCameraContainer}>
        {frontDevice && (
          <Camera
            ref={frontCameraRef}
            style={styles.frontCamera}
            device={frontDevice}
            isActive={true}
            photo={true}
            orientation="portrait"
            enableZoomGesture={false}
          />
        )}
      </View>
      
      {/* Back camera (fullscreen) */}
      {backDevice && (
        <Camera
          ref={backCameraRef}
          style={styles.fullScreenCamera}
          device={backDevice}
          isActive={true}
          photo={true}
          orientation="portrait"
          enableZoomGesture={false}
        />
      )}
      
      {/* Overlay elements */}
      <View style={styles.overlay}>
        {/* Time remaining */}
        <View style={styles.timeContainer}>
          <Ionicons name="time-outline" size={20} color="#FFFFFF" />
          <Text style={styles.timeText}>{timeRemaining.timeString}</Text>
        </View>
        
        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Position yourself to capture both you and your surroundings
          </Text>
        </View>
        
        {/* Capture and cancel buttons */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={styles.captureButton}
            onPress={captureImages}
            disabled={capturing}
          >
            {capturing ? (
              <ActivityIndicator size="large" color="#FFFFFF" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={capturing}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 16,
  },
  errorText: {
    fontFamily: 'ChivoRegular',
    fontSize: 18,
    color: '#FFFFFF',
    marginVertical: 16,
  },
  fullScreenCamera: {
    flex: 1,
  },
  frontCameraContainer: {
    position: 'absolute',
    top: 80,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  frontCamera: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 20,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: Platform.OS === 'ios' ? 50 : 20,
  },
  timeText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 6,
  },
  instructionsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  instructionsText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 50 : 30,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  cancelButton: {
    position: 'absolute',
    right: 30,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default DualCameraCapture;