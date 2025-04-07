import { Stack } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';

export default function HomeStack() {
  const navigation = useNavigation();

  // Hide header for all screens in the home stack
  useEffect(() => {
    navigation.setOptions({
      headerShown: false
    });
  }, [navigation]);

  return (
    <Stack screenOptions={{ 
      headerShown: false,
      animation: 'slide_from_right' 
    }}>
      <Stack.Screen
        name="index"
        options={{
          title: "",
          headerShown: false
        }}
      />
      <Stack.Screen
        name="post/[id]"
        options={{
          title: "Post",
          headerShown: true,
          presentation: 'card'
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: "New Post",
          headerShown: true,
          presentation: 'modal'
        }}
      />
    </Stack>
  );
}