/**
 * FlakeStreakDisplay Component
 * 
 * Enhanced visualization of a user's flake streak with animations.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { COLORS } from '../../config/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface FlakeStreakDisplayProps {
  currentStreak: number;
  maxStreak: number;
}

const FlakeStreakDisplay: React.FC<FlakeStreakDisplayProps> = ({
  currentStreak,
  maxStreak,
}) => {
  // Cap displayed streak at 7+
  const displayedStreak = currentStreak >= 7 ? '7+' : currentStreak.toString();
  
  // Animation for pulse effect
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Start pulse animation if there's an active streak
  useEffect(() => {
    if (currentStreak > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
    
    return () => {
      pulseAnim.stopAnimation();
    };
  }, [currentStreak, pulseAnim]);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Current Flake Streak</Text>
      
      <Animated.View 
        style={[
          styles.streakDisplay,
          { transform: [{ scale: currentStreak > 0 ? pulseAnim : 1 }] },
          currentStreak > 0 ? styles.activeStreak : styles.noStreak
        ]}
      >
        <Text style={[
          styles.streakText,
          currentStreak > 0 ? styles.activeStreakText : styles.noStreakText
        ]}>
          {currentStreak > 0 ? `🥶 ${displayedStreak}` : '✓'}
        </Text>
      </Animated.View>
      
      <Text style={styles.caption}>
        {currentStreak > 0
          ? `You've missed ${currentStreak} daily pairing${currentStreak !== 1 ? 's' : ''} in a row`
          : 'No active streak! Keep it up!'}
      </Text>
      
      <Text style={styles.maxStreak}>
        Max Streak: {maxStreak}
      </Text>
      
      {/* Tip based on streak status */}
      <View style={styles.tipContainer}>
        <MaterialCommunityIcons 
          name={currentStreak > 3 ? "alert-circle-outline" : "information-outline"} 
          size={20} 
          color={currentStreak > 3 ? COLORS.warning : COLORS.secondary} 
        />
        <Text style={[
          styles.tipText,
          currentStreak > 3 ? styles.warningTip : styles.infoTip
        ]}>
          {currentStreak > 3
            ? 'Complete today\'s pairing to reset your streak!'
            : 'Complete daily pairings to keep your streak at zero!'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  streakDisplay: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  activeStreak: {
    backgroundColor: '#E53935', // Red for active streak
  },
  noStreak: {
    backgroundColor: '#4CAF50', // Green for no streak
  },
  streakText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  activeStreakText: {
    color: '#fff',
  },
  noStreakText: {
    color: '#fff',
  },
  caption: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 8,
  },
  maxStreak: {
    fontSize: 14,
    color: '#777',
    marginBottom: 16,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  tipText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  warningTip: {
    color: COLORS.warning,
  },
  infoTip: {
    color: COLORS.secondary,
  },
});

export default FlakeStreakDisplay;
