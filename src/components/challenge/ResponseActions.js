// components/challenge/ResponseActions.js - UPDATED to work with unified service
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal
} from 'react-native';
import { colors } from '../../theme/colors';
import VideoRecordingModal from '../VideoRecordingModal';

const ResponseActions = ({ 
  challenge, 
  onSubmitResponse, 
  isSubmitting = false 
}) => {
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);

  const handleStartVideoResponse = () => {
    console.log('📹 Starting video response for challenge:', challenge.id);
    setShowVideoRecorder(true);
  };

  // ✅ UPDATED: Handle video recording with proper data structure
  const handleVideoRecorded = async (videoData) => {
    try {
      console.log('📹 Video recorded successfully:', {
        hasUri: !!videoData.uri,
        duration: videoData.duration,
        fileSize: videoData.fileSize
      });
      
      setShowVideoRecorder(false);

      // Show privacy selection after recording
      Alert.alert(
        '🎬 Video Recorded!',
        'Great! Now choose how you want to share your response:',
        [
          { 
            text: '🔒 Private Response', 
            onPress: () => submitVideoResponse(videoData, false),
            style: 'default'
          },
          { 
            text: '🏛️ Public in Coliseum', 
            onPress: () => submitVideoResponse(videoData, true),
            style: 'default' 
          },
          { 
            text: '❌ Cancel', 
            style: 'cancel',
            onPress: () => setShowVideoRecorder(true) // Let them try again
          }
        ]
      );
    } catch (error) {
      console.error('❌ Error handling recorded video:', error);
      Alert.alert('Error', 'Failed to process video recording. Please try again.');
    }
  };

  // ✅ UPDATED: Submit video with proper data structure
  const submitVideoResponse = async (videoData, isPublic) => {
    try {
      console.log('📤 [RESPONSE_ACTIONS] Submitting video response:', { 
        challengeId: challenge.id, 
        isPublic,
        hasVideo: !!videoData,
        uri: videoData.uri
      });

      // ✅ CRITICAL: Create proper video data structure for unified service
      const enhancedVideoData = {
        uri: videoData.uri,
        duration: videoData.duration || 0,
        fileSize: videoData.fileSize || 0,
        isPublic: isPublic,
        timestamp: new Date().toISOString(),
        // Add any additional metadata
        recordingDate: new Date().toISOString(),
        challengeId: challenge.id
      };

      console.log('📤 [RESPONSE_ACTIONS] Enhanced video data:', enhancedVideoData);

      // Call the unified submission handler
      await onSubmitResponse(enhancedVideoData);

      // Success message will be shown by the handler
      console.log('✅ [RESPONSE_ACTIONS] Video response submitted successfully');

    } catch (error) {
      console.error('❌ [RESPONSE_ACTIONS] Error submitting video response:', error);
      Alert.alert(
        'Submission Error', 
        `Failed to submit video response: ${error.message}\n\nPlease try again.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleQuickTextCompletion = () => {
    Alert.alert(
      '📝 Quick Text Update',
      'Send a quick completion message:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: '✅ Challenge Completed!', 
          onPress: () => {
            const responseData = {
              challengeId: challenge.id,
              responseType: 'text_completion',
              message: 'Challenge completed successfully!',
              submittedAt: new Date().toISOString(),
              isPublic: false // Text responses are private by default
            };
            onSubmitResponse(responseData);
          }
        }
      ]
    );
  };

  const getTimeRemaining = () => {
    if (!challenge?.dueDate) return 'No deadline';
    
    const now = new Date();
    const due = new Date(challenge.dueDate);
    const timeLeft = due.getTime() - now.getTime();
    
    if (timeLeft <= 0) return 'EXPIRED';
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const isExpired = () => {
    if (!challenge?.dueDate) return false;
    const now = new Date();
    const due = new Date(challenge.dueDate);
    return now > due;
  };

  const hasCrypto = challenge?.wagerAmount > 0;
  const timeRemaining = getTimeRemaining();
  const expired = isExpired();

  return (
    <View style={styles.container}>
      {/* Challenge Status Header */}
      <View style={styles.statusHeader}>
        <Text style={styles.statusTitle}>⚡ CHALLENGE IS LIVE</Text>
        <View style={[
          styles.timeChip,
          expired && styles.expiredChip
        ]}>
          <Text style={[
            styles.timeText,
            expired && styles.expiredText
          ]}>
            ⏰ {timeRemaining}
          </Text>
        </View>
      </View>

      {/* Challenge Details */}
      <View style={styles.challengeInfo}>
        <Text style={styles.challengeText}>{challenge?.challenge}</Text>
        
        {hasCrypto && (
          <View style={styles.cryptoInfo}>
            <Text style={styles.cryptoText}>
              💰 {challenge.wagerAmount} {challenge.wagerToken} at stake
            </Text>
            <Text style={styles.cryptoSubtext}>
              Winner receives: ${(challenge.wagerAmount * 2 * 0.975).toFixed(2)} {challenge.wagerToken}
            </Text>
          </View>
        )}
      </View>

      {/* Main Action Section */}
      <View style={styles.actionSection}>
        <Text style={styles.actionTitle}>🏆 SUBMIT YOUR PROOF</Text>
        
        {/* Primary Action: Video Response */}
        <TouchableOpacity 
          style={[
            styles.primaryButton, 
            (expired || isSubmitting) && styles.disabledButton
          ]}
          onPress={handleStartVideoResponse}
          disabled={isSubmitting || expired}
        >
          <Text style={styles.primaryButtonIcon}>🎬</Text>
          <View style={styles.buttonTextContainer}>
            <Text style={styles.primaryButtonText}>
              {isSubmitting ? 'Processing...' : 'Record Video Response'}
            </Text>
            <Text style={styles.primaryButtonSubtext}>
              Film yourself completing the challenge
            </Text>
          </View>
          <Text style={styles.buttonArrow}>→</Text>
        </TouchableOpacity>

        {/* Secondary Action: Quick Text */}
        <TouchableOpacity 
          style={[
            styles.secondaryButton, 
            (expired || isSubmitting) && styles.disabledButton
          ]}
          onPress={handleQuickTextCompletion}
          disabled={isSubmitting || expired}
        >
          <Text style={styles.secondaryButtonText}>
            📝 Quick Text Completion
          </Text>
        </TouchableOpacity>

        {/* Privacy Information */}
        <View style={styles.privacyNote}>
          <Text style={styles.privacyText}>
            🔒 You'll choose privacy settings after recording
          </Text>
          <Text style={styles.privacySubtext}>
            Share privately with challenger or publicly in The Coliseum
          </Text>
        </View>
      </View>

      {/* Crypto Challenge Warning */}
      {hasCrypto && !expired && (
        <View style={styles.cryptoWarning}>
          <Text style={styles.warningTitle}>💰 CRYPTO CHALLENGE ACTIVE</Text>
          <Text style={styles.warningText}>
            Complete before expiry or funds return to challenger
          </Text>
        </View>
      )}

      {/* Expired Warning */}
      {expired && (
        <View style={styles.expiredWarning}>
          <Text style={styles.expiredWarningTitle}>⏰ CHALLENGE EXPIRED</Text>
          <Text style={styles.expiredWarningText}>
            {hasCrypto 
              ? 'Time limit reached. Crypto funds will return to challenger.'
              : 'Challenge time limit has been reached.'
            }
          </Text>
        </View>
      )}

      {/* ✅ UPDATED: Video Recording Modal with proper error handling */}
      <VideoRecordingModal
        visible={showVideoRecorder}
        onClose={() => {
          console.log('📹 [RESPONSE_ACTIONS] Video recording modal closed');
          setShowVideoRecorder(false);
        }}
        onVideoRecorded={handleVideoRecorded}
        challenge={challenge}
        isSubmitting={isSubmitting}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.overlay,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },

  // Status Header
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 1,
  },
  timeChip: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  expiredChip: {
    backgroundColor: '#ff4444' + '20',
    borderColor: '#ff4444',
  },
  timeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
  },
  expiredText: {
    color: '#ff4444',
  },

  // Challenge Info
  challengeInfo: {
    marginBottom: 20,
  },
  challengeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
    lineHeight: 24,
  },
  cryptoInfo: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ff6b35',
  },
  cryptoText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff6b35',
    marginBottom: 4,
  },
  cryptoSubtext: {
    fontSize: 12,
    color: colors.text.secondary,
  },

  // Action Section
  actionSection: {
    marginBottom: 15,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 15,
    textAlign: 'center',
    letterSpacing: 1,
  },

  // Primary Button (Video)
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: colors.ui.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  primaryButtonIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  buttonTextContainer: {
    flex: 1,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background.dark,
    marginBottom: 2,
  },
  primaryButtonSubtext: {
    fontSize: 12,
    color: colors.background.dark + '80',
  },
  buttonArrow: {
    fontSize: 20,
    color: colors.background.dark,
    fontWeight: 'bold',
  },

  // Secondary Button
  secondaryButton: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.primary,
  },

  // Privacy Note
  privacyNote: {
    alignItems: 'center',
  },
  privacyText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 2,
    textAlign: 'center',
  },
  privacySubtext: {
    fontSize: 10,
    color: colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Crypto Warning
  cryptoWarning: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ff4444',
    alignItems: 'center',
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ff4444',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 11,
    color: '#ff4444',
    textAlign: 'center',
  },

  // Expired Warning
  expiredWarning: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#888',
    alignItems: 'center',
  },
  expiredWarningTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 4,
  },
  expiredWarningText: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
  },
});

export default ResponseActions;