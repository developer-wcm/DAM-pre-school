import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DEFAULT_SCHOOL_ID } from '../../constants/school';
import { useAuth } from '../../context/auth';
import { supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadTab = 'students' | 'teachers';

interface StudentRow {
  roll_number: string;
  full_name: string;
  class: string;
  section?: string;
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
}

interface TeacherRow {
  employee_id: string;
  full_name: string;
  role: string;
  subject?: string;
  email?: string;
  phone?: string;
}

interface PreviewResult {
  students?: StudentRow[];
  teachers?: TeacherRow[];
  errors: string[];
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function parseCSV(text: string): string[][] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) =>
      line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''))
    );
}

function parseStudentsCSV(text: string): PreviewResult {
  const rows  = parseCSV(text);
  const errors: string[] = [];

  if (rows.length < 2) {
    return { errors: ['CSV file is empty or has no data rows.'] };
  }

  const headers = rows[0].map((h) => h.toLowerCase().replace(/\s/g, '_'));
  const required = ['roll_number', 'full_name', 'class'];
  const missing  = required.filter((r) => !headers.includes(r));
  if (missing.length > 0) {
    return { errors: [`Missing required columns: ${missing.join(', ')}`] };
  }

  const students: StudentRow[] = [];
  rows.slice(1).forEach((row, i) => {
    const get = (key: string) => row[headers.indexOf(key)]?.trim() ?? '';
    const roll = get('roll_number');
    const name = get('full_name');
    const cls  = get('class');

    if (!roll || !name || !cls) {
      errors.push(`Row ${i + 2}: missing roll_number, full_name or class`);
      return;
    }

    students.push({
      roll_number:   roll,
      full_name:     name,
      class:         cls,
      section:       get('section')       || undefined,
      parent_name:   get('parent_name')   || undefined,
      parent_email:  get('parent_email')  || undefined,
      parent_phone:  get('parent_phone')  || undefined,
    });
  });

  return { students, errors };
}

function parseTeachersCSV(text: string): PreviewResult {
  const rows  = parseCSV(text);
  const errors: string[] = [];

  if (rows.length < 2) {
    return { errors: ['CSV file is empty or has no data rows.'] };
  }

  const headers = rows[0].map((h) => h.toLowerCase().replace(/\s/g, '_'));
  const required = ['employee_id', 'full_name', 'role'];
  const missing  = required.filter((r) => !headers.includes(r));
  if (missing.length > 0) {
    return { errors: [`Missing required columns: ${missing.join(', ')}`] };
  }

  const teachers: TeacherRow[] = [];
  rows.slice(1).forEach((row, i) => {
    const get = (key: string) => row[headers.indexOf(key)]?.trim() ?? '';
    const empId = get('employee_id');
    const name  = get('full_name');
    const role  = get('role');

    if (!empId || !name || !role) {
      errors.push(`Row ${i + 2}: missing employee_id, full_name or role`);
      return;
    }

    teachers.push({
      employee_id: empId,
      full_name:   name,
      role:        role.toLowerCase(),
      subject:     get('subject') || undefined,
      email:       get('email')   || undefined,
      phone:       get('phone')   || undefined,
    });
  });

  return { teachers, errors };
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CSVUploadScreen() {
  const router   = useRouter();
  const { profile } = useAuth();
  const schoolId = profile?.school_id ?? DEFAULT_SCHOOL_ID;

  const [tab, setTab]           = useState<UploadTab>('students');
  const [preview, setPreview]   = useState<PreviewResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone]         = useState(false);

  // ── Pick & parse CSV ───────────────────────────────────────────────────────

  async function handlePickFile() {
    setPreview(null);
    setFileName(null);
    setDone(false);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      const asset = result.assets[0];
      setFileName(asset.name);

      const text = await FileSystem.readAsStringAsync(asset.uri);
      const parsed = tab === 'students'
        ? parseStudentsCSV(text)
        : parseTeachersCSV(text);

      setPreview(parsed);
    } catch (e) {
      Alert.alert('Error', 'Could not read file. Please try again.');
    }
  }

  // ── Save to Supabase ───────────────────────────────────────────────────────

  async function handleSave() {
    if (!preview) return;

    setUploading(true);

    try {
      if (tab === 'students' && preview.students) {
        const rows = preview.students.map((s) => ({
          school_id:    schoolId,
          roll_number:  s.roll_number,
          full_name:    s.full_name,
          class:        s.class,
          section:      s.section ?? null,
          parent_email: s.parent_email ?? null,
          parent_phone: s.parent_phone ?? null,
        }));

        const { error } = await supabase
          .from('students')
          .upsert(rows, { onConflict: 'roll_number' });

        if (error) throw error;
      }

      if (tab === 'teachers' && preview.teachers) {
        for (const t of preview.teachers) {
          const { error } = await supabase
            .from('profiles')
            .update({ employee_id: t.employee_id })
            .eq('full_name', t.full_name)
            .eq('school_id', schoolId);

          // If no profile found yet, store for later linking
          if (error) console.warn('Could not update profile for', t.full_name);
        }
      }

      setUploading(false);
      setDone(true);
    } catch (e: any) {
      setUploading(false);
      Alert.alert('Upload Failed', e.message ?? 'Please try again.');
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.navigate('/(dashboard)/more')} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Upload Data</Text>
          <Text style={styles.headerSub}>Import via CSV file</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(['students', 'teachers'] as UploadTab[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => { setTab(t); setPreview(null); setFileName(null); setDone(false); }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={t === 'students' ? 'people-outline' : 'school-outline'}
                size={16}
                color={tab === t ? '#FFFFFF' : '#7A7A9D'}
              />
              <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
                {t === 'students' ? 'Students' : 'Teachers'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Template info */}
        <View style={styles.templateCard}>
          <Ionicons name="document-text-outline" size={20} color="#7B6FE8" />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.templateTitle}>
              Required CSV Columns — {tab === 'students' ? 'Students' : 'Teachers'}
            </Text>
            {tab === 'students' ? (
              <Text style={styles.templateCols}>
                roll_number*, full_name*, class*, section, parent_name, parent_email, parent_phone
              </Text>
            ) : (
              <Text style={styles.templateCols}>
                employee_id*, full_name*, role*, subject, email, phone
              </Text>
            )}
            <Text style={styles.templateNote}>* required columns</Text>
          </View>
        </View>

        {/* Example row */}
        <View style={styles.exampleCard}>
          <Text style={styles.exampleTitle}>Example Row</Text>
          {tab === 'students' ? (
            <Text style={styles.exampleText}>
              DAM-001, Arjun Kumar, LKG, A, Rekha Kumar, rekha@gmail.com, 9876543210
            </Text>
          ) : (
            <Text style={styles.exampleText}>
              EMP-T-001, Moksha, teacher, English, moksha@gmail.com, 9876543212
            </Text>
          )}
        </View>

        {/* Pick file button */}
        {!done && (
          <TouchableOpacity style={styles.pickBtn} onPress={handlePickFile} activeOpacity={0.85}>
            <Ionicons name="cloud-upload-outline" size={22} color="#7B6FE8" />
            <Text style={styles.pickBtnText}>
              {fileName ? `Change File` : `Choose CSV File`}
            </Text>
          </TouchableOpacity>
        )}

        {fileName && !done && (
          <View style={styles.fileRow}>
            <Ionicons name="document-outline" size={18} color="#2A9D6E" />
            <Text style={styles.fileName} numberOfLines={1}>{fileName}</Text>
          </View>
        )}

        {/* Errors */}
        {preview?.errors && preview.errors.length > 0 && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>⚠️ Issues Found</Text>
            {preview.errors.map((e, i) => (
              <Text key={i} style={styles.errorText}>• {e}</Text>
            ))}
          </View>
        )}

        {/* Preview */}
        {preview && (tab === 'students' ? preview.students : preview.teachers) && !done && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>
              Preview — {tab === 'students'
                ? `${preview.students?.length} students`
                : `${preview.teachers?.length} teachers`}
            </Text>

            {tab === 'students' && preview.students?.slice(0, 5).map((s, i) => (
              <View key={i} style={styles.previewRow}>
                <View style={styles.previewBadge}>
                  <Text style={styles.previewBadgeText}>{s.roll_number}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.previewName}>{s.full_name}</Text>
                  <Text style={styles.previewMeta}>
                    {s.class}{s.section ? `-${s.section}` : ''}
                    {s.parent_email ? ` · ${s.parent_email}` : ''}
                  </Text>
                </View>
              </View>
            ))}

            {tab === 'teachers' && preview.teachers?.slice(0, 5).map((t, i) => (
              <View key={i} style={styles.previewRow}>
                <View style={[styles.previewBadge, { backgroundColor: '#D4F4E8' }]}>
                  <Text style={[styles.previewBadgeText, { color: '#2A9D6E' }]}>{t.employee_id}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.previewName}>{t.full_name}</Text>
                  <Text style={styles.previewMeta}>
                    {t.role}{t.subject ? ` · ${t.subject}` : ''}
                    {t.email ? ` · ${t.email}` : ''}
                  </Text>
                </View>
              </View>
            ))}

            {((tab === 'students' && (preview.students?.length ?? 0) > 5) ||
              (tab === 'teachers' && (preview.teachers?.length ?? 0) > 5)) && (
              <Text style={styles.moreText}>
                + {(tab === 'students' ? preview.students!.length : preview.teachers!.length) - 5} more rows
              </Text>
            )}

            {/* Save button */}
            <TouchableOpacity
              style={[styles.saveBtn, uploading && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={uploading}
              activeOpacity={0.85}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>
                    Save {tab === 'students' ? 'Students' : 'Teachers'} to Database
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Success */}
        {done && (
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={48} color="#2A9D6E" />
            <Text style={styles.successTitle}>Upload Successful!</Text>
            <Text style={styles.successText}>
              {tab === 'students'
                ? `${preview?.students?.length} students saved to database.`
                : `${preview?.teachers?.length} teachers updated.`}
            </Text>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => { setDone(false); setPreview(null); setFileName(null); }}
              activeOpacity={0.8}
            >
              <Text style={styles.doneBtnText}>Upload More</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F5F9' },

  header: {
    backgroundColor: '#0F1869',
    paddingTop: 54, paddingBottom: 16, paddingHorizontal: 18,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.13)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 19, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  scrollContent: { padding: 16, gap: 14 },

  tabRow: { flexDirection: 'row', gap: 10 },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 2, borderColor: 'transparent',
  },
  tabBtnActive: { backgroundColor: '#0F1869', borderColor: '#0F1869' },
  tabBtnText: { fontSize: 14, fontWeight: '700', color: '#7A7A9D' },
  tabBtnTextActive: { color: '#FFFFFF' },

  templateCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    borderLeftWidth: 4, borderLeftColor: '#7B6FE8',
  },
  templateTitle: { fontSize: 13, fontWeight: '800', color: '#1A1A2E' },
  templateCols: { fontSize: 12, color: '#5A5A7A', lineHeight: 18, fontFamily: 'monospace' },
  templateNote: { fontSize: 11, color: '#9A9AB0', fontStyle: 'italic' },

  exampleCard: {
    backgroundColor: '#F0F0F8', borderRadius: 14, padding: 14, gap: 6,
  },
  exampleTitle: { fontSize: 12, fontWeight: '700', color: '#7A7A9D' },
  exampleText: { fontSize: 12, color: '#3A3A5A', fontFamily: 'monospace', lineHeight: 18 },

  pickBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#FFFFFF', borderRadius: 16,
    paddingVertical: 18, borderWidth: 2, borderColor: '#7B6FE8',
    borderStyle: 'dashed',
  },
  pickBtnText: { fontSize: 15, fontWeight: '700', color: '#7B6FE8' },

  fileRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#D4F4E8', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  fileName: { flex: 1, fontSize: 13, fontWeight: '600', color: '#2A9D6E' },

  errorCard: {
    backgroundColor: '#FFF5F5', borderRadius: 14, padding: 14,
    borderLeftWidth: 4, borderLeftColor: '#E05A5A', gap: 6,
  },
  errorTitle: { fontSize: 14, fontWeight: '800', color: '#E05A5A' },
  errorText: { fontSize: 13, color: '#C04040' },

  previewCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  previewTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A2E', marginBottom: 4 },
  previewRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F4F5F9',
  },
  previewBadge: {
    backgroundColor: '#E8E4F8', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  previewBadgeText: { fontSize: 11, fontWeight: '700', color: '#7B6FE8' },
  previewName: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  previewMeta: { fontSize: 12, color: '#9A9AB0', marginTop: 2 },
  moreText: { fontSize: 13, color: '#9A9AB0', textAlign: 'center', fontStyle: 'italic' },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#2A9D6E', borderRadius: 14,
    paddingVertical: 16, marginTop: 4,
  },
  saveBtnDisabled: { backgroundColor: '#9A9AB0' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  successCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 32,
    alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A2E' },
  successText: { fontSize: 14, color: '#7A7A9D', textAlign: 'center' },
  doneBtn: {
    backgroundColor: '#E8E4F8', borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 12, marginTop: 8,
  },
  doneBtnText: { fontSize: 14, fontWeight: '700', color: '#7B6FE8' },
});
