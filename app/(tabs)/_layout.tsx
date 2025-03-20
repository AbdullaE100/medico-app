import { Tabs } from 'expo-router';
import { Chrome as Home, Users, MessageCircle, MessagesSquare, Bell, User } from 'lucide-react-native';
import { Platform, View, StyleSheet } from 'react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { useFeedStore } from '@/stores/useFeedStore';
import { useNetworkStore } from '@/stores/useNetworkStore';
import { useDiscussionsStore } from '@/stores/useDiscussionsStore';
import { useChatStore } from '@/stores/useChatStore';
import { useNotificationsStore } from '@/stores/useNotificationsStore';
import { useEffect, useState, memo } from 'react';

export default function TabLayout() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const { fetchPosts, fetchTrendingHashtags } = useFeedStore();
  const { fetchDoctors, fetchConnectionRequests } = useNetworkStore();
  const { fetchDiscussions, fetchCategories } = useDiscussionsStore();
  const { fetchChats } = useChatStore();
  const { fetchNotifications, unreadCount } = useNotificationsStore();

  // Load data in parallel batches to improve performance
  useEffect(() => {
    if (isAuthenticated) {
      // First batch - Critical UI data
      Promise.all([
        fetchChats(),
        fetchNotifications()
      ]).catch(console.error);

      // Second batch - Feed and network data
      setTimeout(() => {
        Promise.all([
          fetchPosts(),
          fetchDoctors()
        ]).catch(console.error);
      }, 100);

      // Third batch - Additional data
      setTimeout(() => {
        Promise.all([
          fetchTrendingHashtags(),
          fetchConnectionRequests(),
          fetchDiscussions(),
          fetchCategories()
        ]).catch(console.error);
      }, 200);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0066CC',
        tabBarInactiveTintColor: '#666666',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
          height: Platform.OS === 'ios' ? 90 : 60,
          paddingBottom: Platform.OS === 'ios' ? 30 : 8,
          paddingTop: 8,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTitleStyle: {
          fontFamily: 'Inter_600SemiBold',
        },
        // Show labels for better UX
        tabBarShowLabel: true,
        // Lazy load tabs for better initial load time
        lazy: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          // Remove href and use tabBarStyle to hide the tab
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="network"
        options={{
          title: 'Network',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discussions"
        options={{
          title: 'Discuss',
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => <MessagesSquare size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
          tabBarBadge: unreadCount || undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#0066CC',
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}