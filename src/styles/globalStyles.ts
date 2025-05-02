/**
 * Global Styles
 * 
 * Shared styles for consistent look and feel across the app.
 */

import { StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS, SHADOWS, BORDER_RADIUS } from '../config/colors';

const { width, height } = Dimensions.get('window');

export const globalStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 16,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  
  // Card styles
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.large,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 18,
    color: COLORS.text,
  },
  cardContent: {
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  // Text styles
  title: {
    fontFamily: 'ChivoBold',
    fontSize: 24,
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'ChivoBold',
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 8,
  },
  bodyText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  captionText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.error,
    marginTop: 4,
  },
  linkText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  
  // Button styles
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  primaryButtonText: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontFamily: 'ChivoBold',
    fontSize: 16,
    color: COLORS.primary,
  },
  textButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  textButtonText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.primary,
  },
  iconButton: {
    padding: 8,
  },
  
  // Input styles
  input: {
    height: 48,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.medium,
    paddingHorizontal: 16,
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputLabel: {
    fontFamily: 'ChivoBold',
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  
  // Avatar styles
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  
  // Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  
  // List styles
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listItemText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontFamily: 'ChivoBold',
    fontSize: 18,
    color: COLORS.text,
  },
  
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.large,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.medium,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  inactiveTab: {
    backgroundColor: 'transparent',
  },
  tabText: {
    fontFamily: 'ChivoBold',
    fontSize: 14,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  inactiveTabText: {
    color: COLORS.text,
  },
  
  // Badge styles
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBadge: {
    backgroundColor: COLORS.primary,
  },
  secondaryBadge: {
    backgroundColor: COLORS.accent,
  },
  errorBadge: {
    backgroundColor: COLORS.error,
  },
  successBadge: {
    backgroundColor: COLORS.success,
  },
  badgeText: {
    fontFamily: 'ChivoBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  
  // Form styles
  form: {
    width: '100%',
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  formColumn: {
    flex: 1,
    marginHorizontal: 8,
  },
  
  // Notification banner
  notificationBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 10,
    left: 16,
    right: 16,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.medium,
    padding: 16,
    ...SHADOWS.medium,
  },
  notificationText: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: '#FFFFFF',
  },
  
  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontFamily: 'ChivoRegular',
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
});
