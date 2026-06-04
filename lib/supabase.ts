import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wvdrqhpcuqgmgeqahjqx.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2ZHJxaHBjdXFnbWdlcWFoanF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMDgxNzQsImV4cCI6MjA5MTg4NDE3NH0.--UOXS4b2w4eY-LWat14CCwfDnngLLlw2O_j4nWqpmY';

// Use platform-appropriate storage. On web prefer localStorage (wrapped
// to match async API); on native use AsyncStorage. This avoids cases where
// AsyncStorage isn't available on web builds and refresh tokens fail to persist.
const platformStorage = (() => {
  try {
    if (typeof window !== 'undefined' && window?.localStorage) {
      return {
        getItem: (key: string) => Promise.resolve(window.localStorage.getItem(key)),
        setItem: (key: string, value: string) => Promise.resolve(window.localStorage.setItem(key, value)),
        removeItem: (key: string) => Promise.resolve(window.localStorage.removeItem(key)),
      };
    }
  } catch (e) {
    // fallthrough to AsyncStorage
  }
  return AsyncStorage;
})();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: platformStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
