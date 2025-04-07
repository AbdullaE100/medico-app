import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter, useSegments, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { handleAuthRedirect, manuallyExchangeCodeForSession } from '@/lib/supabase';
import * as Linking from 'expo-linking';

/**
 * OAuth Callback Handler
 * 
 * This component is a simple screen that shows when the app receives an OAuth redirect.
 * It checks if the user is authenticated and handles navigation accordingly.
 */
export default function AuthCallback() {
  const router = useRouter();
  const segments = useSegments();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState('Processing your login...');
  const [isError, setIsError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  
  useEffect(() => {
    // Process URL parameters if they exist (from OAuth redirect)
    const processParams = async () => {
      try {
        // Check if we have an authorization code in the URL params
        if (params.code) {
          const code = params.code as string;
          setStatus('Authorization code received, processing...');
          
          // Construct the full URL for processing
          const fullUrl = Linking.createURL('auth/callback', {
            queryParams: params as Record<string, string>
          });
          
          console.log('[AuthCallback] Processing code from URL params');
          
          // Try to handle the redirect
          let success = await handleAuthRedirect(fullUrl);
          
          // If the normal flow fails, try manual exchange as fallback
          if (!success && attempts < 2) {
            setStatus('Initial auth processing failed, trying fallback method...');
            console.log('[AuthCallback] Initial auth failed, attempting manual code exchange');
            setAttempts(prev => prev + 1);
            
            success = await manuallyExchangeCodeForSession(code);
          }
          
          if (success) {
            setStatus('Authentication successful!');
            // Refresh auth state
            await checkAuth();
          } else {
            setStatus('Authentication failed. Please try again.');
            setIsError(true);
          }
        } else {
          // No code parameter found, just check current auth state
          setStatus('Checking authentication status...');
        }
      } catch (error) {
        console.error('[AuthCallback] Error processing params:', error);
        setStatus('An error occurred. Please try again.');
        setIsError(true);
      }
    };
    
    processParams();
  }, [params, attempts]);
  
  useEffect(() => {
    // Redirect after checking auth state
    const checkAndRedirect = async () => {
      // Wait to make sure auth state is loaded
      // We'll wait at least 1.5 seconds to show the loading indicator
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('[AuthCallback] Checking auth state:', { isAuthenticated, isLoading });
      
      // If done loading and authenticated, go to main app
      if (!isLoading) {
        if (isAuthenticated) {
          console.log('[AuthCallback] Authentication successful, redirecting to home');
          router.replace('/(tabs)');
        } else {
          console.log('[AuthCallback] Not authenticated, redirecting to sign-in');
          router.replace('/(auth)/sign-in');
        }
      }
    };
    
    checkAndRedirect();
  }, [isAuthenticated, isLoading]);
  
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={isError ? "#FF3B30" : "#0066CC"} />
      <Text style={[styles.text, isError && styles.errorText]}>{status}</Text>
      {isError && (
        <Text style={styles.retryText}>
          You'll be redirected to the login screen shortly.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    maxWidth: '80%',
  },
  errorText: {
    color: '#FF3B30',
  },
  retryText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    maxWidth: '80%',
  },
}); 