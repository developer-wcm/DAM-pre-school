import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/admissionTheme';
import { DEFAULT_SCHOOL_ID } from '../../constants/school';
import { useAuth } from '../../context/auth';
import { supabase } from '../../lib/supabase';

interface StaffMonthRecord {
  id: string;
  full_name: string | null;
  role: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function padTwo(n: number) { return String(n).padStart(2, '0'); }

function monthRange(year: number, month: number) {
  const start = `${year}-${padTwo(month)}-01`;
  const last = new Date(year, month, 0).getDate();
  const end = `${year}-${padTwo(month)}-${padTwo(last)}`;
  return { start, end };
}

function getRoleColor(role: string) {
  if (role === 'principal') return '#9B6FE8';
  if (role === 'teacher') return COLORS.primary;
  return COLORS.secondary;
}

export default function StaffAttendanceReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const schoolId = profile?.school_id ?? DEFAULT_SCHOOL_ID;

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [records, setRecords] = useState<StaffMonthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isCurrentMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth() + 1;

  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear((y) => y - 1); setViewMonth(12); }
    else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (isCurrentMonth) return;
    if (viewMonth === 12) { setViewYear((y) => y + 1); setViewMonth(1); }
    else setViewMonth((m) => m + 1);
  };

  const fetchReport = useCallback(async () => {
    try {
      const { start, end } = monthRange(viewYear, viewMonth);

      const [staffRes, attendanceRes] = await Promise.all([
        supabase.rpc('get_staff_profiles'),
        supabase
          .from('staff_attendance')
          .select('staff_id, status')
          .eq('school_id', schoolId)
          .gte('date', start)
          .lte('date', end),
      ]);

      if (staffRes.error) throw staffRes.error;

      const rows: { staff_id: string; status: string }[] = attendanceRes.data ?? [];

      const next: StaffMonthRecord[] = (staffRes.data ?? []).map(
        (member: { id: string; full_name: string | null; role: string }) => {
          const memberRows = rows.filter((r) => r.staff_id === member.id);
          const present = memberRows.filter((r) => r.status === 'present').length;
          const absent  = memberRows.filter((r) => r.status === 'absent').length;
          const late    = memberRows.filter((r) => r.status === 'late').length;
          const total   = present + absent + late;
          const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
          return { id: member.id, full_name: member.full_name, role: member.role, present, absent, late, total, percentage };
        }
      );

      // Sort: highest attendance % first
      next.sort((a, b) => b.percentage - a.percentage);
      setRecords(next);
    } catch (e) {
      console.error('[StaffAttendanceReport]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [schoolId, viewYear, viewMonth]);

  useEffect(() => {
    setLoading(true);
    fetchReport();
  }, [fetchReport]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReport();
  }, [fetchReport]);

  const summary = useMemo(() => ({
    perfect: records.filter((r) => r.percentage === 100).length,
    below75: records.filter((r) => r.total > 0 && r.percentage < 75).length,
  }), [records]);

  const renderItem = ({ item }: { item: StaffMonthRecord }) => {
    const pctColor =
      item.percentage >= 90 ? COLORS.success :
      item.percentage >= 75 ? COLORS.warning : COLORS.error;
    const initials = item.full_name
      ? item.full_name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
      : 'NA';

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.avatar, { backgroundColor: getRoleColor(item.role) + '22' }]}>
            <Text style={[styles.avatarText, { color: getRoleColor(item.role) }]}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{item.full_name ?? 'Unknown'}</Text>
            <Text style={styles.role}>{item.role.replace(/^(.)/, (m) => m.toUpperCase())}</Text>
          </View>
          <View style={[styles.pctBadge, { backgroundColor: pctColor + '22' }]}>
            <Text style={[styles.pctText, { color: pctColor }]}>{item.percentage}%</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${item.percentage}%` as any, backgroundColor: pctColor }]} />
        </View>

        {/* Counts */}
        <View style={styles.counts}>
          <View style={styles.countItem}>
            <Text style={[styles.countNum, { color: COLORS.success }]}>{item.present}</Text>
            <Text style={styles.countLabel}>Present</Text>
          </View>
          <View style={styles.countItem}>
            <Text style={[styles.countNum, { color: COLORS.warning }]}>{item.late}</Text>
            <Text style={styles.countLabel}>Late</Text>
          </View>
          <View style={styles.countItem}>
            <Text style={[styles.countNum, { color: COLORS.error }]}>{item.absent}</Text>
            <Text style={styles.countLabel}>Absent</Text>
          </View>
          <View style={styles.countItem}>
            <Text style={[styles.countNum, { color: COLORS.textSecondary }]}>{item.total}</Text>
            <Text style={styles.countLabel}>Marked</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Attendance Report</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Month navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity style={styles.navBtn} onPress={prevMonth} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {MONTH_NAMES[viewMonth - 1]} {viewYear}
          {isCurrentMonth ? '  (This Month)' : ''}
        </Text>
        <TouchableOpacity
          style={[styles.navBtn, isCurrentMonth && styles.navBtnDisabled]}
          onPress={nextMonth}
          disabled={isCurrentMonth}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={20} color={isCurrentMonth ? COLORS.textLight : COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Summary chips */}
      {!loading && records.length > 0 && (
        <View style={styles.summaryRow}>
          <View style={[styles.chip, { backgroundColor: COLORS.successLight }]}>
            <Ionicons name="star" size={13} color={COLORS.success} />
            <Text style={[styles.chipText, { color: COLORS.success }]}>{summary.perfect} Perfect</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: COLORS.errorLight }]}>
            <Ionicons name="alert-circle" size={13} color={COLORS.error} />
            <Text style={[styles.chipText, { color: COLORS.error }]}>{summary.below75} Below 75%</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: COLORS.primarySoft }]}>
            <Ionicons name="people" size={13} color={COLORS.primary} />
            <Text style={[styles.chipText, { color: COLORS.primary }]}>{records.length} Staff</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom, 20) }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="document-text-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyTitle}>No data for this month</Text>
              <Text style={styles.emptyText}>No attendance was marked in {MONTH_NAMES[viewMonth - 1]} {viewYear}.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: COLORS.white, borderRadius: 16,
    paddingHorizontal: 8, paddingVertical: 10,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  navBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.primarySoft, justifyContent: 'center', alignItems: 'center',
  },
  navBtnDisabled: { backgroundColor: COLORS.lightGray },
  monthLabel: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  summaryRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 12,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  chipText: { fontSize: 12, fontWeight: '700' },
  list: { paddingHorizontal: 20, gap: 12, paddingTop: 4 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 16,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '800' },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  role: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  pctBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  pctText: { fontSize: 14, fontWeight: '800' },
  barBg: {
    height: 6, backgroundColor: COLORS.lightGray, borderRadius: 3, marginBottom: 12, overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
  counts: { flexDirection: 'row', justifyContent: 'space-between' },
  countItem: { alignItems: 'center', flex: 1 },
  countNum: { fontSize: 16, fontWeight: '800' },
  countLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary, marginTop: 2 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginTop: 12 },
  emptyText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6, textAlign: 'center' },
});
