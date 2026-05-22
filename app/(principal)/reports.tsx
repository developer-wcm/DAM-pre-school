import { COLORS } from '@/constants/admissionTheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ReportsScreen() {
  const reportCategories = [
    {
      id: '1',
      title: 'Student Reports',
      icon: 'people',
      color: '#7B6FE8',
      bgColor: '#F5F3FF',
      reports: [
        { name: 'Attendance Summary', count: '245 students' },
        { name: 'Progress Reports', count: '8 classes' },
        { name: 'Enrollment Trends', count: 'Last 6 months' },
      ],
    },
    {
      id: '2',
      title: 'Financial Reports',
      icon: 'cash',
      color: '#10B981',
      bgColor: '#ECFDF5',
      reports: [
        { name: 'Fee Collection', count: '₹2.4L this month' },
        { name: 'Pending Payments', count: '12 students' },
        { name: 'Revenue Analysis', count: 'Yearly' },
      ],
    },
    {
      id: '3',
      title: 'Staff Reports',
      icon: 'school',
      color: '#3AAF72',
      bgColor: '#F0FDF4',
      reports: [
        { name: 'Teacher Attendance', count: '18 teachers' },
        { name: 'Performance Reviews', count: 'Quarterly' },
        { name: 'Class Assignments', count: '8 classes' },
      ],
    },
    {
      id: '4',
      title: 'Communication Reports',
      icon: 'chatbubbles',
      color: '#F59E0B',
      bgColor: '#FFFBEB',
      reports: [
        { name: 'Announcements Sent', count: '24 this month' },
        { name: 'Parent Messages', count: '156 conversations' },
        { name: 'Engagement Rate', count: '87%' },
      ],
    },
  ];

  const quickStats = [
    { label: 'Total Students', value: '245', change: '+12', trend: 'up' },
    { label: 'Active Teachers', value: '18', change: '+2', trend: 'up' },
    { label: 'Fee Collection', value: '94%', change: '+5%', trend: 'up' },
    { label: 'Avg Attendance', value: '92%', change: '-2%', trend: 'down' },
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
            <Text style={styles.headerTitle}>Reports & Analytics</Text>
            <Text style={styles.headerSubtitle}>View school performance metrics</Text>
          </View>
          <TouchableOpacity style={styles.exportBtn} activeOpacity={0.8}>
            <Ionicons name="download-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            {quickStats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <View style={styles.statRow}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <View
                    style={[
                      styles.statChange,
                      { backgroundColor: stat.trend === 'up' ? COLORS.successLight : COLORS.errorLight },
                    ]}
                  >
                    <Ionicons
                      name={stat.trend === 'up' ? 'trending-up' : 'trending-down'}
                      size={12}
                      color={stat.trend === 'up' ? COLORS.success : COLORS.error}
                    />
                    <Text
                      style={[
                        styles.statChangeText,
                        { color: stat.trend === 'up' ? COLORS.success : COLORS.error },
                      ]}
                    >
                      {stat.change}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Report Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Report Categories</Text>
          <View style={styles.categoriesList}>
            {reportCategories.map((category) => (
              <View key={category.id} style={styles.categoryCard}>
                <View style={styles.categoryHeader}>
                  <View style={[styles.categoryIcon, { backgroundColor: category.bgColor }]}>
                    <Ionicons name={category.icon as any} size={24} color={category.color} />
                  </View>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <TouchableOpacity style={styles.categoryMoreBtn} activeOpacity={0.7}>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                  </TouchableOpacity>
                </View>

                <View style={styles.reportsList}>
                  {category.reports.map((report, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.reportItem}
                      activeOpacity={0.7}
                    >
                      <View style={styles.reportDot} />
                      <View style={styles.reportInfo}>
                        <Text style={styles.reportName}>{report.name}</Text>
                        <Text style={styles.reportCount}>{report.count}</Text>
                      </View>
                      <Ionicons name="document-text-outline" size={18} color={COLORS.gray} />
                    </TouchableOpacity>
                  ))}
                </View>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  exportBtn: {
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
  },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },

  // Quick Stats
  statsSection: {
    gap: 12,
  },
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
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statChangeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Categories
  categoriesSection: {
    gap: 12,
  },
  categoriesList: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  categoryMoreBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Reports List
  reportsList: {
    gap: 8,
    paddingLeft: 8,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  reportDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  reportInfo: {
    flex: 1,
  },
  reportName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  reportCount: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
