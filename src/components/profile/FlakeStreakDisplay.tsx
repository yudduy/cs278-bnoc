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
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const colorAnim = useRef(new Animated.Value(currentStreak)).current;
  
  // Start animations on mount and when streak changes
  useEffect(() => {
    // Update color animation value
    colorAnim.setValue(currentStreak);
    
    if (currentStreak > 0) {
      // Pulse animation
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
      
      // Rotate animation for 🥶 emoji
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: -1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [currentStreak]);
  
  // Interpolate rotate value
  const rotate = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-10deg', '0deg', '10deg'],
  });
  
  // Interpolate background color based on streak severity
  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 3, 5, 7],
    outputRange: [
      COLORS.success,
      '#FFA41B', // Yellow-Orange for moderate streak
      '#FF6B35', // Orange-Red for concerning streak
      '#DC2626', // Red for serious streak
    ],
  });
  
  // Get congratulation or warning message based on streak
  const getMessage = () => {
    if (currentStreak === 0) {
      return "Great job! Keep completing your daily pairings!";
    } else if (currentStreak === 1) {
      return "You missed yesterday's pairing. Complete today's to reset your streak!";
    } else if (currentStreak <= 3) {
      return `You've missed ${currentStreak} pairings in a row. Complete today's to reset!`;
    } else if (currentStreak <= 6) {
      return `${currentStreak} missed pairings! Complete today's pairing to get back on track.`;
    } else {
      return "Your streak is getting serious! Complete today's pairing to reset it.";
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Current Flake Streak</Text>
      
      <View style={styles.streakContainer}>
        <Animated.View
          style={[
            styles.streakDisplay,
            {
              transform: [
                { scale: currentStreak > 0 ? pulseAnim : 1 },
              ],
              backgroundColor: currentStreak > 0 ? backgroundColor : COLORS.success,
            },
          ]}
        >
          {currentStreak > 0 ? (
            <View style={styles.streakContent}>
              <Animated.Text
                style={[
                  styles.streakEmoji,
                  { transform: [{ rotate }] },
                ]}
              >
                🥶
              </Animated.Text>
              <Text style={styles.streakText}>{displayedStreak}</Text>
            </View>
          ) : (
            <Text style={styles.successEmoji}>✅</Text>
          )}
        </Animated.View>
        
        <View style={styles.streakInfoContainer}>
          <Text style={styles.streakMessage}>{getMessage()}</Text>
          <Text style={styles.maxStreakText}>Longest streak: {maxStreak}</Text>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Flake Streaks increase when you miss a daily pairing, and reset to 0 when you complete one.
        </Text>
        
        {currentStreak > 0 && (
          <Text style={styles.tipText}>
            Tip: You can use a Snooze Token to skip a pairing without increasing your streak.
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 20,
  },
  title: {
    fontFamily: 'ChivoBold',
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakDisplay: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  streakContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  successEmoji: {
    fontSize: 32,
  },
  streakText: {
    fontFamily: 'ChivoBold',
    fontSize: 28,
    color: '#FFFFFF',
  },
  streakInfoContainer: {
    flex: 1,
  },
  streakMessage: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  maxStreakText: {
    fontFamily: 'ChivoRegular',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  infoContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
  },
  infoText: {
    fontFamily: 'ChivoRegular',
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  tipText: {
    fontFamily: 'ChivoRegular',
    fontSize: 13,
    color: COLORS.primary,
    textAlign: 'center',
  },
});

export default FlakeStreakDisplay;
