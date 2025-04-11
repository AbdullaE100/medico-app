import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

export type NotificationType = 
  // Network notifications
  | 'connection_request_received'
  | 'connection_accepted'
  | 'suggested_connection'
  // Forum/discussion notifications
  | 'post_reply'
  | 'post_mention'
  | 'post_like'
  // Direct message notifications
  | 'direct_message'
  // Legacy types (for backward compatibility)
  | 'message'
  | 'follow'
  | 'mention'
  | 'comment'
  | 'ama_question'
  | 'connection_request';

export interface Notification {
  id: string;
  recipient_id: string;
  type: NotificationType;
  title: string;
  content: string;
  data: Record<string, any>;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  subscription: any | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  subscribeToNotifications: () => void;
  unsubscribeFromNotifications: () => void;
  handleNotificationAction: (notification: Notification) => void;
  deleteNotification: (notificationId: string) => Promise<void>;
  getGroupedNotifications: () => { today: Notification[], earlier: Notification[] };
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  subscription: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ 
        notifications: data || [],
        unreadCount: (data || []).filter(n => !n.is_read).length
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  markAllAsRead: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      set(state => {
        const notification = state.notifications.find(n => n.id === notificationId);
        const unreadChange = notification && !notification.is_read ? 1 : 0;
        
        return {
          notifications: state.notifications.filter(n => n.id !== notificationId),
          unreadCount: Math.max(0, state.unreadCount - unreadChange)
        };
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  subscribeToNotifications: () => {
    const { subscription } = get();
    if (subscription) return;

    const newSubscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${supabase.auth.getUser().then(({ data }) => data.user?.id)}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          set(state => ({
            notifications: [newNotification, ...state.notifications],
            unreadCount: state.unreadCount + 1
          }));
        }
      )
      .subscribe();

    set({ subscription: newSubscription });
  },

  unsubscribeFromNotifications: () => {
    const { subscription } = get();
    if (subscription) {
      supabase.removeChannel(subscription);
      set({ subscription: null });
    }
  },

  // Handle navigation and actions when a notification is tapped
  handleNotificationAction: (notification: Notification) => {
    // Mark the notification as read
    get().markAsRead(notification.id);
    
    // Navigate based on notification type
    switch (notification.type) {
      // Network notifications
      case 'connection_request_received':
      case 'connection_request':
        router.push('/network');
        break;
        
      case 'connection_accepted':
        router.push({
          pathname: '/network',
          params: { userId: notification.data.recipient_id }
        });
        break;
        
      case 'suggested_connection':
        router.push({
          pathname: '/network',
          params: { userId: notification.data.suggested_user_id }
        });
        break;
        
      // Forum/Discussion notifications
      case 'post_reply':
      case 'comment':
        router.push({
          pathname: '/discussions/[id]',
          params: { id: notification.data.discussion_id }
        });
        break;
        
      case 'post_mention':
      case 'mention':
        if (notification.data.comment_id) {
          // If mention was in a comment
          router.push({
            pathname: '/discussions/[id]',
            params: { 
              id: notification.data.discussion_id,
              commentId: notification.data.comment_id
            }
          });
        } else {
          // If mention was in a discussion
          router.push({
            pathname: '/discussions/[id]',
            params: { id: notification.data.discussion_id }
          });
        }
        break;
        
      case 'post_like':
        router.push({
          pathname: '/discussions/[id]',
          params: { id: notification.data.discussion_id }
        });
        break;
        
      // Direct message notifications
      case 'direct_message':
      case 'message':
        router.push({
          pathname: '/chat/[id]',
          params: { id: notification.data.chat_id }
        });
        break;
        
      // AMA questions
      case 'ama_question':
        // Handle AMA sessions when they're implemented
        if (notification.data.ama_session_id) {
          router.push('/discussions');
        }
        break;
        
      default:
        console.log('Unknown notification type:', notification.type);
    }
  },

  // Group notifications by date for better UI organization
  getGroupedNotifications: () => {
    const { notifications } = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return notifications.reduce((groups, notification) => {
      const notificationDate = new Date(notification.created_at);
      const isToday = notificationDate >= today;
      
      if (isToday) {
        groups.today.push(notification);
      } else {
        groups.earlier.push(notification);
      }
      
      return groups;
    }, { today: [] as Notification[], earlier: [] as Notification[] });
  }
}));