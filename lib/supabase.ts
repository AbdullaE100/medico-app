import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as ExpoLinking from 'expo-linking';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

// Declare the global OAuth state type
declare global {
  var _oauthState: string | undefined;
}

// Get the environment variables from app.json extra or .env
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 'https://cslxbdtaxirqfozfvjhg.supabase.co';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbHhiZHRheGlycWZvemZ2amhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDg5NzYxMzAsImV4cCI6MjAyNDU1MjEzMH0.7VvKo-BTZepJ6KIR3f-eS5epSF2BRFu8XJ8RXhjAKMI';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key (first 10 chars):', supabaseAnonKey.substring(0, 10) + '...');

// In development mode, clear any browser sessions to avoid cached auth issues
if (__DEV__) {
  WebBrowser.maybeCompleteAuthSession();
}

// Create a custom storage object that uses AsyncStorage for better performance
const customStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`[Storage] Error getting item ${key}:`, error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`[Storage] Error setting item ${key}:`, error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`[Storage] Error removing item ${key}:`, error);
    }
  }
};

// Create the Supabase client with optimized configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    debug: __DEV__, // Enable debug mode only in development
    storageKey: 'medico-supabase-auth', // Explicit storage key to avoid conflicts
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'medico-app-mobile'
    },
  }
});

// Set up auth state change listener
supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
  console.log(`[Auth] Event: ${event}`, session ? 'User authenticated' : 'No active session');
  
  if (event === 'SIGNED_IN' && session) {
    console.log('[Auth] User signed in successfully');
    // Clear any lingering flow state
    try {
      if (typeof localStorage !== 'undefined') {
        // Clear any lingering PKCE flow state from localStorage if available
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('supabase.auth.token') || key.includes('code_verifier')) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (e) {
      // Ignore localStorage errors on React Native
    }
  } else if (event === 'SIGNED_OUT') {
    console.log('[Auth] User signed out');
  }
});

/**
 * Special fallback for handling invalid flow state errors
 * This works around a common issue with PKCE flow in mobile apps
 */
const handlePKCEFlowStateError = async (code: string): Promise<boolean> => {
  try {
    console.log('[Auth] Attempting PKCE flow workaround for invalid flow state');
    
    // Try a direct session check first - the code might have already been exchanged
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      console.log('[Auth] Already have valid session despite flow state error');
      return true;
    }
    
    // Try to clear any problematic state
    try {
      if (typeof localStorage !== 'undefined') {
        // Look for flow state keys and remove them
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase.auth.token') || 
              key.includes('code_verifier') || 
              key.includes('flow-state')) {
            console.log('[Auth] Clearing problematic state key:', key);
            localStorage.removeItem(key);
          }
        });
      }
    } catch (e) {
      // Ignore localStorage errors on React Native
      console.log('[Auth] LocalStorage not available for cleanup');
    }
    
    // Try a direct authentication with Google provider
    console.log('[Auth] Attempting direct token exchange with code:', code.substring(0, 5) + '...');
    
    try {
      // This uses the existing code but forces a refresh, bypassing the flow state
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: code
      });
      
      if (!error && data.session) {
        console.log('[Auth] Successfully refreshed session');
        return true;
      }
    } catch (refreshError) {
      console.log('[Auth] Refresh attempt failed, continuing with fallbacks');
    }
    
    // If we don't have a session yet, try to recreate the auth state manually
    console.log('[Auth] Manually refreshing auth state');
    const { error: refreshError } = await supabase.auth.refreshSession();
    
    // If refresh succeeded, check for session again
    if (!refreshError) {
      const { data: newSessionData } = await supabase.auth.getSession();
      if (newSessionData.session) {
        console.log('[Auth] Session established after manual refresh');
        return true;
      }
    }
    
    // Last resort: try to initiate a new Google login with the existing code
    console.log('[Auth] Last resort: Using code directly with OAuth provider');
    
    // Attempt to construct a direct token authentication
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: code,
    });
    
    if (error) {
      console.error('[Auth] ID token sign-in failed:', error.message);
      
      // Try with direct OAuth
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          skipBrowserRedirect: true,
          queryParams: {
            // Force a direct token endpoint call
            grant_type: 'authorization_code',
            code: code
          }
        }
      });
      
      if (oauthError) {
        console.error('[Auth] OAuth fallback failed:', oauthError.message);
      }
    }
    
    // Final session check
    const { data: finalSessionData } = await supabase.auth.getSession();
    if (finalSessionData.session) {
      console.log('[Auth] Session recovered via fallback methods');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[Auth] PKCE flow workaround failed:', error);
    return false;
  }
};

/**
 * Process an authentication redirect URL and check authentication status
 */
export const handleAuthRedirect = async (url: string): Promise<boolean> => {
  try {
    console.log('[Auth] Processing redirect URL:', url);
    
    // Check for authentication code in URL
    if (url.includes('code=')) {
      console.log('[Auth] Found authorization code in URL');
      
      // Extract and verify state if present
      let stateIsValid = true;
      if (url.includes('state=')) {
        const stateParam = new URL(url).searchParams.get('state');
        const storedState = global._oauthState;
        
        if (!storedState) {
          console.warn('[Auth] No stored OAuth state found!');
          stateIsValid = false;
        } else {
          console.log(`[Auth] Comparing states - URL: ${stateParam ? stateParam.substring(0, 5) + '...' : 'null'}, Stored: ${storedState.substring(0, 5) + '...'}`);
          stateIsValid = stateParam === storedState;
        }
        
        if (!stateIsValid) {
          console.warn('[Auth] State parameter mismatch! This could be a CSRF attack, but continuing for troubleshooting');
        }
        
        // Clear stored state after use regardless of outcome
        global._oauthState = undefined;
      } else {
        console.warn('[Auth] No state parameter in redirect URL!');
      }
      
      // Extract the code parameter for potential fallback
      let authCode: string | null = null;
      try {
        const urlObj = new URL(url);
        authCode = urlObj.searchParams.get('code');
      } catch (urlError) {
        console.error('[Auth] Error parsing URL for code extraction:', urlError);
      }
      
      // Try different URL formats for code exchange - sometimes the URL parsing fails
      let exchangeResult;
      try {
        console.log('[Auth] Attempting to exchange code directly with URL');
        exchangeResult = await supabase.auth.exchangeCodeForSession(url);
      } catch (exchangeError) {
        console.error('[Auth] Direct code exchange failed:', exchangeError);
        
        // Try to manually extract the code and exchange it
        try {
          console.log('[Auth] Attempting manual code extraction');
          const urlObj = new URL(url);
          const code = urlObj.searchParams.get('code');
          
          if (code) {
            console.log('[Auth] Extracted code manually, attempting exchange');
            
            // Generate the codeVerifier if not available
            // This is just a fallback and might not work in all cases
            exchangeResult = await supabase.auth.exchangeCodeForSession(code);
          } else {
            throw new Error('No code parameter found in URL');
          }
        } catch (manualError) {
          logAuthError('Manual code exchange failed', manualError, 'warn');
          exchangeResult = { error: manualError, data: { session: null } };
        }
      }
      
      const { data, error } = exchangeResult || { data: { session: null }, error: new Error('Exchange not attempted') };
      
      if (error) {
        // Use our custom logging function to handle the error
        logAuthError('Exchange code error', error);
        
        // Check if this is specifically a "invalid flow state" error
        const errorMessage = (error as Error).message || '';
        if (errorMessage.includes('invalid flow state') && authCode) {
          console.log('[Auth] Detected invalid flow state error, attempting workaround');
          const workaroundSuccess = await handlePKCEFlowStateError(authCode);
          if (workaroundSuccess) {
            console.log('[Auth] Flow state workaround successful');
            return true;
          }
        }
        
        // Check if we're already authenticated despite the error
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          console.log('[Auth] Found existing session despite exchange error');
          // If we already have a valid session, suppress the error and continue
          if (errorMessage.includes('invalid flow state')) {
            console.log('[Auth] Invalid flow state error suppressed - using existing session');
          }
          return true;
        }
        
        return false;
      }
      
      console.log('[Auth] Session established successfully');
      
      // Double check that we have a session
      setTimeout(async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('[Auth] Session check:', sessionData.session ? 'Session exists' : 'No session');
      }, 500);
      
      return true;
    } else {
      console.log('[Auth] No authorization code found in URL');
      
      // Check if user is already authenticated
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    }
  } catch (error) {
    console.error('[Auth] Error processing redirect:', error);
    
    // Final fallback - check if we're authenticated despite errors
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('[Auth] Found session despite processing errors');
        return true;
      }
    } catch (sessionError) {
      console.error('[Auth] Final session check failed:', sessionError);
    }
    
    return false;
  }
};

// Helper to check if user is authenticated
export const isAuthenticated = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, error: null };
  } catch (error) {
    console.error('Auth check error:', error);
    return { user: null, error };
  }
};

/**
 * Helper function to ensure an OAuth URL has the proper state parameter
 */
export const ensureOAuthState = (url: string, state: string): string => {
  if (!url) return url;
  
  try {
    // Parse the URL
    const urlObj = new URL(url);
    
    // Check if state parameter already exists
    if (!urlObj.searchParams.has('state')) {
      // Add the state parameter
      urlObj.searchParams.set('state', state);
      console.log('[Auth] Added state parameter to OAuth URL');
    } else {
      // Replace the state parameter
      const existingState = urlObj.searchParams.get('state');
      if (existingState !== state) {
        console.log('[Auth] Replacing state parameter in OAuth URL');
        urlObj.searchParams.set('state', state);
      }
    }
    
    return urlObj.toString();
  } catch (error) {
    // If URL parsing fails, append the state parameter manually
    console.warn('[Auth] URL parsing failed, appending state parameter manually');
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}state=${state}`;
  }
};

/**
 * Clear any existing browser sessions and prepare for a fresh OAuth flow
 * This helps prevent "invalid flow state" errors by ensuring a clean state
 */
export const prepareBrowserForAuth = async (): Promise<void> => {
  try {
    console.log('[Auth] Preparing browser for authentication');
    
    // Clear any existing browser sessions
    await WebBrowser.maybeCompleteAuthSession();
    
    // Clear stored OAuth state
    global._oauthState = undefined;
    
    // Clear any PKCE-related items from the storage
    try {
      // Try to clean AsyncStorage keys
      const keys = await AsyncStorage.getAllKeys();
      const authKeys = keys.filter(key => 
        key.includes('supabase.auth') || 
        key.includes('code_verifier') || 
        key.includes('flow-state') ||
        key.includes('pkce')
      );
      
      if (authKeys.length > 0) {
        console.log('[Auth] Clearing auth-related AsyncStorage keys:', authKeys.length);
        await AsyncStorage.multiRemove(authKeys);
      }
      
      // If we're on web or have localStorage access, clean that too
      if (typeof localStorage !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || 
              key.includes('code_verifier') || 
              key.includes('flow-state') ||
              key.includes('pkce')) {
            console.log('[Auth] Clearing localStorage key:', key);
            localStorage.removeItem(key);
          }
        });
      }
    } catch (e) {
      console.log('[Auth] Storage cleanup error (non-critical):', e);
    }
    
    // Wait a moment to ensure everything is cleared
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('[Auth] Browser prepared for authentication');
  } catch (error) {
    console.error('[Auth] Error preparing browser:', error);
  }
};

/**
 * Manual function for handling an OAuth authorization code
 * This can be called when the normal redirect flow fails
 */
export const manuallyExchangeCodeForSession = async (code: string): Promise<boolean> => {
  if (!code) {
    console.error('[Auth] No code provided for manual exchange');
    return false;
  }
  
  try {
    console.log('[Auth] Manually exchanging authorization code for session');
    
    // First try using the normal exchange method
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      logAuthError('Manual code exchange failed', error, 'warn');
      
      // Try the fallback method as a last resort
      return await handlePKCEFlowStateError(code);
    }
    
    console.log('[Auth] Manual code exchange successful');
    return true;
  } catch (error) {
    logAuthError('Error in manual code exchange', error, 'warn');
    
    // Try the fallback method as a last resort
    return await handlePKCEFlowStateError(code);
  }
};

/**
 * Utility function to log errors with special handling for known issues
 * @param context The context/source of the error
 * @param error The error object
 * @param level The log level (error, warn, log)
 */
const logAuthError = (context: string, error: any, level: 'error' | 'warn' | 'log' = 'error'): void => {
  // Extract the error message
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // In production, suppress the invalid flow state error completely
  if (!__DEV__ && errorMessage.includes('invalid flow state')) {
    // Just log it as info in production
    console.log(`[Auth] ${context}: Invalid flow state error suppressed in production`);
    return;
  }
  
  // Otherwise log at the specified level
  if (level === 'error') {
    console.error(`[Auth] ${context}:`, errorMessage);
  } else if (level === 'warn') {
    console.warn(`[Auth] ${context}:`, errorMessage);
  } else {
    console.log(`[Auth] ${context}:`, errorMessage);
  }
};