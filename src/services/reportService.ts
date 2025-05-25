// src/services/reportService.ts

import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import logger from '../utils/logger';

export interface Report {
  id: string;
  pairingId: string;
  reporterId: string;
  reportedAt: Timestamp;
  status: 'pending' | 'reviewed' | 'resolved';
  reason?: string;
}

/**
 * Report a pairing post
 */
export const reportPost = async (
  pairingId: string, 
  reporterId: string, 
  reason?: string
): Promise<void> => {
  try {
    if (!pairingId || !reporterId) {
      throw new Error('pairingId and reporterId are required');
    }

    const reportData = {
      pairingId,
      reporterId,
      reportedAt: Timestamp.now(),
      status: 'pending' as const,
      reason: reason || 'Inappropriate content',
    };

    await addDoc(collection(db, 'reports'), reportData);
    
    logger.info(`Post ${pairingId} reported by user ${reporterId}`);
  } catch (error) {
    logger.error('Error reporting post:', error);
    throw error;
  }
};

/**
 * Check if a user has already reported a specific pairing
 */
export const hasUserReportedPost = async (
  pairingId: string, 
  userId: string
): Promise<boolean> => {
  try {
    // This would require querying reports collection
    // For now, return false to allow reporting
    // In a real implementation, you'd query:
    // const q = query(collection(db, 'reports'), 
    //   where('pairingId', '==', pairingId),
    //   where('reporterId', '==', userId)
    // );
    // const snapshot = await getDocs(q);
    // return !snapshot.empty;
    
    return false;
  } catch (error) {
    logger.error('Error checking report status:', error);
    return false;
  }
};
