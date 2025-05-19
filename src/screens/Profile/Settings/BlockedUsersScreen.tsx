/**
 * BlockedUsersScreen
 * 
 * Allows users to view and manage their blocked users list
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../config/colors';
import { globalStyles } from '../../../styles/globalStyles';
import { useAuth } from "../../../context/AuthContext";
import firebaseService from '../../../services/firebase';
import { User } from '../../../types';

const BlockedUsersScreen = () => {
  const navigation = useNavigation();
  const auth = useAuth();
  const user = auth?.user;
  
  // State
  const [loading, setLoading] = useState(true);
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
  
  // Load blocked users
  useEffect(() => {
    const loadBlockedUsers = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        // Get user data to access blockedIds
        const userData = await firebaseService.getUserById(user.id);
        
        if (!userData || !userData.blockedIds || userData.blockedIds.length === 0) {
          setBlockedUsers([]);
          setLoading(false);
          return;
        }
        
        // Get user details for each blocked ID
        const blockedUsersData: User[] = [];
        
        for (const blockedId of userData.blockedIds) {
          const blockedUserData = await firebaseService.getUserById(blockedId);
          
          if (blockedUserData) {
            blockedUsersData.push(blockedUserData);
          }
        }
        
        setBlockedUsers(blockedUsersData);
      } catch (error) {
        console.error('Error loading blocked users:', error);
        Alert.alert('Error', 'Failed to load blocked users');
      } finally {
        setLoading(false);
      }
    };
    
    loadBlockedUsers();
  }, [user?.id]);
  
  // Unblock user
  const handleUnblockUser = async (blockedUserId: string) => {
    if (!user?.id) return;
    
    try {
      Alert.alert(
        'Unblock User',
        'Are you sure you want to unblock this user? They will be able to interact with you again.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Unblock',
            onPress: async () => {
              setLoading(true);
              
              await firebaseService.unblockUser(user.id, blockedUserId);
              
              // Update local state
              setBlockedUsers(prev => prev.filter(u => u.id !== blockedUserId));
              
              setLoading(false);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error unblocking user:', error);
      Alert.alert('Error', 'Failed to unblock user');
      setLoading(false);
    }
  };
  
  // Render blocked user item
  const renderBlockedUser = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          {item.photoURL ? (
            <Image source={{ uri: item.photoURL }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {item.displayName?.charAt(0) || item.username?.charAt(0) || '?'}
            </Text>
          )}
        </View>
        
        <View style={styles.userDetails}>
          <Text style={styles.displayName}>
            {item.displayName || 'User'}
          </Text>
          {item.username && (
            <Text style={styles.username}>@{item.username}</Text>
          )}
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.unblockButton}
        onPress={() => handleUnblockUser(item.id)}
      >
        <Text style={styles.unblockText}>Unblock</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="shield-checkmark-outline" size={64} color={COLORS.textSecondary} />
      <Text style={styles.emptyTitle}>No Blocked Users</Text>
      <Text style={styles.emptyText}>
        Users you block will appear here. Blocked users cannot see your pairings or interact with you.
      </Text>
    </View>
  );
  
  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blocked Users</Text>
        <View style={styles.headerRight} />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading blocked users...</Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          renderItem={renderBlockedUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  userDetails: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  unblockButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  unblockText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default BlockedUsersScreen; 