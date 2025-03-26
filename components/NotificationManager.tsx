import React, { useEffect, useState, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useNotificationsStore, Notification } from '@/stores/useNotificationsStore';
import { supabase } from '@/lib/supabase';
import NotificationToast from './NotificationToast';

// Configure notifications to show when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false, // We'll use our own in-app notification
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NotificationManager: React.FC = () => {
  const { subscribeToNotifications, unsubscribeFromNotifications } = useNotificationsStore();
  const [activeToast, setActiveToast] = useState<Notification | null>(null);
  const [showToast, setShowToast] = useState(false);
  const appState = useRef(AppState.currentState);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  // Setup push notifications
  useEffect(() => {
    registerForPushNotifications();
    
    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      const notificationData = notification.request.content.data as Notification;
      if (appState.current === 'active') {
        // Show in-app toast for foreground notifications
        handleInAppNotification(notificationData);
      }
    });
    
    // Listen for notification interactions
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      // Handle notification interaction here if needed
    });
    
    // Listen to app state changes to handle becoming active
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Subscribe to real-time notifications from Supabase
    subscribeToNotifications();
    
    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
      subscription.remove();
      unsubscribeFromNotifications();
    };
  }, []);
  
  // Handle app state changes
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current === 'background' && nextAppState === 'active') {
      // App has come to the foreground, clear badge count
      Notifications.setBadgeCountAsync(0);
    }
    
    appState.current = nextAppState;
  };
  
  // Register for push notifications
  const registerForPushNotifications = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0066CC',
      });
    }
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo push token:', token);
    
    // Save token to user record in Supabase
    saveTokenToDatabase(token);
  };
  
  // Save token to database
  const saveTokenToDatabase = async (token: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      await supabase
        .from('user_push_tokens')
        .upsert({
          user_id: user.id,
          push_token: token,
          device_type: Platform.OS,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  };
  
  // Handle in-app notification toast
  const handleInAppNotification = (notification: Notification) => {
    setActiveToast(notification);
    setShowToast(true);
  };
  
  // Dismiss toast
  const dismissToast = () => {
    setShowToast(false);
    setActiveToast(null);
  };
  
  // Listen for real-time notifications from Supabase
  useEffect(() => {
    const subscription = supabase
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
          handleInAppNotification(newNotification);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);
  
  if (showToast && activeToast) {
    return (
      <NotificationToast 
        title={activeToast.title}
        message={activeToast.content}
        type={activeToast.type}
        data={activeToast.data}
        onDismiss={dismissToast}
      />
    );
  }
  
  return null;
};

export default NotificationManager; 