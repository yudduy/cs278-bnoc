/**
 * FirebaseProvider - Updated for Direct Authentication in React Native
 * 
 * Handles Firebase initialization and authentication state using AsyncStorage
 * instead of Firebase Auth. Removed web-specific code.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Import from firebaseInit directly, only db and storage now
import { isFirebaseInitialized, firebaseApp, db, storage } from '../config/firebaseInit';

// For debugging purposes
console.log('FirebaseProvider module loaded - Firebase initialized:', isFirebaseInitialized());

interface FirebaseContextType {
  isFirebaseReady: boolean;
}

const FirebaseContext = createContext<FirebaseContextType>({
  isFirebaseReady: false
});

interface FirebaseProviderProps {
  children: ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    console.log("FirebaseProvider: Initializing Firebase components");
    
    let mounted = true;
    
    // Use a reasonable fallback timeout for Firebase initialization
    const fallbackTimer = setTimeout(() => {
      console.log("FirebaseProvider: Fallback timeout triggered, forcing ready state");
      if (mounted) {
        setIsFirebaseReady(true);
      }
    }, 3000);
    
    const initializeFirebase = async () => {
      try {
        // Check if Firebase is properly initialized
        if (!isFirebaseInitialized()) {
          console.warn("FirebaseProvider: Firebase not fully initialized");
          if (mounted) {
            setInitError("Firebase initialization is incomplete. The app may have limited functionality.");
          }
        } else {
          console.log("FirebaseProvider: Firebase is initialized");
        }
        
        // Check for authenticated user in AsyncStorage
        try {
          const storedUser = await AsyncStorage.getItem('authenticatedUser');
          console.log("FirebaseProvider: Checked AsyncStorage for auth", storedUser ? "User found" : "No user");
          
          // We've successfully checked auth state - mark as ready
          if (mounted) {
            setIsFirebaseReady(true);
            clearTimeout(fallbackTimer);
          }
        } catch (authError) {
          console.error("FirebaseProvider: Error checking auth state:", authError);
          if (mounted) {
            setInitError("Auth check error: " + String(authError));
            // Let the fallback timer handle it
          }
        }
      } catch (error) {
        console.error("FirebaseProvider: Exception during initialization", error);
        if (mounted) {
          setInitError("Initialization error: " + (error instanceof Error ? error.message : String(error)));
          setIsFirebaseReady(true); // Force ready state on exception
          clearTimeout(fallbackTimer);
        }
      }
    };

    // Initialize Firebase
    initializeFirebase();

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Show loading state while Firebase initializes
  if (!isFirebaseReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.text}>Initializing app...</Text>
        {initError && <Text style={styles.errorText}>Debug info: {initError}</Text>}
      </View>
    );
  }

  // Otherwise, render children
  return (
    <FirebaseContext.Provider value={{ isFirebaseReady }}>
      {children}
    </FirebaseContext.Provider>
  );
};

// Custom hook to use Firebase context
export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  
  return context;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000'
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF'
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    paddingHorizontal: 20
  }
});

export default FirebaseProvider;