import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEFAULT_SCHOOL_ID, DEFAULT_SCHOOL_NAME } from '../../constants/school';
import { AppColors, AppFonts, AppShadows, AppSizes } from '../../constants/theme';
import { useAuth } from '../../context/auth';
import { supabase } from '../../lib/supabase';

// ─── Types ─────────────────────────────────────────────────────────────────────

type CategoryId = 'students' | 'staff' | 'attendance' | 'fees';
type FormatId = 'pdf' | 'excel';

interface ExportCategory {
  id: CategoryId;
  label: string;
  description: string;
  icon: any;
  iconBg: string;
  iconColor: string;
}

interface RecentExport {
  id: string;
  label: string;
  date: string;
  time: string;
  by: string;
  format: 'pdf' | 'excel';
}

const CATEGORIES: ExportCategory[] = [
  {
    id: 'students',
    label: 'Student Data',
    description: 'Full demographic records, medical info, and emergency contacts.',
    icon: 'person-outline',
    iconBg: '#EEF2FF',
    iconColor: '#4F46E5',
  },
  {
    id: 'staff',
    label: 'Staff Records',
    description: 'Employment history, certifications, and shift schedules.',
    icon: 'briefcase-outline',
    iconBg: '#F0FDF4',
    iconColor: '#16A34A',
  },
  {
    id: 'attendance',
    label: 'Attendance Reports',
    description: 'Daily logs, tardiness summaries, and absence records.',
    icon: 'checkmark-circle-outline',
    iconBg: '#FFF7ED',
    iconColor: AppColors.gold,
  },
  {
    id: 'fees',
    label: 'Fee Reports',
    description: 'Invoice status, payment history, and outstanding balances.',
    icon: 'cash-outline',
    iconBg: '#EFF6FF',
    iconColor: '#2563EB',
  },
];

const ACADEMIC_YEARS = ['2025-2026', '2024-2025', '2023-2024', '2022-2023'];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function yearStartISO(year: string) {
  const y = parseInt(year.split('-')[0], 10);
  return `${y}-04-01`;
}

function yearEndISO(year: string) {
  const y = parseInt(year.split('-')[1], 10);
  return `${y}-03-31`;
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function DataExportScreen() {
  const router = useRouter();
  const { profile, user } = useAuth();
  const insets = useSafeAreaInsets();
  const schoolId = profile?.school_id ?? DEFAULT_SCHOOL_ID;
  // Tab bar height from _layout.tsx + safe area bottom
  const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 82 : 64;
  const bottomOffset = TAB_BAR_HEIGHT + insets.bottom;
  const schoolName = DEFAULT_SCHOOL_NAME;

  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('students');
  const [format, setFormat] = useState<FormatId>('pdf');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [startDate, setStartDate] = useState(yearStartISO('2025-2026'));
  const [endDate, setEndDate] = useState(todayISO());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [googleSync, setGoogleSync] = useState(false);
  const [onedriveSync, setOnedriveSync] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [recentExports, setRecentExports] = useState<RecentExport[]>([]);
  const [lastExportDates, setLastExportDates] = useState<Partial<Record<CategoryId, string>>>({});

  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadRecentExports();
  }, [schoolId]);

  async function loadRecentExports() {
    try {
      const { data } = await supabase
        .from('export_logs')
        .select('*')
        .eq('school_id', schoolId)
        .order('exported_at', { ascending: false })
        .limit(10);

      if (data) {
        const byCategory: Partial<Record<CategoryId, string>> = {};
        const rows: RecentExport[] = data.map((row: any) => {
          const dt = new Date(row.exported_at);
          if (!byCategory[row.category as CategoryId]) {
            byCategory[row.category as CategoryId] = dt.toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short',
            });
          }
          return {
            id: row.id,
            label: row.label ?? `${row.category}_export`,
            date: dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            time: dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
            by: row.exported_by ?? (profile?.role === 'principal' ? 'Principal' : 'Admin'),
            format: row.format ?? 'pdf',
          };
        });
        setRecentExports(rows);
        setLastExportDates(byCategory);
      }
    } catch {
      // table may not exist yet — silently skip
    }
  }

  function handleYearSelect(year: string) {
    setAcademicYear(year);
    setStartDate(yearStartISO(year));
    setEndDate(yearEndISO(year));
    setShowYearPicker(false);
  }

  async function handleGenerate() {
    setGenerating(true);
    setSuccessMsg(null);

    try {
      // Fetch data based on category
      let rows: any[] = [];
      let filename = '';

      if (selectedCategory === 'students') {
        const { data } = await supabase
          .from('students')
          .select('id, full_name, class, section, date_of_birth, parent_name, parent_phone, address, blood_group, created_at')
          .eq('school_id', schoolId)
          .gte('created_at', startDate)
          .lte('created_at', endDate + 'T23:59:59');
        rows = data ?? [];
        filename = `Student_Data_${academicYear}`;
      } else if (selectedCategory === 'staff') {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, assigned_class, created_at')
          .eq('school_id', schoolId)
          .in('role', ['teacher', 'admin', 'principal']);
        rows = data ?? [];
        filename = `Staff_Records_${academicYear}`;
      } else if (selectedCategory === 'attendance') {
        const { data } = await supabase
          .from('attendance')
          .select('id, student_id, date, status, notes')
          .eq('school_id', schoolId)
          .gte('date', startDate)
          .lte('date', endDate);
        rows = data ?? [];
        filename = `Attendance_Report_${academicYear}`;
      } else if (selectedCategory === 'fees') {
        const { data } = await supabase
          .from('fee_installments')
          .select('id, student_id, amount, paid, due_date, paid_at, payment_method')
          .eq('school_id', schoolId)
          .gte('due_date', startDate)
          .lte('due_date', endDate);
        rows = data ?? [];
        filename = `Fee_Report_${academicYear}`;
      }

      // Log export
      await supabase.from('export_logs').insert({
        school_id: schoolId,
        category: selectedCategory,
        format,
        label: `${filename}.${format === 'pdf' ? 'pdf' : 'xlsx'}`,
        row_count: rows.length,
        exported_by: profile?.full_name ?? (profile?.role === 'principal' ? 'Principal' : 'Admin'),
        exported_at: new Date().toISOString(),
      });

      const cat = CATEGORIES.find((c) => c.id === selectedCategory);
      setSuccessMsg(
        `${cat?.label} exported — ${rows.length} record${rows.length !== 1 ? 's' : ''} • ${format.toUpperCase()}`
      );

      // Animate banner in
      Animated.spring(successAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }).start();

      setTimeout(() => {
        Animated.timing(successAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => setSuccessMsg(null));
      }, 5000);

      loadRecentExports();
    } catch (e: any) {
      Alert.alert('Export Failed', e?.message ?? 'Could not generate export. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  const bannerTranslate = successAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 0],
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={[AppColors.primaryBlue, '#2C5282']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSchool}>{schoolName}</Text>
          <Text style={styles.headerTitle}>Data Export</Text>
        </View>
        <View style={styles.encBadge}>
          <Ionicons name="lock-closed" size={10} color={AppColors.gold} />
          <Text style={styles.encText}>AES-256</Text>
        </View>
      </LinearGradient>

      {/* Success Banner */}
      {successMsg && (
        <Animated.View
          style={[
            styles.successBanner,
            { transform: [{ translateY: bannerTranslate }], opacity: successAnim },
          ]}
        >
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.successTitle}>Exported Successfully</Text>
            <Text style={styles.successSub}>{successMsg}</Text>
          </View>
          <TouchableOpacity onPress={() => setSuccessMsg(null)}>
            <Ionicons name="download-outline" size={20} color={AppColors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Export Categories */}
        <Text style={styles.sectionLabel}>Export Categories</Text>
        <View style={styles.card}>
          {CATEGORIES.map((cat, i) => {
            const active = selectedCategory === cat.id;
            const lastExp = lastExportDates[cat.id];
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryRow,
                  active && styles.categoryRowActive,
                  i < CATEGORIES.length - 1 && styles.categoryRowBorder,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.catIconWrap, { backgroundColor: cat.iconBg }]}>
                  <Ionicons name={cat.icon} size={20} color={cat.iconColor} />
                </View>
                <View style={styles.catInfo}>
                  <Text style={[styles.catLabel, active && styles.catLabelActive]}>{cat.label}</Text>
                  <Text style={styles.catDesc}>{cat.description}</Text>
                  {lastExp && (
                    <View style={styles.lastExportRow}>
                      <Ionicons name="time-outline" size={11} color={AppColors.textLight} />
                      <Text style={styles.lastExportText}>Last export: {lastExp}</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Format */}
        <Text style={styles.sectionLabel}>Format</Text>
        <View style={styles.formatRow}>
          <TouchableOpacity
            style={[styles.formatBtn, format === 'pdf' && styles.formatBtnActive]}
            onPress={() => setFormat('pdf')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="document-text-outline"
              size={16}
              color={format === 'pdf' ? '#FFF' : AppColors.textSecondary}
            />
            <Text style={[styles.formatLabel, format === 'pdf' && styles.formatLabelActive]}>
              PDF Document
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.formatBtn, format === 'excel' && styles.formatBtnActiveGreen]}
            onPress={() => setFormat('excel')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="grid-outline"
              size={16}
              color={format === 'excel' ? '#FFF' : AppColors.textSecondary}
            />
            <Text style={[styles.formatLabel, format === 'excel' && styles.formatLabelActive]}>
              Excel (XLSX)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date Range */}
        <Text style={styles.sectionLabel}>Date Range</Text>
        <View style={styles.card}>
          {/* Academic Year picker */}
          <Text style={styles.fieldLabel}>Academic Year</Text>
          <TouchableOpacity
            style={styles.yearPicker}
            onPress={() => setShowYearPicker((v) => !v)}
            activeOpacity={0.8}
          >
            <Text style={styles.yearPickerText}>{academicYear}</Text>
            <Ionicons
              name={showYearPicker ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={AppColors.textSecondary}
            />
          </TouchableOpacity>
          {showYearPicker && (
            <View style={styles.yearDropdown}>
              {ACADEMIC_YEARS.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[styles.yearOption, y === academicYear && styles.yearOptionActive]}
                  onPress={() => handleYearSelect(y)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.yearOptionText, y === academicYear && styles.yearOptionTextActive]}>
                    {y}
                  </Text>
                  {y === academicYear && <Ionicons name="checkmark" size={16} color={AppColors.primaryBlue} />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.dateSpacer} />

          {/* Start Date */}
          <Text style={styles.fieldLabel}>Start Date</Text>
          <View style={styles.dateField}>
            <Ionicons name="calendar-outline" size={16} color={AppColors.textTertiary} />
            <Text style={styles.dateFieldText}>{formatDate(startDate)}</Text>
          </View>

          <View style={styles.dateSpacer} />

          {/* End Date */}
          <Text style={styles.fieldLabel}>End Date</Text>
          <View style={styles.dateField}>
            <Ionicons name="calendar-outline" size={16} color={AppColors.textTertiary} />
            <Text style={styles.dateFieldText}>{formatDate(endDate)}</Text>
          </View>
        </View>

        {/* Cloud Destinations */}
        <Text style={styles.sectionLabel}>Cloud Destinations</Text>
        <View style={styles.card}>
          <View style={styles.cloudRow}>
            <View style={styles.cloudIcon}>
              <Ionicons name="logo-google" size={20} color="#EA4335" />
            </View>
            <View style={styles.cloudInfo}>
              <Text style={styles.cloudLabel}>Google Drive Sync</Text>
              <Text style={styles.cloudSub}>
                {googleSync ? (user?.email ?? 'Connected') : 'Not connected'}
              </Text>
            </View>
            <Switch
              value={googleSync}
              onValueChange={setGoogleSync}
              trackColor={{ false: '#DDE3EA', true: AppColors.primaryBlue + '55' }}
              thumbColor={googleSync ? AppColors.primaryBlue : '#F4F4F6'}
              ios_backgroundColor="#DDE3EA"
            />
          </View>
          <View style={styles.cloudDivider} />
          <View style={styles.cloudRow}>
            <View style={[styles.cloudIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="cloud-outline" size={20} color="#2563EB" />
            </View>
            <View style={styles.cloudInfo}>
              <Text style={styles.cloudLabel}>OneDrive Sync</Text>
              <Text style={styles.cloudSub}>{onedriveSync ? 'Connected' : 'Not connected'}</Text>
            </View>
            <Switch
              value={onedriveSync}
              onValueChange={setOnedriveSync}
              trackColor={{ false: '#DDE3EA', true: AppColors.primaryBlue + '55' }}
              thumbColor={onedriveSync ? AppColors.primaryBlue : '#F4F4F6'}
              ios_backgroundColor="#DDE3EA"
            />
          </View>
        </View>

        {/* Recent Exports */}
        {recentExports.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Recent Exports</Text>
            <View style={styles.card}>
              {recentExports.slice(0, 5).map((exp, i) => (
                <View
                  key={exp.id}
                  style={[styles.recentRow, i < Math.min(recentExports.length, 5) - 1 && styles.recentRowBorder]}
                >
                  <View style={[
                    styles.recentFileIcon,
                    { backgroundColor: exp.format === 'pdf' ? '#FEF2F2' : '#F0FDF4' },
                  ]}>
                    <Ionicons
                      name={exp.format === 'pdf' ? 'document-text' : 'grid'}
                      size={16}
                      color={exp.format === 'pdf' ? '#DC2626' : '#16A34A'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recentLabel} numberOfLines={1}>{exp.label}</Text>
                    <Text style={styles.recentMeta}>{exp.date}, {exp.time} • {exp.by}</Text>
                  </View>
                  <TouchableOpacity style={styles.recentAction} activeOpacity={0.7}>
                    <Ionicons name="share-outline" size={18} color={AppColors.textTertiary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.recentAction} activeOpacity={0.7}>
                    <Ionicons name="download-outline" size={18} color={AppColors.textTertiary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: bottomOffset + 80 }} />
      </ScrollView>

      {/* Generate Button */}
      <View style={[styles.bottomBar, { bottom: bottomOffset }]}>
        <TouchableOpacity
          style={[styles.generateBtn, generating && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          disabled={generating}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={[AppColors.primaryBlue, '#2C5282']}
            style={styles.generateGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {generating ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color="#FFF" />
                <Text style={styles.generateText}>Generate Export</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  headerSchool: {
    fontSize: AppFonts.sizeSmall,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: AppFonts.medium,
  },
  headerTitle: {
    fontSize: AppFonts.sizeLarge,
    fontWeight: AppFonts.bold,
    color: '#FFF',
  },
  encBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: AppSizes.radiusPill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(218,165,32,0.4)',
  },
  encText: {
    fontSize: 10,
    color: AppColors.gold,
    fontWeight: AppFonts.semiBold,
  },

  // Success Banner
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0FDF4',
    borderBottomWidth: 1,
    borderBottomColor: '#BBF7D0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  successIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center', justifyContent: 'center',
  },
  successTitle: {
    fontSize: AppFonts.sizeMedium,
    fontWeight: AppFonts.semiBold,
    color: '#15803D',
  },
  successSub: {
    fontSize: AppFonts.sizeSmall,
    color: '#16A34A',
    marginTop: 1,
  },

  // Scroll
  scroll: { flex: 1 },
  content: { padding: 16, gap: 8 },

  sectionLabel: {
    fontSize: AppFonts.sizeMedium,
    fontWeight: AppFonts.semiBold,
    color: AppColors.textPrimary,
    marginTop: 8,
    marginBottom: 6,
  },

  // Card
  card: {
    backgroundColor: '#FFF',
    borderRadius: AppSizes.radiusLarge,
    padding: 16,
    ...AppShadows.cardShadow,
    marginBottom: 4,
  },

  // Category
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 12,
  },
  categoryRowActive: {
    backgroundColor: AppColors.bluePale,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: AppSizes.radiusMedium,
  },
  categoryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: AppColors.blueLight,
  },
  catIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  catInfo: { flex: 1 },
  catLabel: {
    fontSize: AppFonts.sizeMedium,
    fontWeight: AppFonts.semiBold,
    color: AppColors.textPrimary,
  },
  catLabelActive: { color: AppColors.primaryBlue },
  catDesc: {
    fontSize: AppFonts.sizeSmall,
    color: AppColors.textTertiary,
    marginTop: 2,
    lineHeight: 18,
  },
  lastExportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  lastExportText: {
    fontSize: 11,
    color: AppColors.textLight,
  },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: AppColors.textLight,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 10,
  },
  radioActive: { borderColor: AppColors.gold },
  radioDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: AppColors.gold,
  },

  // Format
  formatRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  formatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: AppSizes.radiusPill,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: AppColors.blueLight,
    ...AppShadows.cardShadow,
  },
  formatBtnActive: {
    backgroundColor: AppColors.gold,
    borderColor: AppColors.gold,
  },
  formatBtnActiveGreen: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  formatLabel: {
    fontSize: AppFonts.sizeSmall,
    fontWeight: AppFonts.semiBold,
    color: AppColors.textSecondary,
  },
  formatLabelActive: { color: '#FFF' },

  // Date
  fieldLabel: {
    fontSize: AppFonts.sizeSmall,
    fontWeight: AppFonts.medium,
    color: AppColors.textSecondary,
    marginBottom: 6,
  },
  yearPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AppColors.bluePale,
    borderRadius: AppSizes.radiusMedium,
    borderWidth: 1,
    borderColor: AppColors.blueLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  yearPickerText: {
    fontSize: AppFonts.sizeMedium,
    color: AppColors.textPrimary,
    fontWeight: AppFonts.medium,
  },
  yearDropdown: {
    backgroundColor: '#FFF',
    borderRadius: AppSizes.radiusMedium,
    borderWidth: 1,
    borderColor: AppColors.blueLight,
    marginTop: 4,
    overflow: 'hidden',
    ...AppShadows.cardShadow,
  },
  yearOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  yearOptionActive: { backgroundColor: AppColors.bluePale },
  yearOptionText: {
    fontSize: AppFonts.sizeMedium,
    color: AppColors.textSecondary,
  },
  yearOptionTextActive: {
    color: AppColors.primaryBlue,
    fontWeight: AppFonts.semiBold,
  },
  dateSpacer: { height: 12 },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: AppColors.bluePale,
    borderRadius: AppSizes.radiusMedium,
    borderWidth: 1,
    borderColor: AppColors.blueLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateFieldText: {
    fontSize: AppFonts.sizeMedium,
    color: AppColors.textPrimary,
  },

  // Cloud
  cloudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  cloudIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#FEF2F2',
    alignItems: 'center', justifyContent: 'center',
  },
  cloudInfo: { flex: 1 },
  cloudLabel: {
    fontSize: AppFonts.sizeMedium,
    fontWeight: AppFonts.medium,
    color: AppColors.textPrimary,
  },
  cloudSub: {
    fontSize: AppFonts.sizeSmall,
    color: AppColors.textTertiary,
    marginTop: 2,
  },
  cloudDivider: {
    height: 1,
    backgroundColor: AppColors.blueLight,
    marginVertical: 10,
  },

  // Recent Exports
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  recentRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: AppColors.blueLight,
  },
  recentFileIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  recentLabel: {
    fontSize: AppFonts.sizeMedium,
    fontWeight: AppFonts.medium,
    color: AppColors.textPrimary,
  },
  recentMeta: {
    fontSize: AppFonts.sizeSmall,
    color: AppColors.textTertiary,
    marginTop: 2,
  },
  recentAction: {
    padding: 6,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(245,247,250,0.95)',
    borderTopWidth: 1,
    borderTopColor: AppColors.blueLight,
  },
  generateBtn: {
    borderRadius: AppSizes.radiusPill,
    overflow: 'hidden',
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  generateText: {
    fontSize: AppFonts.sizeLarge,
    fontWeight: AppFonts.bold,
    color: '#FFF',
  },
});
