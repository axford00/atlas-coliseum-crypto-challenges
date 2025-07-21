// WorkoutScreen.js - Clean Modern Version with Enhanced AI Features & Gym Integration
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import FalloutButton from '../components/ui/FalloutButton';
import { colors, globalStyles } from '../theme/colors';

// Imported Components
import AICoachModal from './WorkoutScreen/components/AICoachModal';
import CelebrationModal from './WorkoutScreen/components/CelebrationModal';
import GymWODSection from './WorkoutScreen/components/GymWODSection';
import PersonalBestsModal from './WorkoutScreen/components/PersonalBestsModal';
import RecentWorkouts from './WorkoutScreen/components/RecentWorkouts';
import WorkoutHistoryModal from './WorkoutScreen/components/WorkoutHistoryModal';
import WorkoutInput from './WorkoutScreen/components/WorkoutInput';

// Imported Hooks
import { useAICoach } from './WorkoutScreen/hooks/useAICoach';
import { useGymWOD } from './WorkoutScreen/hooks/useGymWOD';
import { usePersonalBests } from './WorkoutScreen/hooks/usePersonalBests';
import { useWorkoutData } from './WorkoutScreen/hooks/useWorkoutData';

// Imported Utilities
import { addWorkout, getUserWorkouts } from '../services/workoutService';
import { extractExercisesFromWorkout } from '../utils/exerciseExtraction';
import { getWorkoutType } from '../utils/workoutClassification';

// ADDED: Import gym detection service
import { gymDetectionService } from '../services/gymDetectionService';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const WorkoutScreen = ({ navigation }) => {
  // Core workout data management
  const {
    workoutText,
    setWorkoutText,
    recentWorkouts,
    loading,
    initialLoading,
    loadWorkoutData
  } = useWorkoutData();

  // AI Coach functionality
  const {
    aiRecommendation,
    showAiModal,
    loading: aiLoading,
    getRecommendation,
    handleFeedback,
    closeModal,
    getNewRecommendation
  } = useAICoach();

  // Gym WOD functionality - ENHANCED
  const {
    gymWOD,
    gymInfo,
    loadingGymWOD
  } = useGymWOD();

  // Personal Best detection and celebration
  const {
    showCelebration,
    celebrationData,
    checkForPersonalBest,
    triggerCelebration,
    hideCelebration,
    confettiPieces,
    renderConfettiPiece
  } = usePersonalBests();

  // History modal state
  const [showHistory, setShowHistory] = useState(false);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Personal Bests modal state
  const [showPersonalBests, setShowPersonalBests] = useState(false);
  const [personalBestsLoading, setPersonalBestsLoading] = useState(false);
  const [allWorkoutsForPR, setAllWorkoutsForPR] = useState([]);

  // ADDED: Enhanced gym detection state
  const [detectedGym, setDetectedGym] = useState(null);
  const [gymWODData, setGymWODData] = useState(null);
  const [loadingGymDetection, setLoadingGymDetection] = useState(false);

  // ADDED: Load user profile and detect gym
  const loadUserProfileAndGym = async () => {
    try {
      setLoadingGymDetection(true);
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        console.log('❌ No authenticated user for gym detection');
        return;
      }

      console.log('👤 Loading user profile for gym detection:', user.uid);
      
      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        console.log('❌ No user profile found');
        return;
      }

      const userData = userDoc.data();
      console.log('✅ User profile loaded:', userData);
      
      // Check if user has gym info in their profile
      const profileText = userData.profile || '';
      
      if (profileText.trim()) {
        console.log('🔍 Analyzing profile for gym detection:', profileText);
        
        // Use gym detection service
        const gymSuggestion = await gymDetectionService.suggestGymWorkout(profileText);
        
        if (gymSuggestion.hasGym) {
          console.log('🏋️ Gym detected:', gymSuggestion.gym);
          setDetectedGym(gymSuggestion.gym);
          
          if (gymSuggestion.wod) {
            console.log('📋 WOD available:', gymSuggestion.wod);
            setGymWODData(gymSuggestion.wod);
          }
        } else {
          console.log('❌ No gym detected in profile');
        }
      } else {
        console.log('❌ No profile text to analyze');
      }
      
    } catch (error) {
      console.error('❌ Error in gym detection:', error);
    } finally {
      setLoadingGymDetection(false);
    }
  };

  // Load initial data - ENHANCED
  useEffect(() => {
    loadWorkoutData();
    loadUserProfileAndGym(); // ADDED: Load gym detection
  }, []);

  // Enhanced workout logging with PR detection
  const handleAddWorkout = async () => {
    console.log('🏋️‍♂️ Starting workout logging...');
    
    if (!workoutText.trim()) {
      Alert.alert('Error', 'Please enter your workout details');
      return;
    }

    try {
      // Classify workout type using utility
      const workoutType = getWorkoutType(workoutText);
      console.log('Classified as:', workoutType);
      
      // Extract exercises using utility
      const exercises = extractExercisesFromWorkout(workoutText);
      console.log('Extracted exercises:', exercises);
      
      // Check for personal best BEFORE saving
      const personalBest = await checkForPersonalBest(exercises, getUserWorkouts);
      console.log('Personal best check result:', personalBest);
      
      // Create comprehensive workout object
      const workout = createWorkoutObject(workoutText, workoutType, exercises, personalBest);
      
      console.log('Saving workout:', workout);
      await addWorkout(workout);
      console.log('✅ Workout saved successfully!');
      
      // Handle PR celebration
      if (personalBest) {
        console.log('🎉 Personal best detected!', personalBest);
        setTimeout(() => {
          triggerCelebration(personalBest);
        }, 100);
        
        Alert.alert(
          'Personal Best! 🏆',
          `New ${personalBest.exercise} PR: ${personalBest.weight}${personalBest.unit}!\n\n+${personalBest.improvement}${personalBest.unit} improvement!`,
          [{ text: 'AMAZING!', style: 'default' }]
        );
      } else {
        // Show success message for non-PR workouts
        Alert.alert('Success', `${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} workout logged successfully!`);
      }
      
      setWorkoutText('');
      await loadWorkoutData();
      
    } catch (error) {
      console.error('❌ Error in enhanced workout logging:', error);
      Alert.alert('Error', `Failed to log workout: ${error.message || 'Unknown error'}`);
    }
  };

  // Create comprehensive workout object using utilities
  const createWorkoutObject = (workoutText, workoutType, exercises, personalBest) => {
    return {
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
        category: getExerciseCategory(workoutType),
        notes: workoutText
      })) : [createDefaultExercise(workoutType, workoutText)],
      duration: estimateWorkoutDuration(workoutType, exercises),
      notes: workoutText,
      rating: personalBest ? 5 : 3,
      muscleGroups: getMuscleGroups(workoutType),
      intensity: personalBest ? 'high' : 'moderate',
      personalBest: personalBest || false,
      extractedExercises: exercises,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  // Helper function to get exercise category
  const getExerciseCategory = (workoutType) => {
    switch (workoutType) {
      case 'cardio': return 'cardio';
      case 'strength': return 'strengthLifts';
      case 'flexibility': return 'flexibility';
      default: return 'general';
    }
  };

  // Helper function to create default exercise when none extracted
  const createDefaultExercise = (workoutType, workoutText) => {
    return {
      name: workoutType === 'cardio' ? 'Cardio Session' : 
            workoutType === 'strength' ? 'Strength Training' :
            workoutType === 'flexibility' ? 'Flexibility Work' : 'General Training',
      category: getExerciseCategory(workoutType),
      sets: [{ duration: 1800, completed: true }],
      notes: workoutText
    };
  };

  // Helper function to estimate workout duration
  const estimateWorkoutDuration = (workoutType, exercises) => {
    if (exercises.length > 0) {
      // Estimate based on number of exercises
      return Math.max(20, Math.min(90, 20 + exercises.length * 8));
    }
    
    // Default durations by type
    switch (workoutType) {
      case 'cardio': return 30;
      case 'strength': return 45;
      case 'flexibility': return 20;
      default: return 35;
    }
  };

  // Helper function to get muscle groups
  const getMuscleGroups = (workoutType) => {
    switch (workoutType) {
      case 'strength': return ['fullBody'];
      case 'cardio': return ['cardiovascular'];
      default: return ['fullBody'];
    }
  };

  // Enhanced AI workout logging
  const handleAIWorkoutLog = async (logData) => {
    console.log('🤖 Logging AI recommended workout:', logData);
    
    try {
      const workoutType = getWorkoutType(logData.workoutText);
      
      const workout = {
        title: `AI Coach ${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Workout - ${new Date().toLocaleDateString()}`,
        type: workoutType,
        notes: logData.workoutText,
        aiRecommendation: logData.aiRecommendation,
        isFromAI: true,
        extractedExercises: logData.extractedExercises || [],
        aiNotes: logData.notes,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addWorkout(workout);
      console.log('✅ AI workout saved successfully!');
      
      Alert.alert('Workout Logged! 🎉', 'Your AI-recommended workout has been saved successfully!');
      await loadWorkoutData();
      
    } catch (error) {
      console.error('❌ Error saving AI workout:', error);
      Alert.alert('Error', `Failed to log workout: ${error.message || 'Unknown error'}`);
    }
  };

  // Load 30-day workout history
  const load30DayHistory = async () => {
    try {
      setHistoryLoading(true);
      const allWorkouts = await getUserWorkouts();
      
      // Filter last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentWorkouts = allWorkouts.filter(workout => {
        const workoutDate = new Date(workout.date || workout.createdAt);
        return workoutDate >= thirtyDaysAgo;
      });

      // Group by date
      const groupedWorkouts = recentWorkouts.reduce((groups, workout) => {
        const date = workout.date || workout.createdAt?.split('T')[0];
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(workout);
        return groups;
      }, {});

      // Convert to sorted array
      const sortedHistory = Object.entries(groupedWorkouts)
        .map(([date, workouts]) => ({ date, workouts }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setWorkoutHistory(sortedHistory);
      setShowHistory(true);
    } catch (error) {
      console.error('Error loading workout history:', error);
      Alert.alert('Error', 'Failed to load workout history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Handle personal bests view - loads ALL workouts first
  const handlePersonalBestsPress = async () => {
    try {
      setPersonalBestsLoading(true);
      console.log('Loading personal bests...');
      
      // Get ALL workouts for personal bests calculation
      const allWorkouts = await getUserWorkouts();
      console.log('Loaded workouts for personal bests:', allWorkouts?.length || 0);
      
      // Store all workouts for the PersonalBestsModal
      setAllWorkoutsForPR(allWorkouts);
      
      // Now open the modal with the loaded data
      setShowPersonalBests(true);
      
    } catch (error) {
      console.error('Error loading personal bests:', error);
      Alert.alert('Error', 'Failed to load personal bests');
    } finally {
      setPersonalBestsLoading(false);
    }
  };

  // Handle workout detail view - opens editing modal properly
  const handleWorkoutPress = (workout) => {
    console.log('Workout pressed for editing:', workout);
    // Open the workout history modal with this specific workout selected
    setWorkoutHistory([{
      date: workout.date || workout.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
      workouts: [workout]
    }]);
    setShowHistory(true);
  };

  // ADDED: Enhanced get AI recommendation with gym context
  const handleGetAIRecommendation = async () => {
    try {
      // Pass gym context to AI if available
      const gymContext = detectedGym ? {
        gymName: detectedGym.name,
        gymType: detectedGym.type,
        hasWOD: detectedGym.hasWOD,
        currentWOD: gymWODData?.content
      } : null;
      
      await getRecommendation(gymContext);
    } catch (error) {
      console.error('Error getting AI recommendation:', error);
      await getRecommendation(); // Fallback without gym context
    }
  };

  // Loading state
  if (initialLoading) {
    return (
      <View style={styles.background}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your workouts...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.background}>
      <View style={styles.container}>
        {/* HUD-style corners */}
        <View style={globalStyles.hudCorner1} />
        <View style={globalStyles.hudCorner2} />
        <View style={globalStyles.hudCorner3} />
        <View style={globalStyles.hudCorner4} />

        <ScrollView style={styles.content}>
          {/* Centered title without back button */}
          <View style={styles.titleContainer}>
            <Text style={styles.titleTop}>LOG</Text>
            <Text style={styles.titleBottom}>WORKOUT</Text>
          </View>
          
          {/* ENHANCED: Gym WOD Section with detection */}
          <GymWODSection
            gymWOD={gymWODData} // Use detected gym WOD data
            gymInfo={detectedGym} // Use detected gym info
            loadingGymWOD={loadingGymDetection || loadingGymWOD}
            onUseWOD={setWorkoutText}
            onGetAIHelp={handleGetAIRecommendation} // Enhanced with gym context
          />
          
          {/* ADDED: Gym Detection Status (only show if no gym detected) */}
          {!loadingGymDetection && !detectedGym && (
            <View style={styles.gymHintContainer}>
              <Text style={styles.gymHintText}>
                💡 Add your gym name to your profile to get personalized WODs!
              </Text>
              <FalloutButton
                text="UPDATE PROFILE"
                onPress={() => navigation.navigate('ProfileScreen')}
                style={styles.gymHintButton}
                type="secondary"
              />
            </View>
          )}
          
          {/* Workout Input */}
          <WorkoutInput
            workoutText={workoutText}
            onChangeText={setWorkoutText}
            onSubmit={handleAddWorkout}
            loading={loading}
          />

          {/* AI Coach Button */}
          <View style={styles.aiCoachContainer}>
            <FalloutButton
              text={aiLoading ? "THINKING..." : "🤖 GET AI COACH RECOMMENDATION"}
              onPress={handleGetAIRecommendation} // Use enhanced version
              style={styles.aiCoachButton}
              type="secondary"
              isLoading={aiLoading}
            />
          </View>

          {/* Recent Workouts Section */}
          <RecentWorkouts
            workouts={recentWorkouts}
            onWorkoutPress={handleWorkoutPress}
            onPersonalBestsPress={handlePersonalBestsPress}
            onHistoryPress={load30DayHistory}
            historyLoading={historyLoading}
          />

          {/* Bottom Action Button */}
          <View style={styles.actionButtons}>
            <FalloutButton
              text="BACK TO HOME"
              onPress={() => navigation.goBack()}
              style={styles.actionButton}
              type="secondary"
            />
          </View>
        </ScrollView>

        {/* Enhanced AI Coach Modal */}
        <AICoachModal
          visible={showAiModal}
          onClose={closeModal}
          recommendation={aiRecommendation}
          onFeedback={handleFeedback}
          onGetNew={getNewRecommendation}
          onLogWorkout={handleAIWorkoutLog}
          loading={aiLoading}
        />

        {/* Personal Best Celebration Modal */}
        <CelebrationModal
          visible={showCelebration}
          celebrationData={celebrationData}
          onClose={hideCelebration}
          confettiPieces={confettiPieces}
          renderConfettiPiece={renderConfettiPiece}
        />

        {/* Personal Bests Modal - now receives ALL workouts */}
        <PersonalBestsModal
          visible={showPersonalBests}
          onClose={() => setShowPersonalBests(false)}
          workouts={allWorkoutsForPR} // Now passes ALL workouts for proper PR calculation
          loading={personalBestsLoading}
        />

        {/* 30-Day History Modal */}
        <WorkoutHistoryModal
          visible={showHistory}
          onClose={() => setShowHistory(false)}
          workoutHistory={workoutHistory}
          loading={historyLoading}
          onWorkoutUpdated={async () => {
            // Refresh both recent workouts and history when a workout is edited/deleted
            await loadWorkoutData();
            await load30DayHistory();
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text.primary,
    marginTop: 10,
    fontSize: 16,
  },
  // Consistent title styling without back button
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  titleTop: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.secondary,
    letterSpacing: 3,
    marginBottom: -5,
  },
  titleBottom: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    letterSpacing: 2,
  },
  // ADDED: Gym hint styles
  gymHintContainer: {
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.ui.border,
    alignItems: 'center',
  },
  gymHintText: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 18,
  },
  gymHintButton: {
    backgroundColor: colors.ui.inputBg,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  aiCoachContainer: {
    marginBottom: 20,
  },
  aiCoachButton: {
    backgroundColor: colors.ui.inputBg,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  actionButtons: {
    gap: 15,
    marginTop: 20,
  },
  actionButton: {
    marginBottom: 10,
  },
});

export default WorkoutScreen;