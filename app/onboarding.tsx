import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  Dimensions, 
  TouchableOpacity, 
  FlatList, 
  Animated, 
  Easing,
  StatusBar as RNStatusBar,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Heart, 
  Stethoscope,
  Users,
  Award,
  Activity,
  Brain,
  ChevronRight,
  ArrowRight
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    icon: 'Users',
    color: '#0091ff',
    title: 'Connect with Medical Professionals',
    subtitle: 'Build your network with doctors, specialists, and healthcare providers from around the globe'
  },
  {
    id: '2',
    icon: 'Brain',
    color: '#4C6EF5',
    title: 'Share Clinical Insights',
    subtitle: 'Discuss cases, share research, and collaborate on medical advancements with peers in your field'
  },
  {
    id: '3',
    icon: 'Activity',
    color: '#FF6B6B',
    title: 'Join Medical Communities',
    subtitle: 'Participate in specialty-focused groups and stay updated on the latest healthcare trends'
  },
  {
    id: '4',
    icon: 'Award',
    color: '#22C55E',
    title: 'Advance Your Career',
    subtitle: 'Discover opportunities, mentorships, and collaborations to take your medical career to new heights'
  }
];

const Onboarding = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const iconRotation = useRef(new Animated.Value(0)).current;
  
  // Background animation
  const circlePulse1 = useRef(new Animated.Value(1)).current;
  const circlePulse2 = useRef(new Animated.Value(1)).current;
  const circleOpacity1 = useRef(new Animated.Value(0.4)).current;
  const circleOpacity2 = useRef(new Animated.Value(0.3)).current;
  
  // Heart animation
  const heartBeat = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Initial animations
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.ease,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
        Animated.timing(slideUpAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
      ]),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Background circle animations
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(circlePulse1, {
            toValue: 1.2,
            duration: 4000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(circleOpacity1, {
            toValue: 0.1,
            duration: 4000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(circlePulse1, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(circleOpacity1, {
            toValue: 0.4,
            duration: 4000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(circlePulse2, {
            toValue: 1.3,
            duration: 5000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(circleOpacity2, {
            toValue: 0.1,
            duration: 5000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(circlePulse2, {
            toValue: 1,
            duration: 5000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(circleOpacity2, {
            toValue: 0.3,
            duration: 5000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Icon rotation
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconRotation, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(iconRotation, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();

    // Heart animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartBeat, {
          toValue: 1.15,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease)
        }),
        Animated.timing(heartBeat, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease)
        }),
        Animated.delay(800)
      ])
    ).start();
  }, []);

  const rotation = iconRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '20deg']
  });

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    setCurrentIndex(viewableItems[0].index);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      router.push('/(auth)/sign-in');
    }
  };

  const skipToSignIn = () => {
    router.push('/(auth)/sign-in');
  };

  const renderIcon = (iconName: string, color: string) => {
    switch(iconName) {
      case 'Users':
        return <Users size={32} color="#fff" />;
      case 'Brain':
        return <Brain size={32} color="#fff" />;
      case 'Activity':
        return <Activity size={32} color="#fff" />;
      case 'Award':
        return <Award size={32} color="#fff" />;
      default:
        return <Heart size={32} color="#fff" />;
    }
  };

  const renderItem = ({ item, index }: { item: typeof slides[0], index: number }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width
    ];
    
    const translateX = scrollX.interpolate({
      inputRange,
      outputRange: [100, 0, -100],
      extrapolate: 'clamp'
    });
    
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp'
    });
    
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp'
    });

    return (
      <View style={styles.slide}>
        <Animated.View 
          style={[
            styles.slideContent,
            { 
              opacity,
              transform: [{ translateX }, { scale }] 
            }
          ]}
        >
          <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
            {renderIcon(item.icon, '#fff')}
          </View>

          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </Animated.View>
      </View>
    );
  };

  const Paginator = () => {
    return (
      <View style={styles.paginationContainer}>
        {slides.map((_, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
          
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 30, 10],
            extrapolate: 'clamp'
          });
          
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.5, 1, 0.5],
            extrapolate: 'clamp'
          });
          
          const backgroundColor = scrollX.interpolate({
            inputRange,
            outputRange: ['rgba(0, 102, 204, 0.5)', '#0066CC', 'rgba(0, 102, 204, 0.5)'],
            extrapolate: 'clamp'
          });
          
          return (
            <Animated.View 
              key={index.toString()} 
              style={[
                styles.dot,
                { 
                  width: dotWidth, 
                  opacity,
                  backgroundColor
                }
              ]}
            />
          );
        })}
      </View>
    );
  };

  const headerOpacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background gradient */}
      <LinearGradient
        colors={['#062454', '#0066CC']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Background animations */}
      <View style={styles.backgroundElements}>
        <Animated.View 
          style={[
            styles.backgroundCircle,
            styles.circle1,
            {
              opacity: circleOpacity1,
              transform: [{ scale: circlePulse1 }]
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.backgroundCircle,
            styles.circle2,
            {
              opacity: circleOpacity2,
              transform: [{ scale: circlePulse2 }]
            }
          ]} 
        />
        <View style={styles.decorativeLine1} />
        <View style={styles.decorativeLine2} />
      </View>
      
      {/* Header with logo */}
      <Animated.View 
        style={[
          styles.header,
          { 
            opacity: headerOpacity,
            transform: [{ translateY: slideUpAnim }]
          }
        ]}
      >
        <View style={styles.logoContainer}>
          <Animated.View 
            style={[
              styles.heartIcon,
              { transform: [{ scale: heartBeat }]}
            ]}
          >
            <Heart size={22} color="#fff" fill="#fff" />
          </Animated.View>
          <Animated.View 
            style={[
              styles.stethoscopeIcon,
              { transform: [{ rotate: rotation }]}
            ]}
          >
            <Stethoscope size={26} color="#fff" />
          </Animated.View>
        </View>
        <Text style={styles.headerTitle}>MEDICO</Text>
      </Animated.View>
      
      {/* Skip button */}
      <TouchableOpacity 
        style={styles.skipButton} 
        onPress={skipToSignIn}
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
      
      {/* Main content */}
      <Animated.View 
        style={[
          styles.content,
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <FlatList
          data={slides}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={slidesRef}
          scrollEventThrottle={16}
        />
      </Animated.View>
      
      {/* Footer */}
      <Animated.View 
        style={[
          styles.footerContainer,
          { opacity: buttonOpacity }
        ]}
      >
        <Paginator />
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={styles.signInButton} 
            onPress={skipToSignIn}
            activeOpacity={0.8}
          >
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.nextButton} 
            onPress={scrollTo}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#1a82ff', '#0066CC']}
              style={styles.nextButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.nextButtonText}>
                {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
              </Text>
              <View style={styles.arrowContainer}>
                {currentIndex === slides.length - 1 ? (
                  <ArrowRight size={18} color="#fff" />
                ) : (
                  <ChevronRight size={20} color="#fff" />
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#052c66',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundElements: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundCircle: {
    position: 'absolute',
    borderRadius: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle1: {
    width: 400,
    height: 400,
    top: -100,
    left: -100,
  },
  circle2: {
    width: 300,
    height: 300,
    bottom: -50,
    right: -50,
  },
  decorativeLine1: {
    position: 'absolute',
    width: 150,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: height * 0.3,
    left: 20,
    borderRadius: 10,
  },
  decorativeLine2: {
    position: 'absolute',
    width: 80,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    bottom: height * 0.2,
    right: 30,
    borderRadius: 10,
    transform: [{ rotate: '45deg' }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  logoContainer: {
    width: 52,
    height: 52,
    position: 'relative',
    marginRight: 10,
  },
  heartIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 36,
    height: 36,
    backgroundColor: '#ff6b6b',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  stethoscopeIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    backgroundColor: '#0091ff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
    letterSpacing: 2,
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 25,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideContent: {
    alignItems: 'center',
    width: width * 0.8,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  paginationContainer: {
    flexDirection: 'row',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  footerContainer: {
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 10,
  },
  nextButton: {
    flex: 1,
    marginLeft: 10,
    height: 56,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#1264af',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  nextButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginRight: 8,
  },
  arrowContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButton: {
    flex: 1,
    height: 56,
    marginRight: 10,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  signInText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});

export default Onboarding;
export { Onboarding };