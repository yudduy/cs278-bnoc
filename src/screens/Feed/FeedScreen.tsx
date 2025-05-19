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
  Alert // Added Alert
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
  const lastVisible = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);
  
  // Get auth context
  const { user } = useAuth();
  const { currentPairing, loadCurrentPairing } = usePairing();
  const navigation = useNavigation();
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

  // Load initial feed data
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);
  
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

  const navigateToCameraForPairing = () => {
    if (currentPairing && user) {
      const navigateAction = () => {
        navigation.navigate('Camera', { 
          pairingId: currentPairing.id,
          userId: user.id,
          submissionType: 'pairing', 
        } as never);
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
    
    // Check for friend count
    const friendCount = user?.connections?.length || 0;
    const minFriendsRequired = 5;
    
    return (
      <EmptyFeed
        friendCount={friendCount}
        minFriendsRequired={minFriendsRequired}
        onAddFriends={navigateToFriendsList}
        onTakePhoto={navigateToCamera}
      />
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
  
  // Determine if we should show the camera FAB
  const friendCount = user?.connections?.length || 0;
  const minFriendsRequired = 5;
  const shouldShowFab = friendCount >= minFriendsRequired && currentPairing != null;
  
  // ADDED: Logic for showing the pairing camera button
  const shouldShowPairingCameraButton = React.useMemo(() => {
    if (!currentPairing || !user) {
      // console.log("Debug FeedScreen: No currentPairing or user for pairing camera button");
      return false;
    }

    // user1_id and user2_id from the pairing document define who is in which "slot".
    // A valid currentPairing for photo submission must have these fields.
    if (!currentPairing.user1_id || !currentPairing.user2_id) {
      console.warn("Debug FeedScreen: Current pairing is missing user1_id or user2_id", currentPairing);
      return false;
    }

    if (user.id === currentPairing.user1_id || user.id === currentPairing.user2_id) {
      return true;
    }
    
    return false;
  }, [currentPairing, user]);
  
  /**
   * Placeholder for rendering the "Today's Pairing" section
   * You'll need to integrate the button into your actual component/JSX for this section
   */
  const renderCurrentPairingSection = () => {
    if (!currentPairing || !user) return null;

    return (
      <View style={styles.currentPairingContainer}>
        <Text style={styles.currentPairingTitle}>Today's Pairing</Text>
        {/* ... Your existing content for current pairing (details, Go to Chat, Back Home) ... */}
        
        {shouldShowPairingCameraButton && (
          <>
            <TouchableOpacity onPress={navigateToCameraForPairing} style={styles.pairingPhotoButton}>
              <Ionicons name="camera-outline" size={24} color={COLORS.background} />
              <Text style={styles.pairingPhotoButtonText}>
                {hasUserSubmittedPhoto ? "Retake Pairing Photo" : "Take Today's Pairing Photo"}
              </Text>
            </TouchableOpacity>
            {hasUserSubmittedPhoto && (
              <Text style={styles.retakeWarningText}>
                You've already submitted a photo. Retaking will replace it.
              </Text>
            )}
          </>
        )}
        {/* ... Other buttons like "Go to Chat", "Back Home" ... */}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      {renderHeader()}

      {/* Render the Today's Pairing section here if it's separate from the list */}
      {currentPairing && renderCurrentPairingSection()} 
      
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
        />
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
    borderRadius: BORDER_RADIUS.md, // Used BORDER_RADIUS.md from theme
  },
  retryButtonText: {
    color: COLORS.background, // Text on primary button should be contrasting (e.g. black)
    fontSize: 16,
    fontFamily: FONTS.bold, // Used FONTS.bold from theme
  },
  listContainer: {
    paddingBottom: 80, // Ensure space for FAB if it's at the bottom
  },
  emptyListContainer: {
    flexGrow: 1, // Ensures EmptyFeed can center itself
  },
  headerContainer: {
    backgroundColor: COLORS.background, // Match screen background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10, // Adjust as needed
    height: 60, // Example height
  },
  headerButton: {
    padding: 5,
  },
  headerTitle: {
    fontFamily: FONTS.bold, // Used FONTS.bold from theme
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
  currentPairingContainer: {
    padding: 15,
    backgroundColor: COLORS.card, // Example background
    margin: 10,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.medium,
  },
  currentPairingTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 10,
  },
  pairingPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    marginTop: 10,
  },
  pairingPhotoButtonText: {
    color: COLORS.background, // Changed from COLORS.white
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginLeft: 8,
  },
  retakeWarningText: { // Added style for the warning text
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 5,
  },
});

export default FeedScreen;
