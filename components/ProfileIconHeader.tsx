import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  TouchableOpacity, 
  View, 
  StyleSheet, 
  Platform, 
  Animated,
  Dimensions
} from 'react-native';
import { User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useProfileStore } from '@/stores/useProfileStore';
import ProfileSlidingPanel from './ProfileSlidingPanel';

const { width } = Dimensions.get('window');

// Track whether the panel is currently visible across app instances
let isPanelVisibleGlobal = false;

interface ProfileIconHeaderProps {
  inHeader?: boolean; // If true, renders just the icon for injection into existing headers
}

export const ProfileIconHeader: React.FC<ProfileIconHeaderProps> = ({ inHeader = false }) => {
  const router = useRouter();
  const { profile, fetchProfile } = useProfileStore();
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  
  // Use a single animation value for all effects to avoid conflicts
  const animatedValue = useRef(new Animated.Value(0)).current;
  
  // Load profile data on mount
  useEffect(() => {
    loadProfileData();
  }, []);
  
  const loadProfileData = useCallback(async () => {
    try {
      await fetchProfile();
    } catch (error) {
      console.error('Error loading profile data in header:', error);
    }
  }, [fetchProfile]);

  // Animate the icon when component mounts
  useEffect(() => {
    // Simple fade in and scale up animation
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Separate press animation
  const handlePressAnimation = () => {
    Animated.sequence([
      // Scale down slightly
      Animated.timing(animatedValue, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
      // Spring back
      Animated.spring(animatedValue, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleProfilePress = () => {
    // Prevent multiple panels from being opened simultaneously
    if (isPanelVisibleGlobal) {
      return;
    }

    handlePressAnimation();
    
    // Update global state
    isPanelVisibleGlobal = true;
    
    // Set local state after animation delay
    setTimeout(() => {
      setIsPanelVisible(true);
    }, 10);
  };

  const handleClosePanel = useCallback(() => {
    setIsPanelVisible(false);
    
    // Reset global state with slight delay to prevent immediate reopening
    setTimeout(() => {
      isPanelVisibleGlobal = false;
    }, 300);
  }, []);

  // Derived animated styles
  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });
  
  const scale = animatedValue.interpolate({
    inputRange: [0, 0.92, 1],
    outputRange: [0.8, 0.92, 1],
    extrapolate: 'clamp'
  });

  // If this component is being used inside an existing header
  if (inHeader) {
    return (
      <>
        <Animated.View style={[
          styles.iconContainerInline,
          {
            opacity,
            transform: [{ scale }]
          }
        ]}>
          <TouchableOpacity
            onPress={handleProfilePress}
            style={styles.iconButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <LinearGradient
              colors={['#0066CC', '#0091FF']}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {profile?.avatar_url ? (
                <Animated.Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <User size={22} color="#FFFFFF" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {isPanelVisible && (
          <ProfileSlidingPanel 
            isVisible={isPanelVisible}
            onClose={handleClosePanel}
          />
        )}
      </>
    );
  }

  // If this component is a standalone header
  return (
    <>
      <View style={styles.container}>
        <Animated.View style={[
          styles.iconContainer,
          {
            opacity,
            transform: [{ scale }]
          }
        ]}>
          <TouchableOpacity
            onPress={handleProfilePress}
            style={styles.iconButton}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <LinearGradient
              colors={['#0066CC', '#0091FF']}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {profile?.avatar_url ? (
                <Animated.Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <User size={22} color="#FFFFFF" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
      
      {isPanelVisible && (
        <ProfileSlidingPanel 
          isVisible={isPanelVisible}
          onClose={handleClosePanel}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 16,
    zIndex: 999,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconContainerInline: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  iconGradient: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: 'white',
  },
});

export default ProfileIconHeader; 