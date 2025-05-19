/**
 * Route Types
 * 
 * Type definitions for route parameters to fix type errors in navigation.
 */

import { RouteProp } from '@react-navigation/native';
import { MainStackParamList, FeedStackParamList, CameraStackParamList } from './navigation';

// Types for MainStack routes
export type MainStackScreenProps<T extends keyof MainStackParamList> = {
  route: RouteProp<MainStackParamList, T>;
};

// Types for FeedStack routes
export type FeedStackScreenProps<T extends keyof FeedStackParamList> = {
  route: RouteProp<FeedStackParamList, T>;
};

// Types for CameraStack routes
export type CameraStackScreenProps<T extends keyof CameraStackParamList> = {
  route: RouteProp<CameraStackParamList, T>;
};

// Declare module augmentation for useRoute hook
declare module '@react-navigation/native' {
  export function useRoute<T extends keyof MainStackParamList>(): RouteProp<MainStackParamList, T>;
  export function useRoute<T extends keyof FeedStackParamList>(): RouteProp<FeedStackParamList, T>;
  export function useRoute<T extends keyof CameraStackParamList>(): RouteProp<CameraStackParamList, T>;
} 