import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TextInput, 
  Pressable, 
  FlatList, 
  RefreshControl, 
  Animated, 
  Dimensions, 
  Platform,
  StatusBar,
  TouchableOpacity
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { 
  Search, 
  Filter, 
  MapPin, 
  Building2, 
  Users, 
  ChevronRight, 
  UserPlus, 
  UserCheck, 
  Heart,
  Stethoscope,
  User,
  UserCircle,
  AlertCircle
} from 'lucide-react-native';
import { useNetworkStore } from '@/stores/useNetworkStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { ErrorMessage } from '@/components/ErrorMessage';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ConnectionRequestCard } from '@/components/ConnectionRequestCard';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Component prop types
interface ProfileAvatarProps {
  uri: string | null | undefined;
  size?: number;
  isAnonymous?: boolean;
}

// Placeholder component for missing profile images
const ProfileAvatar = ({ uri, size = 60, isAnonymous = false }: ProfileAvatarProps) => {
  // If we have a real avatar URL and not anonymous mode, show the actual image
  if (uri && uri.startsWith('http') && !isAnonymous) {
    return <Image source={{ uri }} style={[styles.doctorAvatar, { width: size, height: size, borderRadius: size / 2 }]} />;
  }
  
  // If anonymous mode OR no avatar is available
  return (
    <View style={[styles.avatarPlaceholder, 
      isAnonymous ? styles.anonymousAvatarPlaceholder : {},
      { width: size, height: size, borderRadius: size / 2 }
    ]}>
      {isAnonymous ? (
        <View style={styles.anonymousAvatarInner}>
          <Stethoscope size={size * 0.4} color="#FFFFFF" />
        </View>
      ) : (
        <UserCircle size={size * 0.6} color="#FFFFFF" />
      )}
    </View>
  );
};

// Profile completion banner component
interface ProfileCompletionBannerProps {
  profileCompletionPercent: number;
  onPress: () => void;
}

const ProfileCompletionBanner = ({ 
  profileCompletionPercent, 
  onPress 
}: ProfileCompletionBannerProps) => {
  // Get current user's profile info from the useProfileStore
  const { profile } = useProfileStore();
  
  // If profile is complete, don't show the banner
  if (profileCompletionPercent >= 100) return null;
  
  // Check for the specific critical requirements
  const missingAvatar = !profile?.avatar_url;
  const invalidName = !profile?.full_name || profile.full_name.includes('@');
  
  // If both required fields are present, use standard completion message
  // Otherwise, show a more urgent message about the missing critical fields
  let messageTitle = 'Complete your profile';
  let messageDesc = profileCompletionPercent < 50 
    ? 'Add more details to appear in search results'
    : 'Your profile is almost complete!';
    
  // If critical fields are missing, override with more urgent message
  if (missingAvatar || invalidName) {
    messageTitle = 'Action Required!';
    
    if (missingAvatar && invalidName) {
      messageDesc = 'Profile image and proper name are required to appear in doctor directory';
    } else if (missingAvatar) {
      messageDesc = 'Profile image is required to appear in doctor directory';
    } else {
      messageDesc = 'Proper name (not email) is required to appear in doctor directory';
    }
  }
  
  return (
    <TouchableOpacity 
      style={[
        styles.completionBanner,
        (missingAvatar || invalidName) ? styles.criticalBanner : {}
      ]}
      onPress={onPress}
    >
      <View style={styles.completionIconContainer}>
        {(missingAvatar || invalidName) ? (
          <AlertCircle size={18} color="#FF3B30" />
        ) : (
          <AlertCircle size={18} color="#FF9500" />
        )}
      </View>
      <View style={styles.completionTextContainer}>
        <Text style={[
          styles.completionTitle,
          (missingAvatar || invalidName) ? styles.criticalTitle : {}
        ]}>
          {messageTitle}
        </Text>
        <Text style={styles.completionDesc}>
          {messageDesc}
        </Text>
      </View>
      <View style={styles.completionProgressContainer}>
        <Text style={styles.completionPercent}>{profileCompletionPercent}%</Text>
        <ChevronRight size={16} color="#64748B" />
      </View>
    </TouchableOpacity>
  );
};

export default function DoctorDirectory() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'followers' | 'recent'>('followers');
  const [anonymousView, setAnonymousView] = useState(false);
  const { 
    doctors, 
    receivedRequests,
    isLoading, 
    error, 
    fetchDoctors,
    fetchConnectionRequests,
    followDoctor,
    unfollowDoctor
  } = useNetworkStore();
  const { profile, fetchProfile } = useProfileStore();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Animation values
  const headerHeight = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const iconPulse = useRef(new Animated.Value(1)).current;

  const filters = ['All', 'Neurology', 'Cardiology', 'Oncology', 'Surgery', 'Pediatrics'];

  // Calculate profile completion
  const calculateProfileCompletion = () => {
    if (!profile) return 0;
    
    const requiredFields = [
      'full_name',
      'specialty',
      'hospital',
      'location',
      'bio',
      'avatar_url'
    ];
    
    const completedFields = requiredFields.filter(field => {
      const value = profile[field as keyof typeof profile];
      return value && String(value).trim().length > 0;
    });
    
    return Math.round((completedFields.length / requiredFields.length) * 100);
  };
  
  const profileCompletionPercent = calculateProfileCompletion();

  useEffect(() => {
    fetchDoctors(searchQuery, activeFilter === 'All' ? undefined : activeFilter, sortBy);
    fetchConnectionRequests();
    fetchProfile();
  }, [activeFilter, searchQuery, sortBy]);

  // Start animations
  useEffect(() => {
    // Start header animation
    Animated.timing(headerHeight, {
      toValue: 1,
      duration: 800,
      useNativeDriver: false,
    }).start();
    
    // Animate content fade in and scale
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Icon pulse animation
    const pulseIcon = Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulse, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(iconPulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    
    pulseIcon.start();
    
    return () => {
      pulseIcon.stop();
    };
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchDoctors(searchQuery, activeFilter === 'All' ? undefined : activeFilter, sortBy),
        fetchConnectionRequests(),
        fetchProfile()
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [searchQuery, activeFilter, sortBy]);

  const interpolatedHeaderHeight = headerHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [60, Platform.OS === 'ios' ? 100 : 90]
  });
  
  const navigateToProfile = () => {
    router.push('/profile');
  };

  if (isLoading && !refreshing && doctors.length === 0) {
    return <LoadingOverlay message="Loading doctors..." />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Gradient with improved colors */}
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={['#0a2547', '#1a5cbe']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Enhanced subtle decorative elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeLine} />
      </View>
      
      {/* Compact Animated Header */}
      <Animated.View 
        style={[
          styles.animatedHeader,
          { height: interpolatedHeaderHeight }
        ]}
      >
        <View style={styles.headerTopRow}>
          <View style={styles.logoContainer}>
            <Animated.View 
              style={[
                styles.iconContainer,
                { transform: [{ scale: iconPulse }] }
              ]}
            >
              <Stethoscope size={20} color="#fff" />
            </Animated.View>
            <Animated.View style={styles.titleFade}>
              <Text style={styles.logo}>Medical Network</Text>
            </Animated.View>
          </View>
          
          {/* Anonymous View Toggle */}
          <TouchableOpacity
            style={styles.anonymousToggle}
            onPress={() => setAnonymousView(!anonymousView)}
          >
            <View style={styles.anonymousToggleInner}>
              {anonymousView ? (
                <UserCircle size={18} color="#FFFFFF" />
              ) : (
                <User size={18} color="#FFFFFF" />
              )}
            </View>
            <Text style={styles.anonymousToggleText}>
              {anonymousView ? 'Anonymous' : 'Normal'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <Animated.View 
          style={[
            styles.searchBarContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY }]
            }
          ]}
        >
          <View style={styles.searchBar}>
            <Search size={16} color="#fff" style={styles.searchIcon} />
            <TextInput
              placeholder="Search specialists, hospitals..."
              placeholderTextColor="rgba(255, 255, 255, 0.7)"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity 
            style={styles.filterIcon}
            onPress={() => setSortBy(sortBy === 'followers' ? 'recent' : 'followers')}
          >
            <Filter size={16} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {error && (
        <ErrorMessage 
          message={error} 
          onDismiss={() => useNetworkStore.setState({ error: null })}
        />
      )}

      <Animated.View 
        style={[
          styles.filterScrollContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                activeFilter === filter && styles.filterButtonActive
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[
                styles.filterButtonText,
                activeFilter === filter && styles.filterButtonTextActive
              ]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      <Animated.View 
        style={[
          styles.contentContainer,
          { 
            opacity: fadeAnim,
            transform: [{ translateY }] 
          }
        ]}
      >
        <FlatList
          ListHeaderComponent={
            <>
              {/* Profile Completion Banner */}
              <ProfileCompletionBanner 
                profileCompletionPercent={profileCompletionPercent}
                onPress={navigateToProfile}
              />
              
              {anonymousView && (
                <View style={styles.anonymousModeInfo}>
                  <View style={styles.anonymousModeIcon}>
                    <Stethoscope size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.anonymousModeText}>
                    <Text style={styles.anonymousModeTitle}>Anonymous View</Text>
                    <Text style={styles.anonymousModeDesc}>All doctors are shown with standard professional avatars</Text>
                  </View>
                </View>
              )}
            
              {/* Connection Requests Section */}
              {receivedRequests.length > 0 && (
                <View style={styles.requestsSection}>
                  <Text style={styles.requestsTitle}>Connection Requests</Text>
                  {receivedRequests.map((request) => (
                    <ConnectionRequestCard key={request.id} request={request} />
                  ))}
                </View>
              )}
            </>
          }
          data={doctors}
          renderItem={({ item: doctor }) => (
            <Link href={`/network/doctor/${doctor.id}`} asChild>
              <TouchableOpacity style={styles.doctorCard}>
                <ProfileAvatar 
                  uri={doctor.avatar_url} 
                  size={54} 
                  isAnonymous={anonymousView || doctor.metadata?.isAnonymous === true} 
                />
                <View style={styles.doctorInfo}>
                  <View style={styles.doctorHeader}>
                    <Text style={styles.doctorName}>{doctor.full_name}</Text>
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>✓</Text>
                    </View>
                  </View>
                  <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
                  <View style={styles.doctorDetailsCompact}>
                    <View style={styles.detailRow}>
                      <Building2 size={14} color="#64748b" />
                      <Text style={styles.detailText}>{doctor.hospital}</Text>
                    </View>
                    <View style={styles.detailRowGroup}>
                      <View style={styles.detailRow}>
                        <MapPin size={14} color="#64748b" />
                        <Text style={styles.detailText}>{doctor.location}</Text>
                      </View>
                      <View style={styles.dotSeparator} />
                      <View style={styles.detailRow}>
                        <Users size={14} color="#64748b" />
                        <Text style={styles.detailText}>{doctor.followers_count}</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <TouchableOpacity 
                  style={[
                    styles.followButton,
                    doctor.connection_status === 'connected' && styles.followingButton,
                    doctor.connection_status === 'pending' && styles.pendingButton
                  ]}
                  onPress={(e) => {
                    e.preventDefault();
                    doctor.connection_status === 'connected'
                      ? unfollowDoctor(doctor.id)
                      : followDoctor(doctor.id);
                  }}
                >
                  {doctor.connection_status === 'connected' ? (
                    <UserCheck size={18} color="#0066CC" />
                  ) : doctor.connection_status === 'pending' ? (
                    <Text style={styles.pendingText}>Pending</Text>
                  ) : (
                    <UserPlus size={18} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            </Link>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.doctorList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor="#0066CC"
            />
          }
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 160 : 140,
    zIndex: 0,
    overflow: 'hidden',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    top: -100,
    right: -80,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    top: 60,
    left: -60,
  },
  decorativeLine: {
    position: 'absolute',
    width: 100,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    bottom: 35,
    right: 40,
    transform: [{ rotate: '30deg' }],
  },
  animatedHeader: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 47 : 27,
    paddingHorizontal: 16,
    zIndex: 2,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingBottom: 8,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4e87cb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  titleFade: {
    opacity: 0,
    transform: [{ translateY: 20 }],
  },
  logo: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  searchBarContainer: {
    flexDirection: 'row',
    marginTop: 6,
    marginBottom: 12,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.17)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 22,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  filterIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.17)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterScrollContainer: {
    marginTop: Platform.OS === 'ios' ? 106 : 96,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 1,
  },
  filterScroll: {
    paddingVertical: 12,
  },
  filterContainer: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 102, 204, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.12)',
  },
  filterButtonActive: {
    backgroundColor: '#0066CC',
  },
  filterButtonText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  // Profile Completion Banner Styles
  completionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  completionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  completionTextContainer: {
    flex: 1,
  },
  completionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#1E293B',
    marginBottom: 4,
  },
  criticalTitle: {
    color: '#FF3B30',
  },
  completionDesc: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
  },
  completionProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completionPercent: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#FF9500',
    marginRight: 4,
  },
  requestsSection: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  requestsTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  doctorList: {
    padding: 16,
    paddingTop: 8,
    gap: 10,
  },
  doctorCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.05)',
  },
  doctorAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(0, 102, 204, 0.2)',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  doctorName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#1e293b',
    marginRight: 4,
  },
  verifiedBadge: {
    backgroundColor: '#0066CC',
    borderRadius: 8,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  doctorSpecialty: {
    fontSize: 13,
    color: '#0066CC',
    fontFamily: 'Inter_500Medium',
    marginBottom: 6,
  },
  doctorDetails: {
    gap: 6,
  },
  doctorDetailsCompact: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailRowGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#64748b',
    fontFamily: 'Inter_400Regular',
  },
  followButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  followingButton: {
    backgroundColor: '#E5F0FF',
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.3)',
  },
  pendingButton: {
    backgroundColor: '#F0F2F5',
    width: 'auto',
    paddingHorizontal: 10,
  },
  pendingText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#64748b',
  },
  avatarPlaceholder: {
    backgroundColor: '#FFFFFF', 
    borderWidth: 3,
    borderColor: '#0066CC',
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  anonymousAvatarPlaceholder: {
    backgroundColor: '#FFFFFF', 
    borderWidth: 3,
    borderColor: '#0066CC',
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  anonymousAvatarInner: {
    width: '75%',
    height: '75%', 
    borderRadius: 100,
    backgroundColor: 'rgba(0, 102, 204, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  anonymousToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.17)',
    borderRadius: 8,
  },
  anonymousToggleInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  anonymousToggleText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#FFFFFF',
  },
  criticalBanner: {
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  anonymousModeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  anonymousModeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  anonymousModeText: {
    flex: 1,
  },
  anonymousModeTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#1E293B',
    marginBottom: 4,
  },
  anonymousModeDesc: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
  },
});