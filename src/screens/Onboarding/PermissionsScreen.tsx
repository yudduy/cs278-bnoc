/**
 * PermissionsScreen
 * 
 * Handles requesting necessary permissions during onboarding.
 * Updated with black and white theme.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Platform,
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/theme';
import { onboardingStyles } from './OnboardingStyles';

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
    <SafeAreaView style={onboardingStyles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={onboardingStyles.container}>
        {/* Header with back button */}
        <View style={onboardingStyles.header}>
          <TouchableOpacity
            style={onboardingStyles.backButton}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={onboardingStyles.headerTitle}>App Permissions</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Title and subtitle */}
          <Text style={onboardingStyles.title}>Enable Access</Text>
          <Text style={onboardingStyles.subtitle}>
            BNOC needs these permissions to connect you with others
          </Text>
          
          {/* Progress indicator */}
          <View style={onboardingStyles.progressContainer}>
            <View style={onboardingStyles.progressDot} />
            <View style={[onboardingStyles.progressDot, onboardingStyles.progressDotActive]} />
            <View style={onboardingStyles.progressDot} />
            <View style={onboardingStyles.progressDot} />
          </View>
          
          {/* Permissions list */}
          <View style={onboardingStyles.permissionsContainer}>
            {/* Camera Permission */}
            <View style={onboardingStyles.permissionItem}>
              <View style={onboardingStyles.permissionInfo}>
                <View style={[onboardingStyles.permissionIcon, { borderColor: cameraPermission ? COLORS.primary : COLORS.border }]}>
                  <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
                </View>
                <View style={onboardingStyles.permissionText}>
                  <Text style={onboardingStyles.permissionTitle}>Camera Access</Text>
                  <Text style={onboardingStyles.permissionDescription}>
                    To take your daily meetup selfie with your partner
                  </Text>
                </View>
              </View>
              <Switch
                value={cameraPermission}
                onValueChange={handleCameraPermission}
                trackColor={{ false: COLORS.border, true: COLORS.backgroundLight }}
                thumbColor={cameraPermission ? COLORS.primary : COLORS.textSecondary}
                ios_backgroundColor={COLORS.border}
              />
            </View>
            
            {/* Notifications Permission */}
            <View style={onboardingStyles.permissionItem}>
              <View style={onboardingStyles.permissionInfo}>
                <View style={[onboardingStyles.permissionIcon, { borderColor: notificationPermission ? COLORS.primary : COLORS.border }]}>
                  <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
                </View>
                <View style={onboardingStyles.permissionText}>
                  <Text style={onboardingStyles.permissionTitle}>Enable Notifications</Text>
                  <Text style={onboardingStyles.permissionDescription}>
                    So you don't miss your daily pair and important updates
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationPermission}
                onValueChange={handleNotificationPermission}
                trackColor={{ false: COLORS.border, true: COLORS.backgroundLight }}
                thumbColor={notificationPermission ? COLORS.primary : COLORS.textSecondary}
                ios_backgroundColor={COLORS.border}
              />
            </View>
          </View>
          
          {/* Info box */}
          <View style={onboardingStyles.infoContainer}>
            <Ionicons name="information-circle-outline" size={24} color={COLORS.textSecondary} />
            <Text style={onboardingStyles.infoText}>
              You can change these permissions later in the app settings.
            </Text>
          </View>
        </ScrollView>
        
        {/* Navigation buttons */}
        <View style={{ marginBottom: 24 }}>
          <TouchableOpacity
            style={[
              onboardingStyles.primaryButton,
              !cameraPermission && onboardingStyles.disabledButton
            ]}
            onPress={handleNext}
            disabled={!cameraPermission}
          >
            <Text style={onboardingStyles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={{ alignItems: 'center', marginTop: 8 }}
            onPress={handleBack}
          >
            <Text style={{ color: COLORS.textSecondary, fontFamily: 'ChivoRegular' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PermissionsScreen;