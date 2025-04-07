import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, MessageCircle, Repeat2, Share2 } from 'lucide-react-native';
import { useFeedStore } from '@/stores/useFeedStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ErrorMessage } from '@/components/ErrorMessage';

export default function ProfilePosts() {
  const router = useRouter();
  const { profile } = useProfileStore();
  const { posts, isLoading, error, fetchPosts, likePost, repostPost } = useFeedStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchPosts({ userId: profile.id });
    }
  }, [profile?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (profile?.id) {
      await fetchPosts({ userId: profile.id });
    }
    setRefreshing(false);
  };

  const handleLike = async (postId: string) => {
    await likePost(postId);
  };

  const handleRepost = async (postId: string) => {
    await repostPost(postId);
  };

  if (isLoading && !refreshing) {
    return <LoadingOverlay message="Loading posts..." />;
  }

  return (
    <View style={styles.container}>
      {error && <ErrorMessage message={error} onDismiss={() => useFeedStore.setState({ error: null })} />}
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Posts</Text>
      </View>
      
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <Text style={styles.postContent}>{item.content}</Text>
            
            {item.media_url?.length > 0 && (
              <View style={styles.mediaContainer}>
                {/* Media content would be displayed here */}
              </View>
            )}
            
            {item.hashtags && item.hashtags.length > 0 && (
              <View style={styles.hashtags}>
                {item.hashtags.map((tag: string) => (
                  <Text key={tag} style={styles.hashtag}>#{tag}</Text>
                ))}
              </View>
            )}
            
            <View style={styles.postActions}>
              <TouchableOpacity onPress={() => handleLike(item.id)} style={styles.postAction}>
                <Heart 
                  size={20} 
                  color={item.has_liked ? '#FF4D4D' : '#666666'} 
                  fill={item.has_liked ? '#FF4D4D' : 'transparent'} 
                />
                <Text style={styles.postActionText}>{item.likes_count || 0}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.postAction}>
                <MessageCircle size={20} color="#666666" />
                <Text style={styles.postActionText}>{item.comments_count || 0}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => handleRepost(item.id)} style={styles.postAction}>
                <Repeat2 
                  size={20} 
                  color={item.has_reposted ? '#22C55E' : '#666666'} 
                />
                <Text style={styles.postActionText}>{item.reposts_count || 0}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.postAction}>
                <Share2 size={20} color="#666666" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0066CC" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts yet</Text>
            <TouchableOpacity 
              style={styles.createPostButton}
              onPress={() => router.push('/home/create')}
            >
              <Text style={styles.createPostButtonText}>Create a post</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
  },
  listContent: {
    padding: 16,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  postContent: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#334155',
    marginBottom: 16,
    lineHeight: 24,
  },
  mediaContainer: {
    marginBottom: 16,
  },
  hashtags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  hashtag: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
    marginRight: 8,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 12,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  postActionText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#64748B',
    marginBottom: 16,
  },
  createPostButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  createPostButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
}); 