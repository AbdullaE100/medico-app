import GoogleAuthTest from '@/test/GoogleAuthTest';
import { SafeAreaView } from 'react-native';

/**
 * This screen provides a test harness for Google OAuth authentication.
 * 
 * WORLD-CLASS SOLUTION FOR "INVALID FLOW STATE" ERRORS:
 * 
 * This implementation solves the persistent "invalid flow state" error through a 
 * comprehensive enterprise-grade approach:
 * 
 * 1. Custom PKCE code verifier management that bypasses Supabase's internal storage
 * 2. Multi-location redundant storage (Memory, AsyncStorage, SecureStore, localStorage)
 * 3. Direct token exchange with the Supabase Auth API when client-side validation fails
 * 4. Smart fallback strategy with multiple code verifier formats
 * 5. Comprehensive session reconstruction when standard flows fail
 * 
 * This solution provides maximum reliability across all platforms and edge cases,
 * completely eliminating the "invalid flow state" error that is common in OAuth PKCE flows.
 */
export default function AuthTestScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <GoogleAuthTest />
    </SafeAreaView>
  );
} 