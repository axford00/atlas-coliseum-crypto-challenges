// components/VideoRecordingModal.js - Video recording component for challenge responses
import { Video } from 'expo-av';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { colors } from '../theme/colors';
import FalloutButton from './ui/FalloutButton';

const { width, height } = Dimensions.get('window');

const VideoRecordingModal = ({ 
  visible, 
  onClose, 
  onVideoRecorded, 
  challengeTitle,
  isSubmitting = false 
}) => {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [cameraType, setCameraType] = useState('back'); // Use string instead of CameraType.back
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [maxRecordingTime] = useState(30); // 30 seconds max
  
  const cameraRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const progressAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      checkPermissions();
    }
    
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [visible]);

  const checkPermissions = async () => {
    if (!cameraPermission?.granted) {
      await requestCameraPermission();
    }
    if (!microphonePermission?.granted) {
      await requestMicrophonePermission();
    }
  };

  const hasPermissions = cameraPermission?.granted && microphonePermission?.granted;

  const startRecording = async () => {
    if (!cameraRef.current || isRecording || !hasPermissions) return;

    try {
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start progress animation
      progressAnimation.setValue(0);
      Animated.timing(progressAnimation, {
        toValue: 1,
        duration: maxRecordingTime * 1000,
        useNativeDriver: false,
      }).start();

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxRecordingTime) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);

      // Start camera recording
      const data = await cameraRef.current.recordAsync({
        quality: '720p',
        maxDuration: maxRecordingTime,
        mute: false,
      });
      
      if (data && data.uri) {
        console.log('Video recorded:', data.uri);
        setRecordedVideo(data);
      }

    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current || !isRecording) return;

    try {
      setIsRecording(false);
      
      // Clear timer and animation
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      progressAnimation.stopAnimation();

      // Stop camera recording
      await cameraRef.current.stopRecording();
      
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Recording Error', 'Failed to stop recording.');
    }
  };

  const retakeVideo = () => {
    setRecordedVideo(null);
    setRecordingTime(0);
    progressAnimation.setValue(0);
  };

  const submitVideo = async () => {
    if (!recordedVideo) {
      Alert.alert('Error', 'No video to submit');
      return;
    }

    try {
      // Get video file info
      const fileInfo = await FileSystem.getInfoAsync(recordedVideo.uri);
      
      if (!fileInfo.exists) {
        Alert.alert('Error', 'Video file not found');
        return;
      }

      // Create video response data
      const videoResponse = {
        uri: recordedVideo.uri,
        duration: recordingTime,
        isPublic: isPublic,
        fileSize: fileInfo.size,
        timestamp: new Date().toISOString()
      };

      console.log('Submitting video response:', videoResponse);
      
      // Call the parent callback with video data
      onVideoRecorded(videoResponse);
      
    } catch (error) {
      console.error('Error submitting video:', error);
      Alert.alert('Error', 'Failed to submit video response');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeRemaining = () => {
    return Math.max(0, maxRecordingTime - recordingTime);
  };

  const flipCamera = () => {
    setCameraType(cameraType === 'back' ? 'front' : 'back'); // Use strings instead of CameraType constants
  };

  if (!visible) return null;

  if (!cameraPermission || !microphonePermission) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Requesting permissions...</Text>
        </View>
      </Modal>
    );
  }

  if (!hasPermissions) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            We need camera and microphone access to record your challenge response video.
          </Text>
          <View style={styles.permissionButtons}>
            <FalloutButton
              text="GRANT PERMISSIONS"
              onPress={checkPermissions}
              style={styles.permissionButton}
            />
            <FalloutButton
              text="CLOSE"
              onPress={onClose}
              style={styles.permissionButton}
              type="secondary"
            />
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {recordedVideo ? 'Review Video' : (isRecording ? 'Recording...' : 'Record Response')}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Challenge Context */}
        <View style={styles.challengeContext}>
          <Text style={styles.challengeLabel}>Challenge:</Text>
          <Text style={styles.challengeText}>{challengeTitle}</Text>
        </View>

        {/* Camera/Video View */}
        <View style={styles.cameraContainer}>
          {recordedVideo ? (
            // Video Preview
            <Video
              source={{ uri: recordedVideo.uri }}
              style={styles.videoPreview}
              useNativeControls
              resizeMode="contain"
              shouldPlay={false}
            />
          ) : (
            // Camera View
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={cameraType}
              mode="video"
            />
          )}

          {/* Recording Overlay */}
          {isRecording && (
            <View style={styles.recordingOverlay}>
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>REC</Text>
              </View>
              
              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    {
                      width: progressAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              
              {/* Timer */}
              <View style={styles.timerContainer}>
                <Text style={styles.timerText}>
                  {formatTime(recordingTime)} / {formatTime(maxRecordingTime)}
                </Text>
                <Text style={styles.remainingText}>
                  {getTimeRemaining()}s remaining
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          {!recordedVideo ? (
            // Recording Controls
            <View style={styles.recordingControls}>
              {!isRecording && (
                <TouchableOpacity onPress={flipCamera} style={styles.flipButton}>
                  <Text style={styles.flipButtonText}>🔄</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                onPress={isRecording ? stopRecording : startRecording}
                style={[styles.recordButton, isRecording && styles.recordButtonRecording]}
                disabled={isSubmitting}
              >
                <View style={[styles.recordButtonInner, isRecording && styles.recordButtonInnerRecording]} />
              </TouchableOpacity>
              
              {!isRecording && (
                <View style={styles.recordingHint}>
                  <Text style={styles.recordingHintText}>
                    Tap to start recording (max 30s)
                  </Text>
                </View>
              )}
            </View>
          ) : (
            // Video Review Controls
            <View style={styles.reviewControls}>
              {/* Privacy Toggle */}
              <View style={styles.privacyContainer}>
                <Text style={styles.privacyLabel}>Video Privacy:</Text>
                <View style={styles.privacyToggle}>
                  <TouchableOpacity
                    onPress={() => setIsPublic(false)}
                    style={[styles.privacyOption, !isPublic && styles.privacyOptionActive]}
                  >
                    <Text style={[styles.privacyOptionText, !isPublic && styles.privacyOptionTextActive]}>
                      🔒 Private
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setIsPublic(true)}
                    style={[styles.privacyOption, isPublic && styles.privacyOptionActive]}
                  >
                    <Text style={[styles.privacyOptionText, isPublic && styles.privacyOptionTextActive]}>
                      🌍 Public
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.privacyDescription}>
                  {isPublic 
                    ? 'All Atlas users can see this video' 
                    : 'Only the challenger can see this video'
                  }
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.reviewButtons}>
                <FalloutButton
                  text="📹 RETAKE VIDEO"
                  onPress={retakeVideo}
                  style={styles.reviewButton}
                  type="secondary"
                />
                
                <FalloutButton
                  text={isSubmitting ? "SUBMITTING..." : "📤 SUBMIT RESPONSE"}
                  onPress={submitVideo}
                  style={styles.reviewButton}
                  isLoading={isSubmitting}
                />
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },

  // Permission States
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.dark,
    padding: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 15,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  permissionButtons: {
    gap: 15,
    width: '100%',
    maxWidth: 300,
  },
  permissionButton: {
    width: '100%',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: colors.background.overlay,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.ui.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 30,
  },

  // Challenge Context
  challengeContext: {
    backgroundColor: colors.background.overlay,
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border,
  },
  challengeLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 5,
  },
  challengeText: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: 'bold',
  },

  // Camera Container
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  videoPreview: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },

  // Recording Overlay
  recordingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,0,0,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: 8,
  },
  recordingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginTop: 20,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  timerContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  timerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  remainingText: {
    color: 'white',
    fontSize: 14,
    marginTop: 5,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  // Controls
  controlsContainer: {
    backgroundColor: colors.background.overlay,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },

  // Recording Controls
  recordingControls: {
    alignItems: 'center',
  },
  flipButton: {
    position: 'absolute',
    left: 20,
    top: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.ui.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButtonText: {
    fontSize: 20,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.ui.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  recordButtonRecording: {
    backgroundColor: '#ff4444',
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff4444',
  },
  recordButtonInnerRecording: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  recordingHint: {
    alignItems: 'center',
  },
  recordingHintText: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
  },

  // Review Controls
  reviewControls: {
    gap: 20,
  },
  privacyContainer: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  privacyLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 15,
  },
  privacyToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.ui.border,
    marginBottom: 10,
  },
  privacyOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.background.dark,
    alignItems: 'center',
  },
  privacyOptionActive: {
    backgroundColor: colors.primary,
  },
  privacyOptionText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: 'bold',
  },
  privacyOptionTextActive: {
    color: colors.text.primary,
  },
  privacyDescription: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Review Buttons
  reviewButtons: {
    gap: 15,
  },
  reviewButton: {
    marginBottom: 5,
  },
});

export default VideoRecordingModal;