// src/components/buddies/RecentActivity.js - Recent Activity Display
import {
    StyleSheet,
    Text,
    View
} from 'react-native';
import { colors } from '../../theme/colors';

const RecentActivity = ({ buddyProfile, formatDate }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📊 Recent Activity</Text>
      
      {buddyProfile?.lastWorkoutDate ? (
        <View style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>Last Workout</Text>
            <Text style={styles.activityDate}>
              {formatDate(buddyProfile.lastWorkoutDate)}
            </Text>
          </View>
          
          <View style={styles.activityContent}>
            <Text style={styles.activityType}>
              {buddyProfile.lastWorkoutType || 'Workout'}
            </Text>
            
            {buddyProfile.lastWorkoutDuration && (
              <Text style={styles.activityDetail}>
                Duration: {buddyProfile.lastWorkoutDuration}
              </Text>
            )}
            
            {buddyProfile.lastWorkoutNotes && (
              <Text style={styles.activityNotes}>
                "{buddyProfile.lastWorkoutNotes}"
              </Text>
            )}
          </View>
          
          <View style={styles.activityFooter}>
            <View style={styles.activityIndicator}>
              <View style={styles.activityDot} />
              <Text style={styles.activityStatus}>Recently Active</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No recent activity shared
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  // Activity Card Styles
  activityCard: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityTitle: {
    color: colors.text.light,
    fontSize: 14,
    fontWeight: 'bold',
  },
  activityDate: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  
  activityContent: {
    marginBottom: 12,
  },
  activityType: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  activityDetail: {
    color: colors.text.secondary,
    fontSize: 13,
    marginBottom: 4,
  },
  activityNotes: {
    color: colors.text.primary,
    fontSize: 13,
    fontStyle: 'italic',
    backgroundColor: colors.background.overlay,
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  activityStatus: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Empty State
  emptyState: {
    backgroundColor: colors.background.overlay,
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  emptyStateText: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});

export default RecentActivity;