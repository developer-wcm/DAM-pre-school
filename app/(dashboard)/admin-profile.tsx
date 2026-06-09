import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DEFAULT_SCHOOL_NAME } from '../../constants/school';
import { useAuth } from '../../context/auth';
import { supabase } from '../../lib/supabase';

interface SchoolStats {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalStaff: number;
}

function getInitials(name: string | null) {
  if (!name) return 'AD';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatJoined(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function AdminProfileScreen() {
  const router = useRouter();
  const { profile, user, signOut } = useAuth();
  const [stats, setStats] = useState<SchoolStats | null>(null);
  const [loading, setLoading] = useState(true);

  const initials = getInitials(profile?.full_name ?? null);
  const schoolId = profile?.school_id ?? '';

  useEffect(() => {
    fetchStats();
  }, [schoolId]);

  async function fetchStats() {
    if (!schoolId) { setLoading(false); return; }
    try {
      const [studentsRes, staffRes] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
        supabase.from('profiles').select('role').eq('school_id', schoolId).eq('approved', true),
      ]);

      const roleCounts: Record<string, number> = {};
      (staffRes.data ?? []).forEach((p: any) => {
        roleCounts[p.role] = (roleCounts[p.role] || 0) + 1;
      });

      setStats({
        totalStudents: studentsRes.count ?? 0,
        totalTeachers: roleCounts['teacher'] ?? 0,
        totalParents: roleCounts['parent'] ?? 0,
        totalStaff: (staffRes.data ?? []).length,
      });
    } catch (e) {
      console.error('Profile stats error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  }

  const statItems = [
    { label: 'Students', value: stats?.totalStudents ?? 0, icon: 'school-outline' as const, bg: '#E8EDF3', color: '#1E3A5F' },
    { label: 'Teachers', value: stats?.totalTeachers ?? 0, icon: 'people-outline' as const, bg: '#D4F4E8', color: '#2A9D6E' },
    { label: 'Parents', value: stats?.totalParents ?? 0, icon: 'person-outline' as const, bg: '#E8E4F8', color: '#7B6FE8' },
    { label: 'Total Staff', value: stats?.totalStaff ?? 0, icon: 'briefcase-outline' as const, bg: '#FDF6E3', color: '#DAA520' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient colors={['#1E3A5F', '#2C5282', '#1E3A5F']} style={styles.headerGradient}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.navigate('/(dashboard)/')} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Profile</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>

        {/* Avatar Card */}
        <View style={styles.avatarSection}>
          <LinearGradient colors={['#1E3A5F', '#2C5282']} style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <View style={styles.goldRing} />
          <Text style={styles.adminName}>{profile?.full_name ?? 'Admin'}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={13} color="#DAA520" />
            <Text style={styles.roleText}>Administrator</Text>
          </View>
          <Text style={styles.schoolName}>{DEFAULT_SCHOOL_NAME}</Text>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Details</Text>
          <InfoRow icon="mail-outline" label="Email" value={user?.email ?? '—'} />
          <InfoRow icon="business-outline" label="School ID" value={schoolId || '—'} />
          <InfoRow icon="calendar-outline" label="Member Since" value={formatJoined(user?.created_at ?? null)} />
          <InfoRow icon="shield-outline" label="Role" value="Admin" last />
        </View>

        {/* Stats Grid */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#1E3A5F" />
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>School Overview</Text>
            <View style={styles.statsGrid}>
              {statItems.map((s) => (
                <View key={s.label} style={[styles.statBox, { backgroundColor: s.bg }]}>
                  <Ionicons name={s.icon} size={22} color={s.color} />
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <ActionRow
            icon="create-outline"
            label="Edit Profile"
            color="#1E3A5F"
            onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon.')}
          />
          <ActionRow
            icon="key-outline"
            label="Change Password"
            color="#DAA520"
            onPress={() => Alert.alert('Reset Password', 'A password reset link will be sent to your email.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Send Link', onPress: async () => {
                if (user?.email) {
                  await supabase.auth.resetPasswordForEmail(user.email);
                  Alert.alert('Email Sent', 'Check your inbox for the reset link.');
                }
              }},
            ])}
          />
          <ActionRow
            icon="log-out-outline"
            label="Sign Out"
            color="#E05A5A"
            onPress={handleSignOut}
            last
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value, last }: { icon: any; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <View style={styles.infoIconBox}>
        <Ionicons name={icon} size={18} color="#1E3A5F" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

function ActionRow({ icon, label, color, onPress, last }: {
  icon: any; label: string; color: string; onPress: () => void; last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionRow, last && styles.infoRowLast]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.actionIconBox, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={color + '80'} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  scroll: { paddingBottom: 30 },

  headerGradient: {
    paddingTop: 52,
    paddingBottom: 70,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  avatarSection: {
    alignItems: 'center',
    marginTop: -50,
    marginBottom: 8,
    paddingBottom: 20,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  goldRing: {
    position: 'absolute',
    top: -4,
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: '#DAA520',
    zIndex: 1,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
  },
  adminName: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3A5F',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FDF6E3',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#DAA52040',
  },
  roleText: {
    color: '#DAA520',
    fontSize: 13,
    fontWeight: '700',
  },
  schoolName: {
    marginTop: 6,
    fontSize: 13,
    color: '#5A6C7D',
    fontWeight: '500',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 18,
    marginTop: 14,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 4,
    shadowColor: 'rgba(30,58,95,0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#8B95A1',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
    gap: 14,
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E8EDF3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#8B95A1', fontWeight: '600', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#1E3A5F', fontWeight: '700' },

  loadingBox: { height: 80, justifyContent: 'center', alignItems: 'center' },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  statBox: {
    width: '47%',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  statValue: { fontSize: 26, fontWeight: '900' },
  statLabel: { fontSize: 11, color: '#5A6C7D', fontWeight: '600' },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
    gap: 14,
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: { flex: 1, fontSize: 15, fontWeight: '700' },
});
