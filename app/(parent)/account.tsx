import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import { DEFAULT_SCHOOL_ID } from '../../constants/school';
import { useAuth } from '../../context/auth';
import { useChild } from '../../context/child';
import { logActivity } from '../../lib/activity';
import { supabase } from '../../lib/supabase';

export default function ParentAccountScreen() {
  const { signOut, profile, user } = useAuth();
  const router = useRouter();
  const { children, activeChild, setActiveChild } = useChild();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [pwdModalVisible, setPwdModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  async function handleExportData() {
    if (!activeChild) return;
    setExporting(true);
    try {
      const [attendanceRes, feesRes, progressRes, remarksRes] = await Promise.all([
        supabase.from('attendance').select('date, status').eq('student_id', activeChild.id),
        supabase.from('fees').select('amount, paid, due_date').eq('student_id', activeChild.id),
        supabase.from('student_progress').select('term, observation_notes').eq('student_id', activeChild.id),
        supabase.from('student_remarks').select('message, created_at').eq('student_id', activeChild.id),
      ]);

      const attendanceCount = attendanceRes.data?.length ?? 0;
      const feesCount = feesRes.data?.length ?? 0;
      const outstanding = (feesRes.data ?? []).filter((f) => !f.paid).reduce((s, f) => s + Number(f.amount), 0);
      const progressCount = progressRes.data?.length ?? 0;
      const remarksCount = remarksRes.data?.length ?? 0;

      Alert.alert(
        `Data Summary — ${activeChild.full_name}`,
        `Attendance records: ${attendanceCount}\n` +
        `Fee records: ${feesCount} (₹${outstanding.toLocaleString('en-IN')} outstanding)\n` +
        `Progress reports: ${progressCount}\n` +
        `Remarks from school: ${remarksCount}\n\n` +
        `Contact your school admin for a full export file.`
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not load data summary.');
    } finally {
      setExporting(false);
    }
  }

  function handleRequestDeletion() {
    if (!activeChild) return;
    Alert.alert(
      'Request Data Deletion',
      `This will notify your school admin to review and delete ${activeChild.full_name}'s records. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Deletion',
          style: 'destructive',
          onPress: async () => {
            const schoolId = activeChild.school_id ?? profile?.school_id ?? DEFAULT_SCHOOL_ID;
            await logActivity(
              schoolId,
              'data_deletion_requested',
              'Data Deletion Requested',
              `${profile?.full_name ?? 'A parent'} requested deletion of ${activeChild.full_name}'s data`,
              user?.id
            );
            Alert.alert('Request Sent', 'Your school admin has been notified.');
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.settingsBtn}
          activeOpacity={0.7}
          onPress={() => setPwdModalVisible(true)}
        >
          <Ionicons name="settings-outline" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Child Switcher — shows only if 2+ children */}
        {children.length > 1 && (
          <View style={styles.switcherCard}>
            <Text style={styles.switcherLabel}>My Children</Text>
            <View style={styles.switcherRow}>
              {children.map((child) => {
                const isActive = activeChild?.id === child.id;
                const initials = child.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                return (
                  <TouchableOpacity
                    key={child.id}
                    style={[styles.switcherPill, isActive && styles.switcherPillActive]}
                    onPress={() => setActiveChild(child)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.switcherAvatar, isActive && styles.switcherAvatarActive]}>
                      <Text style={[styles.switcherInitials, isActive && styles.switcherInitialsActive]}>
                        {initials}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.switcherName, isActive && styles.switcherNameActive]}>
                        {child.full_name.split(' ')[0]}
                      </Text>
                      <Text style={[styles.switcherClass, isActive && styles.switcherClassActive]}>
                        {child.class ?? 'No class'}
                      </Text>
                    </View>
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginLeft: 'auto' }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Student Profile Card */}
        <View style={styles.studentCard}>
          <View style={styles.studentAvatar}>
            <Text style={styles.avatarEmoji}>
              {activeChild ? activeChild.full_name.charAt(0).toUpperCase() : '👧'}
            </Text>
            <View style={styles.onlineIndicator} />
          </View>
          <Text style={styles.studentName}>
            {activeChild?.full_name ?? 'No child linked'}
          </Text>
          <Text style={styles.studentClass}>
            {activeChild?.class ?? 'Class not assigned'}
          </Text>
          {activeChild?.roll_number && (
            <Text style={styles.studentId}>Roll No: {activeChild.roll_number}</Text>
          )}
        </View>

        {/* Book Appointment Button */}
        <TouchableOpacity 
          activeOpacity={0.85} 
          style={styles.appointmentBtn}
          onPress={() => router.push('/parent-appointments')}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.appointmentGradient}
          >
            <View style={styles.appointmentIconCircle}>
              <Text style={styles.appointmentIcon}>📅</Text>
            </View>
            <Text style={styles.appointmentText}>Book Appointment with Teacher</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>

        {/* My Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>My Information</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Ionicons name="person-outline" size={18} color={COLORS.textSecondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{profile?.full_name ?? 'Parent'}</Text>
                <Text style={styles.infoSubtext}>Primary Guardian</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{user?.email ?? '—'}</Text>
                <Text style={styles.infoSubtext}>Account Email</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Privacy & Data Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="lock-closed" size={18} color={COLORS.textPrimary} />
            <Text style={styles.sectionTitle}>Privacy & Data</Text>
          </View>

          <TouchableOpacity
            style={styles.privacyRow}
            activeOpacity={0.7}
            onPress={() => router.push('/privacy-notice')}
          >
            <Text style={styles.privacyLabel}>View Privacy Notice</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.8}
            onPress={handleExportData}
            disabled={exporting || !activeChild}
          >
            {exporting ? (
              <ActivityIndicator color={COLORS.primary} size="small" />
            ) : (
              <Ionicons name="download-outline" size={18} color={COLORS.primary} />
            )}
            <Text style={styles.actionButtonText}>Export My Child's Data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            activeOpacity={0.8}
            onPress={handleRequestDeletion}
            disabled={!activeChild}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            <Text style={[styles.actionButtonText, styles.dangerText]}>Request Data Deletion</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={() => setPwdModalVisible(true)}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.settingLabel}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.settingLabel}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={signOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>App Version 2.4.0 (Build 102)</Text>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Change Password Modal */}
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
            <TextInput
              style={pwd.input}
              placeholder="Enter new password"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
            />

            <Text style={pwd.label}>Confirm Password</Text>
            <TextInput
              style={pwd.input}
              placeholder="Confirm new password"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
            />

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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },

  // Child Switcher
  switcherCard: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 16, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  switcherLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  switcherRow: { flexDirection: 'row', gap: 10 },
  switcherPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F4F5F9', borderRadius: 14,
    padding: 12, borderWidth: 2, borderColor: 'transparent',
  },
  switcherPillActive: {
    backgroundColor: COLORS.primary, borderColor: COLORS.primary,
  },
  switcherAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center', alignItems: 'center',
  },
  switcherAvatarActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  switcherInitials: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  switcherInitialsActive: { color: '#FFFFFF' },
  switcherName: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  switcherNameActive: { color: '#FFFFFF' },
  switcherClass: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  switcherClassActive: { color: 'rgba(255,255,255,0.8)' },

  // Student Card
  studentCard: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  studentAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFE8E8',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarEmoji: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.success,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  studentName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  studentClass: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
  },
  studentId: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: 'center',
  },

  // Book Appointment Button
  appointmentBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  appointmentGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  appointmentIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentIcon: {
    fontSize: 20,
  },
  appointmentText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.2,
  },

  // Section
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.success,
  },

  // Info Card
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  infoSubtext: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },

  // Consent Card
  consentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  consentCheck: {
    width: 20,
    height: 20,
  },
  consentLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  consentDate: {
    fontSize: 13,
    color: COLORS.textLight,
  },

  // Privacy Section
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  privacyLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  dangerButton: {
    borderColor: COLORS.error,
  },
  dangerText: {
    color: COLORS.error,
  },

  // Settings Section
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  settingDivider: {
    height: 12,
  },

  // Sign Out Button
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#FFE8E8',
    marginTop: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.error,
  },

  // Version Text
  versionText: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
});

const pwd = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: COLORS.white, borderRadius: 24, padding: 24, gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.5 },
  input: {
    borderWidth: 1.5, borderColor: COLORS.inputBorder, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: COLORS.offWhite,
    fontSize: 15, color: COLORS.textPrimary,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 15, marginTop: 8,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
});
