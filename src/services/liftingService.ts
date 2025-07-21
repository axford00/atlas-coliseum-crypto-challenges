import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  Timestamp 
} from 'firebase/firestore';
import { app } from '../../firebase';
import { 
  LiftingRecords, 
  DEFAULT_LIFTING_RECORDS, 
  LiftRecord 
} from '../types/liftingTypes';

const db = getFirestore(app);
const auth = getAuth(app);

/**
 * Get the current user's lifting records
 */
export const getUserLiftingRecords = async (): Promise<LiftingRecords> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const docRef = doc(db, 'liftingRecords', user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as LiftingRecords;
    } else {
      // Initialize with default records if none exist
      await setDoc(docRef, DEFAULT_LIFTING_RECORDS);
      return DEFAULT_LIFTING_RECORDS;
    }
  } catch (error) {
    console.error('Error getting lifting records:', error);
    throw error;
  }
};

/**
 * Save the user's lifting records
 */
export const saveLiftingRecords = async (records: LiftingRecords): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const docRef = doc(db, 'liftingRecords', user.uid);
    await setDoc(docRef, records);
  } catch (error) {
    console.error('Error saving lifting records:', error);
    throw error;
  }
};

/**
 * Add a new lift record to a specific lift
 */
export const addLiftRecord = async (
  category: keyof LiftingRecords,
  liftName: string,
  record: LiftRecord
): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const docRef = doc(db, 'liftingRecords', user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Update the specific lift array
      await updateDoc(docRef, {
        [`${category}.${liftName}`]: arrayUnion(record)
      });
    } else {
      // Create new document with default records and add the new record
      const newRecords = { ...DEFAULT_LIFTING_RECORDS };
      
      // Make sure the category and lift exist
      if (!newRecords[category][liftName]) {
        newRecords[category][liftName] = [];
      }
      
      newRecords[category][liftName].push(record);
      await setDoc(docRef, newRecords);
    }
  } catch (error) {
    console.error('Error adding lift record:', error);
    throw error;
  }
};

/**
 * Add a new custom lift type
 */
export const addCustomLift = async (liftName: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const docRef = doc(db, 'liftingRecords', user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Check if the custom lift already exists
      const records = docSnap.data() as LiftingRecords;
      if (records.customLifts && records.customLifts[liftName]) {
        return; // Lift already exists, no need to add it
      }
      
      // Add the new custom lift
      await updateDoc(docRef, {
        [`customLifts.${liftName}`]: []
      });
    } else {
      // Create new document with default records and add the new custom lift
      const newRecords = { ...DEFAULT_LIFTING_RECORDS };
      newRecords.customLifts[liftName] = [];
      await setDoc(docRef, newRecords);
    }
  } catch (error) {
    console.error('Error adding custom lift:', error);
    throw error;
  }
};
