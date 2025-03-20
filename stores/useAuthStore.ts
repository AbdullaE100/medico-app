import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  error: null,

  checkAuth: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      set({ isAuthenticated: !!user, isLoading: false, error: null });
    } catch (error) {
      set({ 
        isAuthenticated: false, 
        isLoading: false,
        error: 'Failed to check authentication status. Please try again.'
      });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      if (!data.user) throw new Error('User not found');
      
      set({ isAuthenticated: true, error: null });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in. Please try again.';
      set({ error: errorMessage, isAuthenticated: false });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      if (!data.user) throw new Error('Failed to create account');
      
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