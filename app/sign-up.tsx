import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

function getPasswordStrength(password: string): {
  label: string;
  color: string;
  segments: number;
} {
  if (password.length === 0) return { label: '', color: '#E0E0E0', segments: 0 };
  if (password.length < 6) return { label: 'Weak', color: '#F87171', segments: 1 };
  if (password.length < 10) return { label: 'Fair', color: '#FBBF24', segments: 2 };
  if (/[A-Z]/.test(password) && /[0-9]/.test(password) && password.length >= 10)
    return { label: 'Strong', color: '#34D399', segments: 4 };
  return { label: 'Good', color: '#34D399', segments: 3 };
}

export default function SignUpScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: string }>();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = getPasswordStrength(password);
  const totalSegments = 4;

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
          {/* Page header */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Create Account</Text>
            <Text style={styles.pageSubtitle}>Join DMA PreSchool</Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            {/* Full Name */}
            <View style={styles.inputRow}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#ABABC4"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Email */}
            <View style={styles.inputRow}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#ABABC4"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>

            {/* Password */}
            <View>
              <View style={styles.inputRow}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#ABABC4"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🙈'}</Text>
                </TouchableOpacity>
              </View>

              {/* Password strength bar */}
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBar}>
                    {Array.from({ length: totalSegments }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.strengthSegment,
                          {
                            backgroundColor:
                              i < strength.segments ? strength.color : '#E0E0E0',
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthLabel, { color: strength.color }]}>
                    {strength.label}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputRow}>
              <Text style={styles.inputIcon}>🔐</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#ABABC4"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                returnKeyType="done"
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                <Text style={styles.eyeIcon}>{showConfirm ? '👁️' : '🙈'}</Text>
              </TouchableOpacity>
            </View>

            {/* Create Account button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                router.push('/parental-consent');
              }}
            >
              <LinearGradient
                colors={['#7B6FE8', '#6EC6C6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.createButton}
              >
                <Text style={styles.createButtonText}>Create Account</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google button */}
          <TouchableOpacity style={styles.googleButton} activeOpacity={0.85}>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Info notice */}
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>
              Your school admin will review and approve your account.
            </Text>
          </View>

          {/* Log in link */}
          <Text style={styles.loginText}>
            Already have an account?{' '}
            <Text style={styles.loginLink} onPress={() => router.push('/login')}>
              Log In
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
    gap: 20,
  },

  // Page header
  pageHeader: {
    gap: 4,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 15,
    color: '#7A7A9D',
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 14,
    shadowColor: '#9B8FE0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },

  // Input rows
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F3FA',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  inputIcon: {
    fontSize: 16,
    width: 22,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A2E',
  },
  eyeBtn: {
    padding: 2,
  },
  eyeIcon: {
    fontSize: 16,
  },

  // Password strength
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
    marginTop: 6,
  },
  strengthBar: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 4,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    width: 44,
    textAlign: 'right',
  },

  // Create button
  createButton: {
    borderRadius: 50,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 4,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0DFF0',
  },
  dividerText: {
    fontSize: 13,
    color: '#9A9AB0',
  },

  // Google button
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    paddingVertical: 16,
    gap: 10,
    shadowColor: '#9B8FE0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5A5A7A',
    fontFamily: 'serif',
  },
  googleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3A3A5A',
  },

  // Info box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF3FF',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  infoIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#5A6A9A',
    lineHeight: 19,
  },

  // Login link
  loginText: {
    fontSize: 14,
    color: '#5A5A7A',
    textAlign: 'center',
  },
  loginLink: {
    color: '#7B6FE8',
    fontWeight: '600',
  },
});
