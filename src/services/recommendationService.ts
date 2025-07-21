import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../../firebase';
import { 
  WorkoutEntry, 
  WorkoutType,
  WorkoutExercise,
  WORKOUT_TYPES
} from '../types/workoutTypes';
import { 
  MealEntry,
  MealType,
  Ingredient,
  MacroNutrients
} from '../types/mealTypes';
import { 
  getFitnessAnalytics, 
  WorkoutAnalytics, 
  MealAnalytics,
  getUserProfile
} from './analyticsService';
import { didWorkoutToday } from './mealService';

const db = getFirestore(app);
const auth = getAuth(app);

// Interface for workout recommendation
export interface WorkoutRecommendation {
  title: string;
  type: WorkoutType;
  muscleGroups: string[];
  exercises: WorkoutExercise[];
  duration: number;
  intensity: 'light' | 'moderate' | 'intense';
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
}

// Interface for meal recommendation
export interface MealRecommendation {
  title: string;
  mealType: MealType;
  ingredients: Ingredient[];
  macros: MacroNutrients;
  tags: string[];
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
}

// Interface for combined recommendations
export interface FitnessRecommendations {
  workoutRecommendations: WorkoutRecommendation[];
  mealRecommendations: MealRecommendation[];
  generalAdvice: string[];
  lastUpdated: string;
}

/**
 * Get personalized fitness recommendations
 */
export const getRecommendations = async (): Promise<FitnessRecommendations> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get analytics data
    const analytics = await getFitnessAnalytics();
    
    // Generate recommendations
    const workoutRecommendations = generateWorkoutRecommendations(
      analytics.workoutAnalytics,
      analytics.userProfile
    );
    
    const mealRecommendations = generateMealRecommendations(
      analytics.mealAnalytics,
      analytics.workoutAnalytics,
      analytics.userProfile
    );
    
    const generalAdvice = generateGeneralAdvice(
      analytics.workoutAnalytics,
      analytics.mealAnalytics,
      analytics.userProfile
    );
    
    return {
      workoutRecommendations,
      mealRecommendations,
      generalAdvice,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting recommendations:', error);
    throw error;
  }
};

/**
 * Generate workout recommendations based on analytics
 */
const generateWorkoutRecommendations = (
  analytics: WorkoutAnalytics,
  userProfile: any
): WorkoutRecommendation[] => {
  const recommendations: WorkoutRecommendation[] = [];
  
  // Recommendation 1: Rest day if overtrained
  if (analytics.overtrainedMuscleGroups.length > 0) {
    recommendations.push({
      title: 'Active Recovery Day',
      type: 'recovery',
      muscleGroups: ['fullBody'],
      exercises: [
        {
          name: 'Light Walking',
          category: 'cardio',
          sets: [{ duration: 1200, completed: false }], // 20 minutes
        },
        {
          name: 'Stretching',
          category: 'recovery',
          sets: [{ duration: 600, completed: false }], // 10 minutes
        },
        {
          name: 'Foam Rolling',
          category: 'recovery',
          sets: [{ duration: 600, completed: false }], // 10 minutes
        }
      ],
      duration: 40,
      intensity: 'light',
      reasoning: `You've been training ${analytics.overtrainedMuscleGroups.join(', ')} frequently. Take a recovery day to prevent overtraining and allow your muscles to recover.`,
      priority: 'high'
    });
  }
  
  // Recommendation 2: Target least worked muscle groups
  if (analytics.leastWorkedMuscleGroups.length > 0) {
    const leastWorkedMuscles = analytics.leastWorkedMuscleGroups;
    
    // Determine workout type based on user goals
    let recommendedType: WorkoutType = 'strength';
    if (userProfile.fitnessGoals) {
      if (userProfile.fitnessGoals.toLowerCase().includes('muscle') || 
          userProfile.fitnessGoals.toLowerCase().includes('size')) {
        recommendedType = 'hypertrophy';
      } else if (userProfile.fitnessGoals.toLowerCase().includes('endurance')) {
        recommendedType = 'endurance';
      } else if (userProfile.fitnessGoals.toLowerCase().includes('weight loss') || 
                userProfile.fitnessGoals.toLowerCase().includes('fat loss')) {
        recommendedType = Math.random() > 0.5 ? 'hiit' : 'cardio';
      }
    }
    
    // Generate exercises based on least worked muscle groups
    const exercises: WorkoutExercise[] = [];
    
    if (leastWorkedMuscles.includes('chest') || leastWorkedMuscles.includes('triceps') || leastWorkedMuscles.includes('shoulders')) {
      exercises.push(
        {
          name: 'Bench Press',
          category: 'strengthLifts',
          sets: Array(4).fill({ weight: 0, reps: recommendedType === 'hypertrophy' ? 10 : 5, completed: false }),
        },
        {
          name: 'Incline Dumbbell Press',
          category: 'strengthLifts',
          sets: Array(3).fill({ weight: 0, reps: recommendedType === 'hypertrophy' ? 12 : 8, completed: false }),
        },
        {
          name: 'Tricep Pushdowns',
          category: 'strengthLifts',
          sets: Array(3).fill({ weight: 0, reps: recommendedType === 'hypertrophy' ? 15 : 10, completed: false }),
        }
      );
    }
    
    if (leastWorkedMuscles.includes('back') || leastWorkedMuscles.includes('biceps')) {
      exercises.push(
        {
          name: 'Pull-Ups',
          category: 'strengthLifts',
          sets: Array(4).fill({ reps: recommendedType === 'hypertrophy' ? 8 : 5, completed: false }),
        },
        {
          name: 'Bent Over Rows',
          category: 'strengthLifts',
          sets: Array(3).fill({ weight: 0, reps: recommendedType === 'hypertrophy' ? 12 : 8, completed: false }),
        },
        {
          name: 'Bicep Curls',
          category: 'strengthLifts',
          sets: Array(3).fill({ weight: 0, reps: recommendedType === 'hypertrophy' ? 15 : 10, completed: false }),
        }
      );
    }
    
    if (leastWorkedMuscles.includes('quads') || leastWorkedMuscles.includes('hamstrings') || leastWorkedMuscles.includes('glutes')) {
      exercises.push(
        {
          name: 'Squats',
          category: 'strengthLifts',
          sets: Array(4).fill({ weight: 0, reps: recommendedType === 'hypertrophy' ? 10 : 5, completed: false }),
        },
        {
          name: 'Romanian Deadlifts',
          category: 'strengthLifts',
          sets: Array(3).fill({ weight: 0, reps: recommendedType === 'hypertrophy' ? 12 : 8, completed: false }),
        },
        {
          name: 'Lunges',
          category: 'strengthLifts',
          sets: Array(3).fill({ reps: recommendedType === 'hypertrophy' ? 12 : 8, completed: false }),
        }
      );
    }
    
    if (leastWorkedMuscles.includes('abs') || leastWorkedMuscles.includes('obliques')) {
      exercises.push(
        {
          name: 'Planks',
          category: 'strengthLifts',
          sets: Array(3).fill({ duration: 60, completed: false }),
        },
        {
          name: 'Russian Twists',
          category: 'strengthLifts',
          sets: Array(3).fill({ reps: 20, completed: false }),
        }
      );
    }
    
    // If no specific muscle groups were identified or exercises were added, add a full body workout
    if (exercises.length === 0) {
      exercises.push(
        {
          name: 'Squats',
          category: 'strengthLifts',
          sets: Array(3).fill({ weight: 0, reps: recommendedType === 'hypertrophy' ? 10 : 5, completed: false }),
        },
        {
          name: 'Push-Ups',
          category: 'bodyweight',
          sets: Array(3).fill({ reps: recommendedType === 'hypertrophy' ? 12 : 8, completed: false }),
        },
        {
          name: 'Bent Over Rows',
          category: 'strengthLifts',
          sets: Array(3).fill({ weight: 0, reps: recommendedType === 'hypertrophy' ? 12 : 8, completed: false }),
        },
        {
          name: 'Planks',
          category: 'bodyweight',
          sets: Array(3).fill({ duration: 60, completed: false }),
        }
      );
    }
    
    recommendations.push({
      title: `${leastWorkedMuscles.length > 0 ? leastWorkedMuscles.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join('/') : 'Full Body'} Workout`,
      type: recommendedType,
      muscleGroups: leastWorkedMuscles.length > 0 ? leastWorkedMuscles : ['fullBody'],
      exercises,
      duration: 45,
      intensity: userProfile.experience === 'beginner' ? 'moderate' : 'intense',
      reasoning: `You haven't worked ${leastWorkedMuscles.join(', ')} recently. This ${WORKOUT_TYPES[recommendedType]} workout will help maintain balanced development.`,
      priority: 'medium'
    });
  }
  
  // Recommendation 3: Consistency-based workout if user has missed workouts
  if (analytics.missedWorkoutDays > 2) {
    // Determine a simple, approachable workout to get back on track
    recommendations.push({
      title: 'Get Back on Track Workout',
      type: 'strength',
      muscleGroups: ['fullBody'],
      exercises: [
        {
          name: 'Bodyweight Squats',
          category: 'bodyweight',
          sets: Array(3).fill({ reps: 15, completed: false }),
        },
        {
          name: 'Push-Ups',
          category: 'bodyweight',
          sets: Array(3).fill({ reps: 10, completed: false }),
        },
        {
          name: 'Plank',
          category: 'bodyweight',
          sets: Array(3).fill({ duration: 30, completed: false }),
        },
        {
          name: 'Walking',
          category: 'cardio',
          sets: [{ duration: 600, completed: false }], // 10 minutes
        }
      ],
      duration: 30,
      intensity: 'light',
      reasoning: `It's been ${analytics.missedWorkoutDays} days since your last workout. This quick, full-body session will help you get back into your routine.`,
      priority: 'high'
    });
  }
  
  return recommendations;
};

/**
 * Generate meal recommendations based on analytics
 */
const generateMealRecommendations = async (
  mealAnalytics: MealAnalytics,
  workoutAnalytics: WorkoutAnalytics,
  userProfile: any
): Promise<MealRecommendation[]> => {
  const recommendations: MealRecommendation[] = [];
  
  // Check if user worked out today
  const workoutToday = await didWorkoutToday();
  
  // Recommendation 1: Post-workout nutrition if needed
  if (workoutToday && !mealAnalytics.postWorkoutNutrition.adequateProtein) {
    recommendations.push({
      title: 'Post-Workout Recovery Meal',
      mealType: 'snack',
      ingredients: [
        { name: 'Protein Shake', amount: '1 scoop', calories: 120, macros: { protein: 25, carbs: 3, fats: 1 } },
        { name: 'Banana', amount: '1 medium', calories: 105, macros: { protein: 1.3, carbs: 27, fats: 0.4 } },
        { name: 'Greek Yogurt', amount: '1 cup', calories: 130, macros: { protein: 22, carbs: 8, fats: 0 } }
      ],
      macros: {
        protein: 48.3,
        carbs: 38,
        fats: 1.4,
        calories: 355
      },
      tags: ['high-protein', 'post-workout', 'quick'],
      reasoning: 'You worked out today but haven\'t consumed adequate protein afterward. This quick meal provides the protein and carbs needed for optimal recovery.',
      priority: 'high'
    });
  }
  
  // Recommendation 2: Protein-focused meal if protein intake is low
  if (mealAnalytics.nutritionAdequacy.protein === 'low') {
    recommendations.push({
      title: 'High-Protein Meal',
      mealType: 'lunch',
      ingredients: [
        { name: 'Grilled Chicken Breast', amount: '6 oz', calories: 180, macros: { protein: 36, carbs: 0, fats: 4 } },
        { name: 'Quinoa', amount: '1 cup cooked', calories: 222, macros: { protein: 8, carbs: 39, fats: 3.6 } },
        { name: 'Broccoli', amount: '1 cup', calories: 55, macros: { protein: 3.7, carbs: 11.2, fats: 0.6 } },
        { name: 'Olive Oil', amount: '1 tbsp', calories: 119, macros: { protein: 0, carbs: 0, fats: 13.5 } }
      ],
      macros: {
        protein: 47.7,
        carbs: 50.2,
        fats: 21.7,
        calories: 576
      },
      tags: ['high-protein', 'balanced'],
      reasoning: 'Your protein intake has been below optimal levels. This meal provides high-quality protein to support muscle maintenance and recovery.',
      priority: 'medium'
    });
  }
  
  // Recommendation 3: Calorie-focused meal if calorie intake is low
  if (mealAnalytics.nutritionAdequacy.calories === 'low') {
    recommendations.push({
      title: 'Nutrient-Dense Meal',
      mealType: 'dinner',
      ingredients: [
        { name: 'Salmon Fillet', amount: '6 oz', calories: 354, macros: { protein: 34, carbs: 0, fats: 22 } },
        { name: 'Sweet Potato', amount: '1 medium', calories: 115, macros: { protein: 2, carbs: 27, fats: 0.1 } },
        { name: 'Avocado', amount: '1/2', calories: 120, macros: { protein: 1.5, carbs: 6, fats: 11 } },
        { name: 'Mixed Vegetables', amount: '1 cup', calories: 65, macros: { protein: 2, carbs: 13, fats: 0.5 } },
        { name: 'Olive Oil', amount: '1 tbsp', calories: 119, macros: { protein: 0, carbs: 0, fats: 13.5 } }
      ],
      macros: {
        protein: 39.5,
        carbs: 46,
        fats: 47.1,
        calories: 773
      },
      tags: ['nutrient-dense', 'healthy-fats'],
      reasoning: 'Your calorie intake has been below your estimated needs. This nutrient-dense meal provides healthy fats, protein, and complex carbs to help meet your energy requirements.',
      priority: 'medium'
    });
  }
  
  // Recommendation 4: Goal-specific meal
  if (userProfile.fitnessGoals) {
    if (userProfile.fitnessGoals.toLowerCase().includes('muscle gain')) {
      recommendations.push({
        title: 'Muscle-Building Meal',
        mealType: 'dinner',
        ingredients: [
          { name: 'Steak', amount: '8 oz', calories: 480, macros: { protein: 56, carbs: 0, fats: 28 } },
          { name: 'Brown Rice', amount: '1.5 cups cooked', calories: 324, macros: { protein: 7.5, carbs: 67.5, fats: 2.7 } },
          { name: 'Spinach', amount: '2 cups', calories: 14, macros: { protein: 1.8, carbs: 2.2, fats: 0.2 } },
          { name: 'Olive Oil', amount: '1 tbsp', calories: 119, macros: { protein: 0, carbs: 0, fats: 13.5 } }
        ],
        macros: {
          protein: 65.3,
          carbs: 69.7,
          fats: 44.4,
          calories: 937
        },
        tags: ['high-protein', 'muscle-building', 'high-calorie'],
        reasoning: 'This calorie-dense meal supports your muscle gain goals with ample protein and carbohydrates to fuel muscle growth and recovery.',
        priority: 'medium'
      });
    } else if (userProfile.fitnessGoals.toLowerCase().includes('weight loss')) {
      recommendations.push({
        title: 'Calorie-Controlled Meal',
        mealType: 'dinner',
        ingredients: [
          { name: 'Grilled Chicken Breast', amount: '5 oz', calories: 150, macros: { protein: 30, carbs: 0, fats: 3.3 } },
          { name: 'Cauliflower Rice', amount: '1 cup', calories: 25, macros: { protein: 2, carbs: 5, fats: 0 } },
          { name: 'Mixed Vegetables', amount: '2 cups', calories: 130, macros: { protein: 4, carbs: 26, fats: 1 } },
          { name: 'Olive Oil', amount: '1 tsp', calories: 40, macros: { protein: 0, carbs: 0, fats: 4.5 } }
        ],
        macros: {
          protein: 36,
          carbs: 31,
          fats: 8.8,
          calories: 345
        },
        tags: ['low-calorie', 'high-protein', 'weight-loss'],
        reasoning: 'This meal supports your weight loss goals by providing lean protein and fiber-rich vegetables while keeping calories controlled.',
        priority: 'medium'
      });
    }
  }
  
  return recommendations;
};

/**
 * Generate general fitness advice based on analytics
 */
const generateGeneralAdvice = (
  workoutAnalytics: WorkoutAnalytics,
  mealAnalytics: MealAnalytics,
  userProfile: any
): string[] => {
  const advice: string[] = [];
  
  // Workout consistency advice
  if (workoutAnalytics.workoutConsistency < 0.7) {
    advice.push(
      'Try to establish a more consistent workout routine. Even short workouts are better than skipping them entirely.'
    );
  }
  
  // Workout variety advice
  const dominantMuscleGroup = Object.entries(workoutAnalytics.muscleGroupFrequency)
    .sort((a, b) => b[1] - a[1])
    .shift();
  
  if (dominantMuscleGroup && dominantMuscleGroup[1] > workoutAnalytics.totalWorkouts * 0.5) {
    advice.push(
      `You're focusing heavily on ${dominantMuscleGroup[0]}. Consider a more balanced approach to prevent imbalances and reduce injury risk.`
    );
  }
  
  // Nutrition advice
  if (mealAnalytics.nutritionAdequacy.protein === 'low') {
    advice.push(
      'Your protein intake appears to be below optimal levels. Aim for 1.6-2.2g of protein per kg of bodyweight to support muscle recovery and growth.'
    );
  }
  
  if (mealAnalytics.nutritionAdequacy.calories === 'low' && 
      userProfile.fitnessGoals && 
      userProfile.fitnessGoals.toLowerCase().includes('muscle')) {
    advice.push(
      'You\'re consistently eating below your calorie needs, which may hinder muscle growth. Consider increasing your caloric intake with nutrient-dense foods.'
    );
  }
  
  if (mealAnalytics.nutritionAdequacy.calories === 'high' && 
      userProfile.fitnessGoals && 
      userProfile.fitnessGoals.toLowerCase().includes('weight loss')) {
    advice.push(
      'Your calorie intake is higher than optimal for your weight loss goals. Consider moderately reducing portion sizes or choosing lower-calorie alternatives.'
    );
  }
  
  // Post-workout nutrition advice
  if (!mealAnalytics.postWorkoutNutrition.timelyConsumption) {
    advice.push(
      'Try to consume a meal or snack containing protein and carbohydrates within 2 hours after your workouts to optimize recovery.'
    );
  }
  
  // General health advice
  advice.push(
    'Remember to stay hydrated throughout the day, especially before, during, and after workouts.'
  );
  
  advice.push(
    'Ensure you\'re getting 7-9 hours of quality sleep each night to support recovery and overall health.'
  );
  
  return advice;
};
