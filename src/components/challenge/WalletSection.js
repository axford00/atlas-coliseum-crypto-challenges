// components/challenge/WalletSection.js - Wallet connection UI
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const WalletSection = ({ challenge, walletConnected, onConnectWallet }) => {
  // Only show for crypto challenges when wallet not connected and challenge is pending
  if (challenge.wagerAmount <= 0 || walletConnected || challenge.status !== 'pending') {
    return null;
  }

  return (
    <View style={styles.walletSection}>
      <Text style={styles.sectionTitle}>🔗 CRYPTO WALLET REQUIRED</Text>
      <Text style={styles.walletNotice}>
        This challenge involves crypto wagering ({challenge.wagerAmount} {challenge.wagerToken}). 
        Connect your wallet to participate.
      </Text>
      <TouchableOpacity 
        style={styles.connectWalletButton}
        onPress={onConnectWallet}
      >
        <Text style={styles.connectWalletText}>🔗 Connect Wallet</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  walletSection: {
    backgroundColor: colors.background.overlay,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  walletNotice: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 18,
  },
  connectWalletButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  connectWalletText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WalletSection;