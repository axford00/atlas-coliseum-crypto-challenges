// src/components/buddies/ChallengeModal.js - FULLY CORRECTED: Dynamic token selection
import { useState } from 'react';
import { 
  Modal, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { colors } from '../../theme/colors';
import FalloutButton from '../ui/FalloutButton';

// ✅ FIXED: Import the correct solanaMobileWalletService
import solanaMobileWalletService from '../../services/solana/solanaMobileWalletService';

const ChallengeModal = ({ visible, buddy, onClose, onSend, isLoading }) => {
  const [challengeText, setChallengeText] = useState('');
  const [challengeReward, setChallengeReward] = useState('');
  
  // Crypto wagering state
  const [enableCrypto, setEnableCrypto] = useState(false);
  const [wagerAmount, setWagerAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('USDC');
  const [challengeExpiry, setChallengeExpiry] = useState('7'); // days

  const tokens = [
    { symbol: 'USDC', name: 'USD Coin', bonus: '0%', color: '#2775CA' },
    { symbol: 'SOL', name: 'Solana', bonus: '10%', color: '#14F195' },
    { symbol: 'BONK', name: 'Bonk', bonus: '25%', color: '#FFA500' }
  ];

  const expiryOptions = [
    { value: '1', label: '1 Day' },
    { value: '3', label: '3 Days' },
    { value: '7', label: '1 Week' },
    { value: '14', label: '2 Weeks' },
    { value: '30', label: '1 Month' }
  ];

  const calculateBonusPool = () => {
    if (!enableCrypto || !wagerAmount) return 0;
    
    const amount = parseFloat(wagerAmount);
    if (isNaN(amount)) return 0;
    
    const token = tokens.find(t => t.symbol === selectedToken);
    const bonusPercent = parseFloat(token.bonus.replace('%', '')) / 100;
    
    return (amount * 2 * bonusPercent).toFixed(2);
  };

  // FIXED: Updated to 2.5% fee structure
  const calculateTotalPayout = () => {
    if (!enableCrypto || !wagerAmount) return 0;
    
    const amount = parseFloat(wagerAmount);
    if (isNaN(amount)) return 0;
    
    const bonus = parseFloat(calculateBonusPool());
    const atlasVaultFee = amount * 2 * 0.025; // 2.5% fee
    
    return (amount * 2 + bonus - atlasVaultFee).toFixed(2);
  };

  // ✅ FIXED: Updated handleSend to properly integrate with solanaMobileWalletService
  const handleSend = async () => {
    // Dismiss keyboard first
    Keyboard.dismiss();
    
    if (!challengeText.trim()) {
      Alert.alert('Error', 'Please enter a challenge description');
      return;
    }

    if (enableCrypto) {
      if (!wagerAmount || parseFloat(wagerAmount) <= 0) {
        Alert.alert('Error', 'Please enter a valid wager amount');
        return;
      }
      
      if (parseFloat(wagerAmount) < 1) {
        Alert.alert('Error', 'Minimum wager amount is $1');
        return;
      }
      
      if (parseFloat(wagerAmount) > 1000) {
        Alert.alert('Error', 'Maximum wager amount is $1000');
        return;
      }

      // ✅ FIXED: Check if wallet is connected for crypto challenges
      if (!solanaMobileWalletService.isConnected()) {
        Alert.alert(
          'Wallet Required',
          'Please connect your wallet first to create crypto challenges.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Connect Wallet', 
              onPress: async () => {
                try {
                  await solanaMobileWalletService.connectWallet();
                  // Retry sending after wallet connection
                  handleSend();
                } catch (error) {
                  Alert.alert('Error', 'Failed to connect wallet');
                }
              }
            }
          ]
        );
        return;
      }
      
      // For crypto challenges, pass crypto data
      const cryptoWager = {
        amount: parseFloat(wagerAmount),
        token: selectedToken,
        expiryDays: parseInt(challengeExpiry),
        bonus: selectedToken === 'BONK' ? '25%' : selectedToken === 'SOL' ? '10%' : '0%'
      };
      
      // ✅ FIXED: Pass the correct data structure
      onSend(challengeText, challengeReward, cryptoWager);
    } else {
      // For non-crypto challenges, pass null for crypto data
      onSend(challengeText, challengeReward, null);
    }
    
    // Reset form
    setChallengeText('');
    setChallengeReward('');
    setEnableCrypto(false);
    setWagerAmount('');
    setSelectedToken('USDC');
    setChallengeExpiry('7');
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setChallengeText('');
    setChallengeReward('');
    setEnableCrypto(false);
    setWagerAmount('');
    setSelectedToken('USDC');
    setChallengeExpiry('7');
    onClose();
  };

  // Dismiss keyboard when tapping outside input fields
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={styles.modalBackground}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                ⚡ Challenge {buddy?.name || buddy?.displayName}
              </Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Challenge Details */}
              <View style={styles.challengeContainer}>
                <Text style={styles.challengeLabel}>What's the challenge?</Text>
                <TextInput
                  style={styles.challengeInput}
                  placeholder="e.g., Work out 10 days in a row, Hit a 355lb back squat..."
                  placeholderTextColor={colors.text.secondary}
                  value={challengeText}
                  onChangeText={setChallengeText}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
                
                <Text style={styles.challengeLabel}>Traditional reward? (Optional)</Text>
                <TextInput
                  style={styles.challengeInput}
                  placeholder="e.g., $20 Starbucks gift card, Post-workout meal..."
                  placeholderTextColor={colors.text.secondary}
                  value={challengeReward}
                  onChangeText={setChallengeReward}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                  returnKeyType="done"
                  onSubmitEditing={dismissKeyboard}
                />
              </View>

              {/* Crypto Wagering Section */}
              <TouchableWithoutFeedback onPress={dismissKeyboard}>
                <View style={styles.cryptoContainer}>
                  <View style={styles.cryptoHeader}>
                    <Text style={styles.cryptoTitle}>💰 Crypto Wagering</Text>
                    <Switch
                      value={enableCrypto}
                      onValueChange={setEnableCrypto}
                      trackColor={{ false: colors.ui.border, true: colors.primary }}
                      thumbColor={enableCrypto ? colors.text.primary : colors.text.secondary}
                    />
                  </View>
                  
                  <Text style={styles.cryptoSubtitle}>
                    Add crypto stakes to make this challenge more exciting!
                  </Text>

                  {enableCrypto && (
                    <>
                      {/* Wallet Status Indicator */}
                      <View style={styles.walletStatusSection}>
                        <Text style={styles.walletStatusLabel}>
                          🔗 Wallet Status: {solanaMobileWalletService.isConnected() ? '✅ Connected' : '❌ Not Connected'}
                        </Text>
                        {!solanaMobileWalletService.isConnected() && (
                          <Text style={styles.walletStatusHint}>
                            Wallet will be connected automatically when you send the challenge
                          </Text>
                        )}
                      </View>

                      {/* ✅ FIXED: Wager Amount with Dynamic Token Label */}
                      <View style={styles.wagerSection}>
                        <View style={styles.wagerHeaderRow}>
                          <Text style={styles.wagerLabel}>Wager Amount</Text>
                          <Text style={styles.wagerTokenBadge}>{selectedToken}</Text>
                        </View>
                        <TextInput
                          style={styles.wagerInput}
                          placeholder="Enter amount"
                          placeholderTextColor={colors.text.secondary}
                          value={wagerAmount}
                          onChangeText={setWagerAmount}
                          keyboardType="numeric"
                          returnKeyType="done"
                          onSubmitEditing={dismissKeyboard}
                        />
                        <Text style={styles.wagerHint}>
                          Each person stakes this amount. Winner takes the total pot!
                        </Text>
                      </View>

                      {/* Token Selection */}
                      <TouchableWithoutFeedback onPress={dismissKeyboard}>
                        <View style={styles.tokenSection}>
                          <Text style={styles.tokenLabel}>Select Token</Text>
                          <View style={styles.tokenGrid}>
                            {tokens.map((token) => (
                              <TouchableOpacity
                                key={token.symbol}
                                style={[
                                  styles.tokenCard,
                                  selectedToken === token.symbol && styles.tokenCardSelected
                                ]}
                                onPress={() => {
                                  dismissKeyboard();
                                  setSelectedToken(token.symbol);
                                }}
                              >
                                <Text style={[
                                  styles.tokenSymbol,
                                  { color: token.color }
                                ]}>
                                  {token.symbol}
                                </Text>
                                <Text style={styles.tokenName}>{token.name}</Text>
                                <Text style={styles.tokenBonus}>+{token.bonus} bonus</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </TouchableWithoutFeedback>

                      {/* Challenge Expiry */}
                      <TouchableWithoutFeedback onPress={dismissKeyboard}>
                        <View style={styles.expirySection}>
                          <Text style={styles.expiryLabel}>Challenge Expires In</Text>
                          <View style={styles.expiryGrid}>
                            {expiryOptions.map((option) => (
                              <TouchableOpacity
                                key={option.value}
                                style={[
                                  styles.expiryOption,
                                  challengeExpiry === option.value && styles.expiryOptionSelected
                                ]}
                                onPress={() => {
                                  dismissKeyboard();
                                  setChallengeExpiry(option.value);
                                }}
                              >
                                <Text style={[
                                  styles.expiryOptionText,
                                  challengeExpiry === option.value && styles.expiryOptionTextSelected
                                ]}>
                                  {option.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                          {/* CORRECTED: Uncompleted challenges return to challenger */}
                          <Text style={styles.expiryHint}>
                            ⚠️ Uncompleted challenges return funds to challenger
                          </Text>
                        </View>
                      </TouchableWithoutFeedback>

                      {/* Payout Calculation - UPDATED with 2.5% Fee */}
                      {wagerAmount && parseFloat(wagerAmount) > 0 && (
                        <TouchableWithoutFeedback onPress={dismissKeyboard}>
                          <View style={styles.payoutSection}>
                            <Text style={styles.payoutTitle}>💸 Payout Breakdown</Text>
                            
                            <View style={styles.payoutRow}>
                              <Text style={styles.payoutLabel}>Your stake:</Text>
                              <Text style={styles.payoutValue}>${wagerAmount} {selectedToken}</Text>
                            </View>
                            
                            <View style={styles.payoutRow}>
                              <Text style={styles.payoutLabel}>Buddy's stake:</Text>
                              <Text style={styles.payoutValue}>${wagerAmount} {selectedToken}</Text>
                            </View>
                            
                            {parseFloat(calculateBonusPool()) > 0 && (
                              <View style={styles.payoutRow}>
                                <Text style={styles.payoutLabel}>{selectedToken} bonus:</Text>
                                <Text style={styles.payoutBonus}>+${calculateBonusPool()} {selectedToken}</Text>
                              </View>
                            )}
                            
                            {/* UPDATED: Changed from 0.5% to 2.5% */}
                            <View style={styles.payoutRow}>
                              <Text style={styles.payoutLabel}>Atlas Vault fee (2.5%):</Text>
                              <Text style={styles.payoutFee}>-${(parseFloat(wagerAmount) * 2 * 0.025).toFixed(2)}</Text>
                            </View>
                            
                            <View style={[styles.payoutRow, styles.payoutTotal]}>
                              <Text style={styles.payoutTotalLabel}>Winner receives:</Text>
                              <Text style={styles.payoutTotalValue}>${calculateTotalPayout()} {selectedToken}</Text>
                            </View>

                            {/* CORRECTED: Fee explanation with proper expiry rules */}
                            <View style={styles.feeExplanation}>
                              <Text style={styles.feeExplanationText}>
                                💡 Example: $100 bet each = $200 total pot{'\n'}
                                Atlas fee: $5.00 (2.5%){'\n'}
                                Winner gets: $195.00{'\n'}
                                ⚠️ If uncompleted: Funds return to challenger
                              </Text>
                            </View>
                          </View>
                        </TouchableWithoutFeedback>
                      )}
                    </>
                  )}
                </View>
              </TouchableWithoutFeedback>
              
              <View style={styles.modalButtons}>
                <FalloutButton 
                  text={isLoading ? "SENDING..." : (enableCrypto ? "🚀 SEND CRYPTO CHALLENGE" : "⚡ SEND CHALLENGE")} 
                  onPress={handleSend} 
                  style={styles.modalButton}
                  isLoading={isLoading}
                />
                <FalloutButton 
                  text="CANCEL" 
                  onPress={handleClose} 
                  style={styles.modalButton} 
                  type="secondary" 
                />
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.ui.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50, // Extra space at bottom for keyboard
  },
  
  // Challenge Section
  challengeContainer: {
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 20,
  },
  challengeLabel: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 15,
  },
  challengeInput: {
    backgroundColor: colors.ui.inputBg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: 5,
    color: colors.text.primary,
    padding: 15,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 10,
    minHeight: 80, // Ensure minimum height for better UX
  },

  // Crypto Section
  cryptoContainer: {
    backgroundColor: colors.background.overlay,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FFA500',
    marginBottom: 20,
  },
  cryptoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cryptoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  cryptoSubtitle: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 18,
  },

  // ✅ NEW: Wallet Status Section
  walletStatusSection: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  walletStatusLabel: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  walletStatusHint: {
    color: colors.text.secondary,
    fontSize: 12,
    fontStyle: 'italic',
  },

  // ✅ FIXED: Wager Section with Dynamic Token Display
  wagerSection: {
    marginBottom: 20,
  },
  wagerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  wagerLabel: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  wagerTokenBadge: {
    backgroundColor: colors.primary,
    color: colors.background.dark,
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  wagerInput: {
    backgroundColor: colors.ui.inputBg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: 8,
    color: colors.text.primary,
    padding: 15,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    minHeight: 50,
  },
  wagerHint: {
    color: colors.text.secondary,
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Token Selection
  tokenSection: {
    marginBottom: 20,
  },
  tokenLabel: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  tokenGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  tokenCard: {
    flex: 1,
    backgroundColor: colors.ui.inputBg,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 80,
  },
  tokenCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.background.overlay,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tokenName: {
    color: colors.text.secondary,
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  tokenBonus: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Expiry Section
  expirySection: {
    marginBottom: 20,
  },
  expiryLabel: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  expiryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  expiryOption: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.ui.border,
    minHeight: 36,
    justifyContent: 'center',
  },
  expiryOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  expiryOptionText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  expiryOptionTextSelected: {
    color: colors.text.primary,
  },
  expiryHint: {
    color: '#4CAF50', // Changed from red to green since it's good news
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Payout Section - Enhanced with 2.5% fee
  payoutSection: {
    backgroundColor: '#1a2f1a',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  payoutTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  payoutLabel: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  payoutValue: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  payoutBonus: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  payoutFee: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: 'bold',
  },
  payoutTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.ui.border,
    paddingTop: 8,
    marginTop: 5,
  },
  payoutTotalLabel: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  payoutTotalValue: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Updated: Fee explanation with correct expiry rules
  feeExplanation: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)', // Green background since it's good news
    borderRadius: 6,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  feeExplanationText: {
    color: '#4CAF50',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: 'monospace',
  },

  modalButtons: {
    gap: 15,
    marginTop: 20,
    marginBottom: 30,
  },
  modalButton: {
    marginBottom: 10,
  },
});

export default ChallengeModal;