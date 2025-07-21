// screens/BuddiesScreen.js - Fully Corrected with Debug Button Removed
import { getAuth } from 'firebase/auth';
import { addDoc, collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../../firebase';
import BuddyCard from '../components/buddies/BuddyCard';
import BuddyRequestCard from '../components/buddies/BuddyRequestCard';
import BuddyStatsSection from '../components/buddies/BuddyStatsSection';
import ChallengeModal from '../components/buddies/ChallengeModal';
import MessageModal from '../components/buddies/MessageModal';
import FalloutButton from '../components/ui/FalloutButton';
import {
  sendBuddyRequestNotification,
  sendBuddyRequestResponseNotification,
  sendChallengeNotification,
  sendEncouragementNotification
} from '../services/buddyNotificationService';
import { colors, globalStyles } from '../theme/colors';
import { findAtlasUsers, generateDemoUsers, requestContactsPermission, scanUserContacts } from '../utils/contactScanner';

const BuddiesScreen = ({ route, navigation }) => {
  const { autoScan, selectedBuddy, openChallenge, openMessage } = route.params || {};
  
  // Data state
  const [contacts, setContacts] = useState([]);
  const [suggestedBuddies, setSuggestedBuddies] = useState([]);
  const [confirmedBuddies, setConfirmedBuddies] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  
  // Modal states
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showBuddyRequestModal, setShowBuddyRequestModal] = useState(false);
  
  // Selected items
  const [selectedBuddyState, setSelectedBuddyState] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    loadAllBuddyData();
    
    // Handle auto-actions from navigation params
    if (autoScan) {
      setTimeout(() => scanContacts(), 500);
    }
    
    if (selectedBuddy && openChallenge) {
      setSelectedBuddyState(selectedBuddy);
      setTimeout(() => setShowChallengeModal(true), 500);
    }
    
    if (selectedBuddy && openMessage) {
      setSelectedBuddyState(selectedBuddy);
      setTimeout(() => setShowMessageModal(true), 500);
    }
  }, [autoScan, selectedBuddy, openChallenge, openMessage]);

  // Alphabetical sorting function
  const sortBuddiesAlphabetically = (buddies) => {
    return buddies.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

  const loadAllBuddyData = async () => {
    await Promise.all([
      loadConfirmedBuddies(),
      loadPendingRequests(),
      loadIncomingRequests()
    ]);
  };

  const loadConfirmedBuddies = async () => {
    if (!user) return;

    try {
      console.log('🔍 Loading confirmed buddies for user:', user.uid);
      
      // Load from current user's confirmed buddies
      const buddiesRef = collection(db, 'users', user.uid, 'confirmed_buddies');
      const buddiesSnapshot = await getDocs(buddiesRef);
      
      const buddiesList = [];
      buddiesSnapshot.forEach(doc => {
        buddiesList.push({ id: doc.id, ...doc.data() });
      });

      // Also load from accepted buddy requests where current user is involved
      const requestsRef = collection(db, 'buddy_requests');
      
      const acceptedFromQuery = query(
        requestsRef,
        where('fromUserId', '==', user.uid),
        where('status', '==', 'accepted')
      );
      
      const acceptedToQuery = query(
        requestsRef,
        where('toUserId', '==', user.uid),
        where('status', '==', 'accepted')
      );
      
      const [acceptedFromSnapshot, acceptedToSnapshot] = await Promise.all([
        getDocs(acceptedFromQuery),
        getDocs(acceptedToQuery)
      ]);
      
      // Process accepted requests
      acceptedFromSnapshot.forEach(doc => {
        const request = doc.data();
        if (!buddiesList.find(b => b.buddyUserId === request.toUserId)) {
          buddiesList.push({
            id: doc.id,
            buddyUserId: request.toUserId,
            name: request.toUserName,
            email: request.toUserEmail,
            addedAt: request.respondedAt || request.createdAt,
            status: 'confirmed',
            matchedBy: 'buddy_request'
          });
        }
      });
      
      acceptedToSnapshot.forEach(doc => {
        const request = doc.data();
        if (!buddiesList.find(b => b.buddyUserId === request.fromUserId)) {
          buddiesList.push({
            id: doc.id,
            buddyUserId: request.fromUserId,
            name: request.fromUserName,
            email: request.fromUserEmail,
            addedAt: request.respondedAt || request.createdAt,
            status: 'confirmed',
            matchedBy: 'buddy_request'
          });
        }
      });
      
      // Sort alphabetically before setting state
      const sortedBuddies = sortBuddiesAlphabetically(buddiesList);
      setConfirmedBuddies(sortedBuddies);
      console.log(`✅ Loaded ${sortedBuddies.length} confirmed buddies total (sorted alphabetically)`);
    } catch (error) {
      console.error('❌ Error loading confirmed buddies:', error);
    }
  };

  const loadPendingRequests = async () => {
    if (!user) return;

    try {
      const requestsRef = collection(db, 'buddy_requests');
      const outgoingQuery = query(
        requestsRef, 
        where('fromUserId', '==', user.uid),
        where('status', '==', 'pending')
      );
      
      const outgoingSnapshot = await getDocs(outgoingQuery);
      const pendingList = [];
      
      outgoingSnapshot.forEach(doc => {
        pendingList.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort alphabetically
      const sortedPending = sortBuddiesAlphabetically(pendingList.map(p => ({ ...p, name: p.toUserName })));
      setPendingRequests(sortedPending);
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  const loadIncomingRequests = async () => {
    if (!user) return;

    try {
      const requestsRef = collection(db, 'buddy_requests');
      const incomingQuery = query(
        requestsRef,
        where('toUserId', '==', user.uid),
        where('status', '==', 'pending')
      );
      
      const incomingSnapshot = await getDocs(incomingQuery);
      const incomingList = [];
      
      incomingSnapshot.forEach(doc => {
        incomingList.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort alphabetically
      const sortedIncoming = sortBuddiesAlphabetically(incomingList.map(i => ({ ...i, name: i.fromUserName })));
      setIncomingRequests(sortedIncoming);
    } catch (error) {
      console.error('Error loading incoming requests:', error);
    }
  };

  const scanContacts = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in first');
      return;
    }

    setScanning(true);
    try {
      const permission = await requestContactsPermission();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required', 
          'We need access to your contacts to find workout buddies.'
        );
        return;
      }

      const contactResult = await scanUserContacts();
      if (!contactResult.success) {
        throw new Error(contactResult.error);
      }

      setContacts(contactResult.contacts);
      const atlasResult = await findAtlasUsers(contactResult.contacts, user.email);
      
      if (atlasResult.success && atlasResult.users.length > 0) {
        setSuggestedBuddies(atlasResult.users);
        setShowSuggestionsModal(true);
      } else {
        const demoResult = generateDemoUsers(contactResult.contacts);
        if (demoResult.users.length > 0) {
          setSuggestedBuddies(demoResult.users);
          setShowSuggestionsModal(true);
        } else {
          Alert.alert('No Buddies Found', 'None of your contacts appear to be using Atlas Fitness yet.');
        }
      }
    } catch (error) {
      console.error('Error scanning contacts:', error);
      Alert.alert('Error', `Failed to scan contacts: ${error.message}`);
    } finally {
      setScanning(false);
    }
  };

  const sendBuddyRequest = async (suggestedBuddy) => {
    if (!user) return;

    try {
      setLoading(true);

      const requestData = {
        fromUserId: user.uid,
        fromUserName: user.displayName || user.email.split('@')[0],
        fromUserEmail: user.email,
        toUserId: suggestedBuddy.id,
        toUserName: suggestedBuddy.displayName || suggestedBuddy.contactInfo.name,
        toUserEmail: suggestedBuddy.email,
        status: 'pending',
        createdAt: new Date().toISOString(),
        requestType: 'buddy_request'
      };

      await addDoc(collection(db, 'buddy_requests'), requestData);
      await sendBuddyRequestNotification(suggestedBuddy.id, requestData.fromUserName);

      setSuggestedBuddies(prev => prev.filter(b => b.id !== suggestedBuddy.id));
      setPendingRequests(prev => [...prev, { ...suggestedBuddy, status: 'pending' }]);

      Alert.alert(
        'Request Sent!',
        `Buddy request sent to ${suggestedBuddy.contactInfo.name}. They'll receive a notification!`
      );
    } catch (error) {
      console.error('Error sending buddy request:', error);
      Alert.alert('Error', 'Failed to send buddy request');
    } finally {
      setLoading(false);
    }
  };

  const respondToBuddyRequest = async (request, accept) => {
    if (!user || !request) return;

    try {
      setLoading(true);
      
      const requestRef = doc(db, 'buddy_requests', request.id);
      
      if (accept) {
        await updateDoc(requestRef, {
          status: 'accepted',
          respondedAt: new Date().toISOString()
        });

        const buddyData = {
          buddyUserId: request.fromUserId,
          name: request.fromUserName,
          email: request.fromUserEmail,
          addedAt: new Date().toISOString(),
          status: 'confirmed',
          matchedBy: 'buddy_request'
        };

        const userBuddiesRef = collection(db, 'users', user.uid, 'confirmed_buddies');
        await addDoc(userBuddiesRef, buddyData);

        await sendBuddyRequestResponseNotification(
          request.fromUserId,
          user.displayName || user.email.split('@')[0],
          true
        );

        setConfirmedBuddies(prev => sortBuddiesAlphabetically([...prev, buddyData]));
        setIncomingRequests(prev => prev.filter(r => r.id !== request.id));

        Alert.alert('Buddy Added! 🎉', `${request.fromUserName} is now your workout buddy!`);
      } else {
        await updateDoc(requestRef, {
          status: 'declined',
          respondedAt: new Date().toISOString()
        });

        await sendBuddyRequestResponseNotification(
          request.fromUserId,
          user.displayName || user.email.split('@')[0],
          false
        );

        setIncomingRequests(prev => prev.filter(r => r.id !== request.id));
        Alert.alert('Request Declined', 'The buddy request has been declined.');
      }

      setShowBuddyRequestModal(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error responding to buddy request:', error);
      Alert.alert('Error', `Failed to respond to buddy request: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 ENHANCED CHALLENGE CREATION WITH CRYPTO SUPPORT
  const handleSendChallenge = async (challengeText, challengeReward, cryptoWager = null) => {
    if (!challengeText.trim() || !selectedBuddyState) {
      Alert.alert('Error', 'Please enter a challenge description');
      return;
    }

    if (!user) {
      console.error('❌ No authenticated user for challenge creation');
      Alert.alert('Error', 'Please log in to send challenges');
      return;
    }

    const buddyId = selectedBuddyState.buddyUserId || selectedBuddyState.id;
    const buddyName = selectedBuddyState.name || selectedBuddyState.displayName;

    if (!buddyId) {
      console.error('❌ No valid buddy ID found:', selectedBuddyState);
      Alert.alert('Error', 'Invalid buddy selected');
      return;
    }

    console.log('🚀 Starting challenge creation...');
    console.log('👤 From user:', { uid: user.uid, email: user.email });
    console.log('🎯 To buddy:', { id: buddyId, name: buddyName });
    console.log('💰 Crypto wager:', cryptoWager);

    try {
      setLoading(true);

      // Build challenge data matching Firebase rules exactly
      const challengeData = {
        // ✅ Required fields for Firebase rules
        from: user.uid,                    // Rules: request.auth.uid == request.resource.data.from
        to: buddyId,                       // Rules: request.auth.uid == resource.data.to
        
        // Challenge content
        challenge: challengeText.trim(),
        reward: challengeReward || 'Completion satisfaction',
        
        // Metadata
        fromName: user.displayName || user.email?.split('@')[0] || 'Atlas User',
        toName: buddyName,
        
        // Status and timing
        status: 'pending',
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        
        // Challenge type and crypto validation
        type: cryptoWager ? 'crypto' : 'fitness',
        
        // Add crypto fields if wager exists
        ...(cryptoWager && {
          wagerAmount: parseFloat(cryptoWager.amount),     // Ensure it's a number
          wagerToken: cryptoWager.token,
          expiryDays: cryptoWager.expiryDays || 7,
          cryptoDetails: {
            tokenSymbol: cryptoWager.token,
            amount: parseFloat(cryptoWager.amount),
            totalPot: parseFloat(cryptoWager.amount) * 2,
            atlasFee: parseFloat(cryptoWager.amount) * 2 * 0.005,
            winnerPayout: parseFloat(cryptoWager.amount) * 2 * 0.995,
            bonus: cryptoWager.bonus || null
          }
        }),
        
        // Additional metadata
        category: 'fitness',
        difficulty: 'medium',
        isPublic: false
      };

      console.log('💾 Challenge data to save:', challengeData);

      // Validate crypto wager amount if present
      if (cryptoWager) {
        const wagerAmount = parseFloat(cryptoWager.amount);
        if (isNaN(wagerAmount) || wagerAmount < 1 || wagerAmount > 1000) {
          throw new Error(`Invalid wager amount: ${cryptoWager.amount}. Must be between 1-1000.`);
        }
        console.log(`✅ Crypto wager validated: ${wagerAmount} ${cryptoWager.token}`);
      }

      // Create challenge document
      const challengesRef = collection(db, 'challenges');
      const docRef = await addDoc(challengesRef, challengeData);
      
      console.log('✅ Challenge created successfully with ID:', docRef.id);

      // Send notification
      try {
        await sendChallengeNotification(
          buddyId,
          user.displayName || user.email?.split('@')[0] || 'Atlas User',
          challengeText
        );
        console.log('✅ Challenge notification sent successfully');
      } catch (notificationError) {
        console.warn('⚠️ Challenge created but notification failed:', notificationError);
        // Don't fail the whole process for notification errors
      }

      // Success feedback
      const successMessage = cryptoWager 
        ? `Crypto challenge sent to ${buddyName}! Wager: ${cryptoWager.amount} ${cryptoWager.token}`
        : `Challenge sent to ${buddyName}! They'll receive a notification.`;

      Alert.alert('Challenge Sent! 🏆', successMessage);
      
      setShowChallengeModal(false);
      setSelectedBuddyState(null);

      // Navigate to challenges screen to see the challenge
      setTimeout(() => {
        navigation.navigate('ChallengesScreen');
      }, 1000);

    } catch (error) {
      console.error('❌ Challenge creation failed:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      
      let errorMessage = 'Failed to send challenge';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your login status.';
        console.error('🔒 Permission denied details:');
        console.error('- User UID:', user.uid);
        console.error('- From field:', challengeData?.from);
        console.error('- To field:', challengeData?.to);
        console.error('- Challenge type:', challengeData?.type);
        console.error('- Wager amount:', challengeData?.wagerAmount);
      } else if (error.message.includes('wager amount')) {
        errorMessage = error.message;
      } else {
        errorMessage = `Failed to send challenge: ${error.message}`;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (messageType, message) => {
    if (!selectedBuddyState) return;

    try {
      const messageData = {
        from: user.uid,
        fromName: user.displayName || user.email,
        to: selectedBuddyState.buddyUserId || selectedBuddyState.id,
        toName: selectedBuddyState.name || selectedBuddyState.displayName,
        message: message,
        type: messageType,
        createdAt: new Date().toISOString(),
        status: 'sent'
      };

      await addDoc(collection(db, 'messages'), messageData);
      await sendEncouragementNotification(
        selectedBuddyState.buddyUserId || selectedBuddyState.id,
        user.displayName || user.email.split('@')[0],
        message
      );

      Alert.alert(
        'Message Sent!', 
        `Your encouragement has been sent to ${selectedBuddyState.name}! They'll receive a notification.`
      );
      
      setShowMessageModal(false);
      setSelectedBuddyState(null);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  return (
    <View style={styles.background}>
      <View style={styles.container}>
        <View style={globalStyles.hudCorner1} />
        <View style={globalStyles.hudCorner2} />
        <View style={globalStyles.hudCorner3} />
        <View style={globalStyles.hudCorner4} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleTop}>WORKOUT</Text>
            <Text style={styles.titleBottom}>BUDDIES</Text>
          </View>
        </View>

        <ScrollView style={styles.content}>
          {/* Stats Section */}
          <BuddyStatsSection
            confirmedCount={confirmedBuddies.length}
            incomingCount={incomingRequests.length}
            pendingCount={pendingRequests.length}
          />

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <FalloutButton
              text="🔍 SEARCH BY NAME"
              onPress={() => navigation.navigate('BuddySearchScreen')}
              style={styles.actionButton}
              type="secondary"
            />
            
            {autoScan && (
              <>
                <FalloutButton
                  text={scanning ? "SCANNING CONTACTS..." : "SCAN CONTACTS"}
                  onPress={scanContacts}
                  style={styles.actionButton}
                  isLoading={scanning}
                />
                
                {suggestedBuddies.length > 0 && (
                  <FalloutButton
                    text={`VIEW SUGGESTIONS (${suggestedBuddies.length})`}
                    onPress={() => setShowSuggestionsModal(true)}
                    style={styles.actionButton}
                    type="secondary"
                  />
                )}
              </>
            )}
          </View>

          {/* Incoming Buddy Requests */}
          {incomingRequests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔔 New Buddy Requests</Text>
              {incomingRequests.map((request) => (
                <BuddyRequestCard
                  key={request.id}
                  request={request}
                  onPress={() => {
                    setSelectedRequest(request);
                    setShowBuddyRequestModal(true);
                  }}
                />
              ))}
            </View>
          )}

          {/* Confirmed Buddies List */}
          {confirmedBuddies.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🏋️ Your Workout Buddies (A-Z)</Text>
              {confirmedBuddies.map((buddy) => (
                <BuddyCard
                  key={buddy.id}
                  buddy={buddy}
                  onPress={() => navigation.navigate('BuddyProfileScreen', { buddy })}
                  onChallenge={(buddy) => {
                    setSelectedBuddyState(buddy);
                    setShowChallengeModal(true);
                  }}
                  onEncourage={(buddy) => {
                    setSelectedBuddyState(buddy);
                    setShowMessageModal(true);
                  }}
                />
              ))}
            </View>
          )}

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⏳ Requests You Sent (A-Z)</Text>
              {pendingRequests.map((request) => (
                <View key={request.id} style={styles.pendingCard}>
                  <Text style={styles.pendingName}>{request.toUserName}</Text>
                  <Text style={styles.pendingStatus}>
                    Sent {new Date(request.createdAt).toLocaleDateString()} • Waiting for response...
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Empty State */}
          {confirmedBuddies.length === 0 && pendingRequests.length === 0 && incomingRequests.length === 0 && !autoScan && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>🏋️ No Workout Buddies Yet</Text>
              <Text style={styles.emptyStateText}>
                Your workout buddies will appear here alphabetically. Use "SEARCH BY NAME" above to find friends!
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Modals */}
        <ChallengeModal
          visible={showChallengeModal}
          buddy={selectedBuddyState}
          onClose={() => {
            setShowChallengeModal(false);
            setSelectedBuddyState(null);
          }}
          onSend={handleSendChallenge}  // Enhanced with crypto support
          isLoading={loading}
        />

        <MessageModal
          visible={showMessageModal}
          buddy={selectedBuddyState}
          onClose={() => {
            setShowMessageModal(false);
            setSelectedBuddyState(null);
          }}
          onSend={handleSendMessage}
        />

        {/* Buddy Request Response Modal */}
        <Modal visible={showBuddyRequestModal} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.modalBackground}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🏋️ Buddy Request</Text>
              <TouchableOpacity 
                onPress={() => { 
                  setShowBuddyRequestModal(false); 
                  setSelectedRequest(null); 
                }} 
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {selectedRequest && (
                <View style={styles.buddyRequestContainer}>
                  <View style={styles.requestModalAvatar}>
                    <Text style={styles.requestModalAvatarText}>
                      {selectedRequest.fromUserName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.requestModalTitle}>
                    {selectedRequest.fromUserName} wants to be your workout buddy!
                  </Text>
                  <Text style={styles.requestModalEmail}>{selectedRequest.fromUserEmail}</Text>
                  <Text style={styles.requestModalDate}>
                    Request sent on {new Date(selectedRequest.createdAt).toLocaleDateString()}
                  </Text>
                  <Text style={styles.requestModalDescription}>
                    As workout buddies, you'll be able to:{'\n'}
                    • Send each other challenges{'\n'}
                    • Create crypto wagering challenges{'\n'}
                    • Share encouragement and motivation{'\n'}
                    • Track each other's progress{'\n'}
                    • Stay accountable to your fitness goals
                  </Text>
                </View>
              )}
              
              <View style={styles.modalButtons}>
                <FalloutButton
                  text={loading ? "ACCEPTING..." : "ACCEPT BUDDY REQUEST"}
                  onPress={() => respondToBuddyRequest(selectedRequest, true)}
                  style={styles.modalButton}
                  isLoading={loading}
                />
                <FalloutButton
                  text="DECLINE REQUEST"
                  onPress={() => respondToBuddyRequest(selectedRequest, false)}
                  style={styles.modalButton}
                  type="secondary"
                />
                <FalloutButton
                  text="DECIDE LATER"
                  onPress={() => { 
                    setShowBuddyRequestModal(false); 
                    setSelectedRequest(null); 
                  }}
                  style={styles.modalButton}
                  type="secondary"
                />
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* Suggestions Modal */}
        <Modal visible={showSuggestionsModal} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.modalBackground}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🏋️ Suggested Workout Buddies</Text>
              <TouchableOpacity onPress={() => setShowSuggestionsModal(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <Text style={styles.suggestionsSubtitle}>
                We found some of your contacts who are already using Atlas Fitness!
              </Text>
              {suggestedBuddies.map((buddy) => (
                <View key={buddy.id} style={styles.suggestionItem}>
                  <View style={styles.suggestionHeader}>
                    <View style={styles.suggestionAvatar}>
                      <Text style={styles.suggestionAvatarText}>
                        {(buddy.contactInfo?.name || buddy.displayName || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.suggestionInfo}>
                      <Text style={styles.suggestionName}>
                        {buddy.contactInfo?.name || buddy.displayName || 'Unknown User'}
                      </Text>
                      <Text style={styles.suggestionEmail}>{buddy.email}</Text>
                      <Text style={styles.suggestionActivity}>
                        Last workout: {buddy.lastWorkoutType || 'None'} 
                      </Text>
                      <Text style={styles.suggestionStreak}>
                        🔥 {buddy.currentStreak || 0} day streak
                      </Text>
                      {buddy.isDemo && <Text style={styles.demoLabel}>Demo User</Text>}
                    </View>
                  </View>
                  <FalloutButton
                    text="SEND BUDDY REQUEST"
                    onPress={() => sendBuddyRequest(buddy)}
                    style={styles.addBuddyButton}
                    type="secondary"
                    isLoading={loading}
                  />
                </View>
              ))}
              <View style={styles.modalButtons}>
                <FalloutButton text="DONE" onPress={() => setShowSuggestionsModal(false)} style={styles.modalButton} />
              </View>
            </ScrollView>
          </View>
        </Modal>
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
  buttonContainer: {
    width: '100%',
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionButton: {
    marginBottom: 15,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 15,
  },
  pendingCard: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderStyle: 'dashed',
  },
  pendingName: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pendingStatus: {
    color: colors.text.secondary,
    fontSize: 14,
    fontStyle: 'italic',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: colors.background.overlay,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 15,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Modal styles
  modalBackground: {
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
  modalButtons: {
    gap: 15,
    marginTop: 20,
  },
  modalButton: {
    marginBottom: 10,
  },
  buddyRequestContainer: {
    backgroundColor: colors.background.overlay,
    borderRadius: 12,
    padding: 25,
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: 20,
    alignItems: 'center',
  },
  requestModalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  requestModalAvatarText: {
    color: colors.text.primary,
    fontSize: 32,
    fontWeight: 'bold',
  },
  requestModalTitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 26,
  },
  requestModalEmail: {
    color: colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  requestModalDate: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  requestModalDescription: {
    color: colors.text.light,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'left',
    backgroundColor: colors.ui.inputBg,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  // Suggestions modal styles
  suggestionsSubtitle: {
    color: colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  suggestionItem: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  suggestionAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  suggestionAvatarText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  suggestionEmail: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: 4,
  },
  suggestionActivity: {
    color: colors.text.light,
    fontSize: 13,
    marginBottom: 2,
  },
  suggestionStreak: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  demoLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  addBuddyButton: {
    marginTop: 5,
  },
});

export default BuddiesScreen;