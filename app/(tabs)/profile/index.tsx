import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  Pressable, 
  RefreshControl, 
  Animated, 
  Dimensions, 
  Platform,
  StatusBar,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  Easing
} from 'react-native';
import { Link, useRouter, useFocusEffect } from 'expo-router';
import { 
  Settings, 
  Edit,
  MapPin, 
  Building2, 
  Users, 
  Heart, 
  MessageCircle, 
  Share2, 
  Award, 
  Bookmark, 
  FileText, 
  Repeat2,
  ChevronRight,
  Shield,
  Star,
  Check,
  Hash,
  Briefcase,
  GraduationCap,
  BookOpen,
  Stethoscope,
  Globe,
  UserPlus,
  HeartHandshake,
  Calendar,
  User as UserIcon,
  Camera,
  BarChart2,
  CheckCircle2,
  Bell,
  ExternalLink,
  CheckCircle,
  HeartPulse,
  Beaker,
  Languages,
  ChevronRight as ChevronRightIcon,
  Plus,
  Clock
} from 'lucide-react-native';
import { useProfileStore } from '@/stores/useProfileStore';
import { useFeedStore } from '@/stores/useFeedStore';
import { useNetworkStore } from '@/stores/useNetworkStore';
import { ErrorMessage } from '@/components/ErrorMessage';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { LinearGradient } from 'expo-linear-gradient';
import { WorkExperience, Education, Research, QualityImprovement, Profile } from '@/types/database';

const { width, height } = Dimensions.get('window');

// Add type definition for SuggestedDoctor
interface SuggestedDoctor {
  id: string;
  full_name: string;
  specialty: string;
  avatar_url?: string;
}

const Achievement = ({ icon: Icon, label }: { icon: any; label: string }) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);
  
  return (
    <Animated.View 
      style={[
        styles.achievement,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <LinearGradient
        colors={['#E5F0FF', '#C7E1FF']}
        style={styles.achievementIcon}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Icon size={22} color="#0066CC" />
      </LinearGradient>
      <Text style={styles.achievementText}>{label}</Text>
    </Animated.View>
  );
};

const ProfileTag = ({ tag }: { tag: string }) => (
  <View style={styles.tagItemWrapper}>
    <LinearGradient
      colors={['rgba(0, 102, 204, 0.08)', 'rgba(0, 145, 255, 0.12)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.tagItem}
    >
      <Hash size={12} color="#0066CC" />
      <Text style={styles.tagItemText}>{tag}</Text>
    </LinearGradient>
  </View>
);

const SkillTag = ({ skill }: { skill: string }) => (
  <View style={styles.skillItemWrapper}>
    <LinearGradient
      colors={['rgba(0, 102, 204, 0.08)', 'rgba(0, 145, 255, 0.12)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.skillItem}
    >
      <Star size={12} color="#0066CC" />
      <Text style={styles.skillItemText}>{skill}</Text>
    </LinearGradient>
  </View>
);

const PostCard = ({ post }: { post: any }) => {
  const { likePost, repostPost } = useFeedStore();
  const [isLiking, setIsLiking] = React.useState(false);
  const [isReposting, setIsReposting] = React.useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await likePost(post.id);
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleRepost = async () => {
    if (isReposting) return;
    setIsReposting(true);
    try {
      await repostPost(post.id);
    } catch (error) {
      console.error('Error reposting:', error);
    } finally {
      setIsReposting(false);
    }
  };

  return (
    <View style={styles.postCard}>
      <Text style={styles.postContent}>{post.content}</Text>
      
      {post.media_url?.map((url: string, index: number) => (
        <Image 
          key={index}
          source={{ uri: url }} 
          style={styles.postImage}
          resizeMode="cover"
        />
      ))}

      {post.hashtags && post.hashtags.length > 0 && (
        <View style={styles.hashtags}>
          {post.hashtags.map((tag: string) => (
            <Text key={tag} style={styles.hashtag}>#{tag}</Text>
          ))}
        </View>
      )}

      <View style={styles.postActions}>
        <Pressable onPress={handleLike} style={styles.postAction}>
          <Heart 
            size={20} 
            color={post.has_liked ? '#FF4D4D' : '#666666'} 
            fill={post.has_liked ? '#FF4D4D' : 'transparent'} 
          />
          <Text style={styles.postActionText}>{post.likes_count || 0}</Text>
        </Pressable>

        <Pressable style={styles.postAction}>
          <MessageCircle size={20} color="#666666" />
          <Text style={styles.postActionText}>{post.comments_count || 0}</Text>
        </Pressable>

        <Pressable onPress={handleRepost} style={styles.postAction}>
          <Repeat2 
            size={20} 
            color={post.has_reposted ? '#22C55E' : '#666666'} 
          />
          <Text style={styles.postActionText}>{post.reposts_count || 0}</Text>
        </Pressable>

        <Pressable style={styles.postAction}>
          <Share2 size={20} color="#666666" />
        </Pressable>
      </View>
    </View>
  );
};

// Component for Profile Header with Banner
const ProfileHeader = ({ profile, onEditProfile }: { profile: Profile | null, onEditProfile: () => void }) => {
  const defaultBanner = 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3';
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  useEffect(() => {
    // Animate the profile header elements with staggered timing
    Animated.stagger(100, [
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Check if profile is a verified doctor
  const isVerified = profile?.specialty && profile?.hospital;
  
  return (
    <View style={styles.headerContainer}>
      {/* Banner Section */}
      <ImageBackground
        source={{ uri: defaultBanner }}
        style={styles.bannerImage}
        imageStyle={styles.bannerImageStyle}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,20,50,0.8)']}
          style={styles.bannerGradient}
        >
          <View style={styles.bannerContent}>
            <TouchableOpacity 
              style={styles.editProfileButton} 
              onPress={onEditProfile}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#0066CC', '#0091FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.editProfileButtonGradient}
              >
                <Edit size={18} color="#FFFFFF" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ImageBackground>
      
      {/* Profile Info Section */}
      <Animated.View 
        style={[
          styles.profileContentContainer,
          { 
            opacity, 
            transform: [
              { translateY },
              { scale: scaleAnim }
            ] 
          }
        ]}
      >
        {/* Profile Image & Verification Badge */}
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImageWrapper}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.profileImage} />
            ) : (
              <LinearGradient
                colors={['#0066CC', '#0091FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.profileImagePlaceholder}
              >
                <Text style={styles.profileImagePlaceholderText}>
                  {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'M'}
                </Text>
              </LinearGradient>
            )}
            
            {isVerified && (
              <View style={styles.verifiedBadge}>
                <LinearGradient
                  colors={['#22C55E', '#10B981']}
                  style={styles.verifiedBadgeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <CheckCircle2 size={14} color="#FFFFFF" />
                </LinearGradient>
              </View>
            )}
          </View>
        </View>
        
        {/* Doctor Info */}
        <View style={styles.doctorInfoContainer}>
          <Text style={styles.doctorName}>
            {profile?.full_name || 'Complete Your Profile'}
          </Text>
          
          <View style={styles.specialtyContainer}>
            <Stethoscope size={16} color="#0066CC" />
            <Text style={styles.specialtyText}>
              {profile?.specialty || 'Add your specialty'}
            </Text>
          </View>
          
          <View style={styles.infoCardsContainer}>
            {profile?.hospital && (
              <View style={styles.infoCard}>
                <LinearGradient
                  colors={['rgba(0, 102, 204, 0.1)', 'rgba(0, 145, 255, 0.1)']}
                  style={styles.infoCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Building2 size={16} color="#0066CC" />
                  <Text style={styles.infoCardText}>{profile.hospital}</Text>
                </LinearGradient>
              </View>
            )}
            
            {profile?.location && (
              <View style={styles.infoCard}>
                <LinearGradient
                  colors={['rgba(0, 102, 204, 0.1)', 'rgba(0, 145, 255, 0.1)']}
                  style={styles.infoCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MapPin size={16} color="#0066CC" />
                  <Text style={styles.infoCardText}>{profile.location}</Text>
                </LinearGradient>
              </View>
            )}
          </View>
          
          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.posts_count || 0}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.followers_count || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.following_count || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>
        
        {/* Bio Section */}
        {profile?.bio && (
          <View style={styles.bioContainer}>
            <Text style={styles.bioLabel}>About</Text>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

// Update WorkExperienceSection with improved animations and styling
const WorkExperienceSection = ({ experiences }: { experiences: WorkExperience[] | undefined }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        delay: 300,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    ]).start();
  }, []);
  
  if (!experiences || experiences.length === 0) return null;
  
  return (
    <Animated.View 
      style={[
        styles.sectionContainer,
        { opacity: fadeAnim, transform: [{ translateY }] }
      ]}
    >
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['#0066CC', '#0091FF']}
          style={styles.sectionIconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Briefcase size={16} color="#FFFFFF" />
        </LinearGradient>
        <Text style={styles.sectionTitle}>Work Experience</Text>
      </View>
      
      <View style={styles.experienceList}>
        {experiences.map((exp, index) => (
          <View key={index} style={styles.experienceItem}>
            <View style={styles.experienceDateContainer}>
              <Text style={styles.experienceDate}>
                {exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}
              </Text>
            </View>
            <View style={styles.experienceContent}>
              <Text style={styles.experienceTitle}>{exp.title}</Text>
              <Text style={styles.experienceOrg}>{exp.organization}</Text>
              {exp.location && (
                <View style={styles.experienceLocation}>
                  <MapPin size={14} color="#64748b" />
                  <Text style={styles.experienceLocationText}>{exp.location}</Text>
                </View>
              )}
              {exp.description && (
                <Text style={styles.experienceDescription}>{exp.description}</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

// Update EducationSection with improved animations and styling
const EducationSection = ({ education }: { education: Education[] | undefined }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        delay: 400,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        delay: 400,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    ]).start();
  }, []);
  
  if (!education || education.length === 0) return null;
  
  return (
    <Animated.View 
      style={[
        styles.sectionContainer,
        { opacity: fadeAnim, transform: [{ translateY }] }
      ]}
    >
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['#0066CC', '#0091FF']}
          style={styles.sectionIconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <GraduationCap size={16} color="#FFFFFF" />
        </LinearGradient>
        <Text style={styles.sectionTitle}>Education</Text>
      </View>
      
      <View style={styles.educationList}>
        {education.map((edu, index) => (
          <View key={index} style={styles.educationItem}>
            <View style={styles.educationDateContainer}>
              <Text style={styles.educationDate}>
                {edu.start_date} - {edu.is_current ? 'Present' : edu.end_date}
              </Text>
            </View>
            <View style={styles.educationContent}>
              <Text style={styles.educationDegree}>{edu.degree}</Text>
              <Text style={styles.educationInstitution}>{edu.institution}</Text>
              {edu.location && (
                <View style={styles.educationLocation}>
                  <MapPin size={14} color="#64748b" />
                  <Text style={styles.educationLocationText}>{edu.location}</Text>
                </View>
              )}
              {edu.description && (
                <Text style={styles.educationDescription}>{edu.description}</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

// Update the ResearchSection with animations and improved design
const ResearchSection = ({ research }: { research: Research[] | undefined }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        delay: 500,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        delay: 500,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    ]).start();
  }, []);
  
  if (!research || research.length === 0) return null;
  
  return (
    <Animated.View 
      style={[
        styles.sectionContainer,
        { opacity: fadeAnim, transform: [{ translateY }] }
      ]}
    >
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['#0066CC', '#0091FF']}
          style={styles.sectionIconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <FileText size={16} color="#FFFFFF" />
        </LinearGradient>
        <Text style={styles.sectionTitle}>Research</Text>
      </View>
      
      <View style={styles.researchList}>
        {research.map((item, index) => (
          <View key={index} style={styles.researchItem}>
            <Text style={styles.researchTitle}>{item.title}</Text>
            {item.journal && (
              <Text style={styles.researchJournal}>{item.journal}</Text>
            )}
            {item.publication_date && (
              <View style={styles.researchDate}>
                <Calendar size={14} color="#64748b" />
                <Text style={styles.researchDateText}>{item.publication_date}</Text>
              </View>
            )}
            {item.description && (
              <Text style={styles.researchDescription}>{item.description}</Text>
            )}
            {item.url && (
              <TouchableOpacity style={styles.researchLink}>
                <Text style={styles.researchLinkText}>View Publication</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

// Update QualityImprovement section with animations and premium styling
const QualityImprovementSection = ({ improvements }: { improvements: QualityImprovement[] | undefined }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        delay: 550,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        delay: 550,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    ]).start();
  }, []);
  
  if (!improvements || improvements.length === 0) return null;
  
  return (
    <Animated.View 
      style={[
        styles.sectionContainer,
        { opacity: fadeAnim, transform: [{ translateY }] }
      ]}
    >
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['#0066CC', '#0091FF']}
          style={styles.sectionIconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <BarChart2 size={16} color="#FFFFFF" />
        </LinearGradient>
        <Text style={styles.sectionTitle}>Quality Improvement</Text>
      </View>
      
      <View style={styles.qiList}>
        {improvements.map((item, index) => (
          <View key={index} style={styles.qiItem}>
            <Text style={styles.qiTitle}>{item.title}</Text>
            {item.organization && (
              <Text style={styles.qiOrganization}>{item.organization}</Text>
            )}
            {item.date && (
              <View style={styles.qiDate}>
                <Calendar size={14} color="#64748b" />
                <Text style={styles.qiDateText}>{item.date}</Text>
              </View>
            )}
            {item.description && (
              <Text style={styles.qiDescription}>{item.description}</Text>
            )}
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

// Update Interests section with animations and premium styling
const InterestsSection = ({ interests }: { interests: string[] | undefined }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        delay: 600,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        delay: 600,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    ]).start();
  }, []);
  
  if (!interests || interests.length === 0) return null;
  
  return (
    <Animated.View 
      style={[
        styles.sectionContainer,
        { opacity: fadeAnim, transform: [{ translateY }] }
      ]}
    >
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['#0066CC', '#0091FF']}
          style={styles.sectionIconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <HeartHandshake size={16} color="#FFFFFF" />
        </LinearGradient>
        <Text style={styles.sectionTitle}>Interests</Text>
      </View>
      
      <View style={styles.interestsList}>
        {interests.map((interest, index) => (
          <View key={index} style={styles.interestItemWrapper}>
            <LinearGradient
              colors={['rgba(0, 102, 204, 0.08)', 'rgba(0, 145, 255, 0.12)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.interestItem}
            >
              <HeartHandshake size={12} color="#0066CC" />
              <Text style={styles.interestText}>{interest}</Text>
            </LinearGradient>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

// Update Languages section with animations and premium styling
const LanguagesSection = ({ languages }: { languages: { name: string; proficiency: string }[] | undefined }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        delay: 650,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        delay: 650,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    ]).start();
  }, []);
  
  if (!languages || languages.length === 0) return null;
  
  // Helper function to render proficiency indicator
  const renderProficiencyIndicator = (proficiency: string) => {
    const levels = {
      native: 4,
      fluent: 3,
      conversational: 2,
      basic: 1
    };
    
    const level = levels[proficiency as keyof typeof levels] || 1;
    
    return (
      <View style={styles.proficiencyIndicator}>
        {[1, 2, 3, 4].map(i => (
          <View 
            key={i} 
            style={[
              styles.proficiencyDot, 
              i <= level ? styles.proficiencyActive : styles.proficiencyInactive
            ]} 
          />
        ))}
      </View>
    );
  };
  
  return (
    <Animated.View 
      style={[
        styles.sectionContainer,
        { opacity: fadeAnim, transform: [{ translateY }] }
      ]}
    >
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['#0066CC', '#0091FF']}
          style={styles.sectionIconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Globe size={16} color="#FFFFFF" />
        </LinearGradient>
        <Text style={styles.sectionTitle}>Languages</Text>
      </View>
      
      <View style={styles.languagesList}>
        {languages.map((lang, index) => (
          <View key={index} style={styles.languageItem}>
            <Text style={styles.languageName}>{lang.name}</Text>
            <View style={styles.languageProficiency}>
              <Text style={styles.proficiencyLabel}>{lang.proficiency}</Text>
              {renderProficiencyIndicator(lang.proficiency)}
            </View>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

// Update SuggestedConnectionsSection with animations and premium styling
const SuggestedConnectionsSection = ({ suggestedDoctors }: { suggestedDoctors?: SuggestedDoctor[] }) => {
  const { followDoctor } = useNetworkStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        delay: 700,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        delay: 700,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    ]).start();
  }, []);
  
  if (!suggestedDoctors || suggestedDoctors.length === 0) return null;
  
  return (
    <Animated.View 
      style={[
        styles.sectionContainer,
        { opacity: fadeAnim, transform: [{ translateY }] }
      ]}
    >
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['#0066CC', '#0091FF']}
          style={styles.sectionIconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <UserPlus size={16} color="#FFFFFF" />
        </LinearGradient>
        <Text style={styles.sectionTitle}>Suggested Connections</Text>
      </View>
      
      <View style={styles.connectionsList}>
        {suggestedDoctors.map((doctor: SuggestedDoctor, index: number) => (
          <View key={index} style={styles.connectionItem}>
            <Image 
              source={{ uri: doctor.avatar_url || 'https://via.placeholder.com/50' }} 
              style={styles.connectionAvatar} 
            />
            <View style={styles.connectionInfo}>
              <Text style={styles.connectionName}>{doctor.full_name}</Text>
              <Text style={styles.connectionTitle}>{doctor.specialty}</Text>
            </View>
            <TouchableOpacity 
              style={styles.connectButton}
              onPress={() => followDoctor(doctor.id)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#0066CC', '#0091FF']}
                style={styles.connectButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <UserPlus size={16} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

// Update the SkillsSection with animations and improved design
const SkillsSection = ({ skills }: { skills: string[] | undefined }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(15)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 250,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        delay: 250,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    ]).start();
  }, []);
  
  if (!skills || skills.length === 0) return null;
  
  return (
    <Animated.View 
      style={[
        styles.sectionContainer, 
        { opacity: fadeAnim, transform: [{ translateY }] }
      ]}
    >
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['#0066CC', '#0091FF']}
          style={styles.sectionIconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Star size={16} color="#FFFFFF" />
        </LinearGradient>
        <Text style={styles.sectionTitle}>Skills</Text>
      </View>
      
      <View style={styles.tagsContainer}>
        {skills.map((skill, index) => (
          <SkillTag key={index} skill={skill} />
        ))}
      </View>
    </Animated.View>
  );
};

// Update EmptyPostsSection with animations and premium styling
const EmptyPostsSection = () => {
  const { createPost } = useFeedStore();
  const [creating, setCreating] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        delay: 700,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        delay: 700,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    ]).start();
  }, []);
  
  const handleCreateSample = async () => {
    try {
      setCreating(true);
      await createPost(
        "This is a sample post to test that posting works correctly.",
        ["sample", "test"],
        []
      );
      console.log("Created sample post");
    } catch (error) {
      console.error("Error creating sample post:", error);
    } finally {
      setCreating(false);
    }
  };
  
  return (
    <Animated.View 
      style={[
        styles.sectionContainer,
        { opacity: fadeAnim, transform: [{ translateY }] }
      ]}
    >
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['#0066CC', '#0091FF']}
          style={styles.sectionIconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <FileText size={16} color="#FFFFFF" />
        </LinearGradient>
        <Text style={styles.sectionTitle}>No Posts Yet</Text>
      </View>
      
      <View style={styles.emptyStateContainer}>
        <View style={styles.emptyStateIconContainer}>
          <LinearGradient
            colors={['rgba(0, 102, 204, 0.08)', 'rgba(0, 145, 255, 0.12)']}
            style={styles.emptyStateIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <FileText size={36} color="#0066CC" />
          </LinearGradient>
        </View>
        
        <Text style={styles.emptyMessage}>
          You haven't created any posts yet. Share your thoughts, research, or experiences with the community.
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.createPostButtonContainer}
        onPress={handleCreateSample}
        disabled={creating}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#0066CC', '#0091FF']}
          style={styles.createPostButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {creating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <FileText size={18} color="#FFFFFF" />
              <Text style={styles.createPostButtonText}>Create Sample Post</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Create a new ExpertiseSection component
const ExpertiseSection = ({ expertise }: { expertise: string[] | undefined }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(15)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    ]).start();
  }, []);
  
  if (!expertise || expertise.length === 0) return null;
  
  return (
    <Animated.View 
      style={[
        styles.sectionContainer, 
        { opacity: fadeAnim, transform: [{ translateY }] }
      ]}
    >
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['#0066CC', '#0091FF']}
          style={styles.sectionIconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Star size={16} color="#FFFFFF" />
        </LinearGradient>
        <Text style={styles.sectionTitle}>Areas of Expertise</Text>
      </View>
      
      <View style={styles.expertiseContainer}>
        {expertise.map((item, index) => (
          <View key={index} style={styles.expertiseTag}>
            <LinearGradient
              colors={['rgba(0, 102, 204, 0.08)', 'rgba(0, 145, 255, 0.12)']}
              style={styles.expertiseTagGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.expertiseTagText}>{item}</Text>
            </LinearGradient>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

export default function ProfileScreen() {
  const { profile, settings, isLoading: profileLoading, error: profileError, fetchProfile } = useProfileStore();
  const { posts, isLoading: postsLoading, error: postsError, fetchPosts, createPost } = useFeedStore();
  const { 
    suggestedDoctors = [], 
    fetchSuggestedConnections,
    isLoading: networkLoading
  } = useNetworkStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const router = useRouter();
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const headerHeight = useRef(new Animated.Value(0)).current;

  // Function to load data
  const loadData = async () => {
    console.log("Loading profile data in ProfileScreen");
    await fetchProfile();
    
    // After profile is loaded, fetch related data
    if (profile?.id) {
      console.log("Fetching posts for user ID:", profile.id);
      fetchPosts({ userId: profile.id, forceRefresh: true });
      if (fetchSuggestedConnections) {
        fetchSuggestedConnections();
      }
    }
  };

  // Use focus effect to reload data when the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log("Profile screen focused, refreshing data");
      loadData();
      return () => {}; // cleanup function
    }, [])
  );

  // Fetch data when component mounts and handle animations
  useEffect(() => {
    // Start animations
    Animated.timing(headerHeight, {
      toValue: 1,
      duration: 800,
      useNativeDriver: false,
    }).start();
    
    // Animate content
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Refresh handler with loading feedback
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    
    try {
      await fetchProfile();
      
      // After profile is refreshed, fetch related data
      if (profile?.id) {
        await Promise.all([
          fetchPosts({ userId: profile.id, forceRefresh: true }),
          fetchSuggestedConnections ? fetchSuggestedConnections() : Promise.resolve()
        ]);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setRefreshing(false);
    }
  }, [profile?.id, fetchSuggestedConnections]);

  const navigateToEditProfile = () => {
    router.push('/profile/edit');
  };

  // Interpolate values for animations
  const interpolatedHeaderHeight = headerHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [80, Platform.OS === 'ios' ? 140 : 120]
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100, 150],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });
  
  const avatarScale = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  // Modified render section for posts
  useEffect(() => {
    if (posts) {
      console.log(posts.length > 0 ? `Rendering ${posts.length} posts` : "No posts to display");
    }
  }, [posts]);

  if (profileLoading && !refreshing) {
    return <LoadingOverlay message="Loading profile..." />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#0066CC"
            colors={['#0066CC']}
            progressBackgroundColor="#FFFFFF"
          />
        }
      >
        <ProfileHeader profile={profile} onEditProfile={navigateToEditProfile} />
        
        {/* Render all profile sections */}
        <Animated.View 
          style={[
            styles.mainContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY }]
            }
          ]}
        >
          <ExpertiseSection expertise={profile?.expertise} />
          <SkillsSection skills={profile?.skills} />
          
          <WorkExperienceSection experiences={profile?.work_experience} />
          <EducationSection education={profile?.education} />
          
          <ResearchSection research={profile?.research} />
          <QualityImprovementSection improvements={profile?.quality_improvement} />
          
          <InterestsSection interests={profile?.interests} />
          <LanguagesSection languages={profile?.languages} />
          
          {/* Featured Posts Section */}
          {posts && posts.length > 0 ? (
            <Animated.View
              style={[
                styles.sectionContainer,
                { opacity: fadeAnim, transform: [{ translateY }] }
              ]}
            >
              <View style={styles.sectionHeader}>
                <LinearGradient
                  colors={['#0066CC', '#0091FF']}
                  style={styles.sectionIconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <FileText size={16} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.sectionTitle}>Featured Posts</Text>
              </View>
              
              <View style={styles.postsContainer}>
                {posts.slice(0, 2).map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
                
                {posts.length > 2 && (
                  <Link href="/profile/posts" asChild>
                    <TouchableOpacity style={styles.viewAllButton}>
                      <Text style={styles.viewAllText}>View All Posts</Text>
                      <ChevronRightIcon size={18} color="#0066CC" />
                    </TouchableOpacity>
                  </Link>
                )}
              </View>
            </Animated.View>
          ) : <EmptyPostsSection />}
          
          {/* Suggested Connections at the end */}
          <SuggestedConnectionsSection suggestedDoctors={suggestedDoctors} />
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 0,
    paddingBottom: 40,
  },
  mainContent: {
    paddingHorizontal: 16,
  },
  headerContainer: {
    backgroundColor: '#F8FAFC',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: 24,
  },
  bannerImage: {
    width: '100%',
    height: 180,
  },
  bannerImageStyle: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  bannerGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  bannerContent: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  editProfileButton: {
    overflow: 'hidden',
    borderRadius: 24,
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  editProfileButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  editButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  profileContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: -60,
    marginBottom: 16,
  },
  profileImageWrapper: {
    position: 'relative',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImagePlaceholderText: {
    fontSize: 42,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  verifiedBadgeGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorInfoContainer: {
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  specialtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  specialtyText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#334155',
    marginLeft: 6,
  },
  infoCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 10,
  },
  infoCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  infoCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  infoCardText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#334155',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 102, 204, 0.04)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    marginTop: 4,
  },
  statSeparator: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(0, 102, 204, 0.15)',
  },
  bioContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 20,
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.08)',
  },
  bioLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#0F172A',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#334155',
    lineHeight: 22,
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 102, 204, 0.08)',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#0F172A',
    marginLeft: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagItemWrapper: {
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.1)',
    borderRadius: 16,
  },
  tagItemText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
    marginLeft: 4,
  },
  skillItemWrapper: {
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.1)',
    borderRadius: 16,
  },
  skillItemText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
    marginLeft: 6,
  },
  experienceList: {
    gap: 20,
  },
  experienceItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  experienceDateContainer: {
    width: 100,
    paddingRight: 14,
  },
  experienceDate: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#64748b',
  },
  experienceContent: {
    flex: 1,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(0, 102, 204, 0.3)',
    paddingLeft: 14,
  },
  experienceTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#0F172A',
    marginBottom: 4,
  },
  experienceOrg: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
    marginBottom: 6,
  },
  experienceLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  experienceLocationText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#64748b',
    marginLeft: 6,
  },
  experienceDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#334155',
    lineHeight: 21,
  },
  educationList: {
    gap: 20,
  },
  educationItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  educationDateContainer: {
    width: 100,
    paddingRight: 14,
  },
  educationDate: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#64748b',
  },
  educationContent: {
    flex: 1,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(0, 102, 204, 0.3)',
    paddingLeft: 14,
  },
  educationDegree: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#0F172A',
    marginBottom: 4,
  },
  educationInstitution: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
    marginBottom: 6,
  },
  educationLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  educationLocationText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#64748b',
    marginLeft: 6,
  },
  educationDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#334155',
    lineHeight: 20,
  },
  researchList: {
    gap: 16,
  },
  researchItem: {
    backgroundColor: 'rgba(0, 102, 204, 0.04)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.08)',
  },
  researchTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#0F172A',
    marginBottom: 4,
  },
  researchJournal: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
    marginBottom: 6,
  },
  researchDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  researchDateText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#64748b',
    marginLeft: 6,
  },
  researchDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#334155',
    lineHeight: 21,
    marginBottom: 12,
  },
  researchLink: {
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.15)',
  },
  researchLinkText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#0066CC',
  },
  qiList: {
    gap: 16,
  },
  qiItem: {
    backgroundColor: 'rgba(0, 102, 204, 0.04)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.08)',
  },
  qiTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#0F172A',
    marginBottom: 4,
  },
  qiOrganization: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
    marginBottom: 6,
  },
  qiDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  qiDateText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#64748b',
    marginLeft: 6,
  },
  qiDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#334155',
    lineHeight: 20,
  },
  interestsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestItemWrapper: {
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  interestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.1)',
    borderRadius: 16,
  },
  interestText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
    marginLeft: 6,
  },
  languagesList: {
    gap: 12,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  languageName: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#1e293b',
  },
  languageProficiency: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  proficiencyLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  proficiencyIndicator: {
    flexDirection: 'row',
    gap: 3,
  },
  proficiencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  proficiencyActive: {
    backgroundColor: '#0066CC',
  },
  proficiencyInactive: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  postsContainer: {
    gap: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 12,
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.1)',
  },
  viewAllText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#0066CC',
    marginRight: 6,
  },
  connectionsList: {
    gap: 12,
  },
  connectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0, 102, 204, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.05)',
    marginBottom: 8,
  },
  connectionAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#0F172A',
    marginBottom: 4,
  },
  connectionTitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#64748b',
  },
  connectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  connectButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievement: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  achievementText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#64748b',
    textAlign: 'center',
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.05)',
  },
  postContent: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#334155',
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  hashtags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  hashtag: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
    marginRight: 8,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 12,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  postActionText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#64748b',
    marginLeft: 4,
  },
  expertiseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  expertiseTag: {
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  expertiseTagGradient: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  expertiseTagText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateIconContainer: {
    marginBottom: 16,
    borderRadius: 44,
    padding: 2,
    backgroundColor: 'rgba(0, 102, 204, 0.04)',
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyMessage: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#334155',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  createPostButtonContainer: {
    overflow: 'hidden',
    borderRadius: 16,
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
  },
  createPostButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});