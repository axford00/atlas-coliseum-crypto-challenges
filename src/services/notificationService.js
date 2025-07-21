import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore';
import { Platform } from 'react-native';
import { ensureFirebaseInit } from '../utils/firebaseInit';
import { getFitnessAnalytics } from './analyticsService';
import { getRecommendations } from './recommendationService';

const { db, auth } = ensureFirebaseInit();

export const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled: true,
  workoutReminders: true,
  mealReminders: true,
  progressUpdates: true,
  suggestedWorkoutTime: '17:00',
  suggestedMealTimes: {
    breakfast: '08:00',
    lunch: '12:30',
    dinner: '19:00'
  },
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00'
};

export const initializeNotificationSettings = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const settingsRef = doc(db, 'users', user.uid, 'settings', 'notifications');
    const settingsSnap = await getDoc(settingsRef);

    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, DEFAULT_NOTIFICATION_SETTINGS);
    }
  } catch (error) {
    console.error('Error initializing notification settings:', error);
    throw error;
  }
};

export const getNotificationSettings = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const settingsRef = doc(db, 'users', user.uid, 'settings', 'notifications');
    const settingsSnap = await getDoc(settingsRef);

    if (settingsSnap.exists()) {
      return settingsSnap.data();
    } else {
      await initializeNotificationSettings();
      return DEFAULT_NOTIFICATION_SETTINGS;
    }
  } catch (error) {
    console.error('Error getting notification settings:', error);
    throw error;
  }
};

export const updateNotificationSettings = async (settings) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const settingsRef = doc(db, 'users', user.uid, 'settings', 'notifications');
    await updateDoc(settingsRef, settings);
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw error;
  }
};

export const registerForPushNotifications = async () => {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C'
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      throw new Error('Failed to get push token for push notification!');
    }

    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId
    })).data;
  } else {
    throw new Error('Must use physical device for Push Notifications');
  }

  return token;
};

export const savePushToken = async (token) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const tokenRef = doc(db, 'users', user.uid, 'settings', 'pushToken');
    await setDoc(tokenRef, { token, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error saving push token:', error);
    throw error;
  }
};

export const scheduleLocalNotification = async (title, body, data = {}, trigger = null) => {
  try {
    const settings = await getNotificationSettings();

    if (!settings.enabled) {
      return '';
    }

    if (trigger) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

      const quietHoursStart = settings.quietHoursStart;
      const quietHoursEnd = settings.quietHoursEnd;

      if (isTimeInRange(currentTime, quietHoursStart, quietHoursEnd)) {
        console.log('Notification scheduled during quiet hours, skipping');
        return '';
      }
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data
      },
      trigger
    });

    await saveNotification({
      title,
      body,
      data,
      type: data.type || 'general',
      scheduledFor: trigger ? new Date().toISOString() : undefined
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
};

export const saveNotification = async (notification) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const notificationsRef = collection(db, 'users', user.uid, 'notifications');
    const docRef = await addDoc(notificationsRef, {
      ...notification,
      userId: user.uid,
      read: false,
      createdAt: new Date().toISOString()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error saving notification:', error);
    throw error;
  }
};

export const getUserNotifications = async (limit = 20, unreadOnly = false) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const notificationsRef = collection(db, 'users', user.uid, 'notifications');
    let q = query(notificationsRef, orderBy('createdAt', 'desc'));

    if (unreadOnly) {
      q = query(q, where('read', '==', false));
    }

    const querySnapshot = await getDocs(q);
    const notifications = [];
    
    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return notifications.slice(0, limit);
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const notificationRef = doc(db, 'users', user.uid, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const generatePersonalizedNotifications = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const settings = await getNotificationSettings();

    if (!settings.enabled) {
      return;
    }

    const analytics = await getFitnessAnalytics();
    const recommendations = await getRecommendations();

    if (settings.workoutReminders) {
      if (analytics.workoutAnalytics.missedWorkoutDays > 2) {
        const workoutRec = recommendations.workoutRecommendations.find(rec => rec.priority === 'high');

        if (workoutRec) {
          await scheduleLocalNotification(
            'Time to get back on track!',
            `You haven't worked out in ${analytics.workoutAnalytics.missedWorkoutDays} days. We have a perfect workout ready for you.`,
            { type: 'workout', recommendationId: workoutRec.title },
            { 
              hour: parseInt(settings.suggestedWorkoutTime.split(':')[0]), 
              minute: parseInt(settings.suggestedWorkoutTime.split(':')[1]), 
              repeats: false 
            }
          );
        }
      }

      if (analytics.workoutAnalytics.leastWorkedMuscleGroups.length > 0) {
        const muscleGroups = analytics.workoutAnalytics.leastWorkedMuscleGroups.slice(0, 2).join(' and ');

        await scheduleLocalNotification(
          'Workout Suggestion',
          `It's been a while since you've trained your ${muscleGroups}. Check out today's recommended workout.`,
          { type: 'workout' },
          { 
            hour: parseInt(settings.suggestedWorkoutTime.split(':')[0]), 
            minute: parseInt(settings.suggestedWorkoutTime.split(':')[1]), 
            repeats: false 
          }
        );
      }
    }

    if (settings.mealReminders) {
      if (!analytics.mealAnalytics.postWorkoutNutrition.adequateProtein &&
          recommendations.mealRecommendations.some(rec => rec.tags.includes('post-workout'))) {

        await scheduleLocalNotification(
          'Post-Workout Nutrition',
          'Don\'t forget to refuel after your workout! We have a protein-rich meal suggestion for you.',
          { type: 'meal', tag: 'post-workout' },
          null
        );
      }

      if (analytics.mealAnalytics.nutritionAdequacy.protein === 'low') {
        const mealRec = recommendations.mealRecommendations.find(rec => rec.tags.includes('high-protein'));

        if (mealRec) {
          await scheduleLocalNotification(
            'Protein Reminder',
            'Your protein intake has been below optimal levels. Check out our high-protein meal suggestions.',
            { type: 'meal', recommendationId: mealRec.title },
            { 
              hour: parseInt(settings.suggestedMealTimes.lunch.split(':')[0]), 
              minute: parseInt(settings.suggestedMealTimes.lunch.split(':')[1]), 
              repeats: false 
            }
          );
        }
      }
    }

    if (settings.progressUpdates) {
      const today = new Date();
      if (today.getDay() === 0) {
        await scheduleLocalNotification(
          'Weekly Progress Summary',
          `You completed ${analytics.workoutAnalytics.totalWorkouts} workouts this week. Check your progress report!`,
          { type: 'progress' },
          { hour: 9, minute: 0, repeats: false }
        );
      }
    }
  } catch (error) {
    console.error('Error generating personalized notifications:', error);
    throw error;
  }
};

const isTimeInRange = (time, start, end) => {
  const timeMinutes = convertTimeToMinutes(time);
  const startMinutes = convertTimeToMinutes(start);
  const endMinutes = convertTimeToMinutes(end);

  if (startMinutes > endMinutes) {
    return timeMinutes >= startMinutes || timeMinutes <= endMinutes;
  } else {
    return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
  }
};

const convertTimeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};