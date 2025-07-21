// src/utils/workoutClassification.js

/**
 * Workout classification utility for categorizing workouts by type
 * Supports strength, cardio, flexibility, and general workout types
 * FIXED: Added rowing patterns for proper cardio classification
 */

// Keywords and patterns for different workout types
const WORKOUT_CLASSIFICATIONS = {
  strength: {
    priority: 1, // Highest priority - check first
    keywords: [
      // Olympic lifts and powerlifting movements
      'snatch', 'clean', 'jerk', 'deadlift', 'squat', 'bench',
      // Weight indicators
      'lb', 'kg', 'lbs', 'rep', 'set', 'weight', 'press', 'curl', 
      'pull', 'push', 'lift', '@', ' at ', 'reps', 'sets',
      // Specific strength exercises
      'deadlifts', 'squats', 'benchpress', 'overhead press', 'rows',
      'pullups', 'chinups', 'dips', 'lateral raise', 'bicep curl',
      'tricep', 'shoulder press', 'military press', 'incline',
      'decline', 'front squat', 'back squat', 'power clean',
      'hang clean', 'split jerk', 'push jerk', 'thrusters'
    ],
    patterns: [
      // Weight patterns
      /\d+\s*(lb|kg|lbs|#)/i,
      // Rep/set patterns
      /\d+\s*(x|×)\s*\d+/i,
      // Weight @ symbol patterns
      /(@|at)\s*\d+/i,
      // Classic strength exercise patterns
      /(squat|deadlift|bench|press|clean|snatch|jerk)\s*:?\s*\d/i
    ]
  },
  
  cardio: {
    priority: 2,
    keywords: [
      // FIXED: Enhanced rowing keywords
      'row', 'rowing', 'erg', 'concept2', 'rower',
      // Other cardio
      'run', 'bike', 'swim', 'walk', 'jog', 'sprint',
      'cycling', 'elliptical', 'treadmill', 'stairclimber',
      'burpees', 'mountain climbers', 'jumping jacks', 'jump rope',
      'hiit', 'tabata', 'intervals'
    ],
    distanceKeywords: ['km', 'k', 'm', 'mile', 'miles', 'meter', 'meters', 'min', 'minutes'],
    patterns: [
      // FIXED: Rowing-specific patterns
      /\d+k\s*row/i,              // "2k row", "5k row"
      /row\s*\d+k/i,              // "row 2k", "row 5000m"  
      /\d+m\s*row/i,              // "2000m row", "5000m row"
      /row\s*\d+m/i,              // "row 2000m", "row 5000m"
      /\brow\b.*\d+:\d+/i,        // "row @ 8:16", "row in 7:30"
      /\brow\b.*time/i,           // "row for time"
      /rowing/i,                  // "rowing", "indoor rowing"
      /erg/i,                     // "erg", "concept2"
      
      // Distance + time patterns
      /\d+\s*(km|k|m|mile|miles|meter|meters)/i,
      // Time-based cardio
      /\d+\s*(min|minutes|sec|seconds|hours?)/i,
      // Time format patterns (FIXED: Added for rowing times)
      /\d+:\d+/,                  // Time format like "8:16", "25:30"
      /for time/i,                // "for time" indicates cardio
      // Cardio with distance/time context
      /(run|bike|row|swim|walk)\s+.*\d+\s*(km|k|m|mile|min)/i,
      // HIIT/interval patterns
      /(hiit|tabata|interval|circuit)/i
    ],
    requiresContext: false // FIXED: Changed from true to false for rowing
  },
  
  flexibility: {
    priority: 3,
    keywords: [
      'yoga', 'stretch', 'stretching', 'pilates', 'mobility',
      'foam roll', 'foam rolling', 'massage', 'meditation',
      'breathwork', 'flexibility', 'cooldown', 'warmup',
      'dynamic stretch', 'static stretch', 'myofascial release'
    ],
    patterns: [
      /(yoga|pilates|stretch|mobility)/i,
      /foam\s+roll/i,
      /(flexibility|cooldown|warmup)/i
    ]
  },
  
  general: {
    priority: 4, // Lowest priority - default fallback
    keywords: [
      'workout', 'exercise', 'training', 'fitness', 'movement',
      'bodyweight', 'calisthenics', 'crossfit', 'functional'
    ]
  }
};

// Sport-specific classifications
const SPORT_CLASSIFICATIONS = {
  crossfit: {
    keywords: ['wod', 'amrap', 'emom', 'for time', 'crossfit', 'metcon'],
    patterns: [
      /\d+\s*rounds/i,
      /(amrap|emom|for\s+time)/i,
      /\d+\s*min\s*(amrap|emom)/i
    ],
    type: 'general' // CrossFit can be strength, cardio, or mixed
  },
  
  powerlifting: {
    keywords: ['powerlifting', 'meet', 'competition', 'max', '1rm', 'pr'],
    patterns: [
      /(squat|bench|deadlift).*\d+\s*(lb|kg)/i,
      /\d+\s*rm/i,
      /(max|pr)\s*(squat|bench|deadlift)/i
    ],
    type: 'strength'
  },
  
  olympicLifting: {
    keywords: ['olympic', 'weightlifting', 'oly'],
    patterns: [
      /(snatch|clean|jerk)/i,
      /\d+\s*%.*\d+\s*(lb|kg)/i // Percentage-based training
    ],
    type: 'strength'
  }
};

/**
 * Main workout classification function
 * @param {string} workoutText - Raw workout text from user
 * @returns {string} - Workout type: 'strength', 'cardio', 'flexibility', or 'general'
 */
export const getWorkoutType = (workoutText) => {
  if (!workoutText || typeof workoutText !== 'string') {
    return 'general';
  }

  const lowerText = workoutText.toLowerCase().trim();
  console.log('🔍 Analyzing workout text for classification:', workoutText);
  
  // FIXED: Check for rowing patterns first (high priority)
  const rowingPatterns = [
    /\d+k\s*row/i,              // "2k row", "5k row"
    /row\s*\d+k/i,              // "row 2k"
    /\d+m\s*row/i,              // "2000m row"
    /row\s*\d+m/i,              // "row 2000m"
    /\brow\b.*\d+:\d+/i,        // "row @ 8:16"
    /\brow\b.*time/i,           // "row for time"
    /rowing/i,                  // "rowing"
    /erg/i                      // "erg"
  ];
  
  if (rowingPatterns.some(pattern => pattern.test(lowerText))) {
    console.log('✅ Detected rowing - classified as CARDIO');
    return 'cardio';
  }
  
  // Check sport-specific patterns first
  const sportType = classifySportSpecific(lowerText);
  if (sportType) {
    console.log(`🏅 Sport-specific classification: ${sportType}`);
    return sportType;
  }

  // Check main classifications by priority
  const sortedTypes = Object.entries(WORKOUT_CLASSIFICATIONS)
    .sort(([,a], [,b]) => (a.priority || 999) - (b.priority || 999));

  for (const [type, config] of sortedTypes) {
    if (matchesWorkoutType(lowerText, config)) {
      console.log(`✅ Classified as: ${type}`);
      return type;
    }
  }

  console.log('🤷 No specific classification found, defaulting to: general');
  return 'general';
};

/**
 * Check for sport-specific workout patterns
 * @param {string} lowerText - Lowercase workout text
 * @returns {string|null} - Sport-specific type or null
 */
const classifySportSpecific = (lowerText) => {
  for (const [sport, config] of Object.entries(SPORT_CLASSIFICATIONS)) {
    // Check keywords
    const hasKeywords = config.keywords.some(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
    
    // Check patterns
    const hasPatterns = config.patterns && config.patterns.some(pattern => 
      pattern.test(lowerText)
    );
    
    if (hasKeywords || hasPatterns) {
      console.log(`🏅 Detected ${sport} workout`);
      return config.type;
    }
  }
  
  return null;
};

/**
 * Check if workout text matches a specific type configuration
 * @param {string} lowerText - Lowercase workout text
 * @param {Object} config - Type configuration object
 * @returns {boolean} - True if matches this type
 */
const matchesWorkoutType = (lowerText, config) => {
  // Check keyword matches
  const keywordMatches = config.keywords.filter(keyword => 
    lowerText.includes(keyword.toLowerCase())
  );
  
  // Check pattern matches
  const patternMatches = config.patterns ? 
    config.patterns.filter(pattern => pattern.test(lowerText)) : [];
  
  // Special handling for cardio (requires context)
  if (config.requiresContext) {
    return checkCardioWithContext(lowerText, keywordMatches, patternMatches);
  }
  
  // For other types, any keyword or pattern match is sufficient
  return keywordMatches.length > 0 || patternMatches.length > 0;
};

/**
 * Special cardio classification requiring distance/time context
 * @param {string} lowerText - Lowercase workout text
 * @param {Array} keywordMatches - Matched cardio keywords
 * @param {Array} patternMatches - Matched cardio patterns
 * @returns {boolean} - True if cardio with proper context
 */
const checkCardioWithContext = (lowerText, keywordMatches, patternMatches) => {
  if (keywordMatches.length === 0 && patternMatches.length === 0) {
    return false;
  }
  
  // Check for distance/time context
  const hasDistanceTime = WORKOUT_CLASSIFICATIONS.cardio.distanceKeywords.some(keyword =>
    lowerText.includes(keyword)
  );
  
  // Check for specific cardio + context patterns
  const cardioWithContext = [
    /(row|bike|run|walk|swim).*\d+\s*(km|k|m|mile|min)/i,
    /\d+\s*(km|k|m|mile|min).*(row|bike|run|walk|swim)/i,
    /(hiit|tabata|circuit|interval)/i,
    /\d+\s*rounds/i
  ].some(pattern => pattern.test(lowerText));

  if (hasDistanceTime || cardioWithContext) {
    console.log('🏃 Found cardio activity with distance/time context');
    return true;
  }
  
  console.log('❌ Cardio keywords found but no distance/time context');
  return false;
};

// Export all existing functions unchanged
export const analyzeWorkout = (workoutText) => {
  if (!workoutText) {
    return {
      type: 'general',
      confidence: 0,
      matches: [],
      suggestions: []
    };
  }

  const lowerText = workoutText.toLowerCase();
  const analysis = {
    type: 'general',
    confidence: 0,
    matches: [],
    suggestions: []
  };

  // Analyze against all types
  for (const [type, config] of Object.entries(WORKOUT_CLASSIFICATIONS)) {
    const keywordMatches = config.keywords.filter(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
    
    const patternMatches = config.patterns ? 
      config.patterns.filter(pattern => pattern.test(lowerText)) : [];
    
    if (keywordMatches.length > 0 || patternMatches.length > 0) {
      const score = calculateConfidenceScore(keywordMatches, patternMatches, config);
      
      analysis.matches.push({
        type,
        score,
        keywordMatches,
        patternMatches: patternMatches.length
      });
    }
  }

  // Sort matches by confidence score
  analysis.matches.sort((a, b) => b.score - a.score);
  
  if (analysis.matches.length > 0) {
    const topMatch = analysis.matches[0];
    analysis.type = topMatch.type;
    analysis.confidence = topMatch.score;
  }

  // Add suggestions for improvement
  analysis.suggestions = generateSuggestions(workoutText, analysis);

  return analysis;
};

const calculateConfidenceScore = (keywordMatches, patternMatches, config) => {
  let score = 0;
  
  // Base score from keyword matches
  score += keywordMatches.length * 10;
  
  // Bonus for pattern matches (more specific)
  score += patternMatches.length * 15;
  
  // Priority bonus (strength gets higher scores)
  if (config.priority === 1) score += 5;
  if (config.priority === 2) score += 3;
  
  // Cap at 100
  return Math.min(score, 100);
};

const generateSuggestions = (workoutText, analysis) => {
  const suggestions = [];
  const lowerText = workoutText.toLowerCase();

  // Strength workout suggestions
  if (analysis.type === 'strength') {
    if (!lowerText.includes('lb') && !lowerText.includes('kg')) {
      suggestions.push('Add weights (e.g., "135lb" or "60kg") for better tracking');
    }
    if (!lowerText.includes('x') && !lowerText.includes('rep')) {
      suggestions.push('Include sets and reps (e.g., "3x5") for complete logging');
    }
  }

  // Cardio workout suggestions
  if (analysis.type === 'cardio') {
    if (!lowerText.includes('min') && !lowerText.includes('km') && !lowerText.includes('mile')) {
      suggestions.push('Add duration or distance for better cardio tracking');
    }
  }

  // General suggestions
  if (analysis.confidence < 50) {
    suggestions.push('Consider adding more details about your workout for better classification');
  }

  return suggestions;
};

export const hasStrengthElements = (workoutText) => {
  if (!workoutText) return false;
  
  const strengthIndicators = [
    /\d+\s*(lb|kg|lbs|#)/i,
    /\d+\s*x\s*\d+/i,
    /(squat|deadlift|bench|press|clean|snatch)/i,
    /(@|at)\s*\d+/i
  ];

  return strengthIndicators.some(pattern => pattern.test(workoutText));
};

export const hasCardioElements = (workoutText) => {
  if (!workoutText) return false;
  
  const cardioIndicators = [
    /(run|bike|row|swim|walk).*\d+\s*(km|k|mile|min)/i,
    /\d+\s*(km|k|mile|min).*(run|bike|row|swim|walk)/i,
    /(hiit|tabata|circuit|burpees)/i
  ];

  return cardioIndicators.some(pattern => pattern.test(workoutText));
};

export const determineWorkoutIntensity = (workoutText, hasPersonalBest = false) => {
  if (!workoutText) return 'moderate';
  
  const lowerText = workoutText.toLowerCase();
  
  // Automatic high intensity for PRs
  if (hasPersonalBest) return 'high';
  
  // High intensity indicators
  const highIntensityKeywords = [
    'max', 'pr', 'personal best', 'heavy', 'intense', 'brutal',
    'crushing', 'beast mode', 'all out', 'failure'
  ];
  
  const maxIntensityKeywords = [
    '1rm', 'one rep max', 'max out', 'competition', 'meet'
  ];

  // Check for max intensity
  if (maxIntensityKeywords.some(keyword => lowerText.includes(keyword))) {
    return 'max';
  }

  // Check for high intensity
  if (highIntensityKeywords.some(keyword => lowerText.includes(keyword))) {
    return 'high';
  }

  // Check for low intensity indicators
  const lowIntensityKeywords = [
    'easy', 'light', 'recovery', 'warmup', 'cool down',
    'gentle', 'relaxed', 'moderate'
  ];

  if (lowIntensityKeywords.some(keyword => lowerText.includes(keyword))) {
    return 'low';
  }

  // Default to moderate
  return 'moderate';
};

export const extractMuscleGroups = (workoutText) => {
  if (!workoutText) return ['fullBody'];
  
  const lowerText = workoutText.toLowerCase();
  const muscleGroups = [];

  const muscleGroupMap = {
    legs: ['squat', 'deadlift', 'lunge', 'leg press', 'calf', 'quad', 'hamstring'],
    chest: ['bench', 'push up', 'pushup', 'chest press', 'flies', 'dips'],
    back: ['row', 'pull up', 'pullup', 'lat pulldown', 'deadlift'],
    shoulders: ['shoulder press', 'overhead press', 'lateral raise', 'military press'],
    arms: ['curl', 'tricep', 'bicep', 'arm'],
    core: ['plank', 'crunch', 'abs', 'core', 'sit up'],
    cardiovascular: ['run', 'bike', 'row', 'swim', 'cardio', 'hiit']
  };

  for (const [group, keywords] of Object.entries(muscleGroupMap)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      muscleGroups.push(group);
    }
  }

  // If multiple specific groups found, don't add fullBody
  if (muscleGroups.length === 0) {
    muscleGroups.push('fullBody');
  } else if (muscleGroups.length >= 3) {
    // If 3+ muscle groups, consider it full body
    return ['fullBody'];
  }

  return muscleGroups;
};

export const estimateWorkoutDuration = (workoutText, workoutType) => {
  if (!workoutText) return 30;
  
  const lowerText = workoutText.toLowerCase();
  
  // Look for explicit duration mentions
  const durationMatch = lowerText.match(/(\d+)\s*(min|minutes|hour|hours)/);
  if (durationMatch) {
    const value = parseInt(durationMatch[1]);
    const unit = durationMatch[2];
    return unit.includes('hour') ? value * 60 : value;
  }

  // Estimate based on workout type and content
  switch (workoutType) {
    case 'strength':
      // Count number of exercises for estimation
      const exerciseCount = (lowerText.match(/\d+\s*x\s*\d+/g) || []).length;
      return Math.max(20, Math.min(90, 20 + exerciseCount * 8));
      
    case 'cardio':
      // Default cardio duration
      return 35;
      
    case 'flexibility':
      return 25;
      
    default:
      return 30;
  }
};

export const isAIWorkout = (workout) => {
  return !!(workout && (workout.isFromAI || workout.aiRecommendation));
};

export const getWorkoutTypeEmoji = (workoutType, workout = null) => {
  if (workout) {
    if (isAIWorkout(workout)) return '🤖';
    if (workout.personalBest) return '🏆';
  }
  
  switch (workoutType) {
    case 'strength': return '🏋️‍♂️';
    case 'cardio': return '🏃‍♂️';
    case 'flexibility': return '🧘‍♀️';
    default: return '💪';
  }
};

export const isValidWorkoutType = (workoutType) => {
  return ['strength', 'cardio', 'flexibility', 'general'].includes(workoutType);
};

export default {
  getWorkoutType,
  analyzeWorkout,
  hasStrengthElements,
  hasCardioElements,
  determineWorkoutIntensity,
  extractMuscleGroups,
  estimateWorkoutDuration,
  isAIWorkout,
  getWorkoutTypeEmoji,
  isValidWorkoutType
};