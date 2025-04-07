import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ForumNotifications } from '@/components/ForumNotifications';
import { useAuthStore } from '@/stores/useAuthStore';

export default function NotificationsScreen() {
  const router = useRouter();
  const { currentUser, isAuthenticated } = useAuthStore();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      router.replace('/sign-in');
    }
  }, [isAuthenticated, currentUser]);

  if (!isAuthenticated || !currentUser) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ForumNotifications />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
}); 