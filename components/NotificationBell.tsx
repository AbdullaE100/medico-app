import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  TouchableOpacity, 
  View, 
  StyleSheet, 
  Platform, 
  Animated,
  Dimensions
} from 'react-native';
import { Bell } from 'lucide-react-native';
import { useNotificationsStore } from '@/stores/useNotificationsStore';
import NotificationSlidingPanel from '@/components/NotificationSlidingPanel';

const { width } = Dimensions.get('window');

// Track whether the panel is currently visible across app instances
let isPanelVisibleGlobal = false;

interface NotificationBellProps {
  inHeader?: boolean; // If true, renders just the icon for injection into existing headers
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ inHeader = false }) => {
  const { unreadCount, fetchNotifications } = useNotificationsStore();
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;
  
  // Effect to handle initial animation
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Fetch notifications on mount
    fetchNotifications();
  }, []);
  
  const handleNotificationPress = useCallback(() => {
    if (isPanelVisibleGlobal) return;
    
    isPanelVisibleGlobal = true;
    setIsPanelVisible(true);
    
    // Animate the bell icon when pressed
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(animatedValue, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);
  
  const handleClosePanel = useCallback(() => {
    isPanelVisibleGlobal = false;
    setIsPanelVisible(false);
  }, []);
  
  // Derived animated styles
  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });
  
  const scale = animatedValue.interpolate({
    inputRange: [0, 0.92, 1],
    outputRange: [0.8, 0.92, 1],
    extrapolate: 'clamp'
  });

  // If this component is being used inside an existing header
  if (inHeader) {
    return (
      <>
        <Animated.View style={[
          styles.iconContainerInline,
          {
            opacity,
            transform: [{ scale }]
          }
        ]}>
          <TouchableOpacity
            onPress={handleNotificationPress}
            style={styles.iconButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.iconBackground}>
              <Bell size={22} color="#FFFFFF" />
              {unreadCount > 0 && (
                <View style={styles.badge} />
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>

        {isPanelVisible && (
          <NotificationSlidingPanel 
            isVisible={isPanelVisible}
            onClose={handleClosePanel}
          />
        )}
      </>
    );
  }

  // If this component is a standalone header
  return (
    <>
      <View style={styles.container}>
        <Animated.View style={[
          styles.iconContainer,
          {
            opacity,
            transform: [{ scale }]
          }
        ]}>
          <TouchableOpacity
            onPress={handleNotificationPress}
            style={styles.iconButton}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <View style={styles.iconBackground}>
              <Bell size={22} color="#FFFFFF" />
              {unreadCount > 0 && (
                <View style={styles.badge} />
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
      
      {isPanelVisible && (
        <NotificationSlidingPanel 
          isVisible={isPanelVisible}
          onClose={handleClosePanel}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 24,
    right: 16,
    zIndex: 100,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  iconContainerInline: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  iconButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
    borderWidth: 1,
    borderColor: 'white',
  }
});

export default NotificationBell; 