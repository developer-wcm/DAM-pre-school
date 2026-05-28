import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import EditStudentModal from '../../components/EditStudentModal';
import { getProgressLevelDetails, getSkillsForClass } from '../../constants/progressSkills';
import { AppColors, AppShadows } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

interface StudentProfile {
  id: string;
  full_name: string;
  class: string;
  roll_number: string | null;
  date_of_birth: string | null;
  gender: string | null;
  status: string;
  admission_date: string | null;
}

const CLASS_COLORS: Record<string, { bg: string; text: string }> = {
  PG: AppColors.classPG,
  PKG: AppColors.classPKG,
  JKG: AppColors.classJKG,
  SKG: AppColors.classSKG,
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function StudentProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const studentId = params.id as string;

  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'attendance' | 'fees' | 'progress'>('info');
  const [selectedTerm, setSelectedTerm] = useState<1 | 2 | 3>(1);
  const [editModalVisible, setEditModalVisible] = useState(false);

  useEffect(() => {
    fetchStudentProfile();
  }, [studentId]);

  async function fetchStudentProfile() {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (error) throw error;
      setStudent(data);
    } catch (e) {
      console.error('Error fetching student:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primaryBlue} />
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Student not found</Text>
      </View>
    );
  }

  const initials = getInitials(student.full_name);
  const classColor = CLASS_COLORS[student.class] ?? CLASS_COLORS.PG;
  const isActive = student.status === 'active';

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
        <Text style={styles.headerTitle}>STUDENT PROFILE</Text>
        <TouchableOpacity 
          style={styles.editBtn} 
          activeOpacity={0.7}
          onPress={() => setEditModalVisible(true)}
        >
          <Ionicons name="create-outline" size={24} color={AppColors.primaryBlue} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarLarge, { backgroundColor: classColor.bg }]}>
            <Text style={[styles.avatarTextLarge, { color: classColor.text }]}>
              {initials}
            </Text>
            <View style={[styles.statusDotLarge, { backgroundColor: isActive ? AppColors.success : AppColors.textLight }]} />
          </View>
          <Text style={styles.studentName}>{student.full_name}</Text>

          {/* Badges */}
          <View style={styles.badgesRow}>
            {student.roll_number && (
              <View style={styles.idBadge}>
                <Text style={styles.idBadgeLabel}>ID: </Text>
                <Text style={styles.idBadgeValue}>{student.roll_number}</Text>
              </View>
            )}
            <View style={[styles.classBadgeLarge, { backgroundColor: classColor.bg }]}>
              <Text style={[styles.classBadgeText, { color: classColor.text }]}>
                {student.class === 'PG' ? 'Play Group' :
                 student.class === 'PKG' ? 'Pre-KG' :
                 student.class === 'JKG' ? 'Junior KG' :
                 student.class === 'SKG' ? 'Senior KG' : student.class}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: AppColors.success }]} />
              <Text style={styles.statusText}>Admitted</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.tabActive]}
            onPress={() => setActiveTab('info')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
              Info
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'attendance' && styles.tabActive]}
            onPress={() => setActiveTab('attendance')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'attendance' && styles.tabTextActive]}>
              Attendance
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'progress' && styles.tabActive]}
            onPress={() => setActiveTab('progress')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'progress' && styles.tabTextActive]}>
              Progress
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'fees' && styles.tabActive]}
            onPress={() => setActiveTab('fees')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'fees' && styles.tabTextActive]}>
              Fees
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'info' && (
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="person-circle-outline" size={24} color={AppColors.gold} />
              <Text style={styles.infoTitle}>Personal Details</Text>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>DATE OF BIRTH</Text>
                <Text style={styles.infoValue}>{formatDate(student.date_of_birth)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>GENDER</Text>
                <Text style={styles.infoValue}>
                  {student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : 'N/A'}
                </Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>ADDRESS</Text>
              <Text style={styles.infoValue}>
                42, Maple Avenue, Prestige Garden{'\n'}Layout, Bangalore - 560001
              </Text>
            </View>

            {/* Map Placeholder */}
            <View style={styles.mapPlaceholder}>
              <View style={styles.mapOverlay}>
                <TouchableOpacity style={styles.mapButton} activeOpacity={0.8}>
                  <Text style={styles.mapButtonText}>View on Map</Text>
                </TouchableOpacity>
              </View>
            </View>

            {student.admission_date && (
              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>ADMISSION DATE</Text>
                <Text style={styles.infoValue}>{formatDate(student.admission_date)}</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'attendance' && (
          <View style={styles.attendanceContainer}>
            {/* Stats Cards */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: '#D4F4E8' }]}>
                <Text style={[styles.statValue, { color: '#2A9D6E' }]}>85%</Text>
                <Text style={styles.statLabel}>Present</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#FFE4E4' }]}>
                <Text style={[styles.statValue, { color: '#E05A5A' }]}>10%</Text>
                <Text style={styles.statLabel}>Absent</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: AppColors.blueLight }]}>
                <Text style={[styles.statValue, { color: AppColors.primaryBlue }]}>20</Text>
                <Text style={styles.statLabel}>Working Days</Text>
              </View>
            </View>

            {/* Calendar */}
            <View style={styles.calendarCard}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity style={styles.calendarArrow} activeOpacity={0.7}>
                  <Ionicons name="chevron-back" size={20} color={AppColors.textSecondary} />
                </TouchableOpacity>
                <Text style={styles.calendarMonth}>January 2026</Text>
                <TouchableOpacity style={styles.calendarArrow} activeOpacity={0.7}>
                  <Ionicons name="chevron-forward" size={20} color={AppColors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {/* Day Headers */}
                <View style={styles.calendarRow}>
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <Text key={day} style={styles.dayHeader}>{day}</Text>
                  ))}
                </View>

                {/* Calendar Days - Sample for January 2026 */}
                <View style={styles.calendarRow}>
                  <View style={styles.dayCell} />
                  <View style={styles.dayCell} />
                  <View style={styles.dayCell} />
                  <View style={styles.dayCell} />
                  <View style={[styles.dayCell, styles.dayPresent]}>
                    <Text style={styles.dayText}>1</Text>
                  </View>
                  <View style={[styles.dayCell, styles.dayPresent]}>
                    <Text style={styles.dayText}>2</Text>
                  </View>
                  <View style={styles.dayCell}>
                    <Text style={styles.dayTextInactive}>3</Text>
                  </View>
                </View>

                <View style={styles.calendarRow}>
                  <View style={styles.dayCell}>
                    <Text style={styles.dayTextInactive}>4</Text>
                  </View>
                  <View style={[styles.dayCell, styles.dayPresent]}>
                    <Text style={styles.dayText}>5</Text>
                  </View>
                  <View style={[styles.dayCell, styles.dayPresent]}>
                    <Text style={styles.dayText}>6</Text>
                  </View>
                  <View style={[styles.dayCell, styles.dayPresent]}>
                    <Text style={styles.dayText}>7</Text>
                  </View>
                  <View style={[styles.dayCell, styles.dayPresent]}>
                    <Text style={styles.dayText}>8</Text>
                  </View>
                  <View style={[styles.dayCell, styles.dayPresent]}>
                    <Text style={styles.dayText}>9</Text>
                  </View>
                  <View style={styles.dayCell}>
                    <Text style={styles.dayTextInactive}>10</Text>
                  </View>
                </View>

                <View style={styles.calendarRow}>
                  <View style={styles.dayCell}>
                    <Text style={styles.dayTextInactive}>11</Text>
                  </View>
                  <View style={[styles.dayCell, styles.dayPresent]}>
                    <Text style={styles.dayText}>12</Text>
                  </View>
                  <View style={[styles.dayCell, styles.dayPresent]}>
                    <Text style={styles.dayText}>13</Text>
                  </View>
                  <View style={[styles.dayCell, styles.dayHoliday]}>
                    <Text style={styles.dayText}>14</Text>
                  </View>
                  <View style={[styles.dayCell, styles.dayPresent]}>
                    <Text style={styles.dayText}>15</Text>
                  </View>
                  <View style={[styles.dayCell, styles.dayPresent]}>
                    <Text style={styles.dayText}>16</Text>
                  </View>
                  <View style={styles.dayCell}>
                    <Text style={styles.dayTextInactive}>17</Text>
                  </View>
                </View>

                <View style={styles.calendarRow}>
                  <View style={styles.dayCell}>
                    <Text style={styles.dayTextInactive}>18</Text>
                  </View>
                  <View style={[styles.dayCell, styles.dayPresent]}>
                    <Text style={styles.dayText}>19</Text>
                  </View>
                  <View style={[styles.dayCell, styles.dayPresent]}>
                    <Text style={styles.dayText}>20</Text>
                  </View>
                  <View style={[styles.dayCell, styles.dayPresent]}>
                    <Text style={styles.dayText}>21</Text>
                  </View>
                  <View style={[styles.dayCell, styles.dayPresent]}>
                    <Text style={styles.dayText}>22</Text>
                  </View>
                  <View style={[styles.dayCell, styles.dayPresent]}>
                    <Text style={styles.dayText}>23</Text>
                  </View>
                  <View style={styles.dayCell}>
                    <Text style={styles.dayTextInactive}>24</Text>
                  </View>
                </View>

                <View style={styles.calendarRow}>
                  <View style={styles.dayCell}>
                    <Text style={styles.dayTextInactive}>25</Text>
                  </View>
                  <View style={[styles.dayCell, styles.dayToday]}>
                    <Text style={styles.dayTextToday}>26</Text>
                  </View>
                  <View style={styles.dayCell}>
                    <Text style={styles.dayTextFuture}>27</Text>
                  </View>
                  <View style={styles.dayCell}>
                    <Text style={styles.dayTextFuture}>28</Text>
                  </View>
                  <View style={styles.dayCell}>
                    <Text style={styles.dayTextFuture}>29</Text>
                  </View>
                  <View style={styles.dayCell}>
                    <Text style={styles.dayTextFuture}>30</Text>
                  </View>
                  <View style={styles.dayCell}>
                    <Text style={styles.dayTextInactive}>31</Text>
                  </View>
                </View>
              </View>

              {/* Legend */}
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#2A9D6E' }]} />
                  <Text style={styles.legendText}>Present</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#E05A5A' }]} />
                  <Text style={styles.legendText}>Absent</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#3498DB' }]} />
                  <Text style={styles.legendText}>Holiday</Text>
                </View>
              </View>
            </View>

            {/* Recent Notes */}
            <View style={styles.notesCard}>
              <Text style={styles.notesTitle}>Recent Notes</Text>
              <View style={styles.noteItem}>
                <View style={styles.noteIcon}>
                  <Ionicons name="medical" size={20} color="#E05A5A" />
                </View>
                <View style={styles.noteContent}>
                  <View style={styles.noteHeader}>
                    <Text style={styles.noteTitle}>Sick Leave</Text>
                    <Text style={styles.noteDate}>Jan 19</Text>
                  </View>
                  <Text style={styles.noteText}>
                    Priya was suffering from a mild fever.{'\n'}Parents informed via app.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'progress' && (
          <View style={styles.progressContainer}>
            {/* Term Selection */}
            <View style={styles.termSelector}>
              {[1, 2, 3].map((term) => (
                <TouchableOpacity
                  key={term}
                  style={[styles.termBtn, selectedTerm === term && styles.termBtnActive]}
                  onPress={() => setSelectedTerm(term as 1 | 2 | 3)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.termText, selectedTerm === term && styles.termTextActive]}>
                    Term {term}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Skills Cards */}
            {(() => {
              const skills = getSkillsForClass(student.class);
              
              if (skills.length === 0) {
                return (
                  <View style={styles.infoCard}>
                    <Text style={styles.comingSoonText}>
                      No progress skills configured for {student.class}
                    </Text>
                  </View>
                );
              }

              return skills.map((skill) => {
                const levelDetails = getProgressLevelDetails(skill.level);
                return (
                  <View key={skill.id} style={styles.skillCard}>
                    <View style={styles.skillHeader}>
                      <View style={[styles.skillIcon, { backgroundColor: `${levelDetails.color}20` }]}>
                        <Text style={styles.skillEmoji}>{skill.emoji}</Text>
                      </View>
                      <View style={styles.skillInfo}>
                        <Text style={styles.skillName}>{skill.name}</Text>
                        <Text style={[styles.skillLevel, { color: levelDetails.color }]}>
                          {levelDetails.label}
                        </Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBarBg}>
                        <View 
                          style={[
                            styles.progressBarFill, 
                            { 
                              width: `${levelDetails.progress}%`,
                              backgroundColor: levelDetails.color 
                            }
                          ]} 
                        />
                      </View>
                      <View style={styles.progressLabels}>
                        <Text style={styles.progressLabel}>EMERGING</Text>
                        <Text style={styles.progressLabel}>ADVANCED</Text>
                      </View>
                    </View>

                    {/* View Notes Button */}
                    <TouchableOpacity style={styles.viewNotesBtn} activeOpacity={0.7}>
                      <Text style={styles.viewNotesText}>View notes</Text>
                      <Ionicons name="arrow-forward" size={16} color={AppColors.primaryBlue} />
                    </TouchableOpacity>
                  </View>
                );
              });
            })()}
          </View>
        )}

        {activeTab === 'fees' && (
          <View style={styles.infoCard}>
            <Text style={styles.comingSoonText}>Fee details coming soon</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Modal */}
      <EditStudentModal
        visible={editModalVisible}
        student={student}
        onClose={() => setEditModalVisible(false)}
        onSuccess={fetchStudentProfile}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.background,
  },
  errorText: {
    fontSize: 16,
    color: AppColors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: AppColors.background,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...AppShadows.cardShadow,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.primaryBlue,
    letterSpacing: 1,
  },
  editBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...AppShadows.cardShadow,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...AppShadows.cardShadow,
  },
  avatarTextLarge: {
    fontSize: 48,
    fontWeight: '700',
  },
  statusDotLarge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: AppColors.white,
  },
  studentName: {
    fontSize: 28,
    fontWeight: '800',
    color: AppColors.textPrimary,
    marginTop: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    justifyContent: 'center',
  },
  idBadge: {
    flexDirection: 'row',
    backgroundColor: AppColors.blueLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  idBadgeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  idBadgeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.primaryBlue,
  },
  classBadgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  classBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.blueLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.success,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: AppColors.white,
    borderRadius: 24,
    padding: 4,
    marginBottom: 20,
    ...AppShadows.cardShadow,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: AppColors.primaryBlue,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  tabTextActive: {
    color: AppColors.white,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 20,
    ...AppShadows.cardShadow,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  infoItem: {
    flex: 1,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
    lineHeight: 24,
  },
  mapPlaceholder: {
    height: 180,
    backgroundColor: '#A8C5A8',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 197, 168, 0.3)',
  },
  mapButton: {
    backgroundColor: AppColors.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    ...AppShadows.cardShadow,
  },
  mapButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.primaryBlue,
  },
  comingSoonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textTertiary,
    textAlign: 'center',
    paddingVertical: 40,
  },
  attendanceContainer: {
    gap: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    ...AppShadows.cardShadow,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  calendarCard: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 20,
    ...AppShadows.cardShadow,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarMonth: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  calendarGrid: {
    gap: 8,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dayHeader: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textTertiary,
  },
  dayCell: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  dayPresent: {
    backgroundColor: '#D4F4E8',
  },
  dayAbsent: {
    backgroundColor: '#FFE4E4',
  },
  dayHoliday: {
    backgroundColor: '#E3F2FD',
  },
  dayToday: {
    backgroundColor: '#3498DB',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  dayTextToday: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.white,
  },
  dayTextInactive: {
    fontSize: 14,
    fontWeight: '500',
    color: AppColors.textLight,
  },
  dayTextFuture: {
    fontSize: 14,
    fontWeight: '500',
    color: AppColors.textTertiary,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.background,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
    color: AppColors.textSecondary,
  },
  notesCard: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 20,
    ...AppShadows.cardShadow,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 16,
  },
  noteItem: {
    flexDirection: 'row',
    gap: 12,
  },
  noteIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFE4E4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteContent: {
    flex: 1,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  noteDate: {
    fontSize: 12,
    fontWeight: '500',
    color: AppColors.textTertiary,
  },
  noteText: {
    fontSize: 13,
    fontWeight: '500',
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  progressContainer: {
    gap: 16,
  },
  termSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  termBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: AppColors.white,
    alignItems: 'center',
    ...AppShadows.cardShadow,
  },
  termBtnActive: {
    backgroundColor: AppColors.primaryBlue,
  },
  termText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  termTextActive: {
    color: AppColors.white,
    fontWeight: '700',
  },
  skillCard: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 20,
    ...AppShadows.cardShadow,
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  skillIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillEmoji: {
    fontSize: 24,
  },
  skillInfo: {
    flex: 1,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  skillLevel: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: AppColors.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: AppColors.textTertiary,
    letterSpacing: 0.5,
  },
  viewNotesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  viewNotesText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.primaryBlue,
  },
});
