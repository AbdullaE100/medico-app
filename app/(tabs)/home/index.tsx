import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TextInput, Pressable, FlatList, RefreshControl, ActivityIndicator, Animated, Alert, Modal, Dimensions, StatusBar, Platform, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Heart, MessageCircle, Repeat2, Send, Search, TrendingUp, Plus, Trash2, Bookmark, ChevronRight, Sparkles, Flag, Edit2, Share } from 'lucide-react-native';
import { useFeedStore, Post } from '@/stores/useFeedStore';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ErrorMessage } from '@/components/ErrorMessage';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Replace the mock LinearGradient with the real one
const MockLinearGradient = LinearGradient;

// Memoize PostCard to prevent unnecessary re-renders
const PostCard = React.memo(({ post, onOptionPress }: { post: Post, onOptionPress: () => void }) => {
  const { likePost, repostPost, deletePost } = useFeedStore();
  const [isLiking, setIsLiking] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  // Check if current user is the author of the post
  useEffect(() => {
    const checkCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && post.author_id === user.id) {
        setIsCurrentUser(true);
      }
    };
    
    checkCurrentUser();
  }, [post.author_id]);
  
  // Ensure we have a valid comments_count
  const commentsCount = typeof post.comments_count === 'number' ? post.comments_count : 0;
  
  console.log(`Post ${post.id} comments count:`, commentsCount);
  
  const handleLike = useCallback(async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await likePost(post.id);
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLiking(false);
    }
  }, [post.id, isLiking, likePost]);

  const handleRepost = useCallback(async () => {
    if (isReposting) return;
    setIsReposting(true);
    try {
      await repostPost(post.id);
    } catch (error) {
      console.error('Error reposting:', error);
    } finally {
      setIsReposting(false);
    }
  }, [post.id, isReposting, repostPost]);

  const handleDeletePost = useCallback(async () => {
    if (isDeleting) return;
    
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              const success = await deletePost(post.id);
              if (!success) {
                Alert.alert("Error", "Failed to delete post. Please try again.");
              }
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert("Error", "Failed to delete post. Please try again.");
            } finally {
              setIsDeleting(false);
              setMenuVisible(false);
            }
          }
        }
      ]
    );
  }, [post.id, deletePost, isDeleting]);

  // Format timestamp
  const formattedTime = useMemo(() => {
    const postDate = new Date(post.created_at);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else {
      return `${Math.floor(diffInHours / 24)}d`;
    }
  }, [post.created_at]);

  return (
    <View style={styles.postCard}>
      <View style={styles.postContainer}>
        {/* Left side with avatar and vertical line */}
        <View style={styles.leftColumn}>
          <Image 
            source={{ 
              uri: post.author?.avatar_url || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400'
            }} 
            style={styles.avatar} 
          />
          <View style={styles.verticalLine} />
        </View>
        
        {/* Right side with post content */}
        <View style={styles.rightColumn}>
          {/* Author info */}
          <View style={styles.authorRow}>
            <Text style={styles.authorName}>
              {post.author?.full_name}
            </Text>
            <View style={styles.spacer} />
            <Text style={styles.timestamp}>{formattedTime}</Text>
            <Pressable 
              style={styles.moreButton} 
              onPress={() => setMenuVisible(true)}
            >
              <Text style={styles.moreButtonText}>•••</Text>
            </Pressable>
          </View>

          {/* Post content */}
          <Text style={styles.postContent}>{post.content}</Text>
          
          {/* Post media */}
          {post.media_url?.map((url, index) => (
            <Image 
              key={index}
              source={{ uri: url }} 
              style={styles.postImage}
              resizeMode="cover"
            />
          ))}

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <View style={styles.hashtags}>
              {post.hashtags.map((tag) => (
                <Text key={tag} style={styles.hashtag}>#{tag}</Text>
              ))}
            </View>
          )}

          {/* Engagement actions */}
          <View style={styles.engagement}>
            <Pressable onPress={handleLike}>
              <Heart 
                size={20} 
                color={post.has_liked ? '#FF3040' : '#000000'} 
                fill={post.has_liked ? '#FF3040' : 'transparent'} 
              />
            </Pressable>

            <Link href={`/home/post/${post.id}`} asChild>
              <Pressable>
                <MessageCircle size={20} color="#000000" />
              </Pressable>
            </Link>

            <Pressable onPress={handleRepost}>
              <Repeat2 
                size={20} 
                color={post.has_reposted ? '#22C55E' : '#000000'} 
              />
            </Pressable>

            <Pressable>
              <Send size={20} color="#000000" />
            </Pressable>
          </View>

          {/* Engagement counts */}
          <View style={styles.engagementInfo}>
            <Text style={styles.engagementText}>
              {commentsCount === 1 
                ? '1 reply' 
                : `${commentsCount} replies`} • {post.likes_count || 0} likes
            </Text>
          </View>
        </View>
      </View>

      {/* Post menu modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            {isCurrentUser && (
              <Pressable 
                style={styles.menuItem}
                onPress={handleDeletePost}
                disabled={isDeleting}
              >
                <Trash2 size={20} color="#FF3040" />
                <Text style={styles.menuItemTextDelete}>
                  {isDeleting ? "Deleting..." : "Delete Post"}
                </Text>
              </Pressable>
            )}
            <Pressable 
              style={styles.menuItem}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.menuItemText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
});

// Memoize TrendingHashtag to prevent unnecessary re-renders
const TrendingHashtag = React.memo(({ hashtag }: { hashtag: { name: string; post_count: number } }) => (
  <Link href={{
    pathname: '/home', 
    params: { hashtag: hashtag.name }
  }} asChild>
    <Pressable style={styles.trendingHashtag}>
      <Text style={styles.trendingHashtagText}>#{hashtag.name}</Text>
      <Text style={styles.trendingHashtagCount}>{hashtag.post_count} posts</Text>
    </Pressable>
  </Link>
));

// Shimmer effect component for skeleton loaders
const Shimmer = () => {
  const shimmerAnimatedValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerAnimatedValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      })
    );
    
    shimmerAnimation.start();
    
    return () => {
      shimmerAnimation.stop();
    };
  }, []);
  
  // Create animation values for opacity to create shimmer effect without LinearGradient
  const opacity = shimmerAnimatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3]
  });
  
  return (
    <Animated.View 
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity,
        backgroundColor: '#FFFFFF',
      }}
    />
  );
};

// Skeleton loader component for posts
const PostSkeleton = () => (
  <View style={styles.postCard}>
    <View style={styles.postContainer}>
      <View style={styles.leftColumn}>
        <View style={[styles.avatar, styles.skeleton]}>
          <Shimmer />
        </View>
        <View style={[styles.verticalLine, { backgroundColor: '#E5E5E5' }]} />
      </View>
      
      <View style={styles.rightColumn}>
        <View style={styles.authorRow}>
          <View style={[styles.nameSkeleton, styles.skeleton]}>
            <Shimmer />
          </View>
          <View style={styles.spacer} />
          <View style={[styles.timestampSkeleton, styles.skeleton]}>
            <Shimmer />
          </View>
        </View>
        
        <View style={[styles.contentSkeleton, styles.skeleton]}>
          <Shimmer />
        </View>
        <View style={[styles.contentSkeletonShort, styles.skeleton]}>
          <Shimmer />
        </View>
        
        <View style={styles.engagement}>
          <View style={[styles.iconSkeleton, styles.skeleton]}>
            <Shimmer />
          </View>
          <View style={[styles.iconSkeleton, styles.skeleton]}>
            <Shimmer />
          </View>
          <View style={[styles.iconSkeleton, styles.skeleton]}>
            <Shimmer />
          </View>
          <View style={[styles.iconSkeleton, styles.skeleton]}>
            <Shimmer />
          </View>
        </View>
      </View>
    </View>
  </View>
);

export default function Feed() {
  const { 
    posts, 
    trendingHashtags,
    isLoading, 
    isLoadingMore,
    hasMorePosts,
    error, 
    fetchPosts,
    loadMorePosts,
    refreshPosts,
    fetchTrendingHashtags 
  } = useFeedStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [firstLoad, setFirstLoad] = useState(true);
  const [activeTab, setActiveTab] = useState('Threads');
  const [showOptions, setShowOptions] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const router = useRouter();
  
  // Animation values
  const headerHeight = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const heartBeat = useRef(new Animated.Value(1)).current;

  // Initial data fetch - will use cache if available
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchPosts({ following: activeTab === 'Following' }),
        fetchTrendingHashtags()
      ]);
      // Set firstLoad to false after initial data fetch
      setFirstLoad(false);
    };
    
    loadInitialData();
  }, [activeTab]);
  
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
    
    // Heart animation
    const pulseHeart = Animated.loop(
      Animated.sequence([
        Animated.timing(heartBeat, {
          toValue: 1.15,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(heartBeat, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(800),
      ])
    );
    
    pulseHeart.start();
    
    return () => {
      pulseHeart.stop();
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshPosts({ following: activeTab === 'Following' }), // Force refresh with correct filter
        fetchTrendingHashtags()
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refreshPosts, fetchTrendingHashtags, activeTab]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMorePosts) {
      loadMorePosts({ following: activeTab === 'Following' });
    }
  }, [isLoadingMore, hasMorePosts, loadMorePosts, activeTab]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    // Implement search functionality
  }, []);
  
  // Handler for tab change
  const handleTabChange = useCallback(async (tab: string) => {
    setActiveTab(tab);
    setFirstLoad(true);
    await fetchPosts({ 
      forceRefresh: true, 
      following: tab === 'Following'
    });
    setFirstLoad(false);
  }, [fetchPosts]);
  
  const handleOptionPress = (post: Post) => {
    setSelectedPost(post);
    setShowOptions(true);
  };

  const interpolatedHeaderHeight = headerHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [70, Platform.OS === 'ios' ? 120 : 100]
  });

  // Render footer for FlatList (loading indicator when loading more posts)
  const renderFooter = useMemo(() => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color="#0066CC" />
        <Text style={styles.loadingMoreText}>Loading more posts...</Text>
      </View>
    );
  }, [isLoadingMore]);
  
  // Render placeholder content while loading
  const renderPlaceholderContent = useMemo(() => {
    return (
      <>
        <View style={styles.trendingSection}>
          <View style={styles.trendingHeader}>
            <TrendingUp size={20} color="#0066CC" />
            <Text style={styles.trendingTitle}>Trending Topics</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingContainer}>
            {[1, 2, 3, 4, 5].map((_, index) => (
              <View key={index} style={[styles.trendingHashtagSkeleton, styles.skeleton]} />
            ))}
          </ScrollView>
        </View>
        
        {[1, 2, 3].map((_, index) => (
          <PostSkeleton key={index} />
        ))}
      </>
    );
  }, []);
  
  // Memoize the list header component to prevent unnecessary re-renders
  const ListHeaderComponent = useMemo(() => (
    <View>
      <View style={styles.trendingSection}>
        <View style={styles.trendingHeader}>
          <TrendingUp size={20} color="#0066CC" />
          <Text style={styles.trendingTitle}>Trending Topics</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trendingContainer}>
          {trendingHashtags.length > 0 
            ? trendingHashtags.map((hashtag) => (
                <TrendingHashtag key={hashtag.name} hashtag={hashtag} />
              ))
            : (firstLoad || isLoading) && [1, 2, 3, 4, 5].map((_, index) => (
                <View key={index} style={[styles.trendingHashtagSkeleton, styles.skeleton]} />
              ))
          }
        </ScrollView>
      </View>
    </View>
  ), [trendingHashtags, firstLoad, isLoading]);
  
  // Memoize the empty component to prevent unnecessary re-renders
  const ListEmptyComponent = useMemo(() => {
    if (firstLoad || isLoading) {
      return renderPlaceholderContent;
    }
    
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>
          {activeTab === 'Following' ? 'No posts from people you follow' : 'No posts yet'}
        </Text>
        <Text style={styles.emptyStateSubtext}>
          {activeTab === 'Following' 
            ? 'Follow some doctors to see their posts here'
            : 'Follow doctors or create your first post'
          }
        </Text>
      </View>
    );
  }, [firstLoad, isLoading, renderPlaceholderContent, activeTab]);

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
        <View style={styles.logoContainer}>
          <Animated.View 
            style={[
              styles.heartIcon,
              { transform: [{ scale: heartBeat }] }
            ]}
          >
            <Heart size={20} color="#fff" fill="#fff" />
          </Animated.View>
          <Text style={styles.title}>MEDICO</Text>
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
              placeholder="Search topics, hashtags, doctors..."
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>
        </Animated.View>
      </Animated.View>

      {/* Tabs */}
      <Animated.View 
        style={[
          styles.tabsContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Threads' && styles.activeTab]} 
          onPress={() => handleTabChange('Threads')}
        >
          <Text style={[styles.tabText, activeTab === 'Threads' && styles.activeTabText]}>Threads</Text>
          {activeTab === 'Threads' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Following' && styles.activeTab]} 
          onPress={() => handleTabChange('Following')}
        >
          <Text style={[styles.tabText, activeTab === 'Following' && styles.activeTabText]}>Following</Text>
          {activeTab === 'Following' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
      </Animated.View>

      {error && (
        <ErrorMessage 
          message={error} 
          onDismiss={() => useFeedStore.setState({ error: null })}
        />
      )}

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <FlatList
          data={posts}
          renderItem={({ item }) => <PostCard post={item} onOptionPress={() => handleOptionPress(item)} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.feed}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh} 
              tintColor="#0066CC"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={10}
          initialNumToRender={5}
          updateCellsBatchingPeriod={50}
          ListHeaderComponent={activeTab === 'Threads' ? ListHeaderComponent : null}
          ListEmptyComponent={ListEmptyComponent}
        />
      </Animated.View>

      <Link href="/home/create" asChild>
        <Pressable style={styles.fab}>
          <LinearGradient
            colors={['#1a82ff', '#0066CC']}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Plus size={24} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      </Link>

      {/* Post Options Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showOptions}
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowOptions(false);
                // Add share functionality
              }}
            >
              <Share size={20} color="#0066CC" />
              <Text style={styles.menuItemText}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowOptions(false);
                // Navigate to edit post screen
              }}
            >
              <Edit2 size={20} color="#0066CC" />
              <Text style={styles.menuItemText}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowOptions(false);
                // Add delete functionality
              }}
            >
              <Trash2 size={20} color="#FF3040" />
              <Text style={styles.menuItemTextDelete}>Delete</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowOptions(false);
                // Add report functionality
              }}
            >
              <Flag size={20} color="#0066CC" />
              <Text style={styles.menuItemText}>Report</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    height: Platform.OS === 'ios' ? 200 : 180,
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
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 12,
  },
  heartIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ff6b6b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  searchBarContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
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
  tabsContainer: {
    flexDirection: 'row',
    marginTop: Platform.OS === 'ios' ? 120 : 100,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    zIndex: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 0,
  },
  tabText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#0066CC',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '50%',
    height: 3,
    backgroundColor: '#0066CC',
    borderRadius: 1.5,
  },
  trendingSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    marginBottom: 8,
    borderRadius: 12,
    marginHorizontal: 8,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  trendingTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
  },
  trendingContainer: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  trendingHashtag: {
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.15)',
  },
  trendingHashtagText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
  },
  trendingHashtagCount: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  feed: {
    padding: 8,
  },
  postCard: {
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  postContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftColumn: {
    alignItems: 'center',
    marginRight: 12,
  },
  rightColumn: {
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(0, 102, 204, 0.2)',
  },
  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    marginVertical: 4,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  authorName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#1e293b',
  },
  spacer: {
    flex: 1,
  },
  timestamp: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
    marginRight: 8,
  },
  moreButton: {
    padding: 4,
  },
  moreButtonText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#6B7280',
    fontSize: 12,
    transform: [{ rotate: '90deg' }],
  },
  postContent: {
    fontSize: 15,
    color: '#1e293b',
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  hashtags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  hashtag: {
    color: '#0066CC',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  engagement: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 102, 204, 0.1)',
    paddingTop: 12,
  },
  engagementInfo: {
    marginTop: 6,
  },
  engagementText: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#0066CC',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 24,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  skeleton: {
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  nameSkeleton: {
    width: 100,
    height: 16,
    marginBottom: 8,
  },
  specialtySkeleton: {
    width: 80,
    height: 12,
    marginBottom: 4,
  },
  timestampSkeleton: {
    width: 40,
    height: 12,
  },
  contentSkeleton: {
    height: 18,
    marginBottom: 8,
    width: '100%',
  },
  contentSkeletonShort: {
    height: 18,
    marginBottom: 12,
    width: '70%',
  },
  iconSkeleton: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  trendingHashtagSkeleton: {
    width: 120,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  loadingMoreContainer: {
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#0066CC',
    marginLeft: 8,
    fontFamily: 'Inter_400Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 102, 204, 0.1)',
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#1e293b',
    marginLeft: 12,
  },
  menuItemTextDelete: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#FF3040',
    marginLeft: 12,
  },
});