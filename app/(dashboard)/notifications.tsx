import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

interface OverdueFeeNotif {
  type: 'overdue_fee';
  id: string;
  studentName: string;
  studentId: string;
  label: string;
  amount: number;
  daysOverdue: number;
  dueDate: string;
}

interface NewStudentNotif {
  type: 'new_student';
  id: string;
  studentName: string;
  studentId: string;
  className: string;
  admittedDate: string;
}

type Notification = OverdueFeeNotif | NewStudentNotif;

function getDaysOverdue(dueDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
}

function formatAmount(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const CLASS_LABELS: Record<string, string> = {
  PG: 'Play Group',
  PKG: 'Pre-KG',
  JKG: 'Junior KG',
  SKG: 'Senior KG',
};

export default function NotificationsScreen() {
  const router = useRouter();
  const schoolId = DEFAULT_SCHOOL_ID;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [feesRes, studentsRes] = await Promise.all([
        supabase
          .from('fees')
          .select('id, label, amount, due_date, student_id, students(id, full_name)')
          .eq('school_id', schoolId)
          .eq('paid', false)
          .lt('due_date', today)
          .order('due_date', { ascending: true })
          .limit(50),
        supabase
          .from('students')
          .select('id, full_name, class, created_at')
          .eq('school_id', schoolId)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const notifs: Notification[] = [];

      // Overdue fees
      for (const f of feesRes.data ?? []) {
        const student = Array.isArray(f.students) ? f.students[0] : f.students;
        if (!student) continue;
        notifs.push({
          type: 'overdue_fee',
          id: `fee_${f.id}`,
          studentName: student.full_name,
          studentId: student.id,
          label: f.label ?? 'Fee',
          amount: Number(f.amount),
          daysOverdue: getDaysOverdue(f.due_date),
          dueDate: f.due_date,
        });
      }

      // Recently added students (last 30 days)
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      for (const s of studentsRes.data ?? []) {
        if (new Date(s.created_at) < cutoff) continue;
        notifs.push({
          type: 'new_student',
          id: `student_${s.id}`,
          studentName: s.full_name,
          studentId: s.id,
          className: s.class,
          admittedDate: s.created_at,
        });
      }

      setNotifications(notifs);
    } catch (e) {
      console.error('Error fetching notifications:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const overdueCount = notifications.filter((n) => n.type === 'overdue_fee').length;
  const newCount = notifications.filter((n) => n.type === 'new_student').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={AppColors.primaryBlue} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={AppColors.primaryBlue} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.primaryBlue} />
          }
        >
          {notifications.length === 0 && (
            <View style={styles.emptyBox}>
              <Ionicons name="notifications-off-outline" size={64} color={AppColors.textLight} />
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptyText}>No notifications at the moment.</Text>
            </View>
          )}

          {/* Overdue Fees Section */}
          {overdueCount > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionDot} />
                <Text style={styles.sectionTitle}>Overdue Fees</Text>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{overdueCount}</Text>
                </View>
              </View>
              {notifications
                .filter((n): n is OverdueFeeNotif => n.type === 'overdue_fee')
                .map((n) => (
                  <TouchableOpacity
                    key={n.id}
                    style={styles.notifCard}
                    activeOpacity={0.75}
                    onPress={() => router.push(`/(dashboard)/student-profile?id=${n.studentId}`)}
                  >
                    <View style={[styles.notifIcon, { backgroundColor: '#FFE4E4' }]}>
                      <Ionicons name="alert-circle" size={22} color="#E74C3C" />
                    </View>
                    <View style={styles.notifBody}>
                      <Text style={styles.notifTitle} numberOfLines={1}>
                        {n.studentName}
                      </Text>
                      <Text style={styles.notifDesc} numberOfLines={1}>
                        {n.label} — {formatAmount(n.amount)} overdue
                      </Text>
                      <Text style={styles.notifMeta}>
                        {n.daysOverdue} day{n.daysOverdue !== 1 ? 's' : ''} overdue · Due{' '}
                        {new Date(n.dueDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={AppColors.textLight} />
                  </TouchableOpacity>
                ))}
            </>
          )}

          {/* New Students Section */}
          {newCount > 0 && (
            <>
              <View style={[styles.sectionHeader, { marginTop: overdueCount > 0 ? 20 : 0 }]}>
                <View style={[styles.sectionDot, { backgroundColor: AppColors.success }]} />
                <Text style={styles.sectionTitle}>Recently Added</Text>
                <View style={[styles.sectionBadge, { backgroundColor: '#D4F4E8' }]}>
                  <Text style={[styles.sectionBadgeText, { color: AppColors.success }]}>{newCount}</Text>
                </View>
              </View>
              {notifications
                .filter((n): n is NewStudentNotif => n.type === 'new_student')
                .map((n) => (
                  <TouchableOpacity
                    key={n.id}
                    style={styles.notifCard}
                    activeOpacity={0.75}
                    onPress={() => router.push(`/(dashboard)/student-profile?id=${n.studentId}`)}
                  >
                    <View style={[styles.notifIcon, { backgroundColor: '#D4F4E8' }]}>
                      <Ionicons name="person-add" size={22} color={AppColors.success} />
                    </View>
                    <View style={styles.notifBody}>
                      <Text style={styles.notifTitle} numberOfLines={1}>
                        {n.studentName}
                      </Text>
                      <Text style={styles.notifDesc}>
                        New student admitted · {CLASS_LABELS[n.className] ?? n.className}
                      </Text>
                      <Text style={styles.notifMeta}>{timeAgo(n.admittedDate)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={AppColors.textLight} />
                  </TouchableOpacity>
                ))}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.blueLight,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.blueLight,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.textPrimary,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E74C3C',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: AppColors.textPrimary,
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: '#FFE4E4',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E74C3C',
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    ...AppShadows.cardShadow,
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBody: {
    flex: 1,
    gap: 3,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  notifDesc: {
    fontSize: 13,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  notifMeta: {
    fontSize: 11,
    color: AppColors.textTertiary,
    fontWeight: '500',
  },
});
