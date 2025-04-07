import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, MapPin, Building, Award, Phone, Mail, Link, Copy } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.92;
const CARD_HEIGHT = 110; // Smaller height for horizontal layout

interface BusinessCardHorizontalProps {
  profile: {
    full_name?: string;
    specialty?: string;
    hospital?: string;
    location?: string;
    email?: string;
    avatar_url?: string;
  };
  onPress?: () => void;
  style?: any;
}

const BusinessCardHorizontal: React.FC<BusinessCardHorizontalProps> = ({
  profile,
  onPress,
  style,
}) => {
  // Animation values
  const scale = useSharedValue(0.98);
  const bgColorProgress = useSharedValue(0);
  
  // Animated styles
  const cardStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      bgColorProgress.value,
      [0, 1],
      ['#1E293B', '#243447']
    );
    
    return {
      transform: [{ scale: scale.value }],
      backgroundColor,
    };
  });
  
  // Handlers
  const handlePressIn = () => {
    scale.value = withTiming(0.96, { duration: 200, easing: Easing.out(Easing.cubic) });
    bgColorProgress.value = withTiming(1, { duration: 200 });
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
    bgColorProgress.value = withTiming(0, { duration: 200 });
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.touchable, style]}
    >
      <Animated.View style={[styles.cardContainer, cardStyle]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0)']}
          style={styles.glassEffect}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Left Section with Avatar */}
        <View style={styles.leftSection}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image 
                source={{ uri: profile.avatar_url }} 
                style={styles.avatar} 
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={30} color="#E2E8F0" />
              </View>
            )}
          </View>
        </View>
        
        {/* Middle Section with Name and Details */}
        <View style={styles.middleSection}>
          <Text style={styles.name} numberOfLines={1}>
            {profile?.full_name || "Dr. Jane Smith"}
          </Text>
          <Text style={styles.specialty} numberOfLines={1}>
            {profile?.specialty || "Cardiology"}
          </Text>
          
          <View style={styles.detailsRow}>
            {profile?.hospital && (
              <View style={styles.detailItem}>
                <Building size={12} color="#94A3B8" style={styles.detailIcon} />
                <Text style={styles.detailText} numberOfLines={1}>
                  {profile.hospital}
                </Text>
              </View>
            )}
            
            {profile?.location && (
              <View style={styles.detailItem}>
                <MapPin size={12} color="#94A3B8" style={styles.detailIcon} />
                <Text style={styles.detailText} numberOfLines={1}>
                  {profile.location}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Right Section with Copy Button */}
        <View style={styles.rightSection}>
          <TouchableOpacity 
            style={styles.copyButton}
            onPress={onPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Copy size={18} color="#CBD5E1" />
          </TouchableOpacity>
        </View>
        
        {/* Decorative elements */}
        <View style={styles.decorativeDot1} />
        <View style={styles.decorativeDot2} />
        <View style={styles.decorativeLine} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginVertical: 8,
  },
  cardContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  glassEffect: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
  },
  leftSection: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleSection: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  specialty: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '500',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  detailIcon: {
    marginRight: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#94A3B8',
    maxWidth: 120,
  },
  rightSection: {
    width: 60,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorativeDot1: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.02)',
    top: -40,
    right: -20,
  },
  decorativeDot2: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    bottom: -15,
    left: 60,
  },
  decorativeLine: {
    position: 'absolute',
    width: 120,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    transform: [{ rotate: '45deg' }],
    bottom: 20,
    right: -30,
  }
});

export default BusinessCardHorizontal; 