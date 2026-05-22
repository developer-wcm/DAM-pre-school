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
import { COLORS } from '../../constants/admissionTheme';

const TOTAL_STEPS = 5;
const CURRENT_STEP = 2;

interface ParentFields {
  fullName: string;
  phone: string;
  occupation: string;
  workLocation: string;
  email: string;
}

const emptyParent = (): ParentFields => ({
  fullName: '',
  phone: '',
  occupation: '',
  workLocation: '',
  email: '',
});

function ParentSection({
  title,
  icon,
  iconBg,
  values,
  onChange,
  namePlaceholder,
}: {
  title: string;
  icon: string;
  iconBg: string;
  values: ParentFields;
  onChange: (field: keyof ParentFields, value: string) => void;
  namePlaceholder: string;
}) {
  return (
    <View style={styles.sectionCard}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconCircle, { backgroundColor: iconBg }]}>
          <Text style={styles.sectionIcon}>{icon}</Text>
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      {/* Full Name */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>
          Full Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder={namePlaceholder}
          placeholderTextColor={COLORS.gray}
          value={values.fullName}
          onChangeText={(v) => onChange('fullName', v)}
          autoCapitalize="words"
        />
      </View>

      {/* Phone Number */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>
          Phone Number <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="(555) 000-0000"
          placeholderTextColor={COLORS.gray}
          value={values.phone}
          onChangeText={(v) => onChange('phone', v)}
          keyboardType="phone-pad"
        />
      </View>

      {/* Occupation */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Occupation</Text>
        <TextInput
          style={styles.input}
          placeholder="Current job title"
          placeholderTextColor={COLORS.gray}
          value={values.occupation}
          onChangeText={(v) => onChange('occupation', v)}
          autoCapitalize="words"
        />
      </View>

      {/* Work Location */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Work Location</Text>
        <TextInput
          style={styles.input}
          placeholder="Office / workplace address"
          placeholderTextColor={COLORS.gray}
          value={values.workLocation}
          onChangeText={(v) => onChange('workLocation', v)}
        />
      </View>

      {/* Email */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>
          Email <Text style={styles.optional}>(Optional)</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="example@email.com"
          placeholderTextColor={COLORS.gray}
          value={values.email}
          onChangeText={(v) => onChange('email', v)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
    </View>
  );
}

export default function AdmissionStep2() {
  const router = useRouter();

  const [father, setFather] = useState<ParentFields>(emptyParent());
  const [mother, setMother] = useState<ParentFields>(emptyParent());
  const [guardian, setGuardian] = useState<ParentFields>(emptyParent());
  const [guardianExpanded, setGuardianExpanded] = useState(false);

  const updateFather = (field: keyof ParentFields, value: string) =>
    setFather((prev) => ({ ...prev, [field]: value }));

  const updateMother = (field: keyof ParentFields, value: string) =>
    setMother((prev) => ({ ...prev, [field]: value }));

  const updateGuardian = (field: keyof ParentFields, value: string) =>
    setGuardian((prev) => ({ ...prev, [field]: value }));

  return (
    <LinearGradient colors={['#F5F7FA', '#E8EAED', '#F0F2F5']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
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
            <Text style={styles.stepLabel}>
              Step {CURRENT_STEP} of {TOTAL_STEPS}: Parent Information
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Father's Details */}
          <ParentSection
            title="Father's Details"
            icon="👨"
            iconBg={COLORS.offWhite}
            values={father}
            onChange={updateFather}
            namePlaceholder="Enter father's full name"
          />

          {/* Mother's Details */}
          <ParentSection
            title="Mother's Details"
            icon="👩"
            iconBg={COLORS.warningLight}
            values={mother}
            onChange={updateMother}
            namePlaceholder="Enter mother's full name"
          />

          {/* Guardian Details (collapsible) */}
          <View style={styles.guardianCard}>
            <TouchableOpacity
              style={styles.guardianHeader}
              onPress={() => setGuardianExpanded((prev) => !prev)}
              activeOpacity={0.8}
            >
              <View style={styles.guardianHeaderLeft}>
                <View style={styles.guardianIconCircle}>
                  <Text style={styles.guardianIcon}>ℹ️</Text>
                </View>
                <View>
                  <Text style={styles.guardianTitle}>Add Guardian Details</Text>
                  <Text style={styles.guardianSubtitle}>If parents not applicable</Text>
                </View>
              </View>
              <Text style={styles.guardianChevron}>
                {guardianExpanded ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {guardianExpanded && (
              <View style={styles.guardianBody}>
                <ParentSection
                  title="Guardian's Details"
                  icon="🧑"
                  iconBg={COLORS.successLight}
                  values={guardian}
                  onChange={updateGuardian}
                  namePlaceholder="Enter guardian's full name"
                />
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom buttons */}
        <View style={styles.stickyBottom}>
          <TouchableOpacity
            style={styles.backBtnBottom}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextBtnWrapper}
            activeOpacity={0.85}
            onPress={() => router.push('/admission/step-3' as any)}
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
    paddingBottom: 20,
    gap: 16,
  },

  // Section card (Father / Mother)
  sectionCard: {
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
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  required: { color: COLORS.error },
  optional: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.gray,
  },
  input: {
    backgroundColor: COLORS.offWhite,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: COLORS.textPrimary,
  },

  // Guardian collapsible
  guardianCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  guardianHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  guardianHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guardianIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guardianIcon: { fontSize: 18 },
  guardianTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  guardianSubtitle: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 2,
  },
  guardianChevron: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },
  guardianBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  // Bottom buttons
  stickyBottom: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: 'transparent',
  },
  backBtnBottom: {
    flex: 1,
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
    flex: 2,
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
