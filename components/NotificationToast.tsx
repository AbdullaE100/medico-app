import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  Easing,
  runOnJS
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Bell, MessageSquare, Heart, AtSign, Users, UserPlus, UserCheck } from 'lucide-react-native';
import { NotificationType } from '@/stores/useNotificationsStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOAST_WIDTH = SCREEN_WIDTH - 32;

interface NotificationToastProps {
  title: string;
  message: string;
  type: NotificationType;
  data: Record<string, any>;
  onDismiss: () => void;
}

const NotificationIcon = ({ type }: { type: NotificationType }) => {
  const iconProps = { size: 20, color: '#FFFFFF' };
  
  switch (type) {
    case 'connection_request_received':
    case 'connection_request':
      return <UserPlus {...iconProps} />;
      
    case 'connection_accepted':
      return <UserCheck {...iconProps} />;
      
    case 'suggested_connection':
      return <Users {...iconProps} />;
      
    case 'post_reply':
    case 'comment':
      return <MessageSquare {...iconProps} />;
      
    case 'post_mention':
    case 'mention':
      return <AtSign {...iconProps} />;
      
    case 'post_like':
      return <Heart {...iconProps} />;
      
    case 'direct_message':
    case 'message':
      return <MessageSquare {...iconProps} />;
      
    default:
      return <Bell {...iconProps} />;
  }
};

const NotificationToast: React.FC<NotificationToastProps> = ({
  title,
  message,
  type,
  data,
  onDismiss
}) => {
  const router = useRouter();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const timeout = useRef<NodeJS.Timeout | null>(null);
  
  // Determine icon background color based on notification type
  const getBackgroundColor = (): string => {
    switch (type) {
      case 'connection_request_received':
      case 'connection_request':
      case 'connection_accepted':
      case 'suggested_connection':
        return '#8B5CF6'; // Purple for network notifications
        
      case 'post_reply':
      case 'post_mention':
      case 'post_like':
      case 'comment':
      case 'mention':
        return '#0EA5E9'; // Blue for forum notifications
        
      case 'direct_message':
      case 'message':
        return '#10B981'; // Green for messages
        
      default:
        return '#0066CC'; // Default blue
    }
  };
  
  // Show toast when component mounts
  useEffect(() => {
    // Animate in
    translateY.value = withSpring(0, { 
      damping: 15, 
      stiffness: 120 
    });
    opacity.value = withSpring(1);
    scale.value = withSpring(1, { 
      damping: 15, 
      stiffness: 120 
    });
    
    // Auto dismiss after 4 seconds
    timeout.current = setTimeout(() => {
      handleDismiss();
    }, 4000);
    
    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);
  
  // Handle dismiss
  const handleDismiss = () => {
    // Animate out
    translateY.value = withTiming(-100, { 
      duration: 300, 
      easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
    });
    opacity.value = withTiming(0, { 
      duration: 250 
    });
    scale.value = withTiming(0.9, { 
      duration: 250 
    }, () => {
      // Call onDismiss callback after animation is complete
      onDismiss();
    });
  };
  
  // Handle press
  const handlePress = () => {
    handleDismiss();
    
    // Navigate based on notification type
    switch (type) {
      case 'connection_request_received':
      case 'connection_request':
        router.push('/network');
        break;
        
      case 'connection_accepted':
      case 'suggested_connection':
        router.push('/network');
        break;
        
      case 'post_reply':
      case 'comment':
      case 'post_mention':
      case 'mention':
      case 'post_like':
        if (data.discussion_id) {
          router.push({
            pathname: '/discussions/[id]',
            params: { id: data.discussion_id }
          });
        } else {
          router.push('/discussions');
        }
        break;
        
      case 'direct_message':
      case 'message':
        if (data.chat_id) {
          router.push({
            pathname: '/chat/[id]',
            params: { id: data.chat_id }
          });
        } else {
          router.push('/chat');
        }
        break;
        
      default:
        router.push('/notifications');
    }
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
    opacity: opacity.value
  }));
  
  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity 
        style={[styles.content, { backgroundColor: getBackgroundColor() }]} 
        activeOpacity={0.9}
        onPress={handlePress}
      >
        <View style={styles.iconContainer}>
          <NotificationIcon type={type} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.dismissButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    alignSelf: 'center',
    width: TOAST_WIDTH,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  message: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  dismissButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  }
});

export default NotificationToast; 