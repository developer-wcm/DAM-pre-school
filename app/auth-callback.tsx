import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';

/**
 * OAuth Callback Handler
 *
 * In Expo Go / dev the OAuth redirect is captured by
 * `WebBrowser.openAuthSessionAsync` and the code exchange happens in the auth
 * context. In a production standalone build, the `myapp://auth-callback?code=…`
 * redirect is instead delivered to the app as a deep link and the OS opens this
 * screen directly — `openAuthSessionAsync` never sees it, so the exchange must
 * happen here. We therefore read the `code` from the incoming URL and exchange
 * it for a session. Once the session is set, the auth context's
 * `onAuthStateChange` loads the profile and the route guard redirects by role.
 */
export default function AuthCallbackScreen() {
  const [status, setStatus] = useState('Completing sign in...');
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const handled = useRef(false);

  useEffect(() => {
    async function completeSignIn() {
      if (handled.current) return;

      // Prefer the code from the route params; fall back to parsing the URL
      // that launched the app (cold-start deep link).
      let code = typeof params.code === 'string' ? params.code : undefined;
      if (!code) {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          const parsed = Linking.parse(initialUrl);
          code = (parsed.queryParams?.code as string | undefined) ?? undefined;
        }
      }

      // No code in the URL: the exchange may have already happened in the auth
      // context (Expo Go path). If a session exists the route guard will move
      // us; otherwise the safety-net timeout below sends us back to login.
      if (!code) return;

      handled.current = true;
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('auth-callback exchange error:', error.message);
        // The code may already have been consumed by the auth-context exchange.
        // Only bounce to login if there's genuinely no session.
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setStatus('Sign in failed');
          router.replace('/login');
        }
      }
      // On success the auth context picks up the new session and the route
      // guard performs the role-based redirect — nothing more to do here.
    }

    completeSignIn();
  }, [params.code, router]);

  // Safety net: never leave the user stuck on this spinner forever.
  useEffect(() => {
    const timer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.replace('/login');
    }, 10000);
    return () => clearTimeout(timer);
  }, [router]);

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
