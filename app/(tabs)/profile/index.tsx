import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  Pressable, 
  RefreshControl, 
  Animated, 
  Dimensions, 
  Platform,
  StatusBar,
  TouchableOpacity 
} from 'react-native';
import { Link } from 'expo-router';
import { 
  Settings, 
  CreditCard as Edit3, 
  MapPin, 
  Building2, 
  Users, 
  Heart, 
  MessageCircle, 
  Share2, 
  Award, 
  Bookmark, 
  FileText, 
  Repeat2,
  ChevronRight,
  Shield,
  Star,
  Check
} from 'lucide-react-native';
import { useProfileStore } from '@/stores/useProfileStore';
import { useFeedStore } from '@/stores/useFeedStore';
import { ErrorMessage } from '@/components/ErrorMessage';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const Achievement = ({ icon: Icon, label }: { icon: any; label: string }) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);
  
  return (
    <Animated.View 
      style={[
        styles.achievement,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <LinearGradient
        colors={['#E5F0FF', '#C7E1FF']}
        style={styles.achievementIcon}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Icon size={22} color="#0066CC" />
      </LinearGradient>
      <Text style={styles.achievementText}>{label}</Text>
    </Animated.View>
  );
};

const StatBox = ({ label, value }: { label: string; value: string | number }) => (
  <View style={styles.statBox}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    <View style={styles.statIndicator} />
  </View>
);

const ExpertiseTag = ({ label }: { label: string }) => (
  <LinearGradient
    colors={['#E5F0FF', '#D3E6FF']}
    style={styles.expertiseTag}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
  >
    <Text style={styles.expertiseText}>{label}</Text>
  </LinearGradient>
);

const PostCard = ({ post }: { post: any }) => {
  const { likePost, repostPost } = useFeedStore();
  const [isLiking, setIsLiking] = React.useState(false);
  const [isReposting, setIsReposting] = React.useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await likePost(post.id);
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleRepost = async () => {
    if (isReposting) return;
    setIsReposting(true);
    try {
      await repostPost(post.id);
    } catch (error) {
      console.error('Error reposting:', error);
    } finally {
      setIsReposting(false);
    }
  };

  return (
    <View style={styles.postCard}>
      <Text style={styles.postContent}>{post.content}</Text>
      
      {post.media_url?.map((url: string, index: number) => (
        <Image 
          key={index}
          source={{ uri: url }} 
          style={styles.postImage}
          resizeMode="cover"
        />
      ))}

      {post.hashtags && post.hashtags.length > 0 && (
        <View style={styles.hashtags}>
          {post.hashtags.map((tag: string) => (
            <Text key={tag} style={styles.hashtag}>#{tag}</Text>
          ))}
        </View>
      )}

      <View style={styles.postActions}>
        <Pressable onPress={handleLike} style={styles.postAction}>
          <Heart 
            size={20} 
            color={post.has_liked ? '#FF4D4D' : '#666666'} 
            fill={post.has_liked ? '#FF4D4D' : 'transparent'} 
          />
          <Text style={styles.postActionText}>{post.likes_count || 0}</Text>
        </Pressable>

        <Pressable style={styles.postAction}>
          <MessageCircle size={20} color="#666666" />
          <Text style={styles.postActionText}>{post.comments_count || 0}</Text>
        </Pressable>

        <Pressable onPress={handleRepost} style={styles.postAction}>
          <Repeat2 
            size={20} 
            color={post.has_reposted ? '#22C55E' : '#666666'} 
          />
          <Text style={styles.postActionText}>{post.reposts_count || 0}</Text>
        </Pressable>

        <Pressable style={styles.postAction}>
          <Share2 size={20} color="#666666" />
        </Pressable>
      </View>
    </View>
  );
};

export default function Profile() {
  const { profile, settings, isLoading: profileLoading, error: profileError, fetchProfile } = useProfileStore();
  const { posts, isLoading: postsLoading, error: postsError, fetchPosts } = useFeedStore();
  const [refreshing, setRefreshing] = React.useState(false);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const headerHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchProfile();
    fetchPosts({ userId: profile?.id });
    
    // Start animations
    Animated.timing(headerHeight, {
      toValue: 1,
      duration: 800,
      useNativeDriver: false,
    }).start();
    
    // Animate content
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
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [profile?.id]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchProfile(),
      fetchPosts({ userId: profile?.id })
    ]);
    setRefreshing(false);
  }, [profile?.id]);

  // Interpolate values for animations
  const interpolatedHeaderHeight = headerHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [80, Platform.OS === 'ios' ? 140 : 120]
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100, 150],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });
  
  const avatarScale = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  // Function to safely handle avatar source
  const getAvatarSource = (url: string | null | undefined) => {
    if (url) {
      return { uri: url };
    }
    // Default image if no avatar URL is provided
    return { uri: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80' };
  };

  if ((profileLoading || postsLoading) && !refreshing && posts.length === 0) {
    return <LoadingOverlay />;
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
      
      {/* Sticky header that appears on scroll */}
      <Animated.View style={[
        styles.stickyHeader,
        { 
          opacity: headerOpacity,
          height: 60
        }
      ]}>
        <Text style={styles.stickyHeaderTitle}>
          {profile?.full_name || 'My Profile'}
        </Text>
        <View style={styles.headerActions}>
          <Link href="/profile/edit" asChild>
            <TouchableOpacity style={styles.headerButton}>
              <Edit3 size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </Link>
          <Link href="/profile/settings" asChild>
            <TouchableOpacity style={styles.headerButton}>
              <Settings size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </Link>
        </View>
      </Animated.View>

      {/* Main header with profile info */}
      <Animated.View 
        style={[
          styles.animatedHeader,
          { height: interpolatedHeaderHeight }
        ]}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerActions}>
            <Link href="/profile/edit" asChild>
              <Pressable style={styles.headerButton}>
                <Edit3 size={20} color="#FFFFFF" />
              </Pressable>
            </Link>
            <Link href="/profile/settings" asChild>
              <Pressable style={styles.headerButton}>
                <Settings size={20} color="#FFFFFF" />
              </Pressable>
            </Link>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#FFFFFF"
            colors={["#0066CC"]}
          />
        }
      >
        {(profileError || postsError) && (
          <ErrorMessage 
            message={profileError || postsError} 
            onDismiss={() => {
              if (profileError) useProfileStore.setState({ error: null });
              if (postsError) useFeedStore.setState({ error: null });
            }}
          />
        )}

        <Animated.View 
          style={[
            styles.profileCard,
            {
              opacity: scrollY.interpolate({
                inputRange: [0, 50, 100],
                outputRange: [1, 0.95, 0.9],
                extrapolate: 'clamp',
              }),
              transform: [
                {
                  scale: scrollY.interpolate({
                    inputRange: [0, 100],
                    outputRange: [1, 0.95],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.avatarContainer}>
            <Animated.View
              style={{
                transform: [{
                  scale: scrollY.interpolate({
                    inputRange: [0, 100],
                    outputRange: [1, 0.9],
                    extrapolate: 'clamp',
                  })
                }]
              }}
            >
              <Image 
                source={getAvatarSource(profile?.avatar_url || null)}
                style={styles.avatar}
              />
            </Animated.View>
          </View>
          
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>
                {profile?.full_name || 'Dr. Sarah Johnson'}
              </Text>
              <View style={styles.verifiedBadge}>
                <Check size={12} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.title}>
              {profile?.specialty || 'Cardiologist'}
            </Text>
            <View style={styles.locationRow}>
              <View style={styles.detailRow}>
                <Building2 size={16} color="#64748b" />
                <Text style={styles.detailText}>
                  {profile?.hospital || 'Mayo Clinic'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <MapPin size={16} color="#64748b" />
                <Text style={styles.detailText}>
                  {profile?.location || 'Rochester, MN'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View 
          style={[
            styles.statsCard,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: Animated.multiply(translateY, 0.9) },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <StatBox label="Followers" value={profile?.followers_count || 0} />
          <View style={styles.statDivider} />
          <StatBox label="Following" value={profile?.following_count || 0} />
          <View style={styles.statDivider} />
          <StatBox label="Posts" value={profile?.posts_count || 0} />
        </Animated.View>

        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: Animated.multiply(translateY, 0.8) },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{profile?.bio || 'No bio available.'}</Text>
        </Animated.View>

        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: Animated.multiply(translateY, 0.7) },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Expertise</Text>
          <View style={styles.expertiseTags}>
            {profile?.expertise?.map((tag) => (
              <ExpertiseTag key={tag} label={tag} />
            )) || (
              <Text style={styles.loadingText}>No expertise listed</Text>
            )}
          </View>
        </Animated.View>

        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: Animated.multiply(translateY, 0.6) },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievements}>
            <Achievement icon={Award} label="Top Contributor 2024" />
            <Achievement icon={FileText} label="50+ Publications" />
            <Achievement icon={Shield} label="Research Lead" />
          </View>
        </Animated.View>

        <Animated.View 
          style={[
            styles.postsSection,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: Animated.multiply(translateY, 0.5) },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Posts</Text>
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <View style={styles.emptyPosts}>
              <Text style={styles.emptyPostsTitle}>No posts yet</Text>
              <Text style={styles.emptyPostsText}>Share your medical insights with the community</Text>
              <Link href="/home/create" asChild>
                <TouchableOpacity style={styles.createPostButton}>
                  <Text style={styles.createPostButtonText}>Create Post</Text>
                </TouchableOpacity>
              </Link>
            </View>
          )}
        </Animated.View>

        <Animated.View 
          style={[
            styles.engagementSection,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: Animated.multiply(translateY, 0.4) },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <TouchableOpacity style={styles.engagementButton}>
            <Heart size={20} color="#0066CC" />
            <Text style={styles.engagementText}>Liked Posts</Text>
            <ChevronRight size={18} color="#64748b" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.engagementButton}>
            <Bookmark size={20} color="#0066CC" />
            <Text style={styles.engagementText}>Saved Items</Text>
            <ChevronRight size={18} color="#64748b" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.engagementButton}>
            <Share2 size={20} color="#0066CC" />
            <Text style={styles.engagementText}>Share Profile</Text>
            <ChevronRight size={18} color="#64748b" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    paddingTop: Platform.OS === 'ios' ? 160 : 140,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
    zIndex: 0,
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
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    zIndex: 2,
  },
  stickyHeaderTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
  },
  profileCard: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.05)',
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(0, 102, 204, 0.2)',
  },
  profileInfo: {
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#1e293b',
    marginRight: 8,
  },
  verifiedBadge: {
    backgroundColor: '#0066CC',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#0066CC',
    marginBottom: 16,
  },
  locationRow: {
    gap: 16, 
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#64748b',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.05)',
  },
  statBox: {
    alignItems: 'center',
    width: '33%',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#64748b',
    marginTop: 4,
  },
  statIndicator: {
    width: 36,
    height: 3,
    backgroundColor: '#0066CC',
    borderRadius: 1.5,
    marginTop: 8,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.05)',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#1e293b',
    marginBottom: 16,
  },
  bio: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#64748b',
    lineHeight: 22,
  },
  expertiseTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  expertiseTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  expertiseText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#64748b',
    fontStyle: 'italic',
  },
  achievements: {
    gap: 12,
  },
  achievement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.05)',
  },
  achievementIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#1e293b',
  },
  postsSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
    gap: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.05)',
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.1)',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  postContent: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#1e293b',
    lineHeight: 24,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  hashtags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hashtag: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 102, 204, 0.1)',
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  postActionText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#64748b',
  },
  emptyPosts: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyPostsTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: '#1e293b',
  },
  emptyPostsText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#64748b',
    textAlign: 'center',
  },
  createPostButton: {
    marginTop: 16,
    backgroundColor: '#0066CC',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  createPostButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  engagementSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
    gap: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.05)',
  },
  engagementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.1)',
  },
  engagementText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#1e293b',
  },
});