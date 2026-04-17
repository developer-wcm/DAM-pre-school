import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.7}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Notice</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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

        {/* Student Information card */}
        <View style={[styles.infoCard, { backgroundColor: '#E8F4FB' }]}>
          <View style={styles.infoCardHeader}>
            <Text style={styles.infoIconEmoji}>🧒</Text>
            <Text style={[styles.infoCardTitle, { color: '#1A7FA0' }]}>Student Information</Text>
          </View>
          {[
            'Full Name & Date of Birth',
            'Medical & Allergy Records',
            'Last 4 digits of Aadhaar (ID verification)',
            'Performance & Attendance Logs',
          ].map((item) => (
            <View key={item} style={styles.bulletRow}>
              <Text style={[styles.bullet, { color: '#1A7FA0' }]}>•</Text>
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Parent / Guardian Information card */}
        <View style={[styles.infoCard, { backgroundColor: '#EDE8F8' }]}>
          <View style={styles.infoCardHeader}>
            <Text style={styles.infoIconEmoji}>👨‍👩‍👧</Text>
            <Text style={[styles.infoCardTitle, { color: '#7B6FE8' }]}>
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
              <Text style={[styles.bullet, { color: '#7B6FE8' }]}>•</Text>
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>

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
            <Text style={[styles.bullet, { color: '#7B6FE8' }]}>•</Text>
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

        {/* ── 7. Contact Us ── */}
        <Text style={styles.sectionTitle}>7. Contact Us</Text>
        <View style={styles.contactBox}>
          <Text style={styles.contactText}>📧  privacy@dmapreschool.edu</Text>
          <Text style={styles.contactText}>📞  +91 98765 43210</Text>
          <Text style={styles.contactText}>🏫  DMA PreSchool, Chennai, Tamil Nadu</Text>
        </View>

        {/* Bottom padding for sticky button */}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Sticky bottom button */}
      <View style={styles.stickyBottom}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.back()}>
          <LinearGradient
            colors={['#7B6FE8', '#3ABFBF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.understandButton}
          >
            <Text style={styles.understandText}>I Understand  ✓</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  closeBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 18,
    color: '#1A1A2E',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
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
    color: '#9A9AB0',
    flexShrink: 0,
  },
  updatedLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0DFF0',
  },

  // Intro
  introText: {
    fontSize: 14,
    color: '#4A4A6A',
    lineHeight: 22,
  },

  // Section titles
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A2E',
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
    color: '#4A4A6A',
    lineHeight: 22,
  },

  // Table
  table: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E6F0',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#F0EEF8',
  },
  tableRowEven: {
    backgroundColor: '#FAFAFA',
  },
  tableRowOdd: {
    backgroundColor: '#F5F4FC',
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    color: '#4A4A6A',
    paddingVertical: 12,
    paddingHorizontal: 14,
    lineHeight: 19,
  },
  tableCellHeader: {
    fontWeight: '700',
    color: '#1A1A2E',
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
    backgroundColor: '#F5F3FF',
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
    color: '#1A1A2E',
  },
  rightDesc: {
    fontSize: 12,
    color: '#7A7A9D',
    lineHeight: 18,
  },

  // Body text
  bodyText: {
    fontSize: 14,
    color: '#4A4A6A',
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
    color: '#1A1A2E',
  },

  // Contact box
  contactBox: {
    backgroundColor: '#F0EEF8',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  contactText: {
    fontSize: 13,
    color: '#4A4A6A',
    lineHeight: 20,
  },

  // Sticky bottom
  stickyBottom: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  understandButton: {
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  understandText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
