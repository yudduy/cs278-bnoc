/**
 * Navigation Types
 * 
 * Type definitions for navigation-related data.
 */

import { NavigatorScreenParams } from '@react-navigation/native'; // Import NavigatorScreenParams

export type MainStackParamList = {
  // MODIFIED: Define params for TabNavigator to accept screen and params for MainTabParamList
  TabNavigator: NavigatorScreenParams<MainTabParamList>; 
  Camera: { 
    pairingId?: string; 
    userId?: string; 
    submissionType?: 'pairing' | 'profile' | 'other'; // Added submissionType
  };
  PhotoPreview: {
    frontImage: string;
    backImage: string;
    pairingId?: string;
  };
  PairingDetail: { pairingId: string };
  Pairing: undefined;
  Chat: { chatId: string; pairingId?: string };
  FindFriends: undefined;
  Settings: undefined;
  BlockedUsers: undefined;
  ViewSelfies: { pairingId?: string };
  DailyPairing: undefined;
  EditProfile: undefined;
  Notifications: undefined;
  Privacy: undefined;
  Help: undefined;
  About: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined; // This likely navigates to MainStackParamList or MainTabParamList
  Onboarding: undefined;
  Camera: { 
    pairingId?: string; 
    userId?: string; 
    submissionType?: 'pairing' | 'profile' | 'other';
  };
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

export type MainTabParamList = {
  Feed: {
    scrollToPairingId?: string;
    refresh?: boolean; // Added refresh param
  };
  Camera: { 
    pairingId?: string;
    userId?: string; 
    submissionType?: 'pairing' | 'profile' | 'other'; // Added submissionType
  };
  Profile: { 
    userId?: string;
  };
};

export type FeedStackParamList = {
  FeedScreen: {
    scrollToPairingId?: string;
  };
  PairingDetail: { 
    pairingId: string;
  };
  UserProfile: {
    userId: string;
  };
};

export type CameraStackParamList = {
  CameraScreen: {
    pairingId?: string;
  };
  PreviewScreen: {
    frontImage: string;
    backImage: string;
    pairingId?: string;
  };
  WaitingScreen: {
    pairingId: string;
  };
};

export type ProfileStackParamList = {
  ProfileScreen: {
    userId?: string;
  };
  EditProfile: undefined;
  Settings: undefined;
  NotificationSettings: undefined;
  PrivacySettings: undefined;
  BlockedUsers: undefined;
  Help: undefined;
  About: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  Permissions: undefined;
  Username: undefined;
  ProfileSetup: undefined;
  Completion: undefined;
};

export type PairingStackParamList = {
  CurrentPairing: undefined;
  DailyPairing: undefined;
};