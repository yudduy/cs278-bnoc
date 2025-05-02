/**
 * UserStatsDisplay Component
 * 
 * Enhanced display of user statistics with animations and visual representation.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { COLORS } from '../../config/theme';

interface UserStats {
  totalPairings: number;
  completedPairings: number;
  flakedPairings: number;
  completionRate: number;
  uniqueConnections: number;
}

interface UserStatsDisplayProps {
  stats: UserStats;
}

const UserStatsDisplay: React.FC<UserStatsDisplayProps> = ({
  stats,
}) => {
  // Animation values for progress bars and count-up
  const completionRateAnim = useRef(new Animated.Value(0)).current;
  const appearAnim = useRef(new Animated.Value(0)).current;
  
  // Start animations on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(completionRateAnim, {
        toValue: stats.completionRate || 0,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.timing(appearAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [stats]);
  
  // Animated width for completion rate progress bar
  const progressWidth = completionRateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  
  // Get color based on completion rate
  const getCompletionRateColor = (rate: number) => {
    if (rate >= 0.8) return COLORS.success;
    if (rate >= 0.6) return '#4CAF50';
    if (rate >= 0.4) return '#FFA41B';
    return '#DC2626';
  };
  
  // Format completion rate as percentage
  const formatCompletionRate = (rate: number) => {
    return `${Math.round(rate * 100)}%`;
  };
  
  return (
    <Animated.View 
      style={[
        styles.container,
        { opacity: appearAnim, transform: [{ translateY: appearAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        })}] }
      ]}
    >
      <Text style={styles.title}>Your Stats</Text>
      
      {/* Top row - Key numbers */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalPairings}</Text>
          <Text style={styles.statLabel}>Total Pairings</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.completedPairings}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.uniqueConnections}</Text>
          <Text style={styles.statLabel}>Connections</Text>
        </View>
      </View>
      
      {/* Completion Rate Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressLabelContainer}>
          <Text style={styles.progressLabel}>Completion Rate</Text>
          <Text style={[
            styles.progressValue,
            { color: getCompletionRateColor(stats.completionRate) },
          ]}>
            {formatCompletionRate(stats.completionRate)}
          </Text>
        </View>
        
        <View style={styles.progressContainer}>
          <Animated.View 
            style={[
              styles.progressFill,
              { 
                width: progressWidth,
                backgroundColor: getCompletionRateColor(stats.completionRate)
              },
            ]}
          />
        </View>
      </View>
      
      {/* Pairing Breakdown */}
      <View style={styles.breakdownSection}>
        <Text style={styles.breakdownTitle}>Pairings Breakdown</Text>
        
        <View style={styles.breakdownRow}>
          <View style={styles.breakdownLabelContainer}>
            <View style={[styles.colorIndicator, { backgroundColor: COLORS.success }]} />
            <Text style={styles.breakdownLabel}>Completed</Text>
          </View>
          <Text style={styles.breakdownValue}>{stats.completedPairings}</Text>
        </View>
        
        <View style={styles.breakdownRow}>
          <View style={styles.breakdownLabelContainer}>
            <View style={[styles.colorIndicator, { backgroundColor: COLORS.error }]} />
            <Text style={styles.breakdownLabel}>Missed</Text>
          </View>
          <Text style={styles.breakdownValue}>{stats.flakedPairings}</Text>
        </View>
      </View>
    </Animated.View>
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: COLORS.border,
  },
  statValue: {
    fontFamily: 'ChivoBold',
    fontSize: 24,
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'ChivoRegular',
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  progressSection: {
    marginBottom: 24,
  },
  progressLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontFamily: 'ChivoBold',
    fontSize: 14,
    color: COLORS.text,
  },
  progressValue: {
    fontFamily: 'ChivoBold',
    fontSize: 14,
  },
  progressContainer: {
    height: 8,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  breakdownSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
  },
  breakdownTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  breakdownLabel: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.text,
  },
  breakdownValue: {
    fontFamily: 'ChivoBold',
    fontSize: 14,
    color: COLORS.text,
  },
});

export default UserStatsDisplay;
