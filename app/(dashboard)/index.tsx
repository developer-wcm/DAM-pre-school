import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { DEFAULT_SCHOOL_ID, DEFAULT_SCHOOL_NAME } from '../../constants/school';
import { useAuth } from '../../context/auth';
import { logActivity } from '../../lib/activity';
import { presentWeightForStatus } from '../../lib/attendance';
import { getIndianHolidays } from '../../lib/indianHolidays';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
  totalStudents: number;
  classCounts: { class: string; count: number }[];
  presentToday: number;
  pendingFeesAmount: number;
  overdueCount: number;
  schoolName: string | null;
  nextHolidayName: string | null;
  nextHolidayDate: string | null;
  nextHolidayDateTo: string | null;
  nextHolidayDays: number | null;
}

interface PendingRequest {
  id: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

interface DashboardStudentRow {
  id: string;
  class: string | null;
}

interface DashboardAttendanceRow {
  student_id: string;
  status: string;
}

interface DashboardFeeRow {
  amount: number | string;
  paid: boolean | null;
  due_date: string | null;
}

interface DashboardHolidayRow {
  name: string;
  date: string;
  date_to: string | null;
  days: number | null;
}

interface ActivityItem {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  dot_color: string;
  created_at: string;
}

const QUICK_ACTIONS = [
  { id: 'pending', icon: 'people-outline' as const, label: 'Pending\nRequests', color: '#E8E4F8', iconColor: '#7B6FE8' },
  { id: 'attendance', icon: 'checkmark-circle-outline' as const, label: 'Mark\nAttendance', color: '#D4F4E8', iconColor: '#2A9D6E' },
  { id: 'payment', icon: 'card-outline' as const, label: 'Record\nPayment', color: '#FFF0D4', iconColor: '#D4822A' },
];


const ROLE_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  teacher: { color: '#2A9D6E', bg: '#D4F4E8', icon: 'school-outline', label: 'Teacher' },
  parent:  { color: '#7B6FE8', bg: '#E8E4F8', icon: 'people-outline', label: 'Parent'  },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning,';
  if (h < 17) return 'Good Afternoon,';
  return 'Good Evening,';
}

function formatCurrency(amount: number) {
  if (amount >= 100000) return `\u20B9${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `\u20B9${(amount / 1000).toFixed(1)}K`;
  return `\u20B9${amount}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getNextHoliday(holidays: DashboardHolidayRow[], todayKey: string) {
  return holidays.find((holiday) => (holiday.date_to ?? holiday.date) >= todayKey) ?? null;
}

export default function AdminDashboardScreen() {
  const { profile } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0, classCounts: [], presentToday: 0,
    pendingFeesAmount: 0, overdueCount: 0,
    schoolName: null, nextHolidayName: null, nextHolidayDate: null,
    nextHolidayDateTo: null, nextHolidayDays: null,
  });
  const [upcomingHolidays, setUpcomingHolidays] = useState<DashboardHolidayRow[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // Notification popup state
  const [notifVisible, setNotifVisible] = useState(false);
  const [notifUser, setNotifUser] = useState<PendingRequest | null>(null);
  const slideAnim = useRef(new Animated.Value(-120)).current;

  function showNotif(user: PendingRequest) {
    setNotifUser(user);
    setNotifVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
    // Auto-dismiss after 5 seconds
    setTimeout(() => dismissNotif(), 5000);
  }

  function dismissNotif() {
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setNotifVisible(false));
  }

  const schoolId = profile?.school_id ?? DEFAULT_SCHOOL_ID;

  async function fetchDashboard() {
    try {
      const todayKey = getLocalDateKey();
      const [
        studentsRpcRes,
        attendanceRpcRes,
        feesRes,
        activityRes,
        pendingRes,
      ] = await Promise.all([
        supabase.rpc('get_student_profiles'),
        supabase.rpc('get_student_attendance_range', {
          p_start_date: todayKey,
          p_end_date: todayKey,
        }),
        supabase.from('fees').select('amount, paid, due_date').eq('school_id', schoolId).eq('paid', false),
        supabase.from('activity_log').select('*').eq('school_id', schoolId)
          .order('created_at', { ascending: false }).limit(5),
        supabase.rpc('get_pending_profiles', { p_school_id: schoolId }),
      ]);

      const studentsRes = studentsRpcRes.error
        ? await supabase.from('students').select('id, class').eq('school_id', schoolId)
        : studentsRpcRes;

      const attendanceRes = attendanceRpcRes.error
        ? await supabase.from('attendance').select('student_id, status')
          .eq('school_id', schoolId).eq('date', todayKey)
        : attendanceRpcRes;

      if (studentsRpcRes.error) console.warn('[Dashboard] Student RPC unavailable:', studentsRpcRes.error.message);
      if (attendanceRpcRes.error) console.warn('[Dashboard] Attendance RPC unavailable:', attendanceRpcRes.error.message);
      if (pendingRes.error) console.warn('[Dashboard] Pending profiles RPC unavailable:', pendingRes.error.message);

      if (studentsRes.error) throw studentsRes.error;
      if (attendanceRes.error) throw attendanceRes.error;
      if (feesRes.error) throw feesRes.error;
      if (activityRes.error) console.warn('[Dashboard] Activity log unavailable:', activityRes.error.message);

      const students = (studentsRes.data ?? []) as DashboardStudentRow[];
      const classCounts: { [key: string]: number } = {};
      students.forEach((s) => { if (s.class) classCounts[s.class] = (classCounts[s.class] || 0) + 1; });

      // Only count attendance for currently active students
      const activeStudentIds = new Set(students.map((s) => s.id));
      const todayAttendance = ((attendanceRes.data ?? []) as DashboardAttendanceRow[])
        .filter((record) => activeStudentIds.has(record.student_id));
      const presentToday = todayAttendance.reduce(
        (sum, record) => sum + presentWeightForStatus(record.status),
        0
      );

      const pendingFees = (feesRes.data ?? []) as DashboardFeeRow[];
      const pendingAmount = pendingFees.reduce((sum, f) => sum + Number(f.amount), 0);
      const overdueCount = pendingFees.filter((f) => f.due_date && f.due_date < todayKey).length;

      let allHolidays: DashboardHolidayRow[] = [];
      try {
        allHolidays = await getIndianHolidays(schoolId, todayKey);
      } catch (e) {
        console.warn('[Dashboard] Could not load holidays:', e);
      }
      const nextHoliday = getNextHoliday(allHolidays, todayKey);
      const upcoming = allHolidays.filter((h) => (h.date_to ?? h.date) >= todayKey);
      setUpcomingHolidays(upcoming);

      setStats({
        totalStudents: students.length,
        classCounts: Object.entries(classCounts).map(([cls, count]) => ({ class: cls, count })),
        presentToday, pendingFeesAmount: pendingAmount, overdueCount,
        schoolName: DEFAULT_SCHOOL_NAME,
        nextHolidayName: nextHoliday?.name ?? null,
        nextHolidayDate: nextHoliday?.date ?? null,
        nextHolidayDateTo: nextHoliday?.date_to ?? null,
        nextHolidayDays: nextHoliday?.days ?? null,
      });
      setActivity(activityRes.data ?? []);
      setPendingRequests(pendingRes.data ?? []);
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { fetchDashboard(); }, [schoolId]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchDashboard(); }, [schoolId]);

  // Realtime subscription — fires when a new profile is inserted (new sign-up)
  useEffect(() => {
    // Create a unique channel name to avoid conflicts
    const channelName = `pending-approvals-${schoolId}-${Date.now()}`;
    
    const channel = supabase.channel(channelName);
    
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles',
          filter: `school_id=eq.${schoolId}`,
        },
        (payload) => {
          const newUser = payload.new as PendingRequest;
          if (newUser.role !== 'admin') {
            setPendingRequests((prev) => {
              if (prev.find((r) => r.id === newUser.id)) return prev;
              return [newUser, ...prev];
            });
            showNotif(newUser);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [schoolId]);

  async function handleApprove(userId: string, name: string) {
    setActionLoading(userId);
    const req = pendingRequests.find((r) => r.id === userId);
    const { error } = await supabase.rpc('approve_profile', { p_user_id: userId });
    setActionLoading(null);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setPendingRequests((prev) => {
        const updated = prev.filter((r) => r.id !== userId);
        if (updated.length === 0) setShowPendingModal(false);
        return updated;
      });
      Alert.alert('Approved', `${name} has been approved and can now access the system.`);
      const role = req?.role ?? 'user';
      const actType = role === 'teacher' ? 'teacher_approved' : 'parent_approved';
      logActivity(schoolId, actType, `${role.charAt(0).toUpperCase() + role.slice(1)} Approved`, `${name} joined as ${role}`, userId)
        .catch((e) => console.warn('[Dashboard] Activity log failed:', e));
    }
  }

  async function handleReject(userId: string, name: string) {
    Alert.alert(
      'Reject Request',
      `Are you sure you want to reject ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject', style: 'destructive',
          onPress: async () => {
            setActionLoading(userId);
            const { error } = await supabase.rpc('reject_profile', { p_user_id: userId });
            setActionLoading(null);
            if (error) {
              Alert.alert('Error', error.message);
            } else {
              setPendingRequests((prev) => prev.filter((r) => r.id !== userId));
              logActivity(schoolId, 'user_rejected', 'Request Rejected', `${name}'s access request was rejected`)
                .catch((e) => console.warn('[Dashboard] Activity log failed:', e));
            }
          },
        },
      ]
    );
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
              <Text style={styles.greetingName}>{profile?.full_name ?? (profile?.role === 'principal' ? 'Principal' : 'Admin')}</Text>
              <Text style={styles.date}>{today}</Text>
            </View>
            <TouchableOpacity
              style={styles.avatar}
              activeOpacity={0.8}
              onPress={() => router.push('/(dashboard)/admin-profile')}
            >
              <Text style={styles.avatarText}>{initials}</Text>
              <View style={styles.avatarDot} />
              {pendingRequests.length > 0 && (
                <View style={styles.avatarBadge}>
                  <Text style={styles.avatarBadgeText}>{pendingRequests.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Pending Approval Requests */}
          {pendingRequests.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Pending Requests</Text>
                <View style={styles.pendingCountBadge}>
                  <Text style={styles.pendingCountText}>{pendingRequests.length}</Text>
                </View>
              </View>
              <View style={styles.requestList}>
                {pendingRequests.map((req) => {
                  const cfg = ROLE_CONFIG[req.role] ?? ROLE_CONFIG.parent;
                  const isActing = actionLoading === req.id;
                  const nameInitials = req.full_name
                    ? req.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                    : '??';
                  return (
                    <View key={req.id} style={styles.requestCard}>
                      {/* Avatar + info */}
                      <View style={[styles.reqAvatar, { backgroundColor: cfg.bg }]}>
                        <Text style={[styles.reqAvatarText, { color: cfg.color }]}>{nameInitials}</Text>
                      </View>
                      <View style={styles.reqInfo}>
                        <Text style={styles.reqName} numberOfLines={1}>
                          {req.full_name ?? 'Unknown User'}
                        </Text>
                        <View style={styles.reqRoleRow}>
                          <View style={[styles.reqRoleBadge, { backgroundColor: cfg.bg }]}>
                            <Ionicons name={cfg.icon} size={11} color={cfg.color} />
                            <Text style={[styles.reqRoleText, { color: cfg.color }]}>
                              {cfg.label}
                            </Text>
                          </View>
                          <Text style={styles.reqTime}>{timeAgo(req.created_at)}</Text>
                        </View>
                      </View>
                      {/* Actions */}
                      {isActing ? (
                        <ActivityIndicator size="small" color="#7B6FE8" style={{ marginLeft: 8 }} />
                      ) : (
                        <View style={styles.reqActions}>
                          <TouchableOpacity
                            style={styles.rejectBtn}
                            onPress={() => handleReject(req.id, req.full_name ?? '')}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="close" size={16} color="#E05A5A" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.approveBtn}
                            onPress={() => handleApprove(req.id, req.full_name ?? '')}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            <TouchableOpacity 
              style={[styles.statCard, { backgroundColor: '#E8F4FB' }]}
              activeOpacity={0.7}
              onPress={() => router.push('/(dashboard)/students')}
            >
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
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: '#D4F4E8' }]}
              activeOpacity={0.7}
              onPress={() => router.push('/(dashboard)/attendance')}
            >
              <View style={styles.statHeader}>
                <View style={[styles.statIconBox, { backgroundColor: '#A8E8CC' }]}>
                  <Ionicons name="checkmark-done-outline" size={16} color="#1A7A4A" />
                </View>
                <Text style={styles.statLabel}>Today's{'\n'}Attendance</Text>
              </View>
              <Text style={styles.statValue}>
                {stats.totalStudents > 0 ? `${attendancePct}%` : "—"}
              </Text>
              <Text style={styles.statSubtext}>
                {stats.totalStudents > 0
                  ? `${stats.presentToday} present / ${stats.totalStudents} total`
                  : 'No attendance marked'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: '#FFF0D4' }]}
              activeOpacity={0.7}
              onPress={() => router.push('/(dashboard)/outstanding-fees')}
            >
              <View style={styles.statHeader}>
                <View style={[styles.statIconBox, { backgroundColor: '#FFD8A0' }]}>
                  <Ionicons name="wallet-outline" size={16} color="#A05A00" />
                </View>
                <Text style={styles.statLabel}>Pending{'\n'}Fees</Text>
              </View>
              <Text style={styles.statValue}>
                {stats.pendingFeesAmount > 0 ? formatCurrency(stats.pendingFeesAmount) : 'Rs.0'}
              </Text>
              <Text style={styles.statSubtext}>
                {stats.overdueCount > 0 ? `${stats.overdueCount} overdue` : 'No overdue fees'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: '#F0EEFF' }]}
              activeOpacity={0.7}
              onPress={() => setShowCalendarModal(true)}
            >
              <View style={styles.statHeader}>
                <View style={[styles.statIconBox, { backgroundColor: '#FFF0D4' }]}>
                  <Ionicons name="calendar-outline" size={16} color="#D4822A" />
                </View>
                <Text style={styles.statLabel}>Next{'\n'}Holiday</Text>
              </View>
              {stats.nextHolidayName ? (
                <>
                  <Text style={styles.holidayName} numberOfLines={2}>{stats.nextHolidayName}</Text>
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
            </TouchableOpacity>
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
                  onPress={() => {
                    if (action.id === 'pending') {
                      setShowPendingModal(true);
                    } else if (action.id === 'attendance') {
                      router.push('/(dashboard)/attendance');
                    } else if (action.id === 'payment') {
                      router.push('/(dashboard)/record-payment');
                    }
                  }}
                >
                  <View style={styles.actionIconWrapper}>
                    <Ionicons name={action.icon} size={28} color={action.iconColor} />
                    {action.id === 'pending' && pendingRequests.length > 0 && (
                      <View style={styles.actionBadge}>
                        <Text style={styles.actionBadgeText}>{pendingRequests.length}</Text>
                      </View>
                    )}
                  </View>
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
                      <Text style={styles.activitySubtitle}>
                        {item.subtitle}
                        {item.created_at ? `  ·  ${timeAgo(item.created_at)}` : ''}
                      </Text>
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

      {/* ── Realtime Notification Banner ── */}
      {notifVisible && notifUser && (
        <Animated.View
          style={[styles.notifBanner, { transform: [{ translateY: slideAnim }] }]}
        >
          <View style={[styles.notifAvatar, {
            backgroundColor: ROLE_CONFIG[notifUser.role]?.bg ?? '#E8E4F8',
          }]}>
            <Ionicons
              name={ROLE_CONFIG[notifUser.role]?.icon ?? 'person'}
              size={18}
              color={ROLE_CONFIG[notifUser.role]?.color ?? '#7B6FE8'}
            />
          </View>
          <View style={styles.notifText}>
            <Text style={styles.notifTitle}>New Approval Request</Text>
            <Text style={styles.notifBody} numberOfLines={1}>
              <Text style={styles.notifName}>{notifUser.full_name ?? 'Someone'}</Text>
              {' '}wants to join as{' '}
              <Text style={styles.notifRole}>
                {ROLE_CONFIG[notifUser.role]?.label ?? notifUser.role}
              </Text>
            </Text>
          </View>
          <TouchableOpacity onPress={dismissNotif} style={styles.notifClose}>
            <Ionicons name="close" size={18} color="#5A5A7A" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── Upcoming Holidays & Events Modal ── */}
      <Modal
        visible={showCalendarModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalIconBox, { backgroundColor: '#FFF0D4' }]}>
                  <Ionicons name="calendar" size={24} color="#D4822A" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Upcoming Holidays</Text>
                  <Text style={styles.modalSubtitle}>
                    {upcomingHolidays.length} event{upcomingHolidays.length !== 1 ? 's' : ''} ahead
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowCalendarModal(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#5A5A7A" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {upcomingHolidays.length === 0 ? (
                <View style={styles.emptyModal}>
                  <Ionicons name="calendar-outline" size={64} color="#C4C4D4" />
                  <Text style={styles.emptyModalTitle}>No Upcoming Holidays</Text>
                  <Text style={styles.emptyModalText}>
                    There are no holidays scheduled for the rest of the year.
                  </Text>
                </View>
              ) : (
                upcomingHolidays.map((h, idx) => {
                  const startDate = new Date(h.date);
                  const isMultiDay = h.date_to && h.date_to !== h.date;
                  const daysUntil = Math.ceil(
                    (startDate.getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24)
                  );
                  const isToday = daysUntil === 0;
                  const isThisWeek = daysUntil > 0 && daysUntil <= 7;
                  const dotColor = isToday ? '#E05A5A' : isThisWeek ? '#D4822A' : '#7B6FE8';
                  const bgColor = isToday ? '#FFF0F0' : isThisWeek ? '#FFF8EE' : '#F4F3FA';
                  return (
                    <View key={idx} style={[styles.holidayCard, { backgroundColor: bgColor }]}>
                      <View style={[styles.holidayDot, { backgroundColor: dotColor }]} />
                      <View style={styles.holidayInfo}>
                        <Text style={styles.holidayCardName}>{h.name}</Text>
                        <Text style={styles.holidayCardDate}>
                          {startDate.toLocaleDateString('en-IN', {
                            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                          })}
                          {isMultiDay && ` – ${new Date(h.date_to!).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short',
                          })}`}
                        </Text>
                        {isToday && (
                          <View style={styles.holidayTodayBadge}>
                            <Text style={styles.holidayTodayText}>Today</Text>
                          </View>
                        )}
                      </View>
                      <View style={[styles.holidayDaysBadge, { backgroundColor: dotColor + '20' }]}>
                        <Text style={[styles.holidayDaysNum, { color: dotColor }]}>
                          {isToday ? 'Now' : `${daysUntil}d`}
                        </Text>
                        {h.days && h.days > 1 && (
                          <Text style={[styles.holidayDaysLabel, { color: dotColor }]}>
                            {h.days} days
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Pending Requests Modal ── */}
      <Modal
        visible={showPendingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPendingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIconBox}>
                  <Ionicons name="people" size={24} color="#7B6FE8" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Pending Requests</Text>
                  <Text style={styles.modalSubtitle}>
                    {pendingRequests.length} {pendingRequests.length === 1 ? 'person' : 'people'} waiting for approval
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowPendingModal(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#5A5A7A" />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {pendingRequests.length === 0 ? (
                <View style={styles.emptyModal}>
                  <Ionicons name="checkmark-circle-outline" size={64} color="#3AAF72" />
                  <Text style={styles.emptyModalTitle}>All Caught Up!</Text>
                  <Text style={styles.emptyModalText}>
                    No pending approval requests at the moment.
                  </Text>
                </View>
              ) : (
                pendingRequests.map((req) => {
                  const cfg = ROLE_CONFIG[req.role] ?? ROLE_CONFIG.parent;
                  const isActing = actionLoading === req.id;
                  const nameInitials = req.full_name
                    ? req.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                    : '??';
                  return (
                    <View key={req.id} style={styles.modalRequestCard}>
                      {/* Avatar + info */}
                      <View style={styles.modalReqTop}>
                        <View style={[styles.modalReqAvatar, { backgroundColor: cfg.bg }]}>
                          <Text style={[styles.modalReqAvatarText, { color: cfg.color }]}>
                            {nameInitials}
                          </Text>
                        </View>
                        <View style={styles.modalReqInfo}>
                          <Text style={styles.modalReqName} numberOfLines={1}>
                            {req.full_name ?? 'Unknown User'}
                          </Text>
                          <View style={styles.modalReqRoleRow}>
                            <View style={[styles.modalReqRoleBadge, { backgroundColor: cfg.bg }]}>
                              <Ionicons name={cfg.icon} size={12} color={cfg.color} />
                              <Text style={[styles.modalReqRoleText, { color: cfg.color }]}>
                                {cfg.label}
                              </Text>
                            </View>
                            <Text style={styles.modalReqTime}>{timeAgo(req.created_at)}</Text>
                          </View>
                        </View>
                      </View>

                      {/* Actions */}
                      {isActing ? (
                        <View style={styles.modalReqActions}>
                          <ActivityIndicator size="small" color="#7B6FE8" />
                        </View>
                      ) : (
                        <View style={styles.modalReqActions}>
                          <TouchableOpacity
                            style={styles.modalRejectBtn}
                            onPress={() => handleReject(req.id, req.full_name ?? '')}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="close" size={18} color="#E05A5A" />
                            <Text style={styles.modalRejectText}>Reject</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.modalApproveBtn}
                            onPress={() => handleApprove(req.id, req.full_name ?? '')}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                            <Text style={styles.modalApproveText}>Approve</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  avatarBadge: {
    position: 'absolute', top: -2, right: -2,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#E05A5A', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#EDE9F6', paddingHorizontal: 3,
  },
  avatarBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },

  joinCodeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  joinCodeCard: {
    backgroundColor: '#7B6FE8', borderRadius: 20, padding: 16,
    shadowColor: '#7B6FE8', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    gap: 6,
  },
  teacherJoinCodeCard: {
    backgroundColor: '#2A9D6E',
    shadowColor: '#2A9D6E',
  },
  joinCodeLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  joinCodeLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '700', letterSpacing: 0.3 },
  joinCodeValue: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: 4 },
  joinCodeFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  joinCodeHint: { fontSize: 10, color: 'rgba(255,255,255,0.7)', flex: 1 },
  joinCodeMissing: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.9)', fontStyle: 'italic' },
  copyBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 8,
    padding: 6, alignItems: 'center', justifyContent: 'center',
  },

  // Pending Requests
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pendingCountBadge: {
    backgroundColor: '#E05A5A', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  pendingCountText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  requestList: { gap: 10 },
  requestCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 14, gap: 12,
    shadowColor: '#9B8FE0', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  reqAvatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  reqAvatarText: { fontSize: 15, fontWeight: '800' },
  reqInfo: { flex: 1, gap: 4 },
  reqName: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  reqRoleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reqRoleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  reqRoleText: { fontSize: 11, fontWeight: '700' },
  reqTime: { fontSize: 11, color: '#9A9AB0' },
  reqActions: { flexDirection: 'row', gap: 8 },
  rejectBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center',
  },
  approveBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#2A9D6E', justifyContent: 'center', alignItems: 'center',
  },

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
  actionIconWrapper: { position: 'relative' },
  actionBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E05A5A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    paddingHorizontal: 4,
  },
  actionBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },
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

  // Realtime notification banner
  notifBanner: {
    position: 'absolute',
    top: 52,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#7B6FE8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#7B6FE8',
  },
  notifAvatar: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  notifText: { flex: 1, gap: 2 },
  notifTitle: { fontSize: 12, fontWeight: '700', color: '#7B6FE8', textTransform: 'uppercase', letterSpacing: 0.5 },
  notifBody: { fontSize: 13, color: '#3A3A5A', lineHeight: 18 },
  notifName: { fontWeight: '700', color: '#1A1A2E' },
  notifRole: { fontWeight: '700', color: '#7B6FE8' },
  notifClose: { padding: 4 },

  // Pending Requests Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEF8',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E8E4F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#7A7A9D',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F3FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    gap: 12,
  },
  emptyModal: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  emptyModalText: {
    fontSize: 14,
    color: '#7A7A9D',
    textAlign: 'center',
  },
  modalRequestCard: {
    backgroundColor: '#F9F8FD',
    borderRadius: 18,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#E8E6F4',
  },
  modalReqTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalReqAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalReqAvatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalReqInfo: {
    flex: 1,
    gap: 6,
  },
  modalReqName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  modalReqRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalReqRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  modalReqRoleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalReqTime: {
    fontSize: 12,
    color: '#9A9AB0',
  },
  modalReqActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalRejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FFD8D8',
  },
  modalRejectText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E05A5A',
  },
  modalApproveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2A9D6E',
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: '#2A9D6E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  modalApproveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Holiday cards in modal
  holidayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  holidayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  holidayInfo: {
    flex: 1,
    gap: 4,
  },
  holidayCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  holidayCardDate: {
    fontSize: 12,
    color: '#7A7A9D',
    fontWeight: '500',
  },
  holidayTodayBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E05A5A',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  holidayTodayText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  holidayDaysBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 44,
  },
  holidayDaysNum: {
    fontSize: 14,
    fontWeight: '800',
  },
  holidayDaysLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
});
