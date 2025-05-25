/**
 * PairingDetailScreen
 * 
 * Detailed view of a pairing with enlarged photo, user information, and social interactions.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  Share,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
  Dimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/theme';
import { globalStyles } from '../../styles/globalStyles';
import { usePairing } from '../../context/PairingContext';
import { useAuth } from '../../context/AuthContext';
import LikeButton from '../../components/feed/social/LikeButton';
import CommentList from '../../components/feed/social/CommentList';
import * as pairingService from '../../services/pairingService';
import * as userService from '../../services/userService';
import { formatDate } from '../../utils/dateUtils';
import { Pairing, User } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PairingDetailScreen: React.FC = () => {
  // Navigation and route
  const navigation = useNavigation();
  const route = useRoute();
  const pairingId = route.params?.pairingId;
  
  // Context
  const { user } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [pairing, setPairing] = useState<Pairing | null>(null);
  const [users, setUsers] = useState<Record<string, User>>({});
  
  // Animation values
  const imageScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Load pairing data
  useEffect(() => {
    const loadPairingData = async () => {
      if (!pairingId) {
        navigation.goBack();
        return;
      }
      
      try {
        setLoading(true);
        
        // Get pairing data using the proper service
        const pairingData = await pairingService.getPairingById(pairingId);
        
        if (!pairingData) {
          Alert.alert('Error', 'Pairing not found.');
          navigation.goBack();
          return;
        }
        
        setPairing(pairingData);
        
        // Get user data for both users in the pairing
        const usersData: Record<string, User> = {};
        
        try {
          const user1Data = await userService.getUserById(pairingData.user1_id);
          if (user1Data) {
            usersData[pairingData.user1_id] = user1Data;
          }
        } catch (error) {
          console.error(`Error fetching user1 data (${pairingData.user1_id}):`, error);
        }
        
        try {
          const user2Data = await userService.getUserById(pairingData.user2_id);
          if (user2Data) {
            usersData[pairingData.user2_id] = user2Data;
          }
        } catch (error) {
          console.error(`Error fetching user2 data (${pairingData.user2_id}):`, error);
        }
        
        setUsers(usersData);
        
        // Start animations after loading
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } catch (error) {
        console.error('Error loading pairing data:', error);
        Alert.alert('Error', 'Failed to load pairing details.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    
    loadPairingData();
  }, [pairingId, user?.id]);
  
  // Handle share
  const handleShare = async () => {
    if (!pairing) return;
    
    const user1 = users[pairing.users[0]];
    const user2 = users[pairing.users[1]];
    
    try {
      await Share.share({
        message: `Check out this daily selfie from ${user1?.displayName || 'User'} and ${user2?.displayName || 'User'} on Daily Meetup Selfie App!`,
        // In a real app, would include URL or deep link
      });
    } catch (error) {
      console.error('Error sharing pairing:', error);
    }
  };
  
  // Handle image zoom
  const handlePressIn = () => {
    Animated.spring(imageScale, {
      toValue: 1.05,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(imageScale, {
      toValue: 1,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };
  
  // Format date
  const formatDateWithTime = (timestamp: any) => {
    if (!timestamp) return 'Recent';
    
    return formatDate(timestamp, 'MMMM d, yyyy • h:mm a', 'Recent');
  };
  
  // Get user display info
  const user1 = users[pairing?.user1_id || ''];
  const user2 = users[pairing?.user2_id || ''];
  
  // Check if current user has liked this pairing
  const userHasLiked = pairing?.likedBy?.includes(user?.id || '');
  
  // Navigate to user profile
  const navigateToProfile = (userId: string) => {
    // @ts-ignore - Navigation typing
    navigation.navigate('Profile', { userId });
  };
  
  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[globalStyles.container, styles.loadingContainer]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading pairing details...</Text>
      </SafeAreaView>
    );
  }
  
  if (!pairing) {
    return (
      <SafeAreaView style={[globalStyles.container, styles.loadingContainer]}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.errorText}>Pairing not found.</Text>
        <TouchableOpacity
          style={styles.backToFeedButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backToFeedText}>Back to Feed</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <ScrollView style={styles.container}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Pairing Details</Text>
            
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          
          {/* User info */}
          <View style={styles.userInfoContainer}>
            <TouchableOpacity
              style={styles.userInfo}
              onPress={() => user1 && navigateToProfile(user1.id)}
            >
              <Image
                source={user1?.photoURL ? { uri: user1.photoURL } : { uri: 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fmb.jpeg?alt=media&token=e6e88f85-a09d-45cc-b6a4-cad438d1b2f6' }}
                style={styles.userAvatar}
              />
              <Text style={styles.userName}>{user1?.displayName || 'User'}</Text>
            </TouchableOpacity>
            
            <View style={styles.andContainer}>
              <View style={styles.andLine} />
              <Text style={styles.andText}>and</Text>
              <View style={styles.andLine} />
            </View>
            
            <TouchableOpacity
              style={styles.userInfo}
              onPress={() => user2 && navigateToProfile(user2.id)}
            >
              <Image
                source={user2?.photoURL ? { uri: user2.photoURL } : { uri: 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fmb.jpeg?alt=media&token=e6e88f85-a09d-45cc-b6a4-cad438d1b2f6' }}
                style={styles.userAvatar}
              />
              <Text style={styles.userName}>{user2?.displayName || 'User'}</Text>
            </TouchableOpacity>
          </View>
          
          {/* Pairing image */}
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
          >
            <Animated.View
              style={[
                styles.imageContainer,
                { transform: [{ scale: imageScale }] },
              ]}
            >
              {(pairing.user1_photoURL || pairing.user2_photoURL) ? (
                <View style={styles.combinedImageContainer}>
                  {pairing.user1_photoURL && (
                    <Image
                      source={{ uri: pairing.user1_photoURL }}
                      style={[styles.pairingImage, pairing.user2_photoURL && styles.halfImage]}
                      resizeMode="cover"
                    />
                  )}
                  {pairing.user2_photoURL && (
                    <Image
                      source={{ uri: pairing.user2_photoURL }}
                      style={[styles.pairingImage, pairing.user1_photoURL && styles.halfImage]}
                      resizeMode="cover"
                    />
                  )}
                </View>
              ) : (
                <View style={styles.noImageContainer}>
                  <Ionicons name="image-outline" size={64} color={COLORS.textSecondary} />
                  <Text style={styles.noImageText}>Image not available</Text>
                </View>
              )}
              
              {pairing.status === 'flaked' && (
                <View style={styles.flakeBadge}>
                  <Text style={styles.flakeText}>🥶 Flaked</Text>
                </View>
              )}
              
              {pairing.isPrivate && (
                <View style={styles.privateBadge}>
                  <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
                  <Text style={styles.privateText}>Private</Text>
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>
          
          {/* Pairing info */}
          <View style={styles.infoContainer}>
            <Text style={styles.dateText}>
              {formatDateWithTime(pairing.completedAt || pairing.date)}
            </Text>
            
            {/* Interactions */}
            <View style={styles.interactionsContainer}>
              <LikeButton
                pairingId={pairing.id}
                liked={!!userHasLiked}
                likesCount={pairing.likesCount || 0}
              />
              
              <View style={styles.commentsCounter}>
                <Ionicons
                  name="chatbubble-outline"
                  size={22}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.commentsCount}>
                  {pairing.commentsCount || 0}
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.shareIconButton}
                onPress={handleShare}
              >
                <Ionicons
                  name="share-outline"
                  size={22}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Comments */}
          <View style={styles.commentsContainer}>
            <Text style={styles.commentsTitle}>Comments</Text>
            <CommentList
              pairingId={pairing.id}
              comments={[]}
            />
          </View>
          
          {/* Bottom padding */}
          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  errorText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 16,
  },
  backToFeedButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backToFeedText: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 18,
    color: COLORS.text,
  },
  shareButton: {
    padding: 8,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  userInfo: {
    alignItems: 'center',
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  userName: {
    fontFamily: 'ChivoBold',
    fontSize: 14,
    color: COLORS.text,
  },
  andContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 10,
  },
  andLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  andText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginHorizontal: 10,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.25, // 5:4 aspect ratio
    backgroundColor: COLORS.backgroundLight,
  },
  combinedImageContainer: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
  },
  pairingImage: {
    width: '100%',
    height: '100%',
  },
  halfImage: {
    width: '50%',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  flakeBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
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
  privateBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  privateText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 6,
  },
  infoContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dateText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  interactionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentsCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 24,
  },
  commentsCount: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  shareIconButton: {
    marginLeft: 24,
  },
  commentsContainer: {
    padding: 16,
  },
  commentsTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 16,
  },
});

export default PairingDetailScreen;
