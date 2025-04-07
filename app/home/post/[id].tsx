import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Heart, Repeat2, Share, ChevronLeft } from 'lucide-react-native';
import { useFeedStore, Post } from '@/stores/useFeedStore';
import { formatDistanceToNow } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const postId = Array.isArray(id) ? id[0] : id;
  
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { likePost, unlikePost } = useFeedStore();
  
  // Fetch post
  useEffect(() => {
    const loadPost = async () => {
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
        
        setPost(postData);
      } catch (error) {
        console.error('Error loading post details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (postId) {
      loadPost();
    }
  }, [postId]);
  
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
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }
  
  return (
    <View style={styles.container}>
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
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {post && (
          <View style={styles.postContainer}>
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
                  {post.profile && 'verified' in post.profile && Boolean(post.profile.verified) && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>✓</Text>
                    </View>
                  )}
                </View>
                
                <Text style={styles.postDate}>
                  {post.created_at 
                    ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
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
                
                <TouchableOpacity style={styles.actionButton}>
                  <Repeat2 size={22} color="#000" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton}>
                  <Share size={22} color="#000" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.actionStats}>
                <Text style={styles.actionCount}>{post.likes_count || 0} {post.likes_count === 1 ? 'like' : 'likes'}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
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
  scrollContent: {
    padding: 16,
  },
  postContainer: {
    marginBottom: 16,
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
  verifiedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
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
}); 