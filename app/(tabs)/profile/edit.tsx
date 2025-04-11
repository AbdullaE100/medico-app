import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TextInput, TouchableOpacity, Alert, Platform, ImageBackground, ActivityIndicator, StatusBar } from 'react-native';
import { Camera, X, Upload, Hash, MapPin, Building2, Globe, Heart, CheckCircle2, Plus, Briefcase, GraduationCap, CalendarDays, User, ArrowLeft, UserCircle, UserCheck, Stethoscope } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useProfileStore } from '@/stores/useProfileStore';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ErrorMessage } from '@/components/ErrorMessage';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Profile, WorkExperience, Education } from '@/types/database';

// Define interface for local profile
interface LocalProfileData {
  full_name: string;
  specialty: string;
  hospital: string;
  location: string;
  bio: string;
  expertise: string[];
  avatar_url: string;
  work_experience: WorkExperience[];
  education: Education[];
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
    work_experience: [],
    education: [],
  });

  // Anonymous profile toggle
  const [isAnonymousMode, setIsAnonymousMode] = useState<boolean>(
    profile?.metadata?.isAnonymous || false
  );

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
        work_experience: profile.work_experience || [],
        education: profile.education || [],
      });
    }
  }, [profile]);

  // Fetch profile data when component mounts
  useEffect(() => {
    fetchProfile();
  }, []);

  // Placeholder avatar component
  const AvatarPlaceholder = () => (
    <View style={styles.avatarPlaceholder}>
      <User size={60} color="#FFFFFF" />
    </View>
  );
  
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
      // Validate the required fields
      if (!localProfile.full_name || localProfile.full_name.trim() === '') {
        Alert.alert('Missing Information', 'Please provide your full name.');
        return;
      }
      
      if (localProfile.full_name.includes('@')) {
        Alert.alert('Invalid Name', 'Please provide your actual name, not an email address.');
        return;
      }
      
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
      
      // Add work experience and education
      if (localProfile.work_experience && localProfile.work_experience.length > 0) {
        profileUpdate.work_experience = localProfile.work_experience;
      }
      
      if (localProfile.education && localProfile.education.length > 0) {
        profileUpdate.education = localProfile.education;
      }
      
      // Add anonymous mode setting to metadata
      profileUpdate.metadata = {
        ...(profile?.metadata || {}),
        isAnonymous: isAnonymousMode
      };
      
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

  // Functions for work experience
  const addWorkExperience = () => {
    setLocalProfile(prev => ({
      ...prev,
      work_experience: [...prev.work_experience, {
        id: Date.now().toString(),
        title: '',
        organization: '',
        start_date: '',
        end_date: '',
        description: '',
        is_current: false
      }]
    }));
  };

  const updateWorkExperience = (index: number, field: keyof WorkExperience, value: any) => {
    const updated = [...localProfile.work_experience];
    updated[index] = { ...updated[index], [field]: value };
    
    // If marking as current, set end_date to "Present"
    if (field === 'is_current' && value === true) {
      updated[index].end_date = 'Present';
    } else if (field === 'is_current' && value === false) {
      updated[index].end_date = '';
    }
    
    setLocalProfile(prev => ({
      ...prev,
      work_experience: updated
    }));
  };

  const removeWorkExperience = (index: number) => {
    setLocalProfile(prev => ({
      ...prev,
      work_experience: prev.work_experience.filter((_, i) => i !== index)
    }));
  };

  // Functions for education
  const addEducation = () => {
    setLocalProfile(prev => ({
      ...prev,
      education: [...prev.education, {
        id: Date.now().toString(),
        degree: '',
        institution: '',
        start_date: '',
        end_date: '',
        description: '',
        is_current: false
      }]
    }));
  };

  const updateEducation = (index: number, field: keyof Education, value: any) => {
    const updated = [...localProfile.education];
    updated[index] = { ...updated[index], [field]: value };
    
    // If marking as current, set end_date to "Present"
    if (field === 'is_current' && value === true) {
      updated[index].end_date = 'Present';
    } else if (field === 'is_current' && value === false) {
      updated[index].end_date = '';
    }
    
    setLocalProfile(prev => ({
      ...prev,
      education: updated
    }));
  };

  const removeEducation = (index: number) => {
    setLocalProfile(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{width: 40}} />
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {localProfile.avatar_url ? (
              <Image source={{ uri: localProfile.avatar_url }} style={styles.avatar} />
            ) : (
              <AvatarPlaceholder />
            )}
            <TouchableOpacity style={styles.changeAvatarButton} onPress={pickImage}>
              <Camera size={18} color="#FFFFFF" />
              <Text style={styles.changeAvatarText}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <UserCircle size={22} color="#0066CC" />
            <Text style={styles.sectionTitle}>Anonymous Profile</Text>
          </View>
          
          <Text style={styles.sectionDescription}>
            When enabled, your posts will display with a professional anonymous avatar instead of your personal photo.
          </Text>
          
          <View style={styles.optionCard}>
            <View style={styles.anonymousPreview}>
              <View style={styles.anonymousAvatar}>
                <Stethoscope size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.anonymousLabel}>Anonymous Doctor</Text>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.toggleSwitch,
                isAnonymousMode ? styles.toggleActive : {}
              ]}
              onPress={() => setIsAnonymousMode(!isAnonymousMode)}
            >
              <View style={[
                styles.toggleHandle,
                isAnonymousMode ? styles.toggleHandleActive : {}
              ]}>
                {isAnonymousMode ? (
                  <UserCheck size={14} color="#0066CC" />
                ) : (
                  <User size={14} color="#64748B" />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <Text style={styles.requiredLabel}>Required</Text>
            </View>
            <Text style={styles.inputHelper}>
              Your professional name as it should appear to other doctors
            </Text>
            <TextInput
              style={[
                styles.textInput, 
                localProfile.full_name?.includes('@') && styles.invalidInput
              ]}
              value={localProfile.full_name}
              onChangeText={(text) => setLocalProfile(prev => ({ ...prev, full_name: text }))}
              placeholder="Dr. John Smith"
              placeholderTextColor="#A0AEC0"
            />
            {localProfile.full_name?.includes('@') && (
              <Text style={styles.errorText}>
                Please provide your actual name, not an email address
              </Text>
            )}
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
              <Building2 size={18} color="#0066CC" style={styles.inputIcon} />
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
              <MapPin size={18} color="#0066CC" style={styles.inputIcon} />
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
                <View key={index} style={styles.tagItem}>
                  <Text style={styles.tagItemText}>{item}</Text>
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
        </View>
        
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Briefcase size={20} color="#0066CC" />
            <Text style={styles.sectionTitle}>Work Experience</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={addWorkExperience}
            >
              <Plus size={14} color="#0066CC" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.sectionDescription}>
            Add your professional history to showcase your career path
          </Text>
          
          {localProfile.work_experience.map((item, index) => (
            <View key={item.id || index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemBadge}>
                  <Text style={styles.itemBadgeText}>{index + 1}</Text>
                </View>
                <TextInput
                  style={styles.itemTitle}
                  value={item.title}
                  onChangeText={(text) => updateWorkExperience(index, 'title', text)}
                  placeholder="Position Title"
                  placeholderTextColor="#A0AEC0"
                />
                <TouchableOpacity style={styles.removeButton} onPress={() => removeWorkExperience(index)}>
                  <X size={16} color="#FF3B30" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputRow}>
                <Text style={styles.itemInputLabel}>Organization</Text>
                <TextInput
                  style={styles.itemInput}
                  value={item.organization}
                  onChangeText={(text) => updateWorkExperience(index, 'organization', text)}
                  placeholder="Company or organization name"
                  placeholderTextColor="#A0AEC0"
                />
              </View>
              
              <View style={styles.dateContainer}>
                <View style={styles.dateFieldContainer}>
                  <Text style={styles.itemInputLabel}>Start Date</Text>
                  <View style={styles.dateField}>
                    <CalendarDays size={14} color="#0066CC" />
                    <TextInput
                      style={styles.dateInput}
                      value={item.start_date}
                      onChangeText={(text) => updateWorkExperience(index, 'start_date', text)}
                      placeholder="MM/YYYY"
                      placeholderTextColor="#A0AEC0"
                    />
                  </View>
                </View>
                
                <View style={styles.dateFieldContainer}>
                  <Text style={styles.itemInputLabel}>End Date</Text>
                  <View style={styles.dateField}>
                    <CalendarDays size={14} color="#0066CC" />
                    <TextInput
                      style={styles.dateInput}
                      value={item.end_date}
                      onChangeText={(text) => updateWorkExperience(index, 'end_date', text)}
                      placeholder={item.is_current ? "Present" : "MM/YYYY"}
                      placeholderTextColor="#A0AEC0"
                      editable={!item.is_current}
                    />
                  </View>
                </View>
              </View>
              
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    item.is_current && styles.checkboxActive
                  ]}
                  onPress={() => updateWorkExperience(index, 'is_current', !item.is_current)}
                >
                  {item.is_current && <CheckCircle2 size={14} color="#0066CC" />}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>Current Position</Text>
              </View>
              
              <View style={styles.inputRow}>
                <Text style={styles.itemInputLabel}>Description</Text>
                <TextInput
                  style={[styles.itemInput, styles.multilineInput]}
                  value={item.description}
                  onChangeText={(text) => updateWorkExperience(index, 'description', text)}
                  placeholder="Describe your responsibilities and achievements"
                  placeholderTextColor="#A0AEC0"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>
          ))}
          
          {localProfile.work_experience.length === 0 && (
            <TouchableOpacity 
              style={styles.emptyState}
              onPress={addWorkExperience}
            >
              <Briefcase size={20} color="#0066CC" />
              <Text style={styles.emptyStateText}>Add Work Experience</Text>
              <Plus size={14} color="#0066CC" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <GraduationCap size={20} color="#0066CC" />
            <Text style={styles.sectionTitle}>Education</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={addEducation}
            >
              <Plus size={14} color="#0066CC" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.sectionDescription}>
            Add your educational background and qualifications
          </Text>
          
          {localProfile.education.map((item, index) => (
            <View key={item.id || index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemBadge}>
                  <Text style={styles.itemBadgeText}>{index + 1}</Text>
                </View>
                <TextInput
                  style={styles.itemTitle}
                  value={item.degree}
                  onChangeText={(text) => updateEducation(index, 'degree', text)}
                  placeholder="Degree / Certificate"
                  placeholderTextColor="#A0AEC0"
                />
                <TouchableOpacity style={styles.removeButton} onPress={() => removeEducation(index)}>
                  <X size={16} color="#FF3B30" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputRow}>
                <Text style={styles.itemInputLabel}>Institution</Text>
                <TextInput
                  style={styles.itemInput}
                  value={item.institution}
                  onChangeText={(text) => updateEducation(index, 'institution', text)}
                  placeholder="School or university name"
                  placeholderTextColor="#A0AEC0"
                />
              </View>
              
              <View style={styles.dateContainer}>
                <View style={styles.dateFieldContainer}>
                  <Text style={styles.itemInputLabel}>Start Date</Text>
                  <View style={styles.dateField}>
                    <CalendarDays size={14} color="#0066CC" />
                    <TextInput
                      style={styles.dateInput}
                      value={item.start_date}
                      onChangeText={(text) => updateEducation(index, 'start_date', text)}
                      placeholder="MM/YYYY"
                      placeholderTextColor="#A0AEC0"
                    />
                  </View>
                </View>
                
                <View style={styles.dateFieldContainer}>
                  <Text style={styles.itemInputLabel}>End Date</Text>
                  <View style={styles.dateField}>
                    <CalendarDays size={14} color="#0066CC" />
                    <TextInput
                      style={styles.dateInput}
                      value={item.end_date}
                      onChangeText={(text) => updateEducation(index, 'end_date', text)}
                      placeholder={item.is_current ? "Present" : "MM/YYYY"}
                      placeholderTextColor="#A0AEC0"
                      editable={!item.is_current}
                    />
                  </View>
                </View>
              </View>
              
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    item.is_current && styles.checkboxActive
                  ]}
                  onPress={() => updateEducation(index, 'is_current', !item.is_current)}
                >
                  {item.is_current && <CheckCircle2 size={14} color="#0066CC" />}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>Current Education</Text>
              </View>
              
              <View style={styles.inputRow}>
                <Text style={styles.itemInputLabel}>Description</Text>
                <TextInput
                  style={[styles.itemInput, styles.multilineInput]}
                  value={item.description}
                  onChangeText={(text) => updateEducation(index, 'description', text)}
                  placeholder="Additional details about your education"
                  placeholderTextColor="#A0AEC0"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>
          ))}
          
          {localProfile.education.length === 0 && (
            <TouchableOpacity 
              style={styles.emptyState}
              onPress={addEducation}
            >
              <GraduationCap size={20} color="#0066CC" />
              <Text style={styles.emptyStateText}>Add Education</Text>
              <Plus size={14} color="#0066CC" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
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
              <CheckCircle2 size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Profile Saved</Text>
            </View>
          ) : (
            <Text style={styles.saveButtonText}>Save Profile</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    backgroundColor: '#0066CC',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    marginLeft: 12,
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 16,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  changeAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066CC',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  changeAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#1E293B',
    marginLeft: 8,
    flex: 1,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 12,
  },
  anonymousPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  anonymousAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  anonymousLabel: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#1E293B',
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#E5F0FF',
  },
  toggleHandle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleHandleActive: {
    transform: [{ translateX: 20 }],
  },
  inputGroup: {
    marginBottom: 20,
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#334155',
    marginBottom: 6,
  },
  requiredLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#FFFFFF',
    backgroundColor: '#0066CC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    marginLeft: 8,
  },
  inputHelper: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    marginBottom: 8,
    lineHeight: 18,
  },
  textInput: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#334155',
    backgroundColor: '#F8FAFC',
  },
  textArea: {
    width: '100%',
    height: 120,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    fontSize: 15,
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
    marginLeft: 12,
  },
  textInputWithIcon: {
    flex: 1,
    padding: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#334155',
  },
  invalidInput: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(254, 226, 226, 0.3)',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#EF4444',
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  tagItemText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
    marginRight: 4,
  },
  tagRemoveButton: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#334155',
    backgroundColor: '#F8FAFC',
  },
  addTagButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addTagButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
  },
  itemCard: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  itemBadge: {
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#0066CC',
  },
  itemTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#1A1A1A',
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputRow: {
    marginBottom: 12,
  },
  itemInputLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#64748B',
    marginBottom: 4,
  },
  itemInput: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  dateFieldContainer: {
    flex: 1,
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dateInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
    marginLeft: 6,
    paddingVertical: 0,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#0066CC',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
  },
  checkboxLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#334155',
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(0, 102, 204, 0.04)',
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
    marginHorizontal: 8,
  },
  removeButton: {
    padding: 6,
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderRadius: 8,
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  saveButtonLoading: {
    backgroundColor: '#64748B',
  },
  saveButtonSuccess: {
    backgroundColor: '#10B981',
  },
  saveSuccessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});