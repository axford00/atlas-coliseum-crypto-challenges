// src/services/videoThumbnailService.js - Optimized for your Coliseum
import { doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../../firebase';

class VideoThumbnailService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Generate thumbnail from video URI (main method)
   */
  async generateThumbnail(videoUri, videoId) {
    console.log('🎬 Generating thumbnail for Coliseum video:', videoId);
    
    try {
      // Check cache first
      if (this.cache.has(videoId)) {
        return this.cache.get(videoId);
      }

      // Try expo-video-thumbnails first
      let thumbnailUri = await this.tryExpoThumbnails(videoUri);
      
      if (thumbnailUri) {
        // Upload to Firebase Storage
        const uploadedUrl = await this.uploadToStorage(thumbnailUri, videoId);
        this.cache.set(videoId, uploadedUrl);
        return uploadedUrl;
      } else {
        // Return Atlas Fitness branded fallback
        const fallbackUrl = this.getAtlasFallback();
        this.cache.set(videoId, fallbackUrl);
        return fallbackUrl;
      }
      
    } catch (error) {
      console.error('❌ Thumbnail generation failed:', error);
      return this.getAtlasFallback();
    }
  }

  /**
   * Try expo-video-thumbnails
   */
  async tryExpoThumbnails(videoUri) {
    try {
      // Check if running in Expo environment
      if (typeof expo !== 'undefined' || global.__expo) {
        const { VideoThumbnails } = require('expo-video-thumbnails');
        
        const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
          time: 1500, // 1.5 seconds in for better frame
          quality: 0.7, // Good balance of quality vs file size
        });
        
        console.log('✅ Expo thumbnail generated');
        return uri;
      }
      return null;
    } catch (error) {
      console.log('⚠️ Expo thumbnails not available:', error.message);
      return null;
    }
  }

  /**
   * Upload thumbnail to Firebase Storage
   */
  async uploadToStorage(thumbnailUri, videoId) {
    try {
      const response = await fetch(thumbnailUri);
      const blob = await response.blob();
      
      const thumbnailRef = ref(storage, `coliseum/thumbnails/${videoId}.jpg`);
      const snapshot = await uploadBytes(thumbnailRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('✅ Thumbnail uploaded to Firebase Storage');
      return downloadURL;
      
    } catch (error) {
      console.error('❌ Storage upload failed:', error);
      throw error;
    }
  }

  /**
   * Get Atlas Fitness branded fallback thumbnail
   */
  getAtlasFallback() {
    return 'data:image/svg+xml;base64,' + btoa(`
      <svg width="320" height="240" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="atlasBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#3BFFB9;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="320" height="240" fill="url(#atlasBg)"/>
        <circle cx="160" cy="120" r="35" fill="rgba(255,255,255,0.15)" stroke="white" stroke-width="3"/>
        <polygon points="145,100 145,140 185,120" fill="white"/>
        <text x="160" y="180" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">Challenge Victory</text>
        <text x="160" y="200" text-anchor="middle" fill="white" font-family="Arial" font-size="12">💪 Atlas Fitness Coliseum</text>
      </svg>
    `);
  }

  /**
   * Process all Coliseum videos without thumbnails
   */
  async processColiseumVideos(progressCallback) {
    try {
      const { collection, query, where, getDocs } = require('firebase/firestore');
      
      console.log('🏛️ Processing Coliseum videos...');
      
      // Query public videos without thumbnails
      const videosQuery = query(
        collection(db, 'challenge_responses'),
        where('responseType', '==', 'video'),
        where('isPublic', '==', true)
      );
      
      const snapshot = await getDocs(videosQuery);
      const videosToProcess = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        // Only process videos that don't have thumbnails or have failed thumbnails
        if (data.videoUrl && (!data.thumbnailUrl || data.thumbnailUrl.includes('data:image'))) {
          videosToProcess.push({
            id: doc.id,
            uri: data.videoUrl,
            ...data
          });
        }
      });
      
      console.log(`📹 Found ${videosToProcess.length} Coliseum videos to enhance`);
      
      if (videosToProcess.length === 0) {
        return 0;
      }
      
      // Process in small batches to avoid overwhelming
      const batchSize = 3;
      let processed = 0;
      
      for (let i = 0; i < videosToProcess.length; i += batchSize) {
        const batch = videosToProcess.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (video) => {
          try {
            const thumbnailUrl = await this.generateThumbnail(video.uri, video.id);
            await this.updateVideoThumbnail(video.id, thumbnailUrl);
            processed++;
            
            if (progressCallback) {
              progressCallback(processed, videosToProcess.length);
            }
            
          } catch (error) {
            console.error(`❌ Failed to process video ${video.id}:`, error);
          }
        }));
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log(`✅ Enhanced ${processed} Coliseum videos with thumbnails`);
      return processed;
      
    } catch (error) {
      console.error('❌ Error processing Coliseum videos:', error);
      return 0;
    }
  }

  /**
   * Update video document with thumbnail URL
   */
  async updateVideoThumbnail(videoId, thumbnailUrl) {
    try {
      const videoRef = doc(db, 'challenge_responses', videoId);
      await updateDoc(videoRef, {
        thumbnailUrl: thumbnailUrl,
        thumbnailGenerated: true,
        thumbnailGeneratedAt: new Date().toISOString()
      });
      
      console.log(`✅ Updated video ${videoId} with thumbnail`);
      
    } catch (error) {
      console.error('❌ Error updating video thumbnail:', error);
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Thumbnail cache cleared');
  }
}

export default new VideoThumbnailService();