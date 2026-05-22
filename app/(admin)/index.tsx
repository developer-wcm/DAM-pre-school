import { COLORS } from '@/constants/admissionTheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AdminDashboard() {
  const router = useRouter();

  const stats = [
    { id: '1', title: 'Total Students', value: '245', icon: 'people', color: COLORS.primary, bgColor: COLORS.primarySoft },
    { id: '2', title: 'Teachers', value: '18', icon: 'school', color: COLORS.secondary, bgColor: COLORS.secondarySoft },
    { id: '3', title: 'Pending Approvals', value: '5', icon: 'time', color: COLORS.warning, bgColor: COLORS.warningLight },
    { id: '4', title: 'Total Revenue', value: '₹2.4L', icon: 'cash', color: COLORS.success, bgColor: COLORS.successLight },
  ];

  const quickActions = [
    { id: '1', title: 'Approve Users', icon: 'checkmark-circle', color: COLORS.primary, route: '/users' },
    { id: '2', title: 'New Announcement', icon: 'megaphone', color: COLORS.secondary, route: '/announcements' },
    { id: '3', title: 'Add Holiday', icon: 'calendar', color: COLORS.warning, route: '/settings' },
    { id: '4', title: 'View Reports', icon: 'bar-chart', color: COLORS.success, route: '/reports' },
  ];

  const recentActivity = [
    { id: '1', title: 'New parent registered', subtitle: 'Priya Kumar', time: '5 min ago', icon: 'person-add', color: COLORS.primary },
    { id: '2', title: 'Fee payment received', subtitle: '₹5,000 from Arjun Singh', time: '1 hour ago', icon: 'cash', color: COLORS.success },
    { id: '3', title: 'Teacher marked attendance', subtitle: 'Junior KG - 25/28 present', time: '2 hours ago', icon: 'checkmark-done', color: COLORS.secondary },
    { id: '4', title: 'New announcement posted', subtitle: 'Holiday on Feb 19', time: '3 hours ago', icon: 'megaphone', color: COLORS.warning },
  ];

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Morning</Text>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.8}>
            <Ionicons name="notifications" size={24} color={COLORS.primary} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.id} style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: stat.bgColor }]}>
                <Ionicons name={stat.icon as any} size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                activeOpacity={0.8}
                onPress={() => router.push(action.route as any)}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                  <Ionicons name={action.icon as any} size={28} color={action.color} />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activityList}>
            {recentActivity.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: `${activity.color}15` }]}>
                  <Ionicons name={activity.icon as any} size={20} color={activity.color} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
                </View>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.error,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // Section
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Quick Actions
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },

  // Activity List
  activityList: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
    gap: 2,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  activitySubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  activityTime: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray,
  },
});
