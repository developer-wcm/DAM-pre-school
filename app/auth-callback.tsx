import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

/**
 * OAuth Callback Handler
 * This screen handles the redirect from Google OAuth.
 * The actual token exchange happens in the auth context, and the auth
 * context's route guard redirects based on role once the session and
 * profile are loaded — so this screen only shows a spinner and must NOT
 * force a redirect of its own (that would race the exchange and bounce a
 * successful sign-in back to login).
 */
export default function AuthCallbackScreen() {
  const [status] = useState('Completing sign in...');

  useEffect(() => {
    console.log('Auth callback screen mounted');
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
