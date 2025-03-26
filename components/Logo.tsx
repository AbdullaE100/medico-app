import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

interface LogoProps {
  width?: number;
  height?: number;
}

export default function Logo({ width = 120, height = 40 }: LogoProps) {
  return (
    <View style={[styles.container, { width, height }]}>
      <Text style={styles.text}>MEDICO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  text: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#0066CC',
    letterSpacing: 1,
  },
}); 