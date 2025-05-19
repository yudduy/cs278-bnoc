/**
 * EmptyFeed Component
 * 
 * Displays an appropriate empty state for the feed screen based on the user's situation:
 * - If the user has fewer than 5 friends, it shows a prompt to add more friends
 * - If the user has enough friends but no pairings, it shows a different message
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../config/theme';

interface EmptyFeedProps {
  friendCount: number;
  minFriendsRequired: number;
  onAddFriends: () => void;
  onTakePhoto: () => void;
}

const EmptyFeed: React.FC<EmptyFeedProps> = ({
  friendCount,
  minFriendsRequired,
  onAddFriends,
  onTakePhoto
}) => {
  const needsMoreFriends = friendCount < minFriendsRequired;
  
  if (needsMoreFriends) {
    return (
      <View style={styles.container}>
        <Text style={styles.logo}>BNOC</Text>
        <Ionicons name="people-outline" size={64} color={COLORS.primary} />
        <Text style={styles.title}>Add at least 5 friends</Text>
        <Text style={styles.title}>to get started!</Text>
        <TouchableOpacity 
          style={styles.addFriendsButton}
          onPress={onAddFriends}
        >
          <Text style={styles.addFriendsButtonText}>Add Friends</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Ionicons name="camera-outline" size={64} color={COLORS.textSecondary} />
      <Text style={styles.title}>No Selfies Yet</Text>
      <Text style={styles.text}>
        Completed pairings will appear here. Take a selfie with your daily partner to see it in the feed!
      </Text>
      <TouchableOpacity 
        style={styles.cameraButton}
        onPress={onTakePhoto}
      >
        <Ionicons name="camera" size={20} color="#FFFFFF" />
        <Text style={styles.cameraButtonText}>Take Today's Selfie</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },
  logo: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.primary,
    marginBottom: 16,
    letterSpacing: 1,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: COLORS.primary,
    marginTop: 8,
    textAlign: 'center',
  },
  text: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  addFriendsButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  addFriendsButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.background,
  },
  cameraButton: {
    backgroundColor: COLORS.textSecondary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  cameraButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 8,
  },
});

export default EmptyFeed; 