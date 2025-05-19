import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Comment } from '../../types';
import { COLORS } from '../../config/colors';
import { useNavigation } from '@react-navigation/native';
import CommentInput from './CommentInput';

interface CommentListProps {
  pairingId: string;
  comments: Comment[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  initiallyExpanded?: boolean;
}

const CommentList = ({
  pairingId,
  comments,
  isLoading = false,
  onRefresh,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
  initiallyExpanded = false,
}: CommentListProps) => {
  const navigation = useNavigation<any>();
  const [expanded, setExpanded] = useState(initiallyExpanded);
  
  // Display limited or all comments based on expanded state
  const displayComments = expanded 
    ? comments 
    : comments.slice(0, Math.min(2, comments.length));
  
  // Format timestamp
  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date 
      ? timestamp 
      : new Date(timestamp.seconds * 1000);
    
    // If today, show time, otherwise show date
    const today = new Date();
    const isToday = date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  
  // Render a comment
  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentContainer}>
      <Image 
        source={item.userPhotoURL ? { uri: item.userPhotoURL } : { uri: 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fmb.jpeg?alt=media&token=e6e88f85-a09d-45cc-b6a4-cad438d1b2f6' }}
        style={styles.avatar}
      />
      
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.timestamp}>{formatTimestamp(item.createdAt)}</Text>
        </View>
        
        <Text style={styles.commentText}>{item.text}</Text>
      </View>
    </View>
  );
  
  // Navigate to full comments screen
  const handleViewAllComments = () => {
    navigation.navigate('PairingDetail', { pairingId, focusComments: true });
  };
  
  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading comments...</Text>
        </View>
      ) : comments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No comments yet. Be the first to comment!</Text>
        </View>
      ) : (
        <>
          <View style={styles.commentsList}>
            {displayComments.map((comment) => renderComment({ item: comment }))}
          </View>
          
          {comments.length > 2 && !expanded && (
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={handleViewAllComments}
            >
              <Text style={styles.viewAllText}>
                View all {comments.length} comments
              </Text>
            </TouchableOpacity>
          )}
          
          {loadingMore && (
            <ActivityIndicator 
              style={styles.loadMoreIndicator} 
              size="small" 
              color={COLORS.primary} 
            />
          )}
        </>
      )}
      
      <CommentInput pairingId={pairingId} onCommentAdded={onRefresh} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  commentsList: {
    paddingHorizontal: 16,
  },
  commentContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  commentText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  viewAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  loadMoreIndicator: {
    marginVertical: 8,
  },
});

export default CommentList; 