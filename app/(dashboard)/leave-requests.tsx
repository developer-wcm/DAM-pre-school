import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { JotFormKey } from '../../constants/jotforms';
import {
  ActivityIndicator,
  Alert,
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
import { supabase } from '../../lib/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

type LeaveStatus = 'pending' | 'approved' | 'rejected';
type LeaveType = 'sick' | 'casual' | 'emergency' | 'annual' | 'maternity' | 'other';
type FilterTab = 'all' | 'teaching' | 'non-teaching' | 'pending';

interface LeaveRequest {
  id: string;
  staff_id: string;
  staff_name: string | null;
  staff_role: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  days: number;
  reason: string | null;
  status: LeaveStatus;
  created_at: string;
}

interface NewLeaveForm {
  staff_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string | null) {
  if (!name) return '??';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateRange(start: string, end: string, days: number) {
  if (start === end) return `${formatDate(start)} (1 Day)`;
  return `${new Date(start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${formatDate(end)} (${days} Days)`;
}

const LEAVE_TYPE_CONFIG: Record<LeaveType, { label: string; icon: string; color: string }> = {
  sick:      { label: 'Sick Leave',      icon: 'medkit',          color: '#E05A5A' },
  casual:    { label: 'Casual Leave',    icon: 'compass',         color: '#7B6FE8' },
  emergency: { label: 'Warning',         icon: 'warning',         color: '#D4822A' },
  annual:    { label: 'Annual Leave',    icon: 'calendar',        color: '#2A9D6E' },
  maternity: { label: 'Maternity Leave', icon: 'heart',           color: '#E05A5A' },
  other:     { label: 'Other Leave',     icon: 'ellipsis-horizontal', color: '#5A5A7A' },
};

const STATUS_CONFIG: Record<LeaveStatus, { label: string; bg: string; text: string; border: string }> = {
  pending:  { label: 'Pending',  bg: '#FFF8E7', text: '#E8A020', border: '#E8A020' },
  approved: { label: 'Approved', bg: '#E8F8F0', text: '#2A9D6E', border: '#2A9D6E' },
  rejected: { label: 'Rejected', bg: '#FFF0F0', text: '#E05A5A', border: '#E05A5A' },
};

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all',          label: 'All' },
  { id: 'teaching',     label: 'Teaching Staff' },
  { id: 'non-teaching', label: 'Non-Teaching' },
  { id: 'pending',      label: 'Pending' },
];

const LEAVE_TYPES: LeaveType[] = ['sick', 'casual', 'emergency', 'annual', 'maternity', 'other'];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LeaveRequestsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const schoolId = profile?.school_id ?? DEFAULT_SCHOOL_ID;
  const adminId = profile?.id ?? '';

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [staffList, setStaffList] = useState<{ id: string; name: string; role: string }[]>([]);

  const fetchRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          id, staff_id, leave_type, start_date, end_date, days, reason, status, created_at,
          profiles:staff_id ( full_name, role )
        `)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: LeaveRequest[] = (data ?? []).map((r: any) => {
        const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
        return {
          id: r.id,
          staff_id: r.staff_id,
          staff_name: p?.full_name ?? null,
          staff_role: p?.role ?? 'staff',
          leave_type: r.leave_type as LeaveType,
          start_date: r.start_date,
          end_date: r.end_date,
          days: r.days,
          reason: r.reason,
          status: r.status as LeaveStatus,
          created_at: r.created_at,
        };
      });

      setRequests(mapped);
    } catch (e: any) {
      // Table might not exist yet
      if (e?.code === '42P01') {
        console.warn('[LeaveRequests] Table not found — run leave_requests_schema.sql in Supabase');
      } else {
        console.error('[LeaveRequests] Fetch error:', e);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [schoolId]);

  const fetchStaff = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('school_id', schoolId)
      .eq('approved', true)
      .neq('role', 'parent')
      .neq('role', 'admin')
      .order('full_name');
    setStaffList((data ?? []).map((p: any) => ({ id: p.id, name: p.full_name ?? '', role: p.role })));
  }, [schoolId]);

  useEffect(() => { fetchRequests(); fetchStaff(); }, [fetchRequests, fetchStaff]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchRequests(); }, [fetchRequests]);

  async function handleApprove(req: LeaveRequest) {
    setActionLoading(req.id);
    const { error } = await supabase
      .from('leave_requests')
      .update({ status: 'approved', reviewed_by: adminId, reviewed_at: new Date().toISOString() })
      .eq('id', req.id);
    setActionLoading(null);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setRequests((prev) => prev.map((r) => r.id === req.id ? { ...r, status: 'approved' } : r));
    }
  }

  async function handleReject(req: LeaveRequest) {
    Alert.alert('Reject Leave', `Reject ${req.staff_name ?? 'this'}'s ${LEAVE_TYPE_CONFIG[req.leave_type].label}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive',
        onPress: async () => {
          setActionLoading(req.id);
          const { error } = await supabase
            .from('leave_requests')
            .update({ status: 'rejected', reviewed_by: adminId, reviewed_at: new Date().toISOString() })
            .eq('id', req.id);
          setActionLoading(null);
          if (error) {
            Alert.alert('Error', error.message);
          } else {
            setRequests((prev) => prev.map((r) => r.id === req.id ? { ...r, status: 'rejected' } : r));
          }
        },
      },
    ]);
  }

  // Stats
  const pendingCount  = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  // Filtered list
  const filtered = requests.filter((r) => {
    const matchSearch = !search.trim() ||
      (r.staff_name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      activeFilter === 'all' ? true :
      activeFilter === 'pending' ? r.status === 'pending' :
      activeFilter === 'teaching' ? ['teacher', 'principal'].includes(r.staff_role) :
      !['teacher', 'principal', 'admin', 'parent'].includes(r.staff_role);
    return matchSearch && matchFilter;
  });

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.navigate('/(dashboard)/more')} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave Requests</Text>
        <TouchableOpacity
          style={styles.bellBtn}
          onPress={() => router.push('/(dashboard)/notifications')}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={22} color="#1A1A2E" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8A020" />}
      >
        {/* ── Stat Cards ── */}
        <View style={styles.statsRow}>
          <StatCard label="Pending"  value={pendingCount}  borderColor="#E8A020" iconColor="#E8A020" icon="time" />
          <StatCard label="Approved" value={approvedCount} borderColor="#2A9D6E" iconColor="#2A9D6E" icon="checkmark-circle" />
          <StatCard label="Rejected" value={rejectedCount} borderColor="#E05A5A" iconColor="#E05A5A" icon="close-circle" />
        </View>

        {/* ── Search ── */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#9A9AB0" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search staff..."
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

        {/* ── Filter Tabs ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.filterTab, activeFilter === tab.id && styles.filterTabActive]}
              onPress={() => setActiveFilter(tab.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterTabText, activeFilter === tab.id && styles.filterTabTextActive]}>
                {tab.label}
              </Text>
              {tab.id === 'pending' && pendingCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{pendingCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── List ── */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#E8A020" />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={48} color="#C4C4D4" />
            <Text style={styles.emptyTitle}>No Leave Requests</Text>
            <Text style={styles.emptyText}>
              {activeFilter === 'pending' ? 'No pending requests right now.' : 'Nothing here yet.'}
            </Text>
          </View>
        ) : (
          filtered.map((req) => (
            <LeaveCard
              key={req.id}
              req={req}
              actionLoading={actionLoading}
              onApprove={() => handleApprove(req)}
              onReject={() => handleReject(req)}
            />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => setShowAddModal(true)}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* ── Add Leave Modal ── */}
      <AddLeaveModal
        visible={showAddModal}
        staffList={staffList}
        schoolId={schoolId}
        onClose={() => setShowAddModal(false)}
        onSuccess={(staffName, staffRole) => {
          setShowAddModal(false);
          fetchRequests();
          // Determine which form to open based on staff role
          const formKey: JotFormKey =
            staffRole === 'teacher' || staffRole === 'principal'
              ? 'TEACHER_LEAVE'
              : 'TEACHER_LEAVE'; // use same key until parent form is separate
          Alert.alert(
            'Request Submitted ✓',
            'Your leave request has been recorded. Please also fill the Google Form to complete the process.',
            [
              { text: 'Later', style: 'cancel' },
              {
                text: 'Fill Form Now',
                onPress: () =>
                  router.push({
                    pathname: '/(dashboard)/jotform',
                    params: { formKey, userName: staffName, role: staffRole },
                  }),
              },
            ]
          );
        }}
      />
    </View>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, borderColor, iconColor, icon }: {
  label: string; value: number; borderColor: string; iconColor: string; icon: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: borderColor }]}>
      <View style={styles.statTop}>
        <Text style={styles.statLabel}>{label}</Text>
        <Ionicons name={icon as any} size={22} color={iconColor} />
      </View>
      <Text style={[styles.statValue, { color: iconColor }]}>{value}</Text>
    </View>
  );
}

// ─── Leave Card ───────────────────────────────────────────────────────────────

function LeaveCard({ req, actionLoading, onApprove, onReject }: {
  req: LeaveRequest;
  actionLoading: string | null;
  onApprove: () => void;
  onReject: () => void;
}) {
  const isActing = actionLoading === req.id;
  const typeConfig = LEAVE_TYPE_CONFIG[req.leave_type];
  const statusConfig = STATUS_CONFIG[req.status];
  const initials = getInitials(req.staff_name);

  return (
    <View style={styles.leaveCard}>
      {/* Staff row */}
      <View style={styles.leaveCardTop}>
        <View style={styles.staffAvatar}>
          <Text style={styles.staffAvatarText}>{initials}</Text>
        </View>
        <View style={styles.staffInfo}>
          <Text style={styles.staffName}>{req.staff_name ?? 'Staff Member'}</Text>
          <Text style={styles.staffRole}>
            {req.staff_role.charAt(0).toUpperCase() + req.staff_role.slice(1)}
          </Text>
        </View>
        <View style={[styles.statusChip, { backgroundColor: statusConfig.bg, borderColor: statusConfig.border }]}>
          {req.status === 'approved' && <Ionicons name="checkmark-circle" size={13} color={statusConfig.text} />}
          {req.status === 'rejected' && <Ionicons name="close-circle" size={13} color={statusConfig.text} />}
          <Text style={[styles.statusChipText, { color: statusConfig.text }]}>{statusConfig.label}</Text>
        </View>
      </View>

      {/* Leave details */}
      <View style={styles.leaveDetails}>
        <View style={styles.leaveDetailRow}>
          <Ionicons name={typeConfig.icon as any} size={15} color={typeConfig.color} />
          <Text style={styles.leaveTypeText}>{typeConfig.label}</Text>
        </View>
        <View style={styles.leaveDetailRow}>
          <Ionicons name="calendar-outline" size={15} color="#9A9AB0" />
          <Text style={styles.leaveDateText}>
            {formatDateRange(req.start_date, req.end_date, req.days)}
          </Text>
        </View>
      </View>

      {/* Reason */}
      {req.reason ? (
        <View style={styles.reasonBox}>
          <Text style={styles.reasonText}>"{req.reason}"</Text>
        </View>
      ) : null}

      {/* Actions — only for pending */}
      {req.status === 'pending' && (
        <View style={styles.leaveActions}>
          {isActing ? (
            <ActivityIndicator size="small" color="#E8A020" style={{ flex: 1 }} />
          ) : (
            <>
              <TouchableOpacity style={styles.leaveRejectBtn} onPress={onReject} activeOpacity={0.8}>
                <Text style={styles.leaveRejectText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.leaveApproveBtn} onPress={onApprove} activeOpacity={0.8}>
                <Text style={styles.leaveApproveText}>Approve</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Add Leave Modal ──────────────────────────────────────────────────────────

function AddLeaveModal({ visible, staffList, schoolId, onClose, onSuccess }: {
  visible: boolean;
  staffList: { id: string; name: string; role: string }[];
  schoolId: string;
  onClose: () => void;
  onSuccess: (staffName: string, staffRole: string) => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState<NewLeaveForm>({
    staff_id: '', leave_type: 'sick', start_date: today, end_date: today, reason: '',
  });
  const [submitting, setSubmitting] = useState(false);

  function calcDays(start: string, end: string) {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
  }

  async function handleSubmit() {
    if (!form.staff_id) { Alert.alert('Required', 'Please select a staff member.'); return; }
    if (!form.start_date || !form.end_date) { Alert.alert('Required', 'Please set dates.'); return; }
    if (form.end_date < form.start_date) { Alert.alert('Invalid', 'End date cannot be before start date.'); return; }

    setSubmitting(true);
    const { error } = await supabase.from('leave_requests').insert({
      staff_id: form.staff_id,
      school_id: schoolId,
      leave_type: form.leave_type,
      start_date: form.start_date,
      end_date: form.end_date,
      days: calcDays(form.start_date, form.end_date),
      reason: form.reason.trim() || null,
      status: 'pending',
    });
    setSubmitting(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      const selectedStaff = staffList.find((s) => s.id === form.staff_id);
      setForm({ staff_id: '', leave_type: 'sick', start_date: today, end_date: today, reason: '' });
      onSuccess(selectedStaff?.name ?? '', selectedStaff?.role ?? 'teacher');
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Leave Request</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Ionicons name="close" size={22} color="#5A5A7A" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
            {/* Staff picker */}
            <Text style={styles.fieldLabel}>Staff Member *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
              {staffList.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.staffChip, form.staff_id === s.id && styles.staffChipActive]}
                  onPress={() => setForm((f) => ({ ...f, staff_id: s.id }))}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.staffChipText, form.staff_id === s.id && styles.staffChipTextActive]}>
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
              {staffList.length === 0 && (
                <Text style={styles.emptyText}>No staff found</Text>
              )}
            </ScrollView>

            {/* Leave type */}
            <Text style={styles.fieldLabel}>Leave Type *</Text>
            <View style={styles.typeGrid}>
              {LEAVE_TYPES.map((type) => {
                const cfg = LEAVE_TYPE_CONFIG[type];
                const active = form.leave_type === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeChip, active && { backgroundColor: cfg.color + '20', borderColor: cfg.color }]}
                    onPress={() => setForm((f) => ({ ...f, leave_type: type }))}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={cfg.icon as any} size={14} color={active ? cfg.color : '#9A9AB0'} />
                    <Text style={[styles.typeChipText, active && { color: cfg.color }]}>{cfg.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Dates */}
            <View style={styles.dateRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Start Date *</Text>
                <TextInput
                  style={styles.dateInput}
                  value={form.start_date}
                  onChangeText={(v) => setForm((f) => ({ ...f, start_date: v }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9A9AB0"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>End Date *</Text>
                <TextInput
                  style={styles.dateInput}
                  value={form.end_date}
                  onChangeText={(v) => setForm((f) => ({ ...f, end_date: v }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9A9AB0"
                />
              </View>
            </View>
            {form.start_date && form.end_date && form.end_date >= form.start_date && (
              <Text style={styles.daysHint}>
                {calcDays(form.start_date, form.end_date)} day(s)
              </Text>
            )}

            {/* Reason */}
            <Text style={styles.fieldLabel}>Reason (optional)</Text>
            <TextInput
              style={styles.reasonInput}
              value={form.reason}
              onChangeText={(v) => setForm((f) => ({ ...f, reason: v }))}
              placeholder="Brief reason for leave..."
              placeholderTextColor="#9A9AB0"
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.submitBtnText}>Submit Request</Text>
              }
            </TouchableOpacity>

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F5F9' },

  // Header
  header: {
    paddingTop: 54, paddingBottom: 14, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F8',
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#F4F5F9', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A2E', flex: 1, textAlign: 'center' },
  bellBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#F4F5F9', justifyContent: 'center', alignItems: 'center',
  },

  scrollContent: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: 14, borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    gap: 6,
  },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statLabel: { fontSize: 12, fontWeight: '600', color: '#7A7A9D' },
  statValue: { fontSize: 28, fontWeight: '900' },

  // Search
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1A1A2E', padding: 0 },

  // Filter tabs
  filterRow: { gap: 8 },
  filterTab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#FFFFFF',
  },
  filterTabActive: { backgroundColor: '#E8A020' },
  filterTabText: { fontSize: 13, fontWeight: '700', color: '#7A7A9D' },
  filterTabTextActive: { color: '#FFFFFF' },
  filterBadge: {
    backgroundColor: '#E05A5A', borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 1, minWidth: 18, alignItems: 'center',
  },
  filterBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },

  // Leave card
  leaveCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 16, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  leaveCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  staffAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#E8E4F8', justifyContent: 'center', alignItems: 'center',
  },
  staffAvatarText: { fontSize: 16, fontWeight: '800', color: '#7B6FE8' },
  staffInfo: { flex: 1, gap: 2 },
  staffName: { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
  staffRole: { fontSize: 12, color: '#7A7A9D', fontWeight: '500' },

  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1,
  },
  statusChipText: { fontSize: 12, fontWeight: '700' },

  leaveDetails: { gap: 6 },
  leaveDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  leaveTypeText: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  leaveDateText: { fontSize: 13, color: '#5A5A7A', fontWeight: '500' },

  reasonBox: {
    backgroundColor: '#F4F5F9', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  reasonText: { fontSize: 13, color: '#5A5A7A', fontStyle: 'italic', lineHeight: 18 },

  leaveActions: { flexDirection: 'row', gap: 10 },
  leaveRejectBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#E05A5A',
    alignItems: 'center',
  },
  leaveRejectText: { fontSize: 14, fontWeight: '700', color: '#E05A5A' },
  leaveApproveBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    backgroundColor: '#E8A020', alignItems: 'center',
    shadowColor: '#E8A020', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 3,
  },
  leaveApproveText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  // Loading / Empty
  loadingBox: { paddingVertical: 48, alignItems: 'center' },
  emptyBox: { paddingVertical: 48, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A2E' },
  emptyText: { fontSize: 14, color: '#9A9AB0', fontWeight: '500' },

  // FAB
  fab: {
    position: 'absolute', bottom: 28, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#1E3A8A', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },

  // Add Leave Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },
  modalClose: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F4F5F9', justifyContent: 'center', alignItems: 'center',
  },

  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#5A5A7A', marginBottom: 8 },

  staffChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#F4F5F9',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  staffChipActive: { backgroundColor: '#FFF5E0', borderColor: '#E8A020' },
  staffChipText: { fontSize: 13, fontWeight: '700', color: '#7A7A9D' },
  staffChipTextActive: { color: '#E8A020' },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, backgroundColor: '#F4F5F9',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  typeChipText: { fontSize: 12, fontWeight: '700', color: '#9A9AB0' },

  dateRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  dateInput: {
    backgroundColor: '#F4F5F9', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#1A1A2E', fontWeight: '600',
  },
  daysHint: {
    fontSize: 12, color: '#2A9D6E', fontWeight: '600',
    marginBottom: 16, marginLeft: 4,
  },

  reasonInput: {
    backgroundColor: '#F4F5F9', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#1A1A2E', marginBottom: 20,
    minHeight: 80, textAlignVertical: 'top',
  },

  submitBtn: {
    backgroundColor: '#E8A020', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
    shadowColor: '#E8A020', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
});
