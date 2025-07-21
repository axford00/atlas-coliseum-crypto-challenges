// ProfileScreen.js - COMPLETE FIX with Username Display
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../firebase';
import { colors, globalStyles } from '../theme/colors';

const ProfileScreen = ({ navigation }) => {
  const user = auth.currentUser;

  // Profile state
  const [currentProfile, setCurrentProfile] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [profileText, setProfileText] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // AI Weekly Plan state
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [savedWeeklyPlan, setSavedWeeklyPlan] = useState(null);

  useEffect(() => {
    if (!user) {
      console.log('❌ No user found, redirecting to auth...');
      return;
    }

    console.log('✅ User authenticated:', user.uid);
    loadUserProfile();
    loadWeeklyPlan();
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) {
      console.log('❌ No user in loadUserProfile');
      return;
    }

    try {
      setLoading(true);
      console.log('📝 Loading user profile for UID:', user.uid);
      
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('✅ User profile loaded:', userData);
        
        setCurrentProfile(userData.profile || '');
        
        // If no profile exists, show editing interface
        if (!userData.profile) {
          console.log('🆕 No profile data, enabling editing...');
          setIsEditing(true);
        }
      } else {
        console.log('🆕 New user document, showing profile creation...');
        setIsEditing(true);
      }
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
      console.error('❌ Error details:', error.code, error.message);
      Alert.alert('Error', `Failed to load profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyPlan = async () => {
    if (!user) return;

    try {
      console.log('📅 Loading weekly plan for UID:', user.uid);
      const weeklyPlanDocRef = doc(db, 'weeklyPlans', user.uid);
      const weeklyPlanDoc = await getDoc(weeklyPlanDocRef);
      
      if (weeklyPlanDoc.exists()) {
        const planData = weeklyPlanDoc.data();
        console.log('✅ Weekly plan loaded:', planData);
        setSavedWeeklyPlan(planData);
      } else {
        console.log('📅 No weekly plan found for user');
        setSavedWeeklyPlan(null);
      }
    } catch (error) {
      console.error('❌ Error loading weekly plan:', error);
      console.error('❌ Weekly plan error details:', error.code, error.message);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileText.trim()) {
      Alert.alert('Error', 'Please enter your profile information');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Please log in to save your profile');
      return;
    }

    setSaving(true);
    
    try {
      console.log('💾 Starting profile save...');
      console.log('💾 User UID:', user.uid);
      console.log('💾 Profile text:', profileText.trim());
      console.log('💾 User email:', user.email);
      
      // Create the user document data
      const userData = {
        profile: profileText.trim(),
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'Atlas User',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      
      console.log('💾 Saving user data:', userData);
      
      const userDocRef = doc(db, 'users', user.uid);
      
      // Use setDoc with merge to ensure document creation
      await setDoc(userDocRef, userData, { merge: true });

      console.log('✅ Profile saved successfully to Firestore!');
      
      // Verify the save worked by reading it back
      const savedDoc = await getDoc(userDocRef);
      if (savedDoc.exists()) {
        console.log('✅ Verification: Document exists in Firestore:', savedDoc.data());
        
        setCurrentProfile(profileText.trim());
        setIsEditing(false);
        setProfileText('');
        
        Alert.alert('Success!', 'Your profile has been updated successfully!');
      } else {
        console.error('❌ Verification failed: Document not found after save');
        Alert.alert('Error', 'Profile save verification failed. Please try again.');
      }
      
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      console.error('❌ Save error details:', error.code, error.message);
      
      // More specific error handling
      if (error.code === 'permission-denied') {
        Alert.alert('Permission Error', 'You do not have permission to save. Please check your login status.');
      } else if (error.code === 'unavailable') {
        Alert.alert('Network Error', 'Firebase is temporarily unavailable. Please try again.');
      } else {
        Alert.alert('Error', `Failed to save profile: ${error.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const generateWeeklyPlan = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to generate a weekly plan');
      return;
    }

    try {
      console.log('🤖 Generating AI weekly plan for user:', user.uid);
      setLoading(true);

      // Create a personalized weekly plan based on current profile
      const profileBasedPlan = `🗓️ YOUR PERSONALIZED ATLAS WEEKLY PLAN

Based on your profile: "${currentProfile || 'New Atlas member'}"

📅 MONDAY - FOUNDATION DAY
• Upper body strength training (45 mins)
• Focus on form and technique
• Post-workout: Protein within 30 mins

📅 TUESDAY - CARDIO CONDITIONING
• 30 minutes moderate cardio
• Choose your preferred activity
• Hydration focus: 8+ glasses water

📅 WEDNESDAY - ACTIVE RECOVERY
• Light movement or yoga (20-30 mins)
• Meal prep session
• Mental wellness check-in

📅 THURSDAY - STRENGTH BUILDING
• Lower body strength training (45 mins)
• Progressive overload principles
• Balanced nutrition throughout day

📅 FRIDAY - PEAK PERFORMANCE
• High-intensity circuit (30 mins)
• Full body engagement
• Celebrate weekly victories!

📅 WEEKEND - LIFESTYLE INTEGRATION
• Fun physical activities
• Social workouts welcome
• Flexible nutrition approach

💪 This plan evolves with your Atlas journey!
⚡ Complete challenges to unlock bonuses!`;

      setAiRecommendation(profileBasedPlan);
      await saveWeeklyPlan(profileBasedPlan);

    } catch (error) {
      console.error('❌ Error generating weekly plan:', error);
      Alert.alert('Error', 'Failed to generate weekly plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveWeeklyPlan = async (plan) => {
    if (!user || !plan) {
      Alert.alert('Error', 'Unable to save weekly plan');
      return;
    }

    try {
      console.log('💾 Saving weekly plan for user:', user.uid);
      
      const getWeekOfDate = () => {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        
        return `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
      };

      const weekOf = getWeekOfDate();
      const weeklyPlanData = {
        userId: user.uid,
        plan: plan,
        weekOf: weekOf,
        status: {
          monday: { workoutDone: false, mealsLogged: 0, notes: '' },
          tuesday: { workoutDone: false, mealsLogged: 0, notes: '' },
          wednesday: { workoutDone: false, mealsLogged: 0, notes: '' },
          thursday: { workoutDone: false, mealsLogged: 0, notes: '' },
          friday: { workoutDone: false, mealsLogged: 0, notes: '' },
          saturday: { workoutDone: false, mealsLogged: 0, notes: '' },
          sunday: { workoutDone: false, mealsLogged: 0, notes: '' }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('💾 Weekly plan data:', weeklyPlanData);

      const weeklyPlanDocRef = doc(db, 'weeklyPlans', user.uid);
      await setDoc(weeklyPlanDocRef, weeklyPlanData);
      
      console.log('✅ Weekly plan saved successfully!');
      setSavedWeeklyPlan(weeklyPlanData);
      
      Alert.alert(
        'Success!', 
        'Your personalized Atlas weekly plan has been saved! Track your progress and earn rewards through challenges.'
      );
      
    } catch (error) {
      console.error('❌ Error saving weekly plan:', error);
      console.error('❌ Weekly plan save error details:', error.code, error.message);
      Alert.alert('Error', `Failed to save weekly plan: ${error.message}`);
    }
  };

  // Enhanced logging for debugging
  console.log('🔍 ProfileScreen render state:', {
    user: user ? { uid: user.uid, email: user.email } : null,
    loading,
    saving,
    isEditing,
    hasCurrentProfile: !!currentProfile,
    hasSavedPlan: !!savedWeeklyPlan
  });

  // Loading state
  if (loading) {
    return (
      <View style={styles.background}>
        <View style={styles.container}>
          <View style={globalStyles.hudCorner1} />
          <View style={globalStyles.hudCorner2} />
          <View style={globalStyles.hudCorner3} />
          <View style={globalStyles.hudCorner4} />
          
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading your Atlas profile...</Text>
          </View>
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
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.titleTop}>ATLAS</Text>
            <Text style={styles.titleBottom}>PROFILE</Text>
          </View>

          {/* User Info - FIXED: Username Display */}
          <View style={styles.userInfoContainer}>
            <Text style={styles.userName}>
              {user?.displayName || user?.email?.split('@')[0] || 'Atlas Warrior'}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userJoined}>
              Atlas Member since {new Date().toLocaleDateString()}
            </Text>
          </View>

          {/* Profile Section */}
          <View style={styles.profileContainer}>
            <Text style={styles.sectionTitle}>📝 WARRIOR PROFILE</Text>
            
            {!isEditing && currentProfile ? (
              <View>
                <View style={styles.profileDisplayContainer}>
                  <Text style={styles.profileDisplayText}>{currentProfile}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => {
                    setIsEditing(true);
                    setProfileText(currentProfile);
                  }}
                >
                  <Text style={styles.editButtonText}>⚡ EDIT PROFILE</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <TextInput
                  style={styles.profileInput}
                  placeholder="Tell us about your fitness journey, goals, experience level, preferred activities..."
                  placeholderTextColor={colors.text.secondary}
                  value={profileText}
                  onChangeText={setProfileText}
                  multiline
                  numberOfLines={4}
                />
                <View style={styles.profileButtonContainer}>
                  <TouchableOpacity 
                    style={[styles.profileButton, styles.saveButton]}
                    onPress={handleSaveProfile}
                    disabled={saving}
                  >
                    <Text style={styles.profileButtonText}>
                      {saving ? '💾 SAVING...' : '💾 SAVE PROFILE'}
                    </Text>
                  </TouchableOpacity>
                  
                  {currentProfile && (
                    <TouchableOpacity 
                      style={[styles.profileButton, styles.cancelButton]}
                      onPress={() => {
                        setIsEditing(false);
                        setProfileText('');
                      }}
                    >
                      <Text style={styles.profileButtonText}>❌ CANCEL</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* Weekly Plan Section */}
          {savedWeeklyPlan ? (
            <View style={styles.weeklyPlanContainer}>
              <Text style={styles.sectionTitle}>🗓️ ATLAS WEEKLY PLAN</Text>
              <View style={styles.planDisplayContainer}>
                <Text style={styles.planText}>{savedWeeklyPlan.plan}</Text>
                <Text style={styles.planWeek}>Week of: {savedWeeklyPlan.weekOf}</Text>
              </View>
              <TouchableOpacity 
                style={styles.generateButton}
                onPress={generateWeeklyPlan}
              >
                <Text style={styles.generateButtonText}>🔄 REGENERATE PLAN</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.weeklyPlanContainer}>
              <Text style={styles.sectionTitle}>🗓️ GET YOUR ATLAS PLAN</Text>
              <Text style={styles.planDescription}>
                Let Atlas AI create a personalized workout and nutrition plan based on your warrior profile!
              </Text>
              <TouchableOpacity 
                style={styles.generateButton}
                onPress={generateWeeklyPlan}
                disabled={!currentProfile}
              >
                <Text style={styles.generateButtonText}>
                  🤖 GENERATE ATLAS PLAN
                </Text>
              </TouchableOpacity>
              {!currentProfile && (
                <Text style={styles.requirementText}>
                  Complete your warrior profile first to generate a personalized Atlas plan
                </Text>
              )}
            </View>
          )}

          {/* Navigation Buttons */}
          <View style={styles.navigationContainer}>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => navigation.navigate('Workout')}
            >
              <Text style={styles.navButtonText}>🏋️ TRAINING GROUND</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => navigation.navigate('MealPlans')}
            >
              <Text style={styles.navButtonText}>🍽️ NUTRITION CENTER</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => navigation.navigate('ChallengesScreen')}
            >
              <Text style={styles.navButtonText}>⚡ COLISEUM CHALLENGES</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  userInfoContainer: {
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  userName: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: 5,
  },
  userJoined: {
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 5,
  },
  profileContainer: {
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  profileDisplayContainer: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  profileDisplayText: {
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
  },
  profileInput: {
    backgroundColor: colors.ui.inputBg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: 8,
    color: colors.text.primary,
    padding: 15,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  profileButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.text.secondary,
  },
  editButton: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  profileButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  editButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  weeklyPlanContainer: {
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  planDisplayContainer: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  planText: {
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  planWeek: {
    color: colors.text.secondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  planDescription: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 18,
  },
  generateButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  generateButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
  requirementText: {
    color: colors.text.secondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  navigationContainer: {
    marginTop: 20,
  },
  navButton: {
    backgroundColor: colors.background.overlay,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  navButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;