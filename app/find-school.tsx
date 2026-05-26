import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
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
import { supabase } from '../lib/supabase';

const GENERAL_CODE_LENGTH = 6;
const TEACHER_CODE_LENGTH = 7;

export default function FindSchoolScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: string }>();
  const isTeacher = role === 'teacher';
  const CODE_LENGTH = isTeacher ? TEACHER_CODE_LENGTH : GENERAL_CODE_LENGTH;

  const [lookupMode, setLookupMode] = useState<'code' | 'schoolId'>('code');
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [schoolId, setSchoolId] = useState('');
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const char = text.replace(/[^a-zA-Z0-9]/g, '').slice(-1).toUpperCase();
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
  const isSchoolIdFilled = schoolId.trim().length > 0;

  async function fetchSchoolByIdentifier(identifier: string) {
    const enteredValue = identifier.trim();

    const { data: byJoinCode, error: joinCodeError } = await supabase
      .from('schools')
      .select('join_code, name')
      .ilike('join_code', enteredValue)
      .maybeSingle();

    if (joinCodeError) throw joinCodeError;
    if (byJoinCode) return byJoinCode;

    const { data: byId, error: idError } = await supabase
      .from('schools')
      .select('join_code, name')
      .eq('id', enteredValue)
      .maybeSingle();

    if (idError) throw idError;
    return byId;
  }

  async function handleJoin() {
    if (lookupMode === 'code' && !isFilled) return;
    if (lookupMode === 'schoolId' && !isSchoolIdFilled) return;

    const enteredValue = lookupMode === 'code' ? code.join('') : schoolId.trim();
    setLoading(true);

    try {
      if (lookupMode === 'code' && role === 'teacher') {
        const { data, error } = await supabase
          .from('schools')
          .select('join_code, name, teacher_join_code')
          .ilike('teacher_join_code', enteredValue)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          router.push({
            pathname: '/sign-up',
            params: { role: 'teacher', schoolId: data.join_code, schoolName: data.name },
          });
          return;
        }

        Alert.alert(
          'Invalid Code',
          'This code is not a valid teacher join code. Please ask your admin for the correct teacher code.',
        );
        return;
      }

      const data = await fetchSchoolByIdentifier(enteredValue);

      if (data) {
        router.push({
          pathname: '/sign-up',
          params: { role: role ?? 'parent', schoolId: data.join_code, schoolName: data.name },
        });
        return;
      }

      Alert.alert(
        'School Not Found',
        lookupMode === 'schoolId'
          ? 'No school matched that school ID. Please check and try again.'
          : 'No school found with this code. Please check and try again.',
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#EDE9F6', '#F0EEF8', '#EAF0F8']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#5B4FD4" />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.illustrationWrapper}>
            <LinearGradient
              colors={isTeacher ? ['#2A9D6E', '#3AAF72'] : ['#A78BFA', '#7B6FE8']}
              style={styles.illustrationBox}
            >
              <Ionicons name={isTeacher ? 'school' : 'business'} size={52} color="#fff" />
            </LinearGradient>
          </View>

          <Text style={styles.title}>
            {isTeacher ? 'Enter Teacher Code' : 'Find Your School'}
          </Text>
          <Text style={styles.subtitle}>
            {isTeacher
              ? 'Enter the 6-digit teacher code\nprovided by your school admin.'
              : 'Enter the 6-digit code provided\nby your preschool to join.'}
          </Text>

          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeButton, lookupMode === 'code' && styles.modeButtonActive]}
              activeOpacity={0.85}
              onPress={() => setLookupMode('code')}
              disabled={loading}
            >
              <Text style={[styles.modeButtonText, lookupMode === 'code' && styles.modeButtonTextActive]}>
                School Code
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeButton, lookupMode === 'schoolId' && styles.modeButtonActive]}
              activeOpacity={0.85}
              onPress={() => setLookupMode('schoolId')}
              disabled={loading}
            >
              <Text style={[styles.modeButtonText, lookupMode === 'schoolId' && styles.modeButtonTextActive]}>
                School ID
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.roleBadge, { backgroundColor: isTeacher ? '#D4F4E8' : '#E8E4F8' }]}>
            <Ionicons
              name={isTeacher ? 'book-outline' : 'people-outline'}
              size={14}
              color={isTeacher ? '#2A9D6E' : '#7B6FE8'}
            />
            <Text style={[styles.roleBadgeText, { color: isTeacher ? '#2A9D6E' : '#7B6FE8' }]}>
              Joining as {isTeacher ? 'Teacher' : (role ?? 'Parent')}
            </Text>
          </View>

          {lookupMode === 'code' ? (
            <View style={styles.otpRow}>
              {Array.from({ length: CODE_LENGTH }).map((_, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => { inputs.current[i] = ref; }}
                  style={[
                    styles.otpBox,
                    isTeacher && styles.otpBoxSmall,
                    code[i] ? styles.otpBoxFilled : null,
                    i === code.findIndex((c) => c === '') ? styles.otpBoxActive : null,
                    isTeacher && code[i] ? styles.otpBoxTeacher : null,
                  ]}
                  value={code[i]}
                  onChangeText={(text) => handleChange(text, i)}
                  onKeyPress={(e) => handleKeyPress(e, i)}
                  maxLength={1}
                  keyboardType="default"
                  autoCapitalize="characters"
                  textAlign="center"
                  selectionColor={isTeacher ? '#2A9D6E' : '#7B6FE8'}
                  returnKeyType="next"
                  editable={!loading}
                />
              ))}
            </View>
          ) : (
            <View style={styles.schoolIdInputWrapper}>
              <TextInput
                style={styles.schoolIdInput}
                placeholder="Enter School ID or Join Code"
                placeholderTextColor="#A9A9C4"
                value={schoolId}
                onChangeText={setSchoolId}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
          )}

          <Text style={styles.contactText}>
            Did not get a code? <Text style={styles.contactLink}>Contact admin</Text>
          </Text>

          <TouchableOpacity
            activeOpacity={lookupMode === 'code' ? (isFilled && !loading ? 0.85 : 1) : (isSchoolIdFilled && !loading ? 0.85 : 1)}
            onPress={handleJoin}
            disabled={(lookupMode === 'code' ? !isFilled : !isSchoolIdFilled) || loading}
          >
            <LinearGradient
              colors={
                (lookupMode === 'code' ? isFilled : isSchoolIdFilled) && !loading
                  ? isTeacher ? ['#2A9D6E', '#3AAF72'] : ['#7B6FE8', '#9B8FF8']
                  : ['#C4BEF5', '#C4BEF5']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.joinButton}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.joinButtonText}>Join School</Text>
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
  container: { flex: 1 },
  keyboardView: { flex: 1, paddingHorizontal: 28, paddingTop: 56, paddingBottom: 40 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
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
  illustrationBox: { width: 100, height: 100, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#1A1A2E', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#7A7A9D', textAlign: 'center', lineHeight: 23 },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#E9E6FA',
    borderRadius: 18,
    padding: 4,
    width: '100%',
    gap: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#9B8FE0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7A7A9D',
  },
  modeButtonTextActive: {
    color: '#5B4FD4',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  roleBadgeText: { fontSize: 13, fontWeight: '700' },
  otpRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
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
  otpBoxSmall: { width: 40, fontSize: 18 },
  otpBoxActive: { borderColor: '#7B6FE8' },
  otpBoxFilled: { borderColor: '#7B6FE8', backgroundColor: '#F5F3FF' },
  otpBoxTeacher: { borderColor: '#2A9D6E', backgroundColor: '#F0FBF6' },
  schoolIdInputWrapper: {
    width: '100%',
  },
  schoolIdInput: {
    width: '100%',
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#E3DDF8',
    shadowColor: '#9B8FE0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  contactText: { fontSize: 13, color: '#7A7A9D' },
  contactLink: { color: '#5B4FD4', fontWeight: '600', textDecorationLine: 'underline' },
  joinButton: {
    width: '100%',
    borderRadius: 50,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: 320,
  },
  joinButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
});
