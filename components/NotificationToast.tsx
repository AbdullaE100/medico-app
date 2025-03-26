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
import { Bell, MessageSquare, UserPlus, AtSign, MessageCircle, BrainCircuit } from 'lucide-react-native';
import { NotificationType } from '@/stores/useNotificationsStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOAST_WIDTH = SCREEN_WIDTH - 32;

interface NotificationToastProps {
  title: string;
  message: string;
  type: NotificationType;
  data?: Record<string, any>;
  onDismiss: () => void;
  autoDismiss?: boolean;
  dismissDuration?: number;
}

const NotificationIcon = ({ type }: { type: NotificationType }) => {
  switch (type) {
    case 'message':
      return <MessageSquare size={20} color="#FFFFFF" />;
    case 'follow':
      return <UserPlus size={20} color="#FFFFFF" />;
    case 'mention':
      return <AtSign size={20} color="#FFFFFF" />;
    case 'comment':
      return <MessageCircle size={20} color="#FFFFFF" />;
    case 'ama_question':
      return <BrainCircuit size={20} color="#FFFFFF" />;
    case 'connection_request':
      return <UserPlus size={20} color="#FFFFFF" />;
    default:
      return <Bell size={20} color="#FFFFFF" />;
  }
};

const NotificationToast: React.FC<NotificationToastProps> = ({
  title,
  message,
  type,
  data = {},
  onDismiss,
  autoDismiss = true,
  dismissDuration = 4000
}) => {
  const router = useRouter();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  
  // Handle auto dismiss
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
    
    // Auto dismiss if enabled
    if (autoDismiss) {
      const dismissTimer = setTimeout(() => {
        dismiss();
      }, dismissDuration);
      
      return () => clearTimeout(dismissTimer);
    }
  }, []);
  
  const dismiss = () => {
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
      runOnJS(onDismiss)();
    });
  };
  
  const handlePress = () => {
    dismiss();
    
    // Navigate based on notification type
    switch (type) {
      case 'message':
        router.push(`/chat/${data.chat_id}`);
        break;
      case 'follow':
        router.push(`/network/doctor/${data.follower_id}`);
        break;
      case 'mention':
        router.push(`/discussions/${data.discussion_id}`);
        break;
      case 'comment':
        router.push(`/discussions/${data.discussion_id}`);
        break;
      case 'ama_question':
        router.push(`/discussions/${data.ama_id}`);
        break;
      case 'connection_request':
        router.push('/network');
        break;
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
        style={styles.content} 
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
          onPress={dismiss}
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
    backgroundColor: '#333333',
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