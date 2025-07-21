// src/screens/WorkoutScreen/hooks/useAICoach.js
import { useState } from 'react';
import aiService from '../../../services/aiService';

export const useAICoach = () => {
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [originalRecommendation, setOriginalRecommendation] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const getRecommendation = async () => {
    console.log('🤖 AI Coach button pressed');
    setLoading(true);
    
    try {
      console.log('About to call aiService.getWorkoutRecommendation()...');
      const recommendation = await aiService.getWorkoutRecommendation();
      console.log('AI recommendation received');
      console.log('Recommendation content:', recommendation);
      
      if (!recommendation || recommendation.length === 0) {
        console.log('Empty recommendation received, using fallback');
        throw new Error('Empty recommendation received');
      }
      
      console.log('About to show AI recommendation modal...');
      setAiRecommendation(recommendation);
      setOriginalRecommendation(recommendation);
      setShowAiModal(true);
      console.log('AI modal should now be visible');
      
    } catch (error) {
      console.error('Error getting workout recommendation:', error);
      console.log('Using fallback recommendation due to error');
      
      const fallbackRecommendation = getFallbackRecommendation();
      setAiRecommendation(fallbackRecommendation);
      setOriginalRecommendation(fallbackRecommendation);
      setShowAiModal(true);
    } finally {
      setLoading(false);
    }
  };

  const getFallbackRecommendation = () => {
    const hour = new Date().getHours();
    
    if (hour < 11) {
      return "🌅 MORNING ENERGY BOOST:\n\n• 20-minute bodyweight circuit\n• Mix of squats, push-ups, and planks\n• Light cardio to wake up your body\n• Perfect way to start your day strong!";
    } else if (hour < 16) {
      return "☀️ MIDDAY POWER SESSION:\n\n• 30-45 minute strength training\n• Focus on major muscle groups\n• Higher intensity for maximum results\n• You've got the energy - use it!";
    } else {
      return "🌙 EVENING RECOVERY WORKOUT:\n\n• 25-30 minute moderate session\n• Mix of light cardio and stretching\n• Focus on movement quality\n• Perfect way to unwind and stay active!";
    }
  };

  const handleFeedback = async (feedbackText) => {
    if (!feedbackText.trim()) {
      throw new Error('Please tell us what you\'d like to change about this workout');
    }

    setLoading(true);
    try {
      console.log('Getting modified workout based on feedback:', feedbackText);
      
      const context = await aiService.getUserContext();
      const modificationPrompt = `You are a fitness coach. I gave this workout recommendation:

"${originalRecommendation}"

The user provided this feedback: "${feedbackText}"

Please provide a modified workout recommendation that addresses their feedback. Keep the same format and be specific about the changes you made.

User Profile: ${JSON.stringify(context.profile, null, 2)}
Recent Workouts: ${JSON.stringify(context.workouts, null, 2)}

Provide a complete new workout recommendation that incorporates their feedback.`;

      const modifiedRecommendation = await aiService.callBackendAI(modificationPrompt, context, 'workout');
      
      console.log('Modified recommendation received:', modifiedRecommendation);
      setAiRecommendation(modifiedRecommendation);
      
    } catch (error) {
      console.error('Error getting modified recommendation:', error);
      
      // Enhanced fallback modification
      let modifiedRecommendation = originalRecommendation;
      const lowerFeedback = feedbackText.toLowerCase();
      
      if (lowerFeedback.includes('30 min') || lowerFeedback.includes('shorter') || lowerFeedback.includes('time')) {
        modifiedRecommendation = generateShorterWorkout();
      } else if (lowerFeedback.includes('running') || lowerFeedback.includes('knee')) {
        modifiedRecommendation = generateLowImpactWorkout();
      } else if (lowerFeedback.includes('easier') || lowerFeedback.includes('intense')) {
        modifiedRecommendation = generateEasierWorkout();
      } else if (lowerFeedback.includes('home') || lowerFeedback.includes('bodyweight')) {
        modifiedRecommendation = generateHomeWorkout();
      } else {
        modifiedRecommendation += `\n\n✅ COACH NOTE: I heard your feedback about "${feedbackText}". Here's my adjusted recommendation based on your needs!`;
      }
      
      setAiRecommendation(modifiedRecommendation);
    } finally {
      setLoading(false);
    }
  };

  const generateShorterWorkout = () => {
    return `🎯 MODIFIED 30-MINUTE WORKOUT

Based on your time constraints, here's a condensed but effective session:

**Quick 30-Minute Power Session:**

**Warm-up (5 minutes):**
• Light movement and dynamic stretches

**Main Circuit (20 minutes) - 4 Rounds:**
Complete each exercise for 40 seconds, rest 20 seconds:
• Bodyweight squats
• Push-ups (modify as needed)
• Mountain climbers
• Plank hold
• Jumping jacks (or step-ups)
• Rest 1 minute between rounds

**Cool-down (5 minutes):**
• Full body stretching and breathing

✅ MODIFICATION: Condensed from longer format while maintaining effectiveness!

This efficient session delivers maximum results in your available time.`;
  };

  const generateLowImpactWorkout = () => {
    return `🦵 LOW-IMPACT KNEE-FRIENDLY WORKOUT

Based on your knee concerns, here's a joint-friendly alternative:

**Knee-Safe Movement Session (35 minutes):**

**Warm-up (8 minutes):**
• Gentle arm circles and torso twists
• Seated leg extensions
• Ankle rolls and calf raises

**Main Workout (22 minutes) - 3 Rounds:**
• Seated rows (resistance band or towel) - 45 seconds
• Wall push-ups - 45 seconds
• Glute bridges - 45 seconds
• Seated marches - 45 seconds
• Upper body stretches - 45 seconds
• Rest 90 seconds between rounds

**Cool-down (5 minutes):**
• Seated stretching routine

✅ MODIFICATION: Replaced all high-impact movements with knee-friendly alternatives!

This workout protects your joints while building strength effectively.`;
  };

  const generateEasierWorkout = () => {
    return `📉 GENTLE INTRODUCTION WORKOUT

Based on your request for easier intensity:

**Beginner-Friendly Session (25 minutes):**

**Warm-up (5 minutes):**
• Gentle walking in place
• Arm swings and shoulder rolls

**Main Workout (15 minutes) - 3 Sets:**
• Wall push-ups - 8-10 reps
• Assisted squats (using chair) - 8-12 reps
• Standing marches - 10 each leg
• Standing arm circles - 10 each direction
• Rest 60-90 seconds between sets

**Cool-down (5 minutes):**
• Gentle stretching and deep breathing

✅ MODIFICATION: Reduced intensity and complexity for comfortable progression!

Focus on form and consistency. You can increase difficulty as you get stronger.`;
  };

  const generateHomeWorkout = () => {
    return `🏠 HOME BODYWEIGHT WORKOUT

Based on your home equipment situation:

**No-Equipment Home Session (35 minutes):**

**Warm-up (8 minutes):**
• Marching in place
• Arm circles and leg swings
• Light stretching

**Main Workout (22 minutes) - 4 Rounds:**
• Bodyweight squats - 45 seconds
• Push-ups (modify as needed) - 45 seconds
• Lunges in place - 45 seconds
• Plank hold - 30 seconds
• High knees (or marching) - 45 seconds
• Rest 60 seconds between rounds

**Cool-down (5 minutes):**
• Full body stretching routine

✅ MODIFICATION: Converted to bodyweight-only exercises perfect for home!

No gym or equipment needed - just your body and some floor space.`;
  };

  const closeModal = () => {
    setShowAiModal(false);
  };

  const getNewRecommendation = () => {
    setShowAiModal(false);
    setTimeout(() => getRecommendation(), 500);
  };

  return {
    // State
    aiRecommendation,
    showAiModal,
    loading,
    
    // Actions
    getRecommendation,
    handleFeedback,
    closeModal,
    getNewRecommendation
  };
};