// LoginScreen.js - FIXED IMAGE LOADING with fallback
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth } from '../../firebase';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Refs for focusing between inputs
  const passwordRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(height)).current;

  const showLoginForm = () => {
    setShowLoginModal(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideLoginForm = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowLoginModal(false);
      setError('');
    });
  };

  const handleLogin = async () => {
    setError('');
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      console.log('Login successful');
      hideLoginForm();
    } catch (error) {
      console.error('Login error details:', error.code, error.message);

      let errorMessage = 'Login failed. Please try again.';

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
          errorMessage = 'Login failed. Please try again.';
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = () => {
    navigation.navigate('Register');
  };

  // Handle image loading error
  const handleImageError = (error) => {
    console.log('❌ Background image failed to load:', error);
    setImageError(true);
  };

  // Fallback background style if image fails
  const fallbackBackground = {
    flex: 1,
    backgroundColor: '#1a1a1a', // Dark Atlas-style background
    backgroundImage: 'linear-gradient(135deg, #2C1810 0%, #1a1a1a 100%)', // Fallback gradient
  };

  const BackgroundComponent = imageError ? View : ImageBackground;
  const backgroundProps = imageError 
    ? { style: [styles.background, fallbackBackground] }
    : { 
        source: require('../../assets/atlas-login-background.jpg'),
        style: styles.background,
        resizeMode: "cover",
        onError: handleImageError
      };

  return (
    <BackgroundComponent {...backgroundProps}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          
          {/* Atlas title overlay - visible even if image fails */}
          <View style={styles.titleOverlay}>
            <Text style={styles.atlasTitle}>ATLAS FITNESS</Text>
            <Text style={styles.atlasSubtitle}>VAULT-TEC LOGIN PROTOCOL</Text>
            {imageError && (
              <Text style={styles.imageErrorText}>
                (Background image loading - functionality ready)
              </Text>
            )}
          </View>
          
          {/* Invisible overlay buttons for background interaction */}
          <View style={styles.invisibleButtonsContainer}>
            
            {/* Email input area - invisible but clickable */}
            <TouchableOpacity
              style={styles.invisibleEmailButton}
              onPress={showLoginForm}
              activeOpacity={1}
            />

            {/* Password input area - invisible but clickable */}
            <TouchableOpacity
              style={styles.invisiblePasswordButton}
              onPress={showLoginForm}
              activeOpacity={1}
            />

            {/* Login button - invisible but clickable */}
            <TouchableOpacity
              style={styles.invisibleLoginButton}
              onPress={showLoginForm}
              activeOpacity={1}
            />

            {/* Create account button - enhanced visibility */}
            <TouchableOpacity
              style={styles.invisibleCreateButton}
              onPress={handleCreateAccount}
              activeOpacity={1}
            />

          </View>

        </View>

        {/* Login Modal */}
        <Modal
          visible={showLoginModal}
          transparent={true}
          animationType="none"
          onRequestClose={hideLoginForm}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity 
              style={styles.modalBackdrop} 
              onPress={hideLoginForm}
              activeOpacity={1}
            />
            
            <Animated.View 
              style={[
                styles.loginModal,
                {
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Login to Atlas</Text>
                <TouchableOpacity onPress={hideLoginForm}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  keyboardShouldPersistTaps="handled"
                  placeholderTextColor="#999"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  returnKeyType="done"
                  blurOnSubmit={false}
                  keyboardShouldPersistTaps="handled"
                  onSubmitEditing={handleLogin}
                  placeholderTextColor="#999"
                />
              </View>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.createAccountButton}
                onPress={handleCreateAccount}
                disabled={isLoading}
              >
                <Text style={styles.createAccountText}>Create New Account</Text>
              </TouchableOpacity>

            </Animated.View>
          </View>
        </Modal>

      </KeyboardAvoidingView>
    </BackgroundComponent>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  
  // NEW: Title overlay for branding
  titleOverlay: {
    position: 'absolute',
    top: height * 0.15,
    left: width * 0.05,
    right: width * 0.05,
    alignItems: 'center',
    zIndex: 1,
  },
  atlasTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    letterSpacing: 3,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  atlasSubtitle: {
    fontSize: 14,
    color: '#FFD700',
    textAlign: 'center',
    letterSpacing: 2,
    marginTop: 8,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  imageErrorText: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
  },
  
  invisibleButtonsContainer: {
    position: 'absolute',
    top: height * 0.68,
    left: width * 0.05,
    right: width * 0.05,
    height: height * 0.25,
  },
  invisibleEmailButton: {
    height: 40,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  invisiblePasswordButton: {
    height: 40,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  invisibleLoginButton: {
    height: 45,
    marginTop: 15,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  invisibleCreateButton: {
    height: 40,
    backgroundColor: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  loginModal: {
    backgroundColor: '#2C1810',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    minHeight: height * 0.5,
    borderTopWidth: 3,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#FFD700',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  closeButton: {
    fontSize: 24,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: 'rgba(139, 69, 19, 0.3)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  errorText: {
    color: '#FFD700',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#FFF',
  },
  loginButton: {
    height: 50,
    backgroundColor: '#8B4513',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  loginButtonText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  createAccountButton: {
    height: 45,
    backgroundColor: 'transparent',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  createAccountText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;