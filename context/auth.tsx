import { Session, User } from '@supabase/supabase-js';
import { useRouter, useSegments } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export type UserRole = 'admin' | 'teacher' | 'parent' | 'accountant' | null;

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
    role: string,
    schoolId?: string
  ) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function roleToRoute(role: UserRole): string {
  switch (role) {
    case 'admin':      return '/(dashboard)';
    case 'teacher':    return '/(teacher)';
    case 'parent':     return '/(parent)';
    case 'accountant': return '/(accountant)';
    default:           return '/login';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession]   = useState<Session | null>(null);
  const [user, setUser]         = useState<User | null>(null);
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [loading, setLoading]   = useState(true);
  const router   = useRouter();
  const segments = useSegments();

  // Track whether we've already navigated to avoid loops
  const hasNavigated = useRef(false);

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

    // Special case: If user is on welcome screen (index), don't auto-redirect
    // Let them choose to login or sign up manually
    if (segments[0] === 'index' || segments[0] === undefined) {
      return;
    }

    // Not logged in
    if (!session) {
      if (!onPublicScreen) router.replace('/login');
      return;
    }

    // Logged in but profile not loaded yet — wait
    if (!profile) {
      // Check if this is a new Google sign-up (no profile exists)
      if (session && user) {
        // Give it a moment to create profile, then check again
        setTimeout(async () => {
          const p = await fetchProfile(user.id);
          if (!p) {
            // No profile = new sign-up, go to account pending
            router.replace('/account-pending');
          }
        }, 1000);
      }
      return;
    }

    // Awaiting approval
    if (!profile.approved) {
      router.replace('/account-pending');
      return;
    }

    // Debug: log the segment value
    console.log('Auth check - segments[0]:', segments[0], 'profile role:', profile?.role);
    
    // Check current segment (remove parentheses)
    const currentSegment = (segments[0] || '').replace(/[()]/g, '');
    
    // If user is already on their role-specific screen, don't redirect
    if (currentSegment === 'parent' || currentSegment === 'teacher' || 
        currentSegment === 'accountant') {
      console.log('User on dashboard, skip redirect');
      return;
    }

    // Check if user needs code verification (parent/teacher/accountant)
    const needsCode = profile.role === 'parent' || profile.role === 'teacher' || profile.role === 'accountant';

    // If user needs code verification, redirect to enter-code
    if (needsCode && currentSegment !== 'enter-code' && currentSegment !== 'select-class') {
      console.log('Redirecting to enter-code');
      router.replace('/enter-code');
      return;
    }

    // If on enter-code or select-class, let user proceed
    if (currentSegment === 'enter-code' || currentSegment === 'select-class') {
      return;
    }

    // For admin/principal, navigate to dashboard
    if (profile.role === 'admin' || profile.role === 'principal') {
      const target = roleToRoute(profile.role);
      const currentGroup = `/${currentSegment}`;
      
      if (currentGroup !== target && currentSegment !== 'login' && currentSegment !== 'index') {
        router.replace(target as any);
      }
    }
  }, [session, profile, loading, segments[0]]);

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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role, school_id: schoolId ?? null },
      },
    });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Sign up failed. Please try again.' };
    return { error: null };
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────
  async function signInWithGoogle(): Promise<{ error: string | null }> {
    try {
      const redirectTo = 'preschoolapp://auth/callback';
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

      const hashPart = result.url.includes('#')
        ? result.url.split('#')[1]
        : result.url.split('?')[1];
      const params = new URLSearchParams(hashPart ?? '');
      const accessToken  = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) return { error: sessionError.message };
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
