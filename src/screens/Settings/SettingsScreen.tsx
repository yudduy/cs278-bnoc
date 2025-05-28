/**
 * SettingsScreen
 * 
 * Main settings screen for the app
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../config/theme';

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const settingsOptions = [
    {
      title: 'Notifications',
      icon: 'notifications-outline',
      onPress: () => navigation.navigate('NotificationsScreen'),
    },
    {
      title: 'Privacy',
      icon: 'shield-outline',
      onPress: () => navigation.navigate('PrivacyScreen'),
    },
    {
      title: 'Blocked Users',
      icon: 'ban-outline',
      onPress: () => navigation.navigate('BlockedUsersScreen'),
    },
    {
      title: 'Help',
      icon: 'help-circle-outline',
      onPress: () => navigation.navigate('HelpScreen'),
    },
    {
      title: 'About',
      icon: 'information-circle-outline',
      onPress: () => navigation.navigate('AboutScreen'),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {settingsOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.settingItem}
            onPress={option.onPress}
          >
            <View style={styles.settingLeft}>
              <Ionicons name={option.icon as any} size={24} color={COLORS.primary} />
              <Text style={styles.settingTitle}>{option.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.card,
    marginBottom: SPACING.sm,
    borderRadius: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: COLORS.text,
    marginLeft: SPACING.md,
  },
});

export default SettingsScreen; 