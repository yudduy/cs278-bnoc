/**
 * CameraPreview Component
 * 
 * Component for reviewing captured images before submission.
 * Shows front and back camera images and allows submission or retake.
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Switch,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/theme';
import { globalStyles } from '../../styles/globalStyles';
import { stitchImages } from '../../utils/camera/cameraUtils';

interface CameraPreviewProps {
  frontImageUri: string;
  backImageUri: string;
  onSubmit: (isPrivate: boolean) => void;
  onRetake: () => void;
  onCancel: () => void;
  uploading?: boolean;
}

const CameraPreview: React.FC<CameraPreviewProps> = ({
  frontImageUri,
  backImageUri,
  onSubmit,
  onRetake,
  onCancel,
  uploading = false,
}) => {
  // State
  const [currentView, setCurrentView] = useState<'front' | 'back' | 'stitched'>('stitched');
  const [isPrivate, setIsPrivate] = useState(false);
  const [stitchedImage, setStitchedImage] = useState<string | null>(null);
  const [stitchLoading, setStitchLoading] = useState(true);
  
  // Stitch images on component mount
  useEffect(() => {
    const createStitchedImage = async () => {
      try {
        setStitchLoading(true);
        const stitchedUri = await stitchImages(frontImageUri, backImageUri);
        setStitchedImage(stitchedUri);
      } catch (error) {
        console.error('Error stitching images:', error);
        Alert.alert('Error', 'Failed to combine images. You can still submit them separately.');
      } finally {
        setStitchLoading(false);
      }
    };
    
    createStitchedImage();
  }, [frontImageUri, backImageUri]);
  
  // Handle submission
  const handleSubmit = () => {
    onSubmit(isPrivate);
  };
  
  // Render current image based on selected view
  const renderCurrentImage = () => {
    if (currentView === 'front') {
      return (
        <Image 
          source={{ uri: frontImageUri }} 
          style={styles.previewImage}
          resizeMode="contain"
        />
      );
    } else if (currentView === 'back') {
      return (
        <Image 
          source={{ uri: backImageUri }} 
          style={styles.previewImage}
          resizeMode="contain"
        />
      );
    } else {
      // Stitched view
      if (stitchLoading) {
        return (
          <View style={[styles.previewImage, styles.loaderContainer]}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Creating combined view...</Text>
          </View>
        );
      }
      
      if (stitchedImage) {
        return (
          <Image 
            source={{ uri: stitchedImage }} 
            style={styles.previewImage}
            resizeMode="contain"
          />
        );
      } else {
        // Fallback to showing front and back side by side
        return (
          <View style={styles.sideBySideContainer}>
            <Image 
              source={{ uri: frontImageUri }} 
              style={styles.halfImage}
              resizeMode="cover"
            />
            <Image 
              source={{ uri: backImageUri }} 
              style={styles.halfImage}
              resizeMode="cover"
            />
          </View>
        );
      }
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Preview header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Preview Selfie</Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={onCancel}
          disabled={uploading}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {/* Preview image */}
      <View style={styles.previewContainer}>
        {renderCurrentImage()}
      </View>
      
      {/* View selection tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            currentView === 'stitched' && styles.activeTab
          ]}
          onPress={() => setCurrentView('stitched')}
          disabled={uploading}
        >
          <Ionicons 
            name="images-outline" 
            size={20} 
            color={currentView === 'stitched' ? COLORS.primary : COLORS.textSecondary} 
          />
          <Text 
            style={[
              styles.tabText,
              currentView === 'stitched' && styles.activeTabText
            ]}
          >
            Combined
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            currentView === 'front' && styles.activeTab
          ]}
          onPress={() => setCurrentView('front')}
          disabled={uploading}
        >
          <Ionicons 
            name="person-outline" 
            size={20} 
            color={currentView === 'front' ? COLORS.primary : COLORS.textSecondary} 
          />
          <Text 
            style={[
              styles.tabText,
              currentView === 'front' && styles.activeTabText
            ]}
          >
            Selfie
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            currentView === 'back' && styles.activeTab
          ]}
          onPress={() => setCurrentView('back')}
          disabled={uploading}
        >
          <Ionicons 
            name="camera-outline" 
            size={20} 
            color={currentView === 'back' ? COLORS.primary : COLORS.textSecondary} 
          />
          <Text 
            style={[
              styles.tabText,
              currentView === 'back' && styles.activeTabText
            ]}
          >
            Environment
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Private mode toggle */}
      <View style={styles.privateContainer}>
        <Text style={styles.privateText}>Make this selfie private</Text>
        <Switch
          value={isPrivate}
          onValueChange={setIsPrivate}
          trackColor={{ false: COLORS.border, true: COLORS.primary }}
          thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : isPrivate ? '#FFFFFF' : '#f4f3f4'}
          disabled={uploading}
        />
      </View>
      
      {/* Action buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.retakeButton}
          onPress={onRetake}
          disabled={uploading}
        >
          <Text style={styles.retakeButtonText}>Retake</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Submit</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: Platform.OS === 'ios' ? 50 : 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#111',
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 12,
  },
  sideBySideContainer: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
  },
  halfImage: {
    width: '50%',
    height: '100%',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#111',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: 'rgba(153, 0, 0, 0.1)',
  },
  tabText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  activeTabText: {
    color: COLORS.primary,
    fontFamily: 'ChivoBold',
  },
  privateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  privateText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: '#FFFFFF',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 50 : 20,
    backgroundColor: '#111',
  },
  retakeButton: {
    flex: 1,
    paddingVertical: 14,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
  },
  retakeButtonText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.primary,
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  submitButtonText: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default CameraPreview;