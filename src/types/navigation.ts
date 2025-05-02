/**
 * Navigation Types
 * 
 * Type definitions for navigation-related data.
 */

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
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
  };
  Camera: { 
    pairingId?: string;
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