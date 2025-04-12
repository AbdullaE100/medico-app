import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TextInput, FlatList, RefreshControl, Animated, Modal, Dimensions, StatusBar, Platform, TouchableOpacity, useWindowDimensions, SafeAreaView, Share as RNShare } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Heart, MessageCircle, Repeat2, Share, Search, ChevronRight, Home, User, PenSquare, RefreshCw } from 'lucide-react-native';
import { useFeedStore, Post } from '@/stores/useFeedStore';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Easing } from 'react-native-reanimated';
import CommentModal from '../../components/CommentModal';
import RepostModal from '../../components/RepostModal';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { PollExtractor } from '@/components/PollExtractor';
import { FormattedPostContent } from '@/components/FormattedPostContent';
import { Avatar } from '@/components/Avatar';

const { width, height } = Dimensions.get('window');
const AVATAR_SIZE = 40;

// Add these properties to the existing Post interface at the top of the file
// Note: This is a local extension to the Post interface from useFeedStore
interface ExtendedPost extends Post {
  quoted_post_id?: string;
  quoted_post_content?: string;
  quoted_post_author?: string;
  quoted_post_avatar?: string;
  has_liked?: boolean;
  has_reposted?: boolean;
  replies_count?: number;
  author?: {
    full_name: string;
    avatar_url?: string;
    specialty?: string;
    verified?: boolean;
  };
}

// Thread-style PostCard
const PostCard = React.memo(({ post, onOptionPress, index, onComment, onRepost }: { 
  post: ExtendedPost; 
  onOptionPress: () => void; 
  index: number; 
  onComment: (postId: string) => void;
  onRepost: (post: ExtendedPost) => void;
}) => {
  const { likePost, unlikePost } = useFeedStore();
  const [isLiking, setIsLiking] = useState(false);
  const router = useRouter();
  const likeScale = useRef(new Animated.Value(1)).current;
  const repostScale = useRef(new Animated.Value(1)).current;
  
  // Format timestamp
  const formattedTime = post.created_at 
    ? formatDistanceToNow(new Date(post.created_at), { addSuffix: false }).replace('about ', '')
    : 'recently';

  const handleLike = useCallback(async () => {
    if (isLiking) return;
    setIsLiking(true);
    
    // Animate the like button
    Animated.sequence([
      Animated.timing(likeScale, { 
        toValue: 1.35, 
        duration: 150, 
        useNativeDriver: true 
      }),
      Animated.timing(likeScale, { 
        toValue: 1, 
        duration: 150, 
        useNativeDriver: true 
      })
    ]).start();
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      if (post.id) {
        if (post.is_liked_by_me) {
          await unlikePost(post.id);
        } else {
          await likePost(post.id);
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLiking(false);
    }
  }, [post.id, isLiking, likePost, unlikePost, post.is_liked_by_me]);

  const handleComment = useCallback(() => {
    if (post.id) {
      onComment(post.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [post.id, onComment]);

  const handleRepost = useCallback(() => {
    onRepost(post);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Animate the repost button
    Animated.sequence([
      Animated.timing(repostScale, { 
        toValue: 1.35, 
        duration: 150, 
        useNativeDriver: true 
      }),
      Animated.timing(repostScale, { 
        toValue: 1, 
        duration: 150, 
        useNativeDriver: true 
      })
    ]).start();
  }, [post, onRepost, repostScale]);

  const handleShare = useCallback(async () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      const result = await RNShare.share({
        message: post.is_anonymous 
          ? `Check out this anonymous post from a medical professional: ${post.content}`
          : `Check out this post from ${post.profile?.full_name || 'a medical professional'}: ${post.content}`,
        // url: 'https://yourdomain.com/post/' + post.id, // Use when you have a web version
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [post]);

  // Navigate to post details when post content is clicked
  const navigateToPostDetails = useCallback(() => {
    if (post.id) {
      router.push(`/home/post/${post.id}`);
    }
  }, [post.id, router]);

  // Navigate to user profile - use correct path parameter format
  const navigateToProfile = useCallback(() => {
    if (post.is_anonymous) {
      // Don't navigate to a profile for anonymous posts
      return;
    }
    
    if (post.profile?.id) {
      router.push(`/profile/${post.profile.id}` as any);
    }
  }, [post.profile?.id, post.is_anonymous, router]);

  // Can show quoted post
  const hasQuotedPost = Boolean(
    post.is_repost && 
    post.content && 
    (post.quoted_post_id || post.original_post_id)
  );

  return (
    <View style={styles.postContainer}>
      <View style={styles.postContent}>
        {/* Author row with avatar and name */}
        <View style={styles.authorRow}>
          <TouchableOpacity onPress={navigateToProfile}>
            <Avatar 
              size={40}
              source={post.is_anonymous ? null : post.profile?.avatar_url}
              initials={post.profile?.full_name?.charAt(0) || 'M'}
              isAnonymous={post.is_anonymous}
            />
          </TouchableOpacity>
          
          <View style={styles.authorDetails}>
            <View style={styles.nameTimeRow}>
              <TouchableOpacity onPress={navigateToProfile}>
                <Text style={styles.authorName}>
                  {post.is_anonymous 
                    ? 'Anonymous Doctor' 
                    : post.profile?.full_name || 'Medical Professional'}
                </Text>
              </TouchableOpacity>
              {!post.is_anonymous && Boolean(post.author?.verified) && (
                <Image 
                  source={{ uri: 'https://placehold.co/16x16/0066ff/0066ff' }} 
                  style={styles.verifiedBadge} 
                />
              )}
              <Text style={styles.timestamp}>{formattedTime}</Text>
              <TouchableOpacity onPress={onOptionPress} style={styles.optionsButton}>
                <Text style={styles.optionsIcon}>•••</Text>
              </TouchableOpacity>
            </View>
            
            {/* Post text content */}
            <TouchableOpacity onPress={navigateToPostDetails} activeOpacity={0.8}>
              <FormattedPostContent style={styles.postText} content={post.content} />
            
              {/* Quoted post if applicable */}
              {hasQuotedPost && (
                <View style={styles.quotedPost}>
                  <View style={styles.quotedPostHeader}>
                    <Image 
                      source={{ 
                        uri: post.quoted_post_avatar || 'https://placehold.co/24x24/22cc88/22cc88' 
                      }} 
                      style={styles.quotedPostAvatar} 
                    />
                    <Text style={styles.quotedPostAuthor}>
                      {post.quoted_post_author || 'Medical Professional'}
                    </Text>
                  </View>
                  <FormattedPostContent style={styles.quotedPostText} content={post.quoted_post_content || "Original post content not available"} />
                </View>
              )}
            </TouchableOpacity>
            
            {/* Post Media */}
            {post.media_url && post.media_url.length > 0 && (
              <TouchableOpacity onPress={navigateToPostDetails} activeOpacity={0.9}>
                <View style={styles.mediaContainer}>
                  <Image 
                    source={{ uri: post.media_url[0] }} 
                    style={styles.mediaImage}
                    resizeMode="cover"
                  />
                  {post.media_url.length > 1 && (
                    <View style={styles.mediaCounter}>
                      <Text style={styles.mediaCounterText}>+{post.media_url.length - 1}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
            
            {/* Poll section */}
            {post.id && post.content && (
              <PollExtractor postId={post.id} content={post.content} />
            )}
            
            {/* Action icons */}
            <View style={styles.actionBar}>
              <TouchableOpacity onPress={handleLike} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Animated.View style={{transform: [{ scale: likeScale }]}}>
                  <View style={styles.actionWithCount}>
                    <Heart 
                      size={22} 
                      color="#000000"
                      fill={post.is_liked_by_me ? "#FF3B30" : "transparent"}
                      strokeWidth={1.5}
                    />
                    {(post.likes_count ?? 0) > 0 && (
                      <Text style={styles.actionCountText}>
                        {post.likes_count ?? 0}
                      </Text>
                    )}
                  </View>
                </Animated.View>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleComment} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <View style={styles.actionWithCount}>
                  <MessageCircle size={22} color="#000000" strokeWidth={1.5} />
                  {((post.replies_count ?? 0) + (post.comments_count ?? 0)) > 0 && (
                    <Text style={styles.actionCountText}>
                      {(post.replies_count ?? 0) + (post.comments_count ?? 0)}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleRepost} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Animated.View style={{transform: [{ scale: repostScale }]}}>
                  <Repeat2 
                    size={22} 
                    color="#000000" 
                    strokeWidth={1.5}
                    fill={post.is_repost ? "#4CAF50" : "transparent"} 
                  />
                </Animated.View>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleShare} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Share size={22} color="#000000" strokeWidth={1.5} />
              </TouchableOpacity>
            </View>
            
            {/* Profile pictures and engagement stats */}
            <TouchableOpacity onPress={navigateToPostDetails} activeOpacity={0.8}>
              <View style={styles.engagementRow}>
                <View style={styles.engagementAvatars}>
                  <Image 
                    source={{ uri: 'https://placehold.co/24x24/555555/555555' }}
                    style={[styles.engagementAvatar, styles.firstEngagementAvatar]} 
                  />
                  <Image 
                    source={{ uri: 'https://placehold.co/24x24/666666/666666' }}
                    style={styles.engagementAvatar} 
                  />
                </View>
                <Text style={styles.engagementStats}>
                  <Text style={styles.engagementBold}>{(post.replies_count ?? 0) + (post.comments_count ?? 0)}</Text> replies • <Text style={styles.engagementBold}>{post.likes_count ?? 0}</Text> likes
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
});

// Thread-inspired Header
const HomeHeader = ({ activeTab, onTabChange }: { 
  activeTab: 'all' | 'following'; 
  onTabChange: (tab: 'all' | 'following') => void 
}) => {
  return (
    <View style={styles.headerContainer}>
      {/* Top header with title and icons */}
      <View style={styles.topHeader}>
        <Text style={styles.appTitle}>Medico</Text>
        <View style={styles.headerRightButtons}>
          <Image 
            source={{ uri: 'https://placehold.co/24x24/333333/333333' }}
            style={styles.instagramIcon} 
          />
          <Text style={styles.moreDotsIcon}>•••</Text>
        </View>
      </View>
      
      {/* For You/Following Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => onTabChange('all')}
        >
          <Text style={activeTab === 'all' ? styles.activeTabText : styles.tabText}>
            For You
          </Text>
          {activeTab === 'all' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'following' && styles.activeTab]}
          onPress={() => onTabChange('following')}
        >
          <Text style={activeTab === 'following' ? styles.activeTabText : styles.tabText}>
            Following
          </Text>
          {activeTab === 'following' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { posts, isLoading, error, fetchPosts, loadPosts, likePost, deletePost, refreshPosts } = useFeedStore();
  const [refreshing, setRefreshing] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [selectedPostData, setSelectedPostData] = useState<ExtendedPost | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [repostModalVisible, setRepostModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'following'>('all');
  
  // Load posts on component mount or when tab changes
  useEffect(() => {
    if (activeTab === 'all') {
      loadPosts();
    } else {
      // Load posts from followed connections
      fetchPosts({ following: true });
    }
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'all') {
      await loadPosts();
    } else {
      await refreshPosts({ following: true });
    }
    setRefreshing(false);
  };

  const handleTabChange = (tab: 'all' | 'following') => {
    setActiveTab(tab);
  };

  const handlePostOptions = useCallback((postId: string | undefined) => {
    if (postId) {
      setSelectedPost(postId);
      setOptionsVisible(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleDeletePost = useCallback(async () => {
    if (selectedPost) {
      try {
        setOptionsVisible(false);
        setDeleteConfirmVisible(true);
      } catch (error) {
        console.error('Error preparing to delete post:', error);
      }
    }
  }, [selectedPost]);

  const confirmDelete = useCallback(async () => {
    if (selectedPost) {
      try {
        const success = await deletePost(selectedPost);
        if (success) {
          // Show toast or success message
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          // Show error
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } catch (error) {
        console.error('Error deleting post:', error);
      } finally {
        setDeleteConfirmVisible(false);
        setSelectedPost(null);
      }
    }
  }, [selectedPost, deletePost]);

  const handleShare = useCallback(() => {
    setOptionsVisible(false);
    setShareModalVisible(true);
  }, []);

  const handleOpenCommentModal = useCallback((postId: string) => {
    setSelectedPost(postId);
    setCommentModalVisible(true);
  }, []);

  const handleCloseCommentModal = useCallback(() => {
    setCommentModalVisible(false);
    setSelectedPost(null);
  }, []);
  
  const handleOpenRepostModal = useCallback((post: ExtendedPost) => {
    setSelectedPostData(post);
    setRepostModalVisible(true);
  }, []);

  const handleCloseRepostModal = useCallback(() => {
    setRepostModalVisible(false);
    setSelectedPostData(null);
  }, []);

  // Render a post with our beautiful PostCard component
  const renderPostItem = ({ item, index }: { item: ExtendedPost; index: number }) => {
    // Skip rendering if post ID is missing
    if (!item.id) return null;
    
    return (
      <PostCard 
        post={item} 
        onOptionPress={() => handlePostOptions(item.id)} 
        index={index}
        onComment={handleOpenCommentModal}
        onRepost={handleOpenRepostModal}
      />
    );
  };

  // Empty state
  const EmptyState = ({ activeTab }: { activeTab: 'all' | 'following' }) => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <MessageCircle size={28} color="#000" />
      </View>
      
      <Text style={styles.emptyTitle}>
        {activeTab === 'all' ? 'No posts yet' : 'No posts from connections'}
      </Text>
      <Text style={styles.emptyDescription}>
        {activeTab === 'all' 
          ? 'Medical posts will appear here' 
          : 'Follow more doctors to see their posts here'}
      </Text>
      
      {activeTab === 'all' ? (
        <TouchableOpacity 
          style={styles.createPostButton}
          onPress={() => router.push('/create')}
          activeOpacity={0.8}
        >
          <Text style={styles.createPostButtonText}>Create Post</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={styles.createPostButton}
          onPress={() => router.push('/network')}
          activeOpacity={0.8}
        >
          <Text style={styles.createPostButtonText}>Find Connections</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Loading state
  const LoadingState = () => (
    <View style={styles.loadingContainer}>
      <LoadingOverlay message="Loading your feed..." />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <HomeHeader activeTab={activeTab} onTabChange={handleTabChange} />
      
      {isLoading && !refreshing ? (
        <LoadingState />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              if (activeTab === 'all') {
                loadPosts();
              } else {
                fetchPosts({ following: true });
              }
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.feedWrapper}>
          <FlatList
            data={posts}
            renderItem={renderPostItem}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            contentContainerStyle={styles.feedContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#000"
              />
            }
            ListEmptyComponent={<EmptyState activeTab={activeTab} />}
            ItemSeparatorComponent={() => <View style={styles.postSeparator} />}
          />
        </View>
      )}
      
      {/* Post Options Modal */}
      <Modal
        visible={optionsVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setOptionsVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setOptionsVisible(false)}
        >
          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.optionItem}>
              <Text style={styles.optionText}>Save Post</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionItem} onPress={handleShare}>
              <Text style={styles.optionText}>Share Post</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionItem} onPress={handleDeletePost}>
              <Text style={[styles.optionText, { color: '#FF3B30' }]}>Delete Post</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionItem}>
              <Text style={styles.optionText}>Report</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionItem, styles.optionItemCancel]}
              onPress={() => setOptionsVisible(false)}
            >
              <Text style={styles.optionTextCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteConfirmVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDeleteConfirmVisible(false)}
        >
          <View style={styles.confirmContainer}>
            <Text style={styles.confirmTitle}>Delete Post?</Text>
            <Text style={styles.confirmText}>
              This action cannot be undone. The post will be permanently deleted.
            </Text>
            
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={() => setDeleteConfirmVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.confirmButton, styles.deleteButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Share Modal */}
      <Modal
        visible={shareModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShareModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShareModalVisible(false)}
        >
          <View style={styles.shareContainer}>
            <View style={styles.shareHeader}>
              <Text style={styles.shareTitle}>Share Post</Text>
              <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                <Text style={styles.shareCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.shareOptionsContainer}>
              <TouchableOpacity style={styles.shareOption}>
                <View style={[styles.shareIconContainer, {backgroundColor: '#25D366'}]}>
                  <Text style={styles.shareIcon}>W</Text>
                </View>
                <Text style={styles.shareOptionText}>WhatsApp</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.shareOption}>
                <View style={[styles.shareIconContainer, {backgroundColor: '#3498db'}]}>
                  <Text style={styles.shareIcon}>T</Text>
                </View>
                <Text style={styles.shareOptionText}>Twitter</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.shareOption}>
                <View style={[styles.shareIconContainer, {backgroundColor: '#2962FF'}]}>
                  <Text style={styles.shareIcon}>L</Text>
                </View>
                <Text style={styles.shareOptionText}>LinkedIn</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.shareOption}>
                <View style={[styles.shareIconContainer, {backgroundColor: '#1877F2'}]}>
                  <Text style={styles.shareIcon}>F</Text>
                </View>
                <Text style={styles.shareOptionText}>Facebook</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.shareOption}>
                <View style={[styles.shareIconContainer, {backgroundColor: '#4285F4'}]}>
                  <Text style={styles.shareIcon}>G</Text>
                </View>
                <Text style={styles.shareOptionText}>Gmail</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.shareOption}>
                <View style={[styles.shareIconContainer, {backgroundColor: '#34B7F1'}]}>
                  <Text style={styles.shareIcon}>T</Text>
                </View>
                <Text style={styles.shareOptionText}>Telegram</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.copyLinkButton}
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setShareModalVisible(false);
                  // In a real app, this would copy the actual link
                  alert('Link copied to clipboard!');
                }}
              >
                <Text style={styles.copyLinkText}>Copy Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Comment Modal */}
      <CommentModal
        visible={commentModalVisible}
        postId={selectedPost}
        onClose={handleCloseCommentModal}
      />
      
      {/* Repost Modal */}
      <RepostModal
        visible={repostModalVisible}
        post={selectedPostData}
        onClose={handleCloseRepostModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  instagramIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  moreDotsIcon: {
    fontSize: 16,
    fontWeight: '600',
    transform: [{ rotate: '90deg' }],
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: -1,
    width: 60,
    height: 1,
    backgroundColor: '#000000',
  },
  feedContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
  },
  postContent: {
    paddingHorizontal: 16,
  },
  postSeparator: {
    height: 1,
    backgroundColor: '#f3f4f6',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  authorDetails: {
    flex: 1,
    marginLeft: 12,
  },
  nameTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginRight: 4,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  timestamp: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 'auto',
  },
  optionsButton: {
    marginLeft: 8,
    padding: 4,
  },
  optionsIcon: {
    fontSize: 16,
    color: '#6b7280',
    transform: [{ rotate: '90deg' }],
  },
  postText: {
    fontSize: 15,
    color: '#000000',
    marginBottom: 12,
    lineHeight: 20,
  },
  quotedPost: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  quotedPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  quotedPostAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  quotedPostAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  quotedPostText: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 4,
  },
  mediaContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  mediaImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  mediaCounter: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mediaCounterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  actionBar: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 8,
  },
  engagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  engagementAvatars: {
    flexDirection: 'row',
  },
  engagementAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginLeft: -10,
  },
  firstEngagementAvatar: {
    marginLeft: 0,
  },
  engagementStats: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  createPostButton: {
    backgroundColor: '#000',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  createPostButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#000',
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  optionsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    marginHorizontal: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  optionItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  optionItemCancel: {
    borderBottomWidth: 0,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
  },
  optionTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  confirmContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 24,
    padding: 20,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 320,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  shareContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 36,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: height * 0.7,
  },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  shareTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  shareCloseButton: {
    fontSize: 20,
    color: '#6b7280',
    padding: 5,
  },
  shareOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  shareOption: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 20,
  },
  shareIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shareIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  shareOptionText: {
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
  },
  copyLinkButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  copyLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  tapToViewText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  commentButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#000',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  touchablePost: {
    backgroundColor: 'transparent',
  },
  actionWithCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionCountText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#64748b',
    marginLeft: 4,
  },
  engagementBold: {
    fontFamily: 'Inter_600SemiBold',
    color: '#475569',
  },
  feedWrapper: {
    flex: 1,
  },
});