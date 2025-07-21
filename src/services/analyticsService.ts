import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../../firebase';
import { 
  WorkoutEntry, 
  WorkoutExercise,
  determineMuscleGroups
} from '../types/workoutTypes';
import { 
  MealEntry,
  MacroNutrients
} from '../types/mealTypes';
import { getUserWorkouts } from './workoutService';
import { getUserMeals } from './mealService';

const db = getFirestore(app);
const auth = getAuth(app);

// Interface for user profile data
interface UserProfile {
  name?: string;
  gender?: string;
  age?: number;
  fitnessGoals?: string;
  workoutsPerWeek?: number;
  experience?: string;
  weight?: number; // in kg
  height?: number; // in cm
  dietaryPreferences?: string[];
}

// Interface for workout analytics
export interface WorkoutAnalytics {
  totalWorkouts: number;
  workoutsByType: Record<string, number>;
  workoutFrequency: number; // average workouts per week
  muscleGroupFrequency: Record<string, number>;
  lastWorkedMuscleGroups: Record<string, string>; // muscle group -> date last worked
  missedWorkoutDays: number; // consecutive days without workout
  workoutConsistency: number; // 0-1 score based on adherence to planned schedule
  averageWorkoutDuration: number; // in minutes
  mostCommonExercises: Array<{ name: string; count: number }>;
  leastWorkedMuscleGroups: string[];
  overtrainedMuscleGroups: string[];
}

// Interface for meal analytics
export interface MealAnalytics {
  totalMeals: number;
  averageDailyCalories: number;
  macroDistribution: {
    protein: number; // percentage
    carbs: number; // percentage
    fats: number; // percentage
  };
  postWorkoutNutrition: {
    adequateProtein: boolean;
    adequateCarbs: boolean;
    timelyConsumption: boolean;
  };
  mealConsistency: number; // 0-1 score based on regular meal timing
  commonTags: Array<{ tag: string; count: number }>;
  nutritionAdequacy: {
    protein: 'low' | 'adequate' | 'high';
    calories: 'low' | 'adequate' | 'high';
  };
}

// Interface for combined analytics
export interface FitnessAnalytics {
  workoutAnalytics: WorkoutAnalytics;
  mealAnalytics: MealAnalytics;
  userProfile: UserProfile;
  lastUpdated: string;
}

/**
 * Get comprehensive fitness analytics for the current user
 */
export const getFitnessAnalytics = async (): Promise<FitnessAnalytics> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user profile
    const userProfile = await getUserProfile();
    
    // Get workout and meal data
    const workouts = await getUserWorkouts();
    const meals = await getUserMeals();
    
    // Generate analytics
    const workoutAnalytics = analyzeWorkouts(workouts, userProfile);
    const mealAnalytics = analyzeMeals(meals, workouts, userProfile);
    
    return {
      workoutAnalytics,
      mealAnalytics,
      userProfile,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting fitness analytics:', error);
    throw error;
  }
};

/**
 * Get user profile data
 */
export const getUserProfile = async (): Promise<UserProfile> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }
    
    return userDoc.data() as UserProfile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Analyze workout patterns
 */
const analyzeWorkouts = (
  workouts: WorkoutEntry[], 
  userProfile: UserProfile
): WorkoutAnalytics => {
  // Initialize analytics object
  const analytics: WorkoutAnalytics = {
    totalWorkouts: workouts.length,
    workoutsByType: {},
    workoutFrequency: 0,
    muscleGroupFrequency: {},
    lastWorkedMuscleGroups: {},
    missedWorkoutDays: 0,
    workoutConsistency: 0,
    averageWorkoutDuration: 0,
    mostCommonExercises: [],
    leastWorkedMuscleGroups: [],
    overtrainedMuscleGroups: []
  };
  
  if (workouts.length === 0) {
    return analytics;
  }
  
  // Sort workouts by date (newest first)
  const sortedWorkouts = [...workouts].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  // Calculate workout frequency
  const firstWorkoutDate = new Date(sortedWorkouts[sortedWorkouts.length - 1].date);
  const lastWorkoutDate = new Date(sortedWorkouts[0].date);
  const daysBetween = Math.max(1, Math.round((lastWorkoutDate.getTime() - firstWorkoutDate.getTime()) / (1000 * 60 * 60 * 24)));
  const weeksBetween = Math.max(1, daysBetween / 7);
  analytics.workoutFrequency = workouts.length / weeksBetween;
  
  // Calculate average workout duration
  analytics.averageWorkoutDuration = workouts.reduce((sum, workout) => sum + workout.duration, 0) / workouts.length;
  
  // Count workouts by type
  workouts.forEach(workout => {
    analytics.workoutsByType[workout.type] = (analytics.workoutsByType[workout.type] || 0) + 1;
  });
  
  // Analyze muscle group frequency and last worked date
  const muscleGroupWorkouts: Record<string, string[]> = {};
  const exerciseCounts: Record<string, number> = {};
  
  workouts.forEach(workout => {
    // Count exercises
    workout.exercises.forEach(exercise => {
      exerciseCounts[exercise.name] = (exerciseCounts[exercise.name] || 0) + 1;
    });
    
    // Track muscle groups
    workout.muscleGroups.forEach(group => {
      if (!muscleGroupWorkouts[group]) {
        muscleGroupWorkouts[group] = [];
      }
      muscleGroupWorkouts[group].push(workout.date);
      
      // Update last worked date
      if (!analytics.lastWorkedMuscleGroups[group] || 
          workout.date > analytics.lastWorkedMuscleGroups[group]) {
        analytics.lastWorkedMuscleGroups[group] = workout.date;
      }
    });
  });
  
  // Calculate muscle group frequency
  Object.keys(muscleGroupWorkouts).forEach(group => {
    analytics.muscleGroupFrequency[group] = muscleGroupWorkouts[group].length;
  });
  
  // Get most common exercises
  analytics.mostCommonExercises = Object.entries(exerciseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
  
  // Calculate missed workout days
  const today = new Date();
  const lastWorkout = sortedWorkouts[0];
  const daysSinceLastWorkout = Math.round((today.getTime() - new Date(lastWorkout.date).getTime()) / (1000 * 60 * 60 * 24));
  
  // If user plans to work out X times per week, they should work out every 7/X days
  const expectedWorkoutInterval = userProfile.workoutsPerWeek ? 7 / userProfile.workoutsPerWeek : 2;
  analytics.missedWorkoutDays = Math.max(0, daysSinceLastWorkout - expectedWorkoutInterval);
  
  // Calculate workout consistency
  // 1.0 means perfect adherence to planned schedule
  const expectedWorkouts = weeksBetween * (userProfile.workoutsPerWeek || 3);
  analytics.workoutConsistency = Math.min(1, workouts.length / expectedWorkouts);
  
  // Identify least worked muscle groups
  const allMuscleGroups = [
    'chest', 'back', 'shoulders', 'biceps', 'triceps', 
    'quads', 'hamstrings', 'glutes', 'calves', 'abs', 'obliques'
  ];
  
  const muscleGroupFrequencyArray = allMuscleGroups.map(group => ({
    group,
    frequency: analytics.muscleGroupFrequency[group] || 0
  }));
  
  analytics.leastWorkedMuscleGroups = muscleGroupFrequencyArray
    .sort((a, b) => a.frequency - b.frequency)
    .slice(0, 3)
    .map(item => item.group);
  
  // Identify potentially overtrained muscle groups
  // A muscle group is considered overtrained if worked more than 3 times in 7 days
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  
  const recentWorkouts = workouts.filter(workout => 
    new Date(workout.date) >= last7Days
  );
  
  const recentMuscleGroupCounts: Record<string, number> = {};
  
  recentWorkouts.forEach(workout => {
    workout.muscleGroups.forEach(group => {
      recentMuscleGroupCounts[group] = (recentMuscleGroupCounts[group] || 0) + 1;
    });
  });
  
  analytics.overtrainedMuscleGroups = Object.entries(recentMuscleGroupCounts)
    .filter(([_, count]) => count > 3)
    .map(([group]) => group);
  
  return analytics;
};

/**
 * Analyze meal patterns
 */
const analyzeMeals = (
  meals: MealEntry[], 
  workouts: WorkoutEntry[],
  userProfile: UserProfile
): MealAnalytics => {
  // Initialize analytics object
  const analytics: MealAnalytics = {
    totalMeals: meals.length,
    averageDailyCalories: 0,
    macroDistribution: {
      protein: 0,
      carbs: 0,
      fats: 0
    },
    postWorkoutNutrition: {
      adequateProtein: false,
      adequateCarbs: false,
      timelyConsumption: false
    },
    mealConsistency: 0,
    commonTags: [],
    nutritionAdequacy: {
      protein: 'low',
      calories: 'low'
    }
  };
  
  if (meals.length === 0) {
    return analytics;
  }
  
  // Group meals by date
  const mealsByDate: Record<string, MealEntry[]> = {};
  
  meals.forEach(meal => {
    if (!mealsByDate[meal.date]) {
      mealsByDate[meal.date] = [];
    }
    mealsByDate[meal.date].push(meal);
  });
  
  // Calculate average daily calories
  let totalCalories = 0;
  let daysWithMeals = 0;
  
  Object.values(mealsByDate).forEach(dayMeals => {
    daysWithMeals++;
    const dailyCalories = dayMeals.reduce((sum, meal) => 
      sum + (meal.macros?.calories || 0), 0);
    totalCalories += dailyCalories;
  });
  
  analytics.averageDailyCalories = daysWithMeals > 0 ? totalCalories / daysWithMeals : 0;
  
  // Calculate macro distribution
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFats = 0;
  
  meals.forEach(meal => {
    if (meal.macros) {
      totalProtein += meal.macros.protein || 0;
      totalCarbs += meal.macros.carbs || 0;
      totalFats += meal.macros.fats || 0;
    }
  });
  
  const totalMacros = totalProtein + totalCarbs + totalFats;
  
  if (totalMacros > 0) {
    analytics.macroDistribution = {
      protein: (totalProtein / totalMacros) * 100,
      carbs: (totalCarbs / totalMacros) * 100,
      fats: (totalFats / totalMacros) * 100
    };
  }
  
  // Analyze post-workout nutrition
  const workoutDates = new Set(workouts.map(workout => workout.date));
  const postWorkoutMeals = meals.filter(meal => 
    workoutDates.has(meal.date) && meal.postWorkout
  );
  
  if (postWorkoutMeals.length > 0) {
    // Check if post-workout meals have adequate protein (at least 20g)
    const adequateProteinCount = postWorkoutMeals.filter(meal => 
      (meal.macros?.protein || 0) >= 20
    ).length;
    
    // Check if post-workout meals have adequate carbs (at least 30g)
    const adequateCarbsCount = postWorkoutMeals.filter(meal => 
      (meal.macros?.carbs || 0) >= 30
    ).length;
    
    analytics.postWorkoutNutrition = {
      adequateProtein: adequateProteinCount / postWorkoutMeals.length >= 0.7,
      adequateCarbs: adequateCarbsCount / postWorkoutMeals.length >= 0.7,
      timelyConsumption: postWorkoutMeals.length / workouts.length >= 0.7
    };
  }
  
  // Analyze meal consistency
  // Check if meals are eaten at consistent times
  const mealTimeConsistency: Record<string, number[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: []
  };
  
  meals.forEach(meal => {
    const [hours, minutes] = meal.time.split(':').map(Number);
    const timeInMinutes = hours * 60 + minutes;
    mealTimeConsistency[meal.mealType].push(timeInMinutes);
  });
  
  let consistencyScore = 0;
  let mealTypesWithData = 0;
  
  Object.values(mealTimeConsistency).forEach(times => {
    if (times.length >= 3) {
      mealTypesWithData++;
      
      // Calculate standard deviation of meal times
      const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
      const variance = times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / times.length;
      const stdDev = Math.sqrt(variance);
      
      // Lower standard deviation means more consistent timing
      // 60 minutes (1 hour) standard deviation is considered reasonably consistent
      const timeConsistency = Math.max(0, Math.min(1, 60 / (stdDev || 60)));
      consistencyScore += timeConsistency;
    }
  });
  
  analytics.mealConsistency = mealTypesWithData > 0 ? consistencyScore / mealTypesWithData : 0;
  
  // Analyze common tags
  const tagCounts: Record<string, number> = {};
  
  meals.forEach(meal => {
    if (meal.tags) {
      meal.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });
  
  analytics.commonTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));
  
  // Evaluate nutrition adequacy
  // Calculate target protein based on weight (if available) or default to 100g
  const targetProtein = userProfile.weight ? userProfile.weight * 1.6 : 100; // 1.6g per kg of bodyweight
  const avgProtein = totalProtein / daysWithMeals;
  
  if (avgProtein < targetProtein * 0.7) {
    analytics.nutritionAdequacy.protein = 'low';
  } else if (avgProtein < targetProtein * 1.2) {
    analytics.nutritionAdequacy.protein = 'adequate';
  } else {
    analytics.nutritionAdequacy.protein = 'high';
  }
  
  // Calculate target calories
  const targetCalories = calculateTargetCalories(userProfile);
  
  if (analytics.averageDailyCalories < targetCalories * 0.8) {
    analytics.nutritionAdequacy.calories = 'low';
  } else if (analytics.averageDailyCalories < targetCalories * 1.2) {
    analytics.nutritionAdequacy.calories = 'adequate';
  } else {
    analytics.nutritionAdequacy.calories = 'high';
  }
  
  return analytics;
};

/**
 * Calculate target calories based on user profile
 */
const calculateTargetCalories = (profile: UserProfile): number => {
  // Default to 2000 calories if not enough information
  if (!profile.weight || !profile.height || !profile.age || !profile.gender) {
    return 2000;
  }
  
  // Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
  let bmr = 0;
  
  if (profile.gender.toLowerCase() === 'male') {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
  } else {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
  }
  
  // Adjust based on activity level (estimated from workouts per week)
  let activityMultiplier = 1.2; // Sedentary
  
  if (profile.workoutsPerWeek) {
    if (profile.workoutsPerWeek >= 1 && profile.workoutsPerWeek <= 2) {
      activityMultiplier = 1.375; // Lightly active
    } else if (profile.workoutsPerWeek >= 3 && profile.workoutsPerWeek <= 5) {
      activityMultiplier = 1.55; // Moderately active
    } else if (profile.workoutsPerWeek > 5) {
      activityMultiplier = 1.725; // Very active
    }
  }
  
  // Calculate Total Daily Energy Expenditure (TDEE)
  let tdee = bmr * activityMultiplier;
  
  // Adjust based on fitness goals
  if (profile.fitnessGoals) {
    if (profile.fitnessGoals.toLowerCase().includes('weight loss')) {
      tdee -= 500; // Caloric deficit for weight loss
    } else if (profile.fitnessGoals.toLowerCase().includes('muscle gain')) {
      tdee += 300; // Caloric surplus for muscle gain
    }
  }
  
  return Math.round(tdee);
};
