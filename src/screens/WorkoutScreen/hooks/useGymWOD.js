// src/screens/WorkoutScreen/hooks/useGymWOD.js
import { getAuth } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import aiService from '../../../services/aiService';

export const useGymWOD = () => {
  const [gymWOD, setGymWOD] = useState(null);
  const [loadingGymWOD, setLoadingGymWOD] = useState(false);
  const [gymInfo, setGymInfo] = useState(null);

  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    loadGymWOD();
  }, []);

  const loadGymWOD = async () => {
    try {
      setLoadingGymWOD(true);
      
      const user = auth.currentUser;
      if (!user) {
        console.log('No authenticated user found');
        return;
      }

      console.log('Loading gym WOD for user:', user.uid);

      // Get user's gym from their profile
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        console.log('User document does not exist');
        return;
      }

      const userData = userDoc.data();
      console.log('User data loaded:', userData);

      const gymName = extractGymFromProfile(userData.profileDescription || '');
      
      if (!gymName) {
        console.log('❌ No gym found in user profile.');
        return;
      }

      console.log('🏋️ Successfully extracted gym name:', gymName);
      setGymInfo({ name: gymName, location: userData.location || '' });

      // Fetch WOD from backend
      const backendUrl = aiService.backendUrl || 'http://localhost:3000';
      console.log('Fetching WOD from backend:', backendUrl);

      const response = await fetch(`${backendUrl}/api/gym/wod`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gymName: gymName,
          location: userData.location || '',
          requestTime: new Date().toISOString(),
          requireCurrent: false, // CHANGED: Allow recent WODs (today + yesterday)
          allowFallback: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Gym WOD response:', data);
      
      if (data.success && data.wod) {
        // RELAXED: Accept current and recent WODs (today + yesterday)
        if (data.wod.isCurrent || data.wod.isRecent || data.wod.daysDiff <= 1 || data.wod.source === 'generated') {
          setGymWOD(data.wod);
          console.log('✅ Gym WOD loaded successfully');
        } else {
          console.log('❌ WOD too old, skipping');
        }
      } else {
        console.log('No WOD available from gym');
      }

    } catch (error) {
      console.error('Error loading gym WOD:', error);
    } finally {
      setLoadingGymWOD(false);
    }
  };

  const extractGymFromProfile = (profileText) => {
    if (!profileText) return null;
    
    const lowerProfile = profileText.toLowerCase();
    console.log('🔍 Analyzing profile text for gym:', profileText);
    
    // Enhanced gym patterns with better boundary detection
    const gymPatterns = [
      // CrossFit specific patterns
      {
        pattern: /(?:i\s+(?:go\s+to|train\s+at|work\s+out\s+at|am\s+a\s+member\s+of))\s+(crossfit\s+[a-z\s]{1,25}?)(?:\s+(?:to|for|because|where|and|gym|fitness|center|to\s+get|for\s+my)|\.|,|!|\?|$)/i,
        type: 'crossfit',
        group: 1
      },
      {
        pattern: /(?:my\s+gym\s+is)\s+(crossfit\s+[a-z\s]{1,25}?)(?:\s+(?:to|for|because|where|and|gym|fitness|center|to\s+get|for\s+my)|\.|,|!|\?|$)/i,
        type: 'crossfit',
        group: 1
      },
      {
        pattern: /(crossfit\s+[a-z\s]{1,25}?)(?:\s+(?:to|for|because|where|and|gym|fitness|center|is|was|to\s+get|for\s+my)|\.|,|!|\?|$)/i,
        type: 'crossfit',
        group: 1
      },
      // Enhanced existing patterns
      /(?:i\s+(?:go\s+to|train\s+at|work\s+out\s+at|am\s+a\s+member\s+of))\s+([^.!?]+?)(?:\s+(?:to\s+get|for\s+my|to|for|because|where|and)|\.|,|!|\?|$)/i,
      /(?:my\s+gym\s+is)\s+([^.!?]+?)(?:\s+(?:to\s+get|for\s+my|to|for|because|where|and)|\.|,|!|\?|$)/i,
      /(?:gym|fitness|crossfit|f45|orangetheory):\s*([^.!?]+?)(?:\s+(?:to\s+get|for\s+my|to|for|because|where|and)|\.|,|!|\?|$)/i,
      /crossfit\s+([^.!?,]+?)(?:\s+(?:to\s+get|for\s+my|to|for|because|where|and)|\.|,|!|\?|$)/i,
      /(?:i\s+do\s+crossfit\s+at)\s+([^.!?]+?)(?:\s+(?:to\s+get|for\s+my|to|for|because|where|and)|\.|,|!|\?|$)/i,
      /f45\s+([^.!?,]+?)(?:\s+(?:to\s+get|for\s+my|to|for|because|where|and)|\.|,|!|\?|$)/i,
      /orangetheory\s+([^.!?,]+?)(?:\s+(?:to\s+get|for\s+my|to|for|because|where|and)|\.|,|!|\?|$)/i,
      /otf\s+([^.!?,]+?)(?:\s+(?:to\s+get|for\s+my|to|for|because|where|and)|\.|,|!|\?|$)/i,
      /(?:at|@)\s+([^.!?,]*(?:gym|fitness|crossfit|f45|orangetheory)[^.!?,]*)(?:\s+(?:to\s+get|for\s+my|to|for|because|where|and)|\.|,|!|\?|$)/i
    ];

    for (const pattern of gymPatterns) {
      const match = profileText.match(pattern);
      if (match && match[1]) {
        let gymName = match[1].trim();
        
        // Clean up the extracted name
        gymName = cleanGymName(gymName);
        
        if (gymName && gymName.length >= 3) {
          console.log(`✅ Extracted gym name: "${gymName}" from pattern match`);
          return gymName;
        }
      }
    }

    // Fallback: Look for exact known gym matches
    const knownGymChains = [
      { patterns: ['crossfit south brooklyn', 'cf south brooklyn', 'cfsbk'], clean: 'CrossFit South Brooklyn' },
      { patterns: ['crossfit williamsburg', 'cf williamsburg'], clean: 'CrossFit Williamsburg' },
      { patterns: ['crossfit nyc', 'cf nyc'], clean: 'CrossFit NYC' },
      { patterns: ['crossfit queens', 'cf queens'], clean: 'CrossFit Queens' },
      { patterns: ['crossfit prospect heights'], clean: 'CrossFit Prospect Heights' },
      { patterns: ['crossfit battery park'], clean: 'CrossFit Battery Park' },
      { patterns: ['planet fitness'], clean: 'Planet Fitness' },
      { patterns: ['la fitness'], clean: 'LA Fitness' },
      { patterns: ['gold\'s gym', 'golds gym'], clean: 'Gold\'s Gym' },
      { patterns: ['equinox'], clean: 'Equinox' },
      { patterns: ['f45'], clean: 'F45' },
      { patterns: ['orangetheory', 'otf'], clean: 'OrangeTheory' },
      { patterns: ['barry\'s bootcamp', 'barrys bootcamp'], clean: 'Barry\'s Bootcamp' },
      { patterns: ['soulcycle'], clean: 'SoulCycle' }
    ];

    for (const gymChain of knownGymChains) {
      for (const pattern of gymChain.patterns) {
        if (lowerProfile.includes(pattern)) {
          console.log(`✅ Found known gym chain: "${gymChain.clean}"`);
          return gymChain.clean;
        }
      }
    }

    console.log('❌ No gym found in profile');
    return null;
  };

  const cleanGymName = (gymName) => {
    if (!gymName) return null;
    
    // Remove common trailing words that indicate purpose rather than name
    const stopPhrases = [
      'to get my exercise',
      'to get exercise', 
      'to work out',
      'to train',
      'to stay fit',
      'for fitness',
      'for training', 
      'for workouts',
      'for exercise',
      'for my exercise',
      'where i go',
      'where i train',
      'where i work out',
      'and i love it',
      'and it\'s great'
    ];
    
    let cleaned = gymName.toLowerCase().trim();
    
    // Remove stop phrases from the end
    for (const stopPhrase of stopPhrases) {
      if (cleaned.endsWith(' ' + stopPhrase)) {
        cleaned = cleaned.replace(' ' + stopPhrase, '').trim();
        console.log(`🧹 Removed phrase "${stopPhrase}": "${cleaned}"`);
      }
    }
    
    // Remove single trailing words
    const trailingWords = ['to', 'for', 'where', 'and', 'or', 'at', 'in', 'on', 'with'];
    const words = cleaned.split(' ');
    
    while (words.length > 1 && trailingWords.includes(words[words.length - 1])) {
      const removed = words.pop();
      console.log(`🧹 Removed trailing word "${removed}"`);
    }
    
    cleaned = words.join(' ');
    
    // Capitalize properly
    cleaned = cleaned.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Handle special cases
    if (cleaned.toLowerCase().startsWith('crossfit')) {
      cleaned = cleaned.replace(/^crossfit/i, 'CrossFit');
    }
    
    if (cleaned.toLowerCase().includes('f45')) {
      cleaned = cleaned.replace(/f45/i, 'F45');
    }
    
    console.log(`🎯 Final cleaned gym name: "${cleaned}"`);
    return cleaned.length >= 3 ? cleaned : null;
  };

  const reloadGymWOD = () => {
    loadGymWOD();
  };

  return {
    gymWOD,
    gymInfo,
    loadingGymWOD,
    reloadGymWOD
  };
};