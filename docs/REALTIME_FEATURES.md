# Real-Time Features Documentation

## Overview
This document provides detailed technical information about the real-time features implemented in the BNOC app, including Firebase Firestore listeners, automatic state synchronization, and performance optimizations.

## Architecture

### Real-Time Data Flow
```
Firebase Firestore (source of truth)
    ↓ onSnapshot listeners
App State (local state sync)
    ↓ automatic updates
UI Components (reactive updates)
```

### Key Components with Real-Time Features

#### 1. FeedScreen Real-Time Updates
**File**: `src/screens/Feed/FeedScreen.tsx`

**Features**:
- Live feed updates when new pairings complete
- Toggle between real-time and manual refresh modes
- Automatic fallback to manual loading on errors
- Efficient user data caching

**Implementation Pattern**:
```typescript
const setupFeedListener = useCallback(async () => {
  // Clean up existing listener
  if (feedListener.current) {
    feedListener.current();
    feedListener.current = null;
  }
  
  // Setup new listener with error handling
  const pairingsQuery = query(
    collection(db, 'pairings'),
    where('status', '==', 'completed'),
    where('users', 'array-contains-any', usersToInclude),
    orderBy('completedAt', 'desc'),
    limit(20)
  );
  
  const unsubscribe = onSnapshot(pairingsQuery, 
    (snapshot) => {
      // Handle updates
    },
    (error) => {
      // Fallback to manual loading
      loadFeed(true);
    }
  );
  
  feedListener.current = unsubscribe;
}, [user?.id, loadFeed]);
```

#### 2. WaitingScreen Pairing Completion Detection
**File**: `src/screens/Waiting/WaitingScreen.tsx`

**Features**:
- Real-time monitoring of partner photo submission
- Automatic redirect when both users submit
- Live countdown timer updates
- Partner status notifications

**Implementation Pattern**:
```typescript
useEffect(() => {
  if (!pairingId) return;
  
  const pairingRef = doc(db, 'pairings', pairingId);
  
  const unsubscribe = onSnapshot(pairingRef, (doc) => {
    if (doc.exists()) {
      const pairing = { id: doc.id, ...doc.data() };
      
      // Check completion status
      const bothPhotosSubmitted = pairing.user1_photoURL && pairing.user2_photoURL;
      const isPairingCompleted = pairing.status === 'completed';
      
      if (bothPhotosSubmitted && isPairingCompleted) {
        // Auto-redirect to feed
        navigation.navigate('TabNavigator', { screen: 'Feed' });
      }
    }
  });
  
  return unsubscribe;
}, [pairingId]);
```

#### 3. CurrentPairingScreen Live Status Updates
**File**: `src/screens/Pairing/CurrentPairingScreen.tsx`

**Features**:
- Real-time pairing status updates
- Partner photo submission notifications
- Dynamic UI based on completion state
- Automatic feed refresh on completion

## Performance Optimizations

### 1. Listener Management
- **Single listener per screen**: Each screen maintains only one active listener
- **Automatic cleanup**: Listeners are properly disposed on component unmount
- **Memory leak prevention**: Refs used to track active listeners

### 2. Query Optimization
- **Limited result sets**: Queries use `limit()` to control data size
- **Filtered queries**: `where()` clauses reduce unnecessary data transfer
- **Indexed fields**: Queries use indexed Firestore fields for performance

### 3. State Management
- **Debounced updates**: Prevent excessive re-renders from rapid updates
- **Selective updates**: Only update relevant state properties
- **Cached user data**: User information cached to reduce repeated fetches

## Error Handling

### 1. Listener Error Recovery
```typescript
const unsubscribe = onSnapshot(query, 
  (snapshot) => {
    // Success handling
  },
  (error) => {
    console.error('Real-time listener error:', error);
    logger.error('Listener error', error);
    
    // Fallback to manual loading
    loadFeed(true);
  }
);
```

### 2. Network Resilience
- **Automatic reconnection**: Firebase handles network disconnections
- **Offline support**: Firestore provides offline caching
- **Graceful degradation**: Manual refresh always available as fallback

### 3. User Feedback
- **Loading states**: Visual indicators during data fetching
- **Error messages**: User-friendly error notifications
- **Retry mechanisms**: Allow users to manually retry failed operations

## Debug Features

### 1. Console Logging
All real-time operations include comprehensive debug logging:
```typescript
console.log('DEBUG: FeedScreen - Real-time update received, docs:', snapshot.docs.length);
console.log('DEBUG: WaitingScreen - Pairing update received:', pairing);
```

### 2. Toggle Modes
FeedScreen includes a toggle button to switch between:
- **Real-time mode** (⚡): Live updates via Firestore listeners
- **Manual mode** (⚡ off): Pull-to-refresh only

### 3. Performance Monitoring
- **Listener lifecycle tracking**: Logs when listeners are created/destroyed
- **Data transfer monitoring**: Logs document counts and update frequency
- **Error rate tracking**: Monitors and logs listener failures

## Best Practices

### 1. Listener Lifecycle
```typescript
// ✅ Good: Proper cleanup
useEffect(() => {
  const unsubscribe = setupListener();
  return () => {
    if (unsubscribe) unsubscribe();
  };
}, []);

// ❌ Bad: No cleanup
useEffect(() => {
  setupListener();
}, []);
```

### 2. State Updates
```typescript
// ✅ Good: Batch updates
setPairings(newPairings);
setUsers(newUsers);
setError(null);

// ❌ Bad: Separate updates
setPairings(newPairings);
setTimeout(() => setUsers(newUsers), 0);
```

### 3. Error Boundaries
```typescript
// ✅ Good: Graceful fallback
try {
  await setupFeedListener();
} catch (error) {
  console.error('Error setting up feed listener:', error);
  // Fall back to manual loading
  loadFeed(true);
}
```

## Future Enhancements

### 1. Advanced Caching
- Implement persistent local cache with SQLite
- Add cache invalidation strategies
- Optimize for offline-first operation

### 2. Real-Time Chat
- Extend listener pattern to chat messages
- Add typing indicators
- Implement message delivery status

### 3. Push Notifications
- Integrate with FCM for background updates
- Add notification preferences
- Implement smart notification batching

## Troubleshooting

### Common Issues

#### 1. Listeners Not Updating
**Symptoms**: UI not reflecting Firestore changes
**Solutions**:
- Check listener setup in useEffect dependencies
- Verify Firestore security rules allow reads
- Ensure proper cleanup of previous listeners

#### 2. Memory Leaks
**Symptoms**: App performance degradation over time
**Solutions**:
- Verify all listeners are cleaned up on unmount
- Check for circular references in state updates
- Monitor listener count in development

#### 3. Excessive Re-renders
**Symptoms**: Poor performance, rapid state changes
**Solutions**:
- Use `useCallback` for listener setup functions
- Implement proper dependency arrays in useEffect
- Consider memoization for expensive computations

### Debug Commands
```bash
# Monitor Firestore usage
firebase firestore:usage

# Check security rules
firebase firestore:rules:get

# View real-time metrics
firebase console --project your-project-id
```

## Performance Metrics

### Target Metrics
- **Listener setup time**: < 500ms
- **Update propagation**: < 100ms
- **Memory usage**: < 50MB additional for real-time features
- **Battery impact**: < 5% additional drain

### Monitoring
Use Firebase Performance Monitoring to track:
- Real-time listener performance
- Data transfer volumes
- Error rates and recovery times
- User engagement with real-time features 

# Real-time Features Implementation

This document outlines the real-time features implemented in the BNOC app using Firebase Firestore's `onSnapshot` listeners.

## Overview

The app now supports real-time updates across multiple screens, allowing users to see changes immediately without manual refreshes. This includes pairing status updates, photo submissions, and feed updates.

## Implemented Real-time Features

### 1. Feed Screen (`src/screens/Feed/FeedScreen.tsx`)
- **Real-time feed updates**: Automatically loads new pairings as they're completed
- **Automatic deduplication**: Prevents duplicate pairing objects in the feed
- **Toggle functionality**: Users can switch between real-time and manual refresh modes
- **Error handling**: Graceful fallback to manual loading on listener errors

### 2. Current Pairing Screen (`src/screens/Pairing/CurrentPairingScreen.tsx`)
- **Real-time pairing status updates**: Automatically updates when partner submits photos
- **Partner data synchronization**: Live updates of partner information
- **Completion detection**: Automatically refreshes feed when pairing completes
- **Real-time mode toggle**: Flash icon to enable/disable real-time updates
- **Pull-to-refresh compatibility**: Manual refresh temporarily disables real-time listeners

### 3. Daily Pairing Screen (`src/screens/Pairing/DailyPairingScreen.tsx`)
- **Real-time partner updates**: Automatically updates partner information when changed
- **Live pairing status**: Monitors pairing document changes in real-time
- **Error handling**: Falls back to manual loading if listeners fail

### 4. Waiting Screen (`src/screens/Waiting/WaitingScreen.tsx`)
- **Real-time completion detection**: Automatically detects when both photos are submitted
- **Auto-redirect**: Navigates to feed when pairing completes
- **Alert notifications**: Shows success message when pairing is completed 