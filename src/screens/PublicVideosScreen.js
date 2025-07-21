// screens/PublicVideosScreen.js - CLEANED: No Fake Data
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../firebase';
import VideoCard from '../components/coliseum/VideoCard';
import VideoFilters from '../components/coliseum/VideoFilters';
import VideoModal from '../components/coliseum/VideoModal';
import FalloutButton from '../components/ui/FalloutButton';
import { colors, globalStyles } from '../theme/colors';

const { width } = Dimensions.get('window');

// Responsive card sizing based on video count
const getCardDimensions = (videoCount) => {
  if (videoCount <= 2) {
    return {
      cardWidth: (width - 45) / 2,
      columns: 2
    };
  } else if (videoCount <= 6) {
    return {
      cardWidth: (width - 60) / 3,
      columns: 3
    };
  } else {
    return {
      cardWidth: (width - 75) / 4,
      columns: 4
    };
  }
};

const PublicVideosScreen = ({ navigation }) => {
  const [publicVideos, setPublicVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [filter, setFilter] = useState('recent');
  
  const videosListener = useRef(null);

  // Get responsive dimensions
  const { cardWidth, columns } = getCardDimensions(publicVideos.length);

  useEffect(() => {
    setupVideosListener();
    
    return () => {
      if (videosListener.current) {
        videosListener.current();
      }
    };
  }, [filter]);

  const setupVideosListener = async () => {
    try {
      setLoading(true);
      
      if (videosListener.current) {
        videosListener.current();
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('🔐 Current user:', auth.currentUser?.uid);

      // Try simple query first to avoid index issues
      try {
        const simpleQuery = query(
          collection(db, 'challenge_responses'),
          where('isPublic', '==', true),
          where('responseType', '==', 'video')
        );
        const snapshot = await getDocs(simpleQuery);
        console.log('✅ Simple query SUCCESS:', snapshot.size);
        
        const videos = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          const video = {
            id: doc.id,
            ...data,
            // CLEANED: Use actual counts only, no fake data
            fireCount: data.fireCount || 0,
            commentCount: data.commentCount || 0,
          };
          
          videos.push(video);
        });
        
        // Apply sorting based on filter
        const sortedVideos = sortVideosByFilter(videos, filter);
        setPublicVideos(sortedVideos);
        setLoading(false);
        setRefreshing(false);
        console.log(`📺 Loaded ${videos.length} videos for Coliseum`);
        return;
        
      } catch (error) {
        console.error('❌ Query failed:', error);
        setLoading(false);
        setRefreshing(false);
        Alert.alert(
          'Loading Issue', 
          'Having trouble loading videos. Please create the required Firebase index or try again later.',
          [
            { text: 'Try Again', onPress: setupVideosListener },
            { text: 'Cancel' }
          ]
        );
      }

    } catch (error) {
      console.error('❌ Setup failed completely:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const sortVideosByFilter = (videos, currentFilter) => {
    if (currentFilter === 'popular') {
      return [...videos].sort((a, b) => {
        const aPopularity = (a.fireCount || 0) + (a.commentCount || 0) * 2;
        const bPopularity = (b.fireCount || 0) + (b.commentCount || 0) * 2;
        return bPopularity - aPopularity;
      });
    } else {
      // Recent (default)
      return [...videos].sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return bTime - aTime;
      });
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    const sortedVideos = sortVideosByFilter(publicVideos, newFilter);
    setPublicVideos(sortedVideos);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setupVideosListener();
  };

  const openVideoModal = (video) => {
    setSelectedVideo(video);
    setVideoModalVisible(true);
  };

  const closeVideoModal = () => {
    setSelectedVideo(null);
    setVideoModalVisible(false);
  };

  const handleVideoUpdate = (videoId, updates) => {
    setPublicVideos(prev => prev.map(video => 
      video.id === videoId 
        ? { ...video, ...updates }
        : video
    ));
    
    if (selectedVideo?.id === videoId) {
      setSelectedVideo(prev => ({ ...prev, ...updates }));
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    try {
      const now = new Date();
      const videoTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      
      if (isNaN(videoTime.getTime())) {
        return 'Recently';
      }
      
      const diffMs = now - videoTime;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch (error) {
      return 'Recently';
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderVideoCard = ({ item }) => (
    <VideoCard
      video={item}
      cardWidth={cardWidth}
      onPress={openVideoModal}
      formatTimeAgo={formatTimeAgo}
      formatDuration={formatDuration}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🏛️</Text>
      <Text style={styles.emptyStateTitle}>The Coliseum Awaits</Text>
      <Text style={styles.emptyStateText}>
        No public challenge videos yet. Be the first warrior to share your victory!
      </Text>
      
      <FalloutButton
        text="⚡ CREATE CHALLENGE"
        onPress={() => navigation.navigate('ChallengesScreen')}
        style={styles.emptyStateButton}
      />
    </View>
  );

  return (
    <View style={styles.background}>
      <View style={styles.container}>
        <View style={globalStyles.hudCorner1} />
        <View style={globalStyles.hudCorner2} />
        <View style={globalStyles.hudCorner3} />
        <View style={globalStyles.hudCorner4} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleTop}>THE</Text>
            <Text style={styles.titleBottom}>COLISEUM</Text>
          </View>
        </View>

        {/* Subtitle */}
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>
            ⚔️ Where Warriors Share Their Victories ⚔️
          </Text>
          {publicVideos.length > 0 && (
            <Text style={styles.videoCount}>
              {publicVideos.length} warrior{publicVideos.length !== 1 ? 's' : ''} in the arena
            </Text>
          )}
        </View>

        {/* Filters */}
        <VideoFilters filter={filter} onFilterChange={handleFilterChange} />

        {/* Content */}
        <View style={styles.feedContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading warrior videos...</Text>
            </View>
          ) : publicVideos.length === 0 ? (
            <ScrollView 
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              contentContainerStyle={styles.scrollContent}
            >
              {renderEmptyState()}
            </ScrollView>
          ) : (
            <FlatList
              data={publicVideos}
              renderItem={renderVideoCard}
              keyExtractor={(item) => item.id}
              numColumns={columns}
              key={`${columns}-${publicVideos.length}`}
              contentContainerStyle={styles.gridContainer}
              columnWrapperStyle={columns > 1 ? styles.gridRow : null}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
          )}
        </View>

        {/* Video Modal */}
        <VideoModal
          visible={videoModalVisible}
          video={selectedVideo}
          onClose={closeVideoModal}
          onVideoUpdate={handleVideoUpdate}
          formatTimeAgo={formatTimeAgo}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
    position: 'relative',
  },
  titleContainer: {
    alignItems: 'center',
  },
  titleTop: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.secondary,
    letterSpacing: 3,
    marginBottom: -5,
  },
  titleBottom: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    letterSpacing: 2,
  },
  subtitleContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  videoCount: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
  feedContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 16,
    marginTop: 15,
  },
  gridContainer: {
    paddingBottom: 20,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  scrollContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 15,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  emptyStateButton: {
    width: 220,
  },
});

export default PublicVideosScreen;