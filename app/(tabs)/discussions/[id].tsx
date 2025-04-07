import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, ThumbsUp, Flag, Heart, Send } from 'lucide-react-native';
import { Avatar } from '@/components/Avatar';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

// Discussion types
interface Discussion {
  id: string;
  title: string;
  content: string | null;
  created_at: string;
  category: string;
  tags: string[] | null;
  likes_count: number;
  comments_count: number;
  user_id: string;
  user: {
    full_name: string;
    avatar_url: string | null;
    specialty: string | null;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user: {
    full_name: string;
    avatar_url: string | null;
    specialty: string | null;
  };
  likes_count: number;
}

export default function DiscussionDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const [currentDiscussion, setCurrentDiscussion] = useState<Discussion | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentInput, setCommentInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDiscussion = useCallback(async () => {
    try {
      // Fetch the discussion
      const { data: discussion, error } = await supabase
        .from('discussions')
        .select(`
          *,
          user:user_id (
            full_name,
            avatar_url,
            specialty
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('discussion_comments')
        .select(`
          *,
          user:user_id (
            full_name,
            avatar_url,
            specialty
          )
        `)
        .eq('discussion_id', id)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;
      
      // Check if user has liked the discussion
      if (currentUser) {
        const { data: likeData } = await supabase
          .from('discussion_likes')
          .select('*')
          .eq('discussion_id', id)
          .eq('user_id', currentUser.id)
          .single();
        
        setLiked(!!likeData);
      }

      setCurrentDiscussion(discussion);
      setComments(commentsData || []);
    } catch (error) {
      console.error('Error fetching discussion:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, currentUser]);

  useEffect(() => {
    fetchDiscussion();
  }, [fetchDiscussion]);

  const handleLike = async () => {
    if (!currentUser) {
      router.push('/sign-in');
      return;
    }

    try {
      if (liked) {
        // Unlike
        await supabase
          .from('discussion_likes')
          .delete()
          .eq('discussion_id', id)
          .eq('user_id', currentUser.id);
        
        setLiked(false);
        if (currentDiscussion) {
          setCurrentDiscussion({
            ...currentDiscussion,
            likes_count: currentDiscussion.likes_count - 1,
          });
        }
      } else {
        // Like
        await supabase
          .from('discussion_likes')
          .insert({
            discussion_id: id,
            user_id: currentUser.id,
          });
        
        setLiked(true);
        if (currentDiscussion) {
          setCurrentDiscussion({
            ...currentDiscussion,
            likes_count: currentDiscussion.likes_count + 1,
          });
        }
      }
    } catch (error) {
      console.error('Error liking/unliking discussion:', error);
    }
  };

  const submitComment = async () => {
    if (!commentInput.trim() || !currentUser) return;
    
    setSubmitting(true);
    try {
      // Insert comment
      const { data, error } = await supabase
        .from('discussion_comments')
        .insert({
          discussion_id: id,
          user_id: currentUser.id,
          content: commentInput.trim(),
        })
        .select(`
          *,
          user:user_id (
            full_name,
            avatar_url,
            specialty
          )
        `)
        .single();

      if (error) throw error;
      
      // Update discussion comments count
      await supabase
        .from('discussions')
        .update({
          comments_count: (currentDiscussion?.comments_count || 0) + 1,
        })
        .eq('id', id);
      
      // Update local state
      setComments(prev => [...prev, data]);
      setCommentInput('');
      
      if (currentDiscussion) {
        setCurrentDiscussion({
          ...currentDiscussion,
          comments_count: currentDiscussion.comments_count + 1,
        });
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDiscussion();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  if (!currentDiscussion) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Discussion not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <Stack.Screen options={{ title: 'Discussion' }} />
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.discussionHeader}>
          <Text style={styles.discussionTitle}>{currentDiscussion.title}</Text>
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryLabel}>{currentDiscussion.category}</Text>
          </View>
        </View>
        
        <View style={styles.authorContainer}>
          <Avatar 
            size={40}
            source={currentDiscussion.user.avatar_url} 
            initials={currentDiscussion.user.full_name?.substring(0, 2) || '??'}
          />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{currentDiscussion.user.full_name}</Text>
            <Text style={styles.postedTime}>
              {formatDistanceToNow(new Date(currentDiscussion.created_at), { addSuffix: true })}
            </Text>
          </View>
        </View>
        
        <View style={styles.discussionContentContainer}>
          <MarkdownRenderer content={currentDiscussion.content || ''} />
        </View>
        
        {currentDiscussion.tags && currentDiscussion.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {currentDiscussion.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Heart 
              size={18} 
              color={liked ? '#EF4444' : '#666666'} 
              fill={liked ? '#EF4444' : 'none'} 
            />
            <Text style={styles.actionText}>{currentDiscussion.likes_count || 0}</Text>
          </TouchableOpacity>
          <View style={styles.actionButton}>
            <MessageCircle size={18} color="#666666" />
            <Text style={styles.actionText}>{currentDiscussion.comments_count || 0}</Text>
          </View>
          <TouchableOpacity style={styles.actionButton}>
            <Flag size={18} color="#666666" />
            <Text style={styles.actionText}>Report</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.commentsSection}>
          <Text style={styles.commentsHeader}>Comments</Text>
          
          {comments.length === 0 ? (
            <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
          ) : (
            comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <View style={styles.commentHeader}>
                  <Avatar 
                    size={36}
                    source={comment.user.avatar_url} 
                    initials={comment.user.full_name?.substring(0, 2) || '??'}
                  />
                  <View style={styles.commentMeta}>
                    <Text style={styles.commentAuthor}>{comment.user.full_name}</Text>
                    <Text style={styles.commentTime}>
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </Text>
                  </View>
                </View>
                <Text style={styles.commentContent}>{comment.content}</Text>
                <View style={styles.commentActions}>
                  <TouchableOpacity style={styles.commentAction}>
                    <ThumbsUp size={14} color="#666666" />
                    <Text style={styles.commentActionText}>{comment.likes_count || 0}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.commentAction}>
                    <Flag size={14} color="#666666" />
                    <Text style={styles.commentActionText}>Report</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
      
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          multiline
          value={commentInput}
          onChangeText={setCommentInput}
        />
        <TouchableOpacity 
          style={[
            styles.sendButton, 
            { opacity: !commentInput.trim() || submitting ? 0.5 : 1 }
          ]}
          onPress={submitComment}
          disabled={!commentInput.trim() || submitting}
        >
          <Send size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
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
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  discussionHeader: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  discussionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 12,
  },
  categoryContainer: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  categoryLabel: {
    color: '#0066CC',
    fontSize: 12,
    fontWeight: '600',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  authorInfo: {
    marginLeft: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
  },
  postedTime: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  discussionContentContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    paddingTop: 0,
    backgroundColor: '#FFFFFF',
  },
  tag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#666666',
    fontSize: 12,
  },
  actionBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
  },
  commentsSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingBottom: 32,
  },
  commentsHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 16,
  },
  noCommentsText: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  commentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  commentHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  commentMeta: {
    marginLeft: 8,
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111111',
  },
  commentTime: {
    fontSize: 12,
    color: '#666666',
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    marginTop: 4,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  commentActionText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});