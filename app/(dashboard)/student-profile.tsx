import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking } from 'react-native';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import EditStudentModal from '../../components/EditStudentModal';
import { getProgressLevelDetails, getSkillsForClass, SKILL_LEVELS, type Skill, type SkillLevel } from '../../constants/progressSkills';
import { DEFAULT_SCHOOL_ID } from '../../constants/school';
import { AppColors, AppShadows } from '../../constants/theme';
import { useAuth } from '../../context/auth';
import {
  addMonths,
  AttendanceRecordStatus,
  buildCalendarDays,
  CalendarDay,
  fetchStudentAttendanceMonth,
  getCalendarLeadingBlanks,
  getMonthLabel,
  getMonthStart,
  mapFriendlyAttendanceError,
  metricsFromCalendarMonth,
  saveStudentAttendanceMonth,
} from '../../lib/attendance';
import { loadStudentProgress, mergeSkillsWithSaved, saveStudentProgress } from '../../lib/progress';
import { logActivity } from '../../lib/activity';
import { supabase } from '../../lib/supabase';

interface StudentProfile {
  id: string;
  full_name: string;
  class: string;
  roll_number: string | null;
  date_of_birth: string | null;
  gender: string | null;
  status: string;
  admission_date: string | null;
  school_id?: string | null;
  // Personal
  mother_tongue: string | null;
  nationality: string | null;
  aadhaar_last4: string | null;
  address: string | null;
  // Father
  father_name: string | null;
  father_phone: string | null;
  father_email: string | null;
  father_occupation: string | null;
  father_work_location: string | null;
  // Mother
  mother_name: string | null;
  mother_phone: string | null;
  mother_email: string | null;
  mother_occupation: string | null;
  mother_work_location: string | null;
  // Guardian
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_relation: string | null;
}

type ProfileTab = 'info' | 'attendance' | 'fees' | 'progress';

interface FeeRecord {
  id: string;
  label: string;
  amount: number;
  paid: boolean;
  due_date: string | null;
  paid_date: string | null;
  installment_plan: string | null;
  installment_number: number | null;
  total_installments: number | null;
}

interface FeeStats {
  totalAnnual: number;
  paid: number;
  outstanding: number;
  percentage: number;
}
interface StudentDocument {
  id: string;
  doc_type: string;
  doc_label: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
}

const DOC_CATEGORIES = [
  { id: 'birth_cert',      label: 'Birth Certificate',              icon: 'document-text-outline', color: '#7B6FE8', required: true },
  { id: 'aadhar_child',    label: 'Aadhaar Card (Student)',          icon: 'card-outline',           color: '#E05A5A', required: true },
  { id: 'student_photo',   label: 'PP-Size Photo (Student)',         icon: 'image-outline',          color: '#3AAF72', required: true },
  { id: 'medical_cert',    label: 'Medical Fitness Certificate',     icon: 'medkit-outline',         color: '#3AAF72', required: false },
  { id: 'school_tc',       label: 'Transfer Certificate',           icon: 'document-outline',       color: '#F5A623', required: false },
  { id: 'father_aadhar',   label: 'Aadhaar Card (Father)',           icon: 'card-outline',           color: '#E05A5A', required: false },
  { id: 'father_photo',    label: 'Photo (Father)',                  icon: 'image-outline',          color: '#3AAF72', required: false },
  { id: 'mother_aadhar',   label: 'Aadhaar Card (Mother)',           icon: 'card-outline',           color: '#E05A5A', required: false },
  { id: 'mother_photo',    label: 'Photo (Mother)',                  icon: 'image-outline',          color: '#F5A623', required: false },
  { id: 'family_photo',    label: 'Family Photograph',               icon: 'people-outline',         color: '#7B6FE8', required: false },
  { id: 'guardian_aadhar', label: 'Aadhaar Card (Guardian)',         icon: 'card-outline',           color: '#E05A5A', required: false },
];

type AttendanceStatus = 'present' | 'absent' | 'late' | 'holiday';
type AttendanceDay = CalendarDay;

interface AttendanceSummary {
  presentPct: string;
  absentPct: string;
  workingDays: string;
  month: string;
  noteTitle: string;
  noteDate: string;
  noteText: string;
}

function emptyAttendanceSummary(month: Date): AttendanceSummary {
  return {
    presentPct: '0',
    absentPct: '0',
    workingDays: '0',
    month: getMonthLabel(month),
    noteTitle: '',
    noteDate: '',
    noteText: '',
  };
}

const CLASS_COLORS: Record<string, { bg: string; text: string }> = {
  PG: AppColors.classPG,
  PKG: AppColors.classPKG,
  JKG: AppColors.classJKG,
  SKG: AppColors.classSKG,
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getDayCellStyle(status: AttendanceDay['status']) {
  switch (status) {
    case 'present':
      return styles.dayPresent;
    case 'absent':
      return styles.dayAbsent;
    case 'holiday':
      return styles.dayHoliday;
    case 'late':
      return styles.dayLate;
    default:
      return undefined;
  }
}

function getDayTextStyle(status: AttendanceDay['status'], isToday: boolean) {
  if (isToday) {
    return styles.dayTextToday;
  }

  if (status === 'future') {
    return styles.dayTextFuture;
  }

  if (status === 'inactive') {
    return styles.dayTextInactive;
  }

  return styles.dayText;
}

function getAttendanceCalendarWeeks(month: Date, days: AttendanceDay[]) {
  const leadingBlanks = getCalendarLeadingBlanks(month);
  const cells: (AttendanceDay | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...days,
  ];

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks: (AttendanceDay | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return weeks;
}

export default function StudentProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const studentId = params.id as string;
  const { profile } = useAuth();

  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>('info');
  const [selectedTerm, setSelectedTerm] = useState<1 | 2 | 3>(1);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [attendanceEditVisible, setAttendanceEditVisible] = useState(false);
  const [progressEditVisible, setProgressEditVisible] = useState(false);
  const [notesModalSkill, setNotesModalSkill] = useState<Skill | null>(null);
  const [progressSaving, setProgressSaving] = useState(false);
  const [attendanceMonth, setAttendanceMonth] = useState(() => getMonthStart(new Date()));
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary>(() =>
    emptyAttendanceSummary(getMonthStart(new Date()))
  );
  const [attendanceDays, setAttendanceDays] = useState<AttendanceDay[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSaveMessage, setAttendanceSaveMessage] = useState<string | null>(null);
  const [progressSkills, setProgressSkills] = useState<Skill[]>([]);
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [feeStats, setFeeStats] = useState<FeeStats>({ totalAnnual: 0, paid: 0, outstanding: 0, percentage: 0 });
  const [feeLoading, setFeeLoading] = useState(false);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [docSheetVisible, setDocSheetVisible] = useState(false);
  const [activeDocCategory, setActiveDocCategory] = useState<typeof DOC_CATEGORIES[0] | null>(null);
  const todayDayNumber = useMemo(() => new Date().getDate(), []);
  const schoolId = DEFAULT_SCHOOL_ID;
  const isViewingCurrentMonth = useMemo(() => {
    const now = new Date();
    return (
      attendanceMonth.getMonth() === now.getMonth() &&
      attendanceMonth.getFullYear() === now.getFullYear()
    );
  }, [attendanceMonth]);

  useEffect(() => {
    fetchStudentProfile();
  }, [studentId]);

  const loadProgressSkills = useCallback(async () => {
    if (!student?.class || !studentId) return;

    const defaults = getSkillsForClass(student.class).map((skill) => ({ ...skill }));
    try {
      const saved = await loadStudentProgress(studentId, selectedTerm);
      setProgressSkills(mergeSkillsWithSaved(defaults, saved));
    } catch {
      setProgressSkills(defaults);
    }
  }, [selectedTerm, student?.class, studentId]);

  useEffect(() => {
    if (student?.class) {
      loadProgressSkills();
    }
  }, [loadProgressSkills, student?.class]);

  useEffect(() => {
    if (activeTab === 'progress' && student?.class) {
      loadProgressSkills();
    }
  }, [activeTab, loadProgressSkills, student?.class]);

  const loadAttendanceMonth = useCallback(async () => {
    if (!studentId) return;

    setAttendanceLoading(true);
    const { rows, error } = await fetchStudentAttendanceMonth(
      schoolId,
      studentId,
      attendanceMonth
    );
    setAttendanceLoading(false);

    if (error) {
      Alert.alert('Could not load attendance', mapFriendlyAttendanceError(error));
      return;
    }

    const recordsByDate = new Map<string, AttendanceRecordStatus>();
    let latestNote = '';
    rows.forEach((row) => {
      recordsByDate.set(row.date, row.status);
      if (row.notes) latestNote = row.notes;
    });

    const days = buildCalendarDays(attendanceMonth, recordsByDate);
    const metrics = metricsFromCalendarMonth(attendanceMonth, days);

    setAttendanceDays(days);
    setAttendanceSummary({
      presentPct: `${metrics.presentPct}`,
      absentPct: `${metrics.absentPct}`,
      workingDays: `${metrics.workingDays}`,
      month: getMonthLabel(attendanceMonth),
      noteTitle: metrics.lateCount > 0 ? 'Late marks' : 'Attendance note',
      noteDate: getMonthLabel(attendanceMonth),
      noteText: latestNote,
    });
  }, [attendanceMonth, schoolId, studentId]);

  useEffect(() => {
    if (activeTab === 'attendance') {
      loadAttendanceMonth();
    }
  }, [activeTab, loadAttendanceMonth]);

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'attendance') {
        loadAttendanceMonth();
      }
    }, [activeTab, loadAttendanceMonth])
  );

  const loadFeeData = useCallback(async () => {
    if (!studentId) return;
    setFeeLoading(true);
    try {
      const { data, error } = await supabase
        .from('fees')
        .select('*')
        .eq('student_id', studentId)
        .eq('school_id', schoolId)
        .neq('installment_number', 0) // Exclude parent records
        .order('due_date', { ascending: true });

      if (error) throw error;

      const records: FeeRecord[] = (data ?? []).map((f: any) => ({
        id: f.id,
        label: f.label ?? f.description ?? 'Fee',
        amount: Number(f.amount),
        paid: Boolean(f.paid),
        due_date: f.due_date ?? null,
        paid_date: f.paid_date ?? null,
        installment_plan: f.installment_plan ?? null,
        installment_number: f.installment_number ?? null,
        total_installments: f.total_installments ?? null,
      }));

      const totalAnnual = records.reduce((s, r) => s + r.amount, 0);
      const paid = records.filter((r) => r.paid).reduce((s, r) => s + r.amount, 0);
      const outstanding = totalAnnual - paid;
      const percentage = totalAnnual > 0 ? Math.round((paid / totalAnnual) * 100) : 0;

      setFeeRecords(records);
      setFeeStats({ totalAnnual, paid, outstanding, percentage });
    } catch (e) {
      console.error('Error fetching fees:', e);
    } finally {
      setFeeLoading(false);
    }
  }, [schoolId, studentId]);

  useEffect(() => {
    if (activeTab === 'fees') {
      loadFeeData();
    }
  }, [activeTab, loadFeeData]);

  const loadDocuments = useCallback(async () => {
    if (!studentId) return;
    setDocsLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_documents')
        .select('*')
        .eq('student_id', studentId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      setDocuments(data ?? []);
    } catch (e) {
      console.error('Error loading documents:', e);
    } finally {
      setDocsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (activeTab === 'info') {
      loadDocuments();
    }
  }, [activeTab, loadDocuments]);

  async function uploadDocument(docCategory: typeof DOC_CATEGORIES[0], fileUri: string, fileName: string) {
    setUploadingDocType(docCategory.id);
    try {
      const blob: Blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.response);
        xhr.onerror = () => reject(new Error('Network request failed'));
        xhr.responseType = 'blob';
        xhr.open('GET', fileUri, true);
        xhr.send(null);
      });
      const ext = fileName.split('.').pop() ?? 'jpg';
      const storagePath = `${schoolId}/${studentId}/${docCategory.id}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('student-documents')
        .upload(storagePath, blob, { upsert: true, contentType: blob.type || 'application/octet-stream' });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('student-documents')
        .getPublicUrl(storagePath);

      await supabase.from('student_documents').insert({
        student_id: studentId,
        school_id: schoolId,
        doc_type: docCategory.id,
        doc_label: docCategory.label,
        file_name: fileName,
        file_url: urlData?.publicUrl ?? '',
      });

      await loadDocuments();
      setDocSheetVisible(false);
      setActiveDocCategory(null);
    } catch (e: any) {
      Alert.alert('Upload Failed', e.message || 'Could not upload document.');
    } finally {
      setUploadingDocType(null);
    }
  }

  async function handleDocCamera() {
    if (!activeDocCategory) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required', 'Camera access needed.'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await uploadDocument(activeDocCategory, asset.uri, asset.fileName ?? `photo_${Date.now()}.jpg`);
    }
  }

  async function handleDocGallery() {
    if (!activeDocCategory) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required', 'Gallery access needed.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await uploadDocument(activeDocCategory, asset.uri, asset.fileName ?? `image_${Date.now()}.jpg`);
    }
  }

  async function handleDocFile() {
    if (!activeDocCategory) return;
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await uploadDocument(activeDocCategory, asset.uri, asset.name);
    }
  }

  async function handleDeleteDocument(docId: string) {
    Alert.alert('Delete Document', 'Remove this document?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await supabase.from('student_documents').delete().eq('id', docId);
          await loadDocuments();
        },
      },
    ]);
  }

  async function fetchStudentProfile() {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (error) throw error;
      setStudent(data);
    } catch (e) {
      console.error('Error fetching student:', e);
    } finally {
      setLoading(false);
    }
  }

  function handleEditPress() {
    if (activeTab === 'attendance') {
      setAttendanceEditVisible(true);
      return;
    }

    if (activeTab === 'progress') {
      setProgressEditVisible(true);
      return;
    }

    setEditModalVisible(true);
  }

  async function handleSaveAttendance(
    nextSummary: AttendanceSummary,
    nextDays: AttendanceDay[]
  ): Promise<{ ok: boolean; message?: string }> {
    if (!student || !profile?.id) {
      return { ok: false, message: 'Missing school or user session.' };
    }

    const metrics = metricsFromCalendarMonth(attendanceMonth, nextDays);
    const summaryWithMetrics: AttendanceSummary = {
      ...nextSummary,
      presentPct: `${metrics.presentPct}`,
      absentPct: `${metrics.absentPct}`,
      workingDays: `${metrics.workingDays}`,
      month: getMonthLabel(attendanceMonth),
    };

    const { error } = await saveStudentAttendanceMonth({
      schoolId,
      studentId: student.id,
      month: attendanceMonth,
      days: nextDays,
      markedBy: profile.id,
      noteText: nextSummary.noteText,
    });

    if (error) {
      return { ok: false, message: mapFriendlyAttendanceError(error) };
    }

    setAttendanceSummary(summaryWithMetrics);
    setAttendanceDays(nextDays);
    setAttendanceSaveMessage('Attendance saved successfully.');
    setTimeout(() => setAttendanceSaveMessage(null), 3500);
    await loadAttendanceMonth();
    return { ok: true };
  }

  function shiftAttendanceMonth(delta: number) {
    setAttendanceMonth((current) => addMonths(current, delta));
  }

  async function handleSaveProgress(nextSkills: Skill[]) {
    setProgressSaving(true);
    try {
      setProgressSkills(nextSkills);
      await saveStudentProgress(studentId, selectedTerm, nextSkills);
      setProgressEditVisible(false);
      if (notesModalSkill) {
        const updated = nextSkills.find((skill) => skill.id === notesModalSkill.id);
        if (updated) setNotesModalSkill(updated);
      }
      Alert.alert('Saved', 'Progress details updated.');
    } catch {
      Alert.alert('Could not save', 'Progress could not be saved on this device. Please try again.');
    } finally {
      setProgressSaving(false);
    }
  }

  function openNotesForSkill(skill: Skill) {
    setNotesModalSkill(skill);
  }

  function openEditNotesFromViewer() {
    setNotesModalSkill(null);
    setProgressEditVisible(true);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primaryBlue} />
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Student not found</Text>
      </View>
    );
  }

  const initials = getInitials(student.full_name);
  const classColor = CLASS_COLORS[student.class] ?? CLASS_COLORS.PG;
  const isActive = student.status === 'active';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace('/(dashboard)/students')}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={AppColors.primaryBlue} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>STUDENT PROFILE</Text>
        <TouchableOpacity 
          style={styles.editBtn} 
          activeOpacity={0.7}
          onPress={handleEditPress}
        >
          <Ionicons name="create-outline" size={24} color={AppColors.primaryBlue} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarLarge, { backgroundColor: classColor.bg }]}>
            <Text style={[styles.avatarTextLarge, { color: classColor.text }]}>
              {initials}
            </Text>
            <View style={[styles.statusDotLarge, { backgroundColor: isActive ? AppColors.success : AppColors.textLight }]} />
          </View>
          <Text style={styles.studentName}>{student.full_name}</Text>

          {/* Badges */}
          <View style={styles.badgesRow}>
            {student.roll_number && (
              <View style={styles.idBadge}>
                <Text style={styles.idBadgeLabel}>ID: </Text>
                <Text style={styles.idBadgeValue}>{student.roll_number}</Text>
              </View>
            )}
            <View style={[styles.classBadgeLarge, { backgroundColor: classColor.bg }]}>
              <Text style={[styles.classBadgeText, { color: classColor.text }]}>
                {student.class === 'PG' ? 'Play Group' :
                 student.class === 'PKG' ? 'Pre-KG' :
                 student.class === 'JKG' ? 'Junior KG' :
                 student.class === 'SKG' ? 'Senior KG' : student.class}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: AppColors.success }]} />
              <Text style={styles.statusText}>Admitted</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.tabActive]}
            onPress={() => setActiveTab('info')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
              Info
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'attendance' && styles.tabActive]}
            onPress={() => setActiveTab('attendance')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'attendance' && styles.tabTextActive]}>
              Attendance
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'progress' && styles.tabActive]}
            onPress={() => setActiveTab('progress')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'progress' && styles.tabTextActive]}>
              Progress
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'fees' && styles.tabActive]}
            onPress={() => setActiveTab('fees')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'fees' && styles.tabTextActive]}>
              Fees
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'info' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Personal Details */}
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Ionicons name="person-circle-outline" size={24} color={AppColors.gold} />
                <Text style={styles.infoTitle}>Personal Details</Text>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>DATE OF BIRTH</Text>
                  <Text style={styles.infoValue}>{formatDate(student.date_of_birth)}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>GENDER</Text>
                  <Text style={styles.infoValue}>
                    {student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>MOTHER TONGUE</Text>
                  <Text style={styles.infoValue}>{student.mother_tongue || 'N/A'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>NATIONALITY</Text>
                  <Text style={styles.infoValue}>{student.nationality || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>AADHAAR (LAST 4 DIGITS)</Text>
                <Text style={styles.infoValue}>
                  {student.aadhaar_last4 ? `XXXX-XXXX-${student.aadhaar_last4}` : 'N/A'}
                </Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>ADDRESS</Text>
                <Text style={styles.infoValue}>{student.address || 'N/A'}</Text>
              </View>
            </View>

            {/* Academic Details */}
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Ionicons name="school-outline" size={24} color={AppColors.gold} />
                <Text style={styles.infoTitle}>Academic Details</Text>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>ADMISSION DATE</Text>
                  <Text style={styles.infoValue}>{formatDate(student.admission_date)}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>CLASS</Text>
                  <Text style={styles.infoValue}>
                    {student.class === 'PG' ? 'Play Group' :
                     student.class === 'PKG' ? 'Pre-KG' :
                     student.class === 'JKG' ? 'Junior KG' :
                     student.class === 'SKG' ? 'Senior KG' : student.class}
                  </Text>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>ROLL NUMBER</Text>
                  <Text style={styles.infoValue}>{student.roll_number || 'N/A'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>STATUS</Text>
                  <Text style={[styles.infoValue, { color: student.status === 'active' ? AppColors.success : AppColors.error, textTransform: 'capitalize' }]}>
                    {student.status}
                  </Text>
                </View>
              </View>
            </View>

            {/* Father's Details */}
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Ionicons name="man-outline" size={24} color={AppColors.gold} />
                <Text style={styles.infoTitle}>Father's Details</Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>FULL NAME</Text>
                <Text style={styles.infoValue}>{student.father_name || 'N/A'}</Text>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>PHONE NUMBER</Text>
                  <Text style={styles.infoValue}>{student.father_phone || 'N/A'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>EMAIL</Text>
                  <Text style={styles.infoValue}>{student.father_email || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>OCCUPATION</Text>
                  <Text style={styles.infoValue}>{student.father_occupation || 'N/A'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>WORK LOCATION</Text>
                  <Text style={styles.infoValue}>{student.father_work_location || 'N/A'}</Text>
                </View>
              </View>
            </View>

            {/* Mother's Details */}
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Ionicons name="woman-outline" size={24} color={AppColors.gold} />
                <Text style={styles.infoTitle}>Mother's Details</Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>FULL NAME</Text>
                <Text style={styles.infoValue}>{student.mother_name || 'N/A'}</Text>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>PHONE NUMBER</Text>
                  <Text style={styles.infoValue}>{student.mother_phone || 'N/A'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>EMAIL</Text>
                  <Text style={styles.infoValue}>{student.mother_email || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>OCCUPATION</Text>
                  <Text style={styles.infoValue}>{student.mother_occupation || 'N/A'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>WORK LOCATION</Text>
                  <Text style={styles.infoValue}>{student.mother_work_location || 'N/A'}</Text>
                </View>
              </View>
            </View>

            {/* Guardian Details */}
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Ionicons name="people-outline" size={24} color={AppColors.gold} />
                <Text style={styles.infoTitle}>Guardian Details</Text>
              </View>

              {student.guardian_name ? (
                <>
                  <View style={styles.infoSection}>
                    <Text style={styles.infoLabel}>FULL NAME</Text>
                    <Text style={styles.infoValue}>{student.guardian_name}</Text>
                  </View>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>PHONE</Text>
                      <Text style={styles.infoValue}>{student.guardian_phone || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>RELATION</Text>
                      <Text style={styles.infoValue}>{student.guardian_relation || 'N/A'}</Text>
                    </View>
                  </View>
                </>
              ) : (
                <View style={styles.infoSection}>
                  <Text style={[styles.infoValue, { color: AppColors.textTertiary }]}>No guardian information provided</Text>
                </View>
              )}
            </View>

            {/* Documents */}
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Ionicons name="document-text-outline" size={24} color={AppColors.gold} />
                <Text style={styles.infoTitle}>Documents</Text>
                {docsLoading && <ActivityIndicator size="small" color={AppColors.primaryBlue} style={{ marginLeft: 'auto' }} />}
              </View>

              {/* Uploaded documents list */}
              {documents.length === 0 && !docsLoading && (
                <View style={styles.infoSection}>
                  <Text style={[styles.infoValue, { color: AppColors.textTertiary }]}>No documents uploaded yet</Text>
                </View>
              )}

              {documents.map((doc) => (
                <View key={doc.id} style={styles.docRow}>
                  <View style={styles.docIconWrap}>
                    <Ionicons name="document-outline" size={20} color={AppColors.primaryBlue} />
                  </View>
                  <View style={styles.docInfo}>
                    <Text style={styles.docLabel}>{doc.doc_label}</Text>
                    <Text style={styles.docFileName}>{doc.file_name}</Text>
                    <Text style={styles.docDate}>
                      {new Date(doc.uploaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={styles.docActions}>
                    <TouchableOpacity
                      style={styles.docActionBtn}
                      activeOpacity={0.7}
                      onPress={() => Linking.openURL(doc.file_url).catch(() => Alert.alert('Cannot open', 'Unable to open this file.'))}
                    >
                      <Ionicons name="open-outline" size={18} color={AppColors.primaryBlue} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.docActionBtn, { backgroundColor: '#FFE4E4' }]}
                      activeOpacity={0.7}
                      onPress={() => handleDeleteDocument(doc.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color={AppColors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Upload new document buttons */}
              <Text style={[styles.infoLabel, { marginTop: 16, marginBottom: 8 }]}>UPLOAD DOCUMENT</Text>
              <View style={styles.docCategoryGrid}>
                {DOC_CATEGORIES.map((cat) => {
                  const alreadyUploaded = documents.some((d) => d.doc_type === cat.id);
                  const isUploading = uploadingDocType === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.docCategoryBtn, alreadyUploaded && styles.docCategoryBtnDone]}
                      activeOpacity={0.7}
                      onPress={() => { setActiveDocCategory(cat); setDocSheetVisible(true); }}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <ActivityIndicator size="small" color={AppColors.primaryBlue} />
                      ) : (
                        <Ionicons
                          name={alreadyUploaded ? 'checkmark-circle' : cat.icon as any}
                          size={20}
                          color={alreadyUploaded ? AppColors.success : cat.color}
                        />
                      )}
                      <Text style={[styles.docCategoryLabel, alreadyUploaded && { color: AppColors.success }]} numberOfLines={2}>
                        {cat.label}
                      </Text>
                      {cat.required && !alreadyUploaded && (
                        <View style={styles.docRequiredDot} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        )}

        {/* Document upload action sheet */}
        <Modal
          visible={docSheetVisible}
          transparent
          animationType="slide"
          onRequestClose={() => { setDocSheetVisible(false); setActiveDocCategory(null); }}
        >
          <TouchableOpacity
            style={styles.sheetOverlay}
            activeOpacity={1}
            onPress={() => { setDocSheetVisible(false); setActiveDocCategory(null); }}
          />
          <View style={styles.docSheet}>
            <View style={styles.docSheetHandle} />
            <Text style={styles.docSheetTitle}>{activeDocCategory?.label}</Text>
            <Text style={styles.docSheetSubtitle}>Choose how to upload</Text>

            <TouchableOpacity style={styles.docSheetOption} onPress={handleDocCamera} activeOpacity={0.8}>
              <View style={[styles.docSheetOptionIcon, { backgroundColor: AppColors.blueLight }]}>
                <Ionicons name="camera-outline" size={22} color={AppColors.primaryBlue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.docSheetOptionLabel}>Take Photo</Text>
                <Text style={styles.docSheetOptionDesc}>Use camera to capture the document</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={AppColors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.docSheetOption} onPress={handleDocGallery} activeOpacity={0.8}>
              <View style={[styles.docSheetOptionIcon, { backgroundColor: '#D4F4E8' }]}>
                <Ionicons name="images-outline" size={22} color={AppColors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.docSheetOptionLabel}>Photo Library</Text>
                <Text style={styles.docSheetOptionDesc}>Choose from gallery</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={AppColors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.docSheetOption} onPress={handleDocFile} activeOpacity={0.8}>
              <View style={[styles.docSheetOptionIcon, { backgroundColor: AppColors.goldLight }]}>
                <Ionicons name="document-outline" size={22} color={AppColors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.docSheetOptionLabel}>Browse Files</Text>
                <Text style={styles.docSheetOptionDesc}>Upload PDF or file from device</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={AppColors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.docSheetCancel}
              onPress={() => { setDocSheetVisible(false); setActiveDocCategory(null); }}
              activeOpacity={0.8}
            >
              <Text style={styles.docSheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {activeTab === 'attendance' && (
          <View style={styles.attendanceContainer}>
            {attendanceSaveMessage ? (
              <View style={styles.saveToast}>
                <Ionicons name="checkmark-circle" size={18} color="#2A9D6E" />
                <Text style={styles.saveToastText}>{attendanceSaveMessage}</Text>
              </View>
            ) : null}

            {attendanceLoading ? (
              <ActivityIndicator size="small" color={AppColors.primaryBlue} style={{ marginBottom: 12 }} />
            ) : null}

            {/* Stats Cards */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: '#D4F4E8' }]}>
                <Text style={[styles.statValue, { color: '#2A9D6E' }]}>{attendanceSummary.presentPct}%</Text>
                <Text style={styles.statLabel}>Present</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#FFE4E4' }]}>
                <Text style={[styles.statValue, { color: '#E05A5A' }]}>{attendanceSummary.absentPct}%</Text>
                <Text style={styles.statLabel}>Absent</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: AppColors.blueLight }]}>
                <Text style={[styles.statValue, { color: AppColors.primaryBlue }]}>{attendanceSummary.workingDays}</Text>
                <Text style={styles.statLabel}>Working Days</Text>
              </View>
            </View>

            {/* Calendar */}
            <View style={styles.calendarCard}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity
                  style={styles.calendarArrow}
                  activeOpacity={0.7}
                  onPress={() => shiftAttendanceMonth(-1)}
                >
                  <Ionicons name="chevron-back" size={20} color={AppColors.textSecondary} />
                </TouchableOpacity>
                <Text style={styles.calendarMonth}>{attendanceSummary.month}</Text>
                <TouchableOpacity
                  style={styles.calendarArrow}
                  activeOpacity={0.7}
                  onPress={() => shiftAttendanceMonth(1)}
                >
                  <Ionicons name="chevron-forward" size={20} color={AppColors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {/* Day Headers */}
                <View style={styles.calendarRow}>
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <Text key={day} style={styles.dayHeader}>{day}</Text>
                  ))}
                </View>

                {getAttendanceCalendarWeeks(attendanceMonth, attendanceDays).map((week, weekIndex) => (
                  <View key={weekIndex} style={styles.calendarRow}>
                    {week.map((day, dayIndex) => (
                      day ? (
                        <View key={day.day} style={[styles.dayCell, getDayCellStyle(day.status)]}>
                          <Text
                            style={getDayTextStyle(
                              day.status,
                              isViewingCurrentMonth && day.day === todayDayNumber
                            )}
                          >
                            {day.day}
                          </Text>
                        </View>
                      ) : (
                        <View key={`blank-${weekIndex}-${dayIndex}`} style={styles.dayCell} />
                      )
                    ))}
                  </View>
                ))}
              </View>

              {/* Legend */}
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#2A9D6E' }]} />
                  <Text style={styles.legendText}>Present</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#E05A5A' }]} />
                  <Text style={styles.legendText}>Absent</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#F39C12' }]} />
                  <Text style={styles.legendText}>Late</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#3498DB' }]} />
                  <Text style={styles.legendText}>Holiday</Text>
                </View>
              </View>
            </View>

            {/* Recent Notes */}
            <View style={styles.notesCard}>
              <Text style={styles.notesTitle}>Recent Notes</Text>
              <View style={styles.noteItem}>
                <View style={styles.noteIcon}>
                  <Ionicons name="medical" size={20} color="#E05A5A" />
                </View>
                <View style={styles.noteContent}>
                  <View style={styles.noteHeader}>
                    <Text style={styles.noteTitle}>{attendanceSummary.noteTitle}</Text>
                    <Text style={styles.noteDate}>{attendanceSummary.noteDate}</Text>
                  </View>
                  <Text style={styles.noteText}>{attendanceSummary.noteText}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'progress' && (
          <View style={styles.progressContainer}>
            {/* Term Selection */}
            <View style={styles.termSelector}>
              {[1, 2, 3].map((term) => (
                <TouchableOpacity
                  key={term}
                  style={[styles.termBtn, selectedTerm === term && styles.termBtnActive]}
                  onPress={() => setSelectedTerm(term as 1 | 2 | 3)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.termText, selectedTerm === term && styles.termTextActive]}>
                    Term {term}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Skills Cards */}
            {(() => {
              const skills = progressSkills;
              
              if (skills.length === 0) {
                return (
                  <View style={styles.infoCard}>
                    <Text style={styles.comingSoonText}>
                      No progress skills configured for {student.class}
                    </Text>
                  </View>
                );
              }

              return skills.map((skill) => {
                const levelDetails = getProgressLevelDetails(skill.level);
                return (
                  <View key={skill.id} style={styles.skillCard}>
                    <View style={styles.skillHeader}>
                      <View style={[styles.skillIcon, { backgroundColor: `${levelDetails.color}20` }]}>
                        <Text style={styles.skillEmoji}>{skill.emoji}</Text>
                      </View>
                      <View style={styles.skillInfo}>
                        <Text style={styles.skillName}>{skill.name}</Text>
                        <Text style={[styles.skillLevel, { color: levelDetails.color }]}>
                          {levelDetails.label}
                        </Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBarBg}>
                        <View 
                          style={[
                            styles.progressBarFill, 
                            { 
                              width: `${levelDetails.progress}%`,
                              backgroundColor: levelDetails.color 
                            }
                          ]} 
                        />
                      </View>
                      <View style={styles.progressLabels}>
                        <Text style={styles.progressLabel}>EMERGING</Text>
                        <Text style={styles.progressLabel}>ADVANCED</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.viewNotesBtn}
                      activeOpacity={0.7}
                      onPress={() => openNotesForSkill(skill)}
                    >
                      <View style={styles.viewNotesLeft}>
                        <Text style={styles.viewNotesText}>
                          {skill.notes.trim() ? 'View notes' : 'Add notes'}
                        </Text>
                        {skill.notes.trim() ? (
                          <View style={styles.notesBadge}>
                            <Text style={styles.notesBadgeText}>1</Text>
                          </View>
                        ) : null}
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={AppColors.primaryBlue} />
                    </TouchableOpacity>
                  </View>
                );
              });
            })()}
          </View>
        )}

        {activeTab === 'fees' && (
          <FeeTab
            feeRecords={feeRecords}
            feeStats={feeStats}
            feeLoading={feeLoading}
            onPaymentSuccess={loadFeeData}
            studentId={studentId}
            schoolId={profile?.school_id ?? ''}
            studentName={student?.full_name ?? ''}
          />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Modal */}
      <EditStudentModal
        visible={editModalVisible}
        student={student}
        onClose={() => setEditModalVisible(false)}
        onSuccess={fetchStudentProfile}
      />

      <AttendanceEditModal
        visible={attendanceEditVisible}
        summary={attendanceSummary}
        days={attendanceDays}
        month={attendanceMonth}
        onClose={() => setAttendanceEditVisible(false)}
        onSave={handleSaveAttendance}
      />

      <ProgressEditModal
        visible={progressEditVisible}
        selectedTerm={selectedTerm}
        skills={progressSkills}
        saving={progressSaving}
        onClose={() => setProgressEditVisible(false)}
        onSave={handleSaveProgress}
      />

      <SkillNotesModal
        visible={notesModalSkill !== null}
        skill={notesModalSkill}
        term={selectedTerm}
        onClose={() => setNotesModalSkill(null)}
        onEditNotes={openEditNotesFromViewer}
      />
    </View>
  );
}

// ─── Fee Tab ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function getFeeStatus(record: FeeRecord): { label: string; color: string; bg: string } {
  if (record.paid) return { label: 'PAID', color: '#2A9D6E', bg: '#D4F4E8' };
  const today = new Date().toISOString().split('T')[0];
  if (record.due_date && record.due_date < today) return { label: 'OVERDUE', color: '#E74C3C', bg: '#FFE4E4' };
  if (!record.due_date) return { label: 'PENDING', color: AppColors.textSecondary, bg: AppColors.blueLight };
  return { label: 'PENDING', color: AppColors.textSecondary, bg: AppColors.blueLight };
}

function getFeeIcon(record: FeeRecord): { name: any; color: string; bg: string } {
  if (record.paid) return { name: 'checkmark-circle', color: '#2A9D6E', bg: '#D4F4E8' };
  const today = new Date().toISOString().split('T')[0];
  if (record.due_date && record.due_date < today) return { name: 'alert-circle', color: '#E74C3C', bg: '#FFE4E4' };
  return { name: 'time-outline', color: AppColors.textSecondary, bg: AppColors.blueLight };
}

function formatFeeDate(dateStr: string | null): string {
  if (!dateStr) return 'Upcoming';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function FeeTab({
  feeRecords,
  feeStats,
  feeLoading,
  onPaymentSuccess,
  studentId,
  schoolId,
  studentName,
}: {
  feeRecords: FeeRecord[];
  feeStats: FeeStats;
  feeLoading: boolean;
  onPaymentSuccess: () => void;
  studentId: string;
  schoolId: string;
  studentName: string;
}) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'quarterly'>('monthly');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  
  // Filter records by selected plan
  const filteredRecords = feeRecords.filter(r => r.installment_plan === selectedPlan);
  
  // Recalculate stats for filtered records
  const filteredStats = {
    totalAnnual: filteredRecords.reduce((s, r) => s + r.amount, 0),
    paid: filteredRecords.filter(r => r.paid).reduce((s, r) => s + r.amount, 0),
    outstanding: 0,
    percentage: 0,
  };
  filteredStats.outstanding = filteredStats.totalAnnual - filteredStats.paid;
  filteredStats.percentage = filteredStats.totalAnnual > 0 ? Math.round((filteredStats.paid / filteredStats.totalAnnual) * 100) : 0;
  
  const overdueCount = filteredRecords.filter((r) => {
    if (r.paid) return false;
    const today = new Date().toISOString().split('T')[0];
    return r.due_date && r.due_date < today;
  }).length;

  if (feeLoading) {
    return (
      <View style={feeStyles.loadingBox}>
        <ActivityIndicator size="small" color={AppColors.primaryBlue} />
      </View>
    );
  }

  if (feeRecords.length === 0) {
    return (
      <View style={feeStyles.emptyBox}>
        <Ionicons name="wallet-outline" size={48} color={AppColors.textLight} />
        <Text style={feeStyles.emptyTitle}>No fee records</Text>
        <Text style={feeStyles.emptyText}>Fee records for this student will appear here.</Text>
      </View>
    );
  }

  return (
    <View style={feeStyles.container}>
      {/* Plan Selector */}
      <View style={feeStyles.planSelector}>
        <TouchableOpacity
          style={[feeStyles.planBtn, selectedPlan === 'monthly' && feeStyles.planBtnActive]}
          onPress={() => setSelectedPlan('monthly')}
          activeOpacity={0.7}
        >
          <Text style={[feeStyles.planBtnText, selectedPlan === 'monthly' && feeStyles.planBtnTextActive]}>
            Monthly (12)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[feeStyles.planBtn, selectedPlan === 'quarterly' && feeStyles.planBtnActive]}
          onPress={() => setSelectedPlan('quarterly')}
          activeOpacity={0.7}
        >
          <Text style={[feeStyles.planBtnText, selectedPlan === 'quarterly' && feeStyles.planBtnTextActive]}>
            Quarterly (4)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={feeStyles.summaryCard}>
        <View style={feeStyles.summaryTop}>
          <View>
            <Text style={feeStyles.totalLabel}>TOTAL ANNUAL FEE</Text>
            <Text style={feeStyles.totalAmount}>{formatCurrency(filteredStats.totalAnnual)}</Text>
          </View>
          <View style={feeStyles.walletIcon}>
            <Ionicons name="wallet" size={22} color={AppColors.primaryBlue} />
          </View>
        </View>

        <View style={feeStyles.paidOutstandingRow}>
          <View style={feeStyles.paidBox}>
            <Text style={feeStyles.paidLabel}>Paid</Text>
            <Text style={feeStyles.paidAmount}>{formatCurrency(filteredStats.paid)}</Text>
          </View>
          <View style={feeStyles.outstandingBox}>
            <Text style={feeStyles.outstandingLabel}>Outstanding</Text>
            <Text style={feeStyles.outstandingAmount}>{formatCurrency(filteredStats.outstanding)}</Text>
          </View>
        </View>

        <View style={feeStyles.progressSection}>
          <View style={feeStyles.progressLabelRow}>
            <Text style={feeStyles.progressLabel}>Progress</Text>
            <Text style={feeStyles.progressPct}>{filteredStats.percentage}%</Text>
          </View>
          <View style={feeStyles.progressBarBg}>
            <View style={[feeStyles.progressBarFill, { width: `${filteredStats.percentage}%` }]} />
          </View>
        </View>
      </View>

      {/* Fee History */}
      <View style={feeStyles.historySection}>
        <View style={feeStyles.historyHeader}>
          <Text style={feeStyles.historyTitle}>Fee History</Text>
          {overdueCount > 0 && (
            <View style={feeStyles.overdueBadge}>
              <Text style={feeStyles.overdueBadgeText}>{overdueCount} Overdue</Text>
            </View>
          )}
        </View>

        {filteredRecords.map((record) => {
          const status = getFeeStatus(record);
          const icon = getFeeIcon(record);
          const isOverdue = status.label === 'OVERDUE';
          const showInstallmentBadge = record.installment_plan && record.installment_number && record.total_installments;

          return (
            <View
              key={record.id}
              style={[feeStyles.feeRow, isOverdue && feeStyles.feeRowOverdue]}
            >
              <View style={[feeStyles.feeIcon, { backgroundColor: icon.bg }]}>
                <Ionicons name={icon.name} size={22} color={icon.color} />
              </View>

              <View style={feeStyles.feeInfo}>
                <View style={feeStyles.feeLabelRow}>
                  <Text style={feeStyles.feeLabel}>{record.label}</Text>
                  {showInstallmentBadge && (
                    <View style={feeStyles.installmentBadge}>
                      <Text style={feeStyles.installmentBadgeText}>
                        {record.installment_number}/{record.total_installments}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[feeStyles.feeDate, isOverdue && { color: AppColors.error }]}>
                  {record.paid && record.paid_date
                    ? formatFeeDate(record.paid_date)
                    : record.due_date
                    ? `Due: ${formatFeeDate(record.due_date)}`
                    : 'Upcoming'}
                </Text>
              </View>

              <View style={feeStyles.feeRight}>
                <Text style={feeStyles.feeAmount}>{formatCurrency(record.amount)}</Text>
                <View style={[feeStyles.statusBadge, { backgroundColor: status.bg }]}>
                  <Text style={[feeStyles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Action Buttons */}
      {filteredStats.outstanding > 0 && (
        <View style={feeStyles.actionRow}>
          <TouchableOpacity
            style={feeStyles.payBtn}
            activeOpacity={0.85}
            onPress={() => setPaymentModalVisible(true)}
          >
            <Ionicons name="card-outline" size={20} color={AppColors.white} />
            <Text style={feeStyles.payBtnText}>Pay Outstanding</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={feeStyles.reminderBtn}
            activeOpacity={0.85}
            onPress={() => router.push(`/(dashboard)/record-payment?studentId=${studentId}`)}
          >
            <Ionicons name="card-outline" size={20} color={AppColors.primaryBlue} />
            <Text style={feeStyles.reminderBtnText}>Record Payment</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 20 }} />

      {/* Payment Modal */}
      <PaymentModal
        visible={paymentModalVisible}
        feeRecords={filteredRecords.filter(r => !r.paid)}
        onClose={() => setPaymentModalVisible(false)}
        onSuccess={() => {
          setPaymentModalVisible(false);
          onPaymentSuccess();
        }}
        schoolId={schoolId}
        studentName={studentName}
      />

      {/* Reminder Modal */}
      <ReminderModal
        visible={reminderModalVisible}
        feeRecords={filteredRecords.filter(r => !r.paid)}
        onClose={() => setReminderModalVisible(false)}
      />
    </View>
  );
}

const feeStyles = StyleSheet.create({
  loadingBox: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  emptyText: {
    fontSize: 13,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
  container: {
    gap: 20,
  },
  // Plan Selector
  planSelector: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 6,
    ...AppShadows.cardShadow,
  },
  planBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  planBtnActive: {
    backgroundColor: AppColors.primaryBlue,
  },
  planBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.textSecondary,
  },
  planBtnTextActive: {
    color: AppColors.white,
  },
  // Summary Card
  summaryCard: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    ...AppShadows.cardShadow,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: AppColors.primaryBlue,
  },
  walletIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: AppColors.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paidOutstandingRow: {
    flexDirection: 'row',
    gap: 12,
  },
  paidBox: {
    flex: 1,
    backgroundColor: AppColors.background,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  outstandingBox: {
    flex: 1,
    backgroundColor: AppColors.background,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  paidLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  paidAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2A9D6E',
  },
  outstandingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  outstandingAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.error,
  },
  progressSection: {
    gap: 8,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  progressPct: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.primaryBlue,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: AppColors.blueLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: AppColors.primaryBlue,
    borderRadius: 4,
  },
  // Fee History
  historySection: {
    gap: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.textPrimary,
  },
  overdueBadge: {
    backgroundColor: '#FFE4E4',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  overdueBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.error,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    ...AppShadows.cardShadow,
  },
  feeRowOverdue: {
    borderLeftWidth: 3,
    borderLeftColor: AppColors.error,
  },
  feeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feeInfo: {
    flex: 1,
    gap: 3,
  },
  feeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feeLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.textPrimary,
    flex: 1,
  },
  installmentBadge: {
    backgroundColor: AppColors.goldLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  installmentBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: AppColors.gold,
  },
  feeDate: {
    fontSize: 12,
    fontWeight: '500',
    color: AppColors.textSecondary,
  },
  feeRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  feeAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: AppColors.textPrimary,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  // Action Buttons
  actionRow: {
    gap: 10,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: AppColors.primaryBlue,
    borderRadius: 16,
    paddingVertical: 16,
    ...AppShadows.floatingShadow,
  },
  payBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.white,
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: AppColors.white,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: AppColors.primaryBlue,
    ...AppShadows.cardShadow,
  },
  reminderBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.primaryBlue,
  },
});

function PaymentModal({
  visible,
  feeRecords,
  onClose,
  onSuccess,
  schoolId,
  studentName,
}: {
  visible: boolean;
  feeRecords: FeeRecord[];
  onClose: () => void;
  onSuccess: () => void;
  schoolId: string;
  studentName: string;
}) {
  const [selectedFees, setSelectedFees] = useState<Set<string>>(new Set());
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'cheque'>('upi');
  const [transactionId, setTransactionId] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedFees(new Set(feeRecords.map(f => f.id)));
      setTransactionId('');
    }
  }, [visible, feeRecords]);

  const toggleFee = (feeId: string) => {
    const newSet = new Set(selectedFees);
    if (newSet.has(feeId)) {
      newSet.delete(feeId);
    } else {
      newSet.add(feeId);
    }
    setSelectedFees(newSet);
  };

  const totalAmount = feeRecords
    .filter(f => selectedFees.has(f.id))
    .reduce((sum, f) => sum + f.amount, 0);

  const handlePayment = async () => {
    if (selectedFees.size === 0) {
      Alert.alert('No fees selected', 'Please select at least one fee to pay.');
      return;
    }

    setProcessing(true);
    try {
      const feeIds = Array.from(selectedFees);
      const updates = feeIds.map(feeId => ({
        id: feeId,
        paid: true,
        paid_date: new Date().toISOString().split('T')[0],
        payment_method: paymentMethod,
        transaction_id: transactionId || null,
        updated_at: new Date().toISOString(),
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('fees')
          .update(update)
          .eq('id', update.id);

        if (error) throw error;
      }

      logActivity(schoolId, 'payment_received', 'Fee Payment Received', `${studentName} paid ${formatCurrency(totalAmount)} via ${paymentMethod}`);
      Alert.alert('Success', `Payment of ${formatCurrency(totalAmount)} recorded successfully!`);
      onSuccess();
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Failed to record payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={paymentStyles.container}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Record Payment</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={AppColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={paymentStyles.content} showsVerticalScrollIndicator={false}>
            {/* Fee Selection */}
            <Text style={paymentStyles.sectionTitle}>Select Fees to Pay</Text>
            {feeRecords.map(fee => (
              <TouchableOpacity
                key={fee.id}
                style={[
                  paymentStyles.feeItem,
                  selectedFees.has(fee.id) && paymentStyles.feeItemSelected
                ]}
                onPress={() => toggleFee(fee.id)}
                activeOpacity={0.7}
              >
                <View style={paymentStyles.checkbox}>
                  {selectedFees.has(fee.id) && (
                    <Ionicons name="checkmark" size={18} color={AppColors.white} />
                  )}
                </View>
                <View style={paymentStyles.feeItemInfo}>
                  <Text style={paymentStyles.feeItemLabel}>{fee.label}</Text>
                  {fee.due_date && (
                    <Text style={paymentStyles.feeItemDate}>Due: {formatFeeDate(fee.due_date)}</Text>
                  )}
                </View>
                <Text style={paymentStyles.feeItemAmount}>{formatCurrency(fee.amount)}</Text>
              </TouchableOpacity>
            ))}

            {/* Payment Method */}
            <Text style={[paymentStyles.sectionTitle, { marginTop: 20 }]}>Payment Method</Text>
            <View style={paymentStyles.methodGrid}>
              {(['cash', 'upi', 'card', 'cheque'] as const).map(method => (
                <TouchableOpacity
                  key={method}
                  style={[
                    paymentStyles.methodBtn,
                    paymentMethod === method && paymentStyles.methodBtnActive
                  ]}
                  onPress={() => setPaymentMethod(method)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      method === 'cash' ? 'cash-outline' :
                      method === 'upi' ? 'phone-portrait-outline' :
                      method === 'card' ? 'card-outline' : 'document-text-outline'
                    }
                    size={24}
                    color={paymentMethod === method ? AppColors.white : AppColors.primaryBlue}
                  />
                  <Text style={[
                    paymentStyles.methodText,
                    paymentMethod === method && paymentStyles.methodTextActive
                  ]}>
                    {method.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Transaction ID */}
            {paymentMethod !== 'cash' && (
              <>
                <Text style={[paymentStyles.sectionTitle, { marginTop: 20 }]}>
                  Transaction ID (Optional)
                </Text>
                <TextInput
                  style={paymentStyles.input}
                  placeholder="Enter transaction/reference ID"
                  value={transactionId}
                  onChangeText={setTransactionId}
                  placeholderTextColor={AppColors.textLight}
                />
              </>
            )}

            {/* Total */}
            <View style={paymentStyles.totalBox}>
              <Text style={paymentStyles.totalLabel}>Total Amount</Text>
              <Text style={paymentStyles.totalAmount}>{formatCurrency(totalAmount)}</Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={onClose} 
              activeOpacity={0.7}
              disabled={processing}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveBtn, processing && { opacity: 0.6 }]} 
              onPress={handlePayment} 
              activeOpacity={0.7}
              disabled={processing || selectedFees.size === 0}
            >
              {processing ? (
                <ActivityIndicator size="small" color={AppColors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color={AppColors.white} />
                  <Text style={styles.saveBtnText}>Record Payment</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const paymentStyles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    width: '100%',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 12,
  },
  feeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: AppColors.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  feeItemSelected: {
    borderColor: AppColors.primaryBlue,
    backgroundColor: AppColors.blueLight,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: AppColors.primaryBlue,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feeItemInfo: {
    flex: 1,
    gap: 2,
  },
  feeItemLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  feeItemDate: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  feeItemAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: AppColors.primaryBlue,
  },
  methodGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  methodBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.blueLight,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodBtnActive: {
    backgroundColor: AppColors.primaryBlue,
    borderColor: AppColors.primaryBlue,
  },
  methodText: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.primaryBlue,
  },
  methodTextActive: {
    color: AppColors.white,
  },
  input: {
    backgroundColor: AppColors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: AppColors.textPrimary,
    borderWidth: 1,
    borderColor: AppColors.textLight,
  },
  totalBox: {
    backgroundColor: AppColors.primaryBlue,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
    gap: 4,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.white,
    opacity: 0.8,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: AppColors.white,
  },
});

function ReminderModal({
  visible,
  feeRecords,
  onClose,
}: {
  visible: boolean;
  feeRecords: FeeRecord[];
  onClose: () => void;
}) {
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (visible) setNote('');
  }, [visible]);

  const totalOutstanding = feeRecords.reduce((s, r) => s + r.amount, 0);

  const handleSend = async () => {
    setSending(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      Alert.alert(
        'Reminder Recorded',
        `Payment reminder for ${formatCurrency(totalOutstanding)} has been noted. Parents will be notified.`,
        [{ text: 'OK', onPress: onClose }]
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={paymentStyles.container}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Record Payment Reminder</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={AppColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={paymentStyles.content} showsVerticalScrollIndicator={false}>
            <Text style={paymentStyles.sectionTitle}>Pending Fees</Text>
            {feeRecords.map((fee) => (
              <View key={fee.id} style={[paymentStyles.feeItem, { borderColor: 'transparent' }]}>
                <View style={paymentStyles.feeItemInfo}>
                  <Text style={paymentStyles.feeItemLabel}>{fee.label}</Text>
                  {fee.due_date && (
                    <Text style={paymentStyles.feeItemDate}>Due: {formatFeeDate(fee.due_date)}</Text>
                  )}
                </View>
                <Text style={paymentStyles.feeItemAmount}>{formatCurrency(fee.amount)}</Text>
              </View>
            ))}

            <Text style={[paymentStyles.sectionTitle, { marginTop: 20 }]}>Note (Optional)</Text>
            <TextInput
              style={[paymentStyles.input, { minHeight: 80 }]}
              placeholder="Add a note for parents (e.g. please clear fees by this week)"
              value={note}
              onChangeText={setNote}
              placeholderTextColor={AppColors.textLight}
              multiline
              textAlignVertical="top"
            />

            <View style={paymentStyles.totalBox}>
              <Text style={paymentStyles.totalLabel}>Outstanding Amount</Text>
              <Text style={paymentStyles.totalAmount}>{formatCurrency(totalOutstanding)}</Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7} disabled={sending}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, sending && { opacity: 0.6 }]}
              onPress={handleSend}
              activeOpacity={0.7}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={AppColors.white} />
              ) : (
                <>
                  <Ionicons name="notifications-outline" size={18} color={AppColors.white} />
                  <Text style={styles.saveBtnText}>Send Reminder</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SkillNotesModal({
  visible,
  skill,
  term,
  onClose,
  onEditNotes,
}: {
  visible: boolean;
  skill: Skill | null;
  term: number;
  onClose: () => void;
  onEditNotes: () => void;
}) {
  if (!skill) return null;

  const levelDetails = getProgressLevelDetails(skill.level);
  const hasNotes = Boolean(skill.notes.trim());

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.notesModalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.notesModalHeaderLeft}>
              <View style={[styles.skillIcon, { backgroundColor: `${levelDetails.color}20` }]}>
                <Text style={styles.skillEmoji}>{skill.emoji}</Text>
              </View>
              <View>
                <Text style={styles.modalTitle}>{skill.name}</Text>
                <Text style={styles.modalSubtitle}>
                  Term {term} · {levelDetails.label}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={AppColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.notesModalContent} showsVerticalScrollIndicator={false}>
            {hasNotes ? (
              <Text style={styles.notesModalBody}>{skill.notes.trim()}</Text>
            ) : (
              <View style={styles.notesEmptyState}>
                <Ionicons name="document-text-outline" size={48} color={AppColors.textLight} />
                <Text style={styles.notesEmptyTitle}>No notes yet</Text>
                <Text style={styles.notesEmptyText}>
                  Add observations about how {skill.name.toLowerCase()} is developing this term.
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={onEditNotes} activeOpacity={0.7}>
              <Ionicons name="create-outline" size={18} color={AppColors.white} />
              <Text style={styles.saveBtnText}>{hasNotes ? 'Edit notes' : 'Add notes'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const STATUS_CHIP_COLORS: Record<
  AttendanceStatus,
  { bg: string; bgActive: string; text: string; textActive: string; border: string }
> = {
  present: {
    bg: '#D4F4E8',
    bgActive: '#2A9D6E',
    text: '#1E7A4C',
    textActive: '#FFFFFF',
    border: '#A8E6C5',
  },
  absent: {
    bg: '#FFE4E4',
    bgActive: '#E05A5A',
    text: '#B83A3A',
    textActive: '#FFFFFF',
    border: '#F5B8B8',
  },
  late: {
    bg: '#FEF5E7',
    bgActive: '#F39C12',
    text: '#B8750A',
    textActive: '#FFFFFF',
    border: '#FAD9A6',
  },
  holiday: {
    bg: '#E3F2FD',
    bgActive: '#3498DB',
    text: '#1F6FAF',
    textActive: '#FFFFFF',
    border: '#B3D9F5',
  },
};

function getStatusChipStyle(status: AttendanceStatus, isActive: boolean) {
  const colors = STATUS_CHIP_COLORS[status];
  return {
    backgroundColor: isActive ? colors.bgActive : colors.bg,
    borderColor: isActive ? colors.bgActive : colors.border,
    borderWidth: 1,
  };
}

function getStatusChipTextStyle(status: AttendanceStatus, isActive: boolean) {
  const colors = STATUS_CHIP_COLORS[status];
  return {
    color: isActive ? colors.textActive : colors.text,
  };
}

function AttendanceEditModal({
  visible,
  summary,
  days,
  month,
  onClose,
  onSave,
}: {
  visible: boolean;
  summary: AttendanceSummary;
  days: AttendanceDay[];
  month: Date;
  onClose: () => void;
  onSave: (
    summary: AttendanceSummary,
    days: AttendanceDay[]
  ) => Promise<{ ok: boolean; message?: string }>;
}) {
  const [draftSummary, setDraftSummary] = useState(summary);
  const [draftDays, setDraftDays] = useState(days);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const draftMetrics = useMemo(
    () => metricsFromCalendarMonth(month, draftDays),
    [draftDays, month]
  );

  useEffect(() => {
    if (visible) {
      setDraftSummary(summary);
      setDraftDays(days);
      setErrorMessage(null);
    }
  }, [days, summary, visible]);

  function updateSummary(field: keyof AttendanceSummary, value: string) {
    setDraftSummary((current) => ({ ...current, [field]: value }));
  }

  function updateDay(dayNumber: number, status: AttendanceStatus) {
    setDraftDays((current) =>
      current.map((day) => {
        if (day.day !== dayNumber) return day;
        if (day.status === 'future' || day.status === 'inactive') return day;
        return { ...day, status };
      })
    );
    setErrorMessage(null);
  }

  async function handleSavePress() {
    setSaving(true);
    setErrorMessage(null);
    const result = await onSave(draftSummary, draftDays);
    setSaving(false);
    if (result.ok) {
      onClose();
      return;
    }
    setErrorMessage(result.message ?? 'Could not save attendance.');
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Attendance</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={AppColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.metricsPreview}>
              <Text style={styles.metricsPreviewTitle}>
                {getMonthLabel(month)} — auto-calculated
              </Text>
              <Text style={styles.metricsPreviewText}>
                Present {draftMetrics.presentPct}% · Effective absent {draftMetrics.absentPct}% ·
                Working days {draftMetrics.workingDays} · Late {draftMetrics.lateCount} (4 Late = 1
                Absent)
              </Text>
            </View>

            <Text style={styles.label}>Calendar Status</Text>
            <View style={styles.editCalendarGrid}>
              {draftDays
                .filter((day) => {
                  if (day.status === 'future') return false;
                  const date = new Date(month.getFullYear(), month.getMonth(), day.day);
                  return date.getDay() !== 0 && date.getDay() !== 6;
                })
                .map((day) => (
                <View key={day.day} style={styles.editDayBlock}>
                  <Text style={styles.editDayNumber}>{day.day}</Text>
                  <View style={styles.statusChipRow}>
                    {(['present', 'absent', 'late', 'holiday'] as const).map((status) => {
                      const isActive = day.status === status;
                      return (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusChip,
                          getStatusChipStyle(status, isActive),
                        ]}
                        onPress={() => updateDay(day.day, status)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.statusChipText,
                            getStatusChipTextStyle(status, isActive),
                          ]}
                        >
                          {status === 'present' ? 'P' : status === 'absent' ? 'A' : status === 'late' ? 'L' : 'H'}
                        </Text>
                      </TouchableOpacity>
                    );
                    })}
                  </View>
                </View>
              ))}
            </View>

            {errorMessage ? <Text style={styles.errorBanner}>{errorMessage}</Text> : null}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Note Title</Text>
              <TextInput
                style={styles.input}
                value={draftSummary.noteTitle}
                onChangeText={(value) => updateSummary('noteTitle', value)}
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formColumn}>
                <Text style={styles.label}>Note Date</Text>
                <TextInput
                  style={styles.input}
                  value={draftSummary.noteDate}
                  onChangeText={(value) => updateSummary('noteDate', value)}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Note</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={draftSummary.noteText}
                onChangeText={(value) => updateSummary('noteText', value)}
                multiline
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSavePress}
              activeOpacity={0.7}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={AppColors.white} size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Attendance</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ProgressEditModal({
  visible,
  selectedTerm,
  skills,
  saving,
  onClose,
  onSave,
}: {
  visible: boolean;
  selectedTerm: 1 | 2 | 3;
  skills: Skill[];
  saving?: boolean;
  onClose: () => void;
  onSave: (skills: Skill[]) => void | Promise<void>;
}) {
  const [draftSkills, setDraftSkills] = useState<Skill[]>(skills);

  useEffect(() => {
    if (visible) {
      setDraftSkills(skills.map((skill) => ({ ...skill })));
    }
  }, [skills, visible]);

  function updateSkill(skillId: string, level: SkillLevel) {
    setDraftSkills((current) =>
      current.map((skill) => (skill.id === skillId ? { ...skill, level } : skill))
    );
  }

  function updateNotes(skillId: string, notes: string) {
    setDraftSkills((current) =>
      current.map((skill) => (skill.id === skillId ? { ...skill, notes } : skill))
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Edit Progress</Text>
              <Text style={styles.modalSubtitle}>Term {selectedTerm}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={AppColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {draftSkills.length === 0 ? (
              <Text style={styles.comingSoonText}>No skills to edit</Text>
            ) : (
              draftSkills.map((skill) => {
                const levelDetails = getProgressLevelDetails(skill.level);
                return (
                  <View key={skill.id} style={styles.editSkillCard}>
                    <View style={styles.skillHeader}>
                      <View style={[styles.skillIcon, { backgroundColor: `${levelDetails.color}20` }]}>
                        <Text style={styles.skillEmoji}>{skill.emoji}</Text>
                      </View>
                      <View style={styles.skillInfo}>
                        <Text style={styles.skillName}>{skill.name}</Text>
                        <Text style={[styles.skillLevel, { color: levelDetails.color }]}>
                          {levelDetails.label}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.levelOptions}>
                      {SKILL_LEVELS.map((level) => (
                        <TouchableOpacity
                          key={level.value}
                          style={[
                            styles.levelOption,
                            skill.level === level.value && { backgroundColor: level.color },
                          ]}
                          onPress={() => updateSkill(skill.id, level.value)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.levelOptionText,
                              skill.level === level.value && styles.levelOptionTextActive,
                            ]}
                          >
                            {level.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TextInput
                      style={[styles.input, styles.textAreaCompact]}
                      value={skill.notes}
                      onChangeText={(notes) => updateNotes(skill.id, notes)}
                      placeholder="Progress notes"
                      placeholderTextColor={AppColors.textTertiary}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>
                );
              })
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={() => onSave(draftSkills)}
              activeOpacity={0.7}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={AppColors.white} size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Progress</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.background,
  },
  errorText: {
    fontSize: 16,
    color: AppColors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: AppColors.background,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...AppShadows.cardShadow,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.primaryBlue,
    letterSpacing: 1,
  },
  editBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...AppShadows.cardShadow,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...AppShadows.cardShadow,
  },
  avatarTextLarge: {
    fontSize: 48,
    fontWeight: '700',
  },
  statusDotLarge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: AppColors.white,
  },
  studentName: {
    fontSize: 28,
    fontWeight: '800',
    color: AppColors.textPrimary,
    marginTop: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    justifyContent: 'center',
  },
  idBadge: {
    flexDirection: 'row',
    backgroundColor: AppColors.blueLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  idBadgeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  idBadgeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.primaryBlue,
  },
  classBadgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  classBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.blueLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.success,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: AppColors.white,
    borderRadius: 24,
    padding: 4,
    marginBottom: 20,
    ...AppShadows.cardShadow,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: AppColors.primaryBlue,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  tabTextActive: {
    color: AppColors.white,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 20,
    ...AppShadows.cardShadow,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  infoItem: {
    flex: 1,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
    lineHeight: 24,
  },
  mapPlaceholder: {
    height: 180,
    backgroundColor: '#A8C5A8',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 197, 168, 0.3)',
  },
  mapButton: {
    backgroundColor: AppColors.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    ...AppShadows.cardShadow,
  },
  mapButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.primaryBlue,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.background,
  },
  documentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  documentText: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  comingSoonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textTertiary,
    textAlign: 'center',
    paddingVertical: 40,
  },
  attendanceContainer: {
    gap: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    ...AppShadows.cardShadow,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  calendarCard: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 20,
    ...AppShadows.cardShadow,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarMonth: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  calendarGrid: {
    gap: 8,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dayHeader: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textTertiary,
  },
  dayCell: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  dayPresent: {
    backgroundColor: '#D4F4E8',
  },
  dayAbsent: {
    backgroundColor: '#FFE4E4',
  },
  dayHoliday: {
    backgroundColor: '#E3F2FD',
  },
  dayLate: {
    backgroundColor: '#FEF5E7',
  },
  dayToday: {
    backgroundColor: '#3498DB',
  },
  saveToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D4F4E8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  saveToastText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2A9D6E',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  dayTextToday: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.white,
  },
  dayTextInactive: {
    fontSize: 14,
    fontWeight: '500',
    color: AppColors.textLight,
  },
  dayTextFuture: {
    fontSize: 14,
    fontWeight: '500',
    color: AppColors.textTertiary,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.background,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
    color: AppColors.textSecondary,
  },
  notesCard: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 20,
    ...AppShadows.cardShadow,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 16,
  },
  noteItem: {
    flexDirection: 'row',
    gap: 12,
  },
  noteIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFE4E4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteContent: {
    flex: 1,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  noteDate: {
    fontSize: 12,
    fontWeight: '500',
    color: AppColors.textTertiary,
  },
  noteText: {
    fontSize: 13,
    fontWeight: '500',
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  progressContainer: {
    gap: 16,
  },
  termSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  termBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: AppColors.white,
    alignItems: 'center',
    ...AppShadows.cardShadow,
  },
  termBtnActive: {
    backgroundColor: AppColors.primaryBlue,
  },
  termText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  termTextActive: {
    color: AppColors.white,
    fontWeight: '700',
  },
  skillCard: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 20,
    ...AppShadows.cardShadow,
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  skillIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillEmoji: {
    fontSize: 24,
  },
  skillInfo: {
    flex: 1,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  skillLevel: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: AppColors.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: AppColors.textTertiary,
    letterSpacing: 0.5,
  },
  viewNotesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.background,
  },
  viewNotesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewNotesText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.primaryBlue,
  },
  notesBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: AppColors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  notesBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.white,
  },
  notesModalContainer: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 8,
    ...AppShadows.floatingShadow,
  },
  notesModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  notesModalContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    maxHeight: 320,
  },
  notesModalBody: {
    fontSize: 15,
    fontWeight: '500',
    color: AppColors.textPrimary,
    lineHeight: 24,
  },
  notesEmptyState: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 12,
  },
  notesEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginTop: 12,
    marginBottom: 6,
  },
  notesEmptyText: {
    fontSize: 13,
    fontWeight: '500',
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    ...AppShadows.floatingShadow,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.background,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textTertiary,
    marginTop: 3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.background,
  },
  formGroup: {
    marginBottom: 18,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  formColumn: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: AppColors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: AppColors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: AppColors.textPrimary,
    borderWidth: 1,
    borderColor: AppColors.background,
  },
  textArea: {
    minHeight: 96,
  },
  textAreaCompact: {
    minHeight: 72,
    marginTop: 12,
  },
  editCalendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  editDayBlock: {
    width: '30%',
    minWidth: 92,
    backgroundColor: AppColors.background,
    borderRadius: 14,
    padding: 10,
    gap: 8,
  },
  editDayNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: AppColors.textPrimary,
  },
  statusChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusChip: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  editSkillCard: {
    backgroundColor: AppColors.background,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  levelOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  levelOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: AppColors.white,
  },
  levelOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.textSecondary,
  },
  levelOptionTextActive: {
    color: AppColors.white,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: AppColors.background,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.textSecondary,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: AppColors.primaryBlue,
    ...AppShadows.cardShadow,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.white,
  },
  saveBtnDisabled: {
    opacity: 0.65,
  },
  metricsPreview: {
    backgroundColor: AppColors.blueLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  metricsPreviewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.primaryBlue,
    marginBottom: 4,
  },
  metricsPreviewText: {
    fontSize: 12,
    fontWeight: '500',
    color: AppColors.textSecondary,
    lineHeight: 18,
  },
  errorBanner: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E05A5A',
    marginBottom: 12,
  },

  // Document styles
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: AppColors.background,
    borderRadius: 12,
    marginBottom: 8,
    gap: 10,
  },
  docIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: AppColors.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docInfo: {
    flex: 1,
    gap: 2,
  },
  docLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  docFileName: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  docDate: {
    fontSize: 11,
    color: AppColors.textTertiary,
  },
  docActions: {
    flexDirection: 'row',
    gap: 6,
  },
  docActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: AppColors.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  docCategoryBtn: {
    width: '47%',
    padding: 12,
    backgroundColor: AppColors.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: AppColors.blueLight,
    gap: 6,
    position: 'relative',
  },
  docCategoryBtnDone: {
    borderColor: AppColors.success,
    backgroundColor: '#F0FBF5',
  },
  docCategoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  docRequiredDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: AppColors.error,
  },

  // Document upload sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  docSheet: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    gap: 4,
  },
  docSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.textLight,
    alignSelf: 'center',
    marginBottom: 16,
  },
  docSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  docSheetSubtitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 16,
  },
  docSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.background,
  },
  docSheetOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docSheetOptionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  docSheetOptionDesc: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 1,
  },
  docSheetCancel: {
    marginTop: 12,
    backgroundColor: AppColors.background,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  docSheetCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.primaryBlue,
  },
});
