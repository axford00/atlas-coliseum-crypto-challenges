// components/profile/SocialBuddiesSection.js
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FalloutButton from '../ui/FalloutButton';
import { colors } from '../../theme/colors';

const SocialBuddiesSection = ({ 
  navigation,
  incomingRequestsCount,
  incomingChallengesCount,
  currentPhone,
  setShowPhoneModal,
  setPhoneNumber
}) => {
  return (
    <View style={styles.socialSection}>
      <View style={styles.socialHeader}>
        <Text style={styles.socialTitle}>🏋️ Workout Buddies</Text>
        <Text style={styles.socialSubtitle}>Stay motivated together!</Text>
      </View>
      
      {/* HomeScreen-style button container */}
      <View style={styles.buttonContainer}>
        <View style={styles.socialButtonWrapper}>
          <FalloutButton
            text="MY BUDDIES"
            onPress={() => navigation.navigate('BuddiesScreen')}
            style={styles.socialButton}
          />
          {incomingRequestsCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{incomingRequestsCount}</Text>
            </View>
          )}
        </View>
        
        <FalloutButton
          text="FIND BUDDIES"
          onPress={() => navigation.navigate('BuddiesScreen', { autoScan: true })}
          style={styles.socialButton}
        />
      </View>

      <View style={styles.buddiesPreview}>
        <Text style={styles.buddiesPreviewText}>
          Connect with friends, send challenges, and stay motivated together!
        </Text>
        
        {/* Challenges Notification */}
        {incomingChallengesCount > 0 && (
          <TouchableOpacity 
            style={styles.challengesNotification}
            onPress={() => navigation.navigate('BuddiesScreen')}
          >
            <Text style={styles.challengesNotificationText}>
              🏆 You have {incomingChallengesCount} new challenge{incomingChallengesCount > 1 ? 's' : ''}!
            </Text>
            <Text style={styles.challengesNotificationSubtext}>Tap to view</Text>
          </TouchableOpacity>
        )}
        
        {/* FIXED: Phone Number Section - Hidden after registration */}
        {!currentPhone ? (
          // Show full section when no phone registered
          <View style={styles.phoneSection}>
            <Text style={styles.phoneSectionTitle}>📱 Phone Number</Text>
            <TouchableOpacity 
              style={styles.addPhoneButton}
              onPress={() => setShowPhoneModal(true)}
            >
              <Text style={styles.addPhoneText}>+ Add Phone Number</Text>
              <Text style={styles.addPhoneSubtext}>Help friends find you!</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Show minimal indicator when phone is registered
          <View style={styles.phoneRegisteredIndicator}>
            <Text style={styles.phoneRegisteredText}>📱 ✅ Phone registered</Text>
            <TouchableOpacity 
              style={styles.editPhoneSmallButton}
              onPress={() => {
                setPhoneNumber(currentPhone.replace(/^\+1/, ''));
                setShowPhoneModal(true);
              }}
            >
              <Text style={styles.editPhoneSmallText}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  socialSection: {
    marginBottom: 20,
  },
  socialHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  socialTitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  socialSubtitle: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  buttonContainer: {
    width: '100%',
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  socialButton: {
    marginBottom: 15,
  },
  socialButtonWrapper: {
    position: 'relative',
    marginBottom: 15,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    zIndex: 10,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buddiesPreview: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
  },
  buddiesPreviewText: {
    color: colors.text.light,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 15,
  },
  challengesNotification: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    alignItems: 'center',
  },
  challengesNotificationText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  challengesNotificationSubtext: {
    color: colors.text.primary,
    fontSize: 12,
    opacity: 0.8,
  },
  // Phone Section - Full display when not registered
  phoneSection: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  phoneSectionTitle: {
    color: colors.text.light,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  addPhoneButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  addPhoneText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  addPhoneSubtext: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  // FIXED: Minimal phone registered indicator
  phoneRegisteredIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.ui.inputBg,
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
    opacity: 0.6,
  },
  phoneRegisteredText: {
    color: colors.text.secondary,
    fontSize: 11,
    flex: 1,
  },
  editPhoneSmallButton: {
    backgroundColor: colors.ui.border,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editPhoneSmallText: {
    color: colors.text.secondary,
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default SocialBuddiesSection;