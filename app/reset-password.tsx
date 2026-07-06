import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../constants/admissionTheme';
import { supabase } from '../lib/supabase';

type Stage = 'verifying' | 'form' | 'success' | 'error';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const handled = useRef(false);

  const [stage, setStage] = useState<Stage>('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function exchangeCode() {
      if (handled.current) return;

      // Prefer the code from the route params (warm start / expo-router deep
      // link); fall back to parsing the URL that launched the app (cold start).
      let code = typeof params.code === 'string' ? params.code : undefined;

      if (!code) {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          const parsed = Linking.parse(initialUrl);
          code = (parsed.queryParams?.code as string | undefined) ?? undefined;
        }
      }

      if (!code) {
        // Already have a valid session from a previous exchange (app was already open)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setStage('form');
          return;
        }
        setErrorMsg('Invalid or expired reset link. Please request a new one.');
        setStage('error');
        return;
      }

      handled.current = true;
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        setErrorMsg('This reset link has expired or already been used. Please request a new one.');
        setStage('error');
      } else {
        setStage('form');
      }
    }

    exchangeCode();
  }, [params.code]);

  async function handleSave() {
    if (newPassword.length < 6) {
      Alert.alert('Too short', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      // Sign out so the user logs in fresh with the new password
      await supabase.auth.signOut();
      setStage('success');
    }
  }

  if (stage === 'verifying') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.verifyText}>Verifying reset link...</Text>
      </View>
    );
  }

  if (stage === 'error') {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={styles.centered}>
          <View style={[styles.iconCircle, { backgroundColor: COLORS.errorLight }]}>
            <Ionicons name="close-circle-outline" size={48} color={COLORS.error} />
          </View>
          <Text style={styles.resultTitle}>Link Expired</Text>
          <Text style={styles.resultDesc}>{errorMsg}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/login')} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (stage === 'success') {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={styles.centered}>
          <View style={[styles.iconCircle, { backgroundColor: COLORS.successLight }]}>
            <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.success} />
          </View>
          <Text style={styles.resultTitle}>Password Updated!</Text>
          <Text style={styles.resultDesc}>Your password has been changed successfully. Please log in with your new password.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/login')} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.formContainer}>
          <View style={[styles.iconCircle, { backgroundColor: COLORS.primarySoft, marginBottom: 8 }]}>
            <Ionicons name="lock-open-outline" size={36} color={COLORS.primary} />
          </View>
          <Text style={styles.formTitle}>Set New Password</Text>
          <Text style={styles.formDesc}>Enter a new password for your account.</Text>

          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.gray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="New password"
              placeholderTextColor={COLORS.gray}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNew}
              autoFocus
              returnKeyType="next"
              editable={!saving}
            />
            <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeBtn}>
              <Ionicons name={showNew ? 'eye-outline' : 'eye-off-outline'} size={18} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.gray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor={COLORS.gray}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              returnKeyType="done"
              onSubmitEditing={handleSave}
              editable={!saving}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
              <Ionicons name={showConfirm ? 'eye-outline' : 'eye-off-outline'} size={18} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color={COLORS.white} />
                <Text style={styles.primaryBtnText}>Update Password</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1, justifyContent: 'center' },
  centered: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 32, gap: 16,
  },
  verifyText: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary, marginTop: 8 },

  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
  },
  resultTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center' },
  resultDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },

  formContainer: {
    marginHorizontal: 28,
    alignItems: 'center',
    gap: 16,
  },
  formTitle: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary },
  formDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.offWhite, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 16, gap: 12,
    width: '100%',
  },
  inputIcon: { width: 20 },
  input: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  eyeBtn: { padding: 2 },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: 50,
    paddingVertical: 16, paddingHorizontal: 32, gap: 8,
    width: '100%', marginTop: 4,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
});
