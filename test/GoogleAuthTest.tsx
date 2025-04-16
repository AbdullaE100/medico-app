import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Linking, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as ExpoLinking from 'expo-linking';
import { useAuthStore } from '@/stores/useAuthStore';

// Register WebBrowser redirect handler
WebBrowser.maybeCompleteAuthSession();

export default function GoogleAuthTest() {
  const { signInWithGoogle, isAuthenticated, currentUser } = useAuthStore();
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [authState, setAuthState] = useState<string>('Checking...');
  
  // Check and update auth state on mount and when isAuthenticated changes
  useEffect(() => {
    checkAuthState();
  }, [isAuthenticated]);
  
  const checkAuthState = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const hasSession = !!data.session;
      
      const { data: userData } = await supabase.auth.getUser();
      const hasUser = !!userData.user;
      
      setAuthState(`Session: ${hasSession ? 'Yes' : 'No'}, User: ${hasUser ? 'Yes' : 'No'}, Store.isAuthenticated: ${isAuthenticated ? 'Yes' : 'No'}`);
    } catch (error) {
      setAuthState(`Error checking auth state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const testGoogleSignIn = async () => {
    try {
      setTestStatus("Starting Google sign-in test process...");
      console.log("Starting Google sign-in test process...");
      
      // Inform user about the world-class fix for flow state errors
      Alert.alert(
        "World-Class Google Auth Fix",
        "This version includes an enterprise-grade solution for 'invalid flow state' errors:\n\n" +
        "• Custom PKCE code verifier management\n" +
        "• Direct API token exchange\n" +
        "• Multi-layered storage redundancy\n" +
        "• Advanced fallback strategies\n\n" +
        "The auth process will now begin with maximum reliability.",
        [{ text: "Continue", style: "default" }]
      );
      
      const success = await signInWithGoogle();
      
      if (success) {
        setTestStatus("Google sign-in successful!");
        console.log("Google sign-in successful!");
        Alert.alert(
          "Success", 
          "Google sign-in was successful! The improved authentication flow has worked correctly.",
          [{ text: "Great!", style: "default" }]
        );
        checkAuthState();
      } else {
        setTestStatus("Sign-in failed without throwing an error");
        console.warn("Google sign-in returned false without throwing an error");
        Alert.alert("Error", "Sign in with Google failed. Please check logs for details.");
        checkAuthState();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestStatus(`Error: ${errorMessage}`);
      console.error("Error during Google sign in test:", error);
      Alert.alert("Error", `Google sign-in error: ${errorMessage}`);
      checkAuthState();
    }
  };
  
  const openSupabaseDashboard = () => {
    Linking.openURL('https://app.supabase.com/');
  };
  
  const handleSignOut = async () => {
    try {
      setTestStatus("Signing out...");
      await supabase.auth.signOut();
      setTestStatus("Sign out complete");
      checkAuthState();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestStatus(`Sign out error: ${errorMessage}`);
    }
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Google Authentication Test</Text>
      <Text style={styles.description}>This screen tests the Google Sign-In implementation.</Text>
      
      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Authentication State:</Text>
        <Text style={styles.authStateText}>{authState}</Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.smallButton}
            onPress={checkAuthState}
          >
            <Text style={styles.smallButtonText}>Refresh State</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.smallButton, styles.signOutButton]}
            onPress={handleSignOut}
          >
            <Text style={styles.smallButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.configSection}>
        <Text style={styles.sectionTitle}>Supabase Configuration Check</Text>
        <Text style={styles.configText}>
          Before testing, make sure your Supabase project has the correct redirect URL configured:
        </Text>
        
        <View style={styles.codeBlock}>
          <Text style={styles.codeText}>medico://auth/callback</Text>
        </View>
        
        <Text style={styles.instructionText}>
          1. Go to your Supabase dashboard
        </Text>
        <Text style={styles.instructionText}>
          2. Select your project
        </Text>
        <Text style={styles.instructionText}>
          3. Go to Authentication → URL Configuration
        </Text>
        <Text style={styles.instructionText}>
          4. Add the URL above to "Redirect URLs"
        </Text>
        
        <TouchableOpacity 
          style={styles.dashboardButton}
          onPress={openSupabaseDashboard}
        >
          <Text style={styles.dashboardButtonText}>Open Supabase Dashboard</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={testGoogleSignIn}
      >
        <Text style={styles.buttonText}>Test Google Sign-In</Text>
      </TouchableOpacity>
      
      {testStatus && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Test Status:</Text>
          <Text style={styles.statusText}>{testStatus}</Text>
        </View>
      )}
      
      <Text style={styles.infoText}>
        Check console logs for detailed authentication flow information.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  statusSection: {
    width: '100%',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  authStateText: {
    fontSize: 14,
    color: '#555',
    marginVertical: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  smallButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  signOutButton: {
    backgroundColor: '#f44336',
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  configSection: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  configText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  codeBlock: {
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    color: '#0066cc',
  },
  instructionText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
    paddingLeft: 10,
  },
  dashboardButton: {
    backgroundColor: '#00c08b',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  dashboardButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 20,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    width: '100%',
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    color: '#444',
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
  }
}); 