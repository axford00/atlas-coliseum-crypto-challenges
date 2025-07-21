// FILE: src/components/crypto/CryptoWagerSection.js
// 🚀 ENHANCED: Real crypto wagering with Solana integration and improved UX

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { solanaMobileWalletService } from '../../services/solana/solanaMobileWalletService';
import WalletConnector from './WalletConnector';
import { colors } from '../../theme/colors';

const CryptoWagerSection = ({ 
  visible, 
  challengeData, 
  buddy, 
  challengeText, 
  challengeReward, 
  onEscrowCreated, 
  onError 
}) => {
  const [wallet, setWallet] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [wagerAmount, setWagerAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('SOL');
  const [breakdown, setBreakdown] = useState(null);
  const [isCreatingEscrow, setIsCreatingEscrow] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  useEffect(() => {
    if (wagerAmount && parseFloat(wagerAmount) > 0) {
      const amount = parseFloat(wagerAmount);
      const newBreakdown = solanaMobileWalletService.calculateFeeBreakdown(amount, selectedToken);
      setBreakdown(newBreakdown);
    } else {
      setBreakdown(null);
    }
  }, [wagerAmount, selectedToken]);

  const checkWalletConnection = () => {
    const connectedWallet = solanaMobileWalletService.getConnectedWallet();
    if (connectedWallet) {
      setWallet(connectedWallet);
      setIsConnected(true);
      setWalletBalance(connectedWallet.balance || 0);
    }
  };

  const handleConnectWallet = async (walletType = 'solflare') => {
    try {
      setIsCreatingEscrow(true);
      console.log(`🔌 Connecting ${walletType} wallet...`);
      
      const connectedWallet = await solanaMobileWalletService.connectWallet(walletType);
      setWallet(connectedWallet);
      setIsConnected(true);
      setWalletBalance(connectedWallet.balance || 0);
      setShowWalletModal(false);
      
      Alert.alert('Wallet Connected!', `${walletType} wallet connected successfully.`);
      
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      Alert.alert('Connection Failed', error.message);
    } finally {
      setIsCreatingEscrow(false);
    }
  };

  const handleCreateEscrow = async () => {
    if (!isConnected) {
      setShowWalletModal(true);
      return;
    }

    if (!wagerAmount || parseFloat(wagerAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid wager amount.');
      return;
    }

    const amount = parseFloat(wagerAmount);
    const tokenConfig = solanaMobileWalletService.getSupportedTokens().find(t => t.symbol === selectedToken);
    
    if (!tokenConfig) {
      Alert.alert('Error', `Unsupported token: ${selectedToken}`);
      return;
    }

    if (amount < tokenConfig.minWager || amount > tokenConfig.maxWager) {
      Alert.alert(
        'Invalid Amount', 
        `Wager must be between ${tokenConfig.minWager} and ${tokenConfig.maxWager} ${selectedToken}`
      );
      return;
    }

    if (selectedToken === 'SOL' && amount > walletBalance) {
      Alert.alert(
        'Insufficient Balance', 
        `You need ${amount} SOL but only have ${walletBalance.toFixed(4)} SOL`
      );
      return;
    }

    try {
      setIsCreatingEscrow(true);
      
      console.log('🏦 Creating real crypto challenge...');
      
      // Create crypto challenge with immediate User A deposit
      const escrowData = await solanaMobileWalletService.createCryptoChallenge({
        wagerAmount: amount,
        tokenType: selectedToken,
        challengeText: challengeText || challengeData?.challenge || 'Fitness Challenge',
        challengeeId: buddy?.buddyUserId || buddy?.id || challengeData?.to
      });
      
      onEscrowCreated(escrowData);
      
      Alert.alert(
        '🚀 Crypto Challenge Created!', 
        `Your ${amount} ${selectedToken} has been deposited to Atlas Vault!\n\n` +
        `💰 Total pot when accepted: ${breakdown.totalPot} ${selectedToken}\n` +
        `🏆 Winner receives: ${breakdown.winnerPayout.toFixed(4)} ${selectedToken}\n` +
        `💸 Atlas fee: ${breakdown.atlasFee.toFixed(4)} ${selectedToken}\n\n` +
        `⏳ ${buddy?.name || 'Opponent'} has 7 days to accept or you get a full refund!`,
        [{ text: 'Challenge Sent!' }]
      );
      
    } catch (error) {
      console.error('❌ Error creating crypto challenge:', error);
      onError?.(error);
      Alert.alert('Error', `Failed to create crypto challenge: ${error.message}`);
    } finally {
      setIsCreatingEscrow(false);
    }
  };

  const TokenSelector = () => (
    <View style={styles.tokenSelector}>
      {['SOL', 'USDC', 'BONK'].map((token) => (
        <TouchableOpacity
          key={token}
          style={[
            styles.tokenButton,
            selectedToken === token && styles.tokenButtonActive
          ]}
          onPress={() => setSelectedToken(token)}
        >
          <Text style={styles.tokenEmoji}>
            {token === 'SOL' ? '◎' : token === 'USDC' ? '💵' : '🐕'}
          </Text>
          <Text style={[
            styles.tokenButtonText,
            selectedToken === token && styles.tokenButtonTextActive
          ]}>
            {token}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const WagerBreakdown = () => {
    if (!breakdown) return null;

    const tokenBonuses = {
      'SOL': { multiplier: 1.1, bonus: '10%' },
      'BONK': { multiplier: 1.25, bonus: '25%' },
      'USDC': { multiplier: 1.0, bonus: null }
    };

    const tokenBonus = tokenBonuses[selectedToken];

    return (
      <View style={styles.breakdown}>
        <Text style={styles.breakdownTitle}>💰 Crypto Wager Breakdown</Text>
        
        <View style={styles.breakdownContainer}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Your Deposit (Now):</Text>
            <Text style={styles.breakdownValue}>{breakdown.challengerDeposit} {selectedToken}</Text>
          </View>
          
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>{buddy?.name || 'Opponent'} Deposit:</Text>
            <Text style={styles.breakdownValue}>{breakdown.challengeeDeposit} {selectedToken}</Text>
          </View>
          
          <View style={[styles.breakdownRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Pot:</Text>
            <Text style={styles.totalValue}>{breakdown.totalPot} {selectedToken}</Text>
          </View>

          {tokenBonus.bonus && (
            <View style={styles.bonusRow}>
              <Text style={styles.bonusLabel}>🚀 {selectedToken} Bonus:</Text>
              <Text style={styles.bonusValue}>+{tokenBonus.bonus}</Text>
            </View>
          )}
          
          <View style={styles.breakdownRow}>
            <Text style={styles.feeLabel}>Atlas Fee (2.5%):</Text>
            <Text style={styles.feeValue}>-{breakdown.atlasFee.toFixed(4)} {selectedToken}</Text>
          </View>
          
          <View style={[styles.breakdownRow, styles.winningsRow]}>
            <Text style={styles.winningsLabel}>Winner Receives:</Text>
            <Text style={styles.winningsValue}>{breakdown.winnerPayout.toFixed(4)} {selectedToken}</Text>
          </View>
        </View>

        {/* Fee Explanation */}
        <View style={styles.feeExplanation}>
          <Text style={styles.feeExplanationTitle}>📋 How it works:</Text>
          <Text style={styles.feeExplanationText}>
            • You deposit immediately when creating challenge{'\n'}
            • {buddy?.name || 'Opponent'} deposits when accepting{'\n'}
            • Atlas fee (2.5%) collected only if both deposit{'\n'}
            • If declined/ignored: You get 100% refund
          </Text>
        </View>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💰 Add Crypto Wager</Text>
      <Text style={styles.subtitle}>Put real money on the line - immediate deposit required!</Text>

      {/* Wallet Connection Status */}
      <View style={styles.walletStatus}>
        {isConnected ? (
          <View style={styles.connectedWallet}>
            <Text style={styles.connectedText}>
              ✅ Connected: {wallet?.publicKey?.toString().slice(0, 8)}...
            </Text>
            <Text style={styles.balanceText}>
              Balance: {walletBalance.toFixed(4)} SOL
            </Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.connectButton}
            onPress={() => setShowWalletModal(true)}
          >
            <Text style={styles.connectButtonText}>🔌 Connect Wallet First</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Token Selection */}
      <Text style={styles.sectionTitle}>🪙 Choose Token:</Text>
      <TokenSelector />

      {/* Wager Amount Input */}
      <Text style={styles.sectionTitle}>💰 Wager Amount:</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.amountInput}
          value={wagerAmount}
          onChangeText={setWagerAmount}
          placeholder={`Min: ${selectedToken === 'SOL' ? '0.001' : selectedToken === 'USDC' ? '0.5' : '1000'}`}
          keyboardType="numeric"
          placeholderTextColor="#888"
        />
        <Text style={styles.inputSuffix}>{selectedToken}</Text>
      </View>

      {/* Wager Breakdown */}
      <WagerBreakdown />

      {/* Create Escrow Button */}
      <TouchableOpacity
        style={[
          styles.createEscrowButton,
          (!isConnected || !wagerAmount || isCreatingEscrow) && styles.disabledButton
        ]}
        onPress={handleCreateEscrow}
        disabled={!isConnected || !wagerAmount || isCreatingEscrow}
      >
        {isCreatingEscrow ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.buttonText}>
              {isConnected ? '🏦 DEPOSIT & CREATE CHALLENGE' : 'CONNECT WALLET FIRST'}
            </Text>
            <Text style={styles.buttonSubtext}>
              {isConnected ? 'Funds deposited immediately to Atlas Vault' : 'Wallet required for crypto challenges'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Security Notice */}
      <View style={styles.securityNotice}>
        <Text style={styles.securityTitle}>🛡️ SECURITY & FAIRNESS</Text>
        <Text style={styles.securityText}>
          🔐 Funds secured in Solana smart contract escrow{'\n'}
          ⚖️ Disputes resolved by 24-hour community voting{'\n'}
          💰 Winner receives automatic payout upon completion{'\n'}
          🔄 Full refund if opponent declines or ignores (7 days)
        </Text>
      </View>

      {/* Wallet Connection Modal */}
      <WalletConnector
        visible={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onWalletConnected={handleConnectWallet}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background?.overlay || '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginVertical: 15,
    borderWidth: 2,
    borderColor: '#ff6b35',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 13,
    color: '#ff6b35',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  walletStatus: {
    marginBottom: 20,
  },
  connectedWallet: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  connectedText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  balanceText: {
    color: '#fff',
    fontSize: 14,
  },
  connectButton: {
    backgroundColor: '#6C5CE7',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  
  // Token Selector
  tokenSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  tokenButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  tokenButtonActive: {
    backgroundColor: '#ff6b35',
    borderColor: '#ff6b35',
  },
  tokenEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  tokenButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tokenButtonTextActive: {
    color: '#fff',
  },
  
  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    marginBottom: 20,
  },
  amountInput: {
    flex: 1,
    color: '#fff',
    padding: 15,
    fontSize: 16,
  },
  inputSuffix: {
    color: '#ff6b35',
    fontSize: 16,
    fontWeight: 'bold',
    paddingRight: 15,
  },
  
  // Breakdown
  breakdown: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#ff6b35',
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  breakdownContainer: {
    marginBottom: 15,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    color: '#aaa',
    fontSize: 14,
  },
  breakdownValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#444',
    paddingTop: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  totalLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    color: '#ff6b35',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bonusRow: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bonusLabel: {
    color: '#ff6b35',
    fontSize: 13,
    fontWeight: 'bold',
  },
  bonusValue: {
    color: '#ff6b35',
    fontSize: 13,
    fontWeight: 'bold',
  },
  feeLabel: {
    color: '#f44336',
    fontSize: 14,
  },
  feeValue: {
    color: '#f44336',
    fontSize: 14,
    fontWeight: 'bold',
  },
  winningsRow: {
    marginTop: 5,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 8,
    borderRadius: 6,
  },
  winningsLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  winningsValue: {
    color: '#4CAF50',
    fontSize: 15,
    fontWeight: 'bold',
  },
  
  // Fee Explanation
  feeExplanation: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
  },
  feeExplanationTitle: {
    color: '#ff6b35',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  feeExplanationText: {
    color: '#aaa',
    fontSize: 11,
    lineHeight: 16,
  },
  
  // Create Button
  createEscrowButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 18,
    alignItems: 'center',
    marginBottom: 15,
  },
  disabledButton: {
    backgroundColor: '#555',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  buttonSubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  
  // Security Notice
  securityNotice: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  securityTitle: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  securityText: {
    color: '#aaa',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});

export default CryptoWagerSection;