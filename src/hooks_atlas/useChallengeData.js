// FILE: hooks/useChallengeData.js - UPDATED with Safe Firebase Integration
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useCallback, useState } from 'react';
// ✅ CRITICAL: Import safe Firebase functions
import { 
  getDb, 
  isFirebaseReady, 
  waitForFirebase, 
  safeFirestoreOperation 
} from '../../firebase';

export const useChallengeData = (challenge, user) => {
  const [challengeResponse, setChallengeResponse] = useState(null);
  const [myVideoResponse, setMyVideoResponse] = useState(null);
  const [loading, setLoading] = useState(false);

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

  // ✅ SAFE: Load challenge response with Firebase safety
  const loadChallengeResponse = useCallback(async () => {
    if (!user || challenge.direction !== 'outgoing') return;

    try {
      setLoading(true);
      console.log('📥 Loading response for challenge:', challenge.id, 'by user:', user.uid);
      
      // ✅ CRITICAL: Ensure Firebase is ready
      const safeDb = await ensureFirebaseReady();
      
      // ✅ SAFE: Query with safe Firebase operation
      const responseData = await safeFirestoreOperation(async () => {
        const responsesRef = collection(safeDb, 'challenge_responses');
        const responseQuery = query(
          responsesRef,
          where('challengeId', '==', challenge.id),
          where('challengeCreatorId', '==', user.uid),
          where('status', '==', 'pending')
        );

        return await getDocs(responseQuery);
      });

      if (responseData && !responseData.empty) {
        const responseDoc = responseData.docs[0];
        const responseDataObj = { id: responseDoc.id, ...responseDoc.data() };
        console.log('✅ Found challenge response:', responseDataObj);
        setChallengeResponse(responseDataObj);
      } else {
        console.log('⚠️ No pending response found, trying alternative query...');
        setChallengeResponse(null);
        
        // ✅ FALLBACK: Try alternative query if primary fails
        try {
          const fallbackData = await safeFirestoreOperation(async () => {
            const responsesRef = collection(safeDb, 'challenge_responses');
            const simpleQuery = query(responsesRef, where('challengeId', '==', challenge.id));
            return await getDocs(simpleQuery);
          });
          
          if (fallbackData) {
            const pendingResponses = [];
            fallbackData.forEach(doc => {
              const data = doc.data();
              if (data.status === 'pending' && data.challengeCreatorId === user.uid) {
                pendingResponses.push({ id: doc.id, ...data });
              }
            });
            
            if (pendingResponses.length > 0) {
              console.log('✅ Found response via fallback query');
              setChallengeResponse(pendingResponses[0]);
            } else {
              setChallengeResponse(null);
            }
          }
        } catch (fallbackError) {
          console.error('❌ Fallback query also failed:', fallbackError);
          setChallengeResponse(null);
        }
      }
      
    } catch (error) {
      console.error('❌ Error loading challenge response:', error);
      setChallengeResponse(null);
      
      // Don't show error for permission issues - they're expected
      if (error.code !== 'permission-denied' && error.code !== 'failed-precondition') {
        console.error('❌ Unexpected error loading challenge response:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [challenge.id, user]);

  // ✅ SAFE: Load my video response with Firebase safety
  const loadMyVideoResponse = useCallback(async () => {
    if (!user || challenge.direction !== 'incoming') return;

    try {
      console.log('📹 Loading my video response for challenge:', challenge.id);
      
      // ✅ CRITICAL: Ensure Firebase is ready
      const safeDb = await ensureFirebaseReady();
      
      // ✅ SAFE: Query with safe Firebase operation
      const responseData = await safeFirestoreOperation(async () => {
        const responsesRef = collection(safeDb, 'challenge_responses');
        const myResponseQuery = query(
          responsesRef,
          where('challengeId', '==', challenge.id),
          where('responderId', '==', user.uid)
        );

        return await getDocs(myResponseQuery);
      });

      if (responseData && !responseData.empty) {
        const responseDoc = responseData.docs[0];
        const responseDataObj = { id: responseDoc.id, ...responseDoc.data() };
        console.log('✅ Found my video response:', responseDataObj);
        setMyVideoResponse(responseDataObj);
      } else {
        console.log('⚠️ No video response found for user');
        setMyVideoResponse(null);
      }
      
    } catch (error) {
      console.error('❌ Error loading my video response:', error);
      setMyVideoResponse(null);
    }
  }, [challenge.id, user]);

  // ✅ SAFE: Load both responses with error handling
  const loadAllResponses = useCallback(async () => {
    try {
      setLoading(true);
      
      // ✅ CRITICAL: Ensure Firebase is ready before any operations
      await ensureFirebaseReady();
      
      // Load both types of responses
      await Promise.all([
        loadChallengeResponse(),
        loadMyVideoResponse()
      ]);
      
    } catch (error) {
      console.error('❌ Error loading all responses:', error);
    } finally {
      setLoading(false);
    }
  }, [loadChallengeResponse, loadMyVideoResponse]);

  // ✅ SAFE: Refresh data with Firebase safety
  const refreshResponses = useCallback(async () => {
    console.log('🔄 Refreshing challenge response data...');
    await loadAllResponses();
  }, [loadAllResponses]);

  // ✅ SAFE: Clear responses
  const clearResponses = useCallback(() => {
    console.log('🧹 Clearing challenge response data...');
    setChallengeResponse(null);
    setMyVideoResponse(null);
  }, []);

  // ✅ NEW: Get response status summary
  const getResponseStatus = useCallback(() => {
    return {
      hasOutgoingResponse: !!challengeResponse,
      hasIncomingResponse: !!myVideoResponse,
      outgoingStatus: challengeResponse?.status || null,
      incomingStatus: myVideoResponse?.status || null,
      isLoading: loading
    };
  }, [challengeResponse, myVideoResponse, loading]);

  return {
    // State
    challengeResponse,
    setChallengeResponse,
    myVideoResponse,
    setMyVideoResponse,
    loading,
    
    // Actions
    loadChallengeResponse,
    loadMyVideoResponse,
    loadAllResponses,
    refreshResponses,
    clearResponses,
    
    // Utilities
    getResponseStatus
  };
};