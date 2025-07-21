// FILE: src/components/challenge/NegotiationModal.js
// 🚀 COMPLETE NEGOTIATION MODAL WITH DEBUG & SAFETY CHECKS

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions
} from 'react-native';
import { colors } from '../../theme/colors';
import { getAuth } from 'firebase/auth';
import challengeNegotiationService from '../../services/challengeNegotiationService';

// 🔍 IMMEDIATE IMPORT VERIFICATION
console.log('🔍 NegotiationModal: challengeNegotiationService imported:', !!challengeNegotiationService);
console.log('🔍 NegotiationModal: typeof service:', typeof challengeNegotiationService);
console.log('🔍 NegotiationModal: submitNegotiation method:', typeof challengeNegotiationService?.submitNegotiation);

if (!challengeNegotiationService) {
  console.error('❌ NegotiationModal: challengeNegotiationService is undefined!');
  console.error('❌ This means the import failed - check the file path and export');
} else if (!challengeNegotiationService.submitNegotiation) {
  console.error('❌ NegotiationModal: submitNegotiation method missing!');
  console.error('❌ Available methods:', Object.keys(challengeNegotiationService));
} else {
  console.log('✅ NegotiationModal: Service imported correctly with submitNegotiation method');
}

const { width } = Dimensions.get('window');

const NegotiationModal = ({ 
  visible, 
  challenge, 
  onClose, 
  onSubmit, 
  isSubmitting = false 
}) => {
  const [negotiationTerms, setNegotiationTerms] = useState({
    challenge: '',
    wagerAmount: '',
    wagerToken: '',
    expiryDays: '',
    notes: ''
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [slideAnim] = useState(new Animated.Value(0));
  const [submitting, setSubmitting] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;

  // Smart defaults - Extract from current challenge
  useEffect(() => {
    if (challenge && visible) {
      const challengeText = challenge.challenge || '';
      
      setNegotiationTerms({
        challenge: challengeText,
        wagerAmount: challenge.wagerAmount ? challenge.wagerAmount.toString() : '0',
        wagerToken: challenge.wagerToken || 'USDC',
        expiryDays: '7',
        notes: ''
      });

      // Animate in
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (!visible) {
      // Animate out
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [challenge, visible]);

  // Track changes for smart button state
  useEffect(() => {
    if (!challenge) return;

    const originalChallenge = challenge.challenge || '';
    const originalWager = challenge.wagerAmount ? challenge.wagerAmount.toString() : '0';
    const originalToken = challenge.wagerToken || 'USDC';
    
    const hasChanges = 
      negotiationTerms.challenge !== originalChallenge ||
      negotiationTerms.wagerAmount !== originalWager ||
      negotiationTerms.wagerToken !== originalToken ||
      negotiationTerms.expiryDays !== '7' ||
      negotiationTerms.notes.trim().length > 0;
    
    setHasChanges(hasChanges);
  }, [negotiationTerms, challenge]);

  const tokenOptions = [
    { value: 'USDC', label: 'USDC', color: '#2775ca' },
    { value: 'SOL', label: 'SOL', color: '#9945ff' },
    { value: 'BONK', label: 'BONK', color: '#ff6b35' }
  ];

  const expiryOptions = [
    { value: '1', label: '1 Day', emoji: '⚡' },
    { value: '3', label: '3 Days', emoji: '🔥' },
    { value: '7', label: '1 Week', emoji: '⭐' },
    { value: '14', label: '2 Weeks', emoji: '💪' },
    { value: '30', label: '1 Month', emoji: '🏆' }
  ];

  const updateField = (field, value) => {
    setNegotiationTerms(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 🚀 ENHANCED SUBMIT WITH COMPREHENSIVE ERROR HANDLING
  const handleSubmit = async () => {
    if (!hasChanges) {
      Alert.alert('No Changes', 'You haven\'t made any changes to negotiate.');
      return;
    }

    if (!negotiationTerms.challenge.trim()) {
      Alert.alert('Error', 'Challenge description is required');
      return;
    }

    if (negotiationTerms.wagerAmount && isNaN(parseFloat(negotiationTerms.wagerAmount))) {
      Alert.alert('Error', 'Wager amount must be a valid number');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setSubmitting(true);

      // ✅ COMPREHENSIVE SAFETY CHECKS
      console.log('🔍 Pre-submit service check:', {
        serviceAvailable: !!challengeNegotiationService,
        serviceType: typeof challengeNegotiationService,
        methodAvailable: typeof challengeNegotiationService?.submitNegotiation,
        challengeId: challenge?.id,
        userId: user?.uid
      });

      if (!challengeNegotiationService) {
        console.error('❌ challengeNegotiationService is undefined');
        throw new Error('Negotiation service not available. Please refresh the app and try again.');
      }

      if (typeof challengeNegotiationService.submitNegotiation !== 'function') {
        console.error('❌ submitNegotiation method is not a function');
        console.error('Service type:', typeof challengeNegotiationService);
        console.error('Available properties:', Object.keys(challengeNegotiationService || {}));
        throw new Error('Negotiation service method not available. Please refresh the app and try again.');
      }

      if (!challenge?.id) {
        throw new Error('Challenge ID is missing');
      }

      const negotiationData = {
        negotiationType: 'counter_offer',
        originalChallenge: challenge?.challenge,
        proposedChallenge: negotiationTerms.challenge.trim(),
        originalWager: challenge?.wagerAmount || 0,
        proposedWagerAmount: parseFloat(negotiationTerms.wagerAmount) || 0,
        originalWagerToken: challenge?.wagerToken || 'USDC',
        proposedWagerToken: negotiationTerms.wagerToken,
        proposedExpiryDays: parseInt(negotiationTerms.expiryDays) || 7,
        notes: negotiationTerms.notes.trim(),
        timestamp: new Date().toISOString()
      };

      console.log('🤝 Submitting negotiation via backend service:', negotiationData);
      console.log('🤝 Service object check:', {
        hasService: !!challengeNegotiationService,
        hasMethod: !!challengeNegotiationService.submitNegotiation,
        methodType: typeof challengeNegotiationService.submitNegotiation
      });

      // ✅ CALL THE BACKEND SERVICE WITH VERIFICATION
      const result = await challengeNegotiationService.submitNegotiation(
        challenge.id,
        negotiationData,
        user
      );

      console.log('✅ Raw service result:', result);

      if (result && result.success) {
        console.log('✅ Negotiation submitted successfully:', result);
        
        // Create success message
        let successMessage = `Your counter-offer has been sent to ${challenge.fromName}!`;
        
        // Add money flow description if available
        if (result.moneyFlow?.summary?.description) {
          successMessage += `\n\n${result.moneyFlow.summary.description}`;
        } else if (result.moneyFlow?.summary?.impact) {
          successMessage += `\n\n${result.moneyFlow.summary.impact}`;
        } else if (negotiationData.proposedWagerAmount !== negotiationData.originalWager) {
          const change = negotiationData.proposedWagerAmount - negotiationData.originalWager;
          if (change > 0) {
            successMessage += `\n\nWager increased by ${change} ${negotiationData.proposedWagerToken}`;
          } else if (change < 0) {
            successMessage += `\n\nWager decreased by ${Math.abs(change)} ${negotiationData.proposedWagerToken}`;
          }
        }
        
        Alert.alert(
          '🤝 Negotiation Sent!', 
          successMessage,
          [
            { 
              text: 'Done', 
              onPress: () => {
                onClose(); // Close the modal
                // Call the parent's onSubmit if provided (for UI updates)
                if (onSubmit) {
                  onSubmit(negotiationData);
                }
              }
            }
          ]
        );
      } else {
        console.error('❌ Service returned unsuccessful result:', result);
        throw new Error(result?.message || 'Unknown error occurred while submitting negotiation');
      }

    } catch (error) {
      console.error('❌ Error submitting negotiation:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // User-friendly error messages
      let errorMessage = 'Failed to submit negotiation';
      
      if (error.message.includes('service not available')) {
        errorMessage = 'Service temporarily unavailable. Please refresh the app and try again.';
      } else if (error.message.includes('permissions')) {
        errorMessage = 'Permission denied. Please check your login status and try again.';
      } else if (error.message.includes('network') || error.message.includes('offline')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0]
                })
              }],
              opacity: slideAnim
            }
          ]}
        >
          {/* 🎯 TOP: Clean centered title */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            
            <Text style={styles.title}>🤝 Negotiate Challenge</Text>
            <Text style={styles.subtitle}>
              Counter-offer to {challenge?.fromName || 'challenger'}
            </Text>
          </View>

          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            
            {/* 📊 MIDDLE: Clean 3x2 table */}
            <View style={styles.negotiationTable}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>CURRENT TERMS</Text>
                <Text style={styles.tableHeaderText}>NEW TERMS</Text>
              </View>
              
              {/* Row 1: Challenge */}
              <View style={styles.tableRow}>
                <View style={styles.currentColumn}>
                  <Text style={styles.rowLabel}>Challenge</Text>
                  <Text style={styles.currentValue}>{challenge?.challenge}</Text>
                </View>
                <View style={styles.newColumn}>
                  <Text style={styles.rowLabel}>Challenge</Text>
                  <TextInput
                    style={[
                      styles.tableInput,
                      focusedField === 'challenge' && styles.tableInputFocused
                    ]}
                    value={negotiationTerms.challenge}
                    onChangeText={(value) => updateField('challenge', value)}
                    onFocus={() => setFocusedField('challenge')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter new challenge..."
                    placeholderTextColor={colors.text?.secondary || '#888'}
                    multiline={true}
                    numberOfLines={2}
                    editable={!submitting}
                  />
                </View>
              </View>
              
              {/* Row 2: Wager */}
              <View style={styles.tableRow}>
                <View style={styles.currentColumn}>
                  <Text style={styles.rowLabel}>Wager</Text>
                  <Text style={styles.currentValue}>
                    {challenge?.wagerAmount > 0 ? 
                      `${challenge.wagerAmount} ${challenge.wagerToken}` : 
                      'No wager'
                    }
                  </Text>
                </View>
                <View style={styles.newColumn}>
                  <Text style={styles.rowLabel}>Wager</Text>
                  <View style={styles.wagerInputContainer}>
                    <TextInput
                      style={[
                        styles.tableInput,
                        styles.wagerInput,
                        focusedField === 'wager' && styles.tableInputFocused
                      ]}
                      value={negotiationTerms.wagerAmount}
                      onChangeText={(value) => updateField('wagerAmount', value)}
                      onFocus={() => setFocusedField('wager')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="0"
                      placeholderTextColor={colors.text?.secondary || '#888'}
                      keyboardType="decimal-pad"
                      editable={!submitting}
                    />
                    <View style={styles.tokenSelector}>
                      {tokenOptions.map((token) => (
                        <TouchableOpacity
                          key={token.value}
                          style={[
                            styles.tokenButton,
                            negotiationTerms.wagerToken === token.value && styles.tokenButtonSelected,
                            { borderColor: token.color }
                          ]}
                          onPress={() => updateField('wagerToken', token.value)}
                          disabled={submitting}
                        >
                          <Text style={[
                            styles.tokenButtonText,
                            negotiationTerms.wagerToken === token.value && { color: token.color }
                          ]}>
                            {token.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Row 3: Expiry */}
              <View style={styles.tableRow}>
                <View style={styles.currentColumn}>
                  <Text style={styles.rowLabel}>Expiry</Text>
                  <Text style={styles.currentValue}>7 days</Text>
                </View>
                <View style={styles.newColumn}>
                  <Text style={styles.rowLabel}>Expiry</Text>
                  <View style={styles.expirySelector}>
                    {expiryOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.expiryButton,
                          negotiationTerms.expiryDays === option.value && styles.expiryButtonSelected
                        ]}
                        onPress={() => updateField('expiryDays', option.value)}
                        disabled={submitting}
                      >
                        <Text style={styles.expiryEmoji}>{option.emoji}</Text>
                        <Text style={[
                          styles.expiryButtonText,
                          negotiationTerms.expiryDays === option.value && styles.expiryButtonTextSelected
                        ]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
              
              {/* Optional Notes Section */}
              <View style={styles.tableRow}>
                <View style={styles.currentColumn}>
                  <Text style={styles.rowLabel}>Notes</Text>
                  <Text style={styles.currentValue}>-</Text>
                </View>
                <View style={styles.newColumn}>
                  <Text style={styles.rowLabel}>Notes (Optional)</Text>
                  <TextInput
                    style={[
                      styles.tableInput,
                      styles.notesInput,
                      focusedField === 'notes' && styles.tableInputFocused
                    ]}
                    value={negotiationTerms.notes}
                    onChangeText={(value) => updateField('notes', value)}
                    onFocus={() => setFocusedField('notes')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Add a note to explain your changes..."
                    placeholderTextColor={colors.text?.secondary || '#888'}
                    multiline={true}
                    numberOfLines={3}
                    editable={!submitting}
                  />
                </View>
              </View>
            </View>

          </ScrollView>

          {/* 💡 TIP (just above button) */}
          <View style={styles.tipContainer}>
            <Text style={styles.tipText}>
              💡 Adjust the challenge difficulty, wager amount, or time limit. {challenge?.fromName} will receive your counter-offer.
            </Text>
          </View>

          {/* 🚀 BOTTOM: Send Changes button */}
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (submitting || !hasChanges) && styles.sendButtonSubmitting
            ]}
            onPress={handleSubmit}
            disabled={submitting || !hasChanges}
          >
            <Text style={styles.sendButtonText}>
              {submitting ? '📤 Sending Changes...' : '🚀 Send Changes'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingTop: 60,
    paddingHorizontal: 15,
    paddingBottom: 40,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: colors.background?.dark || '#1a1a1a',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary || '#6C5CE7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },

  // 🎯 TOP: Clean centered header
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary || '#6C5CE7',
    backgroundColor: colors.background?.overlay || '#2a2a2a',
    position: 'relative',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary || '#6C5CE7',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.text?.secondary || '#888',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.ui?.border || '#333',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    color: colors.text?.primary || '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  content: {
    flex: 1,
    padding: 20,
  },

  // 📊 MIDDLE: Clean 3x2 table
  negotiationTable: {
    backgroundColor: colors.ui?.cardBg || '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.primary || '#6C5CE7',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary || '#6C5CE7',
    marginBottom: 20,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.primary || '#6C5CE7',
    textAlign: 'center',
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 25,
    minHeight: 80,
  },
  currentColumn: {
    flex: 1,
    paddingRight: 10,
  },
  newColumn: {
    flex: 1,
    paddingLeft: 10,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text?.secondary || '#888',
    marginBottom: 8,
  },
  currentValue: {
    fontSize: 14,
    color: colors.text?.primary || '#fff',
    backgroundColor: colors.background?.dark || '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.ui?.border || '#444',
    minHeight: 45,
    textAlignVertical: 'center',
  },
  tableInput: {
    backgroundColor: colors.background?.dark || '#1a1a1a',
    borderWidth: 1,
    borderColor: colors.ui?.border || '#444',
    borderRadius: 8,
    padding: 12,
    color: colors.text?.primary || '#fff',
    fontSize: 14,
    minHeight: 45,
    textAlignVertical: 'top',
  },
  tableInputFocused: {
    borderColor: colors.primary || '#6C5CE7',
    backgroundColor: colors.ui?.inputBg || '#2a2a2a',
  },
  wagerInputContainer: {
    gap: 8,
  },
  wagerInput: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  tokenSelector: {
    flexDirection: 'row',
    gap: 5,
  },
  tokenButton: {
    flex: 1,
    backgroundColor: colors.ui?.inputBg || '#2a2a2a',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tokenButtonSelected: {
    backgroundColor: colors.background?.overlay || '#333',
  },
  tokenButtonText: {
    color: colors.text?.primary || '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  expirySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  expiryButton: {
    backgroundColor: colors.ui?.inputBg || '#2a2a2a',
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 55,
    flex: 1,
  },
  expiryButtonSelected: {
    borderColor: colors.primary || '#6C5CE7',
    backgroundColor: colors.background?.overlay || '#333',
  },
  expiryEmoji: {
    fontSize: 12,
    marginBottom: 2,
  },
  expiryButtonText: {
    color: colors.text?.secondary || '#888',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  expiryButtonTextSelected: {
    color: colors.primary || '#6C5CE7',
  },

  // 💡 TIP (just above button)
  tipContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.ui?.inputBg || '#2a2a2a',
  },
  tipText: {
    color: colors.text?.secondary || '#888',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },

  // 🚀 BOTTOM: Send Changes button
  sendButton: {
    backgroundColor: colors.primary || '#6C5CE7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sendButtonSubmitting: {
    backgroundColor: colors.ui?.border || '#444',
  },
  sendButtonText: {
    color: colors.background?.dark || '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default NegotiationModal;