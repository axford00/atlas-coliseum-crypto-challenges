// RegisterScreen.js - FIXED VERSION with TextInput focus handling
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { auth, db } from '../../firebase';
import FalloutButton from '../components/ui/FalloutButton';
import { colors, globalStyles } from '../theme/colors';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const formatPhoneNumber = (phone) => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Add country code if missing (assuming US)
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    return cleaned;
  };

  const validateInputs = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return false;
    }
    
    if (!displayName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return false;
    }
    
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return false;
    }
    
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleRegister = async () => {
    if (!validateInputs()) return;
    
    setLoading(true);
    try {
      console.log('Creating user account...');
      
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      console.log('User created, updating profile...');
      
      // Update user profile
      await updateProfile(user, {
        displayName: displayName.trim()
      });
      
      console.log('Creating user document...');
      
      // Format phone number
      const formattedPhone = formatPhoneNumber(phoneNumber.trim());
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: email.trim().toLowerCase(),
        displayName: displayName.trim(),
        phone: formattedPhone,
        phoneRaw: phoneNumber.trim(), // Keep original format too
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profileComplete: false,
        // Default fitness data
        currentStreak: 0,
        totalWorkouts: 0,
        fitnessGoals: '',
        workoutsPerWeek: 3,
        experience: 'beginner'
      });
      
      console.log('Registration successful!');
      Alert.alert(
        'Success!', 
        'Account created successfully! Welcome to Atlas Fitness!',
        [{ text: 'OK', onPress: () => navigation.replace('Home') }]
      );
      
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Failed to create account';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Try logging in instead.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      }
      
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.background}>
      <View style={styles.container}>
        <View style={globalStyles.hudCorner1} />
        <View style={globalStyles.hudCorner2} />
        <View style={globalStyles.hudCorner3} />
        <View style={globalStyles.hudCorner4} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <Text style={styles.title}>JOIN ATLAS FITNESS</Text>
              <Text style={styles.subtitle}>VAULT-TEC REGISTRATION PROTOCOL</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>DISPLAY NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.text.secondary}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  blurOnSubmit={false}
                  keyboardShouldPersistTaps="handled"
                  returnKeyType="next"
                  textContentType="name"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.text.secondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  blurOnSubmit={false}
                  keyboardShouldPersistTaps="handled"
                  returnKeyType="next"
                  textContentType="emailAddress"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>PHONE NUMBER</Text>
                <TextInput
                  style={styles.input}
                  placeholder="(555) 123-4567"
                  placeholderTextColor={colors.text.secondary}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  autoCorrect={false}
                  blurOnSubmit={false}
                  keyboardShouldPersistTaps="handled"
                  returnKeyType="next"
                  textContentType="telephoneNumber"
                />
                <Text style={styles.helperText}>
                  This helps your friends find you as a workout buddy
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Create a secure password"
                  placeholderTextColor={colors.text.secondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  blurOnSubmit={false}
                  keyboardShouldPersistTaps="handled"
                  returnKeyType="next"
                  textContentType="newPassword"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>CONFIRM PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.text.secondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  blurOnSubmit={false}
                  keyboardShouldPersistTaps="handled"
                  returnKeyType="done"
                  textContentType="newPassword"
                />
              </View>

              <FalloutButton
                text={loading ? "CREATING ACCOUNT..." : "REGISTER"}
                onPress={handleRegister}
                style={styles.registerButton}
                isLoading={loading}
              />

              <FalloutButton
                text="ALREADY HAVE AN ACCOUNT? LOGIN"
                onPress={() => navigation.navigate('Login')}
                style={styles.loginButton}
                type="secondary"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: colors.text.light,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.ui.inputBg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: 5,
    color: colors.text.primary,
    padding: 15,
    fontSize: 16,
  },
  helperText: {
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 5,
    fontStyle: 'italic',
  },
  registerButton: {
    marginTop: 20,
    marginBottom: 15,
  },
  loginButton: {
    marginTop: 10,
  },
});

export default RegisterScreen;