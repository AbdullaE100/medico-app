import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  ColorValue
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  TrendingUp, 
  MessageSquare, 
  Users, 
  Award, 
  Heart,
  ChevronLeft
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  trend?: string | null;
  trendColor?: string | null;
}

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  count: number;
}

interface UserData {
  id: string;
  full_name: string;
  avatar_url: string | null;
  specialty: string | null;
  post_count: number;
  comment_count: number;
}

interface DayData {
  date: string;
  count: number;
}

const StatCard = ({ title, value, icon, color, trend = null, trendColor = null }: StatCardProps) => (
  <View style={styles.statCard}>
    <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
      {icon}
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statTitle}>{title}</Text>
      <View style={styles.statRow}>
        <Text style={styles.statValue}>{value}</Text>
        {trend && trendColor && (
          <View style={[styles.trendContainer, { backgroundColor: `${trendColor}15` }]}>
            <TrendingUp size={12} color={trendColor} />
            <Text style={[styles.trendText, { color: trendColor }]}>{trend}%</Text>
          </View>
        )}
      </View>
    </View>
  </View>
);

export default function ForumAnalytics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const initialStats = {
    topCategories: [] as CategoryData[],
    activeUsers: [] as UserData[],
    postsByDay: [] as DayData[],
    totalPosts: 0,
    totalComments: 0,
    totalUsers: 0
  };
  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Get current date and date from 30 days ago
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Format dates for Supabase query
      const formattedToday = today.toISOString();
      const formattedThirtyDaysAgo = thirtyDaysAgo.toISOString();
      
      // Fetch top categories
      const { data: categories } = await supabase
        .from('discussion_categories')
        .select('id, name, slug')
        .order('id');
      
      // Get count of discussions per category
      let categoryCounts: {category_id: string, count: number}[] = [];
      
      if (categories && categories.length > 0) {
        // Fetch counts for each category
        const countsPromises = categories.map(async (category) => {
          const { count } = await supabase
            .from('discussions')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id);
            
          return {
            category_id: category.id,
            count: count || 0
          };
        });
        
        categoryCounts = await Promise.all(countsPromises);
      }
      
      // Process category data
      const topCategories: CategoryData[] = (categories || []).map(category => {
        const count = categoryCounts.find(c => c.category_id === category.id)?.count || 0;
        return {
          ...category,
          count: count
        };
      }).sort((a, b) => b.count - a.count).slice(0, 5);
      
      // Fetch most active users
      const { data: activeUsers } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          avatar_url,
          specialty
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      // Add post and comment counts separately
      const processedUsers = activeUsers ? await Promise.all(
        activeUsers.map(async (user) => {
          // Get post count
          const { count: postCount } = await supabase
            .from('discussions')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', user.id);
            
          // Get comment count
          const { count: commentCount } = await supabase
            .from('discussion_comments')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', user.id);
            
          return {
            ...user,
            post_count: postCount || 0,
            comment_count: commentCount || 0
          };
        })
      ) : [];
      
      // Sort by post count
      const sortedUsers = [...processedUsers].sort((a, b) => b.post_count - a.post_count);
      
      // Fetch posts by day for the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: recentPosts } = await supabase
        .from('discussions')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString());
      
      // Process posts by day
      const postsByDay: DayData[] = [];
      const days: { [key: string]: number } = {};
      
      // Initialize last 7 days with 0 counts
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        days[dateString] = 0;
      }
      
      // Count posts for each day
      if (recentPosts) {
        recentPosts.forEach(post => {
          const dateString = new Date(post.created_at).toISOString().split('T')[0];
          if (days[dateString] !== undefined) {
            days[dateString]++;
          }
        });
      }
      
      // Convert to array for display
      Object.entries(days).forEach(([date, count]) => {
        postsByDay.push({
          date,
          count
        });
      });
      
      // Sort by date ascending
      postsByDay.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Get total counts
      const { count: postsCount } = await supabase
        .from('discussions')
        .select('*', { count: 'exact', head: true });
        
      const { count: commentsCount } = await supabase
        .from('discussion_comments')
        .select('*', { count: 'exact', head: true });
        
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
        
      setStats({
        topCategories,
        activeUsers: sortedUsers.slice(0, 5),
        postsByDay,
        totalPosts: postsCount || 0,
        totalComments: commentsCount || 0,
        totalUsers: usersCount || 0
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Forum Analytics</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.stats}>
            <StatCard 
              title="Total Posts" 
              value={stats.totalPosts} 
              icon={<MessageSquare size={20} color="#0066CC" />} 
              color="#0066CC"
              trend="12.5"
              trendColor="#22c55e"
            />
            <StatCard 
              title="Comments" 
              value={stats.totalComments} 
              icon={<MessageSquare size={20} color="#8B5CF6" />} 
              color="#8B5CF6"
              trend="8.3"
              trendColor="#22c55e"
            />
            <StatCard 
              title="Active Users" 
              value={stats.totalUsers} 
              icon={<Users size={20} color="#F59E0B" />} 
              color="#F59E0B"
              trend="5.2"
              trendColor="#22c55e"
            />
            <StatCard 
              title="Engagement" 
              value="84%" 
              icon={<Heart size={20} color="#EF4444" />} 
              color="#EF4444"
              trend="3.7"
              trendColor="#22c55e"
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Posts by Day (Last 7 Days)</Text>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
            <View style={styles.barChart}>
              {stats.postsByDay.map((item, index) => {
                const day = new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' });
                return (
                  <View key={index} style={styles.barContainer}>
                    <Text style={styles.barValue}>{item.count}</Text>
                    <View style={[styles.bar, { height: Math.max(item.count * 15, 10) }]} />
                    <Text style={styles.barLabel}>{day}</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Categories</Text>
          <View style={styles.topItemsList}>
            {stats.topCategories.map((category, index) => (
              <View key={category.id} style={styles.topItem}>
                <View style={[styles.topItemRank, { backgroundColor: index < 3 ? '#0066CC' : '#CBD5E0' }]}>
                  <Text style={styles.topItemRankText}>{index + 1}</Text>
                </View>
                <View style={styles.topItemContent}>
                  <Text style={styles.topItemTitle}>{category.name}</Text>
                  <Text style={styles.topItemSubtitle}>{category.count} posts</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Most Active Members</Text>
          <View style={styles.topItemsList}>
            {stats.activeUsers.map((user, index) => (
              <View key={user.id} style={styles.topItem}>
                <View style={[styles.topItemRank, { backgroundColor: index < 3 ? '#0066CC' : '#CBD5E0' }]}>
                  <Text style={styles.topItemRankText}>{index + 1}</Text>
                </View>
                <View style={styles.topItemContent}>
                  <Text style={styles.topItemTitle}>{user.full_name}</Text>
                  <Text style={styles.topItemSubtitle}>
                    {user.post_count} posts • {user.comment_count} comments
                  </Text>
                </View>
                {index === 0 && (
                  <Award size={20} color="#F59E0B" />
                )}
              </View>
            ))}
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  dataList: {
    marginVertical: 10,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dataDay: {
    width: 50,
    fontSize: 12,
    color: '#666',
  },
  dataBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  dataBar: {
    height: '100%',
  },
  dataCount: {
    width: 30,
    textAlign: 'right',
    fontSize: 12,
    marginLeft: 8,
    color: '#666',
  },
  topItemsList: {
    marginTop: 8,
  },
  topItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  topItemRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topItemRankText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  topItemContent: {
    flex: 1,
  },
  topItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  topItemSubtitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barContainer: {
    marginRight: 10,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  bar: {
    width: 20,
    backgroundColor: '#0066CC',
    marginTop: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#666666',
  },
}); 