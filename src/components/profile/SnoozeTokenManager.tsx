/**
 * SnoozeTokenManager Component
 * 
 * Displays and manages a user's snooze tokens with animation and information.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { format, addDays, differenceInDays, differenceInHours } from 'date-fns';

interface SnoozeTokenManagerProps {
  onUseToken?: () => void;
}

const SnoozeTokenManager: React.FC<SnoozeTokenManagerProps> = ({
  onUseToken,
}) => {
  // Get auth context
  const { user } = useAuth();
  
  // State
  const [tokens, setTokens] = useState(user?.snoozeTokensRemaining || 1);
  const [nextRefillDate, setNextRefillDate] = useState<Date | null>(null);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Set up next refill date calculation - in real app would use actual data
  useEffect(() => {
    // For demo purposes, set next refill to 3 days from now
    if (user?.snoozeTokenLastRefilled) {
      const lastRefilled = new Date(user.snoozeTokenLastRefilled.seconds * 1000);
      const nextRefill = addDays(lastRefilled, 7);
      setNextRefillDate(nextRefill);
    } else {
      // Mock data if not available
      const nextRefill = addDays(new Date(), 3);
      setNextRefillDate(nextRefill);
    }
    
    // Start animations if there are tokens
    if (tokens > 0) {
      startAnimations();
    }
  }, [user]);
  
  // Start animations
  const startAnimations = () => {
    // Pulse animation for token count
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Rotation animation for token icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };
  
  // Format time until next refill
  const formatTimeUntil = (date: Date) => {
    const now = new Date();
    const days = differenceInDays(date, now);
    
    if (days > 1) {
      return `${days} days`;
    }
    
    const hours = differenceInHours(date, now);
    
    if (hours > 0) {
      return `${hours} hours`;
    }
    
    return 'Less than 1 hour';
  };
  
  // Handle token usage
  const handleUseToken = () => {
    if (tokens < 1) {
      Alert.alert(
        'No Tokens Available',
        'You don\'t have any snooze tokens available. You\'ll receive a new token in ' + 
        (nextRefillDate ? formatTimeUntil(nextRefillDate) : 'a few days') + '.'
      );
      return;
    }
    
    Alert.alert(
      'Use Snooze Token',
      'Are you sure you want to use a snooze token? This will allow you to skip today\'s pairing without increasing your flake streak.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Use Token',
          onPress: () => {
            setTokens(prev => Math.max(0, prev - 1));
            if (onUseToken) onUseToken();
            
            Alert.alert(
              'Token Used',
              'Your snooze token has been used. Today\'s pairing has been snoozed without affecting your flake streak.'
            );
          },
        },
      ]
    );
  };
  
  // Rotate interpolation for the token icon
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Snooze Tokens</Text>
      
      <View style={styles.tokenContainer}>
        <Animated.View
          style={[
            styles.tokenIconContainer,
            tokens > 0 ? { transform: [{ scale: pulseAnim }] } : undefined,
          ]}
        >
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons 
              name="timer-outline" 
              size={32} 
              color={tokens > 0 ? COLORS.primary : COLORS.textSecondary} 
            />
          </Animated.View>
          
          <Animated.Text
            style={[
              styles.tokenCount,
              tokens > 0 ? { transform: [{ scale: pulseAnim }] } : { color: COLORS.textSecondary }
            ]}
          >
            {tokens}
          </Animated.Text>
        </Animated.View>
        
        <View style={styles.tokenInfo}>
          <Text style={styles.tokenTitle}>
            {tokens === 1 ? '1 Token Available' : `${tokens} Tokens Available`}
          </Text>
          
          {nextRefillDate && (
            <Text style={styles.nextRefill}>
              Next token in: {formatTimeUntil(nextRefillDate)}
            </Text>
          )}
        </View>
      </View>
      
      <TouchableOpacity
        style={[
          styles.useTokenButton,
          tokens < 1 && styles.disabledButton,
        ]}
        onPress={handleUseToken}
        disabled={tokens < 1}
      >
        <Text style={[
          styles.useTokenText,
          tokens < 1 && styles.disabledButtonText,
        ]}>
          Use Snooze Token
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.infoText}>
        Snooze tokens let you skip a pairing without increasing your flake streak.
        You'll get one new token each week.
      </Text>
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
  },
  tokenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  tokenIconContainer: {
    backgroundColor: COLORS.backgroundLight,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tokenCount: {
    fontFamily: 'ChivoBold',
    fontSize: 20,
    color: COLORS.primary,
    position: 'absolute',
    top: 42,
    right: 8,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 4,
  },
  nextRefill: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  useTokenButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  useTokenText: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  disabledButton: {
    backgroundColor: COLORS.backgroundLight,
  },
  disabledButtonText: {
    color: COLORS.textSecondary,
  },
  infoText: {
    fontFamily: 'ChivoRegular',
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default SnoozeTokenManager;
