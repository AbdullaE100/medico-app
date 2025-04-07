import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';

export default function AuthLayout() {
  console.log("Auth layout mounted");
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 200,
      }}
    >
      <Stack.Screen name="sign-in" />
      <Stack.Screen 
        name="sign-up" 
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}