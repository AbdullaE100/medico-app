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
  User as UserIcon
} from 'lucide-react-native';
import { useNetworkStore } from '@/stores/useNetworkStore';
import { ErrorMessage } from '@/components/ErrorMessage';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ConnectionRequestCard } from '@/components/ConnectionRequestCard';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Component prop types
interface ProfileAvatarProps {
  uri: string | null | undefined;
  size?: number;
}

// Placeholder component for missing profile images
const ProfileAvatar = ({ uri, size = 60 }: ProfileAvatarProps) => {
  if (uri && uri.startsWith('http')) {
    return <Image source={{ uri }} style={[styles.doctorAvatar, { width: size, height: size, borderRadius: size / 2 }]} />;
  }
  
  // Placeholder when no avatar is available
  return (
    <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
      <UserIcon size={size * 0.6} color="#FFFFFF" />
    </View>
  );
};

export default function DoctorDirectory() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'followers' | 'recent'>('followers');
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
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Animation values
  const headerHeight = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const iconPulse = useRef(new Animated.Value(1)).current;

  const filters = ['All', 'Neurology', 'Cardiology', 'Oncology', 'Surgery', 'Pediatrics'];

  useEffect(() => {
    fetchDoctors(searchQuery, activeFilter === 'All' ? undefined : activeFilter, sortBy);
    fetchConnectionRequests();
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
        fetchConnectionRequests()
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [searchQuery, activeFilter, sortBy]);

  const interpolatedHeaderHeight = headerHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [70, Platform.OS === 'ios' ? 130 : 110]
  });

  if (isLoading && !refreshing && doctors.length === 0) {
    return <LoadingOverlay message="Loading doctors..." />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Gradient */}
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={['#062454', '#0066CC']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Decorative elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeLine} />
      </View>
      
      {/* Animated Header */}
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
              <Stethoscope size={22} color="#fff" />
            </Animated.View>
            <Animated.View style={styles.titleFade}>
              <Text style={styles.logo}>Medical Network</Text>
            </Animated.View>
          </View>
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
            <Search size={18} color="#fff" style={styles.searchIcon} />
            <TextInput
              placeholder="Search specialists, hospitals..."
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity 
            style={styles.filterIcon}
            onPress={() => setSortBy(sortBy === 'followers' ? 'recent' : 'followers')}
          >
            <Filter size={18} color="#fff" />
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
            receivedRequests.length > 0 ? (
              <View style={styles.requestsSection}>
                <Text style={styles.requestsTitle}>Connection Requests</Text>
                {receivedRequests.map((request) => (
                  <ConnectionRequestCard key={request.id} request={request} />
                ))}
              </View>
            ) : null
          }
          data={doctors}
          renderItem={({ item: doctor }) => (
            <Link href={`/network/doctor/${doctor.id}`} asChild>
              <TouchableOpacity style={styles.doctorCard}>
                <ProfileAvatar uri={doctor.avatar_url} />
                <View style={styles.doctorInfo}>
                  <View style={styles.doctorHeader}>
                    <Text style={styles.doctorName}>{doctor.full_name}</Text>
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>✓</Text>
                    </View>
                  </View>
                  <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
                  <View style={styles.doctorDetails}>
                    <View style={styles.detailRow}>
                      <Building2 size={16} color="#666666" />
                      <Text style={styles.detailText}>{doctor.hospital}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <MapPin size={16} color="#666666" />
                      <Text style={styles.detailText}>{doctor.location}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Users size={16} color="#666666" />
                      <Text style={styles.detailText}>{doctor.followers_count} followers</Text>
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
                    <UserCheck size={20} color="#0066CC" />
                  ) : doctor.connection_status === 'pending' ? (
                    <Text style={styles.pendingText}>Pending</Text>
                  ) : (
                    <UserPlus size={20} color="#FFFFFF" />
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
    height: Platform.OS === 'ios' ? 180 : 160,
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
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: -120,
    right: -100,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: 80,
    left: -80,
  },
  decorativeLine: {
    position: 'absolute',
    width: 120,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    bottom: 40,
    right: 40,
    transform: [{ rotate: '30deg' }],
  },
  animatedHeader: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 16,
    zIndex: 2,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingBottom: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  searchBarContainer: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 16,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 24,
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  filterIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterScrollContainer: {
    marginTop: Platform.OS === 'ios' ? 140 : 120,
    paddingBottom: 10,
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
    paddingVertical: 16,
  },
  filterContainer: {
    paddingHorizontal: 16,
    gap: 10,
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.15)',
  },
  filterButtonActive: {
    backgroundColor: '#0066CC',
  },
  filterButtonText: {
    fontSize: 14,
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
  requestsSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  requestsTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  doctorList: {
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  doctorCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.05)',
  },
  doctorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#1e293b',
    marginRight: 4,
  },
  verifiedBadge: {
    backgroundColor: '#0066CC',
    borderRadius: 10,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#0066CC',
    fontFamily: 'Inter_500Medium',
    marginBottom: 8,
  },
  doctorDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Inter_400Regular',
  },
  followButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
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
    paddingHorizontal: 12,
  },
  pendingText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#64748b',
  },
  avatarPlaceholder: {
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.2)',
  },
});