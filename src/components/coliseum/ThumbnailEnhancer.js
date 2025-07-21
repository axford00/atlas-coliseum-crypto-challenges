// src/components/coliseum/ThumbnailEnhancer.js - Add to your Coliseum
import { useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import videoThumbnailService from '../../services/videoThumbnailService';
import { colors } from '../../theme/colors';
import FalloutButton from '../ui/FalloutButton';

const ThumbnailEnhancer = ({ visible, onClose, onComplete }) => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [completed, setCompleted] = useState(false);
  const [enhancedCount, setEnhancedCount] = useState(0);

  const startEnhancement = async () => {
    setProcessing(true);
    setCompleted(false);
    setEnhancedCount(0);
    
    try {
      console.log('🏛️ Starting Coliseum enhancement...');
      
      const count = await videoThumbnailService.processColiseumVideos((current, total) => {
        setProgress({ current, total });
        console.log(`📈 Enhancement progress: ${current}/${total}`);
      });
      
      setEnhancedCount(count);
      setCompleted(true);
      
      if (count > 0) {
        Alert.alert(
          'Coliseum Enhanced! 🏛️✨',
          `Generated beautiful thumbnails for ${count} challenge videos. Your Coliseum now looks absolutely stunning!`,
          [{ text: 'Amazing!', style: 'default' }]
        );
        
        // Notify parent to refresh
        if (onComplete) {
          onComplete();
        }
      } else {
        Alert.alert(
          'Coliseum Perfect! ✅',
          'All your challenge videos already have beautiful thumbnails. Your Coliseum is ready to impress!',
          [{ text: 'Excellent!', style: 'default' }]
        );
      }
      
    } catch (error) {
      console.error('❌ Error enhancing Coliseum:', error);
      Alert.alert('Enhancement Error', 'Failed to enhance videos. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const resetAndClose = () => {
    setProgress({ current: 0, total: 0 });
    setCompleted(false);
    setEnhancedCount(0);
    setProcessing(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🏛️ Enhance The Coliseum</Text>
          <TouchableOpacity onPress={resetAndClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {!processing && !completed && (
            <View style={styles.startContainer}>
              <Text style={styles.heroIcon}>🎬</Text>
              <Text style={styles.subtitle}>Make Your Challenge Videos Stunning</Text>
              <Text style={styles.description}>
                Transform your Coliseum into a visual masterpiece! This will automatically 
                generate beautiful thumbnails for all challenge videos, making them 
                irresistible to click and share.
              </Text>
              
              <View style={styles.benefitsContainer}>
                <Text style={styles.benefitsTitle}>🚀 Coliseum Benefits:</Text>
                <Text style={styles.benefit}>• Professional video previews for all challenges</Text>
                <Text style={styles.benefit}>• Increased warrior engagement and interaction</Text>
                <Text style={styles.benefit}>• App Store ready visual quality</Text>
                <Text style={styles.benefit}>• Perfect for beta user expansion</Text>
                <Text style={styles.benefit}>• Viral-worthy social sharing potential</Text>
              </View>

              <View style={styles.ctaContainer}>
                <Text style={styles.ctaText}>
                  Ready to make your Coliseum the most engaging fitness arena on mobile? 💪
                </Text>
                
                <FalloutButton
                  text="🏛️ ENHANCE COLISEUM"
                  onPress={startEnhancement}
                  style={styles.enhanceButton}
                />
              </View>
            </View>
          )}

          {processing && (
            <View style={styles.processingContainer}>
              <Text style={styles.processingIcon}>⚡</Text>
              <Text style={styles.processingTitle}>Enhancing Challenge Videos...</Text>
              
              {progress.total > 0 && (
                <View style={styles.progressContainer}>
                  <Text style={styles.progressText}>
                    Enhancing video {progress.current} of {progress.total}
                  </Text>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${(progress.current / progress.total) * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressPercentage}>
                    {Math.round((progress.current / progress.total) * 100)}%
                  </Text>
                </View>
              )}

              <Text style={styles.processingNote}>
                🎥 Creating stunning thumbnails for warrior victories...
              </Text>
              <Text style={styles.processingSubNote}>
                This makes your app ready for viral growth! 📈
              </Text>
            </View>
          )}

          {completed && (
            <View style={styles.completedContainer}>
              <Text style={styles.completedIcon}>🎉</Text>
              <Text style={styles.completedTitle}>Coliseum Enhanced!</Text>
              <Text style={styles.completedText}>
                Successfully enhanced {enhancedCount} challenge videos. 
                Your Coliseum is now a visual masterpiece ready to wow users!
              </Text>
              
              <View style={styles.impactContainer}>
                <Text style={styles.impactTitle}>📈 Expected Impact:</Text>
                <Text style={styles.impact}>• 3x more video engagement</Text>
                <Text style={styles.impact}>• Professional app store appearance</Text>
                <Text style={styles.impact}>• Higher beta user retention</Text>
                <Text style={styles.impact}>• Increased social sharing</Text>
                <Text style={styles.impact}>• Ready for viral growth</Text>
              </View>

              <View style={styles.nextStepsContainer}>
                <Text style={styles.nextStepsTitle}>🚀 Next Steps:</Text>
                <Text style={styles.nextStep}>• Share the enhanced Coliseum with beta users</Text>
                <Text style={styles.nextStep}>• Use improved visuals for app store screenshots</Text>
                <Text style={styles.nextStep}>• Leverage for user acquisition campaigns</Text>
                <Text style={styles.nextStep}>• Watch engagement metrics soar!</Text>
              </View>

              <FalloutButton
                text="🏛️ VIEW ENHANCED COLISEUM"
                onPress={() => {
                  resetAndClose();
                  // Parent component should navigate to Coliseum
                }}
                style={styles.viewButton}
              />

              <TouchableOpacity onPress={resetAndClose} style={styles.closeTextButton}>
                <Text style={styles.closeTextButtonText}>Perfect! Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border,
  },
  title: {
    fontSize: 22,
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
  content: {
    flex: 1,
    padding: 20,
  },
  
  // Start Container
  startContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  heroIcon: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  benefitsContainer: {
    backgroundColor: colors.background.overlay,
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 15,
    textAlign: 'center',
  },
  benefit: {
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: 8,
    lineHeight: 18,
  },
  ctaContainer: {
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 16,
    color: colors.text.light,
    textAlign: 'center',
    marginBottom: 25,
    fontWeight: 'bold',
  },
  enhanceButton: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primary,
  },

  // Processing Container
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 30,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  progressText: {
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 15,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 10,
    backgroundColor: colors.ui.inputBg,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  progressPercentage: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: 'bold',
  },
  processingNote: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  processingSubNote: {
    fontSize: 12,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: 'bold',
  },

  // Completed Container
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  completedText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  impactContainer: {
    backgroundColor: colors.background.overlay,
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    width: '100%',
  },
  impactTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  impact: {
    fontSize: 12,
    color: colors.text.primary,
    marginBottom: 4,
    lineHeight: 16,
  },
  nextStepsContainer: {
    backgroundColor: colors.ui.inputBg,
    padding: 15,
    borderRadius: 12,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: colors.ui.border,
    width: '100%',
  },
  nextStepsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.light,
    marginBottom: 10,
    textAlign: 'center',
  },
  nextStep: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
    lineHeight: 16,
  },
  viewButton: {
    marginBottom: 15,
    width: '100%',
  },
  closeTextButton: {
    paddingVertical: 10,
  },
  closeTextButtonText: {
    color: colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ThumbnailEnhancer;