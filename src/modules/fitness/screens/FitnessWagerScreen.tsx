import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useFitnessWager, WagerToken, Challenge } from '../hooks/useFitnessWager';

export default function FitnessWagerScreen() {
  const {
    wagerState,
    supportedTokens,
    challenges,
    updateWagerAmount,
    selectToken,
    selectChallenge,
    connectWallet,
    disconnectWallet,
    createWager,
  } = useFitnessWager();

  const [isCreatingWager, setIsCreatingWager] = useState(false);

  const handleCreateWager = async () => {
    if (wagerState.wagerAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid wager amount');
      return;
    }

    if (wagerState.wagerAmount > wagerState.balance) {
      Alert.alert('Insufficient Balance', 'You don\'t have enough tokens for this wager');
      return;
    }

    setIsCreatingWager(true);
    try {
      const result = await createWager();
      Alert.alert(
        'Wager Created! 🎉',
        `Your ${wagerState.selectedToken.symbol} wager has been created!\n\nPotential Payout: ${wagerState.totalPayout.toFixed(2)} ${wagerState.selectedToken.symbol}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create wager. Please try again.');
    } finally {
      setIsCreatingWager(false);
    }
  };

  const TokenSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💰 Select Token</Text>
      <View style={styles.tokenGrid}>
        {supportedTokens.map((token: WagerToken) => (
          <TouchableOpacity
            key={token.symbol}
            style={[
              styles.tokenButton,
              wagerState.selectedToken.symbol === token.symbol && styles.tokenButtonSelected,
              { borderColor: token.color }
            ]}
            onPress={() => selectToken(token)}
          >
            <Text style={[styles.tokenSymbol, { color: token.color }]}>
              {token.symbol}
            </Text>
            <Text style={styles.tokenName}>{token.name}</Text>
            <Text style={styles.tokenBonus}>{token.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const ChallengeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🎯 Challenge Type</Text>
      <View style={styles.challengeContainer}>
        {challenges.map((challenge: Challenge) => (
          <TouchableOpacity
            key={challenge.type}
            style={[
              styles.challengeButton,
              wagerState.selectedChallenge.type === challenge.type && styles.challengeButtonSelected,
              !challenge.available && styles.challengeButtonDisabled
            ]}
            onPress={() => challenge.available && selectChallenge(challenge)}
            disabled={!challenge.available}
          >
            <Text style={[
              styles.challengeType,
              !challenge.available && styles.challengeTextDisabled
            ]}>
              {challenge.type}
            </Text>
            <Text style={[
              styles.challengeDescription,
              !challenge.available && styles.challengeTextDisabled
            ]}>
              {challenge.description}
            </Text>
            <Text style={[
              styles.challengeParticipants,
              !challenge.available && styles.challengeTextDisabled
            ]}>
              Max: {challenge.maxParticipants} participants
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const WagerInput = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💸 Wager Amount</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.wagerInput}
          value={wagerState.wagerAmount.toString()}
          onChangeText={(text) => {
            const amount = parseFloat(text) || 0;
            updateWagerAmount(amount);
          }}
          placeholder="Enter amount"
          placeholderTextColor="#666"
          keyboardType="numeric"
        />
        <Text style={styles.tokenLabel}>{wagerState.selectedToken.symbol}</Text>
      </View>
      <Text style={styles.balanceText}>
        Balance: {wagerState.balance} {wagerState.selectedToken.symbol}
      </Text>
    </View>
  );

  const PayoutSummary = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🏆 Payout Summary</Text>
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Wager Amount:</Text>
          <Text style={styles.summaryValue}>
            {wagerState.wagerAmount} {wagerState.selectedToken.symbol}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Multiplier:</Text>
          <Text style={styles.summaryValue}>
            {wagerState.selectedToken.multiplier}x ({wagerState.selectedToken.description})
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Challenge:</Text>
          <Text style={styles.summaryValue}>{wagerState.selectedChallenge.type}</Text>
        </View>
        <View style={[styles.summaryRow, styles.summaryTotal]}>
          <Text style={styles.summaryTotalLabel}>Potential Payout:</Text>
          <Text style={styles.summaryTotalValue}>
            {wagerState.totalPayout.toFixed(2)} {wagerState.selectedToken.symbol}
          </Text>
        </View>
      </View>
    </View>
  );

  const WalletSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🔗 Wallet</Text>
      {wagerState.isConnected ? (
        <View style={styles.walletConnected}>
          <Text style={styles.connectedText}>✅ Wallet Connected</Text>
          <TouchableOpacity style={styles.disconnectButton} onPress={disconnectWallet}>
            <Text style={styles.disconnectButtonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.connectButton} onPress={connectWallet}>
          <Text style={styles.connectButtonText}>Connect Wallet</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>🏆 Crypto Fitness Wagering</Text>
          <Text style={styles.subtitle}>Bet on your fitness goals with crypto rewards!</Text>
        </View>

        <WalletSection />
        <TokenSelector />
        <ChallengeSelector />
        <WagerInput />
        <PayoutSummary />

        <TouchableOpacity
          style={[
            styles.createButton,
            (!wagerState.isConnected || wagerState.wagerAmount <= 0 || isCreatingWager) && styles.createButtonDisabled
          ]}
          onPress={handleCreateWager}
          disabled={!wagerState.isConnected || wagerState.wagerAmount <= 0 || isCreatingWager}
        >
          {isCreatingWager ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Create Wager</Text>
          )}
        </TouchableOpacity>

        <View style={styles.hackathonBanner}>
          <Text style={styles.hackathonText}>
            🎉 Hackathon Special: 25% BONK Bonus! 🎉
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#d1d5db',
    textAlign: 'center',
  },
  section: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1f2937',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 16,
  },
  tokenGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tokenButton: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    backgroundColor: '#374151',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  tokenButtonSelected: {
    backgroundColor: '#065f46',
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tokenName: {
    fontSize: 12,
    color: '#d1d5db',
    marginBottom: 4,
  },
  tokenBonus: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: 'bold',
  },
  challengeContainer: {
    gap: 12,
  },
  challengeButton: {
    padding: 16,
    backgroundColor: '#374151',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  challengeButtonSelected: {
    backgroundColor: '#065f46',
    borderColor: '#10b981',
  },
  challengeButtonDisabled: {
    backgroundColor: '#1f2937',
    opacity: 0.5,
  },
  challengeType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 4,
  },
  challengeParticipants: {
    fontSize: 12,
    color: '#9ca3af',
  },
  challengeTextDisabled: {
    color: '#6b7280',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  wagerInput: {
    flex: 1,
    height: 50,
    color: '#fff',
    fontSize: 18,
  },
  tokenLabel: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 16,
  },
  balanceText: {
    marginTop: 8,
    color: '#9ca3af',
    fontSize: 14,
  },
  summaryContainer: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#d1d5db',
    fontSize: 14,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  summaryTotal: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  summaryTotalLabel: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryTotalValue: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: 'bold',
  },
  walletConnected: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connectedText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: 'bold',
  },
  connectButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disconnectButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  disconnectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#10b981',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#374151',
    opacity: 0.5,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  hackathonBanner: {
    backgroundColor: '#ff6b35',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  hackathonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});