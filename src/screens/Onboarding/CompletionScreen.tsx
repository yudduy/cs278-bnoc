/**
 * CompletionScreen
 * 
 * Final onboarding screen that congratulates the user and directs them to the main app.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/colors';
import { globalStyles } from '../../styles/globalStyles';

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
    <SafeAreaView style={globalStyles.container}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.checkmarkContainer,
              {
                transform: [{ scale: checkmarkScale }],
                opacity: checkmarkOpacity,
              },
            ]}
          >
            <View style={styles.checkmark}>
              <Ionicons name="checkmark" size={80} color="#FFFFFF" />
            </View>
          </Animated.View>
          
          <Animated.View
            style={[
              styles.textContainer,
              { opacity: textOpacity },
            ]}
          >
            <Text style={styles.title}>You're All Set!</Text>
            <Text style={styles.subtitle}>
              Your profile is ready, and you're all set to start connecting with new people every day.
            </Text>
            
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: COLORS.success }]}>
                  <Ionicons name="people" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Daily Pairings</Text>
                  <Text style={styles.featureDescription}>
                    You'll be paired with someone new every day at 7:00 AM.
                  </Text>
                </View>
              </View>
              
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: COLORS.primary }]}>
                  <Ionicons name="camera" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Take Selfies</Text>
                  <Text style={styles.featureDescription}>
                    Complete your daily pairing by taking a selfie together.
                  </Text>
                </View>
              </View>
              
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: COLORS.accent }]}>
                  <Ionicons name="heart" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Build Connections</Text>
                  <Text style={styles.featureDescription}>
                    Grow your network and make new friends every day.
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </View>
        
        <Animated.View style={{ opacity: buttonOpacity }}>
          <TouchableOpacity
            style={styles.finishButton}
            onPress={handleFinish}
          >
            <Text style={styles.finishButtonText}>Get Started</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkContainer: {
    marginBottom: 40,
  },
  checkmark: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontFamily: 'ChivoBold',
    fontSize: 28,
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  featuresContainer: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  finishButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  finishButtonText: {
    fontFamily: 'ChivoBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
});

export default CompletionScreen;