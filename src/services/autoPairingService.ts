import { httpsCallable } from 'firebase/functions';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { functions, db } from '../config/firebase';
import logger from '../utils/logger';

/**
 * Trigger auto-pairing via Cloud Function.
 */
export const autoPairNewUser = async (newUserId: string): Promise<boolean> => {
  try {
    const fn = httpsCallable(functions, 'autoPairNewUser');
    const result = await fn({ newUserId });
    const data = result.data as any;
    return !!data?.success;
  } catch (error) {
    logger.error('Error invoking autoPairNewUser cloud function:', error);
    return false;
  }
};

/**
 * Check if a user lacks a pairing for today.
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
