import { create } from 'zustand';
import { supabase, handleAuthRedirect, ensureOAuthState, prepareBrowserForAuth } from '@/lib/supabase';
import { sessionManager } from '@/lib/sessionManager';
import { User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

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
        set({ isAuthenticated: false, isLoading: false, error: null, currentUser: null });
        return;
      }

      // Use sessionManager for getting user
      const { data: { user }, error: userError } = await sessionManager.getUser();
      if (userError) throw userError;
      
      set({ 
        isAuthenticated: !!user, 
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ 
        isAuthenticated: false, 
        currentUser: null,
        profile: null,
        error: null 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out. Please try again.';
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log("useAuthStore: Attempting to sign in with Google...");
      
      // Prepare browser for authentication by clearing sessions
      await prepareBrowserForAuth();
      
      // Generate a more secure random state parameter
      const randomBytes = new Uint8Array(16);
      for (let i = 0; i < 16; i++) {
        randomBytes[i] = Math.floor(Math.random() * 256);
      }
      const state = Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // Store the state in global variable
      global._oauthState = state;
      console.log("useAuthStore: Generated OAuth state:", state.substring(0, 6) + '...');
      
      // Define all possible redirect URLs
      const redirectUrls = {
        ios: 'medico-app://auth/callback',
        android: 'exp://192.168.1.109:8090/--/auth/callback',
        web: 'https://cslxbdtaxirqfozfvjhg.supabase.co/auth/v1/callback',
        expo: 'exp://localhost:8089/--/auth/callback'
      };
      
      // Select the appropriate redirect URL based on platform
      const redirectUrl = Platform.select({
        ios: redirectUrls.ios,
        android: redirectUrls.android,
        web: redirectUrls.web,
        default: redirectUrls.expo
      });
      
      console.log("useAuthStore: Using redirect URL:", redirectUrl);
      
      // Initiate the OAuth flow with Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            state: state, // Pass the state parameter directly to Supabase
          },
          scopes: 'email profile',
          skipBrowserRedirect: true, // Important for mobile flow
        }
      });
      
      if (error) throw error;
      
      if (!data?.url) {
        throw new Error('No authentication URL returned from Supabase');
      }
      
      console.log("useAuthStore: OAuth URL received, length:", data.url.length);
      
      // Ensure the URL has our state parameter
      const authUrl = ensureOAuthState(data.url, state);
      
      console.log("useAuthStore: Opening auth session in browser...");
      
      // Clear any existing sessions
      await WebBrowser.maybeCompleteAuthSession();
      
      // Open the authentication URL in a browser
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUrl,
        {
          showInRecents: true,
          createTask: true,
        }
      );
      
      console.log("useAuthStore: Browser auth result type:", result.type);
      
      if (result.type === 'success' && result.url) {
        console.log("useAuthStore: Auth redirect successful, processing URL");
        
        try {
          // Handle the redirect URL
          const authSuccess = await handleAuthRedirect(result.url);
          
          if (authSuccess) {
            console.log("useAuthStore: OAuth authentication successful");
            
            // Fetch fresh user data
            const { data: { user }, error: userError } = await sessionManager.getUser();
            if (userError) throw userError;
            
            if (user) {
              console.log("useAuthStore: User authenticated:", user.id);
              set({ 
                isAuthenticated: true, 
                currentUser: user,
                error: null
              });
              
              // Load profile data
              await get().loadProfile();
              
              return true;
            } else {
              throw new Error('No user returned after successful authentication');
            }
          } else {
            console.error("useAuthStore: Auth redirect processed but no success");
            throw new Error('Authentication redirect failed');
          }
        } catch (redirectError) {
          console.error("useAuthStore: Error handling redirect:", redirectError);
          throw redirectError;
        }
      } else if (result.type === 'cancel') {
        console.log("useAuthStore: Auth session was cancelled by user");
        throw new Error('Authentication was cancelled by the user');
      } else {
        console.error("useAuthStore: Unexpected auth result type:", result.type);
        throw new Error('Authentication failed with unexpected result');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in with Google. Please try again.';
      console.error("useAuthStore: Google sign in error:", errorMessage);
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
}));