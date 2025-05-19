/**
 * PairingCard Component
 * 
 * Enhanced card component for displaying a pairing in the feed.
 * Updated for black and white BeReal-inspired UI.
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
  
  // Format time ago
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`;
    
    return formattedDate;
  };
  
  return (
    <View style={styles.card}>
      {/* Header with user avatars and names */}
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          {/* User Avatars */}
          <View style={styles.avatarsContainer}>
            {user1?.photoURL ? (
              <Image source={{ uri: user1.photoURL }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.placeholderAvatar]}>
                <Text style={styles.placeholderText}>
                  {user1?.username?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            )}
            
            {user2?.photoURL ? (
              <Image source={{ uri: user2.photoURL }} style={[styles.avatar, styles.secondAvatar]} />
            ) : (
              <View style={[styles.avatar, styles.placeholderAvatar, styles.secondAvatar]}>
                <Text style={styles.placeholderText}>
                  {user2?.username?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </View>
          
          {/* Username Format */}
          <Text style={styles.usernameText}>
            {user1?.username || 'User'} <Text style={styles.separator}>&lt;&gt;</Text> {user2?.username || 'Partner'}
          </Text>
        </View>
        
        <View style={styles.metadataContainer}>
          {pairing.location && (
            <Text style={styles.locationText}>{pairing.location}</Text>
          )}
          <Text style={styles.timeText}>
            {getTimeAgo(pairing.date ? new Date(pairing.date) : new Date())}
            {pairing.status === 'late' && ' • Completed late'}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.optionsButton}
          onPress={() => console.log('Options menu')}
          disabled={previewMode}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={COLORS.primary} />
        </TouchableOpacity>
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
      
      {/* Footer with likes, comments, share */}
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
              color={COLORS.primary} 
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
              color={COLORS.primary} 
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
    backgroundColor: COLORS.background,
    borderRadius: 0,
    overflow: 'hidden',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundLight,
  },
  secondAvatar: {
    marginLeft: -8,
    borderWidth: 1,
    borderColor: COLORS.background,
  },
  placeholderAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
  },
  placeholderText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  usernameText: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: 'ChivoBold',
  },
  separator: {
    color: COLORS.textSecondary,
  },
  metadataContainer: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  locationText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: 'ChivoRegular',
  },
  timeText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: 'ChivoRegular',
  },
  optionsButton: {
    padding: 8,
  },
  imageContainer: {
    width: '100%',
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  selfieImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
  },
  noImageText: {
    color: COLORS.textSecondary,
    marginTop: 8,
    fontSize: 14,
  },
  flakeBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  flakeText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  interactionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  interactionText: {
    color: COLORS.primary,
    marginLeft: 4,
    fontSize: 14,
  },
  privateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privateText: {
    color: COLORS.textSecondary,
    marginLeft: 4,
    fontSize: 12,
  },
  commentsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default PairingCard;