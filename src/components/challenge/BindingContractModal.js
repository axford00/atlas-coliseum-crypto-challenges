// FILE: src/components/challenge/BindingContractModal.js
// 🚀 FIXED: Beautiful contract confirmation modal with proper Atlas theme

import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../../theme/colors';

const BindingContractModal = ({ visible, challenge, escrowResult, onClose }) => {
  if (!visible || !challenge || !escrowResult) return null;

  const breakdown = escrowResult.breakdown;
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>🔒 CONTRACT LOCKED & BINDING</Text>
            <Text style={styles.subtitle}>Both parties have deposited - Challenge is now live!</Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Challenge Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📋 CHALLENGE</Text>
              <Text style={styles.challengeText}>{challenge.challenge}</Text>
            </View>

            {/* Financial Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💰 FINANCIAL BREAKDOWN</Text>
              
              <View style={styles.breakdownContainer}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Your Deposit:</Text>
                  <Text style={styles.breakdownValue}>
                    {challenge.wagerAmount} {challenge.wagerToken}
                  </Text>
                </View>
                
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Opponent Deposit:</Text>
                  <Text style={styles.breakdownValue}>
                    {challenge.wagerAmount} {challenge.wagerToken}
                  </Text>
                </View>
                
                <View style={[styles.breakdownRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Pot:</Text>
                  <Text style={styles.totalValue}>
                    {breakdown.totalPot} {challenge.wagerToken}
                  </Text>
                </View>
                
                <View style={styles.breakdownRow}>
                  <Text style={styles.feeLabel}>Atlas Fee (2.5%):</Text>
                  <Text style={styles.feeValue}>
                    -{breakdown.atlasFee.toFixed(4)} {challenge.wagerToken}
                  </Text>
                </View>
                
                <View style={[styles.breakdownRow, styles.winnerRow]}>
                  <Text style={styles.winnerLabel}>Winner Receives:</Text>
                  <Text style={styles.winnerValue}>
                    {breakdown.winnerPayout.toFixed(4)} {challenge.wagerToken}
                  </Text>
                </View>
              </View>
            </View>

            {/* Contract Terms */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📜 BINDING CONTRACT TERMS</Text>
              
              <View style={styles.termsContainer}>
                <View style={styles.termRow}>
                  <Text style={styles.termIcon}>🔒</Text>
                  <Text style={styles.termText}>
                    Funds are locked in Atlas Vault escrow until completion
                  </Text>
                </View>
                
                <View style={styles.termRow}>
                  <Text style={styles.termIcon}>⚖️</Text>
                  <Text style={styles.termText}>
                    Disputes resolved through 24-hour community voting
                  </Text>
                </View>
                
                <View style={styles.termRow}>
                  <Text style={styles.termIcon}>🏆</Text>
                  <Text style={styles.termText}>
                    Winner automatically receives payout upon approval
                  </Text>
                </View>
                
                <View style={styles.termRow}>
                  <Text style={styles.termIcon}>🤝</Text>
                  <Text style={styles.termText}>
                    Ties result in equal refunds (97.5% each) after Atlas fee
                  </Text>
                </View>
              </View>
            </View>

            {/* Security Information */}
            <View style={styles.securitySection}>
              <Text style={styles.securityTitle}>🛡️ SECURITY & FAIRNESS</Text>
              <View style={styles.securityGrid}>
                <View style={styles.securityItem}>
                  <Text style={styles.securityIcon}>🔐</Text>
                  <Text style={styles.securityLabel}>Solana Escrow</Text>
                  <Text style={styles.securityDesc}>Smart contract secured</Text>
                </View>
                
                <View style={styles.securityItem}>
                  <Text style={styles.securityIcon}>🏛️</Text>
                  <Text style={styles.securityLabel}>Community Voting</Text>
                  <Text style={styles.securityDesc}>Decentralized disputes</Text>
                </View>
                
                <View style={styles.securityItem}>
                  <Text style={styles.securityIcon}>⚡</Text>
                  <Text style={styles.securityLabel}>Instant Payout</Text>
                  <Text style={styles.securityDesc}>Automatic distribution</Text>
                </View>
              </View>
            </View>

            {/* Challenge Status */}
            <View style={styles.statusSection}>
              <Text style={styles.statusTitle}>🚀 CHALLENGE STATUS</Text>
              <Text style={styles.statusText}>
                Contract is now LIVE and BINDING. Complete the challenge and submit video proof to win!
              </Text>
            </View>
          </ScrollView>

          {/* Action Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={onClose}>
              <Text style={styles.actionButtonText}>🎯 LET'S GO!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.background.dark,
    borderRadius: 20,
    width: '100%',
    maxWidth: 450,
    maxHeight: '90%',
    borderWidth: 3,
    borderColor: colors.primary, // ✅ FIXED: Use Atlas primary color
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    padding: 25,
    borderBottomWidth: 2,
    borderBottomColor: colors.ui.border,
    alignItems: 'center',
    backgroundColor: colors.background.overlay, // ✅ FIXED: Use Atlas overlay
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary, // ✅ FIXED: Use Atlas primary color
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.primary,
    textAlign: 'center',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  
  // Sections
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary, // ✅ FIXED: Use Atlas primary color
    marginBottom: 12,
    letterSpacing: 1,
  },
  challengeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    lineHeight: 24,
  },
  
  // Financial Breakdown
  breakdownContainer: {
    backgroundColor: colors.ui.inputBg, // ✅ FIXED: Use Atlas input background
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.ui.border,
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b35', // Keep crypto orange for financial amounts
  },
  feeLabel: {
    fontSize: 13,
    color: '#ff6b6b',
  },
  feeValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  winnerRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.ui.border,
  },
  winnerLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  winnerValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary, // ✅ FIXED: Use Atlas primary color
  },
  
  // Contract Terms
  termsContainer: {
    gap: 12,
  },
  termRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  termIcon: {
    fontSize: 18,
    marginTop: 2,
  },
  termText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  
  // Security Section
  securitySection: {
    marginBottom: 20,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary, // ✅ FIXED: Use Atlas primary color
    marginBottom: 15,
    letterSpacing: 1,
  },
  securityGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  securityItem: {
    flex: 1,
    backgroundColor: colors.ui.inputBg, // ✅ FIXED: Use Atlas input background
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  securityIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  securityLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  securityDesc: {
    fontSize: 9,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 12,
  },
  
  // Status Section
  statusSection: {
    backgroundColor: colors.background.overlay, // ✅ FIXED: Use Atlas overlay
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary, // ✅ FIXED: Use Atlas primary color
    marginBottom: 8,
    textAlign: 'center',
  },
  statusText: {
    fontSize: 14,
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Action Button
  buttonContainer: {
    padding: 25,
    borderTopWidth: 1,
    borderTopColor: colors.ui.border,
  },
  actionButton: {
    backgroundColor: colors.primary, // ✅ FIXED: Use Atlas primary color
    borderRadius: 15,
    paddingVertical: 18,
    paddingHorizontal: 30,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.background.dark, // ✅ FIXED: Dark text on primary button
    letterSpacing: 1,
  },
});

export default BindingContractModal;