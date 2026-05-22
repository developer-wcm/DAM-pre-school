import { COLORS } from '@/constants/admissionTheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type StaffMember = {
  id: string;
  name: string;
  role: 'teacher' | 'accountant' | 'admin';
  email: string;
  phone: string;
  class?: string;
  status: 'active' | 'on-leave';
  avatar: string;
};

export default function StaffScreen() {
  const [filter, setFilter] = useState<'all' | 'teacher' | 'accountant'>('all');

  const [staff, setStaff] = useState<StaffMember[]>([
    { id: '1', name: 'Ms. Priya Sharma', role: 'teacher', email: 'priya@school.com', phone: '+91 98765 43210', class: 'Play Group', status: 'active', avatar: '👩‍🏫' },
    { id: '2', name: 'Ms. Anjali Mehta', role: 'teacher', email: 'anjali@school.com', phone: '+91 98765 43211', class: 'Pre-KG', status: 'active', avatar: '👩‍🏫' },
    { id: '3', name: 'Ms. Kavita Singh', role: 'teacher', email: 'kavita@school.com', phone: '+91 98765 43212', class: 'Junior KG', status: 'active', avatar: '👩‍🏫' },
    { id: '4', name: 'Ms. Neha Gupta', role: 'teacher', email: 'neha@school.com', phone: '+91 98765 43213', class: 'Senior KG', status: 'on-leave', avatar: '👩‍🏫' },
    { id: '5', name: 'Mr. Rohan Kumar', role: 'accountant', email: 'rohan@school.com', phone: '+91 98765 43214', status: 'active', avatar: '👨‍💼' },
    { id: '6', name: 'Ms. Sneha Patel', role: 'teacher', email: 'sneha@school.com', phone: '+91 98765 43215', class: 'Play Group', status: 'active', avatar: '👩‍🏫' },
  ]);

  const filteredStaff = staff.filter((member) => {
    if (filter === 'all') return true;
    return member.role === filter;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'teacher':
        return { bg: '#F0FDF4', text: '#16A34A' };
      case 'accountant':
        return { bg: '#FEF3C7', text: '#D97706' };
      case 'admin':
        return { bg: '#F0F9FF', text: '#0284C7' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const handleViewDetails = (member: StaffMember) => {
    Alert.alert(
      member.name,
      `Role: ${member.role}\nEmail: ${member.email}\nPhone: ${member.phone}${member.class ? `\nClass: ${member.class}` : ''}\nStatus: ${member.status}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Staff Management</Text>
            <Text style={styles.headerSubtitle}>
              {staff.length} total staff members
            </Text>
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
              All ({staff.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, filter === 'teacher' && styles.filterTabActive]}
            onPress={() => setFilter('teacher')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, filter === 'teacher' && styles.filterTabTextActive]}>
              Teachers ({staff.filter((s) => s.role === 'teacher').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, filter === 'accountant' && styles.filterTabActive]}
            onPress={() => setFilter('accountant')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, filter === 'accountant' && styles.filterTabTextActive]}>
              Others ({staff.filter((s) => s.role !== 'teacher').length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Staff List */}
        <View style={styles.staffList}>
          {filteredStaff.map((member) => {
            const roleColors = getRoleBadgeColor(member.role);

            return (
              <TouchableOpacity
                key={member.id}
                style={styles.staffCard}
                activeOpacity={0.8}
                onPress={() => handleViewDetails(member)}
              >
                {/* Staff Info */}
                <View style={styles.staffInfo}>
                  <View style={styles.staffAvatar}>
                    <Text style={styles.staffAvatarEmoji}>{member.avatar}</Text>
                    {member.status === 'on-leave' && (
                      <View style={styles.leaveIndicator}>
                        <Ionicons name="time" size={12} color={COLORS.white} />
                      </View>
                    )}
                  </View>
                  <View style={styles.staffDetails}>
                    <Text style={styles.staffName}>{member.name}</Text>
                    <Text style={styles.staffEmail}>{member.email}</Text>
                    <View style={styles.staffMeta}>
                      <View style={[styles.roleBadge, { backgroundColor: roleColors.bg }]}>
                        <Text style={[styles.roleBadgeText, { color: roleColors.text }]}>
                          {member.role}
                        </Text>
                      </View>
                      {member.class && (
                        <View style={styles.classBadge}>
                          <Ionicons name="book" size={10} color={COLORS.primary} />
                          <Text style={styles.classBadgeText}>{member.class}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Status & Action */}
                <View style={styles.staffActions}>
                  {member.status === 'active' ? (
                    <View style={styles.statusBadge}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusText}>Active</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, styles.statusBadgeLeave]}>
                      <Ionicons name="time" size={12} color={COLORS.warning} />
                      <Text style={[styles.statusText, { color: COLORS.warning }]}>On Leave</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.viewBtn}
                    onPress={() => handleViewDetails(member)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
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
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
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

  // Staff List
  staffList: {
    gap: 12,
  },
  staffCard: {
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
  staffInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  staffAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  staffAvatarEmoji: {
    fontSize: 32,
  },
  leaveIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.warning,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  staffDetails: {
    flex: 1,
    gap: 4,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  staffEmail: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  staffMeta: {
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
  classBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  classBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Actions
  staffActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusBadgeLeave: {
    backgroundColor: COLORS.warningLight,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },
  viewBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
