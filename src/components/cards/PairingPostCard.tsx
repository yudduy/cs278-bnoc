/**
 * PairingPostCard
 * 
 * Displays a completed pairing in the feed with two photos side-by-side.
 * Shows user avatars, usernames, like/comment counts, and flaked status.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  ImageSourcePropType,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePairing } from '../../context/PairingContext';
import { useAuth } from '../../context/AuthContext';
import { Pairing, User } from '../../types';
import { AntDesign, Ionicons, FontAwesome } from '@expo/vector-icons';
import firebaseService from '../../services/firebase';
import logger from '../../utils/logger';

// Get screen width for responsive layout
const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 48) / 2; // Two photos side by side with margins

interface PairingPostCardProps {
  pairing: Pairing;
  onCommentPress?: () => void;
}

export default function PairingPostCard({ pairing, onCommentPress }: PairingPostCardProps) {
  const navigation = useNavigation<any>();
  const { toggleLikePairing } = usePairing();
  const { user } = useAuth();
  
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(pairing.likesCount || 0);
  const [user1Data, setUser1Data] = useState<User | null>(null);
  const [user2Data, setUser2Data] = useState<User | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  // Check if current user has liked this pairing
  useEffect(() => {
    if (user?.id && pairing.likedBy) {
      setIsLiked(pairing.likedBy.includes(user.id));
    }
  }, [user?.id, pairing.likedBy]);
  
  // Update likes count when prop changes
  useEffect(() => {
    setLikesCount(pairing.likesCount || 0);
  }, [pairing.likesCount]);
  
  // Fetch user data for both users in the pairing
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoadingUsers(true);
        const [user1, user2] = await Promise.all([
          firebaseService.getUserById(pairing.user1_id),
          firebaseService.getUserById(pairing.user2_id)
        ]);
        
        setUser1Data(user1);
        setUser2Data(user2);
        logger.debug('User data loaded for pairing', { 
          pairingId: pairing.id, 
          user1: user1?.username, 
          user2: user2?.username 
        });
      } catch (error) {
        logger.error('Failed to load user data for pairing', error);
      } finally {
        setLoadingUsers(false);
      }
    };
    
    if (pairing.user1_id && pairing.user2_id) {
      fetchUserData();
    }
  }, [pairing.user1_id, pairing.user2_id, pairing.id]);
  
  // Format date for display
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date 
      ? timestamp 
      : new Date(timestamp.seconds * 1000);
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Handle like button press
  const handleLikePress = async () => {
    if (!user?.id) return;
    
    try {
      await toggleLikePairing(pairing.id);
      
      // Update local state optimistically
      if (isLiked) {
        setLikesCount(prev => Math.max(0, prev - 1));
        setIsLiked(false);
      } else {
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (error) {
      logger.error('Failed to toggle like', error);
    }
  };
  
  // Set up safe navigation using NavigationService
  const handlePairingDetailNavigation = (pairingId: string) => {
    navigation.navigate('PairingDetail', { pairingId });
  };
  
  // Handle comment button press
  const handleCommentPress = () => {
    if (onCommentPress) {
      onCommentPress();
    } else {
      handlePairingDetailNavigation(pairing.id);
    }
  };
  
  // Check if either user has flaked
  const hasFlaked = pairing.status === 'flaked';
  
  // Get user display info from Firebase data
  const user1Info = {
    name: user1Data?.displayName || user1Data?.username || 'User 1',
    photoURL: user1Data?.photoURL || undefined
  };
  
  const user2Info = {
    name: user2Data?.displayName || user2Data?.username || 'User 2', 
    photoURL: user2Data?.photoURL || undefined
  };
  
  // Helper to get image source with fallback
  const getImageSource = (url: string | undefined): ImageSourcePropType => {
    if (!url) {
      return { uri: 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fdefault-avatar.png?alt=media&token=default' };
    }
    return { uri: url };
  };
  
  // Helper to get photo source with fallback
  const getPhotoSource = (url: string | undefined): ImageSourcePropType => {
    if (!url) {
      return { uri: 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fdefault-photo.png?alt=media&token=default' };
    }
    return { uri: url };
  };
  
  if (loadingUsers) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Header with user avatars and names */}
      <View style={styles.header}>
        <View style={styles.userContainer}>
          <Image source={getImageSource(user1Info.photoURL)} style={styles.avatar} />
          <Text style={styles.username}>{user1Info.name}</Text>
        </View>
        
        <View style={styles.xContainer}>
          <AntDesign name="close" size={16} color="#999" />
        </View>
        
        <View style={styles.userContainer}>
          <Image source={getImageSource(user2Info.photoURL)} style={styles.avatar} />
          <Text style={styles.username}>{user2Info.name}</Text>
        </View>
        
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#777" />
        </TouchableOpacity>
      </View>
      
      {/* Photos container */}
      <View style={styles.photosContainer}>
        {/* User 1 Photo */}
        <View style={styles.photoWrapper}>
          <Image 
            source={getPhotoSource(pairing.user1_photoURL || undefined)} 
            style={styles.photo}
            resizeMode="cover"
          />
          <View style={styles.photoLabel}>
            <Text style={styles.photoLabelText}>{user1Info.name}</Text>
          </View>
        </View>
        
        {/* User 2 Photo */}
        <View style={styles.photoWrapper}>
          <Image 
            source={getPhotoSource(pairing.user2_photoURL || undefined)} 
            style={styles.photo}
            resizeMode="cover"
          />
          <View style={styles.photoLabel}>
            <Text style={styles.photoLabelText}>{user2Info.name}</Text>
          </View>
        </View>
        
        {/* Overlay flaked badge if applicable */}
        {hasFlaked && (
          <View style={styles.flakedOverlay}>
            <FontAwesome name="snowflake-o" size={24} color="#fff" />
            <Text style={styles.flakedText}>FLAKED</Text>
          </View>
        )}
      </View>
      
      {/* Footer with likes, comments, date */}
      <View style={styles.footer}>
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleLikePress}
          >
            <AntDesign 
              name={isLiked ? "heart" : "hearto"} 
              size={24} 
              color={isLiked ? "#E53935" : "#777"} 
            />
            <Text style={styles.actionText}>
              {likesCount > 0 ? likesCount : ''}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleCommentPress}
          >
            <Ionicons name="chatbubble-outline" size={22} color="#777" />
            <Text style={styles.actionText}>
              {pairing.commentsCount > 0 ? pairing.commentsCount : ''}
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.dateText}>
          {formatDate(pairing.date)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  username: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  xContainer: {
    marginHorizontal: 4,
  },
  menuButton: {
    padding: 4,
  },
  photosContainer: {
    flexDirection: 'row',
    position: 'relative',
  },
  photoWrapper: {
    width: '50%',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: PHOTO_SIZE,
  },
  noPhotoContainer: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 4,
  },
  photoLabelText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  flakedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flakedText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#777',
  },
  dateText: {
    fontSize: 14,
    color: '#999',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#777',
  },
}); 