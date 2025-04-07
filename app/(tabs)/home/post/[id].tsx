import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  Pressable, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  Heart, 
  MessageCircle, 
  Repeat2, 
  Share2, 
  ArrowLeft, 
  Send,
  UserCheck 
} from 'lucide-react-native';
import { useFeedStore, Comment } from '@/stores/useFeedStore';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ErrorMessage } from '@/components/ErrorMessage';
import { supabase } from '@/lib/supabase';

// Define a more complete Post interface for this component
interface PostDetail {
  id?: string;
  user_id?: string;
  content: string;
  media_url?: string[];
  hashtags?: string[];
  visibility?: 'public' | 'followers';
  is_anonymous?: boolean;
  created_at?: string;
  updated_at?: string;
  profile?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    specialty?: string;
  };
  likes_count?: number;
  comments_count?: number;
  reposts_count?: number;
  has_liked?: boolean;
  has_reposted?: boolean;
  is_repost?: boolean;
  original_post_id?: string | null;
}

const CommentCard = ({ 
  comment, 
  onReply, 
  onLike, 
  onRepost, 
  nestingLevel = 0,
  parentAuthor,
  showReplies = true,
  allComments 
}: { 
  comment: Comment; 
  onReply: (comment: Comment) => void;
  onLike: (commentId: string) => void;
  onRepost: (comment: Comment) => void;
  nestingLevel?: number;
  parentAuthor?: string;
  showReplies?: boolean;
  allComments?: Comment[];
}) => {
  const [showAllReplies, setShowAllReplies] = useState(false);
  
  // Find replies to this comment
  const replies = allComments?.filter(c => c.parent_id === comment.id) || [];
  const hasReplies = replies.length > 0;
  
  // Only show 2 replies by default
  const visibleReplies = showAllReplies ? replies : replies.slice(0, 2);
  const hasMoreReplies = replies.length > 2 && !showAllReplies;

  // Ensure likes_count, etc. are defined
  const likes = comment.likes_count || 0;
  const reposts = comment.reposts_count || 0;
  const replyCount = comment.replies_count || 0;

  return (
    <View style={styles.commentContainer}>
      <View style={[
        styles.commentCard, 
        nestingLevel > 0 && styles.nestedComment,
        nestingLevel > 0 && { marginLeft: 0 } // Remove default margin for nested comments
      ]}>
        {parentAuthor && nestingLevel > 0 && (
          <Text style={styles.replyingTo}>Replying to <Text style={styles.replyingToName}>@{parentAuthor}</Text></Text>
        )}
        
        <View style={styles.commentHeader}>
          <Image 
            source={{ 
              uri: comment.author?.avatar_url || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400'
            }} 
            style={styles.commentAvatar} 
          />
          <View style={styles.commentAuthorInfo}>
            <View style={styles.commentAuthorRow}>
              <Text style={styles.commentAuthorName}>{comment.author?.full_name || 'User'}</Text>
              {comment.author?.specialty && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓</Text>
                </View>
              )}
            </View>
            <Text style={styles.commentAuthorSpecialty}>{comment.author?.specialty || ''}</Text>
          </View>
          <Text style={styles.commentTimestamp}>
            {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : ''}
          </Text>
        </View>

        <Text style={styles.commentContent}>{comment.content}</Text>

        <View style={styles.commentActions}>
          <Pressable onPress={() => onLike(comment.id)} style={styles.commentAction}>
            <Heart
              size={16}
              color={comment.has_liked ? '#FF4D4D' : '#666666'}
              fill={comment.has_liked ? '#FF4D4D' : 'transparent'}
            />
            <Text style={[
              styles.commentActionText, 
              comment.has_liked && styles.commentActionTextActive
            ]}>
              {likes > 0 ? likes : ''}
            </Text>
          </Pressable>

          <Pressable onPress={() => onReply(comment)} style={styles.commentAction}>
            <MessageCircle size={16} color="#666666" />
            <Text style={styles.commentActionText}>
              {replyCount > 0 ? replyCount : ''}
            </Text>
          </Pressable>

          <Pressable onPress={() => onRepost(comment)} style={styles.commentAction}>
            <Repeat2
              size={16}
              color={comment.has_reposted ? '#22C55E' : '#666666'}
            />
            <Text style={[
              styles.commentActionText,
              comment.has_reposted && styles.commentActionTextReposted
            ]}>
              {reposts > 0 ? reposts : ''}
            </Text>
          </Pressable>

          <Pressable style={styles.commentAction}>
            <Share2 size={16} color="#666666" />
          </Pressable>
        </View>
      </View>

      {showReplies && hasReplies && (
        <View style={styles.repliesContainer}>
          {hasReplies && (
            <View style={styles.repliesHeader}>
              <View style={styles.repliesLine} />
              <Text style={styles.repliesCount}>
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </Text>
              <View style={styles.repliesLine} />
            </View>
          )}
          
          {visibleReplies.map((reply) => (
            <View key={reply.id} style={styles.replyWrapper}>
              <View style={styles.replyIndentLine} />
              <View style={styles.replyContent}>
                <CommentCard
                  comment={reply}
                  onReply={onReply}
                  onLike={onLike}
                  onRepost={onRepost}
                  nestingLevel={nestingLevel + 1}
                  parentAuthor={comment.author?.full_name}
                  showReplies={nestingLevel < 2} // Limit nesting to 3 levels
                  allComments={allComments}
                />
              </View>
            </View>
          ))}
          
          {hasMoreReplies && (
            <Pressable 
              onPress={() => setShowAllReplies(true)} 
              style={styles.showMoreRepliesButton}
            >
              <Text style={styles.showMoreRepliesText}>
                Show {replies.length - 2} more {replies.length - 2 === 1 ? 'reply' : 'replies'}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};

export default function PostDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { 
    posts, 
    isLoading, 
    error, 
    fetchPosts, 
    likePost, 
    repostPost, 
    fetchComments, 
    createComment,
    likeComment,
    repostComment
  } = useFeedStore();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [likeLoading, setLikeLoading] = useState(false);
  const [repostLoading, setRepostLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Try to find the post in the store first
    const foundPost = posts.find(p => p.id === id);
    if (foundPost) {
      setPost(foundPost);
    } else {
      // If not found, fetch posts
      fetchPosts();
    }
  }, [id, posts, fetchPosts]);

  useEffect(() => {
    if (id) {
      loadComments();
    }
  }, [id]);

  const loadComments = async () => {
    if (!id) return;
    
    setCommentsLoading(true);
    try {
      const commentsData = await fetchComments(id as string);
      setComments(commentsData);
      
      // Fetch the updated post to get accurate comments_count after loading comments
      const { data: updatedPost } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();
        
      if (updatedPost && post) {
        // Create updated post object with the latest comment count
        const updatedPostWithAuthor = {
          ...post,
          comments_count: updatedPost.comments_count || 0
        };
        
        // Update local post state
        setPost(updatedPostWithAuthor);
        
        // Also update the post in the global store to ensure consistency
        useFeedStore.setState(state => ({
          posts: state.posts.map(p => 
            p.id === post.id ? updatedPostWithAuthor : p
          )
        }));
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post || !post.id) return;
    try {
      await likePost(post.id);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleRepost = async () => {
    if (!post || !post.id) return;
    try {
      await repostPost(post.id);
    } catch (error) {
      console.error('Error reposting:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !id || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // If replying to a comment, include parent_id
      if (replyingTo) {
        await createComment(id as string, newComment.trim(), replyingTo.id);
        setReplyingTo(null);
      } else {
        await createComment(id as string, newComment.trim());
      }
      
      setNewComment('');
      
      // Load comments will also refresh the post data
      await loadComments(); 
      
      // Scroll to bottom after comment is added
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplyToComment = (comment: Comment) => {
    setReplyingTo(comment);
    setNewComment(`@${comment.author?.full_name} `);
    
    // Focus the input
    setTimeout(() => {
      // Note: In a real app, you would use a ref to focus the input
    }, 100);
  };

  const handleLikeComment = async (commentId: string) => {
    if (likeLoading) return;
    
    setLikeLoading(true);
    try {
      // Optimistic update
      setComments(prevComments => prevComments.map(comment => {
        if (comment.id === commentId) {
          const hasLiked = comment.has_liked || false;
          return {
            ...comment,
            likes_count: (comment.likes_count || 0) + (hasLiked ? -1 : 1),
            has_liked: !hasLiked
          };
        }
        return comment;
      }));
      
      // Call the actual API
      await likeComment(commentId);
    } catch (error) {
      console.error('Error liking comment:', error);
      
      // Roll back optimistic update if it fails
      await loadComments();
    } finally {
      setLikeLoading(false);
    }
  };

  const handleRepostComment = async (comment: Comment) => {
    if (repostLoading) return;
    
    setRepostLoading(true);
    try {
      // Optimistic update
      setComments(prevComments => prevComments.map(c => {
        if (c.id === comment.id) {
          const hasReposted = c.has_reposted || false;
          return {
            ...c,
            reposts_count: (c.reposts_count || 0) + (hasReposted ? -1 : 1),
            has_reposted: !hasReposted
          };
        }
        return c;
      }));
      
      // Call the actual API
      await repostComment(comment.id);
    } catch (error) {
      console.error('Error reposting comment:', error);
      
      // Roll back optimistic update if it fails
      await loadComments();
    } finally {
      setRepostLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000000" />
        </Pressable>
        <Text style={styles.headerTitle}>Post</Text>
      </View>

      <View style={styles.content}>
        {isLoading && !post ? (
          <LoadingOverlay message="Loading post..." />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : !post ? (
          <View style={styles.centerContent}>
            <Text style={styles.notFoundText}>Post not found</Text>
          </View>
        ) : (
          <>
            <ScrollView 
              style={styles.content} 
              contentContainerStyle={{ paddingBottom: 100 }}
              ref={scrollViewRef}
            >
              <View style={styles.postCard}>
                <View style={styles.postHeader}>
                  <Image 
                    source={{ 
                      uri: post.is_anonymous
                        ? 'https://placehold.co/100x100/555555/FFFFFF?text=MD'
                        : post.profile?.avatar_url || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400'
                    }} 
                    style={styles.avatar} 
                  />
                  <View style={styles.authorInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.authorName}>
                        {post.is_anonymous ? 'Anonymous Doctor' : post.profile?.full_name || 'User'}
                      </Text>
                      {!post.is_anonymous && post.profile?.specialty && (
                        <View style={styles.verifiedBadge}>
                          <Text style={styles.verifiedText}>✓</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.authorSpecialty}>
                      {post.is_anonymous ? 'Identity hidden' : post.profile?.specialty || ''}
                    </Text>
                    <Text style={styles.timestamp}>
                      {post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}
                    </Text>
                  </View>
                </View>

                <Text style={styles.postContent}>{post.content}</Text>

                {post.media_url && post.media_url.length > 0 && (
                  <Image 
                    source={{ uri: post.media_url[0] }} 
                    style={styles.postImage}
                    resizeMode="cover"
                  />
                )}

                {post.hashtags && post.hashtags.length > 0 && (
                  <View style={styles.hashtags}>
                    {post.hashtags.map((tag, index) => (
                      <Text key={index} style={styles.hashtag}>#{tag}</Text>
                    ))}
                  </View>
                )}

                <View style={styles.engagement}>
                  <Pressable onPress={handleLike} style={styles.engagementButton}>
                    <Heart 
                      size={20} 
                      color={post.has_liked ? '#FF4D4D' : '#666666'} 
                      fill={post.has_liked ? '#FF4D4D' : 'transparent'}
                    />
                    <Text style={styles.engagementText}>{post.likes_count || 0}</Text>
                  </Pressable>

                  <Pressable style={styles.engagementButton}>
                    <MessageCircle size={20} color="#666666" />
                    <Text style={styles.engagementText}>{comments.length || post.comments_count || 0}</Text>
                  </Pressable>

                  <Pressable onPress={handleRepost} style={styles.engagementButton}>
                    <Repeat2 
                      size={20} 
                      color={post.has_reposted ? '#22C55E' : '#666666'} 
                    />
                    <Text style={styles.engagementText}>{post.reposts_count || 0}</Text>
                  </Pressable>

                  <Pressable style={styles.engagementButton}>
                    <Share2 size={20} color="#666666" />
                  </Pressable>
                </View>
              </View>
              
              <View style={styles.commentsSection}>
                <Text style={styles.commentsTitle}>
                  {comments.length > 0 || (post && post.comments_count) 
                    ? `${comments.length || post?.comments_count || 0} Comments` 
                    : 'No Comments Yet'}
                </Text>
                
                {commentsLoading ? (
                  <View style={styles.loadingComments}>
                    <ActivityIndicator size="small" color="#0066CC" />
                    <Text style={styles.loadingText}>Loading comments...</Text>
                  </View>
                ) : comments.length > 0 ? (
                  <>
                    {/* Only show top-level comments (no parent_id) */}
                    {comments
                      .filter(comment => !comment.parent_id)
                      .map((comment) => (
                        <CommentCard 
                          key={comment.id} 
                          comment={comment} 
                          onReply={handleReplyToComment}
                          onLike={handleLikeComment}
                          onRepost={handleRepostComment}
                          allComments={comments}
                        />
                      ))
                    }
                  </>
                ) : (
                  <View style={styles.noComments}>
                    <MessageCircle size={24} color="#666666" />
                    <Text style={styles.noCommentsText}>No comments yet</Text>
                    <Text style={styles.noCommentsSubtext}>Be the first to comment</Text>
                  </View>
                )}
              </View>
            </ScrollView>
            
            <View style={styles.commentInputContainer}>
              {replyingTo && (
                <View style={styles.replyingToContainer}>
                  <View style={styles.replyingToContent}>
                    <MessageCircle size={16} color="#0066CC" />
                    <Text style={styles.replyingToLabel}>
                      Replying to <Text style={styles.replyingToName}>@{replyingTo.author?.full_name}</Text>
                    </Text>
                  </View>
                  <Pressable onPress={() => setReplyingTo(null)} style={styles.cancelReplyButton}>
                    <Text style={styles.cancelReply}>Cancel</Text>
                  </Pressable>
                </View>
              )}
              
              <View style={styles.commentInputRow}>
                <TextInput
                  style={[styles.commentInput, replyingTo && styles.commentInputReplying]}
                  placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                  editable={!isSubmitting}
                />
                <Pressable 
                  onPress={handleSubmitComment} 
                  disabled={!newComment.trim() || isSubmitting}
                  style={[
                    styles.sendButton, 
                    replyingTo && styles.sendButtonReplying,
                    (!newComment.trim() || isSubmitting) && styles.sendButtonDisabled
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Send size={20} color="#FFFFFF" />
                  )}
                </Pressable>
              </View>
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Inter_500Medium',
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
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
  authorSpecialty: {
    fontSize: 14,
    color: '#0066CC',
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  postContent: {
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
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
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  engagementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  engagementText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Inter_400Regular',
  },
  commentsSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  commentsTitle: {
    fontSize: 18,
    color: '#1A1A1A',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  commentContainer: {
    marginBottom: 16,
  },
  commentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  commentHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  commentAuthorInfo: {
    flex: 1,
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAuthorName: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
    marginRight: 4,
  },
  commentAuthorSpecialty: {
    fontSize: 12,
    color: '#0066CC',
    fontFamily: 'Inter_500Medium',
  },
  commentTimestamp: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Inter_400Regular',
  },
  commentContent: {
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  noComments: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  noCommentsText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'Inter_600SemiBold',
    marginTop: 12,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  loadingComments: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Inter_400Regular',
    marginLeft: 8,
  },
  commentInputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#EBF2FA',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderColor: '#D1E3F6',
    marginBottom: -1,
    borderBottomWidth: 0,
  },
  replyingToContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replyingToLabel: {
    fontSize: 14,
    color: '#555555',
    fontFamily: 'Inter_400Regular',
  },
  replyingToName: {
    color: '#0066CC',
    fontFamily: 'Inter_600SemiBold',
  },
  cancelReplyButton: {
    padding: 4,
  },
  cancelReply: {
    fontSize: 14,
    color: '#0066CC',
    fontFamily: 'Inter_500Medium',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
  },
  commentInputReplying: {
    backgroundColor: '#EBF5FF',
    borderColor: '#D1E3F6',
    borderWidth: 1,
  },
  sendButton: {
    backgroundColor: '#0066CC',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonReplying: {
    backgroundColor: '#3384D7',
  },
  sendButtonDisabled: {
    backgroundColor: '#A9C2D9',
  },
  nestedComment: {
    backgroundColor: '#F8F9FB',
    borderLeftWidth: 0,
    paddingLeft: 16,
    shadowOpacity: 0.02,
    borderRadius: 10,
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 8,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Inter_400Regular',
  },
  commentActionTextActive: {
    color: '#FF4D4D',
  },
  commentActionTextReposted: {
    color: '#22C55E',
  },
  repliesContainer: {
    paddingLeft: 16,
    marginTop: 8,
  },
  repliesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  repliesLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  repliesCount: {
    color: '#666666',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginHorizontal: 8,
  },
  replyWrapper: {
    flexDirection: 'row',
    marginTop: 8,
  },
  replyIndentLine: {
    width: 2,
    backgroundColor: '#0066CC',
    marginRight: 12,
    borderRadius: 4,
  },
  replyContent: {
    flex: 1,
  },
  showMoreRepliesButton: {
    paddingVertical: 8,
    paddingLeft: 24,
    alignItems: 'flex-start',
    marginTop: 4,
  },
  showMoreRepliesText: {
    color: '#0066CC',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  replyingTo: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
    backgroundColor: '#F0F2F5',
    padding: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
}); 