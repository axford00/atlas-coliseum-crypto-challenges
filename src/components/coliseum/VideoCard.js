// src/components/coliseum/VideoCard.js
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { colors } from '../../theme/colors';

const VideoCard = ({ 
  video, 
  cardWidth, 
  onPress,
  formatTimeAgo,
  formatDuration 
}) => {
  const thumbnailHeight = cardWidth * 0.75;
  
  return (
    <TouchableOpacity 
      style={[styles.videoCard, { width: cardWidth }]}
      onPress={() => onPress(video)}
      activeOpacity={0.8}
    >
      <View style={[styles.thumbnailContainer, { height: thumbnailHeight }]}>
        {video.thumbnailUrl ? (
          <Image 
            source={{ uri: video.thumbnailUrl }}
            style={styles.thumbnailImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Text style={[styles.thumbnailIcon, { fontSize: cardWidth * 0.1 }]}>▶️</Text>
          </View>
        )}
        
        <View style={styles.durationBadge}>
          <Text style={[styles.durationText, { fontSize: Math.max(8, cardWidth * 0.025) }]}>
            {formatDuration(video.videoDuration)}
          </Text>
        </View>
        
        {video.status === 'pending' && (
          <View style={styles.pendingBadge}>
            <Text style={[styles.pendingBadgeText, { fontSize: Math.max(8, cardWidth * 0.03) }]}>⏳</Text>
          </View>
        )}
        
        <View style={styles.challengeBadge}>
          <Text style={[styles.challengeBadgeText, { fontSize: Math.max(8, cardWidth * 0.03) }]}>💪</Text>
        </View>
      </View>

      <View style={styles.videoInfo}>
        <Text style={[styles.videoTitle, { fontSize: Math.max(10, cardWidth * 0.032) }]} numberOfLines={2}>
          Challenge Response
          {video.status === 'pending' && ' (Pending)'}
        </Text>
        <Text style={[styles.videoAuthor, { fontSize: Math.max(8, cardWidth * 0.028) }]} numberOfLines={1}>
          By: {video.responderName || 'Warrior'}
        </Text>
        
        <View style={styles.videoMeta}>
          <Text style={[styles.videoTime, { fontSize: Math.max(7, cardWidth * 0.025) }]}>
            {formatTimeAgo(video.createdAt)}
          </Text>
          
          <View style={styles.videoStats}>
            <Text style={[styles.videoStatsText, { fontSize: Math.max(7, cardWidth * 0.025) }]}>
              🔥 {video.fireCount || 0}
            </Text>
            {video.commentCount > 0 && (
              <Text style={[styles.videoStatsText, { fontSize: Math.max(7, cardWidth * 0.025), marginLeft: 4 }]}>
                💬 {video.commentCount}
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  videoCard: {
    backgroundColor: colors.background.overlay,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.ui.border,
    overflow: 'hidden',
    marginBottom: 15,
  },
  thumbnailContainer: {
    backgroundColor: colors.ui.inputBg,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.ui.inputBg,
  },
  thumbnailPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailIcon: {
    color: 'white',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: 'white',
    fontWeight: 'bold',
  },
  pendingBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FF9800',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingBadgeText: {
    color: 'white',
  },
  challengeBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeBadgeText: {},
  videoInfo: {
    padding: 10,
  },
  videoTitle: {
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  videoAuthor: {
    color: colors.text.secondary,
    marginBottom: 6,
  },
  videoMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoTime: {
    color: colors.text.secondary,
  },
  videoStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoStatsText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});

export default VideoCard;