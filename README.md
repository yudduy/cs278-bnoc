# BNOC for CS278 

A React Native app I built using Firebase for daily photo pairings between friends. This has been one of those projects where I kept running into problems and had to figure things out as I went along.

## What I've Been Working On Recently

### Auto-Pairing System (Finally Got This Working)
Spent way too much time debugging this but finally have a solid automated daily pairing system:

The whole thing runs at 5AM PT every day through Cloud Functions. I had to build in smart user filtering so it only pairs active users who haven't been flaking too much (less than 5 missed submissions) and have been active recently. One of the biggest headaches was preventing duplicate pairings - nobody wants to get paired with the same person every day, so I built a 7-day history check.

What's cool is that new users get automatically paired the moment they sign up through Firestore triggers. If there's nobody in the waitlist, the system creates test accounts automatically so new users always have someone to pair with. Had major authentication issues with Firebase Functions that took forever to resolve, but it's solid now.

I also had to simplify the database queries because Firebase's indexing requirements were getting ridiculous. Added comprehensive logging so I can actually see what's happening when things break.

### Moving to Together Mode Only
This was a big decision but I think it makes the app much better. I removed the individual photo mode entirely - everything is collaborative now.

Before users take photos, there's this instructional popup that walks them through the 4-step process. It's pretty straightforward: you take a picture, they take a picture, you both submit, and it won't show up on the feed until both people submit. Everything has to be done before 10PM which creates this nice sense of urgency.

The flow is super smooth now - instructions show up, then camera, then a waiting screen, then automatically to the feed when your pairing is complete. The waiting screen shows your partner's status in real-time which is actually pretty satisfying to watch.

### How Everything Works

Daily Pairing Process:
First thing users see is the instructions modal explaining the whole process. Then they go straight to photo capture (always in together mode now), and after uploading they land on the waiting screen. This shows real-time updates of whether their partner has submitted yet, and once both photos are in, it automatically redirects to the feed.

The waiting screen also has chat functionality which has been great for keeping people engaged while they wait for their partner.

Technical Stuff:
The auto-pairing logic tries to match with someone from the waitlist first, then falls back to creating test accounts if needed. I set up automatic test account creation (test_1, test_2, etc.) with default passwords. The whole system triggers during both sign-up and login for users who don't have current pairings.

Everything runs on Firebase Firestore listeners using onSnapshot for live updates, which means the app stays synced across all screens without users having to refresh. I built in fallback mechanisms for when network issues happen or listeners fail.

The navigation flow goes: CurrentPairingScreen → PairingInstructionsModal → CameraScreen → WaitingScreen → FeedScreen (auto-redirect). Pretty clean once you get used to it.

Main components I modified:
- CurrentPairingScreen.tsx - removed the mode selection, added instructions
- PairingInstructionsModal.tsx - completely new component with step-by-step guidance  
- CameraScreen.tsx - always uses together mode now, automatically redirects to waiting
- WaitingScreen.tsx - has real-time pairing completion detection
- FeedScreen.tsx - real-time feed updates with a toggle option

### User Experience Improvements
The unified experience eliminates confusion about which mode to use. The step-by-step instructions before photo capture help a lot with onboarding. I added visual feedback with real-time status indicators, and automatic transitions mean users don't have to think about navigation as much.

For developers, I added comprehensive debug logging, graceful error handling for network operations, and efficient real-time listener management. The architecture is cleaner now with proper separation of concerns.

## Getting Started

```bash
# Install dependecies
npm install

# iOS setup
cd ios && pod install && cd ..

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android  
npm run android
```

## Firebase Setup
Your Firebase project needs Firestore Database with proper security rules, Storage for photo uploads, Authentication enabled, and real-time database features. 

Configuration values like API key and project ID load from environment variables. Create a .env file or set these variables:

```
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
EXPO_PUBLIC_FIREBASE_DATABASE_URL
TEST_ACCOUNT_PASSWORD
ADMIN_TEST_PASSWORD
```

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
│   ├── FeedContext.tsx                  # Feed state managment
│   └── AuthContext.tsx                  # Authentication & auto-pairing
├── services/
│   ├── firebase.ts                      # Firebase configuration
│   └── autoPairingService.ts            # Auto-pairing client logic
├── functions/
│   └── src/
│       ├── index.ts                     # Daily pairing Cloud Functions
│       ├── autoPairNewUser.ts           # New user auto-pairing
│       └── autoPairTrigger.ts           # Firestore trigger pairing
```

## Contributing
If you're adding new features, please include comprehensive error handling, real-time update support where it makes sense, proper TypeScript typing, console logging for debugging, and user-friendly fallback mechanisms. I've learned the hard way that these things save so much time later. Thanks!
