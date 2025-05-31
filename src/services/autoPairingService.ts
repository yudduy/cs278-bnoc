/**
 * Auto-Pairing Service
 * 
 * Automatically pairs new users with jleong222 or creates test accounts
 * to ensure immediate app usability for new users.
 */

import { 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

const TARGET_USER_USERNAME = 'jleong222';
const TEST_ACCOUNT_PASSWORD = 'password123';
const TEST_ACCOUNT_EMAIL_DOMAIN = '@testuser.bnoc.stanford.edu';

/**
 * Get the target user (jleong222) from the database
 */
const getTargetUser = async (): Promise<User | null> => {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      where('username', '==', TARGET_USER_USERNAME),
      limit(1)
    );
    
    const snapshot = await getDocs(usersQuery);
    
    if (snapshot.empty) {
      logger.warn(`Target user ${TARGET_USER_USERNAME} not found`);
      return null;
    }
    
    const userDoc = snapshot.docs[0];
    return {
      id: userDoc.id,
      ...userDoc.data()
    } as User;
  } catch (error) {
    logger.error('Error getting target user:', error);
    return null;
  }
};

/**
 * Check if target user has an active pairing today
 */
const isTargetUserAvailable = async (targetUserId: string): Promise<boolean> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const pairingsQuery = query(
      collection(db, 'pairings'),
      where('users', 'array-contains', targetUserId),
      where('date', '>=', today),
      where('status', 'in', ['pending', 'user1_submitted', 'user2_submitted']),
      limit(1)
    );
    
    const snapshot = await getDocs(pairingsQuery);
    return snapshot.empty;
  } catch (error) {
    logger.error('Error checking target user availability:', error);
    return false;
  }
};

/**
 * Get the next available test account number
 */
const getNextTestAccountNumber = async (): Promise<number> => {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      where('username', '>=', 'test_'),
      where('username', '<', 'test_' + '\uf8ff'),
      orderBy('username', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(usersQuery);
    
    if (snapshot.empty) {
      return 1;
    }
    
    const lastTestUser = snapshot.docs[0].data();
    const lastUsername = lastTestUser.username as string;
    const match = lastUsername.match(/test_(\d+)/);
    
    if (match) {
      return parseInt(match[1]) + 1;
    }
    
    return 1;
  } catch (error) {
    logger.error('Error getting next test account number:', error);
    return Date.now(); // Fallback to timestamp
  }
};

/**
 * Create a new test account
 */
const createTestAccount = async (testNumber: number): Promise<User | null> => {
  try {
    const username = `test_${testNumber}`;
    const email = `${username}${TEST_ACCOUNT_EMAIL_DOMAIN}`;
    const displayName = `Test User ${testNumber}`;
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      TEST_ACCOUNT_PASSWORD
    );
    
    // Update Firebase Auth profile
    await updateProfile(userCredential.user, {
      displayName: displayName
    });
    
    // Create user document in Firestore
    const userData: Omit<User, 'id'> = {
      email: email,
      username: username,
      displayName: displayName,
      photoURL: undefined,
      isActive: true,
      flakeStreak: 0,
      maxFlakeStreak: 0,
      connections: [],
      blockedIds: [],
      notificationSettings: {
        pairingNotification: true,
        reminderNotification: true,
        chatNotification: true,
        partnerPhotoSubmittedNotification: true,
        socialNotifications: true,
        completionNotification: true,
        quietHoursStart: 22,
        quietHoursEnd: 8
      },
      privacySettings: {
        globalFeedOptIn: true
      },
      createdAt: Timestamp.now(),
      lastActive: Timestamp.now(),
      lastUpdated: Timestamp.now(),
      fcmToken: "none",
      pushToken: "none"
    };
    
    const userRef = doc(db, 'users', userCredential.user.uid);
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    });
    
    logger.info(`Created test account: ${username} (${userCredential.user.uid})`);
    
    return {
      id: userCredential.user.uid,
      ...userData,
      createdAt: Timestamp.now(),
      lastActive: Timestamp.now(),
      lastUpdated: Timestamp.now(),
    };
  } catch (error) {
    logger.error(`Error creating test account test_${testNumber}:`, error);
    return null;
  }
};

/**
 * Create a pairing between two users
 */
const createPairing = async (user1Id: string, user2Id: string): Promise<string | null> => {
  try {
    const pairingId = uuidv4();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate expiry time (11 PM today)
    const expiryTime = new Date(today);
    expiryTime.setHours(23, 0, 0, 0);
    
    const pairingData = {
      user1_id: user1Id,
      user2_id: user2Id,
      users: [user1Id, user2Id],
      status: 'pending',
      date: Timestamp.fromDate(today),
      expiresAt: Timestamp.fromDate(expiryTime),
      createdAt: serverTimestamp(),
      lastUpdatedAt: serverTimestamp(),
      isPrivate: false,
      photoMode: 'together',
      user1_photoURL: null,
      user2_photoURL: null,
      user1_submittedAt: null,
      user2_submittedAt: null,
      completedAt: null,
      likesCount: 0,
      commentsCount: 0,
      likedBy: [],
      chatId: `chat_${pairingId}`,
      virtualMeetingLink: `https://meet.jitsi.si/DailyMeetupSelfie-${pairingId}`
    };
    
    const pairingRef = doc(db, 'pairings', pairingId);
    await setDoc(pairingRef, pairingData);
    
    logger.info(`Created pairing ${pairingId} between ${user1Id} and ${user2Id}`);
    return pairingId;
  } catch (error) {
    logger.error('Error creating pairing:', error);
    return null;
  }
};

/**
 * Main function to auto-pair a new user
 */
export const autoPairNewUser = async (newUserId: string): Promise<boolean> => {
  try {
    logger.info(`Attempting to auto-pair new user: ${newUserId}`);
    
    // Step 1: Try to pair with jleong222
    const targetUser = await getTargetUser();
    
    if (targetUser) {
      const isAvailable = await isTargetUserAvailable(targetUser.id);
      
      if (isAvailable) {
        const pairingId = await createPairing(newUserId, targetUser.id);
        if (pairingId) {
          logger.info(`Successfully paired new user ${newUserId} with ${TARGET_USER_USERNAME}`);
          return true;
        }
      } else {
        logger.info(`${TARGET_USER_USERNAME} is already paired today, creating test account`);
      }
    } else {
      logger.warn(`${TARGET_USER_USERNAME} not found, creating test account`);
    }
    
    // Step 2: Create test account and pair with it
    const testNumber = await getNextTestAccountNumber();
    const testAccount = await createTestAccount(testNumber);
    
    if (testAccount) {
      const pairingId = await createPairing(newUserId, testAccount.id);
      if (pairingId) {
        logger.info(`Successfully paired new user ${newUserId} with test account test_${testNumber}`);
        return true;
      }
    }
    
    logger.error(`Failed to auto-pair new user ${newUserId}`);
    return false;
  } catch (error) {
    logger.error('Error in autoPairNewUser:', error);
    return false;
  }
};

/**
 * Check if a user needs auto-pairing (doesn't have a pairing today)
 */
export const needsAutoPairing = async (userId: string): Promise<boolean> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const pairingsQuery = query(
      collection(db, 'pairings'),
      where('users', 'array-contains', userId),
      where('date', '>=', today),
      limit(1)
    );
    
    const snapshot = await getDocs(pairingsQuery);
    return snapshot.empty;
  } catch (error) {
    logger.error('Error checking if user needs auto-pairing:', error);
    return false;
  }
}; 