import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
  const [wifiBusy, setWifiBusy] = useState(false);
  const [wifiMessage, setWifiMessage] = useState<string | null>(null);

  // Change password modal
  const [pwdModalVisible, setPwdModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
          .select('status')
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, profile?.id, schoolWifiName]);

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

        {/* Today's Check-In */}
        {schoolWifiName.trim().length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TODAY&apos;S ATTENDANCE</Text>
            {checkInStatus ? (
              <View style={[
                styles.checkInCard,
                { backgroundColor: checkInStatus === 'late' ? COLORS.warningLight : COLORS.successLight },
              ]}>
                <View style={[
                  styles.checkInIcon,
                  { backgroundColor: checkInStatus === 'late' ? COLORS.warning : COLORS.success },
                ]}>
                  <Ionicons
                    name={checkInStatus === 'late' ? 'time' : 'checkmark'}
                    size={22}
                    color={COLORS.white}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[
                    styles.checkInTitle,
                    { color: checkInStatus === 'late' ? COLORS.warning : COLORS.success },
                  ]}>
                    {checkInStatus === 'late' ? 'Checked in — Late' : 'Checked in — Present'}
                  </Text>
                  <Text style={styles.checkInSub}>You&apos;re marked for today via school WiFi.</Text>
                </View>
              </View>
            ) : (
              <View style={styles.checkInCard}>
                <View style={[styles.checkInIcon, { backgroundColor: COLORS.primary }]}>
                  <Ionicons name="wifi" size={22} color={COLORS.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkInTitle}>Check in for today</Text>
                  <Text style={styles.checkInSub}>
                    {wifiMessage ?? 'Connect to the school WiFi to be marked present automatically.'}
                  </Text>
                </View>
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
              </View>
            )}
          </View>
        )}

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
          </View>
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
    backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
    justifyContent: 'center', alignItems: 'center', minWidth: 84,
  },
  checkInBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.white },

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
