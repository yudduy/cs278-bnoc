# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BNOC (Daily Meetup Selfie) is a React Native mobile application built with Expo that connects Stanford students through daily meetups, with a focus on fostering social interactions. The app pairs users daily, provides a temporary chat for coordination, and requires each user to submit a photo. The photos are then displayed side-by-side in their mutual connections' feeds.

## Key Commands

### Development
```
# Install dependencies
npm install

# Start the development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android simulator
npm run android

# Deploy Firebase Functions
cd firebase/functions
npm install
firebase deploy --only functions
```

## Architecture

The application follows a layered architecture:

1. **UI Layer (React Native)**
   - Screens (full pages)
   - Components (reusable UI elements)
   - Navigation (routing between screens)

2. **Business Logic Layer**
   - Contexts (global state management)
   - Hooks (reusable logic)
   - Service Interfaces (API for backend)

3. **Data Access Layer**
   - Firebase Services (Firestore, Auth, Storage)
   - Cloud Functions (server-side logic)

## Core Features

1. **Daily User Pairing**
   - Backend pairs eligible users daily at 5:00 AM PT
   - Paired users receive notifications at 7:00 AM PT

2. **Temporary Chat**
   - 1:1 chat for paired users to coordinate
   - Accessible until the pairing expires (10:00 PM PT)

3. **Photo Submission**
   - Each user must submit one photo by the deadline
   - Photos are displayed side-by-side in the feed when both are submitted

4. **Flake Streak**
   - If both photos aren't submitted by deadline, both users' flake streaks increment
   - Visible on user profiles as an accountability mechanism

5. **Social Feed**
   - View completed pairings from connections
   - Like and comment on posts

## Data Model

The Firebase Firestore database has these key collections:

1. **users**: User profiles and account information
2. **pairings**: Daily pairings between users
3. **globalFeed**: Denormalized collection of public pairings
4. **pairingHistory**: User pairing history
5. **system**: System settings and operational data
6. **chats**: Chat messages between paired users

## Key Files and Components

- **src/config/firebase.ts**: Firebase configuration
- **src/context/AuthContext.tsx**: Authentication state management
- **src/context/PairingContext.tsx**: Daily pairing logic
- **src/context/ChatContext.tsx**: Chat functionality
- **firebase/functions/src/pairing/pairUsers.ts**: Backend pairing algorithm
- **firebase/functions/src/notifications/**: Notification triggers

## State Management

The app uses React Context API for state management:
- **AuthContext**: User authentication state
- **PairingContext**: Daily pairing state
- **FeedContext**: Feed data
- **NotificationContext**: Notification handling
- **ChatContext**: Chat messaging

## Styling

The app uses a "Stanford Grove" theme (dark green and beige) with a consistent color scheme defined in **src/config/colors.ts**:
- Primary: #B1AA81 (Main brand color)
- Secondary: #7C7A5A (Complementary color)
- Background: #1A1A1A (Dark background)
- Text: #FFFFFF (Primary text)

## Environment Variables

Required environment variables (stored in .env file):
- FIREBASE_API_KEY
- FIREBASE_AUTH_DOMAIN
- FIREBASE_PROJECT_ID
- FIREBASE_STORAGE_BUCKET
- FIREBASE_MESSAGING_SENDER_ID
- FIREBASE_APP_ID
- GOOGLE_WEB_CLIENT_ID

## Important Workflows

### Pairing Process
1. Cloud Function runs daily at 5:00 AM PT
2. Matches active users based on algorithm
3. Creates pairing documents in Firestore
4. Sends notifications at 7:00 AM PT

### Photo Submission
1. User takes a photo using the app's camera
2. Photo is uploaded to Firebase Storage
3. Pairing document is updated with photo URL
4. When both users submit photos, pairing is marked complete

### Flake Handling
1. Scheduled Cloud Function runs at 10:05 PM PT
2. Marks incomplete pairings as "flaked"
3. Increments flake streaks for both users