// src/services/gymDetectionService.js
// Connects to your existing backend for real gym WOD scraping

class GymDetectionService {
  constructor() {
    // Use your existing backend URL
    this.backendUrl = 'https://atlas-fitness-api-112712643157.us-central1.run.app';
    this.timeout = 15000;
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
  }

  // ADDED: The missing method your WorkoutScreen is calling
  async suggestGymWorkout(profileText) {
    try {
      console.log('🏋️ Getting gym workout suggestion from profile text:', profileText);
      
      if (!profileText || typeof profileText !== 'string') {
        return { 
          hasGym: false, 
          error: 'No profile text provided' 
        };
      }

      // Use existing detection logic
      const gymInfo = this.detectGymFromText(profileText);
      
      if (!gymInfo.detected) {
        return { 
          hasGym: false, 
          message: 'No gym detected in profile',
          hint: 'Add your gym name to your profile (e.g., "I work out at CrossFit South Brooklyn")'
        };
      }

      console.log(`🏋️ Detected gym: ${gymInfo.name}`);

      // Get WOD from backend
      const wodData = await this.getWODFromBackend(gymInfo.name, gymInfo.location);
      
      return {
        hasGym: true,
        gym: {
          name: gymInfo.name,
          type: gymInfo.type,
          location: gymInfo.location,
          hasWOD: !!wodData
        },
        wod: wodData || null
      };

    } catch (error) {
      console.error('❌ Error in suggestGymWorkout:', error);
      return {
        hasGym: false,
        error: error.message
      };
    }
  }

  // Main method to analyze profile and get WOD
  async analyzeProfile(profileText) {
    try {
      console.log('🔍 Analyzing profile for gym detection:', profileText);
      
      if (!profileText || typeof profileText !== 'string') {
        console.log('❌ No valid profile text provided');
        return { detected: false, confidence: 'none' };
      }

      // Detect gym from profile text
      const gymInfo = this.detectGymFromText(profileText);
      
      if (!gymInfo.detected) {
        console.log('❌ No gym found in user profile.');
        return gymInfo;
      }

      console.log(`🏋️ Detected gym: ${gymInfo.name}`);

      // Get real WOD from your backend
      const wodData = await this.getWODFromBackend(gymInfo.name, gymInfo.location);
      
      if (wodData) {
        console.log('📋 WOD available:', {
          date: wodData.date,
          name: wodData.title,
          source: wodData.source,
          scraped: wodData.type === 'scraped',
          scrapedAt: wodData.scrapedAt,
          exercises: wodData.content ? wodData.content.split('\n').slice(0, 5) : []
        });

        return {
          ...gymInfo,
          hasWOD: true,
          wodData,
          scrapable: wodData.type === 'scraped'
        };
      }

      // If scraping failed, return gym info with fallback
      console.log('⚠️ Could not fetch WOD, but gym detected');
      return {
        ...gymInfo,
        hasWOD: false,
        scrapable: false
      };

    } catch (error) {
      console.error('Error analyzing profile:', error);
      return { detected: false, confidence: 'error', error: error.message };
    }
  }

  // Enhanced gym detection from profile text
  detectGymFromText(profileText) {
    const lowerText = profileText.toLowerCase().trim();
    
    // Enhanced gym database with better pattern matching
    const gymDatabase = {
      // CrossFit Gyms
      'crossfit south brooklyn': {
        id: 'csb',
        name: 'CrossFit South Brooklyn',
        type: 'crossfit',
        location: 'Brooklyn, NY',
        website: 'https://crossfitsouthbrooklyn.com',
        wodUrl: 'https://crossfitsouthbrooklyn.com/blog',
        patterns: ['crossfit south brooklyn', 'cf south brooklyn', 'south brooklyn crossfit']
      },
      'crossfit nyc': {
        id: 'cfnyc',
        name: 'CrossFit NYC',
        type: 'crossfit',
        location: 'New York, NY',
        website: 'https://crossfitnyc.com',
        patterns: ['crossfit nyc', 'cf nyc', 'crossfit new york city']
      },
      'crossfit queens': {
        id: 'cfq',
        name: 'CrossFit Queens',
        type: 'crossfit',
        location: 'Queens, NY',
        website: 'https://crossfitqueens.com',
        patterns: ['crossfit queens', 'cf queens']
      },
      'crossfit williamsburg': {
        id: 'cfw',
        name: 'CrossFit Williamsburg', 
        type: 'crossfit',
        location: 'Brooklyn, NY',
        website: 'https://crossfitwilliamsburg.com',
        patterns: ['crossfit williamsburg', 'cf williamsburg']
      },
      
      // Chain Gyms
      'planet fitness': {
        id: 'pf',
        name: 'Planet Fitness',
        type: 'chain',
        patterns: ['planet fitness', 'pf']
      },
      'la fitness': {
        id: 'laf',
        name: 'LA Fitness',
        type: 'chain', 
        patterns: ['la fitness', 'l.a. fitness']
      },
      'equinox': {
        id: 'eqx',
        name: 'Equinox',
        type: 'premium',
        patterns: ['equinox']
      },
      
      // Boutique Fitness
      'f45': {
        id: 'f45',
        name: 'F45 Training',
        type: 'boutique',
        patterns: ['f45', 'f45 training']
      },
      'orangetheory': {
        id: 'otf',
        name: 'Orangetheory Fitness',
        type: 'boutique',
        patterns: ['orangetheory', 'orange theory', 'otf']
      }
    };

    // Look for gym matches
    for (const [gymKey, gymData] of Object.entries(gymDatabase)) {
      for (const pattern of gymData.patterns) {
        if (lowerText.includes(pattern)) {
          return {
            detected: true,
            confidence: 'high',
            id: gymData.id,
            name: gymData.name,
            type: gymData.type,
            location: gymData.location || 'Unknown',
            website: gymData.website || null,
            wodUrl: gymData.wodUrl || gymData.website
          };
        }
      }
    }

    // Generic gym detection (lower confidence)
    const genericGymKeywords = [
      'gym', 'fitness', 'workout', 'crossfit', 'training',
      'exercise', 'health club', 'athletic', 'sports'
    ];

    for (const keyword of genericGymKeywords) {
      if (lowerText.includes(keyword)) {
        // Try to extract gym name
        const sentences = profileText.split(/[.!?]+/);
        for (const sentence of sentences) {
          if (sentence.toLowerCase().includes(keyword)) {
            const cleanSentence = sentence.trim();
            return {
              detected: true,
              confidence: 'medium',
              id: 'generic',
              name: cleanSentence,
              type: 'unknown',
              location: 'Unknown',
              website: null
            };
          }
        }
      }
    }

    return { 
      detected: false, 
      confidence: 'none',
      hint: 'Try adding your gym name to your profile (e.g., "I work out at CrossFit South Brooklyn")'
    };
  }

  // Connect to your existing backend for real WOD scraping
  async getWODFromBackend(gymName, location = '') {
    try {
      const cacheKey = `${gymName}-${location}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          console.log('📦 Using cached WOD data');
          return cached.data;
        }
      }

      console.log(`🌐 Fetching WOD from backend for: ${gymName}`);
      
      const response = await fetch(`${this.backendUrl}/api/gym/wod`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gymName: gymName,
          location: location
        }),
        timeout: this.timeout,
      });

      if (!response.ok) {
        console.error(`Backend response error: ${response.status}`);
        return null;
      }

      const result = await response.json();
      
      if (result.success && result.wod) {
        // Cache the result
        this.cache.set(cacheKey, {
          data: result.wod,
          timestamp: Date.now()
        });
        
        console.log(`✅ WOD fetched successfully from backend: ${result.wod.source || 'unknown source'}`);
        return result.wod;
      }

      console.log('❌ Backend returned no WOD data');
      return null;

    } catch (error) {
      console.error('Error fetching WOD from backend:', error);
      
      // Return fallback WOD if backend fails
      if (gymName.toLowerCase().includes('crossfit')) {
        return this.generateFallbackCrossFitWOD(gymName);
      }
      
      return null;
    }
  }

  // Fallback CrossFit WOD when backend fails
  generateFallbackCrossFitWOD(gymName) {
    const fallbackWods = [
      {
        title: "South Brooklyn Strength",
        content: `Strength: Back Squat
Work up to 3RM

WOD: "Brooklyn Bridge"
21-15-9
Deadlifts (225/155 lb)
Handstand Push-ups
Time cap: 15 minutes

Scale HSPU to pike push-ups or box HSPU as needed`,
        date: new Date().toLocaleDateString(),
        difficulty: 'intermediate',
        estimatedTime: '45 minutes total (15 min strength + 8-12 min WOD)',
        equipment: ['barbell', 'plates', 'abmat'],
        notes: 'Scale HSPU to pike push-ups or box HSPU as needed'
      },
      {
        title: "MetCon Monday",
        content: `AMRAP 15:
8 Thrusters (95/65 lb)
12 Pull-ups
200m Run

RX+: 115/85 lb thrusters
Scale: Reduce weight, assisted pull-ups, 100m run`,
        date: new Date().toLocaleDateString(),
        difficulty: 'intermediate',
        estimatedTime: '30 minutes total',
        equipment: ['barbell', 'pull-up bar'],
        notes: 'Steady pace, don\'t redline early'
      }
    ];

    const randomWod = fallbackWods[Math.floor(Math.random() * fallbackWods.length)];
    
    return {
      ...randomWod,
      source: gymName,
      type: 'fallback',
      scraped: false,
      scrapedAt: new Date().toISOString()
    };
  }

  // Clear cache (useful for testing)
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Gym detection cache cleared');
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Create and export singleton instance
export const gymDetectionService = new GymDetectionService();
export default gymDetectionService;