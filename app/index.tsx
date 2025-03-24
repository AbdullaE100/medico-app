import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  Animated, 
  Easing,
  ImageBackground,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Heart, 
  Stethoscope,
  Users,
  Award,
  Activity,
  Brain,
  ArrowRight
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomePage() {
  const router = useRouter();
  
  // Animation values
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scaleIn = useRef(new Animated.Value(0.85)).current;
  const logoPosition = useRef(new Animated.Value(-100)).current;
  const taglinePosition = useRef(new Animated.Value(50)).current;
  const buttonScale = useRef(new Animated.Value(0.9)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const iconRotation = useRef(new Animated.Value(0)).current;
  
  // Icon animations
  const icon1Position = useRef(new Animated.Value(100)).current;
  const icon2Position = useRef(new Animated.Value(100)).current;
  const icon3Position = useRef(new Animated.Value(100)).current;
  const icon4Position = useRef(new Animated.Value(100)).current;
  
  // Heartbeat animation
  const heartScale = useRef(new Animated.Value(1)).current;
  const heartOpacity = useRef(new Animated.Value(1)).current;
  
  // Pulse animation positions
  const pulseScale1 = useRef(new Animated.Value(1)).current;
  const pulseOpacity1 = useRef(new Animated.Value(0.6)).current;
  const pulseScale2 = useRef(new Animated.Value(1)).current;
  const pulseOpacity2 = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Sequence all animations
    Animated.sequence([
      // First fade in the background
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
      
      // Then animate the logo and tagline
      Animated.parallel([
        Animated.timing(logoPosition, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.7)),
        }),
        Animated.timing(scaleIn, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(taglinePosition, {
          toValue: 0,
          duration: 800,
          delay: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
      ]),
      
      // Then animate the feature icons
      Animated.stagger(150, [
        Animated.timing(icon1Position, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
        Animated.timing(icon2Position, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
        Animated.timing(icon3Position, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
        Animated.timing(icon4Position, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
      ]),
      
      // Finally animate the buttons
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
    
    // Start pulse animations
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale1, {
            toValue: 1.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity1, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale1, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity1, {
            toValue: 0.6,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
    
    Animated.loop(
      Animated.sequence([
        Animated.delay(500),
        Animated.parallel([
          Animated.timing(pulseScale2, {
            toValue: 1.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity2, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale2, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity2, {
            toValue: 0.6,
            duration: 0,
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
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(heartScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
        Animated.delay(800),
      ])
    ).start();
    
    // Subtle rotation of an icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconRotation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(iconRotation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, []);

  const rotation = iconRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg']
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <Animated.View 
        style={[styles.backgroundContainer, { opacity: fadeIn }]}
      >
        <LinearGradient
          colors={['#062454', '#0a4b9e', '#0066CC']}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Decorative medical elements */}
        <View style={styles.bgElements}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />
          <View style={[styles.dna, styles.dna1]} />
          <View style={[styles.dna, styles.dna2]} />
        </View>
        
        {/* Pulse circles */}
        <Animated.View style={[
          styles.pulseCircle,
          { 
            opacity: pulseOpacity1, 
            transform: [{ scale: pulseScale1 }]
          }
        ]} />
        
        <Animated.View style={[
          styles.pulseCircle,
          styles.pulseCircle2,
          { 
            opacity: pulseOpacity2, 
            transform: [{ scale: pulseScale2 }]
          }
        ]} />
      </Animated.View>
      
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.headerSection}>
          <Animated.View 
            style={[
              styles.logoContainer,
              { 
                opacity: fadeIn,
                transform: [
                  { translateY: logoPosition },
                  { scale: scaleIn }
                ]
              }
            ]}
          >
            <View style={styles.logoWrapper}>
              <Animated.View 
                style={[
                  styles.heartContainer,
                  { transform: [{ scale: heartScale }] }
                ]}
              >
                <Heart size={28} color="#fff" fill="#fff" />
              </Animated.View>
              <View style={styles.stethoscopeContainer}>
                <Stethoscope size={36} color="#fff" />
              </View>
            </View>
            <Text style={styles.logoText}>MEDICO</Text>
          </Animated.View>
          
          <Animated.Text 
            style={[
              styles.tagline,
              { 
                opacity: fadeIn,
                transform: [{ translateY: taglinePosition }]
              }
            ]}
          >
            Where Healthcare Professionals Connect
          </Animated.Text>
        </View>
        
        {/* Feature Icons */}
        <View style={styles.featuresContainer}>
          <Animated.View 
            style={[
              styles.featureItem, 
              { transform: [{ translateX: icon1Position }] }
            ]}
          >
            <View style={styles.featureIconContainer}>
              <Users size={24} color="#fff" />
            </View>
            <Text style={styles.featureText}>Network</Text>
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.featureItem, 
              { transform: [{ translateX: icon2Position }] }
            ]}
          >
            <Animated.View style={[
              styles.featureIconContainer,
              { transform: [{ rotate: rotation }] }
            ]}>
              <Brain size={24} color="#fff" />
            </Animated.View>
            <Text style={styles.featureText}>Learn</Text>
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.featureItem, 
              { transform: [{ translateX: icon3Position }] }
            ]}
          >
            <View style={styles.featureIconContainer}>
              <Activity size={24} color="#fff" />
            </View>
            <Text style={styles.featureText}>Grow</Text>
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.featureItem, 
              { transform: [{ translateX: icon4Position }] }
            ]}
          >
            <View style={styles.featureIconContainer}>
              <Award size={24} color="#fff" />
            </View>
            <Text style={styles.featureText}>Achieve</Text>
          </Animated.View>
        </View>
        
        {/* Buttons */}
        <Animated.View 
          style={[
            styles.buttonsContainer,
            {
              opacity: buttonOpacity,
              transform: [{ scale: buttonScale }]
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.mainButton} 
            onPress={navigateToOnboarding}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#1a82ff', '#0066CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.mainButtonText}>Get Started</Text>
              <View style={styles.arrowContainer}>
                <ArrowRight size={18} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={styles.secondaryButtonsRow}>
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={navigateToSignIn}
            >
              <Text style={styles.secondaryButtonText}>Sign In</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={navigateToSignUp}
            >
              <Text style={styles.secondaryButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#052c66',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientBackground: {
    flex: 1,
  },
  bgElements: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle1: {
    width: 200,
    height: 200,
    top: height * 0.1,
    left: -50,
  },
  circle2: {
    width: 300,
    height: 300,
    top: height * 0.5,
    right: -150,
  },
  circle3: {
    width: 150,
    height: 150,
    bottom: -30,
    left: 30,
  },
  dna: {
    position: 'absolute',
    width: 30,
    height: 100,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderStyle: 'dashed',
  },
  dna1: {
    top: height * 0.2,
    right: 40,
    transform: [{ rotate: '30deg' }],
  },
  dna2: {
    bottom: height * 0.15,
    left: 60,
    transform: [{ rotate: '-45deg' }],
  },
  pulseCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: height * 0.3,
    left: width / 2 - 150,
  },
  pulseCircle2: {
    width: 200,
    height: 200,
    borderRadius: 100,
    top: height * 0.35,
    left: width / 2 - 100,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 50,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoWrapper: {
    width: 110,
    height: 110,
    position: 'relative',
    marginBottom: 15,
  },
  heartContainer: {
    position: 'absolute',
    width: 60,
    height: 60,
    backgroundColor: '#ff6b6b',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    top: 5,
    left: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  stethoscopeContainer: {
    position: 'absolute',
    width: 76,
    height: 76,
    backgroundColor: '#0091ff',
    borderRadius: 38,
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
    shadowRadius: 5,
    elevation: 8,
  },
  logoText: {
    fontSize: 42,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
    letterSpacing: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 18,
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 15,
    textAlign: 'center',
    paddingHorizontal: 40,
    letterSpacing: 0.5,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 50,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  buttonsContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 20,
  },
  mainButton: {
    width: '100%',
    height: 60,
    borderRadius: 15,
    shadowColor: '#1264af',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    marginBottom: 20,
  },
  gradientButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginRight: 12,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    width: '48%',
    height: 55,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
});