/**
 * SettingsScreen
 * 
 * Enhanced settings screen with notification preferences, privacy controls, and account settings.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { COLORS } from '../../config/theme';
import { globalStyles } from '../../styles/globalStyles';
import { useAuth } from '../../context/AuthContext';
import { NotificationSettings } from '../../types';
import firebaseService from '../../services/firebase';

// Settings Section component
const SettingsSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

// Switch Item component
const SwitchItem: React.FC<{
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}> = ({ label, value, onValueChange, disabled = false }) => (
  <View style={styles.switchItem}>
    <Text style={[styles.switchLabel, disabled && styles.disabledText]}>
      {label}
    </Text>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: COLORS.border, true: COLORS.primary }}
      thumbColor={Platform.OS === 'ios' ? undefined : value ? '#fff' : '#f4f3f4'}
      disabled={disabled}
    />
  </View>
);

// Link Button component
const LinkButton: React.FC<{
  label: string;
  icon?: string;
  onPress: () => void;
  color?: string;
}> = ({ label, icon, onPress, color = COLORS.text }) => (
  <TouchableOpacity style={styles.linkButton} onPress={onPress}>
    <View style={styles.linkButtonContent}>
      {icon && (
        <Ionicons
          name={icon as any}
          size={22}
          color={color}
          style={styles.linkButtonIcon}
        />
      )}
      <Text style={[styles.linkButtonLabel, { color }]}>{label}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
  </TouchableOpacity>
);

// Time Selector component
const TimeSelector: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
}> = ({ label, value, onChange }) => {
  // Format value as time (e.g., "10:00 PM")
  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:00 ${period}`;
  };
  
  return (
    <View style={styles.timeSelector}>
      <Text style={styles.timeSelectorLabel}>{label}</Text>
      <Text style={styles.timeSelectorValue}>{formatTime(value)}</Text>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={23}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={COLORS.primary}
        maximumTrackTintColor={COLORS.border}
        thumbTintColor={COLORS.primary}
      />
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>12 AM</Text>
        <Text style={styles.sliderLabel}>12 PM</Text>
        <Text style={styles.sliderLabel}>11 PM</Text>
      </View>
    </View>
  );
};

const SettingsScreen: React.FC = () => {
  // Navigation
  const navigation = useNavigation();
  
  // Auth context
  const { user, signOut } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    pairingNotification: true,
    reminderNotification: true,
    completionNotification: true,
    quietHoursStart: 22,
    quietHoursEnd: 8,
  });
  const [globalFeedOptIn, setGlobalFeedOptIn] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  
  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Get user data
        const userData = await firebaseService.getUserById(user.id);
        
        if (userData && userData.notificationSettings) {
          setNotificationSettings(userData.notificationSettings);
        }
        
        // Mock privacy settings
        setGlobalFeedOptIn(true);
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [user]);
  
  // Track unsaved changes
  useEffect(() => {
    if (!loading) {
      setUnsavedChanges(true);
    }
  }, [notificationSettings, globalFeedOptIn]);
  
  // Handle notification settings change
  const handleNotificationSettingChange = (
    setting: keyof NotificationSettings,
    value: boolean | number
  ) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: value,
    }));
  };
  
  // Save notification settings
  const saveNotificationSettings = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      await firebaseService.updateUserNotificationSettings(
        user.id,
        notificationSettings
      );
      
      // Update privacy settings
      await firebaseService.updateUserPrivacySettings(user.id, {
        globalFeedOptIn,
      });
      
      setUnsavedChanges(false);
      
      Alert.alert('Success', 'Your settings have been saved.');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle blocked users
  const navigateToBlockedUsers = () => {
    Alert.alert('Coming Soon', 'Blocked users management will be available in a future update.');
  };
  
  // Handle export data
  const handleExportData = () => {
    Alert.alert(
      'Export My Data',
      'This will generate a file with all your data that you can download. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Export',
          onPress: () => {
            Alert.alert('Coming Soon', 'Data export will be available in a future update.');
          },
        },
      ]
    );
  };
  
  // Handle change password
  const handleChangePassword = () => {
    Alert.alert('Coming Soon', 'Password change will be available in a future update.');
  };
  
  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  // Handle legal documents
  const handleViewPrivacyPolicy = () => {
    Alert.alert('Coming Soon', 'Privacy Policy will be available in a future update.');
  };
  
  const handleViewTerms = () => {
    Alert.alert('Coming Soon', 'Terms of Service will be available in a future update.');
  };
  
  if (loading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.rightHeaderPlaceholder} />
      </View>
      
      <ScrollView style={styles.container}>
        {/* Notifications Section */}
        <SettingsSection title="Notifications">
          <SwitchItem
            label="Enable Push Notifications"
            value={pushEnabled}
            onValueChange={(value) => {
              setPushEnabled(value);
              if (!value) {
                // Disable all other notification settings
                setNotificationSettings(prev => ({
                  ...prev,
                  pairingNotification: false,
                  reminderNotification: false,
                  completionNotification: false,
                }));
              }
            }}
          />
          
          <SwitchItem
            label="Daily Pairing Notification"
            value={notificationSettings.pairingNotification}
            onValueChange={(value) =>
              handleNotificationSettingChange('pairingNotification', value)
            }
            disabled={!pushEnabled}
          />
          
          <SwitchItem
            label="Reminder Notification"
            value={notificationSettings.reminderNotification}
            onValueChange={(value) =>
              handleNotificationSettingChange('reminderNotification', value)
            }
            disabled={!pushEnabled}
          />
          
          <SwitchItem
            label="Completion Notification"
            value={notificationSettings.completionNotification}
            onValueChange={(value) =>
              handleNotificationSettingChange('completionNotification', value)
            }
            disabled={!pushEnabled}
          />
          
          <View style={styles.quietHoursContainer}>
            <Text style={styles.quietHoursTitle}>Quiet Hours</Text>
            <Text style={styles.quietHoursDescription}>
              No notifications will be sent during these hours.
            </Text>
            
            <TimeSelector
              label="From"
              value={notificationSettings.quietHoursStart}
              onChange={(value) =>
                handleNotificationSettingChange('quietHoursStart', value)
              }
            />
            
            <TimeSelector
              label="To"
              value={notificationSettings.quietHoursEnd}
              onChange={(value) =>
                handleNotificationSettingChange('quietHoursEnd', value)
              }
            />
          </View>
        </SettingsSection>
        
        {/* Privacy Section */}
        <SettingsSection title="Privacy">
          <SwitchItem
            label="Show my pairings in global feed"
            value={globalFeedOptIn}
            onValueChange={setGlobalFeedOptIn}
          />
          
          <LinkButton
            label="Blocked Users"
            icon="person-remove-outline"
            onPress={navigateToBlockedUsers}
          />
          
          <LinkButton
            label="Export My Data"
            icon="download-outline"
            onPress={handleExportData}
          />
        </SettingsSection>
        
        {/* Account Section */}
        <SettingsSection title="Account">
          <LinkButton
            label="Change Password"
            icon="key-outline"
            onPress={handleChangePassword}
          />
          
          <LinkButton
            label="Sign Out"
            icon="log-out-outline"
            onPress={handleSignOut}
            color={COLORS.error}
          />
        </SettingsSection>
        
        {/* About Section */}
        <SettingsSection title="About">
          <LinkButton
            label="Privacy Policy"
            icon="document-text-outline"
            onPress={handleViewPrivacyPolicy}
          />
          
          <LinkButton
            label="Terms of Service"
            icon="document-outline"
            onPress={handleViewTerms}
          />
          
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </SettingsSection>
        
        {/* Footer (save button) */}
        {unsavedChanges && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveNotificationSettings}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        )}
        
        {/* Footer padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 18,
    color: COLORS.text,
  },
  rightHeaderPlaceholder: {
    width: 40,
  },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 20,
  },
  sectionTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 16,
  },
  switchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  switchLabel: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
    marginRight: 16,
  },
  disabledText: {
    color: COLORS.textSecondary,
  },
  quietHoursContainer: {
    marginTop: 16,
  },
  quietHoursTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 4,
  },
  quietHoursDescription: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  timeSelector: {
    marginBottom: 20,
  },
  timeSelectorLabel: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
  },
  timeSelectorValue: {
    fontFamily: 'ChivoBold',
    fontSize: 18,
    color: COLORS.primary,
    marginBottom: 12,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -12,
  },
  sliderLabel: {
    fontFamily: 'ChivoRegular',
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  linkButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  linkButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkButtonIcon: {
    marginRight: 12,
  },
  linkButtonLabel: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.text,
  },
  versionText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default SettingsScreen;
