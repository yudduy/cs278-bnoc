# Implementation Phase 2: Core Feature Implementation

This phase focuses on implementing the core features of the Daily Meetup Selfie app. With the infrastructure in place from Phase 1, we'll now build the dual-camera capture functionality, implement the pairing algorithm, set up push notifications, and create the core user interface components.

## Dual-Camera Capture Feature

### Camera Implementation

1. **Setup react-native-vision-camera**:
   ```typescript
   // Install and configure react-native-vision-camera
   // npx expo install react-native-vision-camera
   
   // Update app.json to include camera permissions
   {
     "expo": {
       "plugins": [
         [
           "react-native-vision-camera",
           {
             "cameraPermissionText": "The app needs access to your camera to take selfies with friends"
           }
         ]
       ]
     }
   }
   ```

2. **Dual-Camera Component**:
   ```typescript
   // CameraScreen.tsx
   import { Camera, useCameraDevices } from 'react-native-vision-camera';
   
   const DualCameraCapture: React.FC = () => {
     const devices = useCameraDevices();
     const frontDevice = devices.front;
     const backDevice = devices.back;
     
     // Camera references and state hooks
     const frontCameraRef = useRef<Camera>(null);
     const backCameraRef = useRef<Camera>(null);
     const [frontImageSource, setFrontImageSource] = useState<string | null>(null);
     const [backImageSource, setBackImageSource] = useState<string | null>(null);
     const [timeRemaining, setTimeRemaining] = useState<string>('');
     
     // Calculate time remaining until 10:00 PM PT
     useEffect(() => {
       const calculateTimeRemaining = () => {
         const now = new Date();
         const endTime = new Date(now);
         
         // Convert to PT (Pacific Time)
         const ptNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
         
         // Set deadline to 10:00 PM PT today
         endTime.setHours(22, 0, 0, 0);
         
         // If it's already past 10 PM, the pairing is expired
         if (ptNow.getHours() >= 22) {
           setTimeRemaining('Expired');
           return;
         }
         
         // Calculate time difference in hours and minutes
         const diffMs = endTime.getTime() - now.getTime();
         const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
         const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
         
         setTimeRemaining(`${diffHrs}h ${diffMins}m remaining`);
       };
       
       // Calculate initially
       calculateTimeRemaining();
       
       // Update every minute
       const interval = setInterval(calculateTimeRemaining, 60000);
       return () => clearInterval(interval);
     }, []);
     
     // Capture function logic...
   }
   ```

3. **Device Compatibility Check**:
   ```typescript
   const checkMultiCameraSupport = async (): Promise<boolean> => {
     // Check if device supports multiple cameras simultaneously
     const cameraPermission = await Camera.getCameraPermissionStatus();
     if (cameraPermission !== 'authorized') {
       await Camera.requestCameraPermission();
     }
     
     const devices = await Camera.getAvailableCameraDevices();
     const hasFront = devices.some(d => d.position === 'front');
     const hasBack = devices.some(d => d.position === 'back');
     
     // Additional capability checks based on device model and OS version
     return hasFront && hasBack && /* additional checks */;
   };
   
   // Fallback to sequential capture if dual camera not supported
   const useSequentialCapture = !isMultiCameraSupported;
   ```

4. **Image Capture Implementation**:
   ```typescript
   const captureImages = async () => {
     try {
       setCapturing(true);
       
       // Capture from both cameras if supported
       if (!useSequentialCapture) {
         // Simultaneous capture
         const frontPhoto = await frontCameraRef.current?.takePhoto({
           flash: 'off',
           qualityPrioritization: 'balanced',
         });
         
         const backPhoto = await backCameraRef.current?.takePhoto({
           flash: 'off',
           qualityPrioritization: 'balanced',
         });
         
         // Process captured photos
         if (frontPhoto && backPhoto) {
           const frontUri = `file://${frontPhoto.path}`;
           const backUri = `file://${backPhoto.path}`;
           setFrontImageSource(frontUri);
           setBackImageSource(backUri);
         }
       } else {
         // Sequential capture logic for unsupported devices
         // Capture back camera first, then front camera
       }
     } catch (error) {
       console.error('Error capturing photos:', error);
       setError('Failed to capture photos. Please try again.');
     } finally {
       setCapturing(false);
     }
   };
   ```

5. **Image Stitching**:
   ```typescript
   const stitchImages = async (frontUri: string, backUri: string): Promise<string> => {
     try {
       // Client-side stitching using GPU acceleration if available
       // Fallback to server-side stitching for low-end devices
       
       const isLowEndDevice = /* device performance check */;
       
       if (!isLowEndDevice) {
         // Client-side stitching logic using ImageManipulator or similar
         return clientSideStitchImages(frontUri, backUri);
       } else {
         // Upload to server for stitching
         const result = await uploadImagesForStitching(frontUri, backUri);
         return result.stitchedImageUrl;
       }
     } catch (error) {
       console.error('Error stitching images:', error);
       throw new Error('Failed to stitch images');
     }
   };
   ```

6. **Camera UI Components**:
   - Daily deadline display showing time remaining until 10:00 PM PT
   - Capture button with animated feedback
   - Picture-in-picture display for front camera
   - Overlay for composition guidelines
   - Retry button for failed captures

## Daily Pairing Algorithm

### Cloud Function Implementation

1. **pairUsers Function**:
   ```typescript
   // In Firebase Cloud Functions
   
   export const pairUsers = functions.pubsub
     .schedule('0 5 * * *') // 5:00 AM PT daily
     .timeZone('America/Los_Angeles')
     .onRun(async (context) => {
       const db = admin.firestore();
       const batch = db.batch();
       
       try {
         // Get active users
         const activeUsersSnapshot = await db.collection('users')
           .where('isActive', '==', true)
           .where('lastActive', '>', admin.firestore.Timestamp.fromDate(
             new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
           ))
           .where('flakeStreak', '<', 5) // Skip users with high flake streak
           .get();
         
         const activeUsers = activeUsersSnapshot.docs.map(doc => ({
           id: doc.id,
           ...doc.data()
         }));
         
         // Check if any users to pair
         if (activeUsers.length < 2) {
           console.log('Not enough active users to pair');
           return null;
         }
         
         // Shuffle users for random pairing
         const shuffledUsers = shuffleArray(activeUsers);
         
         // Get pairing history to avoid recent repeats
         const pairingHistoryData = await getPairingHistory(7); // Last 7 days
         
         // Pair users while avoiding recent repeats
         const pairings = createPairings(shuffledUsers, pairingHistoryData);
         
         // Create pairing documents
         for (const pairing of pairings) {
           const pairingRef = db.collection('pairings').doc();
           
           // Calculate expiration time (10:00 PM PT today)
           const today = new Date();
           const expiresAt = new Date(today);
           expiresAt.setHours(22, 0, 0, 0); // 10:00 PM
           
           batch.set(pairingRef, {
             id: pairingRef.id,
             date: admin.firestore.Timestamp.now(),
             expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
             users: [pairing.user1.id, pairing.user2.id],
             status: 'pending',
             isPrivate: false,
             likes: 0,
             likedBy: [],
             comments: [],
             virtualMeetingLink: generateVirtualMeetingLink(pairingRef.id),
           });
           
           // Also add to each user's pairings subcollection for faster queries
           batch.set(
             db.collection('users').doc(pairing.user1.id).collection('pairings').doc(pairingRef.id),
             { pairingId: pairingRef.id, date: admin.firestore.Timestamp.now() }
           );
           batch.set(
             db.collection('users').doc(pairing.user2.id).collection('pairings').doc(pairingRef.id),
             { pairingId: pairingRef.id, date: admin.firestore.Timestamp.now() }
           );
         }
         
         // Handle waitlist for odd number of users
         // ...waitlist logic
         
         // Commit all changes
         await batch.commit();
         
         // Return success with statistics
         return {
           totalUsers: activeUsers.length,
           totalPairings: pairings.length,
           waitlistCount: waitlist.length,
         };
       } catch (error) {
         console.error('Error in pairUsers function:', error);
         return null;
       }
     });
   ```

2. **Helper Functions**:
   ```typescript
   // Shuffle array using Fisher-Yates algorithm
   const shuffleArray = <T>(array: T[]): T[] => {
     const result = [...array];
     for (let i = result.length - 1; i > 0; i--) {
       const j = Math.floor(Math.random() * (i + 1));
       [result[i], result[j]] = [result[j], result[i]];
     }
     return result;
   };
   
   // Get pairing history for last N days
   const getPairingHistory = async (days: number) => {
     const db = admin.firestore();
     const cutoffDate = admin.firestore.Timestamp.fromDate(
       new Date(Date.now() - days * 24 * 60 * 60 * 1000)
     );
     
     const pairingsSnapshot = await db.collection('pairings')
       .where('date', '>', cutoffDate)
       .get();
     
     return pairingsSnapshot.docs.map(doc => ({
       id: doc.id,
       users: doc.data().users,
       date: doc.data().date,
     }));
   };
   
   // Create pairings while avoiding recent repeats
   const createPairings = (users, history) => {
     // Implementation of pairing algorithm
     // ...
   };
   
   // Generate virtual meeting link
   const generateVirtualMeetingLink = (pairingId: string): string => {
     return `https://meet.jitsi.si/DailyMeetupSelfie-${pairingId}`;
   };
   ```

3. **Flake Handling Function**:
   ```typescript
   // Mark expired pairings as flaked at 10:05 PM PT
   export const markExpiredPairingsAsFlaked = functions.pubsub
     .schedule('5 22 * * *') // 10:05 PM PT daily
     .timeZone('America/Los_Angeles')
     .onRun(async (context) => {
       const db = admin.firestore();
       const batch = db.batch();
       
       try {
         // Get today's date boundaries
         const today = new Date();
         today.setHours(0, 0, 0, 0);
         
         // Get all pending pairings from today
         const pendingPairingsSnapshot = await db.collection('pairings')
           .where('date', '>=', admin.firestore.Timestamp.fromDate(today))
           .where('status', '==', 'pending')
           .get();
           
         console.log(`Found ${pendingPairingsSnapshot.size} pending pairings to mark as flaked`);
         
         // Mark each pairing as flaked and increment flake streaks for both users
         for (const pairingDoc of pendingPairingsSnapshot.docs) {
           const pairingData = pairingDoc.data();
           const pairingRef = pairingDoc.ref;
           
           // Mark pairing as flaked
           batch.update(pairingRef, {
             status: 'flaked',
             updatedAt: admin.firestore.Timestamp.now()
           });
           
           // Increment flake streak for each user
           for (const userId of pairingData.users) {
             const userRef = db.collection('users').doc(userId);
             const userDoc = await userRef.get();
             
             if (userDoc.exists) {
               const userData = userDoc.data();
               const newFlakeStreak = (userData.flakeStreak || 0) + 1;
               const maxFlakeStreak = Math.max(userData.maxFlakeStreak || 0, newFlakeStreak);
               
               batch.update(userRef, {
                 flakeStreak: newFlakeStreak,
                 maxFlakeStreak: maxFlakeStreak,
                 updatedAt: admin.firestore.Timestamp.now()
               });
             }
           }
         }
         
         // Commit all the updates
         await batch.commit();
         
         return { 
           success: true, 
           flakedCount: pendingPairingsSnapshot.size 
         };
       } catch (error) {
         console.error('Error marking expired pairings as flaked:', error);
         return { 
           success: false, 
           error: error.message 
         };
       }
     });
   ```

4. **Handling Edge Cases**:
   - Odd number of users logic
   - Priority queue for previously unpaired users
   - Admin bot account for absolute odd case

## Push Notification System

### FCM Integration

1. **Setup Expo FCM**:
   ```typescript
   // Install required packages
   // npx expo install expo-notifications
   // npx expo install firebase/messaging
   
   // Update app.json for notifications
   {
     "expo": {
       "plugins": [
         [
           "expo-notifications",
           {
             "icon": "./assets/notification-icon.png",
             "color": "#990000",
             "sounds": ["./assets/notification-sound.wav"]
           }
         ]
       ]
     }
   }
   ```

2. **Token Registration**:
   ```typescript
   // NotificationService.ts
   import * as Notifications from 'expo-notifications';
   import * as Device from 'expo-device';
   import { Platform } from 'react-native';
   
   export const registerForPushNotifications = async (userId: string): Promise<string | null> => {
     if (!Device.isDevice) {
       console.log('Physical device is required for Push Notifications');
       return null;
     }
     
     const { status: existingStatus } = await Notifications.getPermissionsAsync();
     let finalStatus = existingStatus;
     
     if (existingStatus !== 'granted') {
       const { status } = await Notifications.requestPermissionsAsync();
       finalStatus = status;
     }
     
     if (finalStatus !== 'granted') {
       console.log('Failed to get push token for push notification!');
       return null;
     }
     
     // Get the token
     const token = await Notifications.getExpoPushTokenAsync();
     
     // Store the token in Firestore
     await storeUserPushToken(userId, token.data);
     
     // Platform-specific notification channel
     if (Platform.OS === 'android') {
       Notifications.setNotificationChannelAsync('default', {
         name: 'default',
         importance: Notifications.AndroidImportance.MAX,
         vibrationPattern: [0, 250, 250, 250],
         lightColor: '#990000',
       });
     }
     
     return token.data;
   };
   
   const storeUserPushToken = async (userId: string, token: string): Promise<void> => {
     try {
       await firebase.firestore()
         .collection('users')
         .doc(userId)
         .update({
           pushToken: token,
           tokenUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
         });
     } catch (error) {
       console.error('Error storing push token:', error);
     }
   };
   ```

3. **Notification Schedule Cloud Functions**:
   ```typescript
   // Pairing notification at 7:00 AM PT
   export const sendPairingNotifications = functions.pubsub
     .schedule('0 7 * * *')
     .timeZone('America/Los_Angeles')
     .onRun(async (context) => {
       const db = admin.firestore();
       
       try {
         // Get today's pairings
         const today = new Date();
         today.setHours(0, 0, 0, 0);
         
         const pairingsSnapshot = await db.collection('pairings')
           .where('date', '>=', admin.firestore.Timestamp.fromDate(today))
           .where('status', '==', 'pending')
           .get();
         
         // Process each pairing
         const notifications = [];
         
         for (const pairingDoc of pairingsSnapshot.docs) {
           const pairing = { id: pairingDoc.id, ...pairingDoc.data() };
           
           // Get user data for both users
           const [user1Doc, user2Doc] = await Promise.all([
             db.collection('users').doc(pairing.users[0]).get(),
             db.collection('users').doc(pairing.users[1]).get(),
           ]);
           
           const user1 = { id: user1Doc.id, ...user1Doc.data() };
           const user2 = { id: user2Doc.id, ...user2Doc.data() };
           
           // Check notification settings and quiet hours
           if (shouldSendNotification(user1) && user1.pushToken) {
             notifications.push({
               to: user1.pushToken,
               title: '📸 Today\'s Selfie Partner',
               body: `You're paired with ${user2.displayName || user2.username} today! Take a selfie together before 10:00 PM PT.`,
               data: { pairingId: pairing.id, type: 'pairing' },
             });
           }
           
           if (shouldSendNotification(user2) && user2.pushToken) {
             notifications.push({
               to: user2.pushToken,
               title: '📸 Today\'s Selfie Partner',
               body: `You're paired with ${user1.displayName || user1.username} today! Take a selfie together before 10:00 PM PT.`,
               data: { pairingId: pairing.id, type: 'pairing' },
             });
           }
         }
         
         // Send notifications in batches
         const chunks = chunkArray(notifications, 100);
         for (const chunk of chunks) {
           await admin.messaging().sendMulticast(chunk);
         }
         
         return { sent: notifications.length };
       } catch (error) {
         console.error('Error sending pairing notifications:', error);
         return null;
       }
     });
   
   // Reminder notification at 3:00 PM PT for incomplete pairings
   export const sendReminderNotifications = functions.pubsub
     .schedule('0 15 * * *')
     .timeZone('America/Los_Angeles')
     .onRun(async (context) => {
       // Implementation for mid-day reminders
       // Similar to morning notifications but with reminder text
     });
   
   // Final reminder notification at 7:00 PM PT for incomplete pairings
   export const sendFinalReminderNotifications = functions.pubsub
     .schedule('0 19 * * *')
     .timeZone('America/Los_Angeles')
     .onRun(async (context) => {
       // Implementation for evening reminders
       // More urgent reminder with "3 hours left" text
     });
   
   // Helper function to check if notification should be sent based on settings and quiet hours
   const shouldSendNotification = (user): boolean => {
     // Implementation of notification permission checks
     // including quiet hours and user preferences
   };
   ```

4. **Notification Handler in App**:
   ```typescript
   // Set up notification handlers
   Notifications.setNotificationHandler({
     handleNotification: async () => ({
       shouldShowAlert: true,
       shouldPlaySound: true,
       shouldSetBadge: true,
     }),
   });
   
   // Handle notification taps
   useEffect(() => {
     const subscription = Notifications.addNotificationResponseReceivedListener(response => {
       const data = response.notification.request.content.data;
       
       if (data.type === 'pairing') {
         // Navigate to camera screen or pairing details
         navigation.navigate('Camera', { pairingId: data.pairingId });
       } else if (data.type === 'completion') {
         // Navigate to the feed to see the completed pairing
         navigation.navigate('Feed', { scrollToPairingId: data.pairingId });
       }
     });
     
     return () => subscription.remove();
   }, [navigation]);
   ```

## User Interface Components

### Feed Screen

1. **Feed Component**:
   ```typescript
   // FeedScreen.tsx
   import React, { useState, useEffect, useCallback } from 'react';
   import { FlatList, RefreshControl, ActivityIndicator, View, Text } from 'react-native';
   import { usePairingContext } from '../contexts/PairingContext';
   import PairingCard from '../components/PairingCard';
   
   const FeedScreen: React.FC = () => {
     const [refreshing, setRefreshing] = useState(false);
     const [loading, setLoading] = useState(true);
     const [pairings, setPairings] = useState<Pairing[]>([]);
     const [lastVisible, setLastVisible] = useState<Timestamp | null>(null);
     const [hasMore, setHasMore] = useState(true);
     
     // Load feed function
     const loadFeed = useCallback(async (refresh = false) => {
       try {
         setLoading(true);
         
         // If refreshing, reset pagination
         if (refresh) {
           setLastVisible(null);
           setPairings([]);
         }
         
         // Fetch feed data
         const result = await firebaseService.getFeed(
           auth.currentUser?.uid || '',
           10,
           refresh ? null : lastVisible
         );
         
         if (refresh) {
           setPairings(result.pairings);
         } else {
           setPairings(prev => [...prev, ...result.pairings]);
         }
         
         setLastVisible(result.lastVisible);
         setHasMore(result.hasMore);
       } catch (error) {
         console.error('Error loading feed:', error);
       } finally {
         setLoading(false);
         setRefreshing(false);
       }
     }, [lastVisible]);
     
     // Initial load
     useEffect(() => {
       loadFeed(true);
     }, []);
     
     // Pull to refresh
     const onRefresh = useCallback(() => {
       setRefreshing(true);
       loadFeed(true);
     }, [loadFeed]);
     
     // Load more when reaching end
     const handleEndReached = () => {
       if (!loading && hasMore) {
         loadFeed();
       }
     };
     
     // Render functions for list items
     // ...
     
     return (
       <View style={styles.container}>
         <FlatList
           data={pairings}
           renderItem={renderPairingCard}
           keyExtractor={item => item.id}
           refreshControl={
             <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#990000" />
           }
           onEndReached={handleEndReached}
           onEndReachedThreshold={0.5}
           ListFooterComponent={loading && !refreshing ? <ActivityIndicator /> : null}
           ListEmptyComponent={!loading ? <EmptyFeed /> : null}
         />
       </View>
     );
   };
   ```

2. **Pairing Card Component**:
   ```typescript
   // PairingCard.tsx
   // Display component for a pairing in the feed
   const PairingCard: React.FC<{ pairing: Pairing }> = ({ pairing }) => {
     const [expanded, setExpanded] = useState(false);
     const [comment, setComment] = useState('');
     const { toggleLikePairing, addCommentToPairing } = usePairingContext();
     
     // User profile data
     const user1 = useUserData(pairing.users[0]);
     const user2 = useUserData(pairing.users[1]);
     
     // Toggle like
     const handleLike = () => {
       toggleLikePairing(pairing.id);
     };
     
     // Submit comment
     const handleComment = () => {
       if (comment.trim()) {
         addCommentToPairing(pairing.id, comment);
         setComment('');
       }
     };
     
     // Render functions for card components
     // ...
     
     return (
       <View style={styles.card}>
         {/* Header with user avatars and names */}
         <View style={styles.cardHeader}>
           {/* User details */}
         </View>
         
         {/* Selfie image */}
         <TouchableOpacity 
           style={styles.imageContainer} 
           onPress={() => setExpanded(!expanded)}
         >
           <Image 
             source={{ uri: pairing.selfieURL }}
             style={styles.selfieImage}
             resizeMode="cover"
           />
           
           {pairing.status === 'flaked' && (
             <View style={styles.flakeBadge}>
               <Text style={styles.flakeText}>🥶 Flaked</Text>
             </View>
           )}
         </TouchableOpacity>
         
         {/* Footer with likes, comments, date */}
         <View style={styles.cardFooter}>
           {/* Like button and count */}
           {/* Comment section (expandable) */}
           {/* Date and time */}
         </View>
         
         {/* Expanded comments section */}
         {expanded && (
           <View style={styles.commentsContainer}>
             {/* Comments list */}
             {/* Comment input */}
           </View>
         )}
       </View>
     );
   };
   ```

### Waiting/Status Screen

```typescript
// WaitingScreen.tsx
// Screen to show when waiting for partner to post
const WaitingScreen: React.FC<{ pairing: Pairing }> = ({ pairing }) => {
  const navigation = useNavigation();
  const { sendReminder } = usePairingContext();
  const [reminding, setReminding] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  
  // Get partner user data
  const currentUserId = auth.currentUser?.uid;
  const partnerId = pairing.users.find(id => id !== currentUserId);
  const partner = useUserData(partnerId);
  
  // Calculate time remaining until 10:00 PM PT
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const expiresAt = pairing.expiresAt ? pairing.expiresAt.toDate() : new Date();
      
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
  }, [pairing.expiresAt]);
  
  // Send a reminder notification
  const handleSendReminder = async () => {
    try {
      setReminding(true);
      await sendReminder(pairing.id, partnerId);
      // Show success toast
    } catch (error) {
      // Show error toast
    } finally {
      setReminding(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Waiting for {partner?.displayName || 'partner'}</Text>
        
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: partner?.photoURL || defaultAvatar }}
            style={styles.avatar}
          />
          <View style={styles.pulsingDot} />
        </View>
        
        <Text style={styles.timeRemaining}>{timeRemaining}</Text>
        
        <Text style={styles.waitingText}>
          Your partner hasn't posted their selfie yet. Send them a reminder or try again later.
        </Text>
        
        <TouchableOpacity 
          style={styles.reminderButton}
          onPress={handleSendReminder}
          disabled={reminding}
        >
          {reminding ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.reminderButtonText}>Send Reminder</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to Feed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
```

## Implementation Tasks

1. **Dual-Camera Setup**:
   - Install and configure react-native-vision-camera
   - Build the DualCameraCapture component
   - Implement device compatibility detection
   - Create image capture functionality
   - Build image stitching logic

2. **Pairing Algorithm**:
   - Create Firebase Cloud Function for daily pairing
   - Implement shuffle and pairing logic
   - Build repeat-avoidance mechanism
   - Handle edge cases for odd numbers
   - Add expiration logic for 10:00 PM PT deadline
   - Implement function to mark expired pairings as flaked

3. **Push Notification System**:
   - Set up Expo FCM integration
   - Create token registration system
   - Implement notification scheduling functions
   - Add reminder notifications at 3:00 PM and 7:00 PM
   - Build notification handling in the app
   - Test across both iOS and Android

4. **User Interface**:
   - Create FeedScreen component
   - Build PairingCard component
   - Implement infinite scroll and pagination
   - Create WaitingScreen with time remaining display
   - Build social interaction components (likes, comments)

## Testing Strategy

1. **Camera Feature Tests**:
   - Test on various device models
   - Validate fallback for unsupported devices
   - Verify image quality and stitching
   - Test permission handling and error states

2. **Pairing Algorithm Tests**:
   - Validate pairing distribution
   - Test repeat-avoidance logic
   - Verify edge case handling
   - Test expiration logic for daily deadline
   - Test flake streak calculation logic

3. **Notification Tests**:
   - Verify scheduling accuracy
   - Test quiet hours functionality
   - Validate reminders at different times of day
   - Test rich content display
   - Test cross-platform behavior

4. **UI Component Tests**:
   - Verify feed pagination
   - Test social interaction workflows
   - Validate time remaining display
   - Test responsive design
   - Test accessibility compliance

## Expected Outcomes

After completing Phase 2, we will have:

1. A fully functional dual-camera capture system with fallbacks for unsupported devices
2. A robust daily pairing algorithm that fairly matches users and handles the daily deadline
3. A comprehensive push notification system with timed reminders throughout the day
4. Core UI components for viewing pairings and tracking time remaining
5. The foundation for social features like likes and comments

These implementations form the core functionality of the Daily Meetup Selfie app and provide the essential user experience as defined in the PRD.