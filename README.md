# BNOC - Daily Meetup Selfies

A React Native app for Stanford students to connect through daily paired photo challenges. Built with TypeScript, Firebase, and modern mobile development practices.

## 🌟 Features

### Core Functionality
- **Daily Pairings**: Get matched with another Stanford student each day
- **Photo Challenges**: Take and share selfies with your daily partner
- **Real-time Sync**: Live updates when partners submit photos
- **Social Feed**: View completed pairings from the community
- **Chat Integration**: Communicate with your daily partner

### Planner Mode
- **First-User Choice**: The first user to open the app chooses photo mode
- **Individual vs Together**: Choose to meet up or take separate photos
- **Smart Notifications**: Partner sees the chosen mode with clear instructions

### Technical Features
- **Duplicate Prevention**: Robust checks to prevent multiple photo submissions
- **Real-time Updates**: Firebase listeners for instant feed and pairing updates
- **Toast Notifications**: User-friendly feedback system
- **Accessibility**: Full accessibility support with screen reader compatibility
- **Type Safety**: Comprehensive TypeScript implementation

## 🏗️ Architecture

### Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── camera/          # Camera and photo preview components
│   ├── feed/            # Feed-related components
│   ├── modals/          # Modal components (consolidated)
│   ├── notifications/   # Toast and notification components
│   └── profile/         # Profile-related components
├── context/             # React Context providers
│   ├── AuthContext.tsx  # Authentication state management
│   ├── FeedContext.tsx  # Feed data with real-time updates
│   ├── PairingContext.tsx # Pairing management with live sync
│   └── ToastContext.tsx # Global toast notifications
├── screens/             # Screen components
│   ├── Auth/           # Authentication screens
│   ├── Camera/         # Camera and photo preview screens
│   ├── Feed/           # Feed display screens
│   ├── Pairing/        # Daily pairing screens
│   └── Profile/        # Profile and settings screens
├── services/            # External service integrations
│   ├── authService.ts   # Authentication with duplicate prevention
│   ├── firebase.ts      # Firebase service facade
│   ├── pairingService.ts # Pairing operations
│   └── feedService.ts   # Feed management
├── navigation/          # Navigation configuration
├── config/             # App configuration
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### Key Components

#### PhotoModeSelectionModal
**Location**: `src/components/modals/PhotoModeSelectionModal.tsx`

Enhanced modal component supporting both regular photo mode selection and planner mode functionality.

**Features**:
- Dynamic content based on `isPlannerMode` prop
- Accessibility support with proper labels and hints
- Input validation and error handling
- Customizable titles and descriptions

**Usage**:
```tsx
<PhotoModeSelectionModal
  visible={showModal}
  onSelectMode={handleModeSelection}
  onCancel={handleCancel}
  partnerName="John Doe"
  isPlannerMode={!photoModeStatus.hasChoice}
  accessibilityLabel="Photo mode selection modal"
/>
```

#### PhotoPreviewScreen
**Location**: `src/screens/Camera/PhotoPreviewScreen.tsx`

Enhanced photo preview with comprehensive duplicate prevention.

**Features**:
- Submission attempt tracking with unique keys
- Validation of existing submissions
- User-friendly error messages
- Progress state management
- Accessibility support

#### PairingContext
**Location**: `src/context/PairingContext.tsx`

Real-time pairing management with Firebase listeners.

**Features**:
- Live pairing status updates
- Photo mode management for planner mode
- Automatic status detection
- Partner information caching

## 🛡️ Duplicate Prevention

### Photo Submission Prevention
The app implements multiple layers of duplicate prevention:

1. **Submission Key Tracking**: Unique keys prevent exact duplicate submissions
2. **Status Checking**: Validates if user has already submitted for current pairing
3. **Progress State**: Prevents multiple simultaneous submissions
4. **Firebase Validation**: Server-side checks for existing submissions

### Authentication Duplicates
- Email and username availability checking
- Real-time validation during registration
- Cleanup scripts for existing duplicates

### Modal Component Consolidation
- Removed duplicate `PlannerModeModal` component
- Enhanced `PhotoModeSelectionModal` to handle all use cases
- Improved reusability and maintainability

## 🔧 Development

### Prerequisites
- Node.js 18+
- React Native CLI
- Expo CLI
- iOS Simulator / Android Emulator

### Setup
```bash
# Install dependencies
npm install

# iOS setup
cd ios && pod install && cd ..

# Start development server
npx expo start

# Run on iOS
npx expo run:ios

# Run on Android
npx expo run:android
```

### Environment Configuration
Create `.env` file:
```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase config
```

### Code Quality
- **TypeScript**: Strict mode enabled for type safety
- **ESLint**: Configured for React Native and TypeScript
- **Prettier**: Code formatting
- **Accessibility**: Comprehensive a11y support

## 🔥 Firebase Services

### Authentication
- Stanford email validation (@stanford.edu)
- Username uniqueness checking
- Secure user registration and login

### Firestore Collections
- `users`: User profiles and settings
- `pairings`: Daily pairing data with real-time updates
- `notifications`: Push notification management
- `feed`: Denormalized feed data for performance

### Real-time Updates
- Pairing status changes
- Feed updates when photos are submitted
- Partner activity notifications

## 🚀 Recent Improvements

### Duplicate Prevention System
- ✅ Consolidated duplicate modal components
- ✅ Added comprehensive photo submission prevention
- ✅ Enhanced error handling and user feedback
- ✅ Implemented real-time validation

### Code Quality Enhancements
- ✅ Fixed TypeScript linter errors
- ✅ Improved component reusability
- ✅ Enhanced accessibility support
- ✅ Better error boundary handling

### Performance Optimizations
- ✅ Real-time Firebase listeners for instant updates
- ✅ Efficient feed pagination
- ✅ Optimized component re-renders
- ✅ Memory leak prevention

## 🤝 Contributing

### Pull Request Process
1. Create feature branch from `main`
2. Implement changes with comprehensive tests
3. Update documentation for any API changes
4. Ensure all TypeScript checks pass
5. Test on both iOS and Android platforms

### Code Standards
- Use TypeScript strict mode
- Follow React Native best practices
- Implement accessibility features
- Add comprehensive error handling
- Include unit tests for critical functionality

### Reporting Issues
- Use GitHub Issues with detailed reproduction steps
- Include device/OS information
- Provide relevant logs and screenshots

## 📱 Platform Support

- **iOS**: 13.0+
- **Android**: API 23+ (Android 6.0)
- **Expo**: SDK 49+
- **React Native**: 0.72+

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For technical issues or questions:
- Create a GitHub Issue
- Check existing documentation
- Review Firebase console for service status

---

**Built with ❤️ for the Stanford community**
