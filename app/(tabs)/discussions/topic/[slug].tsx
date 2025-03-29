import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDiscussionsStore } from '@/stores/useDiscussionsStore';
import { ArrowUp, MessageCircle, Bookmark, Clock, TrendingUp, Filter, ChevronDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface DiscussionCardProps {
  discussion: any;
  onPress: () => void;
}

const DiscussionCard = ({ discussion, onPress }: DiscussionCardProps) => {
  const router = useRouter();
  const { voteDiscussion, bookmarkDiscussion } = useDiscussionsStore();

  const handleVote = async () => {
    await voteDiscussion(discussion.id, 'upvote');
  };

  const handleBookmark = async () => {
    await bookmarkDiscussion(discussion.id);
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Vote column */}
      <View style={styles.voteColumn}>
        <TouchableOpacity 
          style={[styles.voteButton, discussion.has_voted && styles.voteButtonActive]}
          onPress={handleVote}
        >
          <ArrowUp size={20} color={discussion.has_voted ? "#0066CC" : "#666666"} />
        </TouchableOpacity>
        <Text style={[styles.voteCount, discussion.has_voted && styles.voteCountActive]}>
          {discussion.upvotes_count}
        </Text>
      </View>

      {/* Content column */}
      <View style={styles.contentColumn}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <Image 
            source={{ uri: discussion.author?.avatar_url || 'https://via.placeholder.com/40' }} 
            style={styles.avatar} 
          />
          <View style={styles.headerText}>
            <View style={styles.authorRow}>
              <Text style={styles.authorName}>{discussion.author?.full_name || 'Anonymous'}</Text>
              {discussion.is_pinned && <View style={styles.pinnedBadge}><Text style={styles.pinnedText}>📌</Text></View>}
            </View>
            <Text style={styles.timeAgo}>
              {new Date(discussion.created_at).toLocaleDateString()} • {discussion.author?.specialty || 'Medical Professional'}
            </Text>
          </View>
        </View>

        {/* Title and excerpt */}
        <Text style={styles.title}>{discussion.title}</Text>
        <Text style={styles.excerpt} numberOfLines={3}>
          {discussion.content.replace(/<[^>]*>/g, '').substring(0, 150)}
          {discussion.content.length > 150 ? '...' : ''}
        </Text>

        {/* Footer with stats */}
        <View style={styles.footer}>
          <View style={styles.stat}>
            <MessageCircle size={16} color="#666666" />
            <Text style={styles.statText}>{discussion.comments_count} comments</Text>
          </View>
          <TouchableOpacity style={styles.stat} onPress={handleBookmark}>
            <Bookmark size={16} color={discussion.is_bookmarked ? "#0066CC" : "#666666"} fill={discussion.is_bookmarked ? "#0066CC" : "transparent"} />
            <Text style={[styles.statText, discussion.is_bookmarked && styles.bookmarkedText]}>
              {discussion.is_bookmarked ? "Saved" : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function TopicPage() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const { discussions, categories, isLoading, error, fetchDiscussions, fetchCategories } = useDiscussionsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeSortOption, setActiveSortOption] = useState('latest');
  const [showSortOptions, setShowSortOptions] = useState(false);

  const decodedSlug = typeof slug === 'string' ? decodeURIComponent(slug) : '';
  const currentCategory = categories.find(c => c.slug === decodedSlug);

  useEffect(() => {
    fetchCategories();
    loadDiscussions();
  }, [decodedSlug]);

  const loadDiscussions = async (sortOption = activeSortOption) => {
    await fetchDiscussions({ 
      category: decodedSlug,
      sort: sortOption as any
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDiscussions();
    setRefreshing(false);
  };

  const handleSortChange = async (option: string) => {
    setActiveSortOption(option);
    setShowSortOptions(false);
    await loadDiscussions(option);
  };

  const handleNavigateToDiscussion = (id: string) => {
    router.push(`/discussions/${id}`);
  };

  const renderSortOption = (option: string, label: string, icon: React.ReactNode) => (
    <TouchableOpacity 
      style={[styles.sortOption, activeSortOption === option && styles.activeSortOption]}
      onPress={() => handleSortChange(option)}
    >
      {icon}
      <Text style={[styles.sortOptionText, activeSortOption === option && styles.activeSortOptionText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading posts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Topic Header with gradient */}
      {currentCategory && (
        <LinearGradient
          colors={['rgba(0, 102, 204, 0.15)', 'rgba(0, 145, 255, 0.05)']}
          style={styles.topicHeader}
        >
          <View style={styles.topicHeaderContent}>
            <Text style={styles.topicName}>{currentCategory.name}</Text>
            <Text style={styles.topicDescription}>{currentCategory.description}</Text>
          </View>
        </LinearGradient>
      )}

      {/* Sorting Options */}
      <View style={styles.sortContainer}>
        <TouchableOpacity 
          style={styles.sortToggle}
          onPress={() => setShowSortOptions(!showSortOptions)}
        >
          <Text style={styles.sortToggleText}>
            {activeSortOption === 'latest' ? 'Latest' : 
             activeSortOption === 'trending' ? 'Trending' : 'Most Commented'}
          </Text>
          <ChevronDown size={16} color="#666666" />
        </TouchableOpacity>

        {showSortOptions && (
          <View style={styles.sortOptionsContainer}>
            {renderSortOption('latest', 'Latest', <Clock size={16} color={activeSortOption === 'latest' ? "#0066CC" : "#666666"} />)}
            {renderSortOption('trending', 'Trending', <TrendingUp size={16} color={activeSortOption === 'trending' ? "#0066CC" : "#666666"} />)}
            {renderSortOption('most_commented', 'Most Commented', <MessageCircle size={16} color={activeSortOption === 'most_commented' ? "#0066CC" : "#666666"} />)}
          </View>
        )}
      </View>

      {/* Discussion List */}
      <FlatList
        data={discussions}
        renderItem={({ item }) => (
          <DiscussionCard 
            discussion={item} 
            onPress={() => handleNavigateToDiscussion(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#0066CC"]}
            tintColor="#0066CC"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts yet in this topic</Text>
            <TouchableOpacity 
              style={styles.createPostButton}
              onPress={() => router.push('/discussions/create')}
            >
              <Text style={styles.createPostButtonText}>Create the first post</Text>
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
  topicHeader: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  topicHeaderContent: {
    maxWidth: '90%',
  },
  topicName: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  topicDescription: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#4A4A4A',
    lineHeight: 22,
  },
  sortContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    zIndex: 100,
  },
  sortToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F2F5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
  },
  sortToggleText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    marginRight: 8,
    color: '#333333',
  },
  sortOptionsContainer: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 101,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeSortOption: {
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
  },
  sortOptionText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#333333',
    marginLeft: 12,
  },
  activeSortOptionText: {
    color: '#0066CC',
    fontFamily: 'Inter_600SemiBold',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  voteColumn: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.05)',
  },
  voteButton: {
    padding: 8,
    borderRadius: 20,
  },
  voteButtonActive: {
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
  },
  voteCount: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#666666',
    marginTop: 4,
  },
  voteCountActive: {
    color: '#0066CC',
  },
  contentColumn: {
    flex: 1,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  headerText: {
    flex: 1,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#333333',
  },
  pinnedBadge: {
    marginLeft: 6,
  },
  pinnedText: {
    fontSize: 12,
  },
  timeAgo: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#666666',
    marginTop: 2,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#1A1A1A',
    marginBottom: 6,
    lineHeight: 22,
  },
  excerpt: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#4A4A4A',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#666666',
    marginLeft: 6,
  },
  bookmarkedText: {
    color: '#0066CC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#666666',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  createPostButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  createPostButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
}); 