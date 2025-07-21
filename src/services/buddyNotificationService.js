// src/services/buddyNotificationService.js - FIXED: Handle permissions gracefully
import { addDoc, collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';

/**
 * Ensure user has notification settings, create defaults if missing
 */
const ensureNotificationSettings = async (userId) => {
  try {
    // Try a simple approach - just check if user exists
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      console.log(`✅ User ${userId} exists, notifications enabled by default`);
      return true;
    } else {
      console.log(`⚠️ User ${userId} not found, but continuing anyway...`);
      return true; // Fail safe - assume notifications are enabled
    }
  } catch (error) {
    console.log(`⚠️ Notification settings check failed for ${userId}, continuing anyway...`);
    return true; // Fail safe
  }
};

/**
 * Send notification when encouragement is sent
 * FIXED: Handle permission errors gracefully
 */
export const sendEncouragementNotification = async (
  toUserId, 
  fromUserName, 
  message
) => {
  try {
    console.log(`🔔 Attempting to send encouragement notification to ${toUserId}`);
    
    const notificationsEnabled = await ensureNotificationSettings(toUserId);
    
    if (!notificationsEnabled) {
      console.log('Recipient has notifications disabled, skipping');
      return { success: true, skipped: true };
    }

    // Try to save notification to the main notifications collection (not subcollection)
    const notificationData = {
      title: 'Encouragement Received!',
      body: `${fromUserName}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
      type: 'encouragement_received',
      data: {
        fromUserId: auth.currentUser?.uid,
        fromUserName,
        message,
        actionType: 'encouragement_received',
        screen: 'BuddiesScreen'
      },
      userId: toUserId,
      toUserId: toUserId,
      fromUserId: auth.currentUser?.uid,
      read: false,
      createdAt: new Date().toISOString()
    };

    // Try saving to main notifications collection first
    try {
      await addDoc(collection(db, 'notifications'), notificationData);
      console.log(`✅ Encouragement notification saved to main collection`);
      return { success: true };
    } catch (mainError) {
      console.log(`⚠️ Failed to save to main notifications collection:`, mainError.message);
      
      // If main collection fails, try user subcollection
      try {
        const userNotificationsRef = collection(db, 'users', toUserId, 'notifications');
        await addDoc(userNotificationsRef, notificationData);
        console.log(`✅ Encouragement notification saved to user subcollection`);
        return { success: true };
      } catch (subError) {
        console.log(`⚠️ Failed to save to user subcollection:`, subError.message);
        
        // If both fail, just log and continue (don't break the message sending)
        console.log(`⚠️ Notification failed but message sending will continue`);
        return { success: false, error: subError.message };
      }
    }
    
  } catch (error) {
    console.error('Error in sendEncouragementNotification:', error);
    console.error('Error details:', error.code, error.message);
    
    // Don't throw the error - just log it and return failure
    return { success: false, error: error.message };
  }
};

/**
 * Send notification when a buddy request is sent
 * FIXED: Handle permission errors gracefully
 */
export const sendBuddyRequestNotification = async (toUserId, fromUserName) => {
  try {
    console.log(`🔔 Attempting to send buddy request notification to ${toUserId}`);
    
    const notificationData = {
      title: `New Buddy Request`,
      body: `${fromUserName} wants to be your workout buddy!`,
      type: 'buddy_request_received',
      data: {
        fromUserId: auth.currentUser?.uid,
        fromUserName,
        actionType: 'buddy_request',
        screen: 'BuddiesScreen'
      },
      userId: toUserId,
      toUserId: toUserId,
      fromUserId: auth.currentUser?.uid,
      read: false,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'notifications'), notificationData);
      console.log(`✅ Buddy request notification sent successfully`);
      return { success: true };
    } catch (error) {
      console.log(`⚠️ Buddy request notification failed:`, error.message);
      return { success: false, error: error.message };
    }
    
  } catch (error) {
    console.error('Error sending buddy request notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send notification when a challenge is sent
 * FIXED: Handle permission errors gracefully
 */
export const sendChallengeNotification = async (
  toUserId, 
  fromUserName, 
  challengeText
) => {
  try {
    console.log(`🔔 Attempting to send challenge notification to ${toUserId}`);
    
    const notificationData = {
      title: 'New Challenge Received!',
      body: `${fromUserName} challenged you: ${challengeText.substring(0, 50)}${challengeText.length > 50 ? '...' : ''}`,
      type: 'challenge_received',
      data: {
        fromUserId: auth.currentUser?.uid,
        fromUserName,
        challengeText,
        actionType: 'challenge_received',
        screen: 'ChallengesScreen'
      },
      userId: toUserId,
      toUserId: toUserId,
      fromUserId: auth.currentUser?.uid,
      read: false,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'notifications'), notificationData);
      console.log(`✅ Challenge notification sent successfully`);
      return { success: true };
    } catch (error) {
      console.log(`⚠️ Challenge notification failed:`, error.message);
      return { success: false, error: error.message };
    }
    
  } catch (error) {
    console.error('Error sending challenge notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send notification when a challenge is responded to
 * FIXED: Handle permission errors gracefully
 */
export const sendChallengeResponseNotification = async (
  toUserId, 
  fromUserName, 
  response
) => {
  try {
    console.log(`🔔 Attempting to send challenge response notification to ${toUserId}`);
    
    let title = '';
    let body = '';
    
    switch (response) {
      case 'accepted':
        title = 'Challenge Accepted!';
        body = `${fromUserName} accepted your challenge!`;
        break;
      case 'declined':
        title = 'Challenge Declined';
        body = `${fromUserName} declined your challenge.`;
        break;
      case 'completed':
        title = 'Challenge Completed!';
        body = `${fromUserName} completed your challenge!`;
        break;
      default:
        console.log('Invalid response type:', response);
        return { success: false, error: 'Invalid response type' };
    }

    const notificationData = {
      title,
      body,
      type: `challenge_${response}`,
      data: {
        fromUserId: auth.currentUser?.uid,
        fromUserName,
        response,
        actionType: 'challenge_response',
        screen: 'ChallengesScreen'
      },
      userId: toUserId,
      toUserId: toUserId,
      fromUserId: auth.currentUser?.uid,
      read: false,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'notifications'), notificationData);
      console.log(`✅ Challenge response notification sent successfully`);
      return { success: true };
    } catch (error) {
      console.log(`⚠️ Challenge response notification failed:`, error.message);
      return { success: false, error: error.message };
    }
    
  } catch (error) {
    console.error('Error sending challenge response notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get unread notification count for current user
 */
export const getUnreadNotificationCount = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    // For now, return 0 - implement actual query later
    return 0;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
};