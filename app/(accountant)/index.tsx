import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ClassRow = {
  id: string;
  initial: string;
  initialBg: string;
  initialColor: string;
  name: string;
  percent: number;
  barColor: string;
  cleared: string;
};

type OverdueStudent = {
  id: string;
  emoji: string;
  avatarBg: string;
  name: string;
  sub: string;
  amount: string;
  dueLabel: string;
  borderColor: string;
};

const CLASS_ROWS: ClassRow[] = [
  {
    id: 'pg',
    initial: 'P',
    initialBg: '#E8E4F8',
    initialColor: '#7B6FE8',
    name: 'Play Group',
    percent: 80,
    barColor: '#7B6FE8',
    cleared: '24/30 Students Cleared',
  },
  {
    id: 'pk',
    initial: 'K',
    initialBg: '#FFE8F0',
    initialColor: '#E05A8A',
    name: 'Pre-K',
    percent: 60,
    barColor: '#E05A8A',
    cleared: '18/30 Students Cleared',
  },
  {
    id: 'jkg',
    initial: 'J',
    initialBg: '#FFF0D4',
    initialColor: '#E07A00',
    name: 'Junior KG',
    percent: 75,
    barColor: '#F5A623',
    cleared: '28/37 Students Cleared',
  },
];

const OVERDUE_STUDENTS: OverdueStudent[] = [
  {
    id: '1',
    emoji: '👦',
    avatarBg: '#E8D8C8',
    name: 'Arjun Singh',
    sub: 'Play Group • Fees',
    amount: '₹19,500',
    dueLabel: 'Due 14 days ago',
    borderColor: '#E05A5A',
  },
  {
    id: '2',
    emoji: '👧',
    avatarBg: '#D8E8D8',
    name: 'Zara Khan',
    sub: 'Junior KG • Bus',
    amount: '₹12,000',
    dueLabel: 'Due 7 days ago',
    borderColor: '#E05A5A',
  },
  {
    id: '3',
    emoji: '🧒',
    avatarBg: '#D8D8E8',
    name: 'Rohan Das',
    sub: 'Pre-K • Fees',
    amount: '₹5,500',
    dueLabel: 'Due 2 days ago',
    borderColor: '#E05A5A',
  },
];

function DonutChart({ percent }: { percent: number }) {
  return (
    <View style={styles.donutWrapper}>
      <View style={styles.donutOuter}>
        <View style={styles.donutInner}>
          <Text style={styles.donutPercent}>{percent}%</Text>
          <Text style={styles.donutLabel}>COLLECTED</Text>
        </View>
      </View>
    </View>
  );
}

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${percent}%` as any, backgroundColor: color }]} />
    </View>
  );
}

export default function AccountantDashboard() {
  return (
    <LinearGradient colors={['#EDE9F6', '#F0EEF8', '#EAF0F8']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.schoolLabel}>DMA PRESCHOOL</Text>
            <Text style={styles.roleTitle}>Accountant</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>👩‍💼</Text>
          </View>
        </View>

        {/* Collection summary card */}
        <View style={styles.summaryCard}>
          <DonutChart percent={64} />
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statItemLabel}>TOTAL</Text>
              <Text style={styles.statItemValue}>₹6.3L</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statItemLabel}>COLLECTED</Text>
              <Text style={[styles.statItemValue, { color: '#3AAF72' }]}>₹4.03L</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statItemLabel}>PENDING</Text>
              <Text style={[styles.statItemValue, { color: '#E05A5A' }]}>₹2.26L</Text>
            </View>
          </View>
        </View>

        {/* Class-wise collection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Class-wise Collection</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.classCard}>
            {CLASS_ROWS.map((row, i) => (
              <View key={row.id}>
                <View style={styles.classRow}>
                  <View style={[styles.classInitial, { backgroundColor: row.initialBg }]}>
                    <Text style={[styles.classInitialText, { color: row.initialColor }]}>
                      {row.initial}
                    </Text>
                  </View>
                  <View style={styles.classInfo}>
                    <View style={styles.classNameRow}>
                      <Text style={styles.className}>{row.name}</Text>
                      <Text style={[styles.classPercent, { color: row.initialColor }]}>
                        {row.percent}%
                      </Text>
                    </View>
                    <ProgressBar percent={row.percent} color={row.barColor} />
                    <Text style={styles.classCleared}>{row.cleared}</Text>
                  </View>
                </View>
                {i < CLASS_ROWS.length - 1 && <View style={styles.rowDivider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Overdue students */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.overdueTitleRow}>
              <Text style={styles.sectionTitle}>Overdue Students</Text>
              <View style={styles.overdueCountBadge}>
                <Text style={styles.overdueCountText}>{OVERDUE_STUDENTS.length}</Text>
              </View>
            </View>
          </View>

          <View style={styles.overdueList}>
            {OVERDUE_STUDENTS.map((student) => (
              <View key={student.id} style={styles.overdueRow}>
                <View style={[styles.overdueAvatarBorder, { borderColor: student.borderColor }]}>
                  <View style={[styles.overdueAvatar, { backgroundColor: student.avatarBg }]}>
                    <Text style={styles.overdueEmoji}>{student.emoji}</Text>
                  </View>
                </View>
                <View style={styles.overdueInfo}>
                  <Text style={styles.overdueName}>{student.name}</Text>
                  <Text style={styles.overdueSub}>{student.sub}</Text>
                </View>
                <View style={styles.overdueRight}>
                  <Text style={styles.overdueAmount}>{student.amount}</Text>
                  <Text style={styles.overdueDue}>{student.dueLabel}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Sticky Record Payment button */}
      <View style={styles.stickyBottom}>
        <TouchableOpacity activeOpacity={0.85}>
          <LinearGradient
            colors={['#7B6FE8', '#9B8FF8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.recordBtn}
          >
            <Text style={styles.recordBtnText}>+ Record Payment</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  schoolLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7B6FE8',
    letterSpacing: 1.5,
  },
  roleTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A2E',
    marginTop: 2,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8E4F8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9B8FE0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarEmoji: {
    fontSize: 26,
  },

  // Summary card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    gap: 20,
    shadowColor: '#9B8FE0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },

  // Donut
  donutWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutOuter: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 12,
    borderColor: '#7B6FE8',
    borderTopColor: '#E8E4F8',
    borderRightColor: '#E8E4F8',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '135deg' }],
  },
  donutInner: {
    transform: [{ rotate: '-135deg' }],
    alignItems: 'center',
  },
  donutPercent: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  donutLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9A9AB0',
    letterSpacing: 1,
  },

  // Summary stats
  summaryStats: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statItemLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9A9AB0',
    letterSpacing: 0.8,
  },
  statItemValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E8E6F0',
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
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7B6FE8',
  },

  // Class card
  classCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#9B8FE0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  classInitial: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  classInitialText: {
    fontSize: 16,
    fontWeight: '800',
  },
  classInfo: {
    flex: 1,
    gap: 5,
  },
  classNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  className: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  classPercent: {
    fontSize: 14,
    fontWeight: '700',
  },
  barTrack: {
    height: 6,
    backgroundColor: '#F0EEF8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 4,
  },
  classCleared: {
    fontSize: 11,
    color: '#9A9AB0',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F0EEF8',
    marginHorizontal: 4,
  },

  // Overdue
  overdueTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  overdueCountBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E05A5A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overdueCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  overdueList: {
    gap: 10,
  },
  overdueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    gap: 12,
    shadowColor: '#9B8FE0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  overdueAvatarBorder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overdueAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overdueEmoji: {
    fontSize: 26,
  },
  overdueInfo: {
    flex: 1,
    gap: 2,
  },
  overdueName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  overdueSub: {
    fontSize: 12,
    color: '#7A7A9D',
  },
  overdueRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  overdueAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#E05A5A',
  },
  overdueDue: {
    fontSize: 11,
    color: '#9A9AB0',
  },

  // Sticky bottom
  stickyBottom: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
  },
  recordBtn: {
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7B6FE8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  recordBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
