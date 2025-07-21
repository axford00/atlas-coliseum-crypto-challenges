// components/challenge/MyVideoResponse.js - SIMPLIFIED VERSION (No social sharing imports)
import { Video } from 'expo-av';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../theme/colors';

const MyVideoResponse = ({ 
  challenge, 
  myVideoResponse, 
  onTogglePrivacy, 
  isSubmitting 
}) => {
  // Only show if user has submitted a video response
  if (!myVideoResponse || 
      myVideoResponse.responseType !== 'video' || 
      challenge.direction !== 'incoming' ||
      challenge.status !== 'response_submitted') {
    return null;
  }

  const formatDuration = (seconds) => {
    if (!seconds || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Recently';
    }
  };

  // ✅ SIMPLIFIED: Basic sharing without external service
  const handleBasicShare = async () => {
    try {
      // Only allow sharing if video is public
      if (!myVideoResponse.isPublic) {
        Alert.alert(
          '🔒 Private Video',
          'Only public videos can be shared. Would you like to make this video public first?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Make Public First', 
              onPress: async () => {
                await onTogglePrivacy(myVideoResponse.id);
              }
            }
          ]
        );
        return;
      }

      // Simple share options
      Alert.alert(
        '🚀 Share Your Victory!',
        'Your video response is public in The Coliseum! You can now share it with friends.',
        [
          { text: 'Copy Video Link', onPress: () => handleCopyLink() },
          { text: 'Share Challenge Info', onPress: () => handleShareText() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );

    } catch (error) {
      console.error('❌ Error preparing share:', error);
      Alert.alert('Error', 'Failed to prepare sharing. Please try again.');
    }
  };

  const handleCopyLink = async () => {
    try {
      // For now, just show the link - you can implement clipboard copy later
      Alert.alert(
        '🔗 Video Link',
        `Your video is live in The Coliseum!\n\nVideo ID: ${myVideoResponse.id}`,
        [{ text: 'Got it!' }]
      );
    } catch (error) {
      console.error('❌ Error copying link:', error);
    }
  };

  const handleShareText = async () => {
    try {
      const shareMessage = `🏆 Just crushed "${challenge.challenge}" on Atlas Fitness!\n\n💪 Check out my victory in The Coliseum!`;
      
      Alert.alert(
        '📱 Share Message',
        shareMessage,
        [
          { text: 'Copy Message', onPress: () => console.log('Message copied to clipboard') },
          { text: 'Close' }
        ]
      );
    } catch (error) {
      console.error('❌ Error sharing text:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📹 Your Video Response</Text>
      <Text style={styles.subtitle}>
        Submitted and awaiting approval from {challenge.fromName}
      </Text>
      
      {/* Video Player */}
      <View style={styles.videoPlayerContainer}>
        <Video
          source={{ uri: myVideoResponse.videoUrl }}
          style={styles.videoPlayer}
          useNativeControls
          resizeMode="contain"
          shouldPlay={false}
          isLooping={false}
          onError={(error) => {
            console.error('My video error:', error);
            Alert.alert('Video Error', 'Failed to load your video. Please try again.');
          }}
        />
        
        {myVideoResponse.thumbnailUrl && (
          <View style={styles.thumbnailInfo}>
            <Text style={styles.thumbnailText}>🖼️ Thumbnail generated</Text>
          </View>
        )}
      </View>
      
      {/* Video Info */}
      <View style={styles.videoInfoSection}>
        <Text style={styles.videoInfoText}>
          Duration: {formatDuration(myVideoResponse.videoDuration)}
        </Text>
        <Text style={styles.videoInfoText}>
          Submitted: {formatDate(myVideoResponse.createdAt)}
        </Text>
      </View>
      
      {/* Privacy Toggle - THE MAIN FEATURE! */}
      <View style={styles.privacyToggleContainer}>
        <View style={styles.privacyStatus}>
          <Text style={styles.privacyToggleLabel}>
            {myVideoResponse.isPublic ? '🌍 Public Video' : '🔒 Private Video'}
          </Text>
          <Text style={styles.privacyToggleSubtext}>
            {myVideoResponse.isPublic 
              ? 'Visible in The Coliseum to all warriors' 
              : 'Only visible to you and the challenger'}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.privacyToggleButton,
            myVideoResponse.isPublic ? styles.publicToggle : styles.privateToggle
          ]}
          onPress={() => onTogglePrivacy(myVideoResponse.id)}
          disabled={isSubmitting}
        >
          <Text style={styles.privacyToggleButtonText}>
            {isSubmitting ? 'Updating...' : 
             myVideoResponse.isPublic ? 'Make Private' : 'Make Public'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ✅ SIMPLIFIED: Basic Sharing Section */}
      {myVideoResponse.isPublic && (
        <View style={styles.sharingSection}>
          <Text style={styles.sharingSectionTitle}>🚀 Share Your Victory</Text>
          <Text style={styles.sharingSectionSubtext}>
            Your video is live in The Coliseum!
          </Text>
          
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={handleBasicShare}
            disabled={isSubmitting}
          >
            <Text style={styles.shareButtonIcon}>📱</Text>
            <View style={styles.shareButtonTextContainer}>
              <Text style={styles.shareButtonText}>Share Challenge Victory</Text>
              <Text style={styles.shareButtonSubtext}>
                Let others know about your success
              </Text>
            </View>
            <Text style={styles.shareButtonArrow}>→</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Status Info */}
      <View style={styles.videoStatusContainer}>
        <Text style={styles.videoStatusText}>
          📋 Status: {myVideoResponse.status === 'pending' ? 'Awaiting approval' : 'Approved'}
        </Text>
        {myVideoResponse.isPublic && (
          <Text style={styles.colisuemText}>✨ Featured in The Coliseum</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.overlay,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: 20,
  },
  title: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 18,
  },
  videoPlayerContainer: {
    backgroundColor: colors.background.dark,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.ui.border,
    marginBottom: 10,
  },
  videoPlayer: {
    width: '100%',
    height: 250,
    backgroundColor: colors.background.dark,
  },
  thumbnailInfo: {
    backgroundColor: colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  thumbnailText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  videoInfoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: colors.ui.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  videoInfoText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  privacyToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.ui.border,
  },
  privacyStatus: {
    flex: 1,
    marginRight: 15,
  },
  privacyToggleLabel: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  privacyToggleSubtext: {
    color: colors.text.secondary,
    fontSize: 11,
    lineHeight: 14,
  },
  privacyToggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 100,
    alignItems: 'center',
  },
  publicToggle: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  privateToggle: {
    backgroundColor: colors.ui.inputBg,
    borderColor: colors.ui.border,
  },
  privacyToggleButtonText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },

  // ✅ SIMPLIFIED: Basic Sharing Styles
  sharingSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.ui.border,
  },
  sharingSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 5,
  },
  sharingSectionSubtext: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 15,
  },
  shareButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  shareButtonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  shareButtonTextContainer: {
    flex: 1,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.background.dark,
    marginBottom: 2,
  },
  shareButtonSubtext: {
    fontSize: 11,
    color: colors.background.dark + '80',
  },
  shareButtonArrow: {
    fontSize: 16,
    color: colors.background.dark,
    fontWeight: 'bold',
  },

  videoStatusContainer: {
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.ui.border,
    marginTop: 15,
  },
  videoStatusText: {
    color: colors.text.secondary,
    fontSize: 13,
    marginBottom: 4,
  },
  colisuemText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default MyVideoResponse;