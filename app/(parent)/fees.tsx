import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/admissionTheme';
import { useChild } from '../../context/child';
import { supabase } from '../../lib/supabase';

interface FeeRecord {
  id: string;
  label: string | null;
  amount: number;
  paid: boolean;
  due_date: string | null;
  installment_plan: string | null;
  installment_number: number | null;
  paid_at: string | null;
}

function getStatusColor(paid: boolean, due_date: string | null) {
  if (paid) return COLORS.success;
  if (due_date && due_date < new Date().toISOString().split('T')[0]) return COLORS.error;
  return '#FFA500';
}

function getStatusBg(paid: boolean, due_date: string | null) {
  if (paid) return '#E8F8F0';
  if (due_date && due_date < new Date().toISOString().split('T')[0]) return '#FFE8E8';
  return '#FFF4E6';
}

function getStatusLabel(paid: boolean, due_date: string | null) {
  if (paid) return 'Paid';
  if (due_date && due_date < new Date().toISOString().split('T')[0]) return 'Overdue';
  return 'Pending';
}

function getStatusIcon(paid: boolean, due_date: string | null) {
  if (paid) return '✓';
  if (due_date && due_date < new Date().toISOString().split('T')[0]) return '!';
  return '⏱';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function ParentFeesScreen() {
  const { activeChild, children, loading: childLoading } = useChild();
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFees = useCallback(async () => {
    if (!activeChild?.id) { setFees([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from('fees')
      .select('id, label, amount, paid, due_date, installment_plan, installment_number, paid_at')
      .eq('student_id', activeChild.id)
      .order('due_date', { ascending: true });
    setFees((data ?? []) as FeeRecord[]);
    setLoading(false);
    setRefreshing(false);
  }, [activeChild?.id]);

  useEffect(() => { fetchFees(); }, [fetchFees]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFees();
  }, [fetchFees]);

  const totalFee = fees.reduce((s, f) => s + Number(f.amount), 0);
  const paidAmount = fees.filter((f) => f.paid).reduce((s, f) => s + Number(f.amount), 0);
  const outstandingAmount = totalFee - paidAmount;
  const paymentPercentage = totalFee > 0 ? (paidAmount / totalFee) * 100 : 0;

  if (childLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (children.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="person-outline" size={48} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>No child linked</Text>
          <Text style={styles.emptySub}>Ask your school admin to link your child to your account.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fee Summary</Text>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>
            {activeChild?.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Child + class badge */}
        <View style={styles.yearBadge}>
          <Text style={styles.yearText}>{activeChild?.full_name} • </Text>
          <Text style={styles.classText}>{activeChild?.class?.toUpperCase() ?? '—'}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 40 }} />
        ) : fees.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="card-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>No fee records yet</Text>
            <Text style={styles.emptySub}>Fee details will appear here once added by the school.</Text>
          </View>
        ) : (
          <>
            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Fee</Text>
              <Text style={styles.totalAmount}>₹{totalFee.toLocaleString('en-IN')}</Text>

              <View style={styles.amountRow}>
                <View style={styles.amountBox}>
                  <View style={styles.amountHeader}>
                    <View style={styles.greenDot} />
                    <Text style={styles.amountLabel}>Paid</Text>
                  </View>
                  <Text style={styles.paidAmount}>₹{paidAmount.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.amountBox}>
                  <View style={styles.amountHeader}>
                    <View style={styles.redDot} />
                    <Text style={styles.amountLabel}>Outstanding</Text>
                  </View>
                  <Text style={styles.outstandingAmount}>₹{outstandingAmount.toLocaleString('en-IN')}</Text>
                </View>
              </View>

              <View style={styles.progressSection}>
                <Text style={styles.progressLabel}>{Math.round(paymentPercentage)}% Paid</Text>
                <Text style={styles.goalLabel}>Goal: 100%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${Math.min(paymentPercentage, 100)}%` }]} />
              </View>
            </View>

            {/* Payment History */}
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Payment History</Text>
            </View>

            <View style={styles.paymentList}>
              {fees.map((fee, index) => {
                const color = getStatusColor(fee.paid, fee.due_date);
                const bg = getStatusBg(fee.paid, fee.due_date);
                const label = getStatusLabel(fee.paid, fee.due_date);
                const icon = getStatusIcon(fee.paid, fee.due_date);
                const title = fee.label ?? (fee.installment_plan
                  ? `${fee.installment_plan} — Installment ${fee.installment_number}`
                  : 'Fee');
                return (
                  <View key={fee.id}>
                    <View style={styles.paymentRow}>
                      <View style={[styles.statusIcon, { backgroundColor: bg }]}>
                        <Text style={[styles.statusIconText, { color }]}>{icon}</Text>
                      </View>
                      <View style={styles.paymentInfo}>
                        <Text style={styles.paymentMonth}>{title}</Text>
                        {fee.paid && fee.paid_at && (
                          <Text style={styles.paymentDetail}>Paid on {formatDate(fee.paid_at)}</Text>
                        )}
                        {!fee.paid && fee.due_date && (
                          <Text style={styles.paymentDetail}>Due: {formatDate(fee.due_date)}</Text>
                        )}
                      </View>
                      <View style={styles.paymentRight}>
                        <Text style={styles.paymentAmount}>₹{Number(fee.amount).toLocaleString('en-IN')}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: bg }]}>
                          <Text style={[styles.statusText, { color }]}>{label}</Text>
                        </View>
                      </View>
                    </View>
                    {index < fees.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                );
              })}
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: COLORS.background,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8E4F8',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitials: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, gap: 20 },

  yearBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.white, paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 20, alignSelf: 'center',
  },
  yearText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  classText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  emptyCard: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 40,
    alignItems: 'center', gap: 10,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  emptySub: { fontSize: 13, color: COLORS.textLight, textAlign: 'center', lineHeight: 20 },

  summaryCard: {
    backgroundColor: COLORS.white, borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 4,
  },
  summaryLabel: { fontSize: 14, fontWeight: '500', color: COLORS.textLight, marginBottom: 8 },
  totalAmount: { fontSize: 36, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 20 },
  amountRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  amountBox: { flex: 1 },
  amountHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.error },
  amountLabel: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  paidAmount: { fontSize: 20, fontWeight: '700', color: COLORS.success },
  outstandingAmount: { fontSize: 20, fontWeight: '700', color: COLORS.error },
  progressSection: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  progressLabel: { fontSize: 13, fontWeight: '700', color: COLORS.secondary },
  goalLabel: { fontSize: 12, fontWeight: '500', color: COLORS.textLight },
  progressBarBg: { height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.secondary, borderRadius: 4 },

  historyHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8,
  },
  historyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },

  paymentList: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  statusIconText: { fontSize: 18, fontWeight: '700' },
  paymentInfo: { flex: 1, gap: 2 },
  paymentMonth: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  paymentDetail: { fontSize: 12, fontWeight: '500', color: COLORS.textLight },
  paymentRight: { alignItems: 'flex-end', gap: 6 },
  paymentAmount: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  timelineLine: {
    width: 2, height: 20, backgroundColor: '#F0F0F0', marginLeft: 19, marginVertical: 4,
  },
});
