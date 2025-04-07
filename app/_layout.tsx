import { useEffect } from 'react';
import { Stack, useRouter, usePathname, Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SplashScreen } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Linking from 'expo-linking';
import { handleAuthRedirect } from '@/lib/supabase';

// Create our linking configuration for deep links
const linking = {
  prefixes: [
    // Prefix for the native app's deep link scheme
    'medico-app://',
    'medico://',
    // Development Expo URL schemes
    'exp://192.168.1.109:8090/--',
    'exp://localhost:8089/--',
    // Production URL schemes
    'https://cslxbdtaxirqfozfvjhg.supabase.co',
  ],
  config: {
    // Define screens for router
    screens: {
      // Auth paths
      '/(auth)/sign-in': 'sign-in',
      '/(auth)/sign-up': 'sign-up',
      // OAuth redirect handler
      '/auth/callback': 'auth/callback',
    },
  },
  // Subscribe to URL events to handle OAuth redirects
  async getInitialURL() {
    // First, check if the app was opened via a deep link
    const url = await Linking.getInitialURL();
    
    if (url != null) {
      console.log("App opened with URL:", url);
      
      // Check if this is a Supabase auth redirect
      if (url.includes('auth/callback') || url.includes('code=')) {
        console.log("Initial URL contains auth callback or code parameter");
        try {
          // Process the OAuth callback
          const success = await handleAuthRedirect(url);
          console.log("Initial auth redirect processed:", success);
        } catch (error) {
          console.error("Error processing initial auth redirect:", error);
        }
      }
    }
    
    return url;
  },
  // Subscribe to new URLs coming in
  subscribe(listener: (url: string) => void) {
    console.log("Setting up URL event listener");
    
    // Listen to incoming links
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log("New URL event:", url);
      
      // Handle auth redirects
      if (url.includes('auth/callback') || url.includes('code=')) {
        console.log("URL event contains auth callback or code parameter");
        
        // Let the router know about this URL to trigger navigation
        listener(url);
        
        // Additionally process auth code for token exchange
        setTimeout(() => {
          handleAuthRedirect(url)
            .then(success => {
              console.log("Auth redirect processed from URL event:", success);
            })
            .catch(error => {
              console.error("Error processing auth redirect from URL event:", error);
            });
        }, 100);
      } else {
        // For non-auth URLs, just notify the listener
        listener(url);
      }
    });
    
    return () => {
      // Clean up the event listener when the component unmounts
      console.log("Removing URL event listener");
      subscription.remove();
    };
  },
};

// Add this component to handle redirects based on auth state
function AuthRedirector() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    // Skip redirect during loading
    if (isLoading) return;
    
    console.log("AuthRedirector: Current path =", pathname, "isAuthenticated =", isAuthenticated);
    
    // Don't redirect if we're already on the correct path
    const isAuthPath = pathname.startsWith('/(auth)');
    const isRootPath = pathname === '/';
    const isOnboardingPath = pathname === '/onboarding';
    const isSignUpPath = pathname === '/sign-up';
    
    // Allow navigation to sign-up even if not authenticated
    if (!isAuthenticated && !isAuthPath && !isRootPath && !isOnboardingPath && !isSignUpPath) {
      console.log("AuthRedirector: Not authenticated, redirecting to sign-in");
      router.replace('/(auth)/sign-in');
    } else if (isAuthenticated && isAuthPath && pathname !== '/sign-up') {
      console.log("AuthRedirector: Already authenticated, redirecting to home");
      router.replace('/home');
    }
  }, [isAuthenticated, isLoading, pathname]);
  
  return null;
}

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
        console.log("RootLayout: Checking authentication status...");
        await checkAuth();
        console.log("RootLayout: Authentication check complete");
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
      <AuthRedirector />
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
        }}
        // Add the linking configuration for deep links
        linking={linking}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen name="sign-up" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        {/* Add a screen for handling OAuth redirects */}
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
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