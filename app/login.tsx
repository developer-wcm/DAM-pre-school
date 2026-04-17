import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <LinearGradient colors={['#EDE9F6', '#F0EEF8', '#EAF0F8']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Top section */}
        <View style={styles.topContent}>
          {/* Logo badge */}
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>🎓</Text>
          </View>

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            {"Sign in to continue managing your\nclassroom or child's progress."}
          </Text>
        </View>

        {/* Inputs */}
        <View style={styles.inputsSection}>
          <View style={styles.inputRow}>
            <Text style={styles.inputIcon}>✉️</Text>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#ABABC4"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#ABABC4"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
            />
          </View>

          <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom actions */}
        <View style={styles.bottomContent}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              router.replace('/(dashboard)');
            }}
          >
            <LinearGradient
              colors={['#7B6FE8', '#6EC6C6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.logInButton}
            >
              <Text style={styles.logInText}>Log In  →</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.signUpText}>
            {"Don't have an account? "}
            <Text style={styles.signUpLink} onPress={() => router.push('/role-selection')}>
              Sign Up
            </Text>
          </Text>
        </View>
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
    paddingHorizontal: 28,
    paddingTop: 72,
    paddingBottom: 44,
    justifyContent: 'space-between',
  },

  // Top
  topContent: {
    gap: 14,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E8E4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoEmoji: {
    fontSize: 26,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#7A7A9D',
    lineHeight: 23,
  },

  // Inputs
  inputsSection: {
    gap: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F3FA',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
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
  forgotBtn: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontSize: 13,
    color: '#7B6FE8',
    fontWeight: '600',
  },

  // Bottom
  bottomContent: {
    gap: 20,
    alignItems: 'center',
  },
  logInButton: {
    width: '100%',
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 340,
  },
  logInText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  signUpText: {
    fontSize: 14,
    color: '#5A5A7A',
  },
  signUpLink: {
    color: '#7B6FE8',
    fontWeight: '700',
  },
});
