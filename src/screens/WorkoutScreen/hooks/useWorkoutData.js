// src/screens/WorkoutScreen/hooks/useWorkoutData.js
import { useState } from 'react';
import { Alert } from 'react-native';
import { addWorkout, getUserWorkouts } from '../../../services/workoutService';

export const useWorkoutData = () => {
  const [workoutText, setWorkoutText] = useState('');
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load workout data from Firebase
  const loadWorkoutData = async () => {
    try {
      setInitialLoading(true);
      const workouts = await getUserWorkouts();
      console.log('Loaded workouts:', workouts?.length || 0);
      setRecentWorkouts(workouts.slice(0, 5)); // Show last 5 workouts
    } catch (error) {
      console.error('Error loading workout data:', error);
      setRecentWorkouts([]);
    } finally {
      setInitialLoading(false);
    }
  };

  // Enhanced exercise extraction with both "at" and "@" symbols
  const extractExercisesFromWorkout = (workoutText) => {
    if (!workoutText) return [];
    
    const exercises = [];
    const lowerText = workoutText.toLowerCase();
    
    console.log('🔍 Starting exercise extraction from:', workoutText);
    
    // Enhanced patterns including single lifts with both "at" and "@" symbols
    const enhancedPatterns = [
      // Single rep patterns with both "at" and "@" keywords
      {
        pattern: /(\d+)\s+(back\s+squat|front\s+squat|overhead\s+squat|squat)\s+(?:at|@)\s+(\d+)\s*(lb|kg|lbs|#)/i,
        type: 'squat',
        name: 'Squat',
        useFirstAsReps: true
      },
      {
        pattern: /(\d+)\s+(deadlift|dl)\s+(?:at|@)\s+(\d+)\s*(lb|kg|lbs|#)/i,
        type: 'deadlift',
        name: 'Deadlift',
        useFirstAsReps: true
      },
      {
        pattern: /(\d+)\s+(clean|power\s+clean)\s+(?:at|@)\s+(\d+)\s*(lb|kg|lbs|#)/i,
        type: 'clean',
        name: 'Clean',
        useFirstAsReps: true
      },
      {
        pattern: /(\d+)\s+(snatch|power\s+snatch)\s+(?:at|@)\s+(\d+)\s*(lb|kg|lbs|#)/i,
        type: 'snatch',
        name: 'Snatch',
        useFirstAsReps: true
      },
      {
        pattern: /(\d+)\s+(bench\s+press|bench)\s+(?:at|@)\s+(\d+)\s*(lb|kg|lbs|#)/i,
        type: 'bench',
        name: 'Bench Press',
        useFirstAsReps: true
      },
      {
        pattern: /(\d+)\s+(overhead\s+press|press)\s+(?:at|@)\s+(\d+)\s*(lb|kg|lbs|#)/i,
        type: 'press',
        name: 'Overhead Press',
        useFirstAsReps: true
      },
      
      // Alternative format patterns - "back squat @ 345lbs" or "back squat at 345lbs"
      {
        pattern: /(back\s+squat|front\s+squat|overhead\s+squat|squat)\s+(?:at|@)\s+(\d+)\s*(lb|kg|lbs|#)/i,
        type: 'squat',
        name: 'Squat',
        simpleFormat: true
      },
      {
        pattern: /(deadlift|dl)\s+(?:at|@)\s+(\d+)\s*(lb|kg|lbs|#)/i,
        type: 'deadlift',
        name: 'Deadlift',
        simpleFormat: true
      },
      {
        pattern: /(clean|power\s+clean)\s+(?:at|@)\s+(\d+)\s*(lb|kg|lbs|#)/i,
        type: 'clean',
        name: 'Clean',
        simpleFormat: true
      },
      {
        pattern: /(snatch|power\s+snatch)\s+(?:at|@)\s+(\d+)\s*(lb|kg|lbs|#)/i,
        type: 'snatch',
        name: 'Snatch',
        simpleFormat: true
      },
      {
        pattern: /(bench\s+press|bench)\s+(?:at|@)\s+(\d+)\s*(lb|kg|lbs|#)/i,
        type: 'bench',
        name: 'Bench Press',
        simpleFormat: true
      },
      {
        pattern: /(overhead\s+press|press)\s+(?:at|@)\s+(\d+)\s*(lb|kg|lbs|#)/i,
        type: 'press',
        name: 'Overhead Press',
        simpleFormat: true
      },

      // Check for snatch workout context
      ...(lowerText.includes('snatch') ? [
        // Snatch-specific patterns for percentage-based training
        {
          pattern: /(\d+)\)\s*(\d+)\s*reps?\s*at\s*\d+%\s*-\s*(\d+)\s*(lbs?|lb|kg|#)/gi,
          type: 'snatch',
          name: 'Snatch',
          snatchSpecial: true
        },
        {
          pattern: /(\d+)\s*reps?\s*at\s*\d+%\s*-\s*(\d+)\s*(lbs?|lb|kg|#)/gi,
          type: 'snatch',
          name: 'Snatch',
          snatchSpecial: true
        }
      ] : []),

      // Traditional patterns: sets x reps @ weight (enhanced with both @ and at)
      {
        pattern: /(back\s+squat|front\s+squat|overhead\s+squat|squat)\s*:?\s*(\d+)\s*x\s*(\d+)\s*(?:@|at)?\s*(\d+)\s*(lb|kg|lbs|#)/i,
        type: 'squat',
        name: 'Squat'
      },
      {
        pattern: /(deadlift|dl)\s*:?\s*(\d+)\s*x\s*(\d+)\s*(?:@|at)?\s*(\d+)\s*(lb|kg|lbs|#)/i,
        type: 'deadlift',
        name: 'Deadlift'
      },
      {
        pattern: /(clean|power\s+clean|squat\s+clean|hang\s+clean)\s*:?\s*(\d+)\s*x\s*(\d+)\s*(?:@|at)?\s*(\d+)\s*(lb|kg|lbs|#)/i,
        type: 'clean',
        name: 'Clean'
      },
      {
        pattern: /(snatch|power\s+snatch|squat\s+snatch)\s*:?\s*(\d+)\s*x\s*(\d+)\s*(?:@|at)?\s*(\d+)\s*(lb|kg|lbs|#)/i,
        type: 'snatch',
        name: 'Snatch'
      },
      {
        pattern: /(bench\s+press|bench)\s*:?\s*(\d+)\s*x\s*(\d+)\s*(?:@|at)?\s*(\d+)\s*(lb|kg|lbs|#)/i,
        type: 'bench',
        name: 'Bench Press'
      },
      {
        pattern: /(overhead\s+press|press|shoulder\s+press)\s*:?\s*(\d+)\s*x\s*(\d+)\s*(?:@|at)?\s*(\d+)\s*(lb|kg|lbs|#)/i,
        type: 'press',
        name: 'Overhead Press'
      },

      // Single weight patterns: "exercise weight"
      {
        pattern: /(back\s+squat|front\s+squat|overhead\s+squat|squat)\s*:?\s*(\d+)\s*(lb|kg|lbs|#)/i,
        type: 'squat',
        name: 'Squat',
        single: true
      },
      {
        pattern: /(deadlift|dl)\s*:?\s*(\d+)\s*(lb|kg|lbs|#)/i,
        type: 'deadlift',
        name: 'Deadlift',
        single: true
      },
      {
        pattern: /(clean|power\s+clean|squat\s+clean|hang\s+clean)\s*:?\s*(\d+)\s*(lb|kg|lbs|#)/i,
        type: 'clean',
        name: 'Clean',
        single: true
      },
      {
        pattern: /(bench\s+press|bench)\s*:?\s*(\d+)\s*(lb|kg|lbs|#)/i,
        type: 'bench',
        name: 'Bench Press',
        single: true
      }
    ];

    enhancedPatterns.forEach(exercisePattern => {
      const matches = [...workoutText.matchAll(new RegExp(exercisePattern.pattern.source, 'gi'))];
      
      matches.forEach((match, index) => {
        if (exercisePattern.useFirstAsReps) {
          // Handle "1 back squat at/@ 345lbs" format
          exercises.push({
            type: exercisePattern.type,
            name: match[2].trim(), // exercise name
            reps: parseInt(match[1]), // first number is reps
            weight: parseInt(match[3]), // weight after "at"/"@"
            unit: match[4].toLowerCase().replace('#', 'lb').replace('lbs', 'lb'),
            sets: 1,
            scheme: `1x${match[1]}`,
            raw: match[0]
          });
          console.log(`✅ Extracted ${exercisePattern.type} (single): ${match[1]} reps @ ${match[3]}${match[4]}`);
        } else if (exercisePattern.simpleFormat) {
          // Handle "back squat @ 345lbs" format (no rep count specified)
          exercises.push({
            type: exercisePattern.type,
            name: match[1].trim(), // exercise name
            reps: 1, // assume 1 rep for simple format
            weight: parseInt(match[2]), // weight
            unit: match[3].toLowerCase().replace('#', 'lb').replace('lbs', 'lb'),
            sets: 1,
            scheme: '1x1',
            raw: match[0]
          });
          console.log(`✅ Extracted ${exercisePattern.type} (simple): ${match[2]}${match[3]}`);
        } else if (exercisePattern.snatchSpecial) {
          // Handle snatch percentage patterns
          let reps, weight, unit;
          if (match[0].includes(')')) {
            // Format: "1) 3 reps at 70% - 115lbs"
            reps = parseInt(match[2]);
            weight = parseInt(match[3]);
            unit = match[4].toLowerCase().replace('lbs', 'lb').replace('#', 'lb');
          } else {
            // Format: "3 reps at 70% - 115lbs"
            reps = parseInt(match[1]);
            weight = parseInt(match[2]);
            unit = match[3].toLowerCase().replace('lbs', 'lb').replace('#', 'lb');
          }
          
          exercises.push({
            type: exercisePattern.type,
            name: exercisePattern.name,
            sets: 1,
            reps: reps || 1,
            weight: weight,
            unit: unit,
            scheme: `1x${reps || 1}`,
            raw: match[0],
            setNumber: index + 1
          });
          console.log(`✅ Extracted snatch: ${weight}${unit} for ${reps} reps`);
        } else if (exercisePattern.single) {
          exercises.push({
            type: exercisePattern.type,
            name: match[1].trim(),
            weight: parseInt(match[2]),
            unit: match[3].toLowerCase().replace('#', 'lb').replace('lbs', 'lb'),
            sets: 1,
            reps: 1,
            scheme: 'Single',
            raw: match[0]
          });
          console.log(`✅ Extracted ${exercisePattern.type} (single): ${match[2]}${match[3]}`);
        } else {
          // Traditional format handling
          exercises.push({
            type: exercisePattern.type,
            name: match[1].trim(),
            sets: parseInt(match[2]),
            reps: parseInt(match[3]),
            weight: parseInt(match[4]),
            unit: match[5].toLowerCase().replace('#', 'lb').replace('lbs', 'lb'),
            scheme: `${match[2]}x${match[3]}`,
            raw: match[0]
          });
          console.log(`✅ Extracted ${exercisePattern.type}: ${match[2]}x${match[3]} @ ${match[4]}${match[5]}`);
        }
      });
    });
    
    console.log(`📊 Total exercises extracted: ${exercises.length}`);
    exercises.forEach((ex, i) => {
      console.log(`${i + 1}. ${ex.name}: ${ex.weight}${ex.unit} (${ex.scheme})`);
    });
    
    return exercises;
  };

  // Enhanced workout classification
  const getWorkoutType = (text) => {
    const lowerText = text.toLowerCase();
    console.log('Analyzing workout text:', text);
    
    // STRENGTH - Olympic lifts and powerlifting (check first for priority)
    if (lowerText.includes('snatch') || lowerText.includes('clean') || lowerText.includes('jerk') ||
        lowerText.includes('deadlift') || lowerText.includes('squat') || lowerText.includes('bench')) {
      console.log('Found Olympic/Powerlifting movement = STRENGTH');
      return 'strength';
    }
    
    // STRENGTH - Weight indicators and exercise patterns
    if (lowerText.includes('lb') || lowerText.includes('kg') || lowerText.includes('lbs') ||
        lowerText.includes('rep') || lowerText.includes('set') || lowerText.includes('weight') ||
        lowerText.includes('press') || lowerText.includes('curl') || lowerText.includes('pull') || 
        lowerText.includes('push') || lowerText.includes('lift') || lowerText.includes('@') || lowerText.includes(' at ')) {
      console.log('Found strength exercise indicators = STRENGTH');
      return 'strength';
    }
    
    // CARDIO - distance-based activities
    if (lowerText.includes('row') && (lowerText.includes('km') || lowerText.includes('m') || lowerText.includes('meter') || lowerText.includes('mile'))) {
      console.log('Found ROW + distance = CARDIO');
      return 'cardio';
    }
    
    if (lowerText.includes('bike') && (lowerText.includes('km') || lowerText.includes('m') || lowerText.includes('mile') || lowerText.includes('min'))) {
      console.log('Found BIKE + distance/time = CARDIO');
      return 'cardio';
    }
    
    if (lowerText.includes('run') && (lowerText.includes('km') || lowerText.includes('m') || lowerText.includes('mile') || lowerText.includes('min'))) {
      console.log('Found RUN + distance/time = CARDIO');
      return 'cardio';
    }

    if (lowerText.includes('walk') && (lowerText.includes('km') || lowerText.includes('m') || lowerText.includes('mile') || lowerText.includes('min'))) {
      console.log('Found WALK + distance/time = CARDIO');
      return 'cardio';
    }

    if (lowerText.includes('swim') || lowerText.includes('cycling') || lowerText.includes('elliptical')) {
      console.log('Found cardio activity = CARDIO');
      return 'cardio';
    }

    // FLEXIBILITY/MOBILITY
    if (lowerText.includes('yoga') || lowerText.includes('stretch') || lowerText.includes('pilates') ||
        lowerText.includes('mobility') || lowerText.includes('foam roll')) {
      console.log('Found flexibility activity = FLEXIBILITY');
      return 'flexibility';
    }
    
    // DEFAULT
    console.log('No specific pattern found = GENERAL');
    return 'general';
  };

  // Get previous best from workout history for PR detection
  const getPreviousBest = async (exerciseType, unit) => {
    try {
      const workouts = await getUserWorkouts();
      let bestWeight = 0;
      
      workouts.forEach(workout => {
        if (workout.notes && workout.type === 'strength') {
          const exercises = extractExercisesFromWorkout(workout.notes);
          
          exercises.forEach(exercise => {
            if (exercise.type === exerciseType && exercise.unit === unit) {
              if (exercise.weight > bestWeight) {
                bestWeight = exercise.weight;
              }
            }
          });
        }
      });
      
      return bestWeight;
    } catch (error) {
      console.error('Error getting previous best:', error);
      return 0;
    }
  };

  // Enhanced PR detection
  const checkForPersonalBest = async (workoutText, workoutType) => {
    console.log('🏆 Starting PR check for workout type:', workoutType);
    console.log('🏆 Workout text:', workoutText);
    
    if (workoutType !== 'strength') {
      console.log('❌ Not a strength workout, skipping PR check');
      return false;
    }
    
    const exercises = extractExercisesFromWorkout(workoutText);
    console.log('🏆 Extracted exercises for PR check:', exercises);
    
    if (exercises.length === 0) {
      console.log('❌ No exercises extracted, no PR possible');
      return false;
    }
    
    for (const exercise of exercises) {
      console.log(`🏆 Checking PR for ${exercise.type}: ${exercise.weight}${exercise.unit}`);
      
      const previousBest = await getPreviousBest(exercise.type, exercise.unit);
      console.log(`🏆 Previous best for ${exercise.type}: ${previousBest}${exercise.unit}`);
      
      if (exercise.weight > previousBest) {
        const prData = {
          exercise: exercise.name.toUpperCase(),
          weight: exercise.weight,
          unit: exercise.unit,
          improvement: exercise.weight - previousBest,
          previousBest: previousBest,
          scheme: exercise.scheme || `${exercise.reps} reps`,
          reps: exercise.reps || 1
        };
        
        console.log('🎉 PERSONAL BEST DETECTED!', prData);
        return prData;
      }
    }
    
    console.log('❌ No personal bests found');
    return false;
  };

  // Enhanced handleAddWorkout with PR detection
  const handleAddWorkout = async () => {
    console.log('🏋️‍♂️ Starting workout logging...');
    
    if (!workoutText.trim()) {
      Alert.alert('Error', 'Please enter your workout details');
      return { success: false };
    }

    setLoading(true);
    try {
      const workoutType = getWorkoutType(workoutText);
      console.log('Classified as:', workoutType);
      
      // IMPORTANT: Check for PR BEFORE saving (using current workout data)
      const personalBest = await checkForPersonalBest(workoutText, workoutType);
      console.log('Personal best check result:', personalBest);
      
      // Extract exercises for better data structure
      const exercises = extractExercisesFromWorkout(workoutText);
      console.log('Extracted exercises:', exercises);
      
      // Create workout object
      const workout = {
        title: `${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Workout - ${new Date().toLocaleDateString()}`,
        type: workoutType,
        exercises: exercises.length > 0 ? exercises.map(ex => ({
          name: ex.name,
          type: ex.type,
          sets: ex.sets || 1,
          reps: ex.reps || 1,
          weight: ex.weight,
          unit: ex.unit,
          scheme: ex.scheme,
          category: workoutType === 'cardio' ? 'cardio' : 
                   workoutType === 'strength' ? 'strengthLifts' :
                   workoutType === 'flexibility' ? 'flexibility' : 'general',
          notes: workoutText
        })) : [{
          name: workoutType === 'cardio' ? 'Cardio Session' : 
                workoutType === 'strength' ? 'Strength Training' :
                workoutType === 'flexibility' ? 'Flexibility Work' : 'General Training',
          category: workoutType === 'cardio' ? 'cardio' : 
                   workoutType === 'strength' ? 'strengthLifts' :
                   workoutType === 'flexibility' ? 'flexibility' : 'general',
          sets: [{ duration: 1800, completed: true }],
          notes: workoutText
        }],
        duration: workoutType === 'cardio' ? 30 : 
                 workoutType === 'strength' ? 45 : 
                 workoutType === 'flexibility' ? 20 : 35,
        notes: workoutText,
        rating: personalBest ? 5 : 3,
        muscleGroups: workoutType === 'strength' ? ['fullBody'] : 
                     workoutType === 'cardio' ? ['cardiovascular'] : 
                     ['fullBody'],
        intensity: personalBest ? 'high' : 'moderate',
        personalBest: personalBest || false,
        extractedExercises: exercises,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('Saving workout:', workout);
      await addWorkout(workout);
      console.log('✅ Workout saved successfully!');
      
      // Show success message for non-PR workouts
      if (!personalBest) {
        Alert.alert('Success', `${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} workout logged successfully!`);
      }
      
      setWorkoutText('');
      await loadWorkoutData();
      
      return { 
        success: true, 
        personalBest,
        workoutType,
        workout 
      };
      
    } catch (error) {
      console.error('❌ Error saving workout:', error);
      Alert.alert('Error', `Failed to log workout: ${error.message || 'Unknown error'}`);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    workoutText,
    setWorkoutText,
    recentWorkouts,
    loading,
    initialLoading,
    
    // Actions
    loadWorkoutData,
    handleAddWorkout,
    
    // Utilities
    extractExercisesFromWorkout,
    getWorkoutType,
    checkForPersonalBest
  };
};