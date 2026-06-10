import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../../constants/admissionTheme';
import { supabase } from '../../lib/supabase';

const DEFAULT_SCHOOL_ID = 'DEMO01';

interface Student {
  id: string;
  full_name: string;
  roll_number: string | null;
}

interface SkillEntry {
  name: string;
  level: number; // 1=Beginning 2=Developing 3=Proficient 4=Exceeding
}

interface ProgressData {
  term: string;
  skills: SkillEntry[];
  observation_notes: string | null;
  updated_at: string | null;
}

const LEVEL_LABELS = ['', 'Beginning', 'Developing', 'Proficient', 'Exceeding'];
const LEVEL_COLORS = ['', '#EF4444', '#F97316', '#3B82F6', '#10B981'];
const LEVEL_STARS = ['', '★☆☆☆', '★★☆☆', '★★★☆', '★★★★'];

function parseSkills(raw: any): SkillEntry[] {
  if (!raw) return [];
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(arr)) return arr;
    if (typeof arr === 'object') {
      return Object.entries(arr).map(([name, level]) => ({ name, level: Number(level) }));
    }
  } catch {}
  return [];
}

function avgRating(skills: SkillEntry[]): number {
  if (!skills.length) return 0;
  const avg = skills.reduce((s, sk) => s + sk.level, 0) / skills.length;
  return Math.round((avg / 4) * 5 * 10) / 10;
}

function buildRemarkMessage(student: Student, progress: ProgressData): string {
  const stars = avgRating(progress.skills);
  const skillLines = progress.skills
    .map((sk) => `  • ${sk.name}: ${LEVEL_LABELS[sk.level] ?? sk.level}`)
    .join('\n');
  const notes = progress.observation_notes ? `\n\nTeacher's Note: ${progress.observation_notes}` : '';
  return `📊 Progress Report — ${student.full_name}\nTerm: ${progress.term}\nOverall Rating: ${stars}/5 ⭐\n\nSkills:\n${skillLines}${notes}`;
}

export default function ProgressReportScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Student | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [sending, setSending] = useState(false);
  const [teacherInfo, setTeacherInfo] = useState<{ id: string; name: string; assignedClass: string | null } | null>(null);

  useEffect(() => { loadStudents(); }, []);

  async function loadStudents() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, assigned_class')
        .eq('id', user.id)
        .single();
      const cls = profile?.assigned_class;
      setTeacherInfo({ id: user.id, name: profile?.full_name ?? 'Teacher', assignedClass: cls ?? null });
      if (!cls) { setLoadingStudents(false); return; }
      const { data } = await supabase
        .from('students')
        .select('id, full_name, roll_number')
        .eq('class', cls)
        .order('full_name');
      setStudents(data ?? []);
    } catch (e) { console.error(e); }
    finally { setLoadingStudents(false); }
  }

  async function loadProgress(student: Student) {
    setSelected(student);
    setProgress(null);
    setLoadingProgress(true);
    try {
      const { data } = await supabase
        .from('student_progress')
        .select('term, skills, observation_notes, updated_at')
        .eq('student_id', student.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      if (data) {
        setProgress({
          term: data.term,
          skills: parseSkills(data.skills),
          observation_notes: data.observation_notes,
          updated_at: data.updated_at,
        });
      }
    } catch {}
    finally { setLoadingProgress(false); }
  }

  async function sendReportToParent() {
    if (!selected || !progress || !teacherInfo) return;
    setSending(true);
    try {
      const message = buildRemarkMessage(selected, progress);
      const { error } = await supabase.from('student_remarks').insert({
        student_id: selected.id,
        school_id: DEFAULT_SCHOOL_ID,
        sent_by: teacherInfo.id,
        sender_name: teacherInfo.name,
        sender_role: 'teacher',
        message,
        is_read: false,
      });
      if (error) throw error;
      Alert.alert('✅ Sent', `Progress report sent to ${selected.full_name}'s parent.`);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to send report');
    } finally { setSending(false); }
  }

  if (loadingStudents) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Progress Reports</Text>
          <Text style={styles.headerSub}>
            {teacherInfo?.assignedClass ? `Class ${teacherInfo.assignedClass}` : 'No class assigned'} • Tap student to view
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        {/* Student list */}
        <View style={styles.listPanel}>
          <Text style={styles.panelTitle}>STUDENTS ({students.length})</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {students.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.studentRow, selected?.id === s.id && styles.studentRowActive]}
                onPress={() => loadProgress(s)}
                activeOpacity={0.7}
              >
                <View style={[styles.studentAvatar, selected?.id === s.id && { backgroundColor: COLORS.primary }]}>
                  <Text style={[styles.studentAvatarText, selected?.id === s.id && { color: COLORS.white }]}>
                    {s.full_name[0].toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.studentName, selected?.id === s.id && { color: COLORS.primary }]} numberOfLines={1}>
                  {s.full_name}
                </Text>
                {selected?.id === s.id && <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Progress panel */}
        <ScrollView style={styles.progressPanel} contentContainerStyle={styles.progressContent} showsVerticalScrollIndicator={false}>
          {!selected ? (
            <View style={styles.emptyState}>
              <Ionicons name="ribbon-outline" size={56} color={COLORS.textLight} />
              <Text style={styles.emptyTitle}>Select a Student</Text>
              <Text style={styles.emptySubtitle}>Tap a student on the left to view their progress report.</Text>
            </View>
          ) : loadingProgress ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : !progress ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyTitle}>No Report Yet</Text>
              <Text style={styles.emptySubtitle}>No progress assessment found for {selected.full_name}.</Text>
            </View>
          ) : (
            <>
              {/* Student info */}
              <View style={styles.reportHeader}>
                <Text style={styles.reportName}>{selected.full_name}</Text>
                <Text style={styles.reportMeta}>
                  Term: {progress.term} • Rating: {avgRating(progress.skills)}/5 ⭐
                </Text>
                {progress.updated_at && (
                  <Text style={styles.reportDate}>
                    Last updated: {new Date(progress.updated_at).toLocaleDateString()}
                  </Text>
                )}
              </View>

              {/* Skills */}
              <Text style={styles.skillsTitle}>SKILLS ASSESSMENT</Text>
              {progress.skills.length === 0 ? (
                <Text style={styles.noSkillsText}>No skill data recorded</Text>
              ) : (
                progress.skills.map((sk, i) => (
                  <View key={i} style={styles.skillRow}>
                    <Text style={styles.skillName}>{sk.name}</Text>
                    <View style={styles.skillRight}>
                      <Text style={styles.skillStars}>{LEVEL_STARS[sk.level] ?? '—'}</Text>
                      <View style={[styles.levelBadge, { backgroundColor: (LEVEL_COLORS[sk.level] ?? COLORS.gray) + '20' }]}>
                        <Text style={[styles.levelText, { color: LEVEL_COLORS[sk.level] ?? COLORS.gray }]}>
                          {LEVEL_LABELS[sk.level] ?? sk.level}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}

              {/* Notes */}
              {progress.observation_notes ? (
                <View style={styles.notesCard}>
                  <Text style={styles.notesLabel}>TEACHER'S NOTES</Text>
                  <Text style={styles.notesText}>{progress.observation_notes}</Text>
                </View>
              ) : null}

              {/* Send button */}
              <TouchableOpacity
                style={[styles.sendBtn, sending && { opacity: 0.6 }]}
                onPress={sendReportToParent}
                disabled={sending}
                activeOpacity={0.85}
              >
                {sending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Ionicons name="send" size={18} color="#fff" />
                }
                <Text style={styles.sendBtnText}>{sending ? 'Sending...' : 'Send Report to Parent'}</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  headerSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  body: { flex: 1, flexDirection: 'row' },

  listPanel: {
    width: 160, backgroundColor: COLORS.white, borderRightWidth: 1, borderRightColor: COLORS.lightGray,
    paddingTop: 12, paddingHorizontal: 10,
  },
  panelTitle: { fontSize: 10, fontWeight: '700', color: COLORS.textLight, letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
  studentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 8,
    borderRadius: 10, marginBottom: 2,
  },
  studentRowActive: { backgroundColor: COLORS.primarySoft },
  studentAvatar: {
    width: 30, height: 30, borderRadius: 8, backgroundColor: COLORS.lightGray,
    justifyContent: 'center', alignItems: 'center',
  },
  studentAvatarText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  studentName: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },

  progressPanel: { flex: 1 },
  progressContent: { padding: 16, gap: 14, flexGrow: 1 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textSecondary },
  emptySubtitle: { fontSize: 13, color: COLORS.textLight, textAlign: 'center', paddingHorizontal: 20 },

  reportHeader: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 16, gap: 4,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  reportName: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  reportMeta: { fontSize: 13, fontWeight: '600', color: COLORS.secondary },
  reportDate: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },

  skillsTitle: { fontSize: 11, fontWeight: '700', color: COLORS.textLight, letterSpacing: 0.8, marginTop: 4 },
  noSkillsText: { fontSize: 14, color: COLORS.textSecondary, fontStyle: 'italic' },
  skillRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  skillName: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  skillRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  skillStars: { fontSize: 12, color: '#F59E0B' },
  levelBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  levelText: { fontSize: 11, fontWeight: '700' },

  notesCard: {
    backgroundColor: COLORS.primarySoft, borderRadius: 14, padding: 14, gap: 6,
    borderLeftWidth: 3, borderLeftColor: COLORS.primary,
  },
  notesLabel: { fontSize: 10, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.8 },
  notesText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },

  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, marginTop: 4,
  },
  sendBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});
