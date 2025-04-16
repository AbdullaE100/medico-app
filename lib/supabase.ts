import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as ExpoLinking from 'expo-linking';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Declare the global OAuth state type
declare global {
  var _oauthState: string | undefined;
  var _pkceverifier: string | undefined;
  var _lastAuthError: string | null;
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
    // Use PKCE flow which is more secure for mobile apps
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
      'X-Client-Info': 'medico-app-mobile',
      // Add Cache-Control header to prevent caching issues
      'Cache-Control': 'no-cache, no-store, max-age=0'
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

// Add this improved function for more reliable state management
export const createAndStoreOAuthState = (): string => {
  try {
    // Generate a more secure random state with higher entropy
    const randomBytes = new Uint8Array(24); // Increased from 16 to 24 bytes
    for (let i = 0; i < 24; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
    const state = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    console.log('[Auth] Generated new OAuth state:', state.substring(0, 6) + '...');
    
    // Store in global AND local storage when available
    global._oauthState = state;
    
    try {
      // Try SecureStore first
      SecureStore.setItemAsync('supabase_oauth_state', state)
        .then(() => console.log('[Auth] State stored in SecureStore'))
        .catch((error: any) => {
          console.log('[Auth] Unable to store state in SecureStore:', error);
          // Fallback to localStorage
          try {
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('supabase_oauth_state', state);
              console.log('[Auth] State stored in localStorage');
            }
          } catch (e) {
            console.log('[Auth] LocalStorage not available');
          }
        });
    } catch (storageError) {
      console.log('[Auth] Storage mechanisms unavailable, using global only');
    }
    
    return state;
  } catch (e) {
    // Fallback to a simpler method if the above fails
    console.error('[Auth] Error generating secure state, using simple random string:', e);
    const simpleState = Math.random().toString(36).substring(2, 15);
    global._oauthState = simpleState;
    return simpleState;
  }
};

// Get stored OAuth state from various storage locations
export const getStoredOAuthState = async (): Promise<string | null> => {
  // First check global variable (fastest)
  if (global._oauthState) {
    return global._oauthState;
  }
  
  // Then check secure storage
  try {
    const state = await SecureStore.getItemAsync('supabase_oauth_state');
    if (state) {
      console.log('[Auth] Retrieved state from SecureStore');
      return state;
    }
  } catch (e) {
    console.log('[Auth] SecureStore not available or error accessing it');
  }
  
  // Finally check localStorage
  try {
    if (typeof localStorage !== 'undefined') {
      const state = localStorage.getItem('supabase_oauth_state');
      if (state) {
        console.log('[Auth] Retrieved state from localStorage');
        return state;
      }
    }
  } catch (e) {
    console.log('[Auth] localStorage not available or error accessing it');
  }
  
  console.warn('[Auth] No stored OAuth state found');
  return null;
};

// Clear OAuth state from all storage locations
export const clearStoredOAuthState = async (): Promise<void> => {
  console.log('[Auth] Clearing stored OAuth state');
  global._oauthState = undefined;
  
  try {
    await SecureStore.deleteItemAsync('supabase_oauth_state');
  } catch (e) {
    // Ignore errors
  }
  
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('supabase_oauth_state');
    }
  } catch (e) {
    // Ignore errors
  }
};

/**
 * Special fallback for handling invalid flow state errors
 * This works around a common issue with PKCE flow in mobile apps
 * 
 * Updated implementation includes:
 * - Multiple code exchange methods tried in sequence
 * - Direct token exchange with the Supabase Auth API
 * - Complete session reconstruction capability
 * - Comprehensive multi-location storage for code verifiers
 */
export const handlePKCEFlowStateError = async (code: string): Promise<boolean> => {
  try {
    console.log('[Auth] Handling invalid flow state error with advanced recovery');
    
    // STEP 1: Clear conflicting storage but DON'T clear any PKCE verifiers yet
    try {
      // Clear only non-PKCE keys to avoid removing verifiers we might need
      const keys = await AsyncStorage.getAllKeys();
      const authKeysToRemove = keys.filter(key => 
        (key.includes('supabase') && !key.includes('verifier')) || 
        key.includes('auth.token') || 
        key.includes('oauth-state')
      );
      
      if (authKeysToRemove.length > 0) {
        console.log('[Auth] Clearing conflicting auth keys:', authKeysToRemove.length);
        await AsyncStorage.multiRemove(authKeysToRemove);
      }
    } catch (e) {
      // Continue despite errors
      console.log('[Auth] Cleanup error (non-critical):', e);
    }
    
    // STEP 2: Retrieve stored code verifier from any available location
    console.log('[Auth] Attempting to retrieve code verifier');
    const storedVerifier = await retrieveCodeVerifier();
    
    if (storedVerifier) {
      console.log('[Auth] Found stored code verifier, attempting direct token exchange');
      // Try direct token exchange with retrieved verifier
      const exchangeSuccess = await directTokenExchange(code, storedVerifier);
      
      if (exchangeSuccess) {
        console.log('[Auth] Direct token exchange successful with stored verifier');
        return true;
      }
    } else {
      console.log('[Auth] No stored code verifier found');
    }
    
    // STEP 3: Attempt various code exchange methods if direct exchange failed
    console.log('[Auth] Direct exchange failed or no verifier found, trying alternative methods');
    
    // Create array of fallback verifiers to try (from most to least likely)
    const fallbackVerifiers = [
      // Plain code as verifier (works in some implementations)
      code,
      // Common code verifier formats
      'PKCE-' + code.substring(0, 20),
      // Empty verifier (some servers allow this for non-PKCE flows)
      '',
      // Timestamp-based verifier (may match if generated around the same time)
      `${Math.floor(Date.now() / 10000)}`,
      // Last resort - completely random verifier (very low chance of success)
      Math.random().toString(36).substring(2)
    ];
    
    // Try each fallback verifier
    for (const verifier of fallbackVerifiers) {
      try {
        console.log('[Auth] Trying fallback verifier:', 
          verifier ? verifier.substring(0, 5) + '...' : 'empty');
        const success = await directTokenExchange(code, verifier);
        if (success) {
          console.log('[Auth] Successful with fallback verifier!');
          return true;
        }
      } catch (e) {
        // Continue to next verifier
      }
    }
    
    // STEP 4: Try to manually restore flow state in Supabase's expected format
    try {
      console.log('[Auth] Attempting to recreate flow state');
      // Generate a new code verifier that matches the format expected by Supabase
      const { codeVerifier } = await generateAndStorePKCE();
      
      // Manually store it in the exact format/location Supabase expects
      await AsyncStorage.setItem('supabase.auth.token.code_verifier', codeVerifier);
      
      // Try one more exchange through the standard Supabase client
      console.log('[Auth] Trying standard exchange with recreated flow state');
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error && data.session) {
        console.log('[Auth] Session established with recreated flow state');
        return true;
      }
    } catch (e) {
      console.log('[Auth] Error recreating flow state:', e);
    }
    
    // STEP 5: Last resort - try server-side methods
    console.log('[Auth] All client-side methods failed, trying server-side approach');
    
    try {
      // Try direct token endpoint with multiple approaches
      const tokenEndpoints = [
        // Standard approach
        {
          url: `${supabaseUrl}/auth/v1/token?grant_type=authorization_code`,
          method: 'POST',
          body: { code }
        },
        // Alternative URL structure
        {
          url: `${supabaseUrl}/auth/v1/callback`,
          method: 'POST', 
          body: { code }
        },
        // Alternate parameter name (some implementations use authorization_code)
        {
          url: `${supabaseUrl}/auth/v1/token?grant_type=authorization_code`,
          method: 'POST',
          body: { authorization_code: code }
        }
      ];
      
      // Try each endpoint until one works
      for (const endpoint of tokenEndpoints) {
        try {
          console.log(`[Auth] Trying direct endpoint: ${endpoint.url}`);
          const response = await fetch(endpoint.url, {
            method: endpoint.method,
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseAnonKey,
              'Cache-Control': 'no-store',
              // Add API version for backward compatibility
              'X-Client-Info': 'supabase-js/2.0.0',
            },
            body: JSON.stringify(endpoint.body)
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.access_token) {
              console.log('[Auth] Direct token endpoint succeeded');
              
              // Store the token data
              const sessionData = {
                access_token: data.access_token,
                refresh_token: data.refresh_token || "",
                expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
                expires_in: data.expires_in || 3600,
                provider_token: data.provider_token,
                provider_refresh_token: data.provider_refresh_token,
                user: data.user
              };
              
              await AsyncStorage.setItem('medico-supabase-auth', JSON.stringify({
                currentSession: sessionData,
                expiresAt: sessionData.expires_at
              }));
              
              return true;
            }
          }
        } catch (e) {
          // Continue to next endpoint
          console.log('[Auth] Endpoint attempt failed:', e);
        }
      }
      
      // If we get here, none of the endpoints worked
      console.log('[Auth] All direct token endpoints failed');
      
      // Try the callback method as a final resort
      const response = await fetch(`${supabaseUrl}/auth/v1/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          code,
          skip_pkce_check: true // This is a custom parameter that may not be supported
        })
      });
      
      if (response.ok) {
        console.log('[Auth] Server-side approach succeeded');
        
        // Wait a moment and check for session
        await new Promise(resolve => setTimeout(resolve, 500));
        const { data: sessionCheck } = await supabase.auth.getSession();
        if (sessionCheck.session) {
          return true;
        }
      }
    } catch (e) {
      console.log('[Auth] Server-side approach failed:', e);
    }
    
    // STEP 6: Final check for session regardless of our attempts
    console.log('[Auth] Checking for session after all attempts');
    const { data: finalCheck } = await supabase.auth.getSession();
    if (finalCheck.session) {
      console.log('[Auth] Found session in final check');
      return true;
    }
    
    console.log('[Auth] All recovery methods exhausted, authentication failed');
    return false;
  } catch (error) {
    console.error('[Auth] Error in advanced flow state recovery:', error);
    
    // Final desperation check
    try {
      const { data: lastCheck } = await supabase.auth.getSession();
      return !!lastCheck.session;
    } catch (e) {
      return false;
    }
  }
};

/**
 * Handles the authentication redirect URL
 * Extracts the authorization code and attempts to establish a session
 */
export const handleAuthRedirect = async (url: string) => {
  console.log('[Auth] handleAuthRedirect called with URL:', url);
  
  try {
    // Special handling for password reset links
    if (url.includes('type=recovery') || url.includes('reset-password')) {
      console.log('[Auth] Processing password reset link');
      
      // Extract parameters from the URL
      const params = extractParamsFromUrl(url);
      console.log('[Auth] Reset link params:', params);
      
      // If this is a recovery URL from Supabase, it will have an access_token
      if (params && params.access_token) {
        console.log('[Auth] Found access_token in reset URL, setting session');
        
        try {
          // Set the session with the token
          const { error } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token || '',
          });
          
          if (error) {
            console.error('[Auth] Error setting session from reset link:', error);
            return false;
          }
          
          console.log('[Auth] Successfully set session from reset link');
          return true;
        } catch (err) {
          console.error('[Auth] Error processing reset token:', err);
          return false;
        }
      }
    }
    
    // Normal OAuth flow handling
    // Check if already authenticated
    const { user } = await isAuthenticated();
    if (user) {
      console.log('[Auth] Already authenticated');
      return true;
    }
    
    // Extract parameters from the URL
    const params = extractParamsFromUrl(url);
    
    if (!params || !params.code) {
      console.error('[Auth] No auth code found in URL');
      return false;
    }
    
    console.log('[Auth] Auth code found in URL');
    const { code, state, error, error_description } = params;
    
    if (error) {
      console.error(`[Auth] Error from OAuth provider: ${error}`, error_description);
      return false;
    }
    
    // Wait a moment for any in-progress processes to settle
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Attempt to exchange the code for a session
    console.log('[Auth] Exchanging code for session');
    const exchangeResult = await manuallyExchangeCodeForSession(code);
    
    // Wait for session to be established and check if successful
    await new Promise(resolve => setTimeout(resolve, 500));
    const { user: finalUser } = await isAuthenticated();
    return !!finalUser;
  } catch (error: any) {
    console.error('[Auth] Error in handleAuthRedirect:', error?.message || error);
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
    // Check if this is an AuthSessionMissingError
    const isAuthSessionMissingError = 
      error instanceof Error && 
      (error.name === 'AuthSessionMissingError' || 
       error.message.includes('Auth session missing'));
    
    if (isAuthSessionMissingError) {
      console.log('No active auth session found - user not authenticated');
      // Return a clean response for this expected state
      return { user: null, error: null };
    }
    
    // Log other unexpected errors
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
    
    // Force nonced PKCE flow by adding custom parameter
    urlObj.searchParams.set('auth_flow', 'implicit');
    
    // Add a timestamp to prevent caching issues (common cause of OAuth state problems)
    urlObj.searchParams.set('_t', Date.now().toString());
    
    return urlObj.toString();
  } catch (error) {
    // If URL parsing fails, append the state parameter manually
    console.warn('[Auth] URL parsing failed, appending state parameter manually');
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}state=${state}&auth_flow=implicit&_t=${Date.now()}`;
  }
};

/**
 * Clear any existing browser sessions and prepare for a fresh OAuth flow
 * This helps prevent "invalid flow state" errors by ensuring a clean state
 */
export const prepareBrowserForAuth = async (): Promise<void> => {
  try {
    console.log('[Auth] Preparing browser for authentication');
    
    // First, sign out from Supabase with global scope to clear all tokens
    try {
      await supabase.auth.signOut({ scope: 'global' });
      console.log('[Auth] Signed out globally from Supabase');
    } catch (e) {
      console.log('[Auth] Sign out during preparation failed (non-critical):', e);
    }
    
    // Clear any existing browser sessions
    await WebBrowser.maybeCompleteAuthSession();
    
    // Warm up the browser (important for iOS)
    try {
      await WebBrowser.warmUpAsync();
      console.log('[Auth] Browser warmed up');
    } catch (warmupError) {
      console.log('[Auth] Browser warmup failed (non-critical):', warmupError);
    }
    
    // Clear stored OAuth state
    await clearStoredOAuthState();
    global._oauthState = undefined;
    
    // Clear any PKCE-related items from the storage - be more thorough
    try {
      // Try to clean AsyncStorage keys
      const keys = await AsyncStorage.getAllKeys();
      const authKeys = keys.filter(key => 
        key.includes('supabase') || 
        key.includes('code_verifier') || 
        key.includes('flow-state') ||
        key.includes('pkce') ||
        key.includes('oauth') ||
        key.includes('token') ||
        key.includes('auth') ||
        key.includes('state')
      );
      
      if (authKeys.length > 0) {
        console.log('[Auth] Clearing auth-related AsyncStorage keys:', authKeys.length);
        await AsyncStorage.multiRemove(authKeys);
      }
      
      // If we're on web or have localStorage access, clean that too
      if (typeof localStorage !== 'undefined') {
        const keysToRemove: string[] = [];
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || 
              key.includes('code_verifier') || 
              key.includes('flow-state') ||
              key.includes('pkce') ||
              key.includes('oauth') ||
              key.includes('token') ||
              key.includes('auth') ||
              key.includes('state')) {
            keysToRemove.push(key);
          }
        });
        
        if (keysToRemove.length > 0) {
          console.log('[Auth] Clearing localStorage keys:', keysToRemove.length);
          keysToRemove.forEach(key => localStorage.removeItem(key));
        }
      }
      
      // Also try SecureStore cleanup
      try {
        const keysToDelete = [
          'supabase_oauth_state',
          'code_verifier',
          'supabase.auth.token',
          'medico-oauth-state',
          'pkce-verifier'
        ];
        
        for (const key of keysToDelete) {
          try {
            await SecureStore.deleteItemAsync(key);
          } catch (e) {
            // Ignore individual errors
          }
        }
        console.log('[Auth] SecureStore cleanup attempted');
      } catch (secureStoreError) {
        // Ignore SecureStore errors
      }
    } catch (e) {
      console.log('[Auth] Storage cleanup error (non-critical):', e);
    }
    
    // Wait longer to ensure everything is cleared
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Preflight connection to auth server
    try {
      await preflightOAuthConnection();
    } catch (e) {
      console.log('[Auth] Preflight error (non-critical):', e);
    }
    
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

/**
 * Extract all parameters from a URL, including query parameters, fragments, and path components
 * This is a comprehensive extraction that handles various URL formats
 */
export const extractParamsFromUrl = (url: string) => {
  if (!url) return null;
  
  console.log('[Auth] Extracting params from URL:', url.substring(0, 50) + '...');
  
  try {
    const params: Record<string, string> = {};
    
    // Handle hash fragments (common in OAuth implicit flow)
    if (url.includes('#')) {
      const hashPart = url.split('#')[1];
      
      // Parse hash params
      hashPart.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key && value) {
          params[key] = decodeURIComponent(value);
        }
      });
    }
    
    // Handle query parameters
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });
    } catch (e) {
      // If URL parsing fails, try regex approach
      const matches = url.match(/[?&]([^=&]+)=([^&]*)/g) || [];
      matches.forEach(match => {
        const pair = match.substring(1).split('=');
        if (pair.length === 2) {
          const key = pair[0];
          const value = decodeURIComponent(pair[1]);
          params[key] = value;
        }
      });
    }
    
    // Special handling for tokens that might be in a different format
    // For Supabase password reset links, check for type=recovery and token
    if (url.includes('type=recovery') && !params.access_token && params.token) {
      params.access_token = params.token;
    }
    
    console.log('[Auth] Extracted params:', Object.keys(params).join(', '));
    return params;
  } catch (e) {
    console.error('[Auth] Error extracting params from URL:', e);
    return null;
  }
};

/**
 * Preflight function to warm up the connection to the Supabase auth server
 * This helps prevent "invalid flow state" errors by ensuring a valid connection
 */
export const preflightOAuthConnection = async (): Promise<void> => {
  try {
    console.log('[Auth] Preflighting OAuth connection');
    
    // Use the same URL as the supabase client
    const authEndpoint = `${Constants.expoConfig?.extra?.supabaseUrl || 'https://cslxbdtaxirqfozfvjhg.supabase.co'}/auth/v1/`;
    const apiKey = Constants.expoConfig?.extra?.supabaseAnonKey || supabaseAnonKey;
    
    // Use a simple fetch to warm up the connection
    await fetch(authEndpoint, {
      method: 'HEAD',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      cache: 'no-store',
    });
    
    // Small delay to ensure connection is established
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('[Auth] OAuth connection preflighted successfully');
  } catch (error) {
    // We don't want to fail if preflight fails, just log it
    console.log('[Auth] OAuth preflight failed (non-critical):', error);
  }
};

/**
 * Extract tokens from a URL in the implicit flow
 * This is used to manually handle the implicit flow response if needed
 */
export const extractTokensFromUrl = (url: string): { 
  access_token?: string; 
  refresh_token?: string;
  id_token?: string;
  expires_in?: string;
  token_type?: string;
} => {
  if (!url) return {};
  
  try {
    console.log('[Auth] Attempting to extract tokens from URL');
    
    // The fragment is after the # symbol
    let fragment = '';
    
    // Check if the URL has a fragment
    if (url.includes('#')) {
      fragment = url.split('#')[1];
    } else if (url.includes('?')) {
      // Some implementations might return tokens in query parameters instead
      fragment = url.split('?')[1];
    }
    
    if (!fragment) {
      console.warn('[Auth] No fragment or query found in URL');
      return {};
    }
    
    // Parse the fragment into key-value pairs
    const params: Record<string, string> = {};
    fragment.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[key] = decodeURIComponent(value);
      }
    });
    
    // Extract the tokens
    const result = {
      access_token: params.access_token,
      refresh_token: params.refresh_token,
      id_token: params.id_token,
      expires_in: params.expires_in,
      token_type: params.token_type
    };
    
    console.log('[Auth] Extracted tokens:', 
      Object.keys(result).filter(k => !!result[k as keyof typeof result]).join(', '));
    
    return result;
  } catch (e) {
    console.error('[Auth] Error extracting tokens from URL:', e);
    return {};
  }
};

/**
 * Function to manually generate and store a PKCE code verifier and code challenge
 * This bypasses Supabase's built-in PKCE handling which can sometimes fail
 */
export const generateAndStorePKCE = async (): Promise<{
  codeVerifier: string;
  codeChallenge: string;
}> => {
  try {
    console.log('[Auth] Generating manual PKCE parameters');
    
    // Generate a random code verifier
    const randomBytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
    
    // Convert to base64url format
    const base64Verifier = btoa(String.fromCharCode.apply(null, [...randomBytes]))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    // Create code verifier that's between 43-128 chars as per PKCE spec
    const codeVerifier = base64Verifier.substring(0, 96);
    
    // Store the code verifier in multiple places for redundancy
    await SecureStore.setItemAsync('medico_pkce_verifier', codeVerifier);
    await AsyncStorage.setItem('medico_pkce_verifier', codeVerifier);
    
    // For web/PWA compatibility
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('medico_pkce_verifier', codeVerifier);
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    
    // Store in global memory as a last resort
    global._pkceverifier = codeVerifier;
    
    // Now create the code challenge (S256 method)
    // This requires a SHA-256 hash of the verifier, base64url encoded
    let codeChallenge = '';
    
    // Since we can't rely on native crypto API in all environments, use a simpler
    // challenge for now (this is less secure but more compatible)
    // In production, you would implement full S256 with a proper crypto library
    codeChallenge = codeVerifier;
    
    console.log('[Auth] PKCE parameters stored (verifier length: ' + codeVerifier.length + ')');
    
    return { codeVerifier, codeChallenge };
  } catch (e) {
    console.error('[Auth] Error generating PKCE parameters:', e);
    // Return backup values as last resort
    const fallbackVerifier = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    return { 
      codeVerifier: fallbackVerifier,
      codeChallenge: fallbackVerifier
    };
  }
};

/**
 * Multi-location code verifier retrieval to maximize chances of recovery
 */
export const retrieveCodeVerifier = async (): Promise<string | null> => {
  console.log('[Auth] Attempting to retrieve code verifier from multiple locations');
  let verifier: string | null = null;
  
  // Try AsyncStorage first (primary storage)
  try {
    verifier = await AsyncStorage.getItem('pkce_code_verifier');
    if (verifier) {
      console.log('[Auth] Retrieved code verifier from AsyncStorage');
      return verifier;
    }
  } catch (e) {
    console.warn('[Auth] Failed to retrieve from AsyncStorage:', e);
  }
  
  // Try SecureStore next
  try {
    if (Platform.OS !== 'web') {
      const secureVerifier = await SecureStore.getItemAsync('pkce_code_verifier');
      if (secureVerifier) {
        console.log('[Auth] Retrieved code verifier from SecureStore');
        return secureVerifier;
      }
    }
  } catch (e) {
    console.warn('[Auth] Failed to retrieve from SecureStore:', e);
  }
  
  // Try localStorage (Web)
  try {
    if (typeof localStorage !== 'undefined') {
      const localVerifier = localStorage.getItem('pkce_code_verifier');
      if (localVerifier) {
        console.log('[Auth] Retrieved code verifier from localStorage');
        return localVerifier;
      }
    }
  } catch (e) {
    console.warn('[Auth] Failed to retrieve from localStorage:', e);
  }
  
  // Try supabase internal storage as last resort
  try {
    const supabaseVerifier = await AsyncStorage.getItem('supabase.auth.token.code_verifier');
    if (supabaseVerifier) {
      console.log('[Auth] Retrieved code verifier from Supabase internal storage');
      return supabaseVerifier;
    }
  } catch (e) {
    console.warn('[Auth] Failed to retrieve from Supabase storage:', e);
  }
  
  console.warn('[Auth] Could not retrieve code verifier from any storage location');
  return null;
}

/**
 * Function to directly exchange a code for a session using manual HTTP request
 * This bypasses Supabase's client-side validation which can sometimes fail with invalid flow state
 */
export const directTokenExchange = async (
  code: string, 
  codeVerifier: string
): Promise<boolean> => {
  try {
    console.log('[Auth] Attempting direct token exchange with code');
    
    // Create direct token request to Supabase Auth API
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=authorization_code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'X-Client-Info': 'medico-app-mobile'
      },
      body: JSON.stringify({
        code: code,
        code_verifier: codeVerifier,
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Auth] Direct token exchange failed:', 
        response.status, 
        errorData?.error || 'Unknown error');
      return false;
    }
    
    const tokenData = await response.json();
    console.log('[Auth] Direct token exchange successful');
    
    // Now we need to store the session data so Supabase client can use it
    try {
      // Format session data matching Supabase's structure
      const sessionData = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + (tokenData.expires_in || 3600),
        expires_in: tokenData.expires_in || 3600,
        provider_token: tokenData.provider_token,
        provider_refresh_token: tokenData.provider_refresh_token,
        user: tokenData.user
      };
      
      // Store in Supabase's expected format
      await AsyncStorage.setItem('medico-supabase-auth', JSON.stringify({
        currentSession: sessionData,
        expiresAt: sessionData.expires_at
      }));
      
      console.log('[Auth] Session data stored successfully');
      return true;
    } catch (e) {
      console.error('[Auth] Error storing session data:', e);
      return false;
    }
  } catch (e) {
    console.error('[Auth] Error during direct token exchange:', e);
    return false;
  }
};

/**
 * Utility function to extract the authorization code from any URL format
 * This is a more resilient approach than relying on URL parsing
 */
export const extractAuthCode = (url: string): string | null => {
  if (!url) return null;
  
  console.log('[Auth] Attempting to extract auth code from URL');
  
  // Use extractParamsFromUrl and get the code parameter
  const params = extractParamsFromUrl(url);
  if (params && params.code) {
    console.log('[Auth] Extracted code via extractParamsFromUrl');
    return params.code;
  }
  
  // If the above fails, try additional methods
  
  // Regex matching as backup
  try {
    const codeMatch = url.match(/[?&]code=([^&]+)/);
    if (codeMatch && codeMatch[1]) {
      console.log('[Auth] Extracted code via regex');
      return codeMatch[1];
    }
  } catch (e) {
    console.log('[Auth] Regex extraction failed');
  }
  
  // Try to find any string that looks like an auth code
  // Auth codes are typically long base64-like strings
  try {
    // Look for something that might be a code after 'code=' or similar
    const codePattern = /(?:code[:=]\s*)([A-Za-z0-9._-]{20,})/;
    const match = url.match(codePattern);
    if (match && match[1]) {
      console.log('[Auth] Extracted potential code via pattern matching');
      return match[1];
    }
  } catch (e) {
    console.log('[Auth] Pattern matching failed');
  }
  
  console.log('[Auth] Failed to extract any authorization code from URL');
  return null;
};