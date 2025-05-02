/**
 * App Colors
 * 
 * Centralized color definitions for the Daily Meetup Selfie app.
 * This ensures consistent styling across the entire application.
 */

export const COLORS = {
  // Primary brand color
  primary: '#990000', // Stanford Cardinal
  primaryLight: '#C41E3A',
  primaryDark: '#8C1515',
  
  // Background colors
  background: '#FFFFFF',
  backgroundLight: '#F5F5F5',
  backgroundDark: '#E5E5E5',
  
  // Card and container colors
  card: '#FFFFFF',
  
  // Text colors
  text: '#333333',
  textSecondary: '#757575',
  textLight: '#ABABAB',
  
  // Accent colors
  accent: '#4A90E2',
  
  // Status colors
  success: '#2ECC71',
  error: '#E74C3C',
  warning: '#F39C12',
  info: '#3498DB',
  
  // Border colors
  border: '#E0E0E0',
  borderDark: '#CCCCCC',
  
  // Other UI colors
  disabled: '#D1D1D1',
  overlay: 'rgba(0, 0, 0, 0.6)',
  highlight: '#FFF9C4'
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
