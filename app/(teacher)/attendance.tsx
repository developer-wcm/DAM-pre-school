import { COLORS } from '@/constants/admissionTheme';
import { DEFAULT_SCHOOL_ID } from '@/constants/school';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type AttendanceStatus = 'present' | 'absent' | 'late' | null;

interface Student {
  id: string;
  full_name: string;
  roll_number: string | null;
  attendance: AttendanceStatus;
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatToday() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

const AVATAR_COLORS = ['#F5E6D8','#E8D8C8','#D8E8D8','#E8D8E8','#D8D8E8','#F0E8D8','#D8EEF5','#F5D8E6'];

export default function TeacherAttendanceScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [assignedClass, setAssignedClass] = useState('');
  const [alreadySaved, setAlreadySaved] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get teacher's assigned class
      const { data: profile } = await supabase
        .from('profiles')
        .select('assigned_class, assigned_section')
        .eq('id', user.id)
        .single();

      if (!profile?.assigned_class) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setAssignedClass(profile.assigned_class);

      // Fetch students in that class
      let query = supabase
        .from('students')
        .select('id, full_name, roll_number')
        .eq('class', profile.assigned_class)
        .order('full_name');

      if (profile.assigned_section) {
        query = query.eq('section', profile.assigned_section);
      }

      const { data: studentsData } = await query;
      const studentList = studentsData ?? [];

      // Check if attendance already saved for today
      const today = getTodayKey();
      const { data: existingRows } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('school_id', DEFAULT_SCHOOL_ID)
        .eq('date', today)
        .in('student_id', studentList.map((s: any) => s.id));

      const existingMap: Record<string, AttendanceStatus> = {};
      (existingRows ?? []).forEach((row: any) => {
        existingMap[row.student_id] = row.status as AttendanceStatus;
      });

      const hasSaved = Object.keys(existingMap).length > 0;
      setAlreadySaved(hasSaved);

      setStudents(studentList.map((s: any) => ({
        id: s.id,
        full_name: s.full_name,
        roll_number: s.roll_number,
        attendance: existingMap[s.id] ?? null,
      })));
    } catch (err) {
      console.error('Attendance load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function markAttendance(studentId: string, status: AttendanceStatus) {
    if (alreadySaved) return; // don't allow changes after saving
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? { ...s, attendance: s.attendance === status ? null : status }
          : s
      )
    );
  }

  function markAllPresent() {
    if (alreadySaved) return;
    setStudents((prev) => prev.map((s) => ({ ...s, attendance: 'present' })));
  }

  async function saveAttendance() {
    const unmarked = students.filter((s) => s.attendance === null);
    if (unmarked.length > 0) {
      Alert.alert(
        'Unmarked Students',
        `${unmarked.length} student(s) not marked. Mark all as absent?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, mark absent',
            onPress: () => {
              setStudents((prev) =>
                prev.map((s) => ({ ...s, attendance: s.attendance ?? 'absent' }))
              );
              doSave(students.map((s) => ({ ...s, attendance: s.attendance ?? 'absent' })));
            },
          },
        ]
      );
      return;
    }
    doSave(students);
  }

  async function doSave(studentList: Student[]) {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const today = getTodayKey();
      const rows = studentList.map((s) => ({
        school_id: DEFAULT_SCHOOL_ID,
        student_id: s.id,
        date: today,
        status: s.attendance === 'late' ? 'late' : s.attendance === 'absent' ? 'absent' : 'present',
        marked_by: user.id,
      }));

      const { error } = await supabase
        .from('attendance')
        .upsert(rows, { onConflict: 'student_id,date' });

      if (error) throw error;

      setAlreadySaved(true);
      Alert.alert('✅ Saved!', `Attendance for ${assignedClass} saved successfully.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  }

  const markedCount = students.filter((s) => s.attendance !== null).length;
  const presentCount = students.filter((s) => s.attendance === 'present').length;
  const absentCount = students.filter((s) => s.attendance === 'absent').length;
  const lateCount = students.filter((s) => s.attendance === 'late').length;

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading students...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            Attendance {assignedClass ? `— ${assignedClass}` : ''}
          </Text>
        </View>
        {!alreadySaved && students.length > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={markAllPresent} activeOpacity={0.7}>
            <Text style={styles.markAllText}>All P</Text>
          </TouchableOpacity>
        )}
        {alreadySaved && <View style={{ width: 60 }} />}
      </View>

      {/* Date */}
      <View style={styles.dateBar}>
        <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
        <Text style={styles.dateText}>{formatToday()}</Text>
        {alreadySaved && (
          <View style={styles.savedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
            <Text style={styles.savedBadgeText}>Saved</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      {students.length > 0 && (
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{markedCount}</Text>
            <Text style={styles.statLabel}>Marked</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: COLORS.success }]}>{presentCount}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: COLORS.error }]}>{absentCount}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: COLORS.warning }]}>{lateCount}</Text>
            <Text style={styles.statLabel}>Late</Text>
          </View>
        </View>
      )}

      {/* No class warning */}
      {!assignedClass && (
        <View style={styles.warningCard}>
          <Ionicons name="alert-circle" size={24} color={COLORS.warning} />
          <Text style={styles.warningText}>You haven't been assigned a class. Contact admin.</Text>
        </View>
      )}

      {/* Student list */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={COLORS.primary} />}
      >
        {students.length === 0 && assignedClass ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🏫</Text>
            <Text style={styles.emptyTitle}>No students in {assignedClass}</Text>
            <Text style={styles.emptyText}>Ask admin to upload student data.</Text>
          </View>
        ) : (
          students.map((student, index) => (
            <View key={student.id} style={[styles.studentCard, alreadySaved && styles.studentCardSaved]}>
              <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }]}>
                <Text style={styles.avatarText}>{getInitials(student.full_name)}</Text>
              </View>

              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{student.full_name}</Text>
                <Text style={styles.studentRoll}>{student.roll_number ?? 'No roll no.'}</Text>
              </View>

              <View style={styles.attendanceButtons}>
                {(['present', 'absent', 'late'] as AttendanceStatus[]).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.attendanceBtn,
                      student.attendance === status && {
                        backgroundColor:
                          status === 'present' ? COLORS.successLight :
                          status === 'absent' ? COLORS.errorLight : COLORS.warningLight,
                      },
                    ]}
                    onPress={() => markAttendance(student.id, status)}
                    activeOpacity={alreadySaved ? 1 : 0.7}
                    disabled={alreadySaved}
                  >
                    <Text style={[
                      styles.attendanceBtnText,
                      student.attendance === status && {
                        color:
                          status === 'present' ? COLORS.success :
                          status === 'absent' ? COLORS.error : COLORS.warning,
                        fontWeight: '800',
                      },
                    ]}>
                      {status === 'present' ? 'P' : status === 'absent' ? 'A' : 'L'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Save button */}
      {students.length > 0 && !alreadySaved && (
        <View style={styles.saveContainer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.7 }]}
            onPress={saveAttendance}
            disabled={saving}
            activeOpacity={0.9}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Ionicons name="save" size={20} color={COLORS.white} />
            )}
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Attendance'}
            </Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>{markedCount}/{students.length}</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {alreadySaved && (
        <View style={styles.saveContainer}>
          <View style={styles.savedBar}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.savedBarText}>Today's attendance already saved</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, backgroundColor: COLORS.background,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  markAllButton: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.successLight,
  },
  markAllText: { fontSize: 13, fontWeight: '700', color: COLORS.success },

  dateBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginBottom: 14,
  },
  dateText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, flex: 1 },
  savedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.successLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  savedBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.success },

  statsCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 16,
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statNumber: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  statDivider: { width: 1, height: 30, backgroundColor: COLORS.lightGray },

  warningCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, margin: 20,
    backgroundColor: COLORS.warningLight, borderRadius: 16, padding: 16,
  },
  warningText: { flex: 1, fontSize: 14, color: COLORS.warning, fontWeight: '600' },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, gap: 10 },

  emptyCard: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 32, alignItems: 'center', gap: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  emptyText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },

  studentCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 16, padding: 14, gap: 12,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  studentCardSaved: { opacity: 0.85 },
  avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  studentInfo: { flex: 1, gap: 2 },
  studentName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  studentRoll: { fontSize: 12, fontWeight: '500', color: COLORS.textSecondary },

  attendanceButtons: { flexDirection: 'row', gap: 6 },
  attendanceBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.lightGray,
    justifyContent: 'center', alignItems: 'center',
  },
  attendanceBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },

  saveContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20, backgroundColor: COLORS.background,
  },
  saveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: 50, padding: 18, gap: 10,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  saveBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 12,
  },
  saveBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.white },

  savedBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.successLight, borderRadius: 50, padding: 16,
  },
  savedBarText: { fontSize: 15, fontWeight: '700', color: COLORS.success },
});
