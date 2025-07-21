// src/components/coliseum/VideoModal.js
import { Video } from 'expo-av';
import { doc, increment, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../../firebase';
import { colors } from '../../theme/colors';
import CommentSection from './CommentSection';

const VideoModal = ({ 
  visible, 
  video, 
  onClose, 
  onVideoUpdate,
  formatTimeAgo 
}) => {
  const [submittingReaction, setSubmittingReaction] = useState(false);

  if (!video || !visible) return null;

  const handleFireReaction = async () => {
    if (!auth.currentUser || submittingReaction) return;
    
    console.log('🔥 Fire reaction clicked for video:', video.id);
    
    try {
      setSubmittingReaction(true);
      
      const videoRef = doc(db, 'challenge_responses', video.id);
      await updateDoc(videoRef, {
        fireCount: increment(1)
      });
      
      console.log('✅ Fire reaction added successfully');
      
      // Update parent component
      onVideoUpdate(video.id, { fireCount: (video.fireCount || 0) + 1 });
      
      Alert.alert('🔥', 'Fire reaction added!', [{ text: 'Nice!' }]);
      
    } catch (error) {
      console.error('❌ Error adding fire reaction:', error);
      Alert.alert('Error', 'Failed to add reaction. Try again!');
    } finally {
      setSubmittingReaction(false);
    }
  };

  const handleCommentCountChange = (increment) => {
    onVideoUpdate(video.id, { 
      commentCount: (video.commentCount || 0) + increment 
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Challenge Victory
              {video.status === 'pending' && ' (Pending Approval)'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Video Player */}
          <View style={styles.modalVideoContainer}>
            {video.videoUrl ? (
              <Video
                source={{ uri: video.videoUrl }}
                style={styles.modalVideo}
                useNativeControls
                resizeMode="contain"
                shouldPlay={true}
                isLooping={false}
                onError={(error) => {
                  console.error('Video playback error:', error);
                  Alert.alert('Video Error', 'Failed to play video.');
                }}
              />
            ) : (
              <View style={styles.modalVideoPlaceholder}>
                <Text style={styles.modalVideoPlaceholderText}>Video Loading...</Text>
              </View>
            )}
          </View>

          {/* Scrollable Content */}
          <ScrollView 
            style={styles.modalScrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Video Info */}
            <View style={styles.videoInfoSection}>
              <Text style={styles.modalAuthor}>
                🏆 {video.responderName || 'Unknown Warrior'}
              </Text>
              <Text style={styles.modalTime}>
                {formatTimeAgo(video.createdAt)}
              </Text>
              
              {video.status === 'pending' && (
                <View style={styles.pendingNotice}>
                  <Text style={styles.pendingNoticeText}>
                    ⏳ This video is pending challenger approval
                  </Text>
                </View>
              )}
            </View>

            {/* Fire Button */}
            <TouchableOpacity 
              style={[
                styles.fireButton, 
                submittingReaction && styles.fireButtonDisabled
              ]}
              onPress={handleFireReaction}
              disabled={submittingReaction}
            >
              <Text style={styles.fireButtonText}>
                {submittingReaction ? '⏳ Adding...' : `🔥 Fire This Video (${video.fireCount || 0})`}
              </Text>
            </TouchableOpacity>

            {/* Comments Section */}
            <CommentSection
              videoId={video.id}
              onCommentCountChange={handleCommentCountChange}
              formatTimeAgo={formatTimeAgo}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '95%',
    maxWidth: 500,
    height: '90%',
    backgroundColor: colors.background.overlay,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.ui.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalVideoContainer: {
    height: 280,
    backgroundColor: colors.background.dark,
  },
  modalVideo: {
    flex: 1,
  },
  modalVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalVideoPlaceholderText: {
    color: colors.text.secondary,
    fontSize: 16,
  },
  modalScrollContainer: {
    flex: 1,
    padding: 15,
  },
  fireButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  fireButtonDisabled: {
    opacity: 0.6,
  },
  fireButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  videoInfoSection: {
    marginBottom: 20,
  },
  modalAuthor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 5,
  },
  modalTime: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 10,
  },
  pendingNotice: {
    backgroundColor: '#FF9800',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  pendingNoticeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default VideoModal;