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

type ConsentItem = {
  id: string;
  title: string;
  description: string;
};

const CONSENT_ITEMS: ConsentItem[] = [
  {
    id: 'data-collection',
    title: 'Data Collection',
    description:
      "I consent to the collection and processing of my child's personal data for school administration.",
  },
  {
    id: 'photo-usage',
    title: 'Photo Usage',
    description:
      "I allow the use of my child's photos for identification purposes within the app interface.",
  },
  {
    id: 'leave-policy',
    title: 'Leave Policy Acknowledgment',
    description: "I have read and acknowledged the school's leave and absence policy.",
  },
  {
    id: 'emergency-contact',
    title: 'Emergency Contact Authorization',
    description:
      'I authorize the school to contact me or my designated emergency contacts in case of urgent situations.',
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
    <LinearGradient colors={['#EDE9F6', '#F0EEF8', '#EAF0F8']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Shield icon */}
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>{'🛡️'}</Text>
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
              style={styles.consentCard}
              onPress={() => toggleConsent(item.id)}
              activeOpacity={0.85}
            >
              <View style={styles.checkbox}>
                {consents[item.id] && <View style={styles.checkboxInner} />}
              </View>
              <View style={styles.consentText}>
                <Text style={styles.consentTitle}>{item.title}</Text>
                <Text style={styles.consentDesc}>{item.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue button */}
        <TouchableOpacity
          activeOpacity={allSelected ? 0.85 : 1}
          onPress={() => {
            if (allSelected) {
              router.push('/approval-pending');
            }
          }}
        >
          <LinearGradient
            colors={allSelected ? ['#7B6FE8', '#6EC6C6'] : ['#C4BEF5', '#C4BEF5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButton}
          >
            <Text style={styles.continueText}>Select all to continue</Text>
          </LinearGradient>
        </TouchableOpacity>

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
    paddingTop: 64,
    paddingBottom: 40,
    gap: 20,
    alignItems: 'center',
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E8E4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#7A7A9D',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    gap: 14,
    shadowColor: '#9B8FE0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#C4BEF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxInner: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#7B6FE8',
  },
  consentText: {
    flex: 1,
    gap: 4,
  },
  consentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  consentDesc: {
    fontSize: 13,
    color: '#7A7A9D',
    lineHeight: 20,
  },
  continueButton: {
    width: '100%',
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footerText: {
    fontSize: 12,
    color: '#9A9AB0',
    textAlign: 'center',
    lineHeight: 18,
  },
});
