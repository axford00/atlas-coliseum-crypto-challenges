// App.tsx - Real Atlas Coliseum with Navigation & Firebase
// ✅ CRITICAL: Import polyfills FIRST for Solana support
import './src/polyfills';

import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// ✅ Navigation imports
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ✅ SAFE Firebase imports with error handling
let auth = null;
let isFirebaseReady = null;

try {
  const firebaseModule = require('./firebase');
  auth = firebaseModule.auth;
  isFirebaseReady = firebaseModule.isFirebaseReady || (() => false);
  console.log('✅ Firebase module loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Firebase module:', error);
  // Create safe fallback functions
  isFirebaseReady = () => false;
  auth = null;
}

import { onAuthStateChanged, type Auth } from 'firebase/auth';

// ✅ Import your REAL Atlas screens
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import WorkoutScreen from './src/screens/WorkoutScreen';
import MealPlanScreen from './src/screens/MealPlanScreen';
import ChallengesScreen from './src/screens/ChallengesScreen';
import PublicVideosScreen from './src/screens/PublicVideosScreen';
import BuddiesScreen from './src/screens/BuddiesScreen';
import BuddyProfileScreen from './src/screens/BuddyProfileScreen';
import BuddySearchScreen from './src/screens/BuddySearchScreen';
import ChallengeDetailScreen from './src/screens/ChallengeDetailScreen';
import PendingChallengesScreen from './src/screens/PendingChallengesScreen';

// ✅ Atlas Color Scheme
const atlasColors = {
  primary: '#d9a74a',      // Gold/brass
  secondary: '#a06235',    // Copper/bronze
  background: {
    dark: '#1d302c',       // Dark teal/green
    darker: '#0f1a17',     // Even darker shade
  },
  text: {
    primary: '#d9a74a',    // Gold text
    secondary: '#9a8555',  // Softer gold
    light: '#e4c989',      // Lighter gold
  },
  ui: {
    border: '#d9a74a',     // Gold border
    cardBg: 'rgba(15, 26, 23, 0.85)',
    buttonBg: 'rgba(160, 98, 53, 0.9)',
  }
};

// ✅ User type definition
type User = {
  uid: string;
  email?: string | null;
  displayName?: string | null;
} | null;

// ✅ Create the navigation stack
const Stack = createNativeStackNavigator();

// ✅ Atlas Splash Screen
const SplashScreen = () => {
  const [status, setStatus] = useState<string>('Initializing Atlas...');

  useEffect(() => {
    const initializeAtlas = async () => {
      try {
        setStatus('Loading Atlas Systems...');
        
        // ✅ Safe Firebase readiness check
        let firebaseStatus = 'CHECKING...';
        try {
          const ready = isFirebaseReady ? isFirebaseReady() : false;
          firebaseStatus = ready ? 'SUCCESS' : 'LIMITED';
          console.log('🔥 Firebase ready:', firebaseStatus);
        } catch (fbError) {
          console.warn('⚠️ Firebase check error:', fbError);
          firebaseStatus = 'ERROR';
        }
        
        setTimeout(() => {
          setStatus(`🏛️ Atlas Coliseum Ready - 🔥 Firebase ${firebaseStatus}`);
        }, 1000);
        
      } catch (error: any) {
        console.error('❌ Atlas initialization error:', error);
        setStatus('❌ Atlas initialization failed');
      }
    };

    initializeAtlas();
  }, []);

  return (
    <View style={styles.splashContainer}>
      <Text style={styles.splashTitle}>ATLAS COLISEUM</Text>
      <Text style={styles.splashSubtitle}>Crypto Fitness Challenges</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{status}</Text>
        
        <View style={styles.configInfo}>
          <Text style={styles.configText}>🌐 Network: Ready</Text>
          <Text style={styles.configText}>🏦 Atlas Systems: Operational</Text>
          <Text style={styles.configText}>💪 Fitness Challenges: Enabled</Text>
          <Text style={styles.configText}>📋 All Screens: Loaded</Text>
          <Text style={styles.configText}>
            🔥 Firebase: {(() => {
              try {
                return isFirebaseReady && isFirebaseReady() ? '✅ Ready' : '⚠️ Limited';
              } catch {
                return '❌ Error';
              }
            })()}
          </Text>
          <Text style={styles.configText}>🚀 Fresh Infrastructure: ✅ Working</Text>
          <Text style={styles.configText}>⚡ Solana Polyfills: ✅ Loaded</Text>
        </View>
      </View>
      
      <Text style={styles.loadingText}>Loading Atlas Systems...</Text>
    </View>
  );
};

// ✅ Auth Navigation Stack
const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: atlasColors.background.dark }
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// ✅ Main App Navigation Stack - ALL YOUR REAL SCREENS
const AppStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: atlasColors.background.dark }
    }}
  >
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
    <Stack.Screen name="Workout" component={WorkoutScreen} />
    <Stack.Screen name="MealPlans" component={MealPlanScreen} />
    <Stack.Screen name="ChallengesScreen" component={ChallengesScreen} />
    <Stack.Screen name="ChallengeDetail" component={ChallengeDetailScreen} />
    <Stack.Screen 
      name="PendingChallenges" 
      component={PendingChallengesScreen}
      options={{ 
        headerShown: false,
        title: 'Pending Challenges',
        animation: 'slide_from_right'
      }}
    />
    <Stack.Screen name="PublicVideosScreen" component={PublicVideosScreen} />
    <Stack.Screen name="BuddiesScreen" component={BuddiesScreen} />
    <Stack.Screen name="BuddyProfileScreen" component={BuddyProfileScreen} />
    <Stack.Screen name="BuddySearchScreen" component={BuddySearchScreen} />
  </Stack.Navigator>
);

// ✅ Main App Component
const App = () => {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    console.log('🚀 Atlas Coliseum - Real App Starting!');
    console.log('✅ All screens imported successfully');
    console.log('✅ Navigation system ready');
    console.log('✅ Fresh infrastructure stable');
    console.log('⚡ Solana polyfills loaded');
    
    // ✅ Safe Firebase readiness check
    let firebaseReadyStatus = false;
    try {
      firebaseReadyStatus = isFirebaseReady ? isFirebaseReady() : false;
      console.log('  - Firebase ready:', firebaseReadyStatus);
    } catch (fbError) {
      console.log('  - Firebase check error:', fbError);
    }
    
    // ✅ Safe Firebase auth state listener
    let unsubscribe: (() => void) | null = null;
    
    const setupAuthListener = () => {
      if (!auth) {
        console.warn('⚠️ Firebase auth not available, continuing with limited functionality...');
        setIsLoading(false);
        return;
      }
      
      try {
        const safeAuth = auth as Auth;
        
        unsubscribe = onAuthStateChanged(safeAuth, (authUser) => {
          console.log('🔐 Auth state changed:', authUser ? `Logged in as ${authUser.email}` : 'Logged out');
          setUser(authUser);
          setIsLoading(false);
        });
        
        console.log('✅ Firebase auth listener setup successfully');
        
      } catch (error) {
        console.error('❌ Failed to setup auth listener:', error);
        setIsLoading(false);
      }
    };
    
    setupAuthListener();

    // ✅ Hide splash screen after 2.5 seconds
    const splashTimer = setTimeout(() => {
      console.log('✅ Splash screen timeout - showing main app');
      setShowSplash(false);
    }, 2500);

    console.log('🏆 Atlas Coliseum: Ready for Solana Hackathon!');

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      clearTimeout(splashTimer);
    };
  }, []);

  // ✅ Show splash screen
  if (showSplash) {
    return <SplashScreen />;
  }

  // ✅ Show loading while checking auth
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={atlasColors.background.dark} />
        <View style={styles.loadingContent}>
          <Text style={styles.loadingTitle}>ATLAS COLISEUM</Text>
          <Text style={styles.loadingText}>Authenticating Atlas User...</Text>
          <Text style={styles.loadingSubtext}>
            Firebase: {(() => {
              try {
                return isFirebaseReady && isFirebaseReady() ? '🔥 Connected' : '⚠️ Limited Mode';
              } catch {
                return '❌ Error';
              }
            })()}
          </Text>
          <Text style={styles.loadingSubtext}>
            All Screens: 📋 Loaded and ready
          </Text>
          <Text style={styles.loadingSubtext}>
            Solana Support: ⚡ Ready for crypto challenges
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ Main app with real navigation
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={atlasColors.background.dark}
      />
      
      <NavigationContainer>
        {user ? <AppStack /> : <AuthStack />}
      </NavigationContainer>
    </SafeAreaView>
  );
};

// ✅ Atlas-themed styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: atlasColors.background.dark,
  },
  
  splashContainer: {
    flex: 1,
    backgroundColor: atlasColors.background.dark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  splashTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: atlasColors.primary,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 2,
  },
  splashSubtitle: {
    fontSize: 18,
    color: atlasColors.text.secondary,
    marginBottom: 40,
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: atlasColors.ui.cardBg,
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: atlasColors.ui.border,
  },
  statusText: {
    fontSize: 16,
    color: atlasColors.primary,
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: 'bold',
  },
  configInfo: {
    gap: 6,
  },
  configText: {
    fontSize: 11,
    color: atlasColors.text.light,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  
  loadingContainer: {
    flex: 1,
    backgroundColor: atlasColors.background.dark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: atlasColors.primary,
    marginBottom: 20,
    letterSpacing: 1,
  },
  loadingText: {
    fontSize: 16,
    color: atlasColors.text.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 12,
    color: atlasColors.text.light,
    textAlign: 'center',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});

export default App;