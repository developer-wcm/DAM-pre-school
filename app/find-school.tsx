import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const CODE_LENGTH = 6;

export default function FindSchoolScreen() {
  const router = useRouter();
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    // Only allow single digit/letter
    const char = text.replace(/[^a-zA-Z0-9]/g, '').slice(-1).toUpperCase();
    const newCode = [...code];
    newCode[index] = char;
    setCode(newCode);

    // Auto-advance to next box
    if (char && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const isFilled = code.every((c) => c !== '');

  return (
    <LinearGradient colors={['#EDE9F6', '#F0EEF8', '#EAF0F8']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          {/* School illustration */}
          <View style={styles.illustrationWrapper}>
            <LinearGradient
              colors={['#F5C49A', '#E8A87C']}
              style={styles.illustrationBox}
            >
              <Text style={styles.illustrationEmoji}>🏫</Text>
            </LinearGradient>
          </View>

          <Text style={styles.title}>Find Your School</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code provided{'\n'}by your preschool to join.
          </Text>

          {/* OTP boxes */}
          <View style={styles.otpRow}>
            {Array.from({ length: CODE_LENGTH }).map((_, i) => (
              <TextInput
                key={i}
                ref={(ref) => { inputs.current[i] = ref; }}
                style={[
                  styles.otpBox,
                  code[i] ? styles.otpBoxFilled : null,
                  i === code.findIndex((c) => c === '') ? styles.otpBoxActive : null,
                ]}
                value={code[i]}
                onChangeText={(text) => handleChange(text, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                maxLength={1}
                keyboardType="default"
                autoCapitalize="characters"
                textAlign="center"
                selectionColor="#7B6FE8"
                returnKeyType="next"
              />
            ))}
          </View>

          {/* Contact admin */}
          <Text style={styles.contactText}>
            Didn't get a code?{' '}
            <Text style={styles.contactLink}>Contact admin</Text>
          </Text>

          {/* Join School button */}
          <TouchableOpacity
            activeOpacity={isFilled ? 0.85 : 1}
            onPress={() => {
              if (isFilled) {
                router.push('/sign-up');
              }
            }}
          >
            <LinearGradient
              colors={isFilled ? ['#7B6FE8', '#9B8FF8'] : ['#C4BEF5', '#C4BEF5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.joinButton}
            >
              <Text style={styles.joinButtonText}>Join School  →</Text>
            </LinearGradient>
          </TouchableOpacity>
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
    paddingTop: 56,
    paddingBottom: 40,
  },

  // Back
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 32,
    color: '#5B4FD4',
    lineHeight: 36,
    fontWeight: '300',
  },

  // Content
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },

  // Illustration
  illustrationWrapper: {
    borderRadius: 28,
    padding: 5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#9B8FE0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 8,
  },
  illustrationBox: {
    width: 100,
    height: 100,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationEmoji: {
    fontSize: 52,
  },

  // Text
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#7A7A9D',
    textAlign: 'center',
    lineHeight: 23,
  },

  // OTP
  otpRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#9B8FE0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  otpBoxActive: {
    borderColor: '#7B6FE8',
  },
  otpBoxFilled: {
    borderColor: '#7B6FE8',
    backgroundColor: '#F5F3FF',
  },

  // Contact
  contactText: {
    fontSize: 13,
    color: '#7A7A9D',
  },
  contactLink: {
    color: '#5B4FD4',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // Join button
  joinButton: {
    width: '100%',
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 320,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
