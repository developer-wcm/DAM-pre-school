import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wvdrqhpcuqgmgeqahjqx.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2ZHJxaHBjdXFnbWdlcWFoanF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMDgxNzQsImV4cCI6MjA5MTg4NDE3NH0.--UOXS4b2w4eY-LWat14CCwfDnngLLlw2O_j4nWqpmY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
