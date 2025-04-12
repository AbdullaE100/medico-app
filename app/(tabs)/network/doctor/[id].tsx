import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Share, Alert, TouchableOpacity, Dimensions, Platform, Animated, Easing } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Building2, Users, MessageCircle, UserPlus, Share2, UserCheck, User as UserIcon, Stethoscope, Clock, GraduationCap, Briefcase } from 'lucide-react-native';
import { useNetworkStore } from '@/stores/useNetworkStore';
import { useChatStore } from '@/stores/useChatStore';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ErrorMessage } from '@/components/ErrorMessage';
import { LinearGradient } from 'expo-linear-gradient';
import { Education, WorkExperience } from '@/types/database';

const { width, height } = Dimensions.get('window');

// Placeholder component for missing profile images
const ProfileAvatar = ({ uri, size = 100 }: { uri: string | null | undefined; size?: number }) => {
  if (uri && uri.startsWith('http')) {
    return <Image source={{ uri }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} />;
  }
  
  // Placeholder when no avatar is available
  return (
    <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
      <UserIcon size={size * 0.6} color="#FFFFFF" />
    </View>
  );
};

export default function DoctorProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { doctors, followedDoctors, followDoctor, unfollowDoctor } = useNetworkStore();
  const { startChat } = useChatStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

  const doctor = doctors.find(d => d.id === id);
  const isFollowing = followedDoctors.has(id as string);
  
  useEffect(() => {
    if (doctor) {
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
  }, [doctor]);

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await unfollowDoctor(id as string);
      } else {
        await followDoctor(id as string);
      }
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const handleMessage = async () => {
    try {
      setIsLoading(true);
      const chatId = await startChat(id as string);
      router.push(`/chat/${chatId}`);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Check out Dr. ${doctor?.full_name}'s profile on Medical Network!`,
        url: `https://medical.network/doctor/${id}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share profile');
    }
  };

  if (isLoading) {
    return <LoadingOverlay message="Loading doctor profile..." />;
  }

  if (!doctor) {
    return (
      <View style={styles.container}>
        <ErrorMessage message="Doctor not found" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        {error && (
          <ErrorMessage 
            message={error} 
            onDismiss={() => setError(null)}
          />
        )}

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
            <ProfileAvatar uri={doctor.avatar_url} size={80} />
          </View>
          
          {/* Doctor Info */}
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{doctor.full_name}</Text>
            
            <View style={styles.specialtyContainer}>
              <Stethoscope size={16} color="#0066CC" />
              <Text style={styles.specialtyText}>{doctor.specialty}</Text>
            </View>
          </View>
          
          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{doctor.followers_count || 0}</Text>
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

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.actionButton, isFollowing && styles.actionButtonOutline]}
            onPress={handleFollow}
          >
            {isFollowing ? (
              <UserCheck size={18} color="#0066CC" />
            ) : (
              <UserPlus size={18} color="#FFFFFF" />
            )}
            <Text
              style={[
                styles.actionButtonText,
                isFollowing && styles.actionButtonTextOutline,
              ]}
            >
              {isFollowing ? "Connected" : "Connect"}
            </Text>
          </Pressable>
          
          <Pressable
            style={[styles.actionButton, styles.actionButtonOutline]}
            onPress={handleMessage}
          >
            <MessageCircle size={18} color="#0066CC" />
            <Text style={[styles.actionButtonText, styles.actionButtonTextOutline]}>
              Message
            </Text>
          </Pressable>
        </View>

        {/* Additional Info Cards */}
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
          {doctor?.hospital && (
            <View style={styles.infoCard}>
              <View style={styles.cardIconContainer}>
                <Building2 size={16} color="#0066CC" />
              </View>
              <Text style={styles.infoCardText}>{doctor.hospital}</Text>
            </View>
          )}
          
          {/* Location Info */}
          {doctor?.location && (
            <View style={styles.infoCard}>
              <View style={styles.cardIconContainer}>
                <MapPin size={16} color="#0066CC" />
              </View>
              <Text style={styles.infoCardText}>{doctor.location}</Text>
            </View>
          )}
        </Animated.View>
        
        {/* Profile Bio */}
        {doctor?.bio && (
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
            <Text style={styles.bioText}>{doctor.bio}</Text>
          </Animated.View>
        )}

        {/* Expertise */}
        {doctor.expertise?.length > 0 && (
          <Animated.View 
            style={[
              styles.expertiseContainer,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.sectionTitle}>Areas of Expertise</Text>
            <View style={styles.tagsContainer}>
              {doctor.expertise.map((item, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{item}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Education */}
        {doctor.education?.length > 0 && (
          <Animated.View 
            style={[
              styles.sectionContainer,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.sectionTitle}>Education</Text>
            {doctor.education.map((edu, index) => (
              <View 
                key={index} 
                style={[
                  styles.listItem, 
                  index === doctor.education.length - 1 && styles.listItemLast
                ]}
              >
                <GraduationCap size={16} color="#0066CC" style={styles.listItemIcon} />
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle}>{edu.institution}</Text>
                  <Text style={styles.listItemSubtitle}>{edu.degree}</Text>
                  <Text style={styles.listItemDate}>
                    {edu.start_date} {edu.end_date ? `- ${edu.end_date}` : edu.is_current ? '- Present' : ''}
                  </Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Work Experience */}
        {doctor.work_experience?.length > 0 && (
          <Animated.View 
            style={[
              styles.sectionContainer,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {doctor.work_experience.map((work, index) => (
              <View 
                key={index} 
                style={[
                  styles.listItem, 
                  index === doctor.work_experience.length - 1 && styles.listItemLast
                ]}
              >
                <Briefcase size={16} color="#0066CC" style={styles.listItemIcon} />
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle}>{work.organization}</Text>
                  <Text style={styles.listItemSubtitle}>{work.title}</Text>
                  <Text style={styles.listItemDate}>
                    {work.start_date} {work.end_date ? `- ${work.end_date}` : work.is_current ? '- Present' : ''}
                  </Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    zIndex: 0,
  },
  headerDecoration1: {
    position: 'absolute',
    right: -40,
    top: -60,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerDecoration2: {
    position: 'absolute',
    left: -20,
    bottom: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollView: {
    flex: 1,
    paddingTop: 20,
  },
  profileHeader: {
    marginHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginTop: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  avatarSection: {
    position: 'absolute',
    alignSelf: 'center',
    top: -40,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  doctorInfo: {
    marginTop: 50,
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  specialtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  specialtyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0066CC',
    marginLeft: 6,
    fontFamily: 'Inter_500Medium',
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066CC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#0066CC',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0066CC',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  actionButtonTextOutline: {
    color: '#0066CC',
  },
  infoCardsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoCardText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    fontFamily: 'Inter_500Medium',
  },
  bioContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bioTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4b5563',
    fontFamily: 'Inter_400Regular',
  },
  expertiseContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listItemLast: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  listItemIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Inter_600SemiBold',
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 2,
    fontFamily: 'Inter_400Regular',
  },
  listItemDate: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Inter_400Regular',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  }
});