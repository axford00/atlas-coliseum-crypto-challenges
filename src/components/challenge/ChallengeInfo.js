// src/components/challenge/ChallengeInfo.js
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

const ChallengeInfo = ({ challenge }) => {
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
      return 'Recently';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return colors.text.secondary;
      case 'accepted': return colors.primary;
      case 'response_submitted': return '#FF9800';
      case 'completed': return '#4CAF50';
      case 'declined': return '#f44336';
      default: return colors.text.secondary;
    }
  };

  const getChallengeTitle = () => {
    if (!challenge) return 'Unknown Challenge';
    
    if (challenge.direction === 'incoming') {
      return `${challenge.fromName || 'Someone'} challenged you:`;
    } else {
      return `You challenged ${challenge.toName || 'someone'}:`;
    }
  };

  const getChallengeStatusText = () => {
    if (!challenge || !challenge.status) return 'unknown';
    
    switch (challenge.status) {
      case 'pending': return 'pending';
      case 'accepted': return 'accepted';
      case 'response_submitted': return 'response submitted';
      case 'completed': return 'completed';
      case 'declined': return 'declined';
      default: return challenge.status || 'pending';
    }
  };

  if (!challenge) {
    return (
      <View style={styles.container}>
        <Text style={styles.challengeText}>Error: Challenge data not found</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.challengeTitle}>{getChallengeTitle()}</Text>
      <Text style={styles.challengeText}>{challenge.challenge || 'No challenge text'}</Text>
      
      {challenge.reward && (
        <Text style={styles.challengeReward}>🎁 {challenge.reward}</Text>
      )}
      
      <View style={styles.challengeFooter}>
        <Text style={[styles.challengeStatus, { color: getStatusColor(challenge.status) }]}>
          Status: {getChallengeStatusText()}
        </Text>
        <Text style={styles.challengeDate}>
          {challenge.createdAt ? formatDate(challenge.createdAt) : 'Unknown date'}
        </Text>
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
  challengeTitle: {
    color: colors.text.light,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  challengeText: {
    color: colors.text.primary,
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 15,
  },
  challengeReward: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  challengeDate: {
    color: colors.text.secondary,
    fontSize: 12,
  },
});

export default ChallengeInfo;