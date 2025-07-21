import { useState, useCallback } from 'react';

// Token configuration for multi-token wagering
export interface WagerToken {
  symbol: string;
  name: string;
  multiplier: number;
  description: string;
  color: string;
}

export interface Challenge {
  type: '1v1' | 'GroupPool' | 'TeamBattle';
  available: boolean;
  maxParticipants: number;
  description: string;
}

// Supported tokens with hackathon bonuses
export const supportedWagerTokens: WagerToken[] = [
  {
    symbol: 'BONK',
    name: 'Bonk',
    multiplier: 1.25,
    description: '25% Bonus!',
    color: '#ff6b35'
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    multiplier: 1.10,
    description: '10% Bonus!',
    color: '#9945ff'
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    multiplier: 1.00,
    description: 'Stable Value',
    color: '#2775ca'
  }
];

// Available challenge types
export const challengeTypes: Challenge[] = [
  {
    type: '1v1',
    available: true,
    maxParticipants: 2,
    description: 'Winner takes opponent\'s wager + bonus'
  },
  {
    type: 'GroupPool',
    available: true,
    maxParticipants: 10,
    description: 'Winner takes entire pool + bonus'
  },
  {
    type: 'TeamBattle',
    available: false,
    maxParticipants: 20,
    description: 'Coming soon feature'
  }
];

export interface WagerState {
  selectedToken: WagerToken;
  wagerAmount: number;
  selectedChallenge: Challenge;
  totalPayout: number;
  isConnected: boolean;
  balance: number;
}

export function useFitnessWager() {
  const [wagerState, setWagerState] = useState<WagerState>({
    selectedToken: supportedWagerTokens[0], // Default to BONK for bonus
    wagerAmount: 0,
    selectedChallenge: challengeTypes[0], // Default to 1v1
    totalPayout: 0,
    isConnected: false,
    balance: 1000, // Mock balance for demo
  });

  // Calculate total payout with bonuses
  const calculatePayout = useCallback((amount: number, token: WagerToken, challenge: Challenge) => {
    const baseAmount = amount * challenge.maxParticipants;
    const bonusAmount = baseAmount * token.multiplier;
    return bonusAmount;
  }, []);

  // Update wager amount and recalculate payout
  const updateWagerAmount = useCallback((amount: number) => {
    const newPayout = calculatePayout(amount, wagerState.selectedToken, wagerState.selectedChallenge);
    setWagerState(prev => ({
      ...prev,
      wagerAmount: amount,
      totalPayout: newPayout
    }));
  }, [wagerState.selectedToken, wagerState.selectedChallenge, calculatePayout]);

  // Select different token
  const selectToken = useCallback((token: WagerToken) => {
    const newPayout = calculatePayout(wagerState.wagerAmount, token, wagerState.selectedChallenge);
    setWagerState(prev => ({
      ...prev,
      selectedToken: token,
      totalPayout: newPayout
    }));
  }, [wagerState.wagerAmount, wagerState.selectedChallenge, calculatePayout]);

  // Select different challenge type
  const selectChallenge = useCallback((challenge: Challenge) => {
    const newPayout = calculatePayout(wagerState.wagerAmount, wagerState.selectedToken, challenge);
    setWagerState(prev => ({
      ...prev,
      selectedChallenge: challenge,
      totalPayout: newPayout
    }));
  }, [wagerState.wagerAmount, wagerState.selectedToken, calculatePayout]);

  // Mock wallet connection
  const connectWallet = useCallback(() => {
    setWagerState(prev => ({
      ...prev,
      isConnected: true,
      balance: 1000 // Mock balance
    }));
  }, []);

  // Mock disconnect wallet
  const disconnectWallet = useCallback(() => {
    setWagerState(prev => ({
      ...prev,
      isConnected: false,
      balance: 0
    }));
  }, []);

  // Create wager (mock implementation)
  const createWager = useCallback(async () => {
    if (!wagerState.isConnected || wagerState.wagerAmount <= 0) {
      throw new Error('Invalid wager state');
    }

    // Mock API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          wagerId: `wager_${Date.now()}`,
          amount: wagerState.wagerAmount,
          token: wagerState.selectedToken.symbol,
          challenge: wagerState.selectedChallenge.type,
          expectedPayout: wagerState.totalPayout
        });
      }, 1000);
    });
  }, [wagerState]);

  return {
    wagerState,
    supportedTokens: supportedWagerTokens,
    challenges: challengeTypes,
    updateWagerAmount,
    selectToken,
    selectChallenge,
    connectWallet,
    disconnectWallet,
    createWager,
    calculatePayout
  };
}