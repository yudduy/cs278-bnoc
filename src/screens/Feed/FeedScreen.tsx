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
  StatusBar
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/theme';
import { globalStyles } from '../../styles/globalStyles';
import { Pairing, User } from '../../types';
import PostCard from '../../components/feed/PostCard';
import { useAuth } from '../../context/AuthContext';
import { usePairing } from '../../context/PairingContext';
import firebaseService from '../../services/firebase';
import { RouteProp } from '@react-navigation/native';
import { MainTabParamList } from '../../types/navigation';

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
  
  // Animation for feed appearance
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fabAnim = useRef(new Animated.Value(0)).current;
  
  // Pagination state
  const lastVisible = useRef<any>(null);
  
  // Get auth context
  const { user } = useAuth();
  const { currentPairing } = usePairing();
  
  // Navigation
  const navigation = useNavigation();
  
  // Get route params (for scrolling to a specific pairing)
  const route = useRoute<RouteProp<MainTabParamList, 'Feed'>>();
  const scrollToPairingId = route.params?.scrollToPairingId;
  
  // Ref for FlatList
  const flatListRef = useRef<FlatList>(null);
  
  // Load initial feed data
  useEffect(() => {
    loadFeed(true);
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    // FAB animation
    Animated.spring(fabAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);
  
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
   * Load feed data from Firebase
   * @param refresh Whether to refresh from the beginning
   */
  const loadFeed = useCallback(async (refresh = false) => {
    if (!user?.id) {
      console.log('Cannot load feed: No authenticated user');
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
      console.log('Loading feed data from Firebase...');
      
      // Get feed from Firebase with pagination
      const result = await firebaseService.getFeed(
        user.id,
        10, // Limit
        refresh ? null : lastVisible.current
      );
      
      const { pairings: newPairings, lastVisible: newLastVisible, hasMore: newHasMore } = result;
      
      console.log(`Loaded ${newPairings.length} pairings from Firebase`);
      
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
    } catch (error) {
      console.error('Error loading feed:', error);
      setError('Failed to load feed. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [user?.id]);
  
  // No longer using mock data generation
  
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
  const handleRefresh = () => {
    if (!refreshing) {
      loadFeed(true);
    }
  };
  
  /**
   * Load more data when reaching the end of the list
   */
  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !refreshing) {
      loadFeed(false);
    }
  };
  
  /**
   * Navigate to camera screen with today's pairing
   */
  const navigateToCamera = () => {
    navigation.navigate('Camera' as never);
  };
  
  /**
   * Navigate to profile screen
   */
  const navigateToProfile = () => {
    navigation.navigate('Profile' as never);
  };
  
  /**
   * Navigate to friends list screen
   */
  const navigateToFriendsList = () => {
    navigation.navigate('FindFriends' as never);
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
    
    return (
      <Animated.View style={{
        opacity: fadeAnim,
        transform: [
          { translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [50, 0]
          })},
        ],
      }}>
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
      </Animated.View>
    );
  }, [users, fadeAnim, user?.id]);
  
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
    
    // Check for friend count - for demo purposes, use 0 to show the add friends view
    const friendCount = 0; // In a real app, get this from the user's connections array
    const minFriendsRequired = 5;
    
    if (friendCount < minFriendsRequired) {
      // Not enough friends yet, show the add friends prompt
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>Add at least 5 friends to get started!</Text>
          <Text style={styles.emptyText}>
            Connect with your Stanford friends to start getting daily meetup suggestions.
          </Text>
          <TouchableOpacity 
            style={styles.addFriendsButton}
            onPress={navigateToFriendsList}
          >
            <Ionicons name="person-add" size={20} color="#FFFFFF" />
            <Text style={styles.addFriendsButtonText}>Add friends</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    // Has enough friends but no pairings yet
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="camera-outline" size={64} color={COLORS.textSecondary} />
        <Text style={styles.emptyTitle}>No Selfies Yet</Text>
        <Text style={styles.emptyText}>
          Completed pairings will appear here. Take a selfie with your daily partner to see it in the feed!
        </Text>
        <TouchableOpacity 
          style={styles.emptyCameraButton}
          onPress={navigateToCamera}
        >
          <Ionicons name="camera" size={20} color="#FFFFFF" />
          <Text style={styles.emptyCameraButtonText}>Take Today's Selfie</Text>
        </TouchableOpacity>
      </View>
    );
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
  
  // FAB animation
  const fabScale = fabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1]
  });
  
  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.container}>
        {/* Custom Header */}
        {renderHeader()}
        
        {/* Feed */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading feed...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={pairings}
            renderItem={renderPairingItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.feedContent}
            ListEmptyComponent={renderEmptyComponent}
            ListFooterComponent={renderFooter}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={COLORS.primary}
                colors={[COLORS.primary]}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            initialNumToRender={5}
            maxToRenderPerBatch={10}
            windowSize={10}
            removeClippedSubviews={true}
            showsVerticalScrollIndicator={false}
          />
        )}
        
        {/* Error Banner */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        
        {/* Camera FAB */}
        <Animated.View style={[
          styles.fabContainer,
          { 
            transform: [{ scale: fabScale }],
            opacity: fabAnim
          }
        ]}>
          <TouchableOpacity 
            style={styles.cameraFab}
            onPress={navigateToCamera}
            activeOpacity={0.8}
          >
            <Ionicons name="camera" size={24} color="#000000" />
          </TouchableOpacity>
          
          {/* Current pairing indicator */}
          {currentPairing && (
            <View style={styles.currentPairingIndicator}>
              <Text style={styles.currentPairingText}>Txt_ovrflw</Text>
            </View>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    backgroundColor: COLORS.background,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: COLORS.primary,
    fontSize: 20,
    fontFamily: 'ChivoBold',
    letterSpacing: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  feedContent: {
    padding: 12,
    paddingTop: 12,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
  },
  emptyTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 20,
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyCameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyCameraButtonText: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  addFriendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  addFriendsButtonText: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  errorBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.error,
    padding: 12,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: '#FFFFFF',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    alignItems: 'center',
  },
  cameraFab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  currentPairingIndicator: {
    backgroundColor: COLORS.backgroundLight,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    position: 'absolute',
    top: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  currentPairingText: {
    fontFamily: 'ChivoBold',
    fontSize: 12,
    color: COLORS.primary,
  },
});

export default FeedScreen;
