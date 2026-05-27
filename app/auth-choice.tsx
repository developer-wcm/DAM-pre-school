import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/admissionTheme';
import { DEFAULT_SCHOOL_ID, DEFAULT_SCHOOL_NAME } from '../constants/school';

const ROLE_LABELS: Record<string, string> = {
  teacher: 'School Staff',
  parent: 'Parent',
  admin: 'Admin',
  accountant: 'Accountant',
};

const ROLE_ICONS: Record<string, { name: any; bg: string; color: string }> = {
  teacher: { name: 'book-outline', bg: '#C8EDE3', color: '#2A9D6E' },
  parent:  { name: 'people-outline', bg: '#FAD9C8', color: '#D4622A' },
  admin:   { name: 'shield-checkmark-outline', bg: '#E8E4F8', color: '#7B6FE8' },
  accountant: { name: 'wallet-outline', bg: '#FFF0D4', color: '#A05A00' },
};

export default function AuthChoiceScreen() {
  const router = useRouter();
  const { role, schoolId } = useLocalSearchParams<{ role: string; schoolId?: string }>();
  const resolvedSchoolId = schoolId ?? DEFAULT_SCHOOL_ID;

  const icon = ROLE_ICONS[role ?? 'parent'];
  const label = ROLE_LABELS[role ?? 'parent'];

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>

      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.roleIconBox, { backgroundColor: icon.bg }]}>
          <Ionicons name={icon.name} size={32} color={icon.color} />
        </View>
        <Text style={styles.title}>Welcome,{'\n'}{label}!</Text>
        <Text style={styles.subtitle}>
          Do you already have an account or are you joining for the first time?
        </Text>
      </View>

      {/* Choices */}
      <View style={styles.choices}>

        {/* Log In */}
        <TouchableOpacity
          style={styles.primaryCard}
          activeOpacity={0.85}
          onPress={() => router.push('/login')}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryLight]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.primaryCardGradient}
          >
            <View style={styles.cardIconCircle}>
              <Ionicons name="log-in-outline" size={26} color={COLORS.primary} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.primaryCardTitle}>Log In</Text>
              <Text style={styles.primaryCardSubtitle}>I already have an account</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Create Account */}
          <TouchableOpacity
            style={styles.secondaryCard}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: '/sign-up',
                params: {
                  role,
                  schoolId: resolvedSchoolId,
                  schoolName: DEFAULT_SCHOOL_NAME,
                },
              })
            }
          >
          <View style={[styles.cardIconCircle, { backgroundColor: COLORS.primarySoft }]}>
            <Ionicons name="person-add-outline" size={26} color={COLORS.primary} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.secondaryCardTitle}>Create Account</Text>
            <Text style={styles.secondaryCardSubtitle}>I'm new here, sign me up</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
        </TouchableOpacity>

      </View>

      {/* Info note */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
        <Text style={styles.infoText}>
          New accounts require approval from your school admin before you can access the app.
        </Text>
      </View>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, paddingHorizontal: 24,
    paddingTop: 60, paddingBottom: 40,
    gap: 32,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6, elevation: 2,
    alignSelf: 'flex-start',
  },

  header: { gap: 14 },
  roleIconBox: {
    width: 72, height: 72, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: 32, fontWeight: '800', color: COLORS.textPrimary, lineHeight: 40, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 22 },

  choices: { gap: 16 },

  primaryCard: {
    borderRadius: 20, overflow: 'hidden',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  primaryCardGradient: {
    flexDirection: 'row', alignItems: 'center',
    padding: 20, gap: 16,
  },
  cardIconCircle: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center',
  },
  cardText: { flex: 1, gap: 3 },
  primaryCardTitle: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  primaryCardSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },

  secondaryCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 20,
    padding: 20, gap: 16,
    borderWidth: 2, borderColor: COLORS.primaryLight,
    shadowColor: COLORS.cardShadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  secondaryCardTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  secondaryCardSubtitle: { fontSize: 13, color: COLORS.textSecondary },

  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: COLORS.primarySoft, borderRadius: 14,
    padding: 14,
  },
  infoText: { flex: 1, fontSize: 13, color: COLORS.primary, lineHeight: 19 },
});
