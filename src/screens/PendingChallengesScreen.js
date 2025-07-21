// FILE: screens/PendingChallengesScreen.js
// 🚀 COMPLETE: Scrollable list of all pending challenges

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert
} from 'react-native';
import { colors, globalStyles } from '../theme/colors';

const PendingChallengesScreen = ({ route, navigation }) => {
  const { challenges: initialChallenges, user } = route.params;
  const [challenges, setChallenges] = useState(initialChallenges || []);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  // Filter pending challenges
  const pendingChallenges = challenges.filter(challenge => 
    challenge.status === 'pending' && challenge.direction === 'incoming'
  );

  // Apply additional filters
  const getFilteredChallenges = () => {
    switch (filter) {
      case 'crypto':
        return pendingChallenges.filter(c => c.wagerAmount && c.wagerAmount > 0);
      case 'regular':
        return pendingChallenges.filter(c => !c.wagerAmount || c.wagerAmount === 0);
      case 'expiring':
        return pendingChallenges.filter(c => {
          if (!c.dueDate) return false;
          const dueDate = new Date(c.dueDate);
          const now = new Date();
          const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
          return hoursUntilDue <= 24 && hoursUntilDue > 0;
        });
      default:
        return pendingChallenges;
    }
  };

  const filteredChallenges = getFilteredChallenges();

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh - in real app, you'd reload from Firebase
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleChallengePress = (challenge) => {
    console.log('🎯 Selected challenge:', challenge.id, challenge.challenge);
    navigation.navigate('ChallengeDetail', { 
      challenge,
      focusMode: 'pending' 
    });
  };

  const getTimeRemaining = (dueDate) => {
    if (!dueDate) return 'No deadline';
    
    const due = new Date(dueDate);
    const now = new Date();
    const hoursRemaining = Math.max(0, (due - now) / (1000 * 60 * 60));
    
    if (hoursRemaining < 1) return 'Expires soon!';
    if (hoursRemaining < 24) return `${Math.floor(hoursRemaining)}h left`;
    
    const daysRemaining = Math.floor(hoursRemaining / 24);
    return `${daysRemaining}d left`;
  };

  const renderFilterTabs = () => {
    const tabs = [
      { key: 'all', label: `All (${pendingChallenges.length})` },
      { key: 'crypto', label: `Crypto (${pendingChallenges.filter(c => c.wagerAmount > 0).length})` },
      { key: 'regular', label: `Regular (${pendingChallenges.filter(c => !c.wagerAmount || c.wagerAmount === 0).length})` },
      { key: 'expiring', label: `Expiring (${pendingChallenges.filter(c => {
        if (!c.dueDate) return false;
        const hoursUntilDue = (new Date(c.dueDate) - new Date()) / (1000 * 60 * 60);
        return hoursUntilDue <= 24 && hoursUntilDue > 0;
      }).length})` }
    ];

    return (
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterTab,
                filter === tab.key && styles.filterTabActive
              ]}
              onPress={() => setFilter(tab.key)}
            >
              <Text style={[
                styles.filterTabText,
                filter === tab.key && styles.filterTabTextActive
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderChallengeCard = (challenge) => {
    const isCrypto = challenge.wagerAmount && challenge.wagerAmount > 0;
    const timeRemaining = getTimeRemaining(challenge.dueDate);
    const isExpiring = timeRemaining.includes('soon') || timeRemaining.includes('h left');

    return (
      <TouchableOpacity
        key={challenge.id}
        style={[
          styles.challengeCard,
          isCrypto && styles.cryptoCard,
          isExpiring && styles.expiringCard
        ]}
        onPress={() => handleChallengePress(challenge)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.challengeInfo}>
            <Text style={styles.challengeText} numberOfLines={2}>
              {challenge.challenge}
            </Text>
            <Text style={styles.fromText}>
              From: {challenge.fromName || 'Unknown'}
            </Text>
          </View>
          
          {isCrypto && (
            <View style={styles.cryptoBadge}>
              <Text style={styles.cryptoBadgeText}>💰</Text>
              <Text style={styles.cryptoAmount}>
                ${challenge.wagerAmount} {challenge.wagerToken}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text style={[
            styles.timeText,
            isExpiring && styles.expiringText
          ]}>
            ⏰ {timeRemaining}
          </Text>
          
          <View style={styles.actionHint}>
            <Text style={styles.actionHintText}>Tap to respond →</Text>
          </View>
        </View>

        {challenge.difficulty && (
          <View style={[
            styles.difficultyBadge,
            styles[`difficulty${challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}`]
          ]}>
            <Text style={styles.difficultyText}>
              {challenge.difficulty.toUpperCase()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={globalStyles?.hudCorner1 || styles.fallbackCorner} />
      <View style={globalStyles?.hudCorner2 || styles.fallbackCorner} />
      <View style={globalStyles?.hudCorner3 || styles.fallbackCorner} />
      <View style={globalStyles?.hudCorner4 || styles.fallbackCorner} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text style={styles.titleTop}>PENDING</Text>
          <Text style={styles.titleBottom}>CHALLENGES</Text>
        </View>
        
        <View style={styles.headerSpacer} />
      </View>

      {/* Filter Tabs */}
      {renderFilterTabs()}

      {/* Challenge List */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredChallenges.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>
              {filter === 'all' ? 'No Pending Challenges' : `No ${filter.charAt(0).toUpperCase() + filter.slice(1)} Challenges`}
            </Text>
            <Text style={styles.emptyStateText}>
              {filter === 'all' 
                ? 'All caught up! No challenges waiting for your response.'
                : `No ${filter} challenges at the moment.`
              }
            </Text>
            {filter !== 'all' && (
              <TouchableOpacity 
                style={styles.showAllButton}
                onPress={() => setFilter('all')}
              >
                <Text style={styles.showAllButtonText}>Show All Challenges</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                {filteredChallenges.length} challenge{filteredChallenges.length !== 1 ? 's' : ''} awaiting response
              </Text>
            </View>
            
            {filteredChallenges.map(renderChallengeCard)}
            
            <View style={styles.listFooter}>
              <Text style={styles.listFooterText}>
                💡 Tip: Crypto challenges require wallet connection to accept
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
    position: 'relative',
  },
  fallbackCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    backgroundColor: colors.ui.inputBg,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  backButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  titleContainer: {
    alignItems: 'center',
  },
  titleTop: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.secondary,
    letterSpacing: 2,
    marginBottom: -3,
  },
  titleBottom: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    letterSpacing: 1,
  },
  headerSpacer: {
    width: 80, // Same width as back button for centering
  },

  // Filter Tabs
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterTab: {
    backgroundColor: colors.ui.inputBg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterTabTextActive: {
    color: colors.background.dark,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listHeader: {
    marginBottom: 15,
  },
  listHeaderText: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
  },

  // Challenge Cards
  challengeCard: {
    backgroundColor: colors.background.overlay,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.ui.border,
    position: 'relative',
  },
  cryptoCard: {
    borderColor: '#ff6b35',
    borderWidth: 2,
  },
  expiringCard: {
    borderColor: '#ff4444',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  challengeInfo: {
    flex: 1,
    marginRight: 10,
  },
  challengeText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  fromText: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  cryptoBadge: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    alignItems: 'center',
    minWidth: 70,
  },
  cryptoBadgeText: {
    fontSize: 12,
  },
  cryptoAmount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  expiringText: {
    color: '#ff4444',
    fontWeight: 'bold',
  },
  actionHint: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  actionHintText: {
    color: colors.background.dark,
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Difficulty Badge
  difficultyBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  difficultyEasy: {
    backgroundColor: '#4CAF50',
  },
  difficultyMedium: {
    backgroundColor: '#FF9800',
  },
  difficultyHard: {
    backgroundColor: '#f44336',
  },
  difficultyText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyStateTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateText: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  showAllButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  showAllButtonText: {
    color: colors.background.dark,
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Footer
  listFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  listFooterText: {
    color: colors.text.secondary,
    fontSize: 12,
    textAlign: 'center',
  },
});

export default PendingChallengesScreen;