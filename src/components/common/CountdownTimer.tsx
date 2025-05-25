/**
 * CountdownTimer Component
 * 
 * Reusable countdown timer with real-time updates.
 * Shows time remaining until a target date/time.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { COLORS, FONTS } from '../../config/theme';
import { Ionicons } from '@expo/vector-icons';

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

interface CountdownTimerProps {
  targetDate: Date;
  title: string;
  subtitle?: string;
  iconName?: string;
  onExpire?: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  title,
  subtitle,
  iconName = 'time-outline',
  onExpire,
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0, total: 0 });

  const calculateTimeLeft = (): TimeLeft => {
    const now = new Date().getTime();
    const target = targetDate.getTime();
    const difference = target - now;

    if (difference > 0) {
      return {
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        total: difference,
      };
    }

    return { hours: 0, minutes: 0, seconds: 0, total: 0 };
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      // Call onExpire when timer reaches zero
      if (newTimeLeft.total <= 0 && onExpire) {
        onExpire();
      }
    }, 1000);

    // Set initial time
    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  const formatTime = (time: number): string => {
    return time.toString().padStart(2, '0');
  };

  const getTimeDisplay = (): string => {
    if (timeLeft.total <= 0) {
      return 'Expired';
    }

    if (timeLeft.hours > 0) {
      return `${timeLeft.hours}h ${timeLeft.minutes}m`;
    } else if (timeLeft.minutes > 0) {
      return `${timeLeft.minutes}m ${timeLeft.seconds}s`;
    } else {
      return `${timeLeft.seconds}s`;
    }
  };

  const isExpired = timeLeft.total <= 0;
  const isUrgent = timeLeft.total <= 300000; // 5 minutes or less

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons 
          name={iconName as any} 
          size={24} 
          color={isExpired ? COLORS.textSecondary : isUrgent ? '#FF6B6B' : COLORS.primary} 
        />
      </View>
      
      <View style={styles.textContainer}>
        <Text style={[
          styles.title,
          isExpired && styles.expiredText,
          isUrgent && !isExpired && styles.urgentText
        ]}>
          {title}
        </Text>
        
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
        
        <Text style={[
          styles.timeDisplay,
          isExpired && styles.expiredText,
          isUrgent && !isExpired && styles.urgentText
        ]}>
          {getTimeDisplay()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  timeDisplay: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.primary,
  },
  expiredText: {
    color: COLORS.textSecondary,
  },
  urgentText: {
    color: '#FF6B6B', // Red color for urgent times
  },
});

export default CountdownTimer;
