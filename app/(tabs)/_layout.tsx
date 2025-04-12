import React, { useEffect, useState } from 'react';
import { Tabs, usePathname } from 'expo-router';
import { Chrome as Home, Users, MessagesSquare, Bell, User, Plus, Newspaper } from 'lucide-react-native';
import { Platform, View, StyleSheet, SafeAreaView, StatusBar, Text } from 'react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { useFeedStore } from '@/stores/useFeedStore';
import { useNetworkStore } from '@/stores/useNetworkStore';
import { useDiscussionsStore } from '@/stores/useDiscussionsStore';
import { useChatStore } from '@/stores/useChatStore';
import { useNotificationsStore } from '@/stores/useNotificationsStore';
import { usePollStore, getPollStore } from '@/stores/usePollStore';
import ProfileIconHeader from '@/components/ProfileIconHeader';
import { NotificationBell } from '@/components/NotificationBell';
import NotificationManager from '@/components/NotificationManager';
import { LinearGradient } from 'expo-linear-gradient';
import { LoadingOverlay } from '@/components/LoadingOverlay';

export default function TabLayout() {
  const { isAuthenticated, checkAuth, isLoading } = useAuthStore();
  const { fetchPosts, fetchTrendingHashtags } = useFeedStore();
  const { fetchDoctors, fetchConnectionRequests } = useNetworkStore();
  const { fetchDiscussions, fetchCategories } = useDiscussionsStore();
  const { fetchChats } = useChatStore();
  const { fetchNotifications, unreadCount } = useNotificationsStore();
  const pathname = usePathname();
  
  useEffect(() => {
    console.log("Current pathname:", pathname);
  }, [pathname]);
  
  // Check if we're on the home page
  const isHomePage = pathname === '/' || pathname === '/home' || pathname === '/home/index';
  
  // Check if we're on the create page - hide header icons on create page
  const isCreatePage = pathname === '/create' || pathname === '/create/index' || pathname.startsWith('/create/');
  
  // NEW: Check if we should show header icons (only on main tab screens)
  const shouldShowHeaderIcons = () => {
    // Don't show on create page (existing condition)
    if (isCreatePage) return false;
    
    // Only show on main tab screens, not on nested screens
    const isMainTabScreen = 
      pathname === '/home' || 
      pathname === '/home/index' || 
      pathname === '/network' || 
      pathname === '/network/index' || 
      pathname === '/chat' || 
      pathname === '/chat/index';
    
    return isMainTabScreen;
  };
  
  // Add state to track if initial loading is complete
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log("Initializing app data...");
        
        // First, check authentication status
        await checkAuth();
        
        // Initialize the poll store
        const pollStore = getPollStore();
        pollStore.setStartupComplete();
        console.log("Poll store initialized and marked as startup complete");
        
        // Check if polls table exists early
        pollStore.checkTableExists().catch(e => console.error("Error checking polls table:", e));
        
        if (isAuthenticated) {
          console.log("User is authenticated, fetching initial data...");
          
          // Fetch initial data in parallel for faster loading
          await Promise.all([
            fetchPosts({ forceRefresh: true }).catch(e => console.error("Error fetching posts:", e)),
            fetchTrendingHashtags().catch(e => console.error("Error fetching hashtags:", e)),
            fetchDoctors().catch(e => console.error("Error fetching doctors:", e)),
            fetchConnectionRequests().catch(e => console.error("Error fetching connection requests:", e)),
            fetchDiscussions().catch(e => console.error("Error fetching discussions:", e)),
            fetchCategories().catch(e => console.error("Error fetching categories:", e)),
            fetchChats().catch(e => console.error("Error fetching chats:", e)),
            fetchNotifications().catch(e => console.error("Error fetching notifications:", e))
          ]);
          
          console.log("Initial data loading complete");
        } else {
          console.log("User is not authenticated, skipping data fetching");
        }
      } catch (error) {
        console.error("Error during app initialization:", error);
      } finally {
        // Mark initialization as complete regardless of success/failure
        // Small timeout to ensure the UI is ready to render
        setTimeout(() => {
          setIsInitialized(true);
        }, 300);
      }
    };

    initializeApp();
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
        <LoadingOverlay message="Loading your medical network..." />
      </View>
    );
  }

  console.log("IsCreatePage:", isCreatePage, "Pathname:", pathname);

  return (
    <>
      {/* Header Icons - Profile and Notification - Only show on main tab screens */}
      {shouldShowHeaderIcons() && (
        <SafeAreaView style={[styles.safeArea, isHomePage && styles.safeAreaHome]} pointerEvents="box-none">
          <View style={[styles.headerIconsContainer, isHomePage && styles.headerIconsContainerHome]}>
            <NotificationBell inHeader={true} />
            <ProfileIconHeader inHeader={true} />
          </View>
        </SafeAreaView>
      )}
      
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
          name="create"
          options={{
            title: 'Create',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <View style={styles.createTabIcon}>
                <LinearGradient
                  colors={['#0066CC', '#1a82ff']}
                  style={styles.createIconGradient}
                >
                  <Plus size={size-5} color="#FFFFFF" />
                </LinearGradient>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="discussions"
          options={{
            title: 'Forum',
            tabBarIcon: ({ color, size }) => <Newspaper size={size} color={color} />,
            // Make the forum tab visible
            tabBarItemStyle: undefined,
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
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  safeAreaHome: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 45 : 10,
    right: 10,
    left: undefined,
    width: 'auto',
    zIndex: 1500,
  },
  headerIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingRight: 16,
    paddingBottom: 10,
    paddingLeft: 16,
  },
  headerIconsContainerHome: {
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    gap: 8,
  },
  createTabIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 16 : 0,
  },
  createIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  }
});