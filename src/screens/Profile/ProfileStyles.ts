/**
 * ProfileStyles
 * 
 * Styles for the Profile screen, following the Instagram-inspired layout and black and white theme.
 */

import { StyleSheet, Dimensions } from 'react-native';
import { COLORS, FONTS, BORDER_RADIUS } from '../../config/theme';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = width / 3 - 2; // For a 3-column grid with small gap

export const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  headerLeft: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  headerRight: {
    position: 'absolute',
    right: 16,
    zIndex: 1,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.primary,
  },
  
  // Profile Info Section
  profileInfoSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    marginRight: 20,
  },
  profileImage: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1,
    borderColor: '#333333',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  
  // Bio section
  bioSection: {
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  displayName: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: 2,
  },
  username: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  
  // Action buttons
  actionsSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  editProfileButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.primary,
  },
  
  // Pairings section
  pairingsSection: {
    flex: 1,
    paddingTop: 16,
  },
  pairingsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 8,
  },
  
  // Empty state
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.7,
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  
  // Pairing Card Styles
  pairingCard: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  pairingHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  pairingUserNames: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: 4,
  },
  separator: {
    color: COLORS.textSecondary,
  },
  pairingDate: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  pairingImagesContainer: {
    height: 200,
    position: 'relative',
  },
  dualImagesContainer: {
    flexDirection: 'row',
    height: '100%',
  },
  halfImage: {
    flex: 1,
    height: '100%',
  },
  singleImageContainer: {
    height: '100%',
    position: 'relative',
  },
  singleImage: {
    width: '100%',
    height: '100%',
  },
  missingImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    alignItems: 'center',
  },
  missingImageText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.primary,
  },
  noImagesContainer: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
  },
  noImagesText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  pairingFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  pairingStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.primary,
  },
});

export default profileStyles; 