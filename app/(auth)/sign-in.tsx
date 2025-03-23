import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  ImageBackground,
  Dimensions, 
  KeyboardAvoidingView, 
  Platform,
  Animated,
  Easing,
  Pressable,
  ScrollView
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ErrorMessage } from '@/components/ErrorMessage';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Heart, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Stethoscope,
  LogIn,
  ArrowRight
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, isLoading, error } = useAuthStore();
  const router = useRouter();

  // Animation values
  const logoScale = new Animated.Value(0.8);
  const logoOpacity = new Animated.Value(0);
  const formTranslateY = new Animated.Value(30);
  const formOpacity = new Animated.Value(0);
  const buttonScale = new Animated.Value(0.95);
  const buttonOpacity = new Animated.Value(0);

  useEffect(() => {
    // Sequence of animations
    Animated.sequence([
      // First animate the logo
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
      ]),
      // Then animate the form
      Animated.parallel([
        Animated.timing(formTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
      ]),
      // Then animate the button
      Animated.parallel([
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.elastic(1),
        }),
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      useAuthStore.setState({ error: "Email and password are required" });
      return;
    }

    console.log("Attempting to sign in with:", email);
    const success = await signIn(email, password);
    console.log("Sign in result:", success);
    
    if (success) {
      // Navigate directly to the home tab
      router.replace('/(tabs)/home');
    }
  };

  // Heart pulse animation
  const heartScale = new Animated.Value(1);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartScale, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(heartScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, []);

  if (isLoading) {
    return <LoadingOverlay message="Signing in..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <LinearGradient
        colors={['#093474', '#0066CC']}
        style={styles.headerBackground}
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          {/* Top Logo Section */}
          <Animated.View 
            style={[
              styles.logoSection,
              { 
                opacity: logoOpacity,
                transform: [{ scale: logoScale }] 
              }
            ]}
          >
            <View style={styles.logoContainer}>
              <Animated.View 
                style={[
                  styles.heartContainer,
                  { transform: [{ scale: heartScale }] }
                ]}
              >
                <Heart size={24} color="#fff" fill="#fff" />
              </Animated.View>
              <View style={styles.stethoscopeContainer}>
                <Stethoscope size={32} color="#fff" />
              </View>
            </View>
            <Text style={styles.appName}>MEDICO</Text>
            <Text style={styles.appTagline}>Where Healthcare Connects</Text>
          </Animated.View>
          
          {/* Form Section */}
          <Animated.View 
            style={[
              styles.formSection,
              {
                opacity: formOpacity,
                transform: [{ translateY: formTranslateY }]
              }
            ]}
          >
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.welcomeSubtext}>Sign in to your medical network</Text>
            
            {error && (
              <ErrorMessage 
                message={error} 
                onDismiss={() => useAuthStore.setState({ error: null })}
              />
            )}
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputContainer}>
                <Mail size={20} color="#0066CC" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Your professional email"
                  placeholderTextColor="#A3A3A3"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <View style={styles.passwordHeader}>
                <Text style={styles.inputLabel}>Password</Text>
                <TouchableOpacity>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputContainer}>
                <Lock size={20} color="#0066CC" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Your secure password"
                  placeholderTextColor="#A3A3A3"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  style={styles.visibilityToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 
                    <EyeOff size={20} color="#0066CC" /> : 
                    <Eye size={20} color="#0066CC" />
                  }
                </TouchableOpacity>
              </View>
            </View>
            
            <Animated.View style={{ 
              opacity: buttonOpacity, 
              transform: [{ scale: buttonScale }],
              width: '100%'
            }}>
              <TouchableOpacity 
                style={styles.signInButton} 
                onPress={handleSignIn}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#0066CC', '#0091ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.signInButtonText}>Sign In</Text>
                  <View style={styles.arrowContainer}>
                    <ArrowRight size={18} color="#fff" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
            
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.divider} />
            </View>
            
            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity style={styles.socialButton}>
                <ImageBackground
                  source={{ uri: 'https://www.freepnglogos.com/uploads/google-logo-png/google-logo-png-suite-everything-you-need-know-about-google-newest-0.png' }}
                  style={styles.socialIcon}
                  imageStyle={{ borderRadius: 8 }}
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.socialButton}>
                <ImageBackground
                  source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/1667px-Apple_logo_black.svg.png' }}
                  style={styles.socialIcon}
                  imageStyle={{ borderRadius: 8 }}
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.socialButton}>
                <ImageBackground
                  source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/640px-LinkedIn_logo_initials.png' }}
                  style={styles.socialIcon}
                  imageStyle={{ borderRadius: 8 }}
                />
              </TouchableOpacity>
            </View>
          </Animated.View>
          
          {/* Sign Up Section */}
          <View style={styles.signUpSection}>
            <Text style={styles.signUpText}>Don't have an account?</Text>
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity>
                <Text style={styles.signUpLink}>Create Account</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>

      {/* Medical pattern overlay */}
      <View style={styles.patternContainer}>
        <View style={styles.patternDot} />
        <View style={styles.patternCircle} />
        <View style={styles.patternSquare} />
        <View style={[styles.patternDot, styles.patternDot2]} />
        <View style={[styles.patternCircle, styles.patternCircle2]} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.35,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  logoSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: height * 0.06,
    marginBottom: 30,
  },
  logoContainer: {
    width: 90,
    height: 90,
    marginBottom: 20,
    position: 'relative',
  },
  heartContainer: {
    position: 'absolute',
    width: 50,
    height: 50,
    backgroundColor: '#ff6b6b',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
    left: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  stethoscopeContainer: {
    position: 'absolute',
    width: 64,
    height: 64,
    backgroundColor: '#0091ff',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  appName: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appTagline: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
    opacity: 0.9,
  },
  formSection: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginTop: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#64748b',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
    width: '100%',
  },
  inputLabel: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#334155',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 56,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#334155',
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
  },
  visibilityToggle: {
    padding: 4,
  },
  signInButton: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#0066CC',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  signInButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#ffffff',
    marginRight: 8,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#64748b',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 20,
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  socialIcon: {
    width: 28,
    height: 28,
  },
  signUpSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  signUpText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#64748b',
    marginRight: 4,
  },
  signUpLink: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#0066CC',
  },
  patternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    overflow: 'hidden',
  },
  patternDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0066CC',
    opacity: 0.1,
    top: height * 0.15,
    right: 20,
  },
  patternDot2: {
    top: height * 0.85,
    left: 30,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  patternCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 10,
    borderColor: 'rgba(0, 102, 204, 0.08)',
    top: height * 0.25,
    left: -30,
  },
  patternCircle2: {
    width: 140,
    height: 140,
    borderRadius: 70,
    top: height * 0.65,
    right: -40,
  },
  patternSquare: {
    position: 'absolute',
    width: 40,
    height: 40,
    transform: [{ rotate: '45deg' }],
    backgroundColor: 'rgba(0, 145, 255, 0.08)',
    bottom: height * 0.3,
    right: 40,
  },
});