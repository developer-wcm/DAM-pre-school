import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { DEFAULT_SCHOOL_ID } from '../../constants/school';
import { AppColors, AppShadows } from '../../constants/theme';
import { useAdmission } from '../../context/admission';
import { supabase } from '../../lib/supabase';

interface Student {
  id: string;
  full_name: string;
  class: string;
  roll_number: string | null;
  status: string;
}

const CLASS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'PG', label: 'Play Group' },
  { id: 'PKG', label: 'Pre-K' },
  { id: 'JKG', label: 'Junior KG' },
  { id: 'SKG', label: 'Senior KG' },
];

const CLASS_COLORS: Record<string, { bg: string; text: string }> = {
  PG: AppColors.classPG,
  PKG: AppColors.classPKG,
  JKG: AppColors.classJKG,
  SKG: AppColors.classSKG,
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function StudentsScreen() {
  const router = useRouter();
  const { resetAdmissionData } = useAdmission();
  const schoolId = DEFAULT_SCHOOL_ID;
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [overdueCount, setOverdueCount] = useState(0);

  async function fetchStudents() {
    try {
      // Always use direct query so we can reliably filter active-only
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, class, roll_number, status')
        .eq('school_id', schoolId)
        .eq('status', 'active')
        .order('class', { ascending: true })
        .order('full_name', { ascending: true });

      if (error) throw error;
      setStudents(data ?? []);
      setFilteredStudents(data ?? []);
    } catch (e) {
      console.error('Error fetching students:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchStudents();
    fetchOverdueCount();
  }, []);

  async function fetchOverdueCount() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('fees')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('paid', false)
        .lt('due_date', today);
      setOverdueCount(count ?? 0);
    } catch {
      // silently ignore
    }
  }

  async function handleDeleteStudent(student: Student) {
    Alert.alert(
      'Delete Student',
      `Permanently delete "${student.full_name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('students')
                .delete()
                .eq('id', student.id);
              if (error) throw error;
              setStudents((prev) => prev.filter((s) => s.id !== student.id));
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Could not delete student.');
            }
          },
        },
      ]
    );
  }

  // Filter students based on search and class
  useEffect(() => {
    let filtered = students;

    // Filter by class
    if (selectedClass !== 'all') {
      filtered = filtered.filter((s) => s.class === selectedClass);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.full_name.toLowerCase().includes(query) ||
          s.roll_number?.toLowerCase().includes(query)
      );
    }

    setFilteredStudents(filtered);
  }, [searchQuery, selectedClass, students]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStudents();
  }, []);

  const renderStudent = ({ item }: { item: Student }) => {
    const initials = getInitials(item.full_name);
    const classColor = CLASS_COLORS[item.class] ?? CLASS_COLORS.PG;
    const isActive = item.status === 'active';

    return (
      <TouchableOpacity
        style={styles.studentCard}
        activeOpacity={0.7}
        onPress={() => router.push(`/(dashboard)/student-profile?id=${item.id}`)}
        onLongPress={() => handleDeleteStudent(item)}
        delayLongPress={500}
      >
        <View style={[styles.avatar, { backgroundColor: classColor.bg }]}>
          <Text style={[styles.avatarText, { color: classColor.text }]}>
            {initials}
          </Text>
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName} numberOfLines={1}>
            {item.full_name}
          </Text>
          <View style={styles.studentMeta}>
            <View style={[styles.classBadge, { backgroundColor: classColor.bg }]}>
              <Text style={[styles.classText, { color: classColor.text }]}>
                {item.class}
              </Text>
            </View>
            {item.roll_number && (
              <Text style={styles.rollNumber}>{item.roll_number}</Text>
            )}
          </View>
        </View>
        <View style={styles.studentRight}>
          <View style={[styles.statusDot, { backgroundColor: isActive ? AppColors.success : AppColors.textLight }]} />
          <Ionicons name="chevron-forward" size={20} color={AppColors.textLight} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primaryBlue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Students</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{students.length}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.notificationBtn}
          activeOpacity={0.7}
          onPress={() => router.push('/(dashboard)/notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color={AppColors.textPrimary} />
          {overdueCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>
                {overdueCount > 99 ? '99+' : overdueCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={AppColors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search students..."
          placeholderTextColor={AppColors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={20} color={AppColors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Class Filters */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={CLASS_FILTERS}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const isSelected = selectedClass === item.id;
            return (
              <TouchableOpacity
                style={[styles.filterBtn, isSelected && styles.filterBtnActive]}
                onPress={() => setSelectedClass(item.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Students List */}
      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id}
        renderItem={renderStudent}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.primaryBlue} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="school-outline" size={64} color={AppColors.textLight} />
            <Text style={styles.emptyTitle}>No Students Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery || selectedClass !== 'all'
                ? 'Try adjusting your filters'
                : 'Add students to get started'}
            </Text>
          </View>
        }
      />

      {/* Add Button */}
      <TouchableOpacity 
        style={styles.addBtn} 
        activeOpacity={0.85}
        onPress={() => {
          resetAdmissionData();
          router.push('/(dashboard)/admission/step-1');
        }}
      >
        <Ionicons name="add" size={28} color={AppColors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: AppColors.textPrimary,
  },
  countBadge: {
    backgroundColor: AppColors.gold,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.white,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...AppShadows.cardShadow,
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: AppColors.white,
  },
  notifBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: AppColors.white,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...AppShadows.cardShadow,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: AppColors.textPrimary,
  },
  clearBtn: {
    padding: 4,
  },
  filterContainer: {
    marginBottom: 8,
  },
  filterList: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  filterBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.white,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...AppShadows.cardShadow,
  },
  filterBtnActive: {
    backgroundColor: AppColors.primaryBlue,
    ...AppShadows.goldGlow,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  filterTextActive: {
    color: AppColors.white,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    ...AppShadows.cardShadow,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  studentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  studentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  classBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  classText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rollNumber: {
    fontSize: 13,
    color: AppColors.textTertiary,
    fontWeight: '500',
  },
  studentRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: AppColors.textTertiary,
    marginTop: 8,
    textAlign: 'center',
  },
  addBtn: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: AppColors.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
    ...AppShadows.floatingShadow,
  },
});
