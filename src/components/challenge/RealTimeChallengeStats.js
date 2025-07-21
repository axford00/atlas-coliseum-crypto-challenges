// src/components/challenge/RealTimeChallengeStats.js - LIVE UPDATING STATS
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const RealTimeChallengeStats = ({ liveChallenges, completedChallenges }) => {
  // Calculate real-time stats
  const stats = useMemo(() => {
    const pendingIncoming = liveChallenges.filter(c => 
      c.status === 'pending' && c.direction === 'incoming'
    ).length;
    
    const pendingOutgoing = liveChallenges.filter(c => 
      c.status === 'pending' && c.direction === 'outgoing'
    ).length;
    
    const activeChallenges = liveChallenges.filter(c => 
      c.status === 'accepted' || c.status === 'response_submitted'
    ).length;
    
    const cryptoChallenges = liveChallenges.filter(c => 
      c.wagerAmount > 0 || c.type === 'crypto'
    ).length;
    
    const totalCompleted = completedChallenges.length;
    
    return {
      pendingIncoming,
      pendingOutgoing,
      activeChallenges,
      cryptoChallenges,
      totalCompleted,
      totalLive: liveChallenges.length
    };
  }, [liveChallenges, completedChallenges]);

  // Calculate trends (you could track previous values for trend arrows)
  const getTrendIcon = (current, previous = 0) => {
    if (current > previous) return '📈';
    if (current < previous) return '📉';
    return '➡️';
  };

  return (
    <View style={styles.container}>
      {/* Main Stats Row */}
      <View style={styles.mainStatsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>
            {stats.totalLive}
          </Text>
          <Text style={styles.statLabel}>ACTIVE</Text>
          <Text style={styles.statLabel}>CHALLENGES</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#ff6b35' }]}>
            {stats.cryptoChallenges}
          </Text>
          <Text style={styles.statLabel}>CRYPTO</Text>
          <Text style={styles.statLabel}>WAGERS</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#FFD700' }]}>
            {stats.pendingIncoming}
          </Text>
          <Text style={styles.statLabel}>PENDING</Text>
          <Text style={styles.statLabel}>RESPONSE</Text>
        </View>
      </View>

      {/* Detailed Breakdown */}
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailNumber}>{stats.pendingOutgoing}</Text>
          <Text style={styles.detailLabel}>Sent & Waiting</Text>
        </View>
        
        <View style={styles.detailSeparator} />
        
        <View style={styles.detailItem}>
          <Text style={styles.detailNumber}>{stats.activeChallenges}</Text>
          <Text style={styles.detailLabel}>Live Challenges</Text>
        </View>
        
        <View style={styles.detailSeparator} />
        
        <View style={styles.detailItem}>
          <Text style={styles.detailNumber}>{stats.totalCompleted}</Text>
          <Text style={styles.detailLabel}>Completed</Text>
        </View>
      </View>

      {/* Priority Alert */}
      {stats.pendingIncoming > 0 && (
        <View style={styles.priorityAlert}>
          <Text style={styles.priorityText}>
            🔔 {stats.pendingIncoming} challenge{stats.pendingIncoming > 1 ? 's' : ''} awaiting your response!
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.overlay,
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  
  // Main Stats
  mainStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 10,
    color: colors.text.secondary,
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 12,
  },

  // Details Row
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.ui.border,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 2,
  },
  detailLabel: {
    fontSize: 10,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  detailSeparator: {
    width: 1,
    height: 30,
    backgroundColor: colors.ui.border,
    marginHorizontal: 10,
  },

  // Priority Alert
  priorityAlert: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#ff6b35',
  },
  priorityText: {
    color: '#ff6b35',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default RealTimeChallengeStats;