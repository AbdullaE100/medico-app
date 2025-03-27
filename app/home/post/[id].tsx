import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  FlatList
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Heart, MessageCircle, Repeat2, Share, ChevronLeft, User, Check, ArrowUp, ArrowDown } from 'lucide-react-native';
import { useFeedStore, Post, Comment } from '@/stores/useFeedStore';
import { formatDistanceToNow } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';

// Extend the Comment type to include Reddit-style features
interface RedditComment extends Comment {
  replies?: RedditComment[];
  vote_score?: number;
  user_vote?: boolean | null; // true = upvote, false = downvote, null = no vote
}

export default function PostDetailScreen() {
  const { id, mode } = useLocalSearchParams();
  const postId = Array.isArray(id) ? id[0] : id;
  const initialMode = Array.isArray(mode) ? mode[0] : mode;
  
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<RedditComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{
    comment?: RedditComment;
    username: string;
  } | null>(null);
  
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const { fetchComments, createComment, likePost, unlikePost } = useFeedStore();
  const { currentUser } = useAuthStore();
  
  // Fetch post and comments
  useEffect(() => {
    const loadPostAndComments = async () => {
      setIsLoading(true);
      try {
        // Fetch post with profile info
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select(`
            *,
            profile:profiles(
              id,
              full_name,
              avatar_url,
              specialty,
              verified
            )
          `)
          .eq('id', postId)
          .single();
          
        if (postError) throw postError;
        
        // Fetch comment count
        const { count: commentsCount, error: countError } = await supabase
          .from('post_comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);
          
        if (countError) throw countError;
        
        // Combine data
        setPost({
          ...postData,
          comments_count: commentsCount
        });
        
        // Fetch comments with vote information
        const { data: commentsData, error: commentsError } = await supabase
          .from('post_comments')
          .select(`
            *,
            author:profiles!post_comments_author_id_fkey(
              id,
              full_name,
              avatar_url,
              specialty,
              verified
            ),
            vote_score
          `)
          .eq('post_id', postId)
          .order('created_at', { ascending: false });
        
        if (commentsError) throw commentsError;
        
        if (!commentsData) {
          setComments([]);
          setIsLoading(false);
          return;
        }
        
        // Fetch user votes if logged in
        let userVotes: Record<string, boolean> = {};
        if (currentUser) {
          const { data: votesData } = await supabase
            .from('comment_votes')
            .select('comment_id, is_upvote')
            .eq('user_id', currentUser.id)
            .in('comment_id', commentsData.map(c => c.id));
            
          if (votesData) {
            userVotes = votesData.reduce((acc: Record<string, boolean>, vote) => {
              acc[vote.comment_id] = vote.is_upvote;
              return acc;
            }, {});
          }
        }
        
        // Add user_vote property to comments
        const enhancedComments = commentsData.map(comment => ({
          ...comment,
          user_vote: userVotes[comment.id] !== undefined ? userVotes[comment.id] : null,
          replies: []
        }));
        
        // Organize comments into a tree structure
        const commentMap = new Map();
        const rootComments: RedditComment[] = [];
        
        enhancedComments.forEach(comment => {
          commentMap.set(comment.id, comment);
        });
        
        enhancedComments.forEach(comment => {
          if (comment.parent_id && commentMap.has(comment.parent_id)) {
            // Add to parent's replies
            commentMap.get(comment.parent_id).replies.push(comment);
          } else {
            // This is a root comment
            rootComments.push(comment);
          }
        });
        
        setComments(rootComments);
      } catch (error) {
        console.error('Error loading post details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (postId) {
      loadPostAndComments();
    }
  }, [postId, fetchComments, currentUser]);
  
  // Focus reply input if mode is 'comment'
  useEffect(() => {
    if (initialMode === 'comment' && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
    }
  }, [initialMode]);
  
  const handleSubmitReply = async () => {
    if (!replyText.trim() || !postId || isSubmitting) return;
    
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const parentId = replyingTo?.comment ? replyingTo.comment.id : undefined;
      await createComment(postId, replyText.trim(), parentId);
      setReplyText('');
      setReplyingTo(null);
      
      // Refresh comments and recreate the nested structure
      const updatedFlatComments = await fetchComments(postId);
      
      // Organize comments into a tree structure
      const commentMap = new Map();
      const rootComments: RedditComment[] = [];
      
      updatedFlatComments.forEach(comment => {
        // Initialize replies array for each comment
        comment.replies = [];
        commentMap.set(comment.id, comment);
      });
      
      updatedFlatComments.forEach(comment => {
        if (comment.parent_id && commentMap.has(comment.parent_id)) {
          // Add to parent's replies
          commentMap.get(comment.parent_id).replies.push(comment);
        } else {
          // This is a root comment
          rootComments.push(comment);
        }
      });
      
      setComments(rootComments);
      
      // Update post comment count
      setPost(prev => prev ? {
        ...prev,
        comments_count: (prev.comments_count || 0) + 1
      } : null);
    } catch (error) {
      console.error('Error posting reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleLike = async () => {
    if (!post?.id) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      if (post.is_liked_by_me) {
        await unlikePost(post.id);
        setPost(prev => prev ? {
          ...prev,
          is_liked_by_me: false,
          likes_count: Math.max((prev.likes_count || 0) - 1, 0)
        } : null);
      } else {
        await likePost(post.id);
        setPost(prev => prev ? {
          ...prev,
          is_liked_by_me: true,
          likes_count: (prev.likes_count || 0) + 1
        } : null);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };
  
  const handleCommentVote = async (comment: RedditComment, isUpvote: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      // If voting the same way as current vote, we want to remove it
      const isRemovingVote = comment.user_vote === isUpvote;
      
      if (isRemovingVote) {
        // Remove vote using delete
        const { error } = await supabase
          .from('comment_votes')
          .delete()
          .eq('comment_id', comment.id)
          .eq('user_id', currentUser?.id);
          
        if (error) throw error;
        
        // Update local state to null (no vote)
        updateCommentVoteState(comment.id, null);
      } else {
        // Use the database function to handle adding/changing vote
        const { error } = await supabase.rpc('handle_comment_vote', { 
          p_comment_id: comment.id,
          p_is_upvote: isUpvote 
        });
        
        if (error) throw error;
        
        // Update local state
        updateCommentVoteState(comment.id, isUpvote);
      }
    } catch (error) {
      console.error('Error voting on comment:', error);
      // Provide user feedback about the error
      alert('Unable to vote on this comment. Please try again later.');
    }
  };
  
  const updateCommentVoteState = (commentId: string, voteStatus: boolean | null) => {
    // Update the nested comments structure
    const updateCommentsRecursive = (commentsArray: RedditComment[]): RedditComment[] => {
      return commentsArray.map(comment => {
        if (comment.id === commentId) {
          // Calculate vote impact
          let voteDelta = 0;
          
          // If removing upvote
          if (comment.user_vote === true && voteStatus === null) voteDelta = -1;
          // If removing downvote
          else if (comment.user_vote === false && voteStatus === null) voteDelta = 1;
          // If changing from downvote to upvote
          else if (comment.user_vote === false && voteStatus === true) voteDelta = 2;
          // If changing from upvote to downvote
          else if (comment.user_vote === true && voteStatus === false) voteDelta = -2;
          // If adding upvote
          else if (comment.user_vote === null && voteStatus === true) voteDelta = 1;
          // If adding downvote
          else if (comment.user_vote === null && voteStatus === false) voteDelta = -1;
          
          return {
            ...comment,
            user_vote: voteStatus,
            vote_score: (comment.vote_score || 0) + voteDelta
          };
        }
        
        // Recursively update replies
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: updateCommentsRecursive(comment.replies)
          };
        }
        
        return comment;
      });
    };
    
    setComments(prevComments => updateCommentsRecursive(prevComments));
  };
  
  const handleReplyToComment = (comment: RedditComment) => {
    setReplyingTo({
      comment,
      username: comment.author?.full_name || 'User'
    });
    
    // Focus the input field with a slight delay
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };
  
  const handleReplyToPost = () => {
    // Make sure to clear any previous reply target
    setReplyingTo({
      username: post?.profile?.full_name || 'Author'
    });
    
    // Focus the input field
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };
  
  const renderCommentWithReplies = (comment: RedditComment, level = 0) => {
    return (
      <View 
        key={comment.id}
        style={[
          styles.commentContainer,
          level > 0 && styles.nestedComment,
          { marginLeft: level > 0 ? Math.min(level * 16, 40) : 0 }
        ]}
      >
        <View style={styles.commentVoteColumn}>
          <TouchableOpacity 
            style={[styles.voteButton, comment.user_vote === true && styles.activeUpvote]}
            onPress={() => handleCommentVote(comment, true)}
          >
            <ArrowUp 
              size={16} 
              color={comment.user_vote === true ? "#FF4500" : "#888"} 
            />
          </TouchableOpacity>
          
          <Text style={[
            styles.voteScore,
            comment.user_vote === true && styles.upvotedScore,
            comment.user_vote === false && styles.downvotedScore
          ]}>
            {comment.vote_score || 0}
          </Text>
          
          <TouchableOpacity 
            style={[styles.voteButton, comment.user_vote === false && styles.activeDownvote]}
            onPress={() => handleCommentVote(comment, false)}
          >
            <ArrowDown 
              size={16} 
              color={comment.user_vote === false ? "#7193FF" : "#888"} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.commentContentColumn}>
          <View style={styles.commentHeader}>
            <View style={styles.authorRow}>
              <Image
                source={{ uri: comment.author?.avatar_url || 'https://placehold.co/32x32' }}
                style={styles.commentAvatar}
              />
              <Text style={styles.authorName}>{comment.author?.full_name || 'User'}</Text>
              {Boolean(comment.author?.verified) && (
                <View style={styles.verifiedBadge}>
                  <Check size={8} color="white" />
                </View>
              )}
              <Text style={styles.commentTimestamp}>
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </Text>
            </View>
          </View>
          
          <Text style={styles.commentText}>{comment.content}</Text>
          
          <View style={styles.commentActionRow}>
            <TouchableOpacity 
              style={styles.commentActionButton}
              onPress={() => handleReplyToComment(comment)}
            >
              <Text style={styles.commentActionText}>Reply</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.commentActionButton}>
              <Text style={styles.commentActionText}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.commentActionButton}>
              <Text style={styles.commentActionText}>Report</Text>
            </TouchableOpacity>
          </View>
          
          {/* Nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <View style={styles.repliesContainer}>
              {comment.replies.map(reply => renderCommentWithReplies(reply, level + 1))}
            </View>
          )}
        </View>
      </View>
    );
  };
  
  const PostHeader = () => (
    <View style={styles.postHeaderContainer}>
      {post && (
        <>
          <View style={styles.postAuthorRow}>
            <Image 
              source={{ uri: post.profile?.avatar_url || 'https://placehold.co/60x60/444444/444444' }}
              style={styles.postAvatar} 
            />
            
            <View style={styles.postAuthorInfo}>
              <View style={styles.authorNameContainer}>
                <Text style={styles.postAuthorName}>
                  {post.profile?.full_name || 'Medical Professional'}
                </Text>
                {Boolean(post.profile?.verified) && (
                  <View style={styles.verifiedBadge}>
                    <Check size={12} color="#fff" />
                  </View>
                )}
              </View>
              
              <Text style={styles.postDate}>
                {post.created_at 
                  ? new Date(post.created_at).toLocaleDateString('en-US', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                  }).replace(/\//g, '/')
                  : ''}
              </Text>
            </View>
          </View>
          
          <Text style={styles.postContent}>{post.content}</Text>
          
          {post.media_url && post.media_url.length > 0 && (
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
          )}
          
          <View style={styles.engagementContainer}>
            <View style={styles.actionIcons}>
              <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                <Heart 
                  size={22} 
                  color="#000" 
                  fill={post.is_liked_by_me ? "#FF3B30" : "transparent"}
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton} onPress={handleReplyToPost}>
                <MessageCircle size={22} color="#000" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Repeat2 size={22} color="#000" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Share size={22} color="#000" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.actionStats}>
              <Text style={styles.actionCount}>{post.likes_count || 0} {post.likes_count === 1 ? 'like' : 'likes'}</Text>
              <Text style={styles.actionDot}>•</Text>
              <Text style={styles.actionCount}>{post.comments_count || 0} {post.comments_count === 1 ? 'reply' : 'replies'}</Text>
            </View>
          </View>
          
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Comments ({post.comments_count || 0})</Text>
            <TouchableOpacity style={styles.sortButton}>
              <Text style={styles.sortButtonText}>Sort by: Best</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
  
  useEffect(() => {
    const setupCommentVotesTable = async () => {
      try {
        // Check if the table exists first
        const { error: checkError } = await supabase
          .from('comment_votes')
          .select('id')
          .limit(1);
          
        if (checkError && checkError.code === '42P01') { // Table doesn't exist code
          console.log('Comment votes table does not exist, creating it...');
          // Try to run the migration
          const { error } = await supabase.rpc('handle_missing_tables');
          
          if (error) {
            console.error('Failed to create tables:', error);
          }
        }
      } catch (error) {
        console.error('Error setting up comment votes functionality:', error);
      }
    };

    setupCommentVotesTable();
  }, []);
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen
        options={{
          title: 'Post',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ChevronLeft size={24} color="#007BFF" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          ),
        }}
      />
      
      <FlatList
        data={comments}
        renderItem={({ item }) => renderCommentWithReplies(item)}
        keyExtractor={item => item.id}
        ListHeaderComponent={<PostHeader />}
        contentContainerStyle={styles.listContent}
      />
      
      {/* Comment input section */}
      <View style={styles.inputSection}>
        {replyingTo && (
          <View style={styles.replyingToContainer}>
            <Text style={styles.replyingToText}>
              Replying to <Text style={styles.replyingToName}>@{replyingTo.username}</Text>
            </Text>
            <TouchableOpacity 
              style={styles.cancelReplyButton} 
              onPress={() => setReplyingTo(null)}
            >
              <Text style={styles.cancelReplyText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.replyInputWrapper}>
          <Image 
            source={{ 
              uri: post?.profile?.avatar_url || 'https://placehold.co/36x36' 
            }} 
            style={styles.postAuthorAvatar} 
          />
          
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor="#9ca3af"
              multiline
              value={replyText}
              onChangeText={setReplyText}
            />
          </View>
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!replyText.trim() || isSubmitting) && styles.disabledButton
            ]}
            onPress={handleSubmitReply}
            disabled={!replyText.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Reply</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    color: '#007BFF',
    marginLeft: -4,
  },
  listContent: {
    paddingBottom: 100,
  },
  postHeaderContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  postAuthorRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  postAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  postAuthorInfo: {
    justifyContent: 'center',
  },
  authorNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAuthorName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1D9BF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  postContent: {
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 16,
  },
  mediaContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  mediaImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#f0f0f0',
  },
  mediaCounter: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mediaCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  engagementContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f2f2f2',
    paddingVertical: 10,
  },
  actionIcons: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionCount: {
    fontSize: 14,
    color: '#666',
  },
  actionDot: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 6,
  },
  commentsHeader: {
    marginTop: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sortButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#f2f2f2',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  commentContainer: {
    padding: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
  },
  nestedComment: {
    borderLeftWidth: 2,
    borderLeftColor: '#e0e0e0',
    paddingLeft: 10,
    marginTop: 8,
  },
  commentVoteColumn: {
    alignItems: 'center',
    marginRight: 10,
    paddingTop: 5,
  },
  voteButton: {
    padding: 4,
  },
  activeUpvote: {
    backgroundColor: 'rgba(255,69,0,0.1)',
    borderRadius: 4,
  },
  activeDownvote: {
    backgroundColor: 'rgba(113,147,255,0.1)',
    borderRadius: 4,
  },
  voteScore: {
    fontSize: 12,
    fontWeight: '600',
    marginVertical: 4,
    color: '#888',
  },
  upvotedScore: {
    color: '#FF4500',
  },
  downvotedScore: {
    color: '#7193FF',
  },
  commentContentColumn: {
    flex: 1,
  },
  commentHeader: {
    marginBottom: 4,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },
  commentTimestamp: {
    fontSize: 11,
    color: '#777',
    marginLeft: 4,
  },
  specialtyText: {
    fontSize: 12,
    color: '#007BFF',
    marginTop: 2,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  commentActionRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  commentActionButton: {
    marginRight: 16,
  },
  commentActionText: {
    fontSize: 12,
    color: '#777',
    fontWeight: '500',
  },
  repliesContainer: {
    marginTop: 8,
  },
  
  // Input section styles
  inputSection: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  replyingToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f5f5f7',
  },
  replyingToText: {
    fontSize: 14,
    color: '#6b7280',
  },
  replyingToName: {
    color: '#1D9BF0',
    fontWeight: '500',
  },
  cancelReplyButton: {
    padding: 4,
  },
  cancelReplyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D9BF0',
  },
  replyInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  postAuthorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  inputContainer: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
  },
  commentInput: {
    fontSize: 16,
    minHeight: 20,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#1D9BF0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: '#a8daff',
    opacity: 0.8,
  },
}); 