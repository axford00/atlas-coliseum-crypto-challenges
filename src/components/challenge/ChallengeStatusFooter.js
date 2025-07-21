// components/challenge/ChallengeStatusFooter.js - Status display footer
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const ChallengeStatusFooter = ({ challenge }) => {
  const getStatusInfo = () => ({
    current: challenge.status?.toUpperCase() || 'PENDING',
    direction: challenge.direction === 'incoming' ? 'Someone challenged you' : 'You challenged someone'
  });

  const statusInfo = getStatusInfo();

  return (
    <View style={styles.statusSection}>
      <Text style={styles.statusTitle}>📊 CHALLENGE STATUS</Text>
      <Text style={styles.statusText}>
        Current Status: {statusInfo.current}
      </Text>
      <Text style={styles.statusSubtext}>
        Direction: {statusInfo.direction}
      </Text>
      
      {/* Show additional crypto info if applicable */}
      {challenge.wagerAmount > 0 && (
        <View style={styles.cryptoInfo}>
          <Text style={styles.cryptoLabel}>💰 Crypto Challenge</Text>
          <Text style={styles.cryptoAmount}>
            {challenge.wagerAmount} {challenge.wagerToken} wager
          </Text>
        </View>
      )}
      
      {/* Show expiry info if applicable */}
      {challenge.dueDate && (
        <Text style={styles.expiryText}>
          ⏰ Expires: {new Date(challenge.dueDate).toLocaleDateString()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  statusSection: {
    backgroundColor: colors.ui.cardBg,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.ui.border,
    marginTop: 20,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  statusText: {
    fontSize: 14,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  statusSubtext: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  cryptoInfo: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ff6b35',
    alignItems: 'center',
  },
  cryptoLabel: {
    fontSize: 12,
    color: '#ff6b35',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cryptoAmount: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  expiryText: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default ChallengeStatusFooter;