/**
 * CameraPreview Component
 * 
 * Component for reviewing a captured image before submission.
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Switch,
  Platform
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/colors';
import { globalStyles } from '../../styles/globalStyles';

interface CameraPreviewProps {
  imageUri: string;
  onSubmit: (isPrivate: boolean, imageUri: string) => void;
  onRetake: () => void;
  onCancel: () => void;
  uploading?: boolean;
}

const CameraPreview: React.FC<CameraPreviewProps> = ({
  imageUri,
  onSubmit,
  onRetake,
  onCancel,
  uploading = false,
}) => {
  const [isPrivate, setIsPrivate] = useState(false);
  
  const handleSubmit = () => {
    onSubmit(isPrivate, imageUri);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Preview Photo</Text> 
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={onCancel}
          disabled={uploading}
        >
          <Ionicons name="close" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.previewContainer}>
        <Image 
          source={{ uri: imageUri }} 
          style={styles.previewImage}
          contentFit="contain"
          transition={300}
          cachePolicy="memory"
        />
      </View>
      
      <View style={styles.optionsContainer}>
        <View style={styles.privateContainer}>
          <Ionicons name={isPrivate ? "lock-closed-outline" : "lock-open-outline"} size={24} color="#FFFFFF" style={{marginRight: 10}} />
          <Text style={styles.privateText}>Make this photo private</Text>
          <Switch
            value={isPrivate}
            onValueChange={setIsPrivate}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : isPrivate ? '#FFFFFF' : '#f4f3f4'}
            disabled={uploading}
            style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
          />
        </View>
      </View>
      
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.retakeButton]}
          onPress={onRetake}
          disabled={uploading}
        >
          <Ionicons name="camera-reverse-outline" size={20} color={COLORS.primary} />
          <Text style={styles.retakeButtonText}>Retake</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.submitButton]}
          onPress={handleSubmit}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#000000" />
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
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: Platform.OS === 'ios' ? 55 : 25,
    padding: 5,
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  optionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  privateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  privateText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    height: 50,
  },
  retakeButton: {
    backgroundColor: '#333333',
    marginRight: 10,
  },
  retakeButtonText: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    marginLeft: 10,
  },
  submitButtonText: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: '#000000',
    marginLeft: 8,
  },
});

export default CameraPreview;