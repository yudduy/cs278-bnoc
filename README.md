# BNOC React Native App

A React Native mobile application built with Expo that connects Stanford students through daily meetups, with a focus on fostering social interactions.

## Features

- **Modern Dark Theme Design**: Aesthetic dark interface with a masonry layout for the feed
- **Google Authentication**: Easy sign-in with Google accounts
- **Daily Meetup Pairing**: Users are paired for in-person or virtual meetups
- **Event Categories**: Different types of events like Run, Yoga, Workout, etc.
- **Social Feed**: View and interact with completed meetups from friends
- **User Profiles**: Track statistics like completed meetups and streaks

## Technology Stack

- React Native with Expo
- TypeScript
- Firebase (Authentication, Firestore, Storage)
- React Navigation for screen transitions
- Chivo font family for all typography

## Setup & Installation

1. Make sure you have Node.js and npm installed
2. Install Expo CLI: `npm install -g expo-cli`
3. Clone the repository
4. Install dependencies: `npm install`
5. Update Firebase configuration in `src/config/firebase.ts`
6. Update Google Web Client ID in `src/services/googleAuth.ts`
7. Run the app: `npm start`

## Project Structure

```
/bnoc-react/
├── App.tsx                # Main application entry point
├── app.json               # Expo configuration
├── assets/                # App images and assets
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── AppFonts.tsx   # Font loading component
│   │   ├── MasonryFeed.tsx # Two-column feed layout
│   │   └── MeetupCard.tsx # Card component for events
│   ├── config/            # Configuration files
│   │   ├── firebase.ts    # Firebase config
│   │   └── theme.ts       # Color scheme and theme
│   ├── context/           # React context providers
│   │   ├── AuthContext.tsx # Authentication state
│   │   └── PairingContext.tsx # Daily pairing logic
│   ├── navigation/        # Navigation configuration
│   │   └── AppNavigator.tsx # Screen navigation setup
│   ├── screens/           # App screens
│   │   ├── Auth/          # Authentication screens
│   │   ├── Camera/        # New event creation
│   │   ├── Feed/          # Social feed
│   │   └── Profile/       # User profile screens
│   ├── services/          # External service integrations
│   │   ├── firebase.ts    # Firebase methods
│   │   └── googleAuth.ts  # Google authentication
│   ├── styles/            # Shared styles
│   │   └── globalStyles.ts # Common style elements
│   ├── types/             # TypeScript interfaces
│   └── utils/             # Utility functions
```

## Design System

- **Colors**:
  - Primary: `#B1AA81` (Main brand color)
  - Secondary: `#7C7A5A` (Complementary color)
  - Background: `#1A1A1A` (Dark background)
  - Text: `#FFFFFF` (Primary text)

- **Typography**:
  - Chivo Regular and Bold fonts for all text
  - Consistent text sizes and weights throughout the app

## Authentication Flow

1. User opens the app and sees the authentication screen
2. User chooses to sign in with Google
3. New users are directed to the username selection screen
4. After authentication, users are taken to the main app interface

## Future Enhancements

- Game modes for different types of social interactions
- Integration with calendar for scheduling
- Group meetups for multiple users
- Additional social features like direct messaging

## License

MIT License