// components/challenge/CryptoContractInfo.js - Contract status display
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const CryptoContractInfo = ({ challenge }) => {
  if (!challenge.cryptoContract && !challenge.escrowAccount) return null;

  // Handle both new cryptoContract format and legacy escrowAccount format
  const contractData = challenge.cryptoContract || {
    totalWager: challenge.cryptoDetails?.totalPot || (challenge.wagerAmount * 2),
    atlasFee: challenge.cryptoDetails?.atlasFee || (challenge.wagerAmount * 2 * 0.025),
    winnerPayout: challenge.cryptoDetails?.winnerPayout || (challenge.wagerAmount * 2 * 0.975),
    escrowId: challenge.escrowAccount
  };

  return (
    <View style={styles.cryptoContractSection}>
      <Text style={styles.contractTitle}>💰 CRYPTO CONTRACT ACTIVE</Text>
      <View style={styles.contractDetails}>
        <Text style={styles.contractText}>
          🏦 Total Wager: {contractData.totalWager} {challenge.wagerToken}
        </Text>
        <Text style={styles.contractText}>
          ⚡ Atlas Fee: {contractData.atlasFee} {challenge.wagerToken}
        </Text>
        <Text style={styles.contractText}>
          🏆 Winner Gets: {contractData.winnerPayout} {challenge.wagerToken}
        </Text>
        <Text style={styles.contractText}>
          📜 Escrow: {contractData.escrowId?.substr(0, 12)}...
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cryptoContractSection: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#ff6b35',
  },
  contractTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b35',
    textAlign: 'center',
    marginBottom: 12,
  },
  contractDetails: {
    gap: 6,
  },
  contractText: {
    fontSize: 13,
    color: colors.text.primary,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
});

export default CryptoContractInfo;