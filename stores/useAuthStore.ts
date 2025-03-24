import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, fullName: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  error: null,

  checkAuth: async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      if (!session) {
        set({ isAuthenticated: false, isLoading: false, error: null });
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      set({ isAuthenticated: !!user, isLoading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error
        ? `Authentication error: ${error.message}`
        : 'Failed to check authentication status. Please check your internet connection and try again.';
      console.error(errorMessage);
      set({ 
        isAuthenticated: false, 
        isLoading: false,
        error: errorMessage
      });
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
      set({ isAuthenticated: true, error: null });
      
      // Added a second verification to ensure state was updated
      setTimeout(() => {
        const state = useAuthStore.getState();
        console.log("useAuthStore: Verification - isAuthenticated =", state.isAuthenticated);
      }, 100);
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in. Please try again.';
      console.error("useAuthStore: Sign in error:", errorMessage);
      set({ error: errorMessage, isAuthenticated: false });
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
      
      set({ isAuthenticated: true, error: null });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign up. Please try again.';
      set({ error: errorMessage, isAuthenticated: false });
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
      set({ isAuthenticated: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out. Please try again.';
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },
}));