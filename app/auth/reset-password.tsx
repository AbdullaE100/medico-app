import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, extractParamsFromUrl } from '@/lib/supabase';
import * as Linking from 'expo-linking';

const { width, height } = Dimensions.get('window');

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Setup auth state listener for PASSWORD_RECOVERY event
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'PASSWORD_RECOVERY') {
          console.log('Password recovery event detected');
          setInitialized(true);
        }
      }
    );
    
    // Initial check for tokens in URL
    const checkParams = async () => {
      console.log('Reset password: Checking for parameters');
      
      try {
        // Get the current URL to extract all parameters
        const url = await Linking.getInitialURL();
        console.log('Initial URL:', url);
        
        if (url) {
          // Check which URL pattern we're dealing with
          const isPasswordActionsPath = url.includes('password-actions/reset');
          const hasProfileUpdatePath = url.includes('/profile/update');
          const hasPasswordResetPath = url.includes('/password-reset/confirm');
          
          console.log('URL contains password-actions/reset:', isPasswordActionsPath);
          console.log('URL contains profile/update path:', hasProfileUpdatePath);
          console.log('URL contains password-reset/confirm path:', hasPasswordResetPath);
          
          // Extract parameters from URL
          const urlParams = extractParamsFromUrl(url);
          console.log('Extracted URL params:', urlParams);
          
          // Look for tokens in the URL
          const accessToken = urlParams?.access_token || 
                             urlParams?.token || 
                             params.access_token || 
                             params.token;
          
          if (accessToken) {
            console.log('Found token in URL, setting session');
            try {
              // Set the session using the token
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken as string,
                refresh_token: urlParams?.refresh_token || ''
              });
              
              if (error) {
                console.error('Error setting session:', error);
                setError('Unable to verify your reset token. Please request a new password reset.');
              } else {
                console.log('Session set successfully:', data);
                setInitialized(true);
              }
            } catch (err) {
              console.error('Error handling reset token:', err);
              setError('Unable to process your password reset request. Please try again.');
            }
          } else {
            console.log('No token found in URL, checking for active session');
            // Check if we already have a valid session
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              console.log('Active session found');
              setInitialized(true);
            } else {
              console.log('No active session found');
              setError('No valid reset token found. Please request a new password reset.');
            }
          }
        } else {
          // If no URL, check for an active session anyway
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            console.log('Active session found without URL');
            setInitialized(true);
          } else {
            console.log('No URL or active session found');
            setError('No valid reset link was detected. Please request a new password reset.');
          }
        }
      } catch (err) {
        console.error('Error processing reset password URL:', err);
        setError('An error occurred processing your password reset. Please try again.');
      }
    };
    
    checkParams();
    
    // Clean up listener on unmount
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [params]);
  
  const handleResetPassword = async () => {
    if (!password) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Attempting to update password...');
      
      // Update password in Supabase
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: password
      });
      
      if (updateError) {
        console.error('Error updating password:', updateError);
        throw updateError;
      }
      
      console.log('Password updated successfully:', data);
      setSuccess(true);
      
      // Automatically navigate back to sign-in after a short delay
      setTimeout(() => {
        router.replace('/(auth)/sign-in');
      }, 2000);
    } catch (err: any) {
      console.error('Error resetting password:', err);
      setError(err.message || 'Failed to reset password. Please try again.');
      Alert.alert('Error', err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add this debug function to help test the reset password functionality
  const debugOpenResetLink = async () => {
    try {
      // Generate a test reset password link - for debugging only
      // This would normally come from the email
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        'test@example.com',
        { redirectTo: 'medico://password-actions/reset' }
      );
      
      if (error) {
        console.error('Error generating test reset link:', error);
        Alert.alert('Error', 'Failed to generate test reset link: ' + error.message);
        return;
      }
      
      console.log('Generated test reset data:', data);
      Alert.alert(
        'Debug Info',
        'A test reset password email has been sent to test@example.com.\n\n' +
        'Check your server logs for the actual reset URL.\n\n' +
        'For testing, you should copy the link from the email and open it in your browser.',
        [{ text: 'OK' }]
      );
    } catch (err) {
      console.error('Debug test error:', err);
      Alert.alert('Error', 'Debug test error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background */}
      <LinearGradient
        colors={['#050e30', '#0a1956']}
        style={styles.backgroundGradient}
      />
      
      <View style={styles.backgroundCircle1} />
      <View style={styles.backgroundCircle2} />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.replace('/(auth)/sign-in')}
            >
              <ArrowLeft size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerText}>Reset Password</Text>
            <View style={{width: 24}} />
          </View>
          
          <View style={styles.contentContainer}>
            {success ? (
              <View style={styles.successContainer}>
                <CheckCircle size={80} color="#0091FF" />
                <Text style={styles.successTitle}>Password Reset</Text>
                <Text style={styles.successText}>
                  Your password has been successfully reset. You will be redirected to the sign-in screen.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.title}>Create New Password</Text>
                <Text style={styles.subtitle}>
                  Please enter a new password for your account
                </Text>
                
                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
                
                {!initialized && !error ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0091FF" />
                    <Text style={styles.loadingText}>Verifying your reset link...</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>New Password</Text>
                      <View style={styles.inputContainer}>
                        <Lock size={20} color="#0066CC" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          value={password}
                          onChangeText={setPassword}
                          placeholder="Enter new password"
                          placeholderTextColor="rgba(255,255,255,0.5)"
                          secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity 
                          onPress={() => setShowPassword(!showPassword)}
                          style={styles.eyeIcon}
                        >
                          {showPassword ? 
                            <EyeOff size={20} color="#0066CC" /> : 
                            <Eye size={20} color="#0066CC" />
                          }
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Confirm Password</Text>
                      <View style={styles.inputContainer}>
                        <Lock size={20} color="#0066CC" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          placeholder="Confirm new password"
                          placeholderTextColor="rgba(255,255,255,0.5)"
                          secureTextEntry={!showConfirmPassword}
                        />
                        <TouchableOpacity 
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={styles.eyeIcon}
                        >
                          {showConfirmPassword ? 
                            <EyeOff size={20} color="#0066CC" /> : 
                            <Eye size={20} color="#0066CC" />
                          }
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.resetButton}
                      onPress={handleResetPassword}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.resetButtonText}>Reset Password</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
                
                <TouchableOpacity 
                  style={styles.backToLoginLink}
                  onPress={() => router.replace('/(auth)/sign-in')}
                >
                  <Text style={styles.backToLoginLinkText}>Back to Sign In</Text>
                </TouchableOpacity>
                
                {/* Add debug button at the bottom if there's an error */}
                {error && __DEV__ && (
                  <TouchableOpacity 
                    style={styles.debugButton}
                    onPress={debugOpenResetLink}
                  >
                    <Text style={styles.debugButtonText}>Debug: Test Reset Password</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050e30',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundCircle1: {
    position: 'absolute',
    width: height * 0.4,
    height: height * 0.4,
    borderRadius: height * 0.2,
    backgroundColor: '#0091FF',
    top: -height * 0.05,
    right: -width * 0.2,
    opacity: 0.3,
  },
  backgroundCircle2: {
    position: 'absolute',
    width: height * 0.5,
    height: height * 0.5,
    borderRadius: height * 0.25,
    backgroundColor: '#0066CC',
    bottom: -height * 0.15,
    left: -width * 0.3,
    opacity: 0.2,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contentContainer: {
    padding: 24,
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    backdropFilter: 'blur(10px)',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginVertical: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 15,
    fontSize: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#FFFFFF',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 8,
  },
  resetButton: {
    backgroundColor: '#0091FF',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backToLoginLink: {
    alignItems: 'center',
  },
  backToLoginLinkText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '500',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 16,
  },
  successText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  debugButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  debugButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
}); 