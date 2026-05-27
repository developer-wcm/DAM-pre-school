import { Session, User } from '@supabase/supabase-js';
import { useRouter, useSegments } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_SCHOOL_ID } from '../constants/school';
import { supabase } from '../lib/supabase';
import { getAuthRedirectTarget } from '../utils/auth-routing';

WebBrowser.maybeCompleteAuthSession();

export type UserRole = 'admin' | 'principal' | 'teacher' | 'parent' | 'accountant' | null;

interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  school_id: string | null;
  approved: boolean;
  code_verified?: boolean;
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
    role: string,
    schoolId?: string
  ) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  markCodeVerified: () => Promise<{ error: string | null }>;
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
      'role-selection', 'find-school', 'parental-consent',
      'approval-pending', 'account-pending', 'privacy-notice', 'auth', 'enter-code',
    ];
    const onPublicScreen = publicScreens.includes(segments[0] as any);

    if (segments[0] === 'index' || segments[0] === undefined) {
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
          if (!p) {
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

    const currentSegment = (segments[0] || '').replace(/[()]/g, '');

    if (redirectTarget === '/(dashboard)') {
      if (currentSegment === 'dashboard') {
        return;
      }
      router.replace('/(dashboard)' as any);
      return;
    }

    if (redirectTarget === '/account-pending') {
      if (currentSegment === 'account-pending') {
        return;
      }
      router.replace('/account-pending');
      return;
    }

    if (redirectTarget === '/enter-code') {
      if (currentSegment === 'enter-code' || currentSegment === 'select-class' || currentSegment === 'enter-class-id') {
        return;
      }
      router.replace('/enter-code');
      return;
    }

    if (redirectTarget === '/select-class') {
      if (currentSegment === 'select-class' || currentSegment === 'enter-class-id' || currentSegment === 'teacher') {
        return;
      }
      router.replace('/select-class');
      return;
    }

    if (redirectTarget === '/(parent)') {
      if (currentSegment === 'parent') {
        return;
      }
      router.replace('/(parent)' as any);
      return;
    }

    if (redirectTarget === '/(accountant)') {
      if (currentSegment === 'accountant') {
        return;
      }
      router.replace('/(accountant)' as any);
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
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, s) => {
      console.log('Auth event:', event);
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
    role: string,
    schoolId?: string
  ): Promise<{ error: string | null }> {
    const resolvedSchoolId = schoolId ?? DEFAULT_SCHOOL_ID;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role, school_id: resolvedSchoolId },
      },
    });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Sign up failed. Please try again.' };
    return { error: null };
  }

  async function markCodeVerified(): Promise<{ error: string | null }> {
    if (!user?.id) {
      return { error: 'No signed-in user found.' };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ code_verified: true })
      .eq('id', user.id);

    if (error) {
      return { error: error.message };
    }

    setProfile((current) => (
      current ? { ...current, code_verified: true } : current
    ));

    return { error: null };
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────
  async function signInWithGoogle(): Promise<{ error: string | null }> {
    try {
      // Use localhost for Expo development, deep link for production
      const isDevelopment = __DEV__;
      const redirectTo = isDevelopment 
        ? 'exp://localhost:8081' 
        : 'preschoolapp://auth/callback';
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (error) return { error: error.message };
      if (!data?.url) return { error: 'Could not get OAuth URL' };

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success') return { error: null };

      // Parse the URL to get tokens - OAuth returns tokens in the URL hash fragment
      const urlObj = new URL(result.url);
      const hashParams = new URLSearchParams(urlObj.hash.substring(1)); // Remove # and parse
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) return { error: sessionError.message };
        
        // Fetch profile and let the route guard handle redirect
        const { data: { session: newSession } } = await supabase.auth.getSession();
        if (newSession?.user) {
          const p = await fetchProfile(newSession.user.id);
          setProfile(p);
        }
      }
      return { error: null };
    } catch (e: any) {
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
      signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, markCodeVerified,
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
