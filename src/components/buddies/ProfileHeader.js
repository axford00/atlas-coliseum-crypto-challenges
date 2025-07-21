// src/components/buddies/ProfileHeader.js - Buddy Profile Display
import {
    Image,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { colors } from '../../theme/colors';

const ProfileHeader = ({ buddyProfile, buddy }) => {
  if (!buddyProfile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.profileSection}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {buddyProfile.profileImage ? (
            <Image source={{ uri: buddyProfile.profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {(buddyProfile.displayName || buddy.name)?.charAt(0).toUpperCase() || 'B'}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {buddyProfile.displayName || buddy.name}
          </Text>
          <Text style={styles.profileEmail}>{buddyProfile.email}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{buddyProfile.currentStreak || 0}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{buddyProfile.totalWorkouts || 0}</Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{buddyProfile.workoutsPerWeek || 3}</Text>
              <Text style={styles.statLabel}>Per Week</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Fitness Goals */}
      {buddyProfile.profileDescription && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>Fitness Goals:</Text>
          <Text style={styles.descriptionText}>{buddyProfile.profileDescription}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Profile Section
  profileSection: {
    backgroundColor: colors.background.overlay,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: colors.text.primary,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  profileEmail: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  descriptionContainer: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
  },
  descriptionTitle: {
    color: colors.text.light,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  descriptionText: {
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Loading State
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 16,
  },
});

export default ProfileHeader;