import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { DEFAULT_SCHOOL_ID } from '../../constants/school';
import { AppColors, AppShadows } from '../../constants/theme';
import { logActivity } from '../../lib/activity';
import { supabase } from '../../lib/supabase';

interface Student {
  id: string;
  full_name: string;
  class: string;
  roll_number: string | null;
}

interface FeeRecord {
  id: string;
  label: string;
  amount: number;
  due_date: string | null;
  installment_plan: string | null;
  installment_number: number | null;
}

const CLASS_LABELS: Record<string, string> = {
  PG: 'Play Group', PKG: 'Pre-KG', JKG: 'Junior KG', SKG: 'Senior KG',
};

const CLASS_COLORS: Record<string, { bg: string; text: string }> = {
  PG:  { bg: '#FFF0D4', text: '#D4822A' },
  PKG: { bg: '#FFE4E4', text: '#E05A5A' },
  JKG: { bg: '#E8E4F8', text: '#7B6FE8' },
  SKG: { bg: '#D4F4E8', text: '#2A9D6E' },
};

type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Cheque';

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatCurrency(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

function todayString() {
  return new Date().toISOString().split('T')[0];
}

function formatDisplayDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function RecordPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const preloadStudentId = params.studentId as string | undefined;
  const schoolId = DEFAULT_SCHOOL_ID;

  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [selectedFees, setSelectedFees] = useState<Set<string>>(new Set());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [transactionId, setTransactionId] = useState('');
  const [paymentDate, setPaymentDate] = useState(todayString());
  const [notes, setNotes] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingFees, setLoadingFees] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [studentPickerVisible, setStudentPickerVisible] = useState(false);

  // Load all students on mount
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('id, full_name, class, roll_number')
          .eq('school_id', schoolId)
          .eq('status', 'active')
          .order('full_name');
        if (error) throw error;
        setAllStudents(data ?? []);

        // Pre-select if studentId param provided
        if (preloadStudentId) {
          const found = (data ?? []).find((s) => s.id === preloadStudentId);
          if (found) selectStudent(found);
        }
      } catch (e) {
        console.error('Error loading students:', e);
      } finally {
        setLoadingStudents(false);
      }
    })();
  }, []);

  async function selectStudent(student: Student) {
    setSelectedStudent(student);
    setStudentPickerVisible(false);
    setSearchQuery('');
    setSelectedFees(new Set());
    setFeeRecords([]);
    setLoadingFees(true);
    try {
      const { data, error } = await supabase
        .from('fees')
        .select('id, label, amount, due_date, installment_plan, installment_number')
        .eq('student_id', student.id)
        .eq('school_id', schoolId)
        .eq('paid', false)
        .neq('installment_number', 0)
        .order('due_date', { ascending: true });
      if (error) throw error;
      const records: FeeRecord[] = (data ?? []).map((f: any) => ({
        id: f.id,
        label: f.label ?? 'Fee',
        amount: Number(f.amount),
        due_date: f.due_date ?? null,
        installment_plan: f.installment_plan ?? null,
        installment_number: f.installment_number ?? null,
      }));
      setFeeRecords(records);
      // Auto-select all pending fees
      setSelectedFees(new Set(records.map((r) => r.id)));
    } catch (e) {
      console.error('Error loading fees:', e);
    } finally {
      setLoadingFees(false);
    }
  }

  function toggleFee(id: string) {
    setSelectedFees((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const totalAmount = feeRecords
    .filter((f) => selectedFees.has(f.id))
    .reduce((s, f) => s + f.amount, 0);

  async function handleConfirm() {
    if (!selectedStudent) {
      Alert.alert('Required', 'Please select a student.');
      return;
    }
    if (selectedFees.size === 0) {
      Alert.alert('Required', 'Please select at least one fee to pay.');
      return;
    }

    setSubmitting(true);
    try {
      const ids = Array.from(selectedFees);
      for (const feeId of ids) {
        const { error } = await supabase
          .from('fees')
          .update({
            paid: true,
            paid_date: paymentDate,
            payment_method: paymentMethod,
            transaction_id: transactionId.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', feeId);
        if (error) throw error;
      }

      logActivity(
        DEFAULT_SCHOOL_ID,
        'payment_received',
        'Fee Payment Received',
        `${selectedStudent.full_name} paid ${formatCurrency(totalAmount)} via ${paymentMethod}`
      );
      Alert.alert(
        'Payment Recorded',
        `${formatCurrency(totalAmount)} payment recorded for ${selectedStudent.full_name}.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not record payment.');
    } finally {
      setSubmitting(false);
    }
  }

  const filteredStudents = allStudents.filter((s) =>
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.roll_number ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cc = selectedStudent ? (CLASS_COLORS[selectedStudent.class] ?? CLASS_COLORS.PG) : null;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#EDE9F6', '#F0EEF8', '#EAF0F8']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={AppColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Record Payment</Text>
          <View style={{ width: 40 }} />
        </View>

        {loadingStudents ? (
          <View style={styles.centeredBox}>
            <ActivityIndicator size="large" color={AppColors.primaryBlue} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Select Student */}
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>
                Select Student <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.pickerRow}
                onPress={() => setStudentPickerVisible(true)}
                activeOpacity={0.8}
              >
                {selectedStudent && cc ? (
                  <View style={styles.pickerSelected}>
                    <View style={[styles.miniAvatar, { backgroundColor: cc.bg }]}>
                      <Text style={[styles.miniAvatarText, { color: cc.text }]}>
                        {getInitials(selectedStudent.full_name)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickerName}>{selectedStudent.full_name}</Text>
                      <Text style={styles.pickerSub}>
                        {CLASS_LABELS[selectedStudent.class] ?? selectedStudent.class}
                        {selectedStudent.roll_number ? ` · ID: #${selectedStudent.roll_number}` : ''}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.pickerPlaceholder}>Choose a student…</Text>
                )}
                <Ionicons name="chevron-down" size={20} color={AppColors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Fee Selection */}
            {selectedStudent && (
              <View style={styles.card}>
                <Text style={styles.fieldLabel}>
                  Select Fees to Pay <Text style={styles.required}>*</Text>
                </Text>
                {loadingFees ? (
                  <ActivityIndicator size="small" color={AppColors.primaryBlue} style={{ marginVertical: 20 }} />
                ) : feeRecords.length === 0 ? (
                  <View style={styles.allPaidBox}>
                    <Ionicons name="checkmark-circle" size={40} color={AppColors.success} />
                    <Text style={styles.allPaidText}>All fees are paid for this student!</Text>
                  </View>
                ) : (
                  feeRecords.map((fee) => {
                    const isSel = selectedFees.has(fee.id);
                    const isOverdue = fee.due_date && fee.due_date < todayString();
                    return (
                      <TouchableOpacity
                        key={fee.id}
                        style={[styles.feeRow, isSel && styles.feeRowSelected]}
                        onPress={() => toggleFee(fee.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.checkbox, isSel && styles.checkboxActive]}>
                          {isSel && <Ionicons name="checkmark" size={14} color={AppColors.white} />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.feeLabel}>{fee.label}</Text>
                          {fee.due_date && (
                            <Text style={[styles.feeMeta, isOverdue && { color: AppColors.error }]}>
                              Due: {new Date(fee.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </Text>
                          )}
                        </View>
                        <Text style={[styles.feeAmount, isSel && { color: AppColors.primaryBlue }]}>
                          {formatCurrency(fee.amount)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}

            {/* Payment Method */}
            {selectedStudent && feeRecords.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.fieldLabel}>
                  Payment Method <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.methodRow}>
                  {(['Cash', 'UPI', 'Card', 'Cheque'] as PaymentMethod[]).map((m) => {
                    const icons: Record<PaymentMethod, any> = {
                      Cash: 'cash-outline',
                      UPI: 'qr-code-outline',
                      Card: 'card-outline',
                      Cheque: 'document-text-outline',
                    };
                    return (
                      <TouchableOpacity
                        key={m}
                        style={[styles.methodBtn, paymentMethod === m && styles.methodBtnActive]}
                        onPress={() => setPaymentMethod(m)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={icons[m]}
                          size={20}
                          color={paymentMethod === m ? AppColors.white : AppColors.primaryBlue}
                        />
                        <Text style={[styles.methodText, paymentMethod === m && styles.methodTextActive]}>
                          {m}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Transaction ID + Payment Date */}
                <View style={styles.twoCol}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subLabel}>Transaction ID</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Optional"
                      placeholderTextColor={AppColors.textLight}
                      value={transactionId}
                      onChangeText={setTransactionId}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subLabel}>Payment Date</Text>
                    <View style={[styles.input, styles.dateRow]}>
                      <Text style={styles.dateText}>{formatDisplayDate(paymentDate)}</Text>
                      <Ionicons name="calendar-outline" size={18} color={AppColors.textSecondary} />
                    </View>
                  </View>
                </View>

                {/* Notes */}
                <Text style={styles.subLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  placeholder="Add any additional remarks here..."
                  placeholderTextColor={AppColors.textLight}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        {/* Bottom Confirm Button — always visible */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              (!selectedStudent || selectedFees.size === 0 || submitting) && styles.confirmBtnDisabled,
            ]}
            onPress={handleConfirm}
            activeOpacity={0.85}
            disabled={!selectedStudent || selectedFees.size === 0 || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={AppColors.white} />
            ) : (
              <>
                <View style={styles.confirmIconBox}>
                  <Ionicons name="checkmark-circle" size={22} color={AppColors.white} />
                </View>
                <Text style={styles.confirmText}>
                  {selectedStudent && selectedFees.size > 0
                    ? `Confirm & Record Payment  ${formatCurrency(totalAmount)}`
                    : 'Confirm & Record Payment'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Student Picker Modal */}
      <Modal
        visible={studentPickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setStudentPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Student</Text>

            {/* Search */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={AppColors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or ID..."
                placeholderTextColor={AppColors.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={AppColors.textLight} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.studentList} showsVerticalScrollIndicator={false}>
              {filteredStudents.map((s) => {
                const c = CLASS_COLORS[s.class] ?? CLASS_COLORS.PG;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.studentRow}
                    onPress={() => selectStudent(s)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.miniAvatar, { backgroundColor: c.bg, width: 44, height: 44, borderRadius: 22 }]}>
                      <Text style={[styles.miniAvatarText, { color: c.text, fontSize: 15 }]}>
                        {getInitials(s.full_name)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.studentRowName}>{s.full_name}</Text>
                      <Text style={styles.studentRowSub}>
                        {CLASS_LABELS[s.class] ?? s.class}
                        {s.roll_number ? ` · #${s.roll_number}` : ''}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={AppColors.textLight} />
                  </TouchableOpacity>
                );
              })}
              {filteredStudents.length === 0 && (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>No students found</Text>
                </View>
              )}
              <View style={{ height: 40 }} />
            </ScrollView>

            <TouchableOpacity
              style={styles.cancelModalBtn}
              onPress={() => { setStudentPickerVisible(false); setSearchQuery(''); }}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelModalText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centeredBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEF6',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },

  scrollContent: { padding: 20, gap: 16 },

  card: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 18,
    gap: 12,
    ...AppShadows.cardShadow,
  },

  fieldLabel: { fontSize: 14, fontWeight: '700', color: AppColors.primaryBlue },
  required: { color: AppColors.primaryBlue },

  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.background,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  pickerSelected: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  pickerPlaceholder: { flex: 1, fontSize: 15, color: AppColors.textLight },
  pickerName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  pickerSub: { fontSize: 12, color: '#7A7A9D', marginTop: 1 },

  miniAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniAvatarText: { fontSize: 13, fontWeight: '700' },

  allPaidBox: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  allPaidText: { fontSize: 14, color: AppColors.success, fontWeight: '600' },

  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.background,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  feeRowSelected: { borderColor: AppColors.primaryBlue, backgroundColor: '#EEF2FF' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#C8C8E0',
    backgroundColor: AppColors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: { backgroundColor: AppColors.primaryBlue, borderColor: AppColors.primaryBlue },
  feeLabel: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  feeMeta: { fontSize: 11, color: AppColors.textSecondary, marginTop: 2 },
  feeAmount: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },

  methodRow: { flexDirection: 'row', gap: 8 },
  methodBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  methodBtnActive: {
    backgroundColor: AppColors.primaryBlue,
    borderColor: AppColors.primaryBlue,
  },
  methodText: { fontSize: 11, fontWeight: '700', color: AppColors.primaryBlue },
  methodTextActive: { color: AppColors.white },

  twoCol: { flexDirection: 'row', gap: 12 },
  subLabel: { fontSize: 12, fontWeight: '600', color: '#7A7A9D', marginBottom: 6 },

  input: {
    backgroundColor: AppColors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#E8E8F0',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  dateText: { fontSize: 13, color: '#1A1A2E', fontWeight: '500' },
  notesInput: { minHeight: 80, paddingTop: 12, textAlignVertical: 'top' },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    backgroundColor: 'rgba(237,233,246,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(180,170,220,0.25)',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 24,
    backgroundColor: AppColors.primaryBlue,
    ...AppShadows.floatingShadow,
  },
  confirmBtnDisabled: {
    backgroundColor: '#B0AACC',
  },
  confirmIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmText: { fontSize: 15, fontWeight: '700', color: AppColors.white, flex: 1, textAlign: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,30,50,0.55)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '85%',
    ...AppShadows.floatingShadow,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: AppColors.textLight,
    alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A2E', marginBottom: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: AppColors.background,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1A1A2E' },
  studentList: { maxHeight: 400 },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEF8',
  },
  studentRowName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  studentRowSub: { fontSize: 12, color: '#7A7A9D', marginTop: 2 },
  noResults: { paddingVertical: 32, alignItems: 'center' },
  noResultsText: { fontSize: 14, color: AppColors.textSecondary },
  cancelModalBtn: {
    backgroundColor: AppColors.background,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelModalText: { fontSize: 15, fontWeight: '700', color: AppColors.textSecondary },
});
