import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  getSession: () => Promise<void>;
  getCurrentUser: () => Promise<User | null>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  getSession: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      if (data.session) {
        const user = await get().getCurrentUser();
        set({ user });
      }
    } catch (error: any) {
      set({ error: error.message });
      console.error('Error getting session:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  getCurrentUser: async () => {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        throw authError;
      }
      
      if (!authData.user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data as User;
    } catch (error: any) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  signIn: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      const user = await get().getCurrentUser();
      set({ user });
    } catch (error: any) {
      set({ error: error.message });
      console.error('Error signing in:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email, password, fullName) => {
    try {
      set({ isLoading: true, error: null });
      
      // Register user with email and password
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      // Create profile entry in profiles table
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            { 
              id: data.user.id, 
              full_name: fullName,
              email
            }
          ]);
        
        if (profileError) {
          throw profileError;
        }
        
        const user = await get().getCurrentUser();
        set({ user });
      }
    } catch (error: any) {
      set({ error: error.message });
      console.error('Error signing up:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      set({ user: null });
    } catch (error: any) {
      set({ error: error.message });
      console.error('Error signing out:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (updates) => {
    try {
      set({ isLoading: true, error: null });
      
      const { user } = get();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      const updatedUser = await get().getCurrentUser();
      set({ user: updatedUser });
    } catch (error: any) {
      set({ error: error.message });
      console.error('Error updating profile:', error);
    } finally {
      set({ isLoading: false });
    }
  },
})); 