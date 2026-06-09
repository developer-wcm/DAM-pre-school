import { COLORS } from '@/constants/admissionTheme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────
type AttendanceStatus = 'present' | 'absent' | 'late' | null;

type Student = {
  id: string;
  full_name: string;
  roll_number: string | null;
  class: string;
  section: string | null;
  attendance: AttendanceStatus;
};

type TeacherProfile = {
  id: string;
  full_name: string;
  assigned_class: string | null;
  assigned_section: string | null;
};

// ─── Quick Remarks ────────────────────────────────────────────────────────────
const QUICK_REMARKS = [
  { label: '💅 Nails not cut',    value: "Please ensure your child's nails are trimmed properly." },
  { label: '🧦 Dirty socks',      value: "Your child's socks were not clean today. Please check uniform hygiene." },
  { label: '😢 Cried today',      value: 'Your child was a bit upset today. Please check in with them at home.' },
  { label: '📚 Homework missing', value: 'Your child did not complete their homework today.' },
  { label: '🌟 Great behaviour',  value: 'Your child showed excellent behaviour today. Well done!' },
  { label: '🍱 No lunch box',     value: 'Your child did not bring a lunch box today. Please ensure they eat properly.' },
  { label: '🤒 Feeling unwell',   value: 'Your child appeared unwell today. Please monitor their health.' },
  { label: '👍 Good progress',    value: 'Your child is making great progress. Keep encouraging them!' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const AVATAR_COLORS = [
  '#F5E6D8', '#E8D8C8', '#D8E8D8', '#E8D8E8',
  '#D8D8E8', '#F0E8D8', '#D8EEF5', '#F5D8E6',
];

function CircularProgress({ percent }: { percent: number }) {
  return (
    <View style={styles.circleOuter}>
      <View style={styles.circleInner}>
        <Text style={styles.circleText}>{percent}%</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function TeacherClassScreen() {
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Remark modal
  const [remarkModalVisible, setRemarkModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [remarkText, setRemarkText] = useState('');
  const [remarkSending, setRemarkSending] = useState(false);
  const [selectedQuick, setSelectedQuick] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    loadData();
  }, []);

  // ── Fetch teacher profile + students ──────────────────────────────────────
  const loadData = async () => {
    try {
      // 1. Get logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 2. Fetch teacher's profile (includes assigned_class)
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('id, full_name, assigned_class, assigned_section')
        .eq('id', user.id)
        .single();

      if (profileErr) throw profileErr;
      setTeacher(profile);

      // 3. Fetch students in that class
      if (profile?.assigned_class) {
        let query = supabase
          .from('students')
          .select('id, full_name, roll_number, class, section')
          .eq('class', profile.assigned_class)
          .order('full_name', { ascending: true });

        if (profile.assigned_section) {
          query = query.eq('section', profile.assigned_section);
        }

        const { data: studentsData, error: studentsErr } = await query;
        if (studentsErr) throw studentsErr;
        const studentList = studentsData ?? [];

        // Fetch today's attendance (only if there are students)
        let attendanceMap: Record<string, AttendanceStatus> = {};
        if (studentList.length > 0) {
          const today = getTodayKey();
          const { data: attendanceRows } = await supabase
            .from('attendance')
            .select('student_id, status')
            .eq('date', today)
            .in('student_id', studentList.map((s: any) => s.id));

          (attendanceRows ?? []).forEach((row: any) => {
            attendanceMap[row.student_id] = row.status as AttendanceStatus;
          });
        }

        setStudents(studentList.map((s: any) => ({
          ...s,
          attendance: attendanceMap[s.id] ?? null,
        })));
      }
    } catch (err: any) {
      console.error('Teacher load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // ── Remark Modal ──────────────────────────────────────────────────────────
  const openRemarkModal = (student: Student) => {
    setSelectedStudent(student);
    setRemarkText('');
    setSelectedQuick(null);
    setRemarkModalVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeRemarkModal = () => {
    Animated.timing(slideAnim, {
      toValue: 500,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setRemarkModalVisible(false);
      setSelectedStudent(null);
      setRemarkText('');
      setSelectedQuick(null);
    });
  };

  const selectQuickRemark = (value: string, label: string) => {
    setSelectedQuick(label);
    setRemarkText(value);
  };

  const handleSendRemark = async () => {
    if (!remarkText.trim()) {
      Alert.alert('Empty', 'Please write or select a remark before sending.');
      return;
    }
    if (!selectedStudent) return;

    setRemarkSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const { error } = await supabase.from('student_remarks').insert({
        student_id: selectedStudent.id,
        sent_by: user.id,
        sender_role: 'teacher',
        message: remarkText.trim(),
        is_read: false,
      });

      if (error) throw error;

      Alert.alert('✅ Sent!', `Remark sent to ${selectedStudent.full_name}'s parent.`);
      closeRemarkModal();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send remark.');
    } finally {
      setRemarkSending(false);
    }
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const className = teacher?.assigned_class
    ? `${teacher.assigned_class}${teacher.assigned_section ? ' - ' + teacher.assigned_section : ''}`
    : 'My Class';

  const presentCount = students.filter((s) => s.present).length;
  const attendancePercent = students.length > 0
    ? Math.round((presentCount / students.length) * 100)
    : 0;

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading class...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>
              {teacher?.full_name ? `Hi, ${teacher.full_name.split(' ')[0]}!` : 'My Class'}
            </Text>
            <Text style={styles.headerSub}>
              {teacher?.assigned_class
                ? `Class ${className} • ${students.length} students`
                : 'No class assigned yet'}
            </Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.8}>
            <Ionicons name="notifications" size={22} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>

        {/* No class assigned warning */}
        {!teacher?.assigned_class && (
          <View style={styles.warningBanner}>
            <Ionicons name="alert-circle" size={20} color={COLORS.warning} />
            <Text style={styles.warningText}>
              You haven't been assigned a class yet. Contact your admin.
            </Text>
          </View>
        )}

        {/* Stats row */}
        {students.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <Text style={styles.statCardLabel}>Attendance</Text>
                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={16} color={COLORS.success} />
                </View>
              </View>
              <View style={styles.attendanceContent}>
                <CircularProgress percent={attendancePercent} />
                <View style={styles.attendanceNumbers}>
                  <Text style={styles.attendanceBig}>{students.length}</Text>
                  <Text style={styles.attendanceSmall}>STUDENTS</Text>
                  <Text style={styles.attendanceSmall}>IN CLASS</Text>
                </View>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <Text style={styles.statCardLabel}>Class</Text>
                <Ionicons name="school" size={20} color={COLORS.secondary} />
              </View>
              <Text style={styles.pendingCount}>{teacher?.assigned_class ?? '—'}</Text>
              <Text style={styles.pendingLabel}>
                {teacher?.assigned_section ? `Section ${teacher.assigned_section}` : 'All sections'}
              </Text>
            </View>
          </View>
        )}

        {/* Students list */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Students</Text>
            <Text style={styles.countBadge}>{students.length}</Text>
          </View>

          {students.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🏫</Text>
              <Text style={styles.emptyTitle}>No students found</Text>
              <Text style={styles.emptyText}>
                {teacher?.assigned_class
                  ? `No students in Class ${className} yet. Ask admin to upload student data.`
                  : 'You need to be assigned a class first.'}
              </Text>
            </View>
          ) : (
            <View style={styles.studentList}>
              {students.map((student, index) => (
                <View key={student.id} style={styles.studentRow}>
                  {/* Avatar */}
                  <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }]}>
                    <Text style={styles.avatarInitials}>{getInitials(student.full_name)}</Text>
                  </View>

                  {/* Name & roll */}
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.full_name}</Text>
                    <Text style={styles.studentSub}>
                      {student.roll_number ?? 'No roll no.'}
                      {student.section ? ` • Sec ${student.section}` : ''}
                    </Text>
                  </View>

                  {/* Attendance badge + Remark button */}
                  <View style={styles.rowActions}>
                    {/* Attendance badge */}
                    <View style={[
                      styles.attendanceBadge,
                      student.attendance === 'present' && styles.attendanceBadgePresent,
                      student.attendance === 'absent'  && styles.attendanceBadgeAbsent,
                      student.attendance === 'late'    && styles.attendanceBadgeLate,
                      student.attendance === null      && styles.attendanceBadgeUnmarked,
                    ]}>
                      <Text style={[
                        styles.attendanceBadgeText,
                        student.attendance === 'present' && { color: COLORS.success },
                        student.attendance === 'absent'  && { color: COLORS.error },
                        student.attendance === 'late'    && { color: COLORS.warning },
                        student.attendance === null      && { color: COLORS.gray },
                      ]}>
                        {student.attendance === 'present' ? '✓ P'
                          : student.attendance === 'absent' ? '✗ A'
                          : student.attendance === 'late' ? '~ L'
                          : '—'}
                      </Text>
                    </View>

                    {/* Remark button */}
                    <TouchableOpacity
                      style={styles.remarkBtn}
                      activeOpacity={0.8}
                      onPress={() => openRemarkModal(student)}
                    >
                      <Ionicons name="chatbubble-ellipses" size={18} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── Remark Modal ── */}
      <Modal
        visible={remarkModalVisible}
        transparent
        animationType="none"
        onRequestClose={closeRemarkModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeRemarkModal}
          />

          <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}>
            {/* Handle */}
            <View style={styles.sheetHandle} />

            {/* Title */}
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Send Remark</Text>
                {selectedStudent && (
                  <Text style={styles.sheetSubtitle}>
                    To: {selectedStudent.full_name}'s parent
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={closeRemarkModal} style={styles.sheetClose}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetScroll}>
              {/* Quick Remarks */}
              <Text style={styles.quickLabel}>Quick Remarks</Text>
              <View style={styles.quickGrid}>
                {QUICK_REMARKS.map((q) => (
                  <TouchableOpacity
                    key={q.label}
                    style={[
                      styles.quickChip,
                      selectedQuick === q.label && styles.quickChipSelected,
                    ]}
                    onPress={() => selectQuickRemark(q.value, q.label)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.quickChipText,
                        selectedQuick === q.label && styles.quickChipTextSelected,
                      ]}
                    >
                      {q.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Free text */}
              <Text style={styles.quickLabel}>Or write your own</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Type a remark for the parent..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={4}
                value={remarkText}
                onChangeText={(t) => {
                  setRemarkText(t);
                  setSelectedQuick(null);
                }}
                textAlignVertical="top"
              />

              {/* Send button */}
              <TouchableOpacity
                style={[styles.sendBtn, remarkSending && { opacity: 0.6 }]}
                onPress={handleSendRemark}
                disabled={remarkSending}
                activeOpacity={0.8}
              >
                <Ionicons name="send" size={18} color={COLORS.white} />
                <Text style={styles.sendBtnText}>
                  {remarkSending ? 'Sending...' : 'Send to Parent'}
                </Text>
              </TouchableOpacity>

              <View style={{ height: 30 }} />
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  scrollContent: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20, gap: 16 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  bellBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },

  // Warning
  warningBanner: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.warningLight,
    borderRadius: 16, padding: 14, gap: 10, borderWidth: 1, borderColor: COLORS.warning + '40',
  },
  warningText: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.warning, lineHeight: 20 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 20, padding: 16, gap: 10,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  statCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statCardLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  checkCircle: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.successLight,
    justifyContent: 'center', alignItems: 'center',
  },
  attendanceContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  circleOuter: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 5,
    borderColor: COLORS.secondary, borderTopColor: COLORS.secondarySoft,
    justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-45deg' }],
  },
  circleInner: { transform: [{ rotate: '45deg' }] },
  circleText: { fontSize: 11, fontWeight: '800', color: COLORS.textPrimary },
  attendanceNumbers: { gap: 1 },
  attendanceBig: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, lineHeight: 32 },
  attendanceSmall: { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary, letterSpacing: 0.5 },
  pendingCount: { fontSize: 36, fontWeight: '800', color: COLORS.secondary },
  pendingLabel: { fontSize: 12, fontWeight: '600', color: COLORS.secondary },

  // Section
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  countBadge: {
    backgroundColor: COLORS.primarySoft, paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 12, fontSize: 13, fontWeight: '700', color: COLORS.primary,
  },

  // Empty
  emptyCard: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 32,
    alignItems: 'center', gap: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  emptyText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },

  // Student list
  studentList: { gap: 10 },
  studentRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 18, padding: 14, gap: 12,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitials: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  studentInfo: { flex: 1, gap: 2 },
  studentName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  studentSub: { fontSize: 12, fontWeight: '500', color: COLORS.textSecondary },
  rowActions: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  attendanceBadge: {
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, minWidth: 36, alignItems: 'center',
  },
  attendanceBadgePresent: { backgroundColor: COLORS.successLight },
  attendanceBadgeAbsent:  { backgroundColor: COLORS.errorLight },
  attendanceBadgeLate:    { backgroundColor: COLORS.warningLight },
  attendanceBadgeUnmarked:{ backgroundColor: COLORS.lightGray },
  attendanceBadgeText: { fontSize: 12, fontWeight: '800' },
  remarkBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.secondary,
    justifyContent: 'center', alignItems: 'center',
  },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12, height: '85%',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.lightGray,
    alignSelf: 'center', marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 20,
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  sheetSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  sheetClose: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.lightGray,
    justifyContent: 'center', alignItems: 'center',
  },
  sheetScroll: { flex: 1 },

  // Quick remarks
  quickLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 10 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  quickChip: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
    backgroundColor: COLORS.primarySoft, borderWidth: 1.5, borderColor: 'transparent',
  },
  quickChipSelected: { backgroundColor: COLORS.primary + '15', borderColor: COLORS.primary },
  quickChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  quickChipTextSelected: { color: COLORS.primary },

  // Text input
  textInput: {
    borderWidth: 1.5, borderColor: COLORS.inputBorder, borderRadius: 16,
    padding: 14, fontSize: 14, color: COLORS.textPrimary, minHeight: 100,
    backgroundColor: COLORS.offWhite, marginBottom: 20,
  },

  // Send button
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.secondary, borderRadius: 16, paddingVertical: 15,
  },
  sendBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
});
