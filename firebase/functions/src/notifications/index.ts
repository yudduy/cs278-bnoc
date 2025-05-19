/**
 * Notification Cloud Functions
 * 
 * Handles push notifications for various events:
 * - Daily pairing created
 * - Pairing reminder (approaching deadline)
 * - Partner photo submission
 * - New chat messages
 * - Pairing completion
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Sends push notification when a chat message is received
 * Uses Firestore trigger on new message documents
 */
export const onNewChatMessage = functions.firestore
  .document('chatRooms/{chatRoomId}/messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    try {
      const db = admin.firestore();
      const messageData = snapshot.data();
      const chatRoomId = context.params.chatRoomId;
      
      // Don't send notification for system messages
      if (messageData.isSystemMessage) return null;

      // Get chat room details to identify pairing and users
      const chatRoomDoc = await db.collection('chatRooms').doc(chatRoomId).get();
      if (!chatRoomDoc.exists) {
        console.log(`ChatRoom ${chatRoomId} not found`);
        return null;
      }

      const chatRoomData = chatRoomDoc.data() as any;
      const senderId = messageData.senderId;
      const recipientId = chatRoomData.userIds.find((id: string) => id !== senderId);

      if (!recipientId) {
        console.log('Recipient not found');
        return null;
      }

      // Get recipient user data
      const userDoc = await db.collection('users').doc(recipientId).get();
      if (!userDoc.exists) {
        console.log(`User ${recipientId} not found`);
        return null;
      }

      const userData = userDoc.data() as any;

      // Check notification settings
      if (!userData.notificationSettings?.chatNotification) {
        console.log(`User ${recipientId} has disabled chat notifications`);
        return null;
      }

      // Check quiet hours
      if (isInQuietHours(userData.notificationSettings)) {
        console.log(`Skipping notification for user ${recipientId} due to quiet hours`);
        return null;
      }

      // Get sender info for notification
      const senderDoc = await db.collection('users').doc(senderId).get();
      const senderData = senderDoc.exists ? senderDoc.data() as any : null;
      const senderName = senderData?.displayName || senderData?.username || 'Your partner';

      // Get FCM token
      const fcmToken = userData.fcmToken;
      if (!fcmToken) {
        console.log(`No FCM token for user ${recipientId}`);
        return null;
      }

      // Send notification
      const message = {
        token: fcmToken,
        notification: {
          title: `Message from ${senderName}`,
          body: messageData.text.substring(0, 100) + (messageData.text.length > 100 ? '...' : ''),
        },
        data: {
          type: 'chat_message',
          chatRoomId: chatRoomId,
          pairingId: chatRoomData.pairingId,
          senderId: senderId,
        },
        android: {
          notification: {
            channelId: 'chat_messages',
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
              sound: 'default',
            },
          },
        },
      };

      await admin.messaging().send(message);
      console.log(`Chat notification sent to ${recipientId}`);
      return { success: true };
    } catch (error) {
      console.error('Error sending chat notification:', error);
      return { success: false, error: (error as Error).message };
    }
  });

/**
 * Sends push notification when partner submits their photo
 * Triggers on Firestore document update to a pairing
 */
export const onPhotoSubmission = functions.firestore
  .document('pairings/{pairingId}')
  .onUpdate(async (change, context) => {
    try {
      const db = admin.firestore();
      const pairingBefore = change.before.data() as any;
      const pairingAfter = change.after.data() as any;
      
      // Check if this is a photo submission update
      const isUser1Submission = !pairingBefore.user1_photoURL && 
        pairingAfter.user1_photoURL;
      
      const isUser2Submission = !pairingBefore.user2_photoURL && 
        pairingAfter.user2_photoURL;
      
      if (!isUser1Submission && !isUser2Submission) {
        // Not a photo submission update
        return null;
      }
      
      // Determine which user submitted and which should receive notification
      const submitterId = isUser1Submission ? pairingAfter.user1_id : pairingAfter.user2_id;
      const recipientId = isUser1Submission ? pairingAfter.user2_id : pairingAfter.user1_id;
      
      // Get recipient user data
      const userDoc = await db.collection('users').doc(recipientId).get();
      if (!userDoc.exists) {
        console.log(`User ${recipientId} not found`);
        return null;
      }
      
      const userData = userDoc.data() as any;
      
      // Check notification settings
      if (!userData.notificationSettings?.completionNotification) {
        console.log(`User ${recipientId} has disabled completion notifications`);
        return null;
      }
      
      // Check quiet hours
      if (isInQuietHours(userData.notificationSettings)) {
        console.log(`Skipping notification for user ${recipientId} due to quiet hours`);
        return null;
      }
      
      // Get submitter info for notification
      const submitterDoc = await db.collection('users').doc(submitterId).get();
      const submitterData = submitterDoc.exists ? submitterDoc.data() as any : null;
      const submitterName = submitterData?.displayName || submitterData?.username || 'Your partner';
      
      // Get FCM token
      const fcmToken = userData.fcmToken;
      if (!fcmToken) {
        console.log(`No FCM token for user ${recipientId}`);
        return null;
      }
      
      // Send notification
      const message = {
        token: fcmToken,
        notification: {
          title: 'Photo Submitted!',
          body: `${submitterName} just submitted their photo! It's your turn now.`,
        },
        data: {
          type: 'photo_submission',
          pairingId: context.params.pairingId,
          submitterId: submitterId,
        },
        android: {
          notification: {
            channelId: 'pairing_updates',
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
              sound: 'default',
            },
          },
        },
      };
      
      await admin.messaging().send(message);
      console.log(`Photo submission notification sent to ${recipientId}`);
      return { success: true };
    } catch (error) {
      console.error('Error sending photo submission notification:', error);
      return { success: false, error: (error as Error).message };
    }
  });

/**
 * Sends notification when a pairing is completed (both photos submitted)
 */
export const onPairingCompleted = functions.firestore
  .document('pairings/{pairingId}')
  .onUpdate(async (change, context) => {
    try {
      const db = admin.firestore();
      const pairingBefore = change.before.data() as any;
      const pairingAfter = change.after.data() as any;
      
      // Check if this update marks the pairing as completed
      const isNewlyCompleted = pairingBefore.status !== 'completed' && 
        pairingAfter.status === 'completed';
      
      if (!isNewlyCompleted) {
        return null;
      }
      
      for (const userId of pairingAfter.users) {
        // Get user data
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
          console.log(`User ${userId} not found`);
          continue;
        }
        
        const userData = userDoc.data() as any;
        
        // Check notification settings
        if (!userData.notificationSettings?.completionNotification) {
          console.log(`User ${userId} has disabled completion notifications`);
          continue;
        }
        
        // Check quiet hours
        if (isInQuietHours(userData.notificationSettings)) {
          console.log(`Skipping notification for user ${userId} due to quiet hours`);
          continue;
        }
        
        // Get FCM token
        const fcmToken = userData.fcmToken;
        if (!fcmToken) {
          console.log(`No FCM token for user ${userId}`);
          continue;
        }
        
        // Send notification
        const message = {
          token: fcmToken,
          notification: {
            title: 'Pairing Completed!',
            body: 'Both of you submitted photos. Check out the result in your feed!',
          },
          data: {
            type: 'pairing_completed',
            pairingId: context.params.pairingId,
          },
          android: {
            notification: {
              channelId: 'pairing_updates',
              priority: 'high',
            },
          },
          apns: {
            payload: {
              aps: {
                contentAvailable: true,
                sound: 'default',
              },
            },
          },
        };
        
        await admin.messaging().send(message);
        console.log(`Completion notification sent to ${userId}`);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error sending completion notification:', error);
      return { success: false, error: (error as Error).message };
    }
  });

/**
 * Check if current time is within user's quiet hours
 */
function isInQuietHours(notificationSettings: any): boolean {
  if (!notificationSettings || 
      notificationSettings.quietHoursStart === undefined || 
      notificationSettings.quietHoursEnd === undefined) {
    return false;
  }
  
  const now = new Date();
  const currentHour = now.getHours();
  const start = notificationSettings.quietHoursStart;
  const end = notificationSettings.quietHoursEnd;
  
  // Handle cases where quiet hours span across midnight
  if (start <= end) {
    return currentHour >= start && currentHour < end;
  } else {
    return currentHour >= start || currentHour < end;
  }
} 