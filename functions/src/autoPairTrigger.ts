import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_PHOTO_URL = 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fmb.jpeg?alt=media&token=e6e88f85-a09d-45cc-b6a4-cad438d1b2f6';
const TEST_ACCOUNT_PASSWORD = 'password123';
const TEST_ACCOUNT_EMAIL_DOMAIN = '@testuser.bnoc.stanford.edu';

/**
 * Auto-pair new users when they are created in Firestore
 * This trigger fires when a user document is created and automatically pairs them
 */
export const autoPairOnUserCreate = onDocumentCreated(
  'users/{userId}',
  async (event) => {
    const userId = event.params.userId;
    const userData = event.data?.data();
    
    if (!userData) {
      console.log('No user data found, skipping auto-pairing');
      return;
    }

    console.log('🤝 Auto-pairing triggered for new user:', userId, userData.username);

    const db = admin.firestore();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userHasPairing = async (uid: string): Promise<boolean> => {
      const snap = await db.collection('pairings')
        .where('users', 'array-contains', uid)
        .limit(10)
        .get();

      if (snap.empty) {
        return false;
      }

      return snap.docs.some(doc => {
        const d = doc.data().date as Timestamp | undefined;
        return d && d.toDate().getTime() >= today.getTime();
      });
    };

    // Check if user already has a pairing today
    if (await userHasPairing(userId)) {
      console.log('User already has a pairing today, skipping');
      return;
    }

    let partnerId: string | null = null;
    let createdTestAccount = false;

    try {
      // Try waitlisted user first
      const waitlistSnap = await db.collection('users')
        .where('waitlistedToday', '==', true)
        .limit(1)
        .get();

      if (!waitlistSnap.empty) {
        const candidate = waitlistSnap.docs[0];
        if (!(await userHasPairing(candidate.id))) {
          partnerId = candidate.id;
          await candidate.ref.update({ waitlistedToday: false });
          console.log('✅ Paired with waitlisted user:', candidate.data().username);
        }
      }

      // Fallback to test account creation
      if (!partnerId) {
        console.log('🤖 Creating test account...');
        
        const testSnap = await db.collection('users')
          .where('username', '>=', 'test_')
          .where('username', '<', 'test_\uf8ff')
          .orderBy('username', 'desc')
          .limit(1)
          .get();

        let nextNumber = 1;
        if (!testSnap.empty) {
          const last = testSnap.docs[0].data().username as string;
          const match = last.match(/test_(\d+)/);
          if (match) {
            nextNumber = parseInt(match[1], 10) + 1;
          }
        }

        // Try creating a new test account
        for (let attempts = 0; attempts < 3 && !partnerId; attempts += 1) {
          const username = `test_${nextNumber}`;
          const email = `${username}${TEST_ACCOUNT_EMAIL_DOMAIN}`;
          const displayName = `Test User ${nextNumber}`;

          try {
            const userRecord = await admin.auth().createUser({
              email,
              password: TEST_ACCOUNT_PASSWORD,
              displayName,
              photoURL: DEFAULT_PHOTO_URL,
            });

            await db.collection('users').doc(userRecord.uid).set({
              email,
              username,
              displayName,
              photoURL: DEFAULT_PHOTO_URL,
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
                quietHoursEnd: 8,
              },
              privacySettings: { globalFeedOptIn: true },
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              lastActive: admin.firestore.FieldValue.serverTimestamp(),
              lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
              fcmToken: 'none',
              pushToken: 'none',
            });

            partnerId = userRecord.uid;
            createdTestAccount = true;
            console.log('✅ Test account created:', username, userRecord.uid);
            break;
            
          } catch (err: any) {
            if (err.code === 'auth/email-already-in-use') {
              nextNumber += 1;
            } else {
              throw err;
            }
          }
        }
      }

      if (!partnerId) {
        console.error('❌ Failed to find or create partner');
        return;
      }

      // Create pairing
      const expiryTime = new Date(today);
      expiryTime.setHours(23, 0, 0, 0);

      const pairingId = uuidv4();
      await db.collection('pairings').doc(pairingId).set({
        user1_id: userId,
        user2_id: partnerId,
        users: [userId, partnerId],
        status: 'pending',
        date: Timestamp.fromDate(today),
        expiresAt: Timestamp.fromDate(expiryTime),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
        virtualMeetingLink: `https://meet.jitsi.si/DailyMeetupSelfie-${pairingId}`,
      });

      console.log('🎉 Auto-pairing completed successfully!', {
        userId,
        partnerId,
        pairingId,
        createdTestAccount
      });

    } catch (error) {
      console.error('❌ Error in auto-pairing trigger:', error);
    }
  }
); 