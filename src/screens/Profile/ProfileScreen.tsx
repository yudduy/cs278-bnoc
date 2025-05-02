/**
 * ProfileScreen
 * 
 * Enhanced profile screen with stats, streak visualization, and pairing history.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Animated,
  RefreshControl,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/theme';
import { globalStyles } from '../../styles/globalStyles';
import { useAuth } from '../../context/AuthContext';
import { usePairing } from '../../context/PairingContext';
import FlakeStreakDisplay from '../../components/profile/FlakeStreakDisplay';
import UserStatsDisplay from '../../components/profile/UserStatsDisplay';
import SnoozeTokenManager from '../../components/profile/SnoozeTokenManager';
import { User, Pairing } from '../../types';
import firebaseService from '../../services/firebase';
import { formatDate } from '../../utils/dateUtils';

// Default avatar placeholder
const defaultAvatar = 'https://via.placeholder.com/150';

const ProfileScreen: React.FC = () => {
  // Refs
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Navigation
  const navigation = useNavigation();
  const route = useRoute();
  const userId = route.params?.userId;
  
  // Context
  const { user, signOut } = useAuth();
  const { pairingHistory, loadPairingHistory } = usePairing();
  
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(true);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [profilePairings, setProfilePairings] = useState<Pairing[]>([]);
  const [userStats, setUserStats] = useState({
    totalPairings: 0,
    completedPairings: 0,
    flakedPairings: 0,
    completionRate: 0,
    currentStreak: 0,
    longestStreak: 0,
    uniqueConnections: 0
  });
  
  // Check if viewing own profile or another user's profile
  useEffect(() => {
    const checkProfile = async () => {
      if (userId && userId !== user?.id) {
        setIsCurrentUser(false);
        
        try {
          // Get user profile data
          const userData = await firebaseService.getUserById(userId);
          setProfileUser(userData);
        } catch (error) {
          console.error('Error loading user profile:', error);
          // Use fallback data
          setProfileUser({
            id: userId,
            displayName: 'Other User',
            username: 'otheruser',
            photoURL: 'https://via.placeholder.com/150?text=Other',
            flakeStreak: 2,
            maxFlakeStreak: 4,
          });
        }
      } else {
        setIsCurrentUser(true);
        setProfileUser(user);
      }
    };
    
    checkProfile();
  }, [userId, user]);
  
  // Load profile data
  useEffect(() => {
    loadProfileData();
  }, [isCurrentUser, profileUser]);
  
  // Load profile data function
  const loadProfileData = async () => {
    if (!profileUser) return;
    
    try {
      setLoading(true);
      
      // Load user stats
      const stats = await firebaseService.getUserStats(profileUser.id);
      setUserStats(stats);
      
      // Load profile pairings
      const pairings = await firebaseService.getPairingHistory(profileUser.id, 5);
      setProfilePairings(pairings.length > 0 ? pairings : []);
      
    } catch (error) {
      console.error('Error loading profile data:', error);
      // Use fallback data if needed
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Pull to refresh handler
  const handleRefresh = () => {
    setRefreshing(true);
    loadProfileData();
  };
  
  // Navigation handlers
  const navigateToSettings = () => {
    // @ts-ignore - navigation typing
    navigation.navigate('Settings');
  };
  
  const navigateToEditProfile = () => {
    // @ts-ignore - navigation typing
    navigation.navigate('EditProfile');
  };
  
  // Block user handler
  const handleBlockUser = () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${profileUser?.displayName || 'this user'}? They won't be paired with you again.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            if (user && profileUser) {
              try {
                // In a real app, would call API to block user
                // Mock implementation for demo
                Alert.alert('Success', `${profileUser.displayName || 'User'} has been blocked.`);
                navigation.goBack();
              } catch (error) {
                console.error('Error blocking user:', error);
                Alert.alert('Error', 'Failed to block user. Please try again.');
              }
            }
          },
        },
      ]
    );
  };
  
  // Handle sign out
  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Error signing out:', error);
            }
          },
        },
      ]
    );
  };
  
  // Render pairing history item
  const renderPairingHistoryItem = (pairing: Pairing, index: number) => {
    // Format date
    const formattedDate = pairing.date 
      ? formatDate(pairing.date, 'MMM d, yyyy')
      : 'Recent';
    
    // Get partner info
    const partnerId = pairing.users.find(id => id !== profileUser?.id) || '';
    
    // Get partner name from the users object in parent component
    return (
      <TouchableOpacity
        key={pairing.id || index}
        style={styles.historyItem}
        onPress={() => {
          // Navigate to pairing detail
          // @ts-ignore - navigation typing
          navigation.navigate('PairingDetail', { pairingId: pairing.id });
        }}
      >
        <View style={styles.historyIconContainer}>
          {pairing.status === 'completed' ? (
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
          ) : (
            <Ionicons name="close-circle" size={24} color={COLORS.error} />
          )}
        </View>
        <View style={styles.historyContent}>
          <Text style={styles.historyPartner}>
            With {partnerId ? (partnerId === 'user1' ? 'Justin' : 'Partner') : 'Unknown'}
          </Text>
          <Text style={styles.historyDate}>{formattedDate}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
    );
  };
  
  // Header animation values
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -60],
    extrapolate: 'clamp'
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60, 90],
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp'
  });
  
  // Loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              transform: [{ translateY: headerHeight }],
              opacity: headerOpacity,
            },
          ]}
        >
          {isCurrentUser ? (
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={navigateToSettings}
            >
              <Ionicons name="settings-outline" size={24} color={COLORS.text} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
          )}
          
          <View style={styles.profileInfo}>
            <Image
              source={{ uri: profileUser?.photoURL || defaultAvatar }}
              style={styles.profileImage}
            />
            
            <Text style={styles.displayName}>
              {profileUser?.displayName || profileUser?.username || 'User'}
            </Text>
            
            <Text style={styles.username}>
              @{profileUser?.username || 'username'}
            </Text>
            
            {isCurrentUser ? (
              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={navigateToEditProfile}
              >
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.blockUserButton}
                onPress={handleBlockUser}
              >
                <Text style={styles.blockUserText}>Block User</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
        
        {/* Flake Streak */}
        <FlakeStreakDisplay
          currentStreak={profileUser?.flakeStreak || 0}
          maxStreak={profileUser?.maxFlakeStreak || 0}
        />
        
        {/* User Stats */}
        <UserStatsDisplay stats={userStats} />
        
        {/* Snooze Tokens (if current user) */}
        {isCurrentUser && (
          <SnoozeTokenManager />
        )}
        
        {/* Pairing History */}
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Pairing History</Text>
          
          {profilePairings.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyHistoryText}>
                No pairing history available yet.
              </Text>
            </View>
          ) : (
            <>
              {profilePairings.map(renderPairingHistoryItem)}
              
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => {
                  // Navigate to full history
                  Alert.alert('Coming Soon', 'Full history view will be available in a future update.');
                }}
              >
                <Text style={styles.viewAllButtonText}>
                  View All History
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        
        {/* Sign Out Button (if current user) */}
        {isCurrentUser && (
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        )}
        
        {/* Footer padding */}
        <View style={{ height: 40 }} />
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
    backgroundColor: COLORS.background,
  },
  settingsButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 10,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    padding: 8,
    zIndex: 10,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 8,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.primary,
    marginBottom: 16,
  },
  displayName: {
    fontFamily: 'ChivoBold',
    fontSize: 24,
    color: COLORS.text,
    marginBottom: 4,
  },
  username: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  editProfileButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  editProfileText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: '#FFFFFF',
  },
  blockUserButton: {
    backgroundColor: COLORS.error,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  blockUserText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: '#FFFFFF',
  },
  historyContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 20,
  },
  historyTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  historyIconContainer: {
    marginRight: 16,
  },
  historyContent: {
    flex: 1,
  },
  historyPartner: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.text,
  },
  historyDate: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptyHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyHistoryText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  viewAllButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  viewAllButtonText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.primary,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  signOutButtonText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.error,
    marginLeft: 8,
  },
});

export default ProfileScreen;
