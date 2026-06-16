import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/auth';
import { useChild } from '../../context/child';
import { supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChildStats {
  presentDays: number;
  totalDays: number;
  lateCount: number;
  outstandingFees: number;
  nextDueDate: string | null;
  progressTerm: string | null;
  progressRating: number;       // 1-5 stars derived from avg skill level
  progressNotes: string | null;
  recentActivity: { label: string; time: string; icon: string; color: string; bg: string }[];
}

// ─── Skill level → score ──────────────────────────────────────────────────────
function skillsToRating(skillsJson: any): number {
  try {
    const skills = typeof skillsJson === 'string' ? JSON.parse(skillsJson) : skillsJson;
    if (!Array.isArray(skills) || skills.length === 0) return 0;
    const levelMap: Record<string, number> = {
      beginning: 1, developing: 2, meeting: 3, exceeding: 4,
    };
    const total = skills.reduce((sum: number, s: any) => {
      return sum + (levelMap[s.level?.toLowerCase?.()] ?? 0);
    }, 0);
    const avg = total / skills.length; // 0–4
    return Math.round((avg / 4) * 5);  // convert to 1–5 stars
  } catch {
    return 0;
  }
}

function termLabel(term: string) {
  const map: Record<string, string> = { term1: 'Term 1', term2: 'Term 2', term3: 'Term 3' };
  return map[term] ?? term;
}

// ─── Stats hook ───────────────────────────────────────────────────────────────

function useChildStats(childId: string | undefined) {
  const [stats, setStats] = useState<ChildStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!childId) { setStats(null); return; }
    setLoading(true);

    const today      = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd   = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    Promise.all([
      // 1. Attendance this month
      supabase.from('attendance')
        .select('status, date')
        .eq('student_id', childId)
        .gte('date', monthStart).lte('date', monthEnd),

      // 2. Outstanding fees
      supabase.from('fees')
        .select('amount, due_date')
        .eq('student_id', childId)
        .eq('paid', false)
        .order('due_date', { ascending: true }),

      // 3. Latest progress (skills JSON + term + notes)
      supabase.from('student_progress')
        .select('term, skills, observation_notes, updated_at')
        .eq('student_id', childId)
        .order('updated_at', { ascending: false })
        .limit(1),

      // 4. Recent remarks
      supabase.from('student_remarks')
        .select('message, created_at, sender_role')
        .eq('student_id', childId)
        .order('created_at', { ascending: false })
        .limit(3),
    ]).then(([attendanceRes, feesRes, progressRes, remarksRes]) => {

      // ── Attendance ──────────────────────────────────────────────────────────
      const rows       = attendanceRes.data ?? [];
      const presentCount = rows.filter((r: any) => r.status === 'present').length;
      const absentCount  = rows.filter((r: any) => r.status === 'absent').length;
      const lateCount    = rows.filter((r: any) => r.status === 'late').length;
      const totalDays    = rows.length;
      const lateAbsentPenalty = Math.floor(lateCount / 4);
      const effectiveAbsent   = absentCount + lateAbsentPenalty;
      const effectivePresent  = Math.max(0, totalDays - effectiveAbsent);

      // ── Fees ────────────────────────────────────────────────────────────────
      const outstanding = (feesRes.data ?? []).reduce((s: number, f: any) => s + Number(f.amount), 0);

      // ── Progress ────────────────────────────────────────────────────────────
      const prog = progressRes.data?.[0];
      const progressRating = prog ? skillsToRating(prog.skills) : 0;

      // ── Recent Activity (real data) ─────────────────────────────────────────
      const activity: ChildStats['recentActivity'] = [];

      // Latest attendance
      const lastAttRow = rows.sort((a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      if (lastAttRow) {
        const statusLabel = lastAttRow.status === 'present' ? 'Marked present'
          : lastAttRow.status === 'absent' ? 'Marked absent' : 'Marked late';
        const isToday = lastAttRow.date === today.toISOString().split('T')[0];
        activity.push({
          label: statusLabel,
          time: isToday ? 'Today' : new Date(lastAttRow.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          icon: lastAttRow.status === 'present' ? 'checkmark-circle-outline' : lastAttRow.status === 'absent' ? 'close-circle-outline' : 'time-outline',
          color: lastAttRow.status === 'present' ? '#2A9D6E' : lastAttRow.status === 'absent' ? '#E05A5A' : '#E8A020',
          bg: lastAttRow.status === 'present' ? '#D4F4E8' : lastAttRow.status === 'absent' ? '#FFE4E4' : '#FFF0D4',
        });
      }

      // Fee status
      activity.push({
        label: outstanding > 0 ? `₹${outstanding.toLocaleString('en-IN')} fee pending` : 'All fees paid',
        time: 'This month',
        icon: 'card-outline',
        color: outstanding > 0 ? '#E8A020' : '#2A9D6E',
        bg: outstanding > 0 ? '#FFF0D4' : '#D4F4E8',
      });

      // Latest remark
      const lastRemark = (remarksRes.data ?? [])[0];
      if (lastRemark) {
        activity.push({
          label: `New remark from ${lastRemark.sender_role === 'teacher' ? 'teacher' : 'school'}`,
          time: new Date(lastRemark.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          icon: 'chatbubble-outline',
          color: '#7B6FE8',
          bg: '#E8E4F8',
        });
      }

      // Progress updated
      if (prog) {
        activity.push({
          label: `Progress updated • ${termLabel(prog.term)}`,
          time: new Date(prog.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          icon: 'ribbon-outline',
          color: '#E8A020',
          bg: '#FFF8D4',
        });
      }

      setStats({
        presentDays: effectivePresent,
        totalDays,
        lateCount,
        outstandingFees: outstanding,
        nextDueDate: feesRes.data?.[0]?.due_date ?? null,
        progressTerm: prog ? termLabel(prog.term) : null,
        progressRating,
        progressNotes: prog?.observation_notes ?? null,
        recentActivity: activity,
      });
      setLoading(false);
    });
  }, [childId]);

  return { stats, loading };
}

// ─── Circular progress ────────────────────────────────────────────────────────

function AttendanceRing({ present, total }: { present: number; total: number }) {
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;
  const good = pct >= 75;
  return (
    <View style={ring.wrap}>
      <View style={[ring.outer, { borderColor: good ? '#2A9D6E' : '#E05A5A' }]}>
        <View style={ring.inner}>
          <Text style={[ring.pct, { color: good ? '#2A9D6E' : '#E05A5A' }]}>{pct}%</Text>
        </View>
      </View>
    </View>
  );
}

const ring = StyleSheet.create({
  wrap:  { alignItems: 'center', justifyContent: 'center' },
  outer: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 6,
    justifyContent: 'center', alignItems: 'center',
    transform: [{ rotate: '-45deg' }],
  },
  inner: { transform: [{ rotate: '45deg' }] },
  pct:   { fontSize: 15, fontWeight: '800' },
});

// ─── Star rating ──────────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1,2,3,4,5].map((i) => (
        <Text key={i} style={{ fontSize: 16, color: i <= rating ? '#E8A020' : '#D0D0E0' }}>★</Text>
      ))}
    </View>
  );
}

// ─── Avatar initials ──────────────────────────────────────────────────────────

function AvatarCircle({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <View style={av.ring}>
      <View style={av.circle}>
        <Text style={av.text}>{initials}</Text>
      </View>
    </View>
  );
}

const av = StyleSheet.create({
  ring: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 3, borderColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#E8E4F8',
    shadowColor: '#0F1869', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 8,
  },
  circle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#D0CBF8',
    justifyContent: 'center', alignItems: 'center',
  },
  text: { fontSize: 36, fontWeight: '800', color: '#0F1869' },
});

// ─── Notices (announcements) ────────────────────────────────────────────────

interface Notice {
  id: string;
  title: string;
  body: string;
  file_url: string | null;
  target_audience: string | null;
  created_at: string;
  author: string | null;
}

// Audiences that every parent should see (anything else is treated as a
// class-specific target and only shown when it matches the child's class).
const BROADCAST_AUDIENCES = ['all_parents', 'all', 'everyone', 'parents'];

function isNoticeForChild(audience: string | null, childClass: string | null): boolean {
  if (!audience) return true; // untargeted notice → show to everyone
  const a = audience.trim().toLowerCase();
  if (BROADCAST_AUDIENCES.includes(a)) return true;
  if (childClass && a === childClass.trim().toLowerCase()) return true;
  return false;
}

function useNotices(childClass: string | null) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, body, file_url, target_audience, created_at, profiles:created_by(full_name)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.warn('[Notices] fetch failed:', error.message);
      setNotices([]);
    } else {
      const mapped: Notice[] = (data ?? [])
        .filter((row: any) => isNoticeForChild(row.target_audience, childClass))
        .map((row: any) => ({
          id: row.id,
          title: row.title,
          body: row.body,
          file_url: row.file_url ?? null,
          target_audience: row.target_audience ?? null,
          created_at: row.created_at,
          author: row.profiles?.full_name ?? null,
        }));
      setNotices(mapped);
    }
    setLoading(false);
  };

  return { notices, loading, fetchNotices };
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ParentChildScreen() {
  const router   = useRouter();
  const { user } = useAuth();
  const { activeChild, children, loading: childLoading } = useChild();
  const { stats, loading: statsLoading } = useChildStats(activeChild?.id);

  // Notices (school announcements)
  const { notices, loading: noticesLoading, fetchNotices } = useNotices(activeChild?.class ?? null);
  const [noticesVisible, setNoticesVisible] = useState(false);

  const openNotices = () => {
    setNoticesVisible(true);
    fetchNotices();
  };

  // Remarks
  const [remarks, setRemarks] = useState<any[]>([]);

  useEffect(() => {
    if (!activeChild?.id) return;
    supabase
      .from('student_remarks')
      .select('*')
      .eq('student_id', activeChild.id)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => setRemarks(data ?? []));

    // Mark as read
    supabase
      .from('student_remarks')
      .update({ is_read: true })
      .eq('student_id', activeChild.id)
      .eq('is_read', false)
      .then(() => {});
  }, [activeChild?.id]);

  if (childLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0EEFB' }}>
        <ActivityIndicator color="#0F1869" size="large" />
      </View>
    );
  }

  if (children.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F0EEFB' }}>
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <Ionicons name="person-outline" size={40} color="#0F1869" />
          </View>
          <Text style={styles.emptyTitle}>No child linked yet</Text>
          <Text style={styles.emptySub}>
            Ask your school admin to link your child to your account after approval.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const child      = activeChild!;
  const monthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const feePaid    = (stats?.outstandingFees ?? 0) === 0;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero section ── */}
        <View style={styles.hero}>
          <AvatarCircle name={child.full_name} />

          <Text style={styles.childName}>{child.full_name}</Text>

          <View style={styles.metaRow}>
            {child.class && (
              <View style={styles.classBadge}>
                <Text style={styles.classBadgeText}>{child.class.toUpperCase()}</Text>
              </View>
            )}
            {child.roll_number && (
              <Text style={styles.childId}>Roll: {child.roll_number}</Text>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.calendarBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/parent-appointments')}
            >
              <Ionicons name="calendar-outline" size={18} color="#0F1869" />
              <Text style={styles.calendarBtnText}>Calendar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.noticeBtn}
              activeOpacity={0.85}
              onPress={openNotices}
            >
              <Ionicons name="megaphone-outline" size={18} color="#FFFFFF" />
              <Text style={styles.noticeBtnText}>Notices</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Stats cards ── */}
        {statsLoading ? (
          <ActivityIndicator color="#0F1869" style={{ marginVertical: 20 }} />
        ) : (
          <>
            {/* Attendance */}
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.greenDot} />
                <Text style={styles.cardLabel}>ATTENDANCE</Text>
              </View>
              <View style={styles.attendanceRow}>
                <View style={{ gap: 4 }}>
                  <Text style={styles.bigNumber}>
                    {stats?.presentDays ?? 0} / {stats?.totalDays ?? 0}
                  </Text>
                  <Text style={styles.cardSub}>Days present • {monthLabel}</Text>
                  {(stats?.lateCount ?? 0) > 0 && (
                    <Text style={styles.lateNote}>
                      ⏰ {stats?.lateCount} late
                      {(stats?.lateCount ?? 0) >= 4
                        ? ` • ${Math.floor((stats?.lateCount ?? 0) / 4)} absent penalty`
                        : ` • ${4 - ((stats?.lateCount ?? 0) % 4)} more = 1 absent`}
                    </Text>
                  )}
                </View>
                <AttendanceRing
                  present={stats?.presentDays ?? 0}
                  total={stats?.totalDays ?? 0}
                />
              </View>
            </View>

            {/* Fee Status */}
            <View style={styles.card}>
              <View style={styles.rowCard}>
                <View style={[styles.iconBox, { backgroundColor: feePaid ? '#D4F4E8' : '#FFF0D4' }]}>
                  <Ionicons
                    name="card-outline"
                    size={22}
                    color={feePaid ? '#2A9D6E' : '#E8A020'}
                  />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardLabel}>FEE STATUS</Text>
                    <View style={[styles.feeBadge,
                      { backgroundColor: feePaid ? '#D4F4E8' : '#FFF0D4' }]}>
                      <Text style={[styles.feeBadgeText,
                        { color: feePaid ? '#2A9D6E' : '#E8A020' }]}>
                        {feePaid ? 'PAID' : 'OUTSTANDING'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.bigNumber, { fontSize: 26,
                    color: feePaid ? '#2A9D6E' : '#E05A5A' }]}>
                    {feePaid
                      ? 'All Clear ✓'
                      : `₹${(stats!.outstandingFees).toLocaleString('en-IN')}`}
                  </Text>
                  {stats?.nextDueDate && !feePaid && (
                    <Text style={styles.cardSub}>
                      Next due: {new Date(stats.nextDueDate).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Latest Progress */}
            {stats?.progressTerm && (
              <View style={styles.card}>
                <View style={styles.rowCard}>
                  <View style={[styles.iconBox, { backgroundColor: '#FFF8D4' }]}>
                    <Ionicons name="ribbon-outline" size={22} color="#E8A020" />
                  </View>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={styles.cardLabel}>LATEST PROGRESS • {stats.progressTerm}</Text>
                    <Stars rating={stats.progressRating} />
                    {stats.progressNotes ? (
                      <Text style={styles.progressLabel} numberOfLines={2}>{stats.progressNotes}</Text>
                    ) : (
                      <Text style={styles.progressLabel}>Assessment completed by teacher</Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Remarks from School */}
            {remarks.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>📋 From School</Text>
                <View style={styles.remarksCard}>
                  {remarks.map((r, i) => (
                    <View key={r.id}>
                      {i > 0 && <View style={styles.remarkDivider} />}
                      <View style={styles.remarkRow}>
                        <View style={styles.remarkDot}>
                          <Ionicons
                            name={r.sender_role === 'teacher' ? 'school-outline' : 'shield-outline'}
                            size={16}
                            color="#7B6FE8"
                          />
                        </View>
                        <View style={{ flex: 1, gap: 3 }}>
                          <Text style={styles.remarkMsg}>{r.message}</Text>
                          <Text style={styles.remarkMeta}>
                            {r.sender_name} · {new Date(r.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short',
                            })}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Recent Activity — real data */}
            {(stats?.recentActivity ?? []).length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <View style={styles.activityCard}>
                  {(stats?.recentActivity ?? []).map((item, i) => (
                    <View key={i}>
                      {i > 0 && <View style={styles.activityDivider} />}
                      <View style={styles.activityRow}>
                        <View style={[styles.activityDot, { backgroundColor: item.bg }]}>
                          <Ionicons name={item.icon as any} size={18} color={item.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.activityText}>{item.label}</Text>
                          <Text style={styles.activityTime}>{item.time}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Notices modal ── */}
      <Modal
        visible={noticesVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setNoticesVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="megaphone" size={20} color="#0F1869" />
                <Text style={styles.modalTitle}>Notices</Text>
              </View>
              <TouchableOpacity
                onPress={() => setNoticesVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Close notices"
              >
                <Ionicons name="close" size={24} color="#7A7A9D" />
              </TouchableOpacity>
            </View>

            {noticesLoading ? (
              <ActivityIndicator color="#0F1869" style={{ marginVertical: 40 }} />
            ) : notices.length === 0 ? (
              <View style={styles.noticeEmpty}>
                <Ionicons name="megaphone-outline" size={36} color="#C4C4D6" />
                <Text style={styles.noticeEmptyText}>No notices from school yet.</Text>
              </View>
            ) : (
              <ScrollView
                contentContainerStyle={{ paddingBottom: 24, gap: 12 }}
                showsVerticalScrollIndicator={false}
              >
                {notices.map((n) => (
                  <View key={n.id} style={styles.noticeItem}>
                    <Text style={styles.noticeItemTitle}>{n.title}</Text>
                    <Text style={styles.noticeItemBody}>{n.body}</Text>
                    {n.file_url && (
                      <TouchableOpacity
                        style={styles.noticeAttachment}
                        activeOpacity={0.8}
                        onPress={() => Linking.openURL(n.file_url!)}
                      >
                        <Ionicons name="document-attach-outline" size={16} color="#7B6FE8" />
                        <Text style={styles.noticeAttachmentText}>View attachment</Text>
                      </TouchableOpacity>
                    )}
                    <Text style={styles.noticeItemMeta}>
                      {n.author ? `${n.author} · ` : ''}
                      {new Date(n.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0EEFB' },

  scrollContent: {
    paddingBottom: 20, gap: 14,
  },

  // Empty state
  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 16, padding: 32,
  },
  emptyIcon: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#E8E4F8',
    justifyContent: 'center', alignItems: 'center',
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0F1869', textAlign: 'center' },
  emptySub:   { fontSize: 14, color: '#7A7A9D', textAlign: 'center', lineHeight: 22 },

  // Hero
  hero: {
    alignItems: 'center', gap: 12,
    paddingTop: 60, paddingBottom: 28,
    paddingHorizontal: 20,
    backgroundColor: '#F0EEFB',
  },
  childName: {
    fontSize: 26, fontWeight: '800',
    color: '#0F1869', letterSpacing: -0.3,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  classBadge: {
    backgroundColor: '#DDD9F8', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5,
  },
  classBadgeText: { fontSize: 12, fontWeight: '800', color: '#0F1869', letterSpacing: 0.5 },
  childId: { fontSize: 13, color: '#7A7A9D', fontWeight: '600' },

  actionRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  calendarBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    backgroundColor: '#FFFFFF', borderRadius: 50,
    paddingVertical: 14,
    borderWidth: 2, borderColor: '#0F1869',
  },
  calendarBtnText: { fontSize: 14, fontWeight: '700', color: '#0F1869' },
  noticeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    backgroundColor: '#E8A020', borderRadius: 50,
    paddingVertical: 14,
  },
  noticeBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  // Cards
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 20,
    padding: 18, marginHorizontal: 16,
    shadowColor: '#0F1869', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
    gap: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardLabel: { fontSize: 11, fontWeight: '700', color: '#9A9AB0', letterSpacing: 1, flex: 1 },
  cardSub: { fontSize: 12, color: '#9A9AB0' },
  lateNote: { fontSize: 11, color: '#E8A020', fontWeight: '600' },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2A9D6E' },

  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bigNumber: { fontSize: 32, fontWeight: '800', color: '#0F1869' },

  rowCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBox: {
    width: 50, height: 50, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  feeBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  feeBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  progressTitle: { fontSize: 16, fontWeight: '700', color: '#0F1869' },
  progressLabel: { fontSize: 13, color: '#7A7A9D', fontWeight: '500' },

  // Section
  sectionTitle: {
    fontSize: 18, fontWeight: '800',
    color: '#0F1869', paddingHorizontal: 16,
    marginTop: 4,
  },

  // Activity
  activityCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20,
    padding: 18, marginHorizontal: 16,
    shadowColor: '#0F1869', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
    gap: 14,
  },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  activityDot: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  activityText: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  activityTime: { fontSize: 12, color: '#9A9AB0', marginTop: 2 },
  activityDivider: { height: 1, backgroundColor: '#F4F5F9' },

  // Remarks
  remarksCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20,
    padding: 16, marginHorizontal: 16, gap: 12,
    shadowColor: '#0F1869', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
    borderLeftWidth: 4, borderLeftColor: '#7B6FE8',
  },
  remarkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  remarkDot: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#E8E4F8',
    justifyContent: 'center', alignItems: 'center',
  },
  remarkMsg: { fontSize: 14, fontWeight: '600', color: '#1A1A2E', lineHeight: 20 },
  remarkMeta: { fontSize: 11, color: '#9A9AB0' },
  remarkDivider: { height: 1, backgroundColor: '#F4F5F9', marginVertical: 4 },

  // Notices modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#F0EEFB',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 16,
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F1869' },
  noticeEmpty: { alignItems: 'center', gap: 12, paddingVertical: 48 },
  noticeEmptyText: { fontSize: 14, color: '#9A9AB0', fontWeight: '500' },
  noticeItem: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 16, gap: 6,
    borderLeftWidth: 4, borderLeftColor: '#E8A020',
  },
  noticeItemTitle: { fontSize: 15, fontWeight: '800', color: '#0F1869' },
  noticeItemBody: { fontSize: 14, color: '#4A4A65', lineHeight: 21 },
  noticeItemMeta: { fontSize: 11, color: '#9A9AB0', marginTop: 2 },
  noticeAttachment: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', marginTop: 2,
  },
  noticeAttachmentText: { fontSize: 13, fontWeight: '600', color: '#7B6FE8' },
});
