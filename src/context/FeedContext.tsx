/**
 * FeedContext
 * 
 * Context provider for managing feed data and state with optimizations.
 * Implements denormalized data structure for O(1) feed queries and
 * pagination support for efficient feed loading.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp, Unsubscribe } from 'firebase/firestore';
import { db } from '../config/firebase';
import firebaseService from '../services/firebase';
import { useAuth } from './AuthContext';
import { Pairing, User } from '../types';

// Feed pagination state
interface FeedPagination {
  lastVisible: any;
  hasMore: boolean;
}

// Context type definition
interface FeedContextType {
  // Feed data
  pairings: Pairing[];
  users: Record<string, User>;
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  pagination: FeedPagination;
  
  // Feed actions
  loadFeed: (refresh?: boolean) => Promise<void>;
  loadMoreFeed: () => Promise<void>;
  refreshFeed: () => Promise<void>;
  getPairingById: (pairingId: string) => Pairing | null;
  getUserById: (userId: string) => User | null;
  clearError: () => void;
}

// Create the context
const FeedContext = createContext<FeedContextType | undefined>(undefined);

// Provider props type
interface FeedProviderProps {
  children: ReactNode;
  initialPageSize?: number;
}

// Provider component
export const FeedProvider: React.FC<FeedProviderProps> = ({ 
  children,
  initialPageSize = 10
}) => {
  // Get auth context
  const { user } = useAuth();
  
  // State
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<FeedPagination>({
    lastVisible: null,
    hasMore: true,
  });
  
  // Real-time listener cleanup
  const [feedListener, setFeedListener] = useState<Unsubscribe | null>(null);
  
  // Load initial feed data
  useEffect(() => {
    if (user?.id) {
      loadFeed(true);
      setupFeedListener();
    } else {
      // Clean up listener if user logs out
      if (feedListener) {
        feedListener();
        setFeedListener(null);
      }
    }
    
    // Cleanup listener on unmount
    return () => {
      if (feedListener) {
        feedListener();
        setFeedListener(null);
      }
    };
  }, [user?.id]);
  
  /**
   * Set up real-time listener for completed pairings
   */
  const setupFeedListener = () => {
    if (!user?.id) return;
    
    // Clean up existing listener
    if (feedListener) {
      feedListener();
    }
    
    // Listen for completed pairings that include the current user
    const feedQuery = query(
      collection(db, 'pairings'),
      where('status', '==', 'completed'),
      where('users', 'array-contains', user.id),
      orderBy('completedAt', 'desc'),
      limit(20)
    );
    
    const unsubscribe = onSnapshot(feedQuery, async (snapshot) => {
      try {
        const completedPairings: Pairing[] = [];
        
        snapshot.forEach((doc) => {
          const pairingData = { id: doc.id, ...doc.data() } as Pairing;
          completedPairings.push(pairingData);
        });
        
        // Update pairings state with real-time data
        setPairings(completedPairings);
        
        // Fetch user data for any new pairings
        const newUsers: Record<string, User> = { ...users };
        const userIds = new Set<string>();
        completedPairings.forEach(pairing => {
          pairing.users.forEach(userId => userIds.add(userId));
        });
        
        const usersToFetch = Array.from(userIds).filter(id => !newUsers[id]);
        if (usersToFetch.length > 0) {
          await Promise.all(
            usersToFetch.map(async (userId) => {
              try {
                const userData = await firebaseService.getUserById(userId);
                if (userData) {
                  newUsers[userId] = userData;
                }
              } catch (error) {
                console.error(`Error fetching user ${userId}:`, error);
              }
            })
          );
          setUsers(newUsers);
        }
      } catch (error) {
        console.error('Error processing feed updates:', error);
      }
    }, (error) => {
      console.error('Error listening to feed updates:', error);
    });
    
    setFeedListener(unsubscribe);
  };
  
  /**
   * Load feed data
   * @param refresh Whether to refresh from the beginning
   */
  const loadFeed = async (refresh: boolean = false): Promise<void> => {
    if (!user?.id) return;
    
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoadingMore(true);
      }
      
      setError(null);
      
      // Get feed data
      const result = await firebaseService.getFeed(
        user.id,
        Number(initialPageSize),
        refresh ? undefined : pagination.lastVisible
      );
      
      // Extract users from pairings for denormalized data
      const newUsers: Record<string, User> = { ...users };
      
      // Batch fetch users for all pairings
      const userIds = new Set<string>();
      result.pairings.forEach(pairing => {
        pairing.users.forEach(userId => userIds.add(userId));
      });
      
      // Fetch users that we don't already have
      const usersToFetch = Array.from(userIds).filter(id => !newUsers[id]);
      if (usersToFetch.length > 0) {
        await Promise.all(
          usersToFetch.map(async (userId) => {
            try {
              const userData = await firebaseService.getUserById(userId);
              if (userData) {
                newUsers[userId] = userData;
              }
            } catch (error) {
              console.error(`Error fetching user ${userId}:`, error);
            }
          })
        );
      }
      
      // Update state
      if (refresh) {
        setPairings(result.pairings);
        setUsers(newUsers);
      } else {
        // Filter out duplicates when loading more
        const existingIds = new Set(pairings.map(p => p.id));
        const newPairings = result.pairings.filter(p => !existingIds.has(p.id));
        
        setPairings(prevPairings => [...prevPairings, ...newPairings]);
        setUsers(newUsers);
      }
      
      // Update pagination
      setPagination({
        lastVisible: result.lastVisible,
        hasMore: result.hasMore,
      });
    } catch (error) {
      console.error('Error loading feed:', error);
      setError('Failed to load feed. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };
  
  /**
   * Load more feed data
   */
  const loadMoreFeed = async (): Promise<void> => {
    if (!loadingMore && pagination.hasMore && !refreshing) {
      await loadFeed(false);
    }
  };
  
  /**
   * Refresh feed data
   */
  const refreshFeed = async (): Promise<void> => {
    if (!refreshing) {
      await loadFeed(true);
    }
  };
  
  /**
   * Get pairing by ID
   */
  const getPairingById = (pairingId: string): Pairing | null => {
    return pairings.find(p => p.id === pairingId) || null;
  };
  
  /**
   * Get user by ID
   */
  const getUserById = (userId: string): User | null => {
    return users[userId] || null;
  };
  
  /**
   * Clear error
   */
  const clearError = (): void => {
    setError(null);
  };
  
  // Context value
  const value: FeedContextType = {
    pairings,
    users,
    loading,
    refreshing,
    loadingMore,
    error,
    pagination,
    loadFeed,
    loadMoreFeed,
    refreshFeed,
    getPairingById,
    getUserById,
    clearError,
  };
  
  return (
    <FeedContext.Provider value={value}>
      {children}
    </FeedContext.Provider>
  );
};

// Custom hook to use the feed context
export const useFeed = (): FeedContextType => {
  const context = useContext(FeedContext);
  
  if (context === undefined) {
    throw new Error('useFeed must be used within a FeedProvider');
  }
  
  return context;
};
