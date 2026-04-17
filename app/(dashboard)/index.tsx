import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const QUICK_ACTIONS = [
  { id: 'admission', icon: '👤', label: 'New\nAdmission', color: '#E8E4F8' },
  { id: 'attendance', icon: '✅', label: 'Mark\nAttendance', color: '#D4F4E8' },
  { id: 'payment', icon: '💳', label: 'Record\nPayment', color: '#FFF0D4' },
];

const RECENT_ACTIVITY = [
  {
    id: '1',
    icon: '💵',
    title: "Priya Kumar's fee payment",
    subtitle: 'Recorded by Admin • 2h ago',
    color: '#D4F4E8',
    dotColor: '#3AAF72',
  },
  {
    id: '2',
    icon: '❌',
    title: 'Arjun Singh marked absent',
    subtitle: 'Automated • 9:00 AM',
    color: '#FFE8E8',
    dotColor: '#E05A5A',
  },
  {
    id: '3',
    icon: '📢',
    title: 'Annual Day Notice Sent',
    subtitle: 'Broadcast • Yesterday',
    color: '#E8E4F8',
    dotColor: '#7B6FE8',
  },
];

export default function AdminDashboardScreen() {
  const router = useRouter();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#EDE9F6', '#F0EEF8', '#EAF0F8']} style={styles.gradient}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Good Morning,</Text>
              <Text style={styles.greetingName}>Principal 👋</Text>
              <Text style={styles.date}>Monday, 14 Oct 2025</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>AD</Text>
              <View style={styles.avatarDot} />
            </View>
          </View>

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            {/* Total Students */}
            <View style={[styles.statCard, { backgroundColor: '#E8F4FB' }]}>
              <View style={styles.statHeader}>
                <Text style={styles.statIcon}>🎓</Text>
                <Text style={styles.statLabel}>Total{'\n'}Students</Text>
              </View>
              <Text style={styles.statValue}>9</Text>
              <View style={styles.classBadges}>
                <View style={styles.classBadge}>
                  <Text style={styles.classBadgeText}>PG-2</Text>
                </View>
                <View style={styles.classBadge}>
                  <Text style={styles.classBadgeText}>PK-3</Text>
                </View>
                <View style={styles.classBadge}>
                  <Text style={styles.classBadgeText}>JR-2</Text>
                </View>
                <View style={styles.classBadge}>
                  <Text style={styles.classBadgeText}>SR-2</Text>
                </View>
              </View>
            </View>

            {/* Attendance */}
            <View style={[styles.statCard, { backgroundColor: '#D4F4E8' }]}>
              <View style={styles.statHeader}>
                <Text style={styles.statIcon}>✅</Text>
                <Text style={styles.statLabel}>Attendance</Text>
              </View>
              <Text style={styles.statValue}>89%</Text>
              <Text style={styles.statSubtext}>8 present / 9 total</Text>
            </View>

            {/* Pending Fees */}
            <View style={[styles.statCard, { backgroundColor: '#FFF0D4' }]}>
              <View style={styles.statHeader}>
                <Text style={styles.statIcon}>💰</Text>
                <Text style={styles.statLabel}>Pending{'\n'}Fees</Text>
              </View>
              <Text style={styles.statValue}>₹1,20,000</Text>
              <Text style={styles.statSubtext}>🔺 3 students overdue</Text>
            </View>

            {/* Next Holiday */}
            <View style={[styles.statCard, { backgroundColor: '#FFF8E8' }]}>
              <View style={styles.statHeader}>
                <Text style={styles.statIcon}>🎉</Text>
                <Text style={styles.statLabel}>Next{'\n'}Holiday</Text>
              </View>
              <Text style={styles.holidayName}>Republic Day</Text>
              <Text style={styles.holidayDate}>26 Jan 2026</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <TouchableOpacity>
                <Text style={styles.editLink}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.quickActions}>
              {QUICK_ACTIONS.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={[styles.actionBtn, { backgroundColor: action.color }]}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (action.id === 'admission') router.push('/admission/step-1');
                  }}
                >
                  <Text style={styles.actionIcon}>{action.icon}</Text>
                  <Text style={styles.actionLabel}>{action.label}</Text>
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
              {RECENT_ACTIVITY.map((item) => (
                <View key={item.id} style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: item.color }]}>
                    <Text style={styles.activityEmoji}>{item.icon}</Text>
                  </View>
                  <View style={styles.activityText}>
                    <Text style={styles.activityTitle}>{item.title}</Text>
                    <Text style={styles.activitySubtitle}>{item.subtitle}</Text>
                  </View>
                  <View style={[styles.activityDot, { backgroundColor: item.dotColor }]} />
                </View>
              ))}
            </View>
          </View>

          {/* CTA Banner */}
          <View style={styles.ctaBanner}>
            <Text style={styles.ctaTitle}>Ready for the day?</Text>
            <Text style={styles.ctaSubtitle}>Check messages from parents</Text>
          </View>

          {/* Bottom padding for tab bar */}
          <View style={{ height: 20 }} />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  greetingName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A2E',
    marginTop: 2,
  },
  date: {
    fontSize: 13,
    color: '#7A7A9D',
    marginTop: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8E4F8',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7B6FE8',
  },
  avatarDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3AAF72',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    borderRadius: 20,
    padding: 16,
    gap: 8,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    fontSize: 18,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A4A6A',
    lineHeight: 16,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A2E',
    marginTop: 4,
  },
  statSubtext: {
    fontSize: 11,
    color: '#7A7A9D',
  },
  classBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  classBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  classBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3A7FA0',
  },
  holidayName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginTop: 4,
  },
  holidayDate: {
    fontSize: 12,
    color: '#7A7A9D',
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
    color: '#1A1A2E',
  },
  editLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7B6FE8',
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7B6FE8',
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    fontSize: 28,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4A4A6A',
    textAlign: 'center',
    lineHeight: 15,
  },

  // Activity
  activityList: {
    gap: 10,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityEmoji: {
    fontSize: 20,
  },
  activityText: {
    flex: 1,
    gap: 2,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#7A7A9D',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // CTA Banner
  ctaBanner: {
    backgroundColor: '#E8E4F8',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7B6FE8',
  },
  ctaSubtitle: {
    fontSize: 13,
    color: '#7A7A9D',
  },
});
