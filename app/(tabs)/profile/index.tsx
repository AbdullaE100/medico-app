import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, RefreshControl } from 'react-native';
import { Link } from 'expo-router';
import { Settings, CreditCard as Edit3, MapPin, Building2, Users, Heart, MessageCircle, Share2, Award, Bookmark, FileText, Repeat2 } from 'lucide-react-native';
import { useProfileStore } from '@/stores/useProfileStore';
import { useFeedStore } from '@/stores/useFeedStore';
import { ErrorMessage } from '@/components/ErrorMessage';
import { LoadingOverlay } from '@/components/LoadingOverlay';

const Achievement = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <View style={styles.achievement}>
    <View style={styles.achievementIcon}>
      <Icon size={20} color="#0066CC" />
    </View>
    <Text style={styles.achievementText}>{label}</Text>
  </View>
);

const StatBox = ({ label, value }: { label: string; value: string | number }) => (
  <View style={styles.statBox}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ExpertiseTag = ({ label }: { label: string }) => (
  <View style={styles.expertiseTag}>
    <Text style={styles.expertiseText}>{label}</Text>
  </View>
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

  useEffect(() => {
    fetchProfile();
    fetchPosts({ userId: profile?.id });
  }, [profile?.id]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchProfile(),
      fetchPosts({ userId: profile?.id })
    ]);
    setRefreshing(false);
  }, [profile?.id]);

  if ((profileLoading || postsLoading) && !refreshing) {
    return <LoadingOverlay />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerActions}>
          <Link href="/profile/edit" asChild>
            <Pressable style={styles.headerButton}>
              <Edit3 size={20} color="#666666" />
            </Pressable>
          </Link>
          <Link href="/profile/settings" asChild>
            <Pressable style={styles.headerButton}>
              <Settings size={20} color="#666666" />
            </Pressable>
          </Link>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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

        <View style={styles.profileHeader}>
          <Image 
            source={{ 
              uri: profile?.avatar_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400'
            }} 
            style={styles.avatar} 
          />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{profile?.full_name || 'Dr. Thalib Ehsan'}</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
            </View>
            <Text style={styles.title}>{profile?.specialty || 'Loading...'}</Text>
            <View style={styles.locationRow}>
              <View style={styles.detailRow}>
                <Building2 size={16} color="#666666" />
                <Text style={styles.detailText}>{profile?.hospital || 'Loading...'}</Text>
              </View>
              <View style={styles.detailRow}>
                <MapPin size={16} color="#666666" />
                <Text style={styles.detailText}>{profile?.location || 'Loading...'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.stats}>
          <StatBox label="Followers" value={profile?.followers_count || 0} />
          <View style={styles.statDivider} />
          <StatBox label="Following" value={profile?.following_count || 0} />
          <View style={styles.statDivider} />
          <StatBox label="Posts" value={profile?.posts_count || 0} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{profile?.bio || 'Loading...'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expertise</Text>
          <View style={styles.expertiseTags}>
            {profile?.expertise?.map((tag) => (
              <ExpertiseTag key={tag} label={tag} />
            )) || (
              <Text style={styles.loadingText}>Loading expertise...</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievements}>
            <Achievement icon={Award} label="Top Contributor 2024" />
            <Achievement icon={FileText} label="50+ Publications" />
            <Achievement icon={Users} label="Research Lead" />
          </View>
        </View>

        <View style={styles.postsSection}>
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
                <Pressable style={styles.createPostButton}>
                  <Text style={styles.createPostButtonText}>Create Post</Text>
                </Pressable>
              </Link>
            </View>
          )}
        </View>

        <View style={styles.engagementSection}>
          <Pressable style={styles.engagementButton}>
            <Heart size={20} color="#666666" />
            <Text style={styles.engagementText}>Liked Posts</Text>
          </Pressable>
          <Pressable style={styles.engagementButton}>
            <Bookmark size={20} color="#666666" />
            <Text style={styles.engagementText}>Saved Items</Text>
          </Pressable>
          <Pressable style={styles.engagementButton}>
            <Share2 size={20} color="#666666" />
            <Text style={styles.engagementText}>Share Profile</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
    marginRight: 8,
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
  title: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
    marginBottom: 8,
  },
  locationRow: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666666',
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E5E5',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
    lineHeight: 20,
  },
  expertiseTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  expertiseTag: {
    backgroundColor: '#E5F0FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  expertiseText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666666',
    fontStyle: 'italic',
  },
  achievements: {
    gap: 12,
  },
  achievement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#1A1A1A',
  },
  postsSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
    gap: 16,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    gap: 12,
  },
  postContent: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
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
    borderTopColor: '#E5E5E5',
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
    color: '#666666',
  },
  emptyPosts: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyPostsTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
  },
  emptyPostsText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666666',
    textAlign: 'center',
  },
  createPostButton: {
    marginTop: 16,
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
  engagementSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    gap: 12,
  },
  engagementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#F0F2F5',
    borderRadius: 8,
  },
  engagementText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#666666',
  },
});