import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView,
  KeyboardAvoidingView, 
  Platform,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ErrorMessage } from '@/components/ErrorMessage';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
import GoogleLogo from '@/assets/images/GoogleLogo';

const { width, height } = Dimensions.get('window');

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signInWithGoogle, isLoading, error } = useAuthStore();
  const router = useRouter();

  // Nav functions
  const navigateToSignUp = () => {
    router.replace('/sign-up');
  };

  // Animation values
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(30)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.95)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  
  // Background animations
  const circlePulse1 = useRef(new Animated.Value(1)).current;
  const circlePulse2 = useRef(new Animated.Value(1)).current;
  const circleOpacity1 = useRef(new Animated.Value(0.3)).current;
  const circleOpacity2 = useRef(new Animated.Value(0.2)).current;
  
  // Logo animations
  const heartScale = useRef(new Animated.Value(1)).current;
  const stethoscopeRotation = useRef(new Animated.Value(0)).current;
  
  // Text animations
  const textSlideLeft = useRef(new Animated.Value(-20)).current;
  const textSlideRight = useRef(new Animated.Value(-20)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence animations
    Animated.sequence([
      // First animate the logo
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(2)),
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      
      // Then animate the text
      Animated.parallel([
        Animated.timing(textSlideLeft, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(textSlideRight, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      
      // Then animate the form
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(formTranslateY, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]),
      
      // Finally animate the buttons
      Animated.parallel([
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(3)),
        }),
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Background animations
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(circlePulse1, {
            toValue: 1.3,
            duration: 8000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.sin),
          }),
          Animated.timing(circleOpacity1, {
            toValue: 0.1,
            duration: 8000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(circlePulse1, {
            toValue: 1,
            duration: 8000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.sin),
          }),
          Animated.timing(circleOpacity1, {
            toValue: 0.3,
            duration: 8000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(circlePulse2, {
            toValue: 1.5,
            duration: 10000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.sin),
          }),
          Animated.timing(circleOpacity2, {
            toValue: 0.1,
            duration: 10000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(circlePulse2, {
            toValue: 1,
            duration: 10000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.sin),
          }),
          Animated.timing(circleOpacity2, {
            toValue: 0.2,
            duration: 10000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Heart pulse animation
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
        Animated.delay(1000),
      ])
    ).start();
    
    // Stethoscope subtle rotation
    Animated.loop(
      Animated.sequence([
        Animated.timing(stethoscopeRotation, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.cubic),
        }),
        Animated.timing(stethoscopeRotation, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.cubic),
        }),
      ])
    ).start();
  }, []);

  const stethoscopeRotate = stethoscopeRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['-5deg', '5deg'],
  });

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      useAuthStore.setState({ error: "Email and password are required" });
      return;
    }
    
    try {
      const success = await signIn(email, password);
      
      if (success) {
        setTimeout(() => {
          router.replace('/home');
        }, 500);
      }
    } catch (error) {
      console.error("Error during sign in:", error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      console.log("Starting Google sign-in process...");
      // Clear any existing error
      useAuthStore.setState({ error: null });
      
      // Show detailed status to the user during the sign-in process
      const statusUpdateCallback = (status: string) => {
        console.log(`Google Sign-In Status: ${status}`);
      };
      
      statusUpdateCallback("Initializing Google Sign-In...");
      
      // Try to sign in with Google
      const success = await signInWithGoogle();
      
      if (success) {
        statusUpdateCallback("Authentication successful! Redirecting...");
        setTimeout(() => {
          router.replace('/home');
        }, 500);
      } else {
        console.warn("Google sign-in returned false without throwing an error");
        // If we get here without an error but with false success, it means something went wrong
        // but we can't determine what exactly
        useAuthStore.setState({ 
          error: "Sign in with Google failed. Please try again."
        });
      }
    } catch (error) {
      console.error("Error during Google sign in:", error);
      
      // Provide a user-friendly error message based on the error
      let errorMessage = "Sign in with Google failed. Please try again.";
      
      if (error instanceof Error) {
        // Check for specific error messages
        if (error.message.includes('cancelled')) {
          errorMessage = "Google sign-in was cancelled.";
        } else if (error.message.includes('flow state')) {
          errorMessage = "Authentication error. Please try again with a fresh session.";
        } else if (error.message.includes('network')) {
          errorMessage = "Network error. Please check your internet connection.";
        }
      }
      
      useAuthStore.setState({ error: errorMessage });
    }
  };

  if (isLoading) {
    return <LoadingOverlay message="Signing in..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Animated gradient background */}
      <LinearGradient
        colors={['#05103b', '#062766', '#0a47a1']}
        locations={[0, 0.5, 1]}
        style={styles.backgroundGradient}
      >
        {/* Animated background circles */}
        <Animated.View 
          style={[
            styles.backgroundCircle1,
            {
              opacity: circleOpacity1,
              transform: [{ scale: circlePulse1 }],
            }
          ]}
        />
        <Animated.View 
          style={[
            styles.backgroundCircle2,
            {
              opacity: circleOpacity2,
              transform: [{ scale: circlePulse2 }],
            }
          ]}
        />
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          {/* Logo Section */}
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
                <Heart size={24} color="#fff" fill="#fff" strokeWidth={0} />
              </Animated.View>
              <Animated.View 
                style={[
                  styles.stethoscopeContainer, 
                  { transform: [{ rotate: stethoscopeRotate }] }
                ]}
              >
                <Stethoscope size={32} color="#fff" />
              </Animated.View>
            </View>
            
            <Animated.View 
              style={[
                styles.textContainer,
                {
                  opacity: textOpacity,
                }
              ]}
            >
              <Animated.Text 
                style={[
                  styles.appName,
                  { transform: [{ translateX: textSlideLeft }] }
                ]}
              >
                MEDICO
              </Animated.Text>
              <Animated.Text 
                style={[
                  styles.appTagline,
                  { transform: [{ translateX: textSlideRight }] }
                ]}
              >
                Where Healthcare Connects
              </Animated.Text>
            </Animated.View>
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
            {Platform.OS === 'ios' ? (
              <BlurView intensity={80} tint="dark" style={styles.formCard}>
                <View style={styles.formCardInner}>
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
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <View style={styles.inputContainer}>
                      <Lock size={20} color="#0066CC" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Your password"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        secureTextEntry={!showPassword}
                      />
                      <Pressable 
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                      >
                        {showPassword ? 
                          <EyeOff size={20} color="#0066CC" /> : 
                          <Eye size={20} color="#0066CC" />
                        }
                      </Pressable>
                    </View>
                  </View>
                  
                  <TouchableOpacity style={styles.forgotPassword}>
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            ) : (
              <View style={styles.formCardAndroid}>
                <View style={styles.formCardInner}>
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
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <View style={styles.inputContainer}>
                      <Lock size={20} color="#0066CC" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Your password"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        secureTextEntry={!showPassword}
                      />
                      <Pressable 
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                      >
                        {showPassword ? 
                          <EyeOff size={20} color="#0066CC" /> : 
                          <Eye size={20} color="#0066CC" />
                        }
                      </Pressable>
                    </View>
                  </View>
                  
                  <TouchableOpacity style={styles.forgotPassword}>
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
                  
            {/* Button Section */}
            <Animated.View 
              style={[
                styles.buttonSection,
                {
                  opacity: buttonOpacity,
                  transform: [{ scale: buttonScale }]
                }
              ]}
            >
              <TouchableOpacity 
                style={styles.signInButton}
                onPress={handleSignIn}
                activeOpacity={0.9}
              >
                <LinearGradient 
                  colors={['#0091FF', '#0066CC']} 
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <LogIn size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Sign In</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider with "or" text */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Sign In Button */}
              <TouchableOpacity 
                style={styles.googleButton}
                onPress={handleGoogleSignIn}
                activeOpacity={0.9}
                disabled={isLoading}
              >
                <View style={styles.googleButtonContent}>
                  <View style={styles.googleLogoContainer}>
                    <GoogleLogo width={24} height={24} />
                  </View>
                  <Text style={styles.googleButtonText}>
                    {isLoading ? 'Connecting to Google...' : 'Continue with Google'}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
            
            <View style={styles.footerSection}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <TouchableOpacity onPress={navigateToSignUp}>
                <Text style={styles.signUpText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050e30',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundCircle1: {
    position: 'absolute',
    width: height * 0.4,
    height: height * 0.4,
    borderRadius: height * 0.2,
    backgroundColor: '#0091FF',
    top: -height * 0.05,
    right: -width * 0.25,
    opacity: 0.3,
  },
  backgroundCircle2: {
    position: 'absolute',
    width: height * 0.5,
    height: height * 0.5,
    borderRadius: height * 0.25,
    backgroundColor: '#0066CC',
    bottom: -height * 0.15,
    left: -width * 0.25,
    opacity: 0.2,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 16,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(0, 102, 204, 0.3)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  heartContainer: {
    position: 'absolute',
    top: 16,
    left: 28,
    zIndex: 2,
  },
  stethoscopeContainer: {
    position: 'absolute',
    zIndex: 1,
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appTagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  formSection: {
    width: '100%',
    marginTop: 24,
  },
  formCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  formCardAndroid: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: 'rgba(10, 20, 50, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  formCardInner: {
    padding: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    height: '100%',
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    color: '#0091FF',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonSection: {
    marginBottom: 16,
  },
  signInButton: {
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#0066CC',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  googleButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    marginBottom: 8,
  },
  googleButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogoContainer: {
    marginRight: 10,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  footerText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 16,
  },
  signUpText: {
    color: '#0091FF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});