// AtlasChallengesScreen.js - ENHANCED VERSION with PendingChallengesScreen Integration
import { getAuth } from 'firebase/auth';
import { collection, getDocs, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState, useRef } from 'react';
import {
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../../firebase';
import { colors, globalStyles } from '../theme/colors';

const { width, height } = Dimensions.get('window');

// 🚀 FIXED: Demo mode turned OFF to show real challenges
const DEMO_MODE = false;

// ✅ NEGOTIATED CHALLENGES COMPONENT
const NegotiatedChallengesSection = ({ challenges, onChallengePress }) => {
  // Filter challenges that are being negotiated
  const negotiatedChallenges = challenges.filter(challenge => 
    challenge.status === 'negotiating' || 
    challenge.negotiationStatus === 'pending_response' ||
    challenge.negotiationStatus === 'counter_offer_received'
  );

  if (negotiatedChallenges.length === 0) {
    return null; // Don't show section if no negotiations
  }

  return (
    <View style={styles.negotiatedSection}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.sectionIcon}>🤝</Text>
          <Text style={styles.sectionTitle}>Negotiated Challenges</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{negotiatedChallenges.length}</Text>
          </View>
        </View>
        <Text style={styles.sectionSubtitle}>
          Counter-offers pending response
        </Text>
      </View>

      {/* Negotiated Challenges List */}
      <View style={styles.challengesList}>
        {negotiatedChallenges.map((challenge, index) => (
          <NegotiatedChallengeCard
            key={challenge.id}
            challenge={challenge}
            onPress={() => onChallengePress(challenge)}
            isLast={index === negotiatedChallenges.length - 1}
          />
        ))}
      </View>
    </View>
  );
};

const NegotiatedChallengeCard = ({ challenge, onPress, isLast }) => {
  const isIncoming = challenge.direction === 'incoming';
  const isOutgoing = challenge.direction === 'outgoing';

  // Determine status display
  const getStatusInfo = () => {
    if (isIncoming && challenge.negotiationStatus === 'pending_response') {
      return {
        text: 'Counter-offer sent',
        icon: '📤',
        color: colors.warning || '#f39c12',
        bgColor: 'rgba(243, 156, 18, 0.1)'
      };
    }
    if (isOutgoing && challenge.negotiationStatus === 'pending_response') {
      return {
        text: 'Counter-offer received',
        icon: '📨',
        color: colors.primary || '#6C5CE7',
        bgColor: 'rgba(108, 92, 231, 0.1)'
      };
    }
    return {
      text: 'Negotiating',
      icon: '🤝',
      color: colors.accent || '#00cec9',
      bgColor: 'rgba(0, 206, 201, 0.1)'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <TouchableOpacity 
      style={[
        styles.challengeCard,
        !isLast && styles.challengeCardBorder,
        { backgroundColor: statusInfo.bgColor }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        {/* Challenge Info */}
        <View style={styles.challengeInfo}>
          <View style={styles.challengeHeader}>
            <Text style={styles.challengeTitle} numberOfLines={1}>
              {challenge.challenge}
            </Text>
            <View style={styles.directionBadge}>
              <Text style={styles.directionText}>
                {isIncoming ? '📥 TO YOU' : '📤 FROM YOU'}
              </Text>
            </View>
          </View>
          
          <View style={styles.challengeDetails}>
            <Text style={styles.participantText}>
              {isIncoming ? `From: ${challenge.fromName}` : `To: ${challenge.toName}`}
            </Text>
            
            {/* Crypto Wager Display */}
            {challenge.wagerAmount > 0 && (
              <View style={styles.wagerInfo}>
                <Text style={styles.wagerText}>
                  💰 {challenge.wagerAmount} {challenge.wagerToken}
                </Text>
                <Text style={styles.negotiationHint}>
                  (Terms under negotiation)
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Status Badge */}
        <View style={[styles.statusBadge, { borderColor: statusInfo.color }]}>
          <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
        </View>
      </View>

      {/* Action Hint */}
      <View style={styles.actionHint}>
        <Text style={styles.actionHintText}>
          {isOutgoing ? 'Tap to review counter-offer' : 'Tap to view negotiation status'}
        </Text>
        <Text style={styles.actionHintIcon}>👆</Text>
      </View>
    </TouchableOpacity>
  );
};

// ✅ MAIN CHALLENGES SCREEN COMPONENT
const AtlasChallengesScreen = ({ navigation }) => {
  const [liveChallenges, setLiveChallenges] = useState([]);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [realTimeCounters, setRealTimeCounters] = useState({
    pending: 0,
    active: 0,
    completed: 0,
    negotiating: 0
  });
  
  const countdownInterval = useRef(null);
  const notificationTimers = useRef(new Map());
  const challengeListeners = useRef([]);

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (DEMO_MODE) {
      loadDemoData();
    } else {
      // 🔄 Try real-time first, but fallback to manual loading
      try {
        setupRealTimeChallengeListeners();
      } catch (error) {
        console.error('❌ Real-time setup failed, using manual loading:', error);
        loadChallenges();
      }
    }
    
    // ✅ START COUNTDOWN TIMER
    startCountdownTimer();
    
    return () => {
      // Cleanup timers
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
      notificationTimers.current.forEach(timer => clearTimeout(timer));
      
      // Cleanup real-time listeners
      challengeListeners.current.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          try {
            unsubscribe();
          } catch (error) {
            console.log('⚠️ Error cleaning up listener:', error);
          }
        }
      });
    };
  }, [user]);

  // ✅ SMART CHALLENGE LOADING - Real-time with Fallback
  const setupRealTimeChallengeListeners = () => {
    if (!user) {
      setLoading(false);
      return;
    }

    console.log('🔄 Setting up real-time challenge listeners for user:', user.uid);

    // Try real-time listeners first, fallback to manual loading on permission errors
    try {
      // Active challenges listener (pending, accepted, response_submitted, retry_requested, negotiating)
      const activeChallengesQuery = query(
        collection(db, 'challenges'),
        where('status', 'in', ['pending', 'accepted', 'response_submitted', 'retry_requested', 'negotiating'])
      );

      const activeUnsubscribe = onSnapshot(
        activeChallengesQuery, 
        (snapshot) => {
          const activeChallenges = [];
          
          snapshot.forEach((doc) => {
            const challengeData = { id: doc.id, ...doc.data() };
            
            // Filter for user's challenges
            if (challengeData.from === user.uid || challengeData.to === user.uid) {
              const direction = challengeData.from === user.uid ? 'outgoing' : 'incoming';
              activeChallenges.push({
                ...challengeData,
                direction,
                isYourChallenge: challengeData.from === user.uid
              });
            }
          });

          console.log('🔄 Real-time active challenges update:', activeChallenges.length);
          setLiveChallenges(activeChallenges);
          
          // Schedule notifications for new challenges
          activeChallenges.forEach(challenge => {
            if (challenge.dueDate) {
              scheduleExpiryNotifications(challenge);
            }
          });
        },
        (error) => {
          console.error('❌ Real-time active challenges listener failed:', error);
          console.log('🔄 Falling back to manual loading...');
          loadChallenges(); // Fallback to manual loading
        }
      );

      // Completed challenges listener (completed, declined, disputed)
      const completedChallengesQuery = query(
        collection(db, 'challenges'),
        where('status', 'in', ['completed', 'declined', 'disputed'])
        // Removed orderBy to avoid permission issues
      );

      const completedUnsubscribe = onSnapshot(
        completedChallengesQuery, 
        (snapshot) => {
          const completed = [];
          
          snapshot.forEach((doc) => {
            const challengeData = { id: doc.id, ...doc.data() };
            
            // Filter for user's challenges
            if (challengeData.from === user.uid || challengeData.to === user.uid) {
              const direction = challengeData.from === user.uid ? 'outgoing' : 'incoming';
              completed.push({
                ...challengeData,
                direction,
                isYourChallenge: challengeData.from === user.uid
              });
            }
          });

          console.log('🔄 Real-time completed challenges update:', completed.length);
          setCompletedChallenges(completed);
        },
        (error) => {
          console.error('❌ Real-time completed challenges listener failed:', error);
          console.log('🔄 Falling back to manual loading...');
          if (liveChallenges.length === 0) {
            // Only fallback if we haven't loaded anything yet
            loadChallenges();
          }
        }
      );

      // Store listeners for cleanup
      challengeListeners.current = [activeUnsubscribe, completedUnsubscribe];
      setLoading(false);

    } catch (error) {
      console.error('❌ Failed to setup real-time listeners:', error);
      console.log('🔄 Using manual loading instead...');
      loadChallenges(); // Immediate fallback to manual loading
    }
  };

  // ✅ REAL-TIME COUNTER UPDATES - Updated to include negotiating
  useEffect(() => {
    const pending = liveChallenges.filter(c => c.status === 'pending' && c.direction === 'incoming').length;
    const active = liveChallenges.filter(c => ['accepted', 'response_submitted', 'retry_requested'].includes(c.status)).length;
    const negotiating = liveChallenges.filter(c => 
      c.status === 'negotiating' || 
      c.negotiationStatus === 'pending_response' ||
      c.negotiationStatus === 'counter_offer_received'
    ).length;
    const completed = completedChallenges.length;

    setRealTimeCounters({ pending, active, completed, negotiating });
    console.log('📊 Real-time counters updated:', { pending, active, completed, negotiating });
  }, [liveChallenges, completedChallenges]);

  // ✅ COUNTDOWN TIMER SYSTEM
  const startCountdownTimer = () => {
    countdownInterval.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second
  };

  // ✅ EXPIRY NOTIFICATIONS SYSTEM
  const scheduleExpiryNotifications = (challenge) => {
    if (!challenge.dueDate) return;
    
    const now = new Date();
    const dueDate = new Date(challenge.dueDate);
    const timeToExpiry = dueDate.getTime() - now.getTime();
    
    // Clear existing timers for this challenge
    const existingTimer = notificationTimers.current.get(challenge.id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Schedule notifications at 1 day, 12 hours, and 1 hour before expiry
    const notificationSchedule = [
      { time: 24 * 60 * 60 * 1000, message: '1 day left' }, // 1 day
      { time: 12 * 60 * 60 * 1000, message: '12 hours left' }, // 12 hours
      { time: 1 * 60 * 60 * 1000, message: '1 hour left' }, // 1 hour
    ];
    
    notificationSchedule.forEach(({ time, message }) => {
      const notificationTime = timeToExpiry - time;
      
      if (notificationTime > 0) {
        const timer = setTimeout(() => {
          console.log(`⏰ Expiry notification: ${challenge.challenge} - ${message}`);
          Alert.alert(
            '⏰ Challenge Expiring Soon!',
            `"${challenge.challenge}" has ${message} before expiry!\n\n${challenge.direction === 'incoming' ? 'Submit your response now!' : 'Check if they\'ve responded!'}`,
            [{ text: 'View Challenge', onPress: () => handleChallengePress(challenge) }]
          );
        }, notificationTime);
        
        notificationTimers.current.set(`${challenge.id}-${message}`, timer);
      }
    });
  };

  // ✅ COUNTDOWN DISPLAY FUNCTION
  const getTimeRemaining = (dueDate) => {
    if (!dueDate) return null;
    
    const now = currentTime;
    const due = new Date(dueDate);
    const timeLeft = due.getTime() - now.getTime();
    
    if (timeLeft <= 0) {
      return { expired: true, display: 'EXPIRED' };
    }
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return { expired: false, display: `${days}d ${hours}h left`, urgent: days < 1 };
    } else if (hours > 0) {
      return { expired: false, display: `${hours}h ${minutes}m left`, urgent: hours < 12 };
    } else {
      return { expired: false, display: `${minutes}m left`, urgent: true };
    }
  };

  // 🚀 FALLBACK: Manual challenge loading (kept for compatibility)
  const loadChallenges = async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Loading real challenges for user:', user.uid);
      
      // Load all challenges involving this user
      const challengesRef = collection(db, 'challenges');
      
      // Challenges TO the user (incoming)
      const incomingQuery = query(
        challengesRef,
        where('to', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      // Challenges FROM the user (outgoing)
      const outgoingQuery = query(
        challengesRef,
        where('from', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      console.log('📥 Fetching incoming and outgoing challenges...');
      const [incomingSnapshot, outgoingSnapshot] = await Promise.all([
        getDocs(incomingQuery),
        getDocs(outgoingQuery)
      ]);

      const allChallenges = [];
      
      // Process incoming challenges
      incomingSnapshot.forEach(doc => {
        const data = doc.data();
        allChallenges.push({ 
          id: doc.id, 
          ...data, 
          direction: 'incoming',
          isYourChallenge: false
        });
        console.log('📥 Incoming challenge:', doc.id, data.challenge);
      });
      
      // Process outgoing challenges
      outgoingSnapshot.forEach(doc => {
        const data = doc.data();
        allChallenges.push({ 
          id: doc.id, 
          ...data, 
          direction: 'outgoing',
          isYourChallenge: true
        });
        console.log('📤 Outgoing challenge:', doc.id, data.challenge);
      });

      // Sort all challenges by date (newest first)
      allChallenges.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Separate live vs completed challenges
      const live = allChallenges.filter(challenge => 
        challenge.status === 'pending' || 
        challenge.status === 'accepted' || 
        challenge.status === 'response_submitted' ||
        challenge.status === 'retry_requested' ||
        challenge.status === 'negotiating'
      );
      
      const completed = allChallenges.filter(challenge => 
        challenge.status === 'completed' || 
        challenge.status === 'declined' ||
        challenge.status === 'disputed'
      );

      setLiveChallenges(live);
      setCompletedChallenges(completed);
      
      // ✅ SCHEDULE EXPIRY NOTIFICATIONS for live challenges
      live.forEach(challenge => {
        if (challenge.dueDate) {
          scheduleExpiryNotifications(challenge);
        }
      });
      
      console.log(`✅ Loaded ${live.length} live challenges, ${completed.length} completed`);
      console.log('📋 Live challenges:', live.map(c => ({ id: c.id, challenge: c.challenge, direction: c.direction, status: c.status })));
      
    } catch (error) {
      console.error('❌ Error loading challenges:', error);
      console.error('❌ Error details:', error.code, error.message);
      
      // Don't show alert for certain expected errors
      if (error.code !== 'failed-precondition') {
        Alert.alert('Error', 'Failed to load challenges');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadDemoData = () => {
    console.log('Loading demo challenges data...');
    setLoading(true);
    
    setTimeout(() => {
      setLiveChallenges([]);
      setCompletedChallenges([]);
      setLoading(false);
      setRefreshing(false);
      
      console.log('Demo: Loaded 0 challenges (demo mode disabled)');
    }, 1000);
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (DEMO_MODE) {
      loadDemoData();
    } else {
      // Real-time listeners will handle updates, but we can trigger a manual refresh
      loadChallenges();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return colors.text.secondary;
      case 'accepted': return colors.primary;
      case 'response_submitted': return '#FF9800';
      case 'retry_requested': return '#FF5722';
      case 'completed': return '#4CAF50';
      case 'declined': return '#f44336';
      case 'disputed': return '#795548';
      case 'negotiating': return colors.accent || '#00cec9';
      default: return colors.text.secondary;
    }
  };

  const getTokenColor = (token) => {
    const tokenColors = {
      'USDC': '#2775ca',
      'SOL': '#9945ff', 
      'BONK': '#ff6b35'
    };
    return tokenColors[token] || '#888';
  };

  const calculateWagerDisplay = (wagerAmount, wagerToken) => {
    if (!wagerAmount || !wagerToken) return null;
    
    const tokenMultipliers = {
      'USDC': 1.0,
      'SOL': 1.1,   // 10% bonus
      'BONK': 1.25  // 25% bonus
    };
    
    const multiplier = tokenMultipliers[wagerToken] || 1.0;
    const totalValue = wagerAmount * 2 * multiplier;
    const atlasFee = totalValue * 0.025; // 2.5% fee
    const winnerPayout = totalValue - atlasFee;
    
    return {
      totalPot: totalValue.toFixed(2),
      winnerGets: winnerPayout.toFixed(2),
      bonus: multiplier > 1 ? `${((multiplier - 1) * 100).toFixed(0)}% bonus` : null
    };
  };

  const handleChallengePress = (challenge) => {
    console.log('Challenge pressed:', challenge.id);
    navigation.navigate('ChallengeDetail', { challenge });
  };

  const handleCreateChallenge = () => {
    // Navigate directly to BuddiesScreen where the nice layout exists
    navigation.navigate('BuddiesScreen');
  };

  // 🚀 CRITICAL UPDATE: Enhanced Pending Challenges Handler
  const handlePendingChallengesPress = () => {
    const pendingChallenges = liveChallenges.filter(c => 
      c.status === 'pending' && c.direction === 'incoming'
    );
    
    console.log('🎯 Navigating to PendingChallengesScreen with challenges:', pendingChallenges.length);
    
    // ✅ NAVIGATE TO SCROLLABLE LIST SCREEN
    navigation.navigate('PendingChallenges', { 
      challenges: pendingChallenges,
      user: user
    });
  };

  // 🔔 ENHANCED: Pending challenges alert at top - NOW NAVIGATES TO LIST
  const renderPendingAlert = () => {
    const pendingChallenges = liveChallenges.filter(c => 
      c.status === 'pending' && c.direction === 'incoming'
    );
    
    if (pendingChallenges.length === 0) return null;
    
    return (
      <TouchableOpacity 
        style={styles.pendingAlert}
        onPress={handlePendingChallengesPress} // ✅ NOW GOES TO LIST SCREEN
      >
        <Text style={styles.pendingAlertTitle}>
          🔔 {pendingChallenges.length} PENDING CHALLENGE{pendingChallenges.length > 1 ? 'S' : ''} AWAIT YOUR RESPONSE!
        </Text>
        <Text style={styles.pendingAlertText}>
          Tap to view all pending challenges in a scrollable list
        </Text>
      </TouchableOpacity>
    );
  };

  // ✅ ENHANCED Atlas-styled stats component with REAL-TIME COUNTERS + NEGOTIATING + PENDING BOX
  const renderAtlasStats = () => {
    const cryptoChallenges = liveChallenges.filter(c => c.wagerAmount > 0);
    
    return (
      <View style={styles.atlasStatsContainer}>
        <View style={styles.atlasStatCard}>
          <Text style={styles.atlasStatNumber}>{realTimeCounters.active}</Text>
          <Text style={styles.atlasStatLabel}>ACTIVE</Text>
          <Text style={styles.atlasStatLabel}>CHALLENGES</Text>
        </View>
        
        <View style={styles.atlasStatCard}>
          <Text style={[styles.atlasStatNumber, { color: '#ff6b35' }]}>{cryptoChallenges.length}</Text>
          <Text style={styles.atlasStatLabel}>CRYPTO</Text>
          <Text style={styles.atlasStatLabel}>WAGERS</Text>
        </View>
        
        {/* 🚀 ENHANCED: Pending Box - Now Clickable to Scrollable List */}
        <TouchableOpacity 
          style={[styles.atlasStatCard, styles.pendingStatCard]}
          onPress={handlePendingChallengesPress}
          disabled={realTimeCounters.pending === 0}
        >
          <Text style={[styles.atlasStatNumber, { color: colors.primary }]}>{realTimeCounters.pending}</Text>
          <Text style={styles.atlasStatLabel}>PENDING</Text>
          <Text style={styles.atlasStatLabel}>RESPONSE</Text>
          {realTimeCounters.pending > 0 && (
            <Text style={styles.pendingHint}>👆 TAP</Text>
          )}
        </TouchableOpacity>

        <View style={styles.atlasStatCard}>
          <Text style={[styles.atlasStatNumber, { color: colors.accent || '#00cec9' }]}>{realTimeCounters.negotiating}</Text>
          <Text style={styles.atlasStatLabel}>NEGOTIATING</Text>
          <Text style={styles.atlasStatLabel}>TERMS</Text>
        </View>
      </View>
    );
  };

  const renderAtlasChallenge = (challenge, isHistory = false) => {
    const isIncoming = challenge.direction === 'incoming';
    const hasCrypto = challenge.wagerAmount > 0;
    const wagerInfo = hasCrypto ? calculateWagerDisplay(challenge.wagerAmount, challenge.wagerToken) : null;
    const timeRemaining = challenge.dueDate ? getTimeRemaining(challenge.dueDate) : null;
    
    return (
      <TouchableOpacity 
        key={challenge.id}
        style={[
          styles.atlasChallengeCard,
          isIncoming && challenge.status === 'pending' && styles.incomingPendingCard,
          hasCrypto && styles.cryptoCard,
          timeRemaining?.urgent && styles.urgentCard,
          isHistory && styles.historyCard
        ]}
        onPress={() => handleChallengePress(challenge)}
      >
        {/* Challenge Header */}
        <View style={styles.challengeHeader}>
          <View style={styles.challengerInfo}>
            <Text style={styles.challengerName}>
              {isIncoming ? challenge.fromName : `To: ${challenge.toName}`}
            </Text>
            <Text style={styles.challengeDate}>{formatDate(challenge.createdAt)}</Text>
          </View>
          
          <View style={styles.headerRight}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(challenge.status) + '30' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(challenge.status) }]}>
                {challenge.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            
            {/* ✅ COUNTDOWN TIMER (only for active challenges) */}
            {!isHistory && timeRemaining && (
              <View style={[
                styles.countdownBadge,
                timeRemaining.urgent && styles.urgentCountdown,
                timeRemaining.expired && styles.expiredCountdown
              ]}>
                <Text style={[
                  styles.countdownText,
                  timeRemaining.urgent && styles.urgentCountdownText,
                  timeRemaining.expired && styles.expiredCountdownText
                ]}>
                  ⏰ {timeRemaining.display}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Challenge Text */}
        <View style={styles.challengeContent}>
          <Text style={styles.challengeTitle}>🏆 THE CHALLENGE</Text>
          <Text style={styles.challengeText}>{challenge.challenge}</Text>
        </View>

        {/* Reward Section */}
        <View style={styles.rewardSection}>
          <Text style={styles.rewardTitle}>🎁 REWARD</Text>
          <Text style={styles.rewardText}>{challenge.reward}</Text>
        </View>

        {/* Crypto Wager Section */}
        {hasCrypto && wagerInfo && (
          <View style={[styles.cryptoSection, { borderColor: getTokenColor(challenge.wagerToken) }]}>
            <View style={styles.cryptoHeader}>
              <Text style={styles.cryptoTitle}>💰 ATLAS VAULT SECURED</Text>
              <View style={[styles.tokenBadge, { backgroundColor: getTokenColor(challenge.wagerToken) + '30' }]}>
                <Text style={[styles.tokenText, { color: getTokenColor(challenge.wagerToken) }]}>
                  {challenge.wagerToken}
                </Text>
              </View>
            </View>
            
            <View style={styles.cryptoDetails}>
              <Text style={styles.cryptoAmount}>Winner receives: ${wagerInfo.winnerGets}</Text>
              {wagerInfo.bonus && (
                <Text style={[styles.cryptoBonus, { color: getTokenColor(challenge.wagerToken) }]}>
                  🚀 {wagerInfo.bonus} applied!
                </Text>
              )}
              <Text style={styles.cryptoFee}>Atlas fee: 2.5% • Total pot: ${wagerInfo.totalPot}</Text>
            </View>

            {/* Completed crypto challenge details */}
            {isHistory && challenge.status === 'completed' && (
              <View style={styles.completedCryptoInfo}>
                <Text style={styles.completedCryptoText}>
                  🏆 Challenge completed! Winner received ${wagerInfo.winnerGets}
                </Text>
                {challenge.completedAt && (
                  <Text style={styles.completedDate}>
                    Completed: {new Date(challenge.completedAt.toDate ? challenge.completedAt.toDate() : challenge.completedAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* History-specific information */}
        {isHistory && (
          <View style={styles.historyInfo}>
            {challenge.outcome && (
              <Text style={[styles.outcomeText, { 
                color: challenge.outcome === 'approved' ? '#4CAF50' : 
                      challenge.outcome === 'rejected' ? '#f44336' : '#888'
              }]}>
                Outcome: {challenge.outcome.toUpperCase()}
              </Text>
            )}
            {challenge.completedAt && !hasCrypto && (
              <Text style={styles.completedDate}>
                Completed: {new Date(challenge.completedAt.toDate ? challenge.completedAt.toDate() : challenge.completedAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        {/* Action Prompt (only for active challenges) */}
        {!isHistory && (
          <View style={styles.actionPrompt}>
            {isIncoming && challenge.status === 'pending' && (
              <Text style={styles.actionText}>👆 Tap to accept or decline this challenge</Text>
            )}
            {challenge.status === 'response_submitted' && challenge.direction === 'outgoing' && (
              <Text style={styles.approvalText}>👆 Tap to review buddy's response</Text>
            )}
            {challenge.status === 'accepted' && (
              <Text style={styles.activeText}>⚡ Challenge active - Submit your proof!</Text>
            )}
            {challenge.status === 'retry_requested' && challenge.direction === 'incoming' && (
              <Text style={styles.retryText}>🔄 Retry requested - Submit improved response</Text>
            )}
            {challenge.status === 'negotiating' && (
              <Text style={styles.negotiatingText}>🤝 Tap to view negotiation details</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.background}>
        <View style={styles.container}>
          <View style={globalStyles.hudCorner1} />
          <View style={globalStyles.hudCorner2} />
          <View style={globalStyles.hudCorner3} />
          <View style={globalStyles.hudCorner4} />
          
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading Atlas challenges...</Text>
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

        {/* ✅ CENTERED Atlas Header - NO BACK BUTTON */}
        <View style={styles.atlasHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleTop}>ATLAS</Text>
            <Text style={styles.titleBottom}>CHALLENGES</Text>
          </View>
          {!DEMO_MODE && (
            <Text style={styles.liveLabel}>⚡ LIVE CRYPTO CHALLENGES</Text>
          )}
        </View>

        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* 🔔 PRIORITY: Pending Challenges Alert - NOW NAVIGATES TO LIST */}
          {renderPendingAlert()}

          {/* ✅ NEGOTIATED CHALLENGES SECTION (TOP PRIORITY) */}
          <NegotiatedChallengesSection 
            challenges={liveChallenges}
            onChallengePress={handleChallengePress}
          />

          {/* ✅ REAL-TIME Atlas Stats with CLICKABLE PENDING BOX */}
          {renderAtlasStats()}

          {/* ✅ PERFECTLY CENTERED Create Challenge Button */}
          <TouchableOpacity 
            style={styles.atlasCreateButton}
            onPress={handleCreateChallenge}
          >
            <Text style={styles.createButtonText}>🚀 CREATE NEW CHALLENGE</Text>
            <Text style={styles.createButtonSubtext}>Challenge your workout buddies</Text>
          </TouchableOpacity>

          {/* Active Challenges Section */}
          <View style={styles.section}>
            <Text style={styles.atlasSectionTitle}>⚡ ACTIVE CHALLENGES</Text>
            
            {liveChallenges.filter(c => 
              c.status !== 'negotiating' && 
              c.negotiationStatus !== 'pending_response' &&
              c.negotiationStatus !== 'counter_offer_received'
            ).length > 0 ? (
              liveChallenges
                .filter(c => 
                  c.status !== 'negotiating' && 
                  c.negotiationStatus !== 'pending_response' &&
                  c.negotiationStatus !== 'counter_offer_received'
                )
                .map(challenge => renderAtlasChallenge(challenge, false))
            ) : (
              <View style={styles.atlasEmptyState}>
                <Text style={styles.emptyStateTitle}>⚡ NO ACTIVE CHALLENGES</Text>
                <Text style={styles.emptyStateText}>
                  Create your first crypto challenge above to start earning rewards!
                </Text>
              </View>
            )}
          </View>

          {/* ✅ CHALLENGE HISTORY SECTION */}
          {completedChallenges.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.atlasSectionTitle}>📚 CHALLENGE HISTORY</Text>
              <Text style={styles.historySectionSubtitle}>
                {realTimeCounters.completed} completed challenge{realTimeCounters.completed !== 1 ? 's' : ''}
              </Text>
              
              {completedChallenges.map(challenge => renderAtlasChallenge(challenge, true))}
            </View>
          )}

          {/* Empty History State */}
          {completedChallenges.length === 0 && (
            <View style={styles.section}>
              <Text style={styles.atlasSectionTitle}>📚 CHALLENGE HISTORY</Text>
              <View style={styles.atlasEmptyState}>
                <Text style={styles.emptyStateTitle}>📚 NO COMPLETED CHALLENGES</Text>
                <Text style={styles.emptyStateText}>
                  Your challenge history will appear here once you complete some challenges!
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
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
  
  // ✅ CENTERED Atlas Header - NO BACK BUTTON
  atlasHeader: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center', // ✅ Perfect centering
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
  liveLabel: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 'bold',
    backgroundColor: colors.background.overlay,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text.primary,
    fontSize: 16,
  },

  // 🔔 Pending Alert Banner - NOW NAVIGATES TO LIST
  pendingAlert: {
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  pendingAlertTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  pendingAlertText: {
    color: colors.text.primary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 18,
  },

  // ✅ NEGOTIATED CHALLENGES SECTION STYLES
  negotiatedSection: {
    marginBottom: 24,
    backgroundColor: colors.ui?.cardBg || '#2a2a2a',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.accent || '#00cec9',
    overflow: 'hidden',
  },

  sectionHeader: {
    backgroundColor: colors.accent || '#00cec9',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.background?.dark || '#000',
    flex: 1,
  },

  countBadge: {
    backgroundColor: colors.background?.dark || '#000',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },

  countText: {
    color: colors.accent || '#00cec9',
    fontSize: 12,
    fontWeight: 'bold',
  },

  sectionSubtitle: {
    fontSize: 12,
    color: colors.background?.dark || '#000',
    opacity: 0.8,
  },

  challengesList: {
    backgroundColor: colors.ui?.cardBg || '#2a2a2a',
  },

  challengeCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  challengeCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.ui?.border || '#444',
  },

  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },

  challengeInfo: {
    flex: 1,
    marginRight: 12,
  },

  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  challengeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text?.primary || '#fff',
    flex: 1,
    marginRight: 8,
  },

  directionBadge: {
    backgroundColor: colors.ui?.border || '#444',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  directionText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text?.secondary || '#888',
  },

  challengeDetails: {
    gap: 4,
  },

  participantText: {
    fontSize: 12,
    color: colors.text?.secondary || '#888',
  },

  wagerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  wagerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.success || '#27ae60',
  },

  negotiationHint: {
    fontSize: 10,
    color: colors.warning || '#f39c12',
    fontStyle: 'italic',
  },

  statusBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    minWidth: 80,
  },

  statusIcon: {
    fontSize: 14,
    marginBottom: 2,
  },

  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.ui?.border || '#444',
    opacity: 0.7,
  },

  actionHintText: {
    fontSize: 11,
    color: colors.text?.secondary || '#888',
    marginRight: 4,
  },

  actionHintIcon: {
    fontSize: 12,
  },

  // ✅ ENHANCED REAL-TIME Atlas Stats with CLICKABLE PENDING BOX
  atlasStatsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.overlay,
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  atlasStatCard: {
    flex: 1,
    alignItems: 'center',
  },
  // 🚀 NEW: Clickable Pending Stat Card
  pendingStatCard: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 8,
    backgroundColor: colors.primary + '10',
    paddingVertical: 8,
  },
  atlasStatNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 5,
  },
  atlasStatLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    textAlign: 'center',
    letterSpacing: 1,
  },
  // 🚀 NEW: Pending Hint Text
  pendingHint: {
    fontSize: 8,
    color: colors.primary,
    fontWeight: 'bold',
    marginTop: 2,
    textAlign: 'center',
  },

  // ✅ PERFECTLY CENTERED Atlas Create Button
  atlasCreateButton: {
    backgroundColor: colors.background.overlay,
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center', // ✅ Perfect vertical centering
  },
  createButtonText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    letterSpacing: 1,
    textAlign: 'center', // ✅ Perfect horizontal centering
  },
  createButtonSubtext: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center', // ✅ Perfect horizontal centering
  },

  // Section
  section: {
    marginBottom: 30,
  },
  atlasSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 20,
    letterSpacing: 1,
  },
  historySectionSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 15,
    marginTop: -15,
  },

  // Atlas Challenge Cards
  atlasChallengeCard: {
    backgroundColor: colors.background.overlay,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  incomingPendingCard: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.ui.cardBg,
  },
  cryptoCard: {
    borderWidth: 2,
    borderColor: '#ff6b35',
  },
  urgentCard: {
    borderWidth: 2,
    borderColor: '#ff4444',
    backgroundColor: 'rgba(255, 68, 68, 0.05)',
  },
  historyCard: {
    opacity: 0.8,
    borderColor: colors.text.secondary,
    backgroundColor: colors.background.overlay + '80',
  },

  challengerInfo: {
    flex: 1,
  },
  challengerName: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  challengeDate: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },

  // ✅ COUNTDOWN TIMER STYLES
  countdownBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  urgentCountdown: {
    backgroundColor: '#ff4444' + '20',
    borderColor: '#ff4444',
  },
  expiredCountdown: {
    backgroundColor: '#888' + '20',
    borderColor: '#888',
  },
  countdownText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primary,
  },
  urgentCountdownText: {
    color: '#ff4444',
  },
  expiredCountdownText: {
    color: '#888',
  },

  // Challenge Content
  challengeContent: {
    marginBottom: 15,
  },
  rewardSection: {
    marginBottom: 15,
  },
  rewardTitle: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  challengeText: {
    color: colors.text.primary,
    fontSize: 16,
    lineHeight: 22,
  },
  rewardText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Crypto Section
  cryptoSection: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
  },
  cryptoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cryptoTitle: {
    color: '#ff6b35',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  tokenBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tokenText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  cryptoDetails: {
    alignItems: 'center',
  },
  cryptoAmount: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cryptoBonus: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cryptoFee: {
    color: colors.text.secondary,
    fontSize: 11,
  },

  // ✅ COMPLETED CRYPTO INFO
  completedCryptoInfo: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.ui.border,
    alignItems: 'center',
  },
  completedCryptoText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  completedDate: {
    color: colors.text.secondary,
    fontSize: 12,
    fontStyle: 'italic',
  },

  // ✅ HISTORY INFO
  historyInfo: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.ui.border,
    alignItems: 'center',
  },
  outcomeText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  // Action Prompt
  actionPrompt: {
    alignItems: 'center',
  },
  actionText: {
    color: colors.primary,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  approvalText: {
    color: '#FF9800',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  activeText: {
    color: colors.primary,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  retryText: {
    color: '#FF5722',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  negotiatingText: {
    color: colors.accent || '#00cec9',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  // Empty State
  atlasEmptyState: {
    backgroundColor: colors.background.overlay,
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AtlasChallengesScreen;