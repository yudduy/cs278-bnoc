# BNOC App Architecture

This document provides a high-level overview of the BNOC Daily Meetup Selfie app's architecture, explaining the key design patterns, data flows, and architectural decisions.

## Architecture Overview

The BNOC app follows a layered architecture with clear separation of concerns:

1. **Presentation Layer** - React Native UI components and screens
2. **Business Logic Layer** - Contexts, hooks, and service interfaces
3. **Data Access Layer** - Firebase services and local storage

## Core Architecture Patterns

### 1. Context-Based State Management

Rather than Redux, the app uses React Context API for state management, providing a simpler approach that's sufficient for the app's complexity:

- **AuthContext** - Manages user authentication state
- **PairingContext** - Handles daily pairing operations and state
- **NotificationContext** - Manages in-app notifications
- **SettingsContext** - Handles user preferences

These contexts serve as a centralized state management system, reducing prop drilling and providing global access to key application states.

### 2. Custom Hooks Pattern

Business logic is encapsulated in custom hooks, promoting reusability and separation of concerns:

- **useAuth** - Authentication operations
- **usePairing** - Pairing retrieval and operations
- **useCamera** - Camera functionality and image capture
- **useFeed** - Feed data fetching and pagination
- **useNotifications** - Push notification registration and handling

This approach allows for clean component implementations that focus on UI concerns while delegating business logic to hooks.

### 3. Service Facade Pattern

Firebase interactions are abstracted through service modules:

- **firebase.ts** - Central facade providing methods for all Firebase operations
- **FirebaseProvider** - Provides Firebase context to the application

This pattern isolates the application from Firebase implementation details, making it easier to maintain and potentially replace the backend.

### 4. Component Composition

UI is built using composable components that follow the single responsibility principle:

- Small, focused components with specific responsibilities
- Component composition to build complex interfaces
- Clear props interfaces for all components

## Data Flow Architecture

### 1. Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Auth Screen │────▶│  useAuth    │────▶│ AuthService │────▶│  Firebase   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       ▲                   │                                       │
       └───────────────────┴───────────────────────────────────────┘
                         Auth State Updates
```

1. User interacts with Auth screens (sign in/up)
2. `useAuth` hook processes the request
3. Auth service communicates with Firebase Auth
4. Auth state is updated in Context
5. UI components react to the auth state change

### 2. Pairing System Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Pairing   │     │ usePairing  │     │ Firebase    │
│  Algorithm  │────▶│    Hook     │◀───▶│ Services    │
│(Cloud Func) │     └─────────────┘     └─────────────┘
└─────────────┘            │                   ▲
                           ▼                   │
                    ┌─────────────┐     ┌─────────────┐
                    │   Pairing   │     │    Camera   │
                    │   Context   │────▶│    Screen   │
                    └─────────────┘     └─────────────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │ UI Elements │     │Upload Service│
                    │ (Components)│     │   (Storage)  │
                    └─────────────┘     └─────────────┘
```

1. Cloud Function pairs users daily
2. `usePairing` hook fetches current pairing
3. PairingContext provides pairing data to components
4. User captures photo in Camera Screen
5. Photo is uploaded via Storage Service
6. Pairing document is updated in Firestore

### 3. Feed System Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Feed Data  │     │   useFeed   │     │   Firebase  │
│(Firestore)  │◀───▶│    Hook     │◀───▶│   Services  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Feed Screen │
                    │ Components  │
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │User Interact│
                    │(Like/Comment)│
                    └─────────────┘
```

1. Feed data is stored in Firestore (personalized and global feeds)
2. `useFeed` hook retrieves and manages feed data
3. Feed components display the data with optimized image loading
4. User interactions update the Firestore documents
5. Real-time updates are reflected in the UI

### 3. Friend Connection Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│FindFriends  │     │ userService │     │  Firebase   │
│   Screen    │────▶│updateConnect│────▶│ Firestore   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │ Mutual Friend│     │ connections │
                    │  Updates    │     │   Array     │
                    └─────────────┘     └─────────────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │ User Interface │  │Pairing Algo │
                    │ Updates       │  │ Preferences  │
                    └─────────────┘    └─────────────┘
```

1. User adds a friend in the FindFriendsScreen
2. `userService.updateConnection` handles the update
3. Mutual connection is created in Firestore for both users
4. UI updates to show the friend as added
5. Pairing algorithm will prioritize friend connections when creating daily pairings

### 4. Empty State System

The app uses a conditional rendering approach for empty states:

1. **User Authentication State Check** - If user is not authenticated, show authentication screens
2. **Friend Count Check** - If user has fewer than 5 friends, show "Add Friends" empty state
3. **Current Pairing Check** - If user has no current pairing, show "No Match Today" empty state
4. **Pairing Completion Check** - If user has no completed pairings, show "No Selfies Yet" empty state

This progressive validation ensures users receive appropriate guidance based on their current state in the app flow.

## Key Design Decisions

### 1. Single Camera System

The app uses a single camera capture system with `expo-camera`, managed through:

- **useCamera Hook** - Manages camera permissions, reference, and capture actions
- **Camera Component** - Provides the UI for camera preview and capture
- **CameraPreview Component** - Allows users to review captured photos

This simplifies the user experience while still supporting the core functionality of pairing selfies.

### 2. Optimized Image Handling

The app uses efficient image handling to improve performance:

- **expo-image** - Used for optimized image loading with automatic caching
- **expo-image-manipulator** - For image resizing and compression before uploads
- **Progressive Loading** - Images load progressively in the feed for better UX
- **Efficient Storage** - Firebase Storage paths are organized for fast retrieval

### 3. Denormalized Data Structure

For improved performance, the app uses a denormalized data structure:

- Global feed entries reference original pairing documents
- User feeds contain references to relevant pairings
- Comment counts and like counts are stored directly on documents

This approach reduces query complexity and improves real-time performance.

### 4. Firebase Cloud Functions for Business Logic

Complex business logic is implemented in Cloud Functions:

- Pairing algorithm runs on a schedule
- Notification dispatching
- Feed updates

This approach keeps the client lighter and ensures consistent business rule application.

### 5. Friend Connections Model

The app uses a bidirectional friend connection model:

- Connections are stored as arrays of user IDs in each user document
- Adding a friend creates a mutual connection (both users appear in each other's connections array)
- Firestore batch operations ensure atomic updates to maintain consistency
- The pairing algorithm prioritizes matching users with their friends when possible
- Users need at least 5 friends to be eligible for daily pairing

## State Management

### 1. Authentication State

- **Source of Truth**: Firebase Authentication
- **Local State**: AuthContext maintains current user and auth status
- **Persistence**: Firebase handles token persistence

### 2. Pairing State

- **Source of Truth**: Firestore (pairings collection)
- **Local State**: PairingContext provides current pairing and history
- **Updates**: Two-way sync through Firebase services

### 3. Feed State

- **Source of Truth**: Firestore (global feed and user feed collections)
- **Local State**: Managed by useFeed hook with pagination support
- **Updates**: Real-time listeners for immediate UI updates

## Error Handling Strategy

1. **UI Level**: Friendly error messages using notification components
2. **Service Level**: Consistent error handling with try/catch
3. **Network Errors**: Handled gracefully with retry mechanisms
4. **Authentication Errors**: Redirect to auth flow when needed

## Performance Considerations

1. **Image Optimization**: Photos are optimized before upload using expo-image-manipulator
2. **Image Caching**: expo-image provides automatic caching for better performance
3. **Pagination**: Feed uses pagination to limit data transfer
4. **Caching**: Important data is cached for offline access
5. **Lazy Loading**: Components and screens implement lazy loading where appropriate

## Security Architecture

1. **Authentication**: Firebase Authentication with Google sign-in
2. **Authorization**: Firestore Security Rules enforce access controls
3. **Data Validation**: Both client-side and server-side validation
4. **Environment Variables**: Sensitive configuration is stored in environment variables

## Testing Approach

1. **Component Testing**: Individual components can be tested in isolation
2. **Hook Testing**: Custom hooks have their own test suites
3. **Integration Testing**: Key flows are tested from end to end
4. **Firebase Emulator**: Local development and testing use Firebase emulator

## Future Architecture Improvements

1. **State Management**: Consider using Redux for more complex state management if needed
2. **Code Splitting**: Optimize bundle size for better performance
3. **Offline Support**: Enhance offline capabilities with better caching strategies
4. **Analytics Integration**: Add comprehensive analytics for user behaviors
