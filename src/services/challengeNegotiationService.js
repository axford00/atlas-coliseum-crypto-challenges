// FILE: src/services/challengeNegotiationService.js
// 🚀 ATLAS NEGOTIATION BACKEND SERVICE - FIXED FOR BIDIRECTIONAL NEGOTIATION
// Handles all negotiation CRUD operations and money flow calculations

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  writeBatch 
} from 'firebase/firestore';
import { db } from '../../firebase';
import solanaMobileWalletService from './solana/solanaMobileWalletService';

// 🚀 DIRECT OBJECT EXPORT (instead of class) to fix import issues
const challengeNegotiationService = {
  collectionName: 'challengeNegotiations',

  // 🎯 SUBMIT NEW NEGOTIATION - FIXED FOR BIDIRECTIONAL SUPPORT
  async submitNegotiation(challengeId, negotiationData, user) {
    try {
      console.log('🤝 ChallengeNegotiationService: submitNegotiation called');
      console.log('🤝 Submitting negotiation:', { challengeId, negotiationData });

      // Validate required data
      if (!challengeId || !negotiationData || !user) {
        throw new Error('Missing required parameters for negotiation submission');
      }

      // Get challenge data to validate negotiation
      const challengeRef = doc(db, 'challenges', challengeId);
      const challengeDoc = await getDoc(challengeRef);
      
      if (!challengeDoc.exists()) {
        throw new Error('Challenge not found');
      }

      const challenge = challengeDoc.data();
      
      // ✅ FIXED: Allow BOTH challenger and challengee to negotiate
      const isChallenger = challenge.from === user.uid;
      const isChallengee = challenge.to === user.uid;
      
      if (!isChallenger && !isChallengee) {
        throw new Error('You are not a participant in this challenge');
      }
      
      // ✅ FIXED: Removed restrictive challengee-only check
      // OLD CODE: if (challenge.to !== user.uid) { throw new Error('Only the challengee can submit negotiations'); }
      
      // ✅ NEW: Determine negotiation direction and participants
      const negotiationDirection = isChallenger ? 'challenger_to_challengee' : 'challengee_to_challenger';
      const fromUserId = user.uid;
      const toUserId = isChallenger ? challenge.to : challenge.from;
      const fromUserName = user.displayName || user.email?.split('@')[0] || 'Unknown';
      const toUserName = isChallenger ? challenge.toName : challenge.fromName;

      // ✅ FIXED: Allow negotiation from accepted, negotiating, or pending challenges
      const allowedStatuses = ['pending', 'negotiating', 'accepted'];
      if (!allowedStatuses.includes(challenge.status)) {
        throw new Error(`Cannot negotiate ${challenge.status} challenges. Must be pending, negotiating, or accepted.`);
      }

      // Calculate money flows for crypto challenges
      let moneyFlow = null;
      if (challenge.wagerAmount && challenge.wagerAmount > 0) {
        moneyFlow = this.calculateMoneyFlows(challenge, negotiationData);
      }

      // 🚀 CRITICAL FIX: Create escrow during negotiation for crypto challenges
      let escrowData = null;
      if (negotiationData.proposedWagerAmount && negotiationData.proposedWagerAmount > 0) {
        try {
          console.log('💰 Creating escrow for negotiation:', {
            wagerAmount: negotiationData.proposedWagerAmount,
            tokenType: negotiationData.proposedWagerToken
          });
          
          escrowData = await solanaMobileWalletService.createCryptoChallenge({
            challengeId: challengeId,
            challengerId: challenge.from,
            challengeeId: challenge.to,
            wagerAmount: negotiationData.proposedWagerAmount,
            tokenType: negotiationData.proposedWagerToken,
            challengeText: negotiationData.proposedChallenge,
            expiryDays: negotiationData.proposedExpiryDays || 7
          });
          
          console.log('✅ Escrow created for negotiation:', escrowData);
        } catch (escrowError) {
          console.error('❌ Failed to create escrow for negotiation:', escrowError);
          // Continue without escrow - negotiation can still be submitted
        }
      }

      // Create negotiation document
      const negotiationDoc = {
        challengeId,
        challengerId: challenge.from,
        challengeeId: challenge.to,
        
        // ✅ NEW: Track who is negotiating
        fromUserId,
        toUserId,
        fromUserName,
        toUserName,
        direction: negotiationDirection,
        
        // Original terms
        originalChallenge: challenge.challenge,
        originalWager: challenge.wagerAmount || 0,
        originalWagerToken: challenge.wagerToken || null,
        originalExpiryDays: challenge.expiryDays || 7,
        
        // Proposed terms
        proposedChallenge: negotiationData.proposedChallenge,
        proposedWagerAmount: negotiationData.proposedWagerAmount || 0,
        proposedWagerToken: negotiationData.proposedWagerToken || null,
        proposedExpiryDays: negotiationData.proposedExpiryDays || 7,
        
        // Negotiation metadata
        negotiationType: negotiationData.negotiationType || 'counter_offer',
        notes: negotiationData.notes || '',
        status: 'pending_response',
        
        // Money flow calculations
        moneyFlow,
        
        // 🚀 CRITICAL: Add escrow data from negotiation
        escrowData: escrowData,
        escrowAccount: escrowData?.escrowId || null,
        hasEscrow: !!escrowData,
        
        // Timestamps
        createdAt: serverTimestamp(),
        submittedBy: user.uid,
        submittedByName: fromUserName,
        
        // Response tracking
        respondedAt: null,
        respondedBy: null,
        response: null,
        responseReason: null,
        
        // ✅ NEW: Negotiation round tracking
        roundNumber: (challenge.negotiationCount || 0) + 1,
        previousNegotiationId: challenge.activeNegotiationId || null
      };

      // Use Firebase batch to update both negotiation and challenge
      const batch = writeBatch(db);
      
      // Add negotiation document
      const negotiationRef = doc(collection(db, this.collectionName));
      batch.set(negotiationRef, negotiationDoc);
      
      // ✅ ENHANCED: Update challenge status with better tracking
      const challengeUpdate = {
        status: 'negotiating',
        negotiationStatus: 'pending_response',
        activeNegotiationId: negotiationRef.id,
        lastNegotiationAt: serverTimestamp(),
        negotiationCount: (challenge.negotiationCount || 0) + 1,
        
        // ✅ NEW: Track latest offer for UI display
        latestOffer: {
          challenge: negotiationData.proposedChallenge,
          wagerAmount: negotiationData.proposedWagerAmount || 0,
          wagerToken: negotiationData.proposedWagerToken || null,
          expiryDays: negotiationData.proposedExpiryDays || 7,
          note: negotiationData.notes || '',
          from: fromUserId,
          fromName: fromUserName,
          to: toUserId,
          toName: toUserName,
          timestamp: new Date().toISOString(),
          negotiationId: negotiationRef.id
        },
        
        // ✅ NEW: Enhanced negotiation history
        negotiationHistory: [
          ...(challenge.negotiationHistory || []),
          {
            type: 'Counter-Offer',
            details: negotiationData.proposedChallenge,
            wager: negotiationData.proposedWagerAmount > 0 
              ? `${negotiationData.proposedWagerAmount} ${negotiationData.proposedWagerToken}`
              : 'No wager',
            from: fromUserName,
            to: toUserName,
            timestamp: new Date().toISOString(),
            note: negotiationData.notes || '',
            negotiationId: negotiationRef.id,
            round: (challenge.negotiationCount || 0) + 1
          }
        ]
      };
      
      batch.update(challengeRef, challengeUpdate);

      // Commit the batch
      await batch.commit();

      console.log('✅ Negotiation submitted successfully:', negotiationRef.id);
      
      return {
        success: true,
        negotiationId: negotiationRef.id,
        challengeStatus: 'negotiating',
        moneyFlow,
        escrowData,
        message: `Counter-offer sent to ${toUserName}`,
        direction: negotiationDirection,
        latestOffer: challengeUpdate.latestOffer
      };

    } catch (error) {
      console.error('❌ Error submitting negotiation:', error);
      throw new Error(`Failed to submit negotiation: ${error.message}`);
    }
  },

  // ✅ ACCEPT NEGOTIATION - ENHANCED FOR BIDIRECTIONAL SUPPORT
  async acceptNegotiation(negotiationId, userId) {
    try {
      console.log('✅ Accepting negotiation:', { negotiationId, userId });

      // Get negotiation data
      const negotiationRef = doc(db, this.collectionName, negotiationId);
      const negotiationDoc = await getDoc(negotiationRef);
      
      if (!negotiationDoc.exists()) {
        throw new Error('Negotiation not found');
      }

      const negotiation = negotiationDoc.data();
      
      // ✅ FIXED: Allow the target user (toUserId) to accept the negotiation
      if (negotiation.toUserId !== userId) {
        throw new Error('You cannot accept this negotiation - it was not sent to you');
      }

      if (negotiation.status !== 'pending_response') {
        throw new Error('This negotiation has already been responded to');
      }

      // Get challenge data
      const challengeRef = doc(db, 'challenges', negotiation.challengeId);
      const challengeDoc = await getDoc(challengeRef);
      
      if (!challengeDoc.exists()) {
        throw new Error('Associated challenge not found');
      }

      const challenge = challengeDoc.data();

      // Use batch to update both negotiation and challenge
      const batch = writeBatch(db);
      
      // Update negotiation as accepted
      batch.update(negotiationRef, {
        status: 'accepted',
        response: 'accepted',
        respondedAt: serverTimestamp(),
        respondedBy: userId,
        responseReason: 'Counter-offer accepted'
      });

      // ✅ ENHANCED: Update challenge with new negotiated terms
      const updatedChallengeData = {
        // Update core challenge details with negotiated terms
        challenge: negotiation.proposedChallenge,
        wagerAmount: negotiation.proposedWagerAmount,
        wagerToken: negotiation.proposedWagerToken,
        expiryDays: negotiation.proposedExpiryDays,
        
        // 🚀 CRITICAL: Apply escrow data from negotiation
        ...(negotiation.escrowData && {
          escrowData: negotiation.escrowData,
          escrowAccount: negotiation.escrowAccount,
          hasEscrow: negotiation.hasEscrow
        }),
        
        // Update status - back to pending with new terms for acceptance
        status: 'pending', 
        negotiationStatus: 'accepted',
        lastNegotiationAt: serverTimestamp(),
        negotiationAcceptedAt: serverTimestamp(),
        
        // Clear active negotiation
        activeNegotiationId: null,
        latestOffer: null,
        
        // Track negotiation history
        previousTerms: {
          challenge: challenge.challenge,
          wagerAmount: challenge.wagerAmount,
          wagerToken: challenge.wagerToken,
          expiryDays: challenge.expiryDays
        },
        
        // ✅ NEW: Add acceptance to history
        negotiationHistory: [
          ...(challenge.negotiationHistory || []),
          {
            type: 'Accepted',
            details: `Terms accepted: ${negotiation.proposedChallenge}`,
            wager: negotiation.proposedWagerAmount > 0 
              ? `${negotiation.proposedWagerAmount} ${negotiation.proposedWagerToken}`
              : 'No wager',
            from: negotiation.toUserName,
            timestamp: new Date().toISOString(),
            note: 'Negotiation accepted - Challenge updated with new terms',
            negotiationId: negotiationId
          }
        ]
      };

      batch.update(challengeRef, updatedChallengeData);

      // Commit the batch
      await batch.commit();

      console.log('✅ Negotiation accepted successfully');
      
      return {
        success: true,
        challengeUpdated: true,
        newTerms: {
          challenge: negotiation.proposedChallenge,
          wagerAmount: negotiation.proposedWagerAmount,
          wagerToken: negotiation.proposedWagerToken,
          expiryDays: negotiation.proposedExpiryDays
        },
        message: 'Negotiation accepted! Challenge updated with new terms and is ready for acceptance.',
        challengeStatus: 'pending'
      };

    } catch (error) {
      console.error('❌ Error accepting negotiation:', error);
      throw new Error(`Failed to accept negotiation: ${error.message}`);
    }
  },

  // ❌ DECLINE NEGOTIATION - ENHANCED FOR BIDIRECTIONAL SUPPORT
  async declineNegotiation(negotiationId, userId, reason = '') {
    try {
      console.log('❌ Declining negotiation:', { negotiationId, userId, reason });

      // Get negotiation data
      const negotiationRef = doc(db, this.collectionName, negotiationId);
      const negotiationDoc = await getDoc(negotiationRef);
      
      if (!negotiationDoc.exists()) {
        throw new Error('Negotiation not found');
      }

      const negotiation = negotiationDoc.data();
      
      // ✅ FIXED: Allow the target user (toUserId) to decline the negotiation
      if (negotiation.toUserId !== userId) {
        throw new Error('You cannot decline this negotiation - it was not sent to you');
      }

      if (negotiation.status !== 'pending_response') {
        throw new Error('This negotiation has already been responded to');
      }

      // 🚀 CRITICAL FIX: Clean up escrow if negotiation is declined
      if (negotiation.escrowData && negotiation.escrowAccount) {
        try {
          console.log('🧹 Cleaning up escrow for declined negotiation:', negotiation.escrowAccount);
          await solanaMobileWalletService.cancelEscrow(negotiation.escrowAccount);
          console.log('✅ Escrow cancelled for declined negotiation');
        } catch (escrowError) {
          console.error('❌ Failed to cancel escrow:', escrowError);
          // Continue with decline - don't block on escrow cleanup
        }
      }

      // Get challenge data
      const challengeRef = doc(db, 'challenges', negotiation.challengeId);
      const challengeDoc = await getDoc(challengeRef);
      
      if (!challengeDoc.exists()) {
        throw new Error('Associated challenge not found');
      }

      const challenge = challengeDoc.data();
      
      // Use batch to update both negotiation and challenge
      const batch = writeBatch(db);
      
      // Update negotiation as declined
      batch.update(negotiationRef, {
        status: 'declined',
        response: 'declined',
        respondedAt: serverTimestamp(),
        respondedBy: userId,
        responseReason: reason || 'Counter-offer declined'
      });

      // ✅ ENHANCED: Update challenge status
      const challengeUpdate = {
        status: 'negotiating', // Keep negotiating status for potential new offers
        negotiationStatus: 'declined',
        lastNegotiationAt: serverTimestamp(),
        negotiationDeclinedAt: serverTimestamp(),
        activeNegotiationId: null,
        latestOffer: null,
        
        // ✅ NEW: Add decline to history
        negotiationHistory: [
          ...(challenge.negotiationHistory || []),
          {
            type: 'Declined',
            details: 'Counter-offer declined',
            from: negotiation.toUserName,
            timestamp: new Date().toISOString(),
            note: reason || 'No reason provided',
            negotiationId: negotiationId
          }
        ]
      };
      
      batch.update(challengeRef, challengeUpdate);

      // Commit the batch
      await batch.commit();

      console.log('❌ Negotiation declined successfully');
      
      return {
        success: true,
        challengeStatus: 'negotiating',
        message: 'Counter-offer declined. Negotiation can continue with new offers.'
      };

    } catch (error) {
      console.error('❌ Error declining negotiation:', error);
      throw new Error(`Failed to decline negotiation: ${error.message}`);
    }
  },

  // 📋 GET NEGOTIATIONS FOR CHALLENGE
  async getNegotiationsForChallenge(challengeId) {
    try {
      console.log('📋 Getting negotiations for challenge:', challengeId);

      const negotiationsQuery = query(
        collection(db, this.collectionName),
        where('challengeId', '==', challengeId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(negotiationsQuery);
      
      const negotiations = [];
      querySnapshot.forEach((doc) => {
        negotiations.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          respondedAt: doc.data().respondedAt?.toDate()
        });
      });

      console.log(`📋 Found ${negotiations.length} negotiations for challenge`);
      
      return negotiations;

    } catch (error) {
      console.error('❌ Error getting negotiations:', error);
      throw new Error(`Failed to get negotiations: ${error.message}`);
    }
  },

  // 💰 CALCULATE MONEY FLOWS FOR CRYPTO NEGOTIATIONS
  calculateMoneyFlows(challenge, negotiationData) {
    try {
      console.log('💰 Calculating money flows for negotiation');

      // Only calculate for crypto challenges
      if (!challenge.wagerAmount || challenge.wagerAmount <= 0) {
        return null;
      }

      const originalWager = challenge.wagerAmount;
      const proposedWager = negotiationData.proposedWagerAmount || 0;
      const token = negotiationData.proposedWagerToken || challenge.wagerToken;

      // Calculate difference
      const wagerDifference = proposedWager - originalWager;
      const percentageChange = originalWager > 0 ? ((wagerDifference / originalWager) * 100) : 0;

      // Calculate new pot and payouts
      const newTotalPot = proposedWager * 2;
      const atlasFeePercentage = 0.025; // 2.5%
      const atlasFee = newTotalPot * atlasFeePercentage;
      const winnerPayout = newTotalPot - atlasFee;

      // Deposit adjustments needed
      const challengerAdjustment = wagerDifference; // How much more/less challenger needs to deposit
      const challengeeAdjustment = wagerDifference; // How much more/less challengee needs to deposit

      const moneyFlow = {
        originalWager,
        proposedWager,
        wagerDifference,
        percentageChange: Math.round(percentageChange * 100) / 100,
        token,
        
        // New pot calculations
        newTotalPot,
        atlasFee: Math.round(atlasFee * 100) / 100,
        winnerPayout: Math.round(winnerPayout * 100) / 100,
        
        // Deposit adjustments
        depositAdjustments: {
          challenger: challengerAdjustment,
          challengee: challengeeAdjustment,
          required: wagerDifference !== 0
        },
        
        // Escrow updates (if accepted)
        escrowUpdates: {
          wagerAmount: proposedWager,
          totalPot: newTotalPot,
          winnerGets: winnerPayout,
          atlasFee: atlasFee,
          breakdown: {
            challengerDeposit: proposedWager,
            challengeeDeposit: proposedWager,
            totalPot: newTotalPot,
            atlasFee: atlasFee,
            winnerPayout: winnerPayout,
            feePercentage: atlasFeePercentage * 100
          }
        },
        
        // Human-readable summary
        summary: {
          action: wagerDifference > 0 ? 'increase' : wagerDifference < 0 ? 'decrease' : 'no_change',
          description: wagerDifference === 0 
            ? `Wager amount stays the same at ${originalWager} ${token}`
            : wagerDifference > 0 
            ? `Wager increases by ${wagerDifference} ${token} (from ${originalWager} to ${proposedWager})`
            : `Wager decreases by ${Math.abs(wagerDifference)} ${token} (from ${originalWager} to ${proposedWager})`,
          impact: wagerDifference !== 0 
            ? `Both players will need to deposit ${Math.abs(wagerDifference)} ${token} ${wagerDifference > 0 ? 'more' : 'less'}`
            : 'No deposit changes required'
        }
      };

      console.log('💰 Money flow calculated:', moneyFlow);
      return moneyFlow;

    } catch (error) {
      console.error('❌ Error calculating money flows:', error);
      return null;
    }
  },

  // 🔍 GET NEGOTIATION BY ID
  async getNegotiation(negotiationId) {
    try {
      const negotiationRef = doc(db, this.collectionName, negotiationId);
      const negotiationDoc = await getDoc(negotiationRef);
      
      if (!negotiationDoc.exists()) {
        return null;
      }

      return {
        id: negotiationDoc.id,
        ...negotiationDoc.data(),
        createdAt: negotiationDoc.data().createdAt?.toDate(),
        respondedAt: negotiationDoc.data().respondedAt?.toDate()
      };

    } catch (error) {
      console.error('❌ Error getting negotiation:', error);
      throw new Error(`Failed to get negotiation: ${error.message}`);
    }
  },

  // 📊 GET NEGOTIATION STATISTICS
  async getNegotiationStats(userId) {
    try {
      console.log('📊 Getting negotiation stats for user:', userId);

      // Get negotiations as challenger
      const challengerQuery = query(
        collection(db, this.collectionName),
        where('challengerId', '==', userId)
      );

      // Get negotiations as challengee
      const challengeeQuery = query(
        collection(db, this.collectionName),
        where('challengeeId', '==', userId)
      );

      const [challengerSnapshot, challengeeSnapshot] = await Promise.all([
        getDocs(challengerQuery),
        getDocs(challengeeQuery)
      ]);

      const stats = {
        total: challengerSnapshot.size + challengeeSnapshot.size,
        asChallenger: challengerSnapshot.size,
        asChallengee: challengeeSnapshot.size,
        pending: 0,
        accepted: 0,
        declined: 0
      };

      // Count statuses
      [...challengerSnapshot.docs, ...challengeeSnapshot.docs].forEach(doc => {
        const status = doc.data().status;
        if (stats.hasOwnProperty(status)) {
          stats[status]++;
        }
      });

      console.log('📊 Negotiation stats:', stats);
      return stats;

    } catch (error) {
      console.error('❌ Error getting negotiation stats:', error);
      return {
        total: 0,
        asChallenger: 0,
        asChallengee: 0,
        pending: 0,
        accepted: 0,
        declined: 0
      };
    }
  }
};

// 🚀 EXPLICIT DEFAULT EXPORT
export default challengeNegotiationService;

// 🧪 Add debug logging to verify export
console.log('🔍 challengeNegotiationService exported:', !!challengeNegotiationService);
console.log('🔍 submitNegotiation method:', typeof challengeNegotiationService.submitNegotiation);