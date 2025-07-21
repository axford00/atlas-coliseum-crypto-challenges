// src/hooks/useAuth.js
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { auth, db } from '../../firebase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [profileComplete, setProfileComplete] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const checkUserProfile = async (user) => {
      if (!user) {
        setInitializing(false);
        return;
      }

      try {
        // Check if user has completed profile setup
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Check if required profile fields exist
          const isProfileComplete =
            userData.name &&
            userData.gender &&
            userData.age &&
            userData.fitnessGoals &&
            userData.workoutsPerWeek;
            
          setProfileComplete(isProfileComplete);
        } else {
          // No user document exists yet
          setProfileComplete(false);
        }
      } catch (error) {
        console.error('Error checking user profile:', error);
        setAuthError(error.message);
        // Default to complete if there's an error
        setProfileComplete(true);
      }

      setInitializing(false);
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        checkUserProfile(user);
      } else {
        setInitializing(false);
      }
    });

    return unsubscribe;
  }, []);

  return { user, initializing, profileComplete, authError };
}