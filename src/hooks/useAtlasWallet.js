// FILE: src/hooks/useAtlasWallet.js
// React hook for managing Atlas wallet state

import { useState, useEffect, useCallback } from 'react';
import solanaMobileWalletService from '../../services/solana/solanaMobileWalletService';

export const useAtlasWallet = () => {
  const [wallet, setWallet] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState(null);

  // Connect wallet
  const connectWallet = useCallback(async (walletType = 'phantom') => {
    setIsConnecting(true);
    setError(null);

    try {
      // Simulate wallet connection process
      console.log(`Connecting to ${walletType} wallet...`);
      
      // In a real implementation, this would:
      // 1. Trigger wallet adapter connection
      // 2. Request user approval
      // 3. Get public key and permissions
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate connection delay
      
      const mockWallet = {
        walletType,
        publicKey: 'Atlas' + Math.random().toString(36).substr(2, 9),
        connected: true,
        connectedAt: new Date().toISOString()
      };

      const mockBalance = {
        SOL: (Math.random() * 10).toFixed(4),
        USDC: (Math.random() * 1000).toFixed(2),
        BONK: Math.floor(Math.random() * 100000)
      };

      setWallet(mockWallet);
      setBalance(mockBalance);
      setIsConnected(true);
      
      console.log('Wallet connected successfully:', mockWallet);
      return mockWallet;

    } catch (err) {
      console.error('Failed to connect wallet:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      console.log('Disconnecting wallet...');
      
      setWallet(null);
      setBalance(null);
      setIsConnected(false);
      setError(null);
      
      console.log('Wallet disconnected successfully');
      
    } catch (err) {
      console.error('Failed to disconnect wallet:', err);
      setError(err.message);
    }
  }, []);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!isConnected || !wallet) return;

    try {
      console.log('Refreshing wallet balance...');
      
      // Simulate balance refresh
      const updatedBalance = {
        SOL: (Math.random() * 10).toFixed(4),
        USDC: (Math.random() * 1000).toFixed(2),
        BONK: Math.floor(Math.random() * 100000)
      };

      setBalance(updatedBalance);
      console.log('Balance refreshed:', updatedBalance);
      return updatedBalance;

    } catch (err) {
      console.error('Failed to refresh balance:', err);
      setError(err.message);
    }
  }, [isConnected, wallet]);

  // Create escrow for challenge
  const createEscrow = useCallback(async (challengeData, wagerAmount, tokenType) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      const escrowData = await solanaMobileWalletService.createChallengeEscrow(
        challengeData, 
        wagerAmount, 
        tokenType
      );
      
      // Refresh balance after escrow creation
      await refreshBalance();
      
      return escrowData;
    } catch (err) {
      console.error('Failed to create escrow:', err);
      setError(err.message);
      throw err;
    }
  }, [isConnected, refreshBalance]);

  // Accept escrow
  const acceptEscrow = useCallback(async (escrowId, challengeeId) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      const result = await solanaMobileWalletService.acceptChallengeEscrow(escrowId, challengeeId);
      
      // Refresh balance after accepting escrow
      await refreshBalance();
      
      return result;
    } catch (err) {
      console.error('Failed to accept escrow:', err);
      setError(err.message);
      throw err;
    }
  }, [isConnected, refreshBalance]);

  // Complete escrow
  const completeEscrow = useCallback(async (escrowId, winnerId, challengeResult) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      const result = await solanaMobileWalletService.completeChallengeEscrow(
        escrowId, 
        winnerId, 
        challengeResult
      );
      
      // Refresh balance after completion
      await refreshBalance();
      
      return result;
    } catch (err) {
      console.error('Failed to complete escrow:', err);
      setError(err.message);
      throw err;
    }
  }, [isConnected, refreshBalance]);

  // Get escrow status
  const getEscrowStatus = useCallback(async (escrowId) => {
    try {
      return await solanaMobileWalletService.getEscrowStatus(escrowId);
    } catch (err) {
      console.error('Failed to get escrow status:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Calculate wager breakdown
  const calculateWagerBreakdown = useCallback((amount, tokenType) => {
    return solanaMobileWalletService.calculateWagerBreakdown(amount, tokenType);
  }, []);

  // Auto-refresh balance periodically when connected
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      refreshBalance();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isConnected, refreshBalance]);

  return {
    // State
    wallet,
    isConnected,
    isConnecting,
    balance,
    error,
    
    // Actions
    connectWallet,
    disconnectWallet,
    refreshBalance,
    
    // Escrow functions
    createEscrow,
    acceptEscrow,
    completeEscrow,
    getEscrowStatus,
    
    // Utilities
    calculateWagerBreakdown,
    
    // Wallet service access
    walletService: solanaMobileWalletService
  };
};