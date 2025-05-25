/**
 * PhotoModeSelectionModal
 * 
 * Enhanced modal for selecting photo capture mode when taking pairing photos.
 * Allows users to choose between individual or together photo submission.
 * Supports both regular selection and planner mode contexts.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, BORDER_RADIUS } from '../../config/theme';

export type PhotoMode = 'individual' | 'together';

interface PhotoModeSelectionModalProps {
  visible: boolean;
  onSelectMode: (mode: PhotoMode) => void;
  onCancel: () => void;
  partnerName?: string;
  /** If true, shows planner mode messaging (first user to arrive) */
  isPlannerMode?: boolean;
  /** Custom title override */
  customTitle?: string;
  /** Custom subtitle override */
  customSubtitle?: string;
  /** Accessibility label for the modal */
  accessibilityLabel?: string;
}

const PhotoModeSelectionModal: React.FC<PhotoModeSelectionModalProps> = ({
  visible,
  onSelectMode,
  onCancel,
  partnerName = 'your partner',
  isPlannerMode = false,
  customTitle,
  customSubtitle,
  accessibilityLabel = 'Photo mode selection modal'
}) => {
  // Handle mode selection with validation
  const handleModeSelection = (mode: PhotoMode) => {
    if (!mode) {
      console.warn('PhotoModeSelectionModal: Invalid mode selected');
      return;
    }
    onSelectMode(mode);
  };

  // Generate dynamic title and subtitle based on mode
  const getTitle = () => {
    if (customTitle) return customTitle;
    return 'Choose Photo Mode';
  };

  const getSubtitle = () => {
    if (customSubtitle) return customSubtitle;
    
    if (isPlannerMode) {
      return `You're the first to arrive! How would you like to take today's photo with ${partnerName}?`;
    }
    
    return 'How would you like to take today\'s pairing photo?';
  };

  const getTogetherDescription = () => {
    if (isPlannerMode) {
      return 'Meet up and take one photo together. You\'ll both need to be in the same location.';
    }
    return `Both you and ${partnerName} need to submit photos. Your pairing will appear in the feed once both photos are submitted.`;
  };

  const getIndividualDescription = () => {
    if (isPlannerMode) {
      return 'Each take your own photo separately. You can be anywhere and submit when convenient.';
    }
    return 'Only you need to submit a photo. Your pairing will appear in the feed immediately after submission.';
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
      accessibilityViewIsModal={true}
    >
      <Pressable 
        style={styles.overlay} 
        onPress={onCancel}
        accessibilityLabel="Close modal"
        accessibilityRole="button"
      >
        <View style={styles.modalContainer}>
          <Pressable 
            style={styles.modal}
            accessibilityLabel={accessibilityLabel}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{getTitle()}</Text>
              <Text style={styles.subtitle}>
                {getSubtitle()}
              </Text>
            </View>
            
            {/* Options */}
            <View style={styles.optionsContainer}>
              {/* Take Together Option */}
              <TouchableOpacity 
                style={styles.option}
                onPress={() => handleModeSelection('together')}
                activeOpacity={0.7}
                accessibilityLabel="Take photo together"
                accessibilityRole="button"
                accessibilityHint="Select to take one photo together with your partner"
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="people" size={32} color={COLORS.primary} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Take Together</Text>
                  <Text style={styles.optionDescription}>
                    {getTogetherDescription()}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
              
              {/* Take Individually Option */}
              <TouchableOpacity 
                style={styles.option}
                onPress={() => handleModeSelection('individual')}
                activeOpacity={0.7}
                accessibilityLabel="Take photo individually"
                accessibilityRole="button"
                accessibilityHint="Select to take separate photos independently"
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="person" size={32} color={COLORS.primary} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Take Individually</Text>
                  <Text style={styles.optionDescription}>
                    {getIndividualDescription()}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {/* Cancel Button */}
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.7}
              accessibilityLabel="Cancel"
              accessibilityRole="button"
              accessibilityHint="Close modal without selecting a photo mode"
            >
              <Text style={styles.cancelText}>
                {isPlannerMode ? 'Cancel' : 'Back'}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  modal: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: BORDER_RADIUS.lg,
    padding: 24,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: 4,
  },
  optionDescription: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  cancelText: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});

export default PhotoModeSelectionModal; 