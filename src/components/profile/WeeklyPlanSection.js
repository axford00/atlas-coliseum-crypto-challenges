// components/profile/WeeklyPlanSection.js
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FalloutButton from '../ui/FalloutButton';
import { colors } from '../../theme/colors';

const WeeklyPlanSection = ({ 
  savedWeeklyPlan,
  setShowWeeklyPlanDashboard,
  navigation
}) => {
  if (!savedWeeklyPlan) return null;

  const getWeekProgress = () => {
    const totalDays = Object.keys(savedWeeklyPlan.status).length;
    const completedWorkouts = Object.values(savedWeeklyPlan.status).filter(day => day.workoutDone).length;
    const totalMeals = Object.values(savedWeeklyPlan.status).reduce((sum, day) => sum + day.mealsLogged, 0);
    const maxMeals = totalDays * 3;
    
    return {
      workoutProgress: `${completedWorkouts}/${totalDays}`,
      mealProgress: `${totalMeals}/${maxMeals}`,
      workoutPercentage: Math.round((completedWorkouts / totalDays) * 100),
      mealPercentage: Math.round((totalMeals / maxMeals) * 100)
    };
  };

  const progress = getWeekProgress();

  const handleViewFullPlan = () => {
    // Option 1: Open modal (current behavior)
    setShowWeeklyPlanDashboard(true);
    
    // Option 2: Navigate to dedicated screen (future enhancement)
    // navigation.navigate('WeeklyPlanScreen', { weeklyPlan: savedWeeklyPlan });
  };

  const handleSharePlan = () => {
    // Future: Email/Calendar sharing functionality
    // For now, just navigate to full plan
    setShowWeeklyPlanDashboard(true);
  };

  return (
    <View style={styles.weeklyPlanContainer}>
      <View style={styles.weeklyPlanHeader}>
        <Text style={styles.weeklyPlanTitle}>📅 This Week's Plan</Text>
        <Text style={styles.weekOfText}>{savedWeeklyPlan.weekOf}</Text>
      </View>
      
      {/* Quick Progress Overview */}
      <View style={styles.progressOverview}>
        <View style={styles.progressItem}>
          <Text style={styles.progressLabel}>Workouts</Text>
          <Text style={styles.progressValue}>{progress.workoutProgress}</Text>
          <Text style={styles.progressPercentage}>{progress.workoutPercentage}%</Text>
        </View>
        
        <View style={styles.progressDivider} />
        
        <View style={styles.progressItem}>
          <Text style={styles.progressLabel}>Meals Logged</Text>
          <Text style={styles.progressValue}>{progress.mealProgress}</Text>
          <Text style={styles.progressPercentage}>{progress.mealPercentage}%</Text>
        </View>
      </View>

      {/* Quick Daily Status */}
      <View style={styles.quickProgressContainer}>
        <Text style={styles.progressTitle}>Daily Status:</Text>
        <View style={styles.progressGrid}>
          {Object.entries(savedWeeklyPlan.status).map(([day, status]) => (
            <View key={day} style={styles.dayProgressItem}>
              <Text style={styles.dayName}>{day.substring(0, 3).toUpperCase()}</Text>
              <Text style={styles.dayStatus}>
                {status.workoutDone ? '💪' : '⭕'}
              </Text>
              <Text style={styles.mealCount}>{status.mealsLogged}/3</Text>
            </View>
          ))}
        </View>
      </View>
      
      {/* Action Buttons */}
      <View style={styles.planActions}>
        <FalloutButton
          text="VIEW FULL PLAN"
          onPress={handleViewFullPlan}
          style={styles.planActionButton}
        />
        
        <View style={styles.secondaryActions}>
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={handleSharePlan}
          >
            <Text style={styles.shareButtonText}>📧 Share Plan</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.calendarButton}
            onPress={handleSharePlan}
          >
            <Text style={styles.calendarButtonText}>📅 Add to Calendar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  weeklyPlanContainer: {
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 20,
  },
  weeklyPlanHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  weeklyPlanTitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  weekOfText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  
  // Progress Overview
  progressOverview: {
    flexDirection: 'row',
    backgroundColor: colors.ui.inputBg,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  progressItem: {
    flex: 1,
    alignItems: 'center',
  },
  progressDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.ui.border,
    marginHorizontal: 15,
  },
  progressLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    marginBottom: 4,
  },
  progressValue: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  progressPercentage: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // Daily Progress Grid
  quickProgressContainer: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  progressTitle: {
    color: colors.text.light,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  progressGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayProgressItem: {
    alignItems: 'center',
    flex: 1,
  },
  dayName: {
    color: colors.text.secondary,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dayStatus: {
    fontSize: 16,
    marginBottom: 2,
  },
  mealCount: {
    color: colors.text.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  // Action Buttons
  planActions: {
    gap: 10,
  },
  planActionButton: {
    marginBottom: 10,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 10,
  },
  shareButton: {
    flex: 1,
    backgroundColor: colors.ui.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.ui.border,
    padding: 12,
    alignItems: 'center',
  },
  shareButtonText: {
    color: colors.text.light,
    fontSize: 12,
    fontWeight: 'bold',
  },
  calendarButton: {
    flex: 1,
    backgroundColor: colors.ui.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.ui.border,
    padding: 12,
    alignItems: 'center',
  },
  calendarButtonText: {
    color: colors.text.light,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default WeeklyPlanSection;