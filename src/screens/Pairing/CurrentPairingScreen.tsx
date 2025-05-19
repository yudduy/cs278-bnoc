/**
 * CurrentPairingScreen
 * 
 * Central screen for daily pairing interactions.
 * Shows partner information, status of photo submissions,
 * and provides buttons for chat and photo submission.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { usePairing } from '../../context/PairingContext';
import { useAuth } from '../../context/AuthContext';
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function CurrentPairingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user } = useAuth();
  const { 
    currentPairing, 
    pairingStatus, 
    loadCurrentPairing,
    pairingError,
    clearPairingError 
  } = usePairing();
  
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [partnerName, setPartnerName] = useState<string>('');
  const [partnerPhoto, setPartnerPhoto] = useState<string | null>(null);
  
  // Load current pairing and partner info
  useEffect(() => {
    const fetchPairingData = async () => {
      try {
        setLoading(true);
        await loadCurrentPairing();
        
        // In a real app, would fetch partner data from Firebase
        // For demo, using mock data from the pairing
        if (currentPairing) {
          const isUser1 = currentPairing.user1_id === user?.id;
          const partnerId = isUser1 ? currentPairing.user2_id : currentPairing.user1_id;
          
          // Mock partner data (would normally be fetched)
          setPartnerName(partnerId === 'user2' ? 'Duy' : 'Justin');
          setPartnerPhoto(require('../../../assets/images/duy.jpg'));
        }
      } catch (error) {
        console.error('Error loading pairing data:', error);
        Alert.alert('Error', 'Failed to load pairing information.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPairingData();
  }, [user?.id]);
  
  // Calculate time remaining until 10:00 PM PT deadline
  useEffect(() => {
    const calculateTimeRemaining = () => {
      if (!currentPairing?.expiresAt) return;
      
      const now = new Date();
      const expiresAt = currentPairing.expiresAt instanceof Date 
        ? currentPairing.expiresAt 
        : new Date(currentPairing.expiresAt.seconds * 1000);
        
      // If already expired
      if (now > expiresAt) {
        setTimeRemaining('Expired');
        return;
      }
      
      // Calculate time difference
      const diffMs = expiresAt.getTime() - now.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeRemaining(`${diffHrs}h ${diffMins}m remaining`);
    };
    
    // Calculate initially
    calculateTimeRemaining();
    
    // Update every minute
    const interval = setInterval(calculateTimeRemaining, 60000);
    return () => clearInterval(interval);
  }, [currentPairing?.expiresAt]);
  
  // Open camera for photo submission
  const handleTakePhoto = () => {
    if (currentPairing) {
      navigation.navigate('Camera', { pairingId: currentPairing.id });
    } else {
      Alert.alert('Error', 'No active pairing found.');
    }
  };
  
  // Open chat with partner
  const handleOpenChat = () => {
    if (currentPairing) {
      navigation.navigate('Chat', { 
        pairingId: currentPairing.id,
        chatId: currentPairing.chatId,
        partnerId: currentPairing.user1_id === user?.id 
          ? currentPairing.user2_id 
          : currentPairing.user1_id
      });
    } else {
      Alert.alert('Error', 'No active pairing found.');
    }
  };
  
  // View completed pairing in feed
  const handleViewInFeed = () => {
    if (currentPairing) {
      navigation.navigate('Feed', { 
        screen: 'FeedScreen', 
        params: { highlightPairingId: currentPairing.id } 
      });
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#006E51" />
          <Text style={styles.loadingText}>Loading today's pairing...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!currentPairing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noPairingContainer}>
          <Text style={styles.noPairingText}>No active pairing for today.</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Determine user and partner photo submission status
  const isUser1 = currentPairing.user1_id === user?.id;
  const userPhotoSubmitted = isUser1 
    ? !!currentPairing.user1_photoURL 
    : !!currentPairing.user2_photoURL;
  const partnerPhotoSubmitted = isUser1
    ? !!currentPairing.user2_photoURL
    : !!currentPairing.user1_photoURL;
  const bothPhotosSubmitted = userPhotoSubmitted && partnerPhotoSubmitted;
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Today's Pairing</Text>
        <Text style={styles.timeRemainingText}>{timeRemaining}</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.partnerCard}>
          <Image 
            source={partnerPhoto ? { uri: partnerPhoto } : { uri: 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fmb.jpeg?alt=media&token=e6e88f85-a09d-45cc-b6a4-cad438d1b2f6' }}
            style={styles.partnerPhoto}
          />
          
          <View style={styles.partnerInfo}>
            <Text style={styles.partnerName}>{partnerName}</Text>
            <Text style={styles.partnerUsername}>@{
              currentPairing.user1_id === user?.id 
                ? currentPairing.user2_id 
                : currentPairing.user1_id
            }</Text>
          </View>
        </View>
        
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Photo Submission Status</Text>
          
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Your Photo</Text>
              {userPhotoSubmitted ? (
                <View style={styles.statusBadgeSuccess}>
                  <AntDesign name="checkcircle" size={16} color="#fff" />
                  <Text style={styles.statusBadgeText}>Submitted</Text>
                </View>
              ) : (
                <View style={styles.statusBadgePending}>
                  <AntDesign name="clockcircle" size={16} color="#fff" />
                  <Text style={styles.statusBadgeText}>Not Submitted</Text>
                </View>
              )}
            </View>
            
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>{partnerName}'s Photo</Text>
              {partnerPhotoSubmitted ? (
                <View style={styles.statusBadgeSuccess}>
                  <AntDesign name="checkcircle" size={16} color="#fff" />
                  <Text style={styles.statusBadgeText}>Submitted</Text>
                </View>
              ) : (
                <View style={styles.statusBadgePending}>
                  <AntDesign name="clockcircle" size={16} color="#fff" />
                  <Text style={styles.statusBadgeText}>Not Submitted</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleOpenChat}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Open Chat with {partnerName}</Text>
          </TouchableOpacity>
          
          {!userPhotoSubmitted && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleTakePhoto}
            >
              <MaterialIcons name="camera-alt" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Take My Photo</Text>
            </TouchableOpacity>
          )}
          
          {userPhotoSubmitted && !partnerPhotoSubmitted && (
            <View style={styles.waitingContainer}>
              <Text style={styles.waitingText}>
                Waiting for {partnerName} to submit their photo...
              </Text>
            </View>
          )}
          
          {bothPhotosSubmitted && (
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleViewInFeed}
            >
              <AntDesign name="picture" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>View in Feed</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#006E51', // Stanford green
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timeRemainingText: {
    color: '#fff',
    fontSize: 14,
  },
  content: {
    padding: 16,
  },
  partnerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  partnerPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  partnerUsername: {
    fontSize: 14,
    color: '#777',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  statusBadgeSuccess: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  statusBadgePending: {
    flexDirection: 'row',
    backgroundColor: '#FF9800',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: '#555',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#006E51', // Stanford green
  },
  secondaryButton: {
    backgroundColor: '#1976D2', // Blue
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  waitingContainer: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  waitingText: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#555',
  },
  noPairingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  noPairingText: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
  },
}); 