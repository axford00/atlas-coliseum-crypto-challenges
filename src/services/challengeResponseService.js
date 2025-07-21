// src/services/challengeResponseService.js - CREATE THIS NEW FILE
import { getStorage } from '../firebase';
import { getDb } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';

class ChallengeResponseService {
  async submitVideoResponse(challengeId, videoData, userId) {
    try {
      console.log('📤 [RESPONSE] Starting video response submission');
      console.log('📤 [RESPONSE] Challenge ID:', challengeId);
      console.log('📤 [RESPONSE] User ID:', userId);
      
      // 1. Upload video to Firebase Storage
      const videoUrl = await this.uploadVideo(challengeId, videoData.uri, userId);
      console.log('✅ [RESPONSE] Video uploaded to:', videoUrl);
      
      // 2. Update challenge document with response
      await this.updateChallengeWithResponse(challengeId, {
        videoUrl,
        userId,
        duration: videoData.duration,
        fileSize: videoData.fileSize,
        submittedAt: new Date().toISOString(),
        ...videoData
      });
      
      console.log('✅ [RESPONSE] Video response submitted successfully');
      return {
        success: true,
        videoUrl,
        challengeId
      };
      
    } catch (error) {
      console.error('❌ [RESPONSE] Video submission failed:', error);
      throw error;
    }
  }

  async uploadVideo(challengeId, videoUri, userId) {
    try {
      const storage = getStorage();
      if (!storage) {
        throw new Error('Firebase Storage not available');
      }

      console.log('📹 [RESPONSE] Uploading video...');
      
      // Create unique filename with timestamp
      const timestamp = Date.now();
      const filename = `response_${challengeId}_${userId}_${timestamp}.mp4`;
      
      // Create storage reference
      const videoRef = ref(storage, `challenge_responses/${challengeId}/${filename}`);
      
      // Convert URI to blob
      const response = await fetch(videoUri);
      const blob = await response.blob();
      
      console.log('📹 [RESPONSE] Blob size:', blob.size);
      
      // Upload to Firebase Storage
      const snapshot = await uploadBytes(videoRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('✅ [RESPONSE] Video uploaded successfully');
      return downloadURL;
      
    } catch (error) {
      console.error('❌ [RESPONSE] Video upload failed:', error);
      throw error;
    }
  }

  async updateChallengeWithResponse(challengeId, responseData) {
    try {
      const db = getDb();
      if (!db) {
        throw new Error('Firestore not available');
      }

      console.log('🔄 [RESPONSE] Updating challenge document...');
      
      const challengeRef = doc(db, 'challenges', challengeId);
      
      // CRITICAL: Update challenge status and response data
      const updateData = {
        status: 'response_submitted',
        hasVideoResponse: true,
        responseData: {
          videoUrl: responseData.videoUrl,
          userId: responseData.userId,
          duration: responseData.duration,
          fileSize: responseData.fileSize,
          submittedAt: serverTimestamp(),
          timestamp: responseData.timestamp || new Date().toISOString()
        },
        // Force real-time update
        updatedAt: serverTimestamp(),
        lastModified: Date.now()
      };
      
      await updateDoc(challengeRef, updateData);
      
      console.log('✅ [RESPONSE] Challenge updated with response data');
      
      // Verify the update worked
      const updatedDoc = await getDoc(challengeRef);
      if (updatedDoc.exists()) {
        const data = updatedDoc.data();
        console.log('🔍 [RESPONSE] Verification - Status:', data.status);
        console.log('🔍 [RESPONSE] Verification - Has video:', data.hasVideoResponse);
      }
      
    } catch (error) {
      console.error('❌ [RESPONSE] Challenge update failed:', error);
      throw error;
    }
  }

  async getResponseData(challengeId) {
    try {
      const db = getDb();
      if (!db) {
        throw new Error('Firestore not available');
      }

      const challengeRef = doc(db, 'challenges', challengeId);
      const challengeDoc = await getDoc(challengeRef);
      
      if (!challengeDoc.exists()) {
        throw new Error('Challenge not found');
      }
      
      const data = challengeDoc.data();
      return data.responseData || null;
      
    } catch (error) {
      console.error('❌ [RESPONSE] Failed to get response data:', error);
      return null;
    }
  }
}

export default new ChallengeResponseService();