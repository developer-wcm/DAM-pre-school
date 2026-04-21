import { Session, User } from '@supabase/supabase-js';
import { useRouter, useSegments } from 'expo-router';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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
    case 'admin':
      return '/(dashboard)';
    case 'teacher':
      return '/(teacher)';
    case 'parent':
      return '/(parent)';
    case 'accountant':
      return '/(accountant)';
    default:
      return '/login';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // Fetch profile from Supabase
  async function fetchProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return data as Profile;
  }

  // Route guard — runs whenever session or segments change
  useEffect(() => {
    if (loading) return;

    const inAuthGroup =
      segments[0] === undefined ||
      segments[0] === 'index' ||
      segments[0] === 'login' ||
      segments[0] === 'sign-up' ||
      segments[0] === 'role-selection' ||
      segments[0] === 'find-school' ||
      segments[0] === 'parental-consent' ||
      segments[0] === 'approval-pending' ||
      segments[0] === 'privacy-notice';

    if (!session) {
      // Not logged in — send to welcome
      if (!inAuthGroup) {
        router.replace('/');
      }
      return;
    }

    if (!profile) return;

    // Awaiting admin approval
    if (!profile.approved) {
      router.replace('/approval-pending');
      return;
    }

    // Already on the right dashboard — do nothing
    const target = roleToRoute(profile.role);
    const currentGroup = `/(${segments[0]?.replace(/[()]/g, '')})`;
    if (currentGroup === target) return;

    // Redirect to role dashboard
    router.replace(target as any);
  }, [session, profile, loading]);

  // Listen to Supabase auth state
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        const p = await fetchProfile(s.user.id);
        setProfile(p);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        const p = await fetchProfile(s.user.id);
        setProfile(p);
      } else {
        setProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // ── Email / Password Sign In ──────────────────────────────────────────────
  async function signInWithEmail(
    email: string,
    password: string
  ): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }

  // ── Email / Password Sign Up ──────────────────────────────────────────────
  async function signUpWithEmail(
    email: string,
    password: string,
    fullName: string,
    role: string,
    schoolId?: string
  ): Promise<{ error: string | null }> {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Sign up failed. Please try again.' };

    // Insert profile row
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      full_name: fullName,
      role,
      school_id: schoolId ?? null,
      approved: false,
    });

    if (profileError) return { error: profileError.message };
    return { error: null };
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────
  async function signInWithGoogle(): Promise<{ error: string | null }> {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'preschoolapp://auth/callback',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) return { error: error.message };
    if (data?.url) {
      const { openAuthSessionAsync } = await import('expo-web-browser');
      const result = await openAuthSessionAsync(data.url, 'preschoolapp://auth/callback');

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const accessToken = url.searchParams.get('access_token');
        const refreshToken = url.searchParams.get('refresh_token');

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
      }
    }

    return { error: null };
  }

  // ── Sign Out ──────────────────────────────────────────────────────────────
  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
