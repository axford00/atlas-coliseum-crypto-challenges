// src/components/buddies/BuddyStatsSection.js - Stats display component
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

const BuddyStatsSection = ({ confirmedCount, incomingCount, pendingCount }) => {
  return (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{confirmedCount}</Text>
        <Text style={styles.statLabel}>Active Buddies</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{incomingCount}</Text>
        <Text style={styles.statLabel}>New Requests</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{pendingCount}</Text>
        <Text style={styles.statLabel}>Sent Requests</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.overlay,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default BuddyStatsSection;