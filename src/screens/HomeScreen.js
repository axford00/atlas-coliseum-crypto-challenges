import { getAuth, signOut } from 'firebase/auth';
import { StyleSheet, Text, View } from 'react-native';
import FalloutButton from '../components/ui/FalloutButton';
import { colors, globalStyles } from '../theme/colors';

const HomeScreen = ({ navigation }) => {
  const auth = getAuth();
  
  const handleSignOut = () => {
    signOut(auth)
      .then(() => {
        console.log('User signed out');
        // Auth listener will handle navigation
      })
      .catch((error) => {
        console.error('Sign out error:', error);
      });
  };

  return (
    <View style={styles.background}>
      <View style={styles.container}>
        {/* HUD-style corners */}
        <View style={globalStyles.hudCorner1} />
        <View style={globalStyles.hudCorner2} />
        <View style={globalStyles.hudCorner3} />
        <View style={globalStyles.hudCorner4} />
        
        <View style={styles.content}>
          <Text style={styles.title}>WELCOME TO ATLAS FITNESS</Text>
          
          <View style={styles.buttonContainer}>
            <FalloutButton
              text="🏛️ THE COLISEUM"
              onPress={() => navigation.navigate('PublicVideosScreen')}
              style={styles.button}
            />
            
            <FalloutButton
              text="PROFILE"
              onPress={() => navigation.navigate('Profile')}
              style={styles.button}
            />
            
            <FalloutButton
              text="WORKOUTS"
              onPress={() => navigation.navigate('Workout')}
              style={styles.button}
            />
            
            <FalloutButton
              text="⚡ CHALLENGES"
              onPress={() => navigation.navigate('ChallengesScreen')}
              style={styles.button}
            />
            
            <FalloutButton
              text="🏋️ WORKOUT BUDDIES"
              onPress={() => navigation.navigate('BuddiesScreen')}
              style={styles.button}
            />
            
            <FalloutButton
              text="MEAL PLANS"
              onPress={() => navigation.navigate('MealPlans')}
              style={styles.button}
            />
            
            <FalloutButton
              text="SIGN OUT"
              onPress={handleSignOut}
              style={[styles.button, styles.signOutButton]}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.background.dark, // Using solid color instead of ImageBackground
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 30,
    letterSpacing: 2,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  button: {
    marginBottom: 15,
  },
  signOutButton: {
    marginTop: 20,
  }
});

export default HomeScreen;