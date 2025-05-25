/**
 * PostCard Component
 * 
 * A BeReal-style component for displaying paired user posts in the feed.
 * Updated for black and white theme with modernized layout.
 */
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  Modal,
  Pressable,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/theme';
import PostOptionsModal from '../modals/PostOptionsModal';
import { reportPost } from '../../services/reportService';

// Default avatar URL from Firebase Storage
const defaultAvatar = 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fmb.jpeg?alt=media&token=e6e88f85-a09d-45cc-b6a4-cad438d1b2f6';

// Types for the component props
interface User {
  id: string;
  username: string;
  photoURL?: string;
}

interface PostCardProps {
  id: string;
  users: [User, User]; // Exactly two paired users
  imageURLs: string[]; // Array of image URLs (1 or 2 photos)
  location?: string;
  timestamp: Date;
  lateBy?: number; // Minutes late, if applicable
  onLike?: (postId: string) => void;
  onReact?: (postId: string, reaction: string) => void;
  onOptions?: (postId: string) => void;
  likesCount?: number;
  commentsCount?: number;
  currentUserLiked?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ 
  id, 
  users, 
  imageURLs, 
  location, 
  timestamp, 
  lateBy, 
  onLike, 
  onReact, 
  onOptions,
  likesCount = 0,
  commentsCount = 0,
  currentUserLiked = false 
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  // Format timestamp to readable time
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`;
    
    // For older posts, return the date
    return date.toLocaleDateString();
  };
  
  // Format "late by" text
  const getLateText = () => {
    if (lateBy === undefined || lateBy === 0) return '';
    if (lateBy === 1) return 'Completed 1 min late';
    return `Completed ${lateBy} mins late`;
  };

  const handleReactionPress = () => {
    setShowReactions(!showReactions);
  };
  
  const handleReaction = (reaction: string) => {
    if (onReact) {
      onReact(id, reaction);
    }
    setShowReactions(false);
  };
  
  // Available reactions
  const reactions = [
    { emoji: '👍', name: 'thumbsUp' },
    { emoji: '😊', name: 'smile' },
    { emoji: '❤️', name: 'heart' },
    { emoji: '😂', name: 'laugh' },
    { emoji: '⚡', name: 'lightning' }
  ];
  
  // Handle photo carousel scroll
  const handlePhotoScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentPhotoIndex(index);
  };

  // Render photo carousel or single image
  const renderPhotoContent = () => {
    if (!imageURLs || imageURLs.length === 0) {
      return (
        <Image 
          source={{ uri: defaultAvatar }} 
          style={styles.mainImage} 
          resizeMode="cover" 
        />
      );
    }

    if (imageURLs.length === 1) {
      // Single photo
      return (
        <Image 
          source={{ uri: imageURLs[0] || defaultAvatar }} 
          style={styles.mainImage} 
          resizeMode="cover" 
        />
      );
    }

    // Multiple photos - Instagram-style carousel
    return (
      <View style={styles.carouselContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handlePhotoScroll}
          style={styles.photoCarousel}
        >
          {imageURLs.map((photoURL, index) => (
            <Image
              key={index}
              source={{ uri: photoURL || defaultAvatar }}
              style={[styles.mainImage, { width }]}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
        
        {/* Page indicator */}
        <View style={styles.pageIndicator}>
          <Text style={styles.pageText}>
            {currentPhotoIndex + 1}/{imageURLs.length}
          </Text>
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      {/* Header with user avatars, location, and time */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {/* User Avatars */}
          <View style={styles.avatarsContainer}>
            <Image 
              source={{ uri: users[0].photoURL || defaultAvatar }} 
              style={styles.avatar} 
            />
            <Image 
              source={{ uri: users[1].photoURL || defaultAvatar }} 
              style={[styles.avatar, styles.secondAvatar]} 
            />
          </View>
          
          {/* Username Format */}
          <Text style={styles.usernameText}>
            {users[0].username} <Text style={styles.separator}>&lt;&gt;</Text> {users[1].username}
          </Text>
        </View>
        
        <View style={styles.metadataContainer}>
          {location && (
            <Text style={styles.locationText}>{location}</Text>
          )}
          <Text style={styles.timeText}>
            {formatTime(timestamp)}
            {lateBy !== undefined && lateBy > 0 && ` • ${getLateText()}`}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.optionsButton} 
          onPress={() => onOptions && onOptions(id)}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Main image carousel */}
      {renderPhotoContent()}
      
      {/* Footer with reactions */}
      <View style={styles.footer}>
        <View style={styles.stats}>
          {likesCount > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="thumbs-up" size={14} color={COLORS.primary} />
              <Text style={styles.statText}>{likesCount}</Text>
            </View>
          )}
          
          {commentsCount > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="chatbubble" size={14} color={COLORS.primary} />
              <Text style={styles.statText}>{commentsCount}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.reactions}>
          {/* Reaction button */}
          <TouchableOpacity 
            style={styles.reactionButton} 
            onPress={handleReactionPress}
          >
            <Ionicons name="happy-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          
          {/* Like button */}
          <TouchableOpacity 
            style={[styles.likeButton, currentUserLiked && styles.likedButton]} 
            onPress={() => onLike && onLike(id)}
          >
            <Ionicons 
              name={currentUserLiked ? "thumbs-up" : "thumbs-up-outline"} 
              size={24} 
              color={COLORS.primary} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Reactions popup */}
        {showReactions && (
          <View style={styles.reactionsPopup}>
            {reactions.map((reaction) => (
              <TouchableOpacity
                key={reaction.name}
                style={styles.reactionOption}
                onPress={() => handleReaction(reaction.name)}
              >
                <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: COLORS.background,
    marginBottom: 16,
    borderRadius: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    zIndex: 1,
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
  },
  secondAvatar: {
    marginLeft: -8,
    borderWidth: 1,
    borderColor: COLORS.background,
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
  mainImage: {
    width: '100%',
    height: width,
    backgroundColor: '#222', // Dark placeholder while loading
  },
  carouselContainer: {
    width: '100%',
    position: 'relative',
  },
  photoCarousel: {
    width: '100%',
  },
  pageIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pageText: {
    color: COLORS.primary,
    fontSize: 12,
    fontFamily: 'ChivoBold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statText: {
    marginLeft: 4,
    color: COLORS.primary,
    fontSize: 14,
  },
  reactions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionButton: {
    padding: 8,
    marginRight: 4,
  },
  likeButton: {
    padding: 8,
  },
  likedButton: {
    // Style for when liked
  },
  optionsButton: {
    padding: 8,
  },
  reactionsPopup: {
    position: 'absolute',
    right: 12,
    bottom: 60,
    flexDirection: 'row',
    backgroundColor: '#222',
    borderRadius: 20,
    padding: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  reactionOption: {
    padding: 8,
    marginHorizontal: 4,
  },
  reactionEmoji: {
    fontSize: 20,
  },
});

export default PostCard;