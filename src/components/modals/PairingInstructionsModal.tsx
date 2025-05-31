/**
 * PairingInstructionsModal
 * 
 * Instructional modal that explains the together photo process.
 * Shows clear steps and timing before directing users to take their photo.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, BORDER_RADIUS } from '../../config/theme';

interface PairingInstructionsModalProps {
  visible: boolean;
  onProceed: () => void;
  onCancel: () => void;
  partnerName?: string;
}

const PairingInstructionsModal: React.FC<PairingInstructionsModalProps> = ({
  visible,
  onProceed,
  onCancel,
  partnerName = 'your partner'
}) => {
  const steps = [
    {
      number: 1,
      title: 'You take a picture',
      description: 'Take your selfie and submit it',
      icon: 'camera'
    },
    {
      number: 2,
      title: 'They take a picture',
      description: `${partnerName} takes their selfie`,
      icon: 'person'
    },
    {
      number: 3,
      title: 'You both submit',
      description: 'Both photos must be submitted',
      icon: 'checkmark-circle'
    },
    {
      number: 4,
      title: 'Feed publication',
      description: "It won't appear until both submit",
      icon: 'feed'
    }
  ];

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
          <Pressable style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Daily Pairing Photo</Text>
              <Text style={styles.subtitle}>
                Here's how it works with {partnerName}:
              </Text>
            </View>
            
            {/* Steps */}
            <View style={styles.stepsContainer}>
              {steps.map((step, index) => (
                <View key={step.number} style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{step.number}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepDescription}>{step.description}</Text>
                  </View>
                  <Ionicons 
                    name={step.icon as any} 
                    size={24} 
                    color={COLORS.primary} 
                    style={styles.stepIcon}
                  />
                </View>
              ))}
            </View>
            
            {/* Deadline Notice */}
            <View style={styles.deadlineNotice}>
              <Ionicons name="time-outline" size={20} color="#FF6B6B" />
              <Text style={styles.deadlineText}>
                Complete before 10 PM today
              </Text>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity 
                style={styles.proceedButton}
                onPress={onProceed}
                activeOpacity={0.7}
                accessibilityLabel="Take photo"
                accessibilityRole="button"
              >
                <Text style={styles.proceedButtonText}>Take My Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={onCancel}
                activeOpacity={0.7}
                accessibilityLabel="Cancel"
                accessibilityRole="button"
              >
                <Text style={styles.cancelText}>Later</Text>
              </TouchableOpacity>
            </View>
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
    fontSize: 22,
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  stepsContainer: {
    marginBottom: 24,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#333333',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.background,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: 4,
  },
  stepDescription: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  stepIcon: {
    marginLeft: 12,
  },
  deadlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FF6B6B20',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#FF6B6B40',
  },
  deadlineText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#FF6B6B',
    marginLeft: 8,
  },
  buttonsContainer: {
    gap: 12,
  },
  proceedButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  proceedButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.background,
  },
  cancelButton: {
    paddingVertical: 16,
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

export default PairingInstructionsModal; 