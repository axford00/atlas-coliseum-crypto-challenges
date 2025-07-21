// src/hooks_atlas/useBuddyProfile.js - Main data loading and state management
import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../../firebase';

export const useBuddyProfile = (buddy) => {
  const [buddyProfile, setBuddyProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState([]);
  const [error, setError] = useState(null);

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (buddy) {
      loadBuddyData();
    }
  }, [buddy]);

  const loadBuddyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load buddy's full profile
      const buddyUserId = buddy.buddyUserId || buddy.id;
      console.log('🔍 Loading buddy profile for ID:', buddyUserId);
      
      const buddyDoc = await getDoc(doc(db, 'users', buddyUserId));
      if (buddyDoc.exists()) {
        setBuddyProfile({ id: buddyDoc.id, ...buddyDoc.data() });
        console.log('✅ Buddy profile loaded for:', buddyDoc.data().displayName || buddy.name);
      } else {
        console.log('❌ No buddy profile found for ID:', buddyUserId);
        setError('Buddy profile not found');
      }

      // Load challenges
      await loadChallenges(buddyUserId);
      
    } catch (error) {
      console.error('Error loading buddy data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadChallenges = async (buddyUserId) => {
    try {
      const challengesRef = collection(db, 'challenges');
      
      console.log('🔍 Loading challenges between:', user.uid, 'and', buddyUserId);
      
      // Get challenges FROM this buddy TO you
      const fromBuddyQuery = query(
        challengesRef,
        where('from', '==', buddyUserId),
        where('to', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      // Get challenges FROM you TO this buddy
      const toBuddyQuery = query(
        challengesRef,
        where('from', '==', user.uid),
        where('to', '==', buddyUserId),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const [fromBuddySnapshot, toBuddySnapshot] = await Promise.all([
        getDocs(fromBuddyQuery),
        getDocs(toBuddyQuery)
      ]);

      const allChallenges = [];
      
      fromBuddySnapshot.forEach(doc => {
        allChallenges.push({ 
          id: doc.id, 
          ...doc.data(), 
          direction: 'from_buddy',
          isYourChallenge: false
        });
      });
      
      toBuddySnapshot.forEach(doc => {
        allChallenges.push({ 
          id: doc.id, 
          ...doc.data(), 
          direction: 'to_buddy',
          isYourChallenge: true
        });
      });

      // Sort by date
      allChallenges.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setChallenges(allChallenges);
      
      console.log(`✅ Found ${allChallenges.length} challenges with ${buddy.name}`);
      
    } catch (error) {
      console.error('Error loading challenges:', error);
      setError('Failed to load challenges');
    }
  };

  const refreshData = () => {
    loadBuddyData();
  };

  return {
    buddyProfile,
    loading,
    challenges,
    setChallenges,
    error,
    refreshData
  };
};