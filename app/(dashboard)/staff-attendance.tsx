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
import { toDateKey } from '../../lib/attendance';
import { supabase } from '../../lib/supabase';

type StaffAttendanceStatus = 'present' | 'absent' | 'late' | 'not-marked';

type StaffRecord = {
  id: string;
  full_name: string | null;
  role: string;
  attendance: StaffAttendanceStatus;
};

function getDateLabel(date: Date) {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getStatusLabel(status: StaffAttendanceStatus) {
  switch (status) {
    case 'present':
      return 'Present';
    case 'absent':
      return 'Absent';
    case 'late':
      return 'Late';
    default:
      return 'Not marked';
  }
}

function getStatusStyles(status: StaffAttendanceStatus) {
  switch (status) {
    case 'present':
      return { backgroundColor: COLORS.successLight, color: COLORS.success };
    case 'absent':
      return { backgroundColor: COLORS.errorLight, color: COLORS.error };
    case 'late':
      return { backgroundColor: COLORS.warningLight, color: COLORS.warning };
    default:
      return { backgroundColor: COLORS.lightGray, color: COLORS.textSecondary };
  }
}

export default function StaffAttendanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedDate] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [staff, setStaff] = useState<StaffRecord[]>([]);

  const selectedDateKey = toDateKey(selectedDate);

  const fetchStaffAttendance = useCallback(async () => {
    console.log('[StaffAttendance] Fetching for schoolId:', DEFAULT_SCHOOL_ID, 'date:', selectedDateKey);

    try {
      const [staffRes, attendanceRes] = await Promise.all([
        supabase.rpc('get_staff_profiles'),
        supabase
          .from('attendance')
          .select('student_id, status')
          .eq('school_id', DEFAULT_SCHOOL_ID)
          .eq('date', selectedDateKey),
      ]);

      console.log('[StaffAttendance] Staff response:', staffRes.data?.length, 'Attendance response:', attendanceRes.data?.length);
      console.log('[StaffAttendance] Errors - Staff:', staffRes.error, 'Attendance:', attendanceRes.error);

      if (staffRes.error) throw staffRes.error;
      if (attendanceRes.error) throw attendanceRes.error;

      const attendanceMap = new Map(
        (attendanceRes.data ?? []).map((record: { student_id: string; status: string }) => [
          record.student_id,
          record.status as StaffAttendanceStatus,
        ])
      );

      const nextStaff = (staffRes.data ?? [])
        .map((member: { id: string; full_name: string | null; role: string }) => ({
          id: member.id,
          full_name: member.full_name,
          role: member.role,
          attendance: attendanceMap.get(member.id) ?? 'not-marked',
        }));

      console.log('[StaffAttendance] Final staff list:', nextStaff);
      setStaff(nextStaff);
    } catch (error) {
      console.error('[StaffAttendance] Error loading staff attendance:', error);
      Alert.alert('Unable to load staff attendance', 'Please try again in a moment.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDateKey]);

  useEffect(() => {
    fetchStaffAttendance();
  }, [fetchStaffAttendance]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStaffAttendance();
  }, [fetchStaffAttendance]);

  const summary = useMemo(() => {
    const total = staff.length;
    const present = staff.filter((member) => member.attendance === 'present').length;
    const absent = staff.filter((member) => member.attendance === 'absent').length;
    const late = staff.filter((member) => member.attendance === 'late').length;
    const notMarked = staff.filter((member) => member.attendance === 'not-marked').length;
    return { total, present, absent, late, notMarked };
  }, [staff]);

  const renderStaffItem = ({ item }: { item: StaffRecord }) => {
    const statusStyles = getStatusStyles(item.attendance);
    return (
      <View style={styles.staffCard}>
        <View style={styles.staffInfo}>
          <View style={styles.staffAvatar}>
            <Text style={styles.avatarText}>
              {item.full_name ? item.full_name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() : 'NA'}
            </Text>
          </View>
          <View style={styles.staffMeta}>
            <Text style={styles.staffName}>{item.full_name ?? 'Unknown'}</Text>
            <Text style={styles.staffRole}>{item.role.replace(/^(.)/, (m) => m.toUpperCase())}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyles.backgroundColor }]}> 
          <Text style={[styles.statusText, { color: statusStyles.color }]}> {getStatusLabel(item.attendance)} </Text>
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Staff Attendance</Text>
          <Text style={styles.headerSubtitle}>{getDateLabel(selectedDate)}</Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Staff</Text>
          <Text style={styles.summaryValue}>{summary.total}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Present</Text>
          <Text style={[styles.summaryValue, { color: COLORS.success }]}>{summary.present}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Absent</Text>
          <Text style={[styles.summaryValue, { color: COLORS.error }]}>{summary.absent}</Text>
        </View>
      </View>

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
    paddingBottom: 16,
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
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  staffCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  staffMeta: {
    flex: 1,
  },
  staffName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  staffRole: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    minWidth: 96,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
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
