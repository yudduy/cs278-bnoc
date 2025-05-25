/**
 * PostOptionsModal Component
 * 
 * Context-aware options modal for feed posts.
 * Shows different options based on user relationship to the post.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, BORDER_RADIUS } from '../../config/theme';
import { Pairing } from '../../types';

interface PostOptionsModalProps {
  visible: boolean;
  pairing: Pairing;
  currentUserId: string;
  onClose: () => void;
  onReport: () => void;
  onRetake: () => void;
}

const PostOptionsModal: React.FC<PostOptionsModalProps> = ({
  visible,
  pairing,
  currentUserId,
  onClose,
  onReport,
  onRetake,
}) => {
  // Check if current user is a participant in this pairing
  const isParticipant = pairing.user1_id === currentUserId || pairing.user2_id === currentUserId;

  const handleRetakePress = () => {
    onClose(); // Close modal first
    
    // Show confirmation dialog
    Alert.alert(
      "Retake Photo?",
      "This will replace your current photo but keep your partner's photo.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Retake", 
          onPress: onRetake,
          style: "default"
        }
      ]
    );
  };

  const handleReportPress = () => {
    onClose(); // Close modal first
    
    // Show confirmation dialog for reporting
    Alert.alert(
      "Report Post",
      "Are you sure you want to report this post? Our team will review it.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Report", 
          onPress: onReport,
          style: "destructive"
        }
      ]
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Post Options</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {isParticipant ? (
                // Options for participants
                <TouchableOpacity 
                  style={styles.option}
                  onPress={handleRetakePress}
                >
                  <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
                  <Text style={styles.optionText}>Retake Photo</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              ) : (
                // Options for non-participants
                <TouchableOpacity 
                  style={styles.option}
                  onPress={handleReportPress}
                >
                  <Ionicons name="flag-outline" size={24} color="#FF4444" />
                  <Text style={[styles.optionText, styles.reportText]}>Report Post</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              )}

              {/* Common options (if any) */}
              <TouchableOpacity 
                style={styles.option}
                onPress={onClose}
              >
                <Ionicons name="share-outline" size={24} color={COLORS.primary} />
                <Text style={styles.optionText}>Share</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingBottom: 20,
    maxHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.primary,
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  optionText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 16,
  },
  reportText: {
    color: '#FF4444', // Red color for report option
  },
});

export default PostOptionsModal;
