import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS } from '../../constants/admissionTheme';

const TOTAL_STEPS = 5;
const CURRENT_STEP = 3;

// ─── Static data (would come from school config / API) ───────────────────────
const CLASS_OPTIONS = ['Nursery', 'Pre-KG', 'Junior KG', 'Senior KG', 'Grade 1', 'Grade 2'];


const AGE_CRITERIA: Record<string, string> = {
  Nursery:    'Age Criteria (by May 31)\n• Play Group – 2 yrs  • Pre KG – 3 yrs\n• Junior KG – 4 yrs  • Senior KG – 5 yrs',
  'Pre-KG':   'Age Criteria (by May 31)\n• Play Group – 2 yrs  • Pre KG – 3 yrs\n• Junior KG – 4 yrs  • Senior KG – 5 yrs',
  'Junior KG':'Age Criteria (by May 31)\n• Play Group – 2 yrs  • Pre KG – 3 yrs\n• Junior KG – 4 yrs  • Senior KG – 5 yrs',
  'Senior KG':'Age Criteria (by May 31)\n• Play Group – 2 yrs  • Pre KG – 3 yrs\n• Junior KG – 4 yrs  • Senior KG – 5 yrs',
  'Grade 1':  'Age Criteria (by May 31)\n• Grade 1 – 6 yrs  • Grade 2 – 7 yrs',
  'Grade 2':  'Age Criteria (by May 31)\n• Grade 1 – 6 yrs  • Grade 2 – 7 yrs',
};

const PAYMENT_CYCLES = ['Monthly', '4 Installments'];

const DISCOUNT_TYPES = [
  'Sibling Discount (10%)',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  '₹' + n.toLocaleString('en-IN');

function buildInstallments(
  balance: number,
  cycle: string,
): { label: string; amount: number }[] {
  const splits: Record<string, { labels: string[]; count: number }> = {
    'Monthly': { labels: ['Jun 10', 'Jul 10', 'Aug 10', 'Sep 10', 'Oct 10', 'Nov 10', 'Dec 10', 'Jan 10', 'Feb 10', 'Mar 10'], count: 10 },
    '4 Installments': { labels: ['Jun 10', 'Sep 10', 'Dec 10', 'Mar 10'], count: 4 },
  };
  const { labels, count } = splits[cycle] ?? splits['Monthly'];
  const each = Math.round(balance / count);
  return labels.map((label) => ({ label, amount: each }));
}

// ─── Step indicator (shared pattern) ─────────────────────────────────────────
function StepIndicator({ current, total, label }: { current: number; total: number; label: string }) {
  return (
    <View style={styles.stepIndicatorWrapper}>
      <View style={styles.stepDots}>
        {Array.from({ length: total }).map((_, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === current;
          const isDone = stepNum < current;
          return (
            <View key={i} style={styles.stepDotGroup}>
              <View style={[styles.stepDot, isActive && styles.stepDotActive, isDone && styles.stepDotDone]}>
                {isDone ? (
                  <Text style={styles.stepDotMark}>✓</Text>
                ) : isActive ? (
                  <Text style={styles.stepDotMark}>{stepNum}</Text>
                ) : null}
              </View>
              {i < total - 1 && (
                <View style={[styles.stepLine, isDone && styles.stepLineDone]} />
              )}
            </View>
          );
        })}
      </View>
      <View style={styles.stepLabelBox}>
        <Text style={styles.stepLabel}>Step {current} of {total}: {label}</Text>
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function AdmissionStep3() {
  const router = useRouter();

  const [admissionDate] = useState('06/01/2025');
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState('Junior KG');
  const [paymentCycle, setPaymentCycle] = useState('Monthly');
  const [autoReminders, setAutoReminders] = useState(true);
  const [discountEnabled, setDiscountEnabled] = useState(false);

  const remainingBalance = 49500; // placeholder — will come from fee config
  const installments = buildInstallments(remainingBalance, paymentCycle);

  return (
    <LinearGradient colors={['#F5F7FA', '#E8EAED', '#F0F2F5']} style={styles.container}>
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

        <StepIndicator current={CURRENT_STEP} total={TOTAL_STEPS} label="Class & Academic Details" />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Academic Info ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: COLORS.offWhite }]}>
                <Text style={styles.cardIcon}>🏫</Text>
              </View>
              <Text style={[styles.cardTitle, { flex: 1 }]}>Academic Info</Text>
            </View>

            {/* Admission Date */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                Admission Date <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity style={styles.dropdownBtn} activeOpacity={0.8}>
                <Text style={styles.dropdownBtnText}>{admissionDate}</Text>
                <Text style={styles.dropdownChevron}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Date of Birth (read-only from step 1) */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                Date of Birth <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity style={[styles.dropdownBtn, styles.dropdownDisabled]} activeOpacity={1}>
                <Text style={[styles.dropdownBtnText, { color: COLORS.gray }]}>Auto-filled from Step 1</Text>
                <Text style={styles.dropdownChevron}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Class */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                Class <Text style={styles.badge}>auto-assigned from DOB</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setClassDropdownOpen((p) => !p)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownBtnText}>{selectedClass}</Text>
                <Text style={styles.dropdownChevron}>{classDropdownOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {classDropdownOpen && (
                <View style={styles.dropdownList}>
                  {CLASS_OPTIONS.map((cls) => (
                    <TouchableOpacity
                      key={cls}
                      style={[styles.dropdownItem, cls === selectedClass && styles.dropdownItemActive]}
                      onPress={() => { setSelectedClass(cls); setClassDropdownOpen(false); }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.dropdownItemText, cls === selectedClass && styles.dropdownItemTextActive]}>
                        {cls}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Age criteria hint */}
              <View style={styles.hintBox}>
                <Text style={styles.hintText}>✓ Child completes 4 years by Mar/Apr 1 – eligible for {selectedClass}.</Text>
              </View>
              <View style={styles.ageCriteriaBox}>
                <Text style={styles.ageCriteriaText}>{AGE_CRITERIA[selectedClass]}</Text>
              </View>
            </View>
          </View>

          {/* ── Payment Plan ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: COLORS.successLight }]}>
                <Text style={styles.cardIcon}>📅</Text>
              </View>
              <Text style={[styles.cardTitle, { flex: 1 }]}>Payment Plan</Text>
            </View>

            <Text style={styles.sectionSubLabel}>Remaining Balance — Payment Cycle <Text style={styles.required}>*</Text></Text>

            {/* Cycle selector */}
            <View style={styles.cycleRow}>
              {PAYMENT_CYCLES.map((cycle) => (
                <TouchableOpacity
                  key={cycle}
                  style={[styles.cycleBtn, paymentCycle === cycle && styles.cycleBtnActive]}
                  onPress={() => setPaymentCycle(cycle)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.cycleBtnText, paymentCycle === cycle && styles.cycleBtnTextActive]}>
                    {cycle}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Cycle description */}
            <View style={styles.cycleDescBox}>
              <Text style={styles.cycleDescText}>
                Remaining {fmt(remainingBalance)}, broken into {installments.length} installments.{'\n'}
                Due dates: {installments.map((i) => i.label).join(', ')}.
              </Text>
            </View>

            {/* Auto Reminders */}
            <View style={styles.reminderBox}>
              <View style={styles.reminderLeft}>
                <Text style={styles.reminderTitle}>🔔 Auto Reminders Active</Text>
                <Text style={styles.reminderDesc}>
                  Parents receive SMS · App Notification · Email when payment is overdue.
                </Text>
                {autoReminders && (
                  <View style={styles.reminderWarning}>
                    <Text style={styles.reminderWarningText}>
                      ⚠️ Your default fee amount is overdue. Please complete payment to avoid late charges.
                    </Text>
                  </View>
                )}
              </View>
              <Switch
                value={autoReminders}
                onValueChange={setAutoReminders}
                trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>
          </View>

          {/* ── Apply Discount ── */}
          <View style={styles.card}>
            <View style={styles.discountHeader}>
              <View>
                <Text style={styles.cardTitle}>Apply Discount</Text>
                <Text style={styles.discountAdmin}>Admin access only · ADMIN</Text>
              </View>
              <Switch
                value={discountEnabled}
                onValueChange={setDiscountEnabled}
                trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>

            <View style={styles.discountTypeList}>
              <Text style={styles.sectionSubLabel}>Available discount types:</Text>
              {DISCOUNT_TYPES.map((d, i) => (
                <Text key={i} style={styles.discountTypeItem}>• {d}</Text>
              ))}
              <Text style={styles.discountNote}>
                Fee total recalculates instantly when discount is applied.
              </Text>
            </View>
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
            onPress={() => router.push('/admission/step-4' as any)}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextBtn}
            >
              <Text style={styles.nextBtnText}>Next Step →</Text>
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
  backIcon: { fontSize: 18, color: COLORS.primary, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, flex: 1 },
  headerSpacer: { width: 36 },

  // Step indicator
  stepIndicatorWrapper: { paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  stepDots: { flexDirection: 'row', alignItems: 'center' },
  stepDotGroup: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center', alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  stepDotDone: { backgroundColor: COLORS.success },
  stepDotMark: { fontSize: 13, fontWeight: '800', color: COLORS.white },
  stepLine: { flex: 1, height: 2, backgroundColor: COLORS.lightGray, marginHorizontal: 4 },
  stepLineDone: { backgroundColor: COLORS.success },
  stepLabelBox: {
    alignSelf: 'center', backgroundColor: COLORS.offWhite,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6,
  },
  stepLabel: { fontSize: 12, fontWeight: '600', color: COLORS.primary },

  // Scroll
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20, gap: 16 },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    gap: 14,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIconCircle: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  cardIcon: { fontSize: 18 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },

  // Fields
  field: { gap: 6 },
  fieldLabel: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: COLORS.textSecondary,
  },
  required: { color: COLORS.error },
  badge: {
    fontSize: 10, 
    fontWeight: '600', 
    color: COLORS.primary,
    backgroundColor: COLORS.primarySoft, 
    borderRadius: 6,
    paddingHorizontal: 6, 
    paddingVertical: 2,
  },

  // Dropdown
  dropdownBtn: {
    backgroundColor: COLORS.offWhite,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownDisabled: { opacity: 0.6 },
  dropdownBtnText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
  dropdownChevron: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },
  dropdownList: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    overflow: 'hidden',
    marginTop: 4,
  },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 12 },
  dropdownItemActive: { backgroundColor: COLORS.primarySoft },
  dropdownItemText: { fontSize: 14, color: COLORS.textSecondary },
  dropdownItemTextActive: { color: COLORS.primary, fontWeight: '700' },

  // Hint / age criteria
  hintBox: {
    backgroundColor: COLORS.successLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  hintText: { fontSize: 12, color: COLORS.successDark, fontWeight: '500' },
  ageCriteriaBox: {
    backgroundColor: COLORS.offWhite,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  ageCriteriaText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 20 },

  // Payment plan
  sectionSubLabel: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: COLORS.textSecondary,
  },
  cycleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cycleBtn: {
    paddingHorizontal: 16, 
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: COLORS.offWhite,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cycleBtnActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  cycleBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  cycleBtnTextActive: { color: COLORS.primary, fontWeight: '700' },
  cycleDescBox: {
    backgroundColor: COLORS.offWhite,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cycleDescText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  installmentList: { gap: 8 },
  installmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.offWhite,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  installmentLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  installmentAmount: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },

  // Reminders
  reminderBox: {
    backgroundColor: COLORS.warningLight,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.warning + '40',
  },
  reminderLeft: { flex: 1, gap: 4 },
  reminderTitle: { fontSize: 13, fontWeight: '700', color: COLORS.warningDark },
  reminderDesc: { fontSize: 12, color: COLORS.warningDark, lineHeight: 18 },
  reminderWarning: {
    backgroundColor: COLORS.errorLight,
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.error + '40',
  },
  reminderWarningText: { fontSize: 11, color: COLORS.errorDark, lineHeight: 16 },

  // Discount
  discountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  discountAdmin: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  discountTypeList: { gap: 6 },
  discountTypeItem: { fontSize: 13, color: COLORS.textSecondary },
  discountNote: {
    fontSize: 11, 
    color: COLORS.gray,
    fontStyle: 'italic', 
    marginTop: 4,
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
  backBtnText: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
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
  nextBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  nextArrowCircle: {
    width: 32, 
    height: 32, 
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', 
    alignItems: 'center',
  },
  nextArrow: { fontSize: 16, color: COLORS.white, fontWeight: '700' },
});
