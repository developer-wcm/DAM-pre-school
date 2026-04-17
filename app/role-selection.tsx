import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Role = 'teacher' | 'parent' | null;

export default function RoleSelectionScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role>(null);

  return (
    <LinearGradient
      colors={['#EDE9F6', '#F0EEF8', '#F8EEF0']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoIcon}>
          <Text style={styles.logoEmoji}>🎓</Text>
        </View>

        <Text style={styles.title}>Join Our{'\n'}Community</Text>
        <Text style={styles.subtitle}>
          Tell us who you are so we can tailor your experience perfectly for you.
        </Text>
      </View>

      {/* Role cards */}
      <View style={styles.cardsContainer}>
        {/* Teacher card */}
        <TouchableOpacity
          style={[styles.card, selectedRole === 'teacher' && styles.cardSelected]}
          onPress={() => setSelectedRole('teacher')}
          activeOpacity={0.85}
        >
          <View style={[styles.roleIcon, { backgroundColor: '#C8EDE3' }]}>
            <Text style={styles.roleEmoji}>📖</Text>
          </View>
          <View style={styles.cardText}>
            <Text style={styles.roleName}>Teacher</Text>
            <Text style={styles.roleDesc}>
              Manage classes, track attendance, and message parents.
            </Text>
          </View>
        </TouchableOpacity>

        {/* Parent card */}
        <TouchableOpacity
          style={[styles.card, selectedRole === 'parent' && styles.cardSelected]}
          onPress={() => setSelectedRole('parent')}
          activeOpacity={0.85}
        >
          <View style={[styles.roleIcon, { backgroundColor: '#FAD9C8' }]}>
            <Text style={styles.roleEmoji}>🐣</Text>
          </View>
          <View style={styles.cardText}>
            <Text style={styles.roleName}>Parent</Text>
            <Text style={styles.roleDesc}>
              See daily updates, photos, and connect with teachers.
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Bottom actions */}
      <View style={styles.bottomContent}>
        <TouchableOpacity
          style={[styles.continueButton, !selectedRole && styles.continueButtonDisabled]}
          onPress={() => {
            if (selectedRole) {
              // navigate to next screen, passing the role
              router.push({ pathname: '/find-school', params: { role: selectedRole } });
            }
          }}
          activeOpacity={selectedRole ? 0.85 : 1}
        >
          <Text style={[styles.continueText, !selectedRole && styles.continueTextDisabled]}>
            Continue  →
          </Text>
        </TouchableOpacity>

        <Text style={styles.loginText}>
          Already have an account?{' '}
          <Text style={styles.loginLink} onPress={() => router.push('/login')}>
            Log in
          </Text>
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },

  // Header
  header: {
    gap: 12,
  },
  logoIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#9B8FE0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  logoEmoji: {
    fontSize: 26,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A2E',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#7A7A9D',
    lineHeight: 22,
  },

  // Cards
  cardsContainer: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: '#9B8FE0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: '#7B6FE8',
  },
  roleIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleEmoji: {
    fontSize: 26,
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  roleName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  roleDesc: {
    fontSize: 13,
    color: '#7A7A9D',
    lineHeight: 19,
  },

  // Bottom
  bottomContent: {
    gap: 20,
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#C4BEF5',
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueText: {
    color: '#5B4FD4',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  continueTextDisabled: {
    color: '#8A82C4',
  },
  loginText: {
    fontSize: 14,
    color: '#5A5A7A',
  },
  loginLink: {
    color: '#7B6FE8',
    fontWeight: '600',
  },
});
