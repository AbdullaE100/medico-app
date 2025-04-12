import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
  Linking,
  SafeAreaView,
  Pressable,
  Animated as RNAnimated,
  Alert,
  Share
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { 
  User,
  Settings,
  Briefcase,
  LogOut,
  X,
  ChevronRight,
  MapPin,
  Stethoscope,
  UserCheck,
  Share2,
  QrCode,
  Mail,
  Phone,
  Globe,
  Sparkles,
  Download,
  Award,
  UserCircle,
  Heart
} from 'lucide-react-native';
import { useProfileStore } from '@/stores/useProfileStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PANEL_WIDTH = SCREEN_WIDTH * 0.8;
const SPRING_CONFIG = {
  damping: 26,
  stiffness: 130,
  mass: 1.2,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01
};

// Added separate config for opening animation
const OPEN_SPRING_CONFIG = {
  damping: 30,
  stiffness: 140,
  mass: 1.2,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01
};

interface ExtendedProfile {
  full_name?: string;
  specialty?: string;
  hospital?: string;
  location?: string;
  bio?: string;
  expertise?: string[];
  avatar_url?: string;
  work_experience?: any[];
  education?: any[];
  // Additional properties used in this component
  years?: string;
  email?: string;
}

interface ProfileSlidingPanelProps {
  isVisible: boolean;
  onClose: () => void;
  userId: string;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const ProfileSlidingPanel: React.FC<ProfileSlidingPanelProps> = ({ 
  isVisible, 
  onClose,
  userId
}) => {
  const router = useRouter();
  const { profile, fetchProfile, isLoading } = useProfileStore();
  const [profileLoadError, setProfileLoadError] = useState(false);
  const [showBusinessCardModal, setShowBusinessCardModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState('view_profile');
  const [isBusinessCardVisible, setIsBusinessCardVisible] = useState(false);
  
  // Animation values
  const slideAnim = useRef(new RNAnimated.Value(Dimensions.get('window').width)).current;
  const backdropOpacity = useRef(new RNAnimated.Value(0)).current;

  // Define loadProfileData before it's used
  const loadProfileData = useCallback(async () => {
    try {
      setProfileLoadError(false);
      // Use userId to fetch the profile
      if (userId) {
        await fetchProfile();
        console.log("Profile data loaded for userId:", userId);
      } else {
        console.error("No userId provided to ProfileSlidingPanel");
        setProfileLoadError(true);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      setProfileLoadError(true);
    }
  }, [fetchProfile, userId]);

  useEffect(() => {
    // Initialize for right-side panel
    slideAnim.setValue(Dimensions.get('window').width);
    console.log("Component mounted, reset slideAnim value to:", Dimensions.get('window').width);
  }, []);

  useEffect(() => {
    if (isVisible) {
      // Start animations when panel becomes visible
      console.log("ProfileSlidingPanel is now visible, starting animation from:", Dimensions.get('window').width, "to 0");
      RNAnimated.parallel([
        RNAnimated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        RNAnimated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        console.log("Animation completed - panel should be visible now");
      });
      
      loadProfileData();
    } else {
      // Animate panel out when closed
      console.log("ProfileSlidingPanel is now hidden, starting animation from current position to:", Dimensions.get('window').width);
      RNAnimated.parallel([
        RNAnimated.timing(slideAnim, {
          toValue: Dimensions.get('window').width,
          duration: 300,
          useNativeDriver: true,
        }),
        RNAnimated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        console.log("Hide animation completed");
      });
    }
  }, [isVisible, loadProfileData]);

  // Navigation handlers
  const navigateTo = (path: string) => {
    console.log('Navigating to:', path);
    onClose(); // Close the panel before navigation
    
    // Use router.push for all navigation to maintain the navigation stack
    // This allows users to return to their previous location when pressing back
    setTimeout(() => {
      router.push(path as any);
    }, 300); // Keep the delay to ensure panel closes smoothly
  };

  const openBusinessCard = () => {
    setShowBusinessCardModal(true);
  };

  const handleLogout = () => {
    // Implement logout logic
    onClose();
  };

  // Create a menu item component
  const MenuItem = ({ 
    icon, 
    label, 
    onPress, 
    rightContent 
  }: { 
    icon: React.ReactNode; 
    label: string; 
    onPress: () => void; 
    rightContent?: React.ReactNode 
  }) => {
    return (
      <TouchableOpacity
        style={[styles.menuItemAlt, rightContent ? styles.menuItemWithArrow : null]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.menuIconContainer}>
          {icon}
        </View>
        <Text style={styles.menuItemText}>{label}</Text>
        {rightContent && (
          <View style={styles.menuItemRight}>
            {rightContent}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render menu item
  const renderMenuItem = (
    icon: React.ReactNode,
    label: string,
    onPress: () => void,
    rightContent?: React.ReactNode
  ) => {
    return (
      <MenuItem
        icon={icon}
        label={label}
        onPress={onPress}
        rightContent={rightContent}
      />
    );
  };

  // Render profile content or loading state
  const renderProfileContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      );
    }

    if (profileLoadError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load profile data</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadProfileData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        <View style={styles.profileHeader}>
          <View style={styles.profileTopSection}>
            <LinearGradient
              colors={['#0066CC', '#0091FF']}
              style={styles.avatarContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImage}
                />
              ) : (
                <User size={30} color="#FFFFFF" />
              )}
            </LinearGradient>
            <Text style={styles.profileName}>
              {profile?.full_name || "Your Name"}
            </Text>
          </View>
          
          {/* Specialty badge centered below name */}
          <View style={styles.specialtyBadgeContainer}>
            <View style={styles.specialtyBadgeAlt}>
              <Heart size={14} color="#0066CC" style={{marginRight: 4}} />
              <Text style={styles.specialtyTextAlt}>Cardiology</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.menuScrollView}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          {/* Professional information section */}
          <View style={styles.infoSectionContainer}>
            {profile?.specialty && (
              <View style={styles.infoCard}>
                <View style={styles.infoCardContent}>
                  <Stethoscope size={20} color="#0066CC" />
                  <Text style={styles.infoItemText}>Cardiology</Text>
                </View>
              </View>
            )}
            
            {profile?.hospital && (
              <View style={styles.infoCard}>
                <View style={styles.infoCardContent}>
                  <Briefcase size={20} color="#0066CC" />
                  <Text style={styles.infoItemText}>{profile.hospital}</Text>
                </View>
              </View>
            )}
            
            {profile?.location && (
              <View style={styles.infoCard}>
                <View style={styles.infoCardContent}>
                  <MapPin size={20} color="#0066CC" />
                  <Text style={styles.infoItemText}>{profile.location}</Text>
                </View>
              </View>
            )}

            {/* Add a certification badge here instead of in the stats row */}
            <View style={styles.infoCard}>
              <View style={styles.infoCardContent}>
                <Award size={20} color="#0066CC" />
                <Text style={styles.infoItemText}>Board Certified Cardiologist</Text>
              </View>
            </View>

            {profile?.bio && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>About</Text>
                <View style={styles.contentCard}>
                  <Text style={styles.bioText}>{profile.bio}</Text>
                </View>
              </View>
            )}
            
            {profile?.expertise && profile.expertise.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>Areas of Expertise</Text>
                <View style={styles.expertiseTagsContainer}>
                  {profile.expertise.map((area, index) => (
                    <View key={index} style={styles.expertiseTag}>
                      <Text style={styles.expertiseTagText}>{area}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Navigation buttons instead of tabs */}
        <View style={styles.menuSection}>
          {renderMenuItem(
            <User size={20} color="#0066CC" />,
            'Edit Profile',
            () => navigateTo('/(tabs)/profile/edit'),
            <ChevronRight size={18} color="#999" />
          )}
          
          {renderMenuItem(
            <UserCircle size={20} color="#0066CC" />,
            'View Profile',
            () => navigateTo('/(tabs)/profile'),
            <ChevronRight size={18} color="#999" />
          )}
          
          {renderMenuItem(
            <Settings size={20} color="#0066CC" />,
            'App Settings',
            () => navigateTo('/(tabs)/profile/settings'),
            <ChevronRight size={18} color="#999" />
          )}
          
          {renderMenuItem(
            <QrCode size={20} color="#0066CC" />,
            'Digital Business Card',
            openBusinessCard,
            <ChevronRight size={18} color="#999" />
          )}
          
          {renderMenuItem(
            <LogOut size={20} color="#FF3B30" />,
            'Log Out',
            handleLogout
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </>
    );
  };

  const handleClosePanel = () => {
    // Animate out first, then call onClose
    RNAnimated.parallel([
      RNAnimated.timing(slideAnim, {
        toValue: Dimensions.get('window').width,
        duration: 300,
        useNativeDriver: true,
      }),
      RNAnimated.timing(backdropOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      onClose();
    });
  };

  // Use a Modal approach with animation
  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClosePanel}
      statusBarTranslucent={true}
    >
      <View style={[styles.container]}>
        <RNAnimated.View 
          style={[
            styles.backdrop, 
            { opacity: backdropOpacity }
          ]}
        >
          <Pressable 
            style={styles.backdropPressable} 
            onPress={handleClosePanel}
          />
        </RNAnimated.View>
        
        <RNAnimated.View 
          style={[
            styles.panel,
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClosePanel}
              >
                <Feather name="chevron-left" size={22} color="#334155" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Profile</Text>
              <View style={styles.headerRightPlaceholder} />
            </View>
            
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0066CC" />
                <Text style={styles.loadingText}>Loading profile...</Text>
              </View>
            ) : profileLoadError ? (
              <View style={styles.errorContainer}>
                <View style={styles.errorIconContainer}>
                  <Feather name="alert-circle" size={32} color="#EF4444" />
                </View>
                <Text style={styles.errorTitle}>Couldn't Load Profile</Text>
                <Text style={styles.errorDescription}>{profileLoadError}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={loadProfileData}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.profileHeader}>
                  <View style={styles.profileTopSection}>
                    <LinearGradient
                      colors={['#0066CC', '#0091FF']}
                      style={styles.avatarContainer}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {profile?.avatar_url ? (
                        <Image
                          source={{ uri: profile.avatar_url }}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <User size={30} color="#FFFFFF" />
                      )}
                    </LinearGradient>
                    <Text style={styles.profileName}>
                      {profile?.full_name || "Your Name"}
                    </Text>
                  </View>
                  
                  {/* Specialty badge centered below name */}
                  <View style={styles.specialtyBadgeContainer}>
                    <View style={styles.specialtyBadgeAlt}>
                      <Heart size={14} color="#0066CC" style={{marginRight: 4}} />
                      <Text style={styles.specialtyTextAlt}>Cardiology</Text>
                    </View>
                  </View>
                </View>
                
                {/* Navigation buttons instead of tabs */}
                <View style={styles.menuSection}>
                  {renderMenuItem(
                    <User size={20} color="#0066CC" />,
                    'Edit Profile',
                    () => navigateTo('/(tabs)/profile/edit'),
                    <ChevronRight size={18} color="#999" />
                  )}
                  
                  {renderMenuItem(
                    <UserCircle size={20} color="#0066CC" />,
                    'View Profile',
                    () => navigateTo('/(tabs)/profile'),
                    <ChevronRight size={18} color="#999" />
                  )}
                  
                  {renderMenuItem(
                    <Settings size={20} color="#0066CC" />,
                    'App Settings',
                    () => navigateTo('/(tabs)/profile/settings'),
                    <ChevronRight size={18} color="#999" />
                  )}
                  
                  {renderMenuItem(
                    <QrCode size={20} color="#0066CC" />,
                    'Digital Business Card',
                    openBusinessCard,
                    <ChevronRight size={18} color="#999" />
                  )}
                  
                  {renderMenuItem(
                    <LogOut size={20} color="#FF3B30" />,
                    'Log Out',
                    handleLogout
                  )}
                </View>
              </ScrollView>
            )}
          </SafeAreaView>
        </RNAnimated.View>
        
        {/* Business Card Modal */}
        <BusinessCardModal 
          isVisible={showBusinessCardModal}
          onClose={() => setShowBusinessCardModal(false)}
          profile={profile as ExtendedProfile}
        />
      </View>
    </Modal>
  );
};

interface BusinessCardModalProps {
  isVisible: boolean;
  onClose: () => void;
  profile: ExtendedProfile;
}

const BusinessCardModal: React.FC<BusinessCardModalProps> = ({ 
  isVisible, 
  onClose, 
  profile 
}) => {
  // Animation values using Reanimated
  const translateY = useSharedValue(300);
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);
  const cardRotation = useSharedValue(0);
  const gradientPosition = useSharedValue(0);
  
  useEffect(() => {
    if (isVisible) {
      // Beautiful entrance animation sequence
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
      scale.value = withTiming(1, { duration: 300 });
      
      // Subtle rotation reset
      cardRotation.value = withTiming(0, { duration: 300 });
      
      // Animate gradient shimmer
      gradientPosition.value = 0;
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(300, { duration: 300 });
      scale.value = withTiming(0.95, { duration: 300 });
    }
  }, [isVisible]);

  // Pan gesture with 3D rotation effect for premium feel
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY * 0.6; // Dampen movement for better feel
        
        // Reduce opacity and scale as dragged down
        opacity.value = 1 - (e.translationY / 300);
        
        scale.value = 0.95 + (e.translationY / 300);
        
        // Add 3D rotation based on horizontal movement
        cardRotation.value = e.translationX * 0.003;
      }
    })
    .onEnd((e) => {
      const velocity = e.velocityY;
      
      if (velocity > 500 || e.translationY > 100) {
        // User dragged down enough or swiped quickly - close
        opacity.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(500, { duration: 300 });
        scale.value = withTiming(0.9, { duration: 300 });
        onClose();
      } else {
        // Snap back with elegant animation
        translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
        scale.value = withSpring(1, { damping: 20, stiffness: 90 });
        opacity.value = withTiming(1, { duration: 200 });
        cardRotation.value = withTiming(0, { duration: 300 });
      }
    });

  // Animated styles using Reanimated
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.85,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { perspective: 1000 },
      { rotateX: `${cardRotation.value}rad` }
    ],
    opacity: opacity.value,
  }));
  
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ 
      translateX: interpolate(
        gradientPosition.value,
        [0, 1],
        [-200, 200],
        Extrapolate.CLAMP
      ) 
    }],
  }));

  const handleShare = async () => {
    try {
      // In a real implementation, generate a link to the user's profile
      const message = `Check out my professional profile: ${profile?.full_name} - ${profile?.specialty || "Medical Professional"}`;
      await Linking.openURL(`mailto:?subject=Professional Profile&body=${encodeURIComponent(message)}`);
    } catch (error) {
      console.error('Error sharing profile:', error);
    }
  };
  
  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalContainer}>
        <RNAnimated.View style={[styles.modalBackdrop, backdropStyle]}>
          <TouchableOpacity 
            style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0}}
            activeOpacity={1}
            onPress={onClose}
          />
        </RNAnimated.View>
        
        <GestureHandlerRootView style={styles.gestureContainer}>
          <GestureDetector gesture={panGesture}>
            <RNAnimated.View style={[styles.businessCard, cardStyle]}>
              <View style={styles.cardShadowWrapper}>
                {/* Premium shimmer effect overlay */}
                <RNAnimated.View style={[{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0}, styles.shimmerContainer, shimmerStyle]}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0)']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.shimmerGradient}
                  />
                </RNAnimated.View>
                
                <LinearGradient 
                  colors={['#0052B4', '#0066CC', '#1E90FF']} 
                  style={styles.cardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* Card handle */}
                  <View style={styles.cardHandleContainer}>
                    <View style={styles.cardHandle} />
                  </View>
                  
                  {/* Close button */}
                  <TouchableOpacity 
                    onPress={onClose} 
                    style={styles.closeCardButton}
                  >
                    <X size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  {/* Main content container */}
                  <View style={styles.cardContentContainer}>
                    {/* Profile avatar */}
                    <View style={styles.cardAvatarContainer}>
                      {profile?.avatar_url ? (
                        <Image 
                          source={{ uri: profile.avatar_url }} 
                          style={styles.cardAvatarImage} 
                        />
                      ) : (
                        <View style={styles.cardAvatarPlaceholder}>
                          <User size={30} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                    
                    {/* Name and specialty */}
                    <Text style={styles.cardNameText}>
                      {profile?.full_name || "Your Name"}
                    </Text>
                    
                    {/* Replace the dynamic specialty with Cardiology */}
                    <View style={styles.cardSpecialtyBadge}>
                      <Stethoscope size={14} color="#FFFFFF" />
                      <Text style={styles.cardSpecialtyText}>
                        Cardiology
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
                
                {/* Bottom section with QR code */}
                <View style={styles.cardBottomContainer}>
                  {/* Contact info row - modified to include specialty badge */}
                  <View style={styles.cardContactRow}>
                    {profile?.hospital && (
                      <View style={styles.cardContactItem}>
                        <Briefcase size={14} color="#0066CC" />
                        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.cardContactText}>
                          {profile.hospital}
                        </Text>
                      </View>
                    )}
                    
                    {profile?.location && (
                      <View style={styles.cardContactItem}>
                        <MapPin size={14} color="#0066CC" />
                        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.cardContactText}>
                          {profile.location}
                        </Text>
                      </View>
                    )}
                    
                    {/* New Cardiology specialty badge */}
                    <View style={styles.cardSpecialtyIndicator}>
                      <View style={styles.cardSpecialtyDot} />
                      <Text style={styles.cardSpecialtyIndicatorText}>
                        Board Certified Cardiologist
                      </Text>
                    </View>
                  </View>
                  
                  {/* QR code and action section */}
                  <View style={styles.cardQrActionContainer}>
                    {/* QR code */}
                    <View style={styles.qrCodeWrapper}>
                      <Text style={styles.qrCodeLabel}>Scan to Connect</Text>
                      <View style={styles.qrCodeBox}>
                        <QrCode size={110} color="#0066CC" />
                      </View>
                    </View>
                    
                    {/* Share button */}
                    <TouchableOpacity 
                      style={styles.cardShareButton} 
                      onPress={handleShare}
                    >
                      <LinearGradient
                        colors={['#0052B4', '#0066CC', '#1E90FF']}
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: 0,
                          bottom: 0,
                          borderRadius: 12,
                        }}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      />
                      <Share2 size={16} color="#FFFFFF" />
                      <Text style={styles.cardShareText}>Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </RNAnimated.View>
          </GestureDetector>
        </GestureHandlerRootView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute", 
    left: 0, 
    right: 0, 
    top: 0, 
    bottom: 0,
    zIndex: 9999,
    flex: 1,
    width: '100%',
    height: '100%',
  },
  hidden: {
    display: 'none',
  },
  backdrop: {
    position: "absolute", 
    left: 0, 
    right: 0, 
    top: 0, 
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  backdropPressable: {
    flex: 1,
  },
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  closeButton: {
    width: 36, 
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    fontFamily: 'Inter_600SemiBold',
  },
  headerRightPlaceholder: {
    width: 36,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 12,
  },
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 0,
    marginTop: 8,
    textAlign: 'center',
  },
  specialtyBadgeAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'center',
  },
  specialtyTextAlt: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0066CC',
    fontFamily: 'Inter_500Medium',
  },
  menuScrollView: {
    flex: 1,
  },
  infoSectionContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  infoCard: {
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  infoCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  infoItemText: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    marginLeft: 12,
  },
  sectionBlock: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  contentCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  bioText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  expertiseTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  expertiseTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#EBF5FF',
    borderWidth: 1,
    borderColor: '#D1E5FD',
  },
  expertiseTagText: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  menuSection: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEF2F6',
    marginBottom: 24,
  },
  menuItemAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
    backgroundColor: '#FFFFFF',
  },
  menuItemWithArrow: {
    paddingRight: 12,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
    fontFamily: 'Inter_500Medium',
  },
  menuItemRight: {
    marginLeft: 8,
  },
  footer: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F2F4F7',
  },
  versionText: {
    fontSize: 13,
    color: '#94A3B8',
    fontFamily: 'Inter_400Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 12,
    fontFamily: 'Inter_500Medium',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  errorDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#4B5563',
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#0066CC',
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  errorText: {
    fontSize: 15,
    color: '#EF4444',
    marginBottom: 12,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  modalBackdrop: {
    position: "absolute", 
    left: 0, 
    right: 0, 
    top: 0, 
    bottom: 0,
    backgroundColor: 'rgba(18, 25, 38, 0.8)',
  },
  gestureContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessCard: {
    width: '80%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    aspectRatio: 0.62, // Golden ratio approximation for a vertical card
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  cardShadowWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
  },
  shimmerContainer: {
    overflow: 'hidden',
    zIndex: 10,
  },
  shimmerGradient: {
    width: '200%',
    height: '100%',
  },
  cardGradient: {
    width: '100%',
    height: '50%', // Top half of the card is the gradient
    alignItems: 'center',
    position: 'relative',
  },
  cardHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  cardHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  closeCardButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cardContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  cardAvatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 2,
    marginBottom: 12,
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  cardAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cardAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cardNameText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardSpecialtyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    gap: 5,
  },
  cardSpecialtyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
  },
  cardBottomContainer: {
    backgroundColor: '#FFFFFF',
    height: '50%', // Bottom half of the card is white
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  cardContactRow: {
    flexDirection: 'column',
    gap: 8,
  },
  cardContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardContactText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  cardQrActionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  qrCodeWrapper: {
    alignItems: 'center',
    width: '65%',
  },
  qrCodeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  qrCodeBox: {
    padding: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 6,
    alignSelf: 'flex-end',
    width: '30%',
  },
  cardShareText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  avatarOuterRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    padding: 3,
  },
  avatarPlaceholder: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  nameText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  statsRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  statItemCompact: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  statValueCompact: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    fontFamily: 'Inter_600SemiBold',
  },
  statLabelCompact: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  cardCertificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  cardCertificationText: {
    fontSize: 13,
    color: '#FFFFFF',
    marginLeft: 6,
    fontFamily: 'Inter_600SemiBold',
  },
  cardSpecialtyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    marginTop: 4,
  },
  cardSpecialtyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0066CC',
    marginRight: 8,
  },
  cardSpecialtyIndicatorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0066CC',
    fontFamily: 'Inter_600SemiBold',
  },
  profileTopSection: {
    alignItems: 'center',
    marginBottom: 10,
  },
  specialtyBadgeContainer: {
    alignItems: 'center',
    marginTop: 0,
  },
});

export default ProfileSlidingPanel; 