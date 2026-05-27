import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

/**
 * OAuth Callback Handler
 * This screen handles the redirect from Google OAuth
 * The actual token exchange happens in the auth context
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const [status, setStatus] = useState('Processing authentication...');

  useEffect(() => {
    console.log('Auth callback screen mounted');
    setStatus('Completing sign in...');
    
    // Give the auth context time to process the OAuth callback
    const timer = setTimeout(() => {
      console.log('Auth callback timeout, redirecting to login');
      setStatus('Redirecting...');
      // The auth context will handle the redirect based on user role
      // If we're still here after 3 seconds, something went wrong
      router.replace('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#7B6FE8" />
      <Text style={styles.text}>{status}</Text>
      <Text style={styles.subtext}>Please wait...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    gap: 16,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  subtext: {
    fontSize: 14,
    color: '#666',
  },
});
