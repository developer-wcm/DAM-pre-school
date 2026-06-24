import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function AuthCallbackScreen() {
  const [status, setStatus] = useState('Completing sign in...');
  const [logs, setLogs] = useState<string[]>([]);
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const handled = useRef(false);

  function addLog(msg: string) {
    console.log('[auth-callback]', msg);
    setLogs(prev => [...prev, `${new Date().toISOString().slice(11, 23)} ${msg}`]);
  }

  useEffect(() => {
    async function completeSignIn() {
      addLog('Screen mounted');
      addLog(`Route params: ${JSON.stringify(params)}`);

      if (handled.current) {
        addLog('Already handled — skipping');
        return;
      }

      // Prefer the code from the route params; fall back to parsing the URL
      // that launched the app (cold-start deep link).
      let code = typeof params.code === 'string' ? params.code : undefined;
      addLog(`Code from params: ${code ? code.slice(0, 12) + '…' : 'NONE'}`);

      if (!code) {
        const initialUrl = await Linking.getInitialURL();
        addLog(`Initial URL: ${initialUrl ?? 'null'}`);
        if (initialUrl) {
          const parsed = Linking.parse(initialUrl);
          addLog(`Parsed queryParams: ${JSON.stringify(parsed.queryParams)}`);
          code = (parsed.queryParams?.code as string | undefined) ?? undefined;
          addLog(`Code from initial URL: ${code ? code.slice(0, 12) + '…' : 'NONE'}`);
        }
      }

      if (!code) {
        addLog('No code found — checking for existing session');
        const { data: { session } } = await supabase.auth.getSession();
        addLog(`Existing session: ${session ? 'YES (user: ' + session.user.id + ')' : 'NO'}`);
        if (session) {
          addLog('Session already exists — route guard will redirect');
        } else {
          addLog('No session and no code — waiting for safety-net timeout');
        }
        return;
      }

      handled.current = true;
      setStatus('Exchanging auth code...');
      addLog('Calling exchangeCodeForSession...');

      const { data: exchangeData, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        addLog(`Exchange ERROR: ${error.message}`);
        console.error('auth-callback exchange error:', error.message);
        const { data: { session } } = await supabase.auth.getSession();
        addLog(`Session after error: ${session ? 'YES (user: ' + session.user.id + ')' : 'NO'}`);
        if (!session) {
          setStatus('Sign in failed: ' + error.message);
          router.replace('/login');
        } else {
          addLog('Code already consumed by auth context — session valid, route guard will redirect');
          setStatus('Session found, redirecting...');
        }
      } else {
        addLog(`Exchange SUCCESS`);
        addLog(`Session user: ${exchangeData?.session?.user?.id ?? 'none'}`);
        addLog(`Access token: ${exchangeData?.session?.access_token?.slice(0, 20) ?? 'none'}…`);
        addLog(`Provider token: ${exchangeData?.session?.provider_token?.slice(0, 20) ?? 'none'}…`);
        setStatus('Sign in successful, redirecting...');
      }
    }

    completeSignIn();
  }, [params.code, router]);

  // Safety net: never leave the user stuck on this spinner forever.
  useEffect(() => {
    const timer = setTimeout(async () => {
      addLog('Safety-net timeout fired (10s)');
      const { data: { session } } = await supabase.auth.getSession();
      addLog(`Session at timeout: ${session ? 'YES' : 'NO'}`);
      if (!session) {
        addLog('No session — redirecting to /login');
        router.replace('/login');
      } else {
        addLog('Session exists — route guard should redirect');
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#7B6FE8" />
      <Text style={styles.text}>{status}</Text>
      <Text style={styles.subtext}>Please wait...</Text>
      <ScrollView style={styles.logBox} contentContainerStyle={styles.logContent}>
        {logs.map((line, i) => (
          <Text key={i} style={styles.logLine}>{line}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
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
  logBox: {
    flex: 1,
    width: '100%',
    backgroundColor: '#1A1A2E',
    borderRadius: 8,
    marginTop: 12,
  },
  logContent: {
    padding: 10,
    gap: 2,
  },
  logLine: {
    fontSize: 10,
    color: '#A0F0A0',
    fontFamily: 'monospace',
  },
});
