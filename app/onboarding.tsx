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
  TextInput,
  Alert,
} from 'react-native';
import { Redirect, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useStorage } from './hooks/useStorage';
import { useAuthStore, Profile } from '@/stores/useAuthStore';
import * as ImagePicker from 'expo-image-picker';
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
  User,
  Camera,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

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
    title: 'MediCo',
    subtitle: 'The Origin of Excellence',
    description: 'A revolutionary platform for elite medical professionals to connect and collaborate.',
    iconName: 'Heart',
    animationSize: 200,
    gradientColors: ['#0045B5', '#00A3FF'],
  },
  {
    id: '2',
    title: 'Precision Collaboration',
    subtitle: 'Beyond Conventional Platforms',
    description: 'Exchange clinical insights with unprecedented security and elegance in our physician-focused space.',
    iconName: 'MessageSquare',
    animationSize: 200,
    gradientColors: ['#0062B9', '#00D1FF'],
  },
  {
    id: '3',
    title: 'Exclusive Network',
    subtitle: 'Join the Medical Vanguard',
    description: 'Already trusted by leading specialists across disciplines. Your expertise belongs here.',
    iconName: 'Medal',
    animationSize: 200,
    gradientColors: ['#004299', '#00E1FF'],
  }
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
  const { profile, updateProfile } = useAuthStore();
  
  // Profile setup state
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [profilePicture, setProfilePicture] = useState<string | null>(profile?.avatar_url || null);
  const [showProfileSetup, setShowProfileSetup] = useState(false); // Show slides first when coming from Learn More
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  
  // Background animation
  const circle1Scale = useRef(new Animated.Value(1)).current;
  const circle1Opacity = useRef(new Animated.Value(0.12)).current;
  const circle2Scale = useRef(new Animated.Value(1)).current;
  const circle2Opacity = useRef(new Animated.Value(0.08)).current;

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
            toValue: 0.12,
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
            toValue: 0.08,
            duration: 10000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [currentIndex, progressAnim]);

  // Make sure the fullName is updated when profile loads
  useEffect(() => {
    if (profile) {
      // Update the name from profile if available
      if (profile.full_name) {
        setFullName(profile.full_name);
      }
      
      // Update avatar if available
      if (profile.avatar_url) {
        setProfilePicture(profile.avatar_url);
      }
    }
  }, [profile]);
  
  // Handle first-time setup for OAuth users
  useEffect(() => {
    // Check if this is a "Learn More" click or auth flow
    const checkSetupNeeded = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        // Only show profile setup if user has an active valid session
        if (data.session && data.session.user) {
          console.log('User has active session, showing profile setup');
          setShowProfileSetup(false); // Changed from true to false to always show slides first
        } else {
          // No authenticated session, show onboarding slides
          console.log('No active session, showing onboarding slides');
          setShowProfileSetup(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        // In case of error, default to showing slides
        setShowProfileSetup(false);
      }
    };
    
    checkSetupNeeded();
  }, []);

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
    ]).start(async () => {
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
        // Last slide, always go to sign up page
        console.log('On last slide, navigating to sign up');
        router.replace('/(auth)/sign-up');
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

  const handleSkip = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      
      if (data.session && data.session.user) {
        // User is authenticated, complete onboarding
        handleComplete();
      } else {
        // User is not authenticated, go to sign up
        console.log('User not authenticated, navigating to sign up');
        router.replace('/(auth)/sign-up');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // Default to sign up page if there's an error
      router.replace('/(auth)/sign-up');
    }
  };

  const handleProfileSetupComplete = async () => {
    try {
      // Ensure name has Dr prefix if not already present
      let formattedName = fullName.trim();
      if (!formattedName.startsWith('Dr.') && !formattedName.startsWith('dr.') && !formattedName.startsWith('Dr ') && !formattedName.startsWith('dr ')) {
        formattedName = `Dr. ${formattedName}`;
      }
      
      // Prepare update data
      const updates: Partial<Profile> = {
        full_name: formattedName
      };
      
      // Add profile picture if available
      if (profilePicture) {
        updates.avatar_url = profilePicture;
      }
      
      // Update profile
      const success = await updateProfile(updates);
      
      if (success) {
        handleComplete();
      } else {
        Alert.alert(
          "Error", 
          "Failed to save your profile information. You can update it later in your profile settings.",
          [{ text: "Continue Anyway", onPress: handleComplete }]
        );
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert(
        "Error", 
        "Something went wrong. You can update your profile later in settings.",
        [{ text: "Continue Anyway", onPress: handleComplete }]
      );
    }
  };
  
  const pickImage = async () => {
    try {
      // Request permissions
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please grant camera roll permissions to change your photo.');
          return;
        }
      }

      // Pick the image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const file = result.assets[0];
        setProfilePicture(file.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile picture');
    }
  };

  // Avatar placeholder component
  const AvatarPlaceholder = () => (
    <View style={styles.avatarPlaceholder}>
      <User size={60} color="#FFFFFF" />
    </View>
  );

  // Profile setup view
  const renderProfileSetup = () => {
    return (
      <Animated.View 
        style={[
          styles.profileSetupContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateY }]
          }
        ]}
      >
        <Text style={styles.profileSetupTitle}>Complete Your Profile</Text>
        <Text style={styles.profileSetupSubtitle}>Let's set up your professional profile</Text>
        
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {profilePicture ? (
              <Image source={{ uri: profilePicture }} style={styles.avatar} />
            ) : (
              <AvatarPlaceholder />
            )}
            <TouchableOpacity style={styles.changeAvatarButton} onPress={pickImage}>
              <Camera size={18} color="#FFFFFF" />
              <Text style={styles.changeAvatarText}>{profilePicture ? 'Change Photo' : 'Add Photo'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Your Name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your full name (Dr. will be added automatically)"
              placeholderTextColor="#A3A3A3"
            />
          </View>
          <Text style={styles.inputNote}>This name will be visible to other users as "Dr. [Name]"</Text>
        </View>
          
        <TouchableOpacity 
          style={styles.completeButton} 
          onPress={handleProfileSetupComplete}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#0066CC', '#0091ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.completeButtonText}>Complete Setup</Text>
            <View style={styles.arrowContainer}>
              <ArrowRight size={18} color="#fff" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </Animated.View>
    );
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
              <IconComponent name={item.iconName} size={70} color="#fff" />
            </LinearGradient>
            <View style={styles.glowEffect} />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>{item.title}</Text>
            <View style={styles.subtitleContainer}>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
              <View style={styles.subtitleUnderline} />
            </View>
            
            <Text style={styles.description}>
              {item.description}
            </Text>
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
      <StatusBar barStyle="dark-content" />
      
      {/* Background circles */}
      <View style={styles.background}>
        <Animated.View
          style={[
            styles.circle1,
            {
              transform: [{ scale: circle1Scale }],
              opacity: circle1Opacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.circle2,
            {
              transform: [{ scale: circle2Scale }],
              opacity: circle2Opacity,
            },
          ]}
        />
      </View>
      
      {/* Display either onboarding slides or profile setup */}
      {!showProfileSetup ? (
        <>
          <FlatList
            ref={slidesRef}
            data={slides}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / windowWidth);
              setCurrentIndex(index);
            }}
            scrollEnabled={false} // We manage scrolling with buttons
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            style={styles.flatList}
          />
          
          {/* Navigation */}
          <View style={styles.navigation}>
            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            
            <View style={styles.buttonContainer}>
              {currentIndex > 0 && (
                <TouchableOpacity
                  onPress={handlePrevious}
                  style={styles.prevButton}
                  activeOpacity={0.7}
                >
                  <ChevronLeft color="#0066CC" size={20} />
                  <Text style={styles.prevButtonText}>Back</Text>
                </TouchableOpacity>
              )}
              
              <Animated.View
                style={{
                  transform: [{ scale: buttonScale }],
                }}
              >
                <TouchableOpacity
                  style={[styles.nextButton, currentIndex === 0 && styles.buttonStart]}
                  onPress={handleNext}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#0066CC', '#0091FF']}
                    style={styles.nextButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.nextButtonText}>
                      {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
                    </Text>
                    <ArrowRight color="#FFF" size={16} />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
              
              {currentIndex < slides.length - 1 && (
                <TouchableOpacity
                  onPress={handleSkip}
                  style={styles.skipButtonInNav}
                  activeOpacity={0.7}
                >
                  <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </>
      ) : (
        renderProfileSetup()
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1D', // Darker, more sophisticated background
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle1: {
    position: 'absolute',
    width: height * 0.5,
    height: height * 0.5,
    borderRadius: height * 0.25,
    backgroundColor: '#0091FF',
    top: -height * 0.05,
    right: -width * 0.25,
    opacity: 0.12, // More subtle
  },
  circle2: {
    position: 'absolute',
    width: height * 0.6,
    height: height * 0.6,
    borderRadius: height * 0.3,
    backgroundColor: '#0066CC',
    bottom: -height * 0.15,
    left: -width * 0.25,
    opacity: 0.08, // More subtle
  },
  
  // Slide styles
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  slideContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animationContainer: {
    marginBottom: 50,
    alignItems: 'center',
  },
  animationBackground: {
    width: 240,
    height: 240,
    borderRadius: 120,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00A3FF',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  glowEffect: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 130,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#fff',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 15,
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#9DCFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitleUnderline: {
    width: 40,
    height: 2.5,
    backgroundColor: '#00A3FF',
    borderRadius: 4,
  },
  description: {
    fontSize: 17,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 26,
    letterSpacing: 0.2,
    paddingHorizontal: 10,
  },
  
  // Navigation styles
  flatList: {
    flex: 1,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 30,
    paddingBottom: 40,
  },
  progressContainer: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 3,
    marginRight: 24,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00A3FF',
    borderRadius: 3,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginRight: 16,
  },
  prevButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  nextButton: {
    overflow: 'hidden',
    borderRadius: 30,
  },
  buttonStart: {
    borderRadius: 30,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 10,
    letterSpacing: 0.5,
  },
  skipButtonInNav: {
    padding: 12,
    marginLeft: 16,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 0.2,
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  
  // Profile setup styles
  profileSetupContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  profileSetupTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  profileSetupSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#F1F5F9',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  changeAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0066CC',
    gap: 8,
  },
  changeAvatarText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  inputSection: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 4,
    paddingLeft: 16,
  },
  input: {
    fontSize: 16,
    color: '#111827',
    paddingVertical: 12,
  },
  inputNote: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  completeButton: {
    marginBottom: 16,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    padding: 12,
  },
  skipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
});

export default OnboardingScreen;