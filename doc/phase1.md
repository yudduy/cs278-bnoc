# Implementation Phase 1: Infrastructure Setup

This phase focuses on building the foundational infrastructure for the Daily Meetup Selfie app. We'll update data models, set up Firebase schema, enhance authentication with Stanford email verification, and create a comprehensive onboarding experience.

## Data Models & Types

### User Model Updates
```typescript
interface User {
  id: string;
  email: string;
  displayName?: string;
  username: string;
  photoURL?: string;
  createdAt: Timestamp;
  lastActive: Timestamp;
  isActive: boolean;
  flakeStreak: number;
  maxFlakeStreak: number;
  blockedIds: string[];
  notificationSettings: NotificationSettings;
  snoozeTokensRemaining: number;
  snoozeTokenLastRefilled: Timestamp;
}
```

### Pairing (Replacing Meetup)
```typescript
interface Pairing {
  id: string;
  date: Timestamp;
  users: string[]; // Array of user IDs
  status: 'pending' | 'completed' | 'flaked';
  selfieURL?: string;
  frontImage?: string;
  backImage?: string;
  completedAt?: Timestamp;
  isPrivate: boolean;
  likes: number;
  likedBy: string[];
  comments: Comment[];
  virtualMeetingLink?: string;
}
```

### Comment Model
```typescript
interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: Timestamp;
  username: string;
  userPhotoURL?: string;
}
```

### Additional Data Models
```typescript
interface NotificationSettings {
  pairingNotification: boolean;
  reminderNotification: boolean;
  completionNotification: boolean;
  quietHoursStart: number; // 0-23 hour
  quietHoursEnd: number; // 0-23 hour
}

interface PairingHistory {
  userId: string;
  pairedWith: Array<{
    userId: string;
    date: Timestamp;
    status: 'completed' | 'flaked';
  }>;
}

interface UserStats {
  userId: string;
  totalPairings: number;
  completedPairings: number;
  flakeRate: number;
  averageResponseTime: number;
  uniqueConnectionsMade: number;
}
```

## Firebase Configuration

### Firebase Setup
1. Update Firebase configuration to include all required services:
   - Authentication with email/password, Google, and Apple
   - Firestore for data storage
   - Storage for images
   - Cloud Functions for pairing algorithm
   - Cloud Messaging for notifications

2. Set up appropriate security rules to ensure data integrity:
   ```
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read: if request.auth != null;
         allow write: if request.auth.uid == userId;
       }
       
       match /pairings/{pairingId} {
         allow read: if request.auth != null && 
           (resource.data.users[0] == request.auth.uid || 
           resource.data.users[1] == request.auth.uid || 
           !resource.data.isPrivate);
         allow update: if request.auth != null && 
           (resource.data.users[0] == request.auth.uid || 
           resource.data.users[1] == request.auth.uid);
       }
     }
   }
   ```

### Firebase Service Methods
Implement the following Firebase service methods:

1. User Management:
   ```typescript
   // Create a new user
   createUser(userData: Partial<User>): Promise<string>
   
   // Update user profile
   updateUserProfile(userId: string, updates: Partial<User>): Promise<void>
   
   // Check username availability
   checkUsernameAvailability(username: string): Promise<boolean>
   
   // Get user by ID
   getUserById(userId: string): Promise<User | null>
   ```

2. Pairing Management:
   ```typescript
   // Get current pairing for user
   getCurrentPairing(userId: string): Promise<Pairing | null>
   
   // Complete a pairing with selfie
   completePairing(pairingId: string, selfieData: {
     frontImage: string;
     backImage: string;
     isPrivate: boolean;
   }): Promise<void>
   
   // Mark pairing as flaked
   markPairingAsFlaked(pairingId: string): Promise<void>
   
   // Get user pairing history
   getUserPairingHistory(userId: string, limit: number): Promise<Pairing[]>
   ```

3. Feed and Social:
   ```typescript
   // Get user feed
   getFeed(userId: string, limit: number, startAfter?: Timestamp): Promise<Pairing[]>
   
   // Add comment to pairing
   addComment(pairingId: string, comment: Omit<Comment, 'id' | 'createdAt'>): Promise<string>
   
   // Like/unlike a pairing
   toggleLike(pairingId: string, userId: string): Promise<void>
   
   // Update notification settings
   updateNotificationSettings(userId: string, settings: NotificationSettings): Promise<void>
   ```

## PairingContext Setup

Replace the existing MeetupContext with a more comprehensive PairingContext:

```typescript
interface PairingContextType {
  currentPairing: Pairing | null;
  pairingStatus: 'loading' | 'idle' | 'uploading' | 'error';
  pairingError: string | null;
  pairingHistory: Pairing[];
  historyStatus: 'loading' | 'idle' | 'error';
  historyError: string | null;
  
  // Methods
  loadCurrentPairing: () => Promise<void>;
  completePairing: (selfieData: {
    frontImage: string;
    backImage: string;
    isPrivate: boolean;
  }) => Promise<void>;
  loadPairingHistory: (limit?: number) => Promise<void>;
  toggleLikePairing: (pairingId: string) => Promise<void>;
  addCommentToPairing: (pairingId: string, text: string) => Promise<void>;
  useVirtualMeeting: (pairingId: string) => Promise<string>;
}
```

Implement the PairingContext Provider with all required methods and real-time data subscriptions.

## Authentication Enhancement

Enhance the authentication flow with the following improvements:

1. Stanford Email Verification:
   ```typescript
   // Validate email domain
   const validateStanfordEmail = (email: string): boolean => {
     return email.endsWith('@stanford.edu');
   };
   ```

2. Email/Password Authentication:
   ```typescript
   // Sign up with email
   const signUpWithEmail = async (email: string, password: string): Promise<User> => {
     if (!validateStanfordEmail(email)) {
       throw new Error('Only Stanford email addresses are allowed');
     }
     
     // Firebase auth signup
     const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
     
     // Additional setup...
   };
   
   // Sign in with email
   const signInWithEmail = async (email: string, password: string): Promise<User> => {
     // Firebase auth signin
     const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
     
     // Additional validation and data fetching...
   };
   ```

3. OAuth Integration (Google & Apple):
   ```typescript
   // Sign in with Google
   const signInWithGoogle = async (): Promise<User> => {
     const provider = new firebase.auth.GoogleAuthProvider();
     provider.setCustomParameters({ hd: 'stanford.edu' });
     
     const userCredential = await firebase.auth().signInWithPopup(provider);
     
     // Validate email domain and handle user creation/login
   };
   
   // Sign in with Apple (similar implementation)
   ```

4. Auth Screen UI Improvements:
   - Create a polished sign-in/sign-up toggle screen
   - Add visual loading indicators
   - Implement error message display
   - Design a Stanford-themed authentication interface

5. Error Handling:
   ```typescript
   // Add clearError functionality to AuthContext
   interface AuthContextType {
     // Existing properties...
     error: string | null;
     clearError: () => void;
   }
   ```

## Onboarding Experience

Implement a multi-step onboarding flow:

### Step 1: Welcome Screen
- App introduction with logo and value proposition
- Overview of how the app works
- Next button to proceed

### Step 2: Permissions Screen
- Camera permission request with explanation
- Notification permission request with explanation
- Visual indicators for granted permissions
- Skip options with consequences explained

### Step 3: Username Selection
- Input field for username selection
- Real-time availability checking
- Validation for username format
- Help text for username guidelines

### Step 4: Profile Creation
- Optional display name input
- Profile photo upload or capture option
- Profile photo cropping/editing
- Skip option with default avatar

### Step 5: Completion Screen
- Success message and confirmation
- Summary of completed setup
- "Get Started" button to enter the app

## Implementation Tasks

1. **Data Model Implementation**:
   - Create/update TypeScript interfaces for all data models
   - Set up Firebase schema validation

2. **Firebase Service Development**:
   - Implement all Firebase service methods
   - Set up security rules
   - Create test utilities for service methods

3. **Authentication System**:
   - Implement enhanced AuthContext
   - Create Stanford email verification system
   - Build OAuth integration with domain verification
   - Design and implement Auth screens
   - Add error handling and loading states

4. **Context Providers**:
   - Implement PairingContext to replace MeetupContext
   - Set up real-time data subscriptions
   - Create context provider for notification settings

5. **Onboarding Flow**:
   - Create multi-step onboarding navigation
   - Implement permission handling
   - Build username availability system
   - Create profile creation interface
   - Add progress tracking through onboarding

6. **UI Components**:
   - Create reusable buttons, inputs, and cards
   - Implement loading and error state components
   - Design permission request components
   - Build profile editor components

## Testing Strategy

1. **Unit Tests**:
   - Test all Firebase service methods
   - Validate authentication flows
   - Test data model validation

2. **Integration Tests**:
   - Test context providers with Firebase integration
   - Validate onboarding flow progression
   - Test permission handling

3. **UI Tests**:
   - Test responsive design across device sizes
   - Validate error state displays
   - Test loading indicators

## Expected Outcomes

After completing Phase 1, we will have:

1. A solid foundation for the app with well-defined data models
2. A secure authentication system with Stanford email verification
3. A comprehensive onboarding experience that sets users up for success
4. Core Firebase services integrated and optimized for performance
5. Context providers for managing app state across components
6. Reusable UI components for consistent user experience

This infrastructure setup will provide the foundation for implementing the core features in the subsequent phases.