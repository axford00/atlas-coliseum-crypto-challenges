// src/utils/celebrationUtils.js

/**
 * Celebration utilities for personal best achievements and milestone celebrations
 * Handles motivational messages, achievement tracking, and celebration triggers
 */

import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Motivational messages based on exercise type and improvement
const MOTIVATIONAL_MESSAGES = {
  squat: {
    massive: (improvement) => `LEGENDARY SQUAT GAINS! ${improvement} improvement - You're getting stronger! 🦵⚡`,
    significant: (improvement) => `Solid squat progress! ${improvement} gain - Your legs are thanking you! 🦵💪`,
    small: () => "Every pound counts! Keep building that squat! 🏗️"
  },
  
  deadlift: {
    massive: (improvement) => `BEAST MODE DEADLIFT! ${improvement} jump - You're unstoppable! 🔥💀`,
    significant: (improvement) => `Pulling like a champion! ${improvement} gain - Keep it up! ⚡🏆`,
    small: () => "Deadlift gains are the best gains! 💪⚡"
  },
  
  bench: {
    massive: (improvement) => `CRUSHING the bench! ${improvement} increase - Your chest is growing! 💥🏋️‍♂️`,
    significant: (improvement) => `Bench press progress! ${improvement} gain - Push it to the limit! 🚀`,
    small: () => "Steady bench gains! Keep pressing! 📈"
  },
  
  clean: {
    massive: (improvement) => `OLYMPIC LEVEL GAINS! ${improvement} jump - Technique + strength! 🥇⚡`,
    significant: (improvement) => `Technical perfection meets raw power! ${improvement} gain! 🎯💪`,
    small: () => "Olympic lift mastery in progress! 🏋️‍♂️✨"
  },
  
  snatch: {
    massive: (improvement) => `SNATCH SUPREMACY! ${improvement} increase - Pure Olympic excellence! 🥇🔥`,
    significant: (improvement) => `Technical breakthrough! ${improvement} gain - Perfecting the craft! ⚡🎯`,
    small: () => "Snatch technique + strength = success! 🏋️‍♂️✨"
  },
  
  press: {
    massive: (improvement) => `OVERHEAD DOMINATION! ${improvement} gain - Crushing it! 💪🚀`,
    significant: (improvement) => `Press power! ${improvement} increase - Keep pushing up! ⚡`,
    small: () => "Building that overhead strength! 📈💪"
  }
};

// Generic messages for unknown exercises or general improvements
const GENERIC_MESSAGES = {
  massive: (improvement) => `INCREDIBLE BREAKTHROUGH! ${improvement} jump - You're on fire! 🔥🚀`,
  significant: (improvement) => `MAJOR GAINS UNLOCKED! ${improvement} increase - Keep this momentum! ⚡💪`,
  moderate: (improvement) => `Solid progress! ${improvement} gain - Your hard work is paying off! 📈🎯`,
  small: (improvement) => `Every rep matters! ${improvement} improvement - You're getting stronger! 💪✨`,
  minimal: () => "Progress is progress! Keep pushing forward! 🚀💪"
};

// Celebration intensity levels based on improvement size
const CELEBRATION_LEVELS = {
  massive: { threshold: 50, confettiCount: 80, duration: 8000 },
  significant: { threshold: 25, confettiCount: 60, duration: 6000 },
  moderate: { threshold: 10, confettiCount: 40, duration: 5000 },
  small: { threshold: 5, confettiCount: 30, duration: 4000 },
  minimal: { threshold: 0, confettiCount: 20, duration: 3000 }
};

// Achievement milestones for different exercise types
const ACHIEVEMENT_MILESTONES = {
  squat: {
    beginner: { lb: 135, kg: 60 },
    intermediate: { lb: 225, kg: 100 },
    advanced: { lb: 315, kg: 140 },
    elite: { lb: 405, kg: 180 }
  },
  deadlift: {
    beginner: { lb: 185, kg: 85 },
    intermediate: { lb: 275, kg: 125 },
    advanced: { lb: 405, kg: 180 },
    elite: { lb: 500, kg: 225 }
  },
  bench: {
    beginner: { lb: 135, kg: 60 },
    intermediate: { lb: 185, kg: 85 },
    advanced: { lb: 275, kg: 125 },
    elite: { lb: 350, kg: 160 }
  },
  clean: {
    beginner: { lb: 115, kg: 50 },
    intermediate: { lb: 165, kg: 75 },
    advanced: { lb: 225, kg: 100 },
    elite: { lb: 300, kg: 135 }
  },
  snatch: {
    beginner: { lb: 95, kg: 40 },
    intermediate: { lb: 135, kg: 60 },
    advanced: { lb: 185, kg: 85 },
    elite: { lb: 250, kg: 115 }
  },
  press: {
    beginner: { lb: 95, kg: 40 },
    intermediate: { lb: 135, kg: 60 },
    advanced: { lb: 185, kg: 85 },
    elite: { lb: 225, kg: 100 }
  }
};

/**
 * Determine celebration intensity based on improvement amount
 * @param {number} improvement - Amount of improvement
 * @param {string} unit - Weight unit (lb, kg)
 * @returns {string} - Celebration level: massive, significant, moderate, small, minimal
 */
export const getCelebrationLevel = (improvement, unit = 'lb') => {
  if (!improvement || improvement <= 0) return 'minimal';
  
  // Adjust thresholds for kg (roughly half of lb values)
  const multiplier = unit === 'kg' ? 0.5 : 1;
  
  for (const [level, config] of Object.entries(CELEBRATION_LEVELS)) {
    if (improvement >= config.threshold * multiplier) {
      return level;
    }
  }
  
  return 'minimal';
};

/**
 * Get motivational message based on exercise and improvement
 * @param {Object} celebrationData - PR data object
 * @returns {string} - Motivational message
 */
export const getMotivationalMessage = (celebrationData) => {
  if (!celebrationData) return "Amazing work! 💪";
  
  const { exercise, improvement, unit } = celebrationData;
  const exerciseType = getExerciseType(exercise);
  const level = getCelebrationLevel(improvement, unit);
  const improvementText = `${improvement}${unit}`;
  
  // Get exercise-specific messages
  if (MOTIVATIONAL_MESSAGES[exerciseType]) {
    const messages = MOTIVATIONAL_MESSAGES[exerciseType];
    
    if (level === 'massive' && messages.massive) {
      return messages.massive(improvementText);
    } else if ((level === 'significant' || level === 'moderate') && messages.significant) {
      return messages.significant(improvementText);
    } else if (messages.small) {
      return messages.small();
    }
  }
  
  // Fallback to generic messages
  if (GENERIC_MESSAGES[level]) {
    return typeof GENERIC_MESSAGES[level] === 'function' 
      ? GENERIC_MESSAGES[level](improvementText)
      : GENERIC_MESSAGES[level];
  }
  
  return GENERIC_MESSAGES.minimal();
};

/**
 * Determine exercise type from exercise name
 * @param {string} exerciseName - Name of exercise
 * @returns {string} - Exercise type key
 */
const getExerciseType = (exerciseName) => {
  if (!exerciseName) return 'unknown';
  
  const lowerName = exerciseName.toLowerCase();
  
  if (lowerName.includes('squat')) return 'squat';
  if (lowerName.includes('deadlift')) return 'deadlift';
  if (lowerName.includes('bench')) return 'bench';
  if (lowerName.includes('clean')) return 'clean';
  if (lowerName.includes('snatch')) return 'snatch';
  if (lowerName.includes('press')) return 'press';
  
  return 'unknown';
};

/**
 * Check if weight hits a significant milestone
 * @param {string} exerciseType - Type of exercise
 * @param {number} weight - Current weight
 * @param {string} unit - Weight unit
 * @returns {Object|null} - Milestone info or null
 */
export const checkMilestone = (exerciseType, weight, unit) => {
  if (!exerciseType || !weight || !ACHIEVEMENT_MILESTONES[exerciseType]) {
    return null;
  }
  
  const milestones = ACHIEVEMENT_MILESTONES[exerciseType];
  
  for (const [level, weights] of Object.entries(milestones)) {
    if (weight >= weights[unit]) {
      return {
        level,
        weight: weights[unit],
        unit,
        exerciseType,
        message: getMilestoneMessage(exerciseType, level, weight, unit)
      };
    }
  }
  
  return null;
};

/**
 * Get milestone achievement message
 * @param {string} exerciseType - Type of exercise
 * @param {string} level - Achievement level
 * @param {number} weight - Achieved weight
 * @param {string} unit - Weight unit
 * @returns {string} - Milestone message
 */
const getMilestoneMessage = (exerciseType, level, weight, unit) => {
  const exerciseName = exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1);
  const levelName = level.charAt(0).toUpperCase() + level.slice(1);
  
  const messages = {
    beginner: `Welcome to the ${exerciseName} club! 🎉`,
    intermediate: `${levelName} ${exerciseName} achieved! You're getting serious! 💪`,
    advanced: `${levelName} ${exerciseName}! You're in rare company! 🏆`,
    elite: `ELITE ${exerciseName.toUpperCase()}! Absolutely incredible! 👑🔥`
  };
  
  return messages[level] || `Great ${exerciseName} milestone!`;
};

/**
 * Calculate celebration configuration
 * @param {Object} celebrationData - PR data
 * @returns {Object} - Celebration configuration
 */
export const getCelebrationConfig = (celebrationData) => {
  if (!celebrationData) {
    return CELEBRATION_LEVELS.minimal;
  }
  
  const level = getCelebrationLevel(celebrationData.improvement, celebrationData.unit);
  const config = { ...CELEBRATION_LEVELS[level] };
  
  // Check for milestone bonus
  const milestone = checkMilestone(
    getExerciseType(celebrationData.exercise),
    celebrationData.weight,
    celebrationData.unit
  );
  
  if (milestone) {
    config.confettiCount += 20;
    config.duration += 2000;
    config.hasMilestone = true;
    config.milestone = milestone;
  }
  
  return config;
};

/**
 * Generate confetti colors based on celebration level
 * @param {string} level - Celebration level
 * @returns {Array} - Array of color strings
 */
export const getCelebrationColors = (level) => {
  const colorSets = {
    massive: [
      '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FFEAA7', '#DDA0DD', '#F39C12', '#E74C3C', '#9B59B6',
      '#FFE066', '#FF7675', '#00B894', '#0984E3', '#FDCB6E'
    ],
    significant: [
      '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEAA7', '#DDA0DD', '#F39C12', '#E74C3C', '#9B59B6'
    ],
    moderate: [
      '#FFD700', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#F39C12'
    ],
    small: [
      '#FFD700', '#4ECDC4', '#96CEB4', '#FFEAA7'
    ],
    minimal: [
      '#FFD700', '#4ECDC4', '#96CEB4'
    ]
  };
  
  return colorSets[level] || colorSets.minimal;
};

/**
 * Generate celebration sound configuration
 * @param {string} level - Celebration level
 * @returns {Object} - Sound configuration
 */
export const getCelebrationSound = (level) => {
  const soundConfigs = {
    massive: { type: 'fanfare', volume: 0.8, duration: 3000 },
    significant: { type: 'cheer', volume: 0.7, duration: 2000 },
    moderate: { type: 'applause', volume: 0.6, duration: 1500 },
    small: { type: 'ding', volume: 0.5, duration: 1000 },
    minimal: { type: 'pop', volume: 0.4, duration: 500 }
  };
  
  return soundConfigs[level] || soundConfigs.minimal;
};

/**
 * Create personalized celebration based on user history
 * @param {Object} celebrationData - Current PR data
 * @param {Array} userHistory - User's workout history
 * @returns {Object} - Enhanced celebration data
 */
export const createPersonalizedCelebration = (celebrationData, userHistory = []) => {
  if (!celebrationData) return null;
  
  const enhanced = { ...celebrationData };
  const config = getCelebrationConfig(celebrationData);
  
  // Add streak information
  const streak = calculatePRStreak(userHistory);
  if (streak > 1) {
    enhanced.streak = streak;
    enhanced.streakMessage = `${streak} PRs in your recent workouts! 🔥`;
  }
  
  // Add frequency information
  const exerciseFrequency = calculateExerciseFrequency(
    getExerciseType(celebrationData.exercise),
    userHistory
  );
  
  if (exerciseFrequency.isRegular) {
    enhanced.consistency = `You've been consistently working on ${celebrationData.exercise}!`;
  }
  
  // Add celebration level and config
  enhanced.level = getCelebrationLevel(celebrationData.improvement, celebrationData.unit);
  enhanced.config = config;
  enhanced.colors = getCelebrationColors(enhanced.level);
  enhanced.message = getMotivationalMessage(enhanced);
  
  return enhanced;
};

/**
 * Calculate PR streak from workout history
 * @param {Array} workoutHistory - User's workout history
 * @returns {number} - Number of recent workouts with PRs
 */
const calculatePRStreak = (workoutHistory = []) => {
  let streak = 0;
  
  // Look at last 10 workouts
  const recentWorkouts = workoutHistory
    .slice(0, 10)
    .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  
  for (const workout of recentWorkouts) {
    if (workout.personalBest) {
      streak++;
    } else {
      break; // Streak broken
    }
  }
  
  return streak;
};

/**
 * Calculate how frequently user does specific exercise
 * @param {string} exerciseType - Type of exercise
 * @param {Array} workoutHistory - User's workout history
 * @returns {Object} - Frequency information
 */
const calculateExerciseFrequency = (exerciseType, workoutHistory = []) => {
  const last30Days = workoutHistory.filter(workout => {
    const workoutDate = new Date(workout.date || workout.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return workoutDate >= thirtyDaysAgo;
  });
  
  const exerciseWorkouts = last30Days.filter(workout => 
    workout.extractedExercises?.some(ex => 
      getExerciseType(ex.name) === exerciseType
    )
  );
  
  return {
    count: exerciseWorkouts.length,
    isRegular: exerciseWorkouts.length >= 3, // 3+ times in 30 days
    frequency: exerciseWorkouts.length / 30 * 7 // times per week
  };
};

/**
 * Format celebration data for sharing
 * @param {Object} celebrationData - PR data
 * @returns {string} - Formatted share text
 */
export const formatCelebrationForSharing = (celebrationData) => {
  if (!celebrationData) return '';
  
  const { exercise, weight, unit, improvement } = celebrationData;
  
  return `🏆 NEW PERSONAL BEST! 🏆\n\n` +
         `${exercise}: ${weight}${unit}\n` +
         `Improvement: +${improvement}${unit}\n\n` +
         `#PersonalBest #Fitness #AtlasFitness #Stronger`;
};

/**
 * Check if celebration should be triggered
 * @param {number} currentWeight - Current lift weight
 * @param {number} previousBest - Previous best weight
 * @param {string} unit - Weight unit
 * @returns {boolean} - True if should celebrate
 */
export const shouldTriggerCelebration = (currentWeight, previousBest, unit) => {
  if (!currentWeight || !previousBest) return false;
  
  const improvement = currentWeight - previousBest;
  const minImprovement = unit === 'kg' ? 1 : 2.5; // Minimum meaningful improvement
  
  return improvement >= minImprovement;
};

export default {
  getCelebrationLevel,
  getMotivationalMessage,
  checkMilestone,
  getCelebrationConfig,
  getCelebrationColors,
  getCelebrationSound,
  createPersonalizedCelebration,
  formatCelebrationForSharing,
  shouldTriggerCelebration
};