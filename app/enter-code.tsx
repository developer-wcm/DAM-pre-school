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
import { supabase } from '../lib/supabase';

const CODE_LENGTH = 6;

export default function EnterCodeScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  // Get user role from profile
  const userRole = profile?.role || 'parent';

  const handleChange = (text: string, index: number) => {
    const char = text.replace(/[^0-9]/g, '').slice(-1); // Only numbers
    const newCode = [...code];
    newCode[index] = char;
    setCode(newCode);
    if (char && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const isFilled = code.every((c) => c !== '');

  const handleVerifyCode = async () => {
    if (!isFilled || !profile) return;
    
    const enteredCode = code.join('');
    setLoading(true);
    
    try {
      // Fetch the verification code from the database
      const { data: profileData, error: fetchError } = await supabase
        .from('profiles')
        .select('verification_code, code_expires_at')
        .eq('id', profile.id)
        .single();
      
      if (fetchError || !profileData) {
        console.error('Error fetching profile:', fetchError);
        Alert.alert('Error', 'Unable to verify code. Please try again.');
        setLoading(false);
        return;
      }

      // Check if code matches
      if (enteredCode === profileData.verification_code) {
        // Check if code has expired
        if (profileData.code_expires_at && new Date(profileData.code_expires_at) < new Date()) {
          Alert.alert('Code Expired', 'Your verification code has expired. Please contact school admin for a new code.');
          setLoading(false);
          return;
        }

        // Code is valid
        try {
          // Mark setup as completed and code as verified
          await AsyncStorage.setItem('hasCompletedSetup', 'true');
          await AsyncStorage.setItem('codeVerified', 'true');
          await AsyncStorage.setItem('userRole', userRole);
          
          // Navigate based on role
          if (userRole === 'teacher') {
            // Clear any previous class selection
            await AsyncStorage.removeItem('selectedClass');
            await AsyncStorage.removeItem('className');
            await AsyncStorage.removeItem('classId');
            
            Alert.alert(
              'Code Verified!',
              'Welcome Teacher! Please select your assigned class.',
              [
                {
                  text: 'Continue',
                  onPress: () => router.replace('/select-class')
                }
              ]
            );
          } else if (userRole === 'parent') {
            Alert.alert(
              'Code Verified!',
              'Welcome! You now have access to your child\'s dashboard.',
              [
                {
                  text: 'Continue',
                  onPress: () => router.replace('/(parent)')
                }
              ]
            );
          } else if (userRole === 'accountant') {
            Alert.alert(
              'Code Verified!',
              'Welcome! You now have access to the accountant dashboard.',
              [
                {
                  text: 'Continue',
                  onPress: () => router.replace('/(accountant)')
                }
              ]
            );
          }
        } catch (storageError) {
          console.error('Storage error:', storageError);
          // Still proceed even if storage fails
          if (userRole === 'teacher') {
            router.replace('/select-class');
          } else if (userRole === 'parent') {
            router.replace('/(parent)');
          } else if (userRole === 'accountant') {
            router.replace('/(accountant)');
          }
        }
      } else {
        Alert.alert(
          'Invalid Code',
          'The code you entered is incorrect. Please check and try again.',
          [{ text: 'OK' }]
        );
        // Clear the code
        setCode(Array(CODE_LENGTH).fill(''));
        inputs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Unexpected error during code verification:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => signOut()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Enter Code</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.illustrationWrapper}>
            <LinearGradient colors={[COLORS.secondary, COLORS.primary]} style={styles.illustrationBox}>
              <Ionicons name="keypad" size={52} color={COLORS.white} />
            </LinearGradient>
          </View>

          <Text style={styles.title}>Enter Unique Code</Text>
          <Text style={styles.subtitle}>
            The school will provide a 6-digit code to be used every time you log in
          </Text>

          {/* Code Input */}
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Enter 6-digit code</Text>
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
                  keyboardType="numeric"
                  textAlign="center"
                  selectionColor={COLORS.secondary}
                  returnKeyType="next"
                />
              ))}
            </View>
          </View>

          {/* Apply Button */}
          <TouchableOpacity
            activeOpacity={isFilled && !loading ? 0.85 : 1}
            style={{ width: '100%' }}
            onPress={handleVerifyCode}
            disabled={!isFilled || loading}
          >
            <LinearGradient
              colors={isFilled && !loading ? [COLORS.primary, COLORS.primaryLight] : [COLORS.buttonDisabled, COLORS.buttonDisabled]}
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0 }}
              style={styles.applyButton}
            >
              {loading ? (
                <Text style={styles.applyButtonText}>Verifying...</Text>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
                  <Text style={styles.applyButtonText}>Apply</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Help Section */}
          <View style={styles.helpSection}>
            <Text style={styles.helpText}>
              Didn't receive the code?{' '}
              <Text style={styles.helpLink}>Contact school admin</Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  
  // Header
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
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
  },
  headerSpacer: { width: 40 },

  // Content
  content: { 
    flex: 1, 
    alignItems: 'center', 
    paddingHorizontal: 28,
    paddingTop: 20,
    gap: 20 
  },

  // Illustration
  illustrationWrapper: {
    borderRadius: 28,
    padding: 5,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.cardShadow,
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

  // Text
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: COLORS.textPrimary, 
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: { 
    fontSize: 15, 
    color: COLORS.textSecondary, 
    textAlign: 'center', 
    lineHeight: 23 
  },

  // Code Input
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
    gap: 10 
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
    shadowColor: COLORS.cardShadow, 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, 
    shadowRadius: 6, 
    elevation: 2,
  },
  otpBoxActive: { 
    borderColor: COLORS.secondary 
  },
  otpBoxFilled: { 
    borderColor: COLORS.secondary, 
    backgroundColor: COLORS.secondaryLight + '30' 
  },

  // Apply Button
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
    letterSpacing: 0.3 
  },

  // Help Section
  helpSection: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
  },
  helpText: { 
    fontSize: 13, 
    color: COLORS.textSecondary, 
    textAlign: 'center' 
  },
  helpLink: { 
    color: COLORS.primary, 
    fontWeight: '600', 
    textDecorationLine: 'underline' 
  },
});