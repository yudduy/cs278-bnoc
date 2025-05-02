/**
 * PairingCard Component
 * 
 * Enhanced card component for displaying a pairing in the feed.
 * Includes social features like likes and comments.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
  Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { formatDate } from '../../utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/theme';
import { User, Pairing } from '../../types';
import { useAuth } from '../../context/AuthContext';
import LikeButton from './social/LikeButton';
import CommentList from './social/CommentList';

// Default avatar placeholder
const defaultAvatar = 'https://via.placeholder.com/100';

interface PairingCardProps {
  pairing: Pairing;
  user1?: User | null;
  user2?: User | null;
  onShare?: (pairingId: string) => void;
  previewMode?: boolean;
}

const PairingCard: React.FC<PairingCardProps> = ({
  pairing,
  user1,
  user2,
  onShare,
  previewMode = false,
}) => {
  // Navigation
  const navigation = useNavigation();
  
  // Auth context
  const { user } = useAuth();
  
  // State
  const [expanded, setExpanded] = useState(false);
  const [imagePressed, setImagePressed] = useState(false);
  
  // Format date
  const formattedDate = pairing.date ? formatDate(pairing.date, 'MMM d, yyyy') : 'Today';
  
  // Check if current user has liked this pairing
  const userHasLiked = pairing.likedBy?.includes(user?.id || '');
  
  /**
   * Navigate to user profile
   */
  const navigateToProfile = (userId: string) => {
    if (previewMode) return;
    
    // @ts-ignore - Navigation typing
    navigation.navigate('Profile', { userId });
  };
  
  /**
   * Open pairing detail
   */
  const openPairingDetail = () => {
    if (previewMode) return;
    
    // @ts-ignore - Navigation typing
    navigation.navigate('PairingDetail', { pairingId: pairing.id });
  };
  
  /**
   * Handle share button press
   */
  const handleShare = () => {
    if (onShare) {
      onShare(pairing.id);
    } else {
      // Default implementation
      console.log('Share pairing:', pairing.id);
    }
  };
  
  /**
   * Handle image press (with scale animation)
   */
  const handleImagePress = () => {
    setImagePressed(true);
    setTimeout(() => setImagePressed(false), 150);
    openPairingDetail();
  };
  
  return (
    <View style={styles.card}>
      {/* Header with user avatars and names */}
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          {/* User 1 */}
          <TouchableOpacity onPress={() => user1 && navigateToProfile(user1.id)}>
            {user1?.photoURL ? (
              <Image source={{ uri: user1.photoURL }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.placeholderAvatar]}>
                <Text style={styles.placeholderText}>
                  {user1?.displayName?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          <View style={styles.usernamesContainer}>
            <TouchableOpacity onPress={() => user1 && navigateToProfile(user1.id)}>
              <Text style={styles.username}>{user1?.displayName || user1?.username || 'User'}</Text>
            </TouchableOpacity>
            
            <Text style={styles.andText}>and</Text>
            
            <TouchableOpacity onPress={() => user2 && navigateToProfile(user2.id)}>
              <Text style={styles.username}>{user2?.displayName || user2?.username || 'Partner'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.date}>{formattedDate}</Text>
      </View>
      
      {/* Selfie image */}
      <TouchableOpacity 
        style={styles.imageContainer} 
        onPress={handleImagePress}
        activeOpacity={0.9}
      >
        <Animated.View style={[
          styles.imageWrapper,
          { transform: [{ scale: imagePressed ? 0.98 : 1 }] }
        ]}>
          {pairing.selfieURL ? (
            <Image 
              source={{ uri: pairing.selfieURL }}
              style={styles.selfieImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImageContainer}>
              <Ionicons name="image-outline" size={48} color={COLORS.textSecondary} />
              <Text style={styles.noImageText}>Image not available</Text>
            </View>
          )}
          
          {pairing.status === 'flaked' && (
            <View style={styles.flakeBadge}>
              <Text style={styles.flakeText}>🥶 Flaked</Text>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
      
      {/* Footer with likes, comments, date */}
      <View style={styles.cardFooter}>
        <View style={styles.interactionContainer}>
          {/* Like button */}
          <LikeButton 
            pairingId={pairing.id}
            liked={userHasLiked}
            likesCount={pairing.likes || 0}
          />
          
          {/* Comment button */}
          <TouchableOpacity 
            style={styles.interactionButton}
            onPress={() => setExpanded(!expanded)}
            disabled={previewMode}
          >
            <Ionicons 
              name="chatbubble-outline" 
              size={22} 
              color={COLORS.textSecondary} 
            />
            <Text style={styles.interactionText}>
              {pairing.comments?.length || 0}
            </Text>
          </TouchableOpacity>
          
          {/* Share button */}
          <TouchableOpacity 
            style={styles.interactionButton}
            onPress={handleShare}
            disabled={previewMode}
          >
            <Ionicons 
              name="share-outline" 
              size={22} 
              color={COLORS.textSecondary} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Private indicator */}
        {pairing.isPrivate && (
          <View style={styles.privateIndicator}>
            <Ionicons name="lock-closed" size={16} color={COLORS.textSecondary} />
            <Text style={styles.privateText}>Private</Text>
          </View>
        )}
      </View>
      
      {/* Expanded comments section */}
      {expanded && (
        <View style={styles.commentsContainer}>
          <CommentList 
            pairingId={pairing.id}
            comments={pairing.comments || []}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
  },
  placeholderAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  placeholderText: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  usernamesContainer: {
    marginLeft: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    flex: 1,
  },
  username: {
    fontFamily: 'ChivoBold',
    fontSize: 14,
    color: COLORS.text,
  },
  andText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginHorizontal: 4,
  },
  date: {
    fontFamily: 'ChivoRegular',
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 4/5,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
  },
  selfieImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.backgroundLight,
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
  },
  noImageText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  flakeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  flakeText: {
    fontFamily: 'ChivoBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  interactionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
    padding: 6,
  },
  interactionText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  privateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privateText: {
    fontFamily: 'ChivoRegular',
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  commentsContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});

export default PairingCard;