# BNOC Firebase Integration Guide

This document provides a comprehensive guide to the Firebase integration in the BNOC Daily Meetup Selfie application, including the database schema, security rules, Cloud Functions, and service implementations.

## Firebase Configuration

The app uses the following Firebase services:

- **Authentication**: User sign-in and account management
- **Firestore**: NoSQL database for app data
- **Storage**: Image storage for user photos
- **Cloud Functions**: Server-side logic for pairing and notifications

## Firebase Integration Architecture

The app follows a structured approach to Firebase integration:

1. **Initialization**: Firebase is initialized in `src/config/firebaseInit.ts`
2. **Configuration**: Firebase configuration is stored in `src/config/firebase.ts` (re-exports from firebaseInit)
3. **Service Facade**: Firebase service methods are centralized in `src/services/firebase.ts`
4. **Specialized Services**: Domain-specific Firebase interactions are handled by specialized services:
   - `authService.ts`: Authentication-related operations
   - `pairingService.ts`: Pairing-related operations
   - `userService.ts`: User profile operations
   - `storageService.ts`: File storage operations
   - `feedService.ts`: Feed-related operations
5. **Error Handling**: All Firebase operations use try/catch with the centralized logger utility

## Database Schema

### Collections Overview

```
firebase
├── users/               # User profiles and settings
│   ├── {userId}/        # Individual user documents
│   │   └── feed/        # User's personalized feed
│   │       └── {pairingId}/ # Feed entries
├── pairings/            # Daily user pairings
│   ├── {pairingId}/     # Individual pairing documents
│   │   └── comments/    # Comments subcollection (optional)
├── pairingHistory/      # Historical pairing data
│   └── {userId}/        # User-specific pairing history
├── globalFeed/          # Public completed pairings
│   └── {pairingId}/     # Feed entries
├── system/              # System configuration
│   └── waitlist/        # Daily waitlist
└── notificationSettings/ # User notification preferences
    └── {userId}/        # Individual settings
```

### Collection Details

#### `users` Collection

Stores user profiles and account information.

```typescript
interface User {
  id: string;              // Unique user identifier (Firebase Auth UID)
  email: string;           // User's Stanford email address
  username: string;        // Unique username (min 3 characters)
  displayName?: string;    // User's display name
  photoURL?: string;       // URL to user's profile photo
  createdAt: Timestamp;    // When the account was created
  lastActive: Timestamp;   // Last activity timestamp
  isActive: boolean;       // Whether user is active in the pairing system
  flakeStreak: number;     // Current streak of missed pairings
  maxFlakeStreak: number;  // Highest flake streak recorded
  blockedIds: string[];    // IDs of blocked users
  notificationSettings: {  // User's notification preferences
    pairingNotification: boolean;    // Receive new pairing notifications
    reminderNotification: boolean;   // Receive reminder notifications
    completionNotification: boolean; // Receive completion notifications
    quietHoursStart: number;         // Start hour (0-23) for quiet time
    quietHoursEnd: number;           // End hour (0-23) for quiet time
  };
  snoozeTokensRemaining: number;     // Available snooze tokens
  snoozeTokenLastRefilled: Timestamp; // Last token refill date
  fcmToken?: string;       // Firebase Cloud Messaging token
}
```

User Feed Subcollection (`users/{userId}/feed/{pairingId}`):
```typescript
interface UserFeedItem {
  pairingId: string;       // Reference to the pairing
  date: Timestamp;         // Date of the pairing
  seen: boolean;           // Whether the user has viewed this item
}
```

#### `pairings` Collection

Stores data about daily pairings between users.

```typescript
interface Pairing {
  id: string;               // Unique pairing identifier
  date: Timestamp;          // Date the pairing was created
  expiresAt: Timestamp;     // When the pairing expires (10:00 PM PT)
  users: string[];          // IDs of the paired users (always 2)
  user1_id: string;         // ID of the first user
  user2_id: string;         // ID of the second user
  status: 'pending' | 'user1_submitted' | 'user2_submitted' | 'completed' | 'flaked' | 'snoozed';
  user1_photoURL?: string;  // URL to user1's photo
  user2_photoURL?: string;  // URL to user2's photo 
  user1_submittedAt?: Timestamp; // When user1 submitted their photo
  user2_submittedAt?: Timestamp; // When user2 submitted their photo
  completedAt?: Timestamp;  // When the pairing was completed
  isPrivate: boolean;       // Whether the pairing is private or public
  likesCount: number;       // Count of likes
  likedBy: string[];        // IDs of users who liked this pairing
  commentsCount: number;    // Count of comments
  virtualMeetingLink?: string; // Optional virtual meeting link
  lastUpdatedAt: Timestamp; // Last update timestamp
}
```

Comments Subcollection (`pairings/{pairingId}/comments/{commentId}`):
```typescript
interface Comment {
  id: string;              // Unique comment identifier
  userId: string;          // ID of the commenting user
  text: string;            // Comment content
  createdAt: Timestamp;    // When the comment was created
  username: string;        // Username of the commenter
  userPhotoURL?: string;   // URL to commenter's profile photo
}
```

#### `globalFeed` Collection

Denormalized collection of public pairings for the global feed.

```typescript
interface GlobalFeedItem {
  pairingId: string;       // Reference to the original pairing
  date: Timestamp;         // Date of the pairing
  users: string[];         // IDs of the paired users
  selfieURL: string;       // URL to the paired selfie image
  likes: number;           // Count of likes
  commentCount: number;    // Count of comments
}
```

#### `system` Collection

Contains system configuration documents.

Waitlist Document (`system/waitlist`):
```typescript
interface Waitlist {
  userIds: string[];       // IDs of waitlisted users
  updatedAt: Timestamp;    // Last update time
}
```

## Firestore Security Rules

The application uses the following security rules to protect data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Check if the user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Check if the authenticated user matches the requested user
    function isUser(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Check if the user's email is from Stanford
    function hasStanfordEmail() {
      return isAuthenticated() && 
             request.auth.token.email.matches('.*@stanford\\.edu');
    }
    
    // Check if the user is part of a pairing
    function isPartOfPairing(pairingData) {
      return isAuthenticated() && 
             pairingData.users.hasAny([request.auth.uid]);
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isUser(userId) && hasStanfordEmail();
      allow update: if isUser(userId);
      allow delete: if isUser(userId);
      
      // User's feed subcollection
      match /feed/{feedId} {
        allow read: if isUser(userId);
        allow write: if false; // Only Cloud Functions can write
      }
    }
    
    // Pairings collection
    match /pairings/{pairingId} {
      allow read: if isAuthenticated() && 
                    (resource.data.isPrivate == false || 
                     isPartOfPairing(resource.data));
      allow create: if false; // Only Cloud Functions can create
      allow update: if isAuthenticated() && 
                      isPartOfPairing(resource.data) &&
                      (request.resource.data.diff(resource.data).affectedKeys()
                        .hasOnly(['user1_photoURL', 'user2_photoURL', 
                                  'user1_submittedAt', 'user2_submittedAt',
                                  'isPrivate', 'status', 'likedBy', 'likesCount', 
                                  'comments', 'commentsCount']));
      allow delete: if false; // No deletion allowed
      
      // Comments subcollection
      match /comments/{commentId} {
        allow read: if isAuthenticated() && 
                      (resource.data.isPrivate == false || 
                       isPartOfPairing(get(/databases/$(database)/documents/pairings/$(pairingId)).data));
        allow create: if isAuthenticated() && 
                        isPartOfPairing(get(/databases/$(database)/documents/pairings/$(pairingId)).data) &&
                        request.resource.data.userId == request.auth.uid;
        allow update, delete: if isAuthenticated() && 
                               request.auth.uid == resource.data.userId;
      }
    }
    
    // Global feed collection
    match /globalFeed/{feedId} {
      allow read: if isAuthenticated();
      allow write: if false; // Only Cloud Functions can write
    }
    
    // System collection
    match /system/{docId} {
      allow read: if isAuthenticated();
      allow write: if false; // Only Cloud Functions can write
    }
    
    // Notification settings collection
    match /notificationSettings/{userId} {
      allow read: if isUser(userId);
      allow write: if isUser(userId);
    }
  }
}
```

## Cloud Functions

The app uses Firebase Cloud Functions for server-side operations:

### Pairing Functions

#### `pairUsers`
Scheduled function that runs daily to create pairings between active users.

- **Trigger**: Pub/Sub scheduler, daily at 5:00 AM PT
- **Logic**:
  1. Get all active users not in the waitlist
  2. Avoid pairing users who were recently paired or who blocked each other
  3. Create optimal pairings based on user history
  4. Create pairing documents in Firestore
  5. Update each user's feed with the new pairing
  6. Place unpaired users on the waitlist

#### `markExpiredPairingsAsFlaked`
Marks uncompleted pairings as flaked after the daily deadline.

- **Trigger**: Pub/Sub scheduler, daily at 10:05 PM PT
- **Logic**:
  1. Find all pending pairings that have expired
  2. Update their status to 'flaked'
  3. Increment the flake streak for users
  4. Update each user's pairing history

### Notification Functions

#### `sendPairingNotifications`
Sends notifications about new daily pairings.

- **Trigger**: Pub/Sub scheduler, daily at 7:00 AM PT
- **Logic**:
  1. Find all pairings created today
  2. For each pairing, check if users have notifications enabled
  3. Check if current time is outside quiet hours
  4. Send FCM notifications to eligible users

#### `sendReminderNotifications`
Sends reminders for pending pairings.

- **Trigger**: Pub/Sub scheduler, daily at 3:00 PM PT and 7:00 PM PT
- **Logic**:
  1. Find all pending pairings from today
  2. For each pairing, check which users haven't submitted photos
  3. Send FCM reminders to those users if they have reminders enabled

## Firebase Service Implementation

The app's `firebase.ts` service provides methods for interacting with Firebase. Recent improvements have optimized and standardized these implementations:

### Core Services Architecture

The Firebase services follow a layered approach:

1. **firebase.ts**: Central facade with standardized method signatures and error handling
2. **Specialized Services**: Domain-specific implementations with typed parameters
3. **Consistent Error Handling**: All services use the centralized logger utility
4. **Type Safety**: All service methods use well-defined types from the types directory

### Core Methods

```typescript
// User Methods
getCurrentUser(): Promise<User | null>
getUserById(userId: string): Promise<User | null>
updateUserProfile(userId: string, data: Partial<User>): Promise<void>
getUserStats(userId: string): Promise<UserStats>

// Pairing Methods
getCurrentPairing(userId: string): Promise<Pairing | null>
getPairingById(pairingId: string): Promise<Pairing | null>
completePairing(
  pairingId: string,
  userId: string,
  photoURL: string,
  isPrivate: boolean
): Promise<void>
getPairingHistory(userId: string, limit?: number): Promise<Pairing[]>

// Feed Methods
getFeed(
  userId: string,
  limit?: number,
  startAfter?: any
): Promise<{
  pairings: Pairing[];
  lastVisible: any;
  hasMore: boolean;
}>
getGlobalFeed(
  limit?: number,
  startAfter?: any
): Promise<{
  pairings: Pairing[];
  lastVisible: any;
  hasMore: boolean;
}>

// Social Interaction Methods
toggleLikePairing(pairingId: string, userId: string): Promise<void>
addCommentToPairing(
  pairingId: string,
  userId: string,
  username: string,
  userPhotoURL: string,
  text: string
): Promise<Comment>
sendPairingReminder(
  pairingId: string,
  senderId: string,
  recipientId: string
): Promise<void>

// Settings Methods
getUserNotificationSettings(userId: string): Promise<NotificationSettings | null>
updateUserNotificationSettings(
  userId: string,
  settings: Partial<NotificationSettings>
): Promise<void>
blockUser(userId: string, blockedUserId: string): Promise<void>
unblockUser(userId: string, blockedUserId: string): Promise<void>
```

### Standardized Error Handling

All Firebase service methods now use the centralized logger utility for consistent error handling:

```typescript
import logger from '../utils/logger';

// Example implementation with standardized error handling
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      logger.warn(`User not found: ${userId}`);
      return null;
    }
    
    return { id: userDoc.id, ...userDoc.data() } as User;
  } catch (error) {
    logger.error(`Failed to get user: ${userId}`, error);
    throw error;
  }
};
```

### Type-Safe Implementations

All Firebase service methods now use consistent parameter types:

```typescript
// Import from canonical type source
import { SubmitPhotoParams } from '../types/pairing';

// Type-safe implementation
export const submitPairingPhoto = async ({
  pairingId,
  userId,
  photoURL,
  isPrivate = false
}: SubmitPhotoParams): Promise<void> => {
  try {
    // Implementation details...
  } catch (error) {
    logger.error(`Failed to submit pairing photo: ${pairingId}`, error);
    throw error;
  }
};
```

## Test Data Setup

For development and testing, the app includes a script to populate Firebase with test data:

### Script Usage

```bash
# Navigate to scripts directory
cd scripts

# Install dependencies if needed
npm install

# Run the setup script
node setupFirebaseTestData.js
```

### Test Users

The script will create the following test users:

```javascript
const users = [
  {
    id: "user1",
    email: "duy@stanford.edu",
    username: "duy",
    displayName: "Duy Nguyen",
    photoURL: "https://example.com/duy.jpg",
    isActive: true,
    flakeStreak: 0,
    // Other fields...
  },
  {
    id: "user2",
    email: "justin@stanford.edu",
    username: "justin",
    displayName: "Justin Leong",
    // Other fields...
  },
  // Additional users...
];
```

### Test Pairings

The script will also create sample pairings between users:

```javascript
const pairings = [
  {
    id: "pairing1",
    date: new Date("2024-05-15"),
    users: ["user1", "user2"],
    user1_id: "user1",
    user2_id: "user2",
    status: "completed",
    // Other fields...
  },
  // Additional pairings...
];
```

## Authentication Setup

To configure Firebase Authentication:

1. Enable Email/Password authentication in Firebase Console
2. Enable Google Sign-in
3. Configure OAuth consent screen with the app's details
4. Add the app's domain to the authorized domains
5. Set up security rules to enforce Stanford email addresses

## Storage Configuration

The app uses Firebase Storage for user images with the following structure:

```
firebase-storage
├── profile_images/         # User profile photos
│   └── {userId}.jpg        # User profile image
└── pairing_photos/         # Photos for pairings
    └── {pairingId}/        # Photos for a specific pairing
        └── {userId}.jpg    # User's photo for the pairing
```

Firebase Storage is used efficiently with the following optimizations:

1. **Image Compression**: Images are compressed before upload using expo-image-manipulator
2. **Upload Progress Tracking**: The storageService provides upload progress tracking
3. **Efficient Image Loading**: The app uses expo-image for optimized image loading with caching
4. **Specialized Upload Functions**: The storageService provides specialized functions for different image types

Storage security rules:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Check if user owns the profile image
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Check if user is part of the pairing
    function isPartOfPairing(pairingId) {
      return isAuthenticated() && 
             exists(/databases/(default)/documents/pairings/$(pairingId)/users/$(request.auth.uid));
    }
    
    // Profile images
    match /profile_images/{userId}.jpg {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }
    
    // Pairing photos
    match /pairing_photos/{pairingId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && 
                     isPartOfPairing(pairingId) && 
                     fileName.matches(request.auth.uid + '_(front|back)\\.jpg');
    }
  }
}
```

## Deployment Configuration

For production deployment, set up:

1. Firebase App Check to protect backend resources
2. Firebase Performance Monitoring for tracking app performance
3. Firebase Crashlytics for error reporting
4. Set up proper Firebase budget alerts to control costs

## Firestore Indexes

Create the following indexes for efficient queries:

1. **Collection**: `pairings`
   - **Fields**: `users` (array-contains), `date` (desc)
   - **Query Scope**: Collection

2. **Collection**: `pairings`
   - **Fields**: `status` (asc), `date` (desc)
   - **Query Scope**: Collection

3. **Collection**: `globalFeed`
   - **Fields**: `date` (desc)
   - **Query Scope**: Collection

## Recent Firebase Implementation Improvements

### 1. Firebase Configuration Consolidation

The Firebase configuration has been consolidated and streamlined:

1. **Single Initialization Point**: Firebase is now initialized only in `src/config/firebaseInit.ts`
2. **Re-export Pattern**: `src/config/firebase.ts` now re-exports from the initialization file
3. **Robust Error Handling**: Initialization includes comprehensive error handling with fallbacks
4. **Type Safety**: Added proper typing for Firebase services

### 2. Service Method Signature Standardization

Service methods have been standardized for consistency:

1. **Consistent Parameter Types**: Methods with similar purposes use consistent parameter types
2. **Return Type Standardization**: Methods with similar purposes return consistently structured data
3. **Type-Safe Parameters**: All methods use well-defined TypeScript interfaces

### 3. Error Handling Improvements

Error handling has been improved for better reliability:

1. **Centralized Logger Usage**: All Firebase service methods now use the centralized logger
2. **Consistent Try/Catch Pattern**: All asynchronous operations use a consistent try/catch pattern
3. **Detailed Error Messages**: Error messages now include relevant context (document IDs, etc.)
4. **Environment-Aware Logging**: Log level is adjusted based on the environment (development/production)

### 4. Performance Optimizations

Several performance optimizations have been implemented:

1. **Batch Operations**: Related updates are grouped into batch operations for atomic updates
2. **Query Limiting**: All list operations include limits to prevent excessive data transfer
3. **Field Selection**: Queries now specify only needed fields when possible
4. **Index Optimization**: Queries are designed to use existing indexes effectively
5. **Atomic Operations**: Implemented atomic operations for likes and comments to prevent race conditions
6. **Transaction Support**: Added transaction support for critical operations like toggling likes

### 5. Single Camera System

The app has been updated to use a single camera system:

1. **Simplified Data Model**: Removed separate front/back image fields in favor of a single photo URL
2. **Streamlined Upload Process**: Updated storage paths to work with the single photo approach
3. **Backward Compatibility**: Added a backwards-compatible `completePairing` function that delegates to the new implementation
4. **Improved Status Tracking**: Enhanced status tracking to monitor submission progress more clearly

## Performance Considerations

1. Use `limit()` and pagination for querying large collections
2. Create composite indexes for complex queries
3. Optimize storage rules to minimize validation checks
4. Use batched writes for updating multiple documents
5. Consider using Firestore's atomic operations (arrayUnion, arrayRemove, increment) for concurrency safety
6. Use transactions for operations that need to be atomic
7. Implement client-side image caching via expo-image for better performance
8. Compress images before upload to reduce storage usage and improve load times
9. Use proper error handling for all Firebase operations
