import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useProfileStore } from '@/stores/useProfileStore';

import BusinessCardShowcase from '@/components/BusinessCardShowcase';
import { LoadingOverlay } from '@/components/LoadingOverlay';

export default function BusinessCardScreen() {
  const router = useRouter();
  const { profile, isLoading } = useProfileStore();

  const handleBack = () => {
    router.back();
  };

  const handleShare = () => {
    // Implement sharing functionality
    console.log('Share business card');
  };

  const handleQrView = () => {
    // Implement QR code view
    console.log('View QR code');
  };

  if (isLoading) {
    return <LoadingOverlay message="Loading your digital business card..." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Stack.Screen
        options={{
          title: 'Digital Business Card',
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ArrowLeft size={24} color="#333" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Your Digital Business Card</Text>
        <Text style={styles.headerSubtitle}>
          Share your professional profile with colleagues and patients
        </Text>
      </View>

      <BusinessCardShowcase 
        profile={profile} 
        onShare={handleShare}
        onQrView={handleQrView}
      />

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>About Digital Business Cards</Text>
        <Text style={styles.infoText}>
          Your digital business card makes it easy to share your professional details
          with colleagues and patients. You can share it digitally or display the QR
          code for others to scan.
        </Text>
        <Text style={styles.infoText}>
          To update your card information, edit your profile details in the main
          profile settings.
        </Text>
      </View>

      <View style={styles.tipContainer}>
        <Text style={styles.tipTitle}>Pro Tip</Text>
        <Text style={styles.tipText}>
          Tap the arrows to switch between vertical and horizontal card layouts.
          Each layout is optimized for different sharing scenarios.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  backButton: {
    padding: 8,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 22,
  },
  infoContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
    marginHorizontal: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    marginBottom: 10,
  },
  tipContainer: {
    marginTop: 20,
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0284C7',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0284C7',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
}); 