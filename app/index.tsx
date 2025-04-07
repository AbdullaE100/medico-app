import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';
import {
  ArrowRight,
  Heart,
  Stethoscope,
  User,
  LogIn,
  UserPlus,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = () => {
  const router = useRouter();
  
  // Animation values
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scaleIn = useRef(new Animated.Value(0.9)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const logoPosition = useRef(new Animated.Value(-20)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonPosition = useRef(new Animated.Value(20)).current;
  
  // Logo animations
  const heartScale = useRef(new Animated.Value(1)).current;
  const stethoscopeRotation = useRef(new Animated.Value(0)).current;
  
  // Background animations
  const circle1Scale = useRef(new Animated.Value(1)).current;
  const circle1Opacity = useRef(new Animated.Value(0.3)).current;
  const circle2Scale = useRef(new Animated.Value(1)).current;
  const circle2Opacity = useRef(new Animated.Value(0.2)).current;
  
  // Text animations
  const titleTranslate = useRef(new Animated.Value(-20)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslate = useRef(new Animated.Value(-15)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const descriptionTranslate = useRef(new Animated.Value(-10)).current;
  const descriptionOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence animations
    Animated.sequence([
      // Fade in background
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      
      // Animate logo
      Animated.parallel([
        Animated.timing(logoPosition, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleIn, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      
      // Animate title
      Animated.parallel([
        Animated.timing(titleTranslate, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      
      // Animate subtitle
      Animated.parallel([
        Animated.timing(subtitleTranslate, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      
      // Animate description
      Animated.parallel([
        Animated.timing(descriptionTranslate, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(descriptionOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      
      // Animate content
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      
      // Animate buttons
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(buttonPosition, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    
    // Background animations
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(circle1Scale, {
            toValue: 1.3,
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.timing(circle1Opacity, {
            toValue: 0.1,
            duration: 8000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(circle1Scale, {
            toValue: 1,
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.timing(circle1Opacity, {
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
          Animated.timing(circle2Scale, {
            toValue: 1.5,
            duration: 10000,
            useNativeDriver: true,
          }),
          Animated.timing(circle2Opacity, {
            toValue: 0.1,
            duration: 10000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(circle2Scale, {
            toValue: 1,
            duration: 10000,
            useNativeDriver: true,
          }),
          Animated.timing(circle2Opacity, {
            toValue: 0.2,
            duration: 10000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
    
    // Heartbeat animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartScale, {
          toValue: 1.15,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
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
        }),
        Animated.timing(stethoscopeRotation, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  
  const stethoscopeRotate = stethoscopeRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['-5deg', '5deg'],
  });
  
  const navigateToSignIn = () => {
    router.push('/(auth)/sign-in');
  };
  
  const navigateToSignUp = () => {
    router.push('/(auth)/sign-up');
  };
  
  const navigateToOnboarding = () => {
    router.push('/onboarding');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Animated gradient background */}
      <Animated.View style={{ opacity: fadeIn, flex: 1 }}>
        <LinearGradient
          colors={['#05103b', '#062766', '#0a47a1'] as [string, string, string]}
          locations={[0, 0.5, 1]}
          style={styles.backgroundGradient}
        >
          {/* Animated background circles */}
          <Animated.View 
            style={[
              styles.backgroundCircle1,
              {
                opacity: circle1Opacity,
                transform: [{ scale: circle1Scale }],
              }
            ]}
          />
          <Animated.View 
            style={[
              styles.backgroundCircle2,
              {
                opacity: circle2Opacity,
                transform: [{ scale: circle2Scale }],
              }
            ]}
          />
        </LinearGradient>
        
        <View style={styles.content}>
          {/* Logo Section */}
          <Animated.View 
            style={[
              styles.logoSection,
              {
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
                <Heart size={28} color="#fff" fill="#fff" strokeWidth={0} />
              </Animated.View>
              <Animated.View 
                style={[
                  styles.stethoscopeContainer,
                  { transform: [{ rotate: stethoscopeRotate }] }
                ]}
              >
                <Stethoscope size={36} color="#fff" />
              </Animated.View>
            </View>
          </Animated.View>
          
          {/* Text Content */}
          <View style={styles.textContent}>
            <Animated.Text 
              style={[
                styles.title,
                { 
                  opacity: titleOpacity,
                  transform: [{ translateY: titleTranslate }] 
                }
              ]}
            >
              MediCo
            </Animated.Text>
            
            <Animated.Text 
              style={[
                styles.subtitle,
                { 
                  opacity: subtitleOpacity,
                  transform: [{ translateY: subtitleTranslate }] 
                }
              ]}
            >
              Connect. Collaborate. Care.
            </Animated.Text>
            
            <Animated.Text 
              style={[
                styles.description,
                { 
                  opacity: descriptionOpacity,
                  transform: [{ translateY: descriptionTranslate }] 
                }
              ]}
            >
              The professional network exclusively for healthcare providers to connect, collaborate, and advance medicine together.
            </Animated.Text>
          </View>
          
          {/* Buttons Section */}
          <Animated.View 
            style={[
              styles.buttonSection,
              {
                opacity: buttonOpacity,
                transform: [{ translateY: buttonPosition }]
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.signInButton}
              onPress={navigateToSignIn}
              activeOpacity={0.9}
            >
              <LinearGradient 
                colors={['#0091FF', '#0066CC'] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <LogIn size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Sign In</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.signUpButton}
              onPress={navigateToSignUp}
              activeOpacity={0.9}
            >
              {Platform.OS === 'ios' ? (
                <BlurView intensity={70} tint="light" style={styles.blurButton}>
                  <UserPlus size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Create Account</Text>
                </BlurView>
              ) : (
                <View style={styles.androidButton}>
                  <UserPlus size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Create Account</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.learnMoreButton}
              onPress={navigateToOnboarding}
              activeOpacity={0.8}
            >
              <Text style={styles.learnMoreText}>Learn More</Text>
              <ArrowRight size={16} color="#0091FF" style={styles.learnMoreIcon} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

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
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    paddingTop: height * 0.12,
    paddingBottom: height * 0.08,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    width: 90,
    height: 90,
    backgroundColor: 'rgba(0, 102, 204, 0.3)',
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
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
  textContent: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonSection: {
    width: '100%',
  },
  signInButton: {
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
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
  signUpButton: {
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  blurButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  androidButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  learnMoreText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  learnMoreIcon: {
    marginTop: 1,
  },
});

export default WelcomeScreen;