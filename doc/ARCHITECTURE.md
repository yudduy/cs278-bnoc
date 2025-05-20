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

- **useAuth** - Authentication operations (integrated directly in AuthContext)
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

### 5. Canonical Source Pattern

The app now follows a canonical source pattern for utilities and types:

- **Canonical utilities** - Core utilities are defined in centralized locations (e.g., camera utilities in `camera/cameraUtils.ts`)
- **Re-export mechanism** - For backward compatibility, older utility files re-export from the canonical sources
- **Type consolidation** - Types are defined in specialized files and re-exported from a central location

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
        │                   │                   │
        │                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│AddFriends   │     │ Mutual Friend│     │ connections │
│Component    │     │  Updates    │     │   Array     │
└─────────────┘     └─────────────┘     └─────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ User Interface │  │Pairing Algo │     │Feed Display │
│ Updates       │  │ Preferences  │     │Decision     │
└─────────────┘    └─────────────┘     └─────────────┘
```

The friend connection system works through two complementary components:

1. **AddFriends Component** (`src/components/social/AddFriends.tsx`):
   - Serves as an empty state display in the feed when a user has fewer than 5 friends
   - Shows the current friend count: "X/5 friends"
   - Provides a simple "Add Friends" action button
   - When clicked, navigates to the FindFriendsScreen

2. **FindFriendsScreen** (`src/screens/Feed/FindFriendsScreen.tsx`):
   - Full-featured screen for discovering and connecting with other users
   - Includes search functionality to find specific users
   - Shows connection status (Added/Add) for each user
   - Provides detailed user information
   - Implements the actual connection functionality through `userService.updateConnection`

When a user has fewer than 5 friends, the app will:
1. Display the `AddFriends` component on the feed page showing the current count
2. Upon clicking "Add Friends", navigate to the `FindFriendsScreen`
3. The user can search and add connections through this screen
4. Once they have 5 or more friends, the feed will start showing pairings (or an alternative empty state if no completed pairings exist yet)

This dual-component approach separates the empty state UI from the functional friend discovery system, allowing for better modularity while maintaining a consistent user flow.

### 4. Logging System Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  App Code   │────▶│  logger.ts  │────▶│ Console/Log │
│  (Any File) │     │  Utility    │     │  Service    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Environment │
                    │   Checks    │
                    └─────────────┘
```

1. Application code logs events using the centralized logger utility
2. Logger applies environment-aware behavior (suppressing debug logs in production)
3. Messages are formatted with consistent prefixes ([DEBUG], [INFO], etc.)
4. In the future, this could be extended to log to external services

### 5. Empty State System

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

### 6. Canonical Source Pattern

The app now follows a canonical source pattern for utilities and types:

- **Single Source of Truth**: Each utility function or type has one canonical location
- **Re-exporting for Compatibility**: Legacy files now re-export from canonical sources
- **Clear Deprecation Marking**: Deprecated paths are marked with JSDoc comments
- **Consistent Import Style**: All components use a consistent import approach

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
2. **Service Level**: Consistent error handling with try/catch and centralized logger
3. **Network Errors**: Handled gracefully with retry mechanisms
4. **Authentication Errors**: Redirect to auth flow when needed
5. **Centralized Logging**: All errors are logged through a unified logger utility

## Performance Considerations

1. **Image Optimization**: Photos are optimized before upload using expo-image-manipulator
2. **Image Caching**: expo-image provides automatic caching for better performance
3. **Pagination**: Feed uses pagination to limit data transfer
4. **Caching**: Important data is cached for offline access
5. **Lazy Loading**: Components and screens implement lazy loading where appropriate
6. **Code Organization**: Clear module boundaries and minimal dependencies between components

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

## Recent Architectural Improvements

### 1. Code Cleanup and Consolidation

The app has undergone systematic code cleanup to reduce duplication and improve maintainability:

1. **Camera Utilities Consolidation**:
   - Established `src/utils/camera/cameraUtils.ts` as the canonical source for camera utilities
   - Updated legacy utility file (`src/utils/cameraUtils.ts`) to re-export from the canonical source
   - Ensured all components import from the appropriate source

2. **Type Definition Consistency**:
   - Consolidated the `SubmitPhotoParams` interface in `src/types/pairing.ts`
   - Added deprecation notes to guide developers to use the canonical types
   - Ensured type re-exports follow a consistent pattern

3. **Standardized Logger Implementation**:
   - Implemented a centralized logging utility in `src/utils/logger.ts`
   - Provided environment-aware behavior (suppressing debug logs in production)
   - Added support for different log levels (debug, info, warn, error)
   - Standardized log formatting for easier debugging

4. **Consistent Import Structure**:
   - Removed deprecated hook usage (e.g., `useAuth` from hooks directory)
   - Updated all components to use direct imports from context providers
   - Standardized service method calls across components

### 2. Component Refactoring

Several components have been refactored to improve reusability and maintainability:

1. **PhotoPreviewScreen Refactoring**:
   - Now uses the reusable `CameraPreview` component
   - Maintains consistency with the `CameraScreen` implementation
   - Improves code reuse and reduces duplication

2. **CommentInput Improvement**:
   - Updated to use the correct parameters for the `addCommentToPairing` function
   - Fixed error handling with the new logger utility

### 3. Future Architecture Considerations

As the application continues to evolve, the following architectural improvements should be considered:

1. **Camera Context Provider**: Create a dedicated context for camera state management
2. **Image Processing Pipeline**: Build a standardized pipeline for image processing and uploads
3. **Service Layer Consistency**: Ensure all Firebase interactions use the facade pattern consistently
4. **Navigation Type Safety**: Strengthen the typing of navigation parameters throughout the app
5. **Context Decomposition**: Consider splitting large contexts into smaller, more focused ones

These improvements will further enhance maintainability, reduce duplication, and ensure a consistent user experience throughout the app.

### 4. Component Relationship Clarification

- Clarified the relationship between `AddFriends.tsx` and `FindFriendsScreen.tsx`
- Ensured proper functionality when users have enough friends but no pairings yet
- Added explicit prop `hasEnoughFriends` to `EmptyFeed` component to control which empty state to show

### 5. Enhanced User Experience

- Restored randomized greeting messages in the `DailyPairingScreen`
- Improved empty state logic to properly distinguish between "not enough friends" and "no pairings yet"
