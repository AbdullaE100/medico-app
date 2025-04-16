import { create } from 'zustand';
import { 
  supabase, 
  handleAuthRedirect, 
  ensureOAuthState, 
  prepareBrowserForAuth, 
  createAndStoreOAuthState, 
  clearStoredOAuthState, 
  handlePKCEFlowStateError, 
  extractAuthCode, 
  preflightOAuthConnection, 
  getStoredOAuthState, 
  manuallyExchangeCodeForSession,
  generateAndStorePKCE,
  directTokenExchange
} from '@/lib/supabase';
import { sessionManager } from '@/lib/sessionManager';
import { User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  specialty?: string;
  bio?: string;
  years_experience?: number;
  rating?: number;
  patients_count?: number;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  currentUser: User | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signUp: (email: string, password: string, fullName: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: true,
  error: null,
  currentUser: null,
  profile: null,

  checkAuth: async () => {
    try {
      // Use sessionManager instead of direct supabase calls
      const { data: { session }, error: sessionError } = await sessionManager.getSession();
      if (sessionError) throw sessionError;
      
      if (!session) {
        console.log("checkAuth: No active session found, setting isAuthenticated to false");
        set({ isAuthenticated: false, isLoading: false, error: null, currentUser: null });
        return;
      }

      // Use sessionManager for getting user
      const { data: { user }, error: userError } = await sessionManager.getUser();
      if (userError) throw userError;
      
      const isAuth = !!user;
      console.log("checkAuth: Session found, setting isAuthenticated to", isAuth);
      
      set({ 
        isAuthenticated: isAuth, 
        currentUser: user || null,
        isLoading: false, 
        error: null 
      });
      
      // Load profile data if authenticated
      if (user) {
        await get().loadProfile();
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? `Authentication error: ${error.message}`
        : 'Failed to check authentication status. Please check your internet connection and try again.';
      console.error(errorMessage);
      set({ 
        isAuthenticated: false, 
        currentUser: null,
        isLoading: false,
        error: errorMessage
      });
    }
  },

  loadProfile: async () => {
    const { currentUser } = get();
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
        
      if (error) throw error;
      
      set({ profile: data });
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  },

  updateProfile: async (updates) => {
    const { currentUser } = get();
    if (!currentUser) return false;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);
        
      if (error) throw error;
      
      // Reload profile
      await get().loadProfile();
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log("useAuthStore: Attempting to sign in...");
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log("useAuthStore: Sign in response:", data ? "Data received" : "No data", error ? `Error: ${error.message}` : "No error");
      
      if (error) throw error;
      if (!data.user) throw new Error('User not found');
      
      console.log("useAuthStore: Authentication successful, setting isAuthenticated to true");
      set({ 
        isAuthenticated: true, 
        currentUser: data.user,
        error: null 
      });
      
      // Load profile data
      await get().loadProfile();
      
      // Added a second verification to ensure state was updated
      setTimeout(() => {
        const state = useAuthStore.getState();
        console.log("useAuthStore: Verification - isAuthenticated =", state.isAuthenticated);
      }, 100);
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in. Please try again.';
      console.error("useAuthStore: Sign in error:", errorMessage);
      set({ 
        error: errorMessage, 
        isAuthenticated: false,
        currentUser: null
      });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email: string, password: string, fullName: string) => {
    set({ isLoading: true, error: null });
    try {
      // Create auth account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      if (!data.user) throw new Error('Failed to create account');
      
      // Create profile with the full name
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        });
        
      if (profileError) throw profileError;
      
      set({ 
        isAuthenticated: true, 
        currentUser: data.user,
        error: null 
      });
      
      // Load profile data
      await get().loadProfile();
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign up. Please try again.';
      set({ 
        error: errorMessage, 
        isAuthenticated: false,
        currentUser: null
      });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log("useAuthStore: Signing out user");
      
      // First, clear any stored navigation or auth flags
      await AsyncStorage.removeItem('medico-auth-success');
      await AsyncStorage.removeItem('medico-auth-user-id');
      await AsyncStorage.removeItem('medico-force-navigation');
      await AsyncStorage.removeItem('medico-force-navigation-timestamp');
      
      // Try to sign out with Supabase
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.error("useAuthStore: Error during sign out:", error.message);
        throw error;
      }
      
      console.log("useAuthStore: Successfully signed out from Supabase");
      
      // Clear state in the store
      set({ 
        isAuthenticated: false, 
        currentUser: null,
        profile: null,
        error: null 
      });
      
      // Clean up any lingering auth tokens or state
      try {
        // Clear any auth-related items from AsyncStorage
        const keys = await AsyncStorage.getAllKeys();
        const authKeys = keys.filter(key => 
          key.includes('supabase') || 
          key.includes('token') || 
          key.includes('auth') || 
          key.includes('session') ||
          key.includes('oauth')
        );
        
        if (authKeys.length > 0) {
          console.log("useAuthStore: Cleaning up auth storage keys:", authKeys.length);
          await AsyncStorage.multiRemove(authKeys);
        }
      } catch (storageError) {
        console.error("useAuthStore: Error cleaning storage during signout:", storageError);
        // Continue despite storage cleaning errors
      }
      
      // Force navigation to sign-in screen
      try {
        console.log("useAuthStore: Setting up forced navigation to sign-in after signout");
        
        // Store target for forced navigation
        await AsyncStorage.setItem('medico-force-navigation', '/(auth)/sign-in');
        await AsyncStorage.setItem('medico-force-navigation-timestamp', Date.now().toString());
        
        // Method 1: Try router navigate
        try {
          const { router } = require('expo-router');
          console.log("useAuthStore: Directly navigating to sign-in after signout");
          
          // Multiple attempts with different timing
          setTimeout(() => router.replace('/(auth)/sign-in'), 300);
          setTimeout(() => router.replace('/(auth)/sign-in'), 800);
        } catch (routerError) {
          console.error("useAuthStore: Router navigation failed during signout:", routerError);
        }
        
        // Method 2: Try Linking API
        try {
          const Linking = require('expo-linking');
          setTimeout(() => {
            try {
              const url = Linking.createURL('/(auth)/sign-in');
              console.log("useAuthStore: Opening sign-in URL:", url);
              Linking.openURL(url);
            } catch (err) {
              console.error("useAuthStore: Error using Linking API during signout:", err);
            }
          }, 500);
        } catch (linkError) {
          console.error("useAuthStore: Linking import failed during signout:", linkError);
        }
      } catch (navError) {
        console.error("useAuthStore: Navigation error during signout:", navError);
      }
      
      console.log("useAuthStore: Sign out process completed");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out. Please try again.';
      console.error("useAuthStore: Sign out error:", errorMessage);
      set({ error: errorMessage });
      
      // Even if there's an error, try to force reset the auth state
      set({ 
        isAuthenticated: false, 
        currentUser: null,
        profile: null
      });
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log("useAuthStore: Starting Google sign-in with enhanced PKCE flow");
      
      // Temporarily disable AuthRedirector to prevent navigation conflicts
      await AsyncStorage.setItem('medico-disable-redirector', 'true');
      
      // Step 1: Thorough cleanup using optimized function
      await prepareBrowserForAuth();
      
      // Step 2: Generate our own PKCE parameters with multi-location storage
      const { codeVerifier, codeChallenge } = await generateAndStorePKCE();
      console.log("useAuthStore: Generated PKCE parameters");
      
      // Critical: Store code verifier in multiple places to ensure it survives the redirect
      await AsyncStorage.setItem('supabase.auth.token.code_verifier', codeVerifier);
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('supabase.auth.token.code_verifier', codeVerifier);
        }
      } catch (e) { /* ignore */ }
      
      try {
        await SecureStore.setItemAsync('supabase.auth.token.code_verifier', codeVerifier);
      } catch (e) { /* ignore */ }
      
      // Also store it in the Supabase client's PKCE expected location
      await AsyncStorage.setItem('medico-supabase-auth-code-verifier', codeVerifier);
      
      // Step 3: Generate auth URL with the consistent redirect
      const redirectUrl = 'medico://auth/callback';
      console.log("useAuthStore: Using redirect URL:", redirectUrl);
      
      // Step 4: Generate OAuth URL with our custom parameters
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true, // We handle the redirect manually
          queryParams: {
            // Request offline access for refresh token
            access_type: 'offline',
            prompt: 'consent',
            // Add our code challenge (not usually needed but adds robustness)
            code_challenge: codeChallenge,
            code_challenge_method: 'plain', // Simplified for compatibility
          },
        }
      });
      
      if (error) {
        console.error("useAuthStore: OAuth initialization error:", error.message);
        throw error;
      }
      
      if (!data?.url) {
        console.error("useAuthStore: No authorization URL returned");
        throw new Error("Failed to generate authorization URL");
      }
      
      console.log("useAuthStore: Opening OAuth URL in browser");
      
      // Step 5: Use WebBrowser with proper warm up
      await WebBrowser.warmUpAsync();
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl,
        {
          preferEphemeralSession: false,
          showInRecents: true,
          createTask: true
        }
      );
      
      console.log("useAuthStore: Browser session result type:", result.type);
      
      if (result.type === 'success' && result.url) {
        console.log("useAuthStore: Received redirect URL:", result.url);
        
        // Allow a small delay before processing the URL
        await new Promise(resolve => setTimeout(resolve, 300));
        
        try {
          // Extract the code for manual handling if needed
          const code = extractAuthCode(result.url);
          if (!code) {
            console.error("useAuthStore: No authorization code found in URL");
            throw new Error("No authorization code found in URL");
          }
          
          // Step 6: Multi-strategy auth flow
          
          // Strategy 1: Try handleAuthRedirect first (original approach)
          console.log("useAuthStore: Attempting standard code exchange");
          const redirectSuccess = await handleAuthRedirect(result.url);
          
          if (redirectSuccess) {
            console.log("useAuthStore: Standard code exchange successful");
            const { data: userData } = await supabase.auth.getUser();
            
            // Ensure authentication state is properly set
            if (userData?.user) {
              console.log("useAuthStore: Setting authenticated state with user:", userData.user.id);
              
              // Force successful auth to be stored in AsyncStorage for app to detect
              await AsyncStorage.setItem('medico-auth-success', 'true');
              await AsyncStorage.setItem('medico-auth-user-id', userData.user.id);
              
              // First set the auth state
              set({ 
                isAuthenticated: true, 
                currentUser: userData.user,
                error: null,
                isLoading: false // Make sure to set isLoading to false
              });
              
              // Force a session refresh to ensure it's recognized across the app
              await supabase.auth.refreshSession();
              
              await get().loadProfile();
              
              // Use a more aggressive approach to navigation
              try {
                // Store redirection target in AsyncStorage for _layout to pick up
                await AsyncStorage.setItem('medico-force-navigation', '/(tabs)');
                await AsyncStorage.setItem('medico-force-navigation-timestamp', Date.now().toString());
                
                // Use multiple navigation approaches to ensure one works
                // 1. Direct require of expo-router
                try {
                  const { router } = require('expo-router');
                  console.log("useAuthStore: Directly navigating to home screen via require");
                  
                  // Use multiple delays to try to hit the right timing window
                  setTimeout(() => router.replace('/(tabs)'), 300);
                  setTimeout(() => router.replace('/(tabs)'), 800);
                  setTimeout(() => router.replace('/(tabs)'), 1500);
                } catch (navError) {
                  console.error("useAuthStore: Navigation via require failed:", navError);
                }
                
                // 2. Also try the Linking API as a backup
                try {
                  const Linking = require('expo-linking');
                  console.log("useAuthStore: Trying navigation via Linking API");
                  setTimeout(() => {
                    try {
                      // Create the URL for the app's internal route
                      const url = Linking.createURL('/(tabs)');
                      console.log("useAuthStore: Opening internal URL:", url);
                      // Open the URL in the app
                      Linking.openURL(url);
                    } catch (err) {
                      console.error("useAuthStore: Error using Linking API:", err);
                    }
                  }, 1000);
                } catch (linkError) {
                  console.error("useAuthStore: Linking navigation failed:", linkError);
                }
                
              } catch (navError) {
                console.error("useAuthStore: All navigation attempts failed:", navError);
              }
              
              // Notify that we've been authenticated
              console.log("useAuthStore: Authentication complete, isAuthenticated =", true);
              
              return true;
            }
          }
          
          // Strategy 2: Direct token exchange with our stored verifier
          console.log("useAuthStore: Standard exchange failed, trying direct token exchange");
          const directSuccess = await directTokenExchange(code, codeVerifier);
          
          if (directSuccess) {
            console.log("useAuthStore: Direct token exchange successful");
            // Trigger a session refresh in the client
            await supabase.auth.refreshSession();
            
            const { data: userData } = await supabase.auth.getUser();
            set({ 
              isAuthenticated: true, 
              currentUser: userData.user,
              error: null,
              isLoading: false
            });
            
            await get().loadProfile();
            
            // Update AsyncStorage for forced navigation fallback
            await AsyncStorage.setItem('medico-auth-success', 'true');
            await AsyncStorage.setItem('medico-force-navigation', '/(tabs)');
            await AsyncStorage.setItem('medico-force-navigation-timestamp', Date.now().toString());
            
            // Directly navigate to home screen
            try {
              // Method 1: Try router navigate
              try {
                const { router } = require('expo-router');
                console.log("useAuthStore: Directly navigating to home screen after direct token exchange");
                setTimeout(() => {
                  router.replace('/(tabs)');
                }, 500);
              } catch (routerError) {
                console.error("useAuthStore: Router navigation failed:", routerError);
              }
              
              // Method 2: Try Linking API
              try {
                const Linking = require('expo-linking');
                setTimeout(() => {
                  try {
                    const url = Linking.createURL('/(tabs)');
                    console.log("useAuthStore: Opening internal URL:", url);
                    Linking.openURL(url);
                  } catch (err) {
                    console.error("useAuthStore: Error using Linking API:", err);
                  }
                }, 1000);
              } catch (linkError) {
                console.error("useAuthStore: Linking import failed:", linkError);
              }
            } catch (navError) {
              console.error("useAuthStore: Navigation error:", navError);
            }
            
            return true;
          }
          
          // Strategy 3: Advanced PKCE flow error recovery
          console.log("useAuthStore: Direct exchange failed, using advanced recovery");
          const recoverySuccess = await handlePKCEFlowStateError(code);
          
          if (recoverySuccess) {
            console.log("useAuthStore: Recovery successful");
            const { data: userData } = await supabase.auth.getUser();
            
            set({ 
              isAuthenticated: true, 
              currentUser: userData.user,
              error: null,
              isLoading: false
            });
            
            await get().loadProfile();
            
            // Update AsyncStorage for forced navigation fallback
            await AsyncStorage.setItem('medico-auth-success', 'true');
            await AsyncStorage.setItem('medico-force-navigation', '/(tabs)');
            await AsyncStorage.setItem('medico-force-navigation-timestamp', Date.now().toString());
            
            // Directly navigate to home screen
            try {
              // Method 1: Try router navigate
              try {
                const { router } = require('expo-router');
                console.log("useAuthStore: Directly navigating to home screen after recovery");
                setTimeout(() => {
                  router.replace('/(tabs)');
                }, 500);
              } catch (routerError) {
                console.error("useAuthStore: Router navigation failed:", routerError);
              }
              
              // Method 2: Try Linking API
              try {
                const Linking = require('expo-linking');
                setTimeout(() => {
                  try {
                    const url = Linking.createURL('/(tabs)');
                    console.log("useAuthStore: Opening internal URL:", url);
                    Linking.openURL(url);
                  } catch (err) {
                    console.error("useAuthStore: Error using Linking API:", err);
                  }
                }, 1000);
              } catch (linkError) {
                console.error("useAuthStore: Linking import failed:", linkError);
              }
            } catch (navError) {
              console.error("useAuthStore: Navigation error:", navError);
            }
            
            return true;
          }
          
          // If all strategies failed, throw an error
          throw new Error("All authentication strategies failed");
        } catch (exchangeError) {
          console.error("useAuthStore: Error during authentication:", 
            exchangeError instanceof Error ? exchangeError.message : exchangeError);
          
          // Last resort - check if we got authenticated anyway
          const { data: finalCheckSession } = await supabase.auth.getSession();
          if (finalCheckSession && finalCheckSession.session) {
            console.log("useAuthStore: Found session in final check");
            const { data: userData } = await supabase.auth.getUser();
            if (userData && userData.user) {
          set({ 
            isAuthenticated: true, 
            currentUser: userData.user,
                error: null,
                isLoading: false
              });
              await get().loadProfile();
              
              // Update AsyncStorage for forced navigation fallback
              await AsyncStorage.setItem('medico-auth-success', 'true');
              await AsyncStorage.setItem('medico-force-navigation', '/(tabs)');
              await AsyncStorage.setItem('medico-force-navigation-timestamp', Date.now().toString());
              
              // Directly navigate to home screen as a last resort
              try {
                // Method 1: Try router navigate
                try {
                  const { router } = require('expo-router');
                  console.log("useAuthStore: Directly navigating to home screen after final session check");
                  setTimeout(() => {
                    router.replace('/(tabs)');
                  }, 500);
                } catch (routerError) {
                  console.error("useAuthStore: Router navigation failed:", routerError);
                }
                
                // Method 2: Try Linking API
                try {
                  const Linking = require('expo-linking');
                  setTimeout(() => {
                    try {
                      const url = Linking.createURL('/(tabs)');
                      console.log("useAuthStore: Opening internal URL:", url);
                      Linking.openURL(url);
                    } catch (err) {
                      console.error("useAuthStore: Error using Linking API:", err);
                    }
                  }, 1000);
                } catch (linkError) {
                  console.error("useAuthStore: Linking import failed:", linkError);
                }
              } catch (navError) {
                console.error("useAuthStore: Navigation error:", navError);
              }
              
              return true;
            }
          }
          
          throw exchangeError;
        }
      } else if (result.type === 'cancel') {
        console.log("useAuthStore: User cancelled the authentication");
        throw new Error('Authentication was cancelled');
      } else {
        console.error("useAuthStore: Unexpected browser result type:", result.type);
        throw new Error(`Authentication failed with unexpected result: ${result.type}`);
      }
    } catch (error) {
      let errorMessage = 'Failed to sign in with Google';
      
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
        console.error("useAuthStore: Google sign-in error:", error.message);
      } else {
        console.error("useAuthStore: Google sign-in error (unknown):", error);
      }
      
      // Double-check if we're actually authenticated despite errors
      try {
        const { data: finalSession } = await supabase.auth.getSession();
        if (finalSession.session) {
          console.log("useAuthStore: Found valid session despite errors, authentication successful");
          const { data: user } = await supabase.auth.getUser();
          if (user) {
            set({ 
              isAuthenticated: true, 
              currentUser: user.user,
              error: null
            });
            await get().loadProfile();
            return true;
          }
        }
      } catch (finalCheckError) {
        // Ignore errors in final check
      }
      
      set({ 
        error: errorMessage, 
        isAuthenticated: false,
        currentUser: null
      });
      return false;
    } finally {
      set({ isLoading: false });
      // Re-enable AuthRedirector
      await AsyncStorage.removeItem('medico-disable-redirector');
    }
  },
}));

/**
 * Store OAuth state parameter securely if not already imported
 */
const storeOAuthState = async (state: string): Promise<void> => {
  try {
    // Store in both AsyncStorage (for redundancy) and global variable
    await AsyncStorage.setItem('medico-oauth-state', state);
    global._oauthState = state;
    console.log("OAuth state stored:", state.substring(0, 5) + '...');
  } catch (error) {
    console.error("Error storing OAuth state:", error);
  }
};