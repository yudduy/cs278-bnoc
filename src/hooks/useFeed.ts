import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, onSnapshot, DocumentSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserFeedItem } from '../types';
import { getFeedForUser } from '../services/feedService';
import { useAuth } from './useAuth';

/**
 * Hook for feed management with pagination and real-time updates
 */
export const useFeed = (itemsPerPage = 10) => {
  const { user } = useAuth();
  const [feedItems, setFeedItems] = useState<UserFeedItem[]>([]);
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load initial feed data
  const loadFeed = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { items, lastVisible: newLastVisible, hasMore: newHasMore } = 
        await getFeedForUser(user.id, itemsPerPage);
      
      setFeedItems(items);
      setLastVisible(newLastVisible);
      setHasMore(newHasMore);
    } catch (err) {
      console.error('Error loading feed:', err);
      setError('Failed to load feed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, itemsPerPage]);
  
  // Load next page of feed items
  const loadMore = useCallback(async () => {
    if (!user?.id || !hasMore || loading || !lastVisible) return;
    
    try {
      setLoading(true);
      
      const { items, lastVisible: newLastVisible, hasMore: newHasMore } = 
        await getFeedForUser(user.id, itemsPerPage, lastVisible);
      
      if (items.length > 0) {
        setFeedItems(prev => [...prev, ...items]);
        setLastVisible(newLastVisible);
      }
      
      setHasMore(newHasMore);
    } catch (err) {
      console.error('Error loading more feed items:', err);
      setError('Failed to load more items. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, hasMore, loading, lastVisible, itemsPerPage]);
  
  // Refresh feed data
  const refreshFeed = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setRefreshing(true);
      setError(null);
      
      const { items, lastVisible: newLastVisible, hasMore: newHasMore } = 
        await getFeedForUser(user.id, itemsPerPage);
      
      setFeedItems(items);
      setLastVisible(newLastVisible);
      setHasMore(newHasMore);
    } catch (err) {
      console.error('Error refreshing feed:', err);
      setError('Failed to refresh feed. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [user?.id, itemsPerPage]);
  
  // Set up real-time listener for feed updates
  useEffect(() => {
    if (!user?.id) return;
    
    // Initial load
    loadFeed();
    
    // Set up real-time listener for most recent items
    const feedRef = collection(db, `userFeeds/${user.id}/items`);
    const recentItemsQuery = query(
      feedRef,
      orderBy('date', 'desc'),
      limit(itemsPerPage)
    );
    
    const unsubscribe = onSnapshot(recentItemsQuery, 
      (snapshot) => {
        // Only update if we have changes
        if (!snapshot.empty) {
          const updatedItems = snapshot.docs.map(doc => ({
            ...doc.data() as UserFeedItem,
            pairingId: doc.id
          }));
          
          // Merge with existing items, avoiding duplicates
          setFeedItems(prev => {
            const updatedItemIds = new Set(updatedItems.map(item => item.pairingId));
            const filteredPrev = prev.filter(item => !updatedItemIds.has(item.pairingId));
            
            // Combine updated items with filtered previous items
            const combined = [...updatedItems, ...filteredPrev];
            
            // Sort by date descending
            return combined.sort((a, b) => {
              const dateA = a.date instanceof Date ? a.date : new Date(a.date.seconds * 1000);
              const dateB = b.date instanceof Date ? b.date : new Date(b.date.seconds * 1000);
              return dateB.getTime() - dateA.getTime();
            });
          });
        }
      },
      (err) => {
        console.error('Feed subscription error:', err);
        setError('Feed subscription error. Please reload the app.');
      }
    );
    
    // Clean up subscription
    return () => unsubscribe();
  }, [user?.id, loadFeed, itemsPerPage]);
  
  return { 
    feedItems, 
    loading, 
    refreshing, 
    error, 
    hasMore, 
    loadMore, 
    refreshFeed 
  };
}; 