import React from 'react';
import { Stack } from 'expo-router';
import { Platform, StatusBar } from 'react-native';

export default function CreateLayout() {
  // Set status bar to dark content for this screen
  StatusBar.setBarStyle('dark-content');

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' },
        animation: Platform.OS === 'ios' ? 'default' : 'fade',
        presentation: 'modal', // Use modal presentation
        animationDuration: 200,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Create Post',
          gestureEnabled: true,
          gestureDirection: 'vertical',
          fullScreenGestureEnabled: true,
        }}
      />
    </Stack>
  );
} 