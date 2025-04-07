import { create } from 'zustand';
import { Profile, ProfileSettings, WorkExperience, Education } from '@/types/database';
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
  // In-memory storage for work experience and education
  workExperienceData: WorkExperience[];
  educationData: Education[];
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  settings: null,
  isLoading: false,
  error: null,
  // Initialize in-memory storage
  workExperienceData: [],
  educationData: [],

  fetchProfile: async () => {
    console.log("Fetching profile data...");
    set({ isLoading: true, error: null });
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Not authenticated');

      console.log("Authenticated user ID:", user.id);

      const { data: profileData, error: profileError } = await supabase
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

      let profile = null;
      
      if (profileData) {
        // Create a profile object with processed data
        profile = {
          ...profileData,
          // Set work_experience and education from in-memory storage
          work_experience: get().workExperienceData || [],
          education: get().educationData || [],
          // Ensure expertise is always an array
          expertise: profileData.expertise || [],
          // Ensure metadata is available
          metadata: profileData.metadata || {}
        };
        
        console.log("Profile data received - full_name:", profile.full_name);
        console.log("Profile data received - specialty:", profile.specialty);
        console.log("Profile data received - hospital:", profile.hospital);
        console.log("Profile data received - location:", profile.location);
        console.log("Profile data received - bio:", profile.bio);
        console.log("Profile data received - expertise length:", profile.expertise?.length || 0);
        console.log("Profile data received - work_experience length:", profile.work_experience?.length || 0);
        console.log("Profile data received - education length:", profile.education?.length || 0);
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
      const profileData: any = { ...data };
      
      // Update in-memory work experience and education if provided
      if (profileData.work_experience !== undefined) {
        console.log(`Storing work_experience with ${profileData.work_experience.length} items in local state`);
        set({ workExperienceData: profileData.work_experience });
        // Remove from direct profile update to avoid database error
        delete profileData.work_experience;
      }
      
      // Handle education if provided
      if (profileData.education !== undefined) {
        console.log(`Storing education with ${profileData.education.length} items in local state`);
        set({ educationData: profileData.education });
        // Remove from direct profile update to avoid database error
        delete profileData.education;
      }
      
      // Save metadata for processing later
      const metadataToSave = profileData.metadata ? { ...profileData.metadata } : undefined;
      
      // Remove metadata field if it exists to avoid database error
      if (profileData.metadata !== undefined) {
        delete profileData.metadata;
      }

      // Explicit database schema compatibility check - remove any fields that aren't in the Profile interface
      // This acts as a safeguard against any cached fields in the UI that might not be in the database schema
      // Only allow fields that are explicitly defined in the database schema
      const allowedFields = [
        'id', 'full_name', 'specialty', 'hospital', 'location', 'bio', 'avatar_url',
        'expertise', 'skills', 'interests', 'languages', 'followers_count',
        'following_count', 'posts_count', 'created_at', 'updated_at', 'metadata'
      ];
      
      Object.keys(profileData).forEach(key => {
        if (!allowedFields.includes(key)) {
          console.log(`Removing field not in database schema: ${key}`);
          delete profileData[key];
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
      
      // Handle empty arrays specially for expertise field
      if (profileData.expertise !== undefined) {
        if (profileData.expertise.length === 0) {
          console.log("Setting expertise to empty array for database compatibility");
          profileData.expertise = [];
        } else {
          console.log(`Updating expertise field with ${profileData.expertise.length} items: ${profileData.expertise.join(', ')}`);
        }
      }

      // Right before the upsert operation, clean up any null values
      Object.keys(profileData).forEach(key => {
        if (profileData[key] === null || profileData[key] === undefined) {
          console.log(`Removing null/undefined value for ${key}`);
          delete profileData[key];
        }
      });

      console.log("Sending upsert with data:", JSON.stringify(profileData, null, 2));

      // Use upsert to update the profile
      const { data: updatedProfileData, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profileData,
          // Re-add metadata if we have it
          ...(metadataToSave ? { metadata: metadataToSave } : {}),
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

      console.log("Profile updated successfully in database");
      
      // Get the current state
      const currentProfile = get().profile;
      const workExperienceData = get().workExperienceData;
      const educationData = get().educationData;
      
      let updatedProfile = null;
      
      if (updatedProfileData) {
        // Process the returned profile data to include work_experience and education
        updatedProfile = {
          ...updatedProfileData,
          work_experience: workExperienceData || [],
          education: educationData || [],
          // Ensure metadata is available
          metadata: updatedProfileData.metadata || {}
        };
      } else if (currentProfile) {
        // If no data returned, construct the updated profile from current state and changes
        updatedProfile = {
          ...currentProfile,
          ...data,
          work_experience: profileData.work_experience !== undefined ? 
            profileData.work_experience : currentProfile.work_experience || [],
          education: profileData.education !== undefined ? 
            profileData.education : currentProfile.education || [],
          // Update metadata
          metadata: metadataToSave || currentProfile.metadata || {}
        };
      }

      // Update the state with the processed profile
      if (updatedProfile) {
        console.log("Setting updated profile state with work_experience and education");
        set({ profile: updatedProfile });
      }
      
      return true;
    } catch (error) {
      console.error("Profile update error:", error);
      set({ error: (error instanceof Error) ? error.message : String(error) });
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

      const { data: updatedSettings, error } = await supabase
        .from('profile_settings')
        .upsert({
          profile_id: user.id,
          ...data,
          updated_at: new Date().toISOString(),
        })
        .select();

      if (error) throw error;

      set((state) => ({
        settings: updatedSettings[0] || state.settings
      }));
    } catch (error) {
      console.error("Settings update error:", error);
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
}));