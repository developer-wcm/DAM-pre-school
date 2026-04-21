import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/auth';

export default function MoreScreen() {
  const { signOut, profile } = useAuth();
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'AD';

  return (
    <LinearGradient colors={['#EDE9F6', '#F0EEF8', '#EAF0F8']} style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{profile?.full_name ?? 'Admin'}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name="shield-checkmark" size={13} color="#7B6FE8" />
          <Text style={styles.roleText}>{profile?.role?.toUpperCase() ?? 'ADMIN'}</Text>
        </View>
      </View>

      <View style={styles.menuCard}>
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <View style={[styles.menuIcon, { backgroundColor: '#E8E4F8' }]}>
            <Ionicons name="person-outline" size={18} color="#7B6FE8" />
          </View>
          <Text style={styles.menuLabel}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={16} color="#C4C4D4" />
        </TouchableOpacity>
        <View style={styles.menuDivider} />
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <View style={[styles.menuIcon, { backgroundColor: '#D4F4E8' }]}>
            <Ionicons name="notifications-outline" size={18} color="#2A9D6E" />
          </View>
          <Text style={styles.menuLabel}>Notifications</Text>
          <Ionicons name="chevron-forward" size={16} color="#C4C4D4" />
        </TouchableOpacity>
        <View style={styles.menuDivider} />
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <View style={[styles.menuIcon, { backgroundColor: '#FFF0D4' }]}>
            <Ionicons name="settings-outline" size={18} color="#D4822A" />
          </View>
          <Text style={styles.menuLabel}>Settings</Text>
          <Ionicons name="chevron-forward" size={16} color="#C4C4D4" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={signOut} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color="#E05A5A" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 24, gap: 20 },
  profileCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 28,
    alignItems: 'center', gap: 10,
    shadowColor: '#9B8FE0', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#E8E4F8', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 26, fontWeight: '800', color: '#7B6FE8' },
  name: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#F0EEFF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  roleText: { fontSize: 11, fontWeight: '700', color: '#7B6FE8', letterSpacing: 1 },

  menuCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20,
    shadowColor: '#9B8FE0', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  menuIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
  menuDivider: { height: 1, backgroundColor: '#F4F3FA', marginHorizontal: 16 },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF0F0', borderRadius: 16, padding: 16, gap: 10,
  },
  signOutText: { fontSize: 15, fontWeight: '700', color: '#E05A5A' },
});
