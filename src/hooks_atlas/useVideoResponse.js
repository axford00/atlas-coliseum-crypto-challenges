// hooks_atlas/useVideoResponse.js - UPDATED to use unified service (Option B)
import { getAuth } from 'firebase/auth';
import { useState } from 'react';
import { Alert } from 'react-native';
// ✅ Import your unified service
import unifiedVideoService from '../services/unifiedVideoResponseService';

export const useVideoResponse = (challenge, setChallenge, setMyVideoResponse) => {
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const auth = getAuth();
  const user = auth.currentUser;

  // ✅ HYBRID: Use unified service for Firebase operations, keep your UI logic
  const handleVideoRecorded = async (videoData) => {
    if (!videoData) return;

    try {
      console.log('🚀 [HYBRID] Starting video recording process with unified service');
      
      setIsSubmittingResponse(true);
      setUploadProgress(10);
      
      // ✅ STEP 1: Validate input
      if (!videoData.uri) {
        throw new Error('Video URI is required');
      }

      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      if (!challenge?.id) {
        throw new Error('Challenge ID is required');
      }

      console.log('✅ [HYBRID] Validation passed, submitting via unified service');
      setUploadProgress(30);
      
      // ✅ STEP 2: Use unified service for Firebase operations
      const result = await unifiedVideoService.submitVideoResponse(
        challenge.id,
        videoData,
        videoData.isPublic || false
      );

      console.log('✅ [HYBRID] Unified service result:', result);
      setUploadProgress(90);
      
      if (!result.success) {
        throw new Error('Unified service submission failed');
      }

      // ✅ STEP 3: Update local state (your existing logic)
      const challengeUpdateData = {
        status: 'response_submitted',
        responseSubmittedAt: new Date(),
        responseSubmittedBy: user.uid,
        responseType: 'video',
        responseId: result.responseId,
        hasResponse: true,
        hasVideoResponse: true,
        
        // ✅ NEW: Add response data for immediate access
        responseData: {
          id: result.responseId,
          type: 'video',
          videoUrl: result.videoUrl,
          thumbnailUrl: result.thumbnailUrl,
          duration: videoData.duration,
          isPublic: videoData.isPublic || false,
          submittedAt: new Date().toISOString(),
          responderId: user.uid,
          responderName: user.displayName || user.email?.split('@')[0] || 'User'
        },
        
        // ✅ LEGACY: Keep for compatibility with existing code
        videoResponse: {
          uri: videoData.uri,
          url: result.videoUrl,
          duration: videoData.duration,
          fileSize: videoData.fileSize,
          isPublic: videoData.isPublic || false,
          responseId: result.responseId,
          thumbnailUrl: result.thumbnailUrl
        }
      };

      setChallenge(prev => ({
        ...prev,
        ...challengeUpdateData
      }));

      setMyVideoResponse({
        id: result.responseId,
        challengeId: challenge.id,
        challengeCreatorId: challenge.from,
        challengeCreatorName: challenge.fromName,
        responderId: user.uid,
        responderName: user.displayName || user.email?.split('@')[0] || 'User',
        responseType: 'video',
        videoUrl: result.videoUrl,
        thumbnailUrl: result.thumbnailUrl,
        videoDuration: videoData.duration,
        isPublic: videoData.isPublic || false,
        status: 'pending',
        createdAt: new Date(),
        timestamp: new Date().toISOString(),
        challengeText: challenge.challenge
      });

      setUploadProgress(100);

      // ✅ STEP 4: Show success message (your existing logic)
      const successMessage = result.thumbnailUrl 
        ? 'Your video response with thumbnail has been sent!'
        : 'Your video response has been sent!';
      
      Alert.alert(
        'Video Response Submitted! 🎬', 
        `${successMessage} ${challenge.fromName} will review it and mark the challenge as complete.${videoData.isPublic ? '\n\n✨ Your public video is now live in The Coliseum!' : ''}`
      );
      
      console.log('🎉 [HYBRID] Video recording process completed successfully');
      
    } catch (error) {
      console.error('❌ [HYBRID] CRITICAL ERROR in handleVideoRecorded:', error);
      
      // ✅ Enhanced error reporting (your existing logic)
      let errorMessage = 'Unknown error occurred';
      if (error.message.includes('not authenticated')) {
        errorMessage = 'Please log in again and try again.';
      } else if (error.message.includes('Video URI')) {
        errorMessage = 'Video recording failed. Please try recording again.';
      } else if (error.message.includes('upload')) {
        errorMessage = 'Video upload failed. Check your internet connection and try again.';
      } else if (error.message.includes('submission failed')) {
        errorMessage = 'Could not save video response. Please try again.';
      } else {
        errorMessage = error.message;
      }
      
      Alert.alert(
        'Video Submission Failed', 
        `Error: ${errorMessage}\n\nPlease try again or contact support if the problem persists.`
      );
    } finally {
      setIsSubmittingResponse(false);
      setUploadProgress(0);
      console.log('🏁 [HYBRID] Video recording process complete');
    }
  };

  // ✅ HYBRID: Use unified service for privacy toggle
  const toggleVideoPrivacy = async (responseId) => {
    try {
      setIsSubmittingResponse(true);
      
      console.log('🔒 [HYBRID] Toggling video privacy via unified service:', responseId);
      
      // ✅ Use unified service for Firebase operations
      await unifiedVideoService.toggleVideoPrivacy(responseId, challenge.id);
      
      // ✅ Update local state
      setMyVideoResponse(prev => {
        if (!prev) return prev;
        
        const newIsPublic = !prev.isPublic;
        
        const message = newIsPublic 
          ? '🌍 Your video is now public! It will appear in The Coliseum for all warriors to see.'
          : '🔒 Your video is now private. Only you and the challenger can view it.';
        
        Alert.alert('Privacy Updated! ✨', message);
        
        return {
          ...prev,
          isPublic: newIsPublic
        };
      });
      
      // ✅ Also update challenge state
      setChallenge(prev => ({
        ...prev,
        responseData: {
          ...prev.responseData,
          isPublic: !prev.responseData?.isPublic
        },
        videoResponse: {
          ...prev.videoResponse,
          isPublic: !prev.videoResponse?.isPublic
        }
      }));
      
    } catch (error) {
      console.error('❌ [HYBRID] Error updating video privacy:', error);
      Alert.alert('Error', 'Failed to update video privacy. Please try again.');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  return {
    handleVideoRecorded,
    toggleVideoPrivacy,
    isSubmittingResponse,
    uploadProgress
  };
};