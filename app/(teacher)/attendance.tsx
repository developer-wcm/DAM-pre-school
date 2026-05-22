import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants/admissionTheme';

interface Student {
  id: string;
  name: string;
  rollNo: number;
  avatar: string;
  attendance: 'present' | 'absent' | 'late' | null;
  monthlyAttendance?: {
    date: number;
    status: 'present' | 'absent' | 'holiday' | 'late';
  }[];
  attendancePercentage?: number;
}

interface DayHeader {
  day: string;
  date: number;
  isToday?: boolean;
}

export default function TeacherAttendanceScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate] = useState('Thursday, 7 Feb 2026');
  const [selectedMonth] = useState('January 2026');
  const [selectedGroup, setSelectedGroup] = useState<'all' | 'playgroup' | 'nursery'>('all');
  
  const workingDays = 20;
  
  // Monthly grid data
  const dayHeaders: DayHeader[] = [
    { day: 'M', date: 1 },
    { day: 'T', date: 2 },
    { day: 'W', date: 3, isToday: true },
    { day: 'T', date: 4 },
  ];

  const [students, setStudents] = useState<Student[]>([
    { 
      id: '1', 
      name: 'Priya K.', 
      rollNo: 12, 
      avatar: '👧', 
      attendance: 'present',
      attendancePercentage: 95,
      monthlyAttendance: [
        { date: 1, status: 'present' },
        { date: 2, status: 'present' },
        { date: 3, status: 'present' },
        { date: 4, status: 'absent' },
      ]
    },
    { 
      id: '2', 
      name: 'Arjun S.', 
      rollNo: 13, 
      avatar: '👦', 
      attendance: 'absent',
      attendancePercentage: 58,
      monthlyAttendance: [
        { date: 1, status: 'present' },
        { date: 2, status: 'absent' },
        { date: 3, status: 'absent' },
        { date: 4, status: 'absent' },
      ]
    },
    { 
      id: '3', 
      name: 'Sofia R.', 
      rollNo: 14, 
      avatar: '👧', 
      attendance: null,
      attendancePercentage: 82,
      monthlyAttendance: [
        { date: 1, status: 'present' },
        { date: 2, status: 'present' },
        { date: 3, status: 'present' },
        { date: 4, status: 'present' },
      ]
    },
    { 
      id: '4', 
      name: 'Liam O.', 
      rollNo: 15, 
      avatar: '👦', 
      attendance: 'present',
      attendancePercentage: 100,
      monthlyAttendance: [
        { date: 1, status: 'present' },
        { date: 2, status: 'present' },
        { date: 3, status: 'present' },
        { date: 4, status: 'present' },
      ]
    },
    { 
      id: '5', 
      name: 'Noah E.', 
      rollNo: 16, 
      avatar: '👦', 
      attendance: 'present',
      attendancePercentage: 40,
      monthlyAttendance: [
        { date: 1, status: 'absent' },
        { date: 2, status: 'absent' },
        { date: 3, status: 'absent' },
        { date: 4, status: 'absent' },
      ]
    },
  ]);

  const markedCount = students.filter(s => s.attendance !== null).length;
  const presentCount = students.filter(s => s.attendance === 'present').length;
  const absentCount = students.filter(s => s.attendance === 'absent').length;

  const markAttendance = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setStudents(prev => prev.map(student => 
      student.id === studentId 
        ? { ...student, attendance: student.attendance === status ? null : status }
        : student
    ));
  };

  const markAllPresent = () => {
    setStudents(prev => prev.map(student => ({ ...student, attendance: 'present' as const })));
  };

  const getAttendanceColor = (status: string | null) => {
    switch (status) {
      case 'present': return COLORS.success;
      case 'absent': return COLORS.error;
      case 'late': return COLORS.warning;
      default: return COLORS.lightGray;
    }
  };

  const getAttendanceBg = (status: string | null) => {
    switch (status) {
      case 'present': return COLORS.successLight;
      case 'absent': return COLORS.errorLight;
      case 'late': return COLORS.warningLight;
      default: return COLORS.lightGray;
    }
  };

  const getMonthlyStatusColor = (status: string) => {
    switch (status) {
      case 'present': return COLORS.success;
      case 'absent': return COLORS.error;
      case 'holiday': return '#60A5FA';
      case 'late': return COLORS.warning;
      default: return COLORS.lightGray;
    }
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return COLORS.success;
    if (percentage >= 75) return COLORS.secondary;
    if (percentage >= 50) return COLORS.warning;
    return COLORS.error;
  };

  const getPresentCountForDay = (date: number) => {
    return students.filter(s => 
      s.monthlyAttendance?.find(a => a.date === date && a.status === 'present')
    ).length;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Attendance — Junior KG</Text>
        </View>
        <TouchableOpacity style={styles.markAllButton} onPress={markAllPresent} activeOpacity={0.7}>
          <Text style={styles.markAllText}>Mark All P</Text>
        </TouchableOpacity>
      </View>

      {/* View Mode Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[styles.toggleButton, viewMode === 'daily' && styles.toggleButtonActive]}
          onPress={() => setViewMode('daily')}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, viewMode === 'daily' && styles.toggleTextActive]}>
            Daily
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleButton, viewMode === 'monthly' && styles.toggleButtonActive]}
          onPress={() => setViewMode('monthly')}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, viewMode === 'monthly' && styles.toggleTextActive]}>
            Monthly Grid
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'daily' ? (
        <>
          {/* Date Selector */}
          <View style={styles.dateSelector}>
            <TouchableOpacity style={styles.dateArrow} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.dateText}>{selectedDate}</Text>
            <TouchableOpacity style={styles.dateArrow} activeOpacity={0.7}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Stats Card */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Marked: {markedCount}/{students.length}</Text>
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
          </View>

          {/* Student List */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {students.map((student) => (
              <View key={student.id} style={styles.studentCard}>
                <View style={styles.studentLeft}>
                  <View style={styles.studentAvatar}>
                    <Text style={styles.avatarEmoji}>{student.avatar}</Text>
                    {student.attendance === 'absent' && (
                      <View style={styles.absentIndicator}>
                        <View style={styles.absentDot} />
                      </View>
                    )}
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentRoll}>Roll no. {student.rollNo}</Text>
                    {student.attendance === 'absent' && (
                      <Text style={styles.absentLabel}>● Absent</Text>
                    )}
                  </View>
                </View>

                <View style={styles.attendanceButtons}>
                  <TouchableOpacity 
                    style={[
                      styles.attendanceBtn,
                      student.attendance === 'present' && { backgroundColor: getAttendanceBg('present') }
                    ]}
                    onPress={() => markAttendance(student.id, 'present')}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.attendanceBtnText,
                      student.attendance === 'present' && { color: getAttendanceColor('present'), fontWeight: '700' }
                    ]}>
                      P
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[
                      styles.attendanceBtn,
                      student.attendance === 'absent' && { backgroundColor: getAttendanceBg('absent') }
                    ]}
                    onPress={() => markAttendance(student.id, 'absent')}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.attendanceBtnText,
                      student.attendance === 'absent' && { color: getAttendanceColor('absent'), fontWeight: '700' }
                    ]}>
                      A
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[
                      styles.attendanceBtn,
                      student.attendance === 'late' && { backgroundColor: getAttendanceBg('late') }
                    ]}
                    onPress={() => markAttendance(student.id, 'late')}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.attendanceBtnText,
                      student.attendance === 'late' && { color: getAttendanceColor('late'), fontWeight: '700' }
                    ]}>
                      L
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Save Button */}
          <View style={styles.saveContainer}>
            <TouchableOpacity style={styles.saveButton} activeOpacity={0.9}>
              <Text style={styles.saveButtonText}>Save Attendance</Text>
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>{markedCount}/{students.length} marked</Text>
              </View>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          {/* Monthly View */}
          {/* Month Selector */}
          <View style={styles.dateSelector}>
            <TouchableOpacity style={styles.dateArrow} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <View style={styles.monthInfo}>
              <Text style={styles.dateText}>{selectedMonth}</Text>
              <Text style={styles.workingDaysText}>{workingDays} working days</Text>
            </View>
            <TouchableOpacity style={styles.dateArrow} activeOpacity={0.7}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Group Filter */}
          <View style={styles.groupFilter}>
            <TouchableOpacity 
              style={[styles.groupButton, selectedGroup === 'all' && styles.groupButtonActive]}
              onPress={() => setSelectedGroup('all')}
              activeOpacity={0.8}
            >
              <Text style={[styles.groupText, selectedGroup === 'all' && styles.groupTextActive]}>
                All Students
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.groupButton, selectedGroup === 'playgroup' && styles.groupButtonActive]}
              onPress={() => setSelectedGroup('playgroup')}
              activeOpacity={0.8}
            >
              <Text style={[styles.groupText, selectedGroup === 'playgroup' && styles.groupTextActive]}>
                Play Group
              </Text>
            </TouchableOpacity>
          </View>

          {/* Attendance Grid */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.gridScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.gridCard}>
              {/* Grid Header */}
              <View style={styles.gridHeader}>
                <Text style={styles.gridHeaderLabel}>STUDENT</Text>
                {dayHeaders.map((day) => (
                  <View key={day.date} style={styles.dayColumn}>
                    <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>
                      {day.day}
                    </Text>
                    <Text style={[styles.dateLabel, day.isToday && styles.dateLabelToday]}>
                      {day.date.toString().padStart(2, '0')}
                    </Text>
                  </View>
                ))}
                <Text style={styles.percentLabel}>%</Text>
              </View>

              {/* Student Rows */}
              {students.map((student) => (
                <View key={student.id} style={styles.gridRow}>
                  <View style={styles.gridStudentInfo}>
                    <View style={styles.gridAvatar}>
                      <Text style={styles.gridAvatarEmoji}>{student.avatar}</Text>
                    </View>
                    <Text style={styles.gridStudentName}>{student.name}</Text>
                  </View>

                  {dayHeaders.map((day) => {
                    const dayAttendance = student.monthlyAttendance?.find(a => a.date === day.date);
                    return (
                      <View key={day.date} style={styles.dayColumn}>
                        <View style={[
                          styles.statusDot,
                          { backgroundColor: getMonthlyStatusColor(dayAttendance?.status || 'absent') }
                        ]} />
                      </View>
                    );
                  })}

                  <View style={styles.percentColumn}>
                    <View style={[
                      styles.percentBadge,
                      { backgroundColor: getPercentageColor(student.attendancePercentage || 0) }
                    ]}>
                      <Text style={styles.percentText}>{student.attendancePercentage}%</Text>
                    </View>
                  </View>
                </View>
              ))}

              {/* Summary Row */}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>PRESENT</Text>
                {dayHeaders.map((day) => (
                  <View key={day.date} style={styles.dayColumn}>
                    <Text style={[styles.summaryValue, day.isToday && styles.summaryValueToday]}>
                      {getPresentCountForDay(day.date)}
                    </Text>
                  </View>
                ))}
                <View style={styles.percentColumn}>
                  <Text style={styles.summaryTotal}>5</Text>
                </View>
              </View>
            </View>

            {/* Legend */}
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
                <View style={[styles.legendDot, { backgroundColor: '#60A5FA' }]} />
                <Text style={styles.legendText}>Holiday</Text>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.successLight,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
  },

  // Toggle
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
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

  // Date Selector
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dateArrow: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },

  // Stats Card
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
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

  // Student List
  scrollView: {
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
  avatarEmoji: {
    fontSize: 24,
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

  // Attendance Buttons
  attendanceButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  attendanceBtn: {
    width: 36,
    height: 36,
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

  // Save Button
  saveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.background,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    padding: 18,
    gap: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
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

  // Monthly Grid Styles
  monthInfo: {
    alignItems: 'center',
    gap: 4,
  },
  workingDaysText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  groupFilter: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  groupButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  groupButtonActive: {
    backgroundColor: COLORS.primary,
  },
  groupText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  groupTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  gridScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  gridCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
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
    marginBottom: 12,
  },
  gridHeaderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textLight,
    letterSpacing: 0.5,
    width: 100,
  },
  dayColumn: {
    width: 50,
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
    letterSpacing: 0.5,
    width: 50,
    textAlign: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  gridStudentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
    gap: 8,
  },
  gridAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridAvatarEmoji: {
    fontSize: 16,
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
    width: 50,
    alignItems: 'center',
  },
  percentBadge: {
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
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: COLORS.lightGray,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    width: 100,
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
});
