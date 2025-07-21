// services/mealService.ts - FIXED: Uses async Firebase initialization
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
  MealEntry,
  MealType
} from '../types/mealTypes';
import { getRecentWorkouts } from './workoutService';

// Async function to get Firebase instances when needed
const getFirebaseInstances = async () => {
  const { getAuth, getDb } = await import('../../firebase');
  const auth = await getAuth();
  const db = await getDb();
  return { auth, db };
};

/**
 * Get all meal entries for the current user
 */
export const getUserMeals = async (): Promise<MealEntry[]> => {
  try {
    const { auth, db } = await getFirebaseInstances();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const mealsRef = collection(db, 'users', user.uid, 'meals');
    const q = query(mealsRef, orderBy('date', 'desc'), orderBy('time', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const meals: MealEntry[] = [];
    querySnapshot.forEach((doc) => {
      meals.push({
        id: doc.id,
        ...doc.data()
      } as MealEntry);
    });
    
    return meals;
  } catch (error) {
    console.error('Error getting meals:', error);
    throw error;
  }
};

/**
 * Get filtered meal entries
 */
export const getFilteredMeals = async (
  dateFrom?: string,
  dateTo?: string,
  mealType?: MealType,
  tag?: string,
  postWorkout?: boolean
): Promise<MealEntry[]> => {
  try {
    const { auth, db } = await getFirebaseInstances();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const mealsRef = collection(db, 'users', user.uid, 'meals');
    let q = query(mealsRef, orderBy('date', 'desc'), orderBy('time', 'desc'));
    
    // Apply date filters
    if (dateFrom) {
      q = query(q, where('date', '>=', dateFrom));
    }
    
    if (dateTo) {
      q = query(q, where('date', '<=', dateTo));
    }
    
    // Apply meal type filter
    if (mealType) {
      q = query(q, where('mealType', '==', mealType));
    }
    
    // Apply post-workout filter
    if (postWorkout !== undefined) {
      q = query(q, where('postWorkout', '==', postWorkout));
    }
    
    const querySnapshot = await getDocs(q);
    
    let meals: MealEntry[] = [];
    querySnapshot.forEach((doc) => {
      meals.push({
        id: doc.id,
        ...doc.data()
      } as MealEntry);
    });
    
    // Apply tag filter (client-side)
    if (tag) {
      meals = meals.filter(meal => 
        meal.tags && meal.tags.includes(tag)
      );
    }
    
    return meals;
  } catch (error) {
    console.error('Error getting filtered meals:', error);
    throw error;
  }
};

/**
 * Get a single meal by ID
 */
export const getMeal = async (mealId: string): Promise<MealEntry | null> => {
  try {
    const { auth, db } = await getFirebaseInstances();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const mealRef = doc(db, 'users', user.uid, 'meals', mealId);
    const mealDoc = await getDoc(mealRef);
    
    if (mealDoc.exists()) {
      return {
        id: mealDoc.id,
        ...mealDoc.data()
      } as MealEntry;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting meal:', error);
    throw error;
  }
};

/**
 * Add a new meal entry
 */
export const addMeal = async (meal: Omit<MealEntry, 'id'>): Promise<string> => {
  try {
    const { auth, db } = await getFirebaseInstances();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const mealsRef = collection(db, 'users', user.uid, 'meals');
    const docRef = await addDoc(mealsRef, meal);
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding meal:', error);
    throw error;
  }
};

/**
 * Update an existing meal
 */
export const updateMeal = async (
  mealId: string, 
  meal: Partial<MealEntry>
): Promise<void> => {
  try {
    const { auth, db } = await getFirebaseInstances();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const mealRef = doc(db, 'users', user.uid, 'meals', mealId);
    await updateDoc(mealRef, {
      ...meal,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating meal:', error);
    throw error;
  }
};

/**
 * Delete a meal
 */
export const deleteMeal = async (mealId: string): Promise<void> => {
  try {
    const { auth, db } = await getFirebaseInstances();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const mealRef = doc(db, 'users', user.uid, 'meals', mealId);
    await deleteDoc(mealRef);
  } catch (error) {
    console.error('Error deleting meal:', error);
    throw error;
  }
};

/**
 * Get meals for a specific date
 */
export const getMealsByDate = async (date: string): Promise<MealEntry[]> => {
  try {
    const { auth, db } = await getFirebaseInstances();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const mealsRef = collection(db, 'users', user.uid, 'meals');
    const q = query(
      mealsRef, 
      where('date', '==', date),
      orderBy('time', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const meals: MealEntry[] = [];
    querySnapshot.forEach((doc) => {
      meals.push({
        id: doc.id,
        ...doc.data()
      } as MealEntry);
    });
    
    return meals;
  } catch (error) {
    console.error('Error getting meals by date:', error);
    throw error;
  }
};

/**
 * Get recent meals (last 7 days)
 */
export const getRecentMeals = async (): Promise<MealEntry[]> => {
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
    
    const mealsRef = collection(db, 'users', user.uid, 'meals');
    const q = query(
      mealsRef, 
      where('date', '>=', sevenDaysAgoStr),
      orderBy('date', 'desc'),
      orderBy('time', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const meals: MealEntry[] = [];
    querySnapshot.forEach((doc) => {
      meals.push({
        id: doc.id,
        ...doc.data()
      } as MealEntry);
    });
    
    return meals;
  } catch (error) {
    console.error('Error getting recent meals:', error);
    throw error;
  }
};

/**
 * Check if user worked out today
 */
export const didWorkoutToday = async (): Promise<boolean> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const recentWorkouts = await getRecentWorkouts();
    
    return recentWorkouts.some(workout => workout.date === today);
  } catch (error) {
    console.error('Error checking if user worked out today:', error);
    return false;
  }
};

/**
 * Get user's dietary preferences from profile
 */
export const getUserDietaryPreferences = async (): Promise<string[]> => {
  try {
    const { auth, db } = await getFirebaseInstances();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists() && userDoc.data().dietaryPreferences) {
      return userDoc.data().dietaryPreferences;
    }
    
    return [];
  } catch (error) {
    console.error('Error getting user dietary preferences:', error);
    return [];
  }
};