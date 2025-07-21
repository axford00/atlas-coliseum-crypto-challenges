// FILE: screens/ChallengeDetailScreen.js
// 🚀 COMPLETE: Enhanced with BindingContractModal integration + Fixed Wallet Flow

import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Modal,
  Text,
  TouchableOpacity,
  Alert
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { colors, globalStyles } from '../theme/colors';

// ✅ TEMPORARILY DISABLED: Solana imports causing crashes
// import solanaMobileWalletService from '../services/solana/solanaMobileWalletService';
import { useChallengeActions } from '../hooks_atlas/useChallengeActions';
import { useChallengeManagement } from '../hooks_atlas/useChallengeManagement';

// ✅ EXISTING COMPONENTS
import ChallengeInfo from '../components/challenge/ChallengeInfo';
import ChallengeActionRenderer from '../components/challenge/ChallengeActionRenderer';
import WalletSection from '../components/challenge/WalletSection';
import CryptoContractInfo from '../components/challenge/CryptoContractInfo';
import ChallengeStatusFooter from '../components/challenge/ChallengeStatusFooter';
// ✅ TEMPORARILY DISABLED: Wallet connector causing crashes
// import WalletConnector from '../components/crypto/WalletConnector';
import NegotiationModal from '../components/challenge/NegotiationModal';
import BindingContractModal from '../components/challenge/BindingContractModal';

// ✅ MOCK WALLET SERVICE FOR TESTING
const mockWalletService = {
  isConnected: () => false,
  getConnectedWallet: () => null,
  disconnect: () => Promise.resolve(),
  connectWallet: () => Promise.resolve({ 
    type: 'mock', 
    publicKey: { toString: () => 'MockWallet123' },
    balance: 0.5 
  })
};

const ChallengeDetailScreen = ({ route, navigation }) => {
  if (!route.params?.challenge) {
    console.error('ChallengeDetailScreen: No challenge data provided');
    navigation.goBack();
    return null;
  }

  const { challenge: initialChallenge, focusMode } = route.params;
  const auth = getAuth();
  const user = auth.currentUser;

  // ✅ STATE MANAGEMENT
  const [challenge, setChallenge] = useState(initialChallenge);
  const [responseText, setResponseText] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState(null);

  // ✅ FIXED: Enhanced hooks with proper wallet handler
  const {
    isSubmittingResponse,
    walletConnected: hookWalletConnected,
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
    handleWalletConnected: hookWalletHandler, // ✅ CRITICAL: Hook's wallet handler
    showWalletModal,
    setShowWalletModal,
    showNegotiationModal,
    setShowNegotiationModal,
    showBindingContractModal,
    setShowBindingContractModal
  } = useChallengeActions(challenge, setChallenge, responseText, setResponseText);

  const challengeManagement = useChallengeManagement();

  useEffect(() => {
    checkWalletConnection();
  }, []);

  // ✅ ENHANCED: Sync with hook wallet state
  useEffect(() => {
    if (hookWalletConnected !== walletConnected) {
      console.log('🔄 Syncing wallet state with hook:', hookWalletConnected);
      setWalletConnected(hookWalletConnected);
      if (hookWalletConnected) {
        // ✅ TEMPORARILY DISABLED: Use mock wallet
        // const wallet = solanaMobileWalletService.getConnectedWallet();
        const wallet = mockWalletService.getConnectedWallet();
        setConnectedWallet(wallet);
      }
    }
  }, [hookWalletConnected]);

  const checkWalletConnection = () => {
    // ✅ TEMPORARILY DISABLED: Use mock wallet service
    // const isConnected = solanaMobileWalletService.isConnected();
    // const wallet = solanaMobileWalletService.getConnectedWallet();
    const isConnected = mockWalletService.isConnected();
    const wallet = mockWalletService.getConnectedWallet();
    
    console.log('🔍 Checking wallet connection on load:', { isConnected, hasWallet: !!wallet });
    
    setWalletConnected(isConnected);
    setConnectedWallet(wallet);
  };

  const isExpired = () => {
    if (!challenge?.expiresAt) return false;
    const now = new Date();
    const expiry = challenge.expiresAt.toDate ? challenge.expiresAt.toDate() : new Date(challenge.expiresAt);
    return now > expiry;
  };

  // ✅ FIXED: Wallet connection handler that uses hook
  const handleWalletConnected = async (walletType) => {
    try {
      console.log(`🔌 [SCREEN] Wallet connection initiated for: ${walletType}`);
      setShowWalletModal(false);
      
      // ✅ CRITICAL FIX: Use the hook's handler which manages pending acceptance
      if (hookWalletHandler) {
        await hookWalletHandler(walletType);
      }
      
      // ✅ TEMPORARILY DISABLED: Use mock wallet
      // const wallet = solanaMobileWalletService.getConnectedWallet();
      const wallet = await mockWalletService.connectWallet();
      if (wallet) {
        console.log('✅ [SCREEN] Wallet connected:', {
          address: wallet.publicKey.toString().slice(0, 8) + '...',
          type: wallet.type,
          balance: wallet.balance
        });
        setWalletConnected(true);
        setConnectedWallet(wallet);
      }
      
    } catch (error) {
      console.error('❌ [SCREEN] Wallet connection error:', error);
      Alert.alert('Connection Failed', `Failed to connect ${walletType}: ${error.message}`);
      setWalletConnected(false);
      setConnectedWallet(null);
    }
  };

  // ✅ FIXED: Simplified accept challenge handler
  const handleAcceptChallenge = async () => {
    console.log('🚀 [SCREEN] Accept challenge button pressed');
    // ✅ SIMPLE FIX: Just call the hook - it handles wallet connection internally
    await acceptChallenge();
  };

  const handleDeclineChallenge = async () => {
    Alert.alert(
      'Decline Challenge',
      'Are you sure you want to decline this challenge?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Decline', 
          style: 'destructive',
          onPress: () => declineChallenge()
        }
      ]
    );
  };

  const handleSubmitResponse = () => {
    if (challenge.status === 'retry_requested') {
      console.log('🔄 Opening retry submission modal');
      setShowVideoModal(true);
    } else {
      console.log('📹 Opening video response modal');
      setShowVideoModal(true);
    }
  };

  // ✅ ENHANCED NEGOTIATION WORKFLOW HANDLERS
  const handleNegotiatePress = () => {
    console.log('🤝 Opening negotiation modal for counter-offer');
    setShowNegotiationModal(true);
  };

  const handleNegotiationSubmit = async (negotiationData) => {
    try {
      console.log('📝 Processing negotiation submission:', negotiationData);
      
      // Create counter-offer object
      const counterOffer = {
        challenge: negotiationData.challenge || challenge.challenge,
        wagerAmount: negotiationData.wagerAmount || challenge.wagerAmount,
        wagerToken: negotiationData.wagerToken || challenge.wagerToken,
        expiryDays: negotiationData.expiryDays || challenge.expiryDays || 7,
        note: negotiationData.note || '',
        from: user?.uid,
        fromName: user?.displayName || 'Unknown User',
        timestamp: new Date().toISOString(),
        counterOfferNumber: (challenge.negotiationHistory?.length || 0) + 1
      };

      // Update challenge with new negotiation state
      const updatedChallenge = {
        ...challenge,
        status: 'negotiating',
        negotiationStatus: 'pending_response',
        latestOffer: counterOffer,
        negotiationHistory: [
          ...(challenge.negotiationHistory || []),
          {
            type: 'Counter-Offer',
            details: counterOffer.challenge,
            wager: `$${counterOffer.wagerAmount} ${counterOffer.wagerToken}`,
            from: counterOffer.fromName,
            timestamp: counterOffer.timestamp,
            note: counterOffer.note,
            offerNumber: counterOffer.counterOfferNumber
          }
        ],
        lastActivity: new Date().toISOString()
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setChallenge(updatedChallenge);
      setShowNegotiationModal(false);
      
      Alert.alert(
        '🤝 Counter-Offer Sent!',
        'Your counter-offer has been sent. The other party will be notified to review and respond.',
        [{ text: 'Got it!', onPress: () => navigation.goBack() }]
      );
      
    } catch (error) {
      console.error('❌ Error submitting negotiation:', error);
      Alert.alert('Error', 'Failed to submit counter-offer. Please try again.');
    }
  };

  const handleAcceptCounterOffer = async () => {
    const termsToAccept = challenge.latestOffer || {
      challenge: challenge.challenge,
      wagerAmount: challenge.wagerAmount,
      wagerToken: challenge.wagerToken,
      expiryDays: challenge.expiryDays || 7
    };

    Alert.alert(
      '✅ Accept Counter-Offer',
      `Accept these negotiated terms and start the challenge?\n\n📋 ${termsToAccept.challenge}\n💰 $${termsToAccept.wagerAmount || 0} ${termsToAccept.wagerToken || 'USDC'}\n⏰ ${termsToAccept.expiryDays || 7} days to complete${termsToAccept.note ? `\n💬 "${termsToAccept.note}"` : ''}`,
      [
        { text: 'Review Again', style: 'cancel' },
        { 
          text: 'Accept & Start Challenge', 
          onPress: async () => {
            try {
              console.log('✅ Accepting counter-offer and starting challenge');
              
              // Update challenge with accepted terms
              const updatedChallenge = {
                ...challenge,
                status: 'accepted',
                negotiationStatus: 'accepted',
                finalTerms: termsToAccept,
                acceptedAt: new Date().toISOString(),
                // Apply the negotiated terms
                challenge: termsToAccept.challenge,
                wagerAmount: termsToAccept.wagerAmount || challenge.wagerAmount,
                wagerToken: termsToAccept.wagerToken || challenge.wagerToken,
                expiryDays: termsToAccept.expiryDays || 7,
                negotiationHistory: [
                  ...(challenge.negotiationHistory || []),
                  {
                    type: 'Accepted',
                    details: 'Counter-offer accepted - Challenge started!',
                    from: user?.displayName || 'User',
                    timestamp: new Date().toISOString(),
                    finalTerms: termsToAccept
                  }
                ]
              };
              
              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              setChallenge(updatedChallenge);
              
              Alert.alert(
                '🚀 Challenge Started!',
                'Counter-offer accepted! The challenge is now active and both parties have been notified.',
                [{ text: 'Let\'s Go!', onPress: () => navigation.goBack() }]
              );
              
            } catch (error) {
              console.error('❌ Error accepting counter-offer:', error);
              Alert.alert('Error', 'Failed to accept counter-offer');
            }
          }
        }
      ]
    );
  };

  const handleDeclineNegotiation = async () => {
    const isLatestOffer = challenge.latestOffer;
    const offerText = isLatestOffer ? 'counter-offer' : 'negotiation';
    
    Alert.alert(
      '❌ Decline Negotiation',
      `This will decline the ${offerText} and end the entire negotiation. The challenge will be cancelled. Are you sure?`,
      [
        { text: 'Keep Negotiating', style: 'cancel' },
        { 
          text: 'Decline & End', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('❌ Declining negotiation and ending challenge');
              
              const updatedChallenge = {
                ...challenge,
                status: 'declined',
                negotiationStatus: 'declined',
                declinedAt: new Date().toISOString(),
                declineReason: `${isLatestOffer ? 'Counter-offer' : 'Negotiation'} declined`,
                negotiationHistory: [
                  ...(challenge.negotiationHistory || []),
                  {
                    type: 'Declined',
                    details: `${isLatestOffer ? 'Counter-offer' : 'Negotiation'} declined - Challenge cancelled`,
                    from: user?.displayName || 'User',
                    timestamp: new Date().toISOString()
                  }
                ]
              };
              
              await new Promise(resolve => setTimeout(resolve, 1000));
              setChallenge(updatedChallenge);
              
              Alert.alert(
                'Negotiation Ended',
                'The challenge negotiation has been declined and the challenge cancelled.',
                [{ text: 'Done', onPress: () => navigation.goBack() }]
              );
              
            } catch (error) {
              console.error('❌ Error declining negotiation:', error);
              Alert.alert('Error', 'Failed to decline negotiation');
            }
          }
        }
      ]
    );
  };

  // ✅ ENHANCED NEGOTIATION HISTORY
  const handleViewNegotiationHistory = () => {
    const history = challenge.negotiationHistory || [];
    
    // If no history exists, create basic history
    if (history.length === 0) {
      const basicHistory = [
        {
          type: 'Initial Challenge',
          details: challenge.challenge,
          from: challenge.fromName || 'Challenger',
          timestamp: challenge.createdAt || new Date().toISOString(),
          wager: challenge.wagerAmount ? `$${challenge.wagerAmount} ${challenge.wagerToken}` : 'No wager'
        }
      ];
      
      if (challenge.status === 'negotiating') {
        basicHistory.push({
          type: 'Negotiation Started',
          details: 'Terms are being negotiated',
          from: challenge.direction === 'incoming' ? 'You' : challenge.toName || 'Participant',
          timestamp: new Date().toISOString()
        });
      }
      
      const historyText = basicHistory.map((entry, index) => 
        `${index + 1}. ${entry.type}\n   ${entry.details}\n   ${entry.wager || ''}\n   By: ${entry.from}\n   ${new Date(entry.timestamp).toLocaleDateString()}`
      ).join('\n\n');
      
      Alert.alert(
        '📜 Negotiation History',
        historyText,
        [{ text: 'Continue Negotiation', onPress: handleNegotiatePress }]
      );
      return;
    }

    // Display full negotiation history
    const historyText = history.map((entry, index) => {
      let displayText = `${index + 1}. ${entry.type}\n   ${entry.details}`;
      
      if (entry.wager) displayText += `\n   ${entry.wager}`;
      if (entry.from) displayText += `\n   By: ${entry.from}`;
      if (entry.timestamp) displayText += `\n   ${new Date(entry.timestamp).toLocaleDateString()}`;
      if (entry.note) displayText += `\n   Note: "${entry.note}"`;
      
      return displayText;
    }).join('\n\n');

    Alert.alert(
      '📜 Negotiation History',
      historyText || 'No negotiation history available.',
      [
        { text: 'Close' },
        { 
          text: 'Continue Negotiation', 
          onPress: handleNegotiatePress 
        }
      ]
    );
  };

  // ✅ ENHANCED NEGOTIATION ACTIONS RENDERER
  const renderNegotiationActions = () => {
    const isIncoming = challenge.direction === 'incoming';
    const currentUserId = user?.uid;
    const isMyTurnToRespond = challenge.latestOffer && challenge.latestOffer.from !== currentUserId;
    
    console.log('🤝 Rendering negotiation actions:', {
      status: challenge.status,
      negotiationStatus: challenge.negotiationStatus,
      isMyTurnToRespond,
      hasLatestOffer: !!challenge.latestOffer,
      latestOfferFrom: challenge.latestOffer?.from
    });
    
    // Show negotiation actions for all negotiating challenges
    if (challenge.status === 'negotiating' || 
        challenge.negotiationStatus === 'pending_response' ||
        challenge.negotiationStatus === 'counter_offer_received') {
      
      return (
        <View style={styles.negotiationActionsContainer}>
          <Text style={styles.negotiationTitle}>🤝 NEGOTIATION IN PROGRESS</Text>
          
          {/* Show original and latest terms comparison */}
          <View style={styles.termsComparisonContainer}>
            <View style={styles.originalTermsCard}>
              <Text style={styles.termsCardTitle}>📋 Original Challenge:</Text>
              <Text style={styles.termsCardDetails}>{challenge.challenge}</Text>
              {challenge.wagerAmount > 0 && (
                <Text style={styles.termsCardWager}>
                  💰 ${challenge.wagerAmount} {challenge.wagerToken || 'USDC'}
                </Text>
              )}
              <Text style={styles.termsCardExpiry}>
                ⏰ {challenge.expiryDays || 7} days to complete
              </Text>
            </View>

            {challenge.latestOffer && (
              <View style={styles.latestOfferCard}>
                <Text style={styles.termsCardTitle}>
                  🔄 Latest Counter-Offer (from {challenge.latestOffer.fromName || 'Other Party'}):
                </Text>
                <Text style={styles.termsCardDetails}>{challenge.latestOffer.challenge}</Text>
                <Text style={styles.termsCardWager}>
                  💰 ${challenge.latestOffer.wagerAmount} {challenge.latestOffer.wagerToken}
                </Text>
                <Text style={styles.termsCardExpiry}>
                  ⏰ {challenge.latestOffer.expiryDays} days to complete
                </Text>
                {challenge.latestOffer.note && (
                  <Text style={styles.termsCardNote}>
                    💬 "{challenge.latestOffer.note}"
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Action buttons based on negotiation state */}
          {isMyTurnToRespond ? (
            // It's my turn to respond to their offer
            <View style={styles.negotiationButtonContainer}>
              <Text style={styles.yourTurnText}>
                🎯 Your turn to respond to the counter-offer:
              </Text>
              
              <TouchableOpacity 
                style={styles.acceptOfferButton}
                onPress={handleAcceptCounterOffer}
              >
                <Text style={styles.acceptOfferText}>✅ Accept Counter-Offer</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.counterOfferButton}
                onPress={handleNegotiatePress}
              >
                <Text style={styles.counterOfferText}>🔄 Make Counter-Offer</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.declineOfferButton}
                onPress={handleDeclineNegotiation}
              >
                <Text style={styles.declineOfferText}>❌ Decline & End Negotiation</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Waiting for them to respond OR first negotiation
            <View style={styles.negotiationButtonContainer}>
              {challenge.latestOffer ? (
                <View style={styles.waitingContainer}>
                  <Text style={styles.waitingText}>
                    ⏳ Waiting for {challenge.latestOffer.fromName || 'other party'} to respond to your counter-offer...
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.yourTurnText}>
                    🎯 You can respond to this challenge:
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.acceptOfferButton}
                    onPress={handleAcceptChallenge}
                  >
                    <Text style={styles.acceptOfferText}>✅ Accept Original Terms</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.counterOfferButton}
                    onPress={handleNegotiatePress}
                  >
                    <Text style={styles.counterOfferText}>🔄 Make Counter-Offer</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.declineOfferButton}
                    onPress={handleDeclineNegotiation}
                  >
                    <Text style={styles.declineOfferText}>❌ Decline Challenge</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* Always show history button */}
          <TouchableOpacity 
            style={styles.viewHistoryButton}
            onPress={handleViewNegotiationHistory}
          >
            <Text style={styles.viewHistoryText}>
              📜 View Negotiation History ({(challenge.negotiationHistory?.length || 0) + 1} entries)
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  // ✅ ENHANCED RESPONSE APPROVAL HANDLERS
  const handleResponseApproval = async (approved) => {
    console.log('🏆 Processing response approval:', approved);
    await approveResponse(approved);
  };

  const handleRequestRetry = async (comment) => {
    console.log('🔄 Requesting retry with feedback:', comment);
    await requestRetry(comment);
  };

  const handleInitiateDispute = async (comment) => {
    console.log('⚖️ Initiating public dispute:', comment);
    await initiateDispute(comment);
  };

  const handleVideoPrivacyToggle = async (responseId) => {
    console.log('🔒 Toggling video privacy for:', responseId);
    Alert.alert('Privacy Updated!', 'Video privacy has been updated!');
  };

  const handleConnectWallet = () => {
    console.log('🔗 Opening wallet connection modal');
    setShowWalletModal(true);
  };

  const handleDisconnectWallet = async () => {
    try {
      console.log('🔌 Disconnecting wallet...');
      // ✅ TEMPORARILY DISABLED: Use mock wallet
      // solanaMobileWalletService.disconnect();
      await mockWalletService.disconnect();
      setWalletConnected(false);
      setConnectedWallet(null);
      Alert.alert('Wallet Disconnected', 'Your wallet has been disconnected.');
    } catch (error) {
      console.error('❌ Error disconnecting wallet:', error);
    }
  };

  const handleVideoSubmit = async (responseData) => {
    try {
      setShowVideoModal(false);
      
      if (challenge.status === 'retry_requested') {
        await resubmitAfterRetry(responseData);
      } else {
        await submitVideoResponse(responseData);
      }
      
    } catch (error) {
      console.error('❌ Error submitting video response:', error);
      Alert.alert('Error', 'Failed to submit video response');
    }
  };

  // ✅ GET MODAL TITLE BASED ON STATUS
  const getVideoModalTitle = () => {
    if (challenge.status === 'retry_requested') {
      return '🔄 Retry Challenge Response';
    }
    return '📹 Video Response';
  };

  const getVideoModalInstructions = () => {
    if (challenge.status === 'retry_requested') {
      return (
        <View>
          <Text style={styles.retryFeedback}>
            📝 Feedback from challenger: "{challenge.retryComment}"
          </Text>
          <Text style={styles.modalText}>
            🎬 Record an improved video addressing the feedback:
          </Text>
        </View>
      );
    }
    return (
      <Text style={styles.modalText}>
        🎬 Record yourself completing the challenge:
      </Text>
    );
  };

  // ✅ ENHANCED FOCUS CHECK FOR NEGOTIATION UI
  const shouldShowNegotiationFocus = () => {
    return focusMode === 'negotiation' || 
           challenge.status === 'negotiating' || 
           challenge.negotiationStatus === 'pending_response' ||
           challenge.negotiationStatus === 'counter_offer_received' ||
           (challenge.latestOffer && challenge.status !== 'accepted' && challenge.status !== 'declined');
  };

  return (
    <View style={styles.background}>
      <View style={styles.container}>
        <View style={globalStyles?.hudCorner1 || styles.fallbackCorner} />
        <View style={globalStyles?.hudCorner2 || styles.fallbackCorner} />
        <View style={globalStyles?.hudCorner3 || styles.fallbackCorner} />
        <View style={globalStyles?.hudCorner4 || styles.fallbackCorner} />

        {/* ✅ HEADER */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleTop}>
              {shouldShowNegotiationFocus() ? 'NEGOTIATION' : 'CHALLENGE'}
            </Text>
            <Text style={styles.titleBottom}>DETAILS</Text>
          </View>
          
          {walletConnected && (
            <View style={styles.walletStatusHeader}>
              <Text style={styles.walletStatusText}>
                🔗 {connectedWallet?.type?.toUpperCase() || 'WALLET'} Connected
              </Text>
              <TouchableOpacity 
                style={styles.disconnectButton}
                onPress={handleDisconnectWallet}
              >
                <Text style={styles.disconnectButtonText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <ChallengeInfo challenge={challenge} />
          
          {/* ✅ SHOW NEGOTIATION ACTIONS FIRST IF IN NEGOTIATION MODE */}
          {shouldShowNegotiationFocus() && renderNegotiationActions()}
          
          <WalletSection 
            challenge={challenge}
            walletConnected={walletConnected}
            onConnectWallet={handleConnectWallet}
          />
          
          <CryptoContractInfo challenge={challenge} />
          
          {/* ✅ ENHANCED ACTION RENDERER WITH ALL NEW HANDLERS */}
          {!shouldShowNegotiationFocus() && (
            <ChallengeActionRenderer
              challenge={challenge}
              user={user}
              onAccept={handleAcceptChallenge}
              onDecline={handleDeclineChallenge}
              onNegotiate={handleNegotiatePress}
              onSubmitResponse={handleSubmitResponse}
              onResponseApproval={handleResponseApproval}
              onRequestRetry={handleRequestRetry}
              onInitiateDispute={handleInitiateDispute}
              onVideoPrivacyToggle={handleVideoPrivacyToggle}
              isSubmitting={isSubmittingResponse}
              isExpired={isExpired()}
            />
          )}
          
          <ChallengeStatusFooter challenge={challenge} />
        </ScrollView>

        {/* ✅ MODALS */}
        {/* ✅ TEMPORARILY DISABLED: WalletConnector modal 
        <WalletConnector
          visible={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          onWalletConnected={handleWalletConnected}
        />
        */}

        {/* ✅ SIMPLE MOCK WALLET MODAL */}
        {showWalletModal && (
          <Modal
            visible={showWalletModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowWalletModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>🔗 Connect Wallet (Demo Mode)</Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setShowWalletModal(false)}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalContent}>
                  <Text style={styles.modalText}>
                    ⚠️ Solana integration temporarily disabled for testing.
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.recordButton}
                    onPress={() => handleWalletConnected('mock-wallet')}
                  >
                    <Text style={styles.recordButtonText}>📱 Connect Mock Wallet</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        <NegotiationModal
          visible={showNegotiationModal}
          challenge={challenge}
          onClose={() => setShowNegotiationModal(false)}
          onSubmit={handleNegotiationSubmit}
        />

        <BindingContractModal
          visible={showBindingContractModal}
          challenge={challenge}
          escrowResult={challenge.escrowData}
          onClose={() => setShowBindingContractModal(false)}
        />

        {/* ✅ ENHANCED VIDEO MODAL */}
        {showVideoModal && (
          <Modal
            visible={showVideoModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowVideoModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{getVideoModalTitle()}</Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setShowVideoModal(false)}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalContent}>
                  {getVideoModalInstructions()}
                  
                  <Text style={styles.challengeText}>
                    📋 {challenge.latestOffer?.challenge || challenge.challenge}
                  </Text>
                  
                  {(challenge.latestOffer?.wagerAmount || challenge.wagerAmount) > 0 && (
                    <Text style={styles.cryptoText}>
                      💰 Stakes: {challenge.latestOffer?.wagerAmount || challenge.wagerAmount} {challenge.latestOffer?.wagerToken || challenge.wagerToken}
                    </Text>
                  )}
                  
                  <TouchableOpacity 
                    style={styles.recordButton}
                    onPress={() => {
                      const mockVideoResponse = {
                        type: 'video',
                        uri: `mock_video_${Date.now()}.mp4`,
                        duration: Math.floor(Math.random() * 10) + 3,
                        fileSize: Math.floor(Math.random() * 1000000) + 500000,
                        isPublic: false,
                        timestamp: new Date().toISOString(),
                        thumbnail: 'mock_thumbnail_url'
                      };
                      handleVideoSubmit(mockVideoResponse);
                    }}
                  >
                    <Text style={styles.recordButtonText}>🎥 Record Video Proof</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.textResponseButton}
                    onPress={() => {
                      setShowVideoModal(false);
                      submitTextResponse();
                    }}
                  >
                    <Text style={styles.textResponseButtonText}>📝 Submit Text Response Instead</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  titleTop: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.secondary,
    letterSpacing: 3,
    marginBottom: -5,
  },
  titleBottom: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    letterSpacing: 2,
  },
  
  walletStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.overlay,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 10,
  },
  walletStatusText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  disconnectButton: {
    backgroundColor: colors.ui.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  disconnectButtonText: {
    color: colors.text.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  fallbackCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: 'transparent',
  },

  // ✅ ENHANCED NEGOTIATION ACTIONS STYLES
  negotiationActionsContainer: {
    backgroundColor: colors.background.overlay,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.accent || '#00cec9',
  },
  negotiationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.accent || '#00cec9',
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 1,
  },

  // ✅ ENHANCED TERMS COMPARISON
  termsComparisonContainer: {
    marginBottom: 20,
  },
  originalTermsCard: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  latestOfferCard: {
    backgroundColor: 'rgba(0, 206, 201, 0.1)',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.accent || '#00cec9',
  },
  termsCardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  termsCardDetails: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  termsCardWager: {
    fontSize: 14,
    color: '#ff6b35',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  termsCardExpiry: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 6,
  },
  termsCardNote: {
    fontSize: 11,
    color: colors.accent || '#00cec9',
    fontStyle: 'italic',
    marginTop: 4,
  },

  // ✅ ENHANCED ACTION BUTTONS
  negotiationButtonContainer: {
    gap: 12,
    marginBottom: 15,
  },
  yourTurnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  acceptOfferButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  acceptOfferText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  counterOfferButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  counterOfferText: {
    color: colors.background.dark,
    fontSize: 16,
    fontWeight: 'bold',
  },
  declineOfferButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ff4444',
  },
  declineOfferText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // ✅ WAITING STATE
  waitingContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  waitingText: {
    fontSize: 14,
    color: '#FFC107',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  viewHistoryButton: {
    backgroundColor: colors.ui.inputBg,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.ui.border,
    alignItems: 'center',
    marginTop: 10,
  },
  viewHistoryText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // ✅ MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.background.dark,
    borderRadius: 16,
    padding: 0,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.ui.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 15,
  },
  retryFeedback: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    padding: 12,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  challengeText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  cryptoText: {
    fontSize: 16,
    color: '#ff6b35',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  recordButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  recordButtonText: {
    color: colors.background.dark,
    fontSize: 16,
    fontWeight: 'bold',
  },
  textResponseButton: {
    backgroundColor: colors.ui.inputBg,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.ui.border,
    width: '100%',
    alignItems: 'center',
  },
  textResponseButtonText: {
    color: colors.text.primary,
    fontSize: 14,
  },
});

export default ChallengeDetailScreen;