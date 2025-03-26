import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TextInput, Pressable, FlatList, RefreshControl, ActivityIndicator, Animated, Alert, Modal, Dimensions, StatusBar, Platform, TouchableOpacity, useWindowDimensions, SafeAreaView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Heart, MessageCircle, Repeat2, Send, Search, TrendingUp, Plus, Trash2, Bookmark, ChevronRight, Sparkles, Flag, Edit2, Share } from 'lucide-react-native';
import { useFeedStore, Post } from '@/stores/useFeedStore';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ErrorMessage } from '@/components/ErrorMessage';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import Logo from '@/components/Logo';
import { formatDistanceToNow } from 'date-fns';
import * as Haptics from 'expo-haptics';

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
                color={post.has_liked_by_me ? '#FF3040' : '#000000'} 
                fill={post.has_liked_by_me ? '#FF3040' : 'transparent'} 
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

// Add a header component with the search bar and logo, positioned correctly with space for icons
const HomeHeader = () => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        <View style={styles.logoContainer}>
          <Logo width={120} height={36} />
        </View>
        <View style={styles.iconsPlaceholder} />
      </View>
      <View style={styles.searchContainer}>
        <Search size={16} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search medical topics, posts, and professionals"
          placeholderTextColor="#999"
        />
      </View>
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { posts, isLoading, error, loadPosts, likePost, unlikePost } = useFeedStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPosts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handlePostPress = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const handleLikePress = (postId: string) => {
    // Get the post and toggle like status
    const post = posts.find(p => p.id === postId);
    if (post) {
      if (post.is_liked_by_me) {
        unlikePost(postId);
      } else {
        likePost(postId);
      }
      
      // Trigger haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const renderPostItem = ({ item }: { item: Post }) => {
    const formattedDate = item.created_at 
      ? formatDistanceToNow(new Date(item.created_at))
      : '';
    
    // Skip rendering if post ID is missing
    if (!item.id) return null;
    
    return (
      <TouchableOpacity 
        style={styles.postContainer}
        activeOpacity={0.9}
        onPress={() => handlePostPress(item.id as string)}
      >
        <View style={styles.postHeader}>
          <View style={styles.profileInfo}>
            {item.profile?.avatar_url ? (
              <Image 
                source={{ uri: item.profile.avatar_url }} 
                style={styles.avatar} 
              />
            ) : (
              <View style={[styles.avatar, styles.placeholderAvatar]}>
                <Text style={styles.avatarText}>
                  {item.profile?.full_name?.charAt(0) || '?'}
                </Text>
              </View>
            )}
            <View style={styles.nameContainer}>
              <Text style={styles.fullName}>{item.profile?.full_name || 'Unknown User'}</Text>
              <Text style={styles.timeAgo}>{formattedDate}</Text>
            </View>
          </View>
        </View>
        
        <Text style={styles.postContent}>{item.content}</Text>
        
        {item.media_url && item.media_url.length > 0 && (
          <View style={styles.mediaContainer}>
            <Image
              source={{ uri: item.media_url[0] }}
              style={[styles.mediaImage, { width: width - 32 }]}
              resizeMode="cover"
            />
            {item.media_url.length > 1 && (
              <View style={styles.moreImagesIndicator}>
                <Text style={styles.moreImagesText}>+{item.media_url.length - 1}</Text>
              </View>
            )}
          </View>
        )}
        
        {item.hashtags && item.hashtags.length > 0 && (
          <View style={styles.hashtagsContainer}>
            {item.hashtags.map((tag, index) => (
              <Text key={index} style={styles.hashtag}>#{tag}</Text>
            ))}
          </View>
        )}
        
        <View style={styles.postActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleLikePress(item.id as string)}
          >
            <Heart 
              size={20} 
              color={item.is_liked_by_me ? '#FF3B30' : '#666'} 
              fill={item.is_liked_by_me ? '#FF3B30' : 'transparent'} 
            />
            {(item.likes_count && item.likes_count > 0) ? (
              <Text style={styles.actionCount}>{item.likes_count}</Text>
            ) : null}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handlePostPress(item.id as string)}
          >
            <MessageCircle size={20} color="#666" />
            {(item.comments_count && item.comments_count > 0) ? (
              <Text style={styles.actionCount}>{item.comments_count}</Text>
            ) : null}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Repeat2 size={20} color="#666" />
            {(item.reposts_count && item.reposts_count > 0) ? (
              <Text style={styles.actionCount}>{item.reposts_count}</Text>
            ) : null}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Share size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <HomeHeader />
      
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadPosts}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPostItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.feedContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0066CC']}
              tintColor="#0066CC"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptyDescription}>
                Be the first to create a post in your medical community
              </Text>
              <TouchableOpacity 
                style={styles.createPostButton}
                onPress={() => router.push('/create')}
              >
                <Plus size={18} color="#FFFFFF" />
                <Text style={styles.createPostButtonText}>Create Post</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoContainer: {
    flex: 1,
  },
  iconsPlaceholder: {
    width: 90,
    height: 36,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#333',
    height: 40,
  },
  feedContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter_400Regular',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#0066CC',
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#333',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066CC',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createPostButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  postContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  placeholderAvatar: {
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  nameContainer: {
    marginLeft: 12,
  },
  fullName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#333',
  },
  timeAgo: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#666',
  },
  postContent: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  mediaContainer: {
    position: 'relative',
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaImage: {
    height: 200,
    borderRadius: 8,
  },
  moreImagesIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  moreImagesText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  hashtag: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
    marginRight: 8,
    marginBottom: 4,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EBEBEB',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  actionCount: {
    marginLeft: 4,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#666',
  },
});