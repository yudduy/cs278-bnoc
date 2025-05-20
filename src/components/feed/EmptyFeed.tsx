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
  hasEnoughFriends?: boolean; // New optional prop to explicitly control which state to show
}

const EmptyFeed: React.FC<EmptyFeedProps> = ({
  friendCount,
  minFriendsRequired,
  onAddFriends,
  onTakePhoto,
  hasEnoughFriends
}) => {
  // If hasEnoughFriends is explicitly passed, use it. Otherwise calculate based on friendCount
  const needsMoreFriends = hasEnoughFriends === undefined 
    ? friendCount < minFriendsRequired
    : !hasEnoughFriends;
  
  if (needsMoreFriends) {
    return (
      <View style={styles.container}>
        <Ionicons name="people-outline" size={64} color={COLORS.primary} />
        <Text style={styles.title}>Add at least 5 friends</Text>
        <Text style={styles.title}>to get started!</Text>
        <TouchableOpacity 
          style={styles.addFriendsButton}
          onPress={onAddFriends}
        >
          <Text style={styles.addFriendsButtonText}>Add Friends</Text>
        </TouchableOpacity>
        <Text style={styles.friendCountText}>
          {friendCount}/{minFriendsRequired} friends
        </Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Ionicons name="camera-outline" size={64} color={COLORS.textSecondary} />
      <Text style={styles.title}>No Recent Posts :(</Text>
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
  title: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: COLORS.text,
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
  friendCountText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.text,
    marginTop: 12,
    textAlign: 'center',
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