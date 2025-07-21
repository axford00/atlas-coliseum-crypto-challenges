import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import {
    doc,
    setDoc
} from 'firebase/firestore';
import { ensureFirebaseInit } from '../utils/firebaseInit';
import { getFitnessAnalytics } from './analyticsService';
import { generatePersonalizedNotifications } from './notificationService';
import { getRecommendations } from './recommendationService';

// Get Firebase instances
const { db, auth } = ensureFirebaseInit();

// Define task names
const ANALYTICS_UPDATE_TASK = 'ANALYTICS_UPDATE_TASK';
const RECOMMENDATIONS_UPDATE_TASK = 'RECOMMENDATIONS_UPDATE_TASK';
const NOTIFICATIONS_TASK = 'NOTIFICATIONS_TASK';

/**
 * Register background tasks
 */
export const registerBackgroundTasks = async (): Promise<void> => {
  try {
    // Register analytics update task
    await registerAnalyticsUpdateTask();

    // Register recommendations update task
    await registerRecommendationsUpdateTask();

    // Register notifications task
    await registerNotificationsTask();

    console.log('Background tasks registered successfully');
  } catch (error) {
    console.error('Error registering background tasks:', error);
    throw error;
  }
};

/**
 * Register analytics update task
 */
const registerAnalyticsUpdateTask = async (): Promise<void> => {
  // Define the task handler
  TaskManager.defineTask(ANALYTICS_UPDATE_TASK, async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      // Get analytics data
      const analytics = await getFitnessAnalytics();

      // Save to Firestore
      const analyticsRef = doc(db, 'users', user.uid, 'analytics', 'fitness');
      await setDoc(analyticsRef, {
        ...analytics,
        updatedAt: new Date().toISOString()
      });

      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
      console.error('Error in analytics update task:', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });

  // Register the task
  const status = await BackgroundFetch.registerTaskAsync(ANALYTICS_UPDATE_TASK, {
    minimumInterval: 60 * 60, // 1 hour
    stopOnTerminate: false,
    startOnBoot: true,
  });

  console.log('Analytics update task registered:', status);
};

/**
 * Register recommendations update task
 */
const registerRecommendationsUpdateTask = async (): Promise<void> => {
  // Define the task handler
  TaskManager.defineTask(RECOMMENDATIONS_UPDATE_TASK, async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      // Get recommendations
      const recommendations = await getRecommendations();

      // Save to Firestore
      const recommendationsRef = doc(db, 'users', user.uid, 'recommendations', 'fitness');
      await setDoc(recommendationsRef, {
        ...recommendations,
        updatedAt: new Date().toISOString()
      });

      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
      console.error('Error in recommendations update task:', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });

  // Register the task
  const status = await BackgroundFetch.registerTaskAsync(RECOMMENDATIONS_UPDATE_TASK, {
    minimumInterval: 60 * 60 * 3, // 3 hours
    stopOnTerminate: false,
    startOnBoot: true,
  });

  console.log('Recommendations update task registered:', status);
};

/**
 * Register notifications task
 */
const registerNotificationsTask = async (): Promise<void> => {
  // Define the task handler
  TaskManager.defineTask(NOTIFICATIONS_TASK, async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      // Generate and schedule personalized notifications
      await generatePersonalizedNotifications();

      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
      console.error('Error in notifications task:', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });

  // Register the task
  const status = await BackgroundFetch.registerTaskAsync(NOTIFICATIONS_TASK, {
    minimumInterval: 60 * 60 * 6, // 6 hours
    stopOnTerminate: false,
    startOnBoot: true,
  });

  console.log('Notifications task registered:', status);
};

/**
 * Manually trigger background tasks
 */
export const triggerBackgroundTasks = async (): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Update analytics
    const analytics = await getFitnessAnalytics();
    const analyticsRef = doc(db, 'users', user.uid, 'analytics', 'fitness');
    await setDoc(analyticsRef, {
      ...analytics,
      updatedAt: new Date().toISOString()
    });

    // Update recommendations
    const recommendations = await getRecommendations();
    const recommendationsRef = doc(db, 'users', user.uid, 'recommendations', 'fitness');
    await setDoc(recommendationsRef, {
      ...recommendations,
      updatedAt: new Date().toISOString()
    });

    // Generate notifications
    await generatePersonalizedNotifications();

    console.log('Background tasks triggered manually');
  } catch (error) {
    console.error('Error triggering background tasks:', error);
    throw error;
  }
};

/**
 * Check if background tasks are registered
 */
export const checkBackgroundTasksStatus = async (): Promise<{
  analyticsTask: boolean;
  recommendationsTask: boolean;
  notificationsTask: boolean;
}> => {
  try {
    const registeredTasks = await TaskManager.getRegisteredTasksAsync();

    const analyticsTask = registeredTasks.some(task => task.taskName === ANALYTICS_UPDATE_TASK);
    const recommendationsTask = registeredTasks.some(task => task.taskName === RECOMMENDATIONS_UPDATE_TASK);
    const notificationsTask = registeredTasks.some(task => task.taskName === NOTIFICATIONS_TASK);

    return {
      analyticsTask,
      recommendationsTask,
      notificationsTask
    };
  } catch (error) {
    console.error('Error checking background tasks status:', error);
    throw error;
  }
};

/**
 * Unregister background tasks
 */
export const unregisterBackgroundTasks = async (): Promise<void> => {
  try {
    await BackgroundFetch.unregisterTaskAsync(ANALYTICS_UPDATE_TASK);
    await BackgroundFetch.unregisterTaskAsync(RECOMMENDATIONS_UPDATE_TASK);
    await BackgroundFetch.unregisterTaskAsync(NOTIFICATIONS_TASK);

    console.log('Background tasks unregistered successfully');
  } catch (error) {
    console.error('Error unregistering background tasks:', error);
    throw error;
  }
};
