// src/screens/WorkoutScreen/components/RecentWorkouts.js
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FalloutButton from '../../../components/ui/FalloutButton';
import { colors } from '../../../theme/colors';

const RecentWorkouts = ({
  workouts = [],
  onWorkoutPress,
  onPersonalBestsPress, // Changed from onExerciseHistoryPress
  onHistoryPress,
  historyLoading = false
}) => {
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Today';
      if (diffDays === 2) return 'Yesterday';
      if (diffDays <= 7) return `${diffDays - 1} days ago`;
      
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch (error) {
      return 'Unknown Date';
    }
  };

  // Get workout summary for display
  const getWorkoutSummary = (workout) => {
    if (!workout) return 'Workout';
    
    // Check if it's from AI Coach
    if (workout.isFromAI || workout.aiRecommendation) {
      return '🤖 AI Coach Workout';
    }
    
    // Check for extracted exercises
    if (workout.extractedExercises && workout.extractedExercises.length > 0) {
      const mainExercise = workout.extractedExercises[0];
      if (mainExercise.weight && mainExercise.weight > 0) {
        return `${mainExercise.name} ${mainExercise.weight}${mainExercise.unit}`;
      }
      return mainExercise.name;
    }
    
    // Check exercises array
    if (workout.exercises && workout.exercises.length > 0) {
      const mainExercise = workout.exercises[0];
      if (mainExercise.weight && mainExercise.weight > 0) {
        return `${mainExercise.name} ${mainExercise.weight}${mainExercise.unit}`;
      }
      return mainExercise.name;
    }
    
    // Fall back to workout type or title
    if (workout.type) {
      return `${workout.type.charAt(0).toUpperCase() + workout.type.slice(1)} Workout`;
    }
    
    return workout.title || 'Workout';
  };

  // Get workout type emoji
  const getWorkoutEmoji = (workout) => {
    if (!workout) return '💪';
    
    if (workout.isFromAI || workout.aiRecommendation) return '🤖';
    if (workout.personalBest) return '🏆';
    
    switch (workout.type) {
      case 'strength': return '🏋️‍♂️';
      case 'cardio': return '🏃‍♂️';
      case 'flexibility': return '🧘‍♀️';
      default: return '💪';
    }
  };

  // Get workout notes preview
  const getNotesPreview = (workout) => {
    if (!workout.notes) return '';
    
    // Truncate long notes
    if (workout.notes.length > 80) {
      return workout.notes.substring(0, 80) + '...';
    }
    
    return workout.notes;
  };

  // Render individual workout card
  const WorkoutCard = ({ workout, index }) => (
    <TouchableOpacity
      key={workout.id || index}
      style={[
        styles.workoutCard,
        workout.personalBest && styles.workoutCardPR
      ]}
      onPress={() => onWorkoutPress && onWorkoutPress(workout)}
      activeOpacity={0.7}
    >
      <View style={styles.workoutHeader}>
        <View style={styles.workoutTitleRow}>
          <Text style={styles.workoutEmoji}>
            {getWorkoutEmoji(workout)}
          </Text>
          <View style={styles.workoutInfo}>
            <Text style={styles.workoutTitle}>
              {getWorkoutSummary(workout)}
            </Text>
            <Text style={styles.workoutDate}>
              {formatDate(workout.date || workout.createdAt)}
            </Text>
          </View>
          {workout.personalBest && (
            <View style={styles.prBadge}>
              <Text style={styles.prBadgeText}>PR!</Text>
            </View>
          )}
        </View>
      </View>
      
      {workout.notes && (
        <Text style={styles.workoutNotes} numberOfLines={2}>
          {getNotesPreview(workout)}
        </Text>
      )}
      
      <View style={styles.workoutMeta}>
        <Text style={styles.workoutType}>
          {workout.type ? workout.type.toUpperCase() : 'WORKOUT'}
        </Text>
        {workout.duration && (
          <Text style={styles.workoutDuration}>
            {workout.duration} min
          </Text>
        )}
        {workout.rating && (
          <Text style={styles.workoutRating}>
            {'⭐'.repeat(Math.min(workout.rating, 5))}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Recent Workouts</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.smallButton}
            onPress={onPersonalBestsPress}
            activeOpacity={0.7}
          >
            <Text style={styles.smallButtonText}>🏆 Personal Bests</Text>
          </TouchableOpacity>
        </View>
      </View>

      {workouts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateEmoji}>🚀</Text>
          <Text style={styles.emptyStateTitle}>Ready for your first workout?</Text>
          <Text style={styles.emptyStateText}>
            Log your first workout above to start tracking your fitness journey!
          </Text>
        </View>
      ) : (
        <>
          <ScrollView 
            style={styles.workoutsList}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {workouts.map((workout, index) => (
              <WorkoutCard key={workout.id || index} workout={workout} index={index} />
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <FalloutButton
              text={historyLoading ? "LOADING..." : "📅 VIEW 30-DAY HISTORY"}
              onPress={onHistoryPress}
              style={styles.historyButton}
              type="secondary"
              isLoading={historyLoading}
            />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.ui.border,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  smallButton: {
    backgroundColor: colors.ui.inputBg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  smallButtonText: {
    color: colors.text.secondary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 30,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyStateTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateText: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  workoutsList: {
    maxHeight: 300,
  },
  workoutCard: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  workoutCardPR: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  workoutHeader: {
    marginBottom: 8,
  },
  workoutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  workoutDate: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  prBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  prBadgeText: {
    color: colors.background.dark,
    fontSize: 10,
    fontWeight: 'bold',
  },
  workoutNotes: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  workoutMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutType: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  workoutDuration: {
    color: colors.text.secondary,
    fontSize: 10,
  },
  workoutRating: {
    fontSize: 12,
  },
  footer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.ui.border,
  },
  historyButton: {
    backgroundColor: colors.ui.inputBg,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
});

export default RecentWorkouts;