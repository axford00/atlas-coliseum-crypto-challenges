// src/screens/WorkoutScreen/components/GymWODSection.js
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import FalloutButton from '../../../components/ui/FalloutButton';
import { colors } from '../../../theme/colors';

const GymWODSection = ({ 
  gymWOD, 
  gymInfo, 
  loadingGymWOD, 
  onUseWOD,
  onGetAIHelp 
}) => {
  const [showGymWOD, setShowGymWOD] = useState(false);

  const handleUseWOD = () => {
    if (gymWOD) {
      onUseWOD(gymWOD.content);
      Alert.alert('WOD Loaded', `${gymWOD.daysDiff === 0 ? "Today's" : gymWOD.daysDiff === 1 ? "Yesterday's" : "The"} gym WOD loaded! Ready to log.`);
    }
  };

  const handleGetAIHelp = () => {
    setShowGymWOD(false);
    setTimeout(() => onGetAIHelp(), 500);
  };

  const handleCreateOwn = () => {
    setShowGymWOD(false);
    onUseWOD(''); // Clear the workout text
  };

  const handleUseThisWOD = () => {
    if (gymWOD) {
      onUseWOD(gymWOD.content);
      setShowGymWOD(false);
      Alert.alert('WOD Loaded!', 'Your gym\'s WOD is now loaded. You can edit it or log it as-is!');
    }
  };

  // Show loading indicator
  if (loadingGymWOD) {
    return (
      <View style={styles.loadingGymContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingGymText}>Loading your gym's WOD...</Text>
      </View>
    );
  }

  // Don't render anything if no WOD
  if (!gymWOD) {
    return null;
  }

  return (
    <>
      {/* RELAXED Gym WOD Section - Shows current and recent WODs */}
      <View style={styles.gymWodContainer}>
        <View style={styles.gymWodHeader}>
          <Text style={styles.gymWodTitle}>
            🏋️‍♂️ {gymWOD.daysDiff === 0 ? "Today's WOD" : gymWOD.daysDiff === 1 ? "Yesterday's WOD" : "Recent WOD"}
          </Text>
          <Text style={styles.gymWodGym}>{gymWOD.gymName || gymInfo?.name}</Text>
          
          {gymWOD.source === 'scraped' ? (
            <Text style={styles.gymWodSource}>
              🌐 From {gymInfo?.name || 'gym'}'s website {gymWOD.daysDiff === 1 && "(Yesterday)"}
            </Text>
          ) : (
            <Text style={styles.gymWodSource}>
              🤖 AI-generated for today
            </Text>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.gymWodPreview}
          onPress={() => setShowGymWOD(true)}
        >
          <Text style={styles.gymWodPreviewTitle}>{gymWOD.title}</Text>
          <Text style={styles.gymWodPreviewContent} numberOfLines={3}>
            {gymWOD.content}
          </Text>
          <Text style={styles.gymWodTapHint}>
            Tap to view full WOD
          </Text>
        </TouchableOpacity>
        
        <View style={styles.gymWodActions}>
          <FalloutButton
            text={`USE ${gymWOD.daysDiff === 0 ? "TODAY'S" : gymWOD.daysDiff === 1 ? "YESTERDAY'S" : "THIS"} WOD`}
            onPress={handleUseWOD}
            style={styles.gymWodButton}
            type="primary"
          />
        </View>
      </View>

      {/* RELAXED Gym WOD Detail Modal */}
      <Modal
        visible={showGymWOD}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🏋️‍♂️ {gymWOD?.gymName} WOD</Text>
            <TouchableOpacity
              onPress={() => setShowGymWOD(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {gymWOD && (
              <>
                <View style={styles.fullWodContainer}>
                  <Text style={styles.fullWodTitle}>{gymWOD.title}</Text>
                  <Text style={styles.fullWodDate}>{gymWOD.date}</Text>
                  {gymWOD.source === 'scraped' && (
                    <Text style={styles.fullWodSource}>
                      ✅ Live from {gymWOD.gymName} website {gymWOD.daysDiff === 1 && "(Yesterday)"}
                    </Text>
                  )}
                  <Text style={styles.fullWodContent}>
                    {gymWOD.content}
                  </Text>
                </View>
                
                <View style={styles.modalButtons}>
                  <FalloutButton
                    text="USE THIS WOD"
                    onPress={handleUseThisWOD}
                    style={styles.modalButton}
                  />
                  
                  <FalloutButton
                    text="GET AI COACH HELP"
                    onPress={handleGetAIHelp}
                    style={styles.modalButton}
                    type="secondary"
                  />
                  
                  <FalloutButton
                    text="CREATE MY OWN"
                    onPress={handleCreateOwn}
                    style={styles.modalButton}
                    type="secondary"
                  />
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  loadingGymContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginBottom: 10,
  },
  loadingGymText: {
    color: colors.text.secondary,
    marginLeft: 10,
    fontSize: 14,
  },
  gymWodContainer: {
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: 20,
  },
  gymWodHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  gymWodTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  gymWodGym: {
    color: colors.text.secondary,
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  gymWodSource: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  gymWodPreview: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.ui.border,
    marginBottom: 15,
  },
  gymWodPreviewTitle: {
    color: colors.text.light,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  gymWodPreviewContent: {
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  gymWodTapHint: {
    color: colors.text.secondary,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  gymWodActions: {
    flexDirection: 'row',
    gap: 10,
  },
  gymWodButton: {
    flex: 1,
  },
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
  fullWodContainer: {
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 20,
  },
  fullWodTitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  fullWodDate: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  fullWodSource: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  fullWodContent: {
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
});

export default GymWODSection;