import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../../firebase';
import { 
  WorkoutEntry, 
  WorkoutType,
  WorkoutExercise,
  MUSCLE_GROUPS
} from '../types/workoutTypes';
import { getRecentWorkouts } from './workoutService';

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
}

/**
 * Get workout suggestions based on user profile and workout history
 */
export const getWorkoutSuggestions = async (): Promise<{
  suggestedWorkout: Partial<WorkoutEntry> | null;
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
    
    // Get recent workouts
    const recentWorkouts = await getRecentWorkouts();
    
    // Generate workout suggestion based on profile and history
    return generateWorkoutSuggestion(userProfile, recentWorkouts);
  } catch (error) {
    console.error('Error getting workout suggestions:', error);
    throw error;
  }
};

/**
 * Generate workout suggestion based on user profile and workout history
 */
const generateWorkoutSuggestion = (
  profile: UserProfile,
  recentWorkouts: WorkoutEntry[]
): { suggestedWorkout: Partial<WorkoutEntry> | null; reasoning: string } => {
  // Default response if we can't generate a suggestion
  const defaultResponse = {
    suggestedWorkout: null,
    reasoning: "Not enough data to generate a personalized workout suggestion."
  };
  
  if (!profile || recentWorkouts.length === 0) {
    return defaultResponse;
  }
  
  // Analyze recent workouts to identify patterns and gaps
  const muscleGroupFrequency: Record<string, number> = {};
  const workoutTypeFrequency: Record<string, number> = {};
  let totalWorkoutDuration = 0;
  
  // Initialize all muscle groups with 0
  Object.keys(MUSCLE_GROUPS).forEach(group => {
    muscleGroupFrequency[group] = 0;
  });
  
  // Count frequency of muscle groups and workout types
  recentWorkouts.forEach(workout => {
    workout.muscleGroups.forEach(group => {
      muscleGroupFrequency[group] = (muscleGroupFrequency[group] || 0) + 1;
    });
    
    workoutTypeFrequency[workout.type] = (workoutTypeFrequency[workout.type] || 0) + 1;
    totalWorkoutDuration += workout.duration;
  });
  
  // Find least worked muscle groups
  const sortedMuscleGroups = Object.entries(muscleGroupFrequency)
    .sort(([, a], [, b]) => a - b)
    .map(([group]) => group);
  
  const leastWorkedMuscleGroups = sortedMuscleGroups.slice(0, 3);
  
  // Determine if user needs rest day
  const workoutsLast3Days = recentWorkouts.filter(workout => {
    const workoutDate = new Date(workout.date);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return workoutDate >= threeDaysAgo;
  });
  
  const needsRestDay = workoutsLast3Days.length >= 3;
  
  // Determine workout type based on user goals and history
  let suggestedWorkoutType: WorkoutType = 'strength';
  
  if (profile.fitnessGoals) {
    if (profile.fitnessGoals.toLowerCase().includes('weight loss')) {
      suggestedWorkoutType = Math.random() > 0.5 ? 'hiit' : 'cardio';
    } else if (profile.fitnessGoals.toLowerCase().includes('muscle')) {
      suggestedWorkoutType = 'hypertrophy';
    } else if (profile.fitnessGoals.toLowerCase().includes('endurance')) {
      suggestedWorkoutType = 'endurance';
    }
  }
  
  // If user needs rest, suggest recovery workout
  if (needsRestDay) {
    return {
      suggestedWorkout: {
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
          }
        ],
        duration: 30,
        intensity: 'light',
      },
      reasoning: "You've been working out consistently for the past 3 days. Today would be a good day for active recovery to prevent overtraining and allow your muscles to recover."
    };
  }
  
  // Generate workout based on least worked muscle groups
  const suggestedExercises: WorkoutExercise[] = [];
  let workoutTitle = '';
  let reasoning = '';
  
  if (leastWorkedMuscleGroups.includes('chest') || leastWorkedMuscleGroups.includes('triceps') || leastWorkedMuscleGroups.includes('shoulders')) {
    // Push workout
    workoutTitle = 'Upper Body Push';
    suggestedExercises.push(
      {
        name: 'Bench Press',
        category: 'strengthLifts',
        sets: Array(4).fill({ weight: 0, reps: 8, completed: false }),
      },
      {
        name: 'Overhead Press',
        category: 'strengthLifts',
        sets: Array(3).fill({ weight: 0, reps: 10, completed: false }),
      },
      {
        name: 'Tricep Dips',
        category: 'strengthLifts',
        sets: Array(3).fill({ reps: 12, completed: false }),
      }
    );
    reasoning = "Your recent workouts have been lacking upper body push exercises. This workout focuses on chest, shoulders, and triceps to maintain balanced development.";
  } else if (leastWorkedMuscleGroups.includes('back') || leastWorkedMuscleGroups.includes('biceps')) {
    // Pull workout
    workoutTitle = 'Upper Body Pull';
    suggestedExercises.push(
      {
        name: 'Pull Ups',
        category: 'strengthLifts',
        sets: Array(4).fill({ reps: 8, completed: false }),
      },
      {
        name: 'Bent Over Row',
        category: 'strengthLifts',
        sets: Array(3).fill({ weight: 0, reps: 10, completed: false }),
      },
      {
        name: 'Bicep Curls',
        category: 'strengthLifts',
        sets: Array(3).fill({ weight: 0, reps: 12, completed: false }),
      }
    );
    reasoning = "Your recent workouts have been lacking upper body pull exercises. This workout focuses on back and biceps to maintain balanced development.";
  } else if (leastWorkedMuscleGroups.includes('quads') || leastWorkedMuscleGroups.includes('hamstrings') || leastWorkedMuscleGroups.includes('glutes')) {
    // Leg workout
    workoutTitle = 'Lower Body';
    suggestedExercises.push(
      {
        name: 'Squats',
        category: 'strengthLifts',
        sets: Array(4).fill({ weight: 0, reps: 8, completed: false }),
      },
      {
        name: 'Deadlifts',
        category: 'strengthLifts',
        sets: Array(3).fill({ weight: 0, reps: 8, completed: false }),
      },
      {
        name: 'Lunges',
        category: 'strengthLifts',
        sets: Array(3).fill({ reps: 12, completed: false }),
      }
    );
    reasoning = "Your recent workouts have been lacking lower body exercises. This workout focuses on legs to maintain balanced development.";
  } else {
    // Full body workout
    workoutTitle = 'Full Body';
    suggestedExercises.push(
      {
        name: 'Squats',
        category: 'strengthLifts',
        sets: Array(3).fill({ weight: 0, reps: 8, completed: false }),
      },
      {
        name: 'Bench Press',
        category: 'strengthLifts',
        sets: Array(3).fill({ weight: 0, reps: 8, completed: false }),
      },
      {
        name: 'Bent Over Row',
        category: 'strengthLifts',
        sets: Array(3).fill({ weight: 0, reps: 8, completed: false }),
      }
    );
    reasoning = "Based on your workout history, a balanced full-body workout would be beneficial to maintain overall strength and conditioning.";
  }
  
  // Adjust workout based on experience level
  if (profile.experience === 'beginner') {
    // Reduce volume for beginners
    suggestedExercises.forEach(exercise => {
      exercise.sets = exercise.sets.slice(0, 3);
    });
    reasoning += " The workout is tailored for your beginner level with appropriate volume.";
  } else if (profile.experience === 'advanced') {
    // Add more exercises for advanced users
    suggestedExercises.push({
      name: 'Plank',
      category: 'strengthLifts',
      sets: Array(3).fill({ duration: 60, completed: false }),
    });
    reasoning += " As an advanced lifter, additional core work has been added for a more challenging session.";
  }
  
  return {
    suggestedWorkout: {
      title: workoutTitle,
      type: suggestedWorkoutType,
      muscleGroups: leastWorkedMuscleGroups,
      exercises: suggestedExercises,
      duration: 45, // Default duration
      intensity: profile.experience === 'beginner' ? 'moderate' : 'intense',
    },
    reasoning
  };
};
