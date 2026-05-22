import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS } from '../constants/admissionTheme';

const WHY_WE_COLLECT = [
  { type: 'Attendance', purpose: 'Safety & Daily Tracking' },
  { type: 'Health Data', purpose: 'Medical Emergency Response' },
  { type: 'Photos/Videos', purpose: 'Progress Documentation' },
  { type: 'Contact Info', purpose: 'Parent Communication' },
  { type: 'Aadhaar (last 4)', purpose: 'Identity Verification' },
];

const YOUR_RIGHTS = [
  { icon: '👁️', title: 'Access', desc: 'View all data we hold about your child.' },
  { icon: '✏️', title: 'Correct', desc: 'Request corrections to inaccurate data.' },
  { icon: '🗑️', title: 'Erase', desc: 'Request deletion of your data at any time.' },
  { icon: '🚫', title: 'Withdraw Consent', desc: 'Opt out of non-essential data processing.' },
];

export default function PrivacyNoticeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const role = params.role as string;
  const isStaff = role === 'teacher';
  
  const [consentChecked, setConsentChecked] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.7}>
          <Text style={styles.closeIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Notice</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Last updated */}
        <View style={styles.updatedRow}>
          <Text style={styles.updatedText}>Last Updated: 7 February 2026</Text>
          <View style={styles.updatedLine} />
        </View>

        {/* Intro */}
        <Text style={styles.introText}>
          We value your trust. This notice outlines how DMA PreSchool Manager handles your data in
          compliance with the Digital Personal Data Protection Act (DPDPA).
        </Text>

        {/* ── 1. What We Collect ── */}
        <Text style={styles.sectionTitle}>1. What We Collect</Text>

        {isStaff ? (
          /* Staff - Single merged card */
          <View style={[styles.infoCard, { backgroundColor: COLORS.primarySoft }]}>
            <View style={styles.infoCardHeader}>
              <Text style={styles.infoIconEmoji}>👤</Text>
              <Text style={[styles.infoCardTitle, { color: COLORS.primary }]}>Personal Information</Text>
            </View>
            {[
              'Full Name & Date of Birth',
              'Aadhaar Card',
              'Contact Information',
              'Residential Address',
              'Performance & Attendance Log',
            ].map((item) => (
              <View key={item} style={styles.bulletRow}>
                <Text style={[styles.bullet, { color: COLORS.primary }]}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        ) : (
          /* Parent - Two separate cards */
          <>
            {/* Student Information card */}
            <View style={[styles.infoCard, { backgroundColor: COLORS.primarySoft }]}>
              <View style={styles.infoCardHeader}>
                <Text style={styles.infoIconEmoji}>🧒</Text>
                <Text style={[styles.infoCardTitle, { color: COLORS.primary }]}>Student Information</Text>
              </View>
              {[
                'Full Name & Date of Birth',
                'Medical & Allergy Records',
                'Aadhaar Card',
                'Performance & Attendance Logs',
              ].map((item) => (
                <View key={item} style={styles.bulletRow}>
                  <Text style={[styles.bullet, { color: COLORS.primary }]}>•</Text>
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Parent / Guardian Information card */}
            <View style={[styles.infoCard, { backgroundColor: COLORS.secondarySoft }]}>
              <View style={styles.infoCardHeader}>
                <Text style={styles.infoIconEmoji}>👨‍👩‍👧</Text>
                <Text style={[styles.infoCardTitle, { color: COLORS.secondary }]}>
                  Parent / Guardian Information
                </Text>
              </View>
              {[
                'Contact Number & Email Address',
                'Residential Address',
                'Emergency Contact Details',
                'Authorized Pickup List',
              ].map((item) => (
                <View key={item} style={styles.bulletRow}>
                  <Text style={[styles.bullet, { color: COLORS.secondary }]}>•</Text>
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── 2. Why We Collect ── */}
        <Text style={styles.sectionTitle}>2. Why We Collect</Text>

        <View style={styles.table}>
          {/* Table header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.tableCellHeader]}>Data Type</Text>
            <Text style={[styles.tableCell, styles.tableCellHeader]}>Purpose</Text>
          </View>
          {WHY_WE_COLLECT.map((row, i) => (
            <View
              key={row.type}
              style={[styles.tableRow, i % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}
            >
              <Text style={styles.tableCell}>{row.type}</Text>
              <Text style={styles.tableCell}>{row.purpose}</Text>
            </View>
          ))}
        </View>

        {/* ── 3. Your Rights (DPDPA) ── */}
        <Text style={styles.sectionTitle}>3. Your Rights (DPDPA)</Text>

        <View style={styles.rightsGrid}>
          {YOUR_RIGHTS.map((right) => (
            <View key={right.title} style={styles.rightCard}>
              <Text style={styles.rightIcon}>{right.icon}</Text>
              <Text style={styles.rightTitle}>{right.title}</Text>
              <Text style={styles.rightDesc}>{right.desc}</Text>
            </View>
          ))}
        </View>

        {/* ── 4. Data Sharing ── */}
        <Text style={styles.sectionTitle}>4. Data Sharing</Text>
        <Text style={styles.bodyText}>
          We do <Text style={styles.bold}>not</Text> sell your data. Data is only shared with:
        </Text>
        {[
          "School staff directly involved in your child's care",
          'Emergency services when required for safety',
          'Government authorities as mandated by law',
        ].map((item) => (
          <View key={item} style={styles.bulletRow}>
            <Text style={[styles.bullet, { color: COLORS.primary }]}>•</Text>
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        ))}

        {/* ── 5. Data Retention ── */}
        <Text style={styles.sectionTitle}>5. Data Retention</Text>
        <Text style={styles.bodyText}>
          Student records are retained for <Text style={styles.bold}>3 years</Text> after leaving
          the school, as required by educational regulations. You may request earlier deletion for
          non-mandatory data.
        </Text>

        {/* ── 6. Security Measures ── */}
        <Text style={styles.sectionTitle}>6. Security Measures</Text>
        <Text style={styles.bodyText}>
          We use industry-standard encryption, secure servers, and regular audits to protect your
          data. Access is restricted to authorized personnel only.
        </Text>

        {/* Contact box */}
        <View style={styles.contactBox}>
          <Text style={styles.contactText}>📧  privacy@dmapreschool.edu</Text>
          <Text style={styles.contactText}>📞  +91 98765 43210</Text>
          <Text style={styles.contactText}>🏫  DMA PreSchool, Electronic City, Bangalore</Text>
        </View>

        {/* Consent Checkbox */}
        <TouchableOpacity
          style={styles.consentRow}
          activeOpacity={0.7}
          onPress={() => setConsentChecked(!consentChecked)}
        >
          <View style={[styles.checkbox, consentChecked && styles.checkboxChecked]}>
            {consentChecked && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
          </View>
          <Text style={styles.consentText}>
            I hereby consent to the collection, processing, and storage of my personal data as outlined in this Privacy Notice.
          </Text>
        </TouchableOpacity>

        {/* Bottom padding for sticky buttons */}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Sticky bottom buttons - only show after scrolling to bottom */}
      {hasScrolledToBottom && (
        <View style={styles.stickyBottom}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.85}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => consentChecked && router.push('/account-pending')}
              disabled={!consentChecked}
              style={styles.nextButtonWrapper}
            >
              <LinearGradient
                colors={consentChecked ? [COLORS.primary, COLORS.primaryLight] : [COLORS.buttonDisabled, COLORS.buttonDisabled]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextButton}
              >
                <Text style={[styles.nextButtonText, !consentChecked && styles.nextButtonTextDisabled]}>
                  Next Step
                </Text>
                <Ionicons name="arrow-forward" size={18} color={consentChecked ? COLORS.white : COLORS.gray} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  closeBtn: {
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
  closeIcon: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerSpacer: {
    width: 36,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 16,
  },

  // Last updated
  updatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  updatedText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flexShrink: 0,
  },
  updatedLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.lightGray,
  },

  // Intro
  introText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },

  // Section titles
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 8,
  },

  // Info cards
  infoCard: {
    borderRadius: 20,
    padding: 18,
    gap: 10,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  infoIconEmoji: {
    fontSize: 20,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 16,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },

  // Table
  table: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: COLORS.primarySoft,
  },
  tableRowEven: {
    backgroundColor: COLORS.white,
  },
  tableRowOdd: {
    backgroundColor: COLORS.offWhite,
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    lineHeight: 19,
  },
  tableCellHeader: {
    fontWeight: '700',
    color: COLORS.primary,
    fontSize: 13,
  },

  // Rights grid
  rightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  rightCard: {
    width: '47%',
    backgroundColor: COLORS.primarySoft,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  rightIcon: {
    fontSize: 22,
  },
  rightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  rightDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  // Body text
  bodyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // Contact box
  contactBox: {
    backgroundColor: COLORS.secondarySoft,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  contactText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // Consent checkbox
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  consentText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // Sticky bottom
  stickyBottom: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 50,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  nextButtonWrapper: {
    flex: 1,
    borderRadius: 50,
    overflow: 'hidden',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 50,
    paddingVertical: 18,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  nextButtonTextDisabled: {
    color: COLORS.gray,
  },
});
