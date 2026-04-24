import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/auth';

const MENU_ITEMS = [
  {
    id: 'staff-attendance',
    icon: 'checkmark-circle' as const,
    label: 'Staff\nAttendance',
    sub: 'Daily Log',
    bg: '#D0F5EE',
    iconColor: '#2BBFA0',
    badge: false,
  },
  {
    id: 'staff-management',
    icon: 'briefcase' as const,
    label: 'Staff\nManagement',
    sub: 'Roles & Data',
    bg: '#D6EAF8',
    iconColor: '#3A9BD5',
    badge: false,
  },
  {
    id: 'leave-requests',
    icon: 'calendar' as const,
    label: 'Leave\nRequests',
    sub: 'Approvals',
    bg: '#FDE8D0',
    iconColor: '#F0883E',
    badge: true,
  },
  {
    id: 'appointments',
    icon: 'time' as const,
    label: 'Appointments',
    sub: 'Parent Meetings',
    bg: '#EAE0F8',
    iconColor: '#9B6FE8',
    badge: false,
  },
  {
    id: 'student-progress',
    icon: 'trending-up' as const,
    label: 'Student\nProgress',
    sub: 'Reports',
    bg: '#FEF5CC',
    iconColor: '#E8B800',
    badge: false,
  },
  {
    id: 'user-management',
    icon: 'people' as const,
    label: 'User\nManagement',
    sub: 'Permissions',
    bg: '#D6EAF8',
    iconColor: '#3A9BD5',
    badge: true,
  },
  {
    id: 'events-calendar',
    icon: 'calendar-number' as const,
    label: 'Events\nCalendar',
    sub: 'Term Dates',
    bg: '#D0F5EE',
    iconColor: '#2BBFA0',
    badge: false,
  },
  {
    id: 'system-settings',
    icon: 'settings' as const,
    label: 'System\nSettings',
    sub: 'Configuration',
    bg: '#E8E8E8',
    iconColor: '#6A6A7A',
    badge: false,
  },

];

export default function MoreScreen() {
  const { profile, signOut } = useAuth();

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>More</Text>
            <Text style={styles.headerSub}>School Management</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
            <View style={styles.avatarDot} />
          </View>
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              activeOpacity={0.82}
            >
              {item.badge && <View style={styles.badge} />}
              <View style={[styles.iconCircle, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={22} color={item.iconColor} />
              </View>
              <Text style={styles.cardLabel}>{item.label}</Text>
              <Text style={styles.cardSub}>{item.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutBtn} onPress={signOut} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={20} color="#E05A5A" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
          <Text style={styles.footerText}>DMA PreSchool Manager v2.4.0</Text>
          <Text style={styles.footerText}>
            Need help?{' '}
            <Text style={styles.footerLink}>Contact Support</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0EEF8',
  },
  scrollContent: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: '#9A9AB0',
    marginTop: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8E4F8',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7B6FE8',
  },
  avatarDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3AAF72',
    borderWidth: 2,
    borderColor: '#F0EEF8',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    gap: 10,
    position: 'relative',
    shadowColor: '#9B8FE0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#E05A5A',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    lineHeight: 20,
  },
  cardSub: {
    fontSize: 12,
    color: '#9A9AB0',
    marginTop: -4,
  },

  // Footer
  footer: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF0F0',
    borderRadius: 16,
    paddingVertical: 14,
    width: '100%',
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E05A5A',
  },
  footerText: {
    fontSize: 12,
    color: '#9A9AB0',
    textAlign: 'center',
  },
  footerLink: {
    color: '#7B6FE8',
    fontWeight: '600',
  },
});
