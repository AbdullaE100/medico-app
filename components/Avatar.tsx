import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

interface AvatarProps {
  size: number;
  source: string | null;
  initials: string;
  backgroundColor?: string;
}

export function Avatar({ size, source, initials, backgroundColor = '#0066CC' }: AvatarProps) {
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
  });

  if (source) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: source }} style={styles.image} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.initials}>{initials}</Text>
    </View>
  );
} 