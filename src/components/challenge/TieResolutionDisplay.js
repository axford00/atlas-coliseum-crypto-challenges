// FILE: components/challenge/TieResolutionDisplay.js
// 🚀 COMPLETE: New component for displaying tie resolution details

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const TieResolutionDisplay = ({ challenge }) => {
  if (challenge.status !== 'tie_resolved') return null;

  const refund = challenge.refundBreakdown;
  const wagerAmount = challenge.wagerAmount || 0;
  const wagerToken = challenge.wagerToken || 'SOL';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🤝 TIE RESOLUTION</Text>
      
      <View style={styles.explanationBox}>
        <Text style={styles.explanationTitle}>What happened?</Text>
        <Text style={styles.explanationText}>
          The community vote resulted in a tie. Both parties receive refunds after Atlas fees.
        </Text>
      </View>

      {refund && (
        <View style={styles.refundDetails}>
          <Text style={styles.refundTitle}>💰 REFUND BREAKDOWN</Text>
          
          <View style={styles.refundRow}>
            <Text style={styles.refundLabel}>Original Stakes:</Text>
            <Text style={styles.refundValue}>
              {wagerAmount * 2} {wagerToken}
            </Text>
          </View>
          
          <View style={styles.refundRow}>
            <Text style={styles.refundLabel}>Atlas Fee (2.5%):</Text>
            <Text style={styles.refundValue}>
              -{refund.atlasFeeCollected.toFixed(4)} {wagerToken}
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.refundRow}>
            <Text style={styles.refundLabel}>Your Refund:</Text>
            <Text style={[styles.refundValue, styles.refundHighlight]}>
              {refund.challengerRefund.toFixed(4)} {wagerToken}
            </Text>
          </View>
          
          <View style={styles.refundRow}>
            <Text style={styles.refundLabel}>Opponent Refund:</Text>
            <Text style={[styles.refundValue, styles.refundHighlight]}>
              {refund.challengeeRefund.toFixed(4)} {wagerToken}
            </Text>
          </View>
          
          <View style={styles.percentageInfo}>
            <Text style={styles.percentageText}>
              Each party received 97.5% of their original wager back
            </Text>
          </View>
        </View>
      )}

      <View style={styles.statusBox}>
        <Text style={styles.statusText}>
          ✅ Refunds have been processed to both wallets
        </Text>
      </View>
      
      <View style={styles.reasonBox}>
        <Text style={styles.reasonTitle}>📊 Voting Results:</Text>
        <Text style={styles.reasonText}>
          {challenge.tieDetails?.reason === 'equal_votes' 
            ? 'Equal number of votes for both sides'
            : 'No votes received during voting period'
          }
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
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFC107',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFC107',
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 1,
  },
  explanationBox: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFC107',
    marginBottom: 6,
  },
  explanationText: {
    fontSize: 12,
    color: colors.text.primary,
    lineHeight: 16,
  },
  refundDetails: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  refundTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  refundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  refundLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  refundValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  refundHighlight: {
    color: '#4CAF50',
  },
  divider: {
    height: 1,
    backgroundColor: colors.ui.border,
    marginVertical: 10,
  },
  percentageInfo: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 6,
    padding: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  percentageText: {
    fontSize: 11,
    color: '#4CAF50',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  statusBox: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  statusText: {
    fontSize: 12,
    color: '#4CAF50',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  reasonBox: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  reasonTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 11,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default TieResolutionDisplay;