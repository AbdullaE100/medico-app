import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TextInput, 
  FlatList, 
  RefreshControl, 
  Animated, 
  Dimensions, 
  Platform,
  StatusBar,
  TouchableOpacity,
  Pressable
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { 
  Search, 
  Sliders, 
  MapPin, 
  Building2, 
  Users, 
  UserPlus, 
  UserCheck, 
  ChevronRight,
  Stethoscope,
  UserCircle,
  AlertCircle,
  Clock,
  X,
  ArrowUpDown
} from 'lucide-react-native';
import { useNetworkStore } from '@/stores/useNetworkStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { ErrorMessage } from '@/components/ErrorMessage';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ConnectionRequestCard } from '@/components/ConnectionRequestCard';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import ProfileSlidingPanel from '@/components/ProfileSlidingPanel';
import { MotiView } from 'moti';
import { Skeleton } from '@/components/Skeleton';

const { width, height } = Dimensions.get('window');

// Component prop types
interface ProfileAvatarProps {
  uri: string | null | undefined;
  size?: number;
  isAnonymous?: boolean;
}

// Placeholder component for missing profile images
const ProfileAvatar = ({ uri, size = 60, isAnonymous = false }: ProfileAvatarProps) => {
  // If we have a real avatar URL, show the actual image regardless of anonymous mode
  if (uri && uri.startsWith('http')) {
    return (
      <View style={[styles.avatarContainer, { width: size, height: size }]}>
        <Image 
          source={{ uri }} 
          style={[
            styles.doctorAvatar, 
            { width: size, height: size, borderRadius: size / 2 }
          ]} 
        />
      </View>
    );
  }
  
  // If no avatar is available, show placeholder
  return (
    <View style={[
      styles.avatarContainer,
      { width: size, height: size }
    ]}>
      <LinearGradient
        colors={['#6366F1', '#2563EB']}
        style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <UserCircle size={size * 0.5} color="#FFFFFF" />
      </LinearGradient>
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
      messageDesc = 'Profile image and proper name are required';
    } else if (missingAvatar) {
      messageDesc = 'Profile image is required';
    } else {
      messageDesc = 'Proper name (not email) is required';
    }
  }
  
  const progressWidth = (profileCompletionPercent / 100) * (width - 64);
  
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500 }}
    >
      <TouchableOpacity 
        style={[
          styles.completionBanner,
          (missingAvatar || invalidName) ? styles.criticalBanner : {}
        ]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.completionTopRow}>
          <View style={styles.completionIconContainer}>
            {(missingAvatar || invalidName) ? (
              <AlertCircle size={18} color="#FF3B30" />
            ) : (
              <AlertCircle size={18} color="#FF9500" />
            )}
          </View>
          <Text style={[
            styles.completionTitle,
            (missingAvatar || invalidName) ? styles.criticalTitle : {}
          ]}>
            {messageTitle}
          </Text>
          <ChevronRight size={16} color="#64748B" />
        </View>
        <Text style={styles.completionDesc}>
          {messageDesc}
        </Text>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: progressWidth },
                (missingAvatar || invalidName) ? styles.criticalProgressFill : {}
              ]} 
            />
          </View>
          <Text style={styles.completionPercent}>{profileCompletionPercent}%</Text>
        </View>
      </TouchableOpacity>
    </MotiView>
  );
};

// Specialty tag component
const SpecialtyTag = ({ specialty, isSelected, onPress }: { specialty: string, isSelected: boolean, onPress: () => void }) => (
  <TouchableOpacity
    style={[
      styles.specialtyTag,
      isSelected && styles.specialtyTagSelected
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text 
      style={[
        styles.specialtyTagText,
        isSelected && styles.specialtyTagTextSelected
      ]}
    >
      {specialty}
    </Text>
  </TouchableOpacity>
);

// Doctor card component
const DoctorCard = ({ doctor, onConnect, onViewProfile }: { 
  doctor: any, 
  onConnect: () => void, 
  onViewProfile: () => void 
}) => {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500, delay: Math.random() * 300 }}
    >
      <Pressable 
        style={({ pressed }) => [
          styles.doctorCard,
          pressed && styles.doctorCardPressed
        ]}
        onPress={onViewProfile}
      >
        <ProfileAvatar uri={doctor.avatar_url} size={60} />
        
        <View style={styles.doctorCardContent}>
          <View style={styles.doctorCardHeader}>
            <Text style={styles.doctorName} numberOfLines={1}>{doctor.full_name}</Text>
            {doctor.is_verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
            )}
          </View>
          
          <View style={styles.specialtyRow}>
            <View style={styles.specialtyBadge}>
              <Text style={styles.specialtyText}>{doctor.specialty}</Text>
            </View>
          </View>
          
          <View style={styles.doctorDetailsRow}>
            <View style={styles.detailItem}>
              <Building2 size={14} color="#64748b" />
              <Text style={styles.detailText} numberOfLines={1}>{doctor.hospital}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <MapPin size={14} color="#64748b" />
              <Text style={styles.detailText} numberOfLines={1}>{doctor.location}</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Users size={12} color="#64748b" />
              <Text style={styles.statCount}>{doctor.followers_count}</Text>
              <Text style={styles.statLabel}>Connections</Text>
            </View>
            
            <View style={styles.dotDivider} />
            
            <View style={styles.statItem}>
              <Clock size={12} color="#64748b" />
              <Text style={styles.statCount}>{Math.floor(Math.random() * 10) + 1}+</Text>
              <Text style={styles.statLabel}>Years</Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.connectButton,
            doctor.connection_status === 'connected' && styles.connectedButton,
            doctor.connection_status === 'pending' && styles.pendingButton
          ]}
          onPress={onConnect}
        >
          {doctor.connection_status === 'connected' ? (
            <UserCheck size={18} color="#0284c7" />
          ) : doctor.connection_status === 'pending' ? (
            <Text style={styles.pendingButtonText}>Pending</Text>
          ) : (
            <UserPlus size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </Pressable>
    </MotiView>
  );
};

// Sort menu component
const SortMenu = ({ isVisible, currentSort, onSelect, onDismiss }: {
  isVisible: boolean;
  currentSort: string;
  onSelect: (sort: 'followers' | 'recent') => void;
  onDismiss: () => void;
}) => {
  if (!isVisible) return null;
  
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={styles.sortMenuContainer}
    >
      <View style={styles.sortMenu}>
        <View style={styles.sortMenuHeader}>
          <Text style={styles.sortMenuTitle}>Sort By</Text>
          <TouchableOpacity onPress={onDismiss}>
            <X size={18} color="#64748B" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={[
            styles.sortOption,
            currentSort === 'followers' && styles.sortOptionSelected
          ]}
          onPress={() => {
            onSelect('followers');
            onDismiss();
          }}
        >
          <Users size={16} color={currentSort === 'followers' ? "#0284c7" : "#64748B"} />
          <Text 
            style={[
              styles.sortOptionText,
              currentSort === 'followers' && styles.sortOptionTextSelected
            ]}
          >
            Most Connections
          </Text>
          {currentSort === 'followers' && (
            <View style={styles.sortCheckmark}>
              <Text>✓</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.sortOption,
            currentSort === 'recent' && styles.sortOptionSelected
          ]}
          onPress={() => {
            onSelect('recent');
            onDismiss();
          }}
        >
          <Clock size={16} color={currentSort === 'recent' ? "#0284c7" : "#64748B"} />
          <Text 
            style={[
              styles.sortOptionText,
              currentSort === 'recent' && styles.sortOptionTextSelected
            ]}
          >
            Recently Added
          </Text>
          {currentSort === 'recent' && (
            <View style={styles.sortCheckmark}>
              <Text>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </MotiView>
  );
};

// Empty search results component
const EmptySearchResults = ({ query, filter }: { query: string, filter: string }) => (
  <MotiView
    from={{ opacity: 0, translateY: 20 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: 'timing', duration: 500 }}
    style={styles.emptyStateContainer}
  >
    <Search size={48} color="#CBD5E1" />
    <Text style={styles.emptyStateTitle}>No doctors found</Text>
    <Text style={styles.emptyStateMessage}>
      {query && filter !== 'All' 
        ? `No ${filter} specialists found matching "${query}"`
        : query 
          ? `No doctors found matching "${query}"`
          : filter !== 'All'
            ? `No ${filter} specialists found`
            : `No doctors in the directory yet`
      }
    </Text>
  </MotiView>
);

export default function DoctorDirectory() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'followers' | 'recent'>('followers');
  const [localPanelVisible, setLocalPanelVisible] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
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
  const scrollY = useRef(new Animated.Value(0)).current;
  const searchBarTranslate = useRef(new Animated.Value(0)).current;

  const filters = ['All', 'Neurology', 'Cardiology', 'Oncology', 'Surgery', 'Pediatrics', 'Dermatology', 'Orthopedics'];

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

  const onRefresh = useCallback(async () => {
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

  // Animation for search bar shadow on scroll
  const searchBarShadowOpacity = scrollY.interpolate({
    inputRange: [0, 20],
    outputRange: [0, 0.15],
    extrapolate: 'clamp'
  });

  // Animation for header blur intensity
  const headerBlurIntensity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 25],
    extrapolate: 'clamp'
  });

  // Toggle search focus animation
  useEffect(() => {
    Animated.timing(searchBarTranslate, {
      toValue: searchFocused ? 1 : 0,
      duration: 250,
      useNativeDriver: false
    }).start();
  }, [searchFocused]);

  const handleProfilePress = () => {
    router.push('/profile');
  };

  const handleClosePanel = () => {
    setLocalPanelVisible(false);
  };

  const handleFilterPress = (filter: string) => {
    setActiveFilter(filter);
  };

  const handleDoctorCardPress = (doctorId: string) => {
    router.push(`/network/doctor/${doctorId}`);
  };

  // Animation for search bar width
  const searchBarWidth = searchBarTranslate.interpolate({
    inputRange: [0, 1],
    outputRange: ['84%', '100%']
  });
  
  // Animation for filter button opacity
  const filterButtonOpacity = searchBarTranslate.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0]
  });

  // Render loading skeleton
  const renderSkeleton = () => (
    <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
      {[1, 2, 3].map((_, index) => (
        <View key={index} style={[styles.doctorCard, { marginBottom: 16 }]}>
          <Skeleton width={60} height={60} borderRadius={30} />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Skeleton width="70%" height={18} marginBottom={8} />
            <Skeleton width="40%" height={16} marginBottom={12} />
            <Skeleton width="90%" height={14} marginBottom={8} />
            <Skeleton width="60%" height={14} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            shadowOpacity: searchBarShadowOpacity
          }
        ]}
      >
        <View style={styles.headerInner}>
          <View style={styles.headerTop}>
            <View style={styles.titleContainer}>
              <Stethoscope size={18} color="#0284c7" />
              <Text style={styles.headerTitle}>Network</Text>
            </View>
          </View>
          
          <View style={styles.searchContainer}>
            <Animated.View 
              style={[
                styles.searchBar,
                { width: searchBarWidth }
              ]}
            >
              <Search size={18} color="#64748B" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or specialty..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearSearchButton}
                  onPress={() => setSearchQuery('')}
                >
                  <X size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </Animated.View>
            
            <Animated.View style={{ opacity: filterButtonOpacity }}>
              <TouchableOpacity 
                style={styles.sortButton}
                onPress={() => setShowSortMenu(true)}
              >
                <ArrowUpDown size={18} color="#64748B" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </Animated.View>
      
      {/* Filter Tags */}
      <View style={styles.specialtyContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.specialtyScroll}
        >
          {filters.map((filter) => (
            <SpecialtyTag
              key={filter}
              specialty={filter}
              isSelected={activeFilter === filter}
              onPress={() => handleFilterPress(filter)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Sort Menu Overlay */}
      <SortMenu
        isVisible={showSortMenu}
        currentSort={sortBy}
        onSelect={(sort) => setSortBy(sort)}
        onDismiss={() => setShowSortMenu(false)}
      />
      
      {/* Error Message */}
      {error && (
        <ErrorMessage 
          message={error} 
          onDismiss={() => useNetworkStore.setState({ error: null })}
        />
      )}

      {/* Main Content */}
      <Animated.FlatList
        data={doctors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.contentContainer}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#0284c7"
          />
        }
        ListHeaderComponent={
          <>
            {/* Profile Completion Banner */}
            <ProfileCompletionBanner 
              profileCompletionPercent={profileCompletionPercent}
              onPress={handleProfilePress}
            />
            
            {/* Connection Requests Section */}
            {receivedRequests.length > 0 && (
              <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500, delay: 300 }}
                style={styles.requestsSection}
              >
                <Text style={styles.sectionTitle}>Connection Requests</Text>
                {receivedRequests.map((request) => (
                  <ConnectionRequestCard key={request.id} request={request} />
                ))}
              </MotiView>
            )}
            
            {/* Directory Heading */}
            {doctors.length > 0 && (
              <View style={styles.directoryHeader}>
                <Text style={styles.sectionTitle}>
                  {activeFilter === 'All' 
                    ? 'Medical Professionals' 
                    : `${activeFilter} Specialists`}
                </Text>
                <Text style={styles.resultCount}>
                  {doctors.length} result{doctors.length !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          isLoading && !refreshing 
            ? renderSkeleton()
            : <EmptySearchResults query={searchQuery} filter={activeFilter} />
        }
        renderItem={({ item: doctor }) => (
          <DoctorCard 
            doctor={doctor} 
            onConnect={() => doctor.connection_status === 'connected'
              ? unfollowDoctor(doctor.id)
              : followDoctor(doctor.id)
            }
            onViewProfile={() => handleDoctorCardPress(doctor.id)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerInner: {
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  searchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    marginLeft: 8,
    color: '#1E293B',
  },
  clearSearchButton: {
    padding: 5,
  },
  sortButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  specialtyContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    zIndex: 5,
  },
  specialtyScroll: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  specialtyTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  specialtyTagSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  specialtyTagText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  specialtyTagTextSelected: {
    color: '#FFFFFF',
  },
  contentContainer: {
    padding: 16,
    paddingTop: 8,
  },
  directoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
  },
  resultCount: {
    fontSize: 14,
    color: '#64748B',
  },
  doctorCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  doctorCardPressed: {
    backgroundColor: '#F8FAFC',
  },
  avatarContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  doctorAvatar: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorCardContent: {
    flex: 1,
    marginLeft: 16,
  },
  doctorCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginRight: 6,
    flex: 1,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0284c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  specialtyRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  specialtyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
  },
  specialtyText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0284c7',
  },
  doctorDetailsRow: {
    marginBottom: 12,
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginRight: 3,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  dotDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 10,
  },
  connectButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0284c7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    marginLeft: 12,
  },
  connectedButton: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  pendingButton: {
    backgroundColor: '#F8FAFC',
    width: 'auto',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  pendingButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  completionBanner: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  criticalBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  completionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  completionIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  completionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#92400E',
    flex: 1,
  },
  criticalTitle: {
    color: '#B91C1C',
  },
  completionDesc: {
    fontSize: 14,
    color: '#78716C',
    marginBottom: 12,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  criticalProgressFill: {
    backgroundColor: '#EF4444',
  },
  completionPercent: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  requestsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sortMenuContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 140 : 120,
    right: 16,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  sortMenu: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sortMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sortMenuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  sortOptionSelected: {
    backgroundColor: '#F0F9FF',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  sortOptionTextSelected: {
    color: '#0284c7',
    fontWeight: '500',
  },
  sortCheckmark: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0284c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
});