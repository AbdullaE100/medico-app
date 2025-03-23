import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SplashScreen } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  useFrameworkReady();
  const checkAuth = useAuthStore(state => state.checkAuth);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    // Start loading auth state immediately
    const loadAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };
    loadAuth();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide splash screen with a minimum delay for smooth transition
      const minDelay = new Promise(resolve => setTimeout(resolve, 300));
      Promise.all([minDelay]).then(() => {
        SplashScreen.hideAsync();
      });
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack 
        screenOptions={{ 
          headerShown: false,
          // Optimize animations
          animation: Platform.select({
            web: 'none', // Disable animations on web for better performance
            default: 'slide_from_right'
          }),
          // Reduce animation duration
          animationDuration: 200,
          // Prevent unnecessary renders
          freezeOnBlur: true,
          // Improve memory usage
          unmountOnBlur: true,
        }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});