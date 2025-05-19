/**
 * PrimaryButton
 * 
 * Primary button component for the app, following the black and white theme.
 */

import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle,
  TextStyle
} from 'react-native';
import { COLORS, FONTS, BORDER_RADIUS } from '../../config/theme';
import { Ionicons } from '@expo/vector-icons';

interface PrimaryButtonProps {
  onPress: () => void;
  text: string;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  onPress,
  text,
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled || loading ? styles.buttonDisabled : null,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.background} size="small" />
      ) : (
        <>
          {icon && <Ionicons name={icon as any} size={20} color={COLORS.background} style={styles.icon} />}
          <Text style={[styles.text, textStyle]}>{text}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  text: {
    color: COLORS.background,
    fontFamily: FONTS.bold,
    fontSize: 16,
    textAlign: 'center',
  },
  icon: {
    marginRight: 8,
  },
});

export default PrimaryButton; 