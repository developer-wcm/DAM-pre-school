import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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

const CODE_LENGTH = 6;

export default function FindSchoolScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role?: string }>();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const code = digits.join('');

  function handleChange(text: string, index: number) {
    const char = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    if (char && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < CODE_LENGTH) {
      Alert.alert('Enter code', 'Please enter the complete 6-digit school code.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('schools')
      .select('id, name, join_code')
      .eq('join_code', trimmed)
      .maybeSingle();
    setLoading(false);

    if (error || !data) {
      Alert.alert(
        'Invalid Code',
        'School not found. Please check the code given by your school admin.'
      );
      return;
    }

    router.push({
      pathname: '/sign-up',
      params: { role: role ?? 'parent', schoolName: data.name },
    });
  }

  return (
    <LinearGradient colors={['#E8EDF7', '#EDF2F7', '#E2EAF4']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>

        <View style={styles.content}>
          {/* School logo */}
          <View style={styles.logoBox}>
            <Image
              source={require('../assets/images/school-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>Find Your School</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code provided{'\n'}by your preschool to join.
          </Text>

          {/* OTP boxes */}
          <View style={styles.otpRow}>
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => { inputRefs.current[i] = r; }}
                style={[
                  styles.otpBox,
                  i === digits.findIndex((d) => d === '') && styles.otpBoxActive,
                  digit !== '' && styles.otpBoxFilled,
                ]}
                value={digit}
                onChangeText={(t) => handleChange(t, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                maxLength={1}
                keyboardType="default"
                autoCapitalize="characters"
                autoCorrect={false}
                selectTextOnFocus
                editable={!loading}
              />
            ))}
          </View>

          {/* Contact admin */}
          <View style={styles.contactRow}>
            <Text style={styles.contactText}>Didn't get a code? </Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.contactLink}>Contact admin</Text>
            </TouchableOpacity>
          </View>

          {/* Join button */}
          <TouchableOpacity
            style={styles.joinBtnWrapper}
            onPress={handleVerify}
            activeOpacity={0.85}
            disabled={loading}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.joinBtn, loading && styles.joinBtnDisabled]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.joinBtnText}>Join School</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  keyboardView: { flex: 1 },

  backBtn: {
    position: 'absolute', top: 56, left: 20, zIndex: 10,
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 18,
  },

  logoBox: {
    width: 110, height: 110, borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 20, elevation: 8,
    marginBottom: 4,
  },
  logo: { width: 80, height: 80, borderRadius: 16 },

  title: {
    fontSize: 28, fontWeight: '800',
    color: COLORS.textPrimary, textAlign: 'center', letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15, color: COLORS.textLight,
    textAlign: 'center', lineHeight: 23,
  },

  otpRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    justifyContent: 'center',
  },
  otpBox: {
    width: 44, height: 54,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontSize: 20, fontWeight: '700',
    color: COLORS.textPrimary,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  otpBoxActive: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
  },
  otpBoxFilled: {
    borderColor: COLORS.secondary,
  },

  contactRow: {
    flexDirection: 'row', alignItems: 'center',
  },
  contactText: { fontSize: 14, color: COLORS.textLight },
  contactLink: {
    fontSize: 14, fontWeight: '700',
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },

  joinBtnWrapper: { width: '100%', marginTop: 4 },
  joinBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 50, paddingVertical: 18,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  joinBtnDisabled: { opacity: 0.6 },
  joinBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
});
