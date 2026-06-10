import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../../constants/admissionTheme';
import { useAuth } from '../../context/auth';
import { supabase } from '../../lib/supabase';

interface TeacherProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  employee_id: string | null;
  assigned_class: string | null;
  role: string;
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

  // Change password modal
  const [pwdModalVisible, setPwdModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, employee_id, assigned_class, role')
        .eq('id', user.id)
        .single();
      setProfile(data);
    } catch (e) {
      console.error('Profile load error:', e);
    } finally {
      setLoading(false);
    }
  }

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
