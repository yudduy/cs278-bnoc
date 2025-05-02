# Daily Meetup Selfie App - Project Structure

This document outlines the final project directory structure after implementing all phases of the Daily Meetup Selfie app. Each folder and key file is described with its purpose.

## Root Directory

```
/bnoc-react
├── .expo/                      # Expo configuration files
├── .github/                    # GitHub workflows and issue templates
│   └── workflows/              # CI/CD configuration
├── assets/                     # Static assets like images, fonts, etc.
│   ├── fonts/                  # App fonts
│   ├── icons/                  # App icons
│   └── images/                 # Static images used in the app
├── doc/                        # Project documentation
│   ├── product_requirements.md # Product requirements document
│   ├── phase1.md              # Phase 1 implementation details
│   ├── phase2.md              # Phase 2 implementation details
│   ├── phase3.md              # Phase 3 implementation details
│   ├── phase4.md              # Phase 4 implementation details
│   └── project-structure.md    # This document
├── firebase/                   # Firebase configuration and Cloud Functions
│   ├── functions/              # Cloud Functions code
│   │   ├── src/                # Source code for Cloud Functions
│   │   │   ├── pairing/        # Pairing algorithm functions
│   │   │   ├── notifications/  # Notification handling functions
│   │   │   └── storage/        # Image storage and processing functions
│   │   └── package.json        # Node.js dependencies for Cloud Functions
│   └── firestore.rules         # Firestore security rules
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
│   │   ├── camera/             # Camera components
│   │   │   ├── DualCameraCapture.tsx
│   │   │   └── CameraControls.tsx
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
│   │   ├── firebase.ts         # Firebase configuration
│   │   ├── colors.ts           # Color constants
│   │   ├── constants.ts        # App constants
│   │   └── env.ts              # Environment configuration
│   ├── context/                # React Context providers
│   │   ├── AuthContext.tsx     # Authentication context
│   │   ├── PairingContext.tsx  # Pairing management context
│   │   ├── NotificationContext.tsx # Notification context
│   │   └── SettingsContext.tsx # App settings context
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts          # Authentication hook
│   │   ├── usePairing.ts       # Pairing hook
│   │   ├── useCamera.ts        # Camera access hook
│   │   ├── useFeed.ts          # Feed data hook
│   │   ├── usePermissions.ts   # Permission handling hook
│   │   └── useNotifications.ts # Notification hook
│   ├── navigation/             # Navigation configuration
│   │   ├── AuthNavigator.tsx   # Auth flow navigation
│   │   ├── MainNavigator.tsx   # Main app navigation
│   │   ├── OnboardingNavigator.tsx # Onboarding flow
│   │   ├── ProfileNavigator.tsx # Profile navigation
│   │   └── NavigationService.ts # Navigation utilities
│   ├── screens/                # App screens
│   │   ├── Auth/               # Authentication screens
│   │   │   ├── AuthScreen.tsx  # Main authentication screen
│   │   │   ├── ForgotPasswordScreen.tsx
│   │   │   └── AuthStyles.ts   # Styles for auth screens
│   │   ├── Camera/             # Camera screens
│   │   │   ├── CameraScreen.tsx # Dual-camera capture screen
│   │   │   ├── PreviewScreen.tsx # Image preview screen
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
│   │   ├── firebase.ts         # Firebase service methods
│   │   ├── authService.ts      # Authentication service
│   │   ├── cameraService.ts    # Camera service
│   │   ├── notificationService.ts # Notification service
│   │   ├── storageService.ts   # Storage service
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
│       ├── date.ts             # Date formatting utilities
│       ├── validation.ts       # Input validation utilities
│       ├── logger.ts           # Logging utilities
│       ├── permissions.ts      # Permission management utilities
│       ├── imageProcessing.ts  # Image processing utilities
│       └── storage.ts          # Local storage utilities
├── App.tsx                     # Main App component
├── app.json                    # Expo configuration
├── babel.config.js             # Babel configuration
├── package.json                # NPM dependencies
├── tsconfig.json               # TypeScript configuration
├── jest.config.js              # Jest configuration for testing
├── README.md                   # Project README
└── setup.sh                    # Development environment setup script
```

## Key Files and Their Purpose

### Firebase Cloud Functions

- **pairingAlgorithm.ts**: Implements the daily pairing algorithm that matches users, avoiding recent repeats and respecting user preferences.
- **notificationDispatcher.ts**: Handles sending push notifications for new pairings, reminders, and social interactions.
- **imageProcessor.ts**: Processes uploaded selfies, including resizing, optimizing, and generating combined images.

### Core Services

- **firebase.ts**: Central Firebase service with methods for data access and modification, including authentication, Firestore operations, and storage handling.
- **authService.ts**: Handles user authentication flows, including email/password, Google, and Apple sign-in with Stanford email validation.
- **notificationService.ts**: Manages push notification registration, permission handling, and notification preferences.

### Context Providers

- **AuthContext.tsx**: Provides authentication state and methods throughout the app, including user data and auth status.
- **PairingContext.tsx**: Manages the current user's pairing state, history, and related actions like completing pairings and social interactions.
- **NotificationContext.tsx**: Handles in-app notifications and push notification permissions.

### Key Components

- **DualCameraCapture.tsx**: Implements the simultaneous front and back camera capture functionality with fallback for unsupported devices.
- **PairingCard.tsx**: Displays a pairing in the feed with user avatars, selfie, likes, and comments.
- **FlakeStreakDisplay.tsx**: Visualizes the user's current flake streak with animations and contextual messages.

### Main Screens

- **AuthScreen.tsx**: Provides sign-in and sign-up functionality with Stanford email validation.
- **FeedScreen.tsx**: Displays the main feed of completed pairings with infinite scroll and pull-to-refresh.
- **CameraScreen.tsx**: Implements the dual-camera capture interface with timer countdown and preview.
- **ProfileScreen.tsx**: Shows user profile with stats, streak visualization, and pairing history.
- **SettingsScreen.tsx**: Provides user configurable options including notification preferences and privacy controls.

### Type Definitions

- **user.ts**: Defines the User interface and related types for user data.
- **pairing.ts**: Defines the Pairing interface and related types for pairing data.
- **notification.ts**: Defines notification settings and types for push notifications.

## Important Changes from Initial Structure

1. **Rename MeetupContext to PairingContext**: Aligns with the new terminology for daily pairings.
2. **Add Dual Camera Support**: Integrate react-native-vision-camera for simultaneous front/back camera capture.
3. **Enhanced User Model**: Add fields for flake streak tracking, notification settings, and blocked users.
4. **Expanded Component Organization**: Create more specialized component directories for better organization.
5. **Cloud Functions**: Add Firebase Cloud Functions for pairing algorithm and notifications.
6. **Optimized Feed System**: Implement denormalized data structure for better performance.
7. **Enhanced Type System**: Split types into domain-specific files for better organization.
8. **Testing Framework**: Add Jest configuration and test directories.
