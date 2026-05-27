import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { DEFAULT_SCHOOL_ID, DEFAULT_SCHOOL_NAME } from '../constants/school';
import { useAuth } from '../context/auth';

function getPasswordStrength(password: string) {
  if (password.length === 0) return { label: '', color: '#E0E0E0', segments: 0 };
  if (password.length < 6) return { label: 'Weak', color: '#F87171', segments: 1 };
  if (password.length < 10) return { label: 'Fair', color: '#FBBF24', segments: 2 };
  if (/[A-Z]/.test(password) && /[0-9]/.test(password) && password.length >= 10)
    return { label: 'Strong', color: '#34D399', segments: 4 };
  return { label: 'Good', color: '#34D399', segments: 3 };
}

export default function SignUpScreen() {
  const router = useRouter();
  const { role, schoolId, schoolName } = useLocalSearchParams<{ role: string; schoolId: string; schoolName: string }>();
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const resolvedSchoolId = schoolId ?? DEFAULT_SCHOOL_ID;
  const resolvedSchoolName = schoolName ?? DEFAULT_SCHOOL_NAME;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const strength = getPasswordStrength(password);

  async function handleSignUp() {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error } = await signUpWithEmail(
      email.trim(), password, fullName.trim(), role ?? 'parent', resolvedSchoolId
    );
    setLoading(false);
    if (error) { 
      Alert.alert('Sign up failed', error); 
      return; 
    }
    // Don't manually route - let auth context handle it
    // It will route to account-pending automatically
  }

  async function handleGoogleSignUp() {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setGoogleLoading(false);
    if (error) Alert.alert('Google sign-in failed', error);
  }

  return (
    <LinearGradient colors={['#EDE9F6', '#F0EEF8', '#EAF0F8']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Create Account</Text>
            <Text style={styles.pageSubtitle}>Join DMA PreSchool</Text>
            {resolvedSchoolName ? (
              <View style={styles.schoolBadge}>
                <Ionicons name="business-outline" size={14} color="#7B6FE8" />
                <Text style={styles.schoolBadgeText}>{resolvedSchoolName}</Text>
                {role === 'teacher' && (
                  <View style={styles.teacherTag}>
                    <Text style={styles.teacherTagText}>Teacher</Text>
                  </View>
                )}
              </View>
            ) : null}
          </View>

          <View style={styles.card}>
            {/* Full Name */}
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={18} color="#9A9AB0" style={styles.inputIcon} />
              <TextInput
                style={styles.input} placeholder="Full Name"
                placeholderTextColor="#ABABC4" value={fullName}
                onChangeText={setFullName} autoCapitalize="words"
                returnKeyType="next" editable={!loading}
              />
            </View>

            {/* Email */}
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color="#9A9AB0" style={styles.inputIcon} />
              <TextInput
                style={styles.input} placeholder="Email Address"
                placeholderTextColor="#ABABC4" value={email}
                onChangeText={setEmail} keyboardType="email-address"
                autoCapitalize="none" returnKeyType="next" editable={!loading}
              />
            </View>

            {/* Password */}
            <View>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color="#9A9AB0" style={styles.inputIcon} />
                <TextInput
                  style={styles.input} placeholder="Password"
                  placeholderTextColor="#ABABC4" value={password}
                  onChangeText={setPassword} secureTextEntry={!showPassword}
                  returnKeyType="next" editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color="#9A9AB0" />
                </TouchableOpacity>
              </View>
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBar}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <View
                        key={i}
                        style={[styles.strengthSegment,
                          { backgroundColor: i < strength.segments ? strength.color : '#E0E0E0' }]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputRow}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#9A9AB0" style={styles.inputIcon} />
              <TextInput
                style={styles.input} placeholder="Confirm Password"
                placeholderTextColor="#ABABC4" value={confirmPassword}
                onChangeText={setConfirmPassword} secureTextEntry={!showConfirm}
                returnKeyType="done" onSubmitEditing={handleSignUp} editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                <Ionicons name={showConfirm ? 'eye-outline' : 'eye-off-outline'} size={18} color="#9A9AB0" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity activeOpacity={0.85} onPress={handleSignUp} disabled={loading}>
              <LinearGradient
                colors={['#7B6FE8', '#6EC6C6']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.createButton}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.createButtonText}>Create Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.googleButton} activeOpacity={0.85}
            onPress={handleGoogleSignUp} disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color="#5A5A7A" />
            ) : (
              <>
                <View style={styles.googleIconBox}>
                  <Text style={styles.googleLetter}>G</Text>
                </View>
                <Text style={styles.googleText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color="#5A6A9A" />
            <Text style={styles.infoText}>
              Your school admin will review and approve your account.
            </Text>
          </View>

          <Text style={styles.loginText}>
            Already have an account?{' '}
            <Text style={styles.loginLink} onPress={() => router.push('/login')}>Log In</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 64, paddingBottom: 40, gap: 20 },

  pageHeader: { gap: 4, marginBottom: 4 },
  pageTitle: { fontSize: 30, fontWeight: '800', color: '#1A1A2E', letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 15, color: '#7A7A9D' },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, gap: 14,
    shadowColor: '#9B8FE0', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 4,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F4F3FA', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 14, gap: 10,
  },
  inputIcon: { width: 20 },
  input: { flex: 1, fontSize: 15, color: '#1A1A2E' },
  eyeBtn: { padding: 2 },

  strengthContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4, marginTop: 6 },
  strengthBar: { flex: 1, flexDirection: 'row', gap: 5 },
  strengthSegment: { flex: 1, height: 4, borderRadius: 4 },
  strengthLabel: { fontSize: 12, fontWeight: '600', width: 44, textAlign: 'right' },

  createButton: { borderRadius: 50, paddingVertical: 17, alignItems: 'center', marginTop: 4 },
  createButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E0DFF0' },
  dividerText: { fontSize: 13, color: '#9A9AB0' },

  googleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 50, paddingVertical: 16, gap: 12,
    shadowColor: '#9B8FE0', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  googleIconBox: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center',
  },
  googleLetter: { fontSize: 13, fontWeight: '800', color: '#4285F4' },
  googleText: { fontSize: 15, fontWeight: '600', color: '#3A3A5A' },

  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#EEF3FF', borderRadius: 14, padding: 14, gap: 10,
  },
  infoText: { flex: 1, fontSize: 13, color: '#5A6A9A', lineHeight: 19 },

  loginText: { fontSize: 14, color: '#5A5A7A', textAlign: 'center' },
  loginLink: { color: '#7B6FE8', fontWeight: '600' },
  schoolBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#E8E4F8', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    alignSelf: 'flex-start', marginTop: 4,
  },
  schoolBadgeText: { fontSize: 13, fontWeight: '600', color: '#7B6FE8' },
  teacherTag: {
    backgroundColor: '#2A9D6E', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2, marginLeft: 4,
  },
  teacherTagText: { fontSize: 10, fontWeight: '800', color: '#fff' },
});
