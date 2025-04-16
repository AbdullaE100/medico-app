import React, { useState, useRef } from 'react';
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
  Animated,
  Easing,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';

const { width, height } = Dimensions.get('window');

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();

  // Animation values
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(50)).current;

  // Background animations
  const circlePulse1 = useRef(new Animated.Value(1)).current;
  const circlePulse2 = useRef(new Animated.Value(1)).current;
  const circleOpacity1 = useRef(new Animated.Value(0.3)).current;
  const circleOpacity2 = useRef(new Animated.Value(0.2)).current;

  React.useEffect(() => {
    // Start animations when component mounts
    const fadeInAnimation = Animated.timing(fadeIn, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    });
    
    const slideUpAnimation = Animated.timing(slideUp, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    });

    // Background animations
    const circlePulse1Loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(circlePulse1, {
            toValue: 1.3,
            duration: 8000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.sin),
          }),
          Animated.timing(circleOpacity1, {
            toValue: 0.1,
            duration: 8000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(circlePulse1, {
            toValue: 1,
            duration: 8000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.sin),
          }),
          Animated.timing(circleOpacity1, {
            toValue: 0.3,
            duration: 8000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    
    const circlePulse2Loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(circlePulse2, {
            toValue: 1.5,
            duration: 10000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.sin),
          }),
          Animated.timing(circleOpacity2, {
            toValue: 0.1,
            duration: 10000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(circlePulse2, {
            toValue: 1,
            duration: 10000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.sin),
          }),
          Animated.timing(circleOpacity2, {
            toValue: 0.2,
            duration: 10000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Start all animations
    Animated.parallel([
      fadeInAnimation,
      slideUpAnimation,
    ]).start();
    
    circlePulse1Loop.start();
    circlePulse2Loop.start();

    // Clean up animations when component unmounts
    return () => {
      fadeInAnimation.stop();
      slideUpAnimation.stop();
      circlePulse1Loop.stop();
      circlePulse2Loop.stop();
    };
  }, [fadeIn, slideUp, circlePulse1, circleOpacity1, circlePulse2, circleOpacity2]);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Sending password reset email to:', email);
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: 'medico://password-actions/reset'
        }
      );

      if (error) {
        console.error('Password reset error:', error);
        Alert.alert('Error', error.message);
      } else {
        console.log('Password reset email sent successfully');
        setResetSent(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request password reset. Please try again.');
      console.error('Reset password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Animated background elements */}
      <LinearGradient
        colors={['#050e30', '#0a1956']}
        style={styles.backgroundGradient}
      />
      
      <Animated.View 
        style={[
          styles.backgroundCircle1,
          { 
            opacity: circleOpacity1,
            transform: [{ scale: circlePulse1 }]
          }
        ]}
      />
      
      <Animated.View 
        style={[
          styles.backgroundCircle2,
          { 
            opacity: circleOpacity2,
            transform: [{ scale: circlePulse2 }]
          }
        ]}
      />
      
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
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerText}>Reset Password</Text>
            <View style={{width: 24}} />
          </View>
          
          <Animated.View 
            style={[
              styles.contentContainer,
              {
                opacity: fadeIn,
                transform: [{ translateY: slideUp }]
              }
            ]}
          >
            {resetSent ? (
              <View style={styles.successContainer}>
                <CheckCircle size={80} color="#0091FF" />
                <Text style={styles.successTitle}>Email Sent</Text>
                <Text style={styles.successText}>
                  We've sent instructions to reset your password to {email}. Please check your email and follow the link provided.
                </Text>
                <TouchableOpacity 
                  style={styles.backToLoginButton}
                  onPress={() => router.replace('/(auth)/sign-in')}
                >
                  <Text style={styles.backToLoginText}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.title}>Forgot Your Password?</Text>
                <Text style={styles.subtitle}>
                  Enter your email address and we'll send you a link to reset your password.
                </Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={styles.inputContainer}>
                    <Mail size={20} color="#0066CC" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Enter your email"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                    />
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
                    <Text style={styles.resetButtonText}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.backToLoginLink}
                  onPress={() => router.back()}
                >
                  <Text style={styles.backToLoginLinkText}>Back to Sign In</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
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
  },
  backgroundCircle2: {
    position: 'absolute',
    width: height * 0.5,
    height: height * 0.5,
    borderRadius: height * 0.25,
    backgroundColor: '#0066CC',
    bottom: -height * 0.15,
    left: -width * 0.3,
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
  backToLoginButton: {
    backgroundColor: '#0091FF',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  backToLoginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 