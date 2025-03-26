import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
  useDerivedValue
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView
} from 'react-native-gesture-handler';
import { 
  Bell,
  X,
  MessageSquare,
  UserPlus,
  AtSign,
  MessageCircle,
  BrainCircuit,
  Check
} from 'lucide-react-native';
import { useNotificationsStore, NotificationType } from '@/stores/useNotificationsStore';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PANEL_WIDTH = SCREEN_WIDTH * 0.8;
const SPRING_CONFIG = {
  damping: 17,
  stiffness: 90,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01
};

interface NotificationSlidingPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

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

const NotificationSlidingPanel: React.FC<NotificationSlidingPanelProps> = ({ 
  isVisible, 
  onClose 
}) => {
  const router = useRouter();
  const { 
    notifications, 
    isLoading, 
    error, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead 
  } = useNotificationsStore();
  
  // Animation values
  const translateX = useSharedValue(PANEL_WIDTH);
  const backdropOpacity = useSharedValue(0);
  const panelVisible = useSharedValue(false);

  // Load notifications data whenever panel becomes visible
  useEffect(() => {
    if (isVisible) {
      fetchNotifications();
    }
  }, [isVisible]);

  // Panel visibility animation
  useEffect(() => {
    if (isVisible) {
      panelVisible.value = true;
      backdropOpacity.value = withTiming(1, { duration: 250 });
      translateX.value = withSpring(0, {
        ...SPRING_CONFIG,
        stiffness: 80, // Slightly softer spring for smoother entry
      });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateX.value = withSpring(PANEL_WIDTH, SPRING_CONFIG, () => {
        runOnJS(resetPanel)();
      });
    }
  }, [isVisible]);

  const resetPanel = () => {
    panelVisible.value = false;
  };

  // Derived animation for additional effects
  const scale = useDerivedValue(() => {
    return interpolate(
      translateX.value,
      [0, PANEL_WIDTH],
      [1, 0.9],
      Extrapolate.CLAMP
    );
  });

  // Pan gesture handler with improved physics
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // Start gesture only after moving 10px horizontally
    .onUpdate((e) => {
      const dragX = Math.max(0, e.translationX);
      translateX.value = dragX;
      
      // Calculate backdrop opacity based on panel position
      backdropOpacity.value = interpolate(
        dragX,
        [0, PANEL_WIDTH],
        [1, 0],
        Extrapolate.CLAMP
      );
    })
    .onEnd((e) => {
      const velocity = e.velocityX;
      
      // Fast swipe detection (velocity > 500 px/s)
      if (velocity > 500 || e.translationX > PANEL_WIDTH * 0.3) {
        // User dragged more than 30% or swiped quickly - close the panel
        backdropOpacity.value = withTiming(0, { duration: 200 });
        translateX.value = withSpring(PANEL_WIDTH, {
          ...SPRING_CONFIG,
          velocity: velocity, // Use the velocity for more natural feel
        }, () => {
          runOnJS(onClose)();
          runOnJS(resetPanel)();
        });
      } else {
        // Snap back to open position
        translateX.value = withSpring(0, {
          ...SPRING_CONFIG,
          velocity: velocity,
        });
        backdropOpacity.value = withTiming(1, { duration: 200 });
      }
    });

  // Handler for notification press
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
    
    // Close the panel after navigation
    onClose();
  };

  // Individual notification item with swipe-to-dismiss gesture
  const NotificationItem = ({ item }: { item: any }) => {
    const itemTranslateX = useSharedValue(0);
    const itemHeight = useSharedValue(80); // Approximate height of notification
    const itemOpacity = useSharedValue(1);
    const itemMargin = useSharedValue(10);
    
    const swipeGesture = Gesture.Pan()
      .activeOffsetX([-10, 10])
      .onUpdate((e) => {
        // Only allow swiping left (negative X)
        itemTranslateX.value = Math.min(0, e.translationX);
      })
      .onEnd((e) => {
        const velocity = e.velocityX;
        
        // If swiped left far enough or with enough velocity
        if (velocity < -500 || e.translationX < -SCREEN_WIDTH * 0.4) {
          // Animate out to the left
          itemTranslateX.value = withTiming(-SCREEN_WIDTH, { duration: 200 });
          itemOpacity.value = withTiming(0, { duration: 200 });
          itemHeight.value = withTiming(0, { duration: 300 });
          itemMargin.value = withTiming(0, { duration: 300 }, () => {
            // Mark as read when dismissed
            runOnJS(markAsRead)(item.id);
          });
        } else {
          // Snap back to original position
          itemTranslateX.value = withSpring(0, { 
            damping: 20, 
            stiffness: 200
          });
        }
      });
    
    const itemAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: itemTranslateX.value }],
      height: itemHeight.value,
      opacity: itemOpacity.value,
      marginBottom: itemMargin.value
    }));
    
    return (
      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={[styles.notificationItem, itemAnimatedStyle]}>
          <TouchableOpacity
            style={styles.notificationContent}
            onPress={() => handleNotificationPress(item)}
            activeOpacity={0.7}
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
            <View style={styles.contentContainer}>
              <Text style={[
                styles.notificationTitle,
                !item.is_read && styles.unreadTitle
              ]}>
                {item.title}
              </Text>
              <Text style={styles.notificationMessage}>
                {item.content}
              </Text>
              <Text style={styles.notificationTimestamp}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    );
  };

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    display: panelVisible.value ? 'flex' : 'none',
  }));

  const panelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value }
    ],
    opacity: interpolate(
      translateX.value,
      [0, PANEL_WIDTH],
      [1, 0.5],
      Extrapolate.CLAMP
    ),
    display: panelVisible.value ? 'flex' : 'none',
  }));
  
  // Render notifications content
  const renderNotificationsContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchNotifications}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <>
        <View style={styles.headerAction}>
          {notifications.some(n => !n.is_read) && (
            <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
              <Check size={16} color="#0066CC" />
              <Text style={styles.markAllText}>Mark all as read</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationItem item={item} />}
          contentContainerStyle={styles.notificationsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Bell size={48} color="#666666" />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptyText}>
                We'll notify you when something important happens
              </Text>
            </View>
          }
        />
      </>
    );
  };

  return (
    <>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity 
          style={styles.backdropTouchable} 
          activeOpacity={1} 
          onPress={onClose} 
        />
      </Animated.View>

      <GestureHandlerRootView style={StyleSheet.absoluteFill}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.panel, panelStyle]}>
            <View style={styles.blurContainer}>
              <View style={styles.innerContainer}>
                <View style={styles.header}>
                  <View style={styles.headerTop}>
                    <Text style={styles.title}>Notifications</Text>
                    <TouchableOpacity 
                      style={styles.closeButton} 
                      onPress={onClose}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <X size={24} color="#333" />
                    </TouchableOpacity>
                  </View>
                  
                  {renderNotificationsContent()}
                </View>
              </View>
            </View>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 999,
  },
  backdropTouchable: {
    flex: 1,
  },
  panel: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: PANEL_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: 'transparent',
    zIndex: 1000,
    overflow: 'hidden',
  },
  blurContainer: {
    flex: 1,
    overflow: 'hidden',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  innerContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerAction: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    fontFamily: 'Inter_700Bold',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    borderRadius: 20,
  },
  markAllText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
    marginLeft: 4,
  },
  notificationsList: {
    paddingVertical: 10,
  },
  notificationItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden', // Important for animations
  },
  notificationContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  unreadIconContainer: {
    backgroundColor: '#E5F0FF',
  },
  contentContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#333',
    marginBottom: 4,
  },
  unreadTitle: {
    color: '#0066CC',
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    marginBottom: 4,
  },
  notificationTimestamp: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Inter_500Medium',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 16,
    fontFamily: 'Inter_500Medium',
  },
  retryButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default NotificationSlidingPanel; 