import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';
import { useState } from 'react';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as ExpoLinking from 'expo-linking';

// Register the WebBrowser redirect to handle OAuth correctly in Expo
WebBrowser.maybeCompleteAuthSession();

// Generate a simple random string for state parameter
function generateRandomString(length = 10) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Add global for OAuth state
global._oauthState = undefined;

/**
 * Hook for handling Google authentication via Supabase OAuth
 */
export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Sign in with Google using Supabase OAuth
   */
  const signInWithGoogle = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Generate a random state parameter for security
      const state = generateRandomString(20);
      global._oauthState = state;
      
      console.log('Generated OAuth state for security:', state);
      
      // Development debug info for redirect URLs
      if (__DEV__) {
        const appRedirectUrl = 'medico://auth/callback';
        const expoUrl = ExpoLinking.createURL('auth/callback');
        console.log('App Redirect URL:', appRedirectUrl);
        console.log('Expo URL (add this to Supabase redirect URLs):', expoUrl);
      }
      
      // Use the server-side redirect URL - this should match what's configured in Supabase
      const redirectUrl = 'https://cslxbdtaxirqfozfvjhg.supabase.co/auth/v1/callback';
      
      console.log('Starting Google OAuth with redirect URL:', redirectUrl);
      
      // Direct Supabase OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            state: state // Critical for security
          },
        }
      });
      
      if (error) {
        console.error('Supabase OAuth error:', error.message, error.status);
        throw error;
      }
      
      if (!data?.url) {
        console.error('No authorization URL returned from Supabase');
        throw new Error('Failed to get authorization URL');
      }
      
      console.log('OAuth URL generated (first 50 chars):', data.url.substring(0, 50) + '...');
      
      return { 
        success: true, 
        data
      };
    } catch (err) {
      console.error('Google sign in error:', err);
      
      const googleError = err instanceof Error ? err : new Error('An unknown error occurred during Google sign-in');
      setError(googleError);
      return { 
        success: false, 
        error: googleError
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    signInWithGoogle
  };
};

export default useGoogleAuth; 