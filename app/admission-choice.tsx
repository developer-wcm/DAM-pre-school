import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/admissionTheme';
import { IMAGES } from '../constants/images';

export default function AdmissionChoiceScreen() {
  const router = useRouter();

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Image 
              source={IMAGES.schoolLogo}
              style={styles.schoolLogo}
              contentFit="contain"
              transition={300}
              cachePolicy="memory-disk"
            />
          </View>
          <Text style={styles.title}>Choose Your Path</Text>
          <Text style={styles.subtitle}>
            Are you signing in or applying for new admission?
          </Text>
        </View>

        {/* Choice Cards */}
        <View style={styles.choiceContainer}>
          {/* School Access */}
          <TouchableOpacity
            style={styles.choiceCard}
            onPress={() => router.push('/role-selection')}
            activeOpacity={0.8}
          >
            <View style={[styles.choiceIcon, { backgroundColor: COLORS.successLight }]}>
              <Ionicons name="people-outline" size={28} color={COLORS.success} />
            </View>
            <View style={styles.choiceContent}>
              <Text style={styles.choiceTitle}>School Access</Text>
              <Text style={styles.choiceDescription}>
                Log in or create an account for DMA PreSchool
              </Text>
            </View>
            <View style={styles.choiceArrow}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
            </View>
          </TouchableOpacity>

          {/* New Admission */}
          <TouchableOpacity
            style={styles.choiceCard}
            onPress={() => router.push('/(dashboard)/admission/step-1')}
            activeOpacity={0.8}
          >
            <View style={[styles.choiceIcon, { backgroundColor: COLORS.warningLight }]}>
              <Ionicons name="document-text" size={28} color={COLORS.secondary} />
            </View>
            <View style={styles.choiceContent}>
              <Text style={styles.choiceTitle}>New Admission</Text>
              <Text style={styles.choiceDescription}>
                I want to apply for new admission to the school
              </Text>
            </View>
            <View style={styles.choiceArrow}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="information-circle" size={16} color={COLORS.primary} />
          </View>
          <Text style={styles.infoText}>
            If you're unsure which option to choose, contact the school administration for guidance.
          </Text>
        </View>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={18} color={COLORS.textSecondary} />
          <Text style={styles.backText}>Back to Privacy Notice</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },

  // Header
  header: {
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    padding: 12,
  },
  schoolLogo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },

  // Choice Cards
  choiceContainer: {
    gap: 16,
    marginTop: -40,
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  choiceIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  choiceContent: {
    flex: 1,
    gap: 4,
  },
  choiceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  choiceDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  choiceArrow: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.primarySoft,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  infoIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primary,
    lineHeight: 18,
  },

  // Back Button
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  backText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
