// src/utils/notificationTypes.js - Notification types for buddy interactions

export const NOTIFICATION_TYPES = {
  // Buddy interactions
  BUDDY_REQUEST_RECEIVED: 'buddy_request_received',
  BUDDY_REQUEST_ACCEPTED: 'buddy_request_accepted',
  BUDDY_REQUEST_DECLINED: 'buddy_request_declined',
  
  // Challenge interactions
  CHALLENGE_RECEIVED: 'challenge_received',
  CHALLENGE_ACCEPTED: 'challenge_accepted',
  CHALLENGE_DECLINED: 'challenge_declined',
  CHALLENGE_COMPLETED: 'challenge_completed',
  
  // Messages/Encouragement
  ENCOURAGEMENT_RECEIVED: 'encouragement_received',
  
  // Existing types from your service
  WORKOUT: 'workout',
  MEAL: 'meal',
  PROGRESS: 'progress',
  GENERAL: 'general'
};

export const NOTIFICATION_MESSAGES = {
  [NOTIFICATION_TYPES.BUDDY_REQUEST_RECEIVED]: {
    title: '🏋️ New Buddy Request!',
    body: (fromName) => `${fromName} wants to be your workout buddy!`
  },
  [NOTIFICATION_TYPES.BUDDY_REQUEST_ACCEPTED]: {
    title: '🎉 Buddy Request Accepted!',
    body: (fromName) => `${fromName} accepted your buddy request! Time to start crushing goals together!`
  },
  [NOTIFICATION_TYPES.BUDDY_REQUEST_DECLINED]: {
    title: 'Buddy Request Response',
    body: (fromName) => `${fromName} declined your buddy request.`
  },
  [NOTIFICATION_TYPES.CHALLENGE_RECEIVED]: {
    title: '⚡ New Challenge!',
    body: (fromName, challenge) => `${fromName} challenged you: ${challenge.substring(0, 50)}${challenge.length > 50 ? '...' : ''}`
  },
  [NOTIFICATION_TYPES.CHALLENGE_ACCEPTED]: {
    title: '💪 Challenge Accepted!',
    body: (fromName) => `${fromName} accepted your challenge! Game on!`
  },
  [NOTIFICATION_TYPES.CHALLENGE_DECLINED]: {
    title: 'Challenge Response',
    body: (fromName) => `${fromName} declined your challenge.`
  },
  [NOTIFICATION_TYPES.CHALLENGE_COMPLETED]: {
    title: '🏆 Challenge Completed!',
    body: (fromName) => `${fromName} completed your challenge! They crushed it!`
  },
  [NOTIFICATION_TYPES.ENCOURAGEMENT_RECEIVED]: {
    title: '💬 Encouragement from Buddy!',
    body: (fromName, message) => `${fromName}: ${message.substring(0, 60)}${message.length > 60 ? '...' : ''}`
  }
};

export const getNotificationMessage = (type, fromName, additionalData = null) => {
  const template = NOTIFICATION_MESSAGES[type];
  if (!template) {
    return {
      title: 'Atlas Fitness',
      body: 'You have a new notification'
    };
  }
  
  return {
    title: template.title,
    body: typeof template.body === 'function' 
      ? template.body(fromName, additionalData)
      : template.body
  };
};