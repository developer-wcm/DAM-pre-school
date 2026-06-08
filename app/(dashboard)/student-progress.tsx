import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AnimatedProgressBar from '../../components/AnimatedProgressBar';
import CircularProgress from '../../components/CircularProgress';
import {
  getProgressLevelDetails,
  getSkillsForClass,
  SKILL_LEVELS,
  type Skill,
  type SkillLevel,
} from '../../constants/progressSkills';
import { useAuth } from '../../context/auth';
import { loadStudentProgress, mergeSkillsWithSaved } from '../../lib/progress';
import { exportClassReport, exportStudentReport } from '../../lib/progressReport';
import { supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StudentRow {
  id: string;
  full_name: string;
  class: string;
  roll_number: string | null;
}

interface StudentWithSkills extends StudentRow {
  skills: Skill[];
  overallPct: number;
}

type Term = 1 | 2 | 3;
type ClassCode = 'PG' | 'PKG' | 'JKG' | 'SKG';
type SortMode = 'name' | 'progress-desc' | 'progress-asc';
type LevelFilter = 'all' | SkillLevel;

// ─── Constants ────────────────────────────────────────────────────────────────
const CLASSES: { code: ClassCode; label: string; fullName: string; gradient: [string, string]; light: string; text: string; icon: string }[] = [
  { code: 'PG',  label: 'PG',  fullName: 'Play Group', gradient: ['#DAA520', '#F0C040'], light: '#FDF6E3', text: '#8B6010', icon: '🌱' },
  { code: 'PKG', label: 'PKG', fullName: 'Pre-KG',     gradient: ['#E05A5A', '#F08080'], light: '#FFF0F0', text: '#9B2020', icon: '🎈' },
  { code: 'JKG', label: 'JKG', fullName: 'Junior KG',  gradient: ['#1E3A5F', '#2C5282'], light: '#E8EDF3', text: '#1E3A5F', icon: '⭐' },
  { code: 'SKG', label: 'SKG', fullName: 'Senior KG',  gradient: ['#2A9D6E', '#38C98A'], light: '#D4F4E8', text: '#1A6B45', icon: '🏆' },
];

const SKILL_CATEGORY_GROUPS: Record<string, { label: string; emoji: string; color: string }> = {
  comm:   { label: 'Communication', emoji: '🗣️', color: '#7B6FE8' },
  part:   { label: 'Participation', emoji: '🎯', color: '#F39C12' },
  social: { label: 'Social Skills', emoji: '🤝', color: '#2A9D6E' },
  motor:  { label: 'Motor Skills', emoji: '🏃', color: '#E05A5A' },
  cog:    { label: 'Cognitive', emoji: '🧠', color: '#1E3A5F' },
  num:    { label: 'Numerical', emoji: '🔢', color: '#DAA520' },
  lang:   { label: 'Language', emoji: '📖', color: '#3498DB' },
  gk:     { label: 'General Knowledge', emoji: '🌍', color: '#9B59B6' },
  rhyme:  { label: 'Rhymes & Songs', emoji: '🎵', color: '#E91E63' },
};

const SORT_OPTIONS: { mode: SortMode; label: string; icon: any }[] = [
  { mode: 'name', label: 'Name', icon: 'text-outline' },
  { mode: 'progress-desc', label: 'High → Low', icon: 'trending-down-outline' },
  { mode: 'progress-asc', label: 'Low → High', icon: 'trending-up-outline' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function skillCategory(skillId: string) {
  const prefix = skillId.split('-')[0];
  return SKILL_CATEGORY_GROUPS[prefix] ?? { label: 'Other', emoji: '📌', color: '#8B95A1' };
}
function levelToPct(level: SkillLevel) { return getProgressLevelDetails(level).progress; }
function avgPct(skills: Skill[]) {
  if (!skills.length) return 0;
  return Math.round(skills.reduce((s, sk) => s + levelToPct(sk.level), 0) / skills.length);
}
function nearestLevel(pct: number) {
  return SKILL_LEVELS.reduce((prev, curr) =>
    Math.abs(curr.progress - pct) < Math.abs(prev.progress - pct) ? curr : prev
  );
}
function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function StudentProgressScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const schoolId = profile?.school_id ?? '';

  const [term, setTerm] = useState<Term>(1);
  const [activeClass, setActiveClass] = useState<ClassCode>('PG');
  const [allStudents, setAllStudents] = useState<StudentRow[]>([]);
  const [studentSkillMap, setStudentSkillMap] = useState<Map<string, Skill[]>>(new Map());
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  // Controls
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('name');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [exporting, setExporting] = useState(false);

  // ── Fetch students ──
  useEffect(() => {
    if (!schoolId) return;
    (async () => {
      setLoadingStudents(true);
      const { data } = await supabase
        .from('students')
        .select('id, full_name, class, roll_number')
        .eq('school_id', schoolId)
        .eq('status', 'active')
        .order('full_name');
      setAllStudents((data ?? []) as StudentRow[]);
      setLoadingStudents(false);
    })();
  }, [schoolId]);

  // ── Load skills for current class+term ──
  const loadSkillsForClass = useCallback(async (classCode: ClassCode, t: Term, students: StudentRow[]) => {
    const inClass = students.filter((s) => s.class === classCode);
    if (!inClass.length) return;
    setLoadingSkills(true);
    const map = new Map<string, Skill[]>(studentSkillMap);
    await Promise.all(
      inClass.map(async (s) => {
        const defaults = getSkillsForClass(s.class).map((sk) => ({ ...sk }));
        const saved = await loadStudentProgress(s.id, t);
        map.set(`${s.id}:${t}`, mergeSkillsWithSaved(defaults, saved));
      })
    );
    setStudentSkillMap(new Map(map));
    setLoadingSkills(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loadingStudents && allStudents.length) {
      loadSkillsForClass(activeClass, term, allStudents);
    }
  }, [activeClass, term, allStudents, loadingStudents]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived: class students with skills ──
  const classStudents = useMemo<StudentWithSkills[]>(() => {
    return allStudents
      .filter((s) => s.class === activeClass)
      .map((s) => {
        const skills = studentSkillMap.get(`${s.id}:${term}`) ?? getSkillsForClass(s.class).map((sk) => ({ ...sk }));
        return { ...s, skills, overallPct: avgPct(skills) };
      });
  }, [allStudents, activeClass, term, studentSkillMap]);

  // ── Search + filter + sort ──
  const displayStudents = useMemo(() => {
    let list = classStudents;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        s.full_name.toLowerCase().includes(q) || (s.roll_number ?? '').toLowerCase().includes(q)
      );
    }
    if (levelFilter !== 'all') {
      list = list.filter((s) => nearestLevel(s.overallPct).value === levelFilter);
    }
    const sorted = [...list];
    if (sortMode === 'name') sorted.sort((a, b) => a.full_name.localeCompare(b.full_name));
    else if (sortMode === 'progress-desc') sorted.sort((a, b) => b.overallPct - a.overallPct);
    else sorted.sort((a, b) => a.overallPct - b.overallPct);
    return sorted;
  }, [classStudents, search, levelFilter, sortMode]);

  // ── Class skill averages ──
  const classSkillAverages = useMemo(() => {
    const template = getSkillsForClass(activeClass);
    return template.map((sk) => {
      const levels = classStudents.map((s) => s.skills.find((x) => x.id === sk.id)?.level ?? 'emerging');
      const avg = Math.round(levels.reduce((sum, l) => sum + levelToPct(l), 0) / Math.max(levels.length, 1));
      return { ...sk, avgPct: avg };
    });
  }, [classStudents, activeClass]);

  const skillsByCategory = useMemo(() => {
    const groups: Record<string, typeof classSkillAverages> = {};
    classSkillAverages.forEach((sk) => {
      const prefix = sk.id.split('-')[0];
      (groups[prefix] ??= []).push(sk);
    });
    return groups;
  }, [classSkillAverages]);

  // ── Insights ──
  const insights = useMemo(() => {
    if (!classStudents.length) return null;
    const ranked = [...classStudents].sort((a, b) => b.overallPct - a.overallPct);
    const top = ranked[0];
    const needs = ranked[ranked.length - 1];
    const sortedSkills = [...classSkillAverages].sort((a, b) => b.avgPct - a.avgPct);
    const strongest = sortedSkills[0];
    const weakest = sortedSkills[sortedSkills.length - 1];
    const attentionCount = classStudents.filter((s) => s.overallPct < 50).length;
    return { top, needs, strongest, weakest, attentionCount };
  }, [classStudents, classSkillAverages]);

  const activeCfg = CLASSES.find((c) => c.code === activeClass)!;
  const classAvg = classStudents.length
    ? Math.round(classStudents.reduce((s, st) => s + st.overallPct, 0) / classStudents.length)
    : 0;

  // ── Exports ──
  const handleExportClass = useCallback(async () => {
    if (!classStudents.length) { Alert.alert('Nothing to export', 'No students in this class.'); return; }
    setExporting(true);
    try {
      await exportClassReport(
        activeCfg.label,
        activeCfg.fullName,
        term,
        classStudents.map((s) => ({ id: s.id, full_name: s.full_name, roll_number: s.roll_number, skills: s.skills, overallPct: s.overallPct })),
        classSkillAverages.map((sk) => ({ name: sk.name, emoji: sk.emoji, avgPct: sk.avgPct, required: sk.required }))
      );
    } catch (e: any) {
      Alert.alert('Export failed', e?.message ?? 'Could not generate the report.');
    } finally {
      setExporting(false);
    }
  }, [classStudents, classSkillAverages, activeCfg, term]);

  const handleExportStudent = useCallback(async (st: StudentWithSkills) => {
    setExporting(true);
    try {
      await exportStudentReport(
        { id: st.id, full_name: st.full_name, roll_number: st.roll_number, skills: st.skills, overallPct: st.overallPct },
        term,
        activeCfg.fullName
      );
    } catch (e: any) {
      Alert.alert('Export failed', e?.message ?? 'Could not generate the report.');
    } finally {
      setExporting(false);
    }
  }, [term, activeCfg]);

  if (loadingStudents) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#1E3A5F" />
        <Text style={styles.loadingText}>Loading progress data…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {exporting && (
        <View style={styles.exportOverlay}>
          <View style={styles.exportBox}>
            <ActivityIndicator size="large" color="#1E3A5F" />
            <Text style={styles.exportText}>Generating PDF…</Text>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <LinearGradient colors={['#1E3A5F', '#2C5282']} style={styles.headerGrad}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Student Progress</Text>
            <Text style={styles.headerSub}>Academic Year 2025–26</Text>
          </View>
          <View style={styles.totalBadge}>
            <Text style={styles.totalNum}>{allStudents.length}</Text>
            <Text style={styles.totalLabel}>Students</Text>
          </View>
        </LinearGradient>

        {/* ── Term Selector ── */}
        <View style={styles.termRow}>
          <Text style={styles.termLabel}>Term</Text>
          {([1, 2, 3] as Term[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.termBtn, term === t && styles.termBtnActive]}
              onPress={() => setTerm(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.termBtnText, term === t && styles.termBtnTextActive]}>Term {t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Class Tabs ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.classTabs}>
          {CLASSES.map((cls) => {
            const count = allStudents.filter((s) => s.class === cls.code).length;
            const isActive = activeClass === cls.code;
            return (
              <TouchableOpacity
                key={cls.code}
                style={[styles.classTab, isActive && styles.classTabActive]}
                onPress={() => { setActiveClass(cls.code); setExpandedStudent(null); }}
                activeOpacity={0.8}
              >
                {isActive ? (
                  <LinearGradient colors={cls.gradient} style={styles.classTabGrad}>
                    <Text style={styles.classTabIcon}>{cls.icon}</Text>
                    <Text style={styles.classTabLabelActive}>{cls.label}</Text>
                    <Text style={styles.classTabCountActive}>{count}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.classTabInner, { backgroundColor: cls.light }]}>
                    <Text style={styles.classTabIcon}>{cls.icon}</Text>
                    <Text style={[styles.classTabLabel, { color: cls.text }]}>{cls.label}</Text>
                    <Text style={[styles.classTabCount, { color: cls.text + 'AA' }]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Class Banner with Circular Progress ── */}
        <LinearGradient colors={activeCfg.gradient} style={styles.classBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerLabel}>{activeCfg.fullName}</Text>
            <Text style={styles.bannerSub}>{classStudents.length} students · Term {term}</Text>
            <TouchableOpacity style={styles.exportClassBtn} onPress={handleExportClass} activeOpacity={0.85}>
              <Ionicons name="download-outline" size={14} color="#FFFFFF" />
              <Text style={styles.exportClassText}>Export Class PDF</Text>
            </TouchableOpacity>
          </View>
          <CircularProgress
            percent={classAvg}
            size={92}
            colors={['#FFFFFF', '#FFFFFF']}
            trackColor="rgba(255,255,255,0.25)"
            subLabel="Class Avg"
          />
        </LinearGradient>

        {/* ── Insights ── */}
        {insights && (
          <View style={styles.insightsRow}>
            <View style={[styles.insightCard, { backgroundColor: '#D4F4E8' }]}>
              <Text style={styles.insightIcon}>🏆</Text>
              <Text style={styles.insightLabel}>Top Performer</Text>
              <Text style={styles.insightValue} numberOfLines={1}>{insights.top.full_name}</Text>
              <Text style={[styles.insightPct, { color: '#1A6B45' }]}>{insights.top.overallPct}%</Text>
            </View>
            <View style={[styles.insightCard, { backgroundColor: '#FFF0F0' }]}>
              <Text style={styles.insightIcon}>💡</Text>
              <Text style={styles.insightLabel}>Needs Attention</Text>
              <Text style={styles.insightValue} numberOfLines={1}>{insights.needs.full_name}</Text>
              <Text style={[styles.insightPct, { color: '#9B2020' }]}>{insights.needs.overallPct}%</Text>
            </View>
            <View style={[styles.insightCard, { backgroundColor: '#E8EDF3' }]}>
              <Text style={styles.insightIcon}>{insights.strongest?.emoji ?? '⭐'}</Text>
              <Text style={styles.insightLabel}>Strongest Skill</Text>
              <Text style={styles.insightValue} numberOfLines={1}>{insights.strongest?.name ?? '—'}</Text>
              <Text style={[styles.insightPct, { color: '#1E3A5F' }]}>{insights.strongest?.avgPct ?? 0}%</Text>
            </View>
            <View style={[styles.insightCard, { backgroundColor: '#FDF6E3' }]}>
              <Text style={styles.insightIcon}>{insights.weakest?.emoji ?? '📈'}</Text>
              <Text style={styles.insightLabel}>Focus Skill</Text>
              <Text style={styles.insightValue} numberOfLines={1}>{insights.weakest?.name ?? '—'}</Text>
              <Text style={[styles.insightPct, { color: '#8B6010' }]}>{insights.weakest?.avgPct ?? 0}%</Text>
            </View>
          </View>
        )}

        {/* ── Skills Overview ── */}
        {loadingSkills ? (
          <View style={styles.skillsLoading}>
            <ActivityIndicator size="small" color="#1E3A5F" />
            <Text style={styles.skillsLoadingText}>Loading skills…</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="bar-chart-outline" size={18} color="#1E3A5F" />
              <Text style={styles.cardTitle}>Skills Overview</Text>
              <Text style={styles.cardSub}>{classStudents.length > 0 ? 'Class average' : 'No students'}</Text>
            </View>
            {Object.entries(skillsByCategory).map(([prefix, skills]) => {
              const cat = skillCategory(skills[0].id);
              return (
                <View key={prefix} style={styles.categoryBlock}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.categoryLabel, { color: cat.color }]}>{cat.label}</Text>
                  </View>
                  {skills.map((sk) => {
                    const ld = nearestLevel(sk.avgPct);
                    return (
                      <View key={sk.id} style={styles.skillRow}>
                        <Text style={styles.skillEmoji}>{sk.emoji}</Text>
                        <View style={styles.skillInfo}>
                          <View style={styles.skillNameRow}>
                            <Text style={styles.skillName}>{sk.name}</Text>
                            <View style={[styles.levelPill, { backgroundColor: ld.color + '22' }]}>
                              <Text style={[styles.levelPillText, { color: ld.color }]}>{sk.avgPct}%</Text>
                            </View>
                          </View>
                          <AnimatedProgressBar percent={sk.avgPct} color={ld.color} />
                          {sk.required && <Text style={styles.requiredTag}>★ Required</Text>}
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })}
            {classSkillAverages.length === 0 && (
              <View style={styles.emptySkills}>
                <Text style={styles.emptySkillsText}>No skills defined for this class.</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Level Legend ── */}
        <View style={styles.legend}>
          {SKILL_LEVELS.map((l) => (
            <View key={l.value} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: l.color }]} />
              <Text style={styles.legendText}>{l.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Students Section ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="people-outline" size={18} color="#1E3A5F" />
            <Text style={styles.cardTitle}>Students</Text>
            <Text style={styles.cardSub}>{displayStudents.length} of {classStudents.length}</Text>
          </View>

          {/* Search */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color="#8B95A1" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or roll #"
              placeholderTextColor="#A8B2BD"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color="#A8B2BD" />
              </TouchableOpacity>
            )}
          </View>

          {/* Sort */}
          <View style={styles.sortRow}>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.mode}
                style={[styles.sortBtn, sortMode === opt.mode && styles.sortBtnActive]}
                onPress={() => setSortMode(opt.mode)}
                activeOpacity={0.8}
              >
                <Ionicons name={opt.icon} size={13} color={sortMode === opt.mode ? '#FFFFFF' : '#5A6C7D'} />
                <Text style={[styles.sortText, sortMode === opt.mode && styles.sortTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Level filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterChip, levelFilter === 'all' && styles.filterChipActiveAll]}
              onPress={() => setLevelFilter('all')}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, levelFilter === 'all' && { color: '#FFFFFF' }]}>All</Text>
            </TouchableOpacity>
            {SKILL_LEVELS.map((l) => {
              const active = levelFilter === l.value;
              return (
                <TouchableOpacity
                  key={l.value}
                  style={[styles.filterChip, active && { backgroundColor: l.color, borderColor: l.color }]}
                  onPress={() => setLevelFilter(active ? 'all' : l.value)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.filterDot, { backgroundColor: active ? '#FFFFFF' : l.color }]} />
                  <Text style={[styles.filterChipText, active && { color: '#FFFFFF' }]}>{l.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Student list */}
          {displayStudents.length === 0 ? (
            <View style={styles.emptyStudents}>
              <Text style={styles.emptyStudentsEmoji}>{classStudents.length === 0 ? '🎒' : '🔍'}</Text>
              <Text style={styles.emptyStudentsTitle}>
                {classStudents.length === 0 ? 'No Students Yet' : 'No Matches'}
              </Text>
              <Text style={styles.emptyStudentsText}>
                {classStudents.length === 0
                  ? `No students enrolled in ${activeCfg.fullName}.`
                  : 'Try adjusting your search or filters.'}
              </Text>
            </View>
          ) : (
            displayStudents.map((st) => {
              const isExpanded = expandedStudent === st.id;
              const ovl = nearestLevel(st.overallPct);
              return (
                <View key={st.id}>
                  <TouchableOpacity
                    style={styles.studentCard}
                    onPress={() => setExpandedStudent(isExpanded ? null : st.id)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient colors={activeCfg.gradient} style={styles.studentAvatar}>
                      <Text style={styles.studentAvatarText}>{getInitials(st.full_name)}</Text>
                    </LinearGradient>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{st.full_name}</Text>
                      {st.roll_number && <Text style={styles.studentRoll}>Roll #{st.roll_number}</Text>}
                      <View style={styles.studentProgressRow}>
                        <View style={{ flex: 1 }}>
                          <AnimatedProgressBar percent={st.overallPct} color={ovl.color} height={5} />
                        </View>
                        <Text style={[styles.studentProgressPct, { color: ovl.color }]}>{st.overallPct}%</Text>
                      </View>
                    </View>
                    <View style={[styles.levelBadge, { backgroundColor: ovl.color + '18' }]}>
                      <Text style={[styles.levelBadgeText, { color: ovl.color }]}>{ovl.label}</Text>
                    </View>
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#8B95A1" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.expandedSkills}>
                      {st.skills.map((sk) => {
                        const ld = getProgressLevelDetails(sk.level);
                        return (
                          <View key={sk.id} style={styles.expandedSkillRow}>
                            <Text style={styles.expandedSkillEmoji}>{sk.emoji}</Text>
                            <View style={styles.expandedSkillInfo}>
                              <Text style={styles.expandedSkillName}>{sk.name}</Text>
                              <AnimatedProgressBar percent={ld.progress} color={ld.color} height={5} trackColor="#E2E8F0" />
                            </View>
                            <View style={[styles.expandedLevelPill, { backgroundColor: ld.color + '20' }]}>
                              <Text style={[styles.expandedLevelText, { color: ld.color }]}>{ld.label}</Text>
                            </View>
                          </View>
                        );
                      })}
                      <View style={styles.expandedActions}>
                        <TouchableOpacity
                          style={styles.viewProfileBtn}
                          onPress={() => router.push({ pathname: '/(dashboard)/student-profile', params: { id: st.id } })}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="person-outline" size={15} color="#1E3A5F" />
                          <Text style={styles.viewProfileText}>Full Profile</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.exportStudentBtn}
                          onPress={() => handleExportStudent(st)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="download-outline" size={15} color="#FFFFFF" />
                          <Text style={styles.exportStudentText}>Export PDF</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  scroll: { paddingBottom: 30 },
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: '#F0F4F8' },
  loadingText: { color: '#5A6C7D', fontSize: 14, fontWeight: '600' },

  exportOverlay: {
    ...StyleSheet.absoluteFillObject, zIndex: 100,
    backgroundColor: 'rgba(30,58,95,0.35)', justifyContent: 'center', alignItems: 'center',
  },
  exportBox: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 28, alignItems: 'center', gap: 12 },
  exportText: { fontSize: 14, fontWeight: '700', color: '#1E3A5F' },

  // Header
  headerGrad: { paddingTop: 52, paddingBottom: 24, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', letterSpacing: 0.2 },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500', marginTop: 2 },
  totalBadge: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
  totalNum: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  totalLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '600', marginTop: 1 },

  // Term
  termRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 18, marginTop: 18, marginBottom: 6 },
  termLabel: { fontSize: 13, fontWeight: '700', color: '#5A6C7D', marginRight: 4 },
  termBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0' },
  termBtnActive: { backgroundColor: '#1E3A5F', borderColor: '#1E3A5F' },
  termBtnText: { fontSize: 13, fontWeight: '700', color: '#5A6C7D' },
  termBtnTextActive: { color: '#FFFFFF' },

  // Class tabs
  classTabs: { paddingHorizontal: 18, paddingVertical: 10, gap: 10 },
  classTab: { borderRadius: 16, overflow: 'hidden' },
  classTabActive: { shadowColor: '#1E3A5F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5 },
  classTabGrad: { paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center', gap: 4, minWidth: 80 },
  classTabInner: { paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center', gap: 4, minWidth: 80 },
  classTabIcon: { fontSize: 20 },
  classTabLabel: { fontSize: 13, fontWeight: '800' },
  classTabLabelActive: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  classTabCount: { fontSize: 11, fontWeight: '600' },
  classTabCountActive: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },

  // Banner
  classBanner: { marginHorizontal: 18, marginBottom: 14, borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  bannerLeft: { flex: 1 },
  bannerLabel: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  bannerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '500', marginTop: 3 },
  exportClassBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start',
  },
  exportClassText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  // Insights
  insightsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginHorizontal: 18, marginBottom: 14 },
  insightCard: { width: '47%', flexGrow: 1, borderRadius: 16, padding: 14 },
  insightIcon: { fontSize: 20, marginBottom: 4 },
  insightLabel: { fontSize: 10, fontWeight: '700', color: '#5A6C7D', textTransform: 'uppercase', letterSpacing: 0.4 },
  insightValue: { fontSize: 14, fontWeight: '800', color: '#1A1A2E', marginTop: 3 },
  insightPct: { fontSize: 18, fontWeight: '900', marginTop: 2 },

  skillsLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20 },
  skillsLoadingText: { color: '#5A6C7D', fontSize: 13, fontWeight: '500' },

  // Card
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 20, marginHorizontal: 18, marginBottom: 14,
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8,
    shadowColor: 'rgba(30,58,95,0.1)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 14, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F0F4F8' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#1E3A5F', flex: 1 },
  cardSub: { fontSize: 11, color: '#8B95A1', fontWeight: '600' },

  // Category
  categoryBlock: { marginBottom: 18 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  categoryEmoji: { fontSize: 16 },
  categoryLabel: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Skill row
  skillRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  skillEmoji: { fontSize: 20, marginTop: 1 },
  skillInfo: { flex: 1 },
  skillNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  skillName: { fontSize: 13, fontWeight: '700', color: '#1E3A5F', flex: 1 },
  levelPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  levelPillText: { fontSize: 11, fontWeight: '800' },
  requiredTag: { fontSize: 9, color: '#DAA520', fontWeight: '700', marginTop: 3 },
  emptySkills: { paddingVertical: 20, alignItems: 'center' },
  emptySkillsText: { color: '#8B95A1', fontSize: 13 },

  // Legend
  legend: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginHorizontal: 18, marginBottom: 14,
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    shadowColor: 'rgba(30,58,95,0.06)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontWeight: '600', color: '#5A6C7D' },

  // Search
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0F4F8', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#1E3A5F', padding: 0 },

  // Sort
  sortRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  sortBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: '#F0F4F8', borderRadius: 10, paddingVertical: 8,
  },
  sortBtnActive: { backgroundColor: '#1E3A5F' },
  sortText: { fontSize: 11, fontWeight: '700', color: '#5A6C7D' },
  sortTextActive: { color: '#FFFFFF' },

  // Filter chips
  filterRow: { gap: 8, paddingVertical: 2, paddingRight: 8, marginBottom: 14 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 18, paddingHorizontal: 12, paddingVertical: 6,
  },
  filterChipActiveAll: { backgroundColor: '#1E3A5F', borderColor: '#1E3A5F' },
  filterDot: { width: 7, height: 7, borderRadius: 4 },
  filterChipText: { fontSize: 12, fontWeight: '700', color: '#5A6C7D' },

  // Student card
  studentCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F0F4F8' },
  studentAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  studentAvatarText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: '800', color: '#1E3A5F' },
  studentRoll: { fontSize: 11, color: '#8B95A1', fontWeight: '500', marginTop: 1 },
  studentProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  studentProgressPct: { fontSize: 12, fontWeight: '800', minWidth: 34, textAlign: 'right' },
  levelBadge: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  levelBadgeText: { fontSize: 10, fontWeight: '800' },

  // Expanded
  expandedSkills: { backgroundColor: '#F8FAFC', borderRadius: 14, marginBottom: 10, padding: 14, gap: 10, borderLeftWidth: 3, borderLeftColor: '#1E3A5F' },
  expandedSkillRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  expandedSkillEmoji: { fontSize: 17 },
  expandedSkillInfo: { flex: 1 },
  expandedSkillName: { fontSize: 12, fontWeight: '700', color: '#1E3A5F', marginBottom: 4 },
  expandedLevelPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, minWidth: 72, alignItems: 'center' },
  expandedLevelText: { fontSize: 10, fontWeight: '800' },
  expandedActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  viewProfileBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#E8EDF3', borderRadius: 10, paddingVertical: 10,
  },
  viewProfileText: { fontSize: 12, fontWeight: '700', color: '#1E3A5F' },
  exportStudentBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#1E3A5F', borderRadius: 10, paddingVertical: 10,
  },
  exportStudentText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },

  emptyStudents: { alignItems: 'center', paddingVertical: 36, gap: 6 },
  emptyStudentsEmoji: { fontSize: 40 },
  emptyStudentsTitle: { fontSize: 16, fontWeight: '800', color: '#1E3A5F' },
  emptyStudentsText: { fontSize: 13, color: '#8B95A1', fontWeight: '500', textAlign: 'center' },
});
