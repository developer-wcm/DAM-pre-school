import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEFAULT_SCHOOL_ID } from '../../constants/school';
import { AppColors, AppFonts, AppShadows, AppSizes } from '../../constants/theme';
import { useAuth } from '../../context/auth';
import { supabase } from '../../lib/supabase';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface RecordCounts {
  students: number;
  attendance: number;
  fees: number;
  export_logs: number;
  leave_requests: number;
  appointments: number;
}

interface DeletionOption {
  id: keyof RecordCounts;
  label: string;
  description: string;
  icon: any;
  iconBg: string;
  iconColor: string;
  danger: 'low' | 'medium' | 'high';
  table: string;
  filter?: string;
}

const DELETION_OPTIONS: DeletionOption[] = [
  {
    id: 'attendance',
    label: 'Old Attendance Records',
    description: 'Delete attendance logs older than the selected period.',
    icon: 'checkmark-circle-outline',
    iconBg: '#FFF7ED',
    iconColor: '#D97706',
    danger: 'low',
    table: 'attendance',
  },
  {
    id: 'fees',
    label: 'Paid Fee Records',
    description: 'Remove fully paid fee installments to clean up records.',
    icon: 'cash-outline',
    iconBg: '#F0FDF4',
    iconColor: '#16A34A',
    danger: 'low',
    table: 'fee_installments',
  },
  {
    id: 'leave_requests',
    label: 'Resolved Leave Requests',
    description: 'Delete approved or rejected leave requests.',
    icon: 'calendar-clear-outline',
    iconBg: '#EFF6FF',
    iconColor: '#2563EB',
    danger: 'low',
    table: 'leave_requests',
  },
  {
    id: 'appointments',
    label: 'Completed Appointments',
    description: 'Clear completed or cancelled parent-teacher meetings.',
    icon: 'people-outline',
    iconBg: '#F5F3FF',
    iconColor: '#7C3AED',
    danger: 'low',
    table: 'appointments',
  },
  {
    id: 'export_logs',
    label: 'Export Logs',
    description: 'Clear the history of data exports.',
    icon: 'download-outline',
    iconBg: '#F0FDF4',
    iconColor: '#0891B2',
    danger: 'low',
    table: 'export_logs',
  },
  {
    id: 'students',
    label: 'Graduated / Inactive Students',
    description: 'Permanently delete student records. This cannot be undone.',
    icon: 'person-remove-outline',
    iconBg: '#FEF2F2',
    iconColor: '#DC2626',
    danger: 'high',
    table: 'students',
  },
];

const PERIODS = [
  { label: '3 months ago',  value: 3 },
  { label: '6 months ago',  value: 6 },
  { label: '1 year ago',    value: 12 },
  { label: '2 years ago',   value: 24 },
];

const DANGER_CONFIG = {
  low:    { bg: '#F0FDF4', text: '#16A34A', label: 'Safe' },
  medium: { bg: '#FFF7ED', text: '#D97706', label: 'Moderate' },
  high:   { bg: '#FEF2F2', text: '#DC2626', label: 'Irreversible' },
};

// ─── Confirm Modal ─────────────────────────────────────────────────────────────

function ConfirmModal({
  visible,
  option,
  count,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  option: DeletionOption | null;
  count: number;
  onConfirm: (pin: string) => void;
  onCancel: () => void;
}) {
  const [pin, setPin] = useState('');

  useEffect(() => { if (visible) setPin(''); }, [visible]);

  if (!option) return null;
  const isHigh = option.danger === 'high';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={mStyles.overlay}>
        <View style={mStyles.card}>
          {/* Icon */}
          <View style={[mStyles.iconWrap, { backgroundColor: option.iconBg }]}>
            <Ionicons name={option.icon} size={30} color={option.iconColor} />
          </View>

          <Text style={mStyles.title}>Confirm Deletion</Text>
          <Text style={mStyles.body}>
            You are about to permanently delete{' '}
            <Text style={mStyles.bold}>{count} record{count !== 1 ? 's' : ''}</Text> from{' '}
            <Text style={mStyles.bold}>{option.label}</Text>.{'\n'}This action cannot be undone.
          </Text>

          {isHigh && (
            <View style={mStyles.pinWrap}>
              <Text style={mStyles.pinLabel}>Type <Text style={mStyles.pinCode}>DELETE</Text> to confirm</Text>
              <TextInput
                style={mStyles.pinInput}
                value={pin}
                onChangeText={setPin}
                placeholder="Type DELETE"
                placeholderTextColor={AppColors.textLight}
                autoCapitalize="characters"
              />
            </View>
          )}

          <View style={mStyles.btnRow}>
            <TouchableOpacity style={mStyles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
              <Text style={mStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                mStyles.deleteBtn,
                isHigh && pin !== 'DELETE' && mStyles.deleteBtnDisabled,
              ]}
              onPress={() => onConfirm(pin)}
              disabled={isHigh && pin !== 'DELETE'}
              activeOpacity={0.85}
            >
              <Ionicons name="trash-outline" size={16} color="#FFF" />
              <Text style={mStyles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function DataDeletionScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const schoolId = profile?.school_id ?? DEFAULT_SCHOOL_ID;

  const [counts, setCounts] = useState<RecordCounts>({
    students: 0, attendance: 0, fees: 0,
    export_logs: 0, leave_requests: 0, appointments: 0,
  });
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(6);
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<DeletionOption | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletedItems, setDeletedItems] = useState<string[]>([]);

  useEffect(() => { fetchCounts(); }, [schoolId, selectedPeriod]);

  const fetchCounts = useCallback(async () => {
    setLoadingCounts(true);
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - selectedPeriod);
    const cutoffISO = cutoff.toISOString().split('T')[0];

    try {
      const [attRes, feeRes, leaveRes, apptRes, exportRes, studRes] = await Promise.all([
        supabase.from('attendance').select('id', { count: 'exact', head: true })
          .eq('school_id', schoolId).lt('date', cutoffISO),
        supabase.from('fee_installments').select('id', { count: 'exact', head: true })
          .eq('school_id', schoolId).eq('paid', true),
        supabase.from('leave_requests').select('id', { count: 'exact', head: true })
          .eq('school_id', schoolId).in('status', ['approved', 'rejected']),
        supabase.from('appointments').select('id', { count: 'exact', head: true })
          .eq('school_id', schoolId).in('status', ['completed', 'cancelled']),
        supabase.from('export_logs').select('id', { count: 'exact', head: true })
          .eq('school_id', schoolId),
        supabase.from('students').select('id', { count: 'exact', head: true })
          .eq('school_id', schoolId),
      ]);

      setCounts({
        attendance:     attRes.count ?? 0,
        fees:           feeRes.count ?? 0,
        leave_requests: leaveRes.count ?? 0,
        appointments:   apptRes.count ?? 0,
        export_logs:    exportRes.count ?? 0,
        students:       studRes.count ?? 0,
      });
    } catch {
      // silently ignore missing tables
    } finally {
      setLoadingCounts(false);
    }
  }, [schoolId, selectedPeriod]);

  function handleDeletePress(option: DeletionOption) {
    if (counts[option.id] === 0) {
      Alert.alert('Nothing to Delete', `There are no ${option.label.toLowerCase()} to delete.`);
      return;
    }
    setConfirmTarget(option);
  }

  async function handleConfirmDelete(pin: string) {
    if (!confirmTarget) return;
    if (confirmTarget.danger === 'high' && pin !== 'DELETE') return;

    setConfirmTarget(null);
    setDeleting(true);

    try {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - selectedPeriod);
      const cutoffISO = cutoff.toISOString().split('T')[0];

      if (confirmTarget.id === 'attendance') {
        await supabase.from('attendance').delete()
          .eq('school_id', schoolId).lt('date', cutoffISO);
      } else if (confirmTarget.id === 'fees') {
        await supabase.from('fee_installments').delete()
          .eq('school_id', schoolId).eq('paid', true);
      } else if (confirmTarget.id === 'leave_requests') {
        await supabase.from('leave_requests').delete()
          .eq('school_id', schoolId).in('status', ['approved', 'rejected']);
      } else if (confirmTarget.id === 'appointments') {
        await supabase.from('appointments').delete()
          .eq('school_id', schoolId).in('status', ['completed', 'cancelled']);
      } else if (confirmTarget.id === 'export_logs') {
        await supabase.from('export_logs').delete()
          .eq('school_id', schoolId);
      } else if (confirmTarget.id === 'students') {
        Alert.alert(
          'Student Deletion',
          'For data safety, bulk student deletion must be done from the Students screen individually.',
        );
        setDeleting(false);
        return;
      }

      setDeletedItems((prev) => [...prev, confirmTarget.label]);
      fetchCounts();
      Alert.alert('Deleted', `${confirmTarget.label} have been cleared successfully.`);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Deletion failed. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  const periodLabel = PERIODS.find((p) => p.value === selectedPeriod)?.label ?? '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={['#7F1D1D', '#991B1B']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Data Deletion</Text>
          <Text style={styles.headerSub}>Cleanup & Archive</Text>
        </View>
        <View style={styles.warningBadge}>
          <Ionicons name="warning" size={14} color="#FCA5A5" />
          <Text style={styles.warningBadgeText}>Irreversible</Text>
        </View>
      </LinearGradient>

      {/* Warning Banner */}
      <View style={styles.alertBanner}>
        <Ionicons name="shield-checkmark-outline" size={18} color="#92400E" />
        <Text style={styles.alertText}>
          Deleted records cannot be recovered. Export a backup before deleting.
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector */}
        <Text style={styles.sectionLabel}>Cleanup Period</Text>
        <TouchableOpacity
          style={styles.periodPicker}
          onPress={() => setShowPeriodPicker((v) => !v)}
          activeOpacity={0.8}
        >
          <Ionicons name="time-outline" size={18} color={AppColors.textSecondary} />
          <Text style={styles.periodText}>Records older than: <Text style={styles.periodBold}>{periodLabel}</Text></Text>
          <Ionicons name={showPeriodPicker ? 'chevron-up' : 'chevron-down'} size={18} color={AppColors.textTertiary} />
        </TouchableOpacity>
        {showPeriodPicker && (
          <View style={styles.periodDropdown}>
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[styles.periodOption, p.value === selectedPeriod && styles.periodOptionActive]}
                onPress={() => { setSelectedPeriod(p.value); setShowPeriodPicker(false); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.periodOptionText, p.value === selectedPeriod && styles.periodOptionTextActive]}>
                  {p.label}
                </Text>
                {p.value === selectedPeriod && <Ionicons name="checkmark" size={16} color="#DC2626" />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Deletion Options */}
        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Select Data to Delete</Text>

        {loadingCounts ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#DC2626" />
            <Text style={styles.loadingText}>Counting records…</Text>
          </View>
        ) : (
          <View style={styles.optionsList}>
            {DELETION_OPTIONS.map((opt, i) => {
              const count = counts[opt.id];
              const danger = DANGER_CONFIG[opt.danger];


              return (
                <View
                  key={opt.id}
                  style={[
                    styles.optionCard,
                    i === DELETION_OPTIONS.length - 1 && styles.optionCardLast,
                  ]}
                >
                  <View style={styles.optionHeader}>
                    <View style={[styles.optionIcon, { backgroundColor: opt.iconBg }]}>
                      <Ionicons name={opt.icon} size={20} color={opt.iconColor} />
                    </View>
                    <View style={styles.optionInfo}>
                      <View style={styles.optionTitleRow}>
                        <Text style={styles.optionLabel}>{opt.label}</Text>
                        <View style={[styles.dangerBadge, { backgroundColor: danger.bg }]}>
                          <Text style={[styles.dangerText, { color: danger.text }]}>{danger.label}</Text>
                        </View>
                      </View>
                      <Text style={styles.optionDesc}>{opt.description}</Text>
                    </View>
                  </View>

                  <View style={styles.optionFooter}>
                    <View style={styles.countChip}>
                      <Ionicons name="layers-outline" size={13} color={AppColors.textTertiary} />
                      <Text style={styles.countText}>
                        {loadingCounts ? '…' : `${count} record${count !== 1 ? 's' : ''}`}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.deleteBtn,
                        count === 0 && styles.deleteBtnEmpty,
                        opt.danger === 'high' && styles.deleteBtnHigh,
                      ]}
                      onPress={() => handleDeletePress(opt)}
                      disabled={deleting}
                      activeOpacity={0.85}
                    >
                      {deleting && confirmTarget?.id === opt.id ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <>
                          <Ionicons
                            name="trash-outline"
                            size={14}
                            color={count === 0 ? AppColors.textLight : '#FFF'}
                          />
                          <Text style={[styles.deleteBtnText, count === 0 && styles.deleteBtnTextEmpty]}>
                            {opt.danger === 'high' ? 'Delete…' : 'Clear'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  {deletedItems.includes(opt.label) && (
                    <View style={styles.clearedBanner}>
                      <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                      <Text style={styles.clearedText}>Cleared successfully</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Info box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color={AppColors.primaryBlue} />
          <Text style={styles.infoText}>
            Student records can only be deleted individually from the Students screen to prevent accidental bulk deletion.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Confirm Modal */}
      <ConfirmModal
        visible={!!confirmTarget}
        option={confirmTarget}
        count={confirmTarget ? counts[confirmTarget.id] : 0}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerText: { flex: 1 },
  headerTitle: {
    fontSize: AppFonts.sizeLarge,
    fontWeight: AppFonts.bold,
    color: '#FFF',
  },
  headerSub: {
    fontSize: AppFonts.sizeSmall,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 1,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: AppSizes.radiusPill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(252,165,165,0.4)',
  },
  warningBadgeText: {
    fontSize: 11,
    color: '#FCA5A5',
    fontWeight: AppFonts.semiBold,
  },

  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  alertText: {
    flex: 1,
    fontSize: AppFonts.sizeSmall,
    color: '#92400E',
    lineHeight: 18,
  },

  scroll: { flex: 1 },
  content: { padding: 16 },

  sectionLabel: {
    fontSize: AppFonts.sizeMedium,
    fontWeight: AppFonts.semiBold,
    color: AppColors.textPrimary,
    marginBottom: 8,
  },

  // Period picker
  periodPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF',
    borderRadius: AppSizes.radiusMedium,
    borderWidth: 1,
    borderColor: AppColors.blueLight,
    paddingHorizontal: 14,
    paddingVertical: 13,
    ...AppShadows.cardShadow,
  },
  periodText: {
    flex: 1,
    fontSize: AppFonts.sizeMedium,
    color: AppColors.textSecondary,
  },
  periodBold: {
    fontWeight: AppFonts.semiBold,
    color: AppColors.textPrimary,
  },
  periodDropdown: {
    backgroundColor: '#FFF',
    borderRadius: AppSizes.radiusMedium,
    borderWidth: 1,
    borderColor: AppColors.blueLight,
    marginTop: 4,
    overflow: 'hidden',
    ...AppShadows.cardShadow,
  },
  periodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  periodOptionActive: { backgroundColor: '#FEF2F2' },
  periodOptionText: {
    fontSize: AppFonts.sizeMedium,
    color: AppColors.textSecondary,
  },
  periodOptionTextActive: {
    color: '#DC2626',
    fontWeight: AppFonts.semiBold,
  },

  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 24,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: AppFonts.sizeMedium,
    color: AppColors.textTertiary,
  },

  // Options
  optionsList: {
    backgroundColor: '#FFF',
    borderRadius: AppSizes.radiusLarge,
    overflow: 'hidden',
    ...AppShadows.cardShadow,
  },
  optionCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.blueLight,
    gap: 12,
  },
  optionCardSelected: { backgroundColor: '#FFF5F5' },
  optionCardLast: { borderBottomWidth: 0 },

  optionHeader: { flexDirection: 'row', gap: 12 },
  optionIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  optionInfo: { flex: 1 },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  optionLabel: {
    fontSize: AppFonts.sizeMedium,
    fontWeight: AppFonts.semiBold,
    color: AppColors.textPrimary,
    flex: 1,
  },
  dangerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: AppSizes.radiusPill,
  },
  dangerText: {
    fontSize: 10,
    fontWeight: AppFonts.bold,
  },
  optionDesc: {
    fontSize: AppFonts.sizeSmall,
    color: AppColors.textTertiary,
    marginTop: 3,
    lineHeight: 18,
  },

  optionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: AppColors.bluePale,
    borderRadius: AppSizes.radiusPill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  countText: {
    fontSize: AppFonts.sizeSmall,
    color: AppColors.textSecondary,
    fontWeight: AppFonts.medium,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    borderRadius: AppSizes.radiusPill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  deleteBtnEmpty: {
    backgroundColor: AppColors.blueLight,
  },
  deleteBtnHigh: {
    backgroundColor: '#7F1D1D',
  },
  deleteBtnText: {
    fontSize: AppFonts.sizeSmall,
    fontWeight: AppFonts.bold,
    color: '#FFF',
  },
  deleteBtnTextEmpty: {
    color: AppColors.textLight,
  },

  clearedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  clearedText: {
    fontSize: AppFonts.sizeSmall,
    color: '#16A34A',
    fontWeight: AppFonts.medium,
  },

  // Info box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: AppColors.bluePale,
    borderRadius: AppSizes.radiusMedium,
    borderWidth: 1,
    borderColor: AppColors.blueLight,
    padding: 12,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: AppFonts.sizeSmall,
    color: AppColors.textSecondary,
    lineHeight: 18,
  },
});

const mStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    gap: 12,
    ...AppShadows.elevatedShadow,
  },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: AppFonts.sizeXLarge,
    fontWeight: AppFonts.bold,
    color: AppColors.textPrimary,
    textAlign: 'center',
  },
  body: {
    fontSize: AppFonts.sizeMedium,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  bold: { fontWeight: AppFonts.bold, color: AppColors.textPrimary },

  pinWrap: { width: '100%', gap: 6, marginTop: 4 },
  pinLabel: {
    fontSize: AppFonts.sizeSmall,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
  pinCode: {
    fontWeight: AppFonts.bold,
    color: '#DC2626',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  pinInput: {
    backgroundColor: '#FEF2F2',
    borderRadius: AppSizes.radiusMedium,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: AppFonts.sizeMedium,
    color: '#DC2626',
    fontWeight: AppFonts.bold,
    textAlign: 'center',
    letterSpacing: 3,
  },

  btnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: AppColors.bluePale,
    borderRadius: AppSizes.radiusPill,
    alignItems: 'center',
    paddingVertical: 13,
  },
  cancelText: {
    fontSize: AppFonts.sizeMedium,
    fontWeight: AppFonts.semiBold,
    color: AppColors.textSecondary,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    borderRadius: AppSizes.radiusPill,
    paddingVertical: 13,
  },
  deleteBtnDisabled: { opacity: 0.4 },
  deleteText: {
    fontSize: AppFonts.sizeMedium,
    fontWeight: AppFonts.bold,
    color: '#FFF',
  },
});
