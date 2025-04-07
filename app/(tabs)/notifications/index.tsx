import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { MessageSquare, UserPlus, AtSign, MessageCircle, BrainCircuit, Bell, Check } from 'lucide-react-native';
import { useNotificationsStore, NotificationType } from '@/stores/useNotificationsStore';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ErrorMessage } from '@/components/ErrorMessage';

const NotificationIcon = ({ type, color }: { type: NotificationType; color: string }) => {
  switch (type) {
    case 'message':
      return <MessageSquare size={24} color={color} />;
    case 'follow':
      return <UserPlus size={24} color={color} />;
    case 'mention':
      return <AtSign size={24} color={color} />;
    case 'comment':
      return <MessageCircle size={24} color={color} />;
    case 'ama_question':
      return <BrainCircuit size={24} color={color} />;
    case 'connection_request':
      return <UserPlus size={24} color={color} />;
    default:
      return <Bell size={24} color={color} />;
  }
};

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    notifications,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    subscribeToNotifications,
    unsubscribeFromNotifications
  } = useNotificationsStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    fetchNotifications();
    subscribeToNotifications();
    return () => unsubscribeFromNotifications();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, []);

  const handleNotificationPress = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'message':
        router.push(`/chat/${notification.data.chat_id}`);
        break;
      case 'follow':
        router.push(`/network/doctor/${notification.data.follower_id}`);
        break;
      case 'mention':
        router.push(`/discussions/${notification.data.discussion_id}`);
        break;
      case 'comment':
        router.push(`/discussions/${notification.data.discussion_id}`);
        break;
      case 'ama_question':
        router.push(`/discussions/${notification.data.ama_id}`);
        break;
      case 'connection_request':
        router.push('/network');
        break;
    }
  };

  if (isLoading && !refreshing) {
    return <LoadingOverlay message="Loading notifications..." />;
  }

  return (
    <View style={styles.container}>
      {error && (
        <ErrorMessage 
          message={error} 
          onDismiss={() => useNotificationsStore.setState({ error: null })}
        />
      )}

      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {notifications.some(n => !n.is_read) && (
          <Pressable style={styles.markAllButton} onPress={markAllAsRead}>
            <Check size={16} color="#0066CC" />
            <Text style={styles.markAllText}>Mark all as read</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.notification, !item.is_read && styles.unreadNotification]}
            onPress={() => handleNotificationPress(item)}
          >
            <View style={[
              styles.iconContainer,
              !item.is_read && styles.unreadIconContainer
            ]}>
              <NotificationIcon 
                type={item.type} 
                color={item.is_read ? '#666666' : '#0066CC'} 
              />
            </View>
            <View style={styles.content}>
              <Text style={[
                styles.title,
                !item.is_read && styles.unreadTitle
              ]}>{item.title}</Text>
              <Text style={styles.message}>{item.content}</Text>
              <Text style={styles.timestamp}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
          </Pressable>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Bell size={48} color="#666666" />
            <Text style={styles.emptyStateTitle}>No notifications yet</Text>
            <Text style={styles.emptyStateText}>
              We'll notify you when something important happens
            </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  markAllText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  notification: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadNotification: {
    backgroundColor: '#F0F7FF',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadIconContainer: {
    backgroundColor: '#E5F0FF',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  unreadTitle: {
    color: '#0066CC',
  },
  message: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666666',
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#999999',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666666',
    textAlign: 'center',
  },
});