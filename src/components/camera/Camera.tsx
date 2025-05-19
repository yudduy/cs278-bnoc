/**
 * CameraCapture Component
 * 
 * Component for capturing photos
 *  */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useCamera, CaptureResult } from '../../hooks/useCamera';
import { COLORS } from '../../config/colors';
import { globalStyles } from '../../styles/globalStyles';

// TODO: Define and import SPACING and TYPOGRAPHY constants from a central theme/constants file
const SPACING_LARGE = 16; // Placeholder for SPACING.large
const SPACING_MEDIUM = 12; // Placeholder for SPACING.medium
const SPACING_SMALL = 8;  // Placeholder for SPACING.small

interface CameraCaptureProps {
  onCaptureComplete: (result: CaptureResult) => void;
  onCancel?: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCaptureComplete, onCancel }) => {
  const {
    cameraRef,
    hasPermission,
    requestPermission,
    captureImage,
    captureResult,
    isCapturing,
    cameraType,
    toggleCameraType,
    flashMode,
    cycleFlashMode,
    CameraViewComponent,
  } = useCamera();

  React.useEffect(() => {
    if (captureResult) {
      onCaptureComplete(captureResult);
    }
  }, [captureResult, onCaptureComplete]);

  const handleCapture = async () => {
    // captureImage is already async and handles logic
    await captureImage();
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={globalStyles.bodyText}>Camera permission is required to take photos.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={globalStyles.primaryButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        {onCancel && (
          <TouchableOpacity style={[styles.permissionButton, styles.cancelButton]} onPress={onCancel}>
            <Text style={globalStyles.primaryButtonText}>Back</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {CameraViewComponent && (
        <CameraViewComponent
          ref={cameraRef}
          style={styles.camera}
          facing={cameraType}
          flash={flashMode}
          // Other CameraView props like onCameraReady, onMountError can be added if needed
        />
      )}
      {isCapturing && (
        <View style={styles.capturingOverlay}>
          <ActivityIndicator size="large" color={COLORS.backgroundLight} />
          <Text style={[globalStyles.bodyText, styles.capturingText]}>Capturing...</Text>
        </View>
      )}
      {!isCapturing && (
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.controlButton} onPress={cycleFlashMode}>
            <MaterialIcons 
              name={flashMode === 'on' ? 'flash-on' : flashMode === 'auto' ? 'flash-auto' : 'flash-off'} 
              size={30} 
              color={COLORS.backgroundLight} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureButton} onPress={handleCapture} disabled={isCapturing}>
            <MaterialIcons name="camera" size={50} color={COLORS.backgroundLight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={toggleCameraType}>
            <MaterialIcons name="flip-camera-ios" size={30} color={COLORS.backgroundLight} />
          </TouchableOpacity>
        </View>
      )}
      {onCancel && !isCapturing && (
         <TouchableOpacity style={styles.backButton} onPress={onCancel}>
            <MaterialIcons name="arrow-back" size={30} color={COLORS.backgroundLight} />
          </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark, // Using backgroundDark for black
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING_LARGE,
    backgroundColor: COLORS.background,
  },
  // Using globalStyles.bodyText for permissionText
  permissionButton: {
    // Similar to globalStyles.primaryButton but with margin
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING_MEDIUM,
    paddingHorizontal: SPACING_LARGE,
    borderRadius: 8, // TODO: use BORDER_RADIUS.medium from a central theme file
    marginBottom: SPACING_MEDIUM,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.secondary,
  },
  // Using globalStyles.primaryButtonText for permissionButtonText
  controlsContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: SPACING_LARGE,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: SPACING_MEDIUM,
  },
  captureButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.backgroundLight, // Using backgroundLight for white
  },
  controlButton: {
    padding: SPACING_SMALL,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 30,
  },
  capturingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  capturingText: {
    // Inherits from globalStyles.bodyText
    color: COLORS.backgroundLight, // Using backgroundLight for white
    marginTop: SPACING_SMALL,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? (SPACING_LARGE + SPACING_MEDIUM) : SPACING_LARGE, // Basic safe area consideration
    left: SPACING_LARGE,
    padding: SPACING_SMALL,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
  }
});

export default CameraCapture;