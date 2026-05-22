import { COLORS } from '@/constants/admissionTheme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
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
  const [className, setClassName] = useState('My Class');
  const [classId, setClassId] = useState('');
  const presentCount = STUDENTS.filter((s) => s.present).length;

  useEffect(() => {
    // Load the selected class from AsyncStorage
    const loadClassInfo = async () => {
      try {
        const savedClassName = await AsyncStorage.getItem('className');
        const savedClassId = await AsyncStorage.getItem('classId');
        
        if (savedClassName) {
          setClassName(savedClassName);
        }
        if (savedClassId) {
          setClassId(savedClassId);
        }
      } catch (error) {
        console.log('Error loading class info:', error);
        // Keep default values if loading fails
      }
    };

    loadClassInfo();
  }, []);

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Class: {className}</Text>
            <Text style={styles.headerSub}>{STUDENTS.length} students {classId && `• ID: ${classId}`}</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.8}>
            <Ionicons name="notifications" size={22} color={COLORS.secondary} />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>

        {/* Notice banner */}
        <View style={styles.noticeBanner}>
          <Ionicons name="megaphone" size={20} color={COLORS.primary} />
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
                <Ionicons name="checkmark" size={16} color={COLORS.success} />
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
              <Ionicons name="clipboard" size={20} color={COLORS.secondary} />
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
                      { color: student.present ? COLORS.success : COLORS.error },
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
                      { backgroundColor: student.present ? COLORS.successLight : COLORS.offWhite },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name="checkmark" 
                      size={18} 
                      color={student.present ? COLORS.success : COLORS.gray} 
                    />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionSquare} activeOpacity={0.8}>
                    <Ionicons name="stats-chart" size={18} color={COLORS.primary} />
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
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.error,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },

  // Notice banner
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.secondarySoft,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.secondary + '20',
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    lineHeight: 20,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    gap: 10,
    shadowColor: COLORS.primary,
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
    color: COLORS.textSecondary,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.successLight,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderColor: COLORS.secondary,
    borderTopColor: COLORS.secondarySoft,
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
    color: COLORS.textPrimary,
  },
  attendanceNumbers: {
    gap: 1,
  },
  attendanceBig: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 32,
  },
  attendanceSmall: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },

  // Assessments
  pendingCount: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  pendingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary,
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
    color: COLORS.textPrimary,
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Student list
  studentList: {
    gap: 10,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    gap: 12,
    shadowColor: COLORS.primary,
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
    borderColor: COLORS.white,
  },

  // Student info
  studentInfo: {
    flex: 1,
    gap: 2,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
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
  actionSquare: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
