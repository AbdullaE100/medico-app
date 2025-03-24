import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TextInput, TouchableOpacity, Alert, Platform, ImageBackground, ActivityIndicator } from 'react-native';
import { Camera, X, Upload, Hash, MapPin, Building2, Globe, Heart, CheckCircle2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useProfileStore } from '@/stores/useProfileStore';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ErrorMessage } from '@/components/ErrorMessage';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Profile } from '@/types/database';

// Define interface for local profile
interface LocalProfileData {
  full_name: string;
  specialty: string;
  hospital: string;
  location: string;
  bio: string;
  expertise: string[];
  avatar_url: string;
}

export default function EditProfile() {
  const router = useRouter();
  const { profile, isLoading, error, updateProfile, fetchProfile } = useProfileStore();
  const [newTag, setNewTag] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [localProfile, setLocalProfile] = useState<LocalProfileData>({
    full_name: '',
    specialty: '',
    hospital: '',
    location: '',
    bio: '',
    expertise: [],
    avatar_url: '',
  });

  // Initialize localProfile when profile data is loaded
  useEffect(() => {
    if (profile) {
      setLocalProfile({
        full_name: profile.full_name || '',
        specialty: profile.specialty || '',
        hospital: profile.hospital || '',
        location: profile.location || '',
        bio: profile.bio || '',
        expertise: profile.expertise || [],
        avatar_url: profile.avatar_url || '',
      });
    }
  }, [profile]);

  // Fetch profile data when component mounts
  useEffect(() => {
    fetchProfile();
  }, []);

  const pickImage = async () => {
    try {
      // Request permissions
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please grant camera roll permissions to change your photo.');
          return;
        }
      }

      // Pick the image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const file = result.assets[0];
        setLocalProfile(prev => ({ ...prev, avatar_url: file.uri }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile picture');
    }
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      
      // Create a profile update with only the fields that definitely exist in the database
      const profileUpdate: Partial<Profile> = {
        full_name: localProfile.full_name,
        specialty: localProfile.specialty,
        hospital: localProfile.hospital,
        location: localProfile.location,
        bio: localProfile.bio
      };
      
      // Only include avatar if it changed
      if (localProfile.avatar_url && localProfile.avatar_url !== profile?.avatar_url) {
        profileUpdate.avatar_url = localProfile.avatar_url;
      }
      
      // Add expertise if it exists
      if (localProfile.expertise && localProfile.expertise.length > 0) {
        profileUpdate.expertise = localProfile.expertise;
        console.log("Adding expertise to profile update:", JSON.stringify(localProfile.expertise));
      }
      
      // Log what we're trying to save
      console.log("Saving profile data:", JSON.stringify(profileUpdate, null, 2));
      
      const success = await updateProfile(profileUpdate);
      
      console.log("Profile update result:", success);
      
      if (success) {
        setSaveSuccess(true);
        
        // Fetch profile again to ensure we get latest data
        try {
          await fetchProfile();
          console.log("Profile data refreshed after save");
        } catch (refreshError) {
          console.error("Error refreshing profile after save:", refreshError);
        }
        
        // Show success feedback briefly before returning
        setTimeout(() => {
          console.log("Navigation back after successful save");
          // Reset navigation stack and go to profile tab to ensure complete refresh
          router.replace("/(tabs)");
          setTimeout(() => {
            router.replace("/(tabs)/profile");
          }, 100); // Small delay to ensure navigation completes
        }, 1200);
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', `Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaveLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim()) {
      setLocalProfile(prev => ({
        ...prev,
        expertise: [...prev.expertise, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setLocalProfile(prev => ({
      ...prev,
      expertise: prev.expertise.filter((_, i) => i !== index),
    }));
  };

  const addExpertise = () => {
    if (newTag.trim()) {
      setLocalProfile(prev => ({
        ...prev,
        expertise: [...prev.expertise, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeExpertise = (index: number) => {
    setLocalProfile(prev => ({
      ...prev,
      expertise: prev.expertise.filter((_, i) => i !== index),
    }));
  };

  return (
    <View style={styles.container}>
      {isLoading && <LoadingOverlay message="Loading profile data..." />}
      {error && <ErrorMessage message={error} onDismiss={() => {}} />}
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity 
          style={[
            styles.saveButton, 
            saveLoading && styles.saveButtonLoading,
            saveSuccess && styles.saveButtonSuccess
          ]} 
          onPress={handleSave}
          disabled={saveLoading || saveSuccess}
        >
          {saveLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : saveSuccess ? (
            <View style={styles.saveSuccessContainer}>
              <CheckCircle2 size={16} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Saved</Text>
            </View>
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.bannerSection}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' }}
            style={styles.bannerImage}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)']}
              style={styles.bannerGradient}
            >
              <View style={styles.bannerGradient} />
            </LinearGradient>
          </ImageBackground>
        </View>
        
        <View style={styles.avatarSection}>
          {localProfile.avatar_url ? (
            <Image source={{ uri: localProfile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {localProfile.full_name ? localProfile.full_name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.changeAvatarButton} onPress={pickImage}>
            <Camera size={18} color="#FFFFFF" />
            <Text style={styles.changeAvatarText}>Change Photo</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.textInput}
              value={localProfile.full_name}
              onChangeText={(text) => {
                console.log("Updating full_name to:", text);
                setLocalProfile(prev => ({ ...prev, full_name: text }));
              }}
              placeholder="Your full name"
              placeholderTextColor="#A0AEC0"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Specialty</Text>
            <TextInput
              style={styles.textInput}
              value={localProfile.specialty}
              onChangeText={(text) => setLocalProfile(prev => ({ ...prev, specialty: text }))}
              placeholder="e.g. Cardiology"
              placeholderTextColor="#A0AEC0"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Hospital / Institution</Text>
            <View style={styles.inputWithIcon}>
              <Building2 size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.textInputWithIcon}
                value={localProfile.hospital}
                onChangeText={(text) => setLocalProfile(prev => ({ ...prev, hospital: text }))}
                placeholder="Where do you work?"
                placeholderTextColor="#A0AEC0"
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location</Text>
            <View style={styles.inputWithIcon}>
              <MapPin size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.textInputWithIcon}
                value={localProfile.location}
                onChangeText={(text) => setLocalProfile(prev => ({ ...prev, location: text }))}
                placeholder="City, Country"
                placeholderTextColor="#A0AEC0"
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={styles.textArea}
              value={localProfile.bio}
              onChangeText={(text) => setLocalProfile(prev => ({ ...prev, bio: text }))}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#A0AEC0"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Areas of Expertise</Text>
            <Text style={styles.inputHelper}>Add your areas of expertise or interest</Text>
            
            <View style={styles.tagsContainer}>
              {localProfile.expertise.map((item, index) => (
                <View key={index} style={styles.expertiseItem}>
                  <Text style={styles.expertiseItemText}>{item}</Text>
                  <TouchableOpacity style={styles.tagRemoveButton} onPress={() => removeExpertise(index)}>
                    <X size={14} color="#64748B" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                value={newTag}
                onChangeText={setNewTag}
                placeholder="Add an area of expertise"
                placeholderTextColor="#A0AEC0"
                onSubmitEditing={addExpertise}
              />
              <TouchableOpacity style={styles.addTagButton} onPress={addExpertise}>
                <Text style={styles.addTagButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.advancedButton}>
            <TouchableOpacity 
              style={styles.advancedButtonInner}
              onPress={() => router.push('/profile/edit-advanced')}
            >
              <Text style={styles.advancedButtonText}>Edit Advanced Profile Sections</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
  },
  saveButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  saveButtonLoading: {
    backgroundColor: '#0066CC',
    opacity: 0.8,
  },
  saveButtonSuccess: {
    backgroundColor: '#22C55E',
  },
  saveSuccessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  bannerSection: {
    width: '100%',
    height: 180,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 16,
  },
  avatarSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    marginTop: -50,
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarPlaceholderText: {
    fontSize: 40,
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  changeAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066CC',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  changeAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  form: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 24,
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  inputHelper: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    marginBottom: 12,
  },
  textInput: {
    width: '100%',
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#334155',
    backgroundColor: '#F8FAFC',
  },
  textArea: {
    width: '100%',
    height: 120,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#334155',
    backgroundColor: '#F8FAFC',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  inputIcon: {
    marginLeft: 14,
  },
  textInputWithIcon: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#334155',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagItemText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
    marginLeft: 4,
    marginRight: 4,
  },
  expertiseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  expertiseItemText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
    marginRight: 4,
  },
  tagRemoveButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  tagInput: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#334155',
    backgroundColor: '#F8FAFC',
    marginRight: 8,
  },
  addTagButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
  },
  addTagButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  advancedButton: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  advancedButtonInner: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  advancedButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#334155',
  },
});