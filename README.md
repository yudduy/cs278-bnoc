# BNOC - Daily Photo Pairing App

A React Native app built with Firebase for daily photo pairings between friends.

## Recent Feature Updates

-### 🤝 Auto-Pairing System
New users are automatically paired to ensure immediate app usability:

- **Instant pairing** - New users are paired with a waitlisted user when available, otherwise a test account is created automatically
- **Zero waiting time** - No need to wait for other users to join
- **Smart fallback system** - Creates test accounts automatically when needed
- **Server driven** - Auto-pairing logic runs in a Cloud Function
- **Development friendly** - Consistent test accounts with known credentials
- **Seamless integration** - Works during both sign-up and login flows
- **Enhanced debugging** - Comprehensive logging with emoji indicators for easy troubleshooting
- **Default avatars** - All test accounts get a consistent default photo URL

### 🎯 Together Mode Only Implementation
The app has been updated to focus exclusively on collaborative photo sharing:

- **Removed individual photo mode** - All pairing interactions now use "together" mode
- **Instructional popup system** - Clear 4-step guidance before photo capture
- **Automatic navigation flow** - Seamless progression from instructions → camera → waiting → feed
- **Real-time feed updates** - Instant feed refresh when pairings complete
- **Enhanced waiting experience** - Real-time partner status with automatic redirect

### 📱 User Flow

#### Daily Pairing Process
1. **Instructions Modal**: Shows 4-step process:
   - You take a picture
   - They take a picture  
   - You both submit
   - Won't show on feed until both submit
   - Must complete before 10 PM

2. **Photo Capture**: 
   - Always uses "together" mode
   - Automatic navigation to waiting screen after upload

3. **Waiting Screen**:
   - Real-time monitoring of partner's submission status
   - Automatic redirect to feed when both photos submitted
   - Chat functionality with partner

4. **Feed Integration**:
   - Real-time listener for immediate updates
   - Pull-to-refresh functionality
   - Automatic scroll to new pairing when completed

### 🔧 Technical Implementation

-#### Auto-Pairing System
- **Smart pairing logic** - Pairs with a waitlisted user first and falls back to automatic test account creation
- **Automatic test accounts** - Creates test_1, test_2, etc. with password123
- **Integrated flows** - Triggers during sign-up and login for users without pairings
- **Non-blocking design** - Never prevents successful authentication
- **Firebase Auth integration** - Seamlessly creates test users in Firebase

#### Real-Time Features
- **Firebase Firestore listeners** using `onSnapshot` for live updates
- **Automatic state synchronization** across all app screens
- **Fallback mechanisms** for network issues or listener failures
- **Toggle option** between real-time and manual refresh modes

#### Navigation Flow
```
CurrentPairingScreen 
  → PairingInstructionsModal 
  → CameraScreen 
  → WaitingScreen 
  → FeedScreen (auto-redirect)
```

#### Key Components Modified
- `CurrentPairingScreen.tsx` - Removed mode selection, added instructions
- `PairingInstructionsModal.tsx` - New component with step-by-step guidance
- `CameraScreen.tsx` - Always uses together mode, redirects to waiting
- `WaitingScreen.tsx` - Real-time pairing completion detection
- `FeedScreen.tsx` - Real-time feed updates with toggle option

### 🎨 UI/UX Improvements
- **Unified experience** - No mode confusion, clear expectations
- **Better onboarding** - Step-by-step instructions before photo capture
- **Visual feedback** - Real-time status indicators and progress updates
- **Automatic transitions** - Reduced manual navigation, smoother flow

### 🛠️ Developer Features
- **Debug logging** - Comprehensive console output for monitoring
- **Error handling** - Graceful fallbacks for all network operations
- **Performance optimization** - Efficient real-time listener management
- **Clean architecture** - Separation of concerns with proper cleanup

## Installation & Setup

```bash
# Install dependencies
npm install

# iOS setup
cd ios && pod install && cd ..

# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Firebase Configuration
Ensure your Firebase project has:
- Firestore Database with proper security rules
- Storage for photo uploads
- Authentication enabled
- Real-time database features activated

## Project Structure
```
src/
├── components/
│   ├── modals/
│   │   └── PairingInstructionsModal.tsx  # New instructional popup
│   └── ...
├── screens/
│   ├── Pairing/
│   │   └── CurrentPairingScreen.tsx      # Updated with new flow
│   ├── Waiting/
│   │   └── WaitingScreen.tsx            # Enhanced with real-time
│   ├── Feed/
│   │   └── FeedScreen.tsx               # Real-time updates + toggle
│   └── Camera/
│       └── CameraScreen.tsx             # Simplified mode handling
├── context/
│   ├── PairingContext.tsx               # Pairing state management
│   └── FeedContext.tsx                  # Feed state management
├── services/
│   ├── firebase.ts                      # Firebase service layer
│   └── autoPairingService.ts            # Auto-pairing logic
├── docs/
│   └── AUTO_PAIRING_FEATURE.md          # Auto-pairing documentation
└── scripts/
    ├── createTestAccounts.js            # Manual test account creation
    └── testAutoPairing.js               # Debug auto-pairing functionality
```

## Contributing
Please ensure all new features include:
- Comprehensive error handling
- Real-time update support where applicable
- Proper TypeScript typing
- Console logging for debugging
- User-friendly fallback mechanisms
