import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter, usePathname, Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SplashScreen } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { View, StyleSheet, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Linking from 'expo-linking';
import { handleAuthRedirect } from '@/lib/supabase';
import { sessionManager } from '@/lib/sessionManager';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create our linking configuration for deep links
const linking = {
  prefixes: [
    // Consistent app scheme for OAuth - must match scheme in app.config.js
    'medico://',
    // Development URLs for testing
    'exp+medico://',
    'exp://localhost:8089/--',
    // External authorized domains
    'https://cslxbdtaxirqfozfvjhg.supabase.co',
    'https://auth.medico-app.com',
  ],
  config: {
    // Define screens for router
    screens: {
      // Auth paths
      '/(auth)/sign-in': 'sign-in',
      '/(auth)/sign-up': 'sign-up',
      '/(auth)/forgot-password': 'forgot-password',
      // OAuth redirect handler - critical for authentication
      '/auth/callback': 'auth/callback',
      '/auth/reset-password': 'auth/reset-password',
      // New dedicated password reset path
      '/password-actions/reset': 'password-actions/reset',
      // Other app screens
      '/home': 'home',
      '/profile': 'profile',
      '/onboarding': 'onboarding',
    },
  },
  // Subscribe to URL events to handle OAuth redirects
  async getInitialURL() {
    // First, check if the app was opened via a deep link
    const url = await Linking.getInitialURL();
    
    if (url != null) {
      console.log("App opened with URL:", url);
      
      // Check if this is a Supabase auth redirect
      if (url.includes('auth/callback') || url.includes('code=') || url.includes('type=recovery')) {
        console.log("Initial URL contains auth callback, code parameter, or recovery type");
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
      if (url.includes('auth/callback') || url.includes('code=') || url.includes('type=recovery') || url.includes('reset-password')) {
        console.log("URL event contains auth callback, code parameter, recovery type, or reset-password");
        
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
  const [isDisabled, setIsDisabled] = useState(false);
  
  // Add a ref to track if redirection has already been handled
  const redirectHandled = useRef(false);
  
  // Check if redirector is disabled (during Google auth)
  useEffect(() => {
    const checkIfDisabled = async () => {
      try {
        const disabled = await AsyncStorage.getItem('medico-disable-redirector');
        setIsDisabled(disabled === 'true');
      } catch (e) {
        console.error("Error checking redirector disabled state:", e);
      }
    };
    
    checkIfDisabled();
    // Set up interval to check regularly
    const interval = setInterval(checkIfDisabled, 1000);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    // Skip redirect during loading, if already handled, or if disabled
    if (isLoading || redirectHandled.current || isDisabled) {
      console.log("AuthRedirector: Skipping (isLoading:", isLoading, 
                  "redirectHandled:", redirectHandled.current,
                  "isDisabled:", isDisabled, ")");
      return;
    }
    
    console.log("AuthRedirector: Current path =", pathname, "isAuthenticated =", isAuthenticated);
    
    // Don't redirect if we're already on the correct path
    const isAuthPath = pathname.startsWith('/(auth)');
    const isRootPath = pathname === '/';
    const isOnboardingPath = pathname === '/onboarding';
    const isSignUpPath = pathname === '/sign-up';
    const isCallbackPath = pathname === '/auth/callback';
    
    // Add a small delay to ensure the authentication state is fully processed
    setTimeout(() => {
      // Allow navigation to sign-up even if not authenticated
      if (!isAuthenticated && !isAuthPath && !isRootPath && !isOnboardingPath && !isSignUpPath && !isCallbackPath) {
        console.log("AuthRedirector: Not authenticated, redirecting to sign-in");
        redirectHandled.current = true;
        router.replace('/(auth)/sign-in');
      } else if (isAuthenticated && isAuthPath) {
        console.log("AuthRedirector: Already authenticated, redirecting to home");
        redirectHandled.current = true;
        router.replace('/(tabs)');  // Changed from '/home' to '/(tabs)' to match the app's navigation structure
      }
    }, 300); // Short delay to ensure authentication state is settled
  }, [isAuthenticated, isLoading, pathname, isDisabled]);
  
  // Reset the redirect handled flag when pathname changes
  useEffect(() => {
    redirectHandled.current = false;
  }, [pathname]);
  
  if (isLoading) {
    return <LoadingOverlay message="Verifying account..." />;
  }
  
  return null;
}

export default function RootLayout() {
  useFrameworkReady();
  const checkAuth = useAuthStore(state => state.checkAuth);
  const router = useRouter();
  // Ref to prevent multiple auth checks
  const authCheckComplete = useRef(false);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Special handling for forced navigation from Google Sign-in
  useEffect(() => {
    const checkForForcedNavigation = async () => {
      try {
        const target = await AsyncStorage.getItem('medico-force-navigation');
        const timestamp = await AsyncStorage.getItem('medico-force-navigation-timestamp');
        
        if (target && timestamp) {
          // Only use the forced navigation if it was set recently (within last 30 seconds)
          const now = Date.now();
          const navTime = parseInt(timestamp, 10);
          
          if (now - navTime < 30000) { // 30 seconds
            console.log("RootLayout: Detected forced navigation request to", target);
            
            // Clear the forced navigation flags
            await AsyncStorage.removeItem('medico-force-navigation');
            await AsyncStorage.removeItem('medico-force-navigation-timestamp');
            
            // Try multiple navigation approaches with different timing
            // This maximizes our chances of hitting a timing window where navigation works
            
            console.log("RootLayout: Attempting multiple navigation methods to", target);
            
            // Method 1: Immediate navigation
            try {
              console.log("RootLayout: Immediate navigation attempt");
              router.replace(target as any);
            } catch (e) {
              console.error("RootLayout: Immediate navigation failed:", e);
            }
            
            // Method 2: Short delay navigation (300ms)
            setTimeout(() => {
              try {
                console.log("RootLayout: Short delay navigation attempt");
                router.replace(target as any);
              } catch (e) {
                console.error("RootLayout: Short delay navigation failed:", e);
              }
            }, 300);
            
            // Method 3: Medium delay navigation (800ms)
            setTimeout(() => {
              try {
                console.log("RootLayout: Medium delay navigation attempt");
                router.replace(target as any);
              } catch (e) {
                console.error("RootLayout: Medium delay navigation failed:", e);
              }
            }, 800);
            
            // Method 4: Longer delay navigation (1500ms)
            setTimeout(() => {
              try {
                console.log("RootLayout: Longer delay navigation attempt");
                router.replace(target as any);
              } catch (e) {
                console.error("RootLayout: Longer delay navigation failed:", e);
              }
            }, 1500);
            
            // Method 5: Use Linking API as a fallback
            setTimeout(() => {
              try {
                const url = Linking.createURL(target);
                console.log("RootLayout: Trying Linking API, URL:", url);
                Linking.openURL(url);
              } catch (e) {
                console.error("RootLayout: Linking API navigation failed:", e);
              }
            }, 1000);
          } else {
            // Clean up old navigation requests
            await AsyncStorage.removeItem('medico-force-navigation');
            await AsyncStorage.removeItem('medico-force-navigation-timestamp');
          }
        }
      } catch (e) {
        console.error("RootLayout: Error checking for forced navigation:", e);
      }
    };
    
    // Check immediately and then set up an interval to check regularly
    checkForForcedNavigation();
    const interval = setInterval(checkForForcedNavigation, 1000);
    
    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    // Start loading auth state immediately, but only once
    const loadAuth = async () => {
      if (authCheckComplete.current) {
        console.log("RootLayout: Auth check already completed, skipping");
        return;
      }
      
      try {
        console.log("RootLayout: Checking authentication status...");
        authCheckComplete.current = true;
        await checkAuth();
        console.log("RootLayout: Authentication check complete");
        
        // Check if we have a stored auth success flag from Google Sign-in
        const authSuccess = await AsyncStorage.getItem('medico-auth-success');
        if (authSuccess === 'true') {
          console.log("RootLayout: Detected stored auth success, navigating to home");
          
          // Clear the flag
          await AsyncStorage.removeItem('medico-auth-success');
          
          // Navigate to home screen
          setTimeout(() => {
            console.log("RootLayout: Executing navigation from stored auth success");
            router.replace('/(tabs)' as any);
          }, 500);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        authCheckComplete.current = false; // Reset on error to allow retry
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
        <LoadingOverlay message="Loading Medico..." />
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
        // Linking is automatically configured via the linking constant
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
        {/* Add a screen for password reset */}
        <Stack.Screen name="auth/reset-password" options={{ headerShown: false }} />
        {/* Add a dedicated screen for password reset deep links */}
        <Stack.Screen name="password-actions/reset" options={{ headerShown: false }} />
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