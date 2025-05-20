/**
 * FindFriendsScreen
 * 
 * Screen for discovering and adding new connections.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { debounce } from 'lodash';

import { COLORS } from '../../config/theme';
import { globalStyles } from '../../styles/globalStyles';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';
import * as userService from '../../services/userService';

// Default profile image
const DEFAULT_PROFILE_IMAGE = 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fdefault-profile.jpg?alt=media&token=e6e88f85-a09d-45cc-b6a4-cad438d1b2f6';

const FindFriendsScreen: React.FC = () => {
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingIds, setAddingIds] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [connections, setConnections] = useState<string[]>([]);
  
  // Hooks
  const { user } = useAuth();
  const navigation = useNavigation();
  
  // Load all users on component mount
  useEffect(() => {
    loadUsers();
    if (user?.id) {
      loadConnections();
    }
  }, [user?.id]);
  
  // Filter users whenever search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = users.filter(u => 
        u.username.toLowerCase().includes(query) || 
        (u.displayName?.toLowerCase().includes(query) || false)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);
  
  /**
   * Load all users from the database
   */
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Query all users from Firestore
      const allUsers = await userService.getAllUsers();
      
      // Filter out current user and blocked users
      const filteredUsers = allUsers.filter((u: User) => {
        // Skip current user
        if (u.id === user?.id) return false;
        
        // Skip blocked users
        if (user?.blockedIds?.includes(u.id)) return false;
        
        return true;
      });
      
      setUsers(filteredUsers);
      setFilteredUsers(filteredUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Load user's connections
   */
  const loadConnections = async () => {
    try {
      if (!user?.id) return;
      
      // Get the current user's connections
      const currentUser = await userService.getUserById(user.id);
      
      if (currentUser && Array.isArray(currentUser.connections)) {
        setConnections(currentUser.connections);
      } else {
        setConnections([]);
      }
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };
  
  /**
   * Add a user as a connection (mutual friendship)
   */
  const handleAddConnection = async (targetUserId: string) => {
    try {
      // Update loading state for this specific user
      setAddingIds(prev => ({ ...prev, [targetUserId]: true }));
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      // Call the userService to update connection (mutual)
      await userService.updateConnection(user.id, targetUserId, 'add');
      
      // Update local connections list
      setConnections(prev => [...prev, targetUserId]);
      
      // Show success message
      Alert.alert('Success', 'Friend added successfully! You are now connected with this user.');
    } catch (error) {
      console.error('Error adding connection:', error);
      Alert.alert('Error', 'Failed to add friend. Please try again.');
    } finally {
      setAddingIds(prev => ({ ...prev, [targetUserId]: false }));
    }
  };
  
  /**
   * Handle search input change with debounce
   */
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };
  
  // Debounced version of search
  const debouncedSearch = useCallback(debounce(handleSearchChange, 300), []);
  
  /**
   * Render a user item in the list
   */
  const renderUserItem = ({ item }: { item: User }) => {
    const isConnected = connections.includes(item.id);
    const isLoading = !!addingIds[item.id];
    
    return (
      <View style={styles.userItem}>
        <Image 
          source={{ uri: item.photoURL || DEFAULT_PROFILE_IMAGE }}
          style={styles.userAvatar}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.displayName || item.username}</Text>
          <Text style={styles.userUsername}>@{item.username}</Text>
        </View>
        {isConnected ? (
          <View style={styles.connectedButton}>
            <Text style={styles.connectedButtonText}>Added</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => handleAddConnection(item.id)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={styles.addButtonText}>Add</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  /**
   * Render the list header with search
   */
  const renderListHeader = () => {
    return (
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for friends..."
            placeholderTextColor={COLORS.textSecondary}
            onChangeText={debouncedSearch}
            defaultValue={searchQuery}
          />
        </View>
      </View>
    );
  };
  
  /**
   * Render empty state
   */
  const renderEmptyComponent = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={64} color={COLORS.textSecondary} />
        <Text style={styles.emptyTitle}>No results found</Text>
        <Text style={styles.emptyText}>
          Try adjusting your search or wait for more users to join.
        </Text>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Find Friends</Text>
          <Text style={styles.suggestedCount}>
            {filteredUsers.length > 0 ? `${filteredUsers.length} Suggested` : ''}
          </Text>
        </View>
        
        {/* User List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            renderItem={renderUserItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={renderEmptyComponent}
            showsVerticalScrollIndicator={false}
          />
        )}
        
        {/* Error Banner */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'ChivoBold',
    fontSize: 20,
    color: COLORS.text,
    marginLeft: 16,
  },
  backButton: {
    padding: 4,
  },
  suggestedCount: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: COLORS.text,
    fontFamily: 'ChivoRegular',
    fontSize: 16,
  },
  listContent: {
    flexGrow: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.placeholder,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: COLORS.text,
  },
  userUsername: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  addButtonText: {
    fontFamily: 'ChivoBold',
    fontSize: 14,
    color: COLORS.background,
  },
  connectedButton: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  connectedButtonText: {
    fontFamily: 'ChivoBold',
    fontSize: 14,
    color: COLORS.primary,
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
    marginTop: 12,
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
});

export default FindFriendsScreen;