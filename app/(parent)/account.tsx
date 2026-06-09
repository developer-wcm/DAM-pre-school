import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants/admissionTheme';
import { useAuth } from '../../context/auth';
import { useChild } from '../../context/child';

export default function ParentAccountScreen() {
  const { signOut, profile } = useAuth();
  const router = useRouter();
  const { children, activeChild, setActiveChild } = useChild();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.7}>
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
                <Text style={styles.infoLabel}>Mrs. Sunita Kumar</Text>
                <Text style={styles.infoSubtext}>Mother • Primary Guardian</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Ionicons name="call-outline" size={18} color={COLORS.textSecondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>+91 987 654 3210</Text>
                <Text style={styles.infoSubtext}>Verified Mobile</Text>
              </View>
              <TouchableOpacity style={styles.editBtn}>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>sunita.kg@example.com</Text>
                <Text style={styles.infoSubtext}>Verified Email</Text>
              </View>
            </View>
          </View>
        </View>

        {/* My Consents Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>My Consents</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Up to date</Text>
            </View>
          </View>

          <View style={styles.consentCard}>
            <View style={styles.consentRow}>
              <View style={styles.consentCheck}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              </View>
              <Text style={styles.consentLabel}>Data Collection</Text>
              <Text style={styles.consentDate}>12 Oct</Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.consentRow}>
              <View style={styles.consentCheck}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              </View>
              <Text style={styles.consentLabel}>Photo Usage</Text>
              <Text style={styles.consentDate}>12 Oct</Text>
            </View>
          </View>
        </View>

        {/* Privacy & Data Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="lock-closed" size={18} color={COLORS.textPrimary} />
            <Text style={styles.sectionTitle}>Privacy & Data</Text>
          </View>

          <TouchableOpacity style={styles.privacyRow} activeOpacity={0.7}>
            <Text style={styles.privacyLabel}>View Privacy Notice</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
            <Ionicons name="download-outline" size={18} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Export My Child's Data</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            <Text style={[styles.actionButtonText, styles.dangerText]}>Request Data Deletion</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.settingLabel}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.settingLabel}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
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
