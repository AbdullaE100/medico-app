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
import { User, MapPin, Building, Award, Phone, Mail, Link, Share2, QrCode } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_HEIGHT = CARD_WIDTH * 0.6; // Standard business card ratio
const ANIMATION_DURATION = 600;

interface BusinessCardProps {
  profile: {
    full_name?: string;
    specialty?: string;
    hospital?: string;
    location?: string;
    email?: string;
    phone?: string;
    website?: string;
    avatar_url?: string;
    years_experience?: number | string;
  };
  onShare?: () => void;
  onQrView?: () => void;
  style?: any;
}

const BusinessCard: React.FC<BusinessCardProps> = ({
  profile,
  onShare,
  onQrView,
  style,
}) => {
  // Animation values
  const flipRotation = useSharedValue(0);
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);
  const highlightOpacity = useSharedValue(0);
  
  // Trigger entrance animations when component mounts
  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    scale.value = withDelay(
      100,
      withSpring(1, { damping: 12, stiffness: 90 })
    );
    
    // Add a subtle highlight animation
    highlightOpacity.value = withDelay(
      600,
      withSequence(
        withTiming(0.6, { duration: 500 }),
        withTiming(0, { duration: 500 })
      )
    );
  }, []);

  // Animated styles
  const cardStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { rotateY: `${flipRotation.value * 180}deg` },
      ],
    };
  });

  const highlightStyle = useAnimatedStyle(() => {
    return {
      opacity: highlightOpacity.value,
    };
  });

  // Handlers
  const handleFlip = () => {
    flipRotation.value = withSpring(flipRotation.value === 0 ? 1 : 0, { 
      damping: 20, stiffness: 90 
    });
  };

  return (
    <Animated.View style={[styles.cardContainer, cardStyle, style]}>
      <LinearGradient
        colors={['#1E293B', '#334155']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative elements */}
        <View style={styles.decorativeCircle} />
        <View style={styles.decorativeRect} />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image 
                source={{ uri: profile.avatar_url }} 
                style={styles.avatar} 
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={34} color="#E2E8F0" />
              </View>
            )}
          </View>
          
          <View style={styles.nameSection}>
            <Text style={styles.name}>
              {profile?.full_name || "Dr. Jane Smith"}
            </Text>
            <Text style={styles.specialty}>
              {profile?.specialty || "Cardiology"}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />
        
        {/* Details */}
        <View style={styles.detailsContainer}>
          {/* Row 1: Hospital & Location */}
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Building size={16} color="#CBD5E1" style={styles.icon} />
              <Text style={styles.detailText} numberOfLines={1}>
                {profile?.hospital || "Mayo Clinic"}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <MapPin size={16} color="#CBD5E1" style={styles.icon} />
              <Text style={styles.detailText} numberOfLines={1}>
                {profile?.location || "Rochester, MN"}
              </Text>
            </View>
          </View>
          
          {/* Row 2: Contact Information */}
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Phone size={16} color="#CBD5E1" style={styles.icon} />
              <Text style={styles.detailText} numberOfLines={1}>
                {profile?.phone || "+1 (555) 123-4567"}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Mail size={16} color="#CBD5E1" style={styles.icon} />
              <Text style={styles.detailText} numberOfLines={1}>
                {profile?.email || "doctor@medical.org"}
              </Text>
            </View>
          </View>
          
          {/* Row 3: Website & Experience */}
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Link size={16} color="#CBD5E1" style={styles.icon} />
              <Text style={styles.detailText} numberOfLines={1}>
                {profile?.website || "medico.app/dr-smith"}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Award size={16} color="#CBD5E1" style={styles.icon} />
              <Text style={styles.detailText}>
                {profile?.years_experience || "15"} Years Experience
              </Text>
            </View>
          </View>
        </View>
        
        {/* Action buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onShare}
          >
            <Share2 size={18} color="#E2E8F0" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onQrView}
          >
            <QrCode size={18} color="#E2E8F0" />
          </TouchableOpacity>
        </View>
        
        {/* Animated highlight overlay */}
        <Animated.View style={[styles.highlightOverlay, highlightStyle]} />
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  decorativeCircle: {
    position: 'absolute',
    width: CARD_WIDTH * 0.8,
    height: CARD_WIDTH * 0.8,
    borderRadius: CARD_WIDTH * 0.4,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    top: -CARD_WIDTH * 0.4,
    right: -CARD_WIDTH * 0.2,
  },
  decorativeRect: {
    position: 'absolute',
    width: CARD_WIDTH * 0.6,
    height: CARD_WIDTH * 0.6,
    transform: [{ rotate: '45deg' }],
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    bottom: -CARD_WIDTH * 0.3,
    left: -CARD_WIDTH * 0.2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameSection: {
    flex: 1,
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
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 14,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'space-around',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  icon: {
    marginRight: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#E2E8F0',
    flex: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  highlightOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
});

export default BusinessCard; 