// src/utils/timestamp.js - CREATE THIS NEW FILE
// Utility for consistent timestamp handling
import { Timestamp } from 'firebase/firestore';

/**
 * Creates a consistent server timestamp for all video submissions
 * @returns {Timestamp} Firebase server timestamp
 */
export const createServerTimestamp = () => {
  return Timestamp.now();
};

/**
 * Formats timestamp for consistent display across the app
 * @param {Timestamp|Date|string} timestamp 
 * @returns {string} Formatted time string
 */
export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Just now';
  
  try {
    const now = new Date();
    let videoTime;
    
    // Handle different timestamp formats
    if (timestamp.toDate) {
      // Firebase Timestamp
      videoTime = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      videoTime = timestamp;
    } else {
      // String timestamp
      videoTime = new Date(timestamp);
    }
    
    // Validate the date
    if (isNaN(videoTime.getTime())) {
      return 'Recently';
    }
    
    const diffMs = now - videoTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 30000) { // Less than 30 seconds
      return 'Just now';
    } else if (diffMins < 1) {
      return 'Less than a minute ago';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      // For older videos, show actual date
      return videoTime.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: videoTime.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Recently';
  }
};

/**
 * Example usage in video submission:
 * 
 * // In your video submission function
 * import { createServerTimestamp } from '../utils/timestamp';
 * 
 * const videoResponse = {
 *   challengeId: challengeId,
 *   responderId: user.uid,
 *   responderName: user.displayName,
 *   responseType: 'video',
 *   videoUrl: uploadUrl,
 *   thumbnailUrl: thumbnailUrl,
 *   videoDuration: duration,
 *   isPublic: isPublic,
 *   status: 'pending',
 *   createdAt: createServerTimestamp(), // ← Use this for accurate timestamps
 *   challengeCreatorId: challenge.from,
 *   challengeCreatorName: challenge.fromName
 * };
 */

// Alternative approach using serverTimestamp() for real-time accuracy
import { serverTimestamp } from 'firebase/firestore';

/**
 * Use Firebase server timestamp for most accurate time recording
 * This ensures all timestamps are based on server time, not device time
 */
export const getServerTimestamp = () => {
  return serverTimestamp();
};

/**
 * Updated video response creation with server timestamp
 */
export const createVideoResponse = (challengeData, videoData, userData) => {
  return {
    challengeId: challengeData.id,
    challengeCreatorId: challengeData.from,
    challengeCreatorName: challengeData.fromName,
    responderId: userData.uid,
    responderName: userData.displayName || userData.email,
    responseType: 'video',
    videoUrl: videoData.uploadUrl,
    thumbnailUrl: videoData.thumbnailUrl,
    videoDuration: videoData.duration,
    isPublic: videoData.isPublic,
    status: 'pending',
    createdAt: getServerTimestamp(), // ← Server timestamp for accuracy
    
    // Optional: Add timezone info for debugging
    submittedFromTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    
    // Optional: Device timestamp for comparison/debugging
    deviceTimestamp: new Date().toISOString()
  };
};