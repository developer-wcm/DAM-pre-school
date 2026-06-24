import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getSkillsForClass, SKILL_LEVELS, type Skill, type SkillLevel } from '../../constants/progressSkills';
import { mergeSkillsWithSaved } from '../../lib/progress';
import { supabase } from '../../lib/supabase';

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  navy:       '#1E3A5F',
  navyLight:  '#2C5282',
  navySoft:   '#E8EDF5',
  gold:       '#DAA520',
  bg:         '#F0F4F8',
  white:      '#FFFFFF',
  textPrimary:'#1A1A2E',
  textSecond: '#5A6C7D',
  textLight:  '#8B95A1',
  border:     '#E2E8F0',
  card:       '#FFFFFF',
};

type Term = 'term1' | 'term2' | 'term3';

type Student = {
  id: string;
  name: string;
  class: string;
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
  const [saving, setSaving] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(false);

  // ── Load saved progress for a student+term from Supabase ──
  const loadProgressForStudent = useCallback(async (student: Student, term: Term) => {
    const defaults = getSkillsForClass(student.class);
    setLoadingProgress(true);
    try {
      const { data } = await supabase
        .from('student_progress')
        .select('skills, observation_notes')
        .eq('student_id', student.id)
        .eq('term', term)
        .maybeSingle();

      if (data) {
        let saved: Skill[] | null = null;
        try {
          saved = typeof data.skills === 'string' ? JSON.parse(data.skills) : data.skills;
        } catch {}
        setSkills(mergeSkillsWithSaved(defaults, saved));
        setObservationNotes(data.observation_notes ?? '');
      } else {
        setSkills(defaults.map(sk => ({ ...sk })));
        setObservationNotes('');
      }
    } catch {
      setSkills(defaults.map(sk => ({ ...sk })));
      setObservationNotes('');
    } finally {
      setLoadingProgress(false);
    }
  }, []);

  // ── Initial load: fetch students then load progress for first student ──
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('assigned_class, assigned_section')
          .eq('id', user.id)
          .single();

        if (!profile?.assigned_class) { setLoadingStudents(false); return; }

        let query = supabase
          .from('students')
          .select('id, full_name, class')
          .eq('class', profile.assigned_class)
          .order('full_name');

        if (profile.assigned_section) {
          query = query.eq('section', profile.assigned_section);
        }

        const { data } = await query;
        const mapped: Student[] = (data ?? []).map((s: any) => ({
          id: s.id, name: s.full_name, class: s.class,
        }));

        setStudents(mapped);
        if (mapped.length > 0) {
          setSelectedStudent(mapped[0]);
          await loadProgressForStudent(mapped[0], 'term1');
        }
      } catch (e) {
        console.warn('Progress: failed to load students', e);
      } finally {
        setLoadingStudents(false);
      }
    })();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reload when term changes ──
  useEffect(() => {
    if (selectedStudent) {
      loadProgressForStudent(selectedStudent, selectedTerm);
    }
  }, [selectedTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateSkillLevel = (skillId: string, level: SkillLevel) => {
    setSkills(skills.map(sk => sk.id === skillId ? { ...sk, level } : sk));
  };

  const getLevelIndex = (level: SkillLevel) =>
    SKILL_LEVELS.findIndex(l => l.value === level);

  const renderSkillCard = (skill: Skill) => {
    const currentIdx = getLevelIndex(skill.level);
    const currentLevelCfg = SKILL_LEVELS[currentIdx];

    return (
      <View key={skill.id} style={styles.skillCard}>
        {/* Skill header */}
        <View style={styles.skillHeader}>
          <View style={[styles.skillEmojiWrap, { backgroundColor: currentLevelCfg.color + '18' }]}>
            <Text style={styles.skillEmoji}>{skill.emoji}</Text>
          </View>
          <Text style={styles.skillName}>{skill.name}</Text>
          {skill.required && (
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredText}>★</Text>
            </View>
          )}
          {/* Current level pill */}
          <View style={[styles.currentLevelPill, { backgroundColor: currentLevelCfg.color + '20' }]}>
            <Text style={[styles.currentLevelText, { color: currentLevelCfg.color }]}>
              {currentLevelCfg.label}
            </Text>
          </View>
        </View>

        {/* Progress tracker — each level uses its own color */}
        <View style={styles.progressTracker}>
          {SKILL_LEVELS.map((levelOpt, index) => {
            const isActive = index <= currentIdx;
            const isCurrent = index === currentIdx;
            return (
              <View key={levelOpt.value} style={styles.progressStep}>
                <TouchableOpacity
                  style={[
                    styles.progressDot,
                    isActive && { backgroundColor: levelOpt.color },
                    isCurrent && styles.progressDotCurrent,
                    isCurrent && { backgroundColor: levelOpt.color, shadowColor: levelOpt.color },
                  ]}
                  onPress={() => updateSkillLevel(skill.id, levelOpt.value)}
                  activeOpacity={0.8}
                >
                  {isActive && (
                    <Ionicons
                      name={isCurrent ? 'radio-button-on' : 'checkmark'}
                      size={isCurrent ? 20 : 14}
                      color="#FFFFFF"
                    />
                  )}
                </TouchableOpacity>
                <Text style={[
                  styles.progressLabel,
                  isCurrent && { color: levelOpt.color, fontWeight: '700' },
                ]}>
                  {levelOpt.label}
                </Text>
                {index < SKILL_LEVELS.length - 1 && (
                  <View style={[
                    styles.progressLine,
                    isActive && index < currentIdx && { backgroundColor: SKILL_LEVELS[index].color },
                  ]} />
                )}
              </View>
            );
          })}
        </View>

        {/* Per-skill note */}
        <View style={styles.skillNoteWrap}>
          <Ionicons name="pencil-outline" size={13} color={C.textLight} style={{ marginTop: 2 }} />
          <TextInput
            style={styles.skillNoteInput}
            placeholder="Add a note for this skill…"
            placeholderTextColor={C.textLight}
            value={skill.notes}
            onChangeText={(text) =>
              setSkills(prev => prev.map(sk => sk.id === skill.id ? { ...sk, notes: text } : sk))
            }
            multiline
            textAlignVertical="top"
          />
        </View>
      </View>
    );
  };

  // ── Group skills by category prefix ──
  const skillsByCategory = skills.reduce<Record<string, Skill[]>>((acc, sk) => {
    const prefix = sk.id.split('-')[0];
    (acc[prefix] ??= []).push(sk);
    return acc;
  }, {});

  const CATEGORY_META: Record<string, { label: string; emoji: string; color: string }> = {
    lang:   { label: 'Language Literacy',     emoji: '📖', color: '#3498DB' },
    gk:     { label: 'General Knowledge',     emoji: '🌍', color: '#9B59B6' },
    num:    { label: 'Numerical Literacy',     emoji: '🔢', color: '#DAA520' },
    rhyme:  { label: 'Rhymes & Songs',         emoji: '🎵', color: '#E91E63' },
    part:   { label: 'Participation',          emoji: '🎯', color: '#F39C12' },
    social: { label: 'Social Skills',          emoji: '🤝', color: '#2A9D6E' },
    cog:    { label: 'Cognitive',              emoji: '🧠', color: C.navy     },
    comm:   { label: 'Communication',          emoji: '🗣️', color: '#7B6FE8' },
    motor:  { label: 'Motor Skills',           emoji: '🏃', color: '#E05A5A' },
  };

  if (loadingStudents) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={C.navy} />
        <Text style={styles.loadingText}>Loading students…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <LinearGradient colors={[C.navy, C.navyLight]} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Record Progress</Text>
          <Text style={styles.headerSub}>
            {selectedStudent ? `${selectedStudent.name} · ${selectedStudent.class}` : 'Select a student'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Term Selector ── */}
        <View style={styles.termSelector}>
          {(['term1', 'term2', 'term3'] as Term[]).map((t, i) => (
            <TouchableOpacity
              key={t}
              style={[styles.termButton, selectedTerm === t && styles.termButtonActive]}
              onPress={() => setSelectedTerm(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.termText, selectedTerm === t && styles.termTextActive]}>
                Term {i + 1}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Student Selector ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>STUDENT</Text>
          {students.length === 0 ? (
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
                <View style={styles.studentSelectorLeft}>
                  <LinearGradient colors={[C.navy, C.navyLight]} style={styles.studentAvatar}>
                    <Text style={styles.studentAvatarText}>
                      {selectedStudent ? selectedStudent.name.charAt(0).toUpperCase() : '?'}
                    </Text>
                  </LinearGradient>
                  <View>
                    <Text style={styles.studentName}>{selectedStudent?.name ?? 'Select student'}</Text>
                    <Text style={styles.studentClass}>{selectedStudent?.class ?? ''}</Text>
                  </View>
                </View>
                <Ionicons name={showStudentDropdown ? 'chevron-up' : 'chevron-down'} size={20} color={C.navy} />
              </TouchableOpacity>

              {showStudentDropdown && (
                <View style={styles.dropdown}>
                  {students.map((student) => (
                    <TouchableOpacity
                      key={student.id}
                      style={[styles.dropdownItem, selectedStudent?.id === student.id && styles.dropdownItemActive]}
                      onPress={() => {
                        setSelectedStudent(student);
                        setShowStudentDropdown(false);
                        loadProgressForStudent(student, selectedTerm);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.studentSelectorLeft}>
                        <View style={[styles.studentAvatarSmall, selectedStudent?.id === student.id && { backgroundColor: C.navy }]}>
                          <Text style={[styles.studentAvatarSmallText, selectedStudent?.id === student.id && { color: '#FFF' }]}>
                            {student.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={[styles.studentName, selectedStudent?.id === student.id && { color: C.navy }]}>
                          {student.name}
                        </Text>
                      </View>
                      {selectedStudent?.id === student.id && (
                        <Ionicons name="checkmark-circle" size={18} color={C.navy} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* ── Skills by Category ── */}
        {loadingProgress ? (
          <View style={styles.progressLoading}>
            <ActivityIndicator size="small" color={C.navy} />
            <Text style={styles.progressLoadingText}>Loading saved progress…</Text>
          </View>
        ) : null}
        {!loadingProgress && Object.entries(skillsByCategory).map(([prefix, catSkills]) => {
          const meta = CATEGORY_META[prefix] ?? { label: prefix, emoji: '📌', color: C.textSecond };
          return (
            <View key={prefix} style={styles.categorySection}>
              <View style={[styles.categoryHeader, { borderLeftColor: meta.color }]}>
                <Text style={styles.categoryEmoji}>{meta.emoji}</Text>
                <Text style={[styles.categoryTitle, { color: meta.color }]}>{meta.label}</Text>
              </View>
              {catSkills.map((skill) => renderSkillCard(skill))}
            </View>
          );
        })}

        {/* ── Observation Notes ── */}
        <View style={styles.notesCard}>
          <View style={styles.notesHeader}>
            <Ionicons name="document-text-outline" size={16} color={C.navy} />
            <Text style={styles.notesLabel}>OBSERVATION NOTES</Text>
          </View>
          <TextInput
            style={styles.notesInput}
            placeholder="Write notes about this student's overall progress…"
            placeholderTextColor={C.textLight}
            value={observationNotes}
            onChangeText={setObservationNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* ── Save Button ── */}
        <TouchableOpacity
          style={[styles.saveButton, (saving || !selectedStudent) && { opacity: 0.65 }]}
          activeOpacity={0.85}
          disabled={saving || !selectedStudent}
          onPress={async () => {
            if (!selectedStudent) return;
            setSaving(true);
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error('Not logged in');
              const { error } = await supabase.from('student_progress').upsert({
                student_id: selectedStudent.id,
                term: selectedTerm,
                skills: JSON.stringify(skills),
                observation_notes: observationNotes,
                updated_by: user.id,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'student_id,term' });
              if (error) throw error;
              Alert.alert('✅ Saved', `Progress for ${selectedStudent.name} saved successfully.`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to save.');
            } finally {
              setSaving(false);
            }
          }}
        >
          <LinearGradient colors={[C.navy, C.navyLight]} style={styles.saveButtonGrad}>
            {saving
              ? <ActivityIndicator color="#FFFFFF" size="small" />
              : <Ionicons name="save-outline" size={20} color="#FFFFFF" />
            }
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving…' : 'Save Assessment'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: C.bg },
  loadingText: { color: C.textSecond, fontSize: 14, fontWeight: '600' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 52, paddingBottom: 22, paddingHorizontal: 20,
  },
  backButton: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', letterSpacing: 0.2 },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '500', marginTop: 2 },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 20, gap: 16 },

  // Term selector
  termSelector: { flexDirection: 'row', gap: 10 },
  termButton: {
    flex: 1, paddingVertical: 11, borderRadius: 20,
    backgroundColor: C.white, alignItems: 'center',
    borderWidth: 1.5, borderColor: C.border,
  },
  termButtonActive: { backgroundColor: C.navy, borderColor: C.navy },
  termText: { fontSize: 14, fontWeight: '700', color: C.textSecond },
  termTextActive: { color: '#FFFFFF' },

  // Section
  section: { gap: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: C.navy, letterSpacing: 1, textTransform: 'uppercase' },

  // Student selector
  studentSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.white, borderRadius: 16, padding: 14,
    shadowColor: C.navy, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  studentSelectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  studentAvatar: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center',
  },
  studentAvatarText: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  studentAvatarSmall: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: C.navySoft,
    justifyContent: 'center', alignItems: 'center',
  },
  studentAvatarSmallText: { fontSize: 14, fontWeight: '700', color: C.navy },
  studentName: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  studentClass: { fontSize: 12, color: C.textSecond, fontWeight: '500', marginTop: 1 },

  // Dropdown
  dropdown: {
    backgroundColor: C.white, borderRadius: 16, overflow: 'hidden',
    shadowColor: C.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 14, elevation: 5,
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  dropdownItemActive: { backgroundColor: C.navySoft },

  // Category
  categorySection: { gap: 10 },
  categoryHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderLeftWidth: 3, paddingLeft: 10,
  },
  categoryEmoji: { fontSize: 17 },
  categoryTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },

  // Skill card
  skillCard: {
    backgroundColor: C.white, borderRadius: 16, padding: 16, gap: 14,
    shadowColor: C.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  skillHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  skillEmojiWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  skillEmoji: { fontSize: 18 },
  skillName: { flex: 1, fontSize: 14, fontWeight: '700', color: C.textPrimary },
  requiredBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#FDF6E3', justifyContent: 'center', alignItems: 'center',
  },
  requiredText: { fontSize: 12, fontWeight: '800', color: '#DAA520' },
  currentLevelPill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  currentLevelText: { fontSize: 11, fontWeight: '800' },

  // Progress tracker
  progressTracker: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 4,
  },
  progressStep: { alignItems: 'center', gap: 6, flex: 1, position: 'relative' },
  progressDot: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: C.border,
    justifyContent: 'center', alignItems: 'center', zIndex: 2,
  },
  progressDotCurrent: {
    width: 38, height: 38, borderRadius: 19,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  progressLabel: { fontSize: 9, fontWeight: '600', color: C.textLight, textAlign: 'center' },
  progressLine: {
    position: 'absolute', top: 16, left: '50%', right: '-50%',
    height: 2, backgroundColor: C.border, zIndex: 1,
  },

  // Notes
  notesCard: {
    backgroundColor: C.white, borderRadius: 16, padding: 16, gap: 10,
    shadowColor: C.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  notesHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  notesLabel: { fontSize: 11, fontWeight: '800', color: C.navy, letterSpacing: 0.8 },
  notesInput: {
    fontSize: 14, color: C.textPrimary, minHeight: 90, lineHeight: 22,
    borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10,
  },

  // Save button
  saveButton: { borderRadius: 20, overflow: 'hidden' },
  saveButtonGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 18,
  },
  saveButtonText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },

  emptyStudents: { paddingVertical: 16, alignItems: 'center' },
  emptyStudentsText: { fontSize: 14, color: C.textSecond },

  progressLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 24 },
  progressLoadingText: { fontSize: 13, color: C.textSecond, fontWeight: '600' },

  skillNoteWrap: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 7,
    backgroundColor: C.bg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
    borderWidth: 1, borderColor: C.border,
  },
  skillNoteInput: {
    flex: 1, fontSize: 12, color: C.textPrimary, minHeight: 36, lineHeight: 18,
  },
});
