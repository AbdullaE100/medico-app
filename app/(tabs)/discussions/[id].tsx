import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, RefreshControl, StatusBar, Animated } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, ThumbsUp, Flag, Heart, Send, ArrowLeft, MoreHorizontal } from 'lucide-react-native';
import { Avatar } from '@/components/Avatar';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

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
  author_id: string;
  author: {
    full_name: string;
    avatar_url: string | null;
    specialty: string | null;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author: {
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
  
  // Animation values
  const scrollY = new Animated.Value(0);
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const fetchDiscussion = useCallback(async () => {
    try {
      // Fetch the discussion
      const { data: discussion, error } = await supabase
        .from('discussions')
        .select(`
          *,
          author:author_id (
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
          author:author_id (
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
          .eq('author_id', currentUser.id)
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
          .eq('author_id', currentUser.id);
        
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
            author_id: currentUser.id,
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
          author_id: currentUser.id,
          content: commentInput.trim(),
        })
        .select(`
          *,
          author:author_id (
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
  
  const goBack = () => {
    router.back();
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Animated Header */}
      <Animated.View style={[styles.animatedHeader, { opacity: headerOpacity }]}>
        <BlurView intensity={80} style={styles.blurView} tint="light">
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <ArrowLeft size={22} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {currentDiscussion.title}
            </Text>
            <TouchableOpacity style={styles.moreButton}>
              <MoreHorizontal size={22} color="#333" />
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>
      
      <Animated.ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* Back Button */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={goBack} style={styles.backButtonTop}>
            <ArrowLeft size={22} color="#333" />
          </TouchableOpacity>
        </View>
        
        {/* Discussion Content */}
        <View style={styles.discussionContainer}>
          <View style={styles.discussionHeader}>
            <Text style={styles.discussionTitle}>{currentDiscussion.title}</Text>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryLabel}>{currentDiscussion.category}</Text>
            </View>
          </View>
          
          <View style={styles.authorContainer}>
            <Avatar 
              size={40}
              source={currentDiscussion.author.avatar_url} 
              initials={currentDiscussion.author.full_name?.substring(0, 2) || '??'}
            />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{currentDiscussion.author.full_name}</Text>
              <View style={styles.authorMetaRow}>
                {currentDiscussion.author.specialty && (
                  <View style={styles.specialtyChip}>
                    <Text style={styles.specialtyText}>{currentDiscussion.author.specialty}</Text>
                  </View>
                )}
                <Text style={styles.postedTime}>
                  {formatDistanceToNow(new Date(currentDiscussion.created_at), { addSuffix: true })}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.discussionContentContainer}>
            <MarkdownRenderer content={currentDiscussion.content || ''} />
          </View>
          
          {currentDiscussion.tags && currentDiscussion.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {currentDiscussion.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
          
          <View style={styles.actionBar}>
            <TouchableOpacity 
              style={[styles.actionButton, liked && styles.actionButtonActive]} 
              onPress={handleLike}
            >
              <Heart 
                size={20} 
                color={liked ? '#EF4444' : '#666666'} 
                fill={liked ? '#EF4444' : 'none'} 
              />
              <Text style={[styles.actionText, liked && styles.actionTextActive]}>
                {currentDiscussion.likes_count || 0}
              </Text>
            </TouchableOpacity>
            <View style={styles.actionButton}>
              <MessageCircle size={20} color="#666666" />
              <Text style={styles.actionText}>{currentDiscussion.comments_count || 0}</Text>
            </View>
            <TouchableOpacity style={styles.actionButton}>
              <Flag size={20} color="#666666" />
              <Text style={styles.actionText}>Report</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <View style={styles.commentsSectionHeader}>
            <Text style={styles.commentsTitle}>Comments</Text>
            <View style={styles.commentCountChip}>
              <Text style={styles.commentCount}>{comments.length}</Text>
            </View>
          </View>
          
          {comments.length === 0 ? (
            <View style={styles.noCommentsContainer}>
              <MessageCircle size={40} color="#D1D5DB" />
              <Text style={styles.noCommentsText}>No comments yet</Text>
              <Text style={styles.noCommentsSubtext}>Be the first to comment!</Text>
            </View>
          ) : (
            comments.map((comment, index) => (
              <View key={comment.id} style={[
                styles.commentItem, 
                index === comments.length - 1 && styles.lastCommentItem
              ]}>
                <View style={styles.commentHeader}>
                  <Avatar 
                    size={40}
                    source={comment.author.avatar_url} 
                    initials={comment.author.full_name?.substring(0, 2) || '??'}
                  />
                  <View style={styles.commentMeta}>
                    <Text style={styles.commentAuthor}>{comment.author.full_name}</Text>
                    <Text style={styles.commentTime}>
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </Text>
                  </View>
                </View>
                <Text style={styles.commentContent}>{comment.content}</Text>
                <View style={styles.commentActions}>
                  <TouchableOpacity style={styles.commentAction}>
                    <ThumbsUp size={16} color="#666666" />
                    <Text style={styles.commentActionText}>{comment.likes_count || 0}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.commentAction}>
                    <Flag size={16} color="#666666" />
                    <Text style={styles.commentActionText}>Report</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
        
        {/* Extra padding at bottom to ensure content isn't hidden behind input */}
        <View style={styles.bottomPadding} />
      </Animated.ScrollView>
      
      {/* Comment Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.commentInputContainer}>
          <View style={styles.avatarContainer}>
            <Avatar 
              size={36}
              source={currentUser?.id ? `https://api.dicebear.com/7.x/micah/png?seed=${currentUser.id}` : null}
              initials={(currentUser?.email?.substring(0, 2) || '??').toUpperCase()}
            />
          </View>
          <View style={styles.commentInputWrapper}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={commentInput}
              onChangeText={setCommentInput}
              maxLength={500}
            />
          </View>
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              { opacity: !commentInput.trim() || submitting ? 0.5 : 1 }
            ]}
            onPress={submitComment}
            disabled={!commentInput.trim() || submitting}
          >
            <LinearGradient
              colors={['#0066CC', '#1E90FF']}
              style={styles.sendButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Send size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F8',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 45 : 12,
    paddingBottom: 4,
  },
  backButtonTop: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  blurView: {
    paddingTop: Platform.OS === 'ios' ? 45 : 16,
    paddingBottom: 10,
  },
  headerContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  backButton: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#111111',
    marginHorizontal: 8,
    textAlign: 'center',
  },
  moreButton: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discussionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 12,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  discussionHeader: {
    padding: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEDF0',
  },
  discussionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 12,
    lineHeight: 26,
  },
  categoryContainer: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
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
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEDF0',
    backgroundColor: '#FAFBFC',
  },
  authorInfo: {
    marginLeft: 10,
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 2,
  },
  authorMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specialtyChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
  },
  specialtyText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  postedTime: {
    fontSize: 11,
    color: '#6B7280',
  },
  discussionContentContainer: {
    padding: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    paddingTop: 0,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEDF0',
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '500',
  },
  actionBar: {
    flexDirection: 'row',
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  actionButtonActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  actionText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
    marginLeft: 6,
  },
  actionTextActive: {
    color: '#EF4444',
  },
  commentsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    padding: 16,
  },
  commentsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  commentsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111111',
  },
  commentCountChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  commentCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  noCommentsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  noCommentsText: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '600',
    color: '#111111',
  },
  noCommentsSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 3,
  },
  commentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEDF0',
  },
  lastCommentItem: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  commentHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  commentMeta: {
    marginLeft: 10,
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111111',
  },
  commentTime: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1F2937',
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    marginTop: 2,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  commentActionText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 5,
  },
  bottomPadding: {
    height: 130,
  },
  keyboardAvoidingView: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EBEDF0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    paddingBottom: Platform.OS === 'ios' ? 35 : 10,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: Platform.OS === 'ios' ? 12 : 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 10,
  },
  commentInputWrapper: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  commentInput: {
    fontSize: 15,
    color: '#1F2937',
    maxHeight: 100,
    minHeight: 26,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    marginLeft: 12,
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
});