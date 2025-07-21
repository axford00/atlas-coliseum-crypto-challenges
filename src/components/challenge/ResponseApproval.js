// src/components/challenge/ResponseApproval.js - ENHANCED VIDEO VIEWING
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Image
} from 'react-native';
import { colors } from '../../theme/colors';

const ResponseApproval = ({ 
  challenge, 
  challengeResponse, 
  onApprove, 
  isSubmitting = false 
}) => {
  const [showVideoModal, setShowVideoModal] = useState(false);

  const handleApproveResponse = () => {
    Alert.alert(
      '🏆 Approve Challenge Completion?',
      `Review the submitted proof and confirm if ${challenge.toName} successfully completed the challenge.\n\n` +
      `Challenge: "${challenge.challenge}"\n\n` +
      (challenge.wagerAmount > 0 
        ? `💰 This will release ${(challenge.wagerAmount * 2 * 0.975).toFixed(2)} ${challenge.wagerToken} to the winner.`
        : 'This will mark the challenge as completed.'
      ),
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: '❌ Reject', 
          style: 'destructive',
          onPress: () => handleRejectResponse()
        },
        { 
          text: '✅ Approve', 
          style: 'default',
          onPress: () => onApprove(true)
        }
      ]
    );
  };

  const handleRejectResponse = () => {
    Alert.alert(
      '❌ Reject Response?',
      'This will ask them to try the challenge again. Are you sure the submitted proof doesn\'t meet the requirements?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Ask for Retry', 
          style: 'destructive',
          onPress: () => onApprove(false)
        }
      ]
    );
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Recently';
    const now = new Date();
    const submitted = new Date(timestamp);
    const diffMs = now - submitted;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return submitted.toLocaleDateString();
  };

  const responseType = challengeResponse?.responseType || 'video_completion';
  const isVideoResponse = responseType === 'video_completion';
  const hasCrypto = challenge?.wagerAmount > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 REVIEW RESPONSE</Text>
        <View style={styles.timeChip}>
          <Text style={styles.timeText}>
            📤 {getTimeAgo(challengeResponse?.submittedAt)}
          </Text>
        </View>
      </View>

      {/* Challenge Info */}
      <View style={styles.challengeInfo}>
        <Text style={styles.challengeText}>{challenge?.challenge}</Text>
        <Text style={styles.responderText}>
          Response from: <Text style={styles.responderName}>{challenge.toName}</Text>
        </Text>
      </View>

      {/* Response Preview */}
      <View style={styles.responseSection}>
        <Text style={styles.responseTitle}>📹 SUBMITTED PROOF</Text>
        
        {isVideoResponse ? (
          <TouchableOpacity 
            style={styles.videoPreview}
            onPress={() => setShowVideoModal(true)}
          >
            {/* Video Thumbnail Placeholder */}
            <View style={styles.videoThumbnail}>
              <Text style={styles.playIcon}>▶️</Text>
              <Text style={styles.videoLabel}>Tap to View Video Response</Text>
            </View>
            
            <View style={styles.videoInfo}>
              <Text style={styles.videoType}>
                {challengeResponse?.isPublic ? '🏛️ Public in Coliseum' : '🔒 Private Response'}
              </Text>
              <Text style={styles.videoSubtext}>
                Video proof of challenge completion
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.textResponse}>
            <Text style={styles.textResponseContent}>
              {challengeResponse?.message || 'Challenge completed!'}
            </Text>
          </View>
        )}
      </View>

      {/* Crypto Stakes Info */}
      {hasCrypto && (
        <View style={styles.cryptoSection}>
          <Text style={styles.cryptoTitle}>💰 CRYPTO STAKES</Text>
          <View style={styles.cryptoDetails}>
            <Text style={styles.cryptoText}>
              Total Pot: {challenge.wagerAmount * 2} {challenge.wagerToken}
            </Text>
            <Text style={styles.cryptoText}>
              Winner Gets: {(challenge.wagerAmount * 2 * 0.975).toFixed(2)} {challenge.wagerToken}
            </Text>
            <Text style={styles.cryptoFee}>
              Atlas Fee: {(challenge.wagerAmount * 2 * 0.025).toFixed(2)} {challenge.wagerToken}
            </Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <Text style={styles.actionTitle}>🤔 YOUR DECISION</Text>
        
        <TouchableOpacity 
          style={[styles.approveButton, isSubmitting && styles.disabledButton]}
          onPress={handleApproveResponse}
          disabled={isSubmitting}
        >
          <Text style={styles.approveButtonText}>
            {isSubmitting ? 'Processing...' : '✅ Approve & Release Funds'}
          </Text>
          <Text style={styles.approveButtonSubtext}>
            Challenge completed successfully
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.rejectButton, isSubmitting && styles.disabledButton]}
          onPress={handleRejectResponse}
          disabled={isSubmitting}
        >
          <Text style={styles.rejectButtonText}>❌ Request Better Proof</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsSection}>
        <Text style={styles.instructionsText}>
          💡 Review the submitted proof carefully. Only approve if the challenge was genuinely completed as specified.
        </Text>
      </View>

      {/* Video Viewing Modal */}
      {showVideoModal && (
        <Modal
          visible={showVideoModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowVideoModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.videoModal}>
              <View style={styles.videoModalHeader}>
                <Text style={styles.videoModalTitle}>📹 Video Response</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowVideoModal(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.videoModalContent}>
                <Text style={styles.videoModalChallenge}>
                  Challenge: "{challenge.challenge}"
                </Text>
                
                {/* Video Player Placeholder */}
                <View style={styles.videoPlayerPlaceholder}>
                  <Text style={styles.videoPlayerText}>🎬 VIDEO PLAYER</Text>
                  <Text style={styles.videoPlayerSubtext}>
                    Video integration coming soon
                  </Text>
                  <Text style={styles.videoPlayerDetails}>
                    Response Type: {challengeResponse?.isPublic ? 'Public' : 'Private'}
                  </Text>
                </View>
                
                {/* Quick Actions */}
                <View style={styles.videoModalActions}>
                  <TouchableOpacity 
                    style={styles.quickApproveButton}
                    onPress={() => {
                      setShowVideoModal(false);
                      handleApproveResponse();
                    }}
                  >
                    <Text style={styles.quickApproveText}>✅ Approve</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.quickRejectButton}
                    onPress={() => {
                      setShowVideoModal(false);
                      handleRejectResponse();
                    }}
                  >
                    <Text style={styles.quickRejectText}>❌ Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
    borderColor: '#FF9800',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
    letterSpacing: 1,
  },
  timeChip: {
    backgroundColor: '#FF9800' + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  timeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FF9800',
  },

  // Challenge Info
  challengeInfo: {
    marginBottom: 20,
  },
  challengeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  responderText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  responderName: {
    fontWeight: 'bold',
    color: colors.text.primary,
  },

  // Response Section
  responseSection: {
    marginBottom: 20,
  },
  responseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  
  // Video Preview
  videoPreview: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 12,
    padding: 15,
    borderWidth: 2,
    borderColor: colors.ui.border,
  },
  videoThumbnail: {
    alignItems: 'center',
    marginBottom: 10,
  },
  playIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  videoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
  },
  videoInfo: {
    alignItems: 'center',
  },
  videoType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  videoSubtext: {
    fontSize: 11,
    color: colors.text.secondary,
  },

  // Text Response
  textResponse: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  textResponseContent: {
    fontSize: 14,
    color: colors.text.primary,
    textAlign: 'center',
  },

  // Crypto Section
  cryptoSection: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ff6b35',
  },
  cryptoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff6b35',
    textAlign: 'center',
    marginBottom: 10,
  },
  cryptoDetails: {
    alignItems: 'center',
  },
  cryptoText: {
    fontSize: 13,
    color: colors.text.primary,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  cryptoFee: {
    fontSize: 11,
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
    textAlign: 'center',
    marginBottom: 15,
  },
  
  // Buttons
  approveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  approveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  approveButtonSubtext: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  rejectButton: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff4444',
  },
  disabledButton: {
    backgroundColor: colors.ui.border,
    elevation: 0,
    shadowOpacity: 0,
  },

  // Instructions
  instructionsSection: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 6,
    padding: 12,
  },
  instructionsText: {
    fontSize: 11,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Video Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  videoModal: {
    backgroundColor: colors.background.dark,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  videoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border,
  },
  videoModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.ui.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  videoModalContent: {
    padding: 20,
  },
  videoModalChallenge: {
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  
  // Video Player Placeholder
  videoPlayerPlaceholder: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.ui.border,
  },
  videoPlayerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  videoPlayerSubtext: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  videoPlayerDetails: {
    fontSize: 10,
    color: colors.text.secondary,
  },

  // Quick Actions
  videoModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickApproveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  quickApproveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  quickRejectButton: {
    flex: 1,
    backgroundColor: '#ff4444',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  quickRejectText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ResponseApproval;