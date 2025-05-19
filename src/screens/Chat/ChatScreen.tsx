/**
 * ChatScreen
 * 
 * Implements the 1:1 messaging interface for paired users.
 * Updated with black and white theme and modern design.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { ChatMessage } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, BORDER_RADIUS } from '../../config/theme';
import MessageBubble from '../../components/chat/MessageBubble';

interface ChatScreenParams {
  pairingId: string;
  chatId: string;
  partnerId: string;
  partnerName: string;
}

const ChatScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { pairingId, chatId, partnerId, partnerName = 'Partner' } = route.params as ChatScreenParams;
  
  const flatListRef = useRef<FlatList>(null);
  const [message, setMessage] = useState('');
  
  const { user } = useAuth();
  const { 
    messages, 
    isLoadingMessages, 
    isSendingMessage, 
    loadMessagesForPairing,
    sendMessage,
    chatError,
  } = useChat();
  
  // Load messages when component mounts
  useEffect(() => {
    loadMessagesForPairing(pairingId, chatId);
  }, [pairingId, chatId]);
  
  // Scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages]);
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    try {
      await sendMessage(message.trim());
      setMessage(''); // Clear input after sending
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Navigate to partner's profile
  const handleViewProfile = () => {
    navigation.navigate('Profile', { userId: partnerId });
  };
  
  // Navigate to camera screen
  const handleOpenCamera = () => {
    navigation.navigate('Camera', { pairingId });
  };
  
  // Render a chat message
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isCurrentUser = item.senderId === user?.id || item.senderId === 'currentuser';
    
    return (
      <MessageBubble
        message={item.text}
        timestamp={item.createdAt}
        isCurrentUser={isCurrentUser}
      />
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.headerTitle}
          onPress={handleViewProfile}
        >
          <Text style={styles.headerTitleText}>{partnerName}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleOpenCamera}
        >
          <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isLoadingMessages ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No messages yet. Send a message to {partnerName} to start the conversation!
                </Text>
                <Text style={styles.expiryNote}>
                  Chat expires at 10:00 PM PT
                </Text>
              </View>
            }
          />
        )}
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
            autoCapitalize="sentences"
            selectionColor={COLORS.primary}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!message.trim() || isSendingMessage) && styles.disabledSendButton
            ]}
            onPress={handleSendMessage}
            disabled={!message.trim() || isSendingMessage}
          >
            {isSendingMessage ? (
              <ActivityIndicator size="small" color={COLORS.background} />
            ) : (
              <Ionicons name="send" size={20} color={COLORS.background} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.background,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
    fontSize: 18,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  messagesList: {
    padding: 16,
    paddingTop: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: COLORS.primary,
    fontFamily: FONTS.regular,
    fontSize: 16,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 200,
  },
  emptyText: {
    color: COLORS.primary,
    fontFamily: FONTS.regular,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  expiryNote: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: '#222222',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#222222',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.primary,
    fontFamily: FONTS.regular,
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  disabledSendButton: {
    opacity: 0.5,
  },
});

export default ChatScreen; 