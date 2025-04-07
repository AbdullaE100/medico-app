import React, { useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import { FontAwesome } from '@expo/vector-icons'; 
import { useGoogleAuth } from '../lib/googleAuth';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { handleAuthRedirect } from '../lib/supabase';

export default function GoogleSignInButton() {
  const navigation = useNavigation();
  const { isLoading, error, signInWithGoogle } = useGoogleAuth();

  // Listen for deep links (auth redirects)
  useEffect(() => {
    // Set up URL event listener for auth redirects
    const subscription = Linking.addEventListener('url', event => {
      console.log('Deep link received:', event.url);
      handleAuthRedirect(event.url);
    });

    // Clean up listener on unmount
    return () => {
      subscription.remove();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      console.log('Starting Google sign-in process...');
      
      // First clear browser state
      await WebBrowser.maybeCompleteAuthSession();
      
      // Get authorization URL from Supabase
      const { success, data, error: signInError } = await signInWithGoogle();
      
      if (!success || !data?.url) {
        console.error('Failed to generate authorization URL:', signInError);
        return;
      }
      
      // Open the browser for authentication
      console.log('Opening browser for authentication...');
      const result = await WebBrowser.openAuthSessionAsync(
        data.url, 
        'medico://auth/callback',
        {
          showInRecents: true,
          createTask: true
        }
      );
      
      console.log('Auth session result type:', result.type);
      
      // Handle authentication result
      if (result.type === 'success') {
        const url = result.url;
        console.log('Auth successful, processing redirect URL:', url);
        await handleAuthRedirect(url);
        
        // Give the session some time to be established before checking auth state
        setTimeout(async () => {
          const { data } = await supabase.auth.getSession();
          console.log('Session check after redirect:', data.session ? 'Session found' : 'No session');
        }, 1000);
      } else {
        console.log('Auth was dismissed or failed:', result.type);
      }
    } catch (error) {
      console.error('Error during Google sign-in flow:', error);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.button}
      onPress={handleGoogleSignIn}
      disabled={isLoading}
    >
      <View style={styles.buttonContent}>
        <FontAwesome name="google" size={20} color="#4285F4" style={styles.icon} />
        <Text style={styles.buttonText}>
          {isLoading ? 'Signing in...' : 'Sign in with Google'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'white',
    borderRadius: 4,
    padding: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#444',
    fontWeight: '600',
    fontSize: 16,
  },
}); 