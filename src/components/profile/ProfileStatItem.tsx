/**
 * ProfileStatItem
 * 
 * Individual stat display component for the user profile, using the black and white theme.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle
} from 'react-native';
import { COLORS, FONTS } from '../../config/theme';

interface ProfileStatItemProps {
  value: number | string;
  label: string;
  style?: ViewStyle;
}

const ProfileStatItem: React.FC<ProfileStatItemProps> = ({
  value,
  label,
  style
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.primary,
    marginBottom: 4,
  },
  label: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
  }
});

export default ProfileStatItem; 