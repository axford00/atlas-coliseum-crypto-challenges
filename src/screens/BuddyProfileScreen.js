// screens/BuddyProfileScreen.js - CORRECTED: Fixed challenge data loading for crypto challenges
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { colors, globalStyles } from '../theme/colors';

// ✅ CRITICAL ADDITION: Firebase imports for full challenge data loading
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

// Existing Components (keep using these!)
import ProfileHeader from '../components/buddies/ProfileHeader';
import QuickActions from '../components/buddies/QuickActions';
import ChatLog from '../components/buddies/ChatLog';
import RecentActivity from '../components/buddies/RecentActivity';
import MessageModal from '../components/buddies/MessageModal';
import ChallengeModal from '../components/buddies/ChallengeModal'; // For creating challenges only

// Your existing challenge components (the ones you shared)
import ChallengeInfo from '../components/challenge/ChallengeInfo';
import PendingActions from '../components/challenge/PendingActions';
import ResponseActions from '../components/challenge/ResponseActions';
import ResponseApproval from '../components/challenge/ResponseApproval';
import MyVideoResponse from '../components/challenge/MyVideoResponse';
import NegotiationModal from '../components/challenge/NegotiationModal';

// New Custom Hooks
import { useBuddyProfile } from '../hooks_atlas/useBuddyProfile';
import { useRealTimeMessages } from '../hooks_atlas/useRealTimeMessages';
import { useChallengeManagement } from '../hooks_atlas/useChallengeManagement';

const BuddyProfileScreen = ({ route, navigation }) => {
  const { buddy } = route.params;
  
  // Custom hooks handle all the heavy lifting
  const { 
    buddyProfile, 
    loading, 
    challenges, 
    setChallenges, 
    error, 
    refreshData 
  } = useBuddyProfile(buddy);
  
  const { 
    chatMessages, 
    loading: messagesLoading 
  } = useRealTimeMessages(buddy);
  
  const {
    sendingMessage,
    updatingChallenge,
    sendQuickMessage,
    sendChallenge,
    acceptChallenge,
    negotiateChallenge,
    rejectChallenge
  } = useChallengeManagement(buddy, setChallenges);

  // Modal state
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showQuickMessageModal, setShowQuickMessageModal] = useState(false);
  const [showChallengeCreationModal, setShowChallengeCreationModal] = useState(false);
  const [showChallengeDetailsModal, setShowChallengeDetailsModal] = useState(false);
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  
  // Response state for your existing components
  const [responseText, setResponseText] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Utility functions
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const calculateTimeRemaining = (createdAt, expiryDays = 7) => {
    const created = new Date(createdAt);
    const expiry = new Date(created.getTime() + (expiryDays * 24 * 60 * 60 * 1000));
    const now = new Date();
    const remaining = expiry.getTime() - now.getTime();
    
    if (remaining <= 0) return 'EXPIRED';
    
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} left`;
    return 'Expires soon';
  };

  // ✅ CRITICAL FIX: Enhanced challenge press handler with full data loading
  const handleChallengePress = async (challenge) => {
    console.log('🏆 Challenge clicked:', challenge.id, challenge.challenge);
    
    // ✅ FIXED: Load full challenge data with escrow info for crypto challenges
    if (challenge.wagerAmount > 0) {
      console.log('💰 Loading full crypto challenge data for escrow bridge...');
      
      try {
        // Fetch complete challenge document from Firebase including escrowData
        const challengeRef = doc(db, 'challenges', challenge.id);
        const challengeDoc = await getDoc(challengeRef);
        
        if (challengeDoc.exists()) {
          const fullChallengeData = {
            id: challengeDoc.id,
            ...challengeDoc.data()
          };
          
          console.log('✅ Full challenge data loaded:', {
            id: fullChallengeData.id,
            hasEscrowData: !!fullChallengeData.escrowData,
            hasEscrowAccount: !!fullChallengeData.escrowAccount,
            wagerAmount: fullChallengeData.wagerAmount,
            status: fullChallengeData.status
          });
          
          // Navigate to ChallengeDetail with complete data including escrowData
          navigation.navigate('ChallengeDetail', { challenge: fullChallengeData });
        } else {
          console.error('❌ Challenge document not found');
          Alert.alert('Error', 'Challenge not found');
        }
        
      } catch (error) {
        console.error('❌ Error loading full challenge data:', error);
        Alert.alert('Error', 'Failed to load challenge details');
      }
    } else {
      // Regular challenge - use existing data (no escrow needed)
      navigation.navigate('ChallengeDetail', { challenge });
    }
  };

  // ✅ ALTERNATIVE: Enhanced modal handler for in-screen challenge details
  const handleChallengeModalPress = async (challenge) => {
    console.log('🏆 Challenge modal clicked:', challenge.id, challenge.challenge);
    
    // Load full challenge data for crypto challenges
    if (challenge.wagerAmount > 0) {
      console.log('💰 Loading full crypto challenge data...');
      
      try {
        const challengeRef = doc(db, 'challenges', challenge.id);
        const challengeDoc = await getDoc(challengeRef);
        
        if (challengeDoc.exists()) {
          const fullChallengeData = {
            id: challengeDoc.id,
            ...challengeDoc.data()
          };
          
          console.log('✅ Full challenge data loaded for modal:', {
            id: fullChallengeData.id,
            hasEscrowData: !!fullChallengeData.escrowData,
            hasEscrowAccount: !!fullChallengeData.escrowAccount
          });
          
          setSelectedChallenge(fullChallengeData);
          setShowChallengeDetailsModal(true);
        } else {
          Alert.alert('Error', 'Challenge not found');
        }
        
      } catch (error) {
        console.error('❌ Error loading challenge for modal:', error);
        Alert.alert('Error', 'Failed to load challenge details');
      }
    } else {
      // Regular challenge
      setSelectedChallenge(challenge);
      setShowChallengeDetailsModal(true);
    }
  };

  // Handle challenge creation from ChallengeModal
  const handleSendChallenge = async (challengeText, challengeReward, cryptoWager) => {
    console.log('🚀 Sending challenge:', { challengeText, challengeReward, cryptoWager });
    
    const success = await sendChallenge(challengeText, challengeReward, cryptoWager);
    
    if (success) {
      setShowChallengeCreationModal(false);
    }
  };

  // Handle message sending
  const handleSendMessage = async (messageType, messageText) => {
    await sendQuickMessage(messageType, messageText);
    setShowQuickMessageModal(false);
  };

  // Challenge response handlers using your existing components
  const handleNegotiatePress = () => {
    setShowChallengeDetailsModal(false);
    setShowNegotiationModal(true);
  };

  const handleSubmitNegotiation = async (negotiationData) => {
    try {
      await negotiateChallenge(selectedChallenge, negotiationData);
      setShowNegotiationModal(false);
      setSelectedChallenge(null);
    } catch (error) {
      console.error('Error submitting negotiation:', error);
    }
  };

  const handleVideoResponseToggle = async (responseId) => {
    console.log('Toggling privacy for response:', responseId);
    // Implement privacy toggle logic
  };

  const handleShowVideoModal = () => {
    console.log('Show video recording modal');
    // Integrate with your existing video recording flow
  };

  const handleSubmitTextResponse = async () => {
    if (!responseText.trim()) return;
    
    try {
      console.log('Submitting text response:', responseText);
      setResponseText('');
    } catch (error) {
      console.error('Error submitting text response:', error);
    }
  };

  const handleApproveResponse = async (approved) => {
    try {
      console.log('Challenge approval:', approved);
      // Implement approval logic
    } catch (error) {
      console.error('Error approving response:', error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.background}>
        <View style={styles.container}>
          <View style={globalStyles.hudCorner1} />
          <View style={globalStyles.hudCorner2} />
          <View style={globalStyles.hudCorner3} />
          <View style={globalStyles.hudCorner4} />
          
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading buddy profile...</Text>
          </View>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.background}>
        <View style={styles.container}>
          <View style={globalStyles.hudCorner1} />
          <View style={globalStyles.hudCorner2} />
          <View style={globalStyles.hudCorner3} />
          <View style={globalStyles.hudCorner4} />
          
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <TouchableOpacity onPress={refreshData} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.background}>
      <View style={styles.container}>
        <View style={globalStyles.hudCorner1} />
        <View style={globalStyles.hudCorner2} />
        <View style={globalStyles.hudCorner3} />
        <View style={globalStyles.hudCorner4} />

        <ScrollView style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.titleTop}>BUDDY</Text>
              <Text style={styles.titleBottom}>PROFILE</Text>
            </View>
          </View>

          {/* Existing Modular Components */}
          <ProfileHeader 
            buddyProfile={buddyProfile} 
            buddy={buddy} 
          />

          <QuickActions
            onSendMessage={() => setShowQuickMessageModal(true)}
            onSendChallenge={() => setShowChallengeCreationModal(true)}
            sendingMessage={sendingMessage}
          />

          <ChatLog
            chatMessages={chatMessages}
            buddyName={buddy.name}
            formatMessageTime={formatMessageTime}
            loading={messagesLoading}
          />

          {/* Enhanced Challenge History with Response Support */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Challenge History</Text>
            {challenges.length > 0 ? (
              challenges.map((challenge) => (
                <TouchableOpacity
                  key={challenge.id}
                  style={[
                    styles.challengeCard,
                    challenge.direction === 'from_buddy' && challenge.status === 'pending' && styles.pendingChallengeCard,
                    challenge.wagerAmount > 0 && styles.cryptoChallengeCard,
                    challenge.status === 'expired' && styles.expiredChallengeCard
                  ]}
                  onPress={() => handleChallengePress(challenge)}
                >
                  <View style={styles.challengeHeader}>
                    <Text style={styles.challengeTitle}>
                      {challenge.wagerAmount > 0 && '💰 '}
                      {challenge.direction === 'from_buddy' ? 'FROM' : 'TO'} {buddy.name}
                    </Text>
                    <Text style={styles.challengeDate}>{formatDate(challenge.createdAt)}</Text>
                  </View>
                  
                  <Text style={styles.challengeText}>{challenge.challenge}</Text>
                  
                  <View style={styles.challengeFooter}>
                    <Text style={[styles.challengeStatus, { 
                      color: challenge.status === 'completed' ? '#4CAF50' : 
                            challenge.status === 'accepted' ? colors.primary : 
                            challenge.status === 'declined' ? '#f44336' : 
                            challenge.status === 'expired' ? '#FF6B6B' :
                            colors.text.secondary 
                    }]}>
                      {challenge.status.toUpperCase()}
                    </Text>
                    
                    {/* Enhanced Crypto Indicator */}
                    {challenge.wagerAmount > 0 && (
                      <Text style={styles.cryptoIndicator}>
                        💰 ${challenge.wagerAmount} {challenge.wagerToken}
                      </Text>
                    )}
                    
                    {challenge.status === 'pending' && (
                      <Text style={styles.timeRemaining}>
                        ⏰ {calculateTimeRemaining(challenge.createdAt, challenge.expiryDays || 7)}
                      </Text>
                    )}
                  </View>
                  
                  {challenge.direction === 'from_buddy' && challenge.status === 'pending' && (
                    <Text style={[
                      styles.actionPrompt,
                      challenge.wagerAmount > 0 && styles.cryptoActionPrompt
                    ]}>
                      👆 {challenge.wagerAmount > 0 ? 
                        'Tap to respond to crypto challenge - wallet required!' : 
                        'Tap to accept, negotiate, or decline this challenge'}
                    </Text>
                  )}
                  
                  {challenge.direction === 'to_buddy' && challenge.status === 'pending' && (
                    <Text style={styles.waitingPrompt}>
                      ⏳ Waiting for {buddy.name} to respond...
                    </Text>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No challenges yet with {buddy.name}</Text>
                <Text style={styles.emptyStateSubtext}>Create a challenge to get started!</Text>
              </View>
            )}
          </View>

          <RecentActivity
            buddyProfile={buddyProfile}
            formatDate={formatDate}
          />
        </ScrollView>

        {/* Challenge Creation Modal - Your existing ChallengeModal */}
        <ChallengeModal
          visible={showChallengeCreationModal}
          buddy={buddy}
          onClose={() => setShowChallengeCreationModal(false)}
          onSend={handleSendChallenge}
          isLoading={sendingMessage}
        />

        {/* Challenge Details Modal - Using YOUR existing components! */}
        <Modal
          visible={showChallengeDetailsModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => {
            setShowChallengeDetailsModal(false);
            setSelectedChallenge(null);
          }}
        >
          <KeyboardAvoidingView 
            style={styles.modalContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚡ Challenge Details</Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowChallengeDetailsModal(false);
                  setSelectedChallenge(null);
                }}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {selectedChallenge && (
                <>
                  <ChallengeInfo challenge={selectedChallenge} />
                  
                  <PendingActions
                    challenge={selectedChallenge}
                    onAccept={() => acceptChallenge(selectedChallenge)}
                    onDecline={() => rejectChallenge(selectedChallenge)}
                    onNegotiate={handleNegotiatePress}
                    isSubmitting={updatingChallenge}
                    isExpired={calculateTimeRemaining(selectedChallenge.createdAt) === 'EXPIRED'}
                  />
                  
                  <ResponseActions
                    challenge={selectedChallenge}
                    responseText={responseText}
                    setResponseText={setResponseText}
                    onSubmitText={handleSubmitTextResponse}
                    onShowVideoModal={handleShowVideoModal}
                    isSubmitting={updatingChallenge}
                    uploadProgress={uploadProgress}
                  />
                  
                  <ResponseApproval
                    challenge={selectedChallenge}
                    challengeResponse={null} // You'll need to load this from your hooks
                    onApprove={handleApproveResponse}
                    isSubmitting={updatingChallenge}
                  />
                  
                  <MyVideoResponse
                    challenge={selectedChallenge}
                    myVideoResponse={null} // You'll need to load this from your hooks
                    onTogglePrivacy={handleVideoResponseToggle}
                    isSubmitting={updatingChallenge}
                  />
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>

        {/* Negotiation Modal - Your existing component! */}
        <NegotiationModal
          visible={showNegotiationModal}
          onClose={() => {
            setShowNegotiationModal(false);
          }}
          originalChallenge={selectedChallenge}
          onSendNegotiation={handleSubmitNegotiation}
        />

        {/* Message Modal */}
        <MessageModal
          visible={showQuickMessageModal}
          buddy={buddy}
          onClose={() => setShowQuickMessageModal(false)}
          onSend={handleSendMessage}
        />
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
  },
  
  // Header Layout
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  titleTop: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  titleBottom: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: -2,
  },
  
  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 16,
  },
  
  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#f44336',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  retryButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Section styles
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 15,
  },

  // Enhanced Challenge Card Styles
  challengeCard: {
    backgroundColor: colors.background.overlay,
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  pendingChallengeCard: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.ui.cardBg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cryptoChallengeCard: {
    borderWidth: 2,
    borderColor: '#ff6b35',
    backgroundColor: '#2a1f1a',
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  expiredChallengeCard: {
    borderWidth: 2,
    borderColor: '#FF6B6B',
    backgroundColor: '#2a1a1a',
    opacity: 0.7,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  challengeTitle: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  challengeDate: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  challengeText: {
    color: colors.text.primary,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 15,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  challengeStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cryptoIndicator: {
    color: '#ff6b35',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#3a2520',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeRemaining: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionPrompt: {
    color: colors.primary,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.ui.border,
  },
  cryptoActionPrompt: {
    color: '#ff6b35',
    fontWeight: 'bold',
    borderTopColor: '#ff6b35',
  },
  waitingPrompt: {
    color: colors.text.secondary,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.ui.border,
  },

  // Enhanced Empty state
  emptyState: {
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  emptyStateText: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
  emptyStateSubtext: {
    color: colors.text.secondary,
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.ui.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
});

export default BuddyProfileScreen;