import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { COLORS } from '../../config/colors';
import { useAuth } from '../../hooks/useAuth';
import { addCommentToPairing } from '../../services/feedService';
import Ionicons from '@expo/vector-icons/Ionicons';

interface CommentInputProps {
  pairingId: string;
  onCommentAdded?: () => void;
}

const CommentInput = ({ pairingId, onCommentAdded }: CommentInputProps) => {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Handle comment submission
  const handleSubmit = async () => {
    if (!comment.trim() || !user?.id) return;
    
    try {
      setSubmitting(true);
      
      await addCommentToPairing(
        pairingId, 
        comment.trim(), 
        user.id, 
        user.username || user.displayName || 'User', 
        user.photoURL
      );
      
      setComment('');
      
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add your comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Image 
        source={user?.photoURL ? { uri: user.photoURL } : { uri: 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fmb.jpeg?alt=media&token=e6e88f85-a09d-45cc-b6a4-cad438d1b2f6' }}
        style={styles.avatar}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Add a comment..."
        placeholderTextColor={COLORS.textSecondary}
        value={comment}
        onChangeText={setComment}
        multiline
        maxLength={500}
        editable={!submitting}
      />
      
      {comment.trim().length > 0 && (
        <TouchableOpacity
          style={[
            styles.submitButton,
            submitting && styles.disabledButton
          ]}
          onPress={handleSubmit}
          disabled={submitting || !comment.trim()}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.backgroundLight,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: COLORS.text,
    minHeight: 36,
    maxHeight: 100,
  },
  submitButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  disabledButton: {
    backgroundColor: COLORS.primaryLight,
    opacity: 0.7,
  },
});

export default CommentInput; 