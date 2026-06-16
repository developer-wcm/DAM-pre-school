import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    icon: 'calendar-clear' as const,
    label: 'Leave\nRequests',
    sub: 'Approvals',
    bg: '#FFE0B6',
    iconColor: '#F7A23F',
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
    id: 'staff-attendance-report',
    icon: 'bar-chart' as const,
    label: 'Staff\nReport',
    sub: 'Monthly Summary',
    bg: '#D0F5EE',
    iconColor: '#2A9D6E',
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
  {
    id: 'csv-upload',
    icon: 'cloud-upload' as const,
    label: 'Upload\nData',
    sub: 'CSV Import',
    bg: '#E7DAFF',
    iconColor: '#9A68E8',
    badge: false,
  },
  {
    id: 'data-export',
    icon: 'download-outline' as const,
    label: 'Data\nExport',
    sub: 'Backup',
    bg: '#D0F5EE',
    iconColor: '#2BBFA0',
    badge: false,
  },
  {
    id: 'data-deletion',
    icon: 'trash' as const,
    label: 'Data\nDeletion',
    sub: 'Cleanup',
    bg: '#FFD6D6',
    iconColor: '#F05D5E',
    badge: false,
  },
];

const ROUTE_MAP = {
  'staff-attendance':         '/(dashboard)/staff-attendance',
  'staff-attendance-report':  '/(dashboard)/staff-attendance-report',
  'staff-management':  '/(dashboard)/staff-management',
  'events-calendar':   '/(dashboard)/events-calendar',
  'student-progress':  '/(dashboard)/student-progress',
  'user-management':   '/(dashboard)/user-management',
  'leave-requests':    '/(dashboard)/leave-requests',
  'csv-upload':        '/(dashboard)/csv-upload',
  'system-settings':   '/(dashboard)/system-settings',
  'data-export':       '/(dashboard)/data-export',
  'appointments':      '/(dashboard)/appointments',
  'data-deletion':     '/(dashboard)/data-deletion',
} as const;

export default function MoreScreen() {
  const router = useRouter();
    const { profile, signOut } = useAuth();
  const displayName = profile?.full_name?.trim() || (profile?.role === 'principal' ? 'Principal' : 'Admin');

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
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => router.push('/(dashboard)/admin-profile')}
            activeOpacity={0.8}
            accessibilityLabel={`${displayName} profile`}
          >
            <Ionicons name="person" size={25} color="#1F2937" />
            <View style={styles.avatarDot} />
          </TouchableOpacity>
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              activeOpacity={0.82}
              onPress={() => {
                const route = ROUTE_MAP[item.id as keyof typeof ROUTE_MAP];
                if (route) {
                  router.push(route);
                } else {
                  Alert.alert('Coming Soon', `${item.label.replace('\n', ' ')} will be available in the next update.`);
                }
              }}
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
          <TouchableOpacity onPress={() => Linking.openURL('mailto:support@whitecloudsmedia.com')}>
            <Text style={styles.footerText}>
              Need help?{' '}
              <Text style={styles.footerLink}>Contact Support</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2EAFB',
  },
  scrollContent: {
    paddingTop: 62,
    paddingHorizontal: 25,
    paddingBottom: 92,
    gap: 18,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: 0,
  },
  headerSub: {
    fontSize: 11,
    color: '#8E8EA3',
    marginTop: 1,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFE7B9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F05D73',
    borderWidth: 2,
    borderColor: '#F2EAFB',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 13,
    rowGap: 13,
  },
  card: {
    width: '47.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    minHeight: 122,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 13,
    position: 'relative',
    shadowColor: '#A994D8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 1,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#E05A5A',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A2E',
    lineHeight: 17,
  },
  cardSub: {
    fontSize: 10,
    color: '#9A9AB0',
    marginTop: 3,
    fontWeight: '600',
  },

  // Footer
  footer: {
    alignItems: 'center',
    gap: 2,
    paddingTop: 6,
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
    fontSize: 10,
    color: '#9A9AB0',
    textAlign: 'center',
    fontWeight: '500',
  },
  footerLink: {
    color: '#7B6FE8',
    fontWeight: '600',
  },
});
