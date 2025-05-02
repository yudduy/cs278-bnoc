/**
 * Theme Configuration
 * 
 * Contains color definitions and theme settings for the app.
 */

export const COLORS = {
  // Primary brand color
  primary: '#990000', // App's main color - deep red
  primaryLight: '#c13030',
  primaryDark: '#700000',
  
  // UI background colors
  background: '#f5f5f5', // Light gray background
  backgroundDark: '#121212', // Dark mode background
  backgroundLight: '#f9f9f9', // Lighter gray for elements on light background
  card: '#ffffff', // Card background
  cardDark: '#1e1e1e', // Dark mode card background
  
  // Text colors
  text: '#252525', // Primary text
  textSecondary: '#757575', // Secondary, less important text
  textDark: '#ffffff', // Dark mode primary text
  textSecondaryDark: '#a0a0a0', // Dark mode secondary text
  
  // Status/Feedback colors
  success: '#4caf50', // Success state
  successDark: '#388e3c', // Darker success 
  warning: '#ff9800', // Warning state
  warningDark: '#f57c00', // Darker warning
  error: '#f44336', // Error state
  errorDark: '#d32f2f', // Darker error
  info: '#2196f3', // Info state
  infoDark: '#1976d2', // Darker info
  
  // UI element colors
  border: '#e0e0e0', // Border color for UI elements
  borderDark: '#333333', // Dark mode border
  divider: '#eeeeee', // Divider lines
  dividerDark: '#2a2a2a', // Dark mode divider
  placeholder: '#bbbbbb', // Placeholder text
  placeholderDark: '#666666', // Dark mode placeholder
  
  // Interaction colors
  ripple: 'rgba(153, 0, 0, 0.2)', // Ripple effect color
  highlight: 'rgba(153, 0, 0, 0.1)', // Highlight effect
  
  // Skeleton loading colors
  skeletonBase: '#e0e0e0',
  skeletonHighlight: '#f5f5f5',
};

export const DARK_COLORS = {
  ...COLORS,
  background: COLORS.backgroundDark,
  backgroundLight: '#252525',
  card: COLORS.cardDark,
  text: COLORS.textDark,
  textSecondary: COLORS.textSecondaryDark,
  border: COLORS.borderDark,
  divider: COLORS.dividerDark,
  placeholder: COLORS.placeholderDark,
  ripple: 'rgba(153, 0, 0, 0.3)',
  highlight: 'rgba(153, 0, 0, 0.2)',
  skeletonBase: '#333333',
  skeletonHighlight: '#444444',
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