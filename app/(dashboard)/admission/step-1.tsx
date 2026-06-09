import { LinearGradient } from 'expo-linear-gradient'; 
import { useRouter } from 'expo-router';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/admissionTheme';
import { useAdmission } from '../../../context/admission';

const TOTAL_STEPS = 5;
const CURRENT_STEP = 1;

type Gender = 'Male' | 'Female';

export default function AdmissionStep1() {
  const router = useRouter();
  const { admissionData, updateAdmissionData } = useAdmission();
  const insets = useSafeAreaInsets();

  const {
    firstName,
    middleName,
    lastName,
    dob,
    gender,
    motherTongue,
    nationality,
    address,
    aadhaar,
  } = admissionData;

  const setFirstName = (val: string) => updateAdmissionData({ firstName: val });
  const setMiddleName = (val: string) => updateAdmissionData({ middleName: val });
  const setLastName = (val: string) => updateAdmissionData({ lastName: val });
  const setGender = (val: Gender | null) => updateAdmissionData({ gender: val });
  const setMotherTongue = (val: string) => updateAdmissionData({ motherTongue: val });
  const setNationality = (val: string) => updateAdmissionData({ nationality: val });
  const setAddress = (val: string) => updateAdmissionData({ address: val });
  const setAadhaar = (val: string) => updateAdmissionData({ aadhaar: val });

  const formatDob = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
    else if (digits.length > 2) formatted = digits.slice(0, 2) + '/' + digits.slice(2);
    updateAdmissionData({ dob: formatted });
  };

  return (
    <LinearGradient colors={['#F5F7FA', '#E8EAED', '#F0F2F5']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.navigate('/(dashboard)/students')} style={styles.backBtn} activeOpacity={0.7}>
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
                    {isDone ? (
                      <Text style={styles.stepDotCheckmark}>✓</Text>
                    ) : isActive ? (
                      <Text style={styles.stepDotText}>{stepNum}</Text>
                    ) : null}
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
            {/* Section header */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconCircle}>
                <Text style={styles.sectionIcon}>👶</Text>
              </View>
              <Text style={styles.sectionTitle}>Student Details</Text>
            </View>

            {/* First Name */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>First Name <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Kukkunuru"
                placeholderTextColor={COLORS.gray}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
            </View>

            {/* Middle Name */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Middle Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Middle name (optional)"
                placeholderTextColor={COLORS.gray}
                value={middleName}
                onChangeText={setMiddleName}
                autoCapitalize="words"
              />
            </View>

            {/* Last Name */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Last Name <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Sharma"
                placeholderTextColor={COLORS.gray}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>

            {/* Date of Birth */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Date of Birth <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWithIcon}>
                <Text style={styles.inputPrefixIcon}>📅</Text>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor={COLORS.gray}
                  value={dob}
                  onChangeText={formatDob}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
            </View>

            {/* Gender */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Gender <Text style={styles.required}>*</Text></Text>
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
                <Text style={styles.fieldLabel}>Mother Tongue</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Hindi"
                  placeholderTextColor={COLORS.gray}
                  value={motherTongue}
                  onChangeText={setMotherTongue}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Nationality</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Indian"
                  placeholderTextColor={COLORS.gray}
                  value={nationality}
                  onChangeText={setNationality}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Address */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="#42, Lavender Lane, Green Park..."
                placeholderTextColor={COLORS.gray}
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Aadhaar last 4 digits */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Aadhaar Last 4 Digits</Text>
              <View style={styles.aadhaarRow}>
                <View style={styles.aadhaarPrefix}>
                  <Text style={styles.aadhaarPrefixText}>XXXX-{'\n'}XXXX-</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.aadhaarInput]}
                  placeholder="1234"
                  placeholderTextColor={COLORS.gray}
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

        {/* Bottom buttons */}
        <View style={[styles.stickyBottom, { bottom: insets.bottom + 16 }]}> 
          <TouchableOpacity
            style={styles.backBtnBottom}
            onPress={() => router.navigate('/(dashboard)/students')}
            activeOpacity={0.8}
          >
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextBtnWrapper}
            activeOpacity={0.85}
            onPress={() => router.push('/(dashboard)/admission/step-2')}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
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
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  backIcon: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
  },
  headerSpacer: { width: 36 },

  // Step indicator
  stepIndicatorWrapper: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
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
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  stepDotDone: {
    backgroundColor: COLORS.success,
  },
  stepDotText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },
  stepDotCheckmark: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 4,
  },
  stepLineDone: {
    backgroundColor: COLORS.success,
  },
  stepLabelBox: {
    alignSelf: 'center',
    backgroundColor: COLORS.offWhite,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    gap: 16,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  sectionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionIcon: { fontSize: 18 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // Fields
  field: { gap: 6 },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1, gap: 6 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  required: { color: COLORS.error },

  input: {
    backgroundColor: COLORS.offWhite,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  inputFlex: { flex: 1 },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.offWhite,
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
    backgroundColor: COLORS.offWhite,
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
    backgroundColor: COLORS.white,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
  },
  genderTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Aadhaar
  aadhaarRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'stretch',
  },
  aadhaarPrefix: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aadhaarPrefixText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  aadhaarInput: {
    flex: 1,
  },

  // Bottom buttons
  stickyBottom: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 110,
    flexDirection: 'row',
    paddingVertical: 16,
    gap: 12,
    backgroundColor: 'transparent',
  },
  backBtnBottom: {
    flex: 1.2,
    borderRadius: 50,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  nextBtnWrapper: {
    flex: 1.6,
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  nextBtn: {
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  nextArrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextArrow: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '700',
  },
});
