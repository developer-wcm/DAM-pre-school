import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Student = {
  id: string;
  name: string;
  emoji: string;
  avatarBg: string;
  present: boolean;
  dotColor: string;
};

const STUDENTS: Student[] = [
  { id: '1', name: 'Priya Kumar',  emoji: '👧', avatarBg: '#F5E6D8', present: true,  dotColor: '#3AAF72' },
  { id: '2', name: 'Arjun Singh',  emoji: '👦', avatarBg: '#E8D8C8', present: false, dotColor: '#E05A5A' },
  { id: '3', name: 'Rohan Mehta',  emoji: '🧒', avatarBg: '#D8E8D8', present: true,  dotColor: '#3AAF72' },
  { id: '4', name: 'Sara Khan',    emoji: '👧', avatarBg: '#E8D8E8', present: true,  dotColor: '#3AAF72' },
  { id: '5', name: 'Milo Gupta',   emoji: '🧒', avatarBg: '#D8D8E8', present: true,  dotColor: '#3AAF72' },
  { id: '6', name: 'Aisha Patel',  emoji: '👧', avatarBg: '#F0E8D8', present: true,  dotColor: '#3AAF72' },
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

export default function TeacherClassScreen() {
  const presentCount = STUDENTS.filter((s) => s.present).length;

  return (
    <LinearGradient colors={['#EDE9F6', '#F0EEF8', '#EAF0F8']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Class: Junior KG</Text>
            <Text style={styles.headerSub}>{STUDENTS.length} students</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.8}>
            <Text style={styles.bellEmoji}>🔔</Text>
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>

        {/* Notice banner */}
        <View style={styles.noticeBanner}>
          <Text style={styles.noticeIcon}>📢</Text>
          <Text style={styles.noticeText}>
            School closed on Feb 19 for Shivaji Jayanti
          </Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {/* Attendance card */}
          <View style={styles.statCard}>
            <View style={styles.statCardHeader}>
              <Text style={styles.statCardLabel}>Attendance</Text>
              <View style={styles.checkCircle}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
            </View>
            <View style={styles.attendanceContent}>
              <CircularProgress percent={83} />
              <View style={styles.attendanceNumbers}>
                <Text style={styles.attendanceBig}>{presentCount}</Text>
                <Text style={styles.attendanceSmall}>OF {STUDENTS.length}</Text>
                <Text style={styles.attendanceSmall}>PRESENT</Text>
              </View>
            </View>
          </View>

          {/* Assessments card */}
          <View style={styles.statCard}>
            <View style={styles.statCardHeader}>
              <Text style={styles.statCardLabel}>Assessments</Text>
              <Text style={styles.assessmentIcon}>📋</Text>
            </View>
            <Text style={styles.pendingCount}>3</Text>
            <Text style={styles.pendingLabel}>Pending Review</Text>
          </View>
        </View>

        {/* Students list */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Students</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllLink}>View all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.studentList}>
            {STUDENTS.map((student) => (
              <View key={student.id} style={styles.studentRow}>
                {/* Avatar */}
                <View style={styles.avatarWrapper}>
                  <View style={[styles.avatar, { backgroundColor: student.avatarBg }]}>
                    <Text style={styles.avatarEmoji}>{student.emoji}</Text>
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: student.dotColor }]} />
                </View>

                {/* Name & status */}
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text
                    style={[
                      styles.studentStatus,
                      { color: student.present ? '#3AAF72' : '#E05A5A' },
                    ]}
                  >
                    {student.present ? 'Present' : 'Absent'}
                  </Text>
                </View>

                {/* Actions */}
                <View style={styles.studentActions}>
                  <TouchableOpacity
                    style={[
                      styles.actionCircle,
                      { backgroundColor: student.present ? '#D4F4E8' : '#F0F0F8' },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.actionCheck,
                        { color: student.present ? '#3AAF72' : '#C0C0D0' },
                      ]}
                    >
                      ✓
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionSquare} activeOpacity={0.8}>
                    <Text style={styles.actionChart}>📊</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    color: '#7A7A9D',
    marginTop: 2,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9B8FE0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  bellEmoji: {
    fontSize: 20,
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#E05A5A',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  // Notice banner
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#D4F4F4',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  noticeIcon: {
    fontSize: 18,
    marginTop: 1,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1A6A6A',
    lineHeight: 20,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    gap: 10,
    shadowColor: '#9B8FE0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7A7A9D',
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#D4F4E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    fontSize: 14,
    color: '#3AAF72',
    fontWeight: '700',
  },
  assessmentIcon: {
    fontSize: 18,
  },

  // Attendance
  attendanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circleOuter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 5,
    borderColor: '#3ABFBF',
    borderTopColor: '#E0F7F7',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-45deg' }],
  },
  circleInner: {
    transform: [{ rotate: '45deg' }],
  },
  circleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  attendanceNumbers: {
    gap: 1,
  },
  attendanceBig: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A2E',
    lineHeight: 32,
  },
  attendanceSmall: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9A9AB0',
    letterSpacing: 0.5,
  },

  // Assessments
  pendingCount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#E05A5A',
  },
  pendingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E05A5A',
  },

  // Section
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7B6FE8',
  },

  // Student list
  studentList: {
    gap: 10,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    gap: 12,
    shadowColor: '#9B8FE0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  // Avatar
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  statusDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Student info
  studentInfo: {
    flex: 1,
    gap: 2,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  studentStatus: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Student actions
  studentActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCheck: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionSquare: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E8E4F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionChart: {
    fontSize: 16,
  },
});
