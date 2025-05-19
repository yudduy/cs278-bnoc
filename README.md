# BNOC - Daily Meetup Selfie App

A React Native mobile application built with Expo that connects Stanford students through daily meetups, with a focus on fostering social interactions through selfies.

## 📱 Features

- **Daily Pairing System**: Get paired with a new Stanford student each day
- **Selfie Exchange**: Take and share selfies to complete your daily pairing
- **Social Feed**: View a feed of completed pairings from the community
- **User Profiles**: Track statistics like completed meetups and flake streaks
- **Notification System**: Receive reminders about your daily pairings
- **Privacy Controls**: Choose which pairings to share publicly

## 🛠️ Technology Stack

- **Frontend**: React Native with Expo
- **Language**: TypeScript
- **State Management**: React Context API
- **Backend**: Firebase (Authentication, Firestore, Storage, Cloud Functions)
- **Navigation**: React Navigation v6
- **UI**: Custom components with a dark theme

## 📋 Documentation

The project includes comprehensive documentation:

- [**Architecture Guide**](./doc/ARCHITECTURE.md) - Overview of system design, patterns, and data flow
- [**Development Guide**](./doc/DEVELOPMENT.md) - Current status, coding standards, and next steps
- [**Firebase Guide**](./doc/FIREBASE.md) - Database schema, security rules, and Cloud Functions
- [**Project Structure**](./doc/project-structure.md) - Detailed directory structure and file purpose

## 🚀 Setup & Installation

### Prerequisites

- Node.js (v16+) and npm
- Expo CLI: `npm install -g expo-cli`
- Firebase account and project

### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/bnoc.git
   cd bnoc
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Firebase configuration:
   ```
   FIREBASE_API_KEY=your_api_key
   FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id
   GOOGLE_WEB_CLIENT_ID=your_google_client_id
   ```

4. Set up Firebase:
   - Create a project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication with Google sign-in
   - Create a Firestore database
   - Set up Firebase Storage
   - Deploy the Cloud Functions (see below)

5. Start the development server:
   ```bash
   npm start
   ```

6. Scan the QR code with the Expo Go app on your mobile device.

### Setting up Firebase Cloud Functions

1. Navigate to the functions directory:
   ```bash
   cd functions
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Deploy the functions:
   ```bash
   firebase deploy --only functions
   ```

## 🧪 Test Data Setup

For development, you can populate your Firebase with test data:

1. Navigate to the scripts directory:
   ```bash
   cd scripts
   ```

2. Run the setup script:
   ```bash
   node setupFirebaseTestData.js
   ```

This will create test users, pairings, and feed entries in your Firebase project.

## 📱 App Structure

The app follows a layered architecture:

1. **Presentation Layer**: Screens and UI components
2. **Business Logic Layer**: Contexts, hooks, and service interfaces
3. **Data Access Layer**: Firebase services and local storage

Key components include:

- **Context Providers**: `AuthContext`, `PairingContext`, `NotificationContext`
- **Custom Hooks**: `useAuth`, `usePairing`, `useCamera`, `useFeed`
- **Firebase Services**: Authentication, Firestore, Storage, Cloud Functions

## 🛣️ App Flow

1. **Authentication**: Users sign in with their Stanford email
2. **Daily Pairing**: At 5am PT, users are paired with a new person
3. **Selfie Exchange**: Each user takes a selfie to complete the pairing
4. **Feed Updates**: Completed pairings appear in user and global feeds
5. **Social Interaction**: Users can like and comment on pairings

## 👥 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

See [DEVELOPMENT.md](./doc/DEVELOPMENT.md) for coding standards and guidelines.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Stanford GSB for the original concept
- All contributors to the project
