/**
 * FeedScreen
 * 
 * Enhanced feed screen with improved social features, pagination, and animations.
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
import PairingCard from '../../components/feed/PairingCard';
import { useAuth } from '../../context/AuthContext';
import { usePairing } from '../../context/PairingContext';
import firebaseService from '../../services/firebase';

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
  const route = useRoute();
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
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoadingMore(true);
    }
    
    setError(null);
    
    try {
      // In a real app, would fetch from Firestore with pagination
      // For demo, use mock data
      await createMockFeed(refresh);
    } catch (error) {
      console.error('Error loading feed:', error);
      setError('Failed to load feed. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [user?.id]);
  
  /**
   * Create mock feed data for development
   */
  const createMockFeed = async (refresh: boolean) => {
    // Create mock users with profile images
    const mockUsers: Record<string, User> = {
      'user1': {
        id: 'user1',
        email: 'justin@stanford.edu',
        username: 'justin',
        displayName: 'Justin',
        createdAt: new Date() as any,
        lastActive: new Date() as any,
        isActive: true,
        flakeStreak: 0,
        maxFlakeStreak: 2,
        photoURL: 'https://picsum.photos/100/100?random=1',
        blockedIds: [],
        notificationSettings: {
          pairingNotification: true,
          reminderNotification: true,
          completionNotification: true,
          quietHoursStart: 22,
          quietHoursEnd: 8
        },
        snoozeTokensRemaining: 1,
        snoozeTokenLastRefilled: new Date() as any,
      },
      'user2': {
        id: 'user2',
        email: 'duy@stanford.edu',
        username: 'duy',
        displayName: 'Duy',
        createdAt: new Date() as any,
        lastActive: new Date() as any,
        isActive: true,
        flakeStreak: 0,
        maxFlakeStreak: 5,
        photoURL: 'https://picsum.photos/100/100?random=2',
        blockedIds: [],
        notificationSettings: {
          pairingNotification: true,
          reminderNotification: true,
          completionNotification: true,
          quietHoursStart: 22,
          quietHoursEnd: 8
        },
        snoozeTokensRemaining: 1,
        snoozeTokenLastRefilled: new Date() as any,
      },
      'user3': {
        id: 'user3',
        email: 'kelvin@stanford.edu',
        username: 'kelvin',
        displayName: 'Kelvin',
        createdAt: new Date() as any,
        lastActive: new Date() as any,
        isActive: true,
        flakeStreak: 0,
        maxFlakeStreak: 3,
        photoURL: 'https://picsum.photos/100/100?random=3',
        blockedIds: [],
        notificationSettings: {
          pairingNotification: true,
          reminderNotification: true,
          completionNotification: true,
          quietHoursStart: 22,
          quietHoursEnd: 8
        },
        snoozeTokensRemaining: 1,
        snoozeTokenLastRefilled: new Date() as any,
      },
      'user4': {
        id: 'user4',
        email: 'vivian@stanford.edu',
        username: 'vivian',
        displayName: 'Vivian',
        createdAt: new Date() as any,
        lastActive: new Date() as any,
        isActive: true,
        flakeStreak: 0,
        maxFlakeStreak: 1,
        photoURL: 'https://picsum.photos/100/100?random=4',
        blockedIds: [],
        notificationSettings: {
          pairingNotification: true,
          reminderNotification: true,
          completionNotification: true,
          quietHoursStart: 22,
          quietHoursEnd: 8
        },
        snoozeTokensRemaining: 1,
        snoozeTokenLastRefilled: new Date() as any,
      },
      'currentuser': {
        id: 'currentuser',
        email: 'me@stanford.edu',
        username: 'mbernstein',
        displayName: 'Michael Bernstein',
        createdAt: new Date() as any,
        lastActive: new Date() as any,
        isActive: true,
        flakeStreak: 1,
        maxFlakeStreak: 3,
        photoURL: 'https://picsum.photos/100/100?random=me',
        blockedIds: [],
        notificationSettings: {
          pairingNotification: true,
          reminderNotification: true,
          completionNotification: true,
          quietHoursStart: 22,
          quietHoursEnd: 8
        },
        snoozeTokensRemaining: 1,
        snoozeTokenLastRefilled: new Date() as any,
      }
    };
    
    // Create mock pairings
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const mockPairings: Pairing[] = [
      {
        id: 'pairing1',
        date: now as any,
        expiresAt: new Date(now.setHours(22, 0, 0, 0)) as any,
        users: ['user1', 'user2'],
        status: 'completed',
        selfieURL: 'https://picsum.photos/600/800?random=1',
        frontImage: 'https://picsum.photos/300/400?random=1a',
        backImage: 'https://picsum.photos/300/400?random=1b',
        completedAt: now as any,
        isPrivate: false,
        likes: 5,
        likedBy: ['user3', 'user4'],
        comments: [
          {
            id: 'comment1',
            userId: 'user3',
            text: 'Great selfie! Love the location!',
            createdAt: now as any,
            username: 'kelvin',
            userPhotoURL: 'https://picsum.photos/100/100?random=3'
          }
        ],
        virtualMeetingLink: 'https://meet.jitsi.si/DailyMeetupSelfie-pairing1'
      },
      {
        id: 'pairing2',
        date: yesterday as any,
        expiresAt: new Date(yesterday.setHours(22, 0, 0, 0)) as any,
        users: ['user3', 'user4'],
        status: 'completed',
        selfieURL: 'https://picsum.photos/600/800?random=2',
        frontImage: 'https://picsum.photos/300/400?random=2a',
        backImage: 'https://picsum.photos/300/400?random=2b',
        completedAt: yesterday as any,
        isPrivate: false,
        likes: 3,
        likedBy: ['user1', 'currentuser'],
        comments: [
          {
            id: 'comment2',
            userId: 'user1',
            text: 'Awesome shot! Where was this taken?',
            createdAt: yesterday as any,
            username: 'justin',
            userPhotoURL: 'https://picsum.photos/100/100?random=1'
          },
          {
            id: 'comment3',
            userId: 'currentuser',
            text: 'Looks like fun! 😊',
            createdAt: yesterday as any,
            username: 'mbernstein',
            userPhotoURL: 'https://picsum.photos/100/100?random=me'
          }
        ],
        virtualMeetingLink: 'https://meet.jitsi.si/DailyMeetupSelfie-pairing2'
      },
      {
        id: 'pairing3',
        date: twoDaysAgo as any,
        expiresAt: new Date(twoDaysAgo.setHours(22, 0, 0, 0)) as any,
        users: ['currentuser', 'user3'],
        status: 'completed',
        selfieURL: 'https://picsum.photos/600/800?random=3',
        frontImage: 'https://picsum.photos/300/400?random=3a',
        backImage: 'https://picsum.photos/300/400?random=3b',
        completedAt: twoDaysAgo as any,
        isPrivate: false,
        likes: 4,
        likedBy: ['user1', 'user2', 'user4'],
        comments: [],
        virtualMeetingLink: 'https://meet.jitsi.si/DailyMeetupSelfie-pairing3'
      },
      {
        id: 'pairing4',
        date: twoDaysAgo as any,
        expiresAt: new Date(twoDaysAgo.setHours(22, 0, 0, 0)) as any,
        users: ['user1', 'user4'],
        status: 'flaked',
        isPrivate: false,
        likes: 0,
        likedBy: [],
        comments: [],
        virtualMeetingLink: 'https://meet.jitsi.si/DailyMeetupSelfie-pairing4'
      },
      {
        id: 'pairing5',
        date: threeDaysAgo as any,
        expiresAt: new Date(threeDaysAgo.setHours(22, 0, 0, 0)) as any,
        users: ['user2', 'currentuser'],
        status: 'completed',
        selfieURL: 'https://picsum.photos/600/800?random=5',
        frontImage: 'https://picsum.photos/300/400?random=5a',
        backImage: 'https://picsum.photos/300/400?random=5b',
        completedAt: threeDaysAgo as any,
        isPrivate: true,
        likes: 2,
        likedBy: ['user3', 'user1'],
        comments: [
          {
            id: 'comment4',
            userId: 'user3',
            text: 'Private pairing but great photo!',
            createdAt: threeDaysAgo as any,
            username: 'kelvin',
            userPhotoURL: 'https://picsum.photos/100/100?random=3'
          }
        ],
        virtualMeetingLink: 'https://meet.jitsi.si/DailyMeetupSelfie-pairing5'
      }
    ];
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (refresh) {
      setUsers(mockUsers);
      setPairings(mockPairings);
    } else {
      setUsers(prev => ({ ...prev, ...mockUsers }));
      setPairings(prev => [...prev, ...mockPairings]);
    }
    
    // Simulate pagination
    setHasMore(false);
  };
  
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
    // @ts-ignore - Navigation typing
    navigation.navigate('Camera');
  };
  
  /**
   * Navigate to profile screen
   */
  const navigateToProfile = () => {
    // @ts-ignore - Navigation typing
    navigation.navigate('Profile');
  };
  
  /**
   * Render an individual pairing item
   */
  const renderPairingItem = useCallback(({ item, index }: { item: Pairing, index: number }) => {
    const user1 = users[item.users[0]];
    const user2 = users[item.users[1]];
    
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
        <PairingCard
          pairing={item}
          user1={user1}
          user2={user2}
          onShare={handleSharePairing}
        />
      </Animated.View>
    );
  }, [users, fadeAnim]);
  
  /**
   * Render the empty state when no pairings are available
   */
  const renderEmptyComponent = () => {
    if (loading) return null;
    
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily Selfies</Text>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={navigateToProfile}
        >
          <Image 
            source={{ uri: user?.photoURL || 'https://picsum.photos/100/100?random=me' }} 
            style={styles.profileImage} 
          />
        </TouchableOpacity>
      </View>
    );
  };
  
  // FAB animation
  const fabScale = fabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1]
  });
  
  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Header */}
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
            <Ionicons name="camera" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          {/* Current pairing indicator */}
          {currentPairing && (
            <View style={styles.currentPairingIndicator}>
              <Text style={styles.currentPairingText}>Today's Pairing</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 24,
    color: COLORS.primary,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  profileImage: {
    width: 40,
    height: 40,
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
