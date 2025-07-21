import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../../firebase';
import { 
  MealEntry, 
  MacroNutrients,
  Ingredient
} from '../types/mealTypes';
import { 
  getRecentMeals, 
  didWorkoutToday, 
  getUserDietaryPreferences 
} from './mealService';

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

// Interface for meal suggestion
export interface MealSuggestion {
  title: string;
  description: string;
  mealType: string;
  ingredients: Ingredient[];
  macros: MacroNutrients;
  tags: string[];
  reasoning: string;
}

/**
 * Get meal suggestions based on user profile and meal history
 */
export const getMealSuggestions = async (): Promise<{
  suggestion: MealSuggestion;
  reasoning: string;
}> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user profile
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }
    
    const userProfile = userDoc.data() as UserProfile;
    
    // Get recent meals
    const recentMeals = await getRecentMeals();
    
    // Check if user worked out today
    const workoutToday = await didWorkoutToday();
    
    // Get user's dietary preferences
    const dietaryPreferences = await getUserDietaryPreferences();
    
    // Generate meal suggestion based on profile and history
    return generateMealSuggestion(userProfile, recentMeals, workoutToday, dietaryPreferences);
  } catch (error) {
    console.error('Error getting meal suggestions:', error);
    throw error;
  }
};

/**
 * Generate meal suggestion based on user profile and meal history
 */
const generateMealSuggestion = (
  profile: UserProfile,
  recentMeals: MealEntry[],
  workoutToday: boolean,
  dietaryPreferences: string[]
): { suggestion: MealSuggestion; reasoning: string } => {
  // Calculate target calories based on user profile
  const targetCalories = calculateTargetCalories(profile);
  
  // Get today's date
  const today = new Date().toISOString().split('T')[0];
  
  // Get meals consumed today
  const mealsToday = recentMeals.filter(meal => meal.date === today);
  
  // Calculate calories consumed today
  const caloriesConsumed = mealsToday.reduce((total, meal) => {
    return total + (meal.macros?.calories || 0);
  }, 0);
  
  // Calculate remaining calories for the day
  const caloriesRemaining = targetCalories - caloriesConsumed;
  
  // Determine current time to suggest appropriate meal type
  const currentHour = new Date().getHours();
  let suggestedMealType = 'snack';
  
  if (currentHour < 10) {
    suggestedMealType = 'breakfast';
  } else if (currentHour >= 10 && currentHour < 14) {
    suggestedMealType = 'lunch';
  } else if (currentHour >= 17 && currentHour < 21) {
    suggestedMealType = 'dinner';
  }
  
  // Check if this meal type has already been consumed today
  const alreadyConsumed = mealsToday.some(meal => meal.mealType === suggestedMealType);
  
  // Determine if user needs post-workout meal
  if (workoutToday) {
    const postWorkoutMeal = mealsToday.find(meal => meal.postWorkout);
    
    if (!postWorkoutMeal) {
      // Suggest post-workout meal
      return {
        suggestion: {
          title: 'Post-Workout Recovery Meal',
          description: 'A protein-rich meal to support muscle recovery after your workout.',
          mealType: suggestedMealType,
          ingredients: [
            { name: 'Grilled Chicken Breast', amount: '150g', calories: 165, macros: { protein: 31, carbs: 0, fats: 3.6 } },
            { name: 'Brown Rice', amount: '1 cup', calories: 216, macros: { protein: 5, carbs: 45, fats: 1.8 } },
            { name: 'Steamed Broccoli', amount: '1 cup', calories: 55, macros: { protein: 3.7, carbs: 11.2, fats: 0.6 } },
            { name: 'Olive Oil', amount: '1 tbsp', calories: 119, macros: { protein: 0, carbs: 0, fats: 13.5 } }
          ],
          macros: {
            protein: 39.7,
            carbs: 56.2,
            fats: 19.5,
            calories: 555
          },
          tags: ['high-protein', 'post-workout'],
          reasoning: 'This meal provides a good balance of protein for muscle recovery and carbs to replenish glycogen stores.'
        },
        reasoning: 'You worked out today but haven\'t logged a post-workout meal. Consuming protein and carbs within 2 hours of exercise can help optimize recovery.'
      };
    }
  }
  
  // Check if user is under their calorie goal
  if (caloriesRemaining > 500) {
    // Suggest calorie-dense meal
    return {
      suggestion: {
        title: 'Nutrient-Dense Meal',
        description: `A balanced meal to help you meet your daily calorie needs.`,
        mealType: suggestedMealType,
        ingredients: [
          { name: 'Salmon Fillet', amount: '150g', calories: 280, macros: { protein: 30, carbs: 0, fats: 18 } },
          { name: 'Sweet Potato', amount: '1 medium', calories: 115, macros: { protein: 2, carbs: 27, fats: 0.1 } },
          { name: 'Avocado', amount: '1/2', calories: 120, macros: { protein: 1.5, carbs: 6, fats: 11 } },
          { name: 'Mixed Greens', amount: '2 cups', calories: 15, macros: { protein: 1, carbs: 3, fats: 0 } }
        ],
        macros: {
          protein: 34.5,
          carbs: 36,
          fats: 29.1,
          calories: 530
        },
        tags: ['balanced', 'nutrient-dense'],
        reasoning: 'This meal provides a good balance of protein, healthy fats, and complex carbs to help you meet your calorie needs.'
      },
      reasoning: `You're currently ${caloriesRemaining} calories under your daily target of ${targetCalories} calories. This meal will help you get closer to your nutritional goals.`
    };
  }
  
  // Check if user has specific dietary preferences
  if (dietaryPreferences.includes('high-protein')) {
    const proteinConsumed = mealsToday.reduce((total, meal) => {
      return total + (meal.macros?.protein || 0);
    }, 0);
    
    // Calculate target protein based on weight (if available) or default to 100g
    const targetProtein = profile.weight ? profile.weight * 1.6 : 100; // 1.6g per kg of bodyweight
    
    if (proteinConsumed < targetProtein * 0.7) { // If less than 70% of target protein consumed
      return {
        suggestion: {
          title: 'High-Protein Meal',
          description: 'A protein-packed meal to help you reach your daily protein goals.',
          mealType: suggestedMealType,
          ingredients: [
            { name: 'Greek Yogurt', amount: '1 cup', calories: 130, macros: { protein: 22, carbs: 8, fats: 0 } },
            { name: 'Whey Protein', amount: '1 scoop', calories: 120, macros: { protein: 24, carbs: 3, fats: 1 } },
            { name: 'Berries', amount: '1 cup', calories: 85, macros: { protein: 1, carbs: 20, fats: 0.5 } },
            { name: 'Almonds', amount: '1/4 cup', calories: 207, macros: { protein: 7.6, carbs: 7.7, fats: 18 } }
          ],
          macros: {
            protein: 54.6,
            carbs: 38.7,
            fats: 19.5,
            calories: 542
          },
          tags: ['high-protein', 'quick'],
          reasoning: 'This meal is high in protein while still providing carbs and healthy fats.'
        },
        reasoning: `You've only consumed ${proteinConsumed}g of protein today, which is below your target of ${targetProtein}g. This high-protein meal will help you reach your goals.`
      };
    }
  }
  
  // Default suggestion based on time of day
  if (suggestedMealType === 'breakfast' && !alreadyConsumed) {
    return {
      suggestion: {
        title: 'Balanced Breakfast',
        description: 'A nutritious breakfast to start your day right.',
        mealType: 'breakfast',
        ingredients: [
          { name: 'Oatmeal', amount: '1 cup cooked', calories: 158, macros: { protein: 6, carbs: 27, fats: 3 } },
          { name: 'Banana', amount: '1 medium', calories: 105, macros: { protein: 1.3, carbs: 27, fats: 0.4 } },
          { name: 'Peanut Butter', amount: '1 tbsp', calories: 94, macros: { protein: 4, carbs: 3, fats: 8 } },
          { name: 'Chia Seeds', amount: '1 tbsp', calories: 60, macros: { protein: 2, carbs: 5, fats: 3 } }
        ],
        macros: {
          protein: 13.3,
          carbs: 62,
          fats: 14.4,
          calories: 417
        },
        tags: ['breakfast', 'quick'],
        reasoning: 'This breakfast provides sustained energy from complex carbs and healthy fats.'
      },
      reasoning: 'Starting your day with a balanced breakfast can help stabilize blood sugar and provide energy for the day ahead.'
    };
  } else if (suggestedMealType === 'lunch' && !alreadyConsumed) {
    return {
      suggestion: {
        title: 'Protein-Packed Lunch',
        description: 'A satisfying lunch to power you through the afternoon.',
        mealType: 'lunch',
        ingredients: [
          { name: 'Turkey Breast', amount: '100g', calories: 157, macros: { protein: 30, carbs: 0, fats: 3.5 } },
          { name: 'Whole Grain Bread', amount: '2 slices', calories: 160, macros: { protein: 8, carbs: 30, fats: 2 } },
          { name: 'Avocado', amount: '1/4', calories: 60, macros: { protein: 0.7, carbs: 3, fats: 5.5 } },
          { name: 'Spinach', amount: '1 cup', calories: 7, macros: { protein: 0.9, carbs: 1.1, fats: 0.1 } },
          { name: 'Apple', amount: '1 medium', calories: 95, macros: { protein: 0.5, carbs: 25, fats: 0.3 } }
        ],
        macros: {
          protein: 40.1,
          carbs: 59.1,
          fats: 11.4,
          calories: 479
        },
        tags: ['lunch', 'high-protein'],
        reasoning: 'This lunch provides a good balance of protein and complex carbs to keep you energized.'
      },
      reasoning: 'A balanced lunch with adequate protein can help maintain energy levels and prevent afternoon slumps.'
    };
  } else if (suggestedMealType === 'dinner' && !alreadyConsumed) {
    return {
      suggestion: {
        title: 'Balanced Dinner',
        description: 'A nutritious dinner to end your day.',
        mealType: 'dinner',
        ingredients: [
          { name: 'Grilled Salmon', amount: '150g', calories: 280, macros: { protein: 30, carbs: 0, fats: 18 } },
          { name: 'Quinoa', amount: '1/2 cup cooked', calories: 111, macros: { protein: 4, carbs: 20, fats: 1.8 } },
          { name: 'Roasted Vegetables', amount: '1 cup', calories: 80, macros: { protein: 2, carbs: 16, fats: 1 } },
          { name: 'Olive Oil', amount: '1 tbsp', calories: 119, macros: { protein: 0, carbs: 0, fats: 13.5 } }
        ],
        macros: {
          protein: 36,
          carbs: 36,
          fats: 34.3,
          calories: 590
        },
        tags: ['dinner', 'balanced'],
        reasoning: 'This dinner provides quality protein, complex carbs, and healthy fats.'
      },
      reasoning: 'A balanced dinner with adequate protein and healthy fats can support recovery overnight.'
    };
  } else {
    // Snack suggestion
    return {
      suggestion: {
        title: 'Healthy Snack',
        description: 'A nutritious snack to keep you going.',
        mealType: 'snack',
        ingredients: [
          { name: 'Greek Yogurt', amount: '1/2 cup', calories: 65, macros: { protein: 11, carbs: 4, fats: 0 } },
          { name: 'Berries', amount: '1/2 cup', calories: 42, macros: { protein: 0.5, carbs: 10, fats: 0.3 } },
          { name: 'Honey', amount: '1 tsp', calories: 21, macros: { protein: 0, carbs: 5.8, fats: 0 } },
          { name: 'Almonds', amount: '10', calories: 70, macros: { protein: 2.5, carbs: 2.5, fats: 6 } }
        ],
        macros: {
          protein: 14,
          carbs: 22.3,
          fats: 6.3,
          calories: 198
        },
        tags: ['snack', 'quick'],
        reasoning: 'This snack provides protein and healthy fats to keep you satisfied between meals.'
      },
      reasoning: 'Small, balanced snacks can help maintain energy levels and prevent overeating at your next meal.'
    };
  }
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
