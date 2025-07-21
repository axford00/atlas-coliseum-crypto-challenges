// MealPlanScreen.js - CORRECTED to use subcollection approach + added missing functionality
import { getAuth } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import FalloutButton from '../components/ui/FalloutButton';
import aiService from '../services/aiService';
import { addMeal, deleteMeal, getUserMeals, updateMeal } from '../services/mealService';
import { colors, globalStyles } from '../theme/colors';

const MealPlanScreen = ({ navigation }) => {
  const [mealText, setMealText] = useState('');
  const [recentMeals, setRecentMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [mealHistory, setMealHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [showMealDetail, setShowMealDetail] = useState(false);
  const [editingNotes, setEditingNotes] = useState('');
  const [editingCalories, setEditingCalories] = useState('');
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiModalTitle, setAiModalTitle] = useState('');
  const [showMealFeedback, setShowMealFeedback] = useState(false);
  const [mealFeedbackText, setMealFeedbackText] = useState('');
  const [originalMealRecommendation, setOriginalMealRecommendation] = useState('');

  const auth = getAuth();

  useEffect(() => {
    loadMealData();
    
    // ONE-TIME MIGRATION: Uncomment this line after deploying new mealService for a few users to test
    // migrateMealsToSubcollection().catch(console.error);
  }, []);

  const determineMealType = (hour) => {
    if (hour < 11) return 'breakfast';
    if (hour < 16) return 'lunch';
    if (hour < 21) return 'dinner';
    return 'snack';
  };

  // Handle meal feedback and modification
  const handleMealFeedback = async () => {
    if (!mealFeedbackText.trim()) {
      Alert.alert('Error', 'Please tell us what you\'d like to change about this meal recommendation');
      return;
    }

    setLoading(true);
    try {
      console.log('Getting modified meal based on feedback:', mealFeedbackText);
      
      const context = await aiService.getUserContext();
      const modificationPrompt = `You are a nutrition expert. I gave this meal recommendation:

"${originalMealRecommendation}"

The user provided this feedback: "${mealFeedbackText}"

Please provide a modified meal recommendation that addresses their feedback. Keep the same format and be specific about the changes you made.

User Profile: ${JSON.stringify(context.profile, null, 2)}
Recent Meals: ${JSON.stringify(context.meals, null, 2)}
Current Time: ${context.currentTime.toISOString()}

Provide a complete new meal recommendation that incorporates their feedback.`;

      const modifiedRecommendation = await aiService.callBackendAI(modificationPrompt, context);
      
      console.log('Modified meal recommendation received:', modifiedRecommendation);
      
      setAiRecommendation(modifiedRecommendation);
      setShowMealFeedback(false);
      setShowAiModal(true);
      setMealFeedbackText('');
      
    } catch (error) {
      console.error('Error getting modified meal recommendation:', error);
      
      // Enhanced fallback modification
      let modifiedRecommendation = originalMealRecommendation;
      const lowerFeedback = mealFeedbackText.toLowerCase();
      
      if (lowerFeedback.includes('vegetarian') || lowerFeedback.includes('no meat')) {
        modifiedRecommendation = `🌱 VEGETARIAN MEAL OPTIONS:

• Quinoa bowl with black beans, avocado, and roasted vegetables
• Vegetarian chili with whole grain bread
• Caprese salad with fresh mozzarella, tomatoes, and basil
• Lentil curry with brown rice
• Greek yogurt parfait with granola and berries

✅ MODIFICATION: Replaced all meat options with delicious vegetarian alternatives!

These provide complete proteins and all the nutrients you need.`;
      } else if (lowerFeedback.includes('quick') || lowerFeedback.includes('fast') || lowerFeedback.includes('no time')) {
        modifiedRecommendation = `⚡ QUICK 10-MINUTE MEALS:

• Greek yogurt with nuts and fruit (2 mins)
• Avocado toast with everything bagel seasoning (5 mins)
• Protein smoothie with banana and spinach (3 mins)
• Hard-boiled eggs with whole grain crackers (ready-made)
• Hummus and vegetable wrap (5 mins)

✅ MODIFICATION: All options can be prepared in 10 minutes or less!

Perfect for busy days when you need nutrition fast.`;
      } else if (lowerFeedback.includes('ingredients') || lowerFeedback.includes('have')) {
        modifiedRecommendation = `🏠 MEALS WITH YOUR INGREDIENTS:

Based on what you mentioned having at home, here are some options:

• Simple pasta with whatever vegetables you have
• Egg scramble with any available vegetables and cheese
• Rice bowl with your proteins and vegetables
• Soup using your available ingredients
• Salad with your fresh ingredients

✅ MODIFICATION: Customized based on your available ingredients!

Let me know what specific ingredients you have for more targeted suggestions!`;
      } else {
        modifiedRecommendation += `\n\n✅ CHEF'S NOTE: I heard your feedback about "${mealFeedbackText}". Here's my adjusted meal recommendation based on your preferences!`;
      }
      
      setAiRecommendation(modifiedRecommendation);
      setShowMealFeedback(false);
      setShowAiModal(true);
      setMealFeedbackText('');
      
    } finally {
      setLoading(false);
    }
  };

  const loadMealData = async () => {
    try {
      setInitialLoading(true);
      console.log('🍽️ Loading meal data from subcollection...');
      const meals = await getUserMeals();
      console.log('✅ Loaded meals from subcollection:', meals.length);
      setRecentMeals(meals.slice(0, 5));
    } catch (error) {
      console.error('❌ Error loading meal data from subcollection:', error);
      setRecentMeals([]);
    } finally {
      setInitialLoading(false);
    }
  };

  const load30DayHistory = async () => {
    try {
      setHistoryLoading(true);
      const allMeals = await getUserMeals();
      
      // Filter last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentMeals = allMeals.filter(meal => {
        const mealDate = new Date(meal.date || meal.createdAt);
        return mealDate >= thirtyDaysAgo;
      });

      // Group by date
      const groupedMeals = recentMeals.reduce((groups, meal) => {
        const date = meal.date || meal.createdAt?.split('T')[0];
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(meal);
        return groups;
      }, {});

      // Convert to sorted array
      const sortedHistory = Object.entries(groupedMeals)
        .map(([date, meals]) => ({ date, meals }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setMealHistory(sortedHistory);
      setShowHistory(true);
    } catch (error) {
      console.error('Error loading meal history:', error);
      Alert.alert('Error', 'Failed to load meal history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Enhanced calorie estimation based on meal content
  const estimateCalories = (mealText) => {
    const lowerText = mealText.toLowerCase();
    let baseCalories = 200; // Base calories
    
    // High calorie foods
    if (lowerText.includes('pizza') || lowerText.includes('burger') || lowerText.includes('fries')) {
      baseCalories += 400;
    }
    if (lowerText.includes('pasta') || lowerText.includes('rice') || lowerText.includes('bread')) {
      baseCalories += 200;
    }
    if (lowerText.includes('chicken') || lowerText.includes('beef') || lowerText.includes('fish') || lowerText.includes('pork')) {
      baseCalories += 150;
    }
    if (lowerText.includes('cheese') || lowerText.includes('nuts') || lowerText.includes('avocado')) {
      baseCalories += 100;
    }
    if (lowerText.includes('salad') || lowerText.includes('vegetables') || lowerText.includes('fruit')) {
      baseCalories += 50;
    }
    
    // Portion size indicators
    if (lowerText.includes('large') || lowerText.includes('big') || lowerText.includes('double')) {
      baseCalories *= 1.5;
    }
    if (lowerText.includes('small') || lowerText.includes('light')) {
      baseCalories *= 0.7;
    }
    
    return Math.round(baseCalories);
  };

  const handleAddMeal = async () => {
    console.log('🍽️ Starting meal logging to subcollection...');
    
    if (!mealText.trim()) {
      Alert.alert('Error', 'Please enter what you ate');
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const user = auth.currentUser;
      
      console.log('Current user:', user?.uid);
      
      if (!user) {
        Alert.alert('Error', 'Please log in to save meals');
        return;
      }

      const mealType = determineMealType(now.getHours());
      const estimatedCalories = estimateCalories(mealText);
      console.log('Determined meal type:', mealType);
      console.log('Estimated calories:', estimatedCalories);
      
      const meal = {
        userId: user.uid, // Keep for backwards compatibility
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        mealType: mealType,
        title: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} - ${now.toLocaleDateString()}`,
        description: mealText,
        ingredients: [{
          name: 'Food Item',
          amount: 'Estimated',
          calories: estimatedCalories,
          macros: { 
            protein: Math.round(estimatedCalories * 0.15 / 4), 
            carbs: Math.round(estimatedCalories * 0.50 / 4), 
            fats: Math.round(estimatedCalories * 0.35 / 9) 
          }
        }],
        macros: { 
          protein: Math.round(estimatedCalories * 0.15 / 4), 
          carbs: Math.round(estimatedCalories * 0.50 / 4), 
          fats: Math.round(estimatedCalories * 0.35 / 9),
          calories: estimatedCalories 
        },
        tags: [],
        postWorkout: false,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };

      console.log('🍽️ Attempting to save meal to subcollection:', meal);
      
      await addMeal(meal);
      console.log('✅ Meal saved successfully to subcollection!');
      
      Alert.alert('Success', 'Meal logged successfully!');
      setMealText(''); // Clear input after successful save
      await loadMealData(); // Refresh the recent meals list
    } catch (error) {
      console.error('❌ Error adding meal to subcollection:', error);
      Alert.alert('Error', `Failed to log meal: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Save meal changes functionality
  const handleSaveMealChanges = async () => {
    if (!selectedMeal || !selectedMeal.id) {
      Alert.alert('Error', 'Cannot save changes for this meal');
      return;
    }

    setLoading(true);
    try {
      console.log('💾 Saving meal changes to subcollection:', selectedMeal.id);
      
      const updatedMeal = {
        ...selectedMeal,
        description: editingNotes,
        macros: {
          ...selectedMeal.macros,
          calories: parseInt(editingCalories) || selectedMeal.macros?.calories || 300
        },
        updatedAt: new Date().toISOString()
      };

      await updateMeal(selectedMeal.id, updatedMeal);
      console.log('✅ Meal changes saved successfully to subcollection!');
      
      // Update local state
      setRecentMeals(prev => 
        prev.map(meal => 
          meal.id === selectedMeal.id 
            ? { ...meal, description: editingNotes, macros: { ...meal.macros, calories: parseInt(editingCalories) || meal.macros?.calories || 300 } }
            : meal
        )
      );

      setMealHistory(prev =>
        prev.map(day => ({
          ...day,
          meals: day.meals.map(meal =>
            meal.id === selectedMeal.id
              ? { ...meal, description: editingNotes, macros: { ...meal.macros, calories: parseInt(editingCalories) || meal.macros?.calories || 300 } }
              : meal
          )
        }))
      );

      Alert.alert('Success', 'Meal updated successfully!');
      setShowMealDetail(false);
      
    } catch (error) {
      console.error('❌ Error saving meal changes to subcollection:', error);
      Alert.alert('Error', `Failed to save changes: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Delete meal functionality
  const handleDeleteMeal = async () => {
    if (!selectedMeal || !selectedMeal.id) {
      Alert.alert('Error', 'Cannot delete this meal');
      return;
    }

    Alert.alert(
      'Delete Meal',
      'Are you sure you want to delete this meal? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              console.log('🗑️ Deleting meal from subcollection:', selectedMeal.id);
              
              await deleteMeal(selectedMeal.id);
              console.log('✅ Meal deleted successfully from subcollection!');
              
              // Update local state - remove the deleted meal
              setRecentMeals(prev => 
                prev.filter(meal => meal.id !== selectedMeal.id)
              );

              setMealHistory(prev =>
                prev.map(day => ({
                  ...day,
                  meals: day.meals.filter(meal => meal.id !== selectedMeal.id)
                })).filter(day => day.meals.length > 0) // Remove empty days
              );

              Alert.alert('Success', 'Meal deleted successfully!');
              setShowMealDetail(false);
              
              // Reload data to ensure consistency
              await loadMealData();
              
            } catch (error) {
              console.error('❌ Error deleting meal from subcollection:', error);
              Alert.alert('Error', `Failed to delete meal: ${error.message || 'Unknown error'}`);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const generateMealRecommendation = async () => {
    console.log('🤖 AI Meal recommendation button pressed');
    setLoading(true);
    
    try {
      console.log('Calling AI meal recommendation...');
      const recommendation = await aiService.getMealRecommendation();
      console.log('AI meal recommendation received:', recommendation);
      
      setAiModalTitle('🍎 Your AI Meal Recommendation');
      setAiRecommendation(recommendation);
      setOriginalMealRecommendation(recommendation);
      setShowAiModal(true);
      
    } catch (error) {
      console.error('Error getting meal recommendation:', error);
      // Fallback recommendation
      const currentHour = new Date().getHours();
      let fallbackRecommendation = "🍎 MEAL RECOMMENDATION:\n\n";
      
      if (currentHour < 11) {
        fallbackRecommendation += "BREAKFAST IDEAS:\n• Greek yogurt with berries\n• Oatmeal with banana and nuts\n• Eggs with avocado toast\n\nStart your day with protein and complex carbs!";
      } else if (currentHour < 16) {
        fallbackRecommendation += "LUNCH OPTIONS:\n• Grilled chicken salad\n• Quinoa bowl with vegetables\n• Turkey wrap with hummus\n\nBalance your nutrients for sustained energy!";
      } else {
        fallbackRecommendation += "DINNER SUGGESTIONS:\n• Baked fish with vegetables\n• Lean protein with brown rice\n• Vegetable stir-fry with tofu\n\nLight but nourishing for evening!";
      }
      
      setAiModalTitle('🍎 Your Meal Recommendation');
      setAiRecommendation(fallbackRecommendation);
      setOriginalMealRecommendation(fallbackRecommendation);
      setShowAiModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGetNutritionCoach = async () => {
    console.log('🤖 Nutrition coach button pressed');
    setLoading(true);
    
    try {
      console.log('Calling AI nutrition coaching...');
      const coaching = await aiService.getNutritionCoaching();
      console.log('AI nutrition coaching received:', coaching);
      
      setAiModalTitle('👩‍⚕️ Your AI Nutrition Coach');
      setAiRecommendation(coaching);
      setShowAiModal(true);
      
    } catch (error) {
      console.error('Error getting nutrition coaching:', error);
      // Fallback coaching
      const fallbackCoaching = '🍎 NUTRITION COACH:\n\nKey habits for success:\n• Eat protein with every meal\n• Include vegetables at lunch and dinner\n• Choose whole grains over refined\n• Stay hydrated throughout the day\n• Practice portion control\n\nYou\'re building great habits! 💪';
      
      setAiModalTitle('👩‍⚕️ Your AI Nutrition Coach');
      setAiRecommendation(fallbackCoaching);
      setShowAiModal(true);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
    } catch {
      return 'Recent';
    }
  };

  const formatHistoryDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getMealTypeEmoji = (type) => {
    switch(type) {
      case 'breakfast': return '🌅';
      case 'lunch': return '🌞';
      case 'dinner': return '🌙';
      case 'snack': return '🍎';
      default: return '🍽️';
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.background}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your meals...</Text>
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
          <Text style={styles.title}>LOG MEAL</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>What did you eat?</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Grilled chicken with rice and broccoli..."
              placeholderTextColor={colors.text.secondary}
              value={mealText}
              onChangeText={setMealText}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            
            <FalloutButton
              text={loading ? "LOGGING..." : "LOG MEAL"}
              onPress={handleAddMeal}
              isLoading={loading}
              style={styles.logButton}
            />
          </View>

          {/* Recent Meals */}
          {recentMeals.length > 0 && (
            <View style={styles.recentContainer}>
              <View style={styles.recentHeader}>
                <Text style={styles.recentTitle}>Recent Meals</Text>
                <TouchableOpacity 
                  onPress={load30DayHistory}
                  style={styles.historyButton}
                  disabled={historyLoading}
                >
                  <Text style={styles.historyButtonText}>
                    {historyLoading ? 'Loading...' : 'View 30 Days'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {recentMeals.map((meal, index) => (
                <TouchableOpacity 
                  key={meal.id || index} 
                  style={styles.recentItem}
                  onPress={() => {
                    setSelectedMeal(meal);
                    setEditingNotes(meal.description || '');
                    setEditingCalories(meal.macros?.calories?.toString() || '300');
                    setShowMealDetail(true);
                  }}
                >
                  <View style={styles.mealHeader}>
                    <Text style={styles.mealType}>
                      {getMealTypeEmoji(meal.mealType)} {meal.mealType?.toUpperCase() || 'MEAL'}
                    </Text>
                    <Text style={styles.mealDate}>
                      {formatDate(meal.date)}
                    </Text>
                  </View>
                  <Text style={styles.recentText} numberOfLines={2}>
                    {meal.description || meal.title}
                  </Text>
                  {meal.macros && meal.macros.calories && (
                    <Text style={styles.caloriesText}>
                      {Math.round(meal.macros.calories)} cal
                    </Text>
                  )}
                  <Text style={styles.tapHint}>Tap to edit</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.actionButtons}>
            <FalloutButton
              text={loading ? "THINKING..." : "GET AI NUTRITION ADVICE"}
              onPress={generateMealRecommendation}
              style={styles.actionButton}
              type="secondary"
              isLoading={loading}
            />
            
            <FalloutButton
              text="BACK TO HOME"
              onPress={() => navigation.goBack()}
              style={styles.actionButton}
              type="secondary"
            />
          </View>
        </ScrollView>

        {/* Meal Feedback Modal */}
        <Modal
          visible={showMealFeedback}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🍴 Modify Your Meal</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowMealFeedback(false);
                  setMealFeedbackText('');
                }}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.feedbackContainer}>
                <Text style={styles.feedbackLabel}>What would you like to change about this meal suggestion?</Text>
                
                {/* Quick feedback buttons for meals */}
                <View style={styles.quickFeedbackContainer}>
                  <TouchableOpacity 
                    style={styles.quickFeedbackButton}
                    onPress={() => setMealFeedbackText('I need vegetarian options only')}
                  >
                    <Text style={styles.quickFeedbackText}>🌱 Vegetarian Only</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.quickFeedbackButton}
                    onPress={() => setMealFeedbackText('I need something quick, under 10 minutes')}
                  >
                    <Text style={styles.quickFeedbackText}>⚡ Quick Meals</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.quickFeedbackButton}
                    onPress={() => setMealFeedbackText('I have limited ingredients at home')}
                  >
                    <Text style={styles.quickFeedbackText}>🏠 Limited Ingredients</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.quickFeedbackButton}
                    onPress={() => setMealFeedbackText('I need dairy-free options')}
                  >
                    <Text style={styles.quickFeedbackText}>🥛 Dairy-Free</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.feedbackSubLabel}>Or tell us what ingredients you have or dietary needs:</Text>
                <TextInput
                  style={styles.feedbackInput}
                  placeholder="e.g., I have chicken, rice, and broccoli at home. Or: I'm allergic to nuts..."
                  placeholderTextColor={colors.text.secondary}
                  value={mealFeedbackText}
                  onChangeText={setMealFeedbackText}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
              
              <View style={styles.modalButtons}>
                <FalloutButton
                  text={loading ? "MODIFYING..." : "MODIFY MEAL"}
                  onPress={handleMealFeedback}
                  style={styles.modalButton}
                  isLoading={loading}
                />
                
                <FalloutButton
                  text="CANCEL"
                  onPress={() => {
                    setShowMealFeedback(false);
                    setMealFeedbackText('');
                    setShowAiModal(true);
                  }}
                  style={styles.modalButton}
                  type="secondary"
                />
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* AI Recommendation Modal */}
        <Modal
          visible={showAiModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{aiModalTitle}</Text>
              <TouchableOpacity
                onPress={() => setShowAiModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.aiRecommendationContainer}>
                <Text style={styles.aiRecommendationText}>{aiRecommendation}</Text>
              </View>
              
              <View style={styles.modalButtons}>
                <FalloutButton
                  text="PERFECT! THANKS!"
                  onPress={() => setShowAiModal(false)}
                  style={styles.modalButton}
                />
                
                <FalloutButton
                  text="MODIFY THIS MEAL"
                  onPress={() => {
                    setShowAiModal(false);
                    setShowMealFeedback(true);
                  }}
                  style={styles.modalButton}
                  type="secondary"
                />
                
                <FalloutButton
                  text="GET NEW SUGGESTION"
                  onPress={() => {
                    setShowAiModal(false);
                    setTimeout(() => generateMealRecommendation(), 500);
                  }}
                  style={styles.modalButton}
                  type="secondary"
                />
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* FIXED: Meal Detail Modal with working save and delete */}
        <Modal
          visible={showMealDetail}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Meal</Text>
              <TouchableOpacity
                onPress={() => setShowMealDetail(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {selectedMeal && (
              <ScrollView style={styles.modalContent}>
                <View style={styles.editSection}>
                  <Text style={styles.editLabel}>Meal Type:</Text>
                  <Text style={styles.editValue}>
                    {getMealTypeEmoji(selectedMeal.mealType)} {selectedMeal.mealType?.toUpperCase()}
                  </Text>
                </View>
                
                <View style={styles.editSection}>
                  <Text style={styles.editLabel}>Date:</Text>
                  <Text style={styles.editValue}>
                    {formatHistoryDate(selectedMeal.date)}
                  </Text>
                </View>
                
                <View style={styles.editSection}>
                  <Text style={styles.editLabel}>Calories:</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editingCalories}
                    onChangeText={setEditingCalories}
                    placeholder="300"
                    placeholderTextColor={colors.text.secondary}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.editSection}>
                  <Text style={styles.editLabel}>Description:</Text>
                  <TextInput
                    style={styles.notesInput}
                    value={editingNotes}
                    onChangeText={setEditingNotes}
                    placeholder="What did you eat?"
                    placeholderTextColor={colors.text.secondary}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
                
                <View style={styles.modalButtons}>
                  <FalloutButton
                    text={loading ? "SAVING..." : "SAVE CHANGES"}
                    onPress={handleSaveMealChanges}
                    style={styles.modalButton}
                    isLoading={loading}
                  />
                  
                  <FalloutButton
                    text={loading ? "DELETING..." : "DELETE MEAL"}
                    onPress={handleDeleteMeal}
                    style={styles.modalButton}
                    type="secondary"
                    isLoading={loading}
                  />
                </View>
              </ScrollView>
            )}
          </View>
        </Modal>

        {/* 30-Day History Modal */}
        <Modal
          visible={showHistory}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>30-Day Meal History</Text>
              <TouchableOpacity
                onPress={() => setShowHistory(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {mealHistory.map((day, dayIndex) => (
                <View key={day.date} style={styles.historyDay}>
                  <Text style={styles.historyDayTitle}>
                    {formatHistoryDate(day.date)}
                  </Text>
                  
                  {day.meals.map((meal, mealIndex) => (
                    <View key={mealIndex} style={styles.historyMealItem}>
                      <View style={styles.historyMealHeader}>
                        <Text style={styles.historyMealType}>
                          {getMealTypeEmoji(meal.mealType)} {meal.mealType?.toUpperCase()}
                        </Text>
                        <Text style={styles.historyMealTime}>
                          {meal.time || 'Time not recorded'}
                        </Text>
                      </View>
                      <Text style={styles.historyMealDescription}>
                        {meal.description || meal.title}
                      </Text>
                      {meal.macros?.calories && (
                        <Text style={styles.historyMealCalories}>
                          {Math.round(meal.macros.calories)} cal
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              ))}
              
              {mealHistory.length === 0 && (
                <View style={styles.emptyHistory}>
                  <Text style={styles.emptyHistoryText}>
                    No meals found in the last 30 days
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </Modal>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 30,
    letterSpacing: 2,
    textAlign: 'center',
  },
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
    marginBottom: 20,
  },
  logButton: {
    marginTop: 10,
  },
  recentContainer: {
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.ui.border,
    marginBottom: 20,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  recentTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyButton: {
    backgroundColor: colors.ui.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  historyButtonText: {
    color: colors.text.light,
    fontSize: 12,
    fontWeight: 'bold',
  },
  recentItem: {
    backgroundColor: colors.ui.inputBg,
    padding: 12,
    borderRadius: 5,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealType: {
    color: colors.text.light,
    fontSize: 12,
    fontWeight: 'bold',
  },
  mealDate: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  recentText: {
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  caloriesText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  tapHint: {
    color: colors.text.secondary,
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
  },
  actionButtons: {
    gap: 15,
  },
  actionButton: {
    marginBottom: 10,
  },
  // Modal styles
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
  modalButtons: {
    gap: 15,
    marginTop: 20,
  },
  modalButton: {
    marginBottom: 10,
  },
  // AI Modal styles
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
    textAlign: 'left',
  },
  // Edit Modal styles
  editSection: {
    marginBottom: 20,
    backgroundColor: colors.background.overlay,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  editLabel: {
    color: colors.text.light,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  editValue: {
    color: colors.text.primary,
    fontSize: 16,
  },
  editInput: {
    backgroundColor: colors.ui.inputBg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: 5,
    color: colors.text.primary,
    padding: 12,
    fontSize: 16,
  },
  notesInput: {
    backgroundColor: colors.ui.inputBg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: 5,
    color: colors.text.primary,
    padding: 12,
    fontSize: 14,
    height: 100,
  },
  // History Modal styles
  historyDay: {
    marginBottom: 20,
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  historyDayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 10,
  },
  historyMealItem: {
    backgroundColor: colors.ui.inputBg,
    padding: 10,
    borderRadius: 5,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  historyMealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  historyMealType: {
    color: colors.text.light,
    fontSize: 11,
    fontWeight: 'bold',
  },
  historyMealTime: {
    color: colors.text.secondary,
    fontSize: 11,
  },
  historyMealDescription: {
    color: colors.text.primary,
    fontSize: 13,
    lineHeight: 16,
    marginBottom: 3,
  },
  historyMealCalories: {
    color: colors.text.secondary,
    fontSize: 11,
    fontStyle: 'italic',
  },
  emptyHistory: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyHistoryText: {
    color: colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
  },
  // Feedback styles
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
});

export default MealPlanScreen;