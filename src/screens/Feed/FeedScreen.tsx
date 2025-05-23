/**
 * FeedScreen
 * 
 * Enhanced feed screen with black and white BeReal-inspired UI.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Share,
  Animated,
  StatusBar,
  Alert
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, BORDER_RADIUS, FONTS } from '../../config/theme';
import { globalStyles } from '../../styles/globalStyles';
import { Pairing, User } from '../../types';
import PostCard from '../../components/feed/PostCard';
import EmptyFeed from '../../components/feed/EmptyFeed';
import { useAuth } from '../../context/AuthContext';
import { usePairing } from '../../context/PairingContext';
import firebaseService from '../../services/firebase';
import { RouteProp } from '@react-navigation/native';
import { MainTabParamList, MainStackParamList } from '../../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';

// Define typed navigation prop
type FeedScreenNavigationProp = StackNavigationProp<MainStackParamList>;

// Default avatar image fallback
const defaultAvatar = 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fmb.jpeg?alt=media&token=e6e88f85-a09d-45cc-b6a4-cad438d1b2f6';

const FeedScreen: React.FC = () => {
  // State
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // FIXED: Removed conflicting fade animation that was causing bounce issues
  // const fadeAnim = useRef(new Animated.Value(0)).current;
  const lastVisible = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);
  
  // Get auth context
  const { user } = useAuth();
  const { currentPairing, loadCurrentPairing } = usePairing();
  const navigation = useNavigation<FeedScreenNavigationProp>();
  const route = useRoute<RouteProp<MainTabParamList, 'Feed'>>();
  const scrollToPairingId = route.params?.scrollToPairingId;

  // ADDED: Check if the user has already submitted a photo for the current pairing
  const hasUserSubmittedPhoto = React.useMemo(() => {
    if (!currentPairing || !user) return false;

    if (user.id === currentPairing.user1_id && currentPairing.user1_photoURL) {
      return true;
    }
    if (user.id === currentPairing.user2_id && currentPairing.user2_photoURL) {
      return true;
    }
    return false;
  }, [currentPairing, user]);
  
  // ADDED: Check if the pairing has expired
  const isPairingExpired = React.useMemo(() => {
    if (!currentPairing || !currentPairing.expiresAt) return true;
    
    let expiryDate: Date;
    // Handle Firestore Timestamp conversion to Date
    if (currentPairing.expiresAt && typeof currentPairing.expiresAt.toDate === 'function') {
      expiryDate = currentPairing.expiresAt.toDate();
    } else {
      // Handle case where it might already be a Date or a timestamp number
      expiryDate = new Date(currentPairing.expiresAt as any);
    }
    
    return new Date() > expiryDate;
  }, [currentPairing]);

  /**
   * Load feed data from Firebase
   * @param refresh Whether to refresh from the beginning
   */
  const loadFeed = useCallback(async (refresh = false) => {
    if (!user?.id) {
      // console.log('Cannot load feed: No authenticated user');
      return;
    }
    
    if (refresh) {
      setRefreshing(true);
      // Reset pagination when refreshing
      lastVisible.current = null;
    } else {
      setLoadingMore(true);
    }
    
    setError(null);
    
    try {
      // console.log('Loading feed data from Firebase...');
      
      // Get feed from Firebase with pagination
      const result = await firebaseService.getFeed(
        user.id,
        10, // Limit
        refresh ? null : lastVisible.current
      );
      
      const { pairings: newPairings, lastVisible: newLastVisible, hasMore: newHasMore } = result;
      
      // console.log(`Loaded ${newPairings.length} pairings from Firebase`);
      
      // Update state with actual data
      if (refresh) {
        setPairings(newPairings);
      } else {
        setPairings(prev => [...prev, ...newPairings]);
      }
      
      // Update pagination state
      lastVisible.current = newLastVisible;
      setHasMore(newHasMore);
      
      // Fetch user data for displayed pairings
      const userIds = new Set<string>();
      newPairings.forEach(pairing => {
        if (pairing.users) {
          pairing.users.forEach(userId => userIds.add(userId));
        }
      });
      
      // Get all users in parallel
      const userPromises = Array.from(userIds).map(userId => 
        firebaseService.getUserById(userId)
      );
      
      const fetchedUsers = await Promise.all(userPromises);
      
      // Create users object
      const newUsers: Record<string, User> = {};
      fetchedUsers.forEach(user => {
        if (user) {
          newUsers[user.id] = user;
        }
      });
      
      // Update users state
      setUsers(prev => refresh ? newUsers : { ...prev, ...newUsers });
    } catch (e) {
      console.error('Error loading feed:', e);
      setError('Failed to load feed. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [user?.id]); // Dependency on user.id

  // FIXED: Removed animation initialization that was causing conflicts
  // Load initial feed data - animation removed to prevent bounce conflicts
  
  // Data loading and user authentication effect
  useEffect(() => {
    if (user?.id) {
      loadFeed(true);
      if (!currentPairing) {
        loadCurrentPairing();
      }
    } 
  }, [user, loadFeed, currentPairing, loadCurrentPairing]);
  
  // Scroll to specific pairing if requested
  useEffect(() => {
    if (scrollToPairingId && pairings.length > 0) {
      const index = pairings.findIndex(p => p.id === scrollToPairingId);
      if (index !== -1 && flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5
        });
      }
    }
  }, [scrollToPairingId, pairings]);
  
  /**
   * Handle sharing a pairing
   */
  const handleSharePairing = async (pairingId: string) => {
    try {
      const pairing = pairings.find(p => p.id === pairingId);
      if (!pairing) return;
      
      const user1 = users[pairing.users[0]];
      const user2 = users[pairing.users[1]];
      
      await Share.share({
        message: `Check out this daily selfie from ${user1?.displayName || 'User'} and ${user2?.displayName || 'User'} on Daily Meetup Selfie App!`,
        // In a real app, would include URL or deep link
      });
    } catch (error) {
      console.error('Error sharing pairing:', error);
    }
  };
  
  /**
   * Pull-to-refresh handler
   */
  const handleRefresh = useCallback(() => {
    if (!refreshing) {
      loadFeed(true);
    }
  }, [refreshing, loadFeed]);
  
  /**
   * Load more data when reaching the end of the list
   */
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !refreshing) {
      loadFeed(false);
    }
  }, [loadingMore, hasMore, refreshing, loadFeed]);
  
  /**
   * Navigate to camera screen
   */
  const navigateToCamera = () => {
    navigation.navigate('Camera');
  };

  /**
   * Navigate to camera screen for taking/retaking a pairing photo
   */
  const navigateToCameraForPairing = () => {
    if (currentPairing && user) {
      const navigateAction = () => {
        navigation.navigate('Camera', { 
          pairingId: currentPairing.id,
          userId: user.id,
          submissionType: 'pairing'
        });
      };

      if (hasUserSubmittedPhoto) {
        Alert.alert(
          "Retake Photo?",
          "You've already submitted a photo for today's pairing. Taking another will replace the existing one.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Retake", onPress: navigateAction }
          ]
        );
      } else {
        navigateAction();
      }
    } else {
      console.warn("Attempted to navigate to camera for pairing without a current pairing or user.");
    }
  };
  
  /**
   * Navigate to daily pairing screen
   */
  const navigateToDailyPairing = () => {
    navigation.navigate('DailyPairing');
  };
  
  /**
   * Navigate to profile screen
   */
  const navigateToProfile = () => {
    navigation.navigate('Profile');
  };
  
  /**
   * Navigate to friends list screen
   */
  const navigateToFriendsList = () => {
    navigation.navigate('FindFriends');
  };
  
  /**
   * Render an individual pairing item
   */
  const renderPairingItem = useCallback(({ item, index }: { item: Pairing, index: number }) => {
    // Get users from our cached users state
    const user1 = item.user1_id ? users[item.user1_id] : undefined;
    const user2 = item.user2_id ? users[item.user2_id] : undefined;
    
    // Skip rendering if we don't have the user data yet
    if (!user1 || !user2) {
      console.log(`Missing user data for pairing ${item.id}`);
      return null;
    }
    
    // Determine if current user has liked this pairing
    const currentUserLiked = Array.isArray(item.likedBy) && item.likedBy.includes(user?.id || '');
    
    // Format the location (placeholder for now - could be enhanced with real location data)
    const location = 'Stanford, CA';
    
    // Setup reaction handler
    const handleReaction = (pairingId: string, reaction: string) => {
      console.log(`Reaction ${reaction} on pairing ${pairingId}`);
      // Implement real reaction handling with Firebase
      // firebaseService.addReactionToPairing(pairingId, user?.id || '', reaction);
    };
    
    // Setup options handler
    const handleOptions = (pairingId: string) => {
      console.log(`Options for pairing ${pairingId}`);
      // Implement real options menu with Firebase actions
    };
    
    // Format timestamp from Firestore Timestamp
    const timestamp = item.completedAt && typeof item.completedAt.toDate === 'function' 
      ? item.completedAt.toDate() 
      : new Date();
    
    // Get the primary image URL to display
    // With the single camera flow, we'll use the user1_photoURL (if available) as the primary image
    const imageURL = item.user1_photoURL || item.user2_photoURL || defaultAvatar;
    
    // FIXED: Removed Animated.View wrapper that was causing bounce conflicts
    return (
      <PostCard
        id={item.id}
        users={[user1, user2] as [User, User]}
        imageURL={imageURL}
        location={location}
        timestamp={timestamp}
        lateBy={0} // Calculate late time if needed
        onLike={() => handleToggleLike(item.id)}
        onReact={handleReaction}
        onOptions={handleOptions}
        likesCount={item.likesCount || 0}
        commentsCount={item.commentsCount || 0}
        currentUserLiked={currentUserLiked}
      />
    );
  }, [users, user?.id]); // FIXED: Removed fadeAnim dependency
  
  // Add function to toggle like using Firebase
  const handleToggleLike = async (pairingId: string) => {
    if (!user?.id) return;
    
    try {
      await firebaseService.toggleLikePairing(pairingId, user.id);
      // The feed will update automatically if we have real-time listeners
      // Otherwise, we could manually update the UI by refreshing the feed or updating state
    } catch (error) {
      console.error('Error toggling like:', error);
      setError('Failed to like pairing');
    }
  };
  
  /**
   * Render the empty state when no pairings are available
   */
  const renderEmptyComponent = () => {
    if (loading) return null;
    
    // Check for friend count
    const friendCount = user?.connections?.length || 0;
    const minFriendsRequired = 5;
    
    // If user has enough friends but no pairings yet, show "No Recent Posts" message
    // Otherwise, show "Add Friends" message
    if (friendCount >= minFriendsRequired) {
      return (
        <EmptyFeed
          friendCount={friendCount}
          minFriendsRequired={minFriendsRequired}
          onAddFriends={navigateToFriendsList}
          onTakePhoto={currentPairing ? navigateToCameraForPairing : navigateToCamera}
          hasEnoughFriends={true}
        />
      );
    } else {
      return (
        <EmptyFeed
          friendCount={friendCount}
          minFriendsRequired={minFriendsRequired}
          onAddFriends={navigateToFriendsList}
          onTakePhoto={currentPairing ? navigateToCameraForPairing : navigateToCamera}
          hasEnoughFriends={false}
        />
      );
    }
  };
  
  /**
   * Render the footer loading indicator
   */
  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };
  
  /**
   * Render the header component
   */
  const renderHeader = () => {
    return (
      <SafeAreaView style={styles.headerContainer}>
        <View style={styles.header}>
          {/* Left: Friend List Icon */}
          <TouchableOpacity style={styles.headerButton} onPress={navigateToFriendsList}>
            <Ionicons name="people-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Center: BNOC Logo */}
          <Text style={styles.headerTitle}>BNOC</Text>

          {/* Right: User Profile Image */}
          <TouchableOpacity style={styles.headerButton} onPress={navigateToProfile}>
            <Image
              source={{ uri: user?.photoURL || defaultAvatar }}
              style={styles.headerAvatar}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };
  
  // Determine if we should show the camera FAB
  const friendCount = user?.connections?.length || 0;
  const minFriendsRequired = 5;
  const shouldShowCameraFab =
  friendCount >= minFriendsRequired &&
  currentPairing != null &&
  !hasUserSubmittedPhoto &&
  !isPairingExpired;
  
  // Determine if we should show the retake photo FAB
  const shouldShowRetakeFab = currentPairing != null && hasUserSubmittedPhoto && !isPairingExpired;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      {renderHeader()}
      
      {loading && pairings.length === 0 && !error ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadFeed(true)} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={pairings}
          renderItem={renderPairingItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmptyComponent}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={pairings.length === 0 ? styles.emptyListContainer : styles.listContainer}
          showsVerticalScrollIndicator={false}
          // FIXED: Disable bounces to prevent infinite bouncing conflicts
          bounces={false}
          alwaysBounceVertical={false}
        />
      )}
      
      {/* Camera FAB - only shown if user has enough friends and no submitted photo yet */}
      {shouldShowCameraFab && (
        <TouchableOpacity
          style={styles.fab}
          onPress={navigateToCameraForPairing}
          activeOpacity={0.8}
        >
          <Ionicons name="camera" size={28} color={COLORS.background} />
        </TouchableOpacity>
      )}
      
      {/* Retake Photo FAB - only shown if user has submitted a photo and pairing isn't expired */}
      {shouldShowRetakeFab && (
        <TouchableOpacity
          style={[styles.fab, styles.retakeFab]}
          onPress={navigateToDailyPairing}
          activeOpacity={0.8}
        >
          <Ionicons name="camera-outline" size={28} color={COLORS.background} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  errorText: {
    color: COLORS.text,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  listContainer: {
    paddingBottom: 80,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  headerContainer: {
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    height: 60,
  },
  headerButton: {
    padding: 5,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: COLORS.primary,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 1000,
  },
  retakeFab: {
    bottom: 100,
    right: 20,
  },
});

export default FeedScreen;
