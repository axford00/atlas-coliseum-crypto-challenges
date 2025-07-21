// src/components/buddies/BuddyCard.js - Individual buddy card component
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../theme/colors';
import FalloutButton from '../ui/FalloutButton';

const BuddyCard = ({ buddy, onPress, onChallenge, onEncourage }) => {
  return (
    <TouchableOpacity style={styles.buddyCard} onPress={onPress}>
      <View style={styles.buddyHeader}>
        <View style={styles.buddyAvatar}>
          {buddy.profileImage ? (
            <Image source={{ uri: buddy.profileImage }} style={styles.buddyAvatarImage} />
          ) : (
            <Text style={styles.buddyAvatarText}>
              {buddy.name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.buddyInfo}>
          <Text style={styles.buddyName}>{buddy.name}</Text>
          <Text style={styles.buddyActivity}>
            Last: {buddy.lastWorkoutType || 'No recent activity'}
          </Text>
          <Text style={styles.buddyStreak}>
            🔥 {buddy.streak || 0} day streak
          </Text>
          <Text style={styles.tapToViewProfile}>👆 Tap to view profile & chat</Text>
        </View>
      </View>
      
      <View style={styles.buddyActionsContainer}>
        <FalloutButton
          text="💬 ENCOURAGE"
          onPress={(e) => {
            e.stopPropagation();
            onEncourage(buddy);
          }}
          style={styles.buddyActionButton}
          type="secondary"
        />
        
        <FalloutButton
          text="⚡ CHALLENGE"
          onPress={(e) => {
            e.stopPropagation();
            onChallenge(buddy);
          }}
          style={styles.buddyActionButton}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buddyCard: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  buddyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  buddyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  buddyAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  buddyAvatarText: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  buddyInfo: {
    flex: 1,
  },
  buddyName: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  buddyActivity: {
    color: colors.text.light,
    fontSize: 14,
    marginBottom: 2,
  },
  buddyStreak: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  tapToViewProfile: {
    color: colors.primary,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  buddyActionsContainer: {
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.ui.border,
    gap: 10,
  },
  buddyActionButton: {
    marginBottom: 5,
  },
});

export default BuddyCard;