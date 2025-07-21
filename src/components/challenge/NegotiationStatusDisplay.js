// FILE: src/components/challenge/NegotiationStatusDisplay.js
// 🚀 COMPLETE: Show negotiation status and allow challenger to respond

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView
} from 'react-native';
import { colors } from '../../theme/colors';
import challengeNegotiationService from '../../services/challengeNegotiationService';

const NegotiationStatusDisplay = ({ 
  challenge, 
  user, 
  onAcceptNegotiation, 
  onDeclineNegotiation,
  isSubmitting = false 
}) => {
  const [negotiations, setNegotiations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (challenge?.id) {
      loadNegotiations();
    }
  }, [challenge?.id]);

  const loadNegotiations = async () => {
    try {
      setLoading(true);
      const negotiationList = await challengeNegotiationService.getNegotiationsForChallenge(challenge.id);
      setNegotiations(negotiationList);
    } catch (error) {
      console.error('Error loading negotiations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (negotiationId) => {
    Alert.alert(
      '✅ Accept Counter-Offer',
      'Are you sure you want to accept this counter-offer? The challenge will be updated with the new terms.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Accept', 
          onPress: async () => {
            const success = await onAcceptNegotiation(negotiationId);
            if (success) {
              await loadNegotiations(); // Refresh
            }
          }
        }
      ]
    );
  };

  const handleDecline = async (negotiationId) => {
    Alert.alert(
      '❌ Decline Counter-Offer',
      'Are you sure you want to decline this counter-offer? The challenge will revert to original terms.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Decline', 
          style: 'destructive',
          onPress: async () => {
            const success = await onDeclineNegotiation(negotiationId, 'Declined by challenger');
            if (success) {
              await loadNegotiations(); // Refresh
            }
          }
        }
      ]
    );
  };

  // Only show if there are negotiations
  if (!negotiations.length) {
    return null;
  }

  // Get the latest active negotiation
  const latestNegotiation = negotiations.find(n => n.isActive) || negotiations[0];

  if (!latestNegotiation) {
    return null;
  }

  const isChallenger = user?.uid === challenge.from;
  const isNegotiator = user?.uid === latestNegotiation.fromUserId;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🤝 NEGOTIATION STATUS</Text>
        <Text style={styles.status}>
          {latestNegotiation.status === 'pending_response' ? 'AWAITING RESPONSE' :
           latestNegotiation.status === 'accepted' ? 'ACCEPTED' :
           latestNegotiation.status === 'declined' ? 'DECLINED' : 
           latestNegotiation.status.toUpperCase()}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Negotiation Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>📋 PROPOSED CHANGES</Text>
          
          {/* Challenge Change */}
          {latestNegotiation.originalChallenge !== latestNegotiation.proposedChallenge && (
            <View style={styles.changeRow}>
              <Text style={styles.changeLabel}>Challenge:</Text>
              <Text style={styles.oldValue}>"{latestNegotiation.originalChallenge}"</Text>
              <Text style={styles.arrow}>→</Text>
              <Text style={styles.newValue}>"{latestNegotiation.proposedChallenge}"</Text>
            </View>
          )}

          {/* Wager Change */}
          {(latestNegotiation.originalWager !== latestNegotiation.proposedWagerAmount || 
            latestNegotiation.originalWagerToken !== latestNegotiation.proposedWagerToken) && (
            <View style={styles.changeRow}>
              <Text style={styles.changeLabel}>Wager:</Text>
              <Text style={styles.oldValue}>
                {latestNegotiation.originalWager > 0 ? 
                  `${latestNegotiation.originalWager} ${latestNegotiation.originalWagerToken}` : 
                  'No wager'
                }
              </Text>
              <Text style={styles.arrow}>→</Text>
              <Text style={styles.newValue}>
                {latestNegotiation.proposedWagerAmount > 0 ? 
                  `${latestNegotiation.proposedWagerAmount} ${latestNegotiation.proposedWagerToken}` : 
                  'No wager'
                }
              </Text>
            </View>
          )}

          {/* Money Flow Information */}
          {latestNegotiation.moneyFlows?.description && (
            <View style={styles.moneyFlowSection}>
              <Text style={styles.moneyFlowTitle}>💰 MONEY FLOWS</Text>
              <Text style={styles.moneyFlowDescription}>
                {latestNegotiation.moneyFlows.description}
              </Text>
            </View>
          )}

          {/* Notes */}
          {latestNegotiation.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesTitle}>📝 NOTES</Text>
              <Text style={styles.notesText}>"{latestNegotiation.notes}"</Text>
            </View>
          )}
        </View>

        {/* Action Buttons for Challenger */}
        {isChallenger && latestNegotiation.status === 'pending_response' && (
          <View style={styles.actionSection}>
            <Text style={styles.actionTitle}>🎯 YOUR RESPONSE REQUIRED</Text>
            <Text style={styles.actionSubtitle}>
              {latestNegotiation.fromName} has sent you a counter-offer
            </Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.acceptButton, isSubmitting && styles.disabledButton]}
                onPress={() => handleAccept(latestNegotiation.id)}
                disabled={isSubmitting}
              >
                <Text style={styles.acceptButtonText}>✅ ACCEPT COUNTER-OFFER</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.declineButton, isSubmitting && styles.disabledButton]}
                onPress={() => handleDecline(latestNegotiation.id)}
                disabled={isSubmitting}
              >
                <Text style={styles.declineButtonText}>❌ DECLINE & KEEP ORIGINAL</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Status for Negotiator */}
        {isNegotiator && latestNegotiation.status === 'pending_response' && (
          <View style={styles.statusSection}>
            <Text style={styles.statusTitle}>⏳ AWAITING RESPONSE</Text>
            <Text style={styles.statusText}>
              Your counter-offer has been sent to {latestNegotiation.toName}. 
              They will receive a notification and can accept or decline your proposal.
            </Text>
          </View>
        )}

        {/* Completed Status */}
        {latestNegotiation.status === 'accepted' && (
          <View style={styles.completedSection}>
            <Text style={styles.completedTitle}>✅ NEGOTIATION ACCEPTED</Text>
            <Text style={styles.completedText}>
              The challenge has been updated with the negotiated terms. 
              {isChallenger ? 'You can now proceed with the new challenge.' : 'The challenger has accepted your counter-offer!'}
            </Text>
          </View>
        )}

        {latestNegotiation.status === 'declined' && (
          <View style={styles.declinedSection}>
            <Text style={styles.declinedTitle}>❌ NEGOTIATION DECLINED</Text>
            <Text style={styles.declinedText}>
              The counter-offer was declined. The challenge remains with the original terms.
              {latestNegotiation.declineReason && ` Reason: "${latestNegotiation.declineReason}"`}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background?.overlay || '#2a2a2a',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFC107',
    maxHeight: 400,
  },
  header: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#FFC107',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFC107',
    marginBottom: 5,
  },
  status: {
    fontSize: 12,
    color: colors.text?.secondary || '#888',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  
  // Summary Section
  summarySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFC107',
    marginBottom: 10,
  },
  changeRow: {
    marginBottom: 15,
  },
  changeLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text?.secondary || '#888',
    marginBottom: 5,
  },
  oldValue: {
    fontSize: 13,
    color: '#ff6b6b',
    marginBottom: 3,
  },
  arrow: {
    fontSize: 14,
    color: '#FFC107',
    marginVertical: 2,
    textAlign: 'center',
  },
  newValue: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  
  // Money Flow Section
  moneyFlowSection: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ff6b35',
  },
  moneyFlowTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ff6b35',
    marginBottom: 6,
  },
  moneyFlowDescription: {
    fontSize: 12,
    color: colors.text?.primary || '#fff',
    lineHeight: 16,
  },
  
  // Notes Section
  notesSection: {
    backgroundColor: colors.ui?.inputBg || '#333',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text?.secondary || '#888',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 12,
    color: colors.text?.primary || '#fff',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  
  // Action Section
  actionSection: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#FFC107',
    marginBottom: 15,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFC107',
    textAlign: 'center',
    marginBottom: 5,
  },
  actionSubtitle: {
    fontSize: 12,
    color: colors.text?.secondary || '#888',
    textAlign: 'center',
    marginBottom: 15,
  },
  buttonContainer: {
    gap: 10,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  declineButton: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  declineButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  
  // Status Sections
  statusSection: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#FFC107',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFC107',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    color: colors.text?.primary || '#fff',
    textAlign: 'center',
    lineHeight: 16,
  },
  
  completedSection: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#4CAF50',
    alignItems: 'center',
  },
  completedTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  completedText: {
    fontSize: 12,
    color: colors.text?.primary || '#fff',
    textAlign: 'center',
    lineHeight: 16,
  },
  
  declinedSection: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#f44336',
    alignItems: 'center',
  },
  declinedTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f44336',
    marginBottom: 8,
  },
  declinedText: {
    fontSize: 12,
    color: colors.text?.primary || '#fff',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default NegotiationStatusDisplay;