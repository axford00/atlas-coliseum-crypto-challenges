// src/utils/exerciseExtraction.js - ENHANCED: Fixes "Back squat. 2 * 10 @ 185lbs" format
import { Alert } from 'react-native';

/**
 * Extract exercises with weights from workout text
 * ENHANCED: Now handles "Back squat. 2 * 10 @ 185lbs" format specifically
 */
export const extractExercisesFromWorkout = (workoutText) => {
  if (!workoutText || typeof workoutText !== 'string') {
    console.log('❌ Invalid workout text for extraction');
    return [];
  }

  console.log('🔍 Starting exercise extraction from:', workoutText);
  
  const exercises = [];
  const text = workoutText.trim();
  
  // ENHANCED: Pattern specifically for "Back squat. 2 * 10 @ 185lbs" format
  const enhancedPatterns = [
    // Pattern 1: "Exercise. sets * reps @ weight unit" (Back squat. 2 * 10 @ 185lbs)
    {
      pattern: /(back\s+squat|front\s+squat|deadlift|bench\s+press|overhead\s+press|clean|snatch|squat|press|bench|row)\.?\s*(\d+)\s*\*\s*(\d+)\s*@\s*(\d+(?:\.\d+)?)\s*(lbs?|kg|pounds?|#)/gi,
      handler: (match) => ({
        name: cleanExerciseName(match[1]),
        type: getExerciseType(match[1]),
        sets: parseInt(match[2]),
        reps: parseInt(match[3]),
        weight: parseFloat(match[4]),
        unit: normalizeUnit(match[5]),
        scheme: `${match[2]}x${match[3]}`,
        raw: match[0]
      })
    },
    
    // Pattern 2: "Exercise sets x reps @ weight unit" (deadlift 3x5 @ 315lb)
    {
      pattern: /(back\s+squat|front\s+squat|deadlift|bench\s+press|overhead\s+press|clean|snatch|squat|press|bench|row)\s+(\d+)x(\d+)\s*@\s*(\d+(?:\.\d+)?)\s*(lbs?|kg|pounds?|#)/gi,
      handler: (match) => ({
        name: cleanExerciseName(match[1]),
        type: getExerciseType(match[1]),
        sets: parseInt(match[2]),
        reps: parseInt(match[3]),
        weight: parseFloat(match[4]),
        unit: normalizeUnit(match[5]),
        scheme: `${match[2]}x${match[3]}`,
        raw: match[0]
      })
    },
    
    // Pattern 3: "Exercise weight x reps" (bench press 225 x 3)
    {
      pattern: /(back\s+squat|front\s+squat|deadlift|bench\s+press|overhead\s+press|clean|snatch|squat|press|bench|row)\s+(\d+(?:\.\d+)?)\s*x\s*(\d+)\s*(lbs?|kg|pounds?|#)?/gi,
      handler: (match) => ({
        name: cleanExerciseName(match[1]),
        type: getExerciseType(match[1]),
        sets: 1,
        reps: parseInt(match[3]),
        weight: parseFloat(match[2]),
        unit: normalizeUnit(match[4] || 'lbs'),
        scheme: `1x${match[3]}`,
        raw: match[0]
      })
    },
    
    // Pattern 4: "Exercise @ weight unit" (squat @ 185lbs)
    {
      pattern: /(back\s+squat|front\s+squat|deadlift|bench\s+press|overhead\s+press|clean|snatch|squat|press|bench|row)\s*@\s*(\d+(?:\.\d+)?)\s*(lbs?|kg|pounds?|#)/gi,
      handler: (match) => ({
        name: cleanExerciseName(match[1]),
        type: getExerciseType(match[1]),
        sets: 1,
        reps: 1,
        weight: parseFloat(match[2]),
        unit: normalizeUnit(match[3]),
        scheme: '1x1',
        raw: match[0]
      })
    },
    
    // Pattern 5: "Exercise weight unit" (back squat 185 lbs)
    {
      pattern: /(back\s+squat|front\s+squat|deadlift|bench\s+press|overhead\s+press|clean|snatch|squat|press|bench|row)\s+(\d+(?:\.\d+)?)\s*(lbs?|kg|pounds?|#)/gi,
      handler: (match) => ({
        name: cleanExerciseName(match[1]),
        type: getExerciseType(match[1]),
        sets: 1,
        reps: 1,
        weight: parseFloat(match[2]),
        unit: normalizeUnit(match[3]),
        scheme: '1x1',
        raw: match[0]
      })
    },

    // Pattern 6: Ring dips format "4* 7 ring dips" 
    {
      pattern: /(\d+)\*?\s*(\d+)\s+(ring\s+dips|dips|pull\s+ups|push\s+ups|burpees)/gi,
      handler: (match) => ({
        name: cleanExerciseName(match[3]),
        type: getExerciseType(match[3]),
        sets: parseInt(match[1]),
        reps: parseInt(match[2]),
        weight: 0, // Bodyweight
        unit: 'bodyweight',
        scheme: `${match[1]}x${match[2]}`,
        raw: match[0]
      })
    }
  ];

  // Process each pattern
  enhancedPatterns.forEach((patternConfig, patternIndex) => {
    const matches = [...text.matchAll(patternConfig.pattern)];
    console.log(`🔍 Pattern ${patternIndex + 1} found ${matches.length} matches`);
    
    matches.forEach((match, matchIndex) => {
      try {
        const exercise = patternConfig.handler(match);
        
        if (exercise && exercise.name && (exercise.weight > 0 || exercise.unit === 'bodyweight')) {
          console.log(`✅ Extracted exercise ${patternIndex + 1}.${matchIndex + 1}:`, exercise);
          exercises.push(exercise);
        }
        
      } catch (error) {
        console.error('❌ Error processing match:', match, error);
      }
    });
  });

  // Remove duplicates (keep the one with the highest weight)
  const uniqueExercises = removeDuplicateExercises(exercises);
  
  console.log(`📊 Final extracted exercises: ${uniqueExercises.length}`);
  uniqueExercises.forEach((ex, i) => {
    console.log(`${i + 1}. ${ex.name}: ${ex.weight}${ex.unit} (${ex.scheme})`);
  });
  
  return uniqueExercises;
};

/**
 * Normalize weight units
 */
const normalizeUnit = (unit) => {
  if (!unit) return 'lbs';
  
  const unitLower = unit.toLowerCase();
  if (unitLower.includes('kg')) return 'kg';
  if (unitLower.includes('lb') || unitLower.includes('pound')) return 'lbs';
  if (unitLower.includes('#')) return 'lbs';
  if (unitLower.includes('bodyweight')) return 'bodyweight';
  return 'lbs'; // default
};

/**
 * Clean up exercise names
 */
const cleanExerciseName = (name) => {
  return name
    .trim()
    .replace(/\.$/, '') // Remove trailing period
    .replace(/\s+/g, ' ') // Normalize spaces
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Determine exercise type for categorization
 */
const getExerciseType = (exerciseName) => {
  const name = exerciseName.toLowerCase();
  
  // Squat variations
  if (name.includes('squat')) {
    if (name.includes('back')) return 'back squat';
    if (name.includes('front')) return 'front squat';
    return 'squat';
  }
  
  // Deadlift variations
  if (name.includes('deadlift')) {
    if (name.includes('sumo')) return 'sumo deadlift';
    if (name.includes('romanian') || name.includes('rdl')) return 'romanian deadlift';
    return 'deadlift';
  }
  
  // Bench press variations
  if (name.includes('bench')) {
    return 'bench press';
  }
  
  // Press variations
  if (name.includes('press') && !name.includes('bench')) {
    if (name.includes('overhead') || name.includes('shoulder')) return 'overhead press';
    return 'press';
  }
  
  // Olympic lifts
  if (name.includes('clean')) return 'clean';
  if (name.includes('snatch')) return 'snatch';
  
  // Bodyweight exercises
  if (name.includes('dip')) return 'dips';
  if (name.includes('pull') && name.includes('up')) return 'pull ups';
  if (name.includes('push') && name.includes('up')) return 'push ups';
  
  // Rowing
  if (name.includes('row')) return 'row';
  
  // Default
  return exerciseName.toLowerCase();
};

/**
 * Remove duplicate exercises, keeping the one with highest weight
 */
const removeDuplicateExercises = (exercises) => {
  const exerciseMap = new Map();
  
  exercises.forEach(exercise => {
    const key = exercise.type + '_' + exercise.unit;
    const existing = exerciseMap.get(key);
    
    if (!existing || exercise.weight > existing.weight) {
      exerciseMap.set(key, exercise);
    }
  });
  
  return Array.from(exerciseMap.values());
};

/**
 * Check if extracted exercises represent personal bests
 */
export const checkForPersonalBests = async (exercises, getUserWorkouts) => {
  if (!exercises || exercises.length === 0) {
    console.log('❌ No exercises to check for PRs');
    return null;
  }

  try {
    console.log('🏆 Checking for personal bests among', exercises.length, 'exercises');
    
    // Get all previous workouts
    const allWorkouts = await getUserWorkouts();
    console.log('📚 Loaded', allWorkouts.length, 'previous workouts for PR comparison');
    
    // Build a map of previous best weights by exercise type
    const previousBests = new Map();
    
    allWorkouts.forEach(workout => {
      let workoutExercises = [];
      
      if (workout.extractedExercises && workout.extractedExercises.length > 0) {
        workoutExercises = workout.extractedExercises;
      } else if (workout.notes) {
        workoutExercises = extractExercisesFromWorkout(workout.notes);
      }
      
      workoutExercises.forEach(exercise => {
        if (exercise.weight && exercise.weight > 0) {
          const key = `${exercise.type}_${exercise.unit}`;
          const current = previousBests.get(key);
          
          if (!current || exercise.weight > current.weight) {
            previousBests.set(key, exercise);
          }
        }
      });
    });
    
    console.log('🏆 Previous bests found:', Array.from(previousBests.keys()));
    
    // Check each current exercise against previous bests
    for (const exercise of exercises) {
      if (exercise.weight && exercise.weight > 0) {
        const key = `${exercise.type}_${exercise.unit}`;
        const previousBest = previousBests.get(key);
        
        console.log(`🔍 Checking ${exercise.name} ${exercise.weight}${exercise.unit} vs previous best: ${previousBest?.weight || 'none'}`);
        
        if (!previousBest || exercise.weight > previousBest.weight) {
          const improvement = previousBest ? exercise.weight - previousBest.weight : exercise.weight;
          
          console.log('🏆 PERSONAL BEST DETECTED!', {
            exercise: exercise.name,
            newWeight: exercise.weight,
            previousBest: previousBest?.weight || 0,
            improvement: improvement,
            unit: exercise.unit
          });
          
          return {
            exercise: exercise.name,
            weight: exercise.weight,
            unit: exercise.unit,
            improvement: improvement.toFixed(1),
            previousBest: previousBest?.weight || 0,
            isPR: true
          };
        }
      }
    }
    
    console.log('📊 No personal bests found in current workout');
    return null;
    
  } catch (error) {
    console.error('❌ Error checking for personal bests:', error);
    return null;
  }
};

/**
 * Test function specifically for the problematic format
 */
export const testProblematicFormat = () => {
  const testCase = "Back squat. 2 * 10 @ 185lbs\n2 * 10 @ 225lbs\n\n4* 7 ring dips";
  
  console.log('🧪 Testing problematic format:', testCase);
  const result = extractExercisesFromWorkout(testCase);
  console.log('📊 Results:', result);
  
  return result;
};

// Export both the main function and test function
export default {
  extractExercisesFromWorkout,
  checkForPersonalBests,
  testProblematicFormat
};