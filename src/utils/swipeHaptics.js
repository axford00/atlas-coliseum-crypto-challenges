// src/utils/swipeHaptics.js - Enhanced tactile feedback for swipe navigation
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

class SwipeHapticsManager {
  constructor() {
    this.isEnabled = true;
    this.lastHapticTime = 0;
    this.hapticThrottle = 100; // Minimum time between haptics (ms)
  }

  /**
   * Enable or disable haptic feedback
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`🔮 Swipe haptics ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Throttle haptics to prevent overwhelming the user
   */
  shouldTriggerHaptic() {
    const now = Date.now();
    if (now - this.lastHapticTime < this.hapticThrottle) {
      return false;
    }
    this.lastHapticTime = now;
    return true;
  }

  /**
   * Swipe gesture started - light feedback
   */
  onSwipeStart() {
    if (!this.isEnabled || !this.shouldTriggerHaptic()) return;
    
    try {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        // Android fallback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      console.log('👆 Swipe start haptic triggered');
    } catch (error) {
      console.log('⚠️ Haptic feedback not available:', error.message);
    }
  }

  /**
   * Swipe gesture in progress - subtle feedback at thresholds
   */
  onSwipeProgress(progress) {
    if (!this.isEnabled) return;
    
    // Trigger haptic at 25% and 75% progress
    if ((progress > 0.25 && progress < 0.3) || (progress > 0.75 && progress < 0.8)) {
      if (!this.shouldTriggerHaptic()) return;
      
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        console.log(`📊 Swipe progress haptic at ${Math.round(progress * 100)}%`);
      } catch (error) {
        console.log('⚠️ Progress haptic failed:', error.message);
      }
    }
  }

  /**
   * Swipe will complete navigation - success feedback
   */
  onSwipeWillComplete() {
    if (!this.isEnabled) return;
    
    try {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      console.log('✅ Swipe completion haptic triggered');
    } catch (error) {
      console.log('⚠️ Completion haptic failed:', error.message);
    }
  }

  /**
   * Swipe cancelled - gentle feedback
   */
  onSwipeCancel() {
    if (!this.isEnabled) return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      console.log('❌ Swipe cancel haptic triggered');
    } catch (error) {
      console.log('⚠️ Cancel haptic failed:', error.message);
    }
  }

  /**
   * Navigation completed successfully - success notification
   */
  onNavigationComplete() {
    if (!this.isEnabled) return;
    
    try {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      console.log('🎉 Navigation success haptic triggered');
    } catch (error) {
      console.log('⚠️ Success haptic failed:', error.message);
    }
  }

  /**
   * Special haptic for reaching screen edge (iOS feel)
   */
  onScreenEdgeReached() {
    if (!this.isEnabled || !this.shouldTriggerHaptic()) return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      console.log('📱 Screen edge haptic triggered');
    } catch (error) {
      console.log('⚠️ Edge haptic failed:', error.message);
    }
  }

  /**
   * Haptic for entering challenge detail (modal presentation)
   */
  onModalPresent() {
    if (!this.isEnabled) return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      console.log('📝 Modal present haptic triggered');
    } catch (error) {
      console.log('⚠️ Modal haptic failed:', error.message);
    }
  }

  /**
   * Haptic for dismissing challenge detail (swipe down)
   */
  onModalDismiss() {
    if (!this.isEnabled) return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      console.log('📤 Modal dismiss haptic triggered');
    } catch (error) {
      console.log('⚠️ Dismiss haptic failed:', error.message);
    }
  }
}

// Create singleton instance
const swipeHaptics = new SwipeHapticsManager();

// React Hook for easy usage in components
import { useFocusEffect } from '@react-navigation/native';
import { useEffect } from 'react';

export const useSwipeHaptics = () => {
  // Enable haptics when screen is focused
  useFocusEffect(() => {
    swipeHaptics.setEnabled(true);
    
    return () => {
      // Could disable when unfocused if needed
      // swipeHaptics.setEnabled(false);
    };
  });

  return {
    onSwipeStart: () => swipeHaptics.onSwipeStart(),
    onSwipeProgress: (progress) => swipeHaptics.onSwipeProgress(progress),
    onSwipeWillComplete: () => swipeHaptics.onSwipeWillComplete(),
    onSwipeCancel: () => swipeHaptics.onSwipeCancel(),
    onNavigationComplete: () => swipeHaptics.onNavigationComplete(),
    onScreenEdgeReached: () => swipeHaptics.onScreenEdgeReached(),
    onModalPresent: () => swipeHaptics.onModalPresent(),
    onModalDismiss: () => swipeHaptics.onModalDismiss(),
  };
};

// Enhanced navigation listener for haptic feedback
export const useNavigationHaptics = (navigation) => {
  useEffect(() => {
    const unsubscribe = navigation.addListener('gestureStart', () => {
      swipeHaptics.onSwipeStart();
    });

    const unsubscribeEnd = navigation.addListener('gestureEnd', () => {
      swipeHaptics.onNavigationComplete();
    });

    const unsubscribeCancel = navigation.addListener('gestureCancel', () => {
      swipeHaptics.onSwipeCancel();
    });

    return () => {
      unsubscribe();
      unsubscribeEnd();
      unsubscribeCancel();
    };
  }, [navigation]);
};

export default swipeHaptics;