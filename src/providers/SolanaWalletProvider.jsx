// FILE: src/providers/SolanaWalletProvider.jsx
// 🚀 SOLANA APP KIT WALLET PROVIDER - The proper way

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';

// 🔥 ATLAS CONFIG
const ATLAS_CONFIG = {
  ATLAS_VAULT_ESCROW: 'J76b6Yh7mMfnMk2o7UTr9LpmNopajv2LedyHziuaDSoH',
  ATLAS_FEE_COLLECTION: '9ASz56ZtCRc6t34W1PukB3rNrvyrZ4rGcYMmZw6rKoe',
  RPC_ENDPOINT: 'https://api.mainnet-beta.solana.com',
  ATLAS_FEE_PERCENTAGE: 0.025,
  
  TOKENS: {
    SOL: {
      mint: 'So11111111111111111111111111111111111111112',
      decimals: 9,
      symbol: 'SOL',
      name: 'Solana',
      minWager: 0.001,
      maxWager: 10
    },
    USDC: {
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      decimals: 6,
      symbol: 'USDC', 
      name: 'USD Coin',
      minWager: 0.1,
      maxWager: 100
    }
  }
};

// 🏛️ APP IDENTITY
const APP_IDENTITY = {
  name: 'Atlas Coliseum Crypto',
  uri: 'https://atlas-coliseum.com',
  icon: './favicon.ico'
};

// 🎯 WALLET CONTEXT
const WalletContext = createContext({
  connected: false,
  connecting: false,
  wallet: null,
  connect: () => {},
  disconnect: () => {},
  balance: 0,
  createChallenge: () => {},
  acceptChallenge: () => {},
  getBalance: () => {},
  error: null
});

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within SolanaWalletProvider');
  }
  return context;
};

// 🚀 SOLANA WALLET PROVIDER using App Kit pattern
export const SolanaWalletProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState(null);
  const [solanaModules, setSolanaModules] = useState(null);

  // 🔧 LOAD SOLANA MODULES SAFELY
  const loadSolanaModules = async () => {
    if (solanaModules) return solanaModules;

    try {
      console.log('🔧 Loading Solana modules via App Kit pattern...');
      
      // Dynamic imports to prevent startup crashes
      const [web3Module, mwaModule] = await Promise.all([
        import('@solana/web3.js'),
        Platform.OS !== 'web' 
          ? import('@solana-mobile/mobile-wallet-adapter-protocol-web3js')
          : Promise.resolve(null)
      ]);

      const connection = new web3Module.Connection(ATLAS_CONFIG.RPC_ENDPOINT, 'confirmed');

      const modules = {
        web3: web3Module,
        connection,
        transact: mwaModule?.transact || null,
        mwaAvailable: !!mwaModule?.transact
      };

      setSolanaModules(modules);
      console.log('✅ Solana modules loaded successfully');
      return modules;

    } catch (error) {
      console.error('❌ Failed to load Solana modules:', error);
      setError(error.message);
      throw error;
    }
  };

  // 🔌 CONNECT WALLET using App Kit pattern
  const connect = async () => {
    try {
      setConnecting(true);
      setError(null);

      console.log('🔌 Connecting wallet via App Kit pattern...');
      
      const modules = await loadSolanaModules();
      
      if (!modules.mwaAvailable) {
        throw new Error('Mobile Wallet Adapter not available. Please use a physical device.');
      }

      const authResult = await modules.transact(async (walletAdapter) => {
        const authorization = await walletAdapter.authorize({
          cluster: 'mainnet-beta',
          identity: APP_IDENTITY,
        });

        console.log('✅ Wallet authorized via App Kit');
        return authorization;
      });

      const walletData = {
        publicKey: authResult.accounts[0].publicKey,
        address: authResult.accounts[0].address,
        accounts: authResult.accounts,
        authToken: authResult.auth_token,
        walletUriBase: authResult.wallet_uri_base,
        connectedAt: new Date().toISOString(),
        cluster: 'mainnet-beta'
      };

      // Get balance
      try {
        const balanceResult = await modules.connection.getBalance(walletData.publicKey);
        const solBalance = balanceResult / modules.web3.LAMPORTS_PER_SOL;
        setBalance(solBalance);
        walletData.balance = solBalance;
      } catch (balanceError) {
        console.warn('Could not fetch balance:', balanceError);
        setBalance(0);
        walletData.balance = 0;
      }

      setWallet(walletData);
      setConnected(true);
      
      console.log('🎉 Wallet connected via App Kit:', {
        address: walletData.address.slice(0, 12) + '...',
        balance: `${walletData.balance.toFixed(4)} SOL`
      });

    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      setError(error.message);
      setConnected(false);
      setWallet(null);
    } finally {
      setConnecting(false);
    }
  };

  // 🔌 DISCONNECT WALLET
  const disconnect = async () => {
    setConnected(false);
    setWallet(null);
    setBalance(0);
    setError(null);
    console.log('🔌 Wallet disconnected');
  };

  // 💰 GET BALANCE
  const getBalance = async (publicKey) => {
    try {
      if (!solanaModules) {
        await loadSolanaModules();
      }
      
      const modules = solanaModules;
      const pubKey = typeof publicKey === 'string' 
        ? new modules.web3.PublicKey(publicKey) 
        : publicKey;
        
      const balanceResult = await modules.connection.getBalance(pubKey);
      return balanceResult / modules.web3.LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting balance:', error);
      return 0;
    }
  };

  // 🏦 CREATE CHALLENGE
  const createChallenge = async (challengeData) => {
    if (!connected || !wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      const modules = solanaModules || await loadSolanaModules();
      
      const { wagerAmount, tokenType = 'SOL' } = challengeData;
      
      // Check balance
      const userBalance = await getBalance(wallet.publicKey);
      if (userBalance < wagerAmount) {
        throw new Error(`Insufficient balance. Need ${wagerAmount} SOL, have ${userBalance.toFixed(4)} SOL`);
      }

      // Create escrow transaction
      const atlasVaultPubkey = new modules.web3.PublicKey(ATLAS_CONFIG.ATLAS_VAULT_ESCROW);
      const lamports = Math.floor(wagerAmount * modules.web3.LAMPORTS_PER_SOL);

      const result = await modules.transact(async (walletAdapter) => {
        const transferInstruction = modules.web3.SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: atlasVaultPubkey,
          lamports: lamports,
        });

        const transaction = new modules.web3.Transaction().add(transferInstruction);
        
        const { blockhash } = await modules.connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = wallet.publicKey;

        const signedTxs = await walletAdapter.signTransactions({
          transactions: [transaction],
        });

        const signature = await modules.connection.sendRawTransaction(
          signedTxs[0].serialize()
        );

        await modules.connection.confirmTransaction(signature, 'confirmed');

        console.log('✅ Challenge created, signature:', signature);
        
        return {
          signature,
          explorerUrl: `https://solscan.io/tx/${signature}`,
          confirmed: true
        };
      });

      // Update balance after transaction
      const newBalance = await getBalance(wallet.publicKey);
      setBalance(newBalance);

      return {
        escrowId: result.signature,
        signature: result.signature,
        explorerUrl: result.explorerUrl,
        wagerAmount,
        tokenType,
        status: 'pending_acceptance',
        createdAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Create challenge failed:', error);
      throw error;
    }
  };

  // 🤝 ACCEPT CHALLENGE (placeholder)
  const acceptChallenge = async (challengeData) => {
    console.log('🤝 Accept challenge - implementing...');
    return createChallenge(challengeData);
  };

  // 🎯 CONTEXT VALUE
  const value = {
    connected,
    connecting,
    wallet,
    balance,
    error,
    connect,
    disconnect,
    getBalance,
    createChallenge,
    acceptChallenge,
    // Utility methods
    getSupportedTokens: () => Object.entries(ATLAS_CONFIG.TOKENS).map(([key, config]) => ({
      symbol: key,
      ...config
    })),
    getNetworkInfo: () => ({
      cluster: 'mainnet-beta',
      rpcEndpoint: ATLAS_CONFIG.RPC_ENDPOINT,
      mobile: true,
      mwa: solanaModules?.mwaAvailable || false,
      appKit: true
    })
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};