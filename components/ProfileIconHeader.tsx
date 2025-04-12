import React, { useState, useEffect } from 'react';
import { 
  TouchableOpacity, 
  View, 
  StyleSheet, 
  Platform,
  Image,
  Alert
} from 'react-native';
import { User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useProfileStore } from '@/stores/useProfileStore';
import ProfileSlidingPanel from '@/components/ProfileSlidingPanel';

interface ProfileIconHeaderProps {
  inHeader?: boolean; // If true, renders just the icon for injection into existing headers
}

const ProfileIconHeader: React.FC<ProfileIconHeaderProps> = ({ inHeader = false }) => {
  const router = useRouter();
  const { profile, fetchProfile } = useProfileStore();
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  
  // Add useEffect to track panel visibility changes
  useEffect(() => {
    console.log('isPanelVisible changed to:', isPanelVisible);
  }, [isPanelVisible]);
  
  // Load profile data on mount
  useEffect(() => {
    loadProfileData();
  }, []);
  
  const loadProfileData = async () => {
    try {
      await fetchProfile();
    } catch (error) {
      console.error('Error loading profile data in header:', error);
    }
  };

  const handleProfilePress = () => {
    console.log('Profile icon pressed, showing panel with userId:', profile?.id);
    console.log('Current isPanelVisible state before change:', isPanelVisible);
    if (!profile?.id) {
      console.warn('No profile id available, attempting to fetch profile first');
      loadProfileData().then(() => {
        console.log('Profile data loaded, now showing panel with userId:', profile?.id);
        setIsPanelVisible(true);
        console.log('Set isPanelVisible to true');
      }).catch(error => {
        console.error('Failed to load profile data:', error);
        // Show panel anyway as a fallback
        setIsPanelVisible(true);
        console.log('Set isPanelVisible to true (after error)');
      });
    } else {
      setIsPanelVisible(true);
      console.log('Set isPanelVisible to true (direct path)');
    }
  };

  const handleClosePanel = () => {
    console.log('Closing panel');
    setIsPanelVisible(false);
  };

  // If this component is being used inside an existing header
  if (inHeader) {
    return (
      <>
        <View style={styles.iconContainerInline}>
          <TouchableOpacity
            onPress={handleProfilePress}
            style={styles.iconButton}
            activeOpacity={0.6}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            pressRetentionOffset={{ top: 20, bottom: 20, left: 20, right: 20 }}
            delayPressIn={0}
          >
            <LinearGradient
              colors={['#0066CC', '#0091FF']}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <User size={22} color="#FFFFFF" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <ProfileSlidingPanel 
          isVisible={isPanelVisible}
          onClose={handleClosePanel}
          userId={profile?.id || ''}
        />
      </>
    );
  }

  // If this component is a standalone header
  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          onPress={handleProfilePress}
          style={styles.iconButton}
          activeOpacity={0.6}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          pressRetentionOffset={{ top: 20, bottom: 20, left: 20, right: 20 }}
          delayPressIn={0}
        >
          <LinearGradient
            colors={['#0066CC', '#0091FF']}
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <User size={22} color="#FFFFFF" />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
      
      <ProfileSlidingPanel 
        isVisible={isPanelVisible}
        onClose={handleClosePanel}
        userId={profile?.id || ''}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 16,
    zIndex: 999,
  },
  iconContainerInline: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  iconGradient: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: 'white',
  },
});

export default ProfileIconHeader; 