/**
 * Pairing Algorithm Implementation
 * 
 * Implements the daily pairing algorithm that matches users,
 * avoiding recent repeats and respecting user preferences.
 * Prioritizes pairing users with their friends when possible.
 */

import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Types
export interface User {
  id: string;
  displayName?: string;
  username: string;
  email: string;
  createdAt: Timestamp;
  lastActive: Timestamp;
  isActive: boolean;
  flakeStreak: number;
  maxFlakeStreak: number;
  blockedIds: string[];
  connections: string[]; // Friend connections
  priorityNextPairing?: boolean;
  waitlistedToday?: boolean;
  waitlistedAt?: Timestamp;
}

export interface PairingHistory {
  id: string;
  users: string[];
  date: Timestamp;
}

export interface PairingResult {
  pairings: { user1: User; user2: User }[];
  waitlist: User[];
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * Get pairing history for last N days
 */
export const getPairingHistory = async (days: number): Promise<PairingHistory[]> => {
  const db = admin.firestore();
  const cutoffDate = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  );
  
  const pairingsSnapshot = await db.collection('pairings')
    .where('date', '>', cutoffDate)
    .get();
  
  return pairingsSnapshot.docs.map(doc => ({
    id: doc.id,
    users: doc.data().users,
    date: doc.data().date,
  }));
};

/**
 * Create pairings while avoiding recent repeats and prioritizing friend connections
 */
export const createPairings = (
  users: User[], 
  history: PairingHistory[]
): PairingResult => {
  // Sort users to prioritize those who were on waitlist yesterday
  users.sort((a, b) => {
    if (a.priorityNextPairing && !b.priorityNextPairing) return -1;
    if (!a.priorityNextPairing && b.priorityNextPairing) return 1;
    return 0;
  });
  
  const pairings: { user1: User; user2: User }[] = [];
  const paired = new Set<string>();
  const waitlist: User[] = [];
  
  // Create a map of recent pairings for quick lookup
  const recentPairings = new Map<string, Set<string>>();
  
  history.forEach(pairing => {
    const [user1, user2] = pairing.users;
    
    if (!recentPairings.has(user1)) {
      recentPairings.set(user1, new Set());
    }
    if (!recentPairings.has(user2)) {
      recentPairings.set(user2, new Set());
    }
    
    recentPairings.get(user1)?.add(user2);
    recentPairings.get(user2)?.add(user1);
  });
  
  // Try to pair each user
  for (let i = 0; i < users.length; i++) {
    const user1 = users[i];
    
    // Skip if already paired
    if (paired.has(user1.id)) continue;
    
    // Try to find a suitable partner
    let foundPartner = false;
    
    // First, try to pair with friends (from connections array)
    const friends = user1.connections || [];
    
    // Shuffle friends to avoid always pairing with the same friend
    const shuffledFriends = shuffleArray(friends);
    
    // Try to find a friend to pair with first
    for (const friendId of shuffledFriends) {
      const friendIndex = users.findIndex(u => u.id === friendId);
      if (friendIndex === -1) continue; // Friend not in active users
      
      const friend = users[friendIndex];
      
      // Skip if already paired or blocked
      if (paired.has(friend.id)) continue;
      if (user1.blockedIds?.includes(friend.id) || friend.blockedIds?.includes(user1.id)) continue;
      
      // Skip if recently paired
      const recentPartners1 = recentPairings.get(user1.id) || new Set();
      if (recentPartners1.has(friend.id)) continue;
      
      // Create pairing with friend
      pairings.push({ user1, user2: friend });
      paired.add(user1.id);
      paired.add(friend.id);
      foundPartner = true;
      break;
    }
    
    // If no friend was available, try with non-friends
    if (!foundPartner) {
      for (let j = 0; j < users.length; j++) {
        if (i === j) continue;
        
        const user2 = users[j];
        
        // Skip if already paired or blocked
        if (paired.has(user2.id)) continue;
        if (user1.blockedIds?.includes(user2.id) || user2.blockedIds?.includes(user1.id)) continue;
        
        // Skip if recently paired
        const recentPartners1 = recentPairings.get(user1.id) || new Set();
        if (recentPartners1.has(user2.id)) continue;
        
        // Create pairing
        pairings.push({ user1, user2 });
        paired.add(user1.id);
        paired.add(user2.id);
        foundPartner = true;
        break;
      }
    }
    
    // Add to waitlist if no partner found
    if (!foundPartner && !paired.has(user1.id)) {
      waitlist.push(user1);
    }
  }
  
  return { pairings, waitlist };
};

/**
 * Generate virtual meeting link for a pairing
 */
export const generateVirtualMeetingLink = (pairingId: string): string => {
  return `https://meet.jitsi.si/DailyMeetupSelfie-${pairingId}`;
};

/**
 * Get active users eligible for pairing
 */
export const getActiveUsers = async (): Promise<User[]> => {
  const db = admin.firestore();
  
  const activeUsersSnapshot = await db.collection('users')
    .where('isActive', '==', true)
    .where('lastActive', '>', admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    ))
    .where('flakeStreak', '<', 5) // Skip users with high flake streak
    .get();
  
  return activeUsersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as User[];
};

/**
 * Create pairing documents in Firestore
 */
export const createPairingDocuments = async (
  pairings: { user1: User; user2: User }[],
  waitlist: User[]
): Promise<void> => {
  const db = admin.firestore();
  const batch = db.batch();
  
  // Calculate today's deadline (10:00 PM PT)
  const today = new Date();
  const expiresAt = new Date(today);
  expiresAt.setHours(22, 0, 0, 0); // 10:00 PM
  
  // Create pairing documents
  for (const pairing of pairings) {
    const pairingRef = db.collection('pairings').doc();
    
    batch.set(pairingRef, {
      id: pairingRef.id,
      date: admin.firestore.Timestamp.now(),
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      users: [pairing.user1.id, pairing.user2.id],
      status: 'pending',
      isPrivate: false,
      likes: 0,
      likedBy: [],
      comments: [],
      virtualMeetingLink: generateVirtualMeetingLink(pairingRef.id),
    });
    
    // Also add to each user's pairings subcollection for faster queries
    batch.set(
      db.collection('users').doc(pairing.user1.id).collection('pairings').doc(pairingRef.id),
      { pairingId: pairingRef.id, date: admin.firestore.Timestamp.now() }
    );
    batch.set(
      db.collection('users').doc(pairing.user2.id).collection('pairings').doc(pairingRef.id),
      { pairingId: pairingRef.id, date: admin.firestore.Timestamp.now() }
    );
  }
  
  // Handle waitlist users
  for (const waitlistUser of waitlist) {
    // Flag user as on waitlist today
    batch.update(db.collection('users').doc(waitlistUser.id), {
      waitlistedToday: true,
      waitlistedAt: admin.firestore.Timestamp.now(),
      priorityNextPairing: true, // Give priority for tomorrow
    });
  }
  
  // Commit all changes
  await batch.commit();
};