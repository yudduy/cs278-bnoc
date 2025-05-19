/**
 * PairingPostCard
 * 
 * Displays a completed pairing in the feed with two photos side-by-side.
 * Shows user avatars, usernames, like/comment counts, and flaked status.
 */

import React, { useState } from 'react';
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
import { Pairing } from '../../types';
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";

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
  
  const [isLiked, setIsLiked] = useState(pairing.likedBy.includes(user?.id || ''));
  const [likesCount, setLikesCount] = useState(pairing.likesCount);
  
  // Format date for display
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date 
      ? timestamp 
      : new Date(timestamp.seconds * 1000);
    
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Handle like button press
  const handleLikePress = async () => {
    try {
      // Optimistically update UI
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikesCount(prev => newIsLiked ? prev + 1 : Math.max(0, prev - 1));
      
      // Update in backend
      await toggleLikePairing(pairing.id);
    } catch (error) {
      // Revert UI on error
      console.error('Error toggling like:', error);
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev + 1 : Math.max(0, prev - 1));
      Alert.alert('Error', 'Failed to update like status');
    }
  };
  
  // Set up safe navigation using NavigationService
  const handlePairingDetailNavigation = (pairingId: string) => {
    try {
      // Import at usage time to avoid circular dependencies
      const NavigationService = require('../../navigation/NavigationService').default;
      NavigationService.navigate('PairingDetail', { pairingId });
    } catch (error) {
      console.error(`Error navigating to PairingDetail:`, error);
    }
  };
  
  // Handle comment button press
  const handleCommentPress = () => {
    try {
      if (onCommentPress) {
        onCommentPress();
      } else if (pairing.id) {
        handlePairingDetailNavigation(pairing.id);
      }
    } catch (error) {
      console.error('Error handling comment press:', error);
    }
  };
  
  // Check if either user has flaked
  const hasFlaked = pairing.status === 'flaked';
  
  // Get user display info (for demo, using hardcoded values)
  const getMockUserInfo = (userId: string) => {
    const mockUsers: Record<string, { name: string, avatar: any }> = {
      'user1': { 
        name: 'Justin', 
        avatar: require('../../../assets/images/justin.jpg') 
      },
      'user2': { 
        name: 'Duy', 
        avatar: require('../../../assets/images/duy.jpg') 
      },
      'user3': { 
        name: 'Kelvin', 
        avatar: require('../../../assets/images/kelvin.jpg')
      },
      'user4': { 
        name: 'Vivian', 
        avatar: require('../../../assets/images/vivian.jpg')
      },
      'currentuser': { 
        name: 'Michael', 
        avatar: require('../../../assets/images/michael.jpg')
      },
    };
    
    return mockUsers[userId] || { name: userId, avatar: { uri: 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fmb.jpeg?alt=media&token=e6e88f85-a09d-45cc-b6a4-cad438d1b2f6' } };
  };
  
  const user1Info = getMockUserInfo(pairing.user1_id);
  const user2Info = getMockUserInfo(pairing.user2_id);
  
  // Helper to convert string URLs to image sources
  const getImageSource = (url: string | undefined): ImageSourcePropType => {
    // For demo, we're using require statements, but in real app, we'd use URLs
    if (!url) {
      // Return a Firebase placeholder image URL instead of a local asset
      return { uri: 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fmb.jpeg?alt=media&token=e6e88f85-a09d-45cc-b6a4-cad438d1b2f6' };
    }
    
    // If it's already a require'd asset (for mock data)
    if (typeof url === 'number') return url as ImageSourcePropType;
    
    // For URI strings
    return { uri: url };
  };
  
  return (
    <View style={styles.container}>
      {/* Header with user avatars and names */}
      <View style={styles.header}>
        <View style={styles.userContainer}>
          <Image source={user1Info.avatar} style={styles.avatar} />
          <Text style={styles.username}>{user1Info.name}</Text>
        </View>
        
        <View style={styles.xContainer}>
          <AntDesign name="close" size={16} color="#999" />
        </View>
        
        <View style={styles.userContainer}>
          <Image source={user2Info.avatar} style={styles.avatar} />
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
            source={pairing.user1_photoURL ? getImageSource(pairing.user1_photoURL) : { uri: 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fmb.jpeg?alt=media&token=e6e88f85-a09d-45cc-b6a4-cad438d1b2f6' }} 
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
            source={pairing.user2_photoURL ? getImageSource(pairing.user2_photoURL) : { uri: 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fmb.jpeg?alt=media&token=e6e88f85-a09d-45cc-b6a4-cad438d1b2f6' }} 
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
}); 