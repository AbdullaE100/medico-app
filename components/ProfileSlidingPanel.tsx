import React, { useEffect, useState, useCallback } from 'react';
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
  Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
  useDerivedValue,
  withRepeat
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView
} from 'react-native-gesture-handler';
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
  Award
} from 'lucide-react-native';
import { useProfileStore } from '@/stores/useProfileStore';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PANEL_WIDTH = SCREEN_WIDTH * 0.8;
const SPRING_CONFIG = {
  damping: 17,
  stiffness: 90,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01
};

interface ProfileSlidingPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

const ProfileSlidingPanel: React.FC<ProfileSlidingPanelProps> = ({ 
  isVisible, 
  onClose 
}) => {
  const router = useRouter();
  const { profile, fetchProfile, isLoading } = useProfileStore();
  const [profileLoadError, setProfileLoadError] = useState(false);
  const [showBusinessCardModal, setShowBusinessCardModal] = useState(false);

  // Animation values
  const translateX = useSharedValue(PANEL_WIDTH);
  const backdropOpacity = useSharedValue(0);
  const panelVisible = useSharedValue(false);

  // Load profile data whenever panel becomes visible
  useEffect(() => {
    if (isVisible) {
      loadProfileData();
    }
  }, [isVisible]);

  const loadProfileData = useCallback(async () => {
    try {
      setProfileLoadError(false);
      await fetchProfile();
    } catch (error) {
      console.error('Error loading profile data:', error);
      setProfileLoadError(true);
    }
  }, [fetchProfile]);

  // Panel visibility animation
  useEffect(() => {
    if (isVisible) {
      panelVisible.value = true;
      backdropOpacity.value = withTiming(1, { duration: 250 });
      translateX.value = withSpring(0, {
        ...SPRING_CONFIG,
        stiffness: 80, // Slightly softer spring for smoother entry
      });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateX.value = withSpring(PANEL_WIDTH, SPRING_CONFIG, () => {
        runOnJS(resetPanel)();
      });
    }
  }, [isVisible]);

  const resetPanel = () => {
    panelVisible.value = false;
  };

  // Derived animation for additional effects
  const scale = useDerivedValue(() => {
    return interpolate(
      translateX.value,
      [0, PANEL_WIDTH],
      [1, 0.9],
      Extrapolate.CLAMP
    );
  });

  // Pan gesture handler with improved physics
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // Start gesture only after moving 10px horizontally
    .onUpdate((e) => {
      const dragX = Math.max(0, e.translationX);
      translateX.value = dragX;
      
      // Calculate backdrop opacity based on panel position
      backdropOpacity.value = interpolate(
        dragX,
        [0, PANEL_WIDTH],
        [1, 0],
        Extrapolate.CLAMP
      );
    })
    .onEnd((e) => {
      const velocity = e.velocityX;
      
      // Fast swipe detection (velocity > 500 px/s)
      if (velocity > 500 || e.translationX > PANEL_WIDTH * 0.3) {
        // User dragged more than 30% or swiped quickly - close the panel
        backdropOpacity.value = withTiming(0, { duration: 200 });
        translateX.value = withSpring(PANEL_WIDTH, {
          ...SPRING_CONFIG,
          velocity: velocity, // Use the velocity for more natural feel
        }, () => {
          runOnJS(onClose)();
          runOnJS(resetPanel)();
        });
      } else {
        // Snap back to open position
        translateX.value = withSpring(0, {
          ...SPRING_CONFIG,
          velocity: velocity,
        });
        backdropOpacity.value = withTiming(1, { duration: 200 });
      }
    });

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    display: panelVisible.value ? 'flex' : 'none',
  }));

  const panelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value }
    ],
    opacity: interpolate(
      translateX.value,
      [0, PANEL_WIDTH],
      [1, 0.5],
      Extrapolate.CLAMP
    ),
    display: panelVisible.value ? 'flex' : 'none',
  }));

  // Navigation handlers
  const navigateTo = (path: string) => {
    onClose();
    // Use proper path format for expo-router
    if (path === '/profile') {
      router.push('/(tabs)/profile');
    } else if (path === '/profile/edit') {
      router.push('/(tabs)/profile/edit');
    } else if (path === '/profile/settings') {
      router.push('/(tabs)/profile/settings');
    }
  };

  const openBusinessCard = () => {
    setShowBusinessCardModal(true);
  };

  const handleLogout = () => {
    // Implement logout logic
    onClose();
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
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {profile?.full_name || "Your Name"}
            </Text>
            <View style={styles.specialtyContainer}>
              <Text style={styles.profileSpecialty}>
                {profile?.specialty || "Healthcare Professional"}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.menuScrollView}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          {/* Specialty highlight section */}
          {profile?.specialty && (
            <View style={styles.specialtyHighlightContainer}>
              <LinearGradient
                colors={['rgba(0, 102, 204, 0.15)', 'rgba(0, 145, 255, 0.25)']}
                style={styles.specialtyHighlightGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Stethoscope size={22} color="#0066CC" />
                <Text style={styles.specialtyHighlightText}>
                  {profile.specialty}
                </Text>
              </LinearGradient>
            </View>
          )}

          {/* Professional information section */}
          <View style={styles.infoSectionContainer}>
            {profile?.hospital && (
              <View style={styles.infoCard}>
                <LinearGradient
                  colors={['rgba(0, 102, 204, 0.1)', 'rgba(0, 145, 255, 0.1)']}
                  style={styles.infoCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.infoItem}>
                    <Briefcase size={18} color="#0066CC" />
                    <Text style={styles.infoItemText}>{profile.hospital}</Text>
                  </View>
                </LinearGradient>
              </View>
            )}
            
            {profile?.location && (
              <View style={styles.infoCard}>
                <LinearGradient
                  colors={['rgba(0, 102, 204, 0.1)', 'rgba(0, 145, 255, 0.1)']}
                  style={styles.infoCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.infoItem}>
                    <MapPin size={18} color="#0066CC" />
                    <Text style={styles.infoItemText}>{profile.location}</Text>
                  </View>
                </LinearGradient>
              </View>
            )}

            {profile?.bio && (
              <View style={styles.bioContainer}>
                <Text style={styles.sectionTitle}>About</Text>
                <View style={styles.bioCardContainer}>
                  <Text style={styles.bioText}>{profile.bio}</Text>
                </View>
              </View>
            )}
            
            {profile?.expertise && profile.expertise.length > 0 && (
              <View style={styles.expertiseContainer}>
                <Text style={styles.sectionTitle}>Areas of Expertise</Text>
                <View style={styles.expertiseTagsContainer}>
                  {profile.expertise.map((area, index) => (
                    <LinearGradient
                      key={index}
                      colors={['rgba(0, 102, 204, 0.08)', 'rgba(0, 145, 255, 0.12)']}
                      style={styles.expertiseTag}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.expertiseTagText}>{area}</Text>
                    </LinearGradient>
                  ))}
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigateTo('/profile/edit')}
          >
            <View style={styles.menuItemLeft}>
              <Settings size={22} color="#0066CC" />
              <Text style={styles.menuItemText}>Edit Profile</Text>
            </View>
            <ChevronRight size={18} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={openBusinessCard}
          >
            <View style={styles.menuItemLeft}>
              <Award size={22} color="#0066CC" />
              <Text style={styles.menuItemText}>Digital Business Card</Text>
            </View>
            <ChevronRight size={18} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigateTo('/profile/settings')}
          >
            <View style={styles.menuItemLeft}>
              <Settings size={22} color="#0066CC" />
              <Text style={styles.menuItemText}>App Settings</Text>
            </View>
            <ChevronRight size={18} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogout}
          >
            <View style={styles.menuItemLeft}>
              <LogOut size={22} color="#FF3B30" />
              <Text style={[styles.menuItemText, styles.logoutText]}>Log Out</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </>
    );
  };

  return (
    <>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity 
          style={styles.backdropTouchable} 
          activeOpacity={1} 
          onPress={onClose} 
        />
      </Animated.View>

      <GestureHandlerRootView style={StyleSheet.absoluteFill}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.panel, panelStyle]}>
            <View style={styles.blurContainer}>
              <View style={styles.innerContainer}>
                <View style={styles.header}>
                  <View style={styles.headerTop}>
                    <Text style={styles.title}>Profile</Text>
                    <TouchableOpacity 
                      style={styles.closeButton} 
                      onPress={onClose}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <X size={24} color="#333" />
                    </TouchableOpacity>
                  </View>
                  
                  {renderProfileContent()}
                </View>
              </View>
            </View>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>

      {/* Business Card Modal */}
      <BusinessCardModal 
        isVisible={showBusinessCardModal}
        onClose={() => setShowBusinessCardModal(false)}
        profile={profile}
      />
    </>
  );
};

interface BusinessCardModalProps {
  isVisible: boolean;
  onClose: () => void;
  profile: any;
}

const BusinessCardModal: React.FC<BusinessCardModalProps> = ({ 
  isVisible, 
  onClose, 
  profile 
}) => {
  // Animation values
  const translateY = useSharedValue(300);
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);
  const cardRotation = useSharedValue(0);
  const gradientPosition = useSharedValue(0);
  
  useEffect(() => {
    if (isVisible) {
      // Beautiful entrance animation sequence
      opacity.value = withTiming(1, { duration: 350 });
      translateY.value = withSpring(0, {
        ...SPRING_CONFIG,
        stiffness: 80,
        damping: 15,
      });
      scale.value = withSpring(1, SPRING_CONFIG);
      
      // Subtle rotation reset
      cardRotation.value = withTiming(0, { duration: 400 });
      
      // Animate gradient shimmer
      gradientPosition.value = withRepeat(
        withTiming(1, { duration: 2000 }),
        -1, // infinite repeat
        true // yoyo: go back and forth
      );
    } else {
      opacity.value = withTiming(0, { duration: 300 });
      translateY.value = withSpring(300, SPRING_CONFIG);
      scale.value = withSpring(0.95, SPRING_CONFIG);
    }
  }, [isVisible]);

  // Pan gesture with 3D rotation effect for premium feel
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY * 0.6; // Dampen movement for better feel
        
        // Reduce opacity and scale as dragged down
        opacity.value = interpolate(
          e.translationY,
          [0, 300],
          [1, 0.7],
          Extrapolate.CLAMP
        );
        
        scale.value = interpolate(
          e.translationY,
          [0, 300],
          [1, 0.95],
          Extrapolate.CLAMP
        );
        
        // Add 3D rotation based on horizontal movement
        cardRotation.value = interpolate(
          e.translationX,
          [-150, 150],
          [-0.03, 0.03],
          Extrapolate.CLAMP
        );
      }
    })
    .onEnd((e) => {
      const velocity = e.velocityY;
      
      if (velocity > 500 || e.translationY > 100) {
        // User dragged down enough or swiped quickly - close
        opacity.value = withTiming(0, { duration: 200 });
        translateY.value = withSpring(500, {
          ...SPRING_CONFIG,
          velocity: velocity * 0.3,
        }, () => {
          runOnJS(onClose)();
        });
        scale.value = withSpring(0.9, SPRING_CONFIG);
      } else {
        // Snap back with elegant animation
        translateY.value = withSpring(0, {
          ...SPRING_CONFIG,
          stiffness: 200,
          damping: 20,
          velocity: velocity * 0.3,
        });
        scale.value = withSpring(1, {
          ...SPRING_CONFIG,
          stiffness: 200,
        });
        opacity.value = withTiming(1, { duration: 150 });
        cardRotation.value = withTiming(0, { duration: 250 });
      }
    });

  // Animated styles
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
    transform: [{ translateX: interpolate(
      gradientPosition.value,
      [0, 1],
      [-200, 200]
    )}],
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
        <Animated.View style={[styles.modalBackdrop, backdropStyle]}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>
        
        <GestureHandlerRootView style={styles.gestureContainer}>
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.businessCard, cardStyle]}>
              <View style={styles.cardShadowWrapper}>
                {/* Premium shimmer effect overlay */}
                <Animated.View style={[StyleSheet.absoluteFill, styles.shimmerContainer, shimmerStyle]}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0)']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.shimmerGradient}
                  />
                </Animated.View>
              
                <View style={styles.cardContainer}>
                  {/* Premium card handle */}
                  <View style={styles.cardHandleContainer}>
                    <View style={styles.cardHandle} />
                  </View>
                  
                  {/* Header Section */}
                  <View style={styles.cardHeader}>
                    <View>
                      <View style={styles.brandRow}>
                        <Sparkles size={16} color="#0066CC" />
                        <Text style={styles.brandText}>Digital Business Card</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      onPress={onClose} 
                      style={styles.closeCardButton}
                    >
                      <X size={18} color="#666666" />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Professional header with gradient */}
                  <View style={styles.cardBannerContainer}>
                    <LinearGradient
                      colors={['#0047AB', '#0066CC', '#1E90FF']}
                      style={styles.cardBanner}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {/* Avatar with elegant border */}
                      <View style={styles.cardAvatarOuterRing}>
                        <View style={styles.cardAvatarRing}>
                          <View style={styles.cardAvatarWrapper}>
                            {profile?.avatar_url ? (
                              <Image 
                                source={{ uri: profile.avatar_url }} 
                                style={styles.cardAvatarImage} 
                              />
                            ) : (
                              <View style={styles.cardAvatarPlaceholder}>
                                <User size={40} color="#FFFFFF" />
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                      
                      <Text style={styles.cardNameText}>
                        {profile?.full_name || "Your Name"}
                      </Text>
                      
                      {profile?.specialty && (
                        <View style={styles.cardSpecialtyBadge}>
                          <Stethoscope size={14} color="#FFFFFF" />
                          <Text style={styles.cardSpecialtyText}>
                            {profile.specialty}
                          </Text>
                        </View>
                      )}
                    </LinearGradient>
                  </View>
                  
                  {/* Professional information section - condensed */}
                  <View style={styles.cardInfoSection}>
                    <Text style={styles.sectionLabel}>PROFESSIONAL DETAILS</Text>
                    
                    {profile?.hospital && (
                      <View style={styles.cardInfoRow}>
                        <View style={styles.cardInfoIconContainer}>
                          <Briefcase size={16} color="#0066CC" />
                        </View>
                        <Text style={styles.cardInfoText}>{profile.hospital}</Text>
                      </View>
                    )}
                    
                    {profile?.location && (
                      <View style={styles.cardInfoRow}>
                        <View style={styles.cardInfoIconContainer}>
                          <MapPin size={16} color="#0066CC" />
                        </View>
                        <Text style={styles.cardInfoText}>{profile.location}</Text>
                      </View>
                    )}
                    
                    {/* Specialty is already shown in the header - only include if not shown there */}
                    {!profile?.specialty && (
                      <View style={styles.cardInfoRow}>
                        <View style={styles.cardInfoIconContainer}>
                          <Stethoscope size={16} color="#0066CC" />
                        </View>
                        <Text style={styles.cardInfoText}>Medical Professional</Text>
                      </View>
                    )}
                  </View>
                  
                  {/* QR Code section - simplified */}
                  <View style={styles.qrCodeSection}>
                    <View style={styles.qrCodeTopRow}>
                      <Text style={styles.qrCodeTitle}>Connect</Text>
                      <View style={styles.qrCodeDivider} />
                    </View>
                    
                    <View style={styles.qrCodeBorder}>
                      <View style={styles.qrCodeContainer}>
                        <QrCode size={120} color="#000000" />
                      </View>
                    </View>
                    
                    <Text style={styles.qrCodeDescription}>
                      Scan to connect with my professional profile
                    </Text>
                  </View>
                  
                  {/* Action buttons - share only */}
                  <TouchableOpacity 
                    style={styles.singleActionButton} 
                    onPress={handleShare}
                  >
                    <Share2 size={18} color="#FFFFFF" />
                    <Text style={styles.cardActionText}>Share Profile</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </GestureDetector>
        </GestureHandlerRootView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 999,
  },
  backdropTouchable: {
    flex: 1,
  },
  panel: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: PANEL_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: 'transparent',
    zIndex: 1000,
    overflow: 'hidden',
  },
  blurContainer: {
    flex: 1,
    overflow: 'hidden',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  innerContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    fontFamily: 'Inter_700Bold',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Inter_500Medium',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 16,
    fontFamily: 'Inter_500Medium',
  },
  retryButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter_400Regular',
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  avatarImage: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    fontFamily: 'Inter_600SemiBold',
  },
  specialtyContainer: {
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  profileSpecialty: {
    fontSize: 16,
    color: '#0066CC',
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  menuScrollView: {
    flex: 1,
    marginTop: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 17,
    marginLeft: 16,
    color: '#333',
    fontFamily: 'Inter_500Medium',
  },
  logoutItem: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  logoutText: {
    color: '#FF3B30',
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  versionText: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'Inter_400Regular',
  },
  infoSectionContainer: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  infoCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoCardGradient: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItemText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Inter_700Bold',
  },
  bioContainer: {
    marginTop: 16,
    marginBottom: 20,
  },
  bioCardContainer: {
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.1)',
  },
  bioText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  expertiseContainer: {
    marginBottom: 20,
  },
  expertiseTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  expertiseTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.1)',
  },
  expertiseTagText: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  specialtyHighlightContainer: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  specialtyHighlightGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.2)',
  },
  specialtyHighlightText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0066CC',
    marginLeft: 12,
    fontFamily: 'Inter_700Bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 25, 38, 0.9)',
  },
  gestureContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessCard: {
    width: SCREEN_WIDTH * 0.88,
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardShadowWrapper: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 24,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    position: 'relative',
  },
  shimmerContainer: {
    overflow: 'hidden',
    zIndex: 10,
  },
  shimmerGradient: {
    width: 400,
    height: '100%',
    position: 'absolute',
  },
  cardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  cardHandleContainer: {
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(247, 249, 252, 0.8)',
  },
  cardHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(247, 249, 252, 0.8)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0066CC',
    fontFamily: 'Inter_500Medium',
  },
  closeCardButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBannerContainer: {
    overflow: 'hidden',
  },
  cardBanner: {
    width: '100%',
    paddingTop: 25,
    paddingBottom: 25,
    alignItems: 'center',
  },
  cardAvatarOuterRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatarRing: {
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatarWrapper: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    padding: 3,
    marginBottom: 0,
  },
  cardAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cardAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cardNameText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSpecialtyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 6,
  },
  cardSpecialtyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999999',
    marginBottom: 12,
    letterSpacing: 1,
    fontFamily: 'Inter_700Bold',
  },
  cardInfoSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardInfoIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfoText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  qrCodeSection: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 10,
  },
  qrCodeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  qrCodeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Inter_600SemiBold',
    marginRight: 12,
  },
  qrCodeDivider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  qrCodeBorder: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F7F9FC',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  qrCodeContainer: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  qrCodeDescription: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'Inter_400Regular',
    marginTop: 12,
    textAlign: 'center',
  },
  singleActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066CC',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 24,
    marginVertical: 16,
    borderRadius: 12,
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    gap: 8,
  },
  cardActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
});

export default ProfileSlidingPanel; 