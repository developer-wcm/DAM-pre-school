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
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/admissionTheme';
import { supabase } from '../../lib/supabase';

type StaffRecord = {
  id: string;
  full_name: string | null;
  role: string;
};


function getRoleColor(role: string) {
  switch (role) {
    case 'teacher':
      return { bg: '#F0FDF4', text: '#16A34A' };
    case 'admin':
      return { bg: '#F0F9FF', text: '#0284C7' };
    case 'principal':
      return { bg: '#FCE7F3', text: '#BE185D' };
    default:
      return { bg: '#F3F4F6', text: '#6B7280' };
  }
}

export default function StaffManagementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const fetchStaff = useCallback(async () => {
    console.log('[StaffManagement] Fetching staff list');

    try {
      const staffRpcRes = await supabase.rpc('get_staff_profiles');
      let data = staffRpcRes.data;
      let error = staffRpcRes.error;

      if (error) {
        console.warn('[StaffManagement] Staff RPC unavailable, falling back to profiles query:', error.message);
        const fallbackRes = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .neq('role', 'parent')
          .order('role', { ascending: true })
          .order('full_name', { ascending: true });

        data = fallbackRes.data;
        error = fallbackRes.error;
      }

      if (error) throw error;

      const allStaff = (data ?? [])
        .filter((member: any) => member.role !== 'parent')
        .map((member: any) => ({
          id: member.id,
          full_name: member.full_name,
          role: member.role,
        }));

      console.log('[StaffManagement] Filtered staff:', allStaff);
      setStaff(allStaff);
    } catch (error) {
      console.error('[StaffManagement] Error loading staff:', error);
      Alert.alert('Unable to load staff', 'Please try again in a moment.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStaff();
  }, [fetchStaff]);

  const filteredStaff = filter
    ? staff.filter((member) => member.role === filter)
    : staff;

  const roleStats = {
    teachers: staff.filter((s) => s.role === 'teacher').length,
    admins: staff.filter((s) => s.role === 'admin').length,
    principals: staff.filter((s) => s.role === 'principal').length,
  };

  const renderStaffItem = ({ item }: { item: StaffRecord }) => {
    const roleColor = getRoleColor(item.role);
    const initials = item.full_name
      ? item.full_name
          .split(' ')
          .map((part) => part[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : 'NA';

    return (
      <View style={styles.staffCard}>
        <View style={styles.staffInfo}>
          <View style={styles.staffAvatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.staffMeta}>
            <Text style={styles.staffName}>{item.full_name ?? 'Unknown'}</Text>
            <View style={[styles.roleBadge, { backgroundColor: roleColor.bg }]}>
              <Text style={[styles.roleBadgeText, { color: roleColor.text }]}>
                {item.role.replace(/^(.)/, (m) => m.toUpperCase())}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.navigate('/(dashboard)/more')} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Staff Management</Text>
          <Text style={styles.headerSubtitle}>{staff.length} staff members</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Teachers</Text>
          <Text style={styles.statValue}>{roleStats.teachers}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Admins</Text>
          <Text style={styles.statValue}>{roleStats.admins}</Text>
        </View>
      </View>

      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, !filter && styles.filterTabActive]}
          onPress={() => setFilter(null)}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterTabText, !filter && styles.filterTabTextActive]}>
            All ({staff.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'teacher' && styles.filterTabActive]}
          onPress={() => setFilter('teacher')}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterTabText, filter === 'teacher' && styles.filterTabTextActive]}>
            Teachers ({roleStats.teachers})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'admin' && styles.filterTabActive]}
          onPress={() => setFilter('admin')}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterTabText, filter === 'admin' && styles.filterTabTextActive]}>
            Admin ({roleStats.admins})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'principal' && styles.filterTabActive]}
          onPress={() => setFilter('principal')}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterTabText, filter === 'principal' && styles.filterTabTextActive]}>
            Principal ({roleStats.principals})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredStaff}
        keyExtractor={(item) => item.id}
        renderItem={renderStaffItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No staff found</Text>
            <Text style={styles.emptyText}>Staff members from this school will appear here.</Text>
          </View>
        }
      />

      <View style={{ height: Math.max(insets.bottom, 16) }} />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterTabActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  staffCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  staffInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  staffAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  staffMeta: {
    flex: 1,
    gap: 4,
  },
  staffName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  roleBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  emptyState: {
    marginTop: 48,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

});
