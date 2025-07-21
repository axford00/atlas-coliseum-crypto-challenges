// FILE: src/hooks_atlas/useChallengeManagement.js 
// 🚀 UPDATED: Enhanced with Safe Firebase Integration

import { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { 
  addDoc, 
  collection, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { Alert } from 'react-native';
// ✅ CRITICAL: Import safe Firebase functions
import { 
  getDb, 
  isFirebaseReady, 
  waitForFirebase, 
  safeFirestoreOperation 
} from '../../firebase';
import {
  sendChallengeNotification,
  sendChallengeResponseNotification,
  sendEncouragementNotification
} from '../services/buddyNotificationService';
import solanaMobileWalletService from '../services/solana/solanaMobileWalletService';
import challengeNegotiationService from '../services/challengeNegotiationService';

export const useChallengeManagement = (buddy, setChallenges) => {
  const [sendingMessage, setSendingMessage] = useState(false);
  const [updatingChallenge, setUpdatingChallenge] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;

  // ✅ ENHANCED: Firebase readiness check
  const ensureFirebaseReady = async () => {
    if (!isFirebaseReady()) {
      console.log('⏳ Waiting for Firebase to be ready...');
      const ready = await waitForFirebase(10000);
      if (!ready) {
        throw new Error('Firebase not ready - please restart the app');
      }
    }
    return getDb();
  };

  // ✅ SAFE: Send quick message
  const sendQuickMessage = async (messageType, customMessage = '') => {
    console.log('🚀 sendQuickMessage called with type:', messageType);

    let message = '';
    
    switch (messageType) {
      case 'fist_pump':
        message = '👊 Keep crushing it! You\'re doing amazing!';
        break;
      case 'strong_man':
        message = '💪 Beast mode activated! You\'re getting stronger every day!';
        break;
      case 'fire':
        message = '🔥 On fire! Your dedication is inspiring!';
        break;
      case 'custom':
        message = customMessage.trim();
        if (!message) {
          Alert.alert('Error', 'Please enter a message');
          return;
        }
        break;
      default:
        console.log('❌ Unknown message type:', messageType);
        return;
    }

    try {
      setSendingMessage(true);
      
      // ✅ CRITICAL: Ensure Firebase is ready
      const safeDb = await ensureFirebaseReady();
      
      const messageData = {
        from: user.uid,
        fromName: user.displayName || user.email?.split('@')[0] || 'Unknown',
        to: buddy.buddyUserId || buddy.id,
        toName: buddy.name || buddy.displayName || 'Buddy',
        message: message,
        type: messageType,
        createdAt: new Date().toISOString(),
        status: 'sent'
      };

      console.log('💾 Saving message to database...');
      const docRef = await safeFirestoreOperation(async () => {
        return await addDoc(collection(safeDb, 'messages'), messageData);
      });
      
      if (docRef) {
        console.log('✅ Message saved with ID:', docRef.id);
      }

      // Send notification (don't block on failure)
      try {
        await sendEncouragementNotification(
          buddy.buddyUserId || buddy.id,
          user.displayName || user.email?.split('@')[0] || 'Unknown',
          message
        );
        console.log('✅ Notification sent successfully');
      } catch (notifError) {
        console.log('⚠️ Notification failed but continuing:', notifError.message);
      }

      Alert.alert('Message Sent!', `Your encouragement has been sent to ${buddy.name || buddy.displayName}!`);
      
    } catch (error) {
      console.error('❌ Error in sendQuickMessage:', error);
      Alert.alert('Error', `Failed to send message: ${error.message}`);
    } finally {
      setSendingMessage(false);
    }
  };

  // ✅ SAFE: Send challenge (handles both regular and crypto)
  const sendChallenge = async (challengeText, challengeReward = '', cryptoWager = null) => {
    if (!challengeText.trim()) {
      Alert.alert('Error', 'Please enter a challenge description');
      return false;
    }

    try {
      setSendingMessage(true);
      
      if (cryptoWager) {
        return await sendCryptoChallenge(challengeText, challengeReward, cryptoWager);
      } else {
        return await sendRegularChallenge(challengeText, challengeReward);
      }
      
    } catch (error) {
      console.error('Error sending challenge:', error);
      Alert.alert('Error', 'Failed to send challenge');
      return false;
    } finally {
      setSendingMessage(false);
    }
  };

  // ✅ SAFE: Send regular challenge
  const sendRegularChallenge = async (challengeText, challengeReward) => {
    try {
      const safeDb = await ensureFirebaseReady();
      
      const challengeData = {
        from: user.uid,
        fromName: user.displayName || user.email.split('@')[0],
        to: buddy.buddyUserId || buddy.id,
        toName: buddy.name,
        challenge: challengeText,
        reward: challengeReward || 'Completion satisfaction',
        createdAt: new Date().toISOString(),
        status: 'pending',
        type: 'fitness',
        category: 'fitness',
        difficulty: 'medium',
        isPublic: false,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        wagerAmount: 0,
        wagerToken: null
      };

      console.log('💾 Challenge data to save:', challengeData);

      await safeFirestoreOperation(async () => {
        return await addDoc(collection(safeDb, 'challenges'), challengeData);
      });

      // Send challenge notification
      await sendChallengeNotification(
        buddy.buddyUserId || buddy.id,
        user.displayName || user.email.split('@')[0],
        challengeText
      );

      // Update local challenges list
      setChallenges(prev => [{
        ...challengeData,
        id: `temp_${Date.now()}`,
        direction: 'to_buddy',
        isYourChallenge: true
      }, ...prev]);

      Alert.alert('Challenge Sent!', `Your challenge has been sent to ${buddy.name}! They'll receive a notification.`);
      
      return true;
      
    } catch (error) {
      console.error('Error sending regular challenge:', error);
      throw error;
    }
  };

  // 🚀 ENHANCED: Send crypto challenge with safe Firebase operations
  const sendCryptoChallenge = async (challengeText, challengeReward, cryptoWager) => {
    try {
      console.log('💰 Creating crypto challenge with wager:', cryptoWager);
      
      // ✅ CRITICAL: Check wallet connection FIRST
      const isWalletConnected = solanaMobileWalletService.isConnected();
      if (!isWalletConnected) {
        Alert.alert(
          '💰 Wallet Required',
          'You need to connect your wallet to create crypto challenges.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Connect Wallet', onPress: () => {
              Alert.alert('Info', 'Please connect your wallet first');
            }}
          ]
        );
        return false;
      }

      console.log('🔧 Wallet validation passed, proceeding with escrow creation');
      
      // ✅ CRITICAL: Ensure Firebase is ready
      const safeDb = await ensureFirebaseReady();
      
      console.log('💰 Crypto wager:', {
        amount: cryptoWager.amount,
        token: cryptoWager.token,
        expiryDays: cryptoWager.expiryDays
      });
      
      // ✅ CRITICAL: Create escrow FIRST
      let escrowData;
      try {
        console.log('🏦 Creating escrow with solanaMobileWalletService...');
        
        escrowData = await solanaMobileWalletService.createCryptoChallenge({
          wagerAmount: cryptoWager.amount,
          tokenType: cryptoWager.token,
          challengeText: challengeText,
          challengeeId: buddy.buddyUserId || buddy.id,
          challengerId: user.uid,
          expiryDays: cryptoWager.expiryDays || 7
        });

        console.log('✅ Escrow created successfully:', {
          escrowId: escrowData.escrowId,
          status: escrowData.status,
          wager: `${escrowData.wagerAmount} ${escrowData.tokenType}`
        });
        
        if (!escrowData || !escrowData.escrowId) {
          throw new Error('Escrow creation returned invalid result');
        }
        
      } catch (escrowError) {
        console.error('❌ ESCROW CREATION FAILED:', escrowError);
        Alert.alert('Escrow Failed', `Failed to create escrow: ${escrowError.message}`);
        return false;
      }

      // ✅ CRITICAL: Calculate crypto details
      const cryptoDetails = {
        amount: cryptoWager.amount,
        tokenSymbol: cryptoWager.token,
        totalPot: escrowData.breakdown?.totalPot || (cryptoWager.amount * 2),
        atlasFee: escrowData.breakdown?.atlasFee || (cryptoWager.amount * 2 * 0.025),
        winnerPayout: escrowData.breakdown?.winnerPayout || (cryptoWager.amount * 2 * 0.975),
        bonus: cryptoWager.token === 'SOL' ? '10%' : 
               cryptoWager.token === 'BONK' ? '25%' : '0%'
      };

      // ✅ CRITICAL: Save challenge with COMPLETE escrow data
      const challengeData = {
        from: user.uid,
        fromName: user.displayName || user.email.split('@')[0],
        to: buddy.buddyUserId || buddy.id,
        toName: buddy.name,
        challenge: challengeText,
        reward: challengeReward || 'Crypto payout',
        createdAt: new Date().toISOString(),
        status: 'pending',
        type: 'crypto',
        category: 'fitness',
        difficulty: 'medium',
        isPublic: false,
        dueDate: new Date(Date.now() + (cryptoWager.expiryDays || 7) * 24 * 60 * 60 * 1000).toISOString(),
        expiryDays: cryptoWager.expiryDays || 7,
        wagerAmount: cryptoWager.amount,
        wagerToken: cryptoWager.token,
        escrowAccount: escrowData.escrowId,
        escrowData: escrowData,
        cryptoDetails: cryptoDetails
      };

      console.log('💾 Challenge data to save:', challengeData);
      console.log('✅ Crypto wager validated:', `${cryptoWager.amount} ${cryptoWager.token}`);

      // ✅ SAFE: Save to Firebase
      const docRef = await safeFirestoreOperation(async () => {
        return await addDoc(collection(safeDb, 'challenges'), challengeData);
      });
      
      if (!docRef) {
        throw new Error('Failed to save challenge to database');
      }
      
      console.log('✅ Challenge created successfully with ID:', docRef.id);

      // Send challenge notification
      await sendChallengeNotification(
        buddy.buddyUserId || buddy.id,
        user.displayName || user.email.split('@')[0],
        `💰 Crypto Challenge: ${challengeText} (${cryptoWager.amount} ${cryptoWager.token})`
      );
      console.log('✅ Challenge notification sent successfully');

      // Update local challenges list
      setChallenges(prev => [{
        ...challengeData,
        id: docRef.id,
        direction: 'to_buddy',
        isYourChallenge: true
      }, ...prev]);

      Alert.alert(
        '💰 Crypto Challenge Sent!', 
        `Your crypto challenge with ${cryptoWager.amount} ${cryptoWager.token} wager has been sent to ${buddy.name}!\n\nYour deposit: ${cryptoWager.amount} ${cryptoWager.token}\nWinner gets: ${cryptoDetails.winnerPayout} ${cryptoWager.token}\nEscrow: ${escrowData.escrowId?.slice(0, 12)}...`
      );
      
      return true;
      
    } catch (error) {
      console.error('❌ Error sending crypto challenge:', error);
      Alert.alert('Error', `Failed to send crypto challenge: ${error.message}`);
      return false;
    }
  };

  // ✅ SAFE: Accept challenge (including crypto)
  const acceptChallenge = async (challenge) => {
    try {
      setUpdatingChallenge(true);
      
      const safeDb = await ensureFirebaseReady();
      
      if (challenge.wagerAmount > 0) {
        console.log('💰 Accepting crypto challenge:', challenge.id);
        
        if (!challenge.escrowAccount && !challenge.escrowData?.escrowId) {
          throw new Error('Missing escrow account in challenge data');
        }
        
        if (!solanaMobileWalletService.isConnected()) {
          Alert.alert(
            '💰 Wallet Required',
            'You need to connect your wallet to accept crypto challenges.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Connect Wallet', onPress: () => {
                Alert.alert('Info', 'Please connect your wallet first');
              }}
            ]
          );
          return false;
        }

        const escrowId = challenge.escrowAccount || challenge.escrowData?.escrowId;
        await solanaMobileWalletService.acceptCryptoChallenge(escrowId);
      }
      
      // ✅ SAFE: Update challenge status in Firebase
      const updateData = {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        responseBy: user.uid
      };

      if (challenge.wagerAmount > 0) {
        updateData.cryptoDetails = {
          ...challenge.cryptoDetails,
          challengeeDeposited: true
        };
      }

      await safeFirestoreOperation(async () => {
        const challengeRef = doc(safeDb, 'challenges', challenge.id);
        return await updateDoc(challengeRef, updateData);
      });

      // Send response notification
      await sendChallengeResponseNotification(
        challenge.from,
        user.displayName || user.email.split('@')[0],
        'accepted'
      );

      // Update local state
      setChallenges(prev => prev.map(c => 
        c.id === challenge.id ? { ...c, ...updateData } : c
      ));

      Alert.alert('Success!', 'Challenge accepted! Time to crush it! 💪');
      return true;
      
    } catch (error) {
      console.error('❌ Error accepting challenge:', error);
      Alert.alert('Error', `Failed to accept challenge: ${error.message}`);
      return false;
    } finally {
      setUpdatingChallenge(false);
    }
  };

  // ✅ SAFE: Decline challenge
  const rejectChallenge = async (challenge) => {
    try {
      setUpdatingChallenge(true);
      
      const safeDb = await ensureFirebaseReady();
      
      const updateData = {
        status: 'declined',
        declinedAt: serverTimestamp(),
        responseBy: user.uid
      };

      await safeFirestoreOperation(async () => {
        const challengeRef = doc(safeDb, 'challenges', challenge.id);
        return await updateDoc(challengeRef, updateData);
      });

      // Send response notification
      await sendChallengeResponseNotification(
        challenge.from,
        user.displayName || user.email.split('@')[0],
        'declined'
      );

      // Update local state
      setChallenges(prev => prev.map(c => 
        c.id === challenge.id ? { ...c, ...updateData } : c
      ));

      Alert.alert('Challenge Declined', 'You have declined this challenge.');
      return true;
      
    } catch (error) {
      console.error('Error declining challenge:', error);
      Alert.alert('Error', 'Failed to decline challenge');
      return false;
    } finally {
      setUpdatingChallenge(false);
    }
  };

  // 🚀 ENHANCED: Negotiate challenge with backend service
  const negotiateChallenge = async (challenge, negotiationData) => {
    try {
      setUpdatingChallenge(true);
      
      console.log('🤝 Starting negotiation with backend service:', {
        challengeId: challenge.id,
        negotiationType: negotiationData.negotiationType
      });
      
      const result = await challengeNegotiationService.submitNegotiation(
        challenge.id,
        negotiationData,
        user
      );
      
      if (result.success) {
        setChallenges(prev => prev.map(c => 
          c.id === challenge.id ? {
            ...c,
            status: 'negotiating',
            negotiationStatus: 'counter_offer_sent',
            currentNegotiationId: result.negotiationId
          } : c
        ));

        Alert.alert(
          '🤝 Negotiation Sent!', 
          `Your counter-offer has been sent to ${challenge.fromName}!\n\n${result.moneyFlows.description}`,
          [{ text: 'Got it!', style: 'default' }]
        );
        
        return true;
      } else {
        throw new Error(result.message || 'Unknown error');
      }
      
    } catch (error) {
      console.error('❌ Error negotiating challenge:', error);
      Alert.alert('Error', `Failed to send negotiation: ${error.message}`);
      return false;
    } finally {
      setUpdatingChallenge(false);
    }
  };

  // ✅ SAFE: Accept incoming negotiation
  const acceptNegotiation = async (negotiationId) => {
    try {
      setUpdatingChallenge(true);
      
      console.log('✅ Accepting negotiation:', negotiationId);
      
      const result = await challengeNegotiationService.acceptNegotiation(
        negotiationId,
        user.uid
      );
      
      if (result.success) {
        Alert.alert('✅ Negotiation Accepted!', result.message);
        return true;
      } else {
        throw new Error(result.message || 'Unknown error');
      }
      
    } catch (error) {
      console.error('❌ Error accepting negotiation:', error);
      Alert.alert('Error', `Failed to accept negotiation: ${error.message}`);
      return false;
    } finally {
      setUpdatingChallenge(false);
    }
  };

  // ✅ SAFE: Decline incoming negotiation
  const declineNegotiation = async (negotiationId, reason = '') => {
    try {
      setUpdatingChallenge(true);
      
      console.log('❌ Declining negotiation:', negotiationId);
      
      const result = await challengeNegotiationService.declineNegotiation(
        negotiationId,
        user.uid,
        reason
      );
      
      if (result.success) {
        Alert.alert('❌ Negotiation Declined', result.message);
        return true;
      } else {
        throw new Error(result.message || 'Unknown error');
      }
      
    } catch (error) {
      console.error('❌ Error declining negotiation:', error);
      Alert.alert('Error', `Failed to decline negotiation: ${error.message}`);
      return false;
    } finally {
      setUpdatingChallenge(false);
    }
  };

  // ✅ SAFE: Get negotiations for a challenge
  const getNegotiations = async (challengeId) => {
    try {
      return await challengeNegotiationService.getNegotiationsForChallenge(challengeId);
    } catch (error) {
      console.error('❌ Error getting negotiations:', error);
      return [];
    }
  };

  // ✅ SAFE: Handle challenge response (legacy compatibility)
  const handleChallengeResponse = async (challenge, response) => {
    if (!user || !challenge) return false;

    try {
      setUpdatingChallenge(true);
      
      if (response === 'accepted') {
        return await acceptChallenge(challenge);
      } else if (response === 'declined') {
        return await rejectChallenge(challenge);
      } else {
        console.log('🔄 Handling other response:', response);
        return true;
      }
      
    } catch (error) {
      console.error('Error handling challenge response:', error);
      return false;
    } finally {
      setUpdatingChallenge(false);
    }
  };

  return {
    sendingMessage,
    updatingChallenge,
    sendQuickMessage,
    sendChallenge,
    acceptChallenge,
    rejectChallenge,
    negotiateChallenge,
    acceptNegotiation,
    declineNegotiation,
    getNegotiations,
    handleChallengeResponse
  };
};