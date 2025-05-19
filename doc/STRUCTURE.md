# BNOC- Project Structure

This document outlines the current project directory structure of the Daily Meetup Selfie app. Each folder and key file is described with its purpose.

## Root Directory

```
/bnoc
├── .cursor/                    # Editor-specific configuration
├── .env                        # Environment variables
├── .expo/                      # Expo configuration files
├── .git/                       # Git repository data
├── assets/                     # Static assets like images, fonts, etc.
│   ├── fonts/                  # App fonts
│   ├── icons/                  # App icons
│   └── images/                 # Static images used in the app
├── doc/                        # Project documentation
│   ├── ARCHITECTURE.md         # Architecture overview
│   ├── FIREBASE.md             # Firebase setup and usage
│   ├── TODO.md                 # Development todos
│   ├── PRD.md                  # Product requirements document
│   └── STRUCTURE.md            # This document
├── firebase/                   # Firebase configuration
├── functions/                  # Firebase Cloud Functions
│   └── src/                    # Source code for Cloud Functions
│       ├── index.ts            # Main Cloud Functions entry point
│       ├── notifications/      # Notification handling functions
│       └── pairing/            # Pairing algorithm functions
├── src/                        # Application source code
│   ├── components/             # Reusable UI components
│   │   ├── buttons/            # Button components
│   │   │   ├── PrimaryButton.tsx
│   │   │   └── SecondaryButton.tsx
│   │   ├── cards/              # Card components
│   │   │   ├── PairingCard.tsx # Display for a pairing in the feed
│   │   │   └── ProfileCard.tsx # User profile summary card
│   │   ├── forms/              # Form components
│   │   │   ├── AuthForm.tsx    # Authentication form
│   │   │   └── ProfileForm.tsx # Profile editing form
│   │   ├── layout/             # Layout components
│   │   │   ├── Container.tsx
│   │   │   └── SafeAreaContainer.tsx
│   │   ├── loaders/            # Loading indicators
│   │   │   └── LoadingSpinner.tsx
│   │   ├── modals/             # Modal components
│   │   │   ├── ConfirmationModal.tsx
│   │   │   └── ImagePreviewModal.tsx
│   │   ├── notifications/      # Notification components
│   │   │   ├── ErrorNotification.tsx
│   │   │   └── SuccessNotification.tsx
│   │   ├── camera/             # Camera components (Single camera system using expo-camera)
│   │   │   ├── Camera.tsx      # Contains CameraCapture component for single photo capture
│   │   │   └── CameraPreview.tsx # Component for previewing the captured single photo
│   │   ├── feed/               # Feed components
│   │   │   ├── FeedList.tsx
│   │   │   └── EmptyFeed.tsx
│   │   ├── comments/           # Comment components
│   │   │   ├── CommentList.tsx
│   │   │   └── CommentInput.tsx
│   │   ├── profile/            # Profile components
│   │   │   ├── FlakeStreakDisplay.tsx
│   │   │   └── UserStatsDisplay.tsx
│   │   ├── onboarding/         # Onboarding components
│   │   │   ├── OnboardingStep.tsx
│   │   │   └── PermissionRequest.tsx
│   │   └── AppFonts.tsx        # Font loading component
│   ├── config/                 # Configuration files
│   │   ├── firebase.ts         # Firebase configuration (re-exports from firebaseInit) 
│   │   ├── firebaseInit.ts     # Firebase initialization with robust error handling
│   │   ├── colors.ts           # Color constants
│   │   ├── constants.ts        # App constants
│   │   └── env.ts              # Environment configuration
│   ├── context/                # React Context providers
│   │   ├── AuthContext.tsx     # Authentication context with real Firebase Auth integration
│   │   ├── PairingContext.tsx  # Pairing management context
│   │   ├── NotificationContext.tsx # Notification context
│   │   └── SettingsContext.tsx # App settings context
│   ├── providers/              # Service providers
│   │   └── FirebaseProvider.tsx # Firebase service provider with enhanced initialization
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts          # (Deprecated) Re-exports useAuth from AuthContext
│   │   ├── usePairing.ts       # Pairing hook
│   │   ├── useCamera.ts        # Hook for expo-camera, adapted for single camera
│   │   ├── useFeed.ts          # Feed data hook
│   │   ├── usePermissions.ts   # Permission handling hook
│   │   └── useNotifications.ts # Notification hook
│   ├── navigation/             # Navigation configuration
│   │   ├── AuthNavigator.tsx   # Auth flow navigation for login/signup/password flows
│   │   ├── MainNavigator.tsx   # Main app navigation
│   │   ├── OnboardingNavigator.tsx # Onboarding flow
│   │   ├── ProfileNavigator.tsx # Profile navigation
│   │   └── NavigationService.ts # Navigation utilities
│   ├── screens/                # App screens
│   │   ├── Auth/               # Authentication screens
│   │   │   ├── SignInScreen.tsx      # Handles user sign in with Stanford email validation
│   │   │   ├── SignUpScreen.tsx      # Handles new user registration with validation
│   │   │   ├── ForgotPasswordScreen.tsx # Handles password reset functionality
│   │   │   └── AuthStyles.ts   # Styles for auth screens
│   │   ├── Camera/             # Camera screens
│   │   │   ├── CameraScreen.tsx # Orchestrates single camera capture & preview flow
│   │   │   └── CameraStyles.ts # Styles for camera screens
│   │   ├── Feed/               # Feed screens
│   │   │   ├── FeedScreen.tsx  # Main feed screen
│   │   │   ├── PairingDetailScreen.tsx # Detailed view of a pairing
│   │   │   └── FeedStyles.ts   # Styles for feed screens
│   │   ├── Profile/            # Profile screens
│   │   │   ├── ProfileScreen.tsx # User profile screen
│   │   │   ├── EditProfileScreen.tsx # Profile editing screen
│   │   │   ├── SettingsScreen.tsx # App settings screen
│   │   │   └── ProfileStyles.ts # Styles for profile screens
│   │   ├── Onboarding/         # Onboarding screens
│   │   │   ├── WelcomeScreen.tsx # Introduction screen
│   │   │   ├── PermissionsScreen.tsx # Permission requests
│   │   │   ├── UsernameScreen.tsx # Username selection
│   │   │   ├── ProfileSetupScreen.tsx # Profile setup
│   │   │   ├── CompletionScreen.tsx # Onboarding completion
│   │   │   └── OnboardingStyles.ts # Styles for onboarding
│   │   └── Waiting/            # Waiting screens
│   │       ├── WaitingScreen.tsx # Partner waiting screen
│   │       └── WaitingStyles.ts # Styles for waiting screens
│   ├── services/               # Service modules
│   │   ├── firebase.ts         # Firebase service methods (facade)
│   │   ├── authService.ts      # Authentication service
│   │   ├── cameraService.ts    # Camera related utilities (if any, distinct from useCamera hook)
│   │   ├── notificationService.ts # Notification service
│   │   ├── storageService.ts   # Firebase Storage service (uploads, downloads)
│   │   ├── userService.ts      # User-specific backend operations
│   │   ├── pairingService.ts   # Pairing-specific backend operations
│   │   ├── feedService.ts      # Feed-specific backend operations
│   │   ├── errorReporting.ts   # Error reporting service
│   │   └── analytics.ts        # Analytics service
│   ├── styles/                 # Global styles
│   │   ├── theme.ts            # Theme definitions
│   │   ├── typography.ts       # Typography styles
│   │   └── globalStyles.ts     # Global style utilities
│   ├── types/                  # TypeScript type definitions
│   │   ├── index.ts            # Main type exports
│   │   ├── auth.ts             # Auth-related types
│   │   ├── pairing.ts          # Pairing-related types
│   │   ├── user.ts             # User-related types
│   │   ├── notification.ts     # Notification-related types
│   │   └── navigation.ts       # Navigation-related types
│   └── utils/                  # Utility functions
│       ├── camera/             # Camera utilities
│       │   └── cameraUtils.ts    # Camera helper functions
│       ├── cameraUtils.ts      # Camera utility functions (top-level)
│       ├── date.ts             # Date formatting utilities
│       ├── validation.ts       # Input validation utilities
│       ├── logger.ts           # Logging utilities
│       ├── permissions.ts      # Permission management utilities
│       ├── imageProcessing.ts  # Image processing utilities
│       └── storage.ts          # Local storage utilities
├── App.tsx                     # Main App component with conditional navigation based on auth state
├── CLAUDE.md                   # Documentation for Claude AI assistance
├── README.md                   # Project README
├── app.json                    # Expo configuration
├── babel.config.js             # Babel configuration
├── package-lock.json           # NPM dependencies lock file
├── package.json                # NPM dependencies
├── setup.sh                    # Development environment setup script
└── tsconfig.json               # TypeScript configuration
```

## Key Files and Their Purpose

### Firebase Cloud Functions

- **index.ts**: Main entry point for all Firebase Cloud Functions.
- **pairing/*.ts**: Implements the daily pairing algorithm that matches users, avoiding recent repeats and respecting user preferences.
- **notifications/*.ts**: Handles sending push notifications for new pairings, reminders, and social interactions.

### Core Services

- **firebase.ts**: Central Firebase service facade with methods for data access and modification.
- **firebaseInit.ts**: Initializes Firebase services with robust error handling and fallbacks.
- **FirebaseProvider.tsx**: Provides Firebase context and ensures Firebase is properly initialized before rendering the app.
- **authService.ts**: Handles user authentication flows, including email/password, Google, and Apple sign-in with Stanford email validation.
- **notificationService.ts**: Manages push notification registration, permission handling, and notification preferences.

### Context Providers

- **AuthContext.tsx**: Provides authentication state and methods throughout the app, including user data and auth status. Contains the integrated useAuth hook. Updated to use real Firebase Authentication.
- **PairingContext.tsx**: Manages the current user's pairing state, history, and related actions like completing pairings and social interactions.
- **NotificationContext.tsx**: Handles in-app notifications and push notification permissions.

### Key Components

- **Camera.tsx**: Implements the single camera capture functionality using expo-camera.
- **CameraPreview.tsx**: Allows users to review their captured photo before submitting.
- **PairingCard.tsx**: Displays a pairing in the feed with user avatars, selfie, likes, and comments.
- **FlakeStreakDisplay.tsx**: Visualizes the user's current flake streak with animations and contextual messages.

### Main Screens

- **Auth Screens**: Implemented authentication flow with:
  - **SignInScreen.tsx**: User login screen with Stanford email validation
  - **SignUpScreen.tsx**: New user registration with validation
  - **ForgotPasswordScreen.tsx**: Password reset functionality
- **FeedScreen.tsx**: Displays the main feed of completed pairings with infinite scroll and pull-to-refresh.
- **CameraScreen.tsx**: Orchestrates the single camera capture flow, managing `Camera` and `CameraPreview` components, and handles image upload to Firebase Storage and updating pairing info.
- **ProfileScreen.tsx**: Shows user profile with stats, streak visualization, and pairing history.
- **SettingsScreen.tsx**: Provides user configurable options including notification preferences and privacy controls.

### Type Definitions

- **user.ts**: Defines the User interface and related types for user data.
- **pairing.ts**: Defines the Pairing interface and related types for pairing data.
- **notification.ts**: Defines notification settings and types for push notifications.

## Current Architecture Components

1. **Single Camera System**: Uses expo-camera with the `useCamera` hook and `Camera.tsx` component.
2. **Robust Firebase Integration**: Centralizes Firebase access through the `firebase.ts` service with initialization in `firebaseInit.ts` and context provision via `FirebaseProvider.tsx`. Includes fallback mechanisms for handling initialization failures.
3. **Enhanced User Model**: Includes fields for flake streak tracking, notification settings, and blocked users.
4. **Organized Component Structure**: Components are organized by functionality (camera, feed, profile, etc.).
5. **Cloud Functions**: Firebase Cloud Functions handle pairing algorithm and notifications.
6. **Optimized Feed System**: Uses an efficient data structure for better performance.
7. **Camera Utilities**: Camera-related utilities are organized in both top-level and subfolder locations.
8. **Black and White Theme**: App-wide dark theme with white accents for a modern, premium feel.
9. **Consistent Onboarding Flow**: Smooth, progressive onboarding experience with animated transitions.
10. **Daily Pairing Experience**: Sleek daily pairing confirmation screen with user profiles and direct chat access.
11. **Modern Chat Interface**: Black and white themed chat with minimalist design and seamless camera integration.
12. **Error-Resilient Authentication**: Authentication system that gracefully handles initialization issues and provides fallbacks.
13. **Real Firebase Authentication**: App now conditionally shows authentication screens or main app content based on the user's authenticated state. Uses real Firebase Authentication with Stanford email validation.

## Key Component and Hook Details

### Hooks

- **`useAuth`**: Integrated directly in AuthContext.tsx - manages user authentication state and provides access to user data.
- **`useCamera.ts`**: Manages camera logic using `expo-camera`. Provides camera reference, permissions, capture functions (for a single image), camera type toggling (front/back), and flash mode control.
- **`useNotifications.ts`**: Handles push notification registration and interaction.
- **`usePairing.ts`**: Manages pairing state, fetches current and historical pairings.
- **`useFeed.ts`**: Fetches and manages feed data with real-time updates.
- **`useChat.ts`**: Manages chat messages and real-time updates between paired users.

### Camera Components

- **`Camera.tsx`**: Component for capturing photos using `expo-camera`. Utilizes the `useCamera` hook. Provides UI for camera preview, capture button, and controls for switching camera type (front/back) and flash modes.
- **`CameraPreview.tsx`**: Component for displaying a captured image for review before submission. Allows the user to confirm (submit) or retake the photo. Also includes an option to mark the photo as private.

### Button Components

- **`PrimaryButton.tsx`**: Reusable primary button component with white background and black text, supporting icons and loading states.
- **`SecondaryButton.tsx`**: Reusable secondary button component with transparent background and white border/text, supporting icons and loading states.

### Chat Components

- **`MessageBubble.tsx`**: Component for rendering chat messages with different styles for sent vs received messages, including timestamp display.

### Authentication Flow

The authentication flow now includes:

1. **SignInScreen**: Allows users to sign in with their Stanford email addresses
   - Email validation to ensure only Stanford email addresses
   - Form validation for required fields
   - Password toggling for better UX
   - Links to SignUp and ForgotPassword screens
   - Test credentials display for development

2. **SignUpScreen**: Allows new users to create accounts
   - Email validation for Stanford emails
   - Username validation
   - Password validation with confirmation
   - Create account action that adds user to Firebase Auth and Firestore

3. **ForgotPasswordScreen**: Provides password reset functionality
   - Email validation for Stanford emails
   - Password reset request to Firebase Auth
   - Success confirmation with email instructions

The authentication flow is controlled by `AuthContext.tsx` which:
- Checks user authentication state on app launch
- Conditionally renders Auth screens or main app screens
- Manages authentication state throughout the app
- Provides auth-related methods (signIn, signUp, signOut, resetPassword)

### Onboarding Flow

The onboarding process follows a four-step flow with a clean black and white design:

1. **WelcomeScreen**: Introduces users to the BNOC concept with a prominent logo and key features.
2. **PermissionsScreen**: Requests necessary app permissions with clear explanations.
3. **ProfileSetupScreen**: Allows users to set up their profile with a display name and username.
4. **CompletionScreen**: Confirms successful setup with animated confirmation and directs users to the main app.

The onboarding experience includes:
- Consistent progress indicators showing users where they are in the flow
- Smooth horizontal transitions between screens
- Animations for interactive feedback
- Clear explanations and guidance at each step
- Accessible back/forward navigation

### Pairing and Chat Flow

The daily pairing and chat experience follows a streamlined flow:

1. **DailyPairingScreen**: Shows matched users with a random engaging header message and provides direct access to chat.
2. **ChatScreen**: Provides a minimalist black and white chat interface with:
   - Clickable partner name in header to view their profile
   - Camera icon to take daily selfie directly from chat
   - Dark message bubbles with different shades for sent vs received messages
   - Elegant text input area with send button

### Global Styles

- **`onboardingStyles.ts`**: Central stylesheet for the onboarding flow, ensuring consistent design
- **`theme.ts`**: Contains the app-wide black and white theme variables
- **`globalStyles.ts`**: Provides app-wide styling foundations
- **`colors.ts`**: Defines the black and white color palette used throughout the app

### Scripts

- **`populateFirebase.js`**: A Node.js script to populate Firebase Authentication and Firestore with sample users and pairings for testing.
- **`README.md`**: Documentation for the scripts in this directory, including setup and usage instructions.