import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

const CLASS_ID_LENGTH = 6;

// Demo class IDs for different classes (mix of letters and numbers)
const DEMO_CLASS_IDS: { [key: string]: string } = {
  'play-group': 'PG2024',
  'pre-kg': 'PKG024',
  'junior-kg': 'JKG024',
  'senior-kg': 'SKG024',
};

export default function EnterClassIdScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const selectedClass = params.selectedClass as string || 'junior-kg';
  const className = params.className as string || 'Junior KG';
  
  const [classId, setClassId] = useState<string[]>(Array(CLASS_ID_LENGTH).fill(''));
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const char = text.replace(/[^A-Za-z0-9]/g, '').slice(-1).toUpperCase(); // Letters and numbers
    const newClassId = [...classId];
    newClassId[index] = char;
    setClassId(newClassId);
    if (char && index < CLASS_ID_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !classId[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const isFilled = classId.every((c) => c !== '');

  const handleVerifyClassId = async () => {
    if (!isFilled) return;
    
    const enteredId = classId.join('');
    const expectedId = DEMO_CLASS_IDS[selectedClass];
    
    // Simulate class ID verification
    if (enteredId === expectedId) {
      try {
        // Store class information
        await AsyncStorage.setItem('selectedClass', selectedClass);
        await AsyncStorage.setItem('className', className);
        await AsyncStorage.setItem('classId', enteredId);
        
        Alert.alert(
          'Class ID Verified!',
          `Welcome to ${className}! You now have access to your class dashboard.`,
          [
            {
              text: 'Continue',
              onPress: () => router.replace('/(teacher)')
            }
          ]
        );
      } catch (error) {
        // Even if AsyncStorage fails, still proceed to dashboard
        Alert.alert(
          'Class ID Verified!',
          `Welcome to ${className}! You now have access to your class dashboard.`,
          [
            {
              text: 'Continue',
              onPress: () => router.replace('/(teacher)')
            }
          ]
        );
      }
    } else {
      Alert.alert(
        'Invalid Class ID',
        'The Class ID you entered is incorrect. Please check with your Principal/Admin and try again.',
        [{ text: 'OK' }]
      );
      // Clear the class ID
      setClassId(Array(CLASS_ID_LENGTH).fill(''));
      inputs.current[0]?.focus();
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Enter Class ID</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.illustrationWrapper}>
            <LinearGradient colors={[COLORS.secondary, COLORS.primary]} style={styles.illustrationBox}>
              <Ionicons name="key" size={52} color={COLORS.white} />
            </LinearGradient>
          </View>

          <Text style={styles.title}>Enter Class ID</Text>
          <Text style={styles.subtitle}>
            Unique ID for assigned class{'\n'}
            Provided by Principal / Admin
          </Text>

          {/* Class ID Input */}
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Enter 6-character Class ID</Text>
            <View style={styles.otpRow}>
              {Array.from({ length: CLASS_ID_LENGTH }).map((_, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => { inputs.current[i] = ref; }}
                  style={[
                    styles.otpBox,
                    classId[i] ? styles.otpBoxFilled : null,
                    i === classId.findIndex((c) => c === '') ? styles.otpBoxActive : null,
                  ]}
                  value={classId[i]}
                  onChangeText={(text) => handleChange(text, i)}
                  onKeyPress={(e) => handleKeyPress(e, i)}
                  maxLength={1}
                  textAlign="center"
                  selectionColor={COLORS.secondary}
                  returnKeyType="next"
                  autoCapitalize="characters"
                />
              ))}
            </View>
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            activeOpacity={isFilled ? 0.85 : 1}
            style={{ width: '100%' }}
            onPress={handleVerifyClassId}
          >
            <LinearGradient
              colors={isFilled ? [COLORS.primary, COLORS.primaryLight] : [COLORS.buttonDisabled, COLORS.buttonDisabled]}
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0 }}
              style={styles.verifyButton}
            >
              <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
              <Text style={styles.verifyButtonText}>Verify & Continue</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Help Section */}
          <View style={styles.helpSection}>
            <Text style={styles.helpText}>
              Don't have your Class ID?{' '}
              <Text style={styles.helpLink}>Contact Principal/Admin</Text>
            </Text>

            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={16} color={COLORS.secondary} />
              <Text style={styles.infoText}>
                Each class has a unique ID for security and proper access control
              </Text>
            </View>
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

  // Verify Button
  verifyButton: {
    width: '100%',
    borderRadius: 50,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  verifyButtonText: { 
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.secondaryLight + '20',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.secondary + '30',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textPrimary,
    lineHeight: 16,
  },
  newAdmissionButton: {
    width: '100%',
    backgroundColor: COLORS.secondarySoft,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  newAdmissionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  newAdmissionText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
    letterSpacing: 0.3,
  },
});