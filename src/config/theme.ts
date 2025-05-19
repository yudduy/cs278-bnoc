/**
 * Theme Configuration
 * 
 * Black and white theme for the BeReal-inspired UI.
 */

export const COLORS = {
  // Primary brand color - now white
  primary: '#FFFFFF',
  primaryLight: '#F5F5F5',
  primaryDark: '#E0E0E0',
  
  // UI background colors - primarily black
  background: '#000000', // Black background
  backgroundDark: '#000000',
  backgroundLight: '#111111',
  card: '#111111', // Dark cards
  cardDark: '#000000',
  
  // Text colors
  text: '#FFFFFF', // White text
  textSecondary: '#AAAAAA', // Light gray for secondary text
  textDark: '#FFFFFF',
  textSecondaryDark: '#AAAAAA',
  
  // Status/Feedback colors - now white with different opacities
  success: '#FFFFFF',
  successDark: '#EEEEEE',
  warning: '#FFFFFF',
  warningDark: '#EEEEEE',
  error: '#FFFFFF',
  errorDark: '#EEEEEE',
  info: '#FFFFFF',
  infoDark: '#EEEEEE',
  
  // UI element colors
  border: '#333333',
  borderDark: '#444444',
  divider: '#222222',
  dividerDark: '#333333',
  placeholder: '#666666',
  placeholderDark: '#444444',
  
  // Interaction colors
  ripple: 'rgba(255, 255, 255, 0.2)',
  highlight: 'rgba(255, 255, 255, 0.1)',
  
  // Skeleton loading colors
  skeletonBase: '#333333',
  skeletonHighlight: '#444444',
};

export const DARK_COLORS = {
  ...COLORS,
  // No need to override as we're already using a dark theme
};

export const FONTS = {
  regular: 'ChivoRegular',
  bold: 'ChivoBold',
  light: 'ChivoLight',
  italic: 'ChivoItalic',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  round: 9999,
};

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
  },
};