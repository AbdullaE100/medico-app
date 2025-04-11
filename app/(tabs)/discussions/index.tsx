import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TextInput, 
  Pressable, 
  FlatList, 
  RefreshControl,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { 
  Search, 
  Filter, 
  MessageCircle, 
  ArrowUp, 
  TrendingUp, 
  Clock, 
  Bookmark,
  Sparkles,
  Hash
} from 'lucide-react-native';
import { useDiscussionsStore } from '@/stores/useDiscussionsStore';
import { ErrorMessage } from '@/components/ErrorMessage';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TabProps {
  title: string;
  isActive: boolean;
  onPress: () => void;
  icon: React.ReactNode;
}

const Tab = ({ title, isActive, onPress, icon }: TabProps) => (
  <TouchableOpacity
    style={[styles.tab, isActive && styles.activeTab]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    {icon}
    <Text style={[styles.tabText, isActive && styles.activeTabText]}>
      {title}
    </Text>
  </TouchableOpacity>
);

const DiscussionCard = ({ discussion, onPress, isCompact = false }: { 
  discussion: any, 
  onPress: () => void,
  isCompact?: boolean
}) => {
  const { voteDiscussion, bookmarkDiscussion } = useDiscussionsStore();

  const handleVote = async (e: any) => {
    e.stopPropagation();
    await voteDiscussion(discussion.id, 'upvote');
  };

  const handleBookmark = async (e: any) => {
    e.stopPropagation();
    await bookmarkDiscussion(discussion.id);
  };

  if (isCompact) {
    return (
      <TouchableOpacity 
        style={styles.compactCard} 
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.compactCardContent}>
          <View style={styles.compactCardBody}>
            <Text style={styles.compactTitle} numberOfLines={2}>{discussion.title}</Text>
            <View style={styles.compactCardMeta}>
              <Text style={styles.compactMetaText}>
                by {discussion.author?.full_name || 'Anonymous'} • {discussion.comments_count} comments
              </Text>
              <View style={styles.compactMetaRight}>
                {discussion.category?.name && (
                  <View style={styles.compactCategoryTag}>
                    <Text style={styles.compactCategoryText}>{discussion.category.name}</Text>
                  </View>
                )}
                <View style={styles.horizontalVote}>
                  <TouchableOpacity 
                    style={[styles.voteButtonHorizontal, discussion.has_voted && styles.voteButtonActive]}
                    onPress={handleVote}
                  >
                    <ArrowUp size={14} color={discussion.has_voted ? "#0066CC" : "#666666"} />
                  </TouchableOpacity>
                  <Text style={[styles.voteCountHorizontal, discussion.has_voted && styles.voteCountActive]}>
                    {discussion.upvotes_count}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.9}
    >
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
        <Text style={styles.cardTitle}>{discussion.title}</Text>
        <Text style={styles.excerpt} numberOfLines={3}>
          {discussion.content.replace(/<[^>]*>/g, '').substring(0, 150)}
          {discussion.content.length > 150 ? '...' : ''}
        </Text>

        {/* Footer with stats and category */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <View style={styles.stat}>
              <MessageCircle size={16} color="#666666" />
              <Text style={styles.statText}>{discussion.comments_count} comments</Text>
            </View>
            {discussion.category?.name && (
              <View style={styles.categoryTag}>
                <Hash size={14} color="#0066CC" />
                <Text style={styles.categoryText}>{discussion.category.name}</Text>
              </View>
            )}
          </View>
          <View style={styles.footerRight}>
            <View style={styles.horizontalVote}>
              <TouchableOpacity 
                style={[styles.voteButtonHorizontal, discussion.has_voted && styles.voteButtonActive]}
                onPress={handleVote}
              >
                <ArrowUp size={16} color={discussion.has_voted ? "#0066CC" : "#666666"} />
              </TouchableOpacity>
              <Text style={[styles.voteCountHorizontal, discussion.has_voted && styles.voteCountActive]}>
                {discussion.upvotes_count}
              </Text>
            </View>
            <TouchableOpacity style={styles.stat} onPress={handleBookmark}>
              <Bookmark size={16} color={discussion.is_bookmarked ? "#0066CC" : "#666666"} fill={discussion.is_bookmarked ? "#0066CC" : "transparent"} />
              <Text style={[styles.statText, discussion.is_bookmarked && styles.bookmarkedText]}>
                {discussion.is_bookmarked ? "Saved" : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Topic pill component for horizontal scrolling list
const TopicPill = ({ category, onPress, isSelected }: { 
  category: any, 
  onPress: () => void,
  isSelected: boolean 
}) => (
  <TouchableOpacity 
    style={[styles.topicPill, isSelected && styles.selectedTopicPill]} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.topicPillText, isSelected && styles.selectedTopicPillText]}>
      {category.name}
    </Text>
  </TouchableOpacity>
);

// Trending Topic Card for horizontal scrolling row
const TrendingTopicCard = ({ category, onPress }: { category: any, onPress: () => void }) => {
  // Generate a consistent pseudo-random pastel color based on category name
  const getBackgroundGradient = (name: string): readonly [string, string] => {
    const seed = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = seed % 360;
    return [
      `hsla(${hue}, 85%, 95%, 1.0)`,
      `hsla(${hue}, 90%, 90%, 1.0)`
    ] as const;
  };
  
  return (
    <TouchableOpacity 
      style={styles.trendingTopicCard} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={getBackgroundGradient(category.name)}
        style={styles.trendingTopicGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.trendingTopicContent}>
          <View style={styles.trendingTopicHeader}>
            <View style={styles.topicIconContainer}>
              <Hash size={16} color="#0066CC" />
            </View>
            <Text style={styles.trendingTopicName} numberOfLines={2}>{category.name}</Text>
          </View>
          <View style={styles.trendingTopicMeta}>
            <MessageCircle size={12} color="#0066CC" />
            <Text style={styles.trendingTopicStat}>
              {(category as any).posts_count || Math.floor(Math.random() * 100)} posts
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default function ForumHome() {
  const router = useRouter();
  const { 
    discussions, 
    categories,
    isLoading, 
    error, 
    fetchDiscussions,
    fetchCategories 
  } = useDiscussionsStore();

  const [activeTab, setActiveTab] = useState('latest');
  const [activeCategory, setActiveCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchCategories();
    loadDiscussions();
  }, []);

  // Load discussions based on current filters
  const loadDiscussions = async (tabOption = activeTab, categoryOption = activeCategory) => {
    const options: any = {
      sort: tabOption
    };

    if (categoryOption !== 'all') {
      options.category = categoryOption;
    }

    if (searchQuery) {
      options.search = searchQuery;
    }

    await fetchDiscussions(options);
  };

  const handleCategoryChange = async (categorySlug: string) => {
    setActiveCategory(categorySlug);
    await loadDiscussions(activeTab, categorySlug);
  };

  const handleTabChange = async (tab: string) => {
    setActiveTab(tab);
    await loadDiscussions(tab, activeCategory);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDiscussions();
    setRefreshing(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    await loadDiscussions(activeTab, activeCategory);
  };

  const handleNavigateToDiscussion = (id: string) => {
    router.push(`/discussions/${id}`);
  };

  const handleNavigateToTopic = (slug: string) => {
    router.push(`/discussions/topic/${encodeURIComponent(slug)}`);
  };

  const handleNavigateToAllTopics = () => {
    router.push(`/discussions/topics`);
  };

  // Header animations
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [320, 60],
    extrapolate: 'clamp'
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 70],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  const searchBarTranslateY = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, -60],
    extrapolate: 'clamp'
  });

  if (isLoading && !refreshing) {
    return <LoadingOverlay message="Loading forum..." />;
  }

  // Get trending categories (categories with most posts)
  const trendingCategories = [...(categories || [])]
    .slice(0, 10); // Show more categories to make scrolling evident

  return (
    <View style={styles.container}>
      {/* Animated Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Medical Forum</Text>
          <View style={styles.headerControls}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setShowSearch(!showSearch)}
            >
              <Search size={22} color="#333333" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={handleNavigateToAllTopics}
            >
              <Hash size={22} color="#333333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search bar - conditionally shown */}
        {showSearch && (
          <Animated.View 
            style={[
              styles.searchContainer, 
              { transform: [{ translateY: searchBarTranslateY }] }
            ]}
          >
            <View style={styles.searchBar}>
              <Search size={18} color="#666666" />
              <TextInput
                placeholder="Search discussions..."
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={handleSearch}
                placeholderTextColor="#666666"
                autoFocus
              />
            </View>
          </Animated.View>
        )}

        {/* Trending Topics Section - Fixed to always be visible */}
        <View style={styles.trendingSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Topics</Text>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={handleNavigateToAllTopics}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingScrollContent}
            decelerationRate="fast"
            snapToAlignment="start"
          >
            {categories.map((category) => (
              <TrendingTopicCard
                key={category.id}
                category={category}
                onPress={() => handleNavigateToTopic(category.slug)}
              />
            ))}
          </ScrollView>
        </View>
      </Animated.View>

      {/* Tabs Row */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          <Tab
            title="Latest"
            isActive={activeTab === 'latest'}
            onPress={() => handleTabChange('latest')}
            icon={<Clock size={16} color={activeTab === 'latest' ? "#0066CC" : "#666666"} />}
          />
          <Tab
            title="Trending"
            isActive={activeTab === 'trending'}
            onPress={() => handleTabChange('trending')}
            icon={<TrendingUp size={16} color={activeTab === 'trending' ? "#0066CC" : "#666666"} />}
          />
          <Tab
            title="Most Discussed"
            isActive={activeTab === 'most_commented'}
            onPress={() => handleTabChange('most_commented')}
            icon={<MessageCircle size={16} color={activeTab === 'most_commented' ? "#0066CC" : "#666666"} />}
          />
        </ScrollView>
      </View>

      {/* Topics Pills Row */}
      <View style={styles.topicsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topicsScrollContent}
          decelerationRate="fast"
        >
          <TopicPill
            category={{ name: 'All Topics' }}
            onPress={() => handleCategoryChange('all')}
            isSelected={activeCategory === 'all'}
          />
          {categories.map((category) => (
            <TopicPill
              key={category.id}
              category={category}
              onPress={() => handleCategoryChange(category.slug)}
              isSelected={activeCategory === category.slug}
            />
          ))}
        </ScrollView>
      </View>

      {error && (
        <ErrorMessage 
          message={error} 
          onDismiss={() => useDiscussionsStore.setState({ error: null })}
        />
      )}

      {/* Main Content */}
      <Animated.FlatList
        data={discussions}
        renderItem={({ item, index }) => (
          <DiscussionCard 
            discussion={item} 
            onPress={() => handleNavigateToDiscussion(item.id)}
            isCompact={index > 2} // First 3 posts are full size, rest are compact
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No discussions found</Text>
            <Text style={styles.emptyStateSubtext}>
              Be the first to start a discussion!
            </Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => router.push('/discussions/create')}
            >
              <Text style={styles.createButtonText}>Create Post</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Floating Action Button */}
      <Link href="/discussions/create" asChild>
        <TouchableOpacity style={styles.fab}>
          <LinearGradient
            colors={['#0066CC', '#1E90FF']}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.fabText}>+</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.5,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  searchContainer: {
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginLeft: 12,
    color: '#1A1A1A',
    height: 48,
  },
  trendingSection: {
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#111111',
  },
  seeAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0, 102, 204, 0.06)',
    borderRadius: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
  },
  trendingScrollContent: {
    paddingBottom: 18,
    paddingRight: 10,
  },
  trendingTopicCard: {
    marginRight: 14,
    borderRadius: 16,
    overflow: 'hidden',
    width: 145,
    height: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    backgroundColor: '#FFF',
  },
  trendingTopicGradient: {
    padding: 14,
    height: '100%',
    justifyContent: 'space-between',
  },
  trendingTopicContent: {
    justifyContent: 'space-between',
    height: '100%',
  },
  trendingTopicHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  topicIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  trendingTopicIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 4,
    borderRadius: 12,
    marginRight: 6,
    marginTop: 2,
  },
  trendingTopicName: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#1A1A1A',
    flex: 1,
    lineHeight: 22,
  },
  trendingTopicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  trendingTopicStat: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#0066CC',
    marginLeft: 6,
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    elevation: 1,
    paddingTop: 4,
  },
  tabsScrollContent: {
    paddingHorizontal: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#0066CC',
  },
  tabText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#666666',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#0066CC',
    fontFamily: 'Inter_600SemiBold',
  },
  topicsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  topicsScrollContent: {
    paddingHorizontal: 16,
  },
  topicPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  selectedTopicPill: {
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    borderColor: 'rgba(0, 102, 204, 0.2)',
  },
  topicPillText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#333333',
  },
  selectedTopicPillText: {
    color: '#0066CC',
    fontFamily: 'Inter_600SemiBold',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 80,
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
  cardTitle: {
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
    marginLeft: 4,
  },
  compactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    overflow: 'hidden',
  },
  compactCardContent: {
    flexDirection: 'row',
    padding: 10,
  },
  compactCardBody: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
    marginBottom: 4,
    lineHeight: 20,
  },
  compactCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactMetaText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#666666',
  },
  compactMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horizontalVote: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteButtonHorizontal: {
    padding: 8,
    borderRadius: 20,
  },
  voteButtonActive: {
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
  },
  voteCountHorizontal: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#666666',
    marginLeft: 4,
  },
  voteCountActive: {
    color: '#0066CC',
  },
  compactCategoryTag: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    borderRadius: 8,
  },
  compactCategoryText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 30,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#333333',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  fabGradient: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    fontSize: 28,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    marginTop: -2,
  }
});