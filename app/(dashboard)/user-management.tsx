import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { DEFAULT_SCHOOL_ID } from '../../constants/school';
import { useAuth } from '../../context/auth';
import { logActivity } from '../../lib/activity';
import { supabase } from '../../lib/supabase';

type TabId = 'all' | 'parents' | 'teaching';

interface UserRecord {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  approved: boolean;
  created_at: string;
  children?: string[];
  assigned_class?: string | null;
  assigned_section?: string | null;
}

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'all',      label: 'All',     icon: 'people-outline' },
  { id: 'parents',  label: 'Parents', icon: 'home-outline' },
  { id: 'teaching', label: 'Staff',   icon: 'school-outline' },
];

const ROLE_CONFIG = [
  { value: 'parent',    label: 'Parent',    icon: 'people-outline',  color: '#7B6FE8', bg: '#E8E4F8' },
  { value: 'teacher',   label: 'Teacher',   icon: 'school-outline',  color: '#2A9D6E', bg: '#D4F4E8' },
  { value: 'principal', label: 'Principal', icon: 'star-outline',    color: '#D4822A', bg: '#FFF0D4' },
  { value: 'admin',     label: 'Admin',     icon: 'shield-outline',  color: '#0284C7', bg: '#F0F9FF' },
];

function getRoleConfig(role: string) {
  return ROLE_CONFIG.find((r) => r.value === role) ?? ROLE_CONFIG[1];
}

function getInitials(name: string | null) {
  if (!name) return '??';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function timeAgo(dateStr: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function UserManagementScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const schoolId = profile?.school_id ?? DEFAULT_SCHOOL_ID;

  const [activeTab, setActiveTab]         = useState<TabId>('all');
  const [users, setUsers]                 = useState<UserRecord[]>([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [search, setSearch]               = useState('');
  const [actionLoading, setActionLoading]     = useState<string | null>(null);
  const [linkTarget, setLinkTarget]           = useState<UserRecord | null>(null);
  const [assignClassTarget, setAssignClassTarget] = useState<UserRecord | null>(null);

  const [banner, setBanner] = useState<{ msg: string; success: boolean; isNew?: boolean } | null>(null);
  const slideAnim   = useRef(new Animated.Value(-100)).current;
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showBanner(msg: string, success = true, isNew = false) {
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    setBanner({ msg, success, isNew });
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start();
    bannerTimer.current = setTimeout(() => {
      Animated.timing(slideAnim, { toValue: -100, duration: 300, useNativeDriver: true })
        .start(() => setBanner(null));
    }, 4000);
  }

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    try {
      // Use SECURITY DEFINER RPC to bypass RLS — same pattern as home page
      const { data, error } = await supabase.rpc('get_all_profiles');

      if (error) throw error;

      let allProfiles = (data ?? []) as UserRecord[];

      // Tab filter
      if (activeTab === 'parents') {
        allProfiles = allProfiles.filter((p) => p.role === 'parent');
      } else if (activeTab === 'teaching') {
        allProfiles = allProfiles.filter((p) => ['teacher', 'principal'].includes(p.role));
      }

      // Attach all children for parents
      const parentIds = allProfiles.filter((p) => p.role === 'parent').map((p) => p.id);
      if (parentIds.length > 0) {
        const { data: studentsData } = await supabase
          .from('students')
          .select('parent_id, full_name')
          .in('parent_id', parentIds);

        const childMap: Record<string, string[]> = {};
        (studentsData ?? []).forEach((s: any) => {
          if (!s.parent_id) return;
          if (!childMap[s.parent_id]) childMap[s.parent_id] = [];
          childMap[s.parent_id].push(s.full_name);
        });

        // Also fetch assigned_class for teachers
        const teacherIds = allProfiles.filter((p) => p.role === 'teacher').map((p) => p.id);
        let classMap: Record<string, { assigned_class: string | null; assigned_section: string | null }> = {};
        if (teacherIds.length > 0) {
          const { data: teacherProfiles } = await supabase
            .from('profiles')
            .select('id, assigned_class, assigned_section')
            .in('id', teacherIds);
          (teacherProfiles ?? []).forEach((t: any) => {
            classMap[t.id] = { assigned_class: t.assigned_class, assigned_section: t.assigned_section };
          });
        }

        setUsers(allProfiles.map((p) => {
          if (p.role === 'parent') return { ...p, children: childMap[p.id] ?? [] };
          if (p.role === 'teacher') return { ...p, ...classMap[p.id] };
          return p;
        }));
      } else {
        setUsers(allProfiles);
      }
    } catch (e) {
      console.error('[UserManagement] Fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => { setLoading(true); fetchUsers(); }, [fetchUsers]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchUsers(); }, [fetchUsers]);

  // ── Realtime ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const channel = supabase
      .channel(`user-mgmt-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, (payload) => {
        const u = payload.new as UserRecord;
        if (u.role === 'admin') return;
        setUsers((prev) => prev.find((x) => x.id === u.id) ? prev : [u, ...prev]);
        showBanner(`${u.full_name ?? 'Someone'} just signed up as ${u.role}`, true, true);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        const u = payload.new as UserRecord;
        setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, ...u } : x));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Approve / Reject ─────────────────────────────────────────────────────────

  async function handleApprove(user: UserRecord) {
    setActionLoading(user.id);

    // 1. Approve the user
    const { error } = await supabase
      .from('profiles')
      .update({ approved: true })
      .eq('id', user.id);

    if (error) {
      setActionLoading(null);
      showBanner(error.message, false);
      return;
    }

    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, approved: true } : u));

    // 2. Auto-link children if parent
    if (user.role === 'parent' && user.email) {
      const { data: matchedStudents, error: matchErr } = await supabase
        .from('students')
        .select('id, full_name')
        .eq('parent_email', user.email)
        .is('parent_id', null); // only unlinked students

      if (!matchErr && matchedStudents && matchedStudents.length > 0) {
        // Link all matched students to this parent
        const studentIds = matchedStudents.map((s) => s.id);
        await supabase
          .from('students')
          .update({ parent_id: user.id })
          .in('id', studentIds);

        const names = matchedStudents.map((s) => s.full_name).join(', ');
        showBanner(`✓ ${user.full_name ?? 'Parent'} approved & linked to: ${names}`);
      } else {
        // No match found — approved but no child linked
        showBanner(`✓ ${user.full_name ?? 'Parent'} approved — no child matched, link manually`);
      }
    } else {
      showBanner(`✓ ${user.full_name ?? 'User'} approved`);
    }

    setActionLoading(null);

    const actType = ['teacher', 'principal'].includes(user.role) ? 'teacher_approved' : 'parent_approved';
    logActivity(schoolId, actType,
      `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Approved`,
      `${user.full_name} joined as ${user.role}`, user.id
    ).catch(() => {});
  }

  async function handleReject(user: UserRecord) {
    Alert.alert('Reject Request', `Reject ${user.full_name ?? 'this user'}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive',
        onPress: async () => {
          setActionLoading(user.id);
          const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', user.id);
          setActionLoading(null);
          if (error) {
            showBanner(error.message, false);
          } else {
            setUsers((prev) => prev.filter((u) => u.id !== user.id));
            showBanner(`${user.full_name ?? 'User'} rejected`);
            logActivity(schoolId, 'user_rejected', 'Request Rejected',
              `${user.full_name}'s access request was rejected`).catch(() => {});
          }
        },
      },
    ]);
  }

  // ── Assign Class ─────────────────────────────────────────────────────────────

  async function handleAssignClass(teacherId: string, teacherName: string | null, className: string, section: string | null) {
    const { error } = await supabase
      .from('profiles')
      .update({ assigned_class: className, assigned_section: section })
      .eq('id', teacherId);
    if (error) {
      showBanner(error.message, false);
    } else {
      setUsers((prev) => prev.map((u) =>
        u.id === teacherId ? { ...u, assigned_class: className, assigned_section: section } : u
      ));
      showBanner(`✓ ${teacherName ?? 'Teacher'} assigned to Class ${className}`);
    }
    setAssignClassTarget(null);
  }

  // ── Link / Unlink child ──────────────────────────────────────────────────────

  async function handleLinkChild(parentId: string, studentId: string, studentName: string) {
    const { error } = await supabase
      .from('students')
      .update({ parent_id: parentId })
      .eq('id', studentId);
    if (error) { showBanner(error.message, false); return; }
    setUsers((prev) => prev.map((u) =>
      u.id === parentId
        ? { ...u, children: [...(u.children ?? []).filter((c) => c !== studentName), studentName] }
        : u
    ));
    showBanner(`✓ ${studentName} linked to parent`);
  }

  async function handleUnlinkChild(parentId: string, studentId: string, studentName: string) {
    const { error } = await supabase
      .from('students')
      .update({ parent_id: null })
      .eq('id', studentId);
    if (error) { showBanner(error.message, false); return; }
    setUsers((prev) => prev.map((u) =>
      u.id === parentId
        ? { ...u, children: (u.children ?? []).filter((c) => c !== studentName) }
        : u
    ));
    showBanner(`${studentName} unlinked`);
  }

  // ── Filter ───────────────────────────────────────────────────────────────────

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (u.full_name ?? '').toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (u.children ?? []).some((c) => c.toLowerCase().includes(q))
    );
  });

  const pendingCount = users.filter((u) => !u.approved).length;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>User Management</Text>
          {pendingCount > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{pendingCount} pending</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(dashboard)/notifications')} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color="#9A9AB0" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search name, email, child…"
          placeholderTextColor="#9A9AB0"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#9A9AB0" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.8}
            >
              <Ionicons name={tab.icon as any} size={15} color={isActive ? '#fff' : '#7A7A9D'} />
              <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8A020" />}
      >
        {/* Section label */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>
            {activeTab === 'all' ? 'All Users' : activeTab === 'parents' ? 'Parents' : 'Staff'}
            {filtered.length > 0 ? ` (${filtered.length})` : ''}
          </Text>
          {pendingCount > 0 && (
            <View style={styles.pendingIndicator}>
              <View style={styles.pendingDot} />
              <Text style={styles.pendingIndicatorText}>{pendingCount} pending review</Text>
            </View>
          )}
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#E8A020" />
            <Text style={styles.centerText}>Loading users…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.centerBox}>
            <Ionicons name="people-outline" size={52} color="#C4C4D4" />
            <Text style={styles.emptyTitle}>No Users Found</Text>
            <Text style={styles.emptySubtext}>
              {search ? 'Try a different search term.' : 'New sign-ups will appear here automatically.'}
            </Text>
          </View>
        ) : (
          filtered.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              actionLoading={actionLoading}
              onApprove={() => handleApprove(user)}
              onReject={() => handleReject(user)}
              onManageChildren={user.role === 'parent' && user.approved ? () => setLinkTarget(user) : undefined}
              onAssignClass={user.role === 'teacher' && user.approved ? () => setAssignClassTarget(user) : undefined}
            />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Assign Class Modal */}
      {assignClassTarget && (
        <AssignClassModal
          teacher={assignClassTarget}
          onClose={() => setAssignClassTarget(null)}
          onAssign={(className, section) =>
            handleAssignClass(assignClassTarget.id, assignClassTarget.full_name, className, section)
          }
        />
      )}

      {/* Link Child Modal */}
      {linkTarget && (
        <LinkChildModal
          parent={linkTarget}
          onClose={() => setLinkTarget(null)}
          onLink={(studentId, studentName) => {
            handleLinkChild(linkTarget.id, studentId, studentName);
            setLinkTarget((p) => p ? { ...p, children: [...(p.children ?? []), studentName] } : p);
          }}
          onUnlink={(studentId, studentName) => {
            handleUnlinkChild(linkTarget.id, studentId, studentName);
            setLinkTarget((p) => p ? { ...p, children: (p.children ?? []).filter((c) => c !== studentName) } : p);
          }}
        />
      )}

      {/* Banner */}
      {banner && (
        <Animated.View style={[
          styles.banner,
          { transform: [{ translateY: slideAnim }] },
          banner.isNew ? styles.bannerNew : banner.success ? styles.bannerSuccess : styles.bannerError,
        ]}>
          <Ionicons
            name={banner.isNew ? 'person-add' : banner.success ? 'checkmark-circle' : 'alert-circle'}
            size={18} color="#fff"
          />
          <Text style={styles.bannerText}>{banner.msg}</Text>
        </Animated.View>
      )}
    </View>
  );
}

// ─── UserCard ─────────────────────────────────────────────────────────────────

function UserCard({
  user, actionLoading, onApprove, onReject, onManageChildren, onAssignClass,
}: {
  user: UserRecord;
  actionLoading: string | null;
  onApprove: () => void;
  onReject: () => void;
  onManageChildren?: () => void;
  onAssignClass?: () => void;
}) {
  const isActing  = actionLoading === user.id;
  const roleCfg   = getRoleConfig(user.role);
  const initials  = getInitials(user.full_name);
  const hasChildren = (user.children ?? []).length > 0;

  return (
    <View style={[styles.card, { borderLeftColor: user.approved ? '#2A9D6E' : '#E8A020' }]}>
      {/* Top */}
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: roleCfg.bg }]}>
          <Text style={[styles.avatarText, { color: roleCfg.color }]}>{initials}</Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.full_name ?? 'Unknown User'}</Text>
          {user.email && <Text style={styles.userEmail}>{user.email}</Text>}
          <View style={styles.metaRow}>
            <View style={[styles.rolePill, { backgroundColor: roleCfg.bg }]}>
              <Ionicons name={roleCfg.icon as any} size={11} color={roleCfg.color} />
              <Text style={[styles.rolePillText, { color: roleCfg.color }]}>{roleCfg.label}</Text>
            </View>
            <Text style={styles.timeText}>{timeAgo(user.created_at)}</Text>
          </View>

          {/* Children pills (parents with multiple kids) */}
          {hasChildren && (
            <View style={styles.childrenRow}>
              <Ionicons name="people-outline" size={12} color="#9A9AB0" />
              {(user.children ?? []).map((child, i) => (
                <View key={i} style={styles.childPill}>
                  <Text style={styles.childPillText}>{child}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.statusBadge, user.approved ? styles.statusApproved : styles.statusPending]}>
          <Text style={[styles.statusText, user.approved ? styles.statusTextApproved : styles.statusTextPending]}>
            {user.approved ? 'Approved' : 'Pending'}
          </Text>
        </View>
      </View>

      {/* Manage children button (approved parents only) */}
      {user.approved && onManageChildren && (
        <>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.manageChildrenBtn} onPress={onManageChildren} activeOpacity={0.8}>
            <Ionicons name="people-outline" size={15} color="#1B3A6B" />
            <Text style={styles.manageChildrenText}>
              Manage Children {(user.children ?? []).length > 0 ? `(${user.children!.length})` : ''}
            </Text>
            <Ionicons name="chevron-forward" size={15} color="#1B3A6B" />
          </TouchableOpacity>
        </>
      )}

      {/* Assign class (approved teachers only) */}
      {user.approved && onAssignClass && (
        <>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.manageChildrenBtn} onPress={onAssignClass} activeOpacity={0.8}>
            <Ionicons name="school-outline" size={15} color="#1B3A6B" />
            <Text style={styles.manageChildrenText}>
              {user.assigned_class ? `Class: ${user.assigned_class}` : 'Assign Class'}
            </Text>
            <Ionicons name="chevron-forward" size={15} color="#1B3A6B" />
          </TouchableOpacity>
        </>
      )}

      {/* Actions */}
      {!user.approved && (
        <>
          <View style={styles.divider} />
          {isActing ? (
            <View style={styles.actingRow}>
              <ActivityIndicator size="small" color="#E8A020" />
              <Text style={styles.actingText}>Processing…</Text>
            </View>
          ) : (
            <View style={styles.actionBtns}>
              <TouchableOpacity style={styles.rejectBtn} onPress={onReject} activeOpacity={0.8}>
                <Ionicons name="close" size={16} color="#E05A5A" />
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.approveBtn} onPress={onApprove} activeOpacity={0.8}>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={styles.approveBtnText}>Approve</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}

// ─── AssignClassModal ─────────────────────────────────────────────────────────

const SCHOOL_CLASSES = ['PG', 'PKG', 'JKG', 'SKG'];

function AssignClassModal({ teacher, onClose, onAssign }: {
  teacher: UserRecord;
  onClose: () => void;
  onAssign: (className: string, section: string | null) => void;
}) {
  const [selectedClass, setSelectedClass] = useState(teacher.assigned_class ?? '');

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={assignStyles.overlay}>
        <View style={assignStyles.sheet}>
          {/* Header */}
          <View style={assignStyles.header}>
            <View>
              <Text style={assignStyles.title}>Assign Class</Text>
              <Text style={assignStyles.subtitle}>{teacher.full_name ?? 'Teacher'}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={assignStyles.closeBtn}>
              <Ionicons name="close" size={20} color="#4A4A6A" />
            </TouchableOpacity>
          </View>

          {/* Class picker */}
          <Text style={assignStyles.label}>Select Class</Text>
          <View style={assignStyles.optionRow}>
            {SCHOOL_CLASSES.map((cls) => (
              <TouchableOpacity
                key={cls}
                style={[assignStyles.optionChip, selectedClass === cls && assignStyles.optionChipActive]}
                onPress={() => setSelectedClass(cls)}
                activeOpacity={0.8}
              >
                <Text style={[assignStyles.optionText, selectedClass === cls && assignStyles.optionTextActive]}>
                  {cls}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Assign button */}
          <TouchableOpacity
            style={[assignStyles.assignBtn, !selectedClass && { opacity: 0.5 }]}
            onPress={() => selectedClass && onAssign(selectedClass, null)}
            disabled={!selectedClass}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={assignStyles.assignBtnText}>
              {selectedClass ? `Assign Class ${selectedClass}` : 'Select a class'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const assignStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: '#fff', borderRadius: 24, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 20, fontWeight: '800', color: '#1A202C' },
  subtitle: { fontSize: 13, color: '#9A9AB0', marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F4F8', justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 12, fontWeight: '700', color: '#9A9AB0', letterSpacing: 1, marginBottom: 12 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  optionChip: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 50, backgroundColor: '#F0F4F8', borderWidth: 2, borderColor: 'transparent' },
  optionChipActive: { backgroundColor: '#E8EDF7', borderColor: '#1B3A6B' },
  optionText: { fontSize: 15, fontWeight: '700', color: '#9A9AB0' },
  optionTextActive: { color: '#1B3A6B' },
  assignBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1B3A6B', borderRadius: 16, paddingVertical: 16 },
  assignBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

// ─── LinkChildModal ───────────────────────────────────────────────────────────

interface StudentOption { id: string; full_name: string; class: string | null; linked: boolean; }

function LinkChildModal({ parent, onClose, onLink, onUnlink }: {
  parent: UserRecord;
  onClose: () => void;
  onLink: (studentId: string, studentName: string) => void;
  onUnlink: (studentId: string, studentName: string) => void;
}) {
  const [students, setStudents]   = useState<StudentOption[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [saving, setSaving]       = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('students')
        .select('id, full_name, class, parent_id')
        .order('full_name');
      setStudents(
        (data ?? []).map((s: any) => ({
          id: s.id,
          full_name: s.full_name,
          class: s.class,
          linked: s.parent_id === parent.id,
        }))
      );
      setLoading(false);
    })();
  }, [parent.id]);

  const filtered = students.filter((s) =>
    !search.trim() || s.full_name.toLowerCase().includes(search.toLowerCase())
  );

  async function toggle(student: StudentOption) {
    setSaving(student.id);
    if (student.linked) {
      onUnlink(student.id, student.full_name);
      setStudents((prev) => prev.map((s) => s.id === student.id ? { ...s, linked: false } : s));
    } else {
      onLink(student.id, student.full_name);
      setStudents((prev) => prev.map((s) => s.id === student.id ? { ...s, linked: true } : s));
    }
    setSaving(null);
  }

  const linked   = filtered.filter((s) => s.linked);
  const unlinked = filtered.filter((s) => !s.linked);

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={ms.overlay}>
        <View style={ms.sheet}>
          {/* Header */}
          <View style={ms.sheetHeader}>
            <View>
              <Text style={ms.sheetTitle}>Manage Children</Text>
              <Text style={ms.sheetSub}>{parent.full_name}</Text>
            </View>
            <TouchableOpacity style={ms.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#1A1A2E" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={ms.searchRow}>
            <Ionicons name="search-outline" size={16} color="#9A9AB0" />
            <TextInput
              style={ms.searchInput}
              placeholder="Search students…"
              placeholderTextColor="#9A9AB0"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 32 }} color="#1B3A6B" />
          ) : (
            <FlatList
              data={[...linked, ...unlinked]}
              keyExtractor={(s) => s.id}
              contentContainerStyle={{ padding: 16, gap: 10 }}
              ListHeaderComponent={
                linked.length > 0 ? (
                  <Text style={ms.groupLabel}>Linked ({linked.length})</Text>
                ) : null
              }
              renderItem={({ item: s, index }) => (
                <>
                  {index === linked.length && unlinked.length > 0 && (
                    <Text style={[ms.groupLabel, { marginTop: 8 }]}>All Students</Text>
                  )}
                  <View style={[ms.studentRow, s.linked && ms.studentRowLinked]}>
                    <View style={ms.studentAvatar}>
                      <Text style={ms.studentAvatarText}>
                        {s.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={ms.studentName}>{s.full_name}</Text>
                      {s.class && <Text style={ms.studentClass}>{s.class}</Text>}
                    </View>
                    <TouchableOpacity
                      style={[ms.linkBtn, s.linked && ms.unlinkBtn]}
                      onPress={() => toggle(s)}
                      disabled={saving === s.id}
                      activeOpacity={0.8}
                    >
                      {saving === s.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name={s.linked ? 'unlink-outline' : 'link-outline'} size={13} color="#fff" />
                          <Text style={ms.linkBtnText}>{s.linked ? 'Unlink' : 'Link'}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
              ListEmptyComponent={
                <Text style={{ textAlign: 'center', color: '#9A9AB0', marginTop: 24 }}>No students found</Text>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const ms = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '80%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 12,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F8',
  },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  sheetSub:   { fontSize: 13, color: '#7A7A9D', marginTop: 2 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#F4F5F9', justifyContent: 'center', alignItems: 'center',
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginVertical: 10,
    backgroundColor: '#F4F5F9', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1A1A2E', padding: 0 },
  groupLabel: { fontSize: 12, fontWeight: '700', color: '#9A9AB0', marginBottom: 6, textTransform: 'uppercase' },
  studentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F8F9FC', borderRadius: 12, padding: 12,
  },
  studentRowLinked: { backgroundColor: '#EEF5FF', borderWidth: 1, borderColor: '#C7D9F5' },
  studentAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#DAA520', justifyContent: 'center', alignItems: 'center',
  },
  studentAvatarText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  studentName:  { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  studentClass: { fontSize: 12, color: '#7A7A9D', marginTop: 1 },
  linkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#1B3A6B', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  unlinkBtn: { backgroundColor: '#E05A5A' },
  linkBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F5F9' },

  header: {
    backgroundColor: '#1B3A6B',
    paddingTop: 54, paddingBottom: 16, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center', gap: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  pendingBadge: {
    backgroundColor: '#E8A020', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 2,
  },
  pendingBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F8',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1A1A2E', padding: 0 },

  tabsRow: {
    flexDirection: 'row', gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F8',
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 9, borderRadius: 10, backgroundColor: '#F0F0F8',
  },
  tabBtnActive: { backgroundColor: '#1B3A6B' },
  tabBtnText: { fontSize: 13, fontWeight: '700', color: '#7A7A9D' },
  tabBtnTextActive: { color: '#fff' },

  scrollContent: { padding: 16, gap: 12 },

  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  pendingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pendingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#E8A020' },
  pendingIndicatorText: { fontSize: 12, fontWeight: '700', color: '#E8A020' },

  centerBox: { paddingVertical: 48, alignItems: 'center', gap: 10 },
  centerText: { fontSize: 14, color: '#9A9AB0', fontWeight: '500' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A2E' },
  emptySubtext: { fontSize: 13, color: '#9A9AB0', textAlign: 'center', paddingHorizontal: 20 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, borderLeftWidth: 4,
    padding: 16, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  avatarText: { fontSize: 16, fontWeight: '800' },
  userInfo: { flex: 1, gap: 4 },
  userName: { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
  userEmail: { fontSize: 12, color: '#7A7A9D' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  rolePillText: { fontSize: 11, fontWeight: '700' },
  timeText: { fontSize: 11, color: '#B0B0C8', fontWeight: '500' },

  childrenRow: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginTop: 2,
  },
  childPill: {
    backgroundColor: '#EEF2FF', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  childPillText: { fontSize: 11, fontWeight: '600', color: '#4B5EC6' },

  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, flexShrink: 0 },
  statusPending: { backgroundColor: '#FFF0D4' },
  statusApproved: { backgroundColor: '#D4F4E8' },
  statusText: { fontSize: 12, fontWeight: '700' },
  statusTextPending: { color: '#E8A020' },
  statusTextApproved: { color: '#2A9D6E' },

  divider: { height: 1, backgroundColor: '#F4F5F9' },

  actionBtns: { flexDirection: 'row', gap: 10 },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#FFD0D0', backgroundColor: '#FFF5F5',
  },
  rejectBtnText: { fontSize: 14, fontWeight: '700', color: '#E05A5A' },
  approveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, borderRadius: 10, backgroundColor: '#E8A020',
    shadowColor: '#E8A020', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  approveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  manageChildrenBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EEF2FF', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  manageChildrenText: { flex: 1, fontSize: 13, fontWeight: '700', color: '#1B3A6B' },

  actingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 8,
  },
  actingText: { fontSize: 13, color: '#9A9AB0', fontWeight: '500' },

  banner: {
    position: 'absolute', top: 54, left: 14, right: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, padding: 14, zIndex: 100,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 8,
  },
  bannerNew:     { backgroundColor: '#1B3A6B' },
  bannerSuccess: { backgroundColor: '#2A9D6E' },
  bannerError:   { backgroundColor: '#E05A5A' },
  bannerText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#fff' },
});
