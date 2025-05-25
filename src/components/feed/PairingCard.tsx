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
  Animated,
  ScrollView,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { formatDate } from '../../utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/theme';
import { User, Pairing } from '../../types';
import { useAuth } from '../../context/AuthContext';
import LikeButton from './social/LikeButton';
import CommentList from './social/CommentList';
import PostOptionsModal from '../modals/PostOptionsModal';
import { reportPost } from '../../services/reportService';
import firebaseService from '../../services/firebase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  previewMode = false
}) => {
  const navigation = useNavigation();
  const { user: currentUser } = useAuth();
  const [showFullComments, setShowFullComments] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  // Helper function to safely convert Timestamp to Date
  const getDateFromTimestamp = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
    return new Date(timestamp);
  };

  // Helper function to get time ago
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays}d ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours}h ago`;
    } else {
      return 'Just now';
    }
  };

  const handleCardPress = useCallback(() => {
    if (previewMode) return;
    
    // Navigate to pairing detail screen
    (navigation as any).navigate('PairingDetail', { 
      pairingId: pairing.id 
    });
  }, [navigation, pairing.id, previewMode]);

  const handleUserPress = useCallback((userId: string) => {
    if (previewMode) return;
    
    (navigation as any).navigate('Profile', { 
      userId 
    });
  }, [navigation, previewMode]);

  const handleShare = useCallback(() => {
    if (onShare) {
      onShare(pairing.id);
    }
  }, [onShare, pairing.id]);

  const handleOptionsPress = useCallback(() => {
    setShowOptionsModal(true);
  }, []);

  const handleReportPost = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      await reportPost(pairing.id, currentUser.id);
      // Could show a success toast here
      console.log('Post reported successfully');
    } catch (error) {
      console.error('Error reporting post:', error);
      // Could show an error toast here
    }
  }, [pairing.id, currentUser?.id]);

  const handleRetakePhoto = useCallback(() => {
    if (!currentUser?.id) return;
    
    // Navigate to camera with retake parameters
    (navigation as any).navigate('Camera', {
      pairingId: pairing.id,
      userId: currentUser.id,
      submissionType: 'retake',
    });
  }, [navigation, pairing.id, currentUser?.id]);

  // Get available photos for the pairing
  const getPhotoArray = (): string[] => {
    const photos: string[] = [];
    
    // Add photos in order: user1, then user2
    if (pairing.user1_photoURL) {
      photos.push(pairing.user1_photoURL);
    }
    if (pairing.user2_photoURL) {
      photos.push(pairing.user2_photoURL);
    }
    
    return photos;
  };

  const availablePhotos = getPhotoArray();

  // Handle photo carousel scroll
  const handlePhotoScroll = useCallback((event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentPhotoIndex(index);
  }, []);

  // Render photo carousel or placeholder
  const renderPhotoContent = () => {
    if (availablePhotos.length === 0) {
      return (
        <View style={styles.placeholderPhoto}>
          <Ionicons name="camera-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.placeholderText}>No photo available</Text>
        </View>
      );
    }

    if (availablePhotos.length === 1) {
      // Single photo - no carousel needed
      return (
        <Image
          source={{ uri: availablePhotos[0] }}
          style={styles.photo}
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
          {availablePhotos.map((photoURL, index) => (
            <Image
              key={index}
              source={{ uri: photoURL }}
              style={[styles.photo, { width: SCREEN_WIDTH }]}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
        
        {/* Page indicator */}
        <View style={styles.pageIndicator}>
          <Text style={styles.pageText}>
            {currentPhotoIndex + 1}/{availablePhotos.length}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleCardPress}
      activeOpacity={previewMode ? 1 : 0.9}
      disabled={previewMode}
    >
      {/* Header with user info */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <TouchableOpacity 
            onPress={() => handleUserPress(pairing.user1_id)}
            disabled={previewMode}
          >
            <Text style={styles.username}>
              {user1?.username || 'User 1'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.separator}> & </Text>
          <TouchableOpacity 
            onPress={() => handleUserPress(pairing.user2_id)}
            disabled={previewMode}
          >
            <Text style={styles.username}>
              {user2?.username || 'User 2'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>
            {getTimeAgo(getDateFromTimestamp(pairing.date))}
          </Text>
          
          {/* Submission status indicator */}
          {pairing.status === 'completed' && (
            <View style={styles.statusIndicator}>
              <Text style={styles.statusText}>✓ Complete</Text>
            </View>
          )}
          
          {/* Three dots menu */}
          <TouchableOpacity 
            style={styles.optionsButton}
            onPress={handleOptionsPress}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main photo carousel */}
      <View style={styles.photoContainer}>
        {renderPhotoContent()}
      </View>

      {/* Actions */}
      {!previewMode && (
        <View style={styles.actions}>
          <LikeButton
            pairingId={pairing.id}
            likesCount={pairing.likesCount || 0}
            liked={pairing.likedBy?.includes(currentUser?.id || '') || false}
          />
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowFullComments(!showFullComments)}
          >
            <Ionicons name="chatbubble-outline" size={20} color={COLORS.text} />
            <Text style={styles.actionText}>
              {pairing.commentsCount || 0}
            </Text>
          </TouchableOpacity>

          {onShare && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={20} color={COLORS.text} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Comments */}
      {showFullComments && !previewMode && (
        <CommentList
          pairingId={pairing.id}
          comments={[]} // Will be loaded by CommentList component
        />
      )}
      
      {/* Post Options Modal */}
      <PostOptionsModal
        visible={showOptionsModal}
        pairing={pairing}
        currentUserId={currentUser?.id || ''}
        onClose={() => setShowOptionsModal(false)}
        onReport={handleReportPost}
        onRetake={handleRetakePhoto}
      />
    </TouchableOpacity>
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
  header: {
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
  username: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: 'ChivoBold',
  },
  separator: {
    color: COLORS.textSecondary,
  },
  timeContainer: {
    alignItems: 'flex-end',
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: 'ChivoRegular',
  },
  statusIndicator: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  statusText: {
    color: '#4CAF50',
    fontSize: 10,
    fontFamily: 'ChivoBold',
  },
  optionsButton: {
    padding: 4,
  },
  photoContainer: {
    width: '100%',
    position: 'relative',
  },
  carouselContainer: {
    width: '100%',
    position: 'relative',
  },
  photoCarousel: {
    width: '100%',
  },
  photo: {
    width: '100%',
    height: SCREEN_WIDTH, // Square aspect ratio
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
  placeholderPhoto: {
    width: '100%',
    height: SCREEN_WIDTH, // Match photo dimensions
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
  },
  placeholderText: {
    color: COLORS.textSecondary,
    marginTop: 8,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    color: COLORS.primary,
    marginLeft: 4,
    fontSize: 14,
  },
});

export default PairingCard;