import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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

const TOTAL_STEPS = 5;
const CURRENT_STEP = 1;

type Gender = 'Male' | 'Female';

export default function AdmissionStep1() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [motherTongue, setMotherTongue] = useState('');
  const [nationality, setNationality] = useState('');
  const [address, setAddress] = useState('');
  const [aadhaar, setAadhaar] = useState('');

  const formatDob = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
    else if (digits.length > 2) formatted = digits.slice(0, 2) + '/' + digits.slice(2);
    setDob(formatted);
  };

  return (
    <LinearGradient colors={['#EDE9F6', '#F0EEF8', '#EAF0F8']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Admission</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Step indicator */}
        <View style={styles.stepIndicatorWrapper}>
          <View style={styles.stepDots}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
              const stepNum = i + 1;
              const isActive = stepNum === CURRENT_STEP;
              const isDone = stepNum < CURRENT_STEP;
              return (
                <View key={i} style={styles.stepDotGroup}>
                  <View
                    style={[
                      styles.stepDot,
                      isActive && styles.stepDotActive,
                      isDone && styles.stepDotDone,
                    ]}
                  >
                    {isActive && <Text style={styles.stepDotText}>{stepNum}</Text>}
                  </View>
                  {i < TOTAL_STEPS - 1 && (
                    <View style={[styles.stepLine, isDone && styles.stepLineDone]} />
                  )}
                </View>
              );
            })}
          </View>
          <View style={styles.stepLabelBox}>
            <Text style={styles.stepLabel}>Step {CURRENT_STEP} of {TOTAL_STEPS}: Student Information</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form card */}
          <View style={styles.card}>
            {/* First Name + Last Name */}
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>FIRST NAME <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Arya"
                  placeholderTextColor="#C0C0D8"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>LAST NAME <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Sharma"
                  placeholderTextColor="#C0C0D8"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>DATE OF BIRTH <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWithIcon}>
                <Text style={styles.inputPrefixIcon}>📅</Text>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#C0C0D8"
                  value={dob}
                  onChangeText={formatDob}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
            </View>

            {/* Gender */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>GENDER <Text style={styles.required}>*</Text></Text>
              <View style={styles.genderRow}>
                {(['Male', 'Female'] as Gender[]).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                    onPress={() => setGender(g)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Mother Tongue + Nationality */}
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>MOTHER TONGUE</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Hindi"
                  placeholderTextColor="#C0C0D8"
                  value={motherTongue}
                  onChangeText={setMotherTongue}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>NATIONALITY</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Indian"
                  placeholderTextColor="#C0C0D8"
                  value={nationality}
                  onChangeText={setNationality}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Address */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>ADDRESS</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="#42, Lavender Lane, Green Park..."
                placeholderTextColor="#C0C0D8"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Aadhaar last 4 digits */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>AADHAAR LAST 4 DIGITS</Text>
              <View style={styles.aadhaarRow}>
                <View style={styles.aadhaarPrefix}>
                  <Text style={styles.aadhaarPrefixText}>XXXX-{'\n'}XXXX-</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.aadhaarInput]}
                  placeholder="1234"
                  placeholderTextColor="#C0C0D8"
                  value={aadhaar}
                  onChangeText={(t) => setAadhaar(t.replace(/\D/g, '').slice(0, 4))}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Next Step button */}
        <View style={styles.stickyBottom}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/admission/step-2')}
          >
            <LinearGradient
              colors={['#5B4FD4', '#7B6FE8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextBtn}
            >
              <Text style={styles.nextBtnText}>Next Step</Text>
              <View style={styles.nextArrowCircle}>
                <Text style={styles.nextArrow}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
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
    paddingTop: 56,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9B8FE0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  backIcon: {
    fontSize: 18,
    color: '#7B6FE8',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A2E',
    flex: 1,
  },
  headerSpacer: { width: 36 },

  // Step indicator
  stepIndicatorWrapper: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 8,
  },
  stepDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDotGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0DDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#7B6FE8',
    shadowColor: '#7B6FE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  stepDotDone: {
    backgroundColor: '#3AAF72',
  },
  stepDotText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E0DDF5',
    marginHorizontal: 4,
  },
  stepLineDone: {
    backgroundColor: '#3AAF72',
  },
  stepLabelBox: {
    alignSelf: 'center',
    backgroundColor: '#EDE9F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7B6FE8',
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 18,
    shadowColor: '#9B8FE0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },

  // Fields
  field: { gap: 6 },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1, gap: 6 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9A9AB0',
    letterSpacing: 0.8,
  },
  required: { color: '#E05A5A' },

  input: {
    backgroundColor: '#F4F3FA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: '#1A1A2E',
  },
  inputFlex: { flex: 1 },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F3FA',
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  inputPrefixIcon: { fontSize: 16 },
  textArea: {
    height: 90,
    paddingTop: 13,
    textAlignVertical: 'top',
  },

  // Gender
  genderRow: {
    flexDirection: 'row',
    backgroundColor: '#F4F3FA',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  genderBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#9B8FE0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9A9AB0',
  },
  genderTextActive: {
    color: '#7B6FE8',
    fontWeight: '700',
  },

  // Aadhaar
  aadhaarRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'stretch',
  },
  aadhaarPrefix: {
    backgroundColor: '#E8E6F4',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aadhaarPrefixText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7A7A9D',
    textAlign: 'center',
    lineHeight: 18,
  },
  aadhaarInput: {
    flex: 1,
  },

  // Next button
  stickyBottom: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  nextBtn: {
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#5B4FD4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  nextArrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextArrow: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
