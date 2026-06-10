import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AttendanceDatePickerModal from '../../components/AttendanceDatePickerModal';
import { COLORS } from '../../constants/admissionTheme';
import { DEFAULT_SCHOOL_ID } from '../../constants/school';
import { useAuth } from '../../context/auth';
import {
  addMonths as shiftMonths,
  AttendanceRecordStatus,
  buildCalendarDays,
  DailyMarkStatus,
  getMonthEnd,
  getMonthLabel,
  getMonthStart,
  mapFriendlyAttendanceError,
  metricsFromCalendarMonth,
  toDailyMarkStatus,
  toDateKey,
} from '../../lib/attendance';
import { supabase } from '../../lib/supabase';

type ClassCode = 'PG' | 'PKG' | 'JKG' | 'SKG';
type ClassFilterId = 'all' | ClassCode;
type DailyStatus = DailyMarkStatus | null;
type AttendanceStatus = AttendanceRecordStatus;

interface StudentRow {
  id: string;
  full_name: string;
  roll_number: string | null;
  class: string;
}

interface AttendanceRow {
  student_id: string;
  date: string;
  status: AttendanceStatus;
}

interface Student {
  id: string;
  name: string;
  rollNo: string | null;
  initials: string;
  attendance: DailyStatus;
  class: ClassCode | null;
  monthlyAttendance: {
    date: number;
    status: AttendanceStatus;
  }[];
  attendancePercentage: number;
}

interface DayHeader {
  day: string;
  date: number;
  dateKey: string;
  isToday?: boolean;
}

const CLASS_FILTERS: { id: ClassFilterId; label: string }[] = [
  { id: 'all', label: 'All Students' },
  { id: 'PG', label: 'Play Group' },
  { id: 'PKG', label: 'Pre-KG' },
  { id: 'JKG', label: 'Junior KG' },
  { id: 'SKG', label: 'Senior KG' },
];

const SAVE_BAR_CONTENT_HEIGHT = 64;

function getDateLabel(date: Date) {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function addDays(date: Date, delta: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + delta);
  return next;
}

function normalizeClass(classId: string): ClassCode | null {
  return CLASS_FILTERS.some((filter) => filter.id === classId && filter.id !== 'all')
    ? (classId as ClassCode)
    : null;
}

export default function AttendanceScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const schoolId = DEFAULT_SCHOOL_ID;
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [focusDate, setFocusDate] = useState(() => new Date());
  const [selectedGroup, setSelectedGroup] = useState<ClassFilterId>('all');
  const selectedDate = useMemo(() => toDateKey(focusDate), [focusDate]);
  const selectedMonth = useMemo(() => getMonthStart(focusDate), [focusDate]);
  const saveBarBottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 20 : 16);
  const saveBarTotalHeight = SAVE_BAR_CONTENT_HEIGHT + saveBarBottomInset + 12;
  const [students, setStudents] = useState<Student[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState<Record<string, DailyStatus | null>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const dayHeaders = useMemo<DayHeader[]>(() => {
    const monthEnd = getMonthEnd(selectedMonth);
    const days: DayHeader[] = [];

    for (let day = 1; day <= monthEnd.getDate(); day += 1) {
      const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
      days.push({
        day: date.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 1),
        date: day,
        dateKey: toDateKey(date),
        isToday: toDateKey(date) === todayKey,
      });
    }

    return days;
  }, [selectedMonth, todayKey]);

  const workingDays = useMemo(
    () =>
      dayHeaders.filter((day) => {
        const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day.date);
        return date.getDay() !== 0 && date.getDay() !== 6;
      }).length,
    [dayHeaders, selectedMonth]
  );

  const fetchAttendanceData = useCallback(async () => {
    try {
      const monthStart = toDateKey(selectedMonth);
      const monthEnd = toDateKey(getMonthEnd(selectedMonth));

      const [studentsRpcRes, attendanceRpcRes] = await Promise.all([
        supabase.rpc('get_student_profiles'),
        supabase.rpc('get_student_attendance_range', {
          p_start_date: monthStart,
          p_end_date: monthEnd,
        }),
      ]);

      const studentsRes = studentsRpcRes.error
        ? await supabase
          .from('students')
          .select('id, full_name, roll_number, class')
          .eq('status', 'active')
          .order('class', { ascending: true })
          .order('roll_number', { ascending: true })
        : studentsRpcRes;

      const attendanceRes = attendanceRpcRes.error
        ? await supabase
          .from('attendance')
          .select('student_id, date, status')
          .gte('date', monthStart)
          .lte('date', monthEnd)
        : attendanceRpcRes;

      if (studentsRpcRes.error) {
        console.warn('[Attendance] Student RPC unavailable, falling back to students query:', studentsRpcRes.error.message);
      }

      if (attendanceRpcRes.error) {
        console.warn('[Attendance] Attendance RPC unavailable, falling back to attendance query:', attendanceRpcRes.error.message);
      }

      if (studentsRes.error) throw studentsRes.error;
      if (attendanceRes.error) throw attendanceRes.error;

      const recordsByStudent = new Map<string, AttendanceRow[]>();
      ((attendanceRes.data ?? []) as AttendanceRow[]).forEach((record) => {
        const records = recordsByStudent.get(record.student_id) ?? [];
        records.push(record);
        recordsByStudent.set(record.student_id, records);
      });

      const nextStudents = ((studentsRes.data ?? []) as StudentRow[]).map((student) => {
        const records = recordsByStudent.get(student.id) ?? [];
        const todayRecord = records.find((record) => record.date === selectedDate);
        const recordsByDate = new Map<string, AttendanceRecordStatus>();
        records.forEach((record) => {
          recordsByDate.set(record.date, record.status as AttendanceRecordStatus);
        });
        const monthDays = buildCalendarDays(selectedMonth, recordsByDate);
        const monthMetrics = metricsFromCalendarMonth(selectedMonth, monthDays);
        const studentClass = normalizeClass(student.class);

        return {
          id: student.id,
          name: student.full_name,
          rollNo: student.roll_number,
          initials: getInitials(student.full_name),
          attendance: toDailyMarkStatus(todayRecord?.status),
          class: studentClass,
          monthlyAttendance: records.map((record) => ({
            date: Number(record.date.slice(8, 10)),
            status: record.status,
          })),
          attendancePercentage: monthMetrics.attendancePct,
        };
      });

      setStudents(nextStudents);
      setSavedSnapshot(
        Object.fromEntries(nextStudents.map((student) => [student.id, student.attendance]))
      );
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      Alert.alert('Unable to load attendance', 'Please try again in a moment.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [schoolId, selectedDate, selectedMonth]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        fetchAttendanceData();
      }
    }, [fetchAttendanceData, loading])
  );

  const filteredStudents = useMemo(
    () => (selectedGroup === 'all' ? students : students.filter((student) => student.class === selectedGroup)),
    [selectedGroup, students]
  );

  const hasPendingChanges = useMemo(() => {
    if (viewMode !== 'daily') return false;
    return filteredStudents.some(
      (student) => (savedSnapshot[student.id] ?? null) !== student.attendance
    );
  }, [filteredStudents, savedSnapshot, viewMode]);

  const pendingChangeCount = useMemo(() => {
    return filteredStudents.filter(
      (student) => (savedSnapshot[student.id] ?? null) !== student.attendance
    ).length;
  }, [filteredStudents, savedSnapshot]);

  const runWithDiscardCheck = (action: () => void) => {
    if (!hasPendingChanges) {
      action();
      return;
    }

    Alert.alert(
      'Unsaved attendance',
      'You have unsaved changes. Discard them and continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: action },
      ]
    );
  };

  const goToPreviousPeriod = () => {
    runWithDiscardCheck(() => {
      setFocusDate((current) => (viewMode === 'daily' ? addDays(current, -1) : shiftMonths(current, -1)));
    });
  };

  const goToNextPeriod = () => {
    runWithDiscardCheck(() => {
      setFocusDate((current) => (viewMode === 'daily' ? addDays(current, 1) : shiftMonths(current, 1)));
    });
  };

  const applyFocusDate = (date: Date) => {
    runWithDiscardCheck(() => setFocusDate(date));
  };

  const switchViewMode = (mode: 'daily' | 'monthly') => {
    if (mode === viewMode) return;
    if (viewMode === 'daily' && hasPendingChanges) {
      runWithDiscardCheck(() => setViewMode(mode));
      return;
    }
    setViewMode(mode);
  };

  const classCounts = useMemo(() => {
    return students.reduce<Record<ClassFilterId, number>>(
      (counts, student) => {
        counts.all += 1;
        if (student.class) {
          counts[student.class] += 1;
        }
        return counts;
      },
      { all: 0, PG: 0, PKG: 0, JKG: 0, SKG: 0 }
    );
  }, [students]);

  const markedCount = filteredStudents.filter((student) => student.attendance !== null).length;
  const presentCount = filteredStudents.filter((student) => student.attendance === 'present').length;
  const absentCount = filteredStudents.filter((student) => student.attendance === 'absent').length;
  const lateCount = filteredStudents.filter((student) => student.attendance === 'late').length;

  const markAttendance = (studentId: string, status: Exclude<DailyStatus, null>) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId
          ? { ...student, attendance: student.attendance === status ? null : status }
          : student
      )
    );
  };

  const markAllPresent = () => {
    const filteredIds = new Set(filteredStudents.map((student) => student.id));
    setStudents((prev) =>
      prev.map((student) => (filteredIds.has(student.id) ? { ...student, attendance: 'present' } : student))
    );
  };

  const saveAttendance = async () => {
    if (!profile?.id || saving || !hasPendingChanges) return;

    const changedStudents = filteredStudents.filter(
      (student) => (savedSnapshot[student.id] ?? null) !== student.attendance
    );

    const toUpsert = changedStudents.filter((student) => student.attendance !== null);
    const toClearIds = changedStudents
      .filter((student) => student.attendance === null)
      .map((student) => student.id);

    if (toUpsert.length === 0 && toClearIds.length === 0) return;

    setSaving(true);

    try {
      if (toUpsert.length > 0) {
        const { error: upsertError } = await supabase.from('attendance').upsert(
          toUpsert.map((student) => ({
            school_id: schoolId,
            student_id: student.id,
            date: selectedDate,
            status: student.attendance,
            marked_by: profile.id,
          })),
          { onConflict: 'student_id,date' }
        );
        if (upsertError) throw upsertError;
      }

      if (toClearIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('attendance')
          .delete()
          .eq('date', selectedDate)
          .in('student_id', toClearIds);
        if (deleteError) throw deleteError;
      }

      const nextSnapshot = { ...savedSnapshot };
      changedStudents.forEach((student) => {
        nextSnapshot[student.id] = student.attendance;
      });
      setSavedSnapshot(nextSnapshot);
      Alert.alert('Saved', 'Attendance has been updated.');
      fetchAttendanceData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      Alert.alert('Unable to save attendance', mapFriendlyAttendanceError(message));
    } finally {
      setSaving(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  const getAttendanceColor = (status: DailyStatus) => {
    switch (status) {
      case 'present':
        return COLORS.success;
      case 'absent':
        return COLORS.error;
      case 'late':
        return COLORS.warning;
      default:
        return COLORS.lightGray;
    }
  };

  const getAttendanceBg = (status: DailyStatus) => {
    switch (status) {
      case 'present':
        return COLORS.successLight;
      case 'absent':
        return COLORS.errorLight;
      case 'late':
        return COLORS.warningLight;
      default:
        return COLORS.lightGray;
    }
  };

  const getMonthlyStatusColor = (status?: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return COLORS.success;
      case 'absent':
      case 'sick-leave':
        return COLORS.error;
      case 'holiday':
      case 'excused':
        return '#60A5FA';
      case 'late':
      case 'half-day':
        return COLORS.warning;
      default:
        return COLORS.lightGray;
    }
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return COLORS.success;
    if (percentage >= 75) return COLORS.secondary;
    if (percentage >= 50) return COLORS.warning;
    return COLORS.error;
  };

  const getPresentCountForDay = (date: number) => {
    return filteredStudents.filter((student) =>
      student.monthlyAttendance.find(
        (attendance) => attendance.date === date && attendance.status === 'present'
      )
    ).length;
  };


  const renderDateNavigator = () => (
    <View style={styles.dateSelector}>
      <TouchableOpacity
        style={styles.dateArrow}
        onPress={goToPreviousPeriod}
        activeOpacity={0.7}
        accessibilityLabel={viewMode === 'daily' ? 'Previous day' : 'Previous month'}
      >
        <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.dateCenter}
        onPress={() => setDatePickerVisible(true)}
        activeOpacity={0.85}
        accessibilityLabel="Open date picker"
      >
        {viewMode === 'daily' ? (
          <>
            <Text style={styles.dateText} numberOfLines={2}>
              {getDateLabel(focusDate)}
            </Text>
            <View style={styles.dateCenterHint}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
              <Text style={styles.dateCenterHintText}>Tap to pick date</Text>
              <Ionicons name="chevron-down" size={14} color={COLORS.textLight} />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.dateText}>{getMonthLabel(selectedMonth)}</Text>
            <Text style={styles.workingDaysText}>{workingDays} working days</Text>
            <View style={styles.dateCenterHint}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
              <Text style={styles.dateCenterHintText}>Tap to pick month</Text>
              <Ionicons name="chevron-down" size={14} color={COLORS.textLight} />
            </View>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.dateArrow}
        onPress={goToNextPeriod}
        activeOpacity={0.7}
        accessibilityLabel={viewMode === 'daily' ? 'Next day' : 'Next month'}
      >
        <Ionicons name="chevron-forward" size={20} color={COLORS.textPrimary} />
      </TouchableOpacity>
    </View>
  );

  const renderSaveBar = () => {
    if (!hasPendingChanges) return null;

    return (
      <View
        style={[
          styles.saveContainer,
          {
            paddingBottom: saveBarBottomInset,
            bottom: tabBarHeight > 0 ? tabBarHeight : 0,
          },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={saveAttendance}
          activeOpacity={0.9}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Ionicons name="cloud-upload-outline" size={22} color={COLORS.white} />
          )}
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Attendance'}
          </Text>
          <View style={styles.saveBadge}>
            <Text style={styles.saveBadgeText}>
              {pendingChangeCount} change{pendingChangeCount === 1 ? '' : 's'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderClassFilter = ({ id, label }: { id: ClassFilterId; label: string }) => {
    const active = selectedGroup === id;

    return (
      <TouchableOpacity
        key={id}
        style={[styles.groupChip, active && styles.groupChipActive]}
        onPress={() => setSelectedGroup(id)}
        activeOpacity={0.85}
      >
        <Text style={[styles.groupChipText, active && styles.groupChipTextActive]}>{label}</Text>
        <View style={[styles.groupChipCount, active && styles.groupChipCountActive]}>
          <Text style={[styles.groupChipCountText, active && styles.groupChipCountTextActive]}>
            {classCounts[id]}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStudentCard = ({ item: student }: { item: Student }) => (
    <View style={styles.studentCard}>
      <View style={styles.studentLeft}>
        <View style={styles.studentAvatar}>
          <Text style={styles.avatarText}>{student.initials}</Text>
          {student.attendance === 'absent' && (
            <View style={styles.absentIndicator}>
              <View style={styles.absentDot} />
            </View>
          )}
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName} numberOfLines={1}>
            {student.name}
          </Text>
          <Text style={styles.studentRoll}>
            {student.rollNo ? `Roll no. ${student.rollNo}` : student.class ?? 'Unassigned class'}
          </Text>
          {student.attendance === 'absent' && <Text style={styles.absentLabel}>Absent</Text>}
        </View>
      </View>

      <View style={styles.attendanceButtons}>
        {(['present', 'absent', 'late'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.attendanceBtn,
              student.attendance === status && { backgroundColor: getAttendanceBg(status) },
            ]}
            onPress={() => markAttendance(student.id, status)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.attendanceBtnText,
                student.attendance === status && {
                  color: getAttendanceColor(status),
                  fontWeight: '700',
                },
              ]}
            >
              {status[0].toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Attendance</Text>
          <Text style={styles.headerSub}>{getDateLabel(focusDate)}</Text>
        </View>
        <TouchableOpacity style={styles.markAllButton} onPress={markAllPresent} activeOpacity={0.7}>
          <Text style={styles.markAllText}>Mark All P</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'daily' && styles.toggleButtonActive]}
          onPress={() => switchViewMode('daily')}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, viewMode === 'daily' && styles.toggleTextActive]}>Daily</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'monthly' && styles.toggleButtonActive]}
          onPress={() => switchViewMode('monthly')}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, viewMode === 'monthly' && styles.toggleTextActive]}>
            Monthly Grid
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'daily' ? (
        <View style={styles.dailyBody}>
          {renderDateNavigator()}

          <View style={styles.groupFilterWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.groupFilter}
            >
              {CLASS_FILTERS.map(renderClassFilter)}
            </ScrollView>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>
                Marked: {markedCount}/{filteredStudents.length}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBadge}>
              <View style={[styles.statDot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.statValue}>P: {presentCount}</Text>
            </View>
            <View style={styles.statBadge}>
              <View style={[styles.statDot, { backgroundColor: COLORS.error }]} />
              <Text style={styles.statValue}>A: {absentCount}</Text>
            </View>
            <View style={styles.statBadge}>
              <View style={[styles.statDot, { backgroundColor: COLORS.warning }]} />
              <Text style={styles.statValue}>L: {lateCount}</Text>
            </View>
          </View>

          <FlatList
            data={filteredStudents}
            keyExtractor={(student) => student.id}
            renderItem={renderStudentCard}
            style={styles.list}
            contentContainerStyle={[
              styles.scrollContent,
              hasPendingChanges && {
                paddingBottom: saveBarTotalHeight + (tabBarHeight > 0 ? tabBarHeight : 0),
              },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No students found</Text>
                <Text style={styles.emptyText}>Active students from this school will appear here.</Text>
              </View>
            }
          />

          {renderSaveBar()}
        </View>
      ) : (
        <>
          {renderDateNavigator()}

          <View style={styles.groupFilterWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.groupFilter}
            >
              {CLASS_FILTERS.map(renderClassFilter)}
            </ScrollView>
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.gridScrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.gridCard}>
                <View style={styles.gridHeader}>
                  <Text style={styles.gridHeaderLabel}>STUDENT</Text>
                  {dayHeaders.map((day) => (
                    <View key={day.dateKey} style={styles.dayColumn}>
                      <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>{day.day}</Text>
                      <Text style={[styles.dateLabel, day.isToday && styles.dateLabelToday]}>
                        {day.date.toString().padStart(2, '0')}
                      </Text>
                    </View>
                  ))}
                  <Text style={styles.percentLabel}>%</Text>
                </View>

                {filteredStudents.map((student) => (
                  <View key={student.id} style={styles.gridRow}>
                    <View style={styles.gridStudentInfo}>
                      <View style={styles.gridAvatar}>
                        <Text style={styles.gridAvatarText}>{student.initials}</Text>
                      </View>
                      <Text style={styles.gridStudentName} numberOfLines={1}>
                        {student.name}
                      </Text>
                    </View>

                    {dayHeaders.map((day) => {
                      const dayAttendance = student.monthlyAttendance.find(
                        (attendance) => attendance.date === day.date
                      );
                      return (
                        <View key={day.dateKey} style={styles.dayColumn}>
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: getMonthlyStatusColor(dayAttendance?.status) },
                            ]}
                          />
                        </View>
                      );
                    })}

                    <View style={styles.percentColumn}>
                      <View
                        style={[
                          styles.percentBadge,
                          { backgroundColor: getPercentageColor(student.attendancePercentage) },
                        ]}
                      >
                        <Text style={styles.percentText}>{student.attendancePercentage}%</Text>
                      </View>
                    </View>
                  </View>
                ))}

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>PRESENT</Text>
                  {dayHeaders.map((day) => (
                    <View key={day.dateKey} style={styles.dayColumn}>
                      <Text style={[styles.summaryValue, day.isToday && styles.summaryValueToday]}>
                        {getPresentCountForDay(day.date)}
                      </Text>
                    </View>
                  ))}
                  <View style={styles.percentColumn}>
                    <Text style={styles.summaryTotal}>{filteredStudents.length}</Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {filteredStudents.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No students in this class</Text>
                <Text style={styles.emptyText}>Choose another class to review monthly attendance.</Text>
              </View>
            )}

            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
                <Text style={styles.legendText}>Present</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.error }]} />
                <Text style={styles.legendText}>Absent</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
                <Text style={styles.legendText}>Late</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#60A5FA' }]} />
                <Text style={styles.legendText}>Holiday</Text>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </>
      )}

      <AttendanceDatePickerModal
        visible={datePickerVisible}
        mode={viewMode}
        focusDate={focusDate}
        onClose={() => setDatePickerVisible(false)}
        onApply={applyFocusDate}
      />
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
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSub: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.successLight,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.success,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: COLORS.white,
    borderRadius: 50,
    padding: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 50,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  toggleTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  dailyBody: {
    flex: 1,
    position: 'relative',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dateArrow: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  dateCenterHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dateCenterHintText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 12,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  list: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  studentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  absentIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  absentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.error,
  },
  studentInfo: {
    flex: 1,
    gap: 2,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  studentRoll: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textLight,
  },
  absentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.error,
  },
  attendanceButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  attendanceBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendanceBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  saveContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingTop: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 24,
    zIndex: 100,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
    minHeight: SAVE_BAR_CONTENT_HEIGHT,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  saveButtonDisabled: {
    opacity: 0.65,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  saveBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  saveBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  monthInfo: {
    alignItems: 'center',
    gap: 4,
  },
  workingDaysText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  groupFilterWrap: {
    marginBottom: 12,
  },
  groupFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  groupChip: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  groupChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },
  groupChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  groupChipTextActive: {
    color: COLORS.white,
  },
  groupChipCount: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
  },
  groupChipCountActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  groupChipCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  groupChipCountTextActive: {
    color: COLORS.white,
  },
  gridScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  gridCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  gridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    marginBottom: 8,
  },
  gridHeaderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textLight,
    width: 132,
  },
  dayColumn: {
    width: 42,
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  dayLabelToday: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dateLabelToday: {
    color: COLORS.primary,
  },
  percentLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textLight,
    width: 56,
    textAlign: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  gridStudentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 132,
    gap: 8,
    paddingRight: 8,
  },
  gridAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridAvatarText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  gridStudentName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  percentColumn: {
    width: 56,
    alignItems: 'center',
  },
  percentBadge: {
    minWidth: 40,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  percentText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: COLORS.lightGray,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    width: 132,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  summaryValueToday: {
    color: COLORS.primary,
  },
  summaryTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textLight,
    textAlign: 'center',
  },
});
