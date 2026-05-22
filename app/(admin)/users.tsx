import { COLORS } from '@/constants/admissionTheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'parent' | 'teacher' | 'accountant';
  status: 'pending' | 'approved' | 'rejected';
  avatar: string;
  joinedDate: string;
};

export default function UsersManagement() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');
  
  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'Priya Kumar', email: 'priya@example.com', role: 'parent', status: 'pending', avatar: '👩', joinedDate: '2 hours ago' },
    { id: '2', name: 'Arjun Singh', email: 'arjun@example.com', role: 'parent', status: 'pending', avatar: '👨', joinedDate: '5 hours ago' },
    { id: '3', name: 'Rohan Mehta', email: 'rohan@example.com', role: 'teacher', status: 'pending', avatar: '👨‍🏫', joinedDate: '1 day ago' },
    { id: '4', name: 'Sara Khan', email: 'sara@example.com', role: 'parent', status: 'approved', avatar: '👩', joinedDate: '2 days ago' },
    { id: '5', name: 'Milo Gupta', email: 'milo@example.com', role: 'accountant', status: 'pending', avatar: '👨‍💼', joinedDate: '3 days ago' },
  ]);

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true;
    return user.status === filter;
  });

  const handleApprove = (userId: string) => {
    Alert.alert(
      'Approve User',
      'Are you sure you want to approve this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            setUsers(users.map(u => u.id === userId ? { ...u, status: 'approved' } : u));
            Alert.alert('Success', 'User has been approved!');
          },
        },
      ]
    );
  };

  const handleReject = (userId: string) => {
    Alert.alert(
      'Reject User',
      'Are you sure you want to reject this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            setUsers(users.map(u => u.id === userId ? { ...u, status: 'rejected' } : u));
            Alert.alert('Rejected', 'User has been rejected.');
          },
        },
      ]
    );
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'parent': return { bg: '#F0F9FF', text: '#0284C7' };
      case 'teacher': return { bg: '#F0FDF4', text: '#16A34A' };
      case 'accountant': return { bg: '#FEF3C7', text: '#D97706' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>User Management</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <Text style={styles.statBadgeText}>
                {users.filter(u => u.status === 'pending').length} Pending
              </Text>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
              All ({users.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
            onPress={() => setFilter('pending')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, filter === 'pending' && styles.filterTabTextActive]}>
              Pending ({users.filter(u => u.status === 'pending').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, filter === 'approved' && styles.filterTabActive]}
            onPress={() => setFilter('approved')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, filter === 'approved' && styles.filterTabTextActive]}>
              Approved ({users.filter(u => u.status === 'approved').length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Users List */}
        <View style={styles.usersList}>
          {filteredUsers.map((user) => {
            const roleColors = getRoleBadgeColor(user.role);
            
            return (
              <View key={user.id} style={styles.userCard}>
                {/* User Info */}
                <View style={styles.userInfo}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarEmoji}>{user.avatar}</Text>
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <View style={styles.userMeta}>
                      <View style={[styles.roleBadge, { backgroundColor: roleColors.bg }]}>
                        <Text style={[styles.roleBadgeText, { color: roleColors.text }]}>
                          {user.role}
                        </Text>
                      </View>
                      <Text style={styles.joinedDate}>{user.joinedDate}</Text>
                    </View>
                  </View>
                </View>

                {/* Actions */}
                {user.status === 'pending' && (
                  <View style={styles.userActions}>
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => handleApprove(user.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleReject(user.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                )}

                {user.status === 'approved' && (
                  <View style={styles.statusBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                    <Text style={styles.statusText}>Approved</Text>
                  </View>
                )}
              </View>
            );
          })}
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
    gap: 16,
  },

  // Header
  header: {
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.warning,
  },

  // Filter Tabs
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
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
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray,
  },
  filterTabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Users List
  usersList: {
    gap: 12,
  },
  userCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarEmoji: {
    fontSize: 32,
  },
  userDetails: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  userEmail: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  joinedDate: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray,
  },

  // Actions
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Status Badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.success,
  },
});
