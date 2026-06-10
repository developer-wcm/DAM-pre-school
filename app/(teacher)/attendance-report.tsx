import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../../constants/admissionTheme';
import { supabase } from '../../lib/supabase';

interface StudentReport {
  id: string;
  full_name: string;
  roll_number: string | null;
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
}

function getTodayMonth() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function monthName(m: number) {
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1];
}

export default function AttendanceReportScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignedClass, setAssignedClass] = useState<string | null>(null);
  const { year, month } = getTodayMonth();

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('assigned_class')
        .eq('id', user.id)
        .single();

      const cls = profile?.assigned_class;
      setAssignedClass(cls ?? null);
      if (!cls) { setLoading(false); return; }

      const { data: students } = await supabase
        .from('students')
        .select('id, full_name, roll_number')
        .eq('class', cls)
        .order('full_name');

      if (!students || students.length === 0) { setLoading(false); return; }

      const ids = students.map((s) => s.id);
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const { data: attendance } = await supabase
        .from('attendance')
        .select('student_id, status')
        .in('student_id', ids)
        .gte('date', startDate)
        .lte('date', endDate);

      const countMap: Record<string, { present: number; absent: number; late: number; total: number }> = {};
      for (const s of students) {
        countMap[s.id] = { present: 0, absent: 0, late: 0, total: 0 };
      }
      for (const row of attendance ?? []) {
        const c = countMap[row.student_id];
        if (!c) continue;
        c.total++;
        if (row.status === 'present') c.present++;
        else if (row.status === 'absent') c.absent++;
        else if (row.status === 'late') c.late++;
      }

      const result: StudentReport[] = students.map((s) => {
        const c = countMap[s.id];
        const pct = c.total > 0 ? Math.round((c.present / c.total) * 100) : 0;
        return { id: s.id, full_name: s.full_name, roll_number: s.roll_number, ...c, percentage: pct };
      });

      result.sort((a, b) => a.percentage - b.percentage);
      setReports(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function pctColor(pct: number) {
    if (pct >= 85) return COLORS.success;
    if (pct >= 75) return COLORS.warning;
    return COLORS.error;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Attendance Report</Text>
          <Text style={styles.headerSub}>
            {monthName(month)} {year} {assignedClass ? `• Class ${assignedClass}` : ''}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : !assignedClass ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.warning} />
          <Text style={styles.emptyText}>No class assigned</Text>
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={48} color={COLORS.textLight} />
          <Text style={styles.emptyText}>No attendance data this month</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {/* Summary row */}
          <View style={styles.summaryRow}>
            {(() => {
              const below75 = reports.filter((r) => r.percentage < 75).length;
              const avg = Math.round(reports.reduce((s, r) => s + r.percentage, 0) / reports.length);
              return (
                <>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryNum}>{reports.length}</Text>
                    <Text style={styles.summaryLabel}>Students</Text>
                  </View>
                  <View style={styles.summaryCard}>
                    <Text style={[styles.summaryNum, { color: COLORS.success }]}>{avg}%</Text>
                    <Text style={styles.summaryLabel}>Avg Attendance</Text>
                  </View>
                  <View style={styles.summaryCard}>
                    <Text style={[styles.summaryNum, { color: below75 > 0 ? COLORS.error : COLORS.success }]}>{below75}</Text>
                    <Text style={styles.summaryLabel}>Below 75%</Text>
                  </View>
                </>
              );
            })()}
          </View>

          {reports.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.rollBadge}>
                  <Text style={styles.rollText}>{r.roll_number ?? '#'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{r.full_name}</Text>
                  <Text style={styles.totalDays}>{r.total} school days recorded</Text>
                </View>
                <View style={[styles.pctBadge, { backgroundColor: pctColor(r.percentage) + '20', borderColor: pctColor(r.percentage) + '40' }]}>
                  <Text style={[styles.pctText, { color: pctColor(r.percentage) }]}>{r.percentage}%</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <View style={[styles.statDot, { backgroundColor: COLORS.success }]} />
                  <Text style={styles.statLabel}>Present</Text>
                  <Text style={[styles.statValue, { color: COLORS.success }]}>{r.present}</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={[styles.statDot, { backgroundColor: COLORS.error }]} />
                  <Text style={styles.statLabel}>Absent</Text>
                  <Text style={[styles.statValue, { color: COLORS.error }]}>{r.absent}</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={[styles.statDot, { backgroundColor: COLORS.warning }]} />
                  <Text style={styles.statLabel}>Late</Text>
                  <Text style={[styles.statValue, { color: COLORS.warning }]}>{r.late}</Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${r.percentage}%` as any, backgroundColor: pctColor(r.percentage) }]} />
              </View>

              {r.percentage < 75 && (
                <View style={styles.warningRow}>
                  <Ionicons name="warning" size={13} color={COLORS.error} />
                  <Text style={styles.warningText}>Below minimum attendance (75%)</Text>
                </View>
              )}
            </View>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.lightGray,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  headerSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, fontWeight: '600' },
  listContent: { padding: 16, gap: 12 },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  summaryCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 14, padding: 14, alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  summaryNum: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  summaryLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500', marginTop: 2 },

  card: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16, gap: 10,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rollBadge: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.primarySoft,
    justifyContent: 'center', alignItems: 'center',
  },
  rollText: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  studentName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  totalDays: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  pctBadge: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1,
  },
  pctText: { fontSize: 15, fontWeight: '800' },

  statsRow: { flexDirection: 'row', gap: 0 },
  statItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  statDot: { width: 8, height: 8, borderRadius: 4 },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, flex: 1 },
  statValue: { fontSize: 14, fontWeight: '700' },

  barBg: { height: 6, backgroundColor: COLORS.lightGray, borderRadius: 3 },
  barFill: { height: 6, borderRadius: 3 },

  warningRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  warningText: { fontSize: 12, color: COLORS.error, fontWeight: '600' },
});
