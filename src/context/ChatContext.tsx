/**
 * ChatContext
 * 
 * Provides context for managing chat for the current pairing.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { ChatMessage } from '../types';
import { Timestamp, collection, addDoc, query, orderBy, onSnapshot, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { db } from '../config/firebase';

// Context type definition
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
  const [unsubscribeListener, setUnsubscribeListener] = useState<(() => void) | null>(null);
  
  // Get auth context for user info
  const { user } = useAuth();

  // Clean up listener when unmounting
  useEffect(() => {
    return () => {
      if (unsubscribeListener) {
        unsubscribeListener();
      }
    };
  }, [unsubscribeListener]);

  /**
   * Loads messages for a specific pairing and sets up a real-time listener
   */
  const loadMessagesForPairing = (pairingId: string, chatId: string): void => {
    if (!user?.id) {
      setChatError('User not authenticated');
      return;
    }
    
    try {
      setIsLoadingMessages(true);
      setChatError(null);
      
      // Clean up previous listener if exists
      if (unsubscribeListener) {
        unsubscribeListener();
      }
      
      // Set the active chat room ID
      setChatRoomId(chatId);
      
      // Set up a real-time listener for messages
      const messagesRef = collection(db, 'chatRooms', chatId, 'messages');
      const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));
      
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const newMessages: ChatMessage[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as ChatMessage));
        
        setMessages(newMessages);
        setIsLoadingMessages(false);
      }, (error) => {
        console.error('Error in chat listener:', error);
        setChatError('Failed to load chat messages');
        setIsLoadingMessages(false);
      });
      
      // Save unsubscribe function for cleanup
      setUnsubscribeListener(() => unsubscribe);
      
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
      
      // Add the message to Firestore
      const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
      await addDoc(messagesRef, {
        chatRoomId,
        senderId: user.id,
        text: text.trim(),
        createdAt: serverTimestamp(),
      });
      
      // Update last message in chat room
      // In a real app, you'd also update the chat room doc with the last message
      
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
    // Clean up listener if exists
    if (unsubscribeListener) {
      unsubscribeListener();
      setUnsubscribeListener(null);
    }
    
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