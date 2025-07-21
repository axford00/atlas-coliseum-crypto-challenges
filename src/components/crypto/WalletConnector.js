// FILE: src/components/crypto/WalletConnector.js
// 🚀 MOBILE WALLET ADAPTER CONNECTOR - Replacement Component

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { colors } from '../../theme/colors';
import solanaMobileWalletService from '../../services/solana/solanaMobileWalletService';
import { Platform } from 'react-native';

const WalletConnector = ({ visible, onClose, onWalletConnected }) => {
  const handleConnectMobileWallet = async () => {
    try {
      console.log('🔌 Connecting via Solana App Kit Mobile Wallet Adapter...');
      
      // Get platform support info
      const networkInfo = solanaMobileWalletService.getNetworkInfo();
      
      // Check if MWA is available on this platform
      if (!networkInfo.mwa) {
        if (networkInfo.requiresDevBuild) {
          Alert.alert(
            'Development Build Required',
            'Mobile Wallet Adapter requires an Expo Development Build for Android.\n\nTo enable real wallet connections:\n\n1. Run: npx eas build --profile development --platform android\n2. Install the built APK on your device\n3. Connect your mobile wallet\n\nFor now, you can test on iOS or continue with simulated mode.',
            [
              { text: 'Continue Simulation', style: 'cancel' },
              { text: 'Learn More', onPress: () => console.log('Check Expo Development Build docs') }
            ]
          );
        } else {
          Alert.alert(
            'Platform Not Supported',
            'Mobile Wallet Adapter is not available on this platform.',
            [{ text: 'OK' }]
          );
        }
        return;
      }
      
      const wallet = await solanaMobileWalletService.connectWallet();
      
      if (wallet && onWalletConnected) {
        onWalletConnected('mobile-wallet-adapter');
      }
      
      onClose();
      
    } catch (error) {
      console.error('❌ Mobile wallet connection failed:', error);
      
      if (error.message.includes('Development Build') || error.message.includes('TurboModuleRegistry')) {
        Alert.alert(
          'Android Development Build Required',
          'To connect real wallets on Android, you need a development build:\n\nnpx eas build --profile development --platform android\n\nFor testing, try iOS or continue with simulation.',
          [{ text: 'Got It!' }]
        );
      } else {
        Alert.alert(
          'Connection Failed',
          error.message || 'Failed to connect mobile wallet',
          [{ text: 'Try Again' }]
        );
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🔗 Connect Wallet</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.instructionText}>
              Connect your Solana mobile wallet to participate in crypto challenges
            </Text>

            <TouchableOpacity
              style={styles.walletButton}
              onPress={handleConnectMobileWallet}
            >
              <View style={styles.walletButtonContent}>
                <Text style={styles.walletButtonIcon}>📱</Text>
                <View style={styles.walletButtonText}>
                  <Text style={styles.walletName}>Mobile Wallet</Text>
                  <Text style={styles.walletDescription}>
                    Connect your installed Solana wallet
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>🔒 Safe & Secure</Text>
              <Text style={styles.infoText}>
                • Official Solana Mobile Wallet Adapter{'\n'}
                • No private keys shared{'\n'}
                • You control all transactions{'\n'}
                • Mainnet ready for real money
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.background.dark,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: colors.primary,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.ui.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
  },
  instructionText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  walletButton: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: 20,
  },
  walletButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletButtonIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  walletButtonText: {
    flex: 1,
  },
  walletName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  walletDescription: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  infoSection: {
    backgroundColor: 'rgba(0, 255, 127, 0.1)',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 127, 0.3)',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00ff7f',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 18,
  },
});

export default WalletConnector;