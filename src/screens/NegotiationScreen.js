// src/screens/NegotiationScreen.js - DEDICATED NEGOTIATION SCREEN
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions
} from 'react-native';
import { colors, globalStyles } from '../theme/colors';

const { width, height } = Dimensions.get('window');

const NegotiationScreen = ({ route, navigation }) => {
  const { challenge } = route.params;
  
  // Extract current values
  const currentPushUps = challenge?.challenge?.match(/(\d+)/)?.[1] || '10';
  const currentWager = challenge?.wagerAmount?.toString() || '1';
  
  // State management
  const [pushUpCount, setPushUpCount] = useState(currentPushUps);
  const [wagerAmount, setWagerAmount] = useState(currentWager);
  const [expiryDays, setExpiryDays] = useState('7');
  const [counterNote, setCounterNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    const hasChanges = 
      pushUpCount !== currentPushUps ||
      wagerAmount !== currentWager ||
      expiryDays !== '7' ||
      counterNote.trim().length > 0;
    
    setHasChanges(hasChanges);
  }, [pushUpCount, wagerAmount, expiryDays, counterNote]);

  const expiryOptions = [
    { value: '1', label: '1 Day', emoji: '⚡', color: '#ff4444' },
    { value: '3', label: '3 Days', emoji: '🔥', color: '#ff6b35' },
    { value: '7', label: '1 Week', emoji: '⭐', color: colors.primary },
    { value: '14', label: '2 Weeks', emoji: '💪', color: '#4CAF50' },
    { value: '30', label: '1 Month', emoji: '🏆', color: '#9C27B0' }
  ];

  const calculateNewChallenge = () => {
    const baseText = challenge?.challenge?.replace(/\d+/, pushUpCount) || `${pushUpCount} push ups`;
    return baseText;
  };

  const calculateSavings = () => {
    const originalAmount = parseFloat(currentWager);
    const newAmount = parseFloat(wagerAmount);
    return originalAmount - newAmount;
  };

  const getWagerColor = () => {
    const savings = calculateSavings();
    if (savings > 0) return '#4CAF50'; // Green for savings
    if (savings < 0) return '#ff6b35'; // Orange for more expensive
    return colors.text.primary; // Default
  };

  const getDifficultyColor = () => {
    const current = parseInt(currentPushUps);
    const new_ = parseInt(pushUpCount);
    if (new_ > current) return '#ff6b35'; // Harder
    if (new_ < current) return '#4CAF50'; // Easier
    return colors.text.primary; // Same
  };

  const handleSubmit = async () => {
    if (!hasChanges) {
      Alert.alert('No Changes', 'Please make some changes before submitting your counter-offer.');
      return;
    }

    try {
      setIsSubmitting(true);

      const negotiationData = {
        negotiationType: 'counter_offer',
        originalChallenge: challenge?.challenge,
        proposedChallenge: calculateNewChallenge(),
        originalWager: challenge?.wagerAmount,
        proposedWagerAmount: parseFloat(wagerAmount),
        wagerToken: challenge?.wagerToken || 'USDC',
        proposedExpiryDays: parseInt(expiryDays),
        note: counterNote.trim(),
        timestamp: new Date().toISOString()
      };

      console.log('🤝 Submitting negotiation:', negotiationData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(
        '🚀 Counter-Offer Sent!',
        `Your negotiation has been sent to ${challenge?.fromName}. They'll receive a notification and can accept, decline, or counter your proposal.`,
        [{ 
          text: 'Done!', 
          onPress: () => navigation.goBack(),
          style: 'default'
        }]
      );

    } catch (error) {
      console.error('❌ Error submitting negotiation:', error);
      Alert.alert('Error', 'Failed to send counter-offer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.background}>
      <View style={styles.container}>
        <View style={globalStyles?.hudCorner1 || styles.fallbackCorner} />
        <View style={globalStyles?.hudCorner2 || styles.fallbackCorner} />
        <View style={globalStyles?.hudCorner3 || styles.fallbackCorner} />
        <View style={globalStyles?.hudCorner4 || styles.fallbackCorner} />

        {/* ✅ CENTERED Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleTop}>NEGOTIATE</Text>
            <Text style={styles.titleBottom}>CHALLENGE</Text>
          </View>
          <Text style={styles.subtitle}>Counter-Offer to {challenge?.fromName}</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Original Challenge */}
          <View style={styles.originalSection}>
            <Text style={styles.sectionTitle}>📋 CURRENT CHALLENGE</Text>
            <View style={styles.originalCard}>
              <Text style={styles.originalText}>{challenge?.challenge}</Text>
              {challenge?.wagerAmount > 0 && (
                <Text style={styles.originalWager}>
                  💰 {challenge.wagerAmount} {challenge.wagerToken} wager
                </Text>
              )}
              <Text style={styles.originalExpiry}>⏰ 7 days to complete</Text>
            </View>
          </View>

          {/* Challenge Difficulty Control */}
          <View style={styles.controlSection}>
            <Text style={styles.controlTitle}>🏋️ CHALLENGE DIFFICULTY</Text>
            <View style={styles.numberControlContainer}>
              <TouchableOpacity 
                style={styles.numberButton}
                onPress={() => setPushUpCount(Math.max(1, parseInt(pushUpCount) - 1).toString())}
                disabled={isSubmitting}
              >
                <Text style={styles.numberButtonText}>−</Text>
              </TouchableOpacity>
              
              <View style={styles.numberDisplay}>
                <TextInput
                  style={[styles.numberInput, { color: getDifficultyColor() }]}
                  value={pushUpCount}
                  onChangeText={setPushUpCount}
                  keyboardType="number-pad"
                  textAlign="center"
                  editable={!isSubmitting}
                />
                <Text style={styles.numberLabel}>push ups</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.numberButton}
                onPress={() => setPushUpCount((parseInt(pushUpCount) + 1).toString())}
                disabled={isSubmitting}
              >
                <Text style={styles.numberButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.changeIndicator, { color: getDifficultyColor() }]}>
              {parseInt(pushUpCount) > parseInt(currentPushUps) 
                ? '📈 Making it harder (+' + (parseInt(pushUpCount) - parseInt(currentPushUps)) + ')'
                : parseInt(pushUpCount) < parseInt(currentPushUps)
                ? '📉 Making it easier (-' + (parseInt(currentPushUps) - parseInt(pushUpCount)) + ')'
                : '✅ Same difficulty'
              }
            </Text>
          </View>

          {/* Crypto Wager Control */}
          {challenge?.wagerAmount > 0 && (
            <View style={styles.controlSection}>
              <Text style={styles.controlTitle}>💰 CRYPTO WAGER</Text>
              <View style={styles.numberControlContainer}>
                <TouchableOpacity 
                  style={styles.numberButton}
                  onPress={() => setWagerAmount(Math.max(0.5, parseFloat(wagerAmount) - 0.5).toFixed(1))}
                  disabled={isSubmitting}
                >
                  <Text style={styles.numberButtonText}>−</Text>
                </TouchableOpacity>
                
                <View style={styles.numberDisplay}>
                  <TextInput
                    style={[styles.numberInput, { color: getWagerColor() }]}
                    value={wagerAmount}
                    onChangeText={setWagerAmount}
                    keyboardType="decimal-pad"
                    textAlign="center"
                    editable={!isSubmitting}
                  />
                  <Text style={styles.numberLabel}>{challenge.wagerToken}</Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.numberButton}
                  onPress={() => setWagerAmount((parseFloat(wagerAmount) + 0.5).toFixed(1))}
                  disabled={isSubmitting}
                >
                  <Text style={styles.numberButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.wagerBreakdown}>
                <Text style={styles.winnerAmount}>
                  Winner gets: ${(parseFloat(wagerAmount) * 2 * 0.975).toFixed(2)} {challenge.wagerToken}
                </Text>
                {calculateSavings() !== 0 && (
                  <Text style={[styles.savingsText, { color: getWagerColor() }]}>
                    {calculateSavings() > 0 ? '💰 Saving: $' : '💸 Adding: $'}
                    {Math.abs(calculateSavings()).toFixed(2)}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Time Limit Control */}
          <View style={styles.controlSection}>
            <Text style={styles.controlTitle}>⏰ TIME LIMIT</Text>
            <View style={styles.expiryGrid}>
              {expiryOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.expiryOption,
                    expiryDays === option.value && [
                      styles.expiryOptionSelected,
                      { borderColor: option.color }
                    ]
                  ]}
                  onPress={() => setExpiryDays(option.value)}
                  disabled={isSubmitting}
                >
                  <Text style={styles.expiryEmoji}>{option.emoji}</Text>
                  <Text style={[
                    styles.expiryOptionText,
                    expiryDays === option.value && { color: option.color }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Message Section */}
          <View style={styles.controlSection}>
            <Text style={styles.controlTitle}>💬 MESSAGE TO {challenge?.fromName?.toUpperCase()}</Text>
            <TextInput
              style={styles.messageInput}
              value={counterNote}
              onChangeText={setCounterNote}
              placeholder="Explain why you want these changes..."
              placeholderTextColor={colors.text.secondary}
              multiline
              numberOfLines={4}
              editable={!isSubmitting}
            />
          </View>

          {/* Preview Section */}
          {hasChanges && (
            <View style={styles.previewSection}>
              <Text style={styles.previewTitle}>📝 YOUR COUNTER-OFFER</Text>
              <View style={styles.previewCard}>
                <Text style={styles.previewChallenge}>"{calculateNewChallenge()}"</Text>
                <Text style={styles.previewDetails}>
                  💰 {wagerAmount} {challenge?.wagerToken || 'USDC'} • ⏰ {expiryDays} days
                </Text>
                {counterNote.trim() && (
                  <Text style={styles.previewMessage}>💬 "{counterNote.trim()}"</Text>
                )}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonSection}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>❌ Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.submitButton,
                !hasChanges && styles.submitButtonDisabled,
                isSubmitting && styles.submittingButton
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || !hasChanges}
            >
              <Text style={[
                styles.submitButtonText,
                !hasChanges && styles.submitButtonTextDisabled
              ]}>
                {isSubmitting ? '📤 Sending...' : hasChanges ? '🚀 Send Counter-Offer' : '💭 Make Changes First'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
  },
  
  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  titleTop: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.secondary,
    letterSpacing: 3,
    marginBottom: -5,
  },
  titleBottom: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
  },

  // Original Section
  originalSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
    letterSpacing: 1,
  },
  originalCard: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.ui.border,
  },
  originalText: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  originalWager: {
    color: '#ff6b35',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  originalExpiry: {
    color: colors.text.secondary,
    fontSize: 12,
  },

  // Control Sections
  controlSection: {
    marginBottom: 30,
  },
  controlTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 15,
    textAlign: 'center',
  },

  // Number Controls
  numberControlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ui.inputBg,
    borderRadius: 16,
    padding: 12,
    borderWidth: 2,
    borderColor: colors.ui.border,
    marginBottom: 10,
  },
  numberButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  numberButtonText: {
    color: colors.background.dark,
    fontSize: 28,
    fontWeight: 'bold',
  },
  numberDisplay: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 30,
  },
  numberInput: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    minWidth: 80,
    color: colors.text.primary,
  },
  numberLabel: {
    color: colors.text.secondary,
    fontSize: 14,
    marginTop: 4,
    fontWeight: 'bold',
  },
  changeIndicator: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
  },

  // Wager Breakdown
  wagerBreakdown: {
    alignItems: 'center',
    marginTop: 10,
  },
  winnerAmount: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Expiry Grid
  expiryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  expiryOption: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 65,
    flex: 1,
    maxWidth: '18%',
  },
  expiryOptionSelected: {
    backgroundColor: colors.background.overlay,
  },
  expiryEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  expiryOptionText: {
    color: colors.text.secondary,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Message Input
  messageInput: {
    backgroundColor: colors.ui.inputBg,
    borderWidth: 2,
    borderColor: colors.ui.border,
    borderRadius: 12,
    color: colors.text.primary,
    padding: 15,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },

  // Preview Section
  previewSection: {
    marginBottom: 30,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 1,
  },
  previewCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    padding: 18,
    borderWidth: 2,
    borderColor: '#4CAF50',
    alignItems: 'center',
  },
  previewChallenge: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  previewDetails: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: 8,
  },
  previewMessage: {
    color: colors.text.secondary,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Buttons
  buttonSection: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.ui.inputBg,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.ui.border,
  },
  cancelButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: colors.ui.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  submittingButton: {
    backgroundColor: colors.ui.border,
  },
  submitButtonText: {
    color: colors.background.dark,
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButtonTextDisabled: {
    color: colors.text.secondary,
  },

  // Fallback
  fallbackCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: 'transparent',
  },
});

export default NegotiationScreen;