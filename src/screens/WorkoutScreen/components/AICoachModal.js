// src/screens/WorkoutScreen/components/AICoachModal.js
import { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import FalloutButton from '../../../components/ui/FalloutButton';
import { colors } from '../../../theme/colors';

const AICoachModal = ({
  visible,
  onClose,
  recommendation,
  onFeedback,
  onGetNew,
  onLogWorkout, // Function to log workout with details
  loading
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [completionData, setCompletionData] = useState({});
  const [completionNotes, setCompletionNotes] = useState('');

  // Extract exercises from AI recommendation for completion form
  const extractExercisesFromRecommendation = (text) => {
    if (!text) return [];
    
    const exercises = [];
    const lines = text.split('\n');
    
    // Look for exercise patterns in the recommendation
    const exercisePatterns = [
      /(\d+)\s*x\s*(\d+)\s+([^@]+?)(?:@|at)?\s*(\d+)?\s*(lb|kg|lbs|#)?/gi,
      /(\d+)\s+reps?\s+of\s+([^@\n]+?)(?:@|at)?\s*(\d+)?\s*(lb|kg|lbs|#)?/gi,
      /([^:\n]+?):\s*(\d+)\s*x\s*(\d+)(?:\s*@\s*(\d+)\s*(lb|kg|lbs|#)?)?/gi,
      /(squats?|deadlifts?|bench|press|clean|snatch|row)\s*:?\s*(\d+)\s*x?\s*(\d+)?/gi
    ];

    lines.forEach(line => {
      exercisePatterns.forEach(pattern => {
        const matches = [...line.matchAll(pattern)];
        matches.forEach(match => {
          if (match) {
            let exercise = null;
            
            if (pattern === exercisePatterns[0]) {
              // Format: "3x10 squats @ 135lbs"
              exercise = {
                name: match[3].trim(),
                sets: parseInt(match[1]) || 1,
                reps: parseInt(match[2]) || 1,
                weight: parseInt(match[4]) || 0,
                unit: match[5] ? match[5].replace('#', 'lb').replace('lbs', 'lb') : 'lb'
              };
            } else if (pattern === exercisePatterns[1]) {
              // Format: "10 reps of squats @ 135lbs"
              exercise = {
                name: match[2].trim(),
                sets: 1,
                reps: parseInt(match[1]) || 1,
                weight: parseInt(match[3]) || 0,
                unit: match[4] ? match[4].replace('#', 'lb').replace('lbs', 'lb') : 'lb'
              };
            } else if (pattern === exercisePatterns[2]) {
              // Format: "Squats: 3x10 @ 135lbs"
              exercise = {
                name: match[1].trim(),
                sets: parseInt(match[2]) || 1,
                reps: parseInt(match[3]) || 1,
                weight: parseInt(match[4]) || 0,
                unit: match[5] ? match[5].replace('#', 'lb').replace('lbs', 'lb') : 'lb'
              };
            } else if (pattern === exercisePatterns[3]) {
              // Format: "Squats: 3x10" or "Squats 15"
              exercise = {
                name: match[1].trim(),
                sets: parseInt(match[2]) || 1,
                reps: parseInt(match[3]) || parseInt(match[2]) || 1,
                weight: 0,
                unit: 'lb'
              };
            }
            
            if (exercise && exercise.name.length > 1) {
              // Clean up exercise name
              exercise.name = exercise.name
                .replace(/[•\-\*]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
              
              // Don't add if it's too generic or already exists
              if (exercise.name.length > 2 && 
                  !exercises.some(ex => ex.name.toLowerCase() === exercise.name.toLowerCase())) {
                exercises.push(exercise);
              }
            }
          }
        });
      });
    });

    return exercises;
  };

  const handlePerfectThanks = () => {
    const extractedExercises = extractExercisesFromRecommendation(recommendation);
    
    // Always show the completion form to allow user input
    const initialData = {};
    
    if (extractedExercises.length > 0) {
      // Initialize completion data with extracted exercises
      extractedExercises.forEach((exercise, index) => {
        initialData[index] = {
          ...exercise,
          completed: true, // Pre-check all exercises since they said "Perfect!"
          actualWeight: exercise.weight,
          actualReps: exercise.reps,
          actualSets: exercise.sets
        };
      });
    } else {
      // Create a general workout entry for them to customize
      initialData[0] = {
        name: 'AI Recommended Workout',
        completed: true,
        actualWeight: 0,
        actualReps: 1,
        actualSets: 1,
        unit: 'lb'
      };
    }
    
    setCompletionData(initialData);
    setCompletionNotes('Completed AI recommended workout - felt great!'); // Pre-fill with positive note
    setShowCompletionForm(true);
  };

  const handleQuickLog = () => {
    onLogWorkout({
      workoutText: recommendation,
      isFromAI: true,
      aiRecommendation: recommendation,
      notes: completionNotes || 'Completed AI recommended workout'
    });
    onClose();
  };

  const handleDetailedLog = () => {
    // Convert completion data to workout text
    const exercises = Object.values(completionData).filter(ex => ex.completed);
    
    if (exercises.length === 0) {
      Alert.alert('No Exercises', 'Please select at least one exercise to log');
      return;
    }

    let workoutText = '';
    exercises.forEach(exercise => {
      if (exercise.actualWeight > 0) {
        workoutText += `${exercise.actualSets}x${exercise.actualReps} ${exercise.name} @ ${exercise.actualWeight}${exercise.unit}\n`;
      } else {
        workoutText += `${exercise.actualSets}x${exercise.actualReps} ${exercise.name}\n`;
      }
    });

    // Add notes if provided
    if (completionNotes.trim()) {
      workoutText += `\nNotes: ${completionNotes.trim()}`;
    }

    onLogWorkout({
      workoutText: workoutText.trim(),
      isFromAI: true,
      aiRecommendation: recommendation,
      notes: completionNotes || 'Completed AI recommended workout with modifications',
      extractedExercises: exercises
    });
    
    onClose();
    setShowCompletionForm(false);
    setCompletionData({});
    setCompletionNotes('');
  };

  const handleFeedbackSubmit = () => {
    if (!feedbackText.trim()) {
      Alert.alert('Error', 'Please tell us what you\'d like to change');
      return;
    }
    
    onFeedback(feedbackText);
    setShowFeedback(false);
    setFeedbackText('');
  };

  const updateExerciseData = (index, field, value) => {
    setCompletionData(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: value
      }
    }));
  };

  const QuickFeedbackButton = ({ text, onPress }) => (
    <TouchableOpacity style={styles.quickFeedbackButton} onPress={onPress}>
      <Text style={styles.quickFeedbackText}>{text}</Text>
    </TouchableOpacity>
  );

  // Feedback Modal Content
  if (showFeedback) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalBackground}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>💬 Modify Your Workout</Text>
            <TouchableOpacity
              onPress={() => {
                setShowFeedback(false);
                setFeedbackText('');
              }}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackLabel}>
                What would you like to change about this workout?
              </Text>
              
              <View style={styles.quickFeedbackContainer}>
                <QuickFeedbackButton 
                  text="🦵 No Running (Knee Issues)"
                  onPress={() => setFeedbackText('I have knee problems and cannot run')}
                />
                <QuickFeedbackButton 
                  text="⏰ Shorter Workout"
                  onPress={() => setFeedbackText('I only have 30 minutes today')}
                />
                <QuickFeedbackButton 
                  text="📉 Make It Easier"
                  onPress={() => setFeedbackText('This workout is too intense for me')}
                />
                <QuickFeedbackButton 
                  text="🏠 Home Workout Only"
                  onPress={() => setFeedbackText('I only have bodyweight equipment at home')}
                />
              </View>
              
              <Text style={styles.feedbackSubLabel}>
                Or tell us specifically what to change:
              </Text>
              <TextInput
                style={styles.feedbackInput}
                placeholder="e.g., Replace running with rowing, I don't have kettlebells..."
                placeholderTextColor={colors.text.secondary}
                value={feedbackText}
                onChangeText={setFeedbackText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.modalButtons}>
              <FalloutButton
                text={loading ? "MODIFYING..." : "MODIFY WORKOUT"}
                onPress={handleFeedbackSubmit}
                style={styles.modalButton}
                isLoading={loading}
              />
              
              <FalloutButton
                text="CANCEL"
                onPress={() => {
                  setShowFeedback(false);
                  setFeedbackText('');
                }}
                style={styles.modalButton}
                type="secondary"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  }

  // Completion Form Modal Content
  if (showCompletionForm) {
    const extractedExercises = Object.values(completionData);
    
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalBackground}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>💪 Customize & Log Your Workout</Text>
            <TouchableOpacity
              onPress={() => {
                setShowCompletionForm(false);
                setCompletionData({});
              }}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Add weights, reps, and notes:</Text>
            <Text style={styles.sectionSubtitle}>Customize your workout before logging</Text>
            
            {extractedExercises.map((exercise, index) => (
              <View key={index} style={styles.exerciseCompletionCard}>
                <View style={styles.exerciseHeader}>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      exercise.completed && styles.checkboxChecked
                    ]}
                    onPress={() => updateExerciseData(index, 'completed', !exercise.completed)}
                  >
                    {exercise.completed && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                  <View style={styles.exerciseNameSection}>
                    <Text style={styles.inputLabel}>Exercise Name</Text>
                    <TextInput
                      style={styles.nameInput}
                      value={exercise.name}
                      onChangeText={(text) => updateExerciseData(index, 'name', text)}
                      placeholder="e.g., Back Squat, Push-ups"
                      placeholderTextColor={colors.text.secondary}
                    />
                  </View>
                </View>
                
                {exercise.completed && (
                  <View style={styles.exerciseInputs}>
                    <View style={styles.inputRow}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Sets</Text>
                        <TextInput
                          style={styles.smallInput}
                          value={exercise.actualSets?.toString()}
                          onChangeText={(text) => updateExerciseData(index, 'actualSets', parseInt(text) || 0)}
                          keyboardType="numeric"
                          placeholder="3"
                          placeholderTextColor={colors.text.secondary}
                        />
                      </View>
                      
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Reps</Text>
                        <TextInput
                          style={styles.smallInput}
                          value={exercise.actualReps?.toString()}
                          onChangeText={(text) => updateExerciseData(index, 'actualReps', parseInt(text) || 0)}
                          keyboardType="numeric"
                          placeholder="10"
                          placeholderTextColor={colors.text.secondary}
                        />
                      </View>
                      
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Weight</Text>
                        <TextInput
                          style={styles.smallInput}
                          value={exercise.actualWeight?.toString()}
                          onChangeText={(text) => updateExerciseData(index, 'actualWeight', parseInt(text) || 0)}
                          keyboardType="numeric"
                          placeholder="135"
                          placeholderTextColor={colors.text.secondary}
                        />
                      </View>
                      
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Unit</Text>
                        <TouchableOpacity
                          style={styles.unitButton}
                          onPress={() => {
                            const newUnit = exercise.unit === 'lb' ? 'kg' : 'lb';
                            updateExerciseData(index, 'unit', newUnit);
                          }}
                        >
                          <Text style={styles.unitText}>{exercise.unit}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => {
                        setCompletionData(prev => {
                          const newData = { ...prev };
                          delete newData[index];
                          return newData;
                        });
                      }}
                    >
                      <Text style={styles.deleteButtonText}>🗑️ Remove Exercise</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
            
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Workout Notes</Text>
              <Text style={styles.notesSubLabel}>How did it feel? Any modifications?</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="e.g., Felt great! Increased weight on squats..."
                placeholderTextColor={colors.text.secondary}
                value={completionNotes}
                onChangeText={setCompletionNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.buttonContainer}>
              <FalloutButton
                text="LOG MY WORKOUT"
                onPress={handleDetailedLog}
                style={styles.modalButton}
              />
              
              <FalloutButton
                text="ADD MORE EXERCISES"
                onPress={() => {
                  // Add a new blank exercise for user to fill in
                  const newIndex = Object.keys(completionData).length;
                  setCompletionData(prev => ({
                    ...prev,
                    [newIndex]: {
                      name: '',
                      completed: true,
                      actualWeight: 0,
                      actualReps: 1,
                      actualSets: 1,
                      unit: 'lb'
                    }
                  }));
                }}
                style={styles.modalButton}
                type="secondary"
              />
              
              <FalloutButton
                text="BACK TO RECOMMENDATION"
                onPress={() => {
                  setShowCompletionForm(false);
                  setCompletionData({});
                  setCompletionNotes('');
                }}
                style={styles.modalButton}
                type="secondary"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  }

  // Main AI Coach Modal Content
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalBackground}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>🤖 Your AI Fitness Coach</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.aiRecommendationContainer}>
            <Text style={styles.aiRecommendationText}>{recommendation}</Text>
          </View>
          
          <View style={styles.modalButtons}>
            <FalloutButton
              text="PERFECT! THANKS COACH!"
              onPress={handlePerfectThanks}
              style={styles.modalButton}
            />
            
            <FalloutButton
              text="MODIFY THIS WORKOUT"
              onPress={() => setShowFeedback(true)}
              style={styles.modalButton}
              type="secondary"
            />
            
            <FalloutButton
              text="GET NEW RECOMMENDATION"
              onPress={onGetNew}
              style={styles.modalButton}
              type="secondary"
            />
          </View>
        </ScrollView>
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
  aiRecommendationContainer: {
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 20,
  },
  aiRecommendationText: {
    color: colors.text.primary,
    fontSize: 16,
    lineHeight: 24,
  },
  modalButtons: {
    gap: 15,
    marginTop: 20,
  },
  modalButton: {
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sectionSubtitle: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: 15,
    fontStyle: 'italic',
  },
  exerciseCompletionCard: {
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: 12,
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: colors.background.dark,
    fontSize: 16,
    fontWeight: 'bold',
  },
  exerciseNameSection: {
    flex: 1,
  },
  nameInput: {
    backgroundColor: colors.ui.inputBg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: 4,
    color: colors.text.primary,
    padding: 10,
    fontSize: 16,
  },
  exerciseInputs: {
    marginTop: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    marginBottom: 4,
  },
  smallInput: {
    backgroundColor: colors.ui.inputBg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: 4,
    color: colors.text.primary,
    padding: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  unitButton: {
    backgroundColor: colors.ui.inputBg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: 4,
    padding: 8,
    alignItems: 'center',
  },
  unitText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: colors.ui.inputBg,
    borderWidth: 1,
    borderColor: '#ff6b6b',
    borderRadius: 4,
    padding: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  deleteButtonText: {
    color: '#ff6b6b',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notesSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  notesLabel: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notesSubLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  notesInput: {
    backgroundColor: colors.ui.inputBg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: 5,
    color: colors.text.primary,
    padding: 15,
    fontSize: 16,
    height: 80,
  },
  buttonContainer: {
    gap: 15,
    marginTop: 20,
  },
  feedbackContainer: {
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 20,
  },
  feedbackLabel: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  feedbackSubLabel: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: 10,
    marginTop: 15,
  },
  quickFeedbackContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  quickFeedbackButton: {
    backgroundColor: colors.ui.inputBg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 8,
  },
  quickFeedbackText: {
    color: colors.text.light,
    fontSize: 12,
    fontWeight: 'bold',
  },
  feedbackInput: {
    backgroundColor: colors.ui.inputBg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: 5,
    color: colors.text.primary,
    padding: 15,
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
  },
});

export default AICoachModal;