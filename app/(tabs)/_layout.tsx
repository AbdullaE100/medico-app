import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Chrome as Home, Users, MessageCircle, MessagesSquare, Bell, User } from 'lucide-react-native';
import { Platform, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { useFeedStore } from '@/stores/useFeedStore';
import { useNetworkStore } from '@/stores/useNetworkStore';
import { useDiscussionsStore } from '@/stores/useDiscussionsStore';
import { useChatStore } from '@/stores/useChatStore';
import { useNotificationsStore } from '@/stores/useNotificationsStore';
import ProfileIconHeader from '@/components/ProfileIconHeader';
import { NotificationBell } from '@/components/NotificationBell';
import NotificationManager from '@/components/NotificationManager';

export default function TabLayout() {
  const { isAuthenticated, checkAuth, isLoading } = useAuthStore();
  const { fetchPosts, fetchTrendingHashtags } = useFeedStore();
  const { fetchDoctors, fetchConnectionRequests } = useNetworkStore();
  const { fetchDiscussions, fetchCategories } = useDiscussionsStore();
  const { fetchChats } = useChatStore();
  const { fetchNotifications, unreadCount } = useNotificationsStore();
  
  // Add state to track if initial loading is complete
  const [isInitialized, setIsInitialized] = useState(false);

  // Load data in parallel batches to improve performance
  useEffect(() => {
    console.log("TabLayout: Authentication state changed. isAuthenticated =", isAuthenticated);
    
    if (isAuthenticated) {
      console.log("TabLayout: User is authenticated, loading data...");
      
      // First batch - Critical UI data
      Promise.all([
        fetchChats().catch(err => console.error("Error fetching chats:", err)),
        fetchNotifications().catch(err => console.error("Error fetching notifications:", err))
      ]).catch(err => console.error("Error in first batch:", err));

      // Second batch - Feed and network data
      setTimeout(() => {
        Promise.all([
          fetchPosts().catch(err => console.error("Error fetching posts:", err)),
          fetchDoctors().catch(err => console.error("Error fetching doctors:", err))
        ]).catch(err => console.error("Error in second batch:", err));
      }, 100);

      // Third batch - Additional data
      setTimeout(() => {
        Promise.all([
          fetchTrendingHashtags().catch(err => console.error("Error fetching hashtags:", err)),
          fetchConnectionRequests().catch(err => console.error("Error fetching connection requests:", err)),
          fetchDiscussions().catch(err => console.error("Error fetching discussions:", err)),
          fetchCategories().catch(err => console.error("Error fetching categories:", err))
        ]).catch(err => console.error("Error in third batch:", err))
        .finally(() => {
          // Mark initialization as complete
          setIsInitialized(true);
          console.log("TabLayout: All data loaded and initialized");
        });
      }, 200);
    } else {
      console.log("TabLayout: User is not authenticated yet");
      // Even if not authenticated, mark as initialized after a timeout
      setTimeout(() => {
        setIsInitialized(true);
        console.log("TabLayout: Marked as initialized even though not authenticated");
      }, 500);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    console.log("Checking authentication status...");
    checkAuth().then(() => {
      console.log("Auth check complete, isAuthenticated:", isAuthenticated);
    }).catch(err => {
      console.error("Error checking auth:", err);
    });
  }, []);

  // Show loading indicator during initialization
  if (isLoading || !isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  return (
    <>
      {/* Header Icons - Profile and Notification */}
      <View style={styles.headerIconsContainer}>
        <NotificationBell />
        <ProfileIconHeader />
      </View>
      
      {/* Notification Manager for handling push notifications and toasts */}
      <NotificationManager />
      
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
          headerShown: false,
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
            // Fix: href and tabBarButton cannot be used together
            // Use tabBarItemStyle to hide the tab instead
            tabBarItemStyle: { display: 'none' },
            // Keep the tab accessible but not visible
            headerShown: false
          }}
        />
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            headerShown: false,
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
            // Hide this tab as we now have a notification bell in the header
            tabBarItemStyle: { display: 'none' },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
            // Hide profile tab from bottom navigation
            tabBarItemStyle: { display: 'none' },
            // Keep it accessible through the profile icon header
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  headerIconsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 24,
    right: 16,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
  }
});