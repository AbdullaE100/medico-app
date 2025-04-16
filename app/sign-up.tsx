import React, { useState } from 'react';
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
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/stores/useAuthStore';
import { ErrorMessage } from '@/components/ErrorMessage';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { 
  User,
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  ArrowLeft,
  ArrowRight
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp, isLoading, error } = useAuthStore();
  const router = useRouter();

  const navigateBack = () => {
    router.replace('/');
  };

  const handleSignUp = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      useAuthStore.setState({ error: "All fields are required" });
      return;
    }

    // Auto-prefix 'Dr.' if not already present
    let formattedName = fullName.trim();
    if (!formattedName.startsWith('Dr.') && !formattedName.startsWith('dr.') && !formattedName.startsWith('Dr ') && !formattedName.startsWith('dr ')) {
      formattedName = `Dr. ${formattedName}`;
    }

    if (password !== confirmPassword) {
      useAuthStore.setState({ error: "Passwords don't match" });
      return;
    }

    const success = await signUp(email, password, formattedName);
    if (success) {
      router.replace('/onboarding');
    }
  };

  if (isLoading) {
    return <LoadingOverlay message="Creating your account..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#f8fafc', '#f1f5f9']}
        style={styles.background}
      />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
          <ArrowLeft size={22} color="#0066CC" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          <View style={styles.formContainer}>
            <Text style={styles.title}>Create Your Account</Text>
            <Text style={styles.subtitle}>Join the Medico network to connect with other healthcare professionals</Text>
            
            {error && (
              <ErrorMessage 
                message={error} 
                onDismiss={() => useAuthStore.setState({ error: null })}
              />
            )}
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <View style={styles.inputContainer}>
                <User size={20} color="#0066CC" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="John Smith (Dr. will be added automatically)"
                  placeholderTextColor="#A3A3A3"
                />
              </View>
              <Text style={styles.inputNote}>This name will be visible to other users as "Dr. [Name]"</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email *</Text>
              <View style={styles.inputContainer}>
                <Mail size={20} color="#0066CC" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Your professional email"
                  placeholderTextColor="#A3A3A3"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              <Text style={styles.inputNote}>Your email will not be visible to other users</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password *</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color="#0066CC" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Choose a secure password"
                  placeholderTextColor="#A3A3A3"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  style={styles.visibilityToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 
                    <EyeOff size={20} color="#0066CC" /> : 
                    <Eye size={20} color="#0066CC" />
                  }
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password *</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color="#0066CC" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  placeholderTextColor="#A3A3A3"
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity 
                  style={styles.visibilityToggle}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? 
                    <EyeOff size={20} color="#0066CC" /> : 
                    <Eye size={20} color="#0066CC" />
                  }
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={styles.termsText}>
              By signing up, you agree to our{' '}
              <Text style={styles.linkText}>Terms of Service</Text> and{' '}
              <Text style={styles.linkText}>Privacy Policy</Text>
            </Text>
            
            <TouchableOpacity 
              style={styles.signUpButton} 
              onPress={handleSignUp}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#0066CC', '#0091ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.signUpButtonText}>Create Account</Text>
                <View style={styles.arrowContainer}>
                  <ArrowRight size={18} color="#fff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
            
            <View style={styles.loginLink}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.replace('/sign-in')}>
                <Text style={styles.loginLinkText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0066CC',
    fontWeight: '500',
    marginLeft: 4,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginTop: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
    width: '100%',
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 56,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#334155',
  },
  inputNote: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
    marginLeft: 4,
  },
  visibilityToggle: {
    padding: 4,
  },
  termsText: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 18,
  },
  linkText: {
    color: '#0066CC',
    fontWeight: '500',
  },
  signUpButton: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#0066CC',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  signUpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  loginText: {
    fontSize: 15,
    color: '#64748b',
    marginRight: 5,
  },
  loginLinkText: {
    fontSize: 15,
    color: '#0066CC',
    fontWeight: '600',
  },
}); 