# BNOC - Daily Photo Pairing App

A React Native app built with Firebase for daily photo pairings between friends.

## Recent Feature Updates

### 🤝 Auto-Pairing System (FIXED & ENHANCED)
Fully automated daily pairing system with robust error handling:

- **Daily Automated Pairing** - Runs at 5:00 AM PT daily via Cloud Functions
- **Smart User Filtering** - Active users with low flake streaks (< 5) and recent activity (< 3 days)
- **Duplicate Prevention** - Avoids recent repeat pairings using 7-day history
- **New User Auto-Pairing** - Instant pairing via Firestore triggers when users sign up
- **Fallback System** - Creates test accounts when no waitlisted users available
- **Authentication Fixed** - Resolved Firebase Functions authentication issues
- **Index Optimization** - Simplified queries to avoid complex Firebase index requirements
- **Data Integrity** - Automatic cleanup of corrupted pairing records
- **Real-time Monitoring** - Comprehensive logging and status checking tools

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
│   │   └── PairingInstructionsModal.tsx  # Instructional popup
│   └── ...
├── screens/
│   ├── Pairing/
│   │   └── CurrentPairingScreen.tsx      # Daily pairing interface
│   ├── Waiting/
│   │   └── WaitingScreen.tsx            # Real-time pairing status
│   ├── Feed/
│   │   └── FeedScreen.tsx               # Real-time feed updates
│   └── Camera/
│       └── CameraScreen.tsx             # Photo capture interface
├── context/
│   ├── PairingContext.tsx               # Pairing state management
│   ├── FeedContext.tsx                  # Feed state management
│   └── AuthContext.tsx                  # Authentication & auto-pairing
├── services/
│   ├── firebase.ts                      # Firebase configuration
│   └── autoPairingService.ts            # Auto-pairing client logic
├── functions/
│   └── src/
│       ├── index.ts                     # Daily pairing Cloud Functions
│       ├── autoPairNewUser.ts           # New user auto-pairing
│       └── autoPairTrigger.ts           # Firestore trigger pairing
├── docs/
│   ├── AUTO_PAIRING_FEATURE.md          # Auto-pairing system docs
│   ├── DEBUG_MAINTENANCE.md             # Debugging & maintenance guide
│   ├── REALTIME_FEATURES.md             # Real-time system documentation
│   └── FIREBASE.md                      # Firebase configuration guide
└── scripts/
    ├── checkStatus.js                   # Database health monitoring
    ├── manualPairing.js                 # Emergency pairing creation
    ├── deleteUser.js                    # User account management
    └── createTestAccounts.js            # Test account creation
```

## Contributing
Please ensure all new features include:
- Comprehensive error handling
- Real-time update support where applicable
- Proper TypeScript typing
- Console logging for debugging
- User-friendly fallback mechanisms
