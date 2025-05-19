/**
 * App Colors
 * 
 * Centralized color definitions for the Daily Meetup Selfie app.
 * Black and white theme for the BeReal-inspired UI.
 */

export const COLORS = {
  // Brand colors
  primary: '#FFFFFF', // White as primary color
  primaryLight: '#F5F5F5',
  primaryDark: '#E0E0E0',
  
  // Secondary color 
  secondary: '#333333', // Dark gray as secondary
  secondaryLight: '#555555',
  secondaryDark: '#111111',
  
  // Functional colors
  success: '#FFFFFF', // Using white for most elements
  warning: '#FFFFFF',
  error: '#FFFFFF',
  info: '#FFFFFF',
  
  // UI colors
  background: '#000000', // Black background
  backgroundDark: '#000000',
  backgroundLight: '#111111',
  
  card: '#111111', // Dark cards
  cardDark: '#000000',
  
  border: '#333333',
  borderDark: '#444444',
  
  // Text colors
  text: '#FFFFFF', // White text
  textSecondary: '#AAAAAA', // Light gray for secondary text
  textLight: '#666666',
  textOnPrimary: '#000000', // Black text on white backgrounds
  textOnSecondary: '#FFFFFF',
  
  // Skeleton loading colors
  skeletonBase: '#333333',
  skeletonHighlight: '#444444',
  
  // Accent colors
  accent: '#FFFFFF',
  
  // Other UI colors
  disabled: '#444444',
  overlay: 'rgba(0, 0, 0, 0.8)',
  highlight: '#222222'
};

// Font families (when loaded through expo-font)
export const FONTS = {
  regular: 'ChivoRegular',
  medium: 'ChivoMedium',
  bold: 'ChivoBold',
  light: 'ChivoLight',
  italic: 'ChivoItalic'
};

// Shadow styles for consistent elevation effects
export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  }
};

// Common border radius values
export const BORDER_RADIUS = {
  small: 4,
  medium: 8,
  large: 16,
  circle: 9999
};

export default {
  COLORS,
  FONTS,
  SHADOWS,
  BORDER_RADIUS
};
