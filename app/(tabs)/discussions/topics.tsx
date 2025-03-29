import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useDiscussionsStore } from '@/stores/useDiscussionsStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Sparkles, MessageCircle, User, Users, Heart, TrendingUp, MapPin, ArrowRight,
  Brain, Baby, Bone, Activity, PlusCircle, Stethoscope, Pill, AlertTriangle } from 'lucide-react-native';

interface TopicCardProps {
  category: any;
  onPress: () => void;
  featuredOrPopular?: boolean;
}

const TopicCard = ({ category, onPress, featuredOrPopular = false }: TopicCardProps) => {
  // Topic icons mapping based on the topic name or slug
  const getTopicIcon = () => {
    const slug = category.slug?.toLowerCase() || '';
    if (slug.includes('cardio')) return <Heart size={24} color="#FFFFFF" />;
    if (slug.includes('neuro')) return <Brain size={24} color="#FFFFFF" />;
    if (slug.includes('pediatric')) return <Baby size={24} color="#FFFFFF" />;
    if (slug.includes('ortho')) return <Bone size={24} color="#FFFFFF" />;
    if (slug.includes('derm')) return <Activity size={24} color="#FFFFFF" />;
    if (slug.includes('psych')) return <Brain size={24} color="#FFFFFF" />;
    if (slug.includes('onco')) return <PlusCircle size={24} color="#FFFFFF" />;
    if (slug.includes('emergency')) return <AlertTriangle size={24} color="#FFFFFF" />;
    // Default icon
    return <Stethoscope size={24} color="#FFFFFF" />;
  };

  return (
    <TouchableOpacity 
      style={[
        styles.topicCard,
        featuredOrPopular && styles.featuredTopicCard
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={
          featuredOrPopular 
            ? ['#0066CC', '#1E90FF'] 
            : ['rgba(0, 102, 204, 0.1)', 'rgba(0, 145, 255, 0.15)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topicCardGradient}
      >
        <View style={styles.topicIconContainer}>
          {featuredOrPopular && getTopicIcon()}
        </View>
        
        <View style={styles.topicContent}>
          <Text 
            style={[
              styles.topicName,
              featuredOrPopular && styles.featuredTopicName
            ]}
            numberOfLines={1}
          >
            {category.name}
          </Text>
          
          <Text 
            style={[
              styles.topicDescription,
              featuredOrPopular && styles.featuredTopicDescription
            ]}
            numberOfLines={2}
          >
            {category.description}
          </Text>
          
          <View style={styles.topicStats}>
            <View style={styles.topicStat}>
              <MessageCircle 
                size={12} 
                color={featuredOrPopular ? '#FFFFFF' : '#0066CC'} 
                strokeWidth={2.5}
              />
              <Text 
                style={[
                  styles.topicStatText,
                  featuredOrPopular && styles.featuredTopicStatText
                ]}
              >
                {category.posts_count || Math.floor(Math.random() * 100)} posts
              </Text>
            </View>
            
            <View style={styles.topicStat}>
              <Users 
                size={12} 
                color={featuredOrPopular ? '#FFFFFF' : '#0066CC'} 
                strokeWidth={2.5}
              />
              <Text 
                style={[
                  styles.topicStatText,
                  featuredOrPopular && styles.featuredTopicStatText
                ]}
              >
                {category.members_count || Math.floor(Math.random() * 500)} members
              </Text>
            </View>
          </View>
        </View>
        
        <ArrowRight 
          size={18} 
          color={featuredOrPopular ? '#FFFFFF' : '#0066CC'} 
          style={styles.topicArrow}
        />
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default function TopicsPage() {
  const router = useRouter();
  const { categories, isLoading, fetchCategories } = useDiscussionsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCategories, setFilteredCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      if (searchQuery.trim() === '') {
        setFilteredCategories(categories);
      } else {
        const query = searchQuery.toLowerCase();
        setFilteredCategories(
          categories.filter(
            category => 
              category.name.toLowerCase().includes(query) || 
              category.description.toLowerCase().includes(query)
          )
        );
      }
    }
  }, [categories, searchQuery]);

  const navigateToTopic = (slug: string) => {
    router.push(`/discussions/topic/${encodeURIComponent(slug)}`);
  };

  const renderCategoryList = (title: string, data: any[], featured = false) => (
    <View style={styles.categorySection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        data={data}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TopicCard 
            category={item} 
            onPress={() => navigateToTopic(item.slug)}
            featuredOrPopular={featured}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.horizontalListContainer}
      />
    </View>
  );

  // Determine featured and popular categories
  const featuredCategories = categories.filter(c => c.is_featured === true).slice(0, 5);
  const popularCategories = [...categories]
    .sort((a, b) => ((b.posts_count || 0) - (a.posts_count || 0)))
    .slice(0, 5);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading topics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#666666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search topics..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666666"
          />
        </View>
      </View>

      {/* Topic lists */}
      <FlatList
        data={filteredCategories}
        renderItem={() => null} // Dummy renderItem to satisfy the TypeScript requirement
        ListHeaderComponent={() => (
          <>
            {featuredCategories.length > 0 && renderCategoryList('Featured Topics', featuredCategories, true)}
            {popularCategories.length > 0 && renderCategoryList('Popular Topics', popularCategories)}
            
            <Text style={[styles.sectionTitle, styles.allTopicsTitle]}>All Topics</Text>
          </>
        )}
        ListFooterComponent={() => (
          <View style={styles.gridContainer}>
            {filteredCategories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={styles.gridItem}
                onPress={() => navigateToTopic(category.slug)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(0, 102, 204, 0.05)', 'rgba(0, 145, 255, 0.1)']}
                  style={styles.gridItemGradient}
                >
                  <Text style={styles.gridItemName} numberOfLines={1}>{category.name}</Text>
                  <Text style={styles.gridItemDescription} numberOfLines={2}>{category.description}</Text>
                  <View style={styles.gridItemFooter}>
                    <MessageCircle size={12} color="#0066CC" />
                    <Text style={styles.gridItemStat}>{category.posts_count || Math.floor(Math.random() * 50)} posts</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No topics found</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#333333',
  },
  categorySection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#1A1A1A',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  allTopicsTitle: {
    marginTop: 24,
  },
  horizontalListContainer: {
    paddingHorizontal: 8,
  },
  topicCard: {
    width: 280,
    height: 150,
    borderRadius: 16,
    marginHorizontal: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featuredTopicCard: {
    height: 170,
  },
  topicCardGradient: {
    flex: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topicIcon: {
    width: 28,
    height: 28,
    tintColor: '#FFFFFF',
  },
  topicContent: {
    flex: 1,
  },
  topicName: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  featuredTopicName: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  topicDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#4A4A4A',
    marginBottom: 10,
    lineHeight: 20,
  },
  featuredTopicDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  topicStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  topicStatText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
    marginLeft: 4,
  },
  featuredTopicStatText: {
    color: '#FFFFFF',
  },
  topicArrow: {
    alignSelf: 'center',
    opacity: 0.8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  gridItem: {
    width: '50%',
    padding: 8,
  },
  gridItemGradient: {
    borderRadius: 12,
    padding: 12,
    height: 120,
  },
  gridItemName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  gridItemDescription: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#4A4A4A',
    marginBottom: 8,
    height: 36,
  },
  gridItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
  },
  gridItemStat: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
    marginLeft: 4,
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
  },
}); 