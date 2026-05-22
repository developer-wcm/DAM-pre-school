import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { COLORS } from '../../constants/admissionTheme';

const TOTAL_STEPS = 5;
const CURRENT_STEP = 5;

// ─── Step indicator ──────────────────────────────────────────────────────────
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

// ─── Review card with edit button ────────────────────────────────────────────
function ReviewCard({
  title,
  icon,
  iconBg,
  onEdit,
  children,
}: {
  title: string;
  icon: string;
  iconBg: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconCircle, { backgroundColor: iconBg }]}>
          <Text style={styles.cardIcon}>{icon}</Text>
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        <TouchableOpacity onPress={onEdit} style={styles.editBtn} activeOpacity={0.7}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>
      {children}
    </View>
  );
}

// ─── Info row ────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon?: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      {icon && <Text style={styles.infoIcon}>{icon}</Text>}
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Document item ───────────────────────────────────────────────────────────
function DocumentItem({ name, status }: { name: string; status: 'uploaded' | 'pending' }) {
  return (
    <View style={styles.docItem}>
      <Text style={styles.docIcon}>📄</Text>
      <Text style={styles.docName}>{name}</Text>
      <View style={[styles.docStatus, status === 'uploaded' && styles.docStatusUploaded]}>
        <Text style={[styles.docStatusText, status === 'uploaded' && styles.docStatusTextUploaded]}>
          {status === 'uploaded' ? '✓ Uploaded' : 'Pending'}
        </Text>
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function AdmissionStep5() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = () => {
    console.log('Submit button pressed, agreed:', agreed);
    if (!agreed) {
      Alert.alert('Confirmation Required', 'Please confirm that all information is accurate before submitting.');
      return;
    }
    
    console.log('Navigating to parental consent screen...');
    
    // Navigate to parental consent as per the correct new admission flow
    try {
      router.push('/parental-consent');
      console.log('Navigation to parental consent successful');
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Navigation Error', 'Could not navigate to parental consent screen');
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
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Admission</Text>
          <View style={styles.headerSpacer} />
        </View>

        <StepIndicator current={CURRENT_STEP} total={TOTAL_STEPS} label="Review & Submit" />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Student Info */}
          <ReviewCard
            title="Student Info"
            icon="🎓"
            iconBg={COLORS.offWhite}
            onEdit={() => router.push('/admission/step-1' as any)}
          >
            <View style={styles.studentInfoBox}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>👧</Text>
              </View>
              <View style={styles.studentDetails}>
                <Text style={styles.studentName}>Priya Kumar</Text>
                <InfoRow icon="📅" label="" value="15 June 2021 (3y 2m)" />
                <InfoRow icon="⚧" label="" value="Female" />
              </View>
            </View>
          </ReviewCard>

          {/* Parent Info */}
          <ReviewCard
            title="Parent Info"
            icon="👨‍👩‍👧"
            iconBg={COLORS.warningLight}
            onEdit={() => router.push('/admission/step-2' as any)}
          >
            <View style={styles.parentBox}>
              <View style={styles.parentItem}>
                <View style={styles.parentBadge}>
                  <Text style={styles.parentBadgeText}>FA</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.parentName}>Ramesh Kumar</Text>
                  <Text style={styles.parentRole}>Father</Text>
                  <InfoRow icon="📞" label="" value="+91 98765 43210" />
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.parentItem}>
                <View style={[styles.parentBadge, { backgroundColor: COLORS.errorLight }]}>
                  <Text style={[styles.parentBadgeText, { color: COLORS.error }]}>MO</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.parentName}>Sunita Kumar</Text>
                  <Text style={styles.parentRole}>Mother</Text>
                  <InfoRow icon="📞" label="" value="+91 98765 12345" />
                </View>
              </View>
            </View>
          </ReviewCard>

          {/* Payment Plan */}
          <ReviewCard
            title="Payment Plan"
            icon="💳"
            iconBg={COLORS.successLight}
            onEdit={() => router.push('/admission/step-3' as any)}
          >
            <View style={styles.feeBox}>
              <View style={styles.feeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.feeLabel}>Class Assigned</Text>
                  <Text style={styles.feeValue}>Junior KG</Text>
                  <Text style={styles.feeSubtext}>Section A</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.feeLabel}>Billing Cycle</Text>
                  <Text style={styles.feeValue}>Monthly</Text>
                  <Text style={styles.feeSubtext}>10 installments</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.totalFeeRow}>
                <Text style={styles.totalFeeLabel}>Total Annual Fee</Text>
                <Text style={styles.totalFeeValue}>₹49,500</Text>
              </View>
            </View>
          </ReviewCard>

          {/* Documents */}
          <ReviewCard
            title="Documents"
            icon="📋"
            iconBg={COLORS.successLight}
            onEdit={() => router.push('/admission/step-4' as any)}
          >
            <View style={styles.docList}>
              <DocumentItem name="Birth Certificate.pdf" status="uploaded" />
              <DocumentItem name="Student_Photo.jpg" status="uploaded" />
              <DocumentItem name="Medical_Certificate.pdf" status="pending" />
            </View>
          </ReviewCard>

          {/* Confirmation checkbox */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAgreed(!agreed)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxText}>
              I hereby confirm that all the information provided above is accurate and the documents are authentic. I understand that incorrect information may lead to cancellation of admission.
            </Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom buttons */}
        <View style={styles.stickyBottom}>
          <TouchableOpacity style={styles.backBtnBottom} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitBtnWrapper, !agreed && styles.submitBtnDisabled]}
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={!agreed}
          >
            <LinearGradient
              colors={agreed ? [COLORS.primary, COLORS.primaryLight] : [COLORS.buttonDisabled, COLORS.buttonDisabled]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitBtn}
            >
              <View style={styles.submitIconCircle}>
                <Text style={styles.submitIcon}>✓</Text>
              </View>
              <Text style={styles.submitBtnText}>Submit Application</Text>
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
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6, elevation: 2,
  },
  backIcon: { fontSize: 18, color: COLORS.primary, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, flex: 1 },
  headerSpacer: { width: 36 },

  // Step indicator
  stepIndicatorWrapper: { paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  stepDots: { flexDirection: 'row', alignItems: 'center' },
  stepDotGroup: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.lightGray,
    justifyContent: 'center', alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: COLORS.secondary,
    shadowColor: COLORS.secondary, shadowOffset: { width: 0, height: 4 },
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
    gap: 16,
    shadowColor: COLORS.cardShadow, 
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1, 
    shadowRadius: 16, 
    elevation: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  cardIcon: { fontSize: 18 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  editBtn: {
    backgroundColor: COLORS.primarySoft, 
    borderRadius: 12,
    paddingHorizontal: 14, 
    paddingVertical: 6,
  },
  editBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  // Student info
  studentInfoBox: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  avatarCircle: {
    width: 56, 
    height: 56, 
    borderRadius: 28,
    backgroundColor: COLORS.secondarySoft, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  avatarText: { fontSize: 28 },
  studentDetails: { flex: 1, gap: 4 },
  studentName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },

  // Info row
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoIcon: { fontSize: 14 },
  infoContent: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  infoLabel: { fontSize: 12, color: COLORS.gray },
  infoValue: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },

  // Parent info
  parentBox: { gap: 16 },
  parentItem: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  parentBadge: {
    width: 40, 
    height: 40, 
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  parentBadgeText: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  parentName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  parentRole: { fontSize: 11, color: COLORS.gray, marginBottom: 6 },

  // Divider
  divider: { height: 1, backgroundColor: COLORS.lightGray },

  // Fee box
  feeBox: { gap: 14 },
  feeRow: { flexDirection: 'row', gap: 16 },
  feeLabel: { fontSize: 12, color: COLORS.gray, marginBottom: 4 },
  feeValue: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  feeSubtext: { fontSize: 11, color: COLORS.gray },
  
  // Payment breakdown
  paymentBreakdown: { gap: 10 },
  breakdownTitle: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  installmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.offWhite,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  installmentDate: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: COLORS.textSecondary,
  },
  installmentAmount: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: COLORS.primary,
  },
  
  totalFeeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalFeeLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  totalFeeValue: { fontSize: 18, fontWeight: '800', color: COLORS.primary },

  // Documents
  docList: { gap: 10 },
  docItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  docIcon: { fontSize: 16 },
  docName: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  docStatus: {
    backgroundColor: COLORS.warningLight, 
    borderRadius: 12,
    paddingHorizontal: 10, 
    paddingVertical: 4,
  },
  docStatusUploaded: { backgroundColor: COLORS.successLight },
  docStatusText: { fontSize: 11, fontWeight: '700', color: COLORS.warningDark },
  docStatusTextUploaded: { color: COLORS.successDark },

  // Checkbox
  checkboxRow: {
    flexDirection: 'row', 
    gap: 12, 
    alignItems: 'flex-start',
    backgroundColor: COLORS.white, 
    borderRadius: 16, 
    padding: 16,
    shadowColor: COLORS.cardShadow, 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, 
    shadowRadius: 12, 
    elevation: 3,
  },
  checkbox: {
    width: 24, 
    height: 24, 
    borderRadius: 8,
    borderWidth: 2, 
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
    justifyContent: 'center', 
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: { fontSize: 14, fontWeight: '800', color: COLORS.white },
  checkboxText: {
    flex: 1, 
    fontSize: 12, 
    color: COLORS.textSecondary, 
    lineHeight: 18,
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
  submitBtnWrapper: {
    flex: 2, 
    borderRadius: 50, 
    overflow: 'hidden',
    shadowColor: COLORS.primary, 
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, 
    shadowRadius: 12, 
    elevation: 8,
  },
  submitBtnDisabled: {
    shadowOpacity: 0.1,
  },
  submitBtn: {
    borderRadius: 50, 
    paddingVertical: 16, 
    paddingHorizontal: 24,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10,
  },
  submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  submitIconCircle: {
    width: 32, 
    height: 32, 
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', 
    alignItems: 'center',
  },
  submitIcon: { fontSize: 16, color: COLORS.white, fontWeight: '700' },
});
