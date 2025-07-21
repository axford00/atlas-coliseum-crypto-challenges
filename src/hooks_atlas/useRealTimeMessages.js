// src/hooks_atlas/useRealTimeMessages.js - Real-time messaging logic
import { useState, useEffect, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import { db } from '../../firebase';

export const useRealTimeMessages = (buddy) => {
  const [chatMessages, setChatMessages] = useState([]);
  const [messageListener, setMessageListener] = useState(null);
  const [loading, setLoading] = useState(true);

  const auth = getAuth();
  const user = auth.currentUser;

  // Setup real-time message listener
  const setupRealTimeMessageListener = useCallback(() => {
    if (!buddy || !user) return;

    try {
      const buddyUserId = buddy.buddyUserId || buddy.id;
      console.log('🔥 Setting up REAL-TIME message listener between:', user.uid, 'and', buddyUserId);
      
      const messagesRef = collection(db, 'messages');
      
      // Create queries for both directions
      const fromBuddyQuery = query(
        messagesRef,
        where('from', '==', buddyUserId),
        where('to', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const toBuddyQuery = query(
        messagesRef,
        where('from', '==', user.uid),
        where('to', '==', buddyUserId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      // Set up real-time listeners
      let fromBuddyMessages = [];
      let toBuddyMessages = [];
      let listenersActive = 0;

      const combineAndUpdateMessages = () => {
        if (listenersActive === 2) {
          const allMessages = [...fromBuddyMessages, ...toBuddyMessages];
          allMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          console.log(`🔥 REAL-TIME UPDATE: ${allMessages.length} total messages`);
          setChatMessages(allMessages);
          setLoading(false);
        }
      };

      // Listen to messages FROM buddy TO you
      const unsubscribeFromBuddy = onSnapshot(
        fromBuddyQuery,
        (snapshot) => {
          console.log(`🔥 REAL-TIME: Received ${snapshot.size} messages FROM buddy`);
          
          fromBuddyMessages = [];
          snapshot.forEach(doc => {
            const messageData = { id: doc.id, ...doc.data() };
            fromBuddyMessages.push({
              ...messageData,
              direction: 'from_buddy',
              senderName: buddy.name || buddy.displayName || 'Buddy'
            });
          });
          
          listenersActive = Math.max(listenersActive, 1);
          combineAndUpdateMessages();
        },
        (error) => {
          console.error('❌ Real-time listener error (from buddy):', error);
          loadChatMessagesOneTime();
        }
      );

      // Listen to messages FROM you TO buddy
      const unsubscribeToBuddy = onSnapshot(
        toBuddyQuery,
        (snapshot) => {
          console.log(`🔥 REAL-TIME: Received ${snapshot.size} messages TO buddy`);
          
          toBuddyMessages = [];
          snapshot.forEach(doc => {
            const messageData = { id: doc.id, ...doc.data() };
            toBuddyMessages.push({
              ...messageData,
              direction: 'to_buddy',
              senderName: 'You'
            });
          });
          
          listenersActive = 2;
          combineAndUpdateMessages();
        },
        (error) => {
          console.error('❌ Real-time listener error (to buddy):', error);
          loadChatMessagesOneTime();
        }
      );

      // Create combined unsubscribe function
      const combinedUnsubscribe = () => {
        if (unsubscribeFromBuddy) unsubscribeFromBuddy();
        if (unsubscribeToBuddy) unsubscribeToBuddy();
      };

      setMessageListener(() => combinedUnsubscribe);
      console.log('✅ Real-time message listeners set up successfully');
      
    } catch (error) {
      console.error('❌ Error setting up real-time listener:', error);
      loadChatMessagesOneTime();
    }
  }, [buddy, user]);

  // Fallback one-time message loading
  const loadChatMessagesOneTime = async () => {
    if (!buddy || !user) return;

    try {
      console.log('⚠️ Using fallback one-time message loading...');
      setLoading(true);
      
      const messagesRef = collection(db, 'messages');
      const buddyUserId = buddy.buddyUserId || buddy.id;
      
      const fromBuddyQuery = query(
        messagesRef,
        where('from', '==', buddyUserId),
        where('to', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const toBuddyQuery = query(
        messagesRef,
        where('from', '==', user.uid),
        where('to', '==', buddyUserId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const [fromBuddySnapshot, toBuddySnapshot] = await Promise.all([
        getDocs(fromBuddyQuery),
        getDocs(toBuddyQuery)
      ]);

      const allMessages = [];
      
      fromBuddySnapshot.forEach(doc => {
        const messageData = { id: doc.id, ...doc.data() };
        allMessages.push({ 
          ...messageData,
          direction: 'from_buddy',
          senderName: buddy.name || buddy.displayName || 'Buddy'
        });
      });
      
      toBuddySnapshot.forEach(doc => {
        const messageData = { id: doc.id, ...doc.data() };
        allMessages.push({ 
          ...messageData,
          direction: 'to_buddy',
          senderName: 'You'
        });
      });

      allMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setChatMessages(allMessages);
      
      console.log(`✅ Fallback: Loaded ${allMessages.length} messages`);
        
    } catch (error) {
      console.error('❌ Error in fallback message loading:', error);
    } finally {
      setLoading(false);
    }
  };

  // Setup listener on mount
  useEffect(() => {
    setupRealTimeMessageListener();
    
    // Cleanup listener on unmount
    return () => {
      if (messageListener) {
        console.log('🧹 Cleaning up message listener...');
        messageListener();
        setMessageListener(null);
      }
    };
  }, [setupRealTimeMessageListener]);

  return {
    chatMessages,
    loading: loading,
    refreshMessages: loadChatMessagesOneTime
  };
};
