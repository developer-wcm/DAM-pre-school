import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../context/auth';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
  totalStudents: number;
  classCounts: { class: string; count: number }[];
  presentToday: number;
  pendingFeesAmount: number;
  overdueCount: number;
  joinCode: string | null;
  schoolName: string | null;
  nextHolidayName: string | null;
  nextHolidayDate: string | null;
  nextHolidayDateTo: string | null;
  nextHolidayDays: number | null;
}

interface ActivityItem {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  dot_color: string;
}

const QUICK_ACTIONS = [
  { id: 'admission', icon: 'person-add-outline' as const, label: 'New\nAdmission', color: '#E8E4F8', iconColor: '#7B6FE8' },
  { id: 'attendance', icon: 'checkmark-circle-outline' as const, label: 'Mark\nAttendance', color: '#D4F4E8', iconColor: '#2A9D6E' },
  { id: 'payment', icon: 'card-outline' as const, label: 'Record\nPayment', color: '#FFF0D4', iconColor: '#D4822A' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning,';
  if (h < 17) return 'Good Afternoon,';
  return 'Good Evening,';
}

function formatCurrency(amount: number) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { profile } = useAuth();

  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0, classCounts: [], presentToday: 0,
    pendingFeesAmount: 0, overdueCount: 0, joinCode: null, schoolName: null,
    nextHolidayName: null, nextHolidayDate: null, nextHolidayDateTo: null, nextHolidayDays: null,
  });
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const schoolId = profile?.school_id;

  async function fetchDashboard() {
    if (!schoolId) return;
    try {
      const [studentsRes, attendanceRes, feesRes, schoolRes, activityRes, holidayRes] = await Promise.all([
        supabase.from('students').select('id, class').eq('school_id', schoolId),
        supabase.from('attendance').select('student_id, status')
          .eq('school_id', schoolId).eq('date', new Date().toISOString().split('T')[0]),
        supabase.from('fees').select('amount, paid, due_date').eq('school_id', schoolId).eq('paid', false),
        supabase.from('schools').select('name, join_code').eq('join_code', schoolId).single(),
        supabase.from('activity_log').select('*').eq('school_id', schoolId)
          .order('created_at', { ascending: false }).limit(5),
        supabase.from('holidays').select('name, date, date_to, days')
          .eq('school_id', schoolId)
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

      const students = studentsRes.data ?? [];
      const classCounts: { [key: string]: number } = {};
      students.forEach((s) => { if (s.class) classCounts[s.class] = (classCounts[s.class] || 0) + 1; });

      const todayAttendance = attendanceRes.data ?? [];
      const presentToday = todayAttendance.filter((a) => a.status === 'present').length;

      const pendingFees = feesRes.data ?? [];
      const pendingAmount = pendingFees.reduce((sum, f) => sum + Number(f.amount), 0);
      const today = new Date().toISOString().split('T')[0];
      const overdueCount = pendingFees.filter((f) => f.due_date && f.due_date < today).length;

      setStats({
        totalStudents: students.length,
        classCounts: Object.entries(classCounts).map(([cls, count]) => ({ class: cls, count })),
        presentToday, pendingFeesAmount: pendingAmount, overdueCount,
        joinCode: schoolRes.data?.join_code ?? schoolId,
        schoolName: schoolRes.data?.name ?? 'Your School',
        nextHolidayName: holidayRes.data?.name ?? null,
        nextHolidayDate: holidayRes.data?.date ?? null,
        nextHolidayDateTo: holidayRes.data?.date_to ?? null,
        nextHolidayDays: holidayRes.data?.days ?? null,
      });
      setActivity(activityRes.data ?? []);
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { fetchDashboard(); }, [schoolId]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchDashboard(); }, [schoolId]);

  function copyJoinCode() {
    if (stats.joinCode) {
      Clipboard.setString(stats.joinCode);
      Alert.alert('Copied!', `Join code "${stats.joinCode}" copied to clipboard.`);
    }
  }

  const attendancePct = stats.totalStudents > 0
    ? Math.round((stats.presentToday / stats.totalStudents) * 100) : 0;

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'AD';

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B6FE8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#EDE9F6', '#F0EEF8', '#EAF0F8']} style={styles.gradient}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7B6FE8" />}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.greetingName}>{profile?.full_name ?? 'Admin'}</Text>
              <Text style={styles.date}>{today}</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
              <View style={styles.avatarDot} />
            </View>
          </View>

          {/* Join Code Card */}
          <TouchableOpacity style={styles.joinCodeCard} onPress={copyJoinCode} activeOpacity={0.85}>
            <View style={styles.joinCodeLeft}>
              <View style={styles.joinCodeLabelRow}>
                <Ionicons name="business-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.joinCodeLabel}>School Join Code</Text>
              </View>
              <Text style={styles.joinCodeValue}>{stats.joinCode ?? '------'}</Text>
              <Text style={styles.joinCodeHint}>Share with parents & teachers to join</Text>
            </View>
            <View style={styles.copyBadge}>
              <Ionicons name="copy-outline" size={22} color="#fff" />
              <Text style={styles.copyText}>Copy</Text>
            </View>
          </TouchableOpacity>

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#E8F4FB' }]}>
              <View style={styles.statHeader}>
                <View style={[styles.statIconBox, { backgroundColor: '#C2E4F5' }]}>
                  <Ionicons name="school-outline" size={16} color="#2A7FA0" />
                </View>
                <Text style={styles.statLabel}>Total{'\n'}Students</Text>
              </View>
              <Text style={styles.statValue}>{stats.totalStudents}</Text>
              {stats.classCounts.length > 0 ? (
                <View style={styles.classBadges}>
                  {stats.classCounts.slice(0, 4).map((c) => (
                    <View key={c.class} style={styles.classBadge}>
                      <Text style={styles.classBadgeText}>{c.class}-{c.count}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.statSubtext}>No students yet</Text>
              )}
            </View>

            <View style={[styles.statCard, { backgroundColor: '#D4F4E8' }]}>
              <View style={styles.statHeader}>
                <View style={[styles.statIconBox, { backgroundColor: '#A8E8CC' }]}>
                  <Ionicons name="checkmark-done-outline" size={16} color="#1A7A4A" />
                </View>
                <Text style={styles.statLabel}>Today's{'\n'}Attendance</Text>
              </View>
              <Text style={styles.statValue}>
                {stats.totalStudents > 0 ? `${attendancePct}%` : '—'}
              </Text>
              <Text style={styles.statSubtext}>
                {stats.totalStudents > 0
                  ? `${stats.presentToday} present / ${stats.totalStudents} total`
                  : 'No attendance marked'}
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#FFF0D4' }]}>
              <View style={styles.statHeader}>
                <View style={[styles.statIconBox, { backgroundColor: '#FFD8A0' }]}>
                  <Ionicons name="wallet-outline" size={16} color="#A05A00" />
                </View>
                <Text style={styles.statLabel}>Pending{'\n'}Fees</Text>
              </View>
              <Text style={styles.statValue}>
                {stats.pendingFeesAmount > 0 ? formatCurrency(stats.pendingFeesAmount) : '₹0'}
              </Text>
              <Text style={styles.statSubtext}>
                {stats.overdueCount > 0 ? `${stats.overdueCount} overdue` : 'No overdue fees'}
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#F0EEFF' }]}>
              <View style={styles.statHeader}>
                <View style={[styles.statIconBox, { backgroundColor: '#FFF0D4' }]}>
                  <Ionicons name="calendar-outline" size={16} color="#D4822A" />
                </View>
                <Text style={styles.statLabel}>Next{'\n'}Holiday</Text>
              </View>
              {stats.nextHolidayName ? (
                <>
                  <Text style={styles.holidayName} numberOfLines={2}>
                    {stats.nextHolidayName}
                  </Text>
                  <Text style={styles.holidayDate}>
                    {new Date(stats.nextHolidayDate!).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </Text>
                  <View style={styles.daysBadge}>
                    <Ionicons name="time-outline" size={11} color="#D4822A" />
                    <Text style={styles.daysBadgeText}>
                      {stats.nextHolidayDays} {stats.nextHolidayDays === 1 ? 'day' : 'days'}
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={styles.statSubtext}>No upcoming holidays</Text>
              )}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              {QUICK_ACTIONS.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={[styles.actionBtn, { backgroundColor: action.color }]}
                  activeOpacity={0.85}
                  onPress={() => { if (action.id === 'admission') router.push('/admission/step-1'); }}
                >
                  <Ionicons name={action.icon} size={28} color={action.iconColor} />
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.activityList}>
              {activity.length === 0 ? (
                <View style={styles.emptyActivity}>
                  <Ionicons name="notifications-off-outline" size={36} color="#C4C4D4" />
                  <Text style={styles.emptyText}>No recent activity yet</Text>
                </View>
              ) : (
                activity.map((item) => (
                  <View key={item.id} style={styles.activityItem}>
                    <View style={[styles.activityIconBox, { backgroundColor: item.color }]}>
                      <Text style={styles.activityEmoji}>{item.icon}</Text>
                    </View>
                    <View style={styles.activityText}>
                      <Text style={styles.activityTitle}>{item.title}</Text>
                      <Text style={styles.activitySubtitle}>{item.subtitle}</Text>
                    </View>
                    <View style={[styles.activityDot, { backgroundColor: item.dot_color }]} />
                  </View>
                ))
              )}
            </View>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EDE9F6' },
  scrollContent: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20, gap: 20 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 15, fontWeight: '500', color: '#7A7A9D' },
  greetingName: { fontSize: 24, fontWeight: '800', color: '#1A1A2E', marginTop: 2 },
  date: { fontSize: 13, color: '#9A9AB0', marginTop: 4 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#E8E4F8', justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#7B6FE8' },
  avatarDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#3AAF72', borderWidth: 2, borderColor: '#FFFFFF',
  },

  joinCodeCard: {
    backgroundColor: '#7B6FE8', borderRadius: 20, padding: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#7B6FE8', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  joinCodeLeft: { gap: 4 },
  joinCodeLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  joinCodeLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  joinCodeValue: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', letterSpacing: 6 },
  joinCodeHint: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  copyBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12,
    padding: 12, alignItems: 'center', gap: 4,
  },
  copyText: { fontSize: 11, color: '#fff', fontWeight: '600' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: '48%', borderRadius: 20, padding: 16, gap: 8 },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statIconBox: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  statLabel: { fontSize: 12, fontWeight: '600', color: '#4A4A6A', lineHeight: 16, flex: 1 },
  statValue: { fontSize: 30, fontWeight: '800', color: '#1A1A2E', marginTop: 4 },
  statSubtext: { fontSize: 11, color: '#7A7A9D' },
  classBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  classBadge: { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  classBadgeText: { fontSize: 10, fontWeight: '600', color: '#3A7FA0' },
  holidayName: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginTop: 4 },
  holidayDate: { fontSize: 12, color: '#7A7A9D' },
  daysBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FFF0D4', borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 3, alignSelf: 'flex-start',
  },
  daysBadgeText: { fontSize: 10, fontWeight: '700', color: '#D4822A' },

  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },

  quickActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', gap: 8 },
  actionLabel: { fontSize: 11, fontWeight: '600', color: '#4A4A6A', textAlign: 'center', lineHeight: 15 },

  activityList: { gap: 10 },
  activityItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, gap: 12,
  },
  activityIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  activityEmoji: { fontSize: 20 },
  activityText: { flex: 1, gap: 2 },
  activityTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  activitySubtitle: { fontSize: 12, color: '#7A7A9D' },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  emptyActivity: { alignItems: 'center', padding: 32, backgroundColor: '#FFFFFF', borderRadius: 16, gap: 8 },
  emptyText: { fontSize: 14, color: '#9A9AB0', fontWeight: '500' },
});
