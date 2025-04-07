import { Stack } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';

export default function ForumLayout() {
  const navigation = useNavigation();

  // Ensure consistent navigation styling
  useEffect(() => {
    navigation.setOptions({
      headerShown: false
    });
  }, [navigation]);

  return (
    <Stack 
      screenOptions={{ 
        animation: 'slide_from_right',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTitleStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 18,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: '#F8F9FA',
        }
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Medical Forum',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: 'Discussion',
          headerBackTitle: 'Forum' 
        }} 
      />
      <Stack.Screen 
        name="create" 
        options={{ 
          title: 'New Post', 
          presentation: 'modal',
          headerBackTitle: 'Cancel'
        }} 
      />
      <Stack.Screen 
        name="topic/[slug]" 
        options={{ 
          title: 'Topic',
          headerBackTitle: 'Forum' 
        }} 
      />
      <Stack.Screen 
        name="trending" 
        options={{ 
          title: 'Trending',
          headerBackTitle: 'Forum' 
        }} 
      />
      <Stack.Screen 
        name="topics" 
        options={{ 
          title: 'All Topics',
          headerBackTitle: 'Forum' 
        }} 
      />
      <Stack.Screen 
        name="saved" 
        options={{ 
          title: 'Saved Posts',
          headerBackTitle: 'Forum' 
        }} 
      />
    </Stack>
  );
}