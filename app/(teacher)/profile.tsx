import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS } from '../../constants/admissionTheme';
import { DEFAULT_SCHOOL_ID } from '../../constants/school';
import { useAuth } from '../../context/auth';
import { isLateAtCutoff, markStaffAttendance } from '../../lib/staffAttendance';
import { supabase } from '../../lib/supabase';
import { getWifiState, ssidMatches } from '../../lib/wifiCheckIn';

interface TeacherProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  employee_id: string | null;
  assigned_class: string | null;
  role: string;
  school_id: string | null;
}

type CheckInStatus = 'present' | 'late' | null;

const LEAVE_FORM_URL = 'https://forms.gle/b1kaZ3QXxbvu3Q3x9';

type LeaveType = 'sick' | 'casual' | 'emergency' | 'annual' | 'maternity' | 'other';

const LEAVE_TYPES: { type: LeaveType; label: string; icon: string; color: string }[] = [
  { type: 'sick',       label: 'Sick Leave',   icon: 'medkit',              color: '#E05A5A' },
  { type: 'casual',    label: 'Casual',        icon: 'compass',             color: '#7B6FE8' },
  { type: 'emergency', label: 'Emergency',     icon: 'warning',             color: '#D4822A' },
  { type: 'annual',    label: 'Annual',        icon: 'calendar',            color: '#2A9D6E' },
  { type: 'maternity', label: 'Maternity',     icon: 'heart',               color: '#E05A5A' },
  { type: 'other',     label: 'Other',         icon: 'ellipsis-horizontal', color: '#5A5A7A' },
];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Format an ISO timestamp (or Date) as a short local time like "9:42 AM". */
function formatTime(value: string | Date | null): string | null {
  if (!value) return null;
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function getInitials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function TeacherProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // WiFi auto check-in state
  const [schoolWifiName, setSchoolWifiName] = useState('');
  const [attendanceCutoff, setAttendanceCutoff] = useState('09:30');
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus>(null);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [wifiBusy, setWifiBusy] = useState(false);
  const [wifiMessage, setWifiMessage] = useState<string | null>(null);

  // Change password modal
  const [pwdModalVisible, setPwdModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // My leave requests
  const [myLeaves, setMyLeaves] = useState<{
    id: string; leave_type: string; start_date: string; end_date: string;
    days: number; reason: string | null; status: string; created_at: string;
  }[]>([]);

  async function fetchMyLeaves(staffId: string) {
    const { data } = await supabase
      .from('leave_requests')
      .select('id, leave_type, start_date, end_date, days, reason, status, created_at')
      .eq('staff_id', staffId)
      .order('created_at', { ascending: false })
      .limit(10);
    setMyLeaves(data ?? []);
  }

  // Apply Leave
  const today = new Date().toISOString().split('T')[0];
  const [leaveFormVisible, setLeaveFormVisible] = useState(false);
  const [leaveWebVisible, setLeaveWebVisible] = useState(false);
  const leaveSlide = useState(() => new Animated.Value(600))[0];
  const [leaveType, setLeaveType] = useState<LeaveType>('sick');
  const [leaveStart, setLeaveStart] = useState(today);
  const [leaveEnd, setLeaveEnd] = useState(today);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  function openLeaveForm() {
    setLeaveFormVisible(true);
    Animated.spring(leaveSlide, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
  }

  function closeLeaveForm() {
    Animated.timing(leaveSlide, { toValue: 600, duration: 220, useNativeDriver: true }).start(() => {
      setLeaveFormVisible(false);
      setLeaveType('sick');
      setLeaveStart(today);
      setLeaveEnd(today);
      setLeaveReason('');
    });
  }

  function calcDays(start: string, end: string) {
    return Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1);
  }

  async function handleLeaveSubmit() {
    if (!leaveStart || !leaveEnd) { Alert.alert('Required', 'Please set start and end dates.'); return; }
    if (leaveEnd < leaveStart) { Alert.alert('Invalid', 'End date cannot be before start date.'); return; }
    if (!profile?.id) return;

    setLeaveSubmitting(true);
    const { error } = await supabase.from('leave_requests').insert({
      staff_id: profile.id,
      school_id: profile.school_id ?? DEFAULT_SCHOOL_ID,
      leave_type: leaveType,
      start_date: leaveStart,
      end_date: leaveEnd,
      days: calcDays(leaveStart, leaveEnd),
      reason: leaveReason.trim() || null,
      status: 'pending',
    });
    setLeaveSubmitting(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    // Refresh leave list then open Google Form
    if (profile?.id) fetchMyLeaves(profile.id);
    closeLeaveForm();
    setTimeout(() => setLeaveWebVisible(true), 300);
  }

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, employee_id, assigned_class, role, school_id')
        .eq('id', user.id)
        .single();
      setProfile(data);
      if (data?.id) fetchMyLeaves(data.id);

      const schoolId = data?.school_id ?? DEFAULT_SCHOOL_ID;

      // Load school WiFi config + today's existing attendance in parallel.
      const [settingsRes, attendanceRes] = await Promise.all([
        supabase
          .from('school_settings')
          .select('staff_wifi_name, attendance_cutoff_time')
          .eq('school_id', schoolId)
          .single(),
        supabase
          .from('staff_attendance')
          .select('status, marked_at')
          .eq('school_id', schoolId)
          .eq('staff_id', user.id)
          .eq('date', todayKey())
          .maybeSingle(),
      ]);

      if (settingsRes.data) {
        setSchoolWifiName(settingsRes.data.staff_wifi_name ?? '');
        setAttendanceCutoff(settingsRes.data.attendance_cutoff_time ?? '09:30');
      }
      const existing = attendanceRes.data?.status;
      if (existing === 'present' || existing === 'late') {
        setCheckInStatus(existing);
        setCheckInTime(formatTime(attendanceRes.data?.marked_at ?? null));
      }
    } catch (e) {
      console.error('Profile load error:', e);
    } finally {
      setLoading(false);
    }
  }

  // ── WiFi auto check-in ────────────────────────────────────────────────────
  const attemptCheckIn = useCallback(
    async (manual: boolean) => {
      if (!profile?.id) return;
      const schoolId = profile.school_id ?? DEFAULT_SCHOOL_ID;

      if (!schoolWifiName.trim()) {
        if (manual) Alert.alert('Not enabled', 'Your school has not set up WiFi check-in yet.');
        return;
      }
      if (checkInStatus) {
        if (manual) Alert.alert('Already checked in', `You are marked ${checkInStatus} for today.`);
        return;
      }

      setWifiBusy(true);
      setWifiMessage(null);

      // Android requires Location permission + location services to read SSID.
      // Silent attempts only proceed if permission is already granted — we never
      // pop the permission dialog unprompted. The manual button may request it.
      if (Platform.OS === 'android') {
        try {
          const already = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          if (!already) {
            if (!manual) {
              // Stay quiet — leave the "Check In" button for the teacher to tap.
              setWifiBusy(false);
              return;
            }
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
              {
                title: 'Location access',
                message: 'Location access is needed to detect the school WiFi network for attendance.',
                buttonPositive: 'Allow',
                buttonNegative: 'Cancel',
              }
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
              setWifiBusy(false);
              setWifiMessage('Location permission is required to detect WiFi.');
              Alert.alert('Permission needed', 'Please allow location access to use WiFi check-in.');
              return;
            }
          }
        } catch {
          setWifiBusy(false);
          return;
        }
      }

      const { ssid, isWifi } = await getWifiState();

      if (!isWifi) {
        setWifiBusy(false);
        setWifiMessage('Not connected to WiFi. Connect to the school network to check in.');
        if (manual) Alert.alert('No WiFi', 'Please connect to the school WiFi network first.');
        return;
      }

      if (!ssidMatches(ssid, schoolWifiName)) {
        setWifiBusy(false);
        setWifiMessage(`Connect to "${schoolWifiName}" to check in automatically.`);
        if (manual) {
          Alert.alert(
            'Wrong network',
            `You're connected to "${ssid ?? 'an unknown network'}".\nConnect to "${schoolWifiName}" to check in.`
          );
        }
        return;
      }

      // Matched — mark present or late based on the cutoff time.
      const late = isLateAtCutoff(attendanceCutoff);
      const status = late ? 'late' : 'present';
      const { error } = await markStaffAttendance({
        schoolId,
        staffId: profile.id,
        date: new Date(),
        status,
        markedBy: profile.id,
        source: 'wifi',
      });

      setWifiBusy(false);
      if (error) {
        setWifiMessage('Could not save check-in. Please try again.');
        if (manual) Alert.alert('Error', 'Could not save your check-in. Please try again.');
      } else {
        setCheckInStatus(status);
        setCheckInTime(formatTime(new Date()));
        setWifiMessage(null);
        if (manual) {
          Alert.alert(
            status === 'late' ? 'Checked in (Late)' : 'Checked in ✓',
            status === 'late'
              ? 'You arrived after the cutoff, so you were marked late.'
              : 'You have been marked present for today.'
          );
        }
      }
    },
    [profile?.id, profile?.school_id, schoolWifiName, attendanceCutoff, checkInStatus]
  );

  useEffect(() => { loadProfile(); }, []);

  // Auto-attempt a silent check-in once settings are loaded and not yet marked.
  useEffect(() => {
    if (!loading && profile?.id && schoolWifiName.trim() && !checkInStatus) {
      attemptCheckIn(false);
    }
  }, [loading, profile?.id, schoolWifiName, checkInStatus, attemptCheckIn]);

  async function handleChangePassword() {
    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    setPwdLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwdLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('✅ Done', 'Password changed successfully.');
      setNewPassword('');
      setConfirmPassword('');
      setPwdModalVisible(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>{getInitials(profile?.full_name ?? null)}</Text>
            </View>
          </View>
          <Text style={styles.name}>{profile?.full_name ?? 'Teacher'}</Text>
          <Text style={styles.subtitle}>
            {profile?.role === 'teacher' ? 'Teacher' : profile?.role ?? 'Staff'}
            {profile?.assigned_class ? ` • Class ${profile.assigned_class}` : ' • No class assigned'}
          </Text>
        </View>

        {/* Assigned Class */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ASSIGNED CLASS</Text>
          <View style={styles.card}>
            {profile?.assigned_class ? (
              <View style={styles.classRow}>
                <View style={styles.classBadge}>
                  <Text style={styles.classBadgeText}>{profile.assigned_class}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.classLabel}>Class {profile.assigned_class}</Text>
                  <Text style={styles.classSubLabel}>Your assigned class</Text>
                </View>
                <Ionicons name="school" size={22} color={COLORS.secondary} />
              </View>
            ) : (
              <View style={styles.noClassRow}>
                <Ionicons name="alert-circle-outline" size={20} color={COLORS.warning} />
                <Text style={styles.noClassText}>No class assigned. Contact your admin.</Text>
              </View>
            )}
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PERSONAL INFORMATION</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: COLORS.primarySoft }]}>
                <Ionicons name="mail" size={16} color={COLORS.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profile?.email ?? '—'}</Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: COLORS.primarySoft }]}>
                <Ionicons name="briefcase" size={16} color={COLORS.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Employee ID</Text>
                <Text style={styles.infoValue}>{profile?.employee_id ?? '—'}</Text>
              </View>
            </View>

            {/* Today's Attendance (WiFi check-in) */}
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <View style={[
                styles.infoIcon,
                {
                  backgroundColor: checkInStatus === 'present' ? COLORS.successLight
                    : checkInStatus === 'late' ? COLORS.warningLight
                    : COLORS.primarySoft,
                },
              ]}>
                <Ionicons
                  name={checkInStatus === 'present' ? 'checkmark-circle'
                    : checkInStatus === 'late' ? 'time' : 'wifi'}
                  size={16}
                  color={checkInStatus === 'present' ? COLORS.success
                    : checkInStatus === 'late' ? COLORS.warning : COLORS.primary}
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Today&apos;s Attendance</Text>
                {checkInStatus ? (
                  <Text style={[
                    styles.infoValue,
                    { color: checkInStatus === 'late' ? COLORS.warning : COLORS.success },
                  ]}>
                    {checkInStatus === 'late' ? 'Checked in — Late' : 'Checked in — Present'}
                    {checkInTime ? ` · ${checkInTime}` : ''}
                  </Text>
                ) : (
                  <Text style={styles.infoValue}>Not checked in</Text>
                )}
              </View>
              {!checkInStatus && (
                <TouchableOpacity
                  style={[styles.checkInBtn, wifiBusy && { opacity: 0.6 }]}
                  onPress={() => attemptCheckIn(true)}
                  disabled={wifiBusy}
                  activeOpacity={0.85}
                >
                  {wifiBusy
                    ? <ActivityIndicator size="small" color={COLORS.white} />
                    : <Text style={styles.checkInBtnText}>Check In</Text>}
                </TouchableOpacity>
              )}
            </View>
            {!checkInStatus && wifiMessage && (
              <Text style={styles.checkInHint}>{wifiMessage}</Text>
            )}

            <View style={styles.infoDivider} />
            <TouchableOpacity style={styles.infoRow} activeOpacity={0.7} onPress={openLeaveForm}>
              <View style={[styles.infoIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="calendar-outline" size={16} color="#D4822A" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Leave</Text>
                <Text style={styles.infoValue}>Apply for Leave</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        {/* My Leave Requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MY LEAVE REQUESTS</Text>
          {myLeaves.length === 0 ? (
            <View style={[styles.card, { padding: 20, alignItems: 'center' }]}>
              <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>No leave requests yet.</Text>
            </View>
          ) : (
            <View style={styles.card}>
              {myLeaves.map((lr, i) => {
                const statusColors: Record<string, { bg: string; text: string }> = {
                  pending:  { bg: '#FFF8E7', text: '#E8A020' },
                  approved: { bg: '#E8F8F0', text: '#2A9D6E' },
                  rejected: { bg: '#FFF0F0', text: '#E05A5A' },
                };
                const sc = statusColors[lr.status] ?? { bg: '#F4F5F9', text: '#5A5A7A' };
                const label = lr.leave_type.charAt(0).toUpperCase() + lr.leave_type.slice(1);
                const dateStr = lr.start_date === lr.end_date
                  ? new Date(lr.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : `${new Date(lr.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${new Date(lr.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
                return (
                  <View key={lr.id}>
                    {i > 0 && <View style={styles.infoDivider} />}
                    <View style={leaveStatus.row}>
                      <View style={leaveStatus.info}>
                        <Text style={leaveStatus.type}>{label} Leave · {lr.days} day{lr.days > 1 ? 's' : ''}</Text>
                        <Text style={leaveStatus.date}>{dateStr}</Text>
                        {lr.reason ? <Text style={leaveStatus.reason}>"{lr.reason}"</Text> : null}
                      </View>
                      <View style={[leaveStatus.badge, { backgroundColor: sc.bg }]}>
                        <Text style={[leaveStatus.badgeText, { color: sc.text }]}>
                          {lr.status === 'approved' ? '✓ Approved'
                            : lr.status === 'rejected' ? '✗ Rejected'
                            : '⏳ Pending'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Reports */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REPORTS</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => router.push('/(teacher)/attendance-report')}
            >
              <View style={[styles.menuIcon, { backgroundColor: COLORS.successLight }]}>
                <Ionicons name="checkbox" size={18} color={COLORS.success} />
              </View>
              <Text style={styles.menuLabel}>Attendance Reports</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => router.push('/(teacher)/progress-report')}
            >
              <View style={[styles.menuIcon, { backgroundColor: COLORS.secondarySoft }]}>
                <Ionicons name="ribbon" size={18} color={COLORS.secondary} />
              </View>
              <Text style={styles.menuLabel}>Progress Reports</Text>
              <Text style={styles.menuBadge}>Send to Parents</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => router.push('/teacher-appointments')}
            >
              <View style={[styles.menuIcon, { backgroundColor: COLORS.primarySoft }]}>
                <Ionicons name="calendar" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.menuLabel}>Appointments</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SETTINGS</Text>
          <View style={styles.card}>
            <View style={styles.menuRow}>
              <View style={[styles.menuIcon, { backgroundColor: COLORS.primarySoft }]}>
                <Ionicons name="notifications" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.menuLabel}>Notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => setPwdModalVisible(true)}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="lock-closed" size={18} color="#DC2626" />
              </View>
              <Text style={styles.menuLabel}>Change Password</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Log Out */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => Alert.alert('Log Out', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', onPress: signOut },
          ])}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Apply Leave — Step 1: In-app form ── */}
      <Modal visible={leaveFormVisible} transparent animationType="none" onRequestClose={closeLeaveForm}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={leave.overlay}>
          <TouchableOpacity style={leave.backdrop} activeOpacity={1} onPress={closeLeaveForm} />
          <Animated.View style={[leave.sheet, { transform: [{ translateY: leaveSlide }] }]}>
            <View style={leave.handle} />
            <View style={leave.header}>
              <Text style={leave.title}>Apply for Leave</Text>
              <TouchableOpacity onPress={closeLeaveForm} style={leave.closeBtn}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={leave.label}>Leave Type</Text>
              <View style={leave.typeGrid}>
                {LEAVE_TYPES.map((lt) => {
                  const active = leaveType === lt.type;
                  return (
                    <TouchableOpacity
                      key={lt.type}
                      style={[leave.typeChip, active && { backgroundColor: lt.color + '20', borderColor: lt.color }]}
                      onPress={() => setLeaveType(lt.type)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name={lt.icon as any} size={14} color={active ? lt.color : '#9A9AB0'} />
                      <Text style={[leave.typeChipText, active && { color: lt.color }]}>{lt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={leave.dateRow}>
                <View style={{ flex: 1 }}>
                  <Text style={leave.label}>Start Date</Text>
                  <TextInput
                    style={leave.dateInput}
                    value={leaveStart}
                    onChangeText={setLeaveStart}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9A9AB0"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={leave.label}>End Date</Text>
                  <TextInput
                    style={leave.dateInput}
                    value={leaveEnd}
                    onChangeText={setLeaveEnd}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9A9AB0"
                  />
                </View>
              </View>
              {leaveStart && leaveEnd && leaveEnd >= leaveStart && (
                <Text style={leave.daysHint}>{calcDays(leaveStart, leaveEnd)} day(s)</Text>
              )}

              <Text style={leave.label}>Reason (optional)</Text>
              <TextInput
                style={leave.reasonInput}
                value={leaveReason}
                onChangeText={setLeaveReason}
                placeholder="Brief reason for leave..."
                placeholderTextColor="#9A9AB0"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[leave.submitBtn, leaveSubmitting && { opacity: 0.6 }]}
                onPress={handleLeaveSubmit}
                disabled={leaveSubmitting}
                activeOpacity={0.8}
              >
                {leaveSubmitting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <><Ionicons name="send" size={16} color="#fff" /><Text style={leave.submitBtnText}>Submit & Fill Form</Text></>
                }
              </TouchableOpacity>
              <View style={{ height: 30 }} />
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Apply Leave — Step 2: Google Form ── */}
      <Modal visible={leaveWebVisible} animationType="slide" onRequestClose={() => setLeaveWebVisible(false)}>
        <View style={leave.webContainer}>
          <View style={leave.webHeader}>
            <Text style={leave.title}>Leave Request Form</Text>
            <TouchableOpacity onPress={() => setLeaveWebVisible(false)} style={leave.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <WebView
            source={{ uri: LEAVE_FORM_URL }}
            style={{ flex: 1 }}
            startInLoadingState
            renderLoading={() => (
              <View style={leave.loader}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={leave.loaderText}>Loading form...</Text>
              </View>
            )}
            javaScriptEnabled
            domStorageEnabled
          />
        </View>
      </Modal>

      {/* ── Change Password Modal ── */}
      <Modal visible={pwdModalVisible} transparent animationType="fade" onRequestClose={() => setPwdModalVisible(false)}>
        <View style={pwd.overlay}>
          <View style={pwd.sheet}>
            <View style={pwd.header}>
              <Text style={pwd.title}>Change Password</Text>
              <TouchableOpacity onPress={() => setPwdModalVisible(false)} style={pwd.closeBtn}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={pwd.label}>New Password</Text>
            <View style={pwd.inputRow}>
              <TextInput
                style={pwd.input}
                placeholder="Enter new password"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry={!showNew}
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                <Ionicons name={showNew ? 'eye-off' : 'eye'} size={20} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

            <Text style={pwd.label}>Confirm Password</Text>
            <View style={pwd.inputRow}>
              <TextInput
                style={pwd.input}
                placeholder="Confirm new password"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={20} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[pwd.saveBtn, pwdLoading && { opacity: 0.6 }]}
              onPress={handleChangePassword}
              disabled={pwdLoading}
              activeOpacity={0.85}
            >
              {pwdLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Ionicons name="checkmark" size={18} color="#fff" />
              }
              <Text style={pwd.saveBtnText}>{pwdLoading ? 'Saving...' : 'Change Password'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingHorizontal: 20 },

  profileHeader: { alignItems: 'center', gap: 8, marginBottom: 28 },
  avatarContainer: { marginBottom: 4 },
  avatar: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.primarySoft,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 4, borderColor: COLORS.white,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  avatarInitials: { fontSize: 32, fontWeight: '800', color: COLORS.primary },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary, textAlign: 'center' },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: COLORS.textLight, letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 16,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },

  // Check-in card
  checkInCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
    backgroundColor: COLORS.white, borderRadius: 16,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  checkInIcon: {
    width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
  },
  checkInTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  checkInSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, lineHeight: 16 },
  checkInBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
    justifyContent: 'center', alignItems: 'center', minWidth: 72,
  },
  checkInBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  checkInHint: {
    fontSize: 12, color: COLORS.textSecondary, marginTop: 8, marginLeft: 44, lineHeight: 16,
  },

  classRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  classBadge: {
    width: 52, height: 52, borderRadius: 14, backgroundColor: COLORS.secondarySoft,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.secondary + '40',
  },
  classBadgeText: { fontSize: 14, fontWeight: '800', color: COLORS.secondary },
  classLabel: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  classSubLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  noClassRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 },
  noClassText: { flex: 1, fontSize: 14, color: COLORS.warning, fontWeight: '600' },

  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  infoIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  infoContent: { flex: 1, gap: 2 },
  infoLabel: { fontSize: 12, fontWeight: '500', color: COLORS.textLight },
  infoValue: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  infoDivider: { height: 1, backgroundColor: COLORS.lightGray, marginHorizontal: 16 },

  menuRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  menuIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  menuBadge: { fontSize: 12, fontWeight: '600', color: COLORS.secondary, marginRight: 4 },
  menuDivider: { height: 1, backgroundColor: COLORS.lightGray, marginHorizontal: 16 },

  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.white, borderRadius: 16, padding: 18, gap: 10,
    borderWidth: 1, borderColor: COLORS.errorLight, marginTop: 8,
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: COLORS.error },
});

const leaveStatus = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 10 },
  info: { flex: 1, gap: 3 },
  type: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  date: { fontSize: 12, color: COLORS.textSecondary },
  reason: { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic' },
  badge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },
});

const leave = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10, maxHeight: '90%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.lightGray, alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 13, fontWeight: '700', color: '#5A5A7A', marginBottom: 8 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#F4F5F9', borderWidth: 1.5, borderColor: 'transparent',
  },
  typeChipText: { fontSize: 12, fontWeight: '700', color: '#9A9AB0' },
  dateRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  dateInput: {
    backgroundColor: '#F4F5F9', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: COLORS.textPrimary, fontWeight: '600',
  },
  daysHint: { fontSize: 12, color: '#2A9D6E', fontWeight: '600', marginBottom: 16, marginLeft: 4 },
  reasonInput: {
    backgroundColor: '#F4F5F9', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: COLORS.textPrimary, marginBottom: 20, minHeight: 80,
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#D4822A', borderRadius: 14, paddingVertical: 15,
  },
  submitBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  webContainer: { flex: 1, backgroundColor: COLORS.white },
  webHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingHorizontal: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.lightGray,
  },
  loader: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: COLORS.white,
  },
  loaderText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
});

const pwd = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: COLORS.white, borderRadius: 24, padding: 24, gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.5 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.inputBorder, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 2, backgroundColor: COLORS.offWhite,
  },
  input: { flex: 1, fontSize: 15, color: COLORS.textPrimary, paddingVertical: 12 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 15, marginTop: 8,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
});
