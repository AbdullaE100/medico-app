import { create } from 'zustand';
import { Profile } from '@/types/database';
import { supabase } from '@/lib/supabase';

interface ConnectionRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
}

interface NetworkState {
  doctors: Profile[];
  followedDoctors: Set<string>;
  pendingRequests: ConnectionRequest[];
  receivedRequests: ConnectionRequest[];
  suggestedDoctors: Profile[];
  isLoading: boolean;
  error: string | null;
  fetchDoctors: (search?: string, specialty?: string, sort?: 'followers' | 'recent') => Promise<void>;
  followDoctor: (doctorId: string) => Promise<void>;
  unfollowDoctor: (doctorId: string) => Promise<void>;
  sendConnectionRequest: (doctorId: string) => Promise<void>;
  acceptConnectionRequest: (requestId: string) => Promise<void>;
  rejectConnectionRequest: (requestId: string) => Promise<void>;
  fetchConnectionRequests: () => Promise<void>;
  fetchSuggestedConnections: () => Promise<void>;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  doctors: [],
  followedDoctors: new Set(),
  pendingRequests: [],
  receivedRequests: [],
  suggestedDoctors: [],
  isLoading: false,
  error: null,

  fetchDoctors: async (search?: string, specialty?: string, sort?: 'followers' | 'recent') => {
    set({ isLoading: true, error: null });
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        // Filter to only show verified profiles with full_name
        .not('full_name', 'is', null)
        .not('full_name', 'eq', '')
        // Ensure the profile is somewhat complete
        .not('specialty', 'is', null)
        .not('specialty', 'eq', '');

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,specialty.ilike.%${search}%,hospital.ilike.%${search}%`);
      }

      if (specialty) {
        query = query.eq('specialty', specialty);
      }

      if (sort === 'followers') {
        query = query.order('followers_count', { ascending: false });
      } else if (sort === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else {
        // Default sorting by completion of profile
        query = query.order('followers_count', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch connection statuses
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: follows } = await supabase
          .from('doctor_follows')
          .select('following_id')
          .eq('follower_id', user.id);

        const { data: requests } = await supabase
          .from('connection_requests')
          .select('receiver_id, status')
          .eq('sender_id', user.id);

        const followedIds = new Set(follows?.map(f => f.following_id) || []);
        const pendingIds = new Set(
          requests
            ?.filter(r => r.status === 'pending')
            .map(r => r.receiver_id) || []
        );

        set({ 
          doctors: (data || []).map(doc => ({
            ...doc,
            connection_status: followedIds.has(doc.id) 
              ? 'connected'
              : pendingIds.has(doc.id)
                ? 'pending'
                : 'none'
          })),
          followedDoctors: followedIds
        });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchConnectionRequests: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const [{ data: sent }, { data: received }] = await Promise.all([
        supabase
          .from('connection_requests')
          .select(`
            *,
            receiver:profiles!connection_requests_receiver_id_fkey(*)
          `)
          .eq('sender_id', user.id)
          .eq('status', 'pending'),
        
        supabase
          .from('connection_requests')
          .select(`
            *,
            sender:profiles!connection_requests_sender_id_fkey(*)
          `)
          .eq('receiver_id', user.id)
          .eq('status', 'pending')
      ]);

      set({
        pendingRequests: sent || [],
        receivedRequests: received || []
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  sendConnectionRequest: async (doctorId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('connection_requests')
        .insert({
          sender_id: user.id,
          receiver_id: doctorId
        });

      if (error) throw error;

      // Update local state
      set(state => ({
        doctors: state.doctors.map(doc =>
          doc.id === doctorId
            ? { ...doc, connection_status: 'pending' }
            : doc
        )
      }));

      // Refresh requests
      await get().fetchConnectionRequests();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  acceptConnectionRequest: async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('connection_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;

      // Refresh requests and connections
      await Promise.all([
        get().fetchConnectionRequests(),
        get().fetchDoctors()
      ]);
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  rejectConnectionRequest: async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('connection_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      // Refresh requests
      await get().fetchConnectionRequests();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  followDoctor: async (doctorId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // First send a connection request
      await get().sendConnectionRequest(doctorId);
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  unfollowDoctor: async (doctorId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Remove both follow relationships
      const { error } = await supabase
        .from('doctor_follows')
        .delete()
        .or(`and(follower_id.eq.${user.id},following_id.eq.${doctorId}),and(follower_id.eq.${doctorId},following_id.eq.${user.id})`);

      if (error) throw error;

      // Update local state
      set(state => {
        const newFollowed = new Set(state.followedDoctors);
        newFollowed.delete(doctorId);
        return {
          followedDoctors: newFollowed,
          doctors: state.doctors.map(doc => 
            doc.id === doctorId 
              ? { 
                  ...doc, 
                  followers_count: Math.max(0, (doc.followers_count || 0) - 1),
                  connection_status: 'none'
                }
              : doc
          )
        };
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  fetchSuggestedConnections: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's specialty
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('specialty')
        .eq('id', user.id)
        .single();

      if (!userProfile?.specialty) {
        // If user has no specialty, just get some random doctors
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .not('id', 'eq', user.id)
          .not('full_name', 'is', null)
          .not('specialty', 'is', null)
          .limit(5);

        set({ suggestedDoctors: data || [] });
        return;
      }

      // Get doctors with same specialty
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .not('id', 'eq', user.id)
        .eq('specialty', userProfile.specialty)
        .not('full_name', 'is', null)
        .limit(5);

      // If not enough results, supplement with other specialties
      if (!data || data.length < 5) {
        const { data: additionalDoctors } = await supabase
          .from('profiles')
          .select('*')
          .not('id', 'eq', user.id)
          .not('id', 'in', data?.map(d => d.id) || [])
          .not('full_name', 'is', null)
          .not('specialty', 'is', null)
          .limit(5 - (data?.length || 0));

        set({ 
          suggestedDoctors: [
            ...(data || []),
            ...(additionalDoctors || [])
          ] 
        });
      } else {
        set({ suggestedDoctors: data });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
}));