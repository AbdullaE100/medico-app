import { create } from 'zustand';
import { Profile, ProfileSettings } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';

interface ProfileState {
  profile: Profile | null;
  settings: ProfileSettings | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<boolean>;
  updateSettings: (data: Partial<ProfileSettings>) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  settings: null,
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    console.log("Fetching profile data...");
    set({ isLoading: true, error: null });
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Not authenticated');

      console.log("Authenticated user ID:", user.id);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        if (profileError.code !== 'PGRST116') {
          throw profileError;
        }
      }

      if (profile) {
        console.log("Profile data received - full_name:", profile.full_name);
        console.log("Profile data received - specialty:", profile.specialty);
        console.log("Profile data received - hospital:", profile.hospital);
        console.log("Profile data received - location:", profile.location);
        console.log("Profile data received - bio:", profile.bio);
        console.log("Profile data received - expertise length:", profile.expertise?.length || 0);
        console.log("Profile counts - posts:", profile.posts_count, "followers:", profile.followers_count, "following:", profile.following_count);
        set({ profile });
      } else {
        console.log("No profile data found for user:", user.id);
      }

      const { data: settings, error: settingsError } = await supabase
        .from('profile_settings')
        .select('*')
        .eq('profile_id', user.id)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError;
      }

      if (settings) {
        set({ settings });
      }

    } catch (error) {
      console.error("Error fetching profile:", error);
      set({ error: (error as Error).message });
    } finally {
      console.log("Finished fetching profile");
      set({ isLoading: false });
    }
  },

  updateProfile: async (data: Partial<Profile>) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Not authenticated');

      console.log("Starting profile update for user:", user.id);
      console.log("Update data:", JSON.stringify(data, null, 2));

      // Make a copy of the data to avoid modifying the original
      const profileData = { ...data };

      // Explicit database schema compatibility check - remove any fields that aren't in the Profile interface
      // This acts as a safeguard against any cached fields in the UI that might not be in the database schema
      // Only allow fields that are explicitly defined in the Profile interface
      const allowedFields = [
        'id', 'full_name', 'specialty', 'hospital', 'location', 'bio', 'avatar_url',
        'expertise', 'work_experience', 'education', 'skills', 'research',
        'quality_improvement', 'interests', 'languages', 'followers_count',
        'following_count', 'posts_count', 'created_at', 'updated_at'
      ];
      
      Object.keys(profileData).forEach(key => {
        if (!allowedFields.includes(key)) {
          console.log(`Removing field not in database schema: ${key}`);
          delete (profileData as any)[key];
        }
      });

      // Handle avatar upload if present
      if (data.avatar_url && (data.avatar_url.startsWith('file://') || data.avatar_url.startsWith('ph://'))) {
        try {
          const timestamp = Date.now();
          const fileExt = 'jpg';
          const fileName = `avatar_${user.id}_${timestamp}.${fileExt}`;
          const filePath = `${fileName}`;

          // Convert URI to Blob for web compatibility
          const response = await fetch(data.avatar_url);
          const blob = await response.blob();

          // Upload the file
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, blob, {
              contentType: 'image/jpeg',
              upsert: true
            });

          if (uploadError) throw uploadError;

          // Get the public URL
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

          // Update the avatar_url with the public URL
          profileData.avatar_url = publicUrl;
          console.log("Uploaded avatar:", publicUrl);
        } catch (uploadError) {
          console.error("Avatar upload failed:", uploadError);
          // Continue without updating avatar
          delete profileData.avatar_url;
        }
      }
      
      // Check for arrays and log their contents
      if (profileData.work_experience) {
        console.log(`Updating work_experience with ${profileData.work_experience.length} items`);
        if (profileData.work_experience.length === 0) {
          profileData.work_experience = [];
        }
      }
      
      if (profileData.education) {
        console.log(`Updating education with ${profileData.education.length} items`);
        if (profileData.education.length === 0) {
          profileData.education = [];
        }
      }
      
      if (profileData.research) {
        console.log(`Updating research with ${profileData.research.length} items`);
        if (profileData.research.length === 0) {
          profileData.research = [];
        }
      }
      
      if (profileData.quality_improvement) {
        console.log(`Updating quality_improvement with ${profileData.quality_improvement.length} items`);
        if (profileData.quality_improvement.length === 0) {
          profileData.quality_improvement = [];
        }
      }
      
      if (profileData.interests) {
        console.log(`Updating interests: ${profileData.interests.join(', ')}`);
        if (profileData.interests.length === 0) {
          profileData.interests = [];
        }
      }
      
      if (profileData.languages) {
        console.log(`Updating languages: ${profileData.languages.length} items`);
        if (profileData.languages.length === 0) {
          profileData.languages = [];
        }
      }
      
      if (profileData.expertise) {
        console.log(`Updating expertise: ${profileData.expertise.join(', ')}`);
        if (profileData.expertise.length === 0) {
          profileData.expertise = [];
        }
      }

      // Right before the upsert operation, clean up any null values
      Object.keys(profileData).forEach(key => {
        const typedProfileData = profileData as Record<string, any>;
        if (typedProfileData[key] === null || typedProfileData[key] === undefined) {
          console.log(`Removing null/undefined value for ${key}`);
          delete typedProfileData[key];
        }
      });

      // Handle empty arrays specially for expertise field
      if (profileData.expertise !== undefined) {
        if (profileData.expertise.length === 0) {
          console.log("Setting expertise to empty array for database compatibility");
          profileData.expertise = [];
        } else {
          console.log(`Updating expertise field with ${profileData.expertise.length} items: ${profileData.expertise.join(', ')}`);
        }
      }

      console.log("Sending upsert with data:", JSON.stringify(profileData, null, 2));

      // Use upsert to update the profile
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        // Better error handling for schema mismatches
        if (error.code === 'PGRST204') {
          console.error("Database schema mismatch error:", error.message);
          throw new Error(`Database schema error: ${error.message}. Please ensure your app is up to date.`);
        } else {
          console.error("Supabase error during profile update:", error);
          throw error;
        }
      }

      console.log("Profile updated successfully:", JSON.stringify(updatedProfile, null, 2));

      // Update the state with the server response data
      set((state) => ({
        profile: updatedProfile || (state.profile ? { ...state.profile, ...data } : null)
      }));
      
      return true;
    } catch (error) {
      console.error("Profile update error:", error);
      set({ error: (error as Error).message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  updateSettings: async (data: Partial<ProfileSettings>) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profile_settings')
        .upsert({
          profile_id: user.id,
          ...data,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      set((state) => ({
        settings: state.settings ? { ...state.settings, ...data } : null
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
}));