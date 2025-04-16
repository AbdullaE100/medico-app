import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useSegments, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { handleAuthRedirect, manuallyExchangeCodeForSession, clearStoredOAuthState } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import * as Linking from 'expo-linking';
import { AlertCircle, RefreshCcw } from 'lucide-react-native';

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
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const { isAuthenticated, isLoading, checkAuth, currentUser, profile, updateProfile } = useAuthStore();
  
  const retryAuthentication = async () => {
    // Clear any problematic state first
    await clearStoredOAuthState();
    
    // Clear local storage auth-related items
    try {
      if (typeof localStorage !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('flow-state') || key.includes('code_verifier')) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (e) {
      // Ignore errors
    }
    
    // Sign out to clear any session state
    await supabase.auth.signOut();
    
    // Return to the sign-in page
    router.replace('/(auth)/sign-in');
  };
  
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
            // Check if there's a specific error in localStorage
            let errorMessage = 'Authentication failed. Please try again.';
            let isFlowStateError = false;
            
            try {
              if (typeof localStorage !== 'undefined') {
                const lastError = localStorage.getItem('supabase.auth.error');
                if (lastError) {
                  try {
                    const parsedError = JSON.parse(lastError);
                    errorMessage = parsedError.message || errorMessage;
                    
                    // Check if this is a flow state error
                    if (errorMessage.includes('flow state') || errorMessage.includes('state not found')) {
                      isFlowStateError = true;
                      errorMessage = 'Authentication session expired. Please try signing in again.';
                    }
                  } catch (e) {
                    // Ignore parsing errors
                  }
                }
              }
            } catch (e) {
              // Ignore localStorage errors
            }
            
            setStatus(isFlowStateError ? 'Authentication session expired' : 'Authentication failed');
            setErrorDetails(errorMessage);
            setIsError(true);
          }
        } else {
          // No code parameter found, just check current auth state
          setStatus('Checking authentication status...');
        }
      } catch (error) {
        console.error('[AuthCallback] Error processing params:', error);
        
        // Provide more specific error message
        let errorMessage = 'An error occurred. Please try again.';
        if (error instanceof Error) {
          if (error.message.includes('flow state') || error.message.includes('state not found')) {
            errorMessage = 'Authentication session expired. Please try signing in again.';
          } else {
            errorMessage = `Error: ${error.message}`;
          }
        }
        
        setStatus('Authentication failed');
        setErrorDetails(errorMessage);
        setIsError(true);
      }
    };
    
    processParams();
  }, [params, attempts]);
  
  useEffect(() => {
    // Check if user needs profile setup (newly created via OAuth)
    const checkProfileSetup = async () => {
      if (isAuthenticated && currentUser) {
        try {
          // Check if this is a new user or existing user without complete profile
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
          
          // User does not exist (new user) or missing required profile data
          const requiresOnboarding = error?.code === 'PGRST116' || 
            !data || 
            !data.avatar_url || 
            !data.full_name;
          
          if (requiresOnboarding) {
            console.log('[AuthCallback] User needs onboarding:', requiresOnboarding ? 'Yes' : 'No');
            
            // Get user metadata from OAuth provider (for new users)
            let fullName = '';
            if (error?.code === 'PGRST116') {
              // Profile doesn't exist - this is a new user
              console.log('[AuthCallback] New user detected, creating profile');
              
              const provider = currentUser.app_metadata?.provider;
              const providerData = currentUser.identities?.[0]?.identity_data;
              
              // Extract name from provider data
              if (providerData) {
                if (provider === 'google') {
                  fullName = `${providerData.name || ''}`.trim();
                } else if (providerData.full_name) {
                  fullName = providerData.full_name.trim();
                } else if (providerData.name) {
                  fullName = providerData.name.trim();
                }
              }
              
              // Add Dr. prefix if not already present
              if (fullName && !fullName.startsWith('Dr.') && !fullName.startsWith('dr.') && !fullName.startsWith('Dr ') && !fullName.startsWith('dr ')) {
                fullName = `Dr. ${fullName}`;
              }
              
              // Create basic profile
              if (fullName) {
                const { error: insertError } = await supabase
                  .from('profiles')
                  .insert({
                    id: currentUser.id,
                    full_name: fullName,
                    updated_at: new Date().toISOString(),
                  });
                
                if (insertError) {
                  console.error('[AuthCallback] Error creating profile:', insertError);
                } else {
                  console.log('[AuthCallback] Created profile for new user:', fullName);
                }
              }
            } else {
              // Existing user but missing complete profile
              console.log('[AuthCallback] Existing user missing complete profile data');
              if (data && data.full_name) {
                fullName = data.full_name;
              }
            }
            
            // Direct to onboarding regardless of whether new or existing
            setStatus(fullName 
              ? 'Welcome Dr. ' + fullName.replace(/^Dr\.\s*/i, '') + '! Setting up your profile...' 
              : 'Setting up your profile...');
              
            setTimeout(() => {
              router.replace('/onboarding');
            }, 1000);
            return;
          }
          
          // User has a complete profile, redirect to main app
          console.log('[AuthCallback] User has complete profile, redirecting to home');
          router.replace('/(tabs)');
        } catch (error) {
          console.error('[AuthCallback] Error checking profile:', error);
          router.replace('/(tabs)');
        }
      } else if (!isLoading && !isAuthenticated) {
        console.log('[AuthCallback] Not authenticated, redirecting to sign-in');
        
        // Only auto-redirect if there's no error
        if (!isError) {
          router.replace('/(auth)/sign-in');
        }
      }
    };
    
    // Only run this if authentication is resolved
    if (!isLoading) {
      console.log('[AuthCallback] Auth state resolved, checking profile setup');
      checkProfileSetup();
    }
  }, [isAuthenticated, isLoading, currentUser, isError]);
  
  return (
    <View style={styles.container}>
      {isError ? (
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color="#FF3B30" style={styles.errorIcon} />
          <Text style={styles.errorTitle}>{status}</Text>
          <Text style={styles.errorText}>{errorDetails || 'Please try signing in again'}</Text>
          
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={retryAuthentication}
            activeOpacity={0.7}
          >
            <RefreshCcw size={18} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.text}>{status}</Text>
        </View>
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
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    maxWidth: '80%',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
    maxWidth: 350,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066CC',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
}); 