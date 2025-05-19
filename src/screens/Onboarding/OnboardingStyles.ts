/**
 * OnboardingStyles
 * 
 * Shared styles for the onboarding screens using the black and white theme.
 */

import { StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS } from '../../config/theme';

const { width, height } = Dimensions.get('window');

export const onboardingStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // Black background
    paddingHorizontal: 24,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background, // Black background
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 32,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  headerTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 18,
    color: COLORS.primary, // White text
    textAlign: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Logo and Branding
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.08,
    marginBottom: height * 0.05,
  },
  logoText: {
    fontFamily: 'ChivoBold',
    fontSize: 36,
    color: COLORS.primary, // White text
    letterSpacing: 2,
  },
  
  // Text styles
  title: {
    fontFamily: 'ChivoBold',
    fontSize: 28,
    color: COLORS.primary, // White text
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.textSecondary, // Light gray text
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  description: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.primary, // White text
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  
  // Button styles
  primaryButton: {
    backgroundColor: COLORS.backgroundLight, // Dark gray button
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 32 : 24,
  },
  primaryButtonText: {
    fontFamily: 'ChivoBold',
    fontSize: 18,
    color: COLORS.primary, // White text
  },
  disabledButton: {
    opacity: 0.5,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary, // White border
  },
  secondaryButtonText: {
    fontFamily: 'ChivoBold',
    fontSize: 18,
    color: COLORS.primary, // White text
  },
  
  // Input styles
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: COLORS.primary, // White text
    marginBottom: 8,
  },
  input: {
    height: 54,
    backgroundColor: COLORS.backgroundLight, // Dark gray input
    borderRadius: 12,
    paddingHorizontal: 16,
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.primary, // White text
    borderWidth: 1,
    borderColor: COLORS.border, // Dark gray border
  },
  inputFocused: {
    borderColor: COLORS.primary, // White border when focused
  },
  inputHint: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary, // Light gray text
    marginTop: 8,
  },
  
  // Permission item styles
  permissionsContainer: {
    marginBottom: 32,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: COLORS.backgroundLight, // Dark gray background
    padding: 16,
    borderRadius: 12,
  },
  permissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: COLORS.backgroundLight, // Dark gray background
    borderWidth: 1,
    borderColor: COLORS.primary, // White border
  },
  permissionText: {
    flex: 1,
  },
  permissionTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: COLORS.primary, // White text
    marginBottom: 4,
  },
  permissionDescription: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary, // Light gray text
    lineHeight: 20,
  },
  
  // Progress indicator
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border, // Dark gray
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary, // White
    width: 24,
  },
  
  // Info box styles
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight, // Dark gray background
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary, // Light gray text
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  
  // Profile image styles
  imageSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.backgroundLight, // Dark gray background
    position: 'relative',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border, // Dark gray border
  },
  profileImage: {
    width: 118,
    height: 118,
    borderRadius: 59,
  },
  imageBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.backgroundLight, // Dark gray background
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary, // White border
  },
  imageHint: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary, // Light gray text
  },
  
  // Completion screen styles
  checkmarkContainer: {
    marginBottom: 40,
  },
  checkmark: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary, // White border
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: COLORS.primary, // White border
    backgroundColor: 'transparent',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: COLORS.primary, // White text
    marginBottom: 4,
  },
  featureDescription: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary, // Light gray text
    lineHeight: 20,
  },
});

export default onboardingStyles; 