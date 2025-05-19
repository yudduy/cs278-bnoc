/**
 * MessageBubble
 * 
 * Component for rendering chat message bubbles with the black and white theme.
 */

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet
} from 'react-native';
import { COLORS, FONTS, BORDER_RADIUS } from '../../config/theme';

interface MessageBubbleProps {
  message: string;
  timestamp: string | Date;
  isCurrentUser: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  timestamp,
  isCurrentUser,
}) => {
  // Format the timestamp
  const formattedTime = timestamp instanceof Date 
    ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : new Date(typeof timestamp === 'number' ? timestamp : timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

  return (
    <View style={[
      styles.container,
      isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer
    ]}>
      <View style={[
        styles.bubble,
        isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
      ]}>
        <Text style={styles.messageText}>{message}</Text>
      </View>
      <Text style={styles.timestamp}>{formattedTime}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: '80%',
    marginVertical: 8,
  },
  currentUserContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherUserContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: 4,
  },
  currentUserBubble: {
    backgroundColor: '#222222', // Darker gray for outgoing messages
    borderTopRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: '#3A3A3A', // Lighter gray for incoming messages
    borderTopLeftRadius: 4,
  },
  messageText: {
    color: COLORS.primary,
    fontFamily: FONTS.regular,
    fontSize: 16,
  },
  timestamp: {
    color: '#AAAAAA', // Medium gray for timestamps
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: 2,
  },
});

export default MessageBubble; 