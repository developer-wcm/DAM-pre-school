import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { COLORS } from '../constants/admissionTheme';
import { IMAGES } from '../constants/images';

type Role = 'teacher' | 'parent' | null;

export default function RoleSelectionScreen() {
  const router = useRouter();

  const [selectedRole, setSelectedRole] =
    useState<Role>(null);

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          {/* LOGO */}
          <View style={styles.logoWrapper}>
            <View style={styles.logoRing} />

            <View style={styles.logoContainer}>
              <Image
                source={IMAGES.schoolLogo}
                style={styles.schoolLogo}
                contentFit="contain"
                transition={300}
                cachePolicy="memory-disk"
              />
            </View>
          </View>

          {/* TEXT */}
          <View style={styles.headerTextContainer}>
            <Text style={styles.schoolName}>
              David & Mary Academy
            </Text>

            <View style={styles.divider} />

            <Text style={styles.title}>
              Join Our Community
            </Text>

            <Text style={styles.subtitle}>
              Select your role to get started
              with a personalized experience
            </Text>
          </View>
        </View>

        {/* ROLE CARDS */}
        <View style={styles.cardsContainer}>
          {/* TEACHER CARD */}
          <TouchableOpacity
            style={[
              styles.card,
              selectedRole === 'teacher' &&
                styles.cardSelected,
            ]}
            onPress={() => setSelectedRole('teacher')}
            activeOpacity={0.85}
          >
            <View style={styles.cardContent}>
              <View
                style={[
                  styles.roleIconContainer,
                  {
                    backgroundColor:
                      COLORS.successLight,
                  },
                ]}
              >
                <Ionicons
                  name="book-outline"
                  size={32}
                  color={COLORS.success}
                />
              </View>

              <View style={styles.cardTextContainer}>
                <View style={styles.roleHeader}>
                  <Text style={styles.roleName}>
                    School Staff
                  </Text>

                  {selectedRole === 'teacher' && (
                    <View style={styles.selectedBadge}>
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={COLORS.white}
                      />
                    </View>
                  )}
                </View>

                <Text style={styles.roleDesc}>
                  Manage classes, track attendance,
                  and communicate with parents
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* PARENT CARD */}
          <TouchableOpacity
            style={[
              styles.card,
              selectedRole === 'parent' &&
                styles.cardSelected,
            ]}
            onPress={() => setSelectedRole('parent')}
            activeOpacity={0.85}
          >
            <View style={styles.cardContent}>
              <View
                style={[
                  styles.roleIconContainer,
                  {
                    backgroundColor:
                      COLORS.secondarySoft,
                  },
                ]}
              >
                <Ionicons
                  name="people-outline"
                  size={32}
                  color={COLORS.secondary}
                />
              </View>

              <View style={styles.cardTextContainer}>
                <View style={styles.roleHeader}>
                  <Text style={styles.roleName}>
                    Parent
                  </Text>

                  {selectedRole === 'parent' && (
                    <View style={styles.selectedBadge}>
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={COLORS.white}
                      />
                    </View>
                  )}
                </View>

                <Text style={styles.roleDesc}>
                  View updates, photos, and stay
                  connected with teachers
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* BOTTOM SECTION */}
        <View style={styles.bottomContent}>
          {/* CONTINUE BUTTON */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedRole &&
                styles.continueButtonDisabled,
            ]}
            onPress={() => {
              if (selectedRole) {
                router.push({
                  pathname: '/sign-up',
                  params: {
                    role: selectedRole,
                  },
                });
              }
            }}
            activeOpacity={selectedRole ? 0.85 : 1}
            disabled={!selectedRole}
          >
            <Text
              style={[
                styles.continueText,
                !selectedRole &&
                  styles.continueTextDisabled,
              ]}
            >
              Continue
            </Text>

            <Ionicons
              name="arrow-forward"
              size={20}
              color={COLORS.white}
            />
          </TouchableOpacity>

          {/* LOGIN LINK */}
          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginPrompt}>
              Already have an account?
            </Text>

            <TouchableOpacity
              onPress={() => router.push('/login')}
              activeOpacity={0.7}
            >
              <Text style={styles.loginLink}>
                {' '}Log in
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },

  // HEADER
  header: {
    alignItems: 'center',
    paddingBottom: 32,
  },

  logoWrapper: {
    position: 'relative',
    marginBottom: 20,
  },

  logoRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: COLORS.secondary + '30',
    top: -10,
    left: -10,
  },

  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    padding: 8,
  },

  schoolLogo: {
    width: '100%',
    height: '100%',
  },

  headerTextContainer: {
    alignItems: 'center',
    gap: 12,
  },

  schoolName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  divider: {
    width: 40,
    height: 3,
    backgroundColor: COLORS.secondary,
    borderRadius: 2,
    marginVertical: 4,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 10,
  },

  // CARDS
  cardsContainer: {
    gap: 16,
    paddingVertical: 24,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 3,
    borderColor: 'transparent',
  },

  cardSelected: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.secondarySoft,
    shadowColor: COLORS.secondary,
    shadowOpacity: 0.2,
    transform: [{ scale: 1.02 }],
  },

  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  roleIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardTextContainer: {
    flex: 1,
    gap: 6,
  },

  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  roleName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },

  roleDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  // BOTTOM
  bottomContent: {
    paddingTop: 16,
    gap: 16,
    marginTop: 12,
    paddingBottom: 30,
  },

  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  continueButtonDisabled: {
    backgroundColor: COLORS.buttonDisabled,
    shadowOpacity: 0.1,
  },

  continueText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  continueTextDisabled: {
    color: COLORS.gray,
  },

  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  loginPrompt: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },

  loginLink: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DAA520',
    textDecorationLine: 'underline',
  },
});
