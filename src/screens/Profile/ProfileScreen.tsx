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
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  FlatList,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { usePairing } from '../../context/PairingContext';
import { User, UserFeedItem } from '../../types';
import NavigationService from '../../navigation/NavigationService';
import ProfileStatItem from '../../components/profile/ProfileStatItem';
import { profileStyles as styles } from './ProfileStyles';
import PostCard from '../../components/feed/PostCard';

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
  const [recentPairings, setRecentPairings] = useState<UserFeedItem[]>([]);

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
      
      // Set profile user from auth context
      setProfileUser(user);
      
      // Mock data for stats (in real app, would fetch from Firestore)
      setTotalPairings(15);
      setTotalFlakes(3);
      
      // Mock recent pairings (in real app, would fetch from Firestore)
      const mockPairings: UserFeedItem[] = [
        {
          pairingId: 'pairing1',
          date: new Date() as any,
          user1_id: 'user1',
          user2_id: user.id,
          status: 'completed',
          user1_photoURL: 'https://picsum.photos/300/400?random=1',
          user2_photoURL: 'https://picsum.photos/300/400?random=2',
          likesCount: 5,
          commentsCount: 2
        },
        {
          pairingId: 'pairing2',
          date: new Date(Date.now() - 86400000) as any, // Yesterday
          user1_id: user.id,
          user2_id: 'user3',
          status: 'completed',
          user1_photoURL: 'https://picsum.photos/300/400?random=3',
          user2_photoURL: 'https://picsum.photos/300/400?random=4',
          likesCount: 3,
          commentsCount: 1
        },
        {
          pairingId: 'pairing3',
          date: new Date(Date.now() - 172800000) as any, // 2 days ago
          user1_id: 'user4',
          user2_id: user.id,
          status: 'completed',
          user1_photoURL: 'https://picsum.photos/300/400?random=5',
          user2_photoURL: 'https://picsum.photos/300/400?random=6',
          likesCount: 7,
          commentsCount: 4
        }
      ];
      
      setRecentPairings(mockPairings);
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
  
  // Render a pairing card
  const renderPairingCard = ({ item }: { item: UserFeedItem }) => {
    const imageURL = item.user1_id === user?.id ? item.user2_photoURL : item.user1_photoURL;
    
    // Get user information using mock data for now
    const getMockUserInfo = (userId: string) => {
      return {
        id: userId,
        username: userId === 'user1' ? 'justin' : userId === 'user3' ? 'duy' : userId === 'user4' ? 'vivian' : 'partner'
      };
    };
    
    const user1 = getMockUserInfo(item.user1_id);
    const user2 = getMockUserInfo(item.user2_id);

    return (
      <PostCard
        id={item.pairingId}
        users={[user1, user2]}
        imageURL={imageURL || 'https://picsum.photos/300/400?random=7'}
        timestamp={new Date(item.date)}
        likesCount={item.likesCount}
        commentsCount={item.commentsCount}
        onOptions={() => handlePairingDetail(item.pairingId)}
        onLike={() => {}}
        onReact={() => {}}
      />
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
                source={profileUser?.photoURL 
                  ? { uri: profileUser.photoURL } 
                  : { uri: 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fmb.jpeg?alt=media&token=e6e88f85-a09d-45cc-b6a4-cad438d1b2f6' }}
                style={styles.profileImage}
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
              renderItem={renderPairingCard}
              keyExtractor={(item) => item.pairingId}
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