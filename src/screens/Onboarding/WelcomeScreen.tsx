/**
 * WelcomeScreen
 * 
 * Initial onboarding screen for new users.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../config/colors';
import { globalStyles } from '../../styles/globalStyles';

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation();
  
  const handleNext = () => {
    // @ts-ignore - Navigation typing
    navigation.navigate('Permissions');
  };
  
  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Daily Meetup</Text>
          <Text style={styles.subtitle}>Connect with your peers every day</Text>
        </View>
        
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: 'https://picsum.photos/500/500?random=welcome' }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
        
        <View style={styles.content}>
          <Text style={styles.description}>
            Daily Meetup pairs you with someone new every day for a quick selfie moment.
            Build your network, one meetup at a time.
          </Text>
          
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Text style={styles.featureTitle}>Daily Pairings</Text>
              <Text style={styles.featureDescription}>
                Get paired with someone new every day
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureTitle}>Selfie Moments</Text>
              <Text style={styles.featureDescription}>
                Capture a selfie together to complete the pairing
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureTitle}>Expand Your Network</Text>
              <Text style={styles.featureDescription}>
                Meet new people and build connections
              </Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  header: {
    marginTop: 40,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'ChivoBold',
    fontSize: 28,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'ChivoRegular',
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  image: {
    width: 250,
    height: 250,
    borderRadius: 20,
  },
  content: {
    marginTop: 40,
  },
  description: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  features: {
    marginBottom: 32,
  },
  featureItem: {
    marginBottom: 20,
  },
  featureTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    fontFamily: 'ChivoBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
});

export default WelcomeScreen;