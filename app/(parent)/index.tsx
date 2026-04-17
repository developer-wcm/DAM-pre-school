import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const RECENT_ACTIVITY = [
  {
    id: '1',
    icon: '✅',
    iconBg: '#D4F4E8',
    title: 'Attendance Marked',
    subtitle: 'Present today • 8:45 AM',
    dotColor: '#3AAF72',
  },
  {
    id: '2',
    icon: '📝',
    iconBg: '#E8E4F8',
    title: 'Homework Assigned',
    subtitle: 'Math worksheet • Due tomorrow',
    dotColor: '#7B6FE8',
  },
  {
    id: '3',
    icon: '📢',
    iconBg: '#FFF0D4',
    title: 'School Notice',
    subtitle: 'Annual Day on 15 Feb 2026',
    dotColor: '#F5A623',
  },
];

function CircularProgress({ percent }: { percent: number }) {
  return (
    <View style={styles.circleWrapper}>
      <View style={styles.circleOuter}>
        <View style={styles.circleInner}>
          <Text style={styles.circleText}>{percent}%</Text>
        </View>
      </View>
    </View>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} style={[styles.star, i <= rating ? styles.starFilled : styles.starEmpty]}>
          ★
        </Text>
      ))}
    </View>
  );
}

export default function ParentChildScreen() {
  return (
    <LinearGradient colors={['#EDE9F6', '#F0EEF8', '#EAF0F8']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Child profile */}
        <View style={styles.profileSection}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>👧</Text>
            </View>
          </View>
          <Text style={styles.childName}>Priya Kumar</Text>
          <View style={styles.profileMeta}>
            <View style={styles.classBadge}>
              <Text style={styles.classBadgeText}>JUNIOR KG</Text>
            </View>
            <Text style={styles.childId}>ID: PS-2025-001</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity activeOpacity={0.85} style={styles.actionBtnPrimary}>
            <LinearGradient
              colors={['#7B6FE8', '#6EC6C6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionGradient}
            >
              <Text style={styles.actionIconText}>📅</Text>
              <Text style={styles.actionPrimaryText}>Book Appt.</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} style={styles.actionBtnSecondary}>
            <Text style={styles.actionIconText}>📆</Text>
            <Text style={styles.actionSecondaryText}>Calendar</Text>
          </TouchableOpacity>
        </View>

        {/* Attendance card */}
        <View style={styles.card}>
          <View style={styles.attendanceRow}>
            <View style={styles.attendanceLeft}>
              <View style={styles.attendanceLabelRow}>
                <View style={styles.greenDot} />
                <Text style={styles.cardLabel}>ATTENDANCE</Text>
              </View>
              <Text style={styles.attendanceValue}>17 / 20</Text>
              <Text style={styles.attendanceSub}>Days present • Feb 2026</Text>
            </View>
            <CircularProgress percent={85} />
          </View>
        </View>

        {/* Fee status card */}
        <View style={styles.card}>
          <View style={styles.feeRow}>
            <View style={styles.feeIconBox}>
              <Text style={styles.feeIcon}>💳</Text>
            </View>
            <View style={styles.feeInfo}>
              <View style={styles.feeLabelRow}>
                <Text style={styles.cardLabel}>FEE STATUS</Text>
                <View style={styles.outstandingBadge}>
                  <Text style={styles.outstandingText}>OUTSTANDING</Text>
                </View>
              </View>
              <Text style={styles.feeAmount}>₹35,000</Text>
              <Text style={styles.feeDue}>Next due: March 15, 2026</Text>
            </View>
          </View>
        </View>

        {/* Latest progress card */}
        <View style={styles.card}>
          <View style={styles.progressRow}>
            <View style={styles.progressIconBox}>
              <Text style={styles.progressIcon}>⭐</Text>
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.cardLabel}>LATEST PROGRESS</Text>
              <Text style={styles.progressTitle}>Term 1 Assessment</Text>
              <View style={styles.progressRatingRow}>
                <StarRating rating={3} />
                <Text style={styles.progressRatingLabel}>Very Good</Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            {RECENT_ACTIVITY.map((item) => (
              <View key={item.id} style={styles.activityItem}>
                <View style={[styles.activityIconBox, { backgroundColor: item.iconBg }]}>
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
    gap: 14,
  },

  // Profile
  profileSection: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9B8FE0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
    backgroundColor: '#F5F3FF',
  },
  avatarCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#F5E6D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 52,
  },
  childName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: -0.3,
  },
  profileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  classBadge: {
    backgroundColor: '#D4F4E8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  classBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A7A50',
    letterSpacing: 0.5,
  },
  childId: {
    fontSize: 13,
    color: '#7A7A9D',
    fontWeight: '500',
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtnPrimary: {
    flex: 1,
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: '#7B6FE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#9B8FE0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIconText: {
    fontSize: 16,
  },
  actionPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  actionSecondaryText: {
    color: '#7B6FE8',
    fontSize: 15,
    fontWeight: '700',
  },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#9B8FE0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9A9AB0',
    letterSpacing: 1,
  },

  // Attendance
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendanceLeft: {
    gap: 4,
  },
  attendanceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3AAF72',
  },
  attendanceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A2E',
    marginTop: 4,
  },
  attendanceSub: {
    fontSize: 12,
    color: '#7A7A9D',
  },

  // Circular progress
  circleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 6,
    borderColor: '#3ABFBF',
    borderTopColor: '#E0F7F7',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-45deg' }],
  },
  circleInner: {
    transform: [{ rotate: '45deg' }],
  },
  circleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A2E',
  },

  // Fee
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  feeIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFF0D4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feeIcon: {
    fontSize: 22,
  },
  feeInfo: {
    flex: 1,
    gap: 4,
  },
  feeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  outstandingBadge: {
    backgroundColor: '#FFF0D4',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  outstandingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E07A00',
    letterSpacing: 0.5,
  },
  feeAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  feeDue: {
    fontSize: 12,
    color: '#7A7A9D',
  },

  // Progress
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  progressIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFF8D4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressIcon: {
    fontSize: 22,
  },
  progressInfo: {
    flex: 1,
    gap: 4,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  progressRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    fontSize: 16,
  },
  starFilled: {
    color: '#F5A623',
  },
  starEmpty: {
    color: '#D0D0E0',
  },
  progressRatingLabel: {
    fontSize: 13,
    color: '#7A7A9D',
    fontWeight: '500',
  },
  chevron: {
    fontSize: 22,
    color: '#C0C0D0',
    fontWeight: '300',
  },

  // Section
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A2E',
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
    shadowColor: '#9B8FE0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  activityIconBox: {
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
});
