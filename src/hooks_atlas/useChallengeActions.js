// FILE: src/hooks_atlas/useChallengeActions.js
// 🚀 CRITICAL FIX: Wallet connection and escrow creation

import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { getAuth } from 'firebase/auth';
import { 
  doc, 
  updateDoc, 
  serverTimestamp, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../../firebase';
// 🚀 CRITICAL FIX: Updated to use solanaMobileWalletService
import solanaMobileWalletService from '../services/solana/solanaMobileWalletService';
import { unifiedVideoService } from '../services/unifiedVideoResponseService';

export const useChallengeActions = (challenge, setChallenge, responseText, setResponseText) => {
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [showBindingContractModal, setShowBindingContractModal] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [pendingAcceptance, setPendingAcceptance] = useState(false);
  
  const auth = getAuth();
  const user = auth.currentUser;

  // ✅ FIXED: Proper wallet status checking
  const checkWalletConnection = () => {
    try {
      const isConnected = solanaMobileWalletService.isConnected();
      const wallet = solanaMobileWalletService.getConnectedWallet();
      
      console.log('🔍 Wallet check:', { 
        isConnected, 
        hasWallet: !!wallet,
        address: wallet?.publicKey?.toString()?.slice(0, 8) + '...' || 'undefined...',
        type: wallet?.type || 'none'
      });
      
      setWalletConnected(isConnected);
      setConnectedWallet(wallet);
      
      return { isConnected, wallet };
    } catch (error) {
      console.error('❌ Wallet check failed:', error);
      setWalletConnected(false);
      setConnectedWallet(null);
      return { isConnected: false, wallet: null };
    }
  };

  // ✅ CHECK WALLET STATUS ON LOAD AND WHEN CHALLENGE CHANGES
  useEffect(() => {
    console.log('🔍 Checking wallet connection on load:', {
      hasWallet: !!solanaMobileWalletService.getConnectedWallet(),
      isConnected: solanaMobileWalletService.isConnected()
    });
    checkWalletConnection();
  }, []);

  useEffect(() => {
    if (challenge?.id) {
      // Recheck wallet when challenge changes
      checkWalletConnection();
    }
  }, [challenge?.id]);

  // ✅ SETUP REAL-TIME LISTENER FOR CHALLENGE UPDATES
  useEffect(() => {
    if (!challenge?.id) return;

    console.log('🔄 [HOOK] Setting up challenge listener for:', challenge.id);
    
    const unsubscribe = unifiedVideoService.setupChallengeListener(
      challenge.id,
      (updatedChallenge) => {
        console.log('🔄 [HOOK] Challenge updated from listener:', {
          status: updatedChallenge.status,
          hasVideoResponse: updatedChallenge.hasVideoResponse,
          responseData: !!updatedChallenge.responseData,
          negotiationStatus: updatedChallenge.negotiationStatus
        });
        setChallenge(updatedChallenge);
      }
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
        console.log('🧹 [HOOK] Challenge listener cleaned up');
      }
    };
  }, [challenge?.id, setChallenge]);

  // ✅ MAIN ACCEPT CHALLENGE FUNCTION
  const acceptChallenge = async () => {
    try {
      console.log('🚀 [HOOK] Accept challenge called:', {
        challengeId: challenge.id,
        userId: user?.uid,
        wagerAmount: challenge.wagerAmount,
        walletConnected
      });
      
      if (!user || !challenge) {
        throw new Error('User not authenticated or challenge missing');
      }

      const isCryptoChallenge = challenge.wagerAmount && challenge.wagerAmount > 0;
      
      if (isCryptoChallenge) {
        console.log('💰 [HOOK] Processing crypto challenge acceptance');
        
        // ✅ FIXED: Check wallet connection properly
        const { isConnected } = checkWalletConnection();
        if (!isConnected) {
          console.log('💰 [HOOK] Wallet not connected, showing wallet modal');
          setPendingAcceptance(true);
          setShowWalletModal(true);
          return;
        }

        // Proceed with crypto acceptance
        await acceptCryptoChallenge();
      } else {
        console.log('📝 [HOOK] Processing regular challenge acceptance');
        await acceptRegularChallenge();
      }
      
    } catch (error) {
      console.error('❌ [HOOK] Accept challenge error:', error);
      Alert.alert('Error', `Failed to accept challenge: ${error.message}`);
    }
  };

  // ✅ FIXED: Handle wallet connection callback
  const handleWalletConnected = async (walletType) => {
    try {
      console.log('🔌 [SCREEN] Wallet connection initiated for:', walletType);
      
      // ✅ CRITICAL FIX: Actually connect the wallet through the service
      const wallet = await solanaMobileWalletService.connectWallet(walletType);
      
      console.log('🔌 [HOOK] Wallet connected successfully:', walletType);
      
      // ✅ FIXED: Update state immediately after successful connection
      setWalletConnected(true);
      setConnectedWallet(wallet);
      setShowWalletModal(false);

      // If we were pending acceptance, continue with it
      if (pendingAcceptance) {
        console.log('🤝 [HOOK] Continuing with pending challenge acceptance');
        setPendingAcceptance(false);
        await acceptCryptoChallenge();
      }

    } catch (error) {
      console.error('❌ [HOOK] Wallet connection callback error:', error);
      Alert.alert('Error', `Failed to connect wallet: ${error.message}`);
      setPendingAcceptance(false);
      setWalletConnected(false);
      setConnectedWallet(null);
      setShowWalletModal(false);
    }
  };

  // ✅ CRYPTO CHALLENGE ACCEPTANCE
  const acceptCryptoChallenge = async () => {
    try {
      console.log('💰 [HOOK] Accepting crypto challenge:', challenge.id);
      setIsSubmittingResponse(true);

      // ✅ FIXED: Double-check wallet connection
      const { isConnected, wallet } = checkWalletConnection();
      if (!isConnected || !wallet) {
        throw new Error('Wallet not connected');
      }

      console.log('🔍 Wallet verified for acceptance:', {
        address: wallet.publicKey.toString().slice(0, 8) + '...',
        balance: wallet.balance,
        type: wallet.type
      });

      // ✅ FIXED: Use the negotiated wager amount if available
      const wagerAmount = challenge.latestOffer?.wagerAmount || challenge.wagerAmount;
      const wagerToken = challenge.latestOffer?.wagerToken || challenge.wagerToken;
      const challengeText = challenge.latestOffer?.challenge || challenge.challenge;
      const expiryDays = challenge.latestOffer?.expiryDays || challenge.expiryDays || 7;

      // ✅ CRITICAL FIX: Check balance based on token type
      let userBalance = 0;
      if (wagerToken === 'SOL') {
        userBalance = wallet.balance || 0;
        if (userBalance < wagerAmount) {
          throw new Error(`Insufficient SOL balance. Need ${wagerAmount} SOL, have ${userBalance.toFixed(4)} SOL`);
        }
      } else if (wagerToken === 'USDC') {
        // Get real USDC balance from wallet service
        userBalance = await solanaMobileWalletService.getTokenBalance(
          wallet.publicKey, 
          'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // USDC mint
        );
        console.log(`💰 USDC balance check: ${userBalance.toFixed(2)} USDC`);
        if (userBalance < wagerAmount) {
          throw new Error(`Insufficient USDC balance. Need ${wagerAmount} USDC, have ${userBalance.toFixed(2)} USDC`);
        }
      } else {
        throw new Error(`Token ${wagerToken} balance checking not implemented yet`);
      }

      console.log('🏦 Creating crypto challenge with escrow...');
      console.log('💰 Wager:', `${wagerAmount} ${wagerToken}`);

      // ✅ CRITICAL: Create escrow account
      const escrowData = await solanaMobileWalletService.createCryptoChallenge({
        wagerAmount: wagerAmount,
        tokenType: wagerToken,
        challengeText: challengeText,
        challengeeId: user.uid,
        challengerId: challenge.from,
        expiryDays: expiryDays
      });

      if (!escrowData || !escrowData.escrowId) {
        throw new Error('Failed to create escrow account');
      }

      console.log('✅ Escrow created successfully:', escrowData.escrowId);

      // ✅ FIXED: Update challenge with proper final terms
      const batch = writeBatch(db);
      const challengeRef = doc(db, 'challenges', challenge.id);
      
      const updateData = {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        responseBy: user.uid,
        escrowAccount: escrowData.escrowId,
        escrowData: escrowData,
        negotiationStatus: 'accepted',
        activeNegotiationId: null,
        latestOffer: null,
        // ✅ CRITICAL: Apply negotiated terms if they exist
        challenge: challengeText,
        wagerAmount: wagerAmount,
        wagerToken: wagerToken,
        expiryDays: expiryDays,
        cryptoDetails: {
          amount: wagerAmount,
          tokenSymbol: wagerToken,
          totalPot: escrowData.breakdown?.totalPot || (wagerAmount * 2),
          atlasFee: escrowData.breakdown?.atlasFee || (wagerAmount * 2 * 0.025),
          winnerPayout: escrowData.breakdown?.winnerPayout || (wagerAmount * 2 * 0.975),
          challengerDeposited: true,
          challengeeDeposited: true,
          escrowStatus: 'active'
        }
      };
      
      batch.update(challengeRef, updateData);
      await batch.commit();
      
      console.log('✅ [HOOK] Crypto challenge accepted successfully');
      
      Alert.alert(
        '💰 Challenge Accepted!',
        `Challenge accepted! Your ${wagerAmount} ${wagerToken} has been deposited.\n\nTotal pot: ${(wagerAmount * 2).toFixed(2)} ${wagerToken}\nWinner gets: ${(wagerAmount * 2 * 0.975).toFixed(2)} ${wagerToken}\n\nTime to complete the challenge! 💪`,
        [{ text: 'Let\'s Go!' }]
      );
      
    } catch (error) {
      console.error('❌ [HOOK] Crypto challenge acceptance failed:', error);
      Alert.alert('Error', `Failed to accept challenge: ${error.message}`);
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  // ✅ REGULAR CHALLENGE ACCEPTANCE
  const acceptRegularChallenge = async () => {
    try {
      setIsSubmittingResponse(true);
      
      const batch = writeBatch(db);
      const challengeRef = doc(db, 'challenges', challenge.id);
      
      const updateData = {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        responseBy: user.uid,
        negotiationStatus: 'accepted',
        activeNegotiationId: null,
        latestOffer: null,
        // ✅ FIXED: Apply negotiated terms if available
        challenge: challenge.latestOffer?.challenge || challenge.challenge,
        wagerAmount: challenge.latestOffer?.wagerAmount || challenge.wagerAmount || 0,
        wagerToken: challenge.latestOffer?.wagerToken || challenge.wagerToken || 'USDC',
        expiryDays: challenge.latestOffer?.expiryDays || challenge.expiryDays || 7
      };

      batch.update(challengeRef, updateData);
      await batch.commit();
      
      console.log('✅ [HOOK] Regular challenge accepted successfully');
      Alert.alert('Challenge Accepted!', 'Challenge accepted! Time to crush it! 💪');
      
    } catch (error) {
      console.error('❌ [HOOK] Regular challenge acceptance failed:', error);
      throw error;
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  // ✅ DECLINE CHALLENGE
  const declineChallenge = async () => {
    try {
      setIsSubmittingResponse(true);
      
      const batch = writeBatch(db);
      const challengeRef = doc(db, 'challenges', challenge.id);
      
      const updateData = {
        status: 'declined',
        declinedAt: serverTimestamp(),
        responseBy: user.uid,
        negotiationStatus: 'declined',
        activeNegotiationId: null,
        latestOffer: null
      };

      batch.update(challengeRef, updateData);
      await batch.commit();
      
      console.log('✅ [HOOK] Challenge declined successfully');
      Alert.alert('Challenge Declined', 'You have declined this challenge.');
      
    } catch (error) {
      console.error('❌ [HOOK] Challenge decline failed:', error);
      Alert.alert('Error', 'Failed to decline challenge');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  // ✅ VIDEO RESPONSE SUBMISSION USING UNIFIED SERVICE
  const submitVideoResponse = async (videoData) => {
    try {
      console.log('🎬 [HOOK] Starting video response submission...');
      setIsSubmittingResponse(true);
      
      if (!videoData || !videoData.uri) {
        throw new Error('Invalid video data provided');
      }

      // Use unified service for submission
      const result = await unifiedVideoService.submitVideoResponse(
        challenge.id,
        videoData,
        videoData.isPublic || false
      );

      console.log('✅ [HOOK] Video response submitted successfully:', result);

      Alert.alert(
        '🎥 Video Response Submitted!',
        `Your video proof has been submitted ${videoData.isPublic ? 'publicly to The Coliseum' : 'privately'} and is awaiting approval!`,
        [{ text: 'Awesome!' }]
      );

      return result;

    } catch (error) {
      console.error('❌ [HOOK] Video response submission failed:', error);
      Alert.alert(
        'Video Submission Failed',
        `Error: ${error.message}\n\nPlease try again or contact support if the problem persists.`,
        [{ text: 'OK' }]
      );
      throw error;
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  // ✅ TEXT RESPONSE SUBMISSION
  const submitTextResponse = async () => {
    if (!responseText.trim()) {
      Alert.alert('Error', 'Please enter a response');
      return;
    }

    try {
      setIsSubmittingResponse(true);
      
      const batch = writeBatch(db);
      const challengeRef = doc(db, 'challenges', challenge.id);
      
      const updateData = {
        status: 'response_submitted',
        responseSubmittedAt: serverTimestamp(),
        responseText: responseText.trim(),
        responseType: 'text',
        responseBy: user.uid,
        hasResponse: true,
        hasVideoResponse: false,
        responseData: {
          type: 'text',
          content: responseText.trim(),
          submittedAt: new Date().toISOString(),
          responderId: user.uid
        }
      };
      
      batch.update(challengeRef, updateData);
      await batch.commit();
      
      console.log('✅ [HOOK] Text response submitted successfully');
      setResponseText('');
      Alert.alert('Response Submitted!', 'Your text response has been submitted!');
      
    } catch (error) {
      console.error('❌ [HOOK] Text response submission failed:', error);
      Alert.alert('Error', 'Failed to submit response');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  // ✅ TOGGLE VIDEO PRIVACY USING UNIFIED SERVICE
  const toggleVideoPrivacy = async (responseId) => {
    try {
      setIsSubmittingResponse(true);
      
      await unifiedVideoService.toggleVideoPrivacy(responseId, challenge.id);
      
      Alert.alert(
        'Privacy Updated!',
        'Video privacy settings have been updated successfully.',
        [{ text: 'Great!' }]
      );

    } catch (error) {
      console.error('❌ [HOOK] Video privacy toggle failed:', error);
      Alert.alert('Error', 'Failed to update video privacy. Please try again.');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  // ✅ PLACEHOLDER FUNCTIONS (TO BE IMPLEMENTED)
  const negotiateChallenge = async (negotiationData) => {
    console.log('🤝 [HOOK] Negotiation started:', negotiationData);
    setShowNegotiationModal(true);
  };

  const approveResponse = async (approved, comment = '') => {
    console.log('✅ [HOOK] Response approval:', approved);
    Alert.alert('Feature Coming Soon', 'Response approval feature will be available soon!');
  };

  const requestRetry = async (comment) => {
    console.log('🔄 [HOOK] Retry requested:', comment);
    Alert.alert('Feature Coming Soon', 'Retry request feature will be available soon!');
  };

  const initiateDispute = async (comment) => {
    console.log('⚖️ [HOOK] Dispute initiated:', comment);
    Alert.alert('Feature Coming Soon', 'Dispute feature will be available soon!');
  };

  const resubmitAfterRetry = async (responseData) => {
    return submitVideoResponse(responseData);
  };

  const loadVideoResponseData = async (challengeId) => {
    console.log('📹 [HOOK] Loading video response data for:', challengeId);
    return null;
  };

  return {
    isSubmittingResponse,
    walletConnected,
    connectedWallet,
    acceptChallenge,
    declineChallenge,
    negotiateChallenge,
    submitTextResponse,
    submitVideoResponse,
    approveResponse,
    requestRetry,
    initiateDispute,
    resubmitAfterRetry,
    loadVideoResponseData,
    toggleVideoPrivacy,
    handleWalletConnected,
    checkWalletConnection,
    showWalletModal,
    setShowWalletModal,
    showNegotiationModal,
    setShowNegotiationModal,
    showBindingContractModal,
    setShowBindingContractModal
  };
};