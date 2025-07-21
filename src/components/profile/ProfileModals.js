// components/profile/ProfileModals.js
import { doc, setDoc } from 'firebase/firestore';
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
import { db } from '../../../firebase';
import { colors } from '../../theme/colors';
import FalloutButton from '../ui/FalloutButton';

const ProfileModals = ({
  // Phone Modal Props
  showPhoneModal,
  setShowPhoneModal,
  phoneNumber,
  setPhoneNumber,
  updatingPhone,
  user,
  setCurrentPhone,
  formatPhoneNumber,
  
  // AI Weekly Plan Modal Props
  showAiModal,
  setShowAiModal,
  aiRecommendation,
  saveWeeklyPlan,
  generateWeeklyPlan,
  
  // Weekly Plan Dashboard Modal Props
  showWeeklyPlanDashboard,
  setShowWeeklyPlanDashboard,
  savedWeeklyPlan,
  setSelectedDay,
  
  // Day Notes Modal Props - FIXED: Consolidated all day notes props
  showDayNotes,
  setShowDayNotes,
  selectedDay,
  dayNotes,
  setDayNotes,
  saveDayNotes
}) => {
  
  const updatePhoneNumber = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }
    
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber.trim());
      
      await setDoc(doc(db, 'users', user.uid), {
        phone: formattedPhone,
        phoneRaw: phoneNumber.trim(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setCurrentPhone(formattedPhone);
      setShowPhoneModal(false);
      setPhoneNumber('');
      Alert.alert('Success!', 'Phone number updated successfully! Your friends can now find you as a workout buddy.');
      
    } catch (error) {
      console.error('Error updating phone number:', error);
      Alert.alert('Error', 'Failed to update phone number');
    }
  };

  const closePhoneModal = () => {
    setShowPhoneModal(false);
    setPhoneNumber('');
  };

  const closeAiModal = () => {
    setShowAiModal(false);
  };

  const generateNewPlan = () => {
    setShowAiModal(false);
    setTimeout(() => generateWeeklyPlan(), 500);
  };

  const closeWeeklyPlanDashboard = () => {
    setShowWeeklyPlanDashboard(false);
  };

  const openDayNotes = (day, notes = '') => {
    setSelectedDay(day);
    setDayNotes(notes);
    setShowDayNotes(true);
  };

  const closeDayNotes = () => {
    setShowDayNotes(false);
    setDayNotes('');
    setSelectedDay(null);
  };

  const addQuickNote = (noteText) => {
    setDayNotes(prev => prev + (prev ? '\n' : '') + noteText);
  };

  return (
    <>
      {/* Phone Number Update Modal */}
      <Modal
        visible={showPhoneModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📱 Update Phone Number</Text>
            <TouchableOpacity onPress={closePhoneModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.phoneModalContainer}>
              <Text style={styles.phoneModalLabel}>
                Adding your phone number helps friends find you as a workout buddy when they scan their contacts.
              </Text>
              
              <Text style={styles.phoneInputLabel}>Phone Number:</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder="(555) 123-4567"
                placeholderTextColor={colors.text.secondary}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                autoCorrect={false}
              />
              
              <Text style={styles.phoneHelperText}>
                We'll format this automatically and keep it secure. Only your confirmed workout buddies can see it.
              </Text>
            </View>
            
            <View style={styles.modalButtons}>
              <FalloutButton
                text={updatingPhone ? "UPDATING..." : "UPDATE PHONE NUMBER"}
                onPress={updatePhoneNumber}
                style={styles.modalButton}
                isLoading={updatingPhone}
              />
              
              <FalloutButton
                text="CANCEL"
                onPress={closePhoneModal}
                style={styles.modalButton}
                type="secondary"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* AI Weekly Plan Modal */}
      <Modal
        visible={showAiModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🗓️ Your Personalized Weekly Plan</Text>
            <TouchableOpacity onPress={closeAiModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.aiRecommendationContainer}>
              <Text style={styles.aiRecommendationText}>{aiRecommendation}</Text>
            </View>
            
            <View style={styles.modalButtons}>
              <FalloutButton
                text="SAVE TO MY WEEKLY PLAN"
                onPress={saveWeeklyPlan}
                style={styles.modalButton}
              />
              
              <FalloutButton
                text="GENERATE NEW PLAN"
                onPress={generateNewPlan}
                style={styles.modalButton}
                type="secondary"
              />
              
              <FalloutButton
                text="CLOSE"
                onPress={closeAiModal}
                style={styles.modalButton}
                type="secondary"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Weekly Plan Dashboard Modal */}
      <Modal
        visible={showWeeklyPlanDashboard}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📅 {savedWeeklyPlan?.weekOf} Plan</Text>
            <TouchableOpacity onPress={closeWeeklyPlanDashboard} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {savedWeeklyPlan && (
              <>
                <View style={styles.fullPlanContainer}>
                  <Text style={styles.fullPlanText}>{savedWeeklyPlan.plan}</Text>
                </View>
                
                <View style={styles.progressTrackingContainer}>
                  <Text style={styles.progressTrackingTitle}>📊 Weekly Progress Tracker</Text>
                  
                  {Object.entries(savedWeeklyPlan.status).map(([day, status]) => (
                    <View key={day} style={styles.dayTrackingItem}>
                      <View style={styles.dayTrackingHeader}>
                        <Text style={styles.dayTrackingName}>
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </Text>
                        <View style={styles.dayTrackingStatus}>
                          <Text style={styles.workoutStatus}>
                            {status.workoutDone ? '💪 ✅' : '💪 ⭕'}
                          </Text>
                          <Text style={styles.mealStatus}>
                            🍽️ {status.mealsLogged}/3
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.dayActions}>
                        <TouchableOpacity 
                          style={[styles.actionChip, status.workoutDone && styles.actionChipDone]}
                          onPress={() => {
                            Alert.alert('Coming Soon', 'Direct workout logging from plan will be available soon!');
                          }}
                        >
                          <Text style={styles.actionChipText}>
                            {status.workoutDone ? 'Workout ✅' : 'Log Workout'}
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={styles.actionChip}
                          onPress={() => {
                            Alert.alert('Coming Soon', 'Direct meal logging from plan will be available soon!');
                          }}
                        >
                          <Text style={styles.actionChipText}>Log Meal</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={styles.notesChip}
                          onPress={() => openDayNotes(day, status.notes || '')}
                        >
                          <Text style={styles.notesChipText}>
                            {status.notes ? '📝 Edit Notes' : '📝 Add Notes'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      
                      {status.notes && (
                        <View style={styles.dayNotesPreview}>
                          <Text style={styles.dayNotesPreviewText}>{status.notes}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
                
                <View style={styles.modalButtons}>
                  <FalloutButton
                    text="GENERATE NEW PLAN"
                    onPress={() => {
                      setShowWeeklyPlanDashboard(false);
                      setTimeout(() => generateWeeklyPlan(), 500);
                    }}
                    style={styles.modalButton}
                    type="secondary"
                  />
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Day Notes Modal */}
      <Modal
        visible={showDayNotes}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              📝 {selectedDay ? selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1) : ''} Notes
            </Text>
            <TouchableOpacity onPress={closeDayNotes} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.dayNotesContainer}>
              <Text style={styles.dayNotesLabel}>
                How did your day go? Any achievements, challenges, or thoughts?
              </Text>
              
              <TextInput
                style={styles.dayNotesInput}
                placeholder="e.g., Hit a new PR on squats! Felt great today. Need to work on form for deadlifts..."
                placeholderTextColor={colors.text.secondary}
                value={dayNotes}
                onChangeText={setDayNotes}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
              
              <View style={styles.quickNotesContainer}>
                <Text style={styles.quickNotesLabel}>Quick Notes:</Text>
                <View style={styles.quickNotesGrid}>
                  <TouchableOpacity 
                    style={styles.quickNoteButton}
                    onPress={() => addQuickNote('🎉 New Personal Record!')}
                  >
                    <Text style={styles.quickNoteText}>🎉 New PR!</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.quickNoteButton}
                    onPress={() => addQuickNote('💪 Felt strong today')}
                  >
                    <Text style={styles.quickNoteText}>💪 Felt Strong</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.quickNoteButton}
                    onPress={() => addQuickNote('😴 Low energy today')}
                  >
                    <Text style={styles.quickNoteText}>😴 Low Energy</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.quickNoteButton}
                    onPress={() => addQuickNote('🍎 Ate well today')}
                  >
                    <Text style={styles.quickNoteText}>🍎 Good Nutrition</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <FalloutButton
                text="SAVE NOTES"
                onPress={saveDayNotes}
                style={styles.modalButton}
              />
              
              <FalloutButton
                text="CANCEL"
                onPress={closeDayNotes}
                style={styles.modalButton}
                type="secondary"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Common Modal Styles
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
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
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

  // Phone Modal Styles
  phoneModalContainer: {
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 20,
  },
  phoneModalLabel: {
    color: colors.text.primary,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  phoneInputLabel: {
    color: colors.text.light,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  phoneInput: {
    backgroundColor: colors.ui.inputBg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: 5,
    color: colors.text.primary,
    padding: 15,
    fontSize: 16,
    marginBottom: 10,
  },
  phoneHelperText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },

  // AI Modal Styles
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

  // Weekly Plan Dashboard Modal Styles
  fullPlanContainer: {
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.ui.border,
    marginBottom: 20,
  },
  fullPlanText: {
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
  },
  progressTrackingContainer: {
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 20,
  },
  progressTrackingTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  dayTrackingItem: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  dayTrackingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayTrackingName: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  dayTrackingStatus: {
    flexDirection: 'row',
    gap: 10,
  },
  workoutStatus: {
    color: colors.text.primary,
    fontSize: 14,
  },
  mealStatus: {
    color: colors.text.primary,
    fontSize: 14,
  },
  dayActions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  actionChip: {
    backgroundColor: colors.primary,
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionChipDone: {
    backgroundColor: colors.ui.border,
    opacity: 0.7,
  },
  actionChipText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  notesChip: {
    backgroundColor: colors.ui.border,
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  notesChipText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  dayNotesPreview: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 5,
    padding: 8,
    marginTop: 8,
  },
  dayNotesPreviewText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontStyle: 'italic',
  },

  // Day Notes Modal Styles
  dayNotesContainer: {
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 20,
  },
  dayNotesLabel: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  dayNotesInput: {
    backgroundColor: colors.ui.inputBg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: 5,
    color: colors.text.primary,
    padding: 15,
    fontSize: 16,
    height: 150,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  quickNotesContainer: {
    marginTop: 10,
  },
  quickNotesLabel: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: 10,
  },
  quickNotesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickNoteButton: {
    backgroundColor: colors.ui.inputBg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quickNoteText: {
    color: colors.text.light,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ProfileModals;