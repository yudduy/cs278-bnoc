/**
 * PermissionsScreen
 * 
 * Handles requesting necessary permissions during onboarding.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/colors';
import { globalStyles } from '../../styles/globalStyles';

const PermissionsScreen: React.FC = () => {
  const navigation = useNavigation();
  
  // State for permission switches
  const [cameraPermission, setCameraPermission] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(false);
  
  const handleCameraPermission = () => {
    // In a real app, would ask for camera permission
    setCameraPermission(!cameraPermission);
  };
  
  const handleNotificationPermission = () => {
    // In a real app, would ask for notification permission
    setNotificationPermission(!notificationPermission);
  };
  
  const handleNext = () => {
    // Check if all required permissions are granted
    if (!cameraPermission) {
      alert('Camera permission is required to use the app. Please enable it to continue.');
      return;
    }
    
    // @ts-ignore - Navigation typing
    navigation.navigate('ProfileSetup');
  };
  
  const handleBack = () => {
    navigation.goBack();
  };
  
  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Permissions</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>App Permissions</Text>
          <Text style={styles.subtitle}>
            Daily Meetup needs a few permissions to work properly.
          </Text>
          
          <View style={styles.permissionsContainer}>
            <View style={styles.permissionItem}>
              <View style={styles.permissionInfo}>
                <View style={[styles.permissionIcon, { backgroundColor: COLORS.primary }]}>
                  <Ionicons name="camera" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.permissionText}>
                  <Text style={styles.permissionTitle}>Camera</Text>
                  <Text style={styles.permissionDescription}>
                    Required to take selfies for your daily pairings.
                  </Text>
                </View>
              </View>
              <Switch
                value={cameraPermission}
                onValueChange={handleCameraPermission}
                trackColor={{ false: COLORS.borderDark, true: COLORS.primary }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : cameraPermission ? '#FFFFFF' : '#F5F5F5'}
              />
            </View>
            
            <View style={styles.permissionItem}>
              <View style={styles.permissionInfo}>
                <View style={[styles.permissionIcon, { backgroundColor: COLORS.accent }]}>
                  <Ionicons name="notifications" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.permissionText}>
                  <Text style={styles.permissionTitle}>Notifications</Text>
                  <Text style={styles.permissionDescription}>
                    Get notified about your daily pairings and when your partner completes a selfie.
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationPermission}
                onValueChange={handleNotificationPermission}
                trackColor={{ false: COLORS.borderDark, true: COLORS.accent }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : notificationPermission ? '#FFFFFF' : '#F5F5F5'}
              />
            </View>
          </View>
          
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={24} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>
              You can change these permissions later in the app settings.
            </Text>
          </View>
        </ScrollView>
        
        <TouchableOpacity
          style={[
            styles.nextButton,
            !cameraPermission && styles.disabledButton
          ]}
          onPress={handleNext}
          disabled={!cameraPermission}
        >
          <Text style={styles.nextButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
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
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  title: {
    fontFamily: 'ChivoBold',
    fontSize: 24,
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
  },
  permissionsContainer: {
    marginBottom: 32,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
  },
  permissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  permissionText: {
    flex: 1,
  },
  permissionTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 4,
  },
  permissionDescription: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  nextButton: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.disabled,
  },
  nextButtonText: {
    fontFamily: 'ChivoBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
});

export default PermissionsScreen;