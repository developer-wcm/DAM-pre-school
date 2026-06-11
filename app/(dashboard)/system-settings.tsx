import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEFAULT_SCHOOL_ID } from '../../constants/school';
import { AppColors, AppFonts, AppShadows, AppSizes } from '../../constants/theme';
import { useAuth } from '../../context/auth';
import { supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SchoolSettings {
  school_name: string;
  school_address: string;
  school_phone: string;
  school_email: string;
  academic_year: string;
  principal_name: string;
  fee_due_day: string;
  late_fee_amount: string;
  attendance_cutoff_time: string;
  staff_wifi_name: string;
  notify_absent_parents: boolean;
  notify_fee_overdue: boolean;
  notify_leave_requests: boolean;
  auto_approve_parents: boolean;
}

const DEFAULT_SETTINGS: SchoolSettings = {
  school_name: 'DAM PreSchool',
  school_address: '',
  school_phone: '',
  school_email: '',
  academic_year: '2025-2026',
  principal_name: '',
  fee_due_day: '10',
  late_fee_amount: '0',
  attendance_cutoff_time: '09:30',
  staff_wifi_name: '',
  notify_absent_parents: true,
  notify_fee_overdue: true,
  notify_leave_requests: true,
  auto_approve_parents: false,
};

const CLASSES = ['PG', 'PKG', 'JKG', 'SKG'];

// ─── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, color }: { icon: any; title: string; color: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIconWrap, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// ─── Field Row ─────────────────────────────────────────────────────────────────

function FieldRow({
  label,
  value,
  placeholder,
  onChangeText,
  keyboardType = 'default',
  icon,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  icon?: any;
}) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        {icon && <Ionicons name={icon} size={16} color={AppColors.textTertiary} style={styles.inputIcon} />}
        <TextInput
          style={[styles.input, icon ? styles.inputWithIcon : null]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={AppColors.textLight}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
}

// ─── Toggle Row ────────────────────────────────────────────────────────────────

function ToggleRow({
  label,
  sub,
  value,
  onToggle,
}: {
  label: string;
  sub: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#DDE3EA', true: AppColors.primaryBlue + '55' }}
        thumbColor={value ? AppColors.primaryBlue : '#F4F4F6'}
        ios_backgroundColor="#DDE3EA"
      />
    </View>
  );
}

// ─── Class Badge ───────────────────────────────────────────────────────────────

function ClassBadge({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const colorMap: Record<string, { bg: string; text: string; activeBg: string }> = {
    PG:  { bg: '#FDF6E3', text: '#9B7C1A', activeBg: '#DAA520' },
    PKG: { bg: '#FEE8E8', text: '#B94040', activeBg: '#E05A5A' },
    JKG: { bg: '#E8EDF3', text: '#1E3A5F', activeBg: '#1E3A5F' },
    SKG: { bg: '#D4F4E8', text: '#1B7A52', activeBg: '#2ECC71' },
  };
  const c = colorMap[label] ?? { bg: '#F0F4F8', text: '#5A6C7D', activeBg: '#1E3A5F' };
  return (
    <TouchableOpacity
      style={[styles.classBadge, { backgroundColor: active ? c.activeBg : c.bg }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.classBadgeText, { color: active ? '#FFFFFF' : c.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function SystemSettingsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const schoolId = profile?.school_id ?? DEFAULT_SCHOOL_ID;

  const [settings, setSettings] = useState<SchoolSettings>(DEFAULT_SETTINGS);
  const [activeClasses, setActiveClasses] = useState<string[]>(CLASSES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'school' | 'academic' | 'notifications'>('school');

  useEffect(() => {
    fetchSettings();
  }, [schoolId]);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('school_settings')
        .select('*')
        .eq('school_id', schoolId)
        .single();

      if (data) {
        setSettings({
          school_name: data.school_name ?? DEFAULT_SETTINGS.school_name,
          school_address: data.school_address ?? '',
          school_phone: data.school_phone ?? '',
          school_email: data.school_email ?? '',
          academic_year: data.academic_year ?? DEFAULT_SETTINGS.academic_year,
          principal_name: data.principal_name ?? '',
          fee_due_day: String(data.fee_due_day ?? '10'),
          late_fee_amount: String(data.late_fee_amount ?? '0'),
          attendance_cutoff_time: data.attendance_cutoff_time ?? '09:30',
          staff_wifi_name: data.staff_wifi_name ?? '',
          notify_absent_parents: data.notify_absent_parents ?? true,
          notify_fee_overdue: data.notify_fee_overdue ?? true,
          notify_leave_requests: data.notify_leave_requests ?? true,
          auto_approve_parents: data.auto_approve_parents ?? false,
        });
        if (Array.isArray(data.active_classes) && data.active_classes.length > 0) {
          setActiveClasses(data.active_classes);
        }
      }
    } catch (e) {
      // No existing settings row — use defaults
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  async function handleSave() {
    if (!settings.school_name.trim()) {
      Alert.alert('Validation', 'School name cannot be empty.');
      return;
    }
    const dueDayNum = parseInt(settings.fee_due_day, 10);
    if (isNaN(dueDayNum) || dueDayNum < 1 || dueDayNum > 28) {
      Alert.alert('Validation', 'Fee due day must be between 1 and 28.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        school_id: schoolId,
        school_name: settings.school_name.trim(),
        school_address: settings.school_address.trim(),
        school_phone: settings.school_phone.trim(),
        school_email: settings.school_email.trim(),
        academic_year: settings.academic_year.trim(),
        principal_name: settings.principal_name.trim(),
        fee_due_day: dueDayNum,
        late_fee_amount: parseFloat(settings.late_fee_amount) || 0,
        attendance_cutoff_time: settings.attendance_cutoff_time.trim(),
        staff_wifi_name: settings.staff_wifi_name.trim(),
        notify_absent_parents: settings.notify_absent_parents,
        notify_fee_overdue: settings.notify_fee_overdue,
        notify_leave_requests: settings.notify_leave_requests,
        auto_approve_parents: settings.auto_approve_parents,
        active_classes: activeClasses,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('school_settings')
        .upsert(payload, { onConflict: 'school_id' });

      if (error) throw error;
      Alert.alert('Saved', 'Settings updated successfully.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  }

  function toggleClass(cls: string) {
    setActiveClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    );
  }

  function set(key: keyof SchoolSettings) {
    return (v: string | boolean) =>
      setSettings((prev) => ({ ...prev, [key]: v }));
  }

  const TABS = [
    { id: 'school' as const,        label: 'School',        icon: 'school-outline' as const },
    { id: 'academic' as const,      label: 'Academic',      icon: 'book-outline' as const },
    { id: 'notifications' as const, label: 'Alerts',        icon: 'notifications-outline' as const },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={[AppColors.primaryBlue, '#2C5282']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>System Settings</Text>
          <Text style={styles.headerSub}>School Configuration</Text>
        </View>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={tab.icon}
              size={16}
              color={activeTab === tab.id ? AppColors.primaryBlue : AppColors.textTertiary}
            />
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={AppColors.primaryBlue} />
          <Text style={styles.loadingText}>Loading settings…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── SCHOOL TAB ── */}
          {activeTab === 'school' && (
            <>
              <View style={styles.card}>
                <SectionHeader icon="business-outline" title="School Information" color={AppColors.primaryBlue} />
                <FieldRow
                  label="School Name"
                  value={settings.school_name}
                  placeholder="Enter school name"
                  onChangeText={set('school_name')}
                  icon="school-outline"
                />
                <FieldRow
                  label="Principal Name"
                  value={settings.principal_name}
                  placeholder="Enter principal name"
                  onChangeText={set('principal_name')}
                  icon="person-outline"
                />
                <FieldRow
                  label="Address"
                  value={settings.school_address}
                  placeholder="School address"
                  onChangeText={set('school_address')}
                  icon="location-outline"
                />
                <FieldRow
                  label="Phone"
                  value={settings.school_phone}
                  placeholder="+91 XXXXX XXXXX"
                  onChangeText={set('school_phone')}
                  keyboardType="phone-pad"
                  icon="call-outline"
                />
                <FieldRow
                  label="Email"
                  value={settings.school_email}
                  placeholder="school@example.com"
                  onChangeText={set('school_email')}
                  keyboardType="email-address"
                  icon="mail-outline"
                />
              </View>

              <View style={styles.card}>
                <SectionHeader icon="grid-outline" title="Active Classes" color="#7B6FE8" />
                <Text style={styles.classHint}>Tap to enable or disable a class for this school year.</Text>
                <View style={styles.classRow}>
                  {CLASSES.map((cls) => (
                    <ClassBadge
                      key={cls}
                      label={cls}
                      active={activeClasses.includes(cls)}
                      onPress={() => toggleClass(cls)}
                    />
                  ))}
                </View>
              </View>
            </>
          )}

          {/* ── ACADEMIC TAB ── */}
          {activeTab === 'academic' && (
            <>
              <View style={styles.card}>
                <SectionHeader icon="calendar-outline" title="Academic Year" color="#2A9D6E" />
                <FieldRow
                  label="Academic Year"
                  value={settings.academic_year}
                  placeholder="e.g. 2025-2026"
                  onChangeText={set('academic_year')}
                  icon="calendar-outline"
                />
                <FieldRow
                  label="Attendance Cutoff"
                  value={settings.attendance_cutoff_time}
                  placeholder="HH:MM  e.g. 09:30"
                  onChangeText={set('attendance_cutoff_time')}
                  icon="time-outline"
                />
              </View>

              <View style={styles.card}>
                <SectionHeader icon="wifi-outline" title="Staff Auto Check-In" color="#2A9D6E" />
                <FieldRow
                  label="School WiFi Name"
                  value={settings.staff_wifi_name}
                  placeholder="Exact WiFi network name"
                  onChangeText={set('staff_wifi_name')}
                  icon="wifi-outline"
                />
                <View style={[styles.infoCard, { marginTop: 4, padding: 12, borderRadius: 12, marginHorizontal: 14, marginBottom: 14 }]}>
                  <Ionicons name="information-circle-outline" size={18} color={AppColors.primaryBlue} />
                  <Text style={styles.infoText}>
                    When a teacher&apos;s phone is connected to this WiFi network, they are automatically
                    marked present. Arriving after the attendance cutoff marks them late. Leave blank to disable.
                  </Text>
                </View>
              </View>

              <View style={styles.card}>
                <SectionHeader icon="cash-outline" title="Fee Configuration" color={AppColors.gold} />
                <FieldRow
                  label="Fee Due Day"
                  value={settings.fee_due_day}
                  placeholder="Day of month (1–28)"
                  onChangeText={set('fee_due_day')}
                  keyboardType="numeric"
                  icon="calendar-number-outline"
                />
                <FieldRow
                  label="Late Fee Amount (₹)"
                  value={settings.late_fee_amount}
                  placeholder="0"
                  onChangeText={set('late_fee_amount')}
                  keyboardType="numeric"
                  icon="wallet-outline"
                />
              </View>

              <View style={[styles.card, styles.infoCard]}>
                <Ionicons name="information-circle-outline" size={18} color={AppColors.primaryBlue} />
                <Text style={styles.infoText}>
                  Fee due day applies to all classes. The late fee is added automatically after the due date each month.
                </Text>
              </View>
            </>
          )}

          {/* ── NOTIFICATIONS TAB ── */}
          {activeTab === 'notifications' && (
            <>
              <View style={styles.card}>
                <SectionHeader icon="notifications-outline" title="Push Notifications" color="#F39C12" />
                <ToggleRow
                  label="Absent Parent Alerts"
                  sub="Notify parents when child is marked absent"
                  value={settings.notify_absent_parents}
                  onToggle={set('notify_absent_parents') as (v: boolean) => void}
                />
                <View style={styles.divider} />
                <ToggleRow
                  label="Fee Overdue Alerts"
                  sub="Remind parents of pending or overdue fees"
                  value={settings.notify_fee_overdue}
                  onToggle={set('notify_fee_overdue') as (v: boolean) => void}
                />
                <View style={styles.divider} />
                <ToggleRow
                  label="Leave Request Alerts"
                  sub="Notify admin of new staff leave requests"
                  value={settings.notify_leave_requests}
                  onToggle={set('notify_leave_requests') as (v: boolean) => void}
                />
              </View>

              <View style={styles.card}>
                <SectionHeader icon="shield-checkmark-outline" title="Access Control" color="#3498DB" />
                <ToggleRow
                  label="Auto-Approve Parents"
                  sub="New parent accounts are approved without review"
                  value={settings.auto_approve_parents}
                  onToggle={set('auto_approve_parents') as (v: boolean) => void}
                />
                {settings.auto_approve_parents && (
                  <View style={styles.warningBanner}>
                    <Ionicons name="warning-outline" size={16} color="#B45309" />
                    <Text style={styles.warningText}>
                      Any registered parent will immediately access student data — use with caution.
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}

          <View style={styles.bottomSpace} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: AppColors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  headerTitle: {
    fontSize: AppFonts.sizeLarge,
    fontWeight: AppFonts.bold,
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: AppFonts.sizeSmall,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  saveBtn: {
    backgroundColor: AppColors.gold,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: AppSizes.radiusPill,
    minWidth: 60,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: AppFonts.bold,
    fontSize: AppFonts.sizeMedium,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: AppColors.blueLight,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: AppColors.primaryBlue,
  },
  tabLabel: {
    fontSize: AppFonts.sizeSmall,
    fontWeight: AppFonts.medium,
    color: AppColors.textTertiary,
  },
  tabLabelActive: {
    color: AppColors.primaryBlue,
    fontWeight: AppFonts.semiBold,
  },

  // Loading
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: AppFonts.sizeMedium,
    color: AppColors.textSecondary,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    gap: 14,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: AppSizes.radiusLarge,
    padding: 16,
    gap: 4,
    ...AppShadows.cardShadow,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: AppFonts.sizeMedium,
    fontWeight: AppFonts.semiBold,
    color: AppColors.textPrimary,
  },

  // Field
  fieldRow: { marginBottom: 10 },
  fieldLabel: {
    fontSize: AppFonts.sizeSmall,
    fontWeight: AppFonts.medium,
    color: AppColors.textSecondary,
    marginBottom: 5,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.bluePale,
    borderRadius: AppSizes.radiusMedium,
    borderWidth: 1,
    borderColor: AppColors.blueLight,
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    height: 44,
    fontSize: AppFonts.sizeMedium,
    color: AppColors.textPrimary,
  },
  inputWithIcon: { paddingLeft: 0 },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleText: { flex: 1, paddingRight: 12 },
  toggleLabel: {
    fontSize: AppFonts.sizeMedium,
    fontWeight: AppFonts.medium,
    color: AppColors.textPrimary,
  },
  toggleSub: {
    fontSize: AppFonts.sizeSmall,
    color: AppColors.textTertiary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.blueLight,
    marginVertical: 2,
  },

  // Classes
  classHint: {
    fontSize: AppFonts.sizeSmall,
    color: AppColors.textTertiary,
    marginBottom: 10,
  },
  classRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  classBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: AppSizes.radiusPill,
  },
  classBadgeText: {
    fontSize: AppFonts.sizeMedium,
    fontWeight: AppFonts.bold,
  },

  // Info / Warning
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: AppColors.bluePale,
    borderWidth: 1,
    borderColor: AppColors.blueLight,
  },
  infoText: {
    flex: 1,
    fontSize: AppFonts.sizeSmall,
    color: AppColors.textSecondary,
    lineHeight: 18,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: AppSizes.radiusMedium,
    padding: 10,
    marginTop: 8,
  },
  warningText: {
    flex: 1,
    fontSize: AppFonts.sizeSmall,
    color: '#92400E',
    lineHeight: 18,
  },

  bottomSpace: { height: 40 },
});
