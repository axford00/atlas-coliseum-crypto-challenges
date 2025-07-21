// src/screens/WorkoutScreen/components/PersonalBestsModal.js - FIXED: Removed useless "By Weight" button
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import FalloutButton from '../../../components/ui/FalloutButton';
import { colors } from '../../../theme/colors';
import { extractExercisesFromWorkout } from '../../../utils/exerciseExtraction';

const PersonalBestsModal = ({
  visible,
  onClose,
  workouts = [],
  loading = false
}) => {
  const [personalBests, setPersonalBests] = useState({});

  useEffect(() => {
    if (visible && workouts.length > 0) {
      calculatePersonalBests();
    }
  }, [visible, workouts]);

  const calculatePersonalBests = () => {
    console.log('🏆 Calculating personal bests from', workouts.length, 'workouts');
    const bests = {};
    
    workouts.forEach(workout => {
      let exercises = [];
      
      // Extract exercises from workout
      if (workout.extractedExercises && workout.extractedExercises.length > 0) {
        exercises = workout.extractedExercises;
      } else if (workout.notes) {
        console.log('🔍 Extracting exercises from workout notes:', workout.notes);
        exercises = extractExercisesFromWorkout(workout.notes);
        console.log('📊 Extracted exercises:', exercises);
      }
      
      exercises.forEach(exercise => {
        if (exercise.weight && exercise.weight > 0) {
          const key = `${exercise.type}_${exercise.unit}`;
          
          if (!bests[key] || exercise.weight > bests[key].weight) {
            console.log('🏆 New personal best found:', exercise.name, exercise.weight + exercise.unit);
            bests[key] = {
              ...exercise,
              date: workout.date || workout.createdAt,
              workoutId: workout.id,
              isPersonalBest: workout.personalBest
            };
          }
        }
      });
    });
    
    console.log('✅ Personal bests calculated:', Object.keys(bests).length, 'records');
    setPersonalBests(bests);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Unknown Date';
    }
  };

  const getExerciseEmoji = (exerciseType) => {
    switch (exerciseType?.toLowerCase()) {
      case 'squat':
      case 'back squat':
      case 'front squat': return '🏋️‍♂️';
      case 'deadlift': return '💀';
      case 'bench':
      case 'bench press': return '🛏️';
      case 'clean': return '🧹';
      case 'snatch': return '⚡';
      case 'press':
      case 'overhead press': return '☝️';
      default: return '💪';
    }
  };

  const renderPersonalBests = () => {
    const sortedBests = Object.entries(personalBests).sort(([,a], [,b]) => 
      b.weight - a.weight
    );

    if (sortedBests.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateEmoji}>🏆</Text>
          <Text style={styles.emptyStateTitle}>No Personal Bests Yet</Text>
          <Text style={styles.emptyStateText}>
            Start logging workouts with weights to track your personal bests!
          </Text>
          <Text style={styles.emptyStateHint}>
            💡 Use formats like "Back squat 3x5 @ 185lbs" or "deadlift 1x5 @ 315lb"
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.bestsContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Your Personal Best Lifts</Text>
        
        {sortedBests.map(([key, best], index) => (
          <View key={key} style={styles.bestCard}>
            <View style={styles.bestHeader}>
              <View style={styles.bestRank}>
                <Text style={styles.rankNumber}>#{index + 1}</Text>
              </View>
              <Text style={styles.bestEmoji}>
                {getExerciseEmoji(best.type || best.name)}
              </Text>
              <View style={styles.bestInfo}>
                <Text style={styles.bestExerciseName}>{best.name}</Text>
                <Text style={styles.bestDate}>{formatDate(best.date)}</Text>
              </View>
              <View style={styles.bestWeight}>
                <Text style={styles.weightNumber}>
                  {best.weight}
                  <Text style={styles.weightUnit}>{best.unit}</Text>
                </Text>
                {best.scheme && (
                  <Text style={styles.bestScheme}>{best.scheme}</Text>
                )}
              </View>
            </View>
            
            {best.isPersonalBest && (
              <View style={styles.prBadge}>
                <Text style={styles.prBadgeText}>🏆 PERSONAL RECORD</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderStats = () => {
    const totalBests = Object.keys(personalBests).length;
    const strengthTypes = ['squat', 'deadlift', 'bench', 'press'];
    const olympicTypes = ['clean', 'snatch'];
    
    const strengthBests = Object.values(personalBests).filter(best => 
      strengthTypes.some(type => best.type?.toLowerCase().includes(type) || best.name?.toLowerCase().includes(type))
    );
    const olympicBests = Object.values(personalBests).filter(best => 
      olympicTypes.some(type => best.type?.toLowerCase().includes(type) || best.name?.toLowerCase().includes(type))
    );

    const heaviestLift = Math.max(...Object.values(personalBests).map(b => b.weight || 0), 0);

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Personal Bests Summary</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalBests}</Text>
            <Text style={styles.statLabel}>Total PRs</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{strengthBests.length}</Text>
            <Text style={styles.statLabel}>Strength Lifts</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{olympicBests.length}</Text>
            <Text style={styles.statLabel}>Olympic Lifts</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{heaviestLift}</Text>
            <Text style={styles.statLabel}>Heaviest Lift</Text>
          </View>
        </View>

        {strengthBests.length > 0 && (
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>🏋️‍♂️ Strength Lifts</Text>
            {strengthBests.map((best, index) => (
              <View key={index} style={styles.categoryItem}>
                <Text style={styles.categoryExercise}>{best.name}</Text>
                <Text style={styles.categoryWeight}>{best.weight}{best.unit}</Text>
              </View>
            ))}
          </View>
        )}

        {olympicBests.length > 0 && (
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>⚡ Olympic Lifts</Text>
            {olympicBests.map((best, index) => (
              <View key={index} style={styles.categoryItem}>
                <Text style={styles.categoryExercise}>{best.name}</Text>
                <Text style={styles.categoryWeight}>{best.weight}{best.unit}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>🏆 Personal Bests</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.modalContent}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Calculating your personal bests...</Text>
            </View>
          ) : (
            <>
              {Object.keys(personalBests).length > 0 ? renderPersonalBests() : renderPersonalBests()}
              
              {/* Add stats section if there are personal bests */}
              {Object.keys(personalBests).length > 0 && (
                <View style={styles.statsSection}>
                  {renderStats()}
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.modalFooter}>
          <FalloutButton
            text="CLOSE"
            onPress={onClose}
            style={styles.footerButton}
            type="secondary"
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.ui.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text.secondary,
    marginTop: 15,
    fontSize: 16,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 15,
  },
  emptyStateHint: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // Best Cards
  bestsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  bestCard: {
    backgroundColor: colors.background.overlay,
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  bestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bestRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background.dark,
  },
  bestEmoji: {
    fontSize: 28,
    marginRight: 15,
  },
  bestInfo: {
    flex: 1,
  },
  bestExerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  bestDate: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  bestWeight: {
    alignItems: 'flex-end',
  },
  weightNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  weightUnit: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  bestScheme: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  prBadge: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  prBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.background.dark,
  },

  // Stats Section
  statsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.ui.border,
  },
  statsContainer: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 25,
  },
  statCard: {
    backgroundColor: colors.background.overlay,
    borderRadius: 12,
    padding: 20,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  categorySection: {
    backgroundColor: colors.background.overlay,
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 15,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryExercise: {
    fontSize: 14,
    color: colors.text.primary,
  },
  categoryWeight: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
  },

  // Footer
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.ui.border,
  },
  footerButton: {
    backgroundColor: colors.ui.inputBg,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
});

export default PersonalBestsModal;