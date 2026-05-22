import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
    Animated,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/admissionTheme';
import { IMAGES } from '../constants/images';

export default function AccountPendingScreen() {
  const router = useRouter();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <LinearGradient 
          colors={[COLORS.primary, COLORS.primaryLight, `${COLORS.secondary}40`]}
          style={styles.headerSection}
        >
          <Animated.View 
            style={[
              styles.headerContent,
              { opacity: fadeAnim }
            ]}
          >
            {/* School Name */}
            <Text style={styles.schoolName}>DMA PRESCHOOL</Text>

            {/* Logo Circle */}
            <Animated.View
              style={[
                styles.logoCircle,
                {
                  transform: [{ scale: scaleAnim }]
                }
              ]}
            >
              <Image 
                source={IMAGES.schoolLogo} 
                style={styles.schoolLogoImage}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Title */}
            <Text style={styles.title}>Account Pending Approval</Text>
            <Text style={styles.subtitle}>
              Your account is being reviewed by the school administration
            </Text>
          </Animated.View>
        </LinearGradient>

        {/* Content Section */}
        <View style={styles.contentSection}>
        <Animated.View 
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Clock Icon */}
          <Animated.View 
            style={[
              styles.iconContainer,
              {
                transform: [{ scale: pulseAnim }]
              }
            ]}
          >
            <Ionicons name="time-outline" size={48} color={COLORS.warning} />
          </Animated.View>

          {/* Message */}
          <Text style={styles.messageTitle}>Verification in Progress</Text>
          <Text style={styles.messageText}>
            If your child is enrolled here, your account will be activated by the school within 4 hours. You will be provided with a 6-digit code, to be used during each login.
          </Text>

          {/* Exit Button - Inside Card */}
          <TouchableOpacity 
            style={styles.exitButton}
            activeOpacity={0.8}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.exitButtonText}>Exit</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* OR Divider */}
        <View style={styles.orDivider}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.orLine} />
        </View>

        {/* New Admission Section */}
        <Animated.View 
          style={[
            styles.newAdmissionSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <Text style={styles.newAdmissionLabel}>For New Admission</Text>
          <TouchableOpacity
            style={styles.enrollButton}
            onPress={() => router.push('/admission/step-1')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#DAA520', '#C8941C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.enrollButtonGradient}
            >
              <Text style={styles.enrollButtonText}>Enroll here</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        </View>

        {/* Spacer for bottom */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  // Header Section
  headerSection: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 20,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: '600',
    color: `${COLORS.white}CC`,
    letterSpacing: 2,
    marginBottom: 30,
    textAlign: 'center',
  },

  // Logo
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  schoolLogoImage: {
    width: 60,
    height: 60,
  },

  // Text Content
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: `${COLORS.white}E6`,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Content Section
  contentSection: {
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    alignItems: 'center',
  },

  // Icon
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.warningLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  // Message
  messageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  messageText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },

  // Exit Button - Inside Card (Small)
  exitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignSelf: 'center',
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  exitButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // OR Divider
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    paddingHorizontal: 20,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.lightGray,
  },
  orText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray,
    marginHorizontal: 16,
  },

  // New Admission Section
  newAdmissionSection: {
    alignItems: 'center',
    gap: 16,
  },
  newAdmissionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  enrollButton: {
    width: '100%',
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: '#DAA520',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  enrollButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  enrollButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
