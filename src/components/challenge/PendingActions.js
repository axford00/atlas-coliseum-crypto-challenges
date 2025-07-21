// FILE: src/components/challenge/PendingActions.js
// 🚀 CRITICAL FIX: This component was missing - causing no Accept/Decline/Negotiate buttons

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { colors } from '../../theme/colors';

const PendingActions = ({ 
  challenge, 
  onAccept, 
  onDecline, 
  onNegotiate, 
  isSubmitting = false,
  isExpired = false 
}) => {
  
  console.log('🎯 [PENDING_ACTIONS] Rendering for challenge:', {
    id: challenge?.id,
    status: challenge?.status,
    direction: challenge?.direction,
    wagerAmount: challenge?.wagerAmount,
    isExpired,
    isSubmitting
  });

  if (!challenge) {
    console.error('❌ [PENDING_ACTIONS] No challenge provided');
    return null;
  }

  // Only show for pending challenges
  if (challenge.status !== 'pending') {
    console.log('🔍 [PENDING_ACTIONS] Challenge not pending, status:', challenge.status);
    return null;
  }

  const handleAccept = () => {
    if (isExpired) {
      Alert.alert('Challenge Expired', 'This challenge has expired and cannot be accepted.');
      return;
    }

    console.log('✅ [PENDING_ACTIONS] Accept button pressed for challenge:', challenge.id);
    
    if (challenge.wagerAmount > 0) {
      Alert.alert(
        '💰 Crypto Challenge',
        `This challenge has a ${challenge.wagerAmount} ${challenge.wagerToken} wager.\n\nYou'll need to deposit an equal amount to accept.\n\nTotal pot: ${(challenge.wagerAmount * 2).toFixed(2)} ${challenge.wagerToken}\nWinner gets: ${(challenge.wagerAmount * 2 * 0.975).toFixed(2)} ${challenge.wagerToken} (after 2.5% Atlas fee)\n\nProceed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Accept & Deposit', 
            onPress: () => {
              console.log('💰 User confirmed crypto challenge acceptance');
              onAccept();
            }
          }
        ]
      );
    } else {
      Alert.alert(
        '✅ Accept Challenge',
        `Ready to accept this challenge?\n\n"${challenge.challenge}"\n\nYou'll need to complete it and submit proof.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Accept Challenge', 
            onPress: () => {
              console.log('✅ User confirmed regular challenge acceptance');
              onAccept();
            }
          }
        ]
      );
    }
  };

  const handleDecline = () => {
    console.log('❌ [PENDING_ACTIONS] Decline button pressed');
    
    Alert.alert(
      '❌ Decline Challenge',
      'Are you sure you want to decline this challenge? This cannot be undone.',
      [
        { text: 'Keep Thinking', style: 'cancel' },
        { 
          text: 'Decline Challenge', 
          style: 'destructive',
          onPress: () => {
            console.log('❌ User confirmed challenge decline');
            onDecline();
          }
        }
      ]
    );
  };

  const handleNegotiate = () => {
    console.log('🤝 [PENDING_ACTIONS] Negotiate button pressed');
    onNegotiate();
  };

  const getTimeRemaining = () => {
    if (!challenge?.dueDate && !challenge?.expiresAt) return null;
    
    const expiryDate = challenge.expiresAt || challenge.dueDate;
    const expiry = expiryDate.toDate ? expiryDate.toDate() : new Date(expiryDate);
    const now = new Date();
    const timeLeft = expiry.getTime() - now.getTime();
    
    if (timeLeft <= 0) return 'EXPIRED';
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h left`;
    if (hours > 0) return `${hours}h left`;
    return 'Expires soon';
  };

  const timeRemaining = getTimeRemaining();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎯 CHALLENGE RECEIVED</Text>
        {timeRemaining && (
          <View style={[
            styles.timeChip,
            isExpired && styles.expiredChip
          ]}>
            <Text style={[
              styles.timeText,
              isExpired && styles.expiredText
            ]}>
              ⏰ {timeRemaining}
            </Text>
          </View>
        )}
      </View>

      {/* Challenge Details */}
      <View style={styles.challengeSection}>
        <Text style={styles.challengeLabel}>
          {challenge.fromName || 'Someone'} challenges you to:
        </Text>
        <Text style={styles.challengeText}>{challenge.challenge}</Text>
        
        {challenge.wagerAmount > 0 && (
          <View style={styles.wagerInfo}>
            <Text style={styles.wagerText}>
              💰 {challenge.wagerAmount} {challenge.wagerToken} wager
            </Text>
            <Text style={styles.wagerSubtext}>
              Winner takes: {(challenge.wagerAmount * 2 * 0.975).toFixed(2)} {challenge.wagerToken} (after 2.5% Atlas fee)
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <Text style={styles.actionTitle}>Your Response:</Text>
        
        <View style={styles.buttonContainer}>
          {/* Accept Button */}
          <TouchableOpacity 
            style={[
              styles.acceptButton,
              (isSubmitting || isExpired) && styles.disabledButton
            ]}
            onPress={handleAccept}
            disabled={isSubmitting || isExpired}
          >
            <Text style={styles.acceptButtonIcon}>✅</Text>
            <View style={styles.buttonContent}>
              <Text style={styles.acceptButtonText}>ACCEPT</Text>
              <Text style={styles.buttonSubtext}>
                {challenge.wagerAmount > 0 ? 'Deposit & Start' : 'Start Challenge'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Negotiate Button */}
          <TouchableOpacity 
            style={[
              styles.negotiateButton,
              (isSubmitting || isExpired) && styles.disabledButton
            ]}
            onPress={handleNegotiate}
            disabled={isSubmitting || isExpired}
          >
            <Text style={styles.negotiateButtonIcon}>🤝</Text>
            <View style={styles.buttonContent}>
              <Text style={styles.negotiateButtonText}>NEGOTIATE</Text>
              <Text style={styles.buttonSubtext}>Change Terms</Text>
            </View>
          </TouchableOpacity>

          {/* Decline Button */}
          <TouchableOpacity 
            style={[
              styles.declineButton,
              isSubmitting && styles.disabledButton
            ]}
            onPress={handleDecline}
            disabled={isSubmitting}
          >
            <Text style={styles.declineButtonIcon}>❌</Text>
            <View style={styles.buttonContent}>
              <Text style={styles.declineButtonText}>DECLINE</Text>
              <Text style={styles.buttonSubtext}>Pass on Challenge</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Messages */}
      {isExpired && (
        <View style={styles.expiredWarning}>
          <Text style={styles.expiredWarningText}>
            ⏰ This challenge has expired and cannot be accepted
          </Text>
        </View>
      )}

      {isSubmitting && (
        <View style={styles.submittingStatus}>
          <Text style={styles.submittingText}>⏳ Processing your response...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background?.overlay || '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.primary || '#6C5CE7',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary || '#6C5CE7',
    letterSpacing: 1,
  },
  timeChip: {
    backgroundColor: (colors.primary || '#6C5CE7') + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary || '#6C5CE7',
  },
  expiredChip: {
    backgroundColor: '#ff444420',
    borderColor: '#ff4444',
  },
  timeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primary || '#6C5CE7',
  },
  expiredText: {
    color: '#ff4444',
  },

  // Challenge Section
  challengeSection: {
    marginBottom: 25,
  },
  challengeLabel: {
    fontSize: 14,
    color: colors.text?.secondary || '#888',
    marginBottom: 8,
  },
  challengeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text?.primary || '#fff',
    lineHeight: 24,
    marginBottom: 15,
  },
  wagerInfo: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ff6b35',
  },
  wagerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff6b35',
    marginBottom: 4,
  },
  wagerSubtext: {
    fontSize: 12,
    color: colors.text?.secondary || '#888',
  },

  // Action Section
  actionSection: {
    marginBottom: 15,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text?.primary || '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
  },

  // Button Base Styles
  buttonContent: {
    flex: 1,
    alignItems: 'center',
  },
  buttonSubtext: {
    fontSize: 11,
    marginTop: 2,
    opacity: 0.8,
  },

  // Accept Button
  acceptButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  acceptButtonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },

  // Negotiate Button
  negotiateButton: {
    backgroundColor: colors.primary || '#6C5CE7',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  negotiateButtonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  negotiateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background?.dark || '#000',
  },

  // Decline Button
  declineButton: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ff4444',
  },
  declineButtonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff4444',
  },

  // Disabled State
  disabledButton: {
    backgroundColor: colors.ui?.border || '#333',
    borderColor: colors.ui?.border || '#333',
    elevation: 0,
  },

  // Status Messages
  expiredWarning: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ff4444',
    alignItems: 'center',
  },
  expiredWarningText: {
    fontSize: 12,
    color: '#ff4444',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  submittingStatus: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFC107',
    alignItems: 'center',
  },
  submittingText: {
    fontSize: 12,
    color: '#FFC107',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default PendingActions;