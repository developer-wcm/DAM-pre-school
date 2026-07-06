import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS } from '../constants/admissionTheme';
import { IMAGES } from '../constants/images';
import { useAuth } from '../context/auth';

export default function LoginScreen() {
  const { signInWithEmail, signInWithGoogle, resetPasswordForEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [forgotVisible, setForgotVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { error } = await signInWithEmail(email.trim().toLowerCase(), password);
    setLoading(false);
    if (error) {
      Alert.alert('Login Failed', error);
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setGoogleLoading(false);
    if (error) {
      Alert.alert('Google Sign-In Failed', error);
    }
  }

  function openForgot() {
    setForgotEmail(email.trim()); // prefill if email already typed
    setForgotSent(false);
    setForgotVisible(true);
  }

  function closeForgot() {
    setForgotVisible(false);
    setForgotEmail('');
    setForgotSent(false);
  }

  async function handleForgotSubmit() {
    if (!forgotEmail.trim()) {
      Alert.alert('Email required', 'Please enter your email address.');
      return;
    }
    setForgotLoading(true);
    const { error } = await resetPasswordForEmail(forgotEmail);
    setForgotLoading(false);
    if (error) {
      Alert.alert('Error', error);
    } else {
      setForgotSent(true);
    }
  }

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top */}
          <View style={styles.topContent}>
            <View style={styles.logoBadge}>
              <Image
                source={IMAGES.schoolLogo}
                style={styles.schoolLogo}
                contentFit="contain"
                transition={300}
                cachePolicy="memory-disk"
              />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              {"Sign in to continue managing your\nclassroom or child's progress."}
            </Text>
          </View>

          {/* Inputs */}
          <View style={styles.inputsSection}>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color={COLORS.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={COLORS.gray}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                editable={!loading}
              />
            </View>

            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={COLORS.gray}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={18}
                  color={COLORS.gray}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotBtn} onPress={openForgot} activeOpacity={0.7}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom */}
          <View style={styles.bottomContent}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleLogin}
              disabled={loading}
              style={styles.logInButtonWrapper}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.logInButton}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Text style={styles.logInText}>Log In</Text>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.googleButton}
              activeOpacity={0.85}
              onPress={handleGoogleLogin}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color={COLORS.textSecondary} />
              ) : (
                <>
                  <View style={styles.googleIconBox}>
                    <Text style={styles.googleLetter}>G</Text>
                  </View>
                  <Text style={styles.googleText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal visible={forgotVisible} transparent animationType="slide" onRequestClose={closeForgot}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeForgot} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <TouchableOpacity onPress={closeForgot} hitSlop={12}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {forgotSent ? (
              <View style={styles.sentContainer}>
                <View style={styles.sentIcon}>
                  <Ionicons name="mail-open-outline" size={36} color={COLORS.primary} />
                </View>
                <Text style={styles.sentTitle}>Check your inbox</Text>
                <Text style={styles.sentDesc}>
                  We've sent a password reset link to{'\n'}
                  <Text style={styles.sentEmail}>{forgotEmail}</Text>
                </Text>
                <Text style={styles.sentHint}>
                  Tap the link in the email to set a new password. If you don't see it, check your spam folder.
                </Text>
                <TouchableOpacity style={styles.doneBtn} onPress={closeForgot} activeOpacity={0.85}>
                  <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.modalDesc}>
                  Enter the email address linked to your account and we'll send you a reset link.
                </Text>

                <View style={styles.modalInputRow}>
                  <Ionicons name="mail-outline" size={18} color={COLORS.gray} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor={COLORS.gray}
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoFocus
                    returnKeyType="send"
                    onSubmitEditing={handleForgotSubmit}
                    editable={!forgotLoading}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.sendBtn, forgotLoading && { opacity: 0.7 }]}
                  onPress={handleForgotSubmit}
                  disabled={forgotLoading}
                  activeOpacity={0.85}
                >
                  {forgotLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <>
                      <Ionicons name="send-outline" size={18} color={COLORS.white} />
                      <Text style={styles.sendBtnText}>Send Reset Link</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 72,
    paddingBottom: 44,
    gap: 32,
  },
  topContent: { gap: 14 },
  logoBadge: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
    shadowColor: COLORS.cardShadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
    padding: 6,
  },
  schoolLogo: { width: '100%', height: '100%' },
  title: { fontSize: 32, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 23 },

  inputsSection: { gap: 14 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.offWhite, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 16, gap: 12,
  },
  inputIcon: { width: 20 },
  input: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  eyeBtn: { padding: 2 },
  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: { fontSize: 13, color: COLORS.secondary, fontWeight: '600' },

  bottomContent: { gap: 16, alignItems: 'center' },
  logInButtonWrapper: { width: '100%', borderRadius: 50, overflow: 'hidden' },
  logInButton: {
    width: '100%', borderRadius: 50, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  logInText: { color: COLORS.white, fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%' },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.lightGray },
  dividerText: { fontSize: 13, color: COLORS.gray },

  googleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.white, borderRadius: 50, paddingVertical: 16,
    width: '100%', gap: 12,
    shadowColor: COLORS.cardShadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  googleIconBox: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.offWhite,
    justifyContent: 'center', alignItems: 'center',
  },
  googleLetter: { fontSize: 13, fontWeight: '800', color: '#4285F4' },
  googleText: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(26,32,44,0.45)' },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 10, paddingBottom: 36,
    gap: 16,
  },
  modalHandle: {
    alignSelf: 'center', width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.lightGray, marginBottom: 4,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  modalDesc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 21 },
  modalInputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.offWhite, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 16, gap: 12,
  },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: 16,
    paddingVertical: 16, gap: 10,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
  },
  sendBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },

  // Sent state
  sentContainer: { alignItems: 'center', paddingVertical: 8, gap: 12 },
  sentIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center', alignItems: 'center',
  },
  sentTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  sentDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  sentEmail: { fontWeight: '700', color: COLORS.textPrimary },
  sentHint: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 18 },
  doneBtn: {
    backgroundColor: COLORS.primary, borderRadius: 50,
    paddingVertical: 14, paddingHorizontal: 48, marginTop: 4,
  },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});
