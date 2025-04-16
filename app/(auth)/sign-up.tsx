import React, { useState, useEffect, useRef } from 'react';
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
import { BlurView } from 'expo-blur';
import { 
  Heart, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Stethoscope,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  UserPlus
} from 'lucide-react-native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

const { width, height } = Dimensions.get('window');

export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp, isLoading, error } = useAuthStore();
  const router = useRouter();

  // Password strength validation
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMessage, setPasswordMessage] = useState('');

  // Animation values
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scaleIn = useRef(new Animated.Value(0.95)).current;
  const logoPosition = useRef(new Animated.Value(-15)).current;
  const formPosition = useRef(new Animated.Value(30)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonPosition = useRef(new Animated.Value(20)).current;
  const headingSlideIn = useRef(new Animated.Value(-20)).current;
  const headingOpacity = useRef(new Animated.Value(0)).current;
  
  // Background animations
  const circlePulse1 = useRef(new Animated.Value(1)).current;
  const circlePulse2 = useRef(new Animated.Value(1)).current;
  const circleOpacity1 = useRef(new Animated.Value(0.3)).current;
  const circleOpacity2 = useRef(new Animated.Value(0.4)).current;
  
  // Logo animations
  const heartScale = useRef(new Animated.Value(1)).current;
  const stethoscopeRotation = useRef(new Animated.Value(0)).current;

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      setPasswordMessage('');
      return;
    }
    
    let strength = 0;
    let message = '';
    
    // Length check
    if (password.length >= 8) {
      strength += 1;
    }
    
    // Has uppercase
    if (/[A-Z]/.test(password)) {
      strength += 1;
    }
    
    // Has lowercase
    if (/[a-z]/.test(password)) {
      strength += 1;
    }
    
    // Has number
    if (/[0-9]/.test(password)) {
      strength += 1;
    }
    
    // Has special character
    if (/[^A-Za-z0-9]/.test(password)) {
      strength += 1;
    }
    
    // Set message based on strength
    if (strength <= 2) {
      message = 'Weak';
    } else if (strength <= 4) {
      message = 'Good';
    } else {
      message = 'Strong';
    }
    
    setPasswordStrength(strength);
    setPasswordMessage(message);
  }, [password]);

  useEffect(() => {
    // Sequence animations
    Animated.sequence([
      // Fade in background
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      
      // Animate heading
      Animated.parallel([
        Animated.timing(headingSlideIn, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(headingOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
      
      // Animate logo and form together
      Animated.parallel([
        Animated.timing(logoPosition, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
        Animated.timing(scaleIn, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(formPosition, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      
      // Animate buttons last
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(buttonPosition, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]),
    ]).start();

    // Background animations
    const pulseAnimation1 = () => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(circleOpacity1, {
            toValue: 0.5,
            duration: 2000,
            useNativeDriver: false
          }),
          Animated.timing(circlePulse1, {
            toValue: 1.1,
            duration: 2000,
            useNativeDriver: false
          })
        ]),
        Animated.parallel([
          Animated.timing(circleOpacity1, {
            toValue: 0.3,
            duration: 2000,
            useNativeDriver: false
          }),
          Animated.timing(circlePulse1, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false
          })
        ])
      ]).start(() => pulseAnimation1());
    };

    const pulseAnimation2 = () => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(circleOpacity2, {
            toValue: 0.6,
            duration: 2500,
            useNativeDriver: false
          }),
          Animated.timing(circlePulse2, {
            toValue: 1.15,
            duration: 2500,
            useNativeDriver: false
          })
        ]),
        Animated.parallel([
          Animated.timing(circleOpacity2, {
            toValue: 0.4,
            duration: 2500,
            useNativeDriver: false
          }),
          Animated.timing(circlePulse2, {
            toValue: 1,
            duration: 2500,
            useNativeDriver: false
          })
        ])
      ]).start(() => pulseAnimation2());
    };

    pulseAnimation1();
    // Start second animation with a delay
    setTimeout(() => pulseAnimation2(), 1000);

    // Heartbeat animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartScale, {
          toValue: 1.15,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(heartScale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
        Animated.delay(1800),
      ])
    ).start();
    
    // Subtle stethoscope rotation
    Animated.loop(
      Animated.sequence([
        Animated.timing(stethoscopeRotation, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.cubic),
        }),
        Animated.timing(stethoscopeRotation, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.cubic),
        }),
      ])
    ).start();

    return () => {
      circleOpacity1.stopAnimation();
      circlePulse1.stopAnimation();
      circleOpacity2.stopAnimation();
      circlePulse2.stopAnimation();
    };
  }, []);

  const stethoscopeRotate = stethoscopeRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['-5deg', '5deg'],
  });

  const navigateBack = () => {
    router.replace('/');
  };

  const handleSignUp = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      useAuthStore.setState({ error: "All fields are required" });
      return;
    }

    // Auto-prefix 'Dr.' if not already present
    let formattedName = fullName.trim();
    if (!formattedName.startsWith('Dr.') && !formattedName.startsWith('dr.')) {
      formattedName = `Dr. ${formattedName}`;
    }

    if (password !== confirmPassword) {
      useAuthStore.setState({ error: "Passwords don't match" });
      return;
    }

    if (passwordStrength < 3) {
      useAuthStore.setState({ error: "Please use a stronger password" });
      return;
    }

    const success = await signUp(email, password, formattedName);
    if (success) {
      router.replace('/onboarding');
    }
  };

  // If fonts haven't loaded yet, you could show a splash screen or loading indicator
  if (!fontsLoaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff' }}>Loading...</Text>
      </View>
    );
  }

  if (isLoading) {
    return <LoadingOverlay message="Creating your account..." />;
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return '#FF6B6B';
    if (passwordStrength <= 4) return '#FFA500';
    return '#22C55E';
  };

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
            styles.circle1,
            {
              opacity: circleOpacity1,
              transform: [{ scale: circlePulse1 }],
            }
          ]}
        />
        <Animated.View 
          style={[
            styles.circle2,
            {
              opacity: circleOpacity2,
              transform: [{ scale: circlePulse2 }],
            }
          ]}
        />
      </LinearGradient>
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
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
                opacity: fadeIn,
                transform: [
                  { translateY: logoPosition },
                  { scale: scaleIn }
                ]
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
            <Text style={styles.appTagline}>Professional Healthcare Network</Text>
          </Animated.View>
          
          {/* Form Section */}
          <Animated.View 
            style={[
              styles.formSection,
              {
                opacity: formOpacity,
                transform: [{ translateY: formPosition }]
              }
            ]}
          >
            <Text style={styles.welcomeText}>Create Account</Text>
            <Text style={styles.welcomeSubtext}>Join our trusted medical community</Text>
            
            {error && (
              <ErrorMessage 
                message={error} 
                onDismiss={() => useAuthStore.setState({ error: null })}
              />
            )}
            
            {Platform.OS === 'ios' ? (
              <BlurView intensity={80} tint="dark" style={styles.formCard}>
                <View style={styles.formCardInner}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Name *</Text>
                    <View style={styles.inputContainer}>
                      <User size={20} color="#0066CC" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Dr. John Smith"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        autoCapitalize="words"
                      />
                    </View>
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email *</Text>
                    <View style={styles.inputContainer}>
                      <Mail size={20} color="#0066CC" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="doctor@hospital.com"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Password *</Text>
                    <View style={styles.inputContainer}>
                      <Lock size={20} color="#0066CC" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Choose a strong password"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
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
                    
                    {password.length > 0 && (
                      <View style={styles.passwordStrengthContainer}>
                        <View style={styles.strengthBars}>
                          {[1, 2, 3, 4, 5].map((level) => (
                            <View
                              key={level}
                              style={[
                                styles.strengthBar,
                                {
                                  backgroundColor: passwordStrength >= level 
                                    ? getPasswordStrengthColor() 
                                    : 'rgba(255, 255, 255, 0.2)',
                                },
                              ]}
                            />
                          ))}
                        </View>
                        {passwordMessage && (
                          <Text 
                            style={[
                              styles.strengthText, 
                              { color: getPasswordStrengthColor() }
                            ]}
                          >
                            {passwordMessage}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Confirm Password *</Text>
                    <View style={styles.inputContainer}>
                      <CheckCircle size={20} color="#0066CC" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Repeat your password"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        secureTextEntry={!showConfirmPassword}
                      />
                      <Pressable 
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.eyeIcon}
                      >
                        {showConfirmPassword ? 
                          <EyeOff size={20} color="#0066CC" /> : 
                          <Eye size={20} color="#0066CC" />
                        }
                      </Pressable>
                    </View>
                    
                    {confirmPassword.length > 0 && (
                      <View style={styles.passwordMatchContainer}>
                        {password === confirmPassword ? (
                          <Text style={[styles.matchText, { color: '#22C55E' }]}>
                            Passwords match
                          </Text>
                        ) : (
                          <Text style={[styles.matchText, { color: '#FF6B6B' }]}>
                            Passwords don't match
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              </BlurView>
            ) : (
              <View style={styles.formCardAndroid}>
                <View style={styles.formCardInner}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Name *</Text>
                    <View style={styles.inputContainer}>
                      <User size={20} color="#0066CC" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Dr. John Smith"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        autoCapitalize="words"
                      />
                    </View>
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email *</Text>
                    <View style={styles.inputContainer}>
                      <Mail size={20} color="#0066CC" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="doctor@hospital.com"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Password *</Text>
                    <View style={styles.inputContainer}>
                      <Lock size={20} color="#0066CC" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Choose a strong password"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
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
                    
                    {password.length > 0 && (
                      <View style={styles.passwordStrengthContainer}>
                        <View style={styles.strengthBars}>
                          {[1, 2, 3, 4, 5].map((level) => (
                            <View
                              key={level}
                              style={[
                                styles.strengthBar,
                                {
                                  backgroundColor: passwordStrength >= level 
                                    ? getPasswordStrengthColor() 
                                    : 'rgba(255, 255, 255, 0.2)',
                                },
                              ]}
                            />
                          ))}
                        </View>
                        {passwordMessage && (
                          <Text 
                            style={[
                              styles.strengthText, 
                              { color: getPasswordStrengthColor() }
                            ]}
                          >
                            {passwordMessage}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Confirm Password *</Text>
                    <View style={styles.inputContainer}>
                      <CheckCircle size={20} color="#0066CC" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Repeat your password"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        secureTextEntry={!showConfirmPassword}
                      />
                      <Pressable 
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.eyeIcon}
                      >
                        {showConfirmPassword ? 
                          <EyeOff size={20} color="#0066CC" /> : 
                          <Eye size={20} color="#0066CC" />
                        }
                      </Pressable>
                    </View>
                    
                    {confirmPassword.length > 0 && (
                      <View style={styles.passwordMatchContainer}>
                        {password === confirmPassword ? (
                          <Text style={[styles.matchText, { color: '#22C55E' }]}>
                            Passwords match
                          </Text>
                        ) : (
                          <Text style={[styles.matchText, { color: '#FF6B6B' }]}>
                            Passwords don't match
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}
            
            <Text style={styles.termsText}>
              By signing up, you agree to our{' '}
              <Text style={styles.linkText}>Terms of Service</Text> and{' '}
              <Text style={styles.linkText}>Privacy Policy</Text>
            </Text>
            
            <Animated.View style={{ 
              opacity: buttonOpacity, 
              transform: [{ translateY: buttonPosition }],
              width: '100%'
            }}>
              <TouchableOpacity 
                style={styles.signUpButton} 
                onPress={handleSignUp}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#0091FF', '#0066CC']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <UserPlus size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.signUpButtonText}>Create Account</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
          
          {/* Sign In Section */}
          <View style={styles.signInSection}>
            <Text style={styles.signInText}>Already have an account?</Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity>
                <Text style={styles.signInLink}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A202C',
    padding: 20,
    overflow: 'hidden',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.35,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 0,
    overflow: 'hidden',
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
    backgroundColor: '#FF4D6D',
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
    backgroundColor: '#0070F3',
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
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appTagline: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#A0AEC0',
  },
  formSection: {
    width: '100%',
    backgroundColor: 'rgba(10, 20, 50, 0.7)',
    borderRadius: 16,
    padding: 28,
    marginTop: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    zIndex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  welcomeText: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 28,
  },
  inputGroup: {
    marginBottom: 20,
    width: '100%',
  },
  inputLabel: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    color: '#FFFFFF',
  },
  inputNote: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#718096',
    marginTop: 6,
    marginLeft: 4,
  },
  visibilityToggle: {
    padding: 4,
  },
  termsText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#718096',
    marginBottom: 20,
    lineHeight: 18,
  },
  linkText: {
    color: '#6EBDFF',
    fontFamily: 'Inter_500Medium',
  },
  signUpButton: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#0070F3',
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
  signUpButtonText: {
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
  signInSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  signInText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.75)',
    marginRight: 4,
  },
  signInLink: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#0091FF',
  },
  backgroundContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  circle1: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: '#2D3748',
    top: -100,
    right: -150,
  },
  circle2: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#2D3748',
    bottom: -100,
    left: -100,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
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
  eyeIcon: {
    padding: 8,
  },
  passwordStrengthContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  strengthBars: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  strengthBar: {
    height: 4,
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 14,
    fontWeight: '500',
  },
  passwordMatchContainer: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  matchText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
});