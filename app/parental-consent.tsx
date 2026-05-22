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

type ConsentItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

const CONSENT_ITEMS: ConsentItem[] = [
  {
    id: 'data-collection',
    title: 'Data Collection & Processing',
    description:
      "I consent to the collection and processing of my child's personal data for school administration and educational purposes.",
    icon: '🔒',
  },
  {
    id: 'photo-usage',
    title: 'Photo & Media Usage',
    description:
      "I allow the use of my child's photos for identification purposes within the app interface and school activities.",
    icon: '📸',
  },
  {
    id: 'leave-policy',
    title: 'Leave Policy Acknowledgment',
    description: "I have read and acknowledged the school's leave and absence policy, and agree to follow the procedures.",
    icon: '📋',
  },
  {
    id: 'emergency-contact',
    title: 'Emergency Contact Authorization',
    description:
      'I authorize the school to contact me or my designated emergency contacts in case of urgent situations or medical emergencies.',
    icon: '🚨',
  },
];

export default function ParentalConsentScreen() {
  const router = useRouter();
  const [consents, setConsents] = useState<Record<string, boolean>>({});

  const toggleConsent = (id: string) => {
    setConsents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const allSelected = CONSENT_ITEMS.every((item) => consents[item.id]);

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Consent Required</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* School Logo & Title */}
        <View style={styles.logoSection}>
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
          <Text style={styles.schoolName}>David & Mary Academy</Text>
          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.title}>Before We Begin</Text>
        <Text style={styles.subtitle}>
          {"To use DMA PreSchool and access your child's information, we need your consent for the following:"}
        </Text>

        {/* Consent cards */}
        <View style={styles.consentList}>
          {CONSENT_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.consentCard,
                consents[item.id] && styles.consentCardSelected
              ]}
              onPress={() => toggleConsent(item.id)}
              activeOpacity={0.85}
            >
              <View style={styles.consentIconContainer}>
                <Text style={styles.consentIcon}>{item.icon}</Text>
              </View>
              <View style={[
                styles.checkbox,
                consents[item.id] && styles.checkboxSelected
              ]}>
                {consents[item.id] && (
                  <View style={styles.checkboxInner}>
                    <Text style={styles.checkboxCheck}>✓</Text>
                  </View>
                )}
              </View>
              <View style={styles.consentText}>
                <Text style={[
                  styles.consentTitle,
                  consents[item.id] && styles.consentTitleSelected
                ]}>
                  {item.title}
                </Text>
                <Text style={styles.consentDesc}>{item.description}</Text>
              </View>
              {consents[item.id] && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedIndicatorText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progress</Text>
            <Text style={styles.progressCount}>
              {Object.values(consents).filter(Boolean).length}/{CONSENT_ITEMS.length}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(Object.values(consents).filter(Boolean).length / CONSENT_ITEMS.length) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {allSelected ? 'All consents provided! Ready to continue.' : 'Please provide all consents to continue.'}
          </Text>
        </View>

        {/* Select All / Continue button */}
        {!allSelected ? (
          <TouchableOpacity
            style={styles.selectAllButton}
            onPress={() => {
              const newConsents: Record<string, boolean> = {};
              CONSENT_ITEMS.forEach(item => {
                newConsents[item.id] = true;
              });
              setConsents(newConsents);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.selectAllContent}>
              <View style={styles.selectAllIcon}>
                <Text style={styles.selectAllIconText}>✓</Text>
              </View>
              <Text style={styles.selectAllText}>Select All & Continue</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/admission/thank-you-match')}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButton}
            >
              <View style={styles.continueContent}>
                <View style={styles.continueIcon}>
                  <Text style={styles.continueIconText}>→</Text>
                </View>
                <Text style={styles.continueText}>Continue to Application</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Footer note */}
        <Text style={styles.footerText}>
          You can withdraw consent at any time from your profile settings.
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  backIcon: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
  },
  headerSpacer: {
    width: 36,
  },

  // Logo Section
  logoSection: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.secondary + '30',
    borderStyle: 'dashed',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    padding: 8,
  },
  schoolLogo: {
    width: '100%',
    height: '100%',
  },
  schoolName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  dividerLine: {
    width: 60,
    height: 3,
    backgroundColor: COLORS.secondary,
    borderRadius: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
  },
  consentList: {
    width: '100%',
    gap: 14,
    marginTop: 8,
  },
  consentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    gap: 14,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  consentCardSelected: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.secondarySoft,
    shadowColor: COLORS.secondary,
    shadowOpacity: 0.2,
    elevation: 5,
  },
  consentIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  consentIcon: {
    fontSize: 22,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  checkboxSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  checkboxInner: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCheck: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
  },
  consentText: {
    flex: 1,
    gap: 4,
  },
  consentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  consentTitleSelected: {
    color: COLORS.primary,
  },
  consentDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  selectedIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedIndicatorText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
  },

  // Progress indicator
  progressContainer: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginTop: 8,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  progressCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
    backgroundColor: COLORS.secondarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Select All Button
  selectAllButton: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 50,
    paddingVertical: 18,
    paddingHorizontal: 24,
    marginTop: 8,
    borderWidth: 3,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  selectAllContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  selectAllIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectAllIconText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
  },
  selectAllText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.3,
  },

  // Continue Button
  continueButton: {
    width: '100%',
    borderRadius: 50,
    paddingVertical: 18,
    paddingHorizontal: 24,
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  continueContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  continueIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueIconText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
  },
  continueText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
