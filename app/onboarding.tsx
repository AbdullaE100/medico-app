import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Animated,
  FlatList,
  useWindowDimensions,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { Redirect, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useStorage } from './hooks/useStorage';
import {
  ArrowRight,
  Heart,
  Medal,
  Calendar,
  Users,
  MessageSquare,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  iconName: 'Heart' | 'Medal' | 'Calendar' | 'MessageSquare' | 'Users';
  animationSize: number;
  gradientColors: [string, string];
}

const slides: Slide[] = [
  {
    id: '1',
    title: 'Welcome to MediCo',
    subtitle: 'Your professional medical network',
    description: 'Connect with other healthcare professionals, share insights, and advance patient care together.',
    iconName: 'Heart',
    animationSize: 160,
    gradientColors: ['#0066CC', '#0091FF'],
  },
  {
    id: '2',
    title: 'Professional Profile',
    subtitle: 'Showcase your expertise',
    description: 'Build your professional profile, highlight your specialties, and establish your reputation in the medical community.',
    iconName: 'Medal',
    animationSize: 160,
    gradientColors: ['#1A56DB', '#38BDF8'],
  },
  {
    id: '3',
    title: 'Appointments & Schedule',
    subtitle: 'Efficiently manage your time',
    description: 'Seamlessly manage appointments, organize your schedule, and reduce administrative burden.',
    iconName: 'Calendar',
    animationSize: 160,
    gradientColors: ['#3B82F6', '#60A5FA'],
  },
  {
    id: '4',
    title: 'Secure Messaging',
    subtitle: 'Collaborate with confidence',
    description: 'Exchange ideas and discuss cases with other professionals through our secure, HIPAA-compliant messaging platform.',
    iconName: 'MessageSquare',
    animationSize: 160,
    gradientColors: ['#0284C7', '#0EA5E9'],
  },
  {
    id: '5',
    title: 'Join Our Community',
    subtitle: 'Be part of something meaningful',
    description: 'Connect with thousands of healthcare professionals who are already using MediCo to improve patient outcomes.',
    iconName: 'Users',
    animationSize: 160,
    gradientColors: ['#0369A1', '#22D3EE'],
  },
];

interface IconComponentProps {
  name: 'Heart' | 'Medal' | 'Calendar' | 'MessageSquare' | 'Users';
  size?: number;
  color?: string;
}

const IconComponent = ({ name, size = 32, color = "#fff" }: IconComponentProps) => {
  const icons = {
    Heart: <Heart size={size} color={color} />,
    Medal: <Medal size={size} color={color} />,
    Calendar: <Calendar size={size} color={color} />,
    MessageSquare: <MessageSquare size={size} color={color} />,
    Users: <Users size={size} color={color} />,
  };

  return icons[name] || null;
};

const OnboardingScreen = () => {
  const { width: windowWidth } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const { setItem } = useStorage();
  const slidesRef = useRef<FlatList<Slide>>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  
  // Background animation
  const circle1Scale = useRef(new Animated.Value(1)).current;
  const circle1Opacity = useRef(new Animated.Value(0.15)).current;
  const circle2Scale = useRef(new Animated.Value(1)).current;
  const circle2Opacity = useRef(new Animated.Value(0.1)).current;

  useEffect(() => {
    // Update progress animation
    Animated.timing(progressAnim, {
      toValue: currentIndex / (slides.length - 1),
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    // Background animation
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(circle1Scale, {
            toValue: 1.3,
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.timing(circle1Opacity, {
            toValue: 0.05,
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
            toValue: 0.15,
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
            toValue: 0.03,
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
            toValue: 0.1,
            duration: 10000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [currentIndex, progressAnim]);

  const handleNext = () => {
    Animated.sequence([
      // Button press animation
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      
      // Fade out current slide
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (currentIndex < slides.length - 1) {
        slidesRef.current?.scrollToIndex({
          index: currentIndex + 1,
          animated: false,
        });
        setCurrentIndex(currentIndex + 1);
        
        // Slide up animation for next slide
        translateY.setValue(50);
        fadeAnim.setValue(0);
        
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        // Last slide, go to main app
        handleComplete();
      }
    });
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      Animated.sequence([
        // Fade out current slide
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        slidesRef.current?.scrollToIndex({
          index: currentIndex - 1,
          animated: false,
        });
        setCurrentIndex(currentIndex - 1);
        
        // Slide up animation for previous slide
        translateY.setValue(50);
        fadeAnim.setValue(0);
        
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  };

  const handleComplete = async () => {
    await setItem('onboardingCompleted', 'true');
    router.replace('/(tabs)');
  };

  const handleSkip = () => {
    handleComplete();
  };

  const renderItem = ({ item }: { item: Slide }) => {
    return (
      <Animated.View
        style={[
          styles.slide,
          { width: windowWidth },
          { opacity: fadeAnim, transform: [{ translateY }] }
        ]}
      >
        <View style={styles.slideContent}>
          <View style={styles.animationContainer}>
            <LinearGradient
              colors={item.gradientColors}
              style={styles.animationBackground}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <IconComponent name={item.iconName} size={60} color="#fff" />
            </LinearGradient>
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Animated background */}
      <LinearGradient
        colors={['#05103b', '#062766', '#0a47a1'] as [string, string, string]}
        locations={[0, 0.5, 1]}
        style={styles.backgroundGradient}
      >
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
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
      
      {/* Slides */}
      <FlatList
        ref={slidesRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
      />
      
      {/* Footer with controls */}
      <View style={styles.footer}>
        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <Animated.View 
              style={[
                styles.progressFill, 
                { width: progressWidth }
              ]} 
            />
          </View>
        </View>
        
        {/* Navigation buttons */}
        <View style={styles.buttonsContainer}>
          {currentIndex > 0 ? (
            <TouchableOpacity 
              style={styles.prevButton} 
              onPress={handlePrevious}
              activeOpacity={0.7}
            >
              <ChevronLeft size={22} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} />
          )}
          
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity 
              style={styles.nextButton}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              {Platform.OS === 'ios' ? (
                <BlurView intensity={70} tint="light" style={styles.blurView}>
                  <LinearGradient
                    colors={currentIndex === slides.length - 1 ? 
                      ['#22C55E', '#10B981'] as [string, string] : 
                      ['#0091FF', '#0066CC'] as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {currentIndex === slides.length - 1 ? (
                      <CheckCircle size={24} color="#fff" />
                    ) : (
                      <ChevronRight size={24} color="#fff" />
                    )}
                  </LinearGradient>
                </BlurView>
              ) : (
                <LinearGradient
                  colors={currentIndex === slides.length - 1 ? 
                    ['#22C55E', '#10B981'] as [string, string] : 
                    ['#0091FF', '#0066CC'] as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {currentIndex === slides.length - 1 ? (
                    <CheckCircle size={24} color="#fff" />
                  ) : (
                    <ChevronRight size={24} color="#fff" />
                  )}
                </LinearGradient>
              )}
            </TouchableOpacity>
          </Animated.View>
          
          <View style={{ width: 44 }} />
        </View>
        
        {/* Steps indicator */}
        <View style={styles.paginationContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                currentIndex === index ? styles.paginationDotActive : null,
              ]}
            />
          ))}
        </View>
      </View>
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
    opacity: 0.15,
  },
  backgroundCircle2: {
    position: 'absolute',
    width: height * 0.5,
    height: height * 0.5,
    borderRadius: height * 0.25,
    backgroundColor: '#0066CC',
    bottom: -height * 0.15,
    left: -width * 0.25,
    opacity: 0.1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 16,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  slideContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animationContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  animationBackground: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 24,
  },
  progressContainer: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginBottom: 32,
    overflow: 'hidden',
  },
  progressBackground: {
    flex: 1,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0091FF',
    borderRadius: 3,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  prevButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  nextButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0066CC',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  blurView: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 20,
    backgroundColor: '#0091FF',
  },
});

export default OnboardingScreen;