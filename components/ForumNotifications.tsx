import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatDistanceToNow } from 'date-fns';

// Define types for notifications
export type NotificationType = 
  | 'new_discussion' 
  | 'new_reply' 
  | 'mention' 
  | 'discussion_like'
  | 'reply_like';

export interface ForumNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  content: string;
  related_id: string;
  created_at: string;
  is_read: boolean;
  actor_id: string;
  actor_name: string;
}

// Helper function for theme colors
function useThemeColor(props: { light: string; dark: string }, colorName: string): string {
  const theme = useColorScheme() || 'light';
  const colorFromProps = props[theme];
  
  return colorFromProps;
}

export function ForumNotifications() {
  const [notifications, setNotifications] = useState<ForumNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const tintColor = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'tint');
  const textColor = useThemeColor({ light: '#000', dark: '#FFF' }, 'text');
  const subtextColor = useThemeColor({ light: '#666', dark: '#AAA' }, 'subtext');
  const borderColor = useThemeColor({ light: '#E1E1E1', dark: '#333' }, 'border');
  const cardBgColor = useThemeColor({ light: '#FFF', dark: '#1C1C1E' }, 'card');

  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('forum_notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('forum_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      
      // Update local state
      setNotifications(current => 
        current.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true } 
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser?.id || notifications.length === 0) return;
    
    try {
      const { error } = await supabase
        .from('forum_notifications')
        .update({ is_read: true })
        .eq('user_id', currentUser.id)
        .eq('is_read', false);

      if (error) throw error;
      
      // Update local state
      setNotifications(current => 
        current.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationPress = (notification: ForumNotification) => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    switch(notification.type) {
      case 'new_discussion':
      case 'discussion_like':
        router.push(`/discussions/${notification.related_id}`);
        break;
      case 'new_reply':
      case 'reply_like':
      case 'mention':
        // Navigate to the specific reply in the discussion
        // This would require either:
        // 1. A deep linking approach if you have that set up
        // 2. Or passing info via params and scrolling to the specific reply
        router.push(`/discussions/${notification.related_id}`);
        break;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getNotificationIcon = (type: NotificationType) => {
    switch(type) {
      case 'new_discussion': return 'file-text';
      case 'new_reply': return 'message-circle';
      case 'mention': return 'at-sign';
      case 'discussion_like': return 'thumbs-up';
      case 'reply_like': return 'thumbs-up';
      default: return 'bell';
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={tintColor} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {notifications.length > 0 ? (
        <>
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>Notifications</Text>
            <TouchableOpacity 
              style={styles.markAllBtn}
              onPress={markAllAsRead}
            >
              <Text style={[styles.markAllText, { color: tintColor }]}>Mark all as read</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.notificationItem,
                  { backgroundColor: item.is_read ? cardBgColor : `${tintColor}10` },
                  { borderColor }
                ]}
                onPress={() => handleNotificationPress(item)}
              >
                <View style={styles.iconContainer}>
                  <Feather 
                    name={getNotificationIcon(item.type)} 
                    size={20} 
                    color={tintColor} 
                  />
                </View>
                <View style={styles.contentContainer}>
                  <Text style={[styles.notificationText, { color: textColor }]}>
                    {item.content}
                  </Text>
                  <Text style={[styles.timeText, { color: subtextColor }]}>
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </Text>
                </View>
                {!item.is_read && (
                  <View style={[styles.unreadDot, { backgroundColor: tintColor }]} />
                )}
              </TouchableOpacity>
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={tintColor}
              />
            }
          />
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Feather name="bell-off" size={48} color={subtextColor} />
          <Text style={[styles.emptyText, { color: textColor }]}>
            No notifications yet
          </Text>
          <Text style={[styles.emptySubtext, { color: subtextColor }]}>
            You'll be notified when someone replies to your posts or mentions you
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E1E1E1',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  markAllBtn: {
    padding: 8,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  notificationText: {
    fontSize: 15,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 13,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
}); 