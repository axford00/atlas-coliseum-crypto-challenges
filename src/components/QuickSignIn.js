// QuickSignIn.js - Updated with navigation to RegisterScreen
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { colors, globalStyles } from '../theme/colors';
import FalloutButton from '../components/ui/FalloutButton';

const QuickSignIn = ({ navigation }) => {
  const [email, setEmail] = useState('test@atlascoliseum.com');
  const [password, setPassword] = useState('testpass123');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      console.log('✅ Signed in successfully');
    } catch (error) {
      console.log('❌ Sign in failed:', error.message);
      
      let errorMessage = 'Sign in failed. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later';
          break;
        default:
          errorMessage = 'Sign in failed. Please try again.';
      }
      
      Alert.alert('Sign In Failed', errorMessage);
    }
    setLoading(false);
  };

  const handleCreateAccount = () => {
    navigation.navigate('Register');
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
          <Text style={styles.title}>ATLAS COLISEUM CRYPTO</Text>
          <Text style={styles.subtitle}>VAULT-TEC AUTHENTICATION PROTOCOL</Text>
          
          <View style={styles.formContainer}>
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
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={colors.text.secondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            <FalloutButton
              text={loading ? "AUTHENTICATING..." : "SIGN IN"}
              onPress={handleSignIn}
              style={styles.signInButton}
              isLoading={loading}
            />
            
            <FalloutButton
              text="CREATE NEW ACCOUNT"
              onPress={handleCreateAccount}
              style={styles.createButton}
              type="secondary"
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
    backgroundColor: colors.background.dark,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
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
  formContainer: {
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.primary,
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
  signInButton: {
    marginTop: 10,
    marginBottom: 15,
  },
  createButton: {
    marginTop: 5,
  },
});

export default QuickSignIn;