// src/components/buddies/MessageModal.js - Message creation modal component
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../../theme/colors';
import FalloutButton from '../ui/FalloutButton';

const MessageModal = ({ visible, buddy, onClose, onSend }) => {
  const [messageText, setMessageText] = useState('');

  const handleQuickMessage = (messageType) => {
    let message = '';
    
    switch (messageType) {
      case 'fist_pump':
        message = '👊 Keep crushing it! You\'re doing amazing!';
        break;
      case 'strong_man':
        message = '💪 Beast mode activated! You\'re getting stronger every day!';
        break;
      case 'fire':
        message = '🔥 On fire! Your dedication is inspiring!';
        break;
    }
    
    onSend(messageType, message);
  };

  const handleCustomMessage = () => {
    onSend('custom', messageText);
    setMessageText('');
  };

  const handleClose = () => {
    setMessageText('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalBackground}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            💬 Encourage {buddy?.name || buddy?.displayName}
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Send some motivation!</Text>
            
            <View style={styles.quickMessagesContainer}>
              <Text style={styles.quickMessagesLabel}>Quick Messages:</Text>
              <View style={styles.quickMessagesGrid}>
                <TouchableOpacity 
                  style={styles.quickMessageButton} 
                  onPress={() => handleQuickMessage('fist_pump')}
                >
                  <Text style={styles.quickMessageText}>👊 Fist Pump</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickMessageButton} 
                  onPress={() => handleQuickMessage('strong_man')}
                >
                  <Text style={styles.quickMessageText}>💪 Beast Mode</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickMessageButton} 
                  onPress={() => handleQuickMessage('fire')}
                >
                  <Text style={styles.quickMessageText}>🔥 On Fire</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={styles.messageLabel}>Or write a custom message:</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="e.g., Great job on that workout! You're crushing your goals! 💪"
              placeholderTextColor={colors.text.secondary}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          <View style={styles.modalButtons}>
            <FalloutButton 
              text="SEND CUSTOM MESSAGE" 
              onPress={handleCustomMessage} 
              style={styles.modalButton} 
            />
            <FalloutButton 
              text="CANCEL" 
              onPress={handleClose} 
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
  messageContainer: {
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 20,
  },
  messageLabel: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  quickMessagesContainer: {
    marginBottom: 20,
  },
  quickMessagesLabel: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: 10,
  },
  quickMessagesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  },
  quickMessageButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
  },
  quickMessageText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  messageInput: {
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
  modalButtons: {
    gap: 15,
    marginTop: 20,
  },
  modalButton: {
    marginBottom: 10,
  },
});

export default MessageModal;