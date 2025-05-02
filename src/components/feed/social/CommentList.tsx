/**
 * CommentList Component
 * 
 * Enhanced comment list and input for the Daily Meetup Selfie app.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  FlatList,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../config/theme';
import { usePairing } from '../../../context/PairingContext';
import { useAuth } from '../../../context/AuthContext';
import { Comment } from '../../../types';
import { formatDate } from '../../../utils/dateUtils';

// Default avatar placeholder
const defaultAvatar = 'https://via.placeholder.com/100';

interface CommentListProps {
  pairingId: string;
  comments: Comment[];
}

const CommentList: React.FC<CommentListProps> = ({
  pairingId,
  comments,
}) => {
  // State
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showAll, setShowAll] = useState(false);
  
  // Animation value for sliding in comments
  const slideAnim = useRef(new Animated.Value(20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  // Ref for input
  const inputRef = useRef<TextInput>(null);
  
  // Get context
  const { user } = useAuth();
  const { addCommentToPairing } = usePairing();
  
  // Filter comments for display (limited or all)
  const displayComments = showAll
    ? comments
    : comments.length > 3
    ? comments.slice(Math.max(0, comments.length - 3))
    : comments;
  
  // Track keyboard visibility
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);
  
  // Animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Handle comment submission
  const handleSubmit = async () => {
    if (!newComment.trim() || !user?.id || submitting) return;
    
    try {
      setSubmitting(true);
      
      await addCommentToPairing(pairingId, newComment.trim());
      
      // Clear input after successful submission
      setNewComment('');
      Keyboard.dismiss();
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Focus the input when tapped
  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Format timestamp for display
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    
    // Convert to date using our utility function
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return formatDate(date, 'MMM d');
  };
  
  // Render an individual comment
  const renderComment = ({ item, index }: { item: Comment, index: number }) => {
    // Stagger animation delay based on index
    const animationDelay = index * 50;
    
    return (
      <Animated.View
        style={[
          styles.commentItem,
          {
            opacity: opacityAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Image
          source={{ uri: item.userPhotoURL || defaultAvatar }}
          style={styles.commentAvatar}
        />
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentUsername}>{item.username}</Text>
            <Text style={styles.commentTimestamp}>
              {formatTimestamp(item.createdAt)}
            </Text>
          </View>
          <Text style={styles.commentText}>{item.text}</Text>
        </View>
      </Animated.View>
    );
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      style={styles.container}
    >
      {/* View All Comments Button */}
      {comments.length > 3 && !showAll && (
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => setShowAll(true)}
        >
          <Text style={styles.viewAllText}>
            View all {comments.length} comments
          </Text>
        </TouchableOpacity>
      )}
      
      {/* Comments List */}
      <FlatList
        data={displayComments}
        renderItem={renderComment}
        keyExtractor={item => item.id}
        scrollEnabled={displayComments.length > 5}
        showsVerticalScrollIndicator={false}
        maxToRenderPerBatch={10}
        initialNumToRender={5}
        contentContainerStyle={styles.commentsList}
        ListEmptyComponent={
          <Text style={styles.emptyCommentsText}>
            No comments yet. Be the first to comment!
          </Text>
        }
      />
      
      {/* Comment Input */}
      <View style={styles.inputContainer}>
        <Image
          source={{ uri: user?.photoURL || defaultAvatar }}
          style={styles.inputAvatar}
        />
        <TouchableOpacity
          style={styles.inputWrapper}
          activeOpacity={1}
          onPress={focusInput}
        >
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Add a comment..."
            placeholderTextColor={COLORS.textSecondary}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
            returnKeyType="done"
            blurOnSubmit={true}
            onSubmitEditing={handleSubmit}
          />
          
          {newComment.trim() ? (
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  viewAllButton: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  viewAllText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.primary,
  },
  commentsList: {
    flexGrow: 1,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 16,
    padding: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUsername: {
    fontFamily: 'ChivoBold',
    fontSize: 14,
    color: COLORS.text,
  },
  commentTimestamp: {
    fontFamily: 'ChivoRegular',
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  commentText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  emptyCommentsText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: 4,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 40,
  },
  input: {
    flex: 1,
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.text,
    maxHeight: 100,
    padding: 0,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default CommentList;
