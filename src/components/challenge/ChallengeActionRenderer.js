// FILE: src/components/challenge/ChallengeActionRenderer.js
// 🚀 CRITICAL FIXES: Direction logic + PendingActions integration

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { colors } from '../../theme/colors';

import PendingActions from './PendingActions';
import ResponseActions from './ResponseActions';
import ResponseApproval from './ResponseApproval';
import MyVideoResponse from './MyVideoResponse';
import TieResolutionDisplay from './TieResolutionDisplay';

const ChallengeActionRenderer = ({ 
  challenge: initialChallenge, 
  user, 
  onAccept, 
  onDecline, 
  onNegotiate, 
  onSubmitResponse, 
  onResponseApproval, 
  onRequestRetry,
  onInitiateDispute,
  onVideoPrivacyToggle,
  onAcceptNegotiation,
  onDeclineNegotiation,
  isSubmitting,
  isExpired 
}) => {
  // ✅ LOCAL STATE TO TRACK REAL-TIME UPDATES
  const [challenge, setChallenge] = useState(initialChallenge);

  // ✅ SETUP REAL-TIME LISTENER FOR IMMEDIATE UPDATES
  useEffect(() => {
    if (!challenge?.id || !user?.uid) return;

    console.log('🔄 [ACTION_RENDERER] Setting up real-time listener for challenge:', challenge.id);
    
    const challengeRef = doc(db, 'challenges', challenge.id);
    
    const unsubscribe = onSnapshot(challengeRef, (doc) => {
      if (doc.exists()) {
        const updatedData = { id: doc.id, ...doc.data() };
        
        console.log('🔄 [ACTION_RENDERER] Real-time update received:', {
          id: updatedData.id,
          status: updatedData.status,
          hasVideoResponse: updatedData.hasVideoResponse || false,
          hasResponse: updatedData.hasResponse || false,
          responseDataExists: !!updatedData.responseData,
          direction: updatedData.from === user?.uid ? 'outgoing' : 'incoming'
        });
        
        setChallenge(updatedData);
      }
    }, (error) => {
      console.error('❌ [ACTION_RENDERER] Real-time listener error:', error);
    });

    return () => {
      console.log('🧹 [ACTION_RENDERER] Cleaning up real-time listener');
      unsubscribe();
    };
  }, [challenge?.id, user?.uid]);

  if (!challenge || !user) {
    console.log('❌ [ACTION_RENDERER] Missing challenge or user data');
    return null;
  }

  // ✅ FIXED: Determine direction based on user ID, not challenge.direction
  const isIncoming = challenge.to === user.uid || challenge.direction === 'incoming';
  const isOutgoing = challenge.from === user.uid || challenge.direction === 'outgoing';
  
  // ✅ CRITICAL: Force correct direction if not set
  const actualDirection = challenge.from === user.uid ? 'outgoing' : 'incoming';
  
  console.log('🔍 [ACTION_RENDERER] Challenge Action Renderer:', {
    id: challenge.id,
    status: challenge.status,
    challengeDirection: challenge.direction,
    actualDirection,
    isIncoming,
    isOutgoing,
    from: challenge.from,
    to: challenge.to,
    userId: user.uid,
    negotiationStatus: challenge.negotiationStatus,
    hasVideoResponse: challenge.hasVideoResponse || false,
    hasResponse: challenge.hasResponse || false,
    responseData: !!challenge.responseData,
    responseType: challenge.responseType
  });

  // 🤝 NEGOTIATING STATUS
  if (challenge.status === 'negotiating') {
    return (
      <View style={styles.statusSection}>
        <Text style={[styles.statusTitle, { color: '#FFC107' }]}>
          🤝 NEGOTIATION IN PROGRESS
        </Text>
        <Text style={styles.statusText}>
          {actualDirection === 'incoming' && challenge.negotiationStatus === 'counter_offer_sent' ? 
            'Your counter-offer has been sent. Waiting for response...' :
            actualDirection === 'outgoing' && challenge.negotiationStatus === 'counter_offer_received' ?
            'Counter-offer received. Review and respond above.' :
            'Negotiation in progress...'}
        </Text>
      </View>
    );
  }

  // 🎯 CRITICAL FIX: PENDING INCOMING = Accept/Decline/Negotiate (User B - Challengee)
  if (actualDirection === 'incoming' && challenge.status === 'pending') {
    console.log('✅ [ACTION_RENDERER] Showing PendingActions for incoming pending challenge');
    return (
      <PendingActions
        challenge={challenge}
        onAccept={onAccept}
        onDecline={onDecline}
        onNegotiate={onNegotiate}
        isSubmitting={isSubmitting}
        isExpired={isExpired}
      />
    );
  }

  // 🎯 PENDING OUTGOING = Waiting for response (User A - Challenger)
  if (actualDirection === 'outgoing' && challenge.status === 'pending') {
    return (
      <View style={styles.statusSection}>
        <Text style={[styles.statusTitle, { color: '#FFC107' }]}>
          ⏳ WAITING FOR RESPONSE
        </Text>
        <Text style={styles.statusText}>
          Waiting for {challenge.toName || 'your buddy'} to accept your challenge...
        </Text>
        {challenge.wagerAmount > 0 && (
          <View style={styles.cryptoInfo}>
            <Text style={styles.cryptoInfoText}>
              💰 Your {challenge.wagerAmount} {challenge.wagerToken} deposit is secured in Atlas Vault
            </Text>
          </View>
        )}
      </View>
    );
  }

  // 🎯 ACCEPTED + INCOMING = Submit video response (User B - Challengee only)
  if (challenge.status === 'accepted' && actualDirection === 'incoming') {
    console.log('✅ [ACTION_RENDERER] Showing ResponseActions for accepted incoming challenge');
    return (
      <ResponseActions
        challenge={challenge}
        onSubmitResponse={onSubmitResponse}
        isSubmitting={isSubmitting}
      />
    );
  }

  // 🎯 ACCEPTED + OUTGOING = Waiting for challengee to submit (User A - Challenger)
  if (challenge.status === 'accepted' && actualDirection === 'outgoing') {
    return (
      <View style={styles.statusSection}>
        <Text style={[styles.statusTitle, { color: '#4CAF50' }]}>
          🏁 CHALLENGE IS LIVE
        </Text>
        <Text style={styles.statusText}>
          {challenge.toName || 'Your buddy'} has accepted! 
          Waiting for them to complete the challenge and submit proof...
        </Text>
        {challenge.wagerAmount > 0 && (
          <View style={styles.cryptoInfo}>
            <Text style={styles.cryptoInfoText}>
              💰 Total pot: {(challenge.wagerAmount * 2).toFixed(2)} {challenge.wagerToken} secured in escrow
            </Text>
            <Text style={styles.cryptoInfoText}>
              🏆 Winner receives: {(challenge.wagerAmount * 2 * 0.975).toFixed(2)} {challenge.wagerToken} (net of 2.5% Atlas fee)
            </Text>
          </View>
        )}
      </View>
    );
  }

  // 🎯 RETRY REQUESTED + INCOMING = Allow resubmission (User B - Challengee)
  if (challenge.status === 'retry_requested' && actualDirection === 'incoming') {
    return (
      <View style={styles.retrySection}>
        <Text style={styles.retryTitle}>🔄 RETRY REQUESTED</Text>
        <View style={styles.retryFeedback}>
          <Text style={styles.retryFeedbackTitle}>📝 Feedback from challenger:</Text>
          <Text style={styles.retryFeedbackText}>"{challenge.retryComment}"</Text>
        </View>
        <ResponseActions
          challenge={challenge}
          onSubmitResponse={onSubmitResponse}
          isSubmitting={isSubmitting}
          isRetry={true}
        />
      </View>
    );
  }

  // 🎯 RESPONSE SUBMITTED + OUTGOING = Approve/Reject (User A - Challenger)
  if (challenge.status === 'response_submitted' && actualDirection === 'outgoing') {
    // ✅ ENHANCED: Extract response data properly from multiple possible locations
    const challengeResponse = {
      responseType: challenge.responseType || 'video',
      videoUrl: challenge.responseData?.videoUrl || 
                challenge.videoResponse?.url || 
                challenge.videoResponse?.uri,
      videoData: challenge.videoResponse || challenge.responseData,
      message: challenge.responseText || challenge.responseData?.content,
      submittedAt: challenge.responseSubmittedAt || challenge.responseData?.submittedAt,
      submittedBy: challenge.responseSubmittedBy || challenge.responseData?.responderId,
      isPublic: challenge.responseData?.isPublic || challenge.videoResponse?.isPublic || false,
      duration: challenge.responseData?.duration || challenge.videoResponse?.duration,
      fileSize: challenge.responseData?.fileSize || challenge.videoResponse?.fileSize,
      thumbnailUrl: challenge.responseData?.thumbnailUrl
    };

    console.log('🎥 [ACTION_RENDERER] Response data for approval:', {
      hasVideoUrl: !!challengeResponse.videoUrl,
      responseType: challengeResponse.responseType,
      hasResponseData: !!challenge.responseData,
      hasVideoResponse: !!challenge.videoResponse,
      isPublic: challengeResponse.isPublic
    });

    return (
      <View>
        <View style={styles.approvalHeader}>
          <Text style={[styles.statusTitle, { color: '#FF9800' }]}>
            📹 RESPONSE RECEIVED - REVIEW REQUIRED
          </Text>
          <Text style={styles.statusText}>
            {challenge.toName || 'Your buddy'} has submitted their proof. 
            Review the {challengeResponse.responseType === 'video' ? 'video' : 'response'} and decide the outcome.
          </Text>
          
          {/* ✅ ENHANCED: Show response preview */}
          {challengeResponse.responseType === 'video' && challengeResponse.videoUrl && (
            <View style={styles.videoPreviewBox}>
              <Text style={styles.videoPreviewTitle}>🎬 Video Response Available</Text>
              <Text style={styles.videoPreviewText}>
                {challengeResponse.duration ? `Duration: ${challengeResponse.duration}s` : 'Video ready for review'} • 
                {challengeResponse.isPublic ? ' 🏛️ Public' : ' 🔒 Private'}
              </Text>
              {challengeResponse.thumbnailUrl && (
                <Text style={styles.videoPreviewText}>🖼️ Thumbnail available</Text>
              )}
            </View>
          )}
          
          {challengeResponse.responseType === 'text' && challengeResponse.message && (
            <View style={styles.textPreviewBox}>
              <Text style={styles.textPreviewTitle}>📝 Text Response:</Text>
              <Text style={styles.textPreviewText}>"{challengeResponse.message}"</Text>
            </View>
          )}
        </View>
        
        <ResponseApproval
          challenge={challenge}
          challengeResponse={challengeResponse}
          onApprove={onResponseApproval}
          onRequestRetry={onRequestRetry}
          onInitiateDispute={onInitiateDispute}
          isSubmitting={isSubmitting}
        />
      </View>
    );
  }

  // 🎯 RESPONSE SUBMITTED + INCOMING = Show Your Response (User B - Challengee)
  if (challenge.status === 'response_submitted' && actualDirection === 'incoming') {
    return (
      <View>
        <View style={styles.statusSection}>
          <Text style={[styles.statusTitle, { color: '#2196F3' }]}>
            ✅ RESPONSE SUBMITTED
          </Text>
          <Text style={styles.statusText}>
            Your {challenge.responseType === 'video' ? 'video' : 'text'} proof has been submitted! 
            Waiting for the challenger to review and approve...
          </Text>
          
          {/* ✅ ENHANCED: Show submission details */}
          <View style={styles.submissionDetails}>
            <Text style={styles.submissionText}>
              📤 Submitted: {challenge.responseSubmittedAt ? 
                (challenge.responseSubmittedAt.toDate ? 
                 challenge.responseSubmittedAt.toDate().toLocaleString() :
                 new Date(challenge.responseSubmittedAt).toLocaleString()) : 
                'Recently'}
            </Text>
            {challenge.responseType === 'video' && challenge.responseData && (
              <Text style={styles.submissionText}>
                🎬 Video: {challenge.responseData.duration || 'Unknown'}s • 
                {challenge.responseData.isPublic ? ' Public in Coliseum' : ' Private response'}
              </Text>
            )}
          </View>
        </View>
        
        {/* ✅ ENHANCED: Show video privacy controls if available */}
        {challenge.responseType === 'video' && (challenge.responseData || challenge.videoResponse) && (
          <MyVideoResponse
            challenge={challenge}
            myVideoResponse={{
              id: challenge.responseId || 'current',
              responseType: 'video',
              videoUrl: challenge.responseData?.videoUrl || challenge.videoResponse?.url,
              videoDuration: challenge.responseData?.duration || challenge.videoResponse?.duration,
              isPublic: challenge.responseData?.isPublic || challenge.videoResponse?.isPublic || false,
              createdAt: challenge.responseSubmittedAt || new Date(),
              status: 'pending',
              thumbnailUrl: challenge.responseData?.thumbnailUrl
            }}
            onTogglePrivacy={onVideoPrivacyToggle}
            isSubmitting={isSubmitting}
          />
        )}
      </View>
    );
  }

  // 🎯 TIE RESOLVED = Show refund details
  if (challenge.status === 'tie_resolved') {
    return (
      <View>
        <TieResolutionDisplay challenge={challenge} />
        <View style={styles.statusSection}>
          <Text style={[styles.statusTitle, { color: '#FFC107' }]}>
            🤝 CHALLENGE TIED
          </Text>
          <Text style={styles.statusText}>
            The community vote resulted in a tie. Both parties have received refunds after Atlas fees (2.5%).
          </Text>
        </View>
      </View>
    );
  }

  // 🎯 DISPUTED = Show dispute status
  if (challenge.status === 'disputed') {
    return (
      <View style={styles.statusSection}>
        <Text style={[styles.statusTitle, { color: '#FF9800' }]}>
          ⚖️ CHALLENGE DISPUTED
        </Text>
        <Text style={styles.statusText}>
          This challenge is under public review in the Coliseum. 
          The community will vote to resolve the dispute within 24 hours.
        </Text>
        <View style={styles.disputeInfo}>
          <Text style={styles.disputeInfoText}>
            📍 Check the Coliseum tab to see voting progress
          </Text>
        </View>
      </View>
    );
  }

  // 🎯 COMPLETED = Show completion celebration
  if (challenge.status === 'completed') {
    return (
      <View style={styles.completionSection}>
        <Text style={[styles.statusTitle, { color: '#4CAF50' }]}>
          🏆 CHALLENGE COMPLETED!
        </Text>
        <Text style={styles.statusText}>
          This challenge has been successfully completed!
        </Text>
        {challenge.wagerAmount > 0 && (
          <View style={styles.completionInfo}>
            <Text style={styles.completionInfoText}>
              💰 {(challenge.wagerAmount * 2 * 0.975).toFixed(2)} {challenge.wagerToken} was disbursed to the winner
            </Text>
            <Text style={styles.completionInfoText}>
              🏦 Atlas collected {(challenge.wagerAmount * 2 * 0.025).toFixed(3)} {challenge.wagerToken} fee
            </Text>
          </View>
        )}
      </View>
    );
  }

  // 🎯 DECLINED = Status display
  if (challenge.status === 'declined') {
    return (
      <View style={styles.statusSection}>
        <Text style={[styles.statusTitle, { color: '#f44336' }]}>
          ❌ CHALLENGE DECLINED
        </Text>
        <Text style={styles.statusText}>
          This challenge was declined.
        </Text>
        {challenge.wagerAmount > 0 && (
          <View style={styles.refundInfo}>
            <Text style={styles.refundInfoText}>
              💰 Deposits have been refunded to both parties
            </Text>
          </View>
        )}
      </View>
    );
  }

  // ✅ DEFAULT: Show current status with debug info
  return (
    <View style={styles.statusSection}>
      <Text style={styles.statusText}>
        📋 Status: {challenge.status?.toUpperCase() || 'UNKNOWN'}
      </Text>
      <Text style={styles.debugText}>
        Direction: {actualDirection} • 
        Challenge Direction: {challenge.direction || 'none'} • 
        From: {challenge.from?.slice(0, 8)}... • 
        To: {challenge.to?.slice(0, 8)}... • 
        User: {user.uid?.slice(0, 8)}... • 
        Response Type: {challenge.responseType || 'None'} • 
        Has Response: {challenge.hasResponse ? 'Yes' : 'No'} •
        Has Video Response: {challenge.hasVideoResponse ? 'Yes' : 'No'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statusSection: {
    backgroundColor: colors.background?.overlay || '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.ui?.border || '#444',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusText: {
    fontSize: 14,
    color: colors.text?.primary || '#fff',
    textAlign: 'center',
    lineHeight: 20,
  },
  debugText: {
    fontSize: 10,
    color: colors.text?.secondary || '#888',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'monospace',
  },

  // Approval header for video review
  approvalHeader: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF9800',
    marginBottom: 15,
  },

  // Video preview styles
  videoPreviewBox: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#2196F3',
    alignItems: 'center',
  },
  videoPreviewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  videoPreviewText: {
    fontSize: 12,
    color: colors.text?.primary || '#fff',
    textAlign: 'center',
    marginBottom: 2,
  },

  // Text preview styles
  textPreviewBox: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  textPreviewTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 6,
  },
  textPreviewText: {
    fontSize: 13,
    color: colors.text?.primary || '#fff',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Submission details
  submissionDetails: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  submissionText: {
    fontSize: 11,
    color: '#2196F3',
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: 'bold',
  },

  // Crypto info styles
  cryptoInfo: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#ff6b35',
  },
  cryptoInfoText: {
    fontSize: 12,
    color: '#ff6b35',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 4,
  },

  // Retry section styles
  retrySection: {
    backgroundColor: colors.background?.overlay || '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  retryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryFeedback: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  retryFeedbackTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 6,
  },
  retryFeedbackText: {
    fontSize: 14,
    color: colors.text?.primary || '#fff',
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // Completion section styles
  completionSection: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
    marginBottom: 20,
  },
  completionInfo: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  completionInfoText: {
    fontSize: 12,
    color: '#4CAF50',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 4,
  },

  // Refund info styles
  refundInfo: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  refundInfoText: {
    fontSize: 12,
    color: '#f44336',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  // Dispute info styles
  disputeInfo: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  disputeInfoText: {
    fontSize: 12,
    color: '#FF9800',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default ChallengeActionRenderer;