/**
 * CompletionScreen
 * 
 * Final onboarding screen that congratulates the user and directs them to the main app.
 * Updated with black and white theme.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Easing,
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/theme';
import { onboardingStyles } from './OnboardingStyles';

const CompletionScreen: React.FC = () => {
  const navigation = useNavigation();
  
  // Animation values
  const checkmarkScale = new Animated.Value(0);
  const checkmarkOpacity = new Animated.Value(0);
  const textOpacity = new Animated.Value(0);
  const buttonOpacity = new Animated.Value(0);
  
  // Start animations when component mounts
  useEffect(() => {
    // Sequence animations
    Animated.sequence([
      // Checkmark animation
      Animated.parallel([
        Animated.timing(checkmarkScale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.elastic(1.2),
        }),
        Animated.timing(checkmarkOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Text animation
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }),
      // Button animation
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const handleFinish = () => {
    // In a real app, would set onboarding complete flag
    // For demo, navigate to main app
    // @ts-ignore - Navigation typing
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };
  
  return (
    <SafeAreaView style={onboardingStyles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={onboardingStyles.container}>
        {/* Progress indicator */}
        <View style={onboardingStyles.progressContainer}>
          <View style={onboardingStyles.progressDot} />
          <View style={onboardingStyles.progressDot} />
          <View style={onboardingStyles.progressDot} />
          <View style={[onboardingStyles.progressDot, onboardingStyles.progressDotActive]} />
        </View>
        
        <View style={[onboardingStyles.contentContainer, { alignItems: 'center' }]}>
          {/* Animated checkmark */}
          <Animated.View
            style={[
              onboardingStyles.checkmarkContainer,
              {
                transform: [{ scale: checkmarkScale }],
                opacity: checkmarkOpacity,
              },
            ]}
          >
            <View style={onboardingStyles.checkmark}>
              <Ionicons name="checkmark" size={80} color={COLORS.primary} />
            </View>
          </Animated.View>
          
          {/* Animated text content */}
          <Animated.View
            style={[
              { alignItems: 'center', width: '100%' },
              { opacity: textOpacity },
            ]}
          >
            <Text style={onboardingStyles.title}>You're All Set!</Text>
            <Text style={onboardingStyles.subtitle}>
              Your profile is ready. Now you can start connecting with Stanford students daily.
            </Text>
            
            {/* Features list */}
            <View style={{ width: '100%', marginTop: 32 }}>
              <View style={onboardingStyles.featureItem}>
                <View style={onboardingStyles.featureIcon}>
                  <Ionicons name="people-outline" size={24} color={COLORS.primary} />
                </View>
                <View style={onboardingStyles.featureText}>
                  <Text style={onboardingStyles.featureTitle}>Daily Connections</Text>
                  <Text style={onboardingStyles.featureDescription}>
                    You'll be paired with someone new each day
                  </Text>
                </View>
              </View>
              
              <View style={onboardingStyles.featureItem}>
                <View style={onboardingStyles.featureIcon}>
                  <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
                </View>
                <View style={onboardingStyles.featureText}>
                  <Text style={onboardingStyles.featureTitle}>Selfie Moments</Text>
                  <Text style={onboardingStyles.featureDescription}>
                    Take selfies to commemorate your daily connections
                  </Text>
                </View>
              </View>
              
              <View style={onboardingStyles.featureItem}>
                <View style={onboardingStyles.featureIcon}>
                  <Ionicons name="star-outline" size={24} color={COLORS.primary} />
                </View>
                <View style={onboardingStyles.featureText}>
                  <Text style={onboardingStyles.featureTitle}>Build Your Network</Text>
                  <Text style={onboardingStyles.featureDescription}>
                    Expand your Stanford connections one day at a time
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </View>
        
        {/* Animated button */}
        <Animated.View style={{ opacity: buttonOpacity, marginBottom: 24 }}>
          <TouchableOpacity
            style={onboardingStyles.primaryButton}
            onPress={handleFinish}
          >
            <Text style={onboardingStyles.primaryButtonText}>Enter BNOC</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

export default CompletionScreen;