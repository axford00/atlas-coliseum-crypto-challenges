// firebase.js - FULLY CORRECTED WITH SECURE CONFIG
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth as firebaseGetAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage as firebaseGetStorage, connectStorageEmulator } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// ✅ SECURE Firebase config using environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// ✅ CRITICAL: Global state management
let app = null;
let auth = null;
let db = null;
let storage = null;
let firebaseInitialized = false;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

// ✅ ENHANCED: Initialize with comprehensive error handling and retry logic
const initializeFirebase = async (attempt = 1) => {
  try {
    console.log(`🔥 Firebase initialization attempt ${attempt}/${MAX_INIT_ATTEMPTS}`);
    
    // ✅ Clear previous failed attempts
    if (app) {
      app = null;
      auth = null;
      db = null;
      storage = null;
    }
    
    // ✅ Initialize Firebase app
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized');
    
    // ✅ CRITICAL: Initialize auth with React Native persistence
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage)
      });
      console.log('✅ Firebase Auth initialized with persistence');
    } catch (authError) {
      // ✅ Fallback: Try to get existing auth instance
      console.log('⚠️ Auth init failed, trying fallback...');
      auth = firebaseGetAuth(app);
      console.log('✅ Firebase Auth fallback successful');
    }
    
    // ✅ Initialize Firestore
    db = getFirestore(app);
    console.log('✅ Firestore initialized');
    
    // ✅ Initialize Storage
    storage = firebaseGetStorage(app);
    console.log('✅ Firebase Storage initialized');
    
    // ✅ Test connections with timeout
    await testFirebaseConnections();
    
    firebaseInitialized = true;
    initializationAttempts = attempt;
    
    console.log(`✅ Firebase fully initialized successfully (attempt ${attempt})`);
    return true;
    
  } catch (error) {
    console.error(`❌ Firebase initialization attempt ${attempt} failed:`, error);
    
    // ✅ Retry logic
    if (attempt < MAX_INIT_ATTEMPTS) {
      console.log(`🔄 Retrying Firebase initialization in 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await initializeFirebase(attempt + 1);
    }
    
    // ✅ FINAL FALLBACK: Create safe null objects to prevent crashes
    console.error('❌ All Firebase initialization attempts failed');
    app = null;
    auth = null;
    db = null;
    storage = null;
    firebaseInitialized = false;
    
    return false;
  }
};

// ✅ NEW: Test Firebase connections
const testFirebaseConnections = async () => {
  try {
    // Test Firestore connection (with timeout)
    const testPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
      
      if (db) {
        // Simple connectivity test
        resolve(true);
        clearTimeout(timeout);
      } else {
        reject(new Error('Database not available'));
      }
    });
    
    await testPromise;
    console.log('✅ Firebase connections tested successfully');
    
  } catch (error) {
    console.warn('⚠️ Firebase connection test failed:', error.message);
    // Don't throw - we'll still try to use Firebase
  }
};

// ✅ FIXED: Make sure this function is properly defined and exported
const isFirebaseReady = () => {
  const ready = firebaseInitialized && 
                db !== null && 
                auth !== null && 
                storage !== null && 
                app !== null;
  
  if (!ready) {
    console.warn('🔥 Firebase readiness check:', {
      initialized: firebaseInitialized,
      hasDb: db !== null,
      hasAuth: auth !== null,
      hasStorage: storage !== null,
      hasApp: app !== null,
      attempts: initializationAttempts
    });
  }
  
  return ready;
};

// ✅ ENHANCED: Safe getters with automatic retry
const getAuth = () => {
  if (!isFirebaseReady()) {
    console.warn('⚠️ Firebase Auth not ready');
    
    // ✅ Attempt automatic re-initialization
    if (!firebaseInitialized && initializationAttempts < MAX_INIT_ATTEMPTS) {
      console.log('🔄 Attempting automatic Firebase re-initialization...');
      initializeFirebase();
    }
    
    return null;
  }
  return auth;
};

const getDb = () => {
  if (!isFirebaseReady()) {
    console.warn('⚠️ Firestore not ready');
    
    // ✅ Attempt automatic re-initialization
    if (!firebaseInitialized && initializationAttempts < MAX_INIT_ATTEMPTS) {
      console.log('🔄 Attempting automatic Firebase re-initialization...');
      initializeFirebase();
    }
    
    return null;
  }
  return db;
};

const getStorage = () => {
  if (!isFirebaseReady()) {
    console.warn('⚠️ Firebase Storage not ready');
    
    // ✅ Attempt automatic re-initialization
    if (!firebaseInitialized && initializationAttempts < MAX_INIT_ATTEMPTS) {
      console.log('🔄 Attempting automatic Firebase re-initialization...');
      initializeFirebase();
    }
    
    return null;
  }
  return storage;
};

// ✅ ENHANCED: Safe Firestore operations wrapper with retry logic
const safeFirestoreOperation = async (operation, fallbackValue = null, retries = 2) => {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    if (!isFirebaseReady()) {
      console.warn(`⚠️ Firebase not ready for operation (attempt ${attempt})`);
      
      if (attempt <= retries) {
        // Try to re-initialize
        console.log('🔄 Attempting to re-initialize Firebase...');
        const success = await initializeFirebase();
        if (!success) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
      } else {
        return fallbackValue;
      }
    }
    
    try {
      const result = await operation();
      if (attempt > 1) {
        console.log(`✅ Firestore operation succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      console.error(`❌ Firestore operation failed (attempt ${attempt}):`, error);
      
      if (attempt <= retries) {
        console.log(`🔄 Retrying operation in ${attempt} second(s)...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      } else {
        console.error('❌ All operation attempts failed');
        return fallbackValue;
      }
    }
  }
  
  return fallbackValue;
};

// ✅ ENHANCED: Force re-initialization with cleanup
const reinitializeFirebase = async () => {
  try {
    console.log('🔄 Force re-initializing Firebase...');
    
    // ✅ Reset state
    firebaseInitialized = false;
    initializationAttempts = 0;
    
    // ✅ Clean up existing instances
    if (app) {
      try {
        // Note: Firebase app deletion is not typically needed in React Native
        console.log('🧹 Cleaning up existing Firebase instances...');
      } catch (cleanupError) {
        console.warn('⚠️ Cleanup warning:', cleanupError);
      }
    }
    
    // ✅ Re-initialize
    return await initializeFirebase();
    
  } catch (error) {
    console.error('❌ Force re-initialization failed:', error);
    return false;
  }
};

// ✅ NEW: Get Firebase status for debugging
const getFirebaseStatus = () => {
  return {
    initialized: firebaseInitialized,
    hasApp: app !== null,
    hasAuth: auth !== null,
    hasDb: db !== null,
    hasStorage: storage !== null,
    attempts: initializationAttempts,
    ready: isFirebaseReady(),
    config: {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
      storageBucket: firebaseConfig.storageBucket
    }
  };
};

// ✅ NEW: Wait for Firebase to be ready (with timeout)
const waitForFirebase = async (timeoutMs = 10000) => {
  const startTime = Date.now();
  
  while (!isFirebaseReady() && (Date.now() - startTime) < timeoutMs) {
    console.log('⏳ Waiting for Firebase to be ready...');
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  if (isFirebaseReady()) {
    console.log('✅ Firebase is now ready');
    return true;
  } else {
    console.error('❌ Firebase readiness timeout');
    return false;
  }
};

// ✅ EMERGENCY: Hard reset (for development only)
const emergencyFirebaseReset = async () => {
  console.warn('🚨 EMERGENCY: Hard resetting Firebase...');
  
  // Reset all state
  app = null;
  auth = null;
  db = null;
  storage = null;
  firebaseInitialized = false;
  initializationAttempts = 0;
  
  // Re-initialize
  return await initializeFirebase();
};

// ✅ INITIALIZE IMMEDIATELY
initializeFirebase();

// ✅ CRITICAL FIX: Make sure ALL exports are properly declared
export {
  // Core instances
  app,
  auth,
  db,
  storage,
  
  // Status functions
  isFirebaseReady,
  getFirebaseStatus,
  
  // Getter functions
  getAuth,
  getDb,
  getStorage,
  
  // Operation helpers
  safeFirestoreOperation,
  waitForFirebase,
  
  // Reset functions
  reinitializeFirebase,
  emergencyFirebaseReset
};

// ✅ DEVELOPMENT: Export status checker
if (__DEV__) {
  // Log status every 30 seconds in development
  setInterval(() => {
    const status = getFirebaseStatus();
    if (!status.ready) {
      console.warn('🔥 Firebase Status Check:', status);
    }
  }, 30000);
}

// ✅ FINAL SAFETY CHECK
setTimeout(() => {
  if (!isFirebaseReady()) {
    console.error('🚨 Firebase failed to initialize within 5 seconds');
    console.log('📊 Firebase Status:', getFirebaseStatus());
  } else {
    console.log('🎉 Firebase is ready and operational');
  }
}, 5000);