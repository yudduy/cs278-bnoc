/**
 * ChatContext
 * 
 * Provides context for managing chat for the current pairing.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { ChatMessage } from '../types';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from './AuthContext';

// Mock messages for immediate demo
const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: 'msg1',
    chatRoomId: 'chat1',
    senderId: 'user2',
    text: 'Hey! Looking forward to our pairing today. What time works for you?',
    createdAt: new Date(Date.now() - 3600000) as any, // 1 hour ago
  },
  {
    id: 'msg2',
    chatRoomId: 'chat1',
    senderId: 'currentuser',
    text: "Hi! I'm free after 3pm. How about you?",
    createdAt: new Date(Date.now() - 3000000) as any, // 50 minutes ago
  },
  {
    id: 'msg3',
    chatRoomId: 'chat1',
    senderId: 'user2',
    text: '3pm works! Maybe we could do something outdoors?',
    createdAt: new Date(Date.now() - 2400000) as any, // 40 minutes ago
  }
];

// Context type definition based on update1.md
interface ChatContextType {
  chatRoomId: string | null;
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  chatError: string | null;
  isSendingMessage: boolean;

  loadMessagesForPairing: (pairingId: string, chatId: string) => void; // Sets up listener
  sendMessage: (text: string) => Promise<void>;
  clearChatState: () => void; // When pairing changes or user logs out
}

// Create the context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider props type
interface ChatProviderProps {
  children: ReactNode;
}

// Provider component
export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  // State
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  
  // Get auth context for user info
  const { user } = useAuth();

  /**
   * Loads messages for a specific pairing and sets up a real-time listener
   * For demo purposes, returns mock messages
   */
  const loadMessagesForPairing = (pairingId: string, chatId: string): void => {
    if (!user?.id) {
      setChatError('User not authenticated');
      return;
    }
    
    try {
      setIsLoadingMessages(true);
      setChatError(null);
      
      // Set the active chat room ID
      setChatRoomId(chatId);
      
      // For demo, use mock messages
      setMessages(MOCK_MESSAGES);
      
      // In a real implementation, this would set up a real-time listener:
      // const unsubscribe = firebase.firestore()
      //   .collection('chatRooms')
      //   .doc(chatId)
      //   .collection('messages')
      //   .orderBy('createdAt')
      //   .onSnapshot(snapshot => {
      //     const newMessages = snapshot.docs.map(doc => ({
      //       id: doc.id,
      //       ...doc.data()
      //     }));
      //     setMessages(newMessages);
      //   });
      
      // Would return unsubscribe function to clean up listener when component unmounts
      
      setIsLoadingMessages(false);
    } catch (error) {
      console.error('Error loading messages:', error);
      setChatError('Failed to load chat messages');
      setIsLoadingMessages(false);
    }
  };
  
  /**
   * Sends a new message in the active chat room
   */
  const sendMessage = async (text: string): Promise<void> => {
    if (!user?.id || !chatRoomId || !text.trim()) {
      setChatError('Cannot send message - missing user, chat room, or message text');
      return;
    }
    
    try {
      setIsSendingMessage(true);
      setChatError(null);
      
      // Create a new message
      const newMessage: ChatMessage = {
        id: `msg${Date.now()}`,
        chatRoomId,
        senderId: user.id,
        text: text.trim(),
        createdAt: Timestamp.now(),
      };
      
      // For demo, just add to local state
      setMessages(prevMessages => [...prevMessages, newMessage]);
      
      // In a real implementation, this would save to Firestore:
      // await firebase.firestore()
      //   .collection('chatRooms')
      //   .doc(chatRoomId)
      //   .collection('messages')
      //   .add({
      //     senderId: user.id,
      //     text: text.trim(),
      //     createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      //   });
      
      setIsSendingMessage(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setChatError('Failed to send message');
      setIsSendingMessage(false);
    }
  };
  
  /**
   * Clears the chat state (used when pairing changes or user logs out)
   */
  const clearChatState = (): void => {
    setChatRoomId(null);
    setMessages([]);
    setChatError(null);
  };
  
  // Provide context value
  const contextValue: ChatContextType = {
    chatRoomId,
    messages,
    isLoadingMessages,
    chatError,
    isSendingMessage,
    loadMessagesForPairing,
    sendMessage,
    clearChatState,
  };
  
  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

/**
 * Custom hook to use the chat context
 */
export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  
  return context;
}; 