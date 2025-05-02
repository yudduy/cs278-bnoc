/**
 * LikeButton Component
 * 
 * Enhanced like button with animation for the Daily Meetup Selfie app.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../config/theme';
import { usePairing } from '../../../context/PairingContext';

interface LikeButtonProps {
  pairingId: string;
  liked: boolean;
  likesCount: number;
}

const LikeButton: React.FC<LikeButtonProps> = ({
  pairingId,
  liked,
  likesCount,
}) => {
  // State
  const [isLiked, setIsLiked] = useState(liked);
  const [count, setCount] = useState(likesCount);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Get pairing context
  const { toggleLikePairing } = usePairing();
  
  // Update state when props change
  useEffect(() => {
    setIsLiked(liked);
    setCount(likesCount);
  }, [liked, likesCount]);
  
  // Handle like button press
  const handlePress = async () => {
    if (isAnimating) return;
    
    // Optimistic update
    setIsLiked(!isLiked);
    setCount(prev => isLiked ? prev - 1 : prev + 1);
    
    // Animation
    setIsAnimating(true);
    
    if (!isLiked) {
      // Like animation (scale up and rotate slightly)
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.3,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => setIsAnimating(false));
    } else {
      // Unlike animation (simple scale)
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start(() => setIsAnimating(false));
    }
    
    // Call API
    try {
      await toggleLikePairing(pairingId);
    } catch (error) {
      // Revert on error
      console.error('Error toggling like:', error);
      setIsLiked(liked);
      setCount(likesCount);
    }
  };
  
  // Rotate interpolation for animation
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '20deg'],
  });
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      disabled={isAnimating}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [
              { scale: scaleAnim },
              { rotate },
            ],
          },
        ]}
      >
        <Ionicons
          name={isLiked ? 'heart' : 'heart-outline'}
          size={22}
          color={isLiked ? COLORS.primary : COLORS.textSecondary}
        />
      </Animated.View>
      <Text
        style={[
          styles.count,
          isLiked && styles.likedCount,
        ]}
      >
        {count}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  count: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  likedCount: {
    color: COLORS.primary,
    fontFamily: 'ChivoBold',
  },
});

export default LikeButton;
