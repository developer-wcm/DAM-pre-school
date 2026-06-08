import { COLORS } from '@/constants/admissionTheme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { DEFAULT_SCHOOL_ID } from '../../constants/school';
import { getSkillsForClass, SKILL_LEVELS, type Skill, type SkillLevel } from '../../constants/progressSkills';
import { supabase } from '../../lib/supabase';

type Term = 'term1' | 'term2' | 'term3';

type Student = {
  id: string;
  name: string;
  class: string;
};

// Map AsyncStorage class slug → DB class code
const CLASS_CODE_MAP: Record<string, string> = {
  'play-group': 'PG',
  'pre-kg': 'PKG',
  'junior-kg': 'JKG',
  'senior-kg': 'SKG',
};

export default function TeacherProgressScreen() {
  const router = useRouter();
  const [selectedTerm, setSelectedTerm] = useState<Term>('term1');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [observationNotes, setObservationNotes] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const selectedClass = await AsyncStorage.getItem('selectedClass');
        const classCode = CLASS_CODE_MAP[selectedClass ?? ''] ?? 'JKG';
        const { data } = await supabase
          .from('students')
          .select('id, full_name, class')
          .eq('school_id', DEFAULT_SCHOOL_ID)
          .eq('class', classCode)
          .eq('status', 'active')
          .order('full_name');
        const mapped: Student[] = (data ?? []).map((s: any) => ({
          id: s.id,
          name: s.full_name,
          class: s.class,
        }));
        setStudents(mapped);
        if (mapped.length > 0) {
          setSelectedStudent(mapped[0]);
          setSkills(getSkillsForClass(mapped[0].class));
        }
      } catch (e) {
        console.warn('Progress: failed to load students', e);
      } finally {
        setLoadingStudents(false);
      }
    })();
  }, []);

  const updateSkillLevel = (skillId: string, level: SkillLevel) => {
    setSkills(skills.map(skill => 
      skill.id === skillId ? { ...skill, level } : skill
    ));
  };

  const getLevelIndex = (level: SkillLevel): number => {
    return SKILL_LEVELS.findIndex(l => l.value === level);
  };

  const renderSkillCard = (skill: Skill) => (
    <View key={skill.id} style={styles.skillCard}>
      {/* Skill Header */}
      <View style={styles.skillHeader}>
        <Text style={styles.skillEmoji}>{skill.emoji}</Text>
        <Text style={styles.skillName}>{skill.name}</Text>
        {skill.required && (
          <View style={styles.requiredBadge}>
            <Text style={styles.requiredText}>*</Text>
          </View>
        )}
      </View>

      {/* Progress Tracker */}
      <View style={styles.progressTracker}>
        {SKILL_LEVELS.map((levelOption, index) => {
          const currentLevelIndex = getLevelIndex(skill.level);
          const isActive = index <= currentLevelIndex;
          const isCurrent = index === currentLevelIndex;

          return (
            <View key={levelOption.value} style={styles.progressStep}>
              <TouchableOpacity
                style={[
                  styles.progressDot,
                  isActive && styles.progressDotActive,
                  isCurrent && styles.progressDotCurrent,
                ]}
                onPress={() => updateSkillLevel(skill.id, levelOption.value)}
                activeOpacity={0.8}
              >
                {isActive && (
                  <Ionicons 
                    name={isCurrent ? "radio-button-on" : "checkmark"} 
                    size={isCurrent ? 20 : 14} 
                    color={COLORS.white} 
                  />
                )}
              </TouchableOpacity>
              <Text style={[
                styles.progressLabel,
                isCurrent && styles.progressLabelActive
              ]}>
                {levelOption.label}
              </Text>
              {index < SKILL_LEVELS.length - 1 && (
                <View style={[
                  styles.progressLine,
                  isActive && index < currentLevelIndex && styles.progressLineActive
                ]} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Record Progress</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Term Selector */}
        <View style={styles.termSelector}>
          <TouchableOpacity
            style={[styles.termButton, selectedTerm === 'term1' && styles.termButtonActive]}
            onPress={() => setSelectedTerm('term1')}
            activeOpacity={0.8}
          >
            <Text style={[styles.termText, selectedTerm === 'term1' && styles.termTextActive]}>
              Term 1
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.termButton, selectedTerm === 'term2' && styles.termButtonActive]}
            onPress={() => setSelectedTerm('term2')}
            activeOpacity={0.8}
          >
            <Text style={[styles.termText, selectedTerm === 'term2' && styles.termTextActive]}>
              Term 2
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.termButton, selectedTerm === 'term3' && styles.termButtonActive]}
            onPress={() => setSelectedTerm('term3')}
            activeOpacity={0.8}
          >
            <Text style={[styles.termText, selectedTerm === 'term3' && styles.termTextActive]}>
              Term 3
            </Text>
          </TouchableOpacity>
        </View>

        {/* Student Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>STUDENT</Text>
          {loadingStudents ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 12 }} />
          ) : students.length === 0 ? (
            <View style={styles.emptyStudents}>
              <Text style={styles.emptyStudentsText}>No students in your class yet.</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.studentSelector}
                onPress={() => setShowStudentDropdown(!showStudentDropdown)}
                activeOpacity={0.8}
              >
                <View style={styles.studentInfo}>
                  <View style={styles.studentAvatar}>
                    <Text style={styles.studentAvatarEmoji}>
                      {selectedStudent ? selectedStudent.name.charAt(0).toUpperCase() : '?'}
                    </Text>
                  </View>
                  <View style={styles.studentDetails}>
                    <Text style={styles.studentName}>{selectedStudent?.name ?? 'Select student'}</Text>
                    <Text style={styles.studentClass}>{selectedStudent?.class ?? ''}</Text>
                  </View>
                </View>
                <Ionicons
                  name={showStudentDropdown ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={COLORS.primary}
                />
              </TouchableOpacity>

              {showStudentDropdown && (
                <View style={styles.dropdown}>
                  {students.map((student) => (
                    <TouchableOpacity
                      key={student.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedStudent(student);
                        setSkills(getSkillsForClass(student.class));
                        setShowStudentDropdown(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.studentInfo}>
                        <View style={styles.studentAvatar}>
                          <Text style={styles.studentAvatarEmoji}>
                            {student.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.studentDetails}>
                          <Text style={styles.studentName}>{student.name}</Text>
                          <Text style={styles.studentClass}>{student.class}</Text>
                        </View>
                      </View>
                      {selectedStudent?.id === student.id && (
                        <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* Skills Assessment */}
        <View style={styles.skillsContainer}>
          {/* Language Literacy Section */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>1. Language Literacy</Text>
            {skills.slice(0, 2).map((skill) => renderSkillCard(skill))}
          </View>

          {/* General Knowledge (UTW) Section */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>2. General Knowledge (UTW)</Text>
            {skills.slice(2, 3).map((skill) => renderSkillCard(skill))}
          </View>

          {/* Numerical Literacy Section */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>3. Numerical Literacy</Text>
            {skills.slice(3, 4).map((skill) => renderSkillCard(skill))}
          </View>

          {/* Rhymes and Songs Section */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>4. Rhymes and Songs</Text>
            {skills.slice(4, 5).map((skill) => renderSkillCard(skill))}
          </View>

          {/* Participation Section */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>5. Participation</Text>
            {skills.slice(5, 9).map((skill) => renderSkillCard(skill))}
          </View>

          {/* Social Skills Section */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>6. Social Skills</Text>
            {skills.slice(9, 13).map((skill) => renderSkillCard(skill))}
          </View>

          {/* Cognitive Section */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>7. Cognitive</Text>
            {skills.slice(13).map((skill) => renderSkillCard(skill))}
          </View>
        </View>

        {/* Observation Notes */}
        <View style={styles.notesSection}>
          <TextInput
            style={styles.notesInput}
            placeholder="Observation notes..."
            placeholderTextColor={COLORS.gray}
            value={observationNotes}
            onChangeText={setObservationNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} activeOpacity={0.85}>
          <Ionicons name="save" size={20} color={COLORS.white} />
          <Text style={styles.saveButtonText}>Save Assessment</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
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
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 20,
  },

  // Term Selector
  termSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  termButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.lightGray,
  },
  termButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  termText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  termTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },

  // Student Selector
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  studentSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  studentInfo: {
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
  },
  studentAvatarEmoji: {
    fontSize: 28,
  },
  studentDetails: {
    flex: 1,
    gap: 2,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  studentClass: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },

  // Dropdown
  dropdown: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },

  // Skills
  skillsContainer: {
    gap: 20,
  },
  categorySection: {
    gap: 10,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  skillCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  skillEmoji: {
    fontSize: 20,
  },
  skillName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  requiredBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requiredText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },

  // Progress Tracker
  progressTracker: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  progressStep: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
    position: 'relative',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
  },
  progressDotCurrent: {
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  progressLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  progressLine: {
    position: 'absolute',
    top: 16,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: COLORS.lightGray,
    zIndex: 1,
  },
  progressLineActive: {
    backgroundColor: COLORS.primary,
  },

  // Observation Notes
  notesSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  notesInput: {
    fontSize: 14,
    color: COLORS.textPrimary,
    minHeight: 80,
  },

  // Save Button
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    paddingVertical: 18,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  emptyStudents: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyStudentsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
