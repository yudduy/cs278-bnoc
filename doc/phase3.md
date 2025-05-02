# Implementation Phase 3: Feed and Social Features

This phase focuses on enhancing the social aspects of the Daily Meetup Selfie app by implementing a robust feed system, social interactions, profile pages, and Flake Streak visualization. With the core functionality in place from Phases 1 and 2, we'll now create an engaging social experience that encourages daily participation.

## Enhanced Feed System

### Optimized Feed Implementation

1. **Denormalized Data Structure**:
   ```typescript
   // Structure for O(1) feed queries
   interface UserFeedItem {
     pairingId: string;
     date: Timestamp;
     users: string[];
     selfieURL: string;
     isPrivate: boolean;
     status: 'pending' | 'completed' | 'flaked';
     likes: number;
     commentCount: number;
   }
   
   // When a pairing is completed, we'll write to each user's feed subcollection
   const addToUserFeeds = async (pairing: Pairing): Promise<void> => {
     const db = firebase.firestore();
     const batch = db.batch();
     
     // Create feed item
     const feedItem: UserFeedItem = {
       pairingId: pairing.id,
       date: pairing.date,
       users: pairing.users,
       selfieURL: pairing.selfieURL || '',
       isPrivate: pairing.isPrivate,
       status: pairing.status,
       likes: pairing.likes,
       commentCount: pairing.comments?.length || 0,
     };
     
     // Add to each participant's feed
     for (const userId of pairing.users) {
       const feedRef = db.collection('userFeeds')
         .doc(userId)
         .collection('items')
         .doc(pairing.id);
         
       batch.set(feedRef, feedItem);
     }
     
     // If the pairing is public, add to the global feed as well
     if (!pairing.isPrivate) {
       const globalFeedRef = db.collection('globalFeed').doc(pairing.id);
       batch.set(globalFeedRef, feedItem);
     }
     
     await batch.commit();
   };
   ```

2. **Cursor-Based Pagination**:
   ```typescript
   // Enhanced getFeed function with cursor-based pagination
   const getFeed = async (
     userId: string, 
     limit: number, 
     startAfter?: Timestamp
   ): Promise<{ pairings: Pairing[], lastVisible: Timestamp | null, hasMore: boolean }> => {
     const db = firebase.firestore();
     
     try {
       // Build query for user's feed
       let query = db.collection('userFeeds')
         .doc(userId)
         .collection('items')
         .orderBy('date', 'desc')
         .limit(limit);
       
       // Apply cursor if provided
       if (startAfter) {
         query = query.startAfter(startAfter);
       }
       
       // Get feed items
       const snapshot = await query.get();
       
       if (snapshot.empty) {
         return { pairings: [], lastVisible: null, hasMore: false };
       }
       
       // Get the last visible item for next pagination
       const lastVisible = snapshot.docs[snapshot.docs.length - 1].data().date;
       
       // Get full pairing data for each feed item
       const pairingPromises = snapshot.docs.map(async (doc) => {
         const feedItem = doc.data() as UserFeedItem;
         
         // Get full pairing data including comments
         const pairingDoc = await db.collection('pairings').doc(feedItem.pairingId).get();
         
         return { id: pairingDoc.id, ...pairingDoc.data() } as Pairing;
       });
       
       const pairings = await Promise.all(pairingPromises);
       
       return {
         pairings,
         lastVisible,
         hasMore: pairings.length === limit,
       };
     } catch (error) {
       console.error('Error getting feed:', error);
       throw error;
     }
   };
   ```

3. **Real-time Feed Updates**:
   ```typescript
   // Hook for real-time feed updates
   const useRealtimeFeed = (userId: string, limit: number) => {
     const [pairings, setPairings] = useState<Pairing[]>([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);
     
     useEffect(() => {
       if (!userId) return;
       
       setLoading(true);
       
       // Subscribe to real-time updates
       const unsubscribe = firebase.firestore()
         .collection('userFeeds')
         .doc(userId)
         .collection('items')
         .orderBy('date', 'desc')
         .limit(limit)
         .onSnapshot(
           async (snapshot) => {
             try {
               // Handle data changes
               const feedItems = snapshot.docs.map(doc => ({
                 id: doc.id,
                 ...doc.data(),
               })) as UserFeedItem[];
               
               // Fetch full pairing data for each item
               const pairingPromises = feedItems.map(async (item) => {
                 const pairingDoc = await firebase.firestore()
                   .collection('pairings')
                   .doc(item.pairingId)
                   .get();
                   
                 return { id: pairingDoc.id, ...pairingDoc.data() } as Pairing;
               });
               
               const fullPairings = await Promise.all(pairingPromises);
               setPairings(fullPairings);
               setLoading(false);
             } catch (err) {
               console.error('Error processing feed update:', err);
               setError('Failed to update feed');
               setLoading(false);
             }
           },
           (err) => {
             console.error('Feed subscription error:', err);
             setError('Failed to load feed');
             setLoading(false);
           }
         );
       
       // Cleanup subscription
       return () => unsubscribe();
     }, [userId, limit]);
     
     return { pairings, loading, error };
   };
   ```

4. **Feed Archive System**:
   ```typescript
   // Cloud Function to archive old feed items (runs daily)
   export const archiveOldFeedItems = functions.pubsub
     .schedule('0 1 * * *') // 1:00 AM daily
     .timeZone('America/Los_Angeles')
     .onRun(async (context) => {
       const db = admin.firestore();
       const cutoffDate = admin.firestore.Timestamp.fromDate(
         new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
       );
       
       try {
         // Get all user IDs
         const usersSnapshot = await db.collection('users').get();
         
         // Process each user's feed
         const batch = db.batch();
         let operationCount = 0;
         
         for (const userDoc of usersSnapshot.docs) {
           const userId = userDoc.id;
           
           // Get old feed items
           const oldItemsSnapshot = await db.collection('userFeeds')
             .doc(userId)
             .collection('items')
             .where('date', '<', cutoffDate)
             .limit(500) // Process in batches
             .get();
           
           if (oldItemsSnapshot.empty) continue;
           
           // Move each item to archive
           for (const itemDoc of oldItemsSnapshot.docs) {
             const itemData = itemDoc.data();
             
             // Write to archive
             const archiveRef = db.collection('userFeeds')
               .doc(userId)
               .collection('archive')
               .doc(itemDoc.id);
               
             batch.set(archiveRef, itemData);
             
             // Delete from active feed
             const feedRef = db.collection('userFeeds')
               .doc(userId)
               .collection('items')
               .doc(itemDoc.id);
               
             batch.delete(feedRef);
             
             operationCount += 2;
             
             // Commit batch when it gets large
             if (operationCount >= 400) {
               await batch.commit();
               operationCount = 0;
             }
           }
         }
         
         // Commit any remaining operations
         if (operationCount > 0) {
           await batch.commit();
         }
         
         return { success: true };
       } catch (error) {
         console.error('Error archiving feed items:', error);
         return { success: false, error: error.message };
       }
     });
   ```

## Social Interaction Features

### Enhanced Like System

1. **Like Feature Implementation**:
   ```typescript
   // Toggle like on a pairing
   const toggleLike = async (pairingId: string, userId: string): Promise<void> => {
     const db = firebase.firestore();
     const pairingRef = db.collection('pairings').doc(pairingId);
     
     try {
       // Run in a transaction to ensure data consistency
       await db.runTransaction(async (transaction) => {
         const pairingDoc = await transaction.get(pairingRef);
         
         if (!pairingDoc.exists) {
           throw new Error('Pairing not found');
         }
         
         const pairingData = pairingDoc.data() as Pairing;
         const likedBy = pairingData.likedBy || [];
         const isLiked = likedBy.includes(userId);
         
         if (isLiked) {
           // Unlike: remove user from likedBy and decrement count
           transaction.update(pairingRef, {
             likedBy: firebase.firestore.FieldValue.arrayRemove(userId),
             likes: firebase.firestore.FieldValue.increment(-1),
           });
         } else {
           // Like: add user to likedBy and increment count
           transaction.update(pairingRef, {
             likedBy: firebase.firestore.FieldValue.arrayUnion(userId),
             likes: firebase.firestore.FieldValue.increment(1),
           });
           
           // If this is a new like, send notification to the pairing participants
           if (!isLiked) {
             await sendLikeNotification(pairingData, userId);
           }
         }
         
         // Update feed items to reflect new like count
         await updateFeedItemLikeCount(pairingId, pairingData.users, isLiked ? -1 : 1);
       });
     } catch (error) {
       console.error('Error toggling like:', error);
       throw error;
     }
   };
   
   // Update like count in feed items
   const updateFeedItemLikeCount = async (
     pairingId: string, 
     userIds: string[], 
     increment: number
   ): Promise<void> => {
     const db = firebase.firestore();
     const batch = db.batch();
     
     // Update in each user's feed
     for (const userId of userIds) {
       const feedItemRef = db.collection('userFeeds')
         .doc(userId)
         .collection('items')
         .doc(pairingId);
         
       batch.update(feedItemRef, {
         likes: firebase.firestore.FieldValue.increment(increment),
       });
     }
     
     // Also update in global feed if it exists
     const globalFeedRef = db.collection('globalFeed').doc(pairingId);
     const globalFeedDoc = await globalFeedRef.get();
     
     if (globalFeedDoc.exists) {
       batch.update(globalFeedRef, {
         likes: firebase.firestore.FieldValue.increment(increment),
       });
     }
     
     await batch.commit();
   };
   ```

2. **Like Animation Component**:
   ```typescript
   // LikeButton.tsx
   const LikeButton: React.FC<{
     pairingId: string;
     liked: boolean;
     likesCount: number;
   }> = ({ pairingId, liked, likesCount }) => {
     const [isLiked, setIsLiked] = useState(liked);
     const [count, setCount] = useState(likesCount);
     const [isAnimating, setIsAnimating] = useState(false);
     const scaleAnim = useRef(new Animated.Value(1)).current;
     const { toggleLikePairing } = usePairingContext();
     
     useEffect(() => {
       setIsLiked(liked);
       setCount(likesCount);
     }, [liked, likesCount]);
     
     const handlePress = async () => {
       if (isAnimating) return;
       
       // Optimistic update
       setIsLiked(!isLiked);
       setCount(prev => isLiked ? prev - 1 : prev + 1);
       
       // Animate button
       setIsAnimating(true);
       
       Animated.sequence([
         Animated.timing(scaleAnim, {
           toValue: 1.2,
           duration: 100,
           useNativeDriver: true,
         }),
         Animated.timing(scaleAnim, {
           toValue: 1,
           duration: 100,
           useNativeDriver: true,
         }),
       ]).start(() => {
         setIsAnimating(false);
       });
       
       // Call API
       try {
         await toggleLikePairing(pairingId);
       } catch (error) {
         // Revert on error
         setIsLiked(liked);
         setCount(likesCount);
         console.error('Error toggling like:', error);
       }
     };
     
     return (
       <View style={styles.container}>
         <TouchableOpacity onPress={handlePress} disabled={isAnimating}>
           <Animated.View style={[
             styles.iconContainer,
             { transform: [{ scale: scaleAnim }] },
           ]}>
             {isLiked ? (
               <HeartFilled style={styles.heartFilled} />
             ) : (
               <HeartOutline style={styles.heartOutline} />
             )}
           </Animated.View>
         </TouchableOpacity>
         <Text style={styles.count}>{count}</Text>
       </View>
     );
   };
   ```

### Comprehensive Comment System

1. **Comment Feature Implementation**:
   ```typescript
   // Add a comment to a pairing
   const addComment = async (
     pairingId: string, 
     comment: Omit<Comment, 'id' | 'createdAt'>
   ): Promise<string> => {
     const db = firebase.firestore();
     const pairingRef = db.collection('pairings').doc(pairingId);
     
     try {
       // Get current user data to include in comment
       const userDoc = await db.collection('users').doc(comment.userId).get();
       const userData = userDoc.data() as User;
       
       // Create the comment object
       const newComment: Comment = {
         id: uuidv4(), // Generate unique ID
         userId: comment.userId,
         text: comment.text,
         createdAt: firebase.firestore.Timestamp.now(),
         username: userData.username,
         userPhotoURL: userData.photoURL,
       };
       
       // Update pairing document
       await pairingRef.update({
         comments: firebase.firestore.FieldValue.arrayUnion(newComment),
       });
       
       // Update comment count in feed items
       await updateFeedItemCommentCount(pairingId, comment.userId);
       
       // Send notification to pairing participants
       await sendCommentNotification(pairingId, newComment);
       
       return newComment.id;
     } catch (error) {
       console.error('Error adding comment:', error);
       throw error;
     }
   };
   
   // Update comment count in feed items
   const updateFeedItemCommentCount = async (
     pairingId: string,
     excludeUserId?: string
   ): Promise<void> => {
     const db = firebase.firestore();
     
     try {
       // Get pairing data to find participants
       const pairingDoc = await db.collection('pairings').doc(pairingId).get();
       
       if (!pairingDoc.exists) {
         throw new Error('Pairing not found');
       }
       
       const pairingData = pairingDoc.data() as Pairing;
       const batch = db.batch();
       
       // Update each participant's feed item
       for (const userId of pairingData.users) {
         // Skip the commenter (optional)
         if (excludeUserId && userId === excludeUserId) continue;
         
         const feedItemRef = db.collection('userFeeds')
           .doc(userId)
           .collection('items')
           .doc(pairingId);
           
         batch.update(feedItemRef, {
           commentCount: firebase.firestore.FieldValue.increment(1),
         });
       }
       
       // Update global feed if it exists
       const globalFeedRef = db.collection('globalFeed').doc(pairingId);
       const globalFeedDoc = await globalFeedRef.get();
       
       if (globalFeedDoc.exists) {
         batch.update(globalFeedRef, {
           commentCount: firebase.firestore.FieldValue.increment(1),
         });
       }
       
       await batch.commit();
     } catch (error) {
       console.error('Error updating comment count:', error);
       throw error;
     }
   };
   ```

2. **Comment List Component**:
   ```typescript
   // CommentList.tsx
   const CommentList: React.FC<{
     pairingId: string;
     comments: Comment[];
   }> = ({ pairingId, comments }) => {
     const [showAll, setShowAll] = useState(false);
     const [newComment, setNewComment] = useState('');
     const [submitting, setSubmitting] = useState(false);
     const { addCommentToPairing } = usePairingContext();
     const currentUser = useAuth().user;
     
     // Display comments (limited or all)
     const displayComments = showAll 
       ? comments 
       : comments.slice(Math.max(0, comments.length - 3));
     
     // Handle comment submission
     const handleSubmit = async () => {
       if (!newComment.trim() || !currentUser) return;
       
       try {
         setSubmitting(true);
         
         await addCommentToPairing(pairingId, newComment);
         
         // Clear input after successful submission
         setNewComment('');
       } catch (error) {
         console.error('Error submitting comment:', error);
         // Show error toast
       } finally {
         setSubmitting(false);
       }
     };
     
     return (
       <View style={styles.container}>
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
         
         {displayComments.map(comment => (
           <View key={comment.id} style={styles.commentItem}>
             <Image 
               source={{ uri: comment.userPhotoURL || defaultAvatar }}
               style={styles.avatar}
             />
             <View style={styles.commentContent}>
               <Text style={styles.username}>{comment.username}</Text>
               <Text style={styles.commentText}>{comment.text}</Text>
               <Text style={styles.timestamp}>
                 {formatTimestamp(comment.createdAt)}
               </Text>
             </View>
           </View>
         ))}
         
         {/* Comment input section */}
         <View style={styles.inputContainer}>
           <Image 
             source={{ uri: currentUser?.photoURL || defaultAvatar }}
             style={styles.inputAvatar}
           />
           <TextInput
             style={styles.input}
             value={newComment}
             onChangeText={setNewComment}
             placeholder="Add a comment..."
             multiline
             maxLength={500}
           />
           {newComment.trim() ? (
             <TouchableOpacity 
               style={styles.submitButton}
               onPress={handleSubmit}
               disabled={submitting}
             >
               {submitting ? (
                 <ActivityIndicator size="small" color="#990000" />
               ) : (
                 <Text style={styles.submitText}>Post</Text>
               )}
             </TouchableOpacity>
           ) : null}
         </View>
       </View>
     );
   };
   ```

## User Profile and Flake Streak

### Profile Screen Implementation

1. **Profile Component**:
   ```typescript
   // ProfileScreen.tsx
   const ProfileScreen: React.FC = () => {
     const { user, signOut } = useAuth();
     const [userStats, setUserStats] = useState<UserStats | null>(null);
     const [loading, setLoading] = useState(true);
     const [profilePairings, setProfilePairings] = useState<Pairing[]>([]);
     const navigation = useNavigation();
     
     // Load user data and stats
     useEffect(() => {
       const loadUserData = async () => {
         if (!user) return;
         
         try {
           setLoading(true);
           
           // Get user stats
           const stats = await firebaseService.getUserStats(user.id);
           setUserStats(stats);
           
           // Get recent pairings for profile display
           const pairings = await firebaseService.getUserPairingHistory(user.id, 10);
           setProfilePairings(pairings);
         } catch (error) {
           console.error('Error loading profile data:', error);
         } finally {
           setLoading(false);
         }
       };
       
       loadUserData();
     }, [user]);
     
     // Navigate to settings
     const handleSettingsPress = () => {
       navigation.navigate('Settings');
     };
     
     // Navigate to edit profile
     const handleEditProfilePress = () => {
       navigation.navigate('EditProfile');
     };
     
     if (loading) {
       return <LoadingIndicator />;
     }
     
     return (
       <ScrollView style={styles.container}>
         <View style={styles.header}>
           <TouchableOpacity 
             style={styles.settingsButton}
             onPress={handleSettingsPress}
           >
             <SettingsIcon />
           </TouchableOpacity>
           
           <View style={styles.profileInfo}>
             <Image 
               source={{ uri: user?.photoURL || defaultAvatar }}
               style={styles.profileImage}
             />
             
             <Text style={styles.displayName}>
               {user?.displayName || user?.username}
             </Text>
             
             <Text style={styles.username}>@{user?.username}</Text>
             
             <TouchableOpacity 
               style={styles.editProfileButton}
               onPress={handleEditProfilePress}
             >
               <Text style={styles.editProfileText}>Edit Profile</Text>
             </TouchableOpacity>
           </View>
           
           <View style={styles.statsContainer}>
             {/* User stats display */}
             <StatItem 
               label="Pairings" 
               value={userStats?.totalPairings || 0} 
             />
             <StatItem 
               label="Completion Rate" 
               value={`${Math.round((userStats?.completedPairings || 0) / 
                 (userStats?.totalPairings || 1) * 100)}%`} 
             />
             <StatItem 
               label="Connections" 
               value={userStats?.uniqueConnectionsMade || 0} 
             />
           </View>
           
           {/* Flake Streak visualization */}
           <FlakeStreakDisplay 
             currentStreak={user?.flakeStreak || 0}
             maxStreak={user?.maxFlakeStreak || 0}
           />
         </View>
         
         {/* Pairing history */}
         <View style={styles.historySection}>
           <Text style={styles.sectionTitle}>Pairing History</Text>
           
           {profilePairings.length === 0 ? (
             <EmptyHistoryMessage />
           ) : (
             profilePairings.map(pairing => (
               <ProfilePairingItem 
                 key={pairing.id}
                 pairing={pairing}
                 currentUserId={user?.id || ''}
               />
             ))
           )}
         </View>
       </ScrollView>
     );
   };
   ```

2. **Flake Streak Visualization**:
   ```typescript
   // FlakeStreakDisplay.tsx
   const FlakeStreakDisplay: React.FC<{
     currentStreak: number;
     maxStreak: number;
   }> = ({ currentStreak, maxStreak }) => {
     // Cap displayed streak at 7+
     const displayedStreak = currentStreak >= 7 ? '7+' : currentStreak.toString();
     
     // Animation for pulse effect
     const pulseAnim = useRef(new Animated.Value(1)).current;
     
     // Start pulse animation if there's an active streak
     useEffect(() => {
       if (currentStreak > 0) {
         Animated.loop(
           Animated.sequence([
             Animated.timing(pulseAnim, {
               toValue: 1.1,
               duration: 800,
               useNativeDriver: true,
             }),
             Animated.timing(pulseAnim, {
               toValue: 1,
               duration: 800,
               useNativeDriver: true,
             }),
           ])
         ).start();
       }
     }, [currentStreak]);
     
     return (
       <View style={styles.container}>
         <Text style={styles.title}>Current Flake Streak</Text>
         
         <Animated.View 
           style={[
             styles.streakDisplay,
             { transform: [{ scale: currentStreak > 0 ? pulseAnim : 1 }] },
             currentStreak > 0 ? styles.activeStreak : styles.noStreak
           ]}
         >
           <Text style={[
             styles.streakText,
             currentStreak > 0 ? styles.activeStreakText : styles.noStreakText
           ]}>
             {currentStreak > 0 ? `🥶 ${displayedStreak}` : '✓'}
           </Text>
         </Animated.View>
         
         <Text style={styles.caption}>
           {currentStreak > 0
             ? `You've missed ${currentStreak} daily pairing${currentStreak !== 1 ? 's' : ''} in a row`
             : 'No active streak! Keep it up!'}
         </Text>
         
         <Text style={styles.maxStreak}>
           Max Streak: {maxStreak}
         </Text>
         
         {/* Tip based on streak status */}
         <Text style={styles.tipText}>
           {currentStreak > 3
             ? 'Complete today\'s pairing to reset your streak!'
             : 'Complete daily pairings to keep your streak at zero!'}
         </Text>
       </View>
     );
   };
   ```

3. **Snooze Token System**:
   ```typescript
   // SnoozeTokenManager.tsx
   const SnoozeTokenManager: React.FC = () => {
     const { user } = useAuth();
     const [snoozeTokens, setSnoozeTokens] = useState(0);
     const [nextRefillDate, setNextRefillDate] = useState<Date | null>(null);
     const [loading, setLoading] = useState(true);
     
     // Load snooze token data
     useEffect(() => {
       const loadSnoozeData = async () => {
         if (!user) return;
         
         try {
           setLoading(true);
           
           const userData = await firebaseService.getUserById(user.id);
           
           if (userData) {
             setSnoozeTokens(userData.snoozeTokensRemaining || 0);
             
             // Calculate next refill date based on last refill
             if (userData.snoozeTokenLastRefilled) {
               const lastRefill = userData.snoozeTokenLastRefilled.toDate();
               const nextRefill = new Date(lastRefill);
               nextRefill.setDate(nextRefill.getDate() + 7); // Weekly refill
               setNextRefillDate(nextRefill);
             }
           }
         } catch (error) {
           console.error('Error loading snooze data:', error);
         } finally {
           setLoading(false);
         }
       };
       
       loadSnoozeData();
     }, [user]);
     
     // Use a snooze token
     const useSnoozeToken = async (pairingId: string): Promise<boolean> => {
       if (!user || snoozeTokens <= 0) return false;
       
       try {
         // Apply snooze to pairing
         await firebaseService.applySnoozeToken(user.id, pairingId);
         
         // Update local state
         setSnoozeTokens(prev => Math.max(0, prev - 1));
         
         return true;
       } catch (error) {
         console.error('Error using snooze token:', error);
         return false;
       }
     };
     
     if (loading) {
       return <ActivityIndicator size="small" color="#990000" />;
     }
     
     return (
       <View style={styles.container}>
         <Text style={styles.title}>Snooze Tokens</Text>
         
         <View style={styles.tokenDisplay}>
           <Text style={styles.tokenCount}>{snoozeTokens}</Text>
           <Text style={styles.tokenLabel}>
             {snoozeTokens === 1 ? 'Token' : 'Tokens'} Remaining
           </Text>
         </View>
         
         {nextRefillDate && (
           <Text style={styles.refillInfo}>
             Next token in: {formatTimeUntil(nextRefillDate)}
           </Text>
         )}
         
         <Text style={styles.helpText}>
           Snooze tokens let you skip a pairing without increasing your flake streak.
           You'll get one new token each week.
         </Text>
       </View>
     );
   };
   ```

## Settings and Privacy Controls

### Settings Screen Implementation

1. **Settings Component**:
   ```typescript
   // SettingsScreen.tsx
   const SettingsScreen: React.FC = () => {
     const { user, signOut } = useAuth();
     const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
       pairingNotification: true,
       reminderNotification: true,
       completionNotification: true,
       quietHoursStart: 22,
       quietHoursEnd: 8,
     });
     const [globalFeedOpt, setGlobalFeedOpt] = useState(true);
     const [loading, setLoading] = useState(true);
     const [saving, setSaving] = useState(false);
     
     // Load user settings
     useEffect(() => {
       const loadSettings = async () => {
         if (!user) return;
         
         try {
           setLoading(true);
           
           const userData = await firebaseService.getUserById(user.id);
           
           if (userData) {
             setNotificationSettings(userData.notificationSettings || {
               pairingNotification: true,
               reminderNotification: true,
               completionNotification: true,
               quietHoursStart: 22,
               quietHoursEnd: 8,
             });
             
             // Load global feed opt-in status
             const userPrivacy = await firebaseService.getUserPrivacySettings(user.id);
             setGlobalFeedOpt(userPrivacy?.globalFeedOptIn ?? true);
           }
         } catch (error) {
           console.error('Error loading settings:', error);
         } finally {
           setLoading(false);
         }
       };
       
       loadSettings();
     }, [user]);
     
     // Save notification settings
     const saveNotificationSettings = async () => {
       if (!user) return;
       
       try {
         setSaving(true);
         
         await firebaseService.updateNotificationSettings(user.id, notificationSettings);
         
         // Show success toast
       } catch (error) {
         console.error('Error saving notification settings:', error);
         // Show error toast
       } finally {
         setSaving(false);
       }
     };
     
     // Toggle global feed opt-in
     const toggleGlobalFeed = async (value: boolean) => {
       if (!user) return;
       
       try {
         setGlobalFeedOpt(value);
         
         await firebaseService.updateUserPrivacySettings(user.id, {
           globalFeedOptIn: value,
         });
       } catch (error) {
         console.error('Error updating privacy settings:', error);
         // Revert on error
         setGlobalFeedOpt(!value);
       }
     };
     
     // Handle sign out
     const handleSignOut = async () => {
       try {
         await signOut();
       } catch (error) {
         console.error('Error signing out:', error);
       }
     };
     
     if (loading) {
       return <LoadingIndicator />;
     }
     
     return (
       <ScrollView style={styles.container}>
         <View style={styles.section}>
           <Text style={styles.sectionTitle}>Notifications</Text>
           
           <SwitchItem 
             label="Daily Pairing Notification"
             value={notificationSettings.pairingNotification}
             onValueChange={value => setNotificationSettings(prev => ({
               ...prev,
               pairingNotification: value,
             }))}
           />
           
           <SwitchItem 
             label="Reminder Notification"
             value={notificationSettings.reminderNotification}
             onValueChange={value => setNotificationSettings(prev => ({
               ...prev,
               reminderNotification: value,
             }))}
           />
           
           <SwitchItem 
             label="Completion Notification"
             value={notificationSettings.completionNotification}
             onValueChange={value => setNotificationSettings(prev => ({
               ...prev,
               completionNotification: value,
             }))}
           />
           
           <View style={styles.quietHours}>
             <Text style={styles.quietHoursTitle}>Quiet Hours</Text>
             <Text style={styles.quietHoursDescription}>
               No notifications will be sent during these hours.
             </Text>
             
             <View style={styles.timePickerContainer}>
               <TimePickerItem 
                 label="From"
                 value={notificationSettings.quietHoursStart}
                 onChange={value => setNotificationSettings(prev => ({
                   ...prev,
                   quietHoursStart: value,
                 }))}
               />
               
               <Text style={styles.timePickerSeparator}>to</Text>
               
               <TimePickerItem 
                 label="To"
                 value={notificationSettings.quietHoursEnd}
                 onChange={value => setNotificationSettings(prev => ({
                   ...prev,
                   quietHoursEnd: value,
                 }))}
               />
             </View>
           </View>
           
           <TouchableOpacity 
             style={styles.saveButton}
             onPress={saveNotificationSettings}
             disabled={saving}
           >
             {saving ? (
               <ActivityIndicator size="small" color="#fff" />
             ) : (
               <Text style={styles.saveButtonText}>Save Notification Settings</Text>
             )}
           </TouchableOpacity>
         </View>
         
         <View style={styles.section}>
           <Text style={styles.sectionTitle}>Privacy</Text>
           
           <SwitchItem 
             label="Show my pairings in global feed"
             value={globalFeedOpt}
             onValueChange={toggleGlobalFeed}
           />
           
           <TouchableOpacity style={styles.linkButton}>
             <Text style={styles.linkButtonText}>Blocked Users</Text>
             <ChevronRightIcon />
           </TouchableOpacity>
           
           <TouchableOpacity style={styles.linkButton}>
             <Text style={styles.linkButtonText}>Export My Data</Text>
             <ChevronRightIcon />
           </TouchableOpacity>
         </View>
         
         <View style={styles.section}>
           <Text style={styles.sectionTitle}>Account</Text>
           
           <TouchableOpacity style={styles.linkButton}>
             <Text style={styles.linkButtonText}>Change Password</Text>
             <ChevronRightIcon />
           </TouchableOpacity>
           
           <TouchableOpacity 
             style={styles.signOutButton}
             onPress={handleSignOut}
           >
             <Text style={styles.signOutButtonText}>Sign Out</Text>
           </TouchableOpacity>
         </View>
         
         <View style={styles.section}>
           <Text style={styles.sectionTitle}>About</Text>
           
           <TouchableOpacity style={styles.linkButton}>
             <Text style={styles.linkButtonText}>Privacy Policy</Text>
             <ChevronRightIcon />
           </TouchableOpacity>
           
           <TouchableOpacity style={styles.linkButton}>
             <Text style={styles.linkButtonText}>Terms of Service</Text>
             <ChevronRightIcon />
           </TouchableOpacity>
           
           <Text style={styles.versionText}>Version 1.0.0</Text>
         </View>
       </ScrollView>
     );
   };
   ```

2. **Privacy Controls Implementation**:
   ```typescript
   // Block User functionality in Firebase service
   const blockUser = async (currentUserId: string, userToBlockId: string): Promise<void> => {
     const db = firebase.firestore();
     
     try {
       // Update the user's blockedIds array
       await db.collection('users').doc(currentUserId).update({
         blockedIds: firebase.firestore.FieldValue.arrayUnion(userToBlockId),
       });
     } catch (error) {
       console.error('Error blocking user:', error);
       throw error;
     }
   };
   
   // Unblock User functionality
   const unblockUser = async (currentUserId: string, userToUnblockId: string): Promise<void> => {
     const db = firebase.firestore();
     
     try {
       // Remove from blockedIds array
       await db.collection('users').doc(currentUserId).update({
         blockedIds: firebase.firestore.FieldValue.arrayRemove(userToUnblockId),
       });
     } catch (error) {
       console.error('Error unblocking user:', error);
       throw error;
     }
   };
   
   // Per-pairing privacy toggle
   const updatePairingPrivacy = async (
     pairingId: string, 
     isPrivate: boolean,
     currentUserId: string
   ): Promise<void> => {
     const db = firebase.firestore();
     
     try {
       // Update the pairing's privacy setting
       await db.collection('pairings').doc(pairingId).update({
         isPrivate,
       });
       
       // Update feed items accordingly
       // If making private, remove from global feed
       if (isPrivate) {
         const globalFeedRef = db.collection('globalFeed').doc(pairingId);
         const globalFeedDoc = await globalFeedRef.get();
         
         if (globalFeedDoc.exists) {
           await globalFeedRef.delete();
         }
       } 
       // If making public, add to global feed if users have opted in
       else {
         const pairingDoc = await db.collection('pairings').doc(pairingId).get();
         const pairingData = pairingDoc.data() as Pairing;
         
         // Check if both users have global feed opt-in
         const [user1Doc, user2Doc] = await Promise.all([
           db.collection('users').doc(pairingData.users[0]).get(),
           db.collection('users').doc(pairingData.users[1]).get(),
         ]);
         
         const user1Privacy = await getUserPrivacySettings(pairingData.users[0]);
         const user2Privacy = await getUserPrivacySettings(pairingData.users[1]);
         
         if (user1Privacy?.globalFeedOptIn && user2Privacy?.globalFeedOptIn) {
           // Add to global feed
           const feedItem: UserFeedItem = {
             pairingId: pairingData.id,
             date: pairingData.date,
             users: pairingData.users,
             selfieURL: pairingData.selfieURL || '',
             isPrivate: false,
             status: pairingData.status,
             likes: pairingData.likes,
             commentCount: pairingData.comments?.length || 0,
           };
           
           await db.collection('globalFeed').doc(pairingId).set(feedItem);
         }
       }
     } catch (error) {
       console.error('Error updating pairing privacy:', error);
       throw error;
     }
   };
   ```

## Implementation Tasks

1. **Enhanced Feed System**:
   - Implement denormalized data structure for O(1) feed queries
   - Create cursor-based pagination for the feed
   - Set up real-time feed updates
   - Implement the feed archive system

2. **Social Interaction Features**:
   - Build the enhanced like system with animations
   - Implement the comprehensive comment system
   - Create notification triggers for social interactions
   - Design and implement social interaction UI components

3. **User Profile**:
   - Create the profile screen with user stats
   - Implement the Flake Streak visualization
   - Build the Snooze Token management system
   - Create profile editing functionality

4. **Settings and Privacy**:
   - Implement the settings screen with all controls
   - Build notification preference management
   - Create user blocking functionality
   - Implement per-pairing privacy controls
   - Build data export capability

## Testing Strategy

1. **Feed System Tests**:
   - Validate feed pagination performance
   - Test real-time updates with multiple users
   - Verify archive system functionality
   - Benchmark feed loading time

2. **Social Feature Tests**:
   - Test like toggling and count updates
   - Validate comment functionality and UI
   - Test notification delivery for social interactions
   - Verify data consistency across interactions

3. **Profile Tests**:
   - Test Flake Streak visualization and updates
   - Validate user stats calculations
   - Test Snooze Token application
   - Verify profile data loading and display

4. **Privacy Tests**:
   - Test user blocking functionality
   - Validate per-pairing privacy controls
   - Test notification preferences enforcement
   - Verify data export completeness

## Expected Outcomes

After completing Phase 3, we will have:

1. A highly optimized feed system with real-time updates and efficient pagination
2. Comprehensive social features including likes and comments
3. A detailed user profile with Flake Streak visualization and stats
4. Robust settings and privacy controls for user customization
5. A Snooze Token system to provide flexibility within the app's engagement model

These enhancements will create a more engaging social experience that encourages daily participation while respecting user privacy and providing appropriate controls.