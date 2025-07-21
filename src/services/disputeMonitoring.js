// FILE: src/services/disputeMonitoring.js
// 🚀 CORRECTED: Fixed Firebase import path issue

import { collection, query, where, getDocs, doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
// ✅ CRITICAL FIX: Correct import path for Firebase db
import { db } from '../../firebase';  // Changed from '../firebase' to '../../firebase'
import solanaMobileWalletService from './solana/solanaMobileWalletService';

// ✅ Get voting results with tie detection
const getVotingResults = (dispute) => {
  const completedVotes = dispute.completedVotes || 0;
  const notCompletedVotes = dispute.notCompletedVotes || 0;
  const totalVotes = completedVotes + notCompletedVotes;
  
  if (totalVotes === 0) {
    return { 
      winner: null, 
      tie: true, 
      reason: 'no_votes',
      totalVotes: 0,
      completedVotes: 0,
      notCompletedVotes: 0
    };
  }
  
  if (completedVotes > notCompletedVotes) {
    return { 
      winner: 'challengee', 
      result: 'completed', 
      totalVotes, 
      completedVotes, 
      notCompletedVotes,
      winningMargin: completedVotes - notCompletedVotes
    };
  } else if (notCompletedVotes > completedVotes) {
    return { 
      winner: 'challenger', 
      result: 'not_completed', 
      totalVotes, 
      completedVotes, 
      notCompletedVotes,
      winningMargin: notCompletedVotes - completedVotes
    };
  } else {
    return { 
      winner: null, 
      tie: true, 
      reason: 'equal_votes',
      totalVotes, 
      completedVotes, 
      notCompletedVotes,
      winningMargin: 0
    };
  }
};

// ✅ Enhanced dispute resolution with complete tie handling
const resolveDispute = async (disputeId) => {
  try {
    console.log('🏁 Auto-resolving dispute:', disputeId);
    
    const disputeRef = doc(db, 'challenge_disputes', disputeId);
    const disputeDoc = await getDoc(disputeRef);
    
    if (!disputeDoc.exists()) {
      console.error('Dispute not found');
      return;
    }
    
    const dispute = disputeDoc.data();
    const results = getVotingResults(dispute);
    
    console.log('📊 Dispute voting results:', {
      disputeId: disputeId.slice(0, 8) + '...',
      totalVotes: results.totalVotes,
      completedVotes: results.completedVotes,
      notCompletedVotes: results.notCompletedVotes,
      winner: results.winner,
      tie: results.tie,
      reason: results.reason
    });
    
    // Update dispute with resolution
    await updateDoc(disputeRef, {
      status: 'resolved',
      resolved: true,
      finalResult: results.tie ? 'tie' : results.result,
      winner: results.winner,
      resolvedAt: serverTimestamp(),
      votingResults: results,
      tieResolution: results.tie ? {
        reason: results.reason,
        refundProcess: 'initiated'
      } : null
    });

    // Update original challenge
    const challengeRef = doc(db, 'challenges', dispute.challengeId);
    
    let challengeUpdates = {
      disputeResolved: true,
      disputeResult: results.tie ? 'tie' : results.result,
      resolvedAt: serverTimestamp()
    };

    if (results.tie) {
      // 🤝 TIE RESOLUTION - Refund both parties
      console.log('🤝 Processing tie resolution - refunding both parties...');
      
      challengeUpdates.status = 'tie_resolved';
      challengeUpdates.tieDetails = {
        reason: results.reason,
        votingResults: results,
        refundInitiated: true
      };
      
      // Process crypto refunds if applicable
      if (dispute.wagerAmount > 0) {
        try {
          const tieResult = await solanaMobileWalletService.processTieResolution(
            dispute.challengeId,
            {
              reason: results.reason,
              votingResults: results,
              resolvedAt: new Date().toISOString()
            }
          );
          
          challengeUpdates.refundBreakdown = tieResult.refundBreakdown;
          
          console.log('💰 Tie refunds processed successfully:', {
            challengerRefund: `${tieResult.refundBreakdown.challengerRefund.toFixed(4)} ${dispute.wagerToken}`,
            challengeeRefund: `${tieResult.refundBreakdown.challengeeRefund.toFixed(4)} ${dispute.wagerToken}`,
            atlasFeeCollected: `${tieResult.refundBreakdown.atlasFeeCollected.toFixed(4)} ${dispute.wagerToken}`
          });
          
        } catch (cryptoError) {
          console.error('❌ Tie refund failed:', cryptoError);
          challengeUpdates.refundError = cryptoError.message;
        }
      }
      
    } else if (results.winner === 'challengee') {
      // Challenge was completed - process payout to challengee
      console.log('✅ Challenge approved by community - paying challengee');
      
      challengeUpdates.status = 'completed';
      challengeUpdates.winner = dispute.challengeeId;
      
      if (dispute.wagerAmount > 0) {
        try {
          await solanaMobileWalletService.completeCryptoChallenge(
            dispute.challengeId,
            dispute.challengeeId,
            {
              result: 'public_vote_approved',
              votingResults: results,
              resolvedAt: new Date().toISOString()
            }
          );
          console.log('💰 Dispute resolution payout to challengee completed');
        } catch (cryptoError) {
          console.error('❌ Dispute payout to challengee failed:', cryptoError);
        }
      }
    } else if (results.winner === 'challenger') {
      // Challenge was not completed - payout to challenger
      console.log('❌ Challenge rejected by community - paying challenger');
      
      challengeUpdates.status = 'failed';
      challengeUpdates.winner = dispute.challengerId;
      
      if (dispute.wagerAmount > 0) {
        try {
          await solanaMobileWalletService.completeCryptoChallenge(
            dispute.challengeId,
            dispute.challengerId,
            {
              result: 'public_vote_rejected',
              votingResults: results,
              resolvedAt: new Date().toISOString()
            }
          );
          console.log('💰 Dispute resolution payout to challenger completed');
        } catch (cryptoError) {
          console.error('❌ Dispute payout to challenger failed:', cryptoError);
        }
      }
    }

    await updateDoc(challengeRef, challengeUpdates);
    
    console.log('✅ Dispute resolved successfully:', {
      disputeId: disputeId.slice(0, 8) + '...',
      result: results.tie ? 'TIE - Refunds processed' : results.result,
      winner: results.winner || 'Both parties (tie)',
      totalVotes: results.totalVotes,
      wagerAmount: dispute.wagerAmount,
      wagerToken: dispute.wagerToken
    });

  } catch (error) {
    console.error('❌ Error resolving dispute:', error);
    
    // Try to mark dispute as failed resolution
    try {
      const disputeRef = doc(db, 'challenge_disputes', disputeId);
      await updateDoc(disputeRef, {
        status: 'resolution_failed',
        resolutionError: error.message,
        failedAt: serverTimestamp()
      });
    } catch (updateError) {
      console.error('❌ Failed to update dispute with error status:', updateError);
    }
  }
};

// ✅ Check if voting period has ended
const isVotingEnded = (dispute) => {
  if (!dispute.votingEndsAt) return false;
  const now = new Date();
  const endTime = dispute.votingEndsAt.toDate ? dispute.votingEndsAt.toDate() : new Date(dispute.votingEndsAt);
  return now > endTime;
};

// ✅ Get time remaining in voting
const getVotingTimeRemaining = (dispute) => {
  if (!dispute.votingEndsAt) return 'No deadline';
  
  const now = new Date();
  const endTime = dispute.votingEndsAt.toDate ? dispute.votingEndsAt.toDate() : new Date(dispute.votingEndsAt);
  const timeLeft = endTime - now;
  
  if (timeLeft <= 0) return 'Voting ended';
  
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
};

// ✅ Main monitoring service
const startDisputeMonitoring = () => {
  console.log('🕐 Starting dispute monitoring service...');
  
  const monitoringInterval = setInterval(async () => {
    try {
      const now = new Date();
      
      // Query for disputes where voting has ended but not yet resolved
      const disputesQuery = query(
        collection(db, 'challenge_disputes'),
        where('status', '==', 'voting'),
        where('resolved', '==', false),
        where('votingEndsAt', '<=', now)
      );
      
      const snapshot = await getDocs(disputesQuery);
      
      if (snapshot.size > 0) {
        console.log(`🕐 Found ${snapshot.size} expired disputes to resolve`);
      }
      
      // Process each expired dispute
      const promises = [];
      snapshot.forEach((doc) => {
        const dispute = doc.data();
        const results = getVotingResults(dispute);
        
        console.log('🕐 Processing expired dispute:', {
          id: doc.id.slice(0, 8) + '...',
          totalVotes: results.totalVotes,
          completedVotes: results.completedVotes,
          notCompletedVotes: results.notCompletedVotes,
          isTie: results.tie,
          wagerAmount: dispute.wagerAmount,
          timeEnded: getVotingTimeRemaining(dispute)
        });
        
        if (results.tie) {
          console.log('🤝 Tie detected - will process refunds');
        } else {
          console.log(`🏆 Winner: ${results.winner} (${results.result})`);
        }
        
        // Add to promises array for batch processing
        promises.push(resolveDispute(doc.id));
      });
      
      // Process all disputes in parallel
      if (promises.length > 0) {
        await Promise.allSettled(promises);
        console.log(`✅ Processed ${promises.length} dispute resolutions`);
      }
      
    } catch (error) {
      console.error('❌ Error in dispute monitoring cycle:', error);
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
  
  console.log('✅ Dispute monitoring service started (checking every 5 minutes)');
  
  // Return cleanup function
  return () => {
    console.log('🛑 Stopping dispute monitoring service...');
    clearInterval(monitoringInterval);
  };
};

// ✅ Manual dispute resolution (for testing)
const resolveDisputeManually = async (disputeId) => {
  console.log('🔧 Manually resolving dispute:', disputeId);
  return await resolveDispute(disputeId);
};

// ✅ Get all active disputes
const getActiveDisputes = async () => {
  try {
    const disputesQuery = query(
      collection(db, 'challenge_disputes'),
      where('status', '==', 'voting'),
      where('resolved', '==', false)
    );
    
    const snapshot = await getDocs(disputesQuery);
    const disputes = [];
    
    snapshot.forEach((doc) => {
      const dispute = doc.data();
      disputes.push({
        id: doc.id,
        ...dispute,
        timeRemaining: getVotingTimeRemaining(dispute),
        isExpired: isVotingEnded(dispute),
        votingResults: getVotingResults(dispute)
      });
    });
    
    console.log(`📊 Found ${disputes.length} active disputes`);
    return disputes;
    
  } catch (error) {
    console.error('❌ Error fetching active disputes:', error);
    return [];
  }
};

// ✅ Test tie calculation
const testTieCalculation = (wagerAmount = 1, wagerToken = 'USDC') => {
  const totalPot = wagerAmount * 2;
  const atlasFee = totalPot * 0.025; // 2.5%
  const netAfterFees = totalPot - atlasFee;
  const refundPerParty = netAfterFees / 2;
  
  console.log('\n🧪 TIE CALCULATION TEST:');
  console.log(`💰 Each party wagered: ${wagerAmount} ${wagerToken}`);
  console.log(`💰 Total pot: ${totalPot} ${wagerToken}`);
  console.log(`💸 Atlas fee (2.5%): ${atlasFee.toFixed(4)} ${wagerToken}`);
  console.log(`💵 Net after fees: ${netAfterFees.toFixed(4)} ${wagerToken}`);
  console.log(`🤝 Each party gets back: ${refundPerParty.toFixed(4)} ${wagerToken}`);
  console.log(`📊 Refund percentage: ${((refundPerParty / wagerAmount) * 100).toFixed(1)}%`);
  
  // Validation
  const totalRefunds = refundPerParty * 2;
  const totalWithFee = totalRefunds + atlasFee;
  const isValid = Math.abs(totalWithFee - totalPot) < 0.0001;
  
  console.log(`✅ Math validation: ${isValid ? 'PASSED' : 'FAILED'}`);
  
  return {
    wagerAmount,
    wagerToken,
    totalPot,
    atlasFee,
    netAfterFees,
    refundPerParty,
    refundPercentage: (refundPerParty / wagerAmount) * 100,
    isValid
  };
};

export {
  startDisputeMonitoring,
  resolveDispute,
  resolveDisputeManually,
  getVotingResults,
  isVotingEnded,
  getVotingTimeRemaining,
  getActiveDisputes,
  testTieCalculation
};

export default {
  startDisputeMonitoring,
  resolveDispute,
  resolveDisputeManually,
  getVotingResults,
  isVotingEnded,
  getVotingTimeRemaining,
  getActiveDisputes,
  testTieCalculation
};