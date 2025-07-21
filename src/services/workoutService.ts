// services/workoutService.ts - FIXED: Uses async Firebase initialization
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import {
  WorkoutEntry,
  WorkoutType
} from '../types/workoutTypes';

// Async function to get Firebase instances when needed
const getFirebaseInstances = async () => {
  const { getAuth, getDb } = await import('../../firebase');
  const auth = await getAuth();
  const db = await getDb();
  return { auth, db };
};

/**
 * Get all workout entries for the current user
 */
export const getUserWorkouts = async (): Promise<WorkoutEntry[]> => {
  try {
    const { auth, db } = await getFirebaseInstances();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const workoutsRef = collection(db, 'users', user.uid, 'workouts');
    const q = query(workoutsRef, orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const workouts: WorkoutEntry[] = [];
    querySnapshot.forEach((doc) => {
      workouts.push({
        id: doc.id,
        ...doc.data()
      } as WorkoutEntry);
    });
    
    return workouts;
  } catch (error) {
    console.error('Error getting workouts:', error);
    throw error;
  }
};

/**
 * Get filtered workout entries
 */
export const getFilteredWorkouts = async (
  dateFrom?: string,
  dateTo?: string,
  workoutType?: WorkoutType,
  muscleGroup?: string,
  exercise?: string
): Promise<WorkoutEntry[]> => {
  try {
    const { auth, db } = await getFirebaseInstances();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const workoutsRef = collection(db, 'users', user.uid, 'workouts');
    let q = query(workoutsRef, orderBy('date', 'desc'));
    
    // Apply date filters
    if (dateFrom) {
      q = query(q, where('date', '>=', dateFrom));
    }
    
    if (dateTo) {
      q = query(q, where('date', '<=', dateTo));
    }
    
    // Apply workout type filter
    if (workoutType) {
      q = query(q, where('type', '==', workoutType));
    }
    
    const querySnapshot = await getDocs(q);
    
    let workouts: WorkoutEntry[] = [];
    querySnapshot.forEach((doc) => {
      workouts.push({
        id: doc.id,
        ...doc.data()
      } as WorkoutEntry);
    });
    
    // Apply muscle group filter (client-side)
    if (muscleGroup) {
      workouts = workouts.filter(workout => 
        workout.muscleGroups.includes(muscleGroup)
      );
    }
    
    // Apply exercise filter (client-side)
    if (exercise) {
      workouts = workouts.filter(workout => 
        workout.exercises.some(ex => 
          ex.name.toLowerCase().includes(exercise.toLowerCase())
        )
      );
    }
    
    return workouts;
  } catch (error) {
    console.error('Error getting filtered workouts:', error);
    throw error;
  }
};

/**
 * Get a single workout by ID
 */
export const getWorkout = async (workoutId: string): Promise<WorkoutEntry | null> => {
  try {
    const { auth, db } = await getFirebaseInstances();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const workoutRef = doc(db, 'users', user.uid, 'workouts', workoutId);
    const workoutDoc = await getDoc(workoutRef);
    
    if (workoutDoc.exists()) {
      return {
        id: workoutDoc.id,
        ...workoutDoc.data()
      } as WorkoutEntry;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting workout:', error);
    throw error;
  }
};

/**
 * Add a new workout entry
 */
export const addWorkout = async (workout: Omit<WorkoutEntry, 'id'>): Promise<string> => {
  try {
    const { auth, db } = await getFirebaseInstances();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const workoutsRef = collection(db, 'users', user.uid, 'workouts');
    const docRef = await addDoc(workoutsRef, {
      ...workout,
      userId: user.uid,
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding workout:', error);
    throw error;
  }
};

/**
 * Update an existing workout
 */
export const updateWorkout = async (
  workoutId: string, 
  workout: Partial<WorkoutEntry>
): Promise<void> => {
  try {
    const { auth, db } = await getFirebaseInstances();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const workoutRef = doc(db, 'users', user.uid, 'workouts', workoutId);
    await updateDoc(workoutRef, {
      ...workout,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating workout:', error);
    throw error;
  }
};

/**
 * Delete a workout
 */
export const deleteWorkout = async (workoutId: string): Promise<void> => {
  try {
    const { auth, db } = await getFirebaseInstances();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const workoutRef = doc(db, 'users', user.uid, 'workouts', workoutId);
    await deleteDoc(workoutRef);
  } catch (error) {
    console.error('Error deleting workout:', error);
    throw error;
  }
};

/**
 * Get recent workouts (last 7 days)
 */
export const getRecentWorkouts = async (): Promise<WorkoutEntry[]> => {
  try {
    const { auth, db } = await getFirebaseInstances();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
    
    const workoutsRef = collection(db, 'users', user.uid, 'workouts');
    const q = query(
      workoutsRef, 
      where('date', '>=', sevenDaysAgoStr),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const workouts: WorkoutEntry[] = [];
    querySnapshot.forEach((doc) => {
      workouts.push({
        id: doc.id,
        ...doc.data()
      } as WorkoutEntry);
    });
    
    return workouts;
  } catch (error) {
    console.error('Error getting recent workouts:', error);
    throw error;
  }
};