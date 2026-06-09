import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DEFAULT_SCHOOL_ID } from '../../constants/school';
import { AppColors, AppShadows } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

interface OverdueStudent {
  id: string;
  full_name: string;
  class: string;
  amount: number;
  months_overdue: number;
  overdue_count: number;
}

const CLASS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'PG', label: 'Play Group' },
  { id: 'PKG', label: 'Pre-K' },
  { id: 'JKG', label: 'Junior KG' },
  { id: 'SKG', label: 'Senior KG' },
];

const CLASS_COLORS: Record<string, { bg: string; text: string }> = {
  PG:  { bg: '#FFF0D4', text: '#D4822A' },
  PKG: { bg: '#FFE4E4', text: '#E05A5A' },
  JKG: { bg: '#E8E4F8', text: '#7B6FE8' },
  SKG: { bg: '#D4F4E8', text: '#2A9D6E' },
};

type SortKey = 'amount' | 'name' | 'months';

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatCurrency(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

function getClassLabel(cls: string) {
  const m: Record<string, string> = { PG: 'Play Group', PKG: 'Pre-K', JKG: 'Junior KG', SKG: 'Senior KG' };
  return m[cls] ?? cls;
}

export default function OutstandingFeesScreen() {
  const router = useRouter();
  const schoolId = DEFAULT_SCHOOL_ID;
  const [students, setStudents] = useState<OverdueStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedClass, setSelectedClass] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('amount');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sendingReminders, setSendingReminders] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: studentsData, error: sErr } = await supabase
        .from('students')
        .select('id, full_name, class')
        .eq('school_id', schoolId)
        .eq('status', 'active');
      if (sErr) throw sErr;

      const { data: feesData, error: fErr } = await supabase
        .from('fees')
        .select('student_id, amount, paid, due_date')
        .eq('school_id', schoolId)
        .eq('paid', false)
        .not('due_date', 'is', null)
        .lt('due_date', today);
      if (fErr) throw fErr;

      const feeMap: Record<string, { total: number; count: number; oldest: string }> = {};
      for (const f of feesData ?? []) {
        const sid = f.student_id;
        if (!feeMap[sid]) feeMap[sid] = { total: 0, count: 0, oldest: f.due_date };
        feeMap[sid].total += Number(f.amount);
        feeMap[sid].count += 1;
        if (f.due_date < feeMap[sid].oldest) feeMap[sid].oldest = f.due_date;
      }

      const result: OverdueStudent[] = [];
      for (const s of studentsData ?? []) {
        const fm = feeMap[s.id];
        if (!fm) continue;
        const months = Math.max(1, Math.floor(
          (new Date().getTime() - new Date(fm.oldest).getTime()) / (1000 * 60 * 60 * 24 * 30)
        ));
        result.push({
          id: s.id,
          full_name: s.full_name,
          class: s.class,
          amount: fm.total,
          months_overdue: months,
          overdue_count: fm.count,
        });
      }

      setStudents(result);
    } catch (e) {
      console.error('Outstanding fees error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [schoolId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchData(); }, [fetchData]);

  const filtered = students
    .filter((s) => selectedClass === 'all' || s.class === selectedClass)
    .sort((a, b) => {
      if (sortKey === 'amount') return b.amount - a.amount;
      if (sortKey === 'name') return a.full_name.localeCompare(b.full_name);
      return b.months_overdue - a.months_overdue;
    });

  const totalOutstanding = filtered.reduce((s, r) => s + r.amount, 0);
  const allSelected = filtered.length > 0 && filtered.every((s) => selected.has(s.id));

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((s) => s.id)));
    }
  }

  async function sendReminders() {
    if (selected.size === 0) return;
    setSendingReminders(true);
    await new Promise((r) => setTimeout(r, 700));
    setSendingReminders(false);
    Alert.alert(
      'Reminders Sent',
      `Payment reminders sent to ${selected.size} student${selected.size > 1 ? 's' : ''}.`,
      [{ text: 'OK', onPress: () => setSelected(new Set()) }]
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={AppColors.primaryBlue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#EDE9F6', '#F0EEF8', '#EAF0F8']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.navigate('/(dashboard)/')} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={AppColors.primaryBlue} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Outstanding Fees</Text>
            <Text style={styles.headerSub}>DMA PreSchool Manager</Text>
          </View>
          <TouchableOpacity style={styles.filterIconBtn} activeOpacity={0.7}>
            <Ionicons name="options-outline" size={22} color={AppColors.primaryBlue} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.primaryBlue} />
          }
        >
          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <Text style={styles.summaryLabel}>TOTAL OUTSTANDING</Text>
              <Text style={styles.summaryAmount}>{formatCurrency(totalOutstanding)}</Text>
            </View>
            <View style={styles.summaryRight}>
              <View style={styles.studentsDot} />
              <Text style={styles.studentsLabel}>STUDENTS</Text>
              <Text style={styles.studentsCount}>{filtered.length}</Text>
            </View>
          </View>

          {/* Class Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {CLASS_FILTERS.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterChip, selectedClass === f.id && styles.filterChipActive]}
                onPress={() => setSelectedClass(f.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, selectedClass === f.id && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Sort Row */}
          <View style={styles.sortRow}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            {([['amount', 'Amount'], ['name', 'Name A-Z'], ['months', 'Months Due']] as [SortKey, string][]).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[styles.sortChip, sortKey === key && styles.sortChipActive]}
                onPress={() => setSortKey(key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.sortChipText, sortKey === key && styles.sortChipTextActive]}>
                  {label}
                </Text>
                {sortKey === key && (
                  <Ionicons name="arrow-down" size={12} color={AppColors.primaryBlue} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Select All Row */}
          {filtered.length > 0 && (
            <View style={styles.selectAllRow}>
              <TouchableOpacity
                style={[styles.checkCircle, allSelected && styles.checkCircleActive]}
                onPress={toggleSelectAll}
                activeOpacity={0.7}
              >
                {allSelected && <Ionicons name="checkmark" size={14} color={AppColors.white} />}
              </TouchableOpacity>
              <Text style={styles.selectAllText}>Select all for reminders</Text>
              {selected.size > 0 && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>{selected.size}/{filtered.length} selected</Text>
                </View>
              )}
            </View>
          )}

          {/* Student List */}
          {filtered.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="checkmark-circle-outline" size={64} color={AppColors.success} />
              <Text style={styles.emptyTitle}>No Outstanding Fees</Text>
              <Text style={styles.emptyText}>All students are up to date.</Text>
            </View>
          ) : (
            filtered.map((s) => {
              const cc = CLASS_COLORS[s.class] ?? CLASS_COLORS.PG;
              const isSelected = selected.has(s.id);
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.studentCard, isSelected && styles.studentCardSelected]}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/(dashboard)/student-profile?id=${s.id}`)}
                >
                  {/* Checkbox */}
                  <TouchableOpacity
                    style={[styles.checkCircle, isSelected && styles.checkCircleActive]}
                    onPress={() => toggleSelect(s.id)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {isSelected && <Ionicons name="checkmark" size={14} color={AppColors.white} />}
                  </TouchableOpacity>

                  {/* Avatar */}
                  <View style={[styles.avatar, { backgroundColor: cc.bg }]}>
                    <Text style={[styles.avatarText, { color: cc.text }]}>{getInitials(s.full_name)}</Text>
                    {s.overdue_count > 1 && (
                      <View style={styles.avatarBadge}>
                        <Ionicons name="alert-circle" size={16} color="#E74C3C" />
                      </View>
                    )}
                  </View>

                  {/* Info */}
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName} numberOfLines={1}>{s.full_name}</Text>
                    <View style={[styles.classBadge, { backgroundColor: cc.bg }]}>
                      <Text style={[styles.classBadgeText, { color: cc.text }]}>
                        {getClassLabel(s.class).toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Amount + Overdue */}
                  <View style={styles.cardRight}>
                    <Text style={styles.cardAmount}>{formatCurrency(s.amount)}</Text>
                    <Text style={styles.cardOverdue}>
                      {s.months_overdue} {s.months_overdue === 1 ? 'month' : 'months'} overdue
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom Button — always visible */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.sendBtn, (selected.size === 0 || sendingReminders) && styles.sendBtnDisabled]}
            onPress={sendReminders}
            activeOpacity={0.85}
            disabled={selected.size === 0 || sendingReminders}
          >
            {sendingReminders ? (
              <ActivityIndicator size="small" color={AppColors.white} />
            ) : (
              <>
                <Ionicons name="notifications" size={22} color={AppColors.white} />
                <Text style={styles.sendBtnText}>
                  {selected.size > 0
                    ? `Send Reminders (${selected.size} selected)`
                    : 'Select students to send reminders'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EDE9F6' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...AppShadows.cardShadow,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A2E' },
  headerSub: { fontSize: 12, color: '#7A7A9D', marginTop: 2 },
  filterIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...AppShadows.cardShadow,
  },

  scrollContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20 },

  summaryCard: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    ...AppShadows.cardShadow,
  },
  summaryLeft: { gap: 4 },
  summaryLabel: { fontSize: 11, fontWeight: '700', color: '#9A9AB0', letterSpacing: 0.5 },
  summaryAmount: { fontSize: 32, fontWeight: '800', color: AppColors.error },
  summaryRight: { alignItems: 'flex-end', gap: 4 },
  studentsDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: AppColors.error, alignSelf: 'flex-end' },
  studentsLabel: { fontSize: 11, fontWeight: '700', color: '#9A9AB0', letterSpacing: 0.5 },
  studentsCount: { fontSize: 32, fontWeight: '800', color: '#1A1A2E' },

  filterRow: { gap: 10, paddingVertical: 4, marginBottom: 12 },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: AppColors.white,
    ...AppShadows.cardShadow,
  },
  filterChipActive: { backgroundColor: AppColors.primaryBlue },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#4A4A6A' },
  filterChipTextActive: { color: AppColors.white, fontWeight: '700' },

  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  sortLabel: { fontSize: 13, color: '#7A7A9D', fontWeight: '600' },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: AppColors.white,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...AppShadows.cardShadow,
  },
  sortChipActive: { borderColor: AppColors.primaryBlue, backgroundColor: '#EEF2FF' },
  sortChipText: { fontSize: 12, fontWeight: '600', color: '#4A4A6A' },
  sortChipTextActive: { color: AppColors.primaryBlue, fontWeight: '700' },

  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  selectAllText: { fontSize: 14, fontWeight: '600', color: '#4A4A6A', flex: 1 },
  selectedBadge: {
    backgroundColor: '#E8E4F8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  selectedBadgeText: { fontSize: 12, fontWeight: '700', color: AppColors.primaryBlue },

  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#C8C8E0',
    backgroundColor: AppColors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleActive: {
    backgroundColor: AppColors.primaryBlue,
    borderColor: AppColors.primaryBlue,
  },

  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: AppColors.error,
    ...AppShadows.cardShadow,
  },
  studentCardSelected: {
    borderColor: AppColors.primaryBlue,
    borderWidth: 2,
    borderLeftWidth: 2,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: { fontSize: 16, fontWeight: '700' },
  avatarBadge: { position: 'absolute', bottom: -2, right: -2 },

  cardInfo: { flex: 1, gap: 5 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  classBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  classBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  cardRight: { alignItems: 'flex-end', gap: 4 },
  cardAmount: { fontSize: 16, fontWeight: '800', color: AppColors.error },
  cardOverdue: { fontSize: 12, fontWeight: '500', color: '#9A9AB0' },

  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  emptyText: { fontSize: 14, color: '#7A7A9D' },

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
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: AppColors.primaryBlue,
    borderRadius: 30,
    paddingVertical: 18,
    ...AppShadows.floatingShadow,
  },
  sendBtnDisabled: {
    backgroundColor: '#B0AACC',
  },
  sendBtnText: { fontSize: 15, fontWeight: '700', color: AppColors.white, textAlign: 'center' },
});
