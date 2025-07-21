// services/aiService.js - Fixed for async Firebase initialization
import { doc, getDoc } from 'firebase/firestore';
import { getUserMeals } from './mealService';
import { getUserWorkouts } from './workoutService';

class AIService {
  constructor() {
    // Don't initialize Firebase here - wait for async calls
    this.auth = null;
    this.db = null;
    
    // Production backend URL - Your deployed Google Cloud Run service
    this.backendUrl = 'https://atlas-fitness-api-112712643157.us-central1.run.app';
  }

  // Initialize Firebase services asynchronously when needed
  async initializeFirebase() {
    if (!this.auth || !this.db) {
      const { getAuth, getDb } = await import('../../firebase');
      this.auth = await getAuth();
      this.db = await getDb();
      console.log('🔥 AIService: Firebase initialized');
    }
    return { auth: this.auth, db: this.db };
  }

  // Get your computer's IP address for local testing
  getLocalBackendUrl() {
    return this.backendUrl;
  }

  // Main method for calling your backend (which calls Claude)
  async callBackendAI(prompt, context = {}) {
    try {
      console.log('Calling backend AI service...');
      console.log('Backend URL:', this.backendUrl);
      
      // Add timeout to prevent infinite spinning
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${this.backendUrl}/api/ai/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          context,
          maxTokens: 1000,
          temperature: 0.7
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `Backend Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Backend returned unsuccessful response');
      }

      console.log('✅ AI response received from backend');
      return data.response;
      
    } catch (error) {
      console.error('❌ Backend AI Error:', error);
      
      // Enhanced error handling with better fallback messages
      if (error.name === 'AbortError') {
        console.log('🕐 Request timed out, using fallback');
        return this.getEnhancedFallback(prompt);
      } else if (error.message.includes('fetch') || error.message.includes('Network')) {
        console.log('🔄 Network error detected, using enhanced fallback');
        return this.getEnhancedFallback(prompt);
      }
      
      // For any other error, still provide fallback
      return this.getEnhancedFallback(prompt);
    }
  }

  // Enhanced fallback when backend is unreachable
  getEnhancedFallback(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('workout') && lowerPrompt.includes('recommend')) {
      return this.getFallbackWorkoutRecommendation();
    } else if (lowerPrompt.includes('weekly') && lowerPrompt.includes('plan')) {
      return this.getFallbackWeeklyPlan();
    } else if (lowerPrompt.includes('meal') || lowerPrompt.includes('nutrition')) {
      return this.getFallbackMealRecommendation();
    }
    
    return "🤖 AI Coach is temporarily offline, but your fitness journey continues! Check out the other features in the app, and the AI will be back soon with personalized recommendations.";
  }

  // Gather user context for AI recommendations
  async getUserContext() {
    try {
      // Initialize Firebase first
      const { auth, db } = await this.initializeFirebase();
      
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const [userProfile, recentWorkouts, recentMeals] = await Promise.all([
        this.getUserProfile(user.uid),
        getUserWorkouts().then(workouts => workouts.slice(0, 14)), // Last 2 weeks
        getUserMeals().then(meals => meals.slice(0, 21)) // Last 3 weeks
      ]);

      return {
        profile: userProfile,
        workouts: recentWorkouts,
        meals: recentMeals,
        currentTime: new Date(),
        userId: user.uid
      };
    } catch (error) {
      console.error('Error gathering user context:', error);
      return { profile: {}, workouts: [], meals: [], currentTime: new Date() };
    }
  }

  async getUserProfile(userId) {
    try {
      // Ensure Firebase is initialized
      const { db } = await this.initializeFirebase();
      
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.exists() ? userDoc.data() : {};
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return {};
    }
  }

  // Workout recommendations
  async getWorkoutRecommendation() {
    try {
      const context = await this.getUserContext();
      
      const prompt = `You are an expert fitness coach. Based on the user's data, provide a personalized workout recommendation.

User Profile: ${JSON.stringify(context.profile, null, 2)}
Recent Workouts (last 14 days): ${JSON.stringify(context.workouts, null, 2)}
Current Time: ${context.currentTime.toISOString()}

Analyze their workout patterns, frequency, and balance between cardio/strength.
Provide a specific recommendation for today's workout including:
- Workout type and duration
- Specific exercises or activities
- Intensity level
- Any adjustments based on their recent activity

Keep the response encouraging and actionable, under 300 words.`;

      return await this.callBackendAI(prompt, context);
    } catch (error) {
      console.error('Using fallback workout recommendation');
      return this.getFallbackWorkoutRecommendation();
    }
  }

  getFallbackWorkoutRecommendation() {
    const hour = new Date().getHours();
    
    if (hour < 11) {
      return "🌅 MORNING ENERGY BOOST:\n\n• 20-minute bodyweight circuit\n• Mix of squats, push-ups, and planks\n• Light cardio to wake up your body\n• Perfect way to start your day strong!";
    } else if (hour < 16) {
      return "☀️ MIDDAY POWER SESSION:\n\n• 30-45 minute strength training\n• Focus on major muscle groups\n• Higher intensity for maximum results\n• You've got the energy - use it!";
    } else {
      return "🌙 EVENING RECOVERY WORKOUT:\n\n• 25-30 minute moderate session\n• Mix of light cardio and stretching\n• Focus on movement quality\n• Perfect way to unwind and stay active!";
    }
  }

  // Meal recommendations
  async getMealRecommendation() {
    try {
      const context = await this.getUserContext();
      
      const prompt = `You are a nutrition expert. Based on the user's data, provide a personalized meal recommendation.

User Profile: ${JSON.stringify(context.profile, null, 2)}
Recent Meals (last 21 days): ${JSON.stringify(context.meals, null, 2)}
Current Time: ${context.currentTime.toISOString()}

Consider:
- Time of day for meal timing
- Their recent eating patterns
- Nutritional gaps or patterns
- Their fitness goals

Provide specific meal suggestions for the current time of day including:
- 3-4 specific meal options
- Key nutrients to focus on
- Preparation tips

Keep the response practical and encouraging, under 300 words.`;

      return await this.callBackendAI(prompt, context);
    } catch (error) {
      console.error('Using fallback meal recommendation');
      return this.getFallbackMealRecommendation();
    }
  }

  getFallbackMealRecommendation() {
    const hour = new Date().getHours();
    
    if (hour < 11) {
      return "🍳 BREAKFAST POWER-UP:\n\n• Greek yogurt with berries and granola\n• Oatmeal with banana and almond butter\n• Scrambled eggs with avocado toast\n\nFocus on protein + complex carbs to fuel your day!";
    } else if (hour < 16) {
      return "🥗 LUNCH ENERGY:\n\n• Grilled chicken quinoa bowl\n• Turkey and hummus wrap\n• Salmon salad with sweet potato\n\nBalanced nutrition to power your afternoon!";
    } else {
      return "🍽️ DINNER NOURISHMENT:\n\n• Baked fish with roasted vegetables\n• Lean protein with brown rice\n• Stir-fry with tofu and mixed veggies\n\nLight but satisfying for evening recovery!";
    }
  }

  // Weekly plan generation  
  async getWeeklyPlan(context) {
    return await this.generateWeeklyPlan(context);
  }

  async generateWeeklyPlan(context = null) {
    try {
      if (!context) {
        context = await this.getUserContext();
      }
      
      const prompt = `You are a comprehensive fitness and nutrition coach. Create a personalized weekly plan.

User Profile: ${JSON.stringify(context.profile, null, 2)}
Recent Workouts: ${JSON.stringify(context.workouts, null, 2)}
Recent Meals: ${JSON.stringify(context.meals, null, 2)}

Create a detailed 7-day plan including:
1. Daily workout recommendations (type, duration, focus)
2. Meal timing and nutrition focus for each day
3. Recovery and rest considerations
4. Progressive goals for the week
5. Specific adjustments based on their current patterns

Format as a clear, day-by-day breakdown. Be encouraging and specific.
Keep under 500 words but be comprehensive.`;

      return await this.callBackendAI(prompt, context);
    } catch (error) {
      console.error('Using fallback weekly plan');
      return this.getFallbackWeeklyPlan();
    }
  }

  getFallbackWeeklyPlan() {
    return `🎯 YOUR WEEKLY SUCCESS PLAN

MONDAY - STRONG START
Workout: Upper body strength (30min)
Nutrition: High protein breakfast, balanced lunch
Focus: Set the tone for a great week

TUESDAY - CARDIO BOOST  
Workout: 30min cardio session
Nutrition: Complex carbs for energy
Focus: Heart health and endurance

WEDNESDAY - LOWER POWER
Workout: Lower body strength (35min)
Nutrition: Post-workout protein within 30min
Focus: Building leg strength

THURSDAY - ACTIVE RECOVERY
Workout: Light yoga or walking (20min)
Nutrition: Anti-inflammatory foods
Focus: Recovery and flexibility

FRIDAY - FULL BODY
Workout: Total body circuit (40min)
Nutrition: Balanced meals all day
Focus: Bringing it all together

WEEKEND - BALANCE
Saturday: Fun activity of choice
Sunday: Meal prep and rest
Focus: Sustainable lifestyle habits

💡 Remember: Consistency beats perfection!`;
  }

  // Health check method
  async checkBackendHealth() {
    try {
      const response = await fetch(`${this.backendUrl}/health`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new AIService();