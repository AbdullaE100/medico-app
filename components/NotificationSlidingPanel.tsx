import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  FlatList,
  ActivityIndicator,
  SectionList
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
  UserCheck,
  AtSign,
  Heart,
  Users,
  CheckCircle,
  Trash2
} from 'lucide-react-native';
import { useNotificationsStore, NotificationType, Notification } from '@/stores/useNotificationsStore';
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
    // Network notifications
    case 'connection_request_received':
    case 'connection_request':
      return <UserPlus size={24} color={color} />;
      
    case 'connection_accepted':
      return <UserCheck size={24} color={color} />;
      
    case 'suggested_connection':
      return <Users size={24} color={color} />;
      
    // Forum notifications
    case 'post_reply':
    case 'comment':
      return <MessageSquare size={24} color={color} />;
      
    case 'post_mention':
    case 'mention':
      return <AtSign size={24} color={color} />;
      
    case 'post_like':
      return <Heart size={24} color={color} />;
      
    // Message notifications
    case 'direct_message':
    case 'message':
      return <MessageSquare size={24} color={color} />;
      
    // Legacy types
    case 'follow':
      return <UserPlus size={24} color={color} />;
      
    case 'ama_question':
      return <Bell size={24} color={color} />;
      
    default:
      return <Bell size={24} color={color} />;
  }
};

// Get appropriate background color for notification type
const getNotificationTypeColor = (type: NotificationType): string => {
  switch (type) {
    // Network notifications
    case 'connection_request_received':
    case 'connection_request':
    case 'connection_accepted':
    case 'suggested_connection':
    case 'follow':
      return '#8B5CF6'; // Purple for network notifications
      
    // Forum notifications
    case 'post_reply':
    case 'post_mention':
    case 'post_like':
    case 'comment':
    case 'mention':
      return '#0EA5E9'; // Blue for forum notifications
      
    // Message notifications
    case 'direct_message':
    case 'message':
      return '#10B981'; // Green for messages
      
    // Default
    default:
      return '#6B7280'; // Gray for other types
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
    markAllAsRead,
    deleteNotification,
    handleNotificationAction,
    getGroupedNotifications
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
  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Use the centralized notification action handler
    handleNotificationAction(notification);
    
    // Close the panel after handling
    onClose();
  };

  // Individual notification item with swipe-to-dismiss gesture
  const NotificationItem = ({ item }: { item: Notification }) => {
    const itemTranslateX = useSharedValue(0);
    const itemHeight = useSharedValue(90); // Slightly taller for better readability
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
    
    // Get appropriate background color
    const backgroundColor = getNotificationTypeColor(item.type);
    const isRead = item.is_read;
    
    return (
      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={[
          styles.notificationItem, 
          itemAnimatedStyle,
          isRead ? styles.notificationItemRead : null
        ]}>
          <TouchableOpacity
            style={styles.notificationContent}
            onPress={() => handleNotificationPress(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor }]}>
              <NotificationIcon 
                type={item.type} 
                color="#FFFFFF" 
              />
              {!isRead && <View style={styles.unreadDot} />}
            </View>
            <View style={styles.textContainer}>
              <Text 
                style={[styles.notificationTitle, isRead ? styles.readText : null]} 
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text 
                style={[styles.notificationMessage, isRead ? styles.readText : null]} 
                numberOfLines={2}
              >
                {item.content}
              </Text>
              <Text style={styles.notificationTime}>
                {formatTimeAgo(new Date(item.created_at))}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => deleteNotification(item.id)}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Trash2 size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    );
  };

  // Format time ago (e.g., "2 hours ago", "3 days ago")
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
    
    return date.toLocaleDateString();
  };

  const renderNotificationsContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.centeredText}>Loading notifications...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centeredContent}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchNotifications}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (notifications.length === 0) {
      return (
        <View style={styles.centeredContent}>
          <Bell size={40} color="#9CA3AF" />
          <Text style={[styles.centeredText, { marginTop: 16 }]}>
            No notifications yet
          </Text>
          <Text style={styles.subtleText}>
            We'll notify you when something happens
          </Text>
        </View>
      );
    }

    // Group notifications by date
    const groupedNotifications = getGroupedNotifications();
    const sections = [];
    
    if (groupedNotifications.today.length > 0) {
      sections.push({
        title: 'Today',
        data: groupedNotifications.today
      });
    }
    
    if (groupedNotifications.earlier.length > 0) {
      sections.push({
        title: 'Earlier',
        data: groupedNotifications.earlier
      });
    }

    return (
      <SectionList
        sections={sections}
        renderItem={({ item }) => <NotificationItem item={item} />}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={true}
        showsVerticalScrollIndicator={false}
      />
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
                  <Text style={styles.title}>Notifications</Text>
                  {notifications.length > 0 && (
                    <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
                      <CheckCircle size={18} color="#0066CC" />
                      <Text style={styles.markAllText}>Mark all as read</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <X size={24} color="#1F2937" />
                  </TouchableOpacity>
                </View>
                {renderNotificationsContent()}
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
  },
  markAllText: {
    fontSize: 14,
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
  sectionHeader: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  notificationItemRead: {
    backgroundColor: '#F9FAFB',
  },
  readText: {
    color: '#6B7280',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  centeredText: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 12,
  },
  subtleText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
});

export default NotificationSlidingPanel; 