// src/screens/WorkoutScreen/components/CelebrationModal.js
import { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import FalloutButton from '../../../components/ui/FalloutButton';
import { colors } from '../../../theme/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CelebrationModal = ({
  visible,
  celebrationData,
  onClose,
  confettiPieces = [],
  renderConfettiPiece
}) => {
  const [modalAnimation] = useState(new Animated.Value(0));
  const [textAnimation] = useState(new Animated.Value(0));
  const [prBadgeAnimation] = useState(new Animated.Value(0));
  const [improvementAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible && celebrationData) {
      // Start celebration animation sequence
      startCelebrationSequence();
    } else {
      // Reset animations when modal closes
      modalAnimation.setValue(0);
      textAnimation.setValue(0);
      prBadgeAnimation.setValue(0);
      improvementAnimation.setValue(0);
    }
  }, [visible, celebrationData]);

  const startCelebrationSequence = () => {
    // Modal entrance with bounce
    Animated.sequence([
      Animated.spring(modalAnimation, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      // Text entrance with delay
      Animated.delay(200),
      Animated.spring(textAnimation, {
        toValue: 1,
        tension: 80,
        friction: 6,
        useNativeDriver: true,
      }),
      // PR badge pop
      Animated.delay(300),
      Animated.spring(prBadgeAnimation, {
        toValue: 1,
        tension: 120,
        friction: 4,
        useNativeDriver: true,
      }),
      // Improvement text slide up
      Animated.delay(400),
      Animated.spring(improvementAnimation, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleClose = () => {
    // Animate out then close
    Animated.parallel([
      Animated.timing(modalAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(textAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Default confetti piece renderer if not provided
  const defaultRenderConfettiPiece = (piece, index) => (
    <Animated.View
      key={index}
      style={[
        styles.confettiPiece,
        {
          left: piece.x,
          top: piece.y,
          backgroundColor: piece.color,
          transform: [
            { rotate: `${piece.rotation}deg` },
            { scale: piece.scale }
          ],
        },
      ]}
    />
  );

  if (!visible || !celebrationData) {
    return null;
  }

  const modalScale = modalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const textScale = textAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const prBadgeScale = prBadgeAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1.2],
  });

  const improvementSlide = improvementAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.modalBackground}>
        {/* Confetti Layer */}
        <View style={styles.confettiContainer}>
          {confettiPieces.map((piece, index) => 
            renderConfettiPiece ? 
            renderConfettiPiece(piece, index) : 
            defaultRenderConfettiPiece(piece, index)
          )}
        </View>

        {/* Celebration Content */}
        <Animated.View
          style={[
            styles.celebrationContainer,
            {
              transform: [{ scale: modalScale }],
              opacity: modalAnimation,
            },
          ]}
        >
          {/* Main PR Announcement */}
          <Animated.View
            style={[
              styles.prHeader,
              {
                transform: [{ scale: textScale }],
                opacity: textAnimation,
              },
            ]}
          >
            <Text style={styles.prEmoji}>🏆</Text>
            <Text style={styles.prTitle}>PERSONAL BEST!</Text>
            <Text style={styles.prSubtitle}>NEW RECORD ACHIEVED</Text>
          </Animated.View>

          {/* Exercise and Weight Display */}
          <Animated.View
            style={[
              styles.prDetails,
              {
                transform: [{ scale: prBadgeScale }],
                opacity: prBadgeAnimation,
              },
            ]}
          >
            <View style={styles.exerciseContainer}>
              <Text style={styles.exerciseName}>
                {celebrationData.exercise}
              </Text>
              <View style={styles.weightContainer}>
                <Text style={styles.newWeight}>
                  {celebrationData.weight}
                  <Text style={styles.unit}>{celebrationData.unit}</Text>
                </Text>
                {celebrationData.scheme && (
                  <Text style={styles.scheme}>
                    {celebrationData.scheme}
                  </Text>
                )}
              </View>
            </View>
          </Animated.View>

          {/* Improvement Stats */}
          <Animated.View
            style={[
              styles.improvementContainer,
              {
                transform: [{ translateY: improvementSlide }],
                opacity: improvementAnimation,
              },
            ]}
          >
            <View style={styles.improvementBox}>
              <Text style={styles.improvementLabel}>IMPROVEMENT</Text>
              <Text style={styles.improvementValue}>
                +{celebrationData.improvement}{celebrationData.unit}
              </Text>
              {celebrationData.previousBest > 0 && (
                <Text style={styles.previousBest}>
                  Previous: {celebrationData.previousBest}{celebrationData.unit}
                </Text>
              )}
            </View>
          </Animated.View>

          {/* Motivational Message */}
          <Animated.View
            style={[
              styles.messageContainer,
              {
                opacity: improvementAnimation,
              },
            ]}
          >
            <Text style={styles.motivationalMessage}>
              {getMotivationalMessage(celebrationData)}
            </Text>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: improvementAnimation,
              },
            ]}
          >
            <FalloutButton
              text="🚀 KEEP CRUSHING IT!"
              onPress={handleClose}
              style={styles.celebrationButton}
            />
            
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => {
                // TODO: Implement share functionality
                console.log('Share PR:', celebrationData);
                handleClose();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.shareButtonText}>📱 SHARE THIS VICTORY</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Background Overlay (tappable to close) */}
        <TouchableOpacity
          style={styles.backgroundOverlay}
          onPress={handleClose}
          activeOpacity={1}
        />
      </View>
    </Modal>
  );
};

// Get motivational message based on improvement
const getMotivationalMessage = (celebrationData) => {
  if (!celebrationData) return "Amazing work! 💪";
  
  const improvement = celebrationData.improvement || 0;
  const exercise = celebrationData.exercise?.toLowerCase() || '';
  
  // Custom messages based on exercise type
  if (exercise.includes('squat')) {
    if (improvement >= 25) return "LEGENDARY SQUAT GAINS! You're getting stronger! 🦵⚡";
    if (improvement >= 10) return "Solid squat progress! Your legs are thanking you! 🦵💪";
    return "Every pound counts! Keep building that squat! 🏗️";
  }
  
  if (exercise.includes('deadlift')) {
    if (improvement >= 25) return "BEAST MODE DEADLIFT! You're unstoppable! 🔥💀";
    if (improvement >= 10) return "Pulling like a champion! Keep it up! ⚡🏆";
    return "Deadlift gains are the best gains! 💪⚡";
  }
  
  if (exercise.includes('bench')) {
    if (improvement >= 15) return "CRUSHING the bench! Your chest is growing! 💥🏋️‍♂️";
    if (improvement >= 5) return "Bench press progress! Push it to the limit! 🚀";
    return "Steady bench gains! Keep pressing! 📈";
  }
  
  if (exercise.includes('clean') || exercise.includes('snatch')) {
    if (improvement >= 15) return "OLYMPIC LEVEL GAINS! Technique + strength! 🥇⚡";
    if (improvement >= 5) return "Technical perfection meets raw power! 🎯💪";
    return "Olympic lift mastery in progress! 🏋️‍♂️✨";
  }
  
  // Generic messages based on improvement size
  if (improvement >= 50) return "INCREDIBLE BREAKTHROUGH! You're on fire! 🔥🚀";
  if (improvement >= 25) return "MAJOR GAINS UNLOCKED! Keep this momentum! ⚡💪";
  if (improvement >= 10) return "Solid progress! Your hard work is paying off! 📈🎯";
  if (improvement >= 5) return "Every rep matters! You're getting stronger! 💪✨";
  
  return "Progress is progress! Keep pushing forward! 🚀💪";
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  celebrationContainer: {
    backgroundColor: colors.background.dark,
    borderRadius: 16,
    padding: 30,
    margin: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    maxWidth: screenWidth - 40,
    zIndex: 3,
  },
  prHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  prEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  prTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 5,
  },
  prSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    letterSpacing: 1,
  },
  prDetails: {
    alignItems: 'center',
    marginBottom: 25,
  },
  exerciseContainer: {
    alignItems: 'center',
    backgroundColor: colors.background.overlay,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    minWidth: 200,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  weightContainer: {
    alignItems: 'center',
  },
  newWeight: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
  },
  unit: {
    fontSize: 24,
    color: colors.text.secondary,
  },
  scheme: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 5,
    textAlign: 'center',
  },
  improvementContainer: {
    marginBottom: 25,
  },
  improvementBox: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  improvementLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 5,
  },
  improvementValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 5,
  },
  previousBest: {
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  messageContainer: {
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  motivationalMessage: {
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  celebrationButton: {
    backgroundColor: colors.primary,
    borderWidth: 0,
  },
  shareButton: {
    backgroundColor: colors.ui.inputBg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  shareButtonText: {
    color: colors.text.light,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default CelebrationModal;