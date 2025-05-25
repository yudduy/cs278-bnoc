/**
 * ProfileScreen
 * 
 * User profile screen with Instagram-inspired layout and black and white theme.
 * Shows user stats, profile info, and recent pairings.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  FlatList,
  StatusBar
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { usePairing } from '../../context/PairingContext';
import { User, UserFeedItem, Pairing } from '../../types';
import NavigationService from '../../navigation/NavigationService';
import ProfileStatItem from '../../components/profile/ProfileStatItem';
import { profileStyles as styles } from './ProfileStyles';
import PostCard from '../../components/feed/PostCard';
import * as pairingService from '../../services/pairingService';
import * as userService from '../../services/userService';

// Default profile image
const DEFAULT_PROFILE_IMAGE = 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fdefault-profile.jpg?alt=media&token=e6e88f85-a09d-45cc-b6a4-cad438d1b2f6';

const ProfileScreen: React.FC = () => {
  // Auth and Pairing context
  const { user, signOut } = useAuth();
  const { loadPairingHistory } = usePairing();
  
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [totalPairings, setTotalPairings] = useState(0);
  const [totalFlakes, setTotalFlakes] = useState(0);
  const [recentPairings, setRecentPairings] = useState<Pairing[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [partnerUsers, setPartnerUsers] = useState<Record<string, User>>({});

  // Navigate to settings
  const handleSettingsPress = () => {
    try {
      NavigationService.navigate('Settings');
    } catch (error) {
      console.error('Error navigating to settings:', error);
    }
  };
  
  // Navigate to edit profile
  const handleEditProfilePress = () => {
    try {
      NavigationService.navigate('EditProfile');
    } catch (error) {
      console.error('Error navigating to edit profile:', error);
    }
  };
  
  // Load user data
  const loadUserData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Fetch current user profile
      const currentUser = await userService.getUserById(user.id);
      if (currentUser) {
        setProfileUser(currentUser);
      }
      
      // Fetch user stats
      const stats = await pairingService.getUserStats(user.id);
      setUserStats(stats);
      setTotalPairings(stats.totalPairings || 0);
      setTotalFlakes(stats.flakedPairings || 0);
      
      // Fetch recent pairings
      const pairings = await pairingService.getUserPairingHistory(user.id, 3);
      setRecentPairings(pairings);
      
      // Fetch partner user data for each pairing
      const partnerUserPromises = pairings.map(async (pairing) => {
        const partnerId = pairing.user1_id === user.id ? pairing.user2_id : pairing.user1_id;
        try {
          const partnerUser = await userService.getUserById(partnerId);
          return { [partnerId]: partnerUser };
        } catch (error) {
          console.error(`Error fetching partner user ${partnerId}:`, error);
          return { [partnerId]: null };
        }
      });
      
      const partnerUserResults = await Promise.all(partnerUserPromises);
      const partnerUsersMap: Record<string, User> = {};
      partnerUserResults.forEach(userObj => {
        const [userId, userData] = Object.entries(userObj)[0];
        if (userData) {
          partnerUsersMap[userId] = userData;
        }
      });
      setPartnerUsers(partnerUsersMap);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);
  
  // Initial data load
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);
  
  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };
  
  // Handle pairing detail navigation
  const handlePairingDetail = (pairingId: string) => {
    try {
      NavigationService.navigate('PairingDetail', { pairingId });
    } catch (error) {
      console.error('Error navigating to PairingDetail:', error);
    }
  };
  
  // Loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Render a pairing card for profile - shows dual images and real user names
  const renderProfilePairingCard = ({ item }: { item: Pairing }) => {
    const partnerId = item.user1_id === user?.id ? item.user2_id : item.user1_id;
    const partnerUser = partnerUsers[partnerId];
    const currentUserDisplayName = user?.displayName || user?.username || 'You';
    const partnerDisplayName = partnerUser?.displayName || partnerUser?.username || 'Unknown User';
    
    // Check if both photos exist
    const userPhotoURL = item.user1_id === user?.id ? item.user1_photoURL : item.user2_photoURL;
    const partnerPhotoURL = item.user1_id === user?.id ? item.user2_photoURL : item.user1_photoURL;
    const bothPhotosExist = userPhotoURL && partnerPhotoURL;
    
    return (
      <TouchableOpacity 
        style={styles.pairingCard}
        onPress={() => handlePairingDetail(item.id)}
      >
        {/* Header with user names */}
        <View style={styles.pairingHeader}>
          <Text style={styles.pairingUserNames}>
            {currentUserDisplayName} <Text style={styles.separator}>&lt;&gt;</Text> {partnerDisplayName}
          </Text>
          <Text style={styles.pairingDate}>
            {item.date.toDate().toLocaleDateString()}
          </Text>
        </View>
        
        {/* Image(s) Display */}
        <View style={styles.pairingImagesContainer}>
          {bothPhotosExist ? (
            // Show dual images when both exist
            <View style={styles.dualImagesContainer}>
              <Image 
                source={{ uri: userPhotoURL }}
                style={styles.halfImage}
                contentFit="cover"
              />
              <Image 
                source={{ uri: partnerPhotoURL }}
                style={styles.halfImage}
                contentFit="cover"
              />
            </View>
          ) : userPhotoURL ? (
            // Show only user's image if partner didn't submit
            <View style={styles.singleImageContainer}>
              <Image 
                source={{ uri: userPhotoURL }}
                style={styles.singleImage}
                contentFit="cover"
              />
              <View style={styles.missingImageOverlay}>
                <Text style={styles.missingImageText}>Partner didn't submit</Text>
              </View>
            </View>
          ) : partnerPhotoURL ? (
            // Show only partner's image if user didn't submit
            <View style={styles.singleImageContainer}>
              <Image 
                source={{ uri: partnerPhotoURL }}
                style={styles.singleImage}
                contentFit="cover"
              />
              <View style={styles.missingImageOverlay}>
                <Text style={styles.missingImageText}>You didn't submit</Text>
              </View>
            </View>
          ) : (
            // Show placeholder when no photos
            <View style={styles.noImagesContainer}>
              <Ionicons name="camera-outline" size={48} color={COLORS.textSecondary} />
              <Text style={styles.noImagesText}>No photos submitted</Text>
            </View>
          )}
        </View>
        
        {/* Footer with stats */}
        <View style={styles.pairingFooter}>
          <View style={styles.pairingStats}>
            {item.likesCount > 0 && (
              <View style={styles.statItem}>
                <Ionicons name="thumbs-up" size={14} color={COLORS.primary} />
                <Text style={styles.statText}>{item.likesCount}</Text>
              </View>
            )}
            {item.commentsCount > 0 && (
              <View style={styles.statItem}>
                <Ionicons name="chatbubble" size={14} color={COLORS.primary} />
                <Text style={styles.statText}>{item.commentsCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Header with username and settings icon */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {profileUser?.username || 'Profile'}
        </Text>
        <TouchableOpacity 
          style={styles.headerRight}
          onPress={handleSettingsPress}
        >
          <Ionicons name="settings-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Information Row */}
        <View style={styles.profileInfoSection}>
          <View style={styles.profileInfoRow}>
            {/* Profile Image */}
            <View style={styles.profileImageContainer}>
              <Image 
                source={{ uri: profileUser?.photoURL || DEFAULT_PROFILE_IMAGE }}
                style={styles.profileImage}
                contentFit="cover"
                transition={300}
                cachePolicy="memory-disk"
                placeholder={{ uri: profileUser?.photoURL || DEFAULT_PROFILE_IMAGE }}
              />
            </View>
            
            {/* Stats */}
            <View style={styles.statsContainer}>
              <ProfileStatItem 
                value={totalPairings} 
                label="Pairings" 
              />
              <ProfileStatItem 
                value={totalFlakes} 
                label="Flakes" 
              />
            </View>
          </View>
        </View>
        
        {/* Bio Section */}
        <View style={styles.bioSection}>
          <Text style={styles.displayName}>
            {profileUser?.displayName || 'User'}
          </Text>
          
          {profileUser?.username && (
            <Text style={styles.username}>@{profileUser.username}</Text>
          )}
        </View>
        
        {/* Edit Profile Button */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={handleEditProfilePress}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
        
        {/* Recent Pairings Section */}
        <View style={styles.pairingsSection}>
          <View style={styles.pairingsSectionHeader}>
            <Ionicons name="grid-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Recent Pairings</Text>
          </View>
          
          {recentPairings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name="images-outline" 
                size={48} 
                color={COLORS.textSecondary} 
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyText}>
                No pairings yet. Complete your daily pairings to see them here!
              </Text>
            </View>
          ) : (
            <FlatList
              data={recentPairings}
              renderItem={renderProfilePairingCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;