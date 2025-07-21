// src/utils/gymExtraction.js

/**
 * Gym extraction utility for parsing gym names from user profiles
 * Supports various gym types including CrossFit, commercial gyms, and boutique fitness
 */

// Known gym chain patterns with normalized names
const KNOWN_GYM_CHAINS = [
  // CrossFit Gyms
  { patterns: ['crossfit south brooklyn', 'cf south brooklyn', 'cfsbk'], clean: 'CrossFit South Brooklyn' },
  { patterns: ['crossfit williamsburg', 'cf williamsburg'], clean: 'CrossFit Williamsburg' },
  { patterns: ['crossfit nyc', 'cf nyc'], clean: 'CrossFit NYC' },
  { patterns: ['crossfit queens', 'cf queens'], clean: 'CrossFit Queens' },
  { patterns: ['crossfit prospect heights'], clean: 'CrossFit Prospect Heights' },
  { patterns: ['crossfit battery park'], clean: 'CrossFit Battery Park' },
  { patterns: ['crossfit brooklyn heights'], clean: 'CrossFit Brooklyn Heights' },
  { patterns: ['crossfit tribeca'], clean: 'CrossFit Tribeca' },
  { patterns: ['crossfit midtown', 'crossfit manhattan'], clean: 'CrossFit Midtown' },
  
  // Commercial Gym Chains
  { patterns: ['planet fitness'], clean: 'Planet Fitness' },
  { patterns: ['la fitness'], clean: 'LA Fitness' },
  { patterns: ['gold\'s gym', 'golds gym'], clean: 'Gold\'s Gym' },
  { patterns: ['equinox'], clean: 'Equinox' },
  { patterns: ['24 hour fitness', '24hr fitness'], clean: '24 Hour Fitness' },
  { patterns: ['anytime fitness'], clean: 'Anytime Fitness' },
  { patterns: ['crunch fitness', 'crunch gym'], clean: 'Crunch Fitness' },
  { patterns: ['lifetime fitness'], clean: 'Life Time Fitness' },
  { patterns: ['new york sports club', 'nysc'], clean: 'New York Sports Club' },
  { patterns: ['blink fitness'], clean: 'Blink Fitness' },
  
  // Boutique Fitness
  { patterns: ['f45'], clean: 'F45' },
  { patterns: ['orangetheory', 'otf'], clean: 'OrangeTheory' },
  { patterns: ['barry\'s bootcamp', 'barrys bootcamp'], clean: 'Barry\'s Bootcamp' },
  { patterns: ['soulcycle'], clean: 'SoulCycle' },
  { patterns: ['pure barre'], clean: 'Pure Barre' },
  { patterns: ['yoga to the people'], clean: 'Yoga to the People' },
  { patterns: ['corepower yoga'], clean: 'CorePower Yoga' },
  
  // Regional/Local Chains
  { patterns: ['eastern athletic', 'eastern athletic club'], clean: 'Eastern Athletic Club' },
  { patterns: ['david barton gym'], clean: 'David Barton Gym' },
  { patterns: ['printing house fitness'], clean: 'Printing House Fitness' },
  { patterns: ['manhattan plaza health club'], clean: 'Manhattan Plaza Health Club' }
];

// Comprehensive gym extraction patterns
const GYM_EXTRACTION_PATTERNS = [
  // CrossFit specific patterns with better boundary detection
  {
    pattern: /(?:i\s+(?:go\s+to|train\s+at|work\s+out\s+at|am\s+a\s+member\s+of))\s+(crossfit\s+[a-z\s]{1,25}?)(?:\s+(?:to|for|because|where|and|gym|fitness|center|to\s+get|for\s+my)|\.|,|!|\?|$)/i,
    type: 'crossfit',
    group: 1
  },
  {
    pattern: /(?:my\s+gym\s+is)\s+(crossfit\s+[a-z\s]{1,25}?)(?:\s+(?:to|for|because|where|and|gym|fitness|center|to\s+get|for\s+my)|\.|,|!|\?|$)/i,
    type: 'crossfit',
    group: 1
  },
  {
    pattern: /(crossfit\s+[a-z\s]{1,25}?)(?:\s+(?:to|for|because|where|and|gym|fitness|center|is|was|to\s+get|for\s+my)|\.|,|!|\?|$)/i,
    type: 'crossfit',
    group: 1
  },
  
  // General gym patterns
  {
    pattern: /(?:i\s+(?:go\s+to|train\s+at|work\s+out\s+at|am\s+a\s+member\s+of))\s+([^.!?]+?)(?:\s+(?:to\s+get|for\s+my|to|for|because|where|and)|\.|,|!|\?|$)/i,
    type: 'general',
    group: 1
  },
  {
    pattern: /(?:my\s+gym\s+is)\s+([^.!?]+?)(?:\s+(?:to\s+get|for\s+my|to|for|because|where|and)|\.|,|!|\?|$)/i,
    type: 'general',
    group: 1
  },
  {
    pattern: /(?:gym|fitness|crossfit|f45|orangetheory):\s*([^.!?]+?)(?:\s+(?:to\s+get|for\s+my|to|for|because|where|and)|\.|,|!|\?|$)/i,
    type: 'general',
    group: 1
  },
  
  // Specific gym type patterns
  {
    pattern: /f45\s+([^.!?,]+?)(?:\s+(?:to\s+get|for\s+my|to|for|because|where|and)|\.|,|!|\?|$)/i,
    type: 'f45',
    group: 1
  },
  {
    pattern: /orangetheory\s+([^.!?,]+?)(?:\s+(?:to\s+get|for\s+my|to|for|because|where|and)|\.|,|!|\?|$)/i,
    type: 'orangetheory',
    group: 1
  },
  {
    pattern: /otf\s+([^.!?,]+?)(?:\s+(?:to\s+get|for\s+my|to|for|because|where|and)|\.|,|!|\?|$)/i,
    type: 'orangetheory',
    group: 1
  },
  {
    pattern: /(?:i\s+do\s+crossfit\s+at)\s+([^.!?]+?)(?:\s+(?:to\s+get|for\s+my|to|for|because|where|and)|\.|,|!|\?|$)/i,
    type: 'crossfit',
    group: 1
  },
  
  // Location-based patterns (@ symbol)
  {
    pattern: /(?:at|@)\s+([^.!?,]*(?:gym|fitness|crossfit|f45|orangetheory)[^.!?,]*)(?:\s+(?:to\s+get|for\s+my|to|for|because|where|and)|\.|,|!|\?|$)/i,
    type: 'general',
    group: 1
  }
];

// Words that indicate purpose rather than gym name (should be removed)
const STOP_PHRASES = [
  'to get my exercise',
  'to get exercise', 
  'to work out',
  'to train',
  'to stay fit',
  'for fitness',
  'for training', 
  'for workouts',
  'for exercise',
  'for my exercise',
  'where i go',
  'where i train',
  'where i work out',
  'and i love it',
  'and it\'s great',
  'because i like',
  'because it\'s',
  'to stay in shape',
  'to get strong',
  'to build muscle'
];

// Trailing words that should be removed
const TRAILING_WORDS = [
  'to', 'for', 'where', 'and', 'or', 'at', 'in', 'on', 'with',
  'because', 'since', 'as', 'when', 'while', 'that', 'which'
];

/**
 * Extract gym name from user profile description
 * @param {string} profileText - User's profile description
 * @returns {string|null} - Extracted gym name or null if not found
 */
export const extractGymFromProfile = (profileText) => {
  if (!profileText || typeof profileText !== 'string') {
    return null;
  }
  
  const lowerProfile = profileText.toLowerCase().trim();
  console.log('🔍 Analyzing profile text for gym:', profileText);
  
  // First check for exact known gym matches (most reliable)
  const knownGym = findKnownGymChain(lowerProfile);
  if (knownGym) {
    console.log(`✅ Found known gym chain: "${knownGym}"`);
    return knownGym;
  }
  
  // Try pattern matching for gym extraction
  for (const patternConfig of GYM_EXTRACTION_PATTERNS) {
    const match = profileText.match(patternConfig.pattern);
    if (match && match[patternConfig.group]) {
      let gymName = match[patternConfig.group].trim();
      
      // Clean up the extracted name
      gymName = cleanGymName(gymName);
      
      if (gymName && gymName.length >= 3) {
        console.log(`✅ Extracted gym name: "${gymName}" from ${patternConfig.type} pattern`);
        return gymName;
      }
    }
  }

  console.log('❌ No gym found in profile');
  return null;
};

/**
 * Find known gym chains in profile text
 * @param {string} lowerProfile - Lowercase profile text
 * @returns {string|null} - Known gym name or null
 */
const findKnownGymChain = (lowerProfile) => {
  for (const gymChain of KNOWN_GYM_CHAINS) {
    for (const pattern of gymChain.patterns) {
      if (lowerProfile.includes(pattern.toLowerCase())) {
        return gymChain.clean;
      }
    }
  }
  return null;
};

/**
 * Clean and normalize extracted gym name
 * @param {string} gymName - Raw extracted gym name
 * @returns {string|null} - Cleaned gym name or null if invalid
 */
export const cleanGymName = (gymName) => {
  if (!gymName || typeof gymName !== 'string') {
    return null;
  }
  
  let cleaned = gymName.toLowerCase().trim();
  console.log(`🧹 Cleaning gym name: "${cleaned}"`);
  
  // Remove stop phrases from the end
  for (const stopPhrase of STOP_PHRASES) {
    if (cleaned.endsWith(' ' + stopPhrase)) {
      cleaned = cleaned.replace(' ' + stopPhrase, '').trim();
      console.log(`🧹 Removed phrase "${stopPhrase}": "${cleaned}"`);
    }
  }
  
  // Remove single trailing words
  const words = cleaned.split(' ');
  while (words.length > 1 && TRAILING_WORDS.includes(words[words.length - 1])) {
    const removed = words.pop();
    console.log(`🧹 Removed trailing word "${removed}"`);
  }
  
  cleaned = words.join(' ');
  
  // Additional cleaning
  cleaned = cleaned
    .replace(/[•\-\*]/g, '') // Remove bullet points and dashes
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // Capitalize properly
  cleaned = capitalizeGymName(cleaned);
  
  console.log(`🎯 Final cleaned gym name: "${cleaned}"`);
  return cleaned.length >= 3 ? cleaned : null;
};

/**
 * Properly capitalize gym names with special handling
 * @param {string} gymName - Gym name to capitalize
 * @returns {string} - Properly capitalized gym name
 */
const capitalizeGymName = (gymName) => {
  if (!gymName) return '';
  
  // Handle special cases first
  if (gymName.toLowerCase().startsWith('crossfit')) {
    gymName = gymName.replace(/^crossfit/i, 'CrossFit');
  }
  
  if (gymName.toLowerCase().includes('f45')) {
    gymName = gymName.replace(/f45/i, 'F45');
  }
  
  if (gymName.toLowerCase().includes('otf')) {
    gymName = gymName.replace(/otf/i, 'OTF');
  }
  
  // Standard title case for other words
  return gymName.split(' ')
    .map(word => {
      // Don't change special cases that are already handled
      if (['CrossFit', 'F45', 'OTF'].includes(word)) {
        return word;
      }
      // Handle contractions and possessives
      if (word.includes("'")) {
        return word.split("'").map(part => 
          part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        ).join("'");
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

/**
 * Validate extracted gym name
 * @param {string} gymName - Gym name to validate
 * @returns {boolean} - True if valid gym name
 */
export const validateGymName = (gymName) => {
  if (!gymName || typeof gymName !== 'string') {
    return false;
  }
  
  const trimmed = gymName.trim();
  
  // Basic validation rules
  return trimmed.length >= 3 && 
         trimmed.length <= 50 && 
         /^[a-zA-Z0-9\s'&.-]+$/.test(trimmed) && // Only allowed characters
         !/^\d+$/.test(trimmed); // Not just numbers
};

/**
 * Extract gym location from profile if mentioned
 * @param {string} profileText - User's profile description
 * @param {string} gymName - Already extracted gym name
 * @returns {string|null} - Location or null if not found
 */
export const extractGymLocation = (profileText, gymName) => {
  if (!profileText || !gymName) return null;
  
  const lowerProfile = profileText.toLowerCase();
  const lowerGym = gymName.toLowerCase();
  
  // Look for location patterns near gym name
  const locationPatterns = [
    // "gym in [location]"
    new RegExp(`${lowerGym}\\s+(?:in|at|on)\\s+([^.!?,]+)`, 'i'),
    // "[location] gym"
    new RegExp(`([^.!?,]+)\\s+${lowerGym}`, 'i'),
    // "gym, [location]"
    new RegExp(`${lowerGym},\\s*([^.!?,]+)`, 'i')
  ];
  
  for (const pattern of locationPatterns) {
    const match = profileText.match(pattern);
    if (match && match[1]) {
      const location = match[1].trim();
      if (location.length > 2 && location.length < 30) {
        return capitalizeLocation(location);
      }
    }
  }
  
  return null;
};

/**
 * Capitalize location names properly
 * @param {string} location - Raw location string
 * @returns {string} - Properly capitalized location
 */
const capitalizeLocation = (location) => {
  return location.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Get gym type from gym name
 * @param {string} gymName - Gym name to analyze
 * @returns {string} - Gym type: 'crossfit', 'commercial', 'boutique', 'unknown'
 */
export const getGymType = (gymName) => {
  if (!gymName) return 'unknown';
  
  const lowerName = gymName.toLowerCase();
  
  // CrossFit gyms
  if (lowerName.includes('crossfit') || lowerName.includes('cf ')) {
    return 'crossfit';
  }
  
  // Boutique fitness
  const boutiqueKeywords = ['f45', 'orangetheory', 'otf', 'barry', 'soul', 'pure barre', 'yoga'];
  if (boutiqueKeywords.some(keyword => lowerName.includes(keyword))) {
    return 'boutique';
  }
  
  // Commercial gyms
  const commercialKeywords = ['planet', 'la fitness', 'gold', 'equinox', '24 hour', 'crunch', 'lifetime', 'blink'];
  if (commercialKeywords.some(keyword => lowerName.includes(keyword))) {
    return 'commercial';
  }
  
  return 'unknown';
};

/**
 * Generate gym search keywords for WOD fetching
 * @param {string} gymName - Gym name
 * @param {string} location - Optional location
 * @returns {Array} - Array of search terms
 */
export const generateGymSearchKeywords = (gymName, location = null) => {
  if (!gymName) return [];
  
  const keywords = [gymName];
  
  // Add variations
  const lowerName = gymName.toLowerCase();
  
  // CrossFit variations
  if (lowerName.includes('crossfit')) {
    keywords.push(gymName.replace(/crossfit/i, 'CF'));
    keywords.push(gymName.replace(/crossfit\s+/i, ''));
  }
  
  // Add location-based searches
  if (location) {
    keywords.push(`${gymName} ${location}`);
    keywords.push(`${location} ${gymName}`);
  }
  
  // Add gym type keywords
  const gymType = getGymType(gymName);
  if (gymType !== 'unknown') {
    keywords.push(`${gymName} ${gymType}`);
  }
  
  return [...new Set(keywords)]; // Remove duplicates
};

/**
 * Check if gym name matches common patterns that might have WODs
 * @param {string} gymName - Gym name to check
 * @returns {boolean} - True if likely to have WODs
 */
export const isLikelyToHaveWOD = (gymName) => {
  if (!gymName) return false;
  
  const lowerName = gymName.toLowerCase();
  
  // Gym types that commonly post WODs
  const wodGymTypes = [
    'crossfit', 'cf ', 'f45', 'orangetheory', 'otf',
    'bootcamp', 'hiit', 'functional', 'strength'
  ];
  
  return wodGymTypes.some(type => lowerName.includes(type));
};

/**
 * Normalize gym name for consistent storage and comparison
 * @param {string} gymName - Gym name to normalize
 * @returns {string} - Normalized gym name
 */
export const normalizeGymName = (gymName) => {
  if (!gymName) return '';
  
  return gymName
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s'-]/g, '') // Remove special characters except apostrophes and hyphens
    .toLowerCase();
};

/**
 * Extract multiple gym mentions from profile (some users mention multiple gyms)
 * @param {string} profileText - User's profile description
 * @returns {Array} - Array of extracted gym names
 */
export const extractAllGymsFromProfile = (profileText) => {
  if (!profileText) return [];
  
  const gyms = [];
  const lowerProfile = profileText.toLowerCase();
  
  // Check for known gym chains first
  for (const gymChain of KNOWN_GYM_CHAINS) {
    for (const pattern of gymChain.patterns) {
      if (lowerProfile.includes(pattern.toLowerCase())) {
        if (!gyms.includes(gymChain.clean)) {
          gyms.push(gymChain.clean);
        }
      }
    }
  }
  
  // Try pattern matching for additional gyms
  for (const patternConfig of GYM_EXTRACTION_PATTERNS) {
    const matches = [...profileText.matchAll(new RegExp(patternConfig.pattern.source, 'gi'))];
    
    for (const match of matches) {
      if (match && match[patternConfig.group]) {
        let gymName = match[patternConfig.group].trim();
        gymName = cleanGymName(gymName);
        
        if (gymName && gymName.length >= 3 && !gyms.includes(gymName)) {
          gyms.push(gymName);
        }
      }
    }
  }
  
  console.log(`🏋️ Found ${gyms.length} gyms:`, gyms);
  return gyms;
};

/**
 * Score gym name confidence based on extraction method
 * @param {string} gymName - Extracted gym name
 * @param {string} extractionMethod - How it was extracted
 * @returns {number} - Confidence score 0-100
 */
export const scoreGymConfidence = (gymName, extractionMethod) => {
  if (!gymName) return 0;
  
  let score = 50; // Base score
  
  // Boost for known gym chains
  if (KNOWN_GYM_CHAINS.some(chain => 
    chain.patterns.some(pattern => 
      gymName.toLowerCase().includes(pattern.toLowerCase())
    )
  )) {
    score += 30;
  }
  
  // Boost for specific gym types
  const lowerName = gymName.toLowerCase();
  if (lowerName.includes('crossfit')) score += 20;
  if (lowerName.includes('f45') || lowerName.includes('orangetheory')) score += 15;
  
  // Boost for extraction method
  switch (extractionMethod) {
    case 'known_chain': score += 25; break;
    case 'crossfit_pattern': score += 20; break;
    case 'direct_mention': score += 15; break;
    case 'general_pattern': score += 10; break;
  }
  
  // Penalize very short or very long names
  if (gymName.length < 5) score -= 10;
  if (gymName.length > 30) score -= 15;
  
  return Math.max(0, Math.min(100, score));
};

/**
 * Generate WOD URL suggestions based on gym name and type
 * @param {string} gymName - Name of the gym
 * @param {string} location - Optional location
 * @returns {Array} - Array of potential WOD URLs
 */
export const generateWODUrls = (gymName, location = null) => {
  if (!gymName) return [];
  
  const urls = [];
  const cleanName = gymName
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
  
  const gymType = getGymType(gymName);
  
  // CrossFit gym URL patterns
  if (gymType === 'crossfit') {
    const cfName = cleanName.replace('crossfit', '');
    urls.push(
      `https://${cfName}.com`,
      `https://crossfit${cfName}.com`,
      `https://www.crossfit${cfName}.com`,
      `https://${cfName}.crossfit.com`,
      `https://crossfit${cfName}.wordpress.com`,
      `https://crossfit${cfName}.blogspot.com`
    );
  }
  
  // Commercial gym patterns
  if (gymType === 'commercial') {
    urls.push(
      `https://www.${cleanName}.com`,
      `https://${cleanName}.com/wod`,
      `https://${cleanName}.com/workouts`
    );
  }
  
  // Boutique fitness patterns
  if (gymType === 'boutique') {
    urls.push(
      `https://www.${cleanName}.com`,
      `https://${cleanName}.com/schedule`,
      `https://${cleanName}.com/classes`
    );
  }
  
  return urls;
};

/**
 * Parse gym name variations for better matching
 * @param {string} gymName - Original gym name
 * @returns {Object} - Object with various name formats
 */
export const parseGymNameVariations = (gymName) => {
  if (!gymName) return {};
  
  const variations = {
    original: gymName,
    normalized: normalizeGymName(gymName),
    clean: cleanGymName(gymName),
    searchable: gymName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
  };
  
  // CrossFit specific variations
  if (gymName.toLowerCase().includes('crossfit')) {
    variations.withoutCF = gymName.replace(/crossfit\s*/i, '').trim();
    variations.cfAbbrev = gymName.replace(/crossfit/i, 'CF');
  }
  
  // Location extraction if embedded in name
  const locationMatch = gymName.match(/(.+?)\s+(brooklyn|manhattan|queens|bronx|nyc|new york)/i);
  if (locationMatch) {
    variations.nameOnly = locationMatch[1].trim();
    variations.location = locationMatch[2];
  }
  
  return variations;
};

/**
 * Check if extracted gym name looks valid
 * @param {string} gymName - Gym name to validate
 * @returns {Object} - Validation result with issues
 */
export const validateGymExtraction = (gymName) => {
  const result = {
    isValid: false,
    confidence: 0,
    issues: []
  };
  
  if (!gymName) {
    result.issues.push('No gym name provided');
    return result;
  }
  
  if (gymName.length < 3) {
    result.issues.push('Gym name too short');
  }
  
  if (gymName.length > 50) {
    result.issues.push('Gym name too long');
  }
  
  if (!/^[a-zA-Z0-9\s'&.-]+$/.test(gymName)) {
    result.issues.push('Contains invalid characters');
  }
  
  if (/^\d+$/.test(gymName)) {
    result.issues.push('Gym name is only numbers');
  }
  
  // Check for common non-gym words
  const nonGymWords = ['exercise', 'workout', 'fitness routine', 'training program'];
  if (nonGymWords.some(word => gymName.toLowerCase().includes(word))) {
    result.issues.push('Contains non-gym descriptive words');
  }
  
  // Calculate confidence
  result.confidence = scoreGymConfidence(gymName, 'validation');
  result.isValid = result.issues.length === 0 && result.confidence > 30;
  
  return result;
};

/**
 * Extract gym hours/schedule info from profile if mentioned
 * @param {string} profileText - User's profile description
 * @param {string} gymName - Gym name for context
 * @returns {Object|null} - Schedule info or null
 */
export const extractGymSchedule = (profileText, gymName) => {
  if (!profileText || !gymName) return null;
  
  const schedulePatterns = [
    /(\d{1,2}:\d{2}\s*(?:am|pm)?)\s*(?:to|-)\s*(\d{1,2}:\d{2}\s*(?:am|pm)?)/gi,
    /(morning|afternoon|evening)\s*(?:workouts?|classes?)/gi,
    /(\d{1,2})\s*(?:am|pm)\s*(?:class|workout)/gi
  ];
  
  const schedule = {};
  
  for (const pattern of schedulePatterns) {
    const matches = [...profileText.matchAll(pattern)];
    if (matches.length > 0) {
      schedule.found = true;
      schedule.mentions = matches.map(match => match[0]);
      break;
    }
  }
  
  return schedule.found ? schedule : null;
};

export default {
  extractGymFromProfile,
  cleanGymName,
  validateGymName,
  extractGymLocation,
  getGymType,
  generateGymSearchKeywords,
  isLikelyToHaveWOD,
  normalizeGymName,
  extractAllGymsFromProfile,
  scoreGymConfidence,
  generateWODUrls,
  parseGymNameVariations,
  validateGymExtraction,
  extractGymSchedule
};