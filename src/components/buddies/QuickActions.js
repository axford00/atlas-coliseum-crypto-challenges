// src/components/buddies/QuickActions.js - Quick Action Buttons
import {
    StyleSheet,
    Text,
    View
} from 'react-native';
import { colors } from '../../theme/colors';
import FalloutButton from '../ui/FalloutButton';

const QuickActions = ({ 
  onSendMessage, 
  onSendChallenge,
  sendingMessage = false 
}) => {
  return (
    <View style={styles.actionsSection}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.buttonContainer}>
        <FalloutButton
          text="💬 SEND MESSAGE"
          onPress={onSendMessage}
          style={styles.actionButton}
          isLoading={sendingMessage}
        />
        
        <FalloutButton
          text="⚡ SEND CHALLENGE"
          onPress={onSendChallenge}
          style={styles.actionButton}
          type="secondary"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Actions Section - HomeScreen style container
  actionsSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  buttonContainer: {
    width: '100%',
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 15,
  },
  actionButton: {
    marginBottom: 5,
  },
});

export default QuickActions;