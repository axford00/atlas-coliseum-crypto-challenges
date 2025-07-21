// src/utils/videoThumbnails.js - Video thumbnail generation utilities
import { getThumbnailAsync } from 'expo-video-thumbnails';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../firebase';

/**
 * Generates a thumbnail from a video file
 * @param {string} videoUri - Local video file URI
 * @param {Object} options - Thumbnail generation options
 * @returns {Promise<string>} - Local thumbnail URI
 */
export const generateVideoThumbnail = async (videoUri, options = {}) => {
  try {
    const defaultOptions = {
      time: 1000, // 1 second into video
      quality: 0.8, // High quality
      ...options
    };

    console.log('Generating thumbnail for video:', videoUri);
    
    const { uri } = await getThumbnailAsync(videoUri, defaultOptions);
    
    console.log('Thumbnail generated successfully:', uri);
    return uri;
    
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw new Error('Failed to generate video thumbnail');
  }
};

/**
 * Uploads thumbnail to Firebase Storage
 * @param {string} thumbnailUri - Local thumbnail file URI  
 * @param {string} videoId - Unique video identifier
 * @param {string} userId - User ID for organizing storage
 * @returns {Promise<string>} - Firebase Storage download URL
 */
export const uploadThumbnailToFirebase = async (thumbnailUri, videoId, userId) => {
  try {
    console.log('Uploading thumbnail to Firebase:', thumbnailUri);
    
    // Create storage reference
    const thumbnailRef = ref(storage, `thumbnails/${userId}/${videoId}.jpg`);
    
    // Convert thumbnail to blob
    const response = await fetch(thumbnailUri);
    const blob = await response.blob();
    
    // Upload thumbnail
    const snapshot = await uploadBytes(thumbnailRef, blob);
    console.log('Thumbnail uploaded successfully');
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Thumbnail download URL:', downloadURL);
    
    return downloadURL;
    
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    throw new Error('Failed to upload thumbnail to Firebase');
  }
};

/**
 * Generates thumbnail and uploads to Firebase in one step
 * @param {string} videoUri - Local video file URI
 * @param {string} videoId - Unique video identifier  
 * @param {string} userId - User ID for organizing storage
 * @param {Object} options - Thumbnail generation options
 * @returns {Promise<string>} - Firebase Storage thumbnail URL
 */
export const generateAndUploadThumbnail = async (videoUri, videoId, userId, options = {}) => {
  try {
    // Generate thumbnail locally
    const thumbnailUri = await generateVideoThumbnail(videoUri, options);
    
    // Upload to Firebase Storage
    const thumbnailUrl = await uploadThumbnailToFirebase(thumbnailUri, videoId, userId);
    
    return thumbnailUrl;
    
  } catch (error) {
    console.error('Error in generateAndUploadThumbnail:', error);
    throw error;
  }
};

/**
 * Fallback function to get a default thumbnail
 * @returns {string} - Default thumbnail placeholder
 */
export const getDefaultThumbnail = () => {
  // Return a default placeholder or gradient
  return null; // We'll handle this in the UI with a styled placeholder
};