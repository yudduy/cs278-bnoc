# BNOC App Development Guide

This document serves as a development guide for the BNOC Daily Meetup Selfie app, tracking current progress, development standards, and next steps.

## Project Status

The BNOC app has several key components implemented:

✅ **Core Infrastructure**
- React Native with Expo setup
- TypeScript configuration
- Navigation structure
- Firebase integration

✅ **User Interface**
- Feed system with infinite scroll
- Comment UI for pairing interactions
- Profile screen with user stats
- FlakeStreak visualization
- Settings screens with preferences

✅ **Core Features**
- Camera capture with expo-camera
- Firebase Storage integration
- Pairing algorithm in Cloud Functions
- User profile management
- Blocked users functionality

## Development Priorities

### High Priority
1. **Authentication Flow**
   - Implement Google Sign-in with Stanford email validation
   - Build Sign-in and Sign-up screens
   - Create ForgotPassword functionality

2. **Pairing System UI**
   - Create UI to access active pairings
   - Build navigation to Camera Screen with pairingId
   - Test end-to-end photo capture and submission flow

3. **Camera System Testing**
   - Verify single camera capture, preview, and upload flow
   - Ensure consistent Firebase Storage integration
   - Test image handling performance

### Medium Priority
1. **Cloud Functions**
   - Implement notification dispatcher
   - Create scheduled reminders system
   - Set up Firebase triggers for real-time updates

2. **User Experience**
   - Enhance error handling with user-friendly messages
   - Add loading states for asynchronous operations
   - Implement pull-to-refresh and pagination

### Low Priority
1. **UI Polishing**
   - Add animations for transitions
   - Improve dark mode implementation
   - Enhance accessibility features

2. **Performance Optimization**
   - Optimize image uploads and handling
   - Implement caching for feed data
   - Improve app startup time

## Coding Standards

### TypeScript Usage
- Use TypeScript for all new code
- Define interfaces for all props and state
- Avoid using `any` type where possible
- Use union types for limited options

### Component Structure
- Use functional components with hooks
- Keep components focused on a single responsibility
- Extract reusable logic to custom hooks
- Document component props with JSDoc comments

```typescript
/**
 * Button component with consistent styling
 * 
 * @param {string} label - Button text
 * @param {() => void} onPress - Function to call when pressed
 * @param {'primary' | 'secondary'} variant - Button style variant
 */
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({ label, onPress, variant = 'primary', disabled = false }: ButtonProps) {
  // Component implementation
}
```

### File Organization
- Group related files by feature or module
- Use index.ts files for clean exports
- Place shared types in the types directory
- Keep component-specific types with the component

### State Management
- Use React Context for global state
- Implement custom hooks for state logic
- Keep component state minimal and focused
- Document state flow with comments

### Import Style
```typescript
// External libraries
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';

// Project imports (absolute paths)
import { COLORS } from '~/config';
import { useAuth } from '~/hooks';
import { Button } from '~/components/ui';
import type { User } from '~/types';

// Relative imports (for closely related files)
import { styles } from './styles';
```

## Test Data Setup

For development and testing, you can populate your Firebase environment with test data:

1. Review the test users in the FIREBASE.md document
2. Use the provided script to set up the test environment:

```bash
# Navigate to the scripts directory
cd scripts

# Install dependencies if needed
npm install

# Run the setup script
node setupFirebaseTestData.js
```

This will create test users, pairings, and feed entries to allow local development without manual data creation.

## Troubleshooting Common Issues

### Firebase Connectivity
- Verify your `.env` file has the correct Firebase configuration
- Check that you've enabled the required Firebase services
- Ensure Firebase security rules allow your operations

### Build Issues
- Clear the Expo cache: `expo r -c`
- Verify node_modules is properly installed: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npx tsc --noEmit`

### Camera Functionality
- Ensure proper permissions are requested
- Test on physical devices (simulators have limited camera support)
- Verify the correct paths for image storage

## Pull Request Guidelines

1. **Branch Naming**: Use descriptive names: `feature/auth-flow`, `bugfix/camera-crash`, etc.
2. **PR Description**: Include:
   - The problem solved
   - Changes made
   - Testing performed
   - Screenshots (for UI changes)
3. **Code Quality**:
   - No TypeScript errors
   - Consistent code style
   - No console.log statements (use logger)
   - No commented code

## Next Steps and Roadmap

### Short Term (1-2 Weeks)
- Complete Google authentication with Stanford email validation
- Finalize the camera capture and submission flow
- Implement notification system integration

### Medium Term (2-4 Weeks)
- Complete social features (likes, comments)
- Enhance profile screen with history display
- Improve error handling and offline experience

### Long Term (1-2 Months)
- Add analytics for user engagement
- Implement feature flags for gradual rollout
- Performance optimization for production

## Getting Help

- Check the ARCHITECTURE.md file for design decisions
- Review the FIREBASE.md file for backend details
- Consult the project-structure.md for code organization
- For other questions, contact the project maintainer
