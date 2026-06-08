import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../constants/admissionTheme';
import { IMAGES } from '../constants/images';
import { DEFAULT_SCHOOL_NAME } from '../constants/school';
import { useAuth } from '../context/auth';
import { supabase } from '../lib/supabase';

export default function AccountPendingScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [checking, setChecking] = useState(false);
  const [schoolName] = useState(DEFAULT_SCHOOL_NAME);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // =========================
  // CHECK APPROVAL STATUS
  // =========================
  const checkApprovalStatus = useCallback(async () => {
    try {
      if (!user?.id) return;

      setChecking(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('approved, role')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.log('Approval check error:', error.message);
        return;
      }

      if (!data) {
        console.log('No profile found');
        return;
      }

      if (data.approved === true) {
        let redirectPath: any = '/';

        switch (data.role) {
          case 'teacher':
            redirectPath = '/(teacher)';
            break;

          case 'parent':
            redirectPath = '/(parent)';
            break;

          case 'admin':
          case 'principal':
            redirectPath = '/(dashboard)';
            break;

          default:
            redirectPath = '/';
        }

        Alert.alert(
          'Account Approved',
          'Your account has been approved successfully.',
          [
            {
              text: 'Continue',
              onPress: () => {
                router.replace(redirectPath);
              },
            },
          ]
        );
      }
    } catch (err: any) {
      console.log('Unexpected error:', err?.message);
    } finally {
      setChecking(false);
    }
  }, [router, user?.id]);

  // =========================
  // AUTO CHECK EVERY 10 SEC
  // =========================
  useEffect(() => {
    checkApprovalStatus();

    const interval = setInterval(() => {
      checkApprovalStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [checkApprovalStatus]);

  // =========================
  // ANIMATIONS
  // =========================
  useEffect(() => {
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

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
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
        {/* HEADER */}
        <LinearGradient
          colors={[
            COLORS.primary,
            COLORS.primaryLight,
            `${COLORS.secondary}40`,
          ]}
          style={styles.headerSection}
        >
          <Animated.View
            style={[
              styles.headerContent,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <Text style={styles.schoolName}>
              {schoolName.toUpperCase()}
            </Text>

            {/* LOGO */}
            <Animated.View
              style={[
                styles.logoCircle,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <Image
                source={IMAGES.schoolLogo}
                style={styles.schoolLogoImage}
                resizeMode="contain"
              />
            </Animated.View>

            <Text style={styles.title}>
              Account Pending Approval
            </Text>

            <Text style={styles.subtitle}>
              Your account is currently under review by
              the school administration.
            </Text>
          </Animated.View>
        </LinearGradient>

        {/* CONTENT */}
        <View style={styles.contentSection}>
          <Animated.View
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* ICON */}
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Ionicons
                name="time-outline"
                size={48}
                color={COLORS.warning}
              />
            </Animated.View>

            <Text style={styles.messageTitle}>
              Verification in Progress
            </Text>

            <Text style={styles.messageText}>
              Your account has been created successfully.
              The school administration will verify and
              approve your account shortly.
            </Text>

            {/* STATUS */}
            <View style={styles.statusBox}>
              {checking ? (
                <>
                  <ActivityIndicator color={COLORS.primary} />

                  <Text style={styles.statusText}>
                    Checking approval status...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="hourglass-outline"
                    size={18}
                    color={COLORS.warning}
                  />

                  <Text style={styles.statusText}>
                    Waiting for admin approval
                  </Text>
                </>
              )}
            </View>

            {/* REFRESH */}
            <TouchableOpacity
              style={styles.refreshButton}
              activeOpacity={0.85}
              onPress={checkApprovalStatus}
            >
              <Ionicons
                name="refresh-outline"
                size={18}
                color={COLORS.white}
              />

              <Text style={styles.refreshButtonText}>
                Refresh Status
              </Text>
            </TouchableOpacity>

            {/* SIGN OUT */}
            <TouchableOpacity
              style={styles.exitButton}
              activeOpacity={0.85}
              onPress={signOut}
            >
              <Text style={styles.exitButtonText}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },

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
    fontWeight: '700',
    color: `${COLORS.white}CC`,
    letterSpacing: 2,
    marginBottom: 8,
    textAlign: 'center',
  },

  schoolIdText: {
    fontSize: 12,
    fontWeight: '600',
    color: `${COLORS.white}B3`,
    letterSpacing: 1,
    marginBottom: 18,
    textAlign: 'center',
  },

  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 8,
  },

  schoolLogoImage: {
    width: 65,
    height: 65,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 15,
    color: `${COLORS.white}E6`,
    textAlign: 'center',
    lineHeight: 22,
  },

  contentSection: {
    padding: 20,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
  },

  iconContainer: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: COLORS.warningLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  messageTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },

  messageText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },

  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 20,
  },

  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  refreshButton: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 12,
  },

  refreshButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },

  exitButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    borderRadius: 14,
    paddingVertical: 15,
  },

  exitButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
