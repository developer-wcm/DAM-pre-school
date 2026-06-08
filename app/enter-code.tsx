import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
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
import { useAuth } from '../context/auth';

const CODE_LENGTH = 6;

export default function EnterCodeScreen() {
  const router = useRouter();
  const { profile, signOut, markCodeVerified } = useAuth();

  const [code, setCode] = useState<string[]>(
    Array(CODE_LENGTH).fill('')
  );

  const [loading, setLoading] = useState(false);

  const inputs = useRef<(TextInput | null)[]>([]);

  // USER ROLE
  const userRole = profile?.role || 'parent';

  // HANDLE INPUT
  const handleChange = (
    text: string,
    index: number
  ) => {
    const char = text
      .replace(/[^0-9]/g, '')
      .slice(-1);

    const newCode = [...code];
    newCode[index] = char;

    setCode(newCode);

    if (
      char &&
      index < CODE_LENGTH - 1
    ) {
      inputs.current[index + 1]?.focus();
    }
  };

  // BACKSPACE
  const handleKeyPress = (
    e: any,
    index: number
  ) => {
    if (
      e.nativeEvent.key === 'Backspace' &&
      !code[index] &&
      index > 0
    ) {
      inputs.current[index - 1]?.focus();
    }
  };

  // CHECK IF FILLED
  const isFilled = code.every(
    (c) => c !== ''
  );

  // VERIFY CODE
  const handleVerifyCode = async () => {
    if (!isFilled || !profile) return;

    const enteredCode = code.join('');

    setLoading(true);

    try {
      let validCode = '';

      // ROLE BASED CODES
      switch (userRole) {
        case 'parent':
          validCode = '123456';
          break;

        case 'teacher':
          validCode = '654321';
          break;


        default:
          validCode = '';
      }

      // CHECK CODE
      if (enteredCode === validCode) {
        const { error: verifyError } = await markCodeVerified();

        if (verifyError) {
          Alert.alert(
            'Error',
            verifyError
          );
          return;
        }

        // SAVE LOCAL DATA
        await AsyncStorage.setItem(
          'hasCompletedSetup',
          'true'
        );

        await AsyncStorage.setItem(
          'codeVerified',
          'true'
        );

        await AsyncStorage.setItem(
          'userRole',
          userRole
        );

        // ROUTING
        if (userRole === 'teacher') {
          Alert.alert(
            'Success',
            'Teacher verification successful',
            [
              {
                text: 'Continue',
                onPress: () =>
                  router.replace('/select-class'),
              },
            ]
          );
        }

        else if (userRole === 'parent') {
          Alert.alert(
            'Success',
            'Parent verification successful',
            [
              {
                text: 'Continue',
                onPress: () =>
                  router.replace('/(parent)'),
              },
            ]
          );
        }

        else {
          router.replace('/');
        }
      } else {
        Alert.alert(
          'Invalid Code',
          `Incorrect ${userRole} verification code`
        );

        setCode(
          Array(CODE_LENGTH).fill('')
        );

        inputs.current[0]?.focus();
      }
    } catch (error) {
      console.log(error);

      Alert.alert(
        'Error',
        'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'height'
        }
        style={styles.keyboardView}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => signOut()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons
              name="log-out-outline"
              size={24}
              color={COLORS.error}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Enter Code
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          {/* ICON */}
          <View style={styles.illustrationWrapper}>
            <LinearGradient
              colors={[
                COLORS.secondary,
                COLORS.primary,
              ]}
              style={styles.illustrationBox}
            >
              <Ionicons
                name="keypad"
                size={52}
                color={COLORS.white}
              />
            </LinearGradient>
          </View>

          {/* TITLE */}
          <Text style={styles.title}>
            Enter Unique Code
          </Text>

          <Text style={styles.subtitle}>
            Enter the 6-digit verification
            code provided by your school.
          </Text>

          {/* CODE INPUT */}
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>
              Enter 6-digit code
            </Text>

            <View style={styles.otpRow}>
              {Array.from({
                length: CODE_LENGTH,
              }).map((_, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => {
                    inputs.current[i] = ref;
                  }}
                  style={[
                    styles.otpBox,

                    code[i]
                      ? styles.otpBoxFilled
                      : null,

                    i ===
                    code.findIndex(
                      (c) => c === ''
                    )
                      ? styles.otpBoxActive
                      : null,
                  ]}
                  value={code[i]}
                  onChangeText={(text) =>
                    handleChange(text, i)
                  }
                  onKeyPress={(e) =>
                    handleKeyPress(e, i)
                  }
                  maxLength={1}
                  keyboardType="numeric"
                  textAlign="center"
                  selectionColor={
                    COLORS.secondary
                  }
                  returnKeyType="next"
                />
              ))}
            </View>
          </View>

          {/* BUTTON */}
          <TouchableOpacity
            activeOpacity={
              isFilled && !loading
                ? 0.85
                : 1
            }
            style={{ width: '100%' }}
            onPress={handleVerifyCode}
            disabled={!isFilled || loading}
          >
            <LinearGradient
              colors={
                isFilled && !loading
                  ? [
                      COLORS.primary,
                      COLORS.primaryLight,
                    ]
                  : [
                      COLORS.buttonDisabled,
                      COLORS.buttonDisabled,
                    ]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.applyButton}
            >
              {loading ? (
                <Text
                  style={
                    styles.applyButtonText
                  }
                >
                  Verifying...
                </Text>
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={COLORS.white}
                  />

                  <Text
                    style={
                      styles.applyButtonText
                    }
                  >
                    Verify Code
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* HELP */}
          
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
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor:
      'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
  },

  headerSpacer: {
    width: 40,
  },

  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 20,
    gap: 20,
  },

  illustrationWrapper: {
    borderRadius: 28,
    padding: 5,
    backgroundColor: COLORS.white,
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

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
  },

  codeContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },

  codeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  otpRow: {
    flexDirection: 'row',
    gap: 10,
  },

  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
  },

  otpBoxActive: {
    borderColor: COLORS.secondary,
  },

  otpBoxFilled: {
    borderColor: COLORS.secondary,
    backgroundColor:
      COLORS.secondaryLight + '30',
  },

  applyButton: {
    width: '100%',
    borderRadius: 50,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },

  applyButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },

  helpSection: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },

  helpText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});
