import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Stethoscope } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AvatarProps {
  size: number;
  source: string | null;
  initials: string;
  backgroundColor?: string;
  isAnonymous?: boolean;
}

export function Avatar({ size, source, initials, backgroundColor = '#0066CC', isAnonymous = false }: AvatarProps) {
  const styles = StyleSheet.create({
    container: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    image: {
      width: size,
      height: size,
    },
    initials: {
      color: '#FFFFFF',
      fontSize: size / 2.5,
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },
    anonymousContainer: {
      width: size,
      height: size,
      borderRadius: size / 2,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
  });

  // For anonymous doctor avatars
  if (isAnonymous) {
    return (
      <LinearGradient
        colors={['#555555', '#333333']}
        style={styles.anonymousContainer}
      >
        <Stethoscope size={size * 0.6} color="#FFFFFF" />
      </LinearGradient>
    );
  }

  // For avatars with an image URL
  if (source) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: source }} style={styles.image} />
      </View>
    );
  }

  // Default case: show initials
  return (
    <View style={styles.container}>
      <Text style={styles.initials}>{initials}</Text>
    </View>
  );
} 