// src/screens/WorkoutScreen/components/WorkoutInput.js
import { StyleSheet, Text, TextInput, View } from 'react-native';
import FalloutButton from '../../../components/ui/FalloutButton';
import { colors } from '../../../theme/colors';

const WorkoutInput = ({
  workoutText,
  onChangeText,
  onSubmit,
  loading = false,
  placeholder = "e.g., 1 back squat @ 345lbs, row 2km, clean 5x3 @ 135lb..."
}) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>What did you do today?</Text>
      
      <TextInput
        style={styles.textInput}
        placeholder={placeholder}
        placeholderTextColor={colors.text.secondary}
        value={workoutText}
        onChangeText={onChangeText}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        autoCapitalize="sentences"
        autoCorrect={false}
        returnKeyType="default"
        blurOnSubmit={false}
      />
      
      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>💡 Example formats:</Text>
        <Text style={styles.exampleText}>• "1 back squat @ 345lbs"</Text>
        <Text style={styles.exampleText}>• "deadlift 5x3 @ 315lb"</Text>
        <Text style={styles.exampleText}>• "row 2km in 8:30"</Text>
        <Text style={styles.exampleText}>• "yoga 30 minutes"</Text>
      </View>
      
      <FalloutButton
        text={loading ? "LOGGING..." : "LOG WORKOUT"}
        onPress={onSubmit}
        isLoading={loading}
        style={styles.logButton}
        disabled={!workoutText.trim() || loading}
      />
      
      {workoutText.trim() && (
        <View style={styles.previewContainer}>
          <Text style={styles.previewLabel}>Workout Preview:</Text>
          <Text style={styles.previewText} numberOfLines={3}>
            {workoutText}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 20,
  },
  label: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: colors.ui.inputBg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: 5,
    color: colors.text.primary,
    padding: 15,
    fontSize: 16,
    height: 120,
    marginBottom: 15,
    fontFamily: 'System',
  },
  exampleContainer: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 5,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  exampleTitle: {
    color: colors.text.light,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  exampleText: {
    color: colors.text.secondary,
    fontSize: 11,
    marginBottom: 2,
    fontStyle: 'italic',
  },
  logButton: {
    marginTop: 10,
  },
  previewContainer: {
    backgroundColor: colors.background.dark,
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  previewLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  previewText: {
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 18,
  },
});

export default WorkoutInput;