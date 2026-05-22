import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants/admissionTheme';
import { useAuth } from '../../context/auth';

export default function TeacherProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>👩‍🏫</Text>
            </View>
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={12} color={COLORS.white} />
            </View>
          </View>
          
          <Text style={styles.name}>Ms. Anjali Sharma</Text>
          <Text style={styles.subtitle}>Senior Teacher • Junior KG • Section A</Text>
          
          <TouchableOpacity style={styles.editProfileButton} activeOpacity={0.8}>
            <Ionicons name="pencil" size={14} color={COLORS.primary} />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
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
                <Text style={styles.infoValue}>anjali.sharma@dma.edu</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: COLORS.primarySoft }]}>
                <Ionicons name="call" size={16} color={COLORS.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>+91 98765 43210</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: COLORS.primarySoft }]}>
                <Ionicons name="briefcase" size={16} color={COLORS.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Employee ID</Text>
                <Text style={styles.infoValue}>DMA-T-204</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Classroom */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CLASSROOM</Text>
          
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.menuRow} 
              onPress={() => router.push('/teacher-appointments')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: COLORS.primarySoft }]}>
                <Ionicons name="calendar" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.menuLabel}>My Appointments</Text>
              <View style={styles.menuBadge}>
                <Text style={styles.menuBadgeText}>2</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuRow} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: '#FFF4E6' }]}>
                <Text style={styles.menuEmoji}>👥</Text>
              </View>
              <Text style={styles.menuLabel}>My Students</Text>
              <View style={styles.menuBadge}>
                <Text style={styles.menuBadgeText}>24</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuRow} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="calendar" size={18} color="#0284C7" />
              </View>
              <Text style={styles.menuLabel}>Class Schedule</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuRow} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: COLORS.successLight }]}>
                <Ionicons name="document-text" size={18} color={COLORS.success} />
              </View>
              <Text style={styles.menuLabel}>Attendance Reports</Text>
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

            <TouchableOpacity style={styles.menuRow} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="globe" size={18} color="#DC2626" />
              </View>
              <Text style={styles.menuLabel}>Language</Text>
              <Text style={styles.menuValue}>English</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuRow} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: COLORS.primarySoft }]}>
                <Ionicons name="lock-closed" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.menuLabel}>Security & Password</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>
          
          <View style={styles.card}>
            <TouchableOpacity style={styles.menuRow} activeOpacity={0.7}>
              <Text style={styles.supportLabel}>Help Center</Text>
              <Ionicons name="open-outline" size={18} color={COLORS.textLight} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuRow} activeOpacity={0.7}>
              <Text style={styles.supportLabel}>Privacy Policy</Text>
              <Ionicons name="document-text-outline" size={18} color={COLORS.textLight} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuRow} activeOpacity={0.7}>
              <Text style={styles.supportLabel}>Terms of Service</Text>
              <Ionicons name="document-text-outline" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Log Out Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={signOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
  },

  // Profile Header
  profileHeader: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.white,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarEmoji: {
    fontSize: 44,
  },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 4,
  },
  editProfileText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Section
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textLight,
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  // Info Row
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textLight,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  infoDivider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 16,
  },

  // Menu Row
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuEmoji: {
    fontSize: 20,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  menuBadge: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
  },
  menuBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  menuValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 16,
  },

  // Support
  supportLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.errorLight,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.error,
  },
});
