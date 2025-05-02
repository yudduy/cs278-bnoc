/**
 * SettingsScreen
 * 
 * Screen for managing app settings including notifications,
 * privacy, and account settings.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../config/theme';
import { globalStyles } from '../../../styles/globalStyles';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';

// SwitchItem Component
interface SwitchItemProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const SwitchItem: React.FC<SwitchItemProps> = ({
  label,
  value,
  onValueChange,
  disabled = false
}) => {
  return (
    <View style={styles.switchItem}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: COLORS.border, true: COLORS.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
};

// TimePickerItem Component
interface TimePickerItemProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

const TimePickerItem: React.FC<TimePickerItemProps> = ({
  label,
  value,
  onChange
}) => {
  // Convert hour to formatted string (e.g., "10:00 PM")
  const formatHour = (hour: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${period}`;
  };
  
  // Handle time selection
  const handleTimePress = () => {
    // In a real app, would show a proper time picker
    // For demo, cycle through a few preset times
    const nextHour = (value + 1) % 24;
    onChange(nextHour);
  };
  
  return (
    <TouchableOpacity 
      style={styles.timePickerItem}
      onPress={handleTimePress}
    >
      <Text style={styles.timePickerLabel}>{label}</Text>
      <View style={styles.timePickerValue}>
        <Text style={styles.timePickerValueText}>
          {formatHour(value)}
        </Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.text} />
      </View>
    </TouchableOpacity>
  );
};

const SettingsScreen: React.FC = () => {
  // Navigation
  const navigation = useNavigation();
  
  // Context
  const { user, signOut } = useAuth();
  const { 
    notificationsEnabled, 
    quietHoursStart, 
    quietHoursEnd,
    toggleNotifications,
    updateQuietHours
  } = useNotifications();
  
  // State
  const [pairingNotification, setPairingNotification] = useState(true);
  const [reminderNotification, setReminderNotification] = useState(true);
  const [completionNotification, setCompletionNotification] = useState(true);
  const [globalFeedOpt, setGlobalFeedOpt] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Load settings
  useEffect(() => {
    // In a real app, would load settings from context or API
    // For demo, just initialize with some values
    setPairingNotification(notificationsEnabled);
    setReminderNotification(notificationsEnabled);
    setCompletionNotification(notificationsEnabled);
  }, [notificationsEnabled]);
  
  // Save notification settings
  const saveNotificationSettings = async () => {
    setSaving(true);
    
    try {
      // In a real app, would call API to save settings
      // For demo, just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Toggle notifications if all are the same value
      if (pairingNotification === reminderNotification && 
          reminderNotification === completionNotification) {
        await toggleNotifications();
      }
      
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };
  
  // Update quiet hours
  const handleQuietHoursChange = async (start: number, end: number) => {
    try {
      await updateQuietHours(start, end);
    } catch (error) {
      console.error('Error updating quiet hours:', error);
    }
  };
  
  // Handle sign out
  const handleSignOut = async () => {
    try {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Sign Out', 
            style: 'destructive',
            onPress: async () => {
              // In a real app, would call auth service
              // For demo, just show a success message
              await new Promise(resolve => setTimeout(resolve, 500));
              Alert.alert('Success', 'Signed out successfully');
              await signOut();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
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
        <View style={styles.headerRight} />
      </View>
      
      <ScrollView style={styles.container}>
        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <SwitchItem 
            label="Daily Pairing Notification"
            value={pairingNotification}
            onValueChange={setPairingNotification}
          />
          
          <SwitchItem 
            label="Reminder Notification"
            value={reminderNotification}
            onValueChange={setReminderNotification}
          />
          
          <SwitchItem 
            label="Completion Notification"
            value={completionNotification}
            onValueChange={setCompletionNotification}
          />
          
          <View style={styles.quietHours}>
            <Text style={styles.quietHoursTitle}>Quiet Hours</Text>
            <Text style={styles.quietHoursDescription}>
              No notifications will be sent during these hours.
            </Text>
            
            <View style={styles.timePickerContainer}>
              <TimePickerItem 
                label="From"
                value={quietHoursStart}
                onChange={(value) => handleQuietHoursChange(value, quietHoursEnd)}
              />
              
              <Text style={styles.timePickerSeparator}>to</Text>
              
              <TimePickerItem 
                label="To"
                value={quietHoursEnd}
                onChange={(value) => handleQuietHoursChange(quietHoursStart, value)}
              />
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={saveNotificationSettings}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Notification Settings</Text>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          
          <SwitchItem 
            label="Show my pairings in global feed"
            value={globalFeedOpt}
            onValueChange={setGlobalFeedOpt}
          />
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Blocked Users</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Export My Data</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
        
        {/* Appearance Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <SwitchItem 
            label="Dark Mode"
            value={darkMode}
            onValueChange={setDarkMode}
          />
        </View>
        
        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Email Preferences</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
        
        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          
          <Text style={styles.versionText}>Daily Meetup Selfie v1.0.0</Text>
        </View>
        
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  headerRight: {
    width: 40,
  },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
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
  },
  quietHours: {
    marginTop: 16,
    marginBottom: 16,
  },
  quietHoursTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
  },
  quietHoursDescription: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timePickerItem: {
    flex: 1,
  },
  timePickerLabel: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  timePickerValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timePickerValueText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.text,
  },
  timePickerSeparator: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.textSecondary,
    marginHorizontal: 16,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.text,
  },
  signOutButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
  },
  signOutButtonText: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  versionText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default SettingsScreen;