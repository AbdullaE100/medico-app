import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Animated, 
  StatusBar,
  Dimensions,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  Building2,
  MapPin,
  Stethoscope,
  Award,
  Users,
  MessageCircle,
  CheckCircle,
  PenSquare,
  Star,
  Clock,
  Briefcase,
  GraduationCap,
  Calendar,
  Plus
} from 'lucide-react-native';
import { useProfileStore } from '@/stores/useProfileStore';
import { LoadingOverlay } from '@/components/LoadingOverlay';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { profile, isLoading, fetchProfile } = useProfileStore();
  const router = useRouter();
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  useEffect(() => {
    fetchProfile();
  }, []);
  
  useEffect(() => {
    if (!isLoading && profile) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isLoading, profile]);

  // Calculate profile completion
  const calculateProfileCompletion = () => {
    if (!profile) return 0;
    
    const requiredFields = [
      'full_name',
      'specialty',
      'hospital',
      'location',
      'bio',
      'avatar_url'
    ];
    
    // Count basic fields
    let completedCount = requiredFields.filter(field => {
      const value = profile[field as keyof typeof profile];
      return value && String(value).trim().length > 0;
    }).length;
    
    // Add additional points for having work experience
    if (profile.work_experience && profile.work_experience.length > 0) {
      completedCount += 1;
    }
    
    // Add additional points for having education
    if (profile.education && profile.education.length > 0) {
      completedCount += 1;
    }
    
    // Calculate percentage based on total possible fields (basic fields + work + education)
    return Math.round((completedCount / (requiredFields.length + 2)) * 100);
  };
  
  const profileCompletionPercent = calculateProfileCompletion();
  
  const getMissingFields = () => {
    if (!profile) return [];
    
    const fieldsWithLabels = {
      'full_name': 'Full Name',
      'specialty': 'Specialty',
      'hospital': 'Hospital/Institution',
      'location': 'Location',
      'bio': 'Bio',
      'avatar_url': 'Profile Photo'
    };
    
    const missingBasicFields = Object.entries(fieldsWithLabels)
      .filter(([field]) => {
        const value = profile[field as keyof typeof profile];
        return !value || String(value).trim().length === 0;
      })
      .map(([_, label]) => label);
    
    const missingFields = [...missingBasicFields];
    
    // Check if work experience is missing
    if (!profile.work_experience || profile.work_experience.length === 0) {
      missingFields.push('Work Experience');
    }
    
    // Check if education is missing
    if (!profile.education || profile.education.length === 0) {
      missingFields.push('Education');
    }
    
    return missingFields;
  };
  
  const missingFields = getMissingFields();
  
  const handleEditProfile = () => {
    router.push('/profile/edit');
  };
  
  if (isLoading) {
    return <LoadingOverlay message="Loading profile..." />;
  }
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header Background */}
      <LinearGradient
        colors={['#0a4da3', '#0066CC', '#1a80e5']}
        style={styles.headerBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerDecoration1} />
        <View style={styles.headerDecoration2} />
      </LinearGradient>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <Animated.View 
          style={[
            styles.profileHeader,
            { 
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ] 
            }
          ]}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.placeholderAvatar}>
                <User size={60} color="#FFFFFF" />
              </View>
            )}
            
            {profileCompletionPercent === 100 && (
              <View style={styles.verifiedBadge}>
                <CheckCircle size={14} color="#FFFFFF" />
              </View>
            )}
          </View>
          
          {/* Doctor Info */}
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>
              {profile?.full_name || 'Complete Your Profile'}
            </Text>
            
            {profile?.specialty ? (
              <View style={styles.specialtyContainer}>
                <Stethoscope size={16} color="#0066CC" />
                <Text style={styles.specialtyText}>{profile.specialty}</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={[styles.specialtyContainer, styles.addSpecialty]}
                onPress={handleEditProfile}
              >
                <Stethoscope size={16} color="#0066CC" />
                <Text style={styles.addSpecialtyText}>Add your specialty</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.followers_count || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.activeContainer}>
                <Clock size={14} color="#0066CC" style={styles.activeIcon} />
              </View>
              <Text style={styles.statValue}>Active</Text>
              <Text style={styles.statLabel}>Response</Text>
            </View>
          </View>
        </Animated.View>
        
        {/* Profile Completion Card */}
        <Animated.View 
          style={[
            styles.profileCompletionCard,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.completionTitle}>Profile Completion</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${profileCompletionPercent}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{profileCompletionPercent}%</Text>
          </View>
          
          {missingFields.length > 0 && (
            <View style={styles.missingFieldsContainer}>
              <Text style={styles.missingFieldsTitle}>
                Complete to improve visibility:
              </Text>
              {missingFields.map((field, index) => (
                <View key={index} style={styles.missingField}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.missingFieldText}>{field}</Text>
                </View>
              ))}
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={handleEditProfile}
          >
            <PenSquare size={16} color="#FFFFFF" />
            <Text style={styles.editButtonText}>
              {profileCompletionPercent === 100 ? 'Edit Profile' : 'Complete Profile'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Additional Info Cards */}
        {profile && profileCompletionPercent > 50 && (
          <Animated.View 
            style={[
              styles.infoCardsContainer,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Hospital Info */}
            {profile?.hospital && (
              <View style={styles.infoCard}>
                <View style={styles.cardIconContainer}>
                  <Building2 size={16} color="#0066CC" />
                </View>
                <Text style={styles.infoCardText}>{profile.hospital}</Text>
              </View>
            )}
            
            {/* Location Info */}
            {profile?.location && (
              <View style={styles.infoCard}>
                <View style={styles.cardIconContainer}>
                  <MapPin size={16} color="#0066CC" />
                </View>
                <Text style={styles.infoCardText}>{profile.location}</Text>
              </View>
            )}
          </Animated.View>
        )}
        
        {/* Profile Bio */}
        {profile?.bio && profileCompletionPercent > 70 && (
          <Animated.View 
            style={[
              styles.bioContainer,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.bioTitle}>About</Text>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </Animated.View>
        )}
        
        {/* Work Experience Section */}
        {profile?.work_experience && profile.work_experience.length > 0 ? (
          <Animated.View 
            style={[
              styles.sectionContainer,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.sectionHeader}>
              <Briefcase size={20} color="#0066CC" />
              <Text style={styles.sectionTitle}>Work Experience</Text>
              <TouchableOpacity 
                style={styles.addSectionButton}
                onPress={() => router.push('/profile/edit')}
              >
                <Plus size={16} color="#0066CC" />
              </TouchableOpacity>
            </View>
            
            {profile.work_experience.map((item, index) => (
              <View key={item.id || index} style={styles.experienceCard}>
                <View style={styles.experienceHeader}>
                  <Text style={styles.experienceTitle}>{item.title}</Text>
                  {item.is_current && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.experienceDetails}>
                  <View style={styles.detailRow}>
                    <Building2 size={16} color="#64748B" />
                    <Text style={styles.experienceCompany}>{item.organization}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Calendar size={16} color="#64748B" />
                    <Text style={styles.experienceDates}>
                      {item.start_date} - {item.end_date || 'Present'}
                    </Text>
                  </View>
                </View>
                
                {item.description && (
                  <Text style={styles.experienceDescription}>
                    {item.description}
                  </Text>
                )}
              </View>
            ))}
          </Animated.View>
        ) : profileCompletionPercent >= 70 && (
          <Animated.View 
            style={[
              styles.emptySection,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Briefcase size={24} color="#0066CC" style={styles.emptySectionIcon} />
            <Text style={styles.emptySectionTitle}>Add Work Experience</Text>
            <Text style={styles.emptySectionDescription}>
              Showcase your professional experience to build credibility
            </Text>
            <TouchableOpacity 
              style={styles.emptySectionButton}
              onPress={() => router.push('/profile/edit')}
            >
              <Text style={styles.emptySectionButtonText}>Add Experience</Text>
              <Plus size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        )}
        
        {/* Education Section */}
        {profile?.education && profile.education.length > 0 ? (
          <Animated.View 
            style={[
              styles.sectionContainer,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.sectionHeader}>
              <GraduationCap size={20} color="#0066CC" />
              <Text style={styles.sectionTitle}>Education</Text>
              <TouchableOpacity 
                style={styles.addSectionButton}
                onPress={() => router.push('/profile/edit')}
              >
                <Plus size={16} color="#0066CC" />
              </TouchableOpacity>
            </View>
            
            {profile.education.map((item, index) => (
              <View key={item.id || index} style={styles.experienceCard}>
                <View style={styles.experienceHeader}>
                  <Text style={styles.experienceTitle}>{item.degree}</Text>
                  {item.is_current && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.experienceDetails}>
                  <View style={styles.detailRow}>
                    <Building2 size={16} color="#64748B" />
                    <Text style={styles.experienceCompany}>{item.institution}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Calendar size={16} color="#64748B" />
                    <Text style={styles.experienceDates}>
                      {item.start_date} - {item.end_date || 'Present'}
                    </Text>
                  </View>
                </View>
                
                {item.description && (
                  <Text style={styles.experienceDescription}>
                    {item.description}
                  </Text>
                )}
              </View>
            ))}
          </Animated.View>
        ) : profileCompletionPercent >= 70 && (
          <Animated.View 
            style={[
              styles.emptySection,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <GraduationCap size={24} color="#0066CC" style={styles.emptySectionIcon} />
            <Text style={styles.emptySectionTitle}>Add Education</Text>
            <Text style={styles.emptySectionDescription}>
              Share your educational background to highlight your qualifications
            </Text>
            <TouchableOpacity 
              style={styles.emptySectionButton}
              onPress={() => router.push('/profile/edit')}
            >
              <Text style={styles.emptySectionButtonText}>Add Education</Text>
              <Plus size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        )}
        
        {/* Benefits of completing profile */}
        {profileCompletionPercent < 100 && (
          <Animated.View 
            style={[
              styles.benefitsContainer,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.benefitsTitle}>
              Benefits of a Complete Profile
            </Text>
            
            <View style={styles.benefitItem}>
              <Users size={18} color="#0066CC" style={styles.benefitIcon} />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitName}>Grow Your Network</Text>
                <Text style={styles.benefitDesc}>
                  Doctors with complete profiles get 5x more connection requests
                </Text>
              </View>
            </View>
            
            <View style={styles.benefitItem}>
              <MessageCircle size={18} color="#0066CC" style={styles.benefitIcon} />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitName}>Better Communication</Text>
                <Text style={styles.benefitDesc}>
                  Receive more relevant messages from peers in your specialty
                </Text>
              </View>
            </View>
            
            <View style={styles.benefitItem}>
              <Award size={18} color="#0066CC" style={styles.benefitIcon} />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitName}>Professional Recognition</Text>
                <Text style={styles.benefitDesc}>
                  Stand out as a verified specialist in your field
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 160 : 140,
    zIndex: 0,
    overflow: 'hidden',
  },
  headerDecoration1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -100,
    right: -50,
    transform: [{ scale: 1.2 }],
  },
  headerDecoration2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    bottom: -70,
    left: -30,
    transform: [{ scale: 1.5 }],
  },
  scrollView: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    zIndex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
  },
  avatarSection: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'white',
  },
  placeholderAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#00CC66',
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  doctorInfo: {
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  specialtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 5,
  },
  addSpecialty: {
    borderWidth: 1,
    borderColor: '#0066CC',
    borderStyle: 'dashed',
  },
  specialtyText: {
    color: '#0066CC',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    marginLeft: 5,
  },
  addSpecialtyText: {
    color: '#0066CC',
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    marginLeft: 5,
  },
  profileCompletionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  completionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#1e293b',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBarBg: {
    flex: 1,
    height: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    marginRight: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0066CC',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#0066CC',
    width: 45,
    textAlign: 'right',
  },
  missingFieldsContainer: {
    marginBottom: 15,
  },
  missingFieldsTitle: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#475569',
    marginBottom: 8,
  },
  missingField: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0066CC',
    marginRight: 8,
  },
  missingFieldText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#64748b',
  },
  editProfileButton: {
    backgroundColor: '#0066CC',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#0066CC',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    marginLeft: 8,
  },
  infoCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 10,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  infoCardText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#334155',
    flex: 1,
  },
  bioContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  bioTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#1e293b',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#475569',
    lineHeight: 20,
  },
  sectionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#1e293b',
    marginLeft: 8,
  },
  experienceCard: {
    borderLeftWidth: 2,
    borderLeftColor: '#0066CC',
    paddingLeft: 12,
    marginBottom: 16,
    paddingBottom: 8,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  experienceTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#334155',
    flex: 1,
  },
  currentBadge: {
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
  },
  experienceDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  experienceCompany: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#475569',
    marginLeft: 8,
  },
  experienceDates: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    marginLeft: 8,
  },
  experienceDescription: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    lineHeight: 18,
  },
  addSectionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySection: {
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(0, 102, 204, 0.3)',
  },
  emptySectionIcon: {
    marginBottom: 12,
  },
  emptySectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#334155',
    marginBottom: 8,
  },
  emptySectionDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptySectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066CC',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  emptySectionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#FFFFFF',
  },
  benefitsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  benefitsTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#1e293b',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  benefitIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  benefitTextContainer: {
    flex: 1,
  },
  benefitName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#334155',
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#64748b',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(0, 102, 204, 0.15)',
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#64748b',
  },
  activeContainer: {
    position: 'absolute',
    top: -18,
    right: -16,
  },
  activeIcon: {
    opacity: 0.9,
  },
});