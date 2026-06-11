import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { toDateKey } from '../../lib/attendance';
import { markStaffAttendance, mapStaffAttendanceError, StaffMarkStatus } from '../../lib/staffAttendance';
import { supabase } from '../../lib/supabase';

type StaffAttendanceStatus = StaffMarkStatus | 'not-marked';

type StaffRecord = {
  id: string;
  full_name: string | null;
  role: string;
  attendance: StaffAttendanceStatus;
};

const MARK_OPTIONS: { status: StaffMarkStatus; label: string; color: string; light: string }[] = [
  { status: 'present', label: 'P', color: COLORS.success, light: COLORS.successLight },
  { status: 'absent',  label: 'A', color: COLORS.error,   light: COLORS.errorLight },
  { status: 'late',    label: 'L', color: COLORS.warning, light: COLORS.warningLight },
];

function getDateLabel(date: Date) {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function isSameDay(a: Date, b: Date) {
  return toDateKey(a) === toDateKey(b);
}

function addDays(date: Date, delta: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + delta);
  return next;
}

export default function StaffAttendanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, user } = useAuth();

  const schoolId = profile?.school_id ?? DEFAULT_SCHOOL_ID;
  const today = useMemo(() => new Date(), []);

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);

  const selectedDateKey = toDateKey(selectedDate);
  const isToday = isSameDay(selectedDate, today);

  const fetchStaffAttendance = useCallback(async () => {
    try {
      const [staffRes, attendanceRes] = await Promise.all([
        supabase.rpc('get_staff_profiles'),
        supabase
          .from('staff_attendance')
          .select('staff_id, status')
          .eq('school_id', schoolId)
          .eq('date', selectedDateKey),
      ]);

      if (staffRes.error) throw staffRes.error;
      if (attendanceRes.error) throw attendanceRes.error;

      const attendanceMap = new Map(
        (attendanceRes.data ?? []).map((record: { staff_id: string; status: string }) => [
          record.staff_id,
          record.status as StaffAttendanceStatus,
        ])
      );

      const nextStaff = (staffRes.data ?? []).map(
        (member: { id: string; full_name: string | null; role: string }) => ({
          id: member.id,
          full_name: member.full_name,
          role: member.role,
          attendance: attendanceMap.get(member.id) ?? 'not-marked',
        })
      );

      setStaff(nextStaff);
    } catch (error) {
      console.error('[StaffAttendance] Error loading staff attendance:', error);
      Alert.alert('Unable to load staff attendance', 'Please try again in a moment.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [schoolId, selectedDateKey]);

  useEffect(() => {
    setLoading(true);
    fetchStaffAttendance();
  }, [fetchStaffAttendance]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStaffAttendance();
  }, [fetchStaffAttendance]);

  // ── Mark a single staff member (instant save, optimistic) ──────────────────
  const handleMark = useCallback(
    async (member: StaffRecord, status: StaffMarkStatus) => {
      if (!user?.id) {
        Alert.alert('Not signed in', 'Please sign in again to mark attendance.');
        return;
      }
      // Tapping the already-selected status does nothing.
      if (member.attendance === status) return;

      const previous = member.attendance;
      setStaff((prev) => prev.map((s) => (s.id === member.id ? { ...s, attendance: status } : s)));
      setSavingId(member.id);

      const { error } = await markStaffAttendance({
        schoolId,
        staffId: member.id,
        date: selectedDate,
        status,
        markedBy: user.id,
        source: 'manual',
      });

      setSavingId(null);
      if (error) {
        // Roll back optimistic change
        setStaff((prev) => prev.map((s) => (s.id === member.id ? { ...s, attendance: previous } : s)));
        Alert.alert('Error', mapStaffAttendanceError(error));
      }
    },
    [schoolId, selectedDate, user?.id]
  );

  // ── Mark everyone present in one tap ───────────────────────────────────────
  const handleMarkAllPresent = useCallback(() => {
    if (!user?.id) {
      Alert.alert('Not signed in', 'Please sign in again to mark attendance.');
      return;
    }
    const unmarkedOrNot = staff.filter((s) => s.attendance !== 'present');
    if (unmarkedOrNot.length === 0) {
      Alert.alert('All set', 'Everyone is already marked present.');
      return;
    }

    Alert.alert(
      'Mark All Present',
      `Mark all ${staff.length} staff as present for ${getDateLabel(selectedDate)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark All',
          onPress: async () => {
            setBulkSaving(true);
            const snapshot = staff;
            // Optimistic: everyone present
            setStaff((prev) => prev.map((s) => ({ ...s, attendance: 'present' as StaffAttendanceStatus })));

            const results = await Promise.all(
              unmarkedOrNot.map((member) =>
                markStaffAttendance({
                  schoolId,
                  staffId: member.id,
                  date: selectedDate,
                  status: 'present',
                  markedBy: user.id!,
                  source: 'manual',
                })
              )
            );

            setBulkSaving(false);
            const failed = results.filter((r) => r.error).length;
            if (failed > 0) {
              setStaff(snapshot); // roll back all
              Alert.alert('Error', `Could not mark ${failed} staff member${failed > 1 ? 's' : ''}. Please try again.`);
            }
          },
        },
      ]
    );
  }, [staff, schoolId, selectedDate, user?.id]);

  const summary = useMemo(() => {
    const total = staff.length;
    const present = staff.filter((m) => m.attendance === 'present').length;
    const absent = staff.filter((m) => m.attendance === 'absent').length;
    const late = staff.filter((m) => m.attendance === 'late').length;
    const notMarked = staff.filter((m) => m.attendance === 'not-marked').length;
    return { total, present, absent, late, notMarked };
  }, [staff]);

  const renderStaffItem = ({ item }: { item: StaffRecord }) => {
    const isSaving = savingId === item.id;
    return (
      <View style={styles.staffCard}>
        <View style={styles.staffInfo}>
          <View style={styles.staffAvatar}>
            <Text style={styles.avatarText}>
              {item.full_name
                ? item.full_name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
                : 'NA'}
            </Text>
          </View>
          <View style={styles.staffMeta}>
            <Text style={styles.staffName} numberOfLines={1}>{item.full_name ?? 'Unknown'}</Text>
            <Text style={styles.staffRole}>{item.role.replace(/^(.)/, (m) => m.toUpperCase())}</Text>
          </View>
        </View>

        {/* P / A / L buttons */}
        <View style={styles.markGroup}>
          {isSaving ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ width: 108 }} />
          ) : (
            MARK_OPTIONS.map((opt) => {
              const active = item.attendance === opt.status;
              return (
                <TouchableOpacity
                  key={opt.status}
                  style={[
                    styles.markBtn,
                    { borderColor: opt.color },
                    active && { backgroundColor: opt.color },
                  ]}
                  onPress={() => handleMark(item, opt.status)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.markBtnText, { color: active ? COLORS.white : opt.color }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.navigate('/(dashboard)/more')} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Staff Attendance</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Date navigation */}
      <View style={styles.dateNav}>
        <TouchableOpacity
          style={styles.dateNavBtn}
          onPress={() => setSelectedDate((d) => addDays(d, -1))}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.dateNavCenter}>
          <Text style={styles.dateNavText}>{getDateLabel(selectedDate)}</Text>
          {isToday && <Text style={styles.dateNavToday}>Today</Text>}
        </View>
        <TouchableOpacity
          style={[styles.dateNavBtn, isToday && styles.dateNavBtnDisabled]}
          onPress={() => !isToday && setSelectedDate((d) => addDays(d, 1))}
          disabled={isToday}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={20} color={isToday ? COLORS.textLight : COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Present</Text>
          <Text style={[styles.summaryValue, { color: COLORS.success }]}>{summary.present}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Absent</Text>
          <Text style={[styles.summaryValue, { color: COLORS.error }]}>{summary.absent}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Late</Text>
          <Text style={[styles.summaryValue, { color: COLORS.warning }]}>{summary.late}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={[styles.summaryValue, { color: COLORS.textSecondary }]}>{summary.notMarked}</Text>
        </View>
      </View>

      {/* Mark All Present */}
      {staff.length > 0 && (
        <TouchableOpacity
          style={[styles.markAllBtn, bulkSaving && { opacity: 0.6 }]}
          onPress={handleMarkAllPresent}
          disabled={bulkSaving}
          activeOpacity={0.85}
        >
          {bulkSaving ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark-done" size={18} color={COLORS.white} />
              <Text style={styles.markAllText}>Mark All Present</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <FlatList
        data={staff}
        keyExtractor={(item) => item.id}
        renderItem={renderStaffItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No staff found</Text>
            <Text style={styles.emptyText}>Staff members from this school will appear here.</Text>
          </View>
        }
      />

      <View style={{ height: Math.max(insets.bottom, 16) }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // Date nav
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dateNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateNavBtnDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  dateNavCenter: {
    flex: 1,
    alignItems: 'center',
  },
  dateNavText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dateNavToday: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 1,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  summaryValue: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },

  // Mark all
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: COLORS.success,
    borderRadius: 14,
    paddingVertical: 13,
  },
  markAllText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  staffCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  staffInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  staffAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  staffMeta: {
    flex: 1,
  },
  staffName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  staffRole: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  // Mark buttons
  markGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  markBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  markBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },

  emptyState: {
    marginTop: 48,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
