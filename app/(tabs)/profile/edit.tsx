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
      
      if (!localProfile.avatar_url) {
        Alert.alert('Profile Image Required', 'Please add a profile image to be visible in the doctor network.');
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
          <View style={styles.requiredPhotoNote}>
            <Text style={styles.requiredBadge}>Required</Text>
            <Text style={styles.photoHelperText}>Profile photo is required to appear in the network</Text>
          </View>
        </View>
        
        {/* Anonymous Profile Option */}
        <View style={styles.anonymousSection}>
          <View style={styles.anonymousHeader}>
            <UserCircle size={20} color="#0066CC" />
            <Text style={styles.anonymousSectionTitle}>Anonymous Profile</Text>
          </View>
          
          <Text style={styles.anonymousDescription}>
            When enabled, your posts will display with a professional anonymous avatar instead of your personal photo.
          </Text>
          
          <View style={styles.anonymousOption}>
            <View style={styles.anonymousPreview}>
              <View style={styles.anonymousAvatar}>
                <View style={styles.anonymousAvatarInner}>
                  <Stethoscope size={22} color="#FFFFFF" />
                </View>
              </View>
              <Text style={styles.anonymousLabel}>Anonymous Doctor</Text>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.anonymousToggle,
                isAnonymousMode ? styles.anonymousToggleActive : {}
              ]}
              onPress={() => setIsAnonymousMode(!isAnonymousMode)}
            >
              {isAnonymousMode ? (
                <View style={styles.toggleOn}>
                  <UserCheck size={16} color="#FFFFFF" />
                </View>
              ) : (
                <View style={styles.toggleOff}>
                  <User size={16} color="#64748B" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <Text style={styles.requiredBadge}>Required</Text>
            </View>
            <Text style={styles.inputHelper}>
              Your professional name as it should appear to other doctors (not email)
            </Text>
            <TextInput
              style={[
                styles.textInput, 
                localProfile.full_name?.includes('@') && styles.invalidInput
              ]}
              value={localProfile.full_name}
              onChangeText={(text) => {
                console.log("Updating full_name to:", text);
                setLocalProfile(prev => ({ ...prev, full_name: text }));
              }}
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
          
          {/* Work Experience Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Briefcase size={20} color="#0066CC" />
              <Text style={styles.sectionTitle}>Work Experience</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={addWorkExperience}
              >
                <Plus size={16} color="#0066CC" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.sectionDescription}>
              Add your professional history to showcase your career path
            </Text>
            
            {localProfile.work_experience.map((item, index) => (
              <View key={item.id || index} style={styles.itemCard}>
                <View style={styles.sectionLabel}>
                  <Text style={styles.sectionLabelText}>Work Experience {index + 1}</Text>
                </View>
                <View style={styles.itemHeader}>
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
                
                <Text style={styles.inputLabel}>Organization</Text>
                <TextInput
                  style={styles.itemInput}
                  value={item.organization}
                  onChangeText={(text) => updateWorkExperience(index, 'organization', text)}
                  placeholder="Company or organization name"
                  placeholderTextColor="#A0AEC0"
                />
                
                <View style={styles.dateContainer}>
                  <View style={styles.dateFieldContainer}>
                    <Text style={styles.inputLabel}>Start Date</Text>
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
                    <Text style={styles.inputLabel}>End Date</Text>
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
                    style={styles.checkbox}
                    onPress={() => updateWorkExperience(index, 'is_current', !item.is_current)}
                  >
                    {item.is_current && <CheckCircle2 size={16} color="#0066CC" />}
                  </TouchableOpacity>
                  <Text style={styles.checkboxLabel}>Current Position</Text>
                </View>
                
                <Text style={styles.inputLabel}>Description</Text>
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
            ))}
            
            {localProfile.work_experience.length === 0 && (
              <TouchableOpacity 
                style={styles.emptyState}
                onPress={addWorkExperience}
              >
                <Briefcase size={20} color="#0066CC" />
                <Text style={styles.emptyStateText}>Add Work Experience</Text>
                <Plus size={16} color="#0066CC" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Education Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <GraduationCap size={20} color="#0066CC" />
              <Text style={styles.sectionTitle}>Education</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={addEducation}
              >
                <Plus size={16} color="#0066CC" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.sectionDescription}>
              Add your educational background and qualifications
            </Text>
            
            {localProfile.education.map((item, index) => (
              <View key={item.id || index} style={styles.itemCard}>
                <View style={styles.sectionLabel}>
                  <Text style={styles.sectionLabelText}>Education {index + 1}</Text>
                </View>
                <View style={styles.itemHeader}>
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
                
                <Text style={styles.inputLabel}>Institution</Text>
                <TextInput
                  style={styles.itemInput}
                  value={item.institution}
                  onChangeText={(text) => updateEducation(index, 'institution', text)}
                  placeholder="School or university name"
                  placeholderTextColor="#A0AEC0"
                />
                
                <View style={styles.dateContainer}>
                  <View style={styles.dateFieldContainer}>
                    <Text style={styles.inputLabel}>Start Date</Text>
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
                    <Text style={styles.inputLabel}>End Date</Text>
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
                    style={styles.checkbox}
                    onPress={() => updateEducation(index, 'is_current', !item.is_current)}
                  >
                    {item.is_current && <CheckCircle2 size={16} color="#0066CC" />}
                  </TouchableOpacity>
                  <Text style={styles.checkboxLabel}>Current Education</Text>
                </View>
                
                <Text style={styles.inputLabel}>Description</Text>
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
            ))}
            
            {localProfile.education.length === 0 && (
              <TouchableOpacity 
                style={styles.emptyState}
                onPress={addEducation}
              >
                <GraduationCap size={20} color="#0066CC" />
                <Text style={styles.emptyStateText}>Add Education</Text>
                <Plus size={16} color="#0066CC" />
              </TouchableOpacity>
            )}
          </View>
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
              <CheckCircle2 size={16} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Saved</Text>
            </View>
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
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
  backButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
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
  avatarContainer: {
    alignItems: 'center',
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
  section: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#334155',
    marginLeft: 8,
    flex: 1,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    marginBottom: 16,
    marginLeft: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
    marginLeft: 4,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemInput: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  dateField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  dateInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
    marginLeft: 8,
    paddingVertical: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#0066CC',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  checkboxLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#1A1A1A',
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
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
    marginBottom: 24,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
    marginHorizontal: 8,
  },
  sectionLabel: {
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  sectionLabelText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#0066CC',
  },
  dateFieldContainer: {
    flex: 1,
  },
  removeButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requiredBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginLeft: 8,
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  invalidInput: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  requiredPhotoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  photoHelperText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    marginLeft: 8,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
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
  anonymousSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.1)',
  },
  anonymousHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  anonymousSectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#334155',
    marginLeft: 8,
  },
  anonymousDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    marginBottom: 16,
  },
  anonymousOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  anonymousPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  anonymousAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  anonymousAvatarInner: {
    width: '80%',
    height: '80%',
    borderRadius: 100,
    backgroundColor: 'rgba(0, 102, 204, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  anonymousLabel: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#334155',
  },
  anonymousToggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 2,
  },
  anonymousToggleActive: {
    backgroundColor: '#0066CC',
    alignItems: 'flex-end',
  },
  toggleOn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleOff: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});