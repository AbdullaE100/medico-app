import { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase, extractParamsFromUrl } from '@/lib/supabase';
import * as Linking from 'expo-linking';

/**
 * This is a special route that only handles password reset deep links.
 * It extracts the token from the URL and redirects to the reset password screen.
 */
export default function PasswordResetHandler() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  useEffect(() => {
    const handlePasswordReset = async () => {
      console.log("PasswordResetHandler: Activated");
      
      try {
        // Get the URL that opened this screen
        const url = await Linking.getInitialURL();
        console.log("PasswordResetHandler: Initial URL:", url);
        
        if (url) {
          // Extract auth tokens and parameters
          const urlParams = extractParamsFromUrl(url);
          console.log("PasswordResetHandler: Extracted params:", urlParams);
          
          const accessToken = urlParams?.access_token || 
                             urlParams?.token || 
                             params.access_token || 
                             params.token;
                             
          if (accessToken) {
            console.log("PasswordResetHandler: Found token, setting session");
            
            // Set the session using the token
            try {
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken as string,
                refresh_token: urlParams?.refresh_token || ''
              });
              
              if (error) {
                console.error("PasswordResetHandler: Error setting session:", error);
              } else {
                console.log("PasswordResetHandler: Session set successfully");
                
                // Now the session is set, redirect to the actual reset password screen
                setTimeout(() => {
                  router.replace('/auth/reset-password');
                }, 1000);
                return;
              }
            } catch (err) {
              console.error("PasswordResetHandler: Error handling token:", err);
            }
          }
        }
        
        // If we get here, something went wrong
        console.log("PasswordResetHandler: No valid URL or token found, checking for session");
        
        // Check if we already have a valid session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log("PasswordResetHandler: Found existing session, redirecting");
          router.replace('/auth/reset-password');
        } else {
          console.log("PasswordResetHandler: No session found, redirecting to forgot password");
          router.replace('/(auth)/forgot-password');
        }
      } catch (err) {
        console.error("PasswordResetHandler: Unexpected error:", err);
        // Fallback to forgot password in case of any errors
        router.replace('/(auth)/forgot-password');
      }
    };
    
    handlePasswordReset();
  }, []);
  
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0091FF" />
      <Text style={styles.text}>Processing password reset...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050e30',
  },
  text: {
    marginTop: 20,
    color: '#FFFFFF',
    fontSize: 16,
  }
}); 