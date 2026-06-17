import { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { useRouter, useSegments } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_SCHOOL_ID } from '../constants/school';
import { supabase } from '../lib/supabase';
import { getAuthRedirectTarget } from '../utils/auth-routing';

WebBrowser.maybeCompleteAuthSession();

export type UserRole = 'admin' | 'principal' | 'teacher' | 'parent' | null;

interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  school_id: string | null;
  approved: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName: string,
    role: string
  ) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession]   = useState<Session | null>(null);
  const [user, setUser]         = useState<User | null>(null);
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [loading, setLoading]   = useState(true);
  const router   = useRouter();
  const segments = useSegments();

  // ── Fetch profile ─────────────────────────────────────────────────────────
  async function fetchProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.warn('fetchProfile error:', error.message);
      return null;
    }
    return data as Profile;
  }

  // ── Route guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;

    const publicScreens = [
      undefined, 'index', 'login', 'sign-up',
      'role-selection', 'find-school',
      'account-pending', 'privacy-notice', 'auth',
      'auth-callback',
    ];
    const onPublicScreen = publicScreens.includes(segments[0] as any);
    const firstSegment = segments[0] as string | undefined;

    if (firstSegment === 'index' || firstSegment === undefined) {
      return;
    }

    if (!session) {
      if (!onPublicScreen) router.replace('/login');
      return;
    }

    if (!profile) {
      if (session && user) {
        setTimeout(async () => {
          const p = await fetchProfile(user.id);
          if (p) {
            // Profile finally loaded (e.g. the sign-up trigger had latency on
            // a fresh APK install). Update state so this guard re-runs and
            // performs the proper role-based redirect.
            setProfile(p);
          } else {
            router.replace('/account-pending');
          }
        }, 1000);
      }
      return;
    }

    const redirectTarget = getAuthRedirectTarget(profile);
    if (!redirectTarget) {
      return;
    }

    // Standalone screens an approved user can open from their dashboard.
    // These live at the app root (not inside a role group), so the redirect
    // logic below must not bounce the user back to their home group.
    const sharedAuthedScreens = ['parent-appointments', 'teacher-appointments'];
    if (sharedAuthedScreens.includes(firstSegment as string)) {
      return;
    }

    const cleanSegment = (segments[0] || '').replace(/[()]/g, '');

    if (redirectTarget === '/(dashboard)') {
      if (cleanSegment === 'dashboard') {
        return;
      }
      router.replace('/(dashboard)' as any);
      return;
    }

    if (redirectTarget === '/account-pending') {
      if (cleanSegment === 'account-pending') {
        return;
      }
      router.replace('/account-pending');
      return;
    }

    if (redirectTarget === '/(teacher)') {
      if (cleanSegment === 'teacher') {
        return;
      }
      router.replace('/(teacher)' as any);
      return;
    }

    if (redirectTarget === '/(parent)') {
      if (cleanSegment === 'parent') {
        return;
      }
      router.replace('/(parent)' as any);
      return;
    }

  }, [loading, profile, router, segments, session, user]);

  // ── Auth state listener ───────────────────────────────────────────────────
  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        const p = await fetchProfile(s.user.id);
        setProfile(p);
      }
      setLoading(false);
    }).catch(async () => {
      // Stale/invalid token — clear local state and let the user sign in again
      setSession(null);
      setUser(null);
      setProfile(null);
      try { await supabase.auth.signOut(); } catch { /* ignore */ }
      setLoading(false);
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, s) => {
      console.log('Auth event:', event);

      // If token refresh failed, force sign out and redirect to login to
      // prompt the user to re-authenticate. This helps recover from
      // "Invalid Refresh Token" errors coming from the refresh endpoint.
      if ((event as string) === 'TOKEN_REFRESH_FAILED') {
        console.warn('Token refresh failed — forcing sign out');
        setSession(null);
        setUser(null);
        setProfile(null);
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.warn('Error signing out after token failure:', e);
        }
        router.replace('/login');
        setLoading(false);
        return;
      }

      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        const p = await fetchProfile(s.user.id);
        setProfile(p);
      } else {
        setProfile(null);
      }

      // Ensure loading is cleared
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // ── Sign In ───────────────────────────────────────────────────────────────
  async function signInWithEmail(
    email: string,
    password: string
  ): Promise<{ error: string | null }> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    // Manually fetch profile in case onAuthStateChange is slow
    if (data.user) {
      const p = await fetchProfile(data.user.id);
      setProfile(p);
      setSession(data.session);
      setUser(data.user);
    }

    return { error: null };
  }

  // ── Sign Up ───────────────────────────────────────────────────────────────
  async function signUpWithEmail(
    email: string,
    password: string,
    fullName: string,
    role: string
  ): Promise<{ error: string | null }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role, school_id: DEFAULT_SCHOOL_ID },
      },
    });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Sign up failed. Please try again.' };
    router.replace('/account-pending');
    return { error: null };
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────
  async function signInWithGoogle(): Promise<{ error: string | null }> {
    try {
      // Let Expo compute the correct redirect URI for the current runtime
      // (Expo Go LAN/tunnel URL, dev client, or production custom scheme).
      const redirectTo = Linking.createURL('auth-callback');

      console.log('Starting Google OAuth with redirect:', redirectTo);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (error) {
        console.error('OAuth setup error:', error);
        return { error: error.message };
      }
      if (!data?.url) return { error: 'Could not get OAuth URL' };

      console.log('Opening OAuth URL...');
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      
      console.log('OAuth result:', result.type);
      
      if (result.type === 'cancel') {
        return { error: null }; // User cancelled, not an error
      }
      
      if (result.type !== 'success') {
        return { error: 'Authentication was not completed' };
      }

      console.log('OAuth success, parsing tokens...');

      const urlObj = new URL(result.url);

      // PKCE flow: Supabase returns a `code` in query params that must be exchanged
      const code = urlObj.searchParams.get('code');
      let newSession = null;

      if (code) {
        console.log('PKCE code found, exchanging for session...');
        const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error('Code exchange error:', exchangeError);
          return { error: exchangeError.message };
        }
        newSession = exchangeData.session;
      } else {
        // Implicit flow fallback: tokens in hash fragment
        const hashParams = new URLSearchParams(urlObj.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        console.log('Implicit tokens found:', { hasAccess: !!accessToken, hasRefresh: !!refreshToken });

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) {
            console.error('Session error:', sessionError);
            return { error: sessionError.message };
          }
          const { data: { session: s } } = await supabase.auth.getSession();
          newSession = s;
        }
      }

      if (newSession?.user) {
        console.log('User found:', newSession.user.id);
        setSession(newSession);
        setUser(newSession.user);

        // Wait for the DB trigger to create the profile row
        await new Promise(resolve => setTimeout(resolve, 1000));

        const p = await fetchProfile(newSession.user.id);
        console.log('Profile fetched:', p);
        if (p) {
          setProfile(p);
        } else {
          console.warn('Profile not found after OAuth, routing to account-pending');
        }
      }

      return { error: null };
    } catch (e: any) {
      console.error('Google OAuth error:', e);
      return { error: e?.message ?? 'Google sign-in failed' };
    }
  }

  // ── Sign Out ──────────────────────────────────────────────────────────────
  async function signOut() {
    setSession(null);
    setUser(null);
    setProfile(null);
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <AuthContext.Provider value={{
      session, user, profile, loading,
      signInWithEmail, signUpWithEmail, signInWithGoogle, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
