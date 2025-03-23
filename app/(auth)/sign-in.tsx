import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ErrorMessage } from '@/components/ErrorMessage';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, isLoading, error } = useAuthStore();
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      useAuthStore.setState({ error: "Email and password are required" });
      return;
    }

    const success = await signIn(email, password);
    if (success) {
      router.replace('/(tabs)');
    }
  };

  if (isLoading) {
    return <LoadingOverlay message="Signing in..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        {/* Logo and App Name */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Ionicons name="medical" size={20} color="#fff" />
          </View>
          <Text style={styles.appName}>MEDICO</Text>
        </View>

        {/* Card Container */}
        <View style={styles.card}>
          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <View style={styles.tabActive}>
              <Text style={styles.tabTextActive}>Sign in</Text>
            </View>
            <Link href="/sign-up" asChild>
              <TouchableOpacity style={styles.tab}>
                <Text style={styles.tabText}>Sign up</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {error && (
            <ErrorMessage 
              message={error} 
              onDismiss={() => useAuthStore.setState({ error: null })}
            />
          )}

          {/* Form Inputs */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail/Phone</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email/Phone"
                placeholderTextColor="#A0A0A0"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor="#A0A0A0"
                secureTextEntry={!showPassword}
              />
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleSignIn}
            activeOpacity={0.9}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>

          {/* Forgot Password */}
          <View style={styles.forgotPasswordContainer}>
            <TouchableOpacity>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Or Sign in with */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>Or signin with</Text>
            <View style={styles.divider} />
          </View>

          {/* Social Login Options */}
          <View style={styles.socialLoginContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-google" size={20} color="#EA4335" />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-microsoft" size={20} color="#00A4EF" />
              <Text style={styles.socialButtonText}>Microsoft</Text>
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have a Account? </Text>
            <Link href="/sign-up" asChild>
              <TouchableOpacity>
                <Text style={styles.signUpText}>Sign up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'Inter_400Regular',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  logoBox: {
    width: 32,
    height: 32,
    backgroundColor: '#0EA5E9',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    color: '#0EA5E9',
  },
  card: {
    width: '100%',
    maxWidth: 428,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    paddingBottom: 12,
  },
  tabActive: {
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#0EA5E9',
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#6B7280',
  },
  tabTextActive: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#0EA5E9',
  },
  formContainer: {
    gap: 16,
    marginBottom: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#374151',
  },
  input: {
    width: '100%',
    height: 44,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  loginButton: {
    width: '100%',
    height: 44,
    backgroundColor: '#0EA5E9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#0EA5E9',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
  },
  socialLoginContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  socialButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#374151',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
  },
  signUpText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#0EA5E9',
  },
});