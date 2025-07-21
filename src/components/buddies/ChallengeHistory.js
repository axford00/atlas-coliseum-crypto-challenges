// src/components/buddies/ChallengeHistory.js - Challenge History Display
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { colors } from '../../theme/colors';

const ChallengeHistory = ({ 
  challenges, 
  buddy, 
  onChallengePress,
  formatDate 
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return colors.text.secondary;
      case 'accepted': return colors.primary;
      case 'completed': return '#4CAF50';
      case 'declined': return '#f44336';
      default: return colors.text.secondary;
    }
  };

  const canRespondToChallenge = (challenge) => {
    return challenge.direction === 'from_buddy' && 
           (challenge.status === 'pending' || challenge.status === 'accepted');
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🏆 Recent Challenges</Text>
      
      {challenges.length > 0 ? (
        challenges.map((challenge) => (
          <TouchableOpacity 
            key={challenge.id} 
            style={[
              styles.challengeCard,
              canRespondToChallenge(challenge) && styles.interactiveCard
            ]}
            onPress={() => {
              if (canRespondToChallenge(challenge)) {
                onChallengePress(challenge);
              }
            }}
            disabled={!canRespondToChallenge(challenge)}
            activeOpacity={canRespondToChallenge(challenge) ? 0.7 : 1}
          >
            <View style={styles.challengeHeader}>
              <View style={styles.challengeDirection}>
                <Text style={styles.challengeDirectionText}>
                  {challenge.direction === 'from_buddy' ? 
                    `${buddy.name} challenged you:` : 
                    `You challenged ${buddy.name}:`
                  }
                </Text>
                {challenge.direction === 'from_buddy' && (
                  <View style={[
                    styles.directionIndicator,
                    { backgroundColor: colors.primary }
                  ]} />
                )}
              </View>
              <Text style={styles.challengeDate}>
                {formatDate(challenge.createdAt)}
              </Text>
            </View>
            
            <Text style={styles.challengeText}>{challenge.challenge}</Text>
            
            {challenge.reward && (
              <View style={styles.rewardContainer}>
                <Text style={styles.challengeReward}>🎁 {challenge.reward}</Text>
              </View>
            )}
            
            <View style={styles.challengeFooter}>
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor(challenge.status) }
                ]} />
                <Text style={[
                  styles.challengeStatusText, 
                  { color: getStatusColor(challenge.status) }
                ]}>
                  {challenge.status || 'pending'}
                </Text>
              </View>
              
              {canRespondToChallenge(challenge) && (
                <View style={styles.actionHint}>
                  <Text style={styles.tapToRespond}>👆 Tap to respond</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No challenges yet. Send your first challenge!
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

  // Challenge Card Styles
  challengeCard: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  interactiveCard: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  challengeDirection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  challengeDirectionText: {
    color: colors.text.light,
    fontSize: 13,
    fontWeight: 'bold',
    marginRight: 8,
  },
  directionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  challengeDate: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  
  challengeText: {
    color: colors.text.primary,
    fontSize: 15,
    marginBottom: 12,
    lineHeight: 20,
    backgroundColor: colors.background.overlay,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  
  rewardContainer: {
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  challengeReward: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  challengeStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  
  actionHint: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tapToRespond: {
    color: colors.text.primary,
    fontSize: 10,
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

export default ChallengeHistory;