import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import AnimatedProgressBar from '../../components/AnimatedProgressBar';
import { supabase } from '../../lib/supabase';

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  navy:      '#1E3A5F',
  navyLight: '#2C5282',
  navySoft:  '#E8EDF5',
  gold:      '#DAA520',
  bg:        '#F0F4F8',
  white:     '#FFFFFF',
  textPrimary: '#1A1A2E',
  textSecond:  '#5A6C7D',
  textLight:   '#8B95A1',
  border:    '#E2E8F0',
};

const DEFAULT_SCHOOL_ID = 'DEMO01';

interface Student {
  id: string;
  full_name: string;
  roll_number: string | null;
}

interface SkillEntry {
  name: string;
  level: number; // 1–4
}

interface ProgressData {
  term: string;
  skills: SkillEntry[];
  observation_notes: string | null;
  updated_at: string | null;
}

const LEVEL_LABELS = ['', 'Emerging', 'Developing', 'Proficient', 'Exceeding'];
const LEVEL_COLORS = ['', '#E05A5A', '#F39C12', '#7B6FE8', '#2A9D6E'];

function parseSkills(raw: any): SkillEntry[] {
  if (!raw) return [];
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(arr)) {
      // Handle both {name, level: number} and {name, level: string} formats
      return arr.map((sk: any) => {
        if (typeof sk.level === 'number') return sk;
        const levelMap: Record<string, number> = { emerging: 1, developing: 2, proficient: 3, advanced: 4 };
        return { name: sk.name ?? sk.id ?? '?', level: levelMap[sk.level] ?? 1 };
      });
    }
    if (typeof arr === 'object') {
      return Object.entries(arr).map(([name, level]) => ({ name, level: Number(level) }));
    }
  } catch {}
  return [];
}

function avgRating(skills: SkillEntry[]): number {
  if (!skills.length) return 0;
  return Math.round((skills.reduce((s, sk) => s + sk.level, 0) / skills.length / 4) * 5 * 10) / 10;
}

function buildRemarkMessage(student: Student, progress: ProgressData): string {
  const stars = avgRating(progress.skills);
  const skillLines = progress.skills
    .map((sk) => `  • ${sk.name}: ${LEVEL_LABELS[sk.level] ?? sk.level}`)
    .join('\n');
  const notes = progress.observation_notes ? `\n\nTeacher's Note: ${progress.observation_notes}` : '';
  return `📊 Progress Report — ${student.full_name}\nTerm: ${progress.term}\nOverall Rating: ${stars}/5 ⭐\n\nSkills:\n${skillLines}${notes}`;
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
        .eq('status', 'active')
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
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={C.navy} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <LinearGradient colors={[C.navy, C.navyLight]} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Progress Reports</Text>
          <Text style={styles.headerSub}>
            {teacherInfo?.assignedClass ? `Class ${teacherInfo.assignedClass}` : 'No class assigned'} · Tap student to view
          </Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeNum}>{students.length}</Text>
          <Text style={styles.headerBadgeLabel}>Students</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* ── Student list panel ── */}
        <View style={styles.listPanel}>
          <Text style={styles.panelTitle}>STUDENTS</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {students.map((s) => {
              const isActive = selected?.id === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.studentRow, isActive && styles.studentRowActive]}
                  onPress={() => loadProgress(s)}
                  activeOpacity={0.7}
                >
                  {isActive ? (
                    <LinearGradient colors={[C.navy, C.navyLight]} style={styles.studentAvatar}>
                      <Text style={[styles.studentAvatarText, { color: '#FFFFFF' }]}>{getInitials(s.full_name)}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.studentAvatar, { backgroundColor: C.navySoft }]}>
                      <Text style={[styles.studentAvatarText, { color: C.navy }]}>{getInitials(s.full_name)}</Text>
                    </View>
                  )}
                  <Text
                    style={[styles.studentName, isActive && { color: C.navy, fontWeight: '800' }]}
                    numberOfLines={1}
                  >
                    {s.full_name}
                  </Text>
                  {isActive && <Ionicons name="chevron-forward" size={12} color={C.navy} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Progress panel ── */}
        <ScrollView style={styles.progressPanel} contentContainerStyle={styles.progressContent} showsVerticalScrollIndicator={false}>
          {!selected ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="ribbon-outline" size={44} color={C.navy} />
              </View>
              <Text style={styles.emptyTitle}>Select a Student</Text>
              <Text style={styles.emptySubtitle}>Tap a student on the left to view their progress report.</Text>
            </View>
          ) : loadingProgress ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={C.navy} />
            </View>
          ) : !progress ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="document-outline" size={44} color={C.navy} />
              </View>
              <Text style={styles.emptyTitle}>No Report Yet</Text>
              <Text style={styles.emptySubtitle}>No progress assessment found for {selected.full_name}.</Text>
            </View>
          ) : (
            <>
              {/* Student info card */}
              <LinearGradient colors={[C.navy, C.navyLight]} style={styles.reportHeader}>
                <View style={styles.reportAvatarWrap}>
                  <View style={styles.reportAvatar}>
                    <Text style={styles.reportAvatarText}>{getInitials(selected.full_name)}</Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reportName}>{selected.full_name}</Text>
                  <Text style={styles.reportMeta}>
                    {progress.term.replace('term', 'Term ')} · {avgRating(progress.skills)}/5 ⭐
                  </Text>
                  {progress.updated_at && (
                    <Text style={styles.reportDate}>
                      Updated {new Date(progress.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  )}
                </View>
              </LinearGradient>

              {/* Skills */}
              <Text style={styles.sectionLabel}>SKILLS ASSESSMENT</Text>
              {progress.skills.length === 0 ? (
                <Text style={styles.noSkillsText}>No skill data recorded</Text>
              ) : (
                progress.skills.map((sk, i) => {
                  const color = LEVEL_COLORS[sk.level] ?? C.textLight;
                  const pct = Math.round((sk.level / 4) * 100);
                  return (
                    <View key={i} style={styles.skillRow}>
                      <View style={styles.skillRowTop}>
                        <Text style={styles.skillName}>{sk.name}</Text>
                        <View style={[styles.levelBadge, { backgroundColor: color + '20' }]}>
                          <Text style={[styles.levelText, { color }]}>
                            {LEVEL_LABELS[sk.level] ?? '—'}
                          </Text>
                        </View>
                      </View>
                      <AnimatedProgressBar percent={pct} color={color} height={5} trackColor="#E2E8F0" />
                    </View>
                  );
                })
              )}

              {/* Notes */}
              {progress.observation_notes ? (
                <View style={styles.notesCard}>
                  <View style={styles.notesHeader}>
                    <Ionicons name="document-text-outline" size={14} color={C.navy} />
                    <Text style={styles.notesLabel}>TEACHER'S NOTES</Text>
                  </View>
                  <Text style={styles.notesText}>{progress.observation_notes}</Text>
                </View>
              ) : null}

              {/* Send button */}
              <TouchableOpacity
                style={[styles.sendBtn, sending && { opacity: 0.65 }]}
                onPress={sendReportToParent}
                disabled={sending}
                activeOpacity={0.85}
              >
                <LinearGradient colors={[C.navy, C.navyLight]} style={styles.sendBtnGrad}>
                  {sending
                    ? <ActivityIndicator color="#FFF" size="small" />
                    : <Ionicons name="send-outline" size={18} color="#FFF" />
                  }
                  <Text style={styles.sendBtnText}>{sending ? 'Sending…' : 'Send Report to Parent'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '900', letterSpacing: 0.2 },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '500', marginTop: 2 },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 7, alignItems: 'center',
  },
  headerBadgeNum: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  headerBadgeLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 9, fontWeight: '600', marginTop: 1 },

  body: { flex: 1, flexDirection: 'row' },

  // Student list panel
  listPanel: {
    width: 150, backgroundColor: C.white, borderRightWidth: 1, borderRightColor: C.border,
    paddingTop: 14, paddingHorizontal: 8,
  },
  panelTitle: { fontSize: 9, fontWeight: '800', color: C.textLight, letterSpacing: 1, marginBottom: 8, marginLeft: 6 },
  studentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 9, paddingHorizontal: 8, borderRadius: 12, marginBottom: 2,
  },
  studentRowActive: { backgroundColor: C.navySoft },
  studentAvatar: {
    width: 30, height: 30, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  studentAvatarText: { fontSize: 12, fontWeight: '800' },
  studentName: { flex: 1, fontSize: 12, fontWeight: '600', color: C.textSecond },

  // Progress panel
  progressPanel: { flex: 1 },
  progressContent: { padding: 14, gap: 12, flexGrow: 1 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.navySoft, justifyContent: 'center', alignItems: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: C.textSecond },
  emptySubtitle: { fontSize: 12, color: C.textLight, textAlign: 'center', paddingHorizontal: 20 },

  // Report header card
  reportHeader: {
    borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  reportAvatarWrap: {},
  reportAvatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center',
  },
  reportAvatarText: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  reportName: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  reportMeta: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  reportDate: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 3 },

  sectionLabel: { fontSize: 10, fontWeight: '800', color: C.textLight, letterSpacing: 1 },
  noSkillsText: { fontSize: 13, color: C.textSecond, fontStyle: 'italic' },

  skillRow: {
    backgroundColor: C.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    gap: 8,
    shadowColor: C.navy, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  skillRowTop: { flexDirection: 'row', alignItems: 'center' },
  skillName: { flex: 1, fontSize: 13, fontWeight: '600', color: C.textPrimary },
  levelBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  levelText: { fontSize: 10, fontWeight: '800' },

  notesCard: {
    backgroundColor: C.navySoft, borderRadius: 14, padding: 14, gap: 7,
    borderLeftWidth: 3, borderLeftColor: C.navy,
  },
  notesHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notesLabel: { fontSize: 10, fontWeight: '800', color: C.navy, letterSpacing: 0.8 },
  notesText: { fontSize: 13, color: C.textPrimary, lineHeight: 20 },

  sendBtn: { borderRadius: 16, overflow: 'hidden' },
  sendBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16,
  },
  sendBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
