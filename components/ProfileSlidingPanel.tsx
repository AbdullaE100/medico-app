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
  Modal,
  ActivityIndicator
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
  useDerivedValue
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
  Share2,
  QrCode,
  Shield,
  Clock,
  Star
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
  const [showBusinessCardModal, setShowBusinessCardModal] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState(false);

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
            <Text style={styles.profileSpecialty}>
              {profile?.specialty || "Healthcare Professional"}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.menuScrollView}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          {profile?.specialty && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Shield size={20} color="#0066CC" />
                <Text style={styles.statValue}>{profile?.years_experience || "5+"}</Text>
                <Text style={styles.statLabel}>Years</Text>
              </View>
              <View style={styles.statItem}>
                <Star size={20} color="#0066CC" />
                <Text style={styles.statValue}>{profile?.rating || "4.9"}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statItem}>
                <Clock size={20} color="#0066CC" />
                <Text style={styles.statValue}>{profile?.patients_count || "120+"}</Text>
                <Text style={styles.statLabel}>Patients</Text>
              </View>
            </View>
          )}

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigateTo('/profile')}
          >
            <View style={styles.menuItemLeft}>
              <User size={22} color="#0066CC" />
              <Text style={styles.menuItemText}>View Full Profile</Text>
            </View>
            <ChevronRight size={18} color="#999" />
          </TouchableOpacity>

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
              <Briefcase size={22} color="#0066CC" />
              <Text style={styles.menuItemText}>Business Card</Text>
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
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      // Sequence of animations for elegant opening
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, {
        ...SPRING_CONFIG,
        stiffness: 80,
        damping: 15,
      });
      scale.value = withSpring(1, SPRING_CONFIG);
      
      // Subtle rotation effect
      rotation.value = withTiming(0, { duration: 500 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withSpring(300, SPRING_CONFIG);
      scale.value = withSpring(0.8, SPRING_CONFIG);
    }
  }, [isVisible]);

  // Pan gesture for card dismissal with improved physics
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
        
        // Reduce opacity and scale as dragged down
        opacity.value = interpolate(
          e.translationY,
          [0, 300],
          [1, 0.5],
          Extrapolate.CLAMP
        );
        
        scale.value = interpolate(
          e.translationY,
          [0, 300],
          [1, 0.85],
          Extrapolate.CLAMP
        );
        
        // Add slight rotation based on horizontal movement
        rotation.value = interpolate(
          e.translationX,
          [-100, 100],
          [-0.05, 0.05],
          Extrapolate.CLAMP
        );
      }
    })
    .onEnd((e) => {
      const velocity = e.velocityY;
      
      if (velocity > 500 || e.translationY > 100) {
        // User dragged down enough or swiped quickly - close the modal
        opacity.value = withTiming(0, { duration: 200 });
        translateY.value = withSpring(300, {
          ...SPRING_CONFIG,
          velocity: velocity,
        }, () => {
          runOnJS(onClose)();
        });
        scale.value = withSpring(0.8, SPRING_CONFIG);
      } else {
        // Snap back to open position
        translateY.value = withSpring(0, {
          ...SPRING_CONFIG,
          velocity: velocity,
        });
        scale.value = withSpring(1, SPRING_CONFIG);
        opacity.value = withTiming(1, { duration: 150 });
        rotation.value = withSpring(0);
      }
    });

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.9, // Darker backdrop for better visibility
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}rad` }
    ],
    opacity: opacity.value,
  }));

  const handleShare = () => {
    // Implement share functionality
  };
  
  // Determine if the card should show placeholder or real data
  const hasFullProfile = profile?.full_name && profile?.specialty;

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <Animated.View style={[styles.modalBackdrop, backdropStyle]}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <GestureHandlerRootView style={styles.gestureContainer}>
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.businessCard, cardStyle]}>
              <View style={styles.cardShadowWrapper}>
                <View style={styles.cardContainer}>
                  {/* Top handle */}
                  <View style={styles.cardHandle} />
                  
                  {/* Card header */}
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Digital Business Card</Text>
                    <TouchableOpacity 
                      onPress={handleShare} 
                      style={styles.shareButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Share2 size={20} color="#0066CC" />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Main content */}
                  <View style={styles.cardContent}>
                    {/* Profile section */}
                    <View style={styles.profileSection}>
                      <LinearGradient
                        colors={['#0066CC', '#0091FF']}
                        style={styles.profileBanner}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.profileBannerContent}>
                          <View style={styles.cardAvatarContainer}>
                            {profile?.avatar_url ? (
                              <Image 
                                source={{ uri: profile.avatar_url }} 
                                style={styles.cardAvatar} 
                              />
                            ) : (
                              <View style={styles.cardAvatarPlaceholder}>
                                <User size={40} color="#FFFFFF" />
                              </View>
                            )}
                          </View>
                          
                          <View style={styles.cardInfo}>
                            <Text style={styles.cardName}>
                              {profile?.full_name || "Your Name"}
                            </Text>
                            <Text style={styles.cardSpecialty}>
                              {profile?.specialty || "Healthcare Professional"}
                            </Text>
                          </View>
                        </View>
                      </LinearGradient>
                      
                      {/* Stats row */}
                      <View style={styles.businessCardStats}>
                        <View style={styles.cardStatItem}>
                          <Text style={styles.cardStatValue}>
                            {profile?.years_experience || "5+"}
                          </Text>
                          <Text style={styles.cardStatLabel}>Years Exp</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.cardStatItem}>
                          <Text style={styles.cardStatValue}>
                            {profile?.rating || "4.9"}
                          </Text>
                          <Text style={styles.cardStatLabel}>Rating</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.cardStatItem}>
                          <Text style={styles.cardStatValue}>
                            {profile?.patients_count || "120+"}
                          </Text>
                          <Text style={styles.cardStatLabel}>Patients</Text>
                        </View>
                      </View>
                    </View>
                    
                    {/* Details section */}
                    <View style={styles.detailsSection}>
                      {profile?.hospital && (
                        <View style={styles.detailRow}>
                          <View style={styles.detailIconContainer}>
                            <Briefcase size={18} color="#0066CC" />
                          </View>
                          <Text style={styles.detailText}>{profile.hospital}</Text>
                        </View>
                      )}
                      
                      <TouchableOpacity style={styles.viewProfileButton}>
                        <Text style={styles.viewProfileText}>View Full Profile</Text>
                        <ChevronRight size={18} color="#0066CC" />
                      </TouchableOpacity>
                    </View>
                    
                    {/* QR code section */}
                    <View style={styles.qrSection}>
                      <View style={styles.qrContainer}>
                        <QrCode size={120} color="#000000" />
                        <Text style={styles.qrText}>
                          Scan to connect instantly
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  {/* Card footer */}
                  <View style={styles.cardFooter}>
                    <TouchableOpacity style={styles.footerButton}>
                      <Text style={styles.footerButtonText}>Connect</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Animated.View>
          </GestureDetector>
        </GestureHandlerRootView>
      </Animated.View>
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
    marginBottom: 4,
    fontFamily: 'Inter_600SemiBold',
  },
  profileSpecialty: {
    fontSize: 16,
    color: '#0066CC',
    fontFamily: 'Inter_500Medium',
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
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gestureContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessCard: {
    width: SCREEN_WIDTH * 0.9,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardShadowWrapper: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
    backgroundColor: '#FFFFFF',
  },
  cardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  cardHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#DDD',
    alignSelf: 'center',
    marginTop: 14,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    fontFamily: 'Inter_700Bold',
  },
  shareButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    backgroundColor: '#FFFFFF',
  },
  profileSection: {
    marginBottom: 20,
  },
  profileBanner: {
    width: '100%',
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  profileBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardAvatarContainer: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 3,
  },
  cardAvatar: {
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 16,
  },
  cardName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 5,
    fontFamily: 'Inter_700Bold',
  },
  cardSpecialty: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.95,
    fontFamily: 'Inter_500Medium',
  },
  businessCardStats: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0066CC',
  },
  cardStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  cardStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: 'Inter_700Bold',
  },
  cardStatLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Inter_500Medium',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  detailsSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F8F9FF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.12)',
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.12)',
  },
  viewProfileText: {
    fontSize: 16,
    color: '#0066CC',
    fontWeight: '600',
    marginRight: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    width: '100%',
  },
  qrText: {
    marginTop: 14,
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  cardFooter: {
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  footerButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  footerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});

export default ProfileSlidingPanel; 