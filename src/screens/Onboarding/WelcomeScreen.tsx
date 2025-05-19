/**
 * WelcomeScreen
 * 
 * Initial onboarding screen for new users with black and white theme.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../config/theme';
import { onboardingStyles } from './OnboardingStyles';
import { Ionicons } from '@expo/vector-icons';

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation();
  
  const handleNext = () => {
    // @ts-ignore - Navigation typing
    navigation.navigate('Permissions');
  };
  
  return (
    <SafeAreaView style={onboardingStyles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={onboardingStyles.container}>
        {/* Logo */}
        <View style={onboardingStyles.logoContainer}>
          <Text style={onboardingStyles.logoText}>BNOC</Text>
        </View>
        
        <View style={onboardingStyles.contentContainer}>
          {/* Welcome message */}
          <Text style={onboardingStyles.title}>Meet someone new on campus, daily.</Text>
          <Text style={onboardingStyles.description}>
            BNOC pairs you with a new Stanford student each day for a quick selfie moment.
            Build your network, make friends, and never miss a connection.
          </Text>
          
          {/* Features with minimal icons */}
          <View style={{ marginTop: 24 }}>
            <View style={onboardingStyles.featureItem}>
              <View style={onboardingStyles.featureIcon}>
                <Ionicons name="people-outline" size={24} color={COLORS.primary} />
              </View>
              <View style={onboardingStyles.featureText}>
                <Text style={onboardingStyles.featureTitle}>Daily Connections</Text>
                <Text style={onboardingStyles.featureDescription}>
                  Get paired with someone new every day
                </Text>
              </View>
            </View>
            
            <View style={onboardingStyles.featureItem}>
              <View style={onboardingStyles.featureIcon}>
                <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
              </View>
              <View style={onboardingStyles.featureText}>
                <Text style={onboardingStyles.featureTitle}>Capture Moments</Text>
                <Text style={onboardingStyles.featureDescription}>
                  Take selfies to commemorate each new connection
                </Text>
              </View>
            </View>
            
            <View style={onboardingStyles.featureItem}>
              <View style={onboardingStyles.featureIcon}>
                <Ionicons name="school-outline" size={24} color={COLORS.primary} />
              </View>
              <View style={onboardingStyles.featureText}>
                <Text style={onboardingStyles.featureTitle}>Stanford Community</Text>
                <Text style={onboardingStyles.featureDescription}>
                  Exclusive to Stanford students, verified with your .edu email
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Progress indicator */}
        <View style={onboardingStyles.progressContainer}>
          <View style={[onboardingStyles.progressDot, onboardingStyles.progressDotActive]} />
          <View style={onboardingStyles.progressDot} />
          <View style={onboardingStyles.progressDot} />
          <View style={onboardingStyles.progressDot} />
        </View>
        
        {/* Get Started Button */}
        <TouchableOpacity
          style={onboardingStyles.primaryButton}
          onPress={handleNext}
        >
          <Text style={onboardingStyles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default WelcomeScreen;