import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppColors, AppShadows } from '../constants/theme';
import { supabase } from '../lib/supabase';

interface StudentData {
  id: string;
  full_name: string;
  class: string;
  roll_number: string | null;
  date_of_birth: string | null;
  gender: string | null;
  status: string;
  admission_date: string | null;
  mother_tongue: string | null;
  nationality: string | null;
  aadhaar_last4: string | null;
  address: string | null;
  father_name: string | null;
  father_phone: string | null;
  father_email: string | null;
  father_occupation: string | null;
  father_work_location: string | null;
  mother_name: string | null;
  mother_phone: string | null;
  mother_email: string | null;
  mother_occupation: string | null;
  mother_work_location: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_relation: string | null;
}

interface EditStudentModalProps {
  visible: boolean;
  student: StudentData | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CLASS_OPTIONS = [
  { value: 'PG', label: 'Play Group' },
  { value: 'PKG', label: 'Pre-KG' },
  { value: 'JKG', label: 'Junior KG' },
  { value: 'SKG', label: 'Senior KG' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

type Section = 'personal' | 'academic' | 'father' | 'mother' | 'guardian';

const SECTIONS: { key: Section; label: string; icon: string }[] = [
  { key: 'personal', label: 'Personal', icon: 'person-outline' },
  { key: 'academic', label: 'Academic', icon: 'school-outline' },
  { key: 'father', label: "Father", icon: 'man-outline' },
  { key: 'mother', label: 'Mother', icon: 'woman-outline' },
  { key: 'guardian', label: 'Guardian', icon: 'people-outline' },
];

export default function EditStudentModal({
  visible,
  student,
  onClose,
  onSuccess,
}: EditStudentModalProps) {
  const [activeSection, setActiveSection] = useState<Section>('personal');
  const [saving, setSaving] = useState(false);

  // Personal
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [motherTongue, setMotherTongue] = useState('');
  const [nationality, setNationality] = useState('');
  const [aadhaarLast4, setAadhaarLast4] = useState('');
  const [address, setAddress] = useState('');

  // Academic
  const [selectedClass, setSelectedClass] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');
  const [status, setStatus] = useState('');

  // Father
  const [fatherName, setFatherName] = useState('');
  const [fatherPhone, setFatherPhone] = useState('');
  const [fatherEmail, setFatherEmail] = useState('');
  const [fatherOccupation, setFatherOccupation] = useState('');
  const [fatherWorkLocation, setFatherWorkLocation] = useState('');

  // Mother
  const [motherName, setMotherName] = useState('');
  const [motherPhone, setMotherPhone] = useState('');
  const [motherEmail, setMotherEmail] = useState('');
  const [motherOccupation, setMotherOccupation] = useState('');
  const [motherWorkLocation, setMotherWorkLocation] = useState('');

  // Guardian
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('');

  useEffect(() => {
    if (student && visible) {
      setFullName(student.full_name ?? '');
      setGender(student.gender ?? '');
      setDateOfBirth(student.date_of_birth ?? '');
      setMotherTongue(student.mother_tongue ?? '');
      setNationality(student.nationality ?? '');
      setAadhaarLast4(student.aadhaar_last4 ?? '');
      setAddress(student.address ?? '');

      setSelectedClass(student.class ?? '');
      setRollNumber(student.roll_number ?? '');
      setAdmissionDate(student.admission_date ?? '');
      setStatus(student.status ?? 'active');

      setFatherName(student.father_name ?? '');
      setFatherPhone(student.father_phone ?? '');
      setFatherEmail(student.father_email ?? '');
      setFatherOccupation(student.father_occupation ?? '');
      setFatherWorkLocation(student.father_work_location ?? '');

      setMotherName(student.mother_name ?? '');
      setMotherPhone(student.mother_phone ?? '');
      setMotherEmail(student.mother_email ?? '');
      setMotherOccupation(student.mother_occupation ?? '');
      setMotherWorkLocation(student.mother_work_location ?? '');

      setGuardianName(student.guardian_name ?? '');
      setGuardianPhone(student.guardian_phone ?? '');
      setGuardianRelation(student.guardian_relation ?? '');

      setActiveSection('personal');
    }
  }, [student, visible]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Please enter student name');
      return;
    }
    if (!selectedClass) {
      Alert.alert('Validation Error', 'Please select a class');
      return;
    }
    if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      Alert.alert('Validation Error', 'Date of birth must be in YYYY-MM-DD format');
      return;
    }
    if (admissionDate && !/^\d{4}-\d{2}-\d{2}$/.test(admissionDate)) {
      Alert.alert('Validation Error', 'Admission date must be in YYYY-MM-DD format');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({
          full_name: fullName.trim(),
          class: selectedClass,
          roll_number: rollNumber.trim() || null,
          date_of_birth: dateOfBirth || null,
          admission_date: admissionDate || null,
          gender: gender || null,
          status,
          mother_tongue: motherTongue.trim() || null,
          nationality: nationality.trim() || null,
          aadhaar_last4: aadhaarLast4.trim() || null,
          address: address.trim() || null,
          father_name: fatherName.trim() || null,
          father_phone: fatherPhone.trim() || null,
          father_email: fatherEmail.trim() || null,
          father_occupation: fatherOccupation.trim() || null,
          father_work_location: fatherWorkLocation.trim() || null,
          mother_name: motherName.trim() || null,
          mother_phone: motherPhone.trim() || null,
          mother_email: motherEmail.trim() || null,
          mother_occupation: motherOccupation.trim() || null,
          mother_work_location: motherWorkLocation.trim() || null,
          guardian_name: guardianName.trim() || null,
          guardian_phone: guardianPhone.trim() || null,
          guardian_relation: guardianRelation.trim() || null,
        })
        .eq('id', student?.id);

      if (error) throw error;

      Alert.alert('Saved', 'Student details updated successfully', [
        { text: 'OK', onPress: () => { onSuccess(); onClose(); } },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update student');
    } finally {
      setSaving(false);
    }
  };

  if (!student) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => !saving && onClose()}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Edit Student Info</Text>
              <Text style={styles.subtitle}>{student.full_name}</Text>
            </View>
            <TouchableOpacity
              onPress={() => !saving && onClose()}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={AppColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Section Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsScroll}
            contentContainerStyle={styles.tabsContent}
          >
            {SECTIONS.map((s) => (
              <TouchableOpacity
                key={s.key}
                style={[styles.tab, activeSection === s.key && styles.tabActive]}
                onPress={() => setActiveSection(s.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={s.icon as any}
                  size={16}
                  color={activeSection === s.key ? AppColors.white : AppColors.textSecondary}
                />
                <Text style={[styles.tabText, activeSection === s.key && styles.tabTextActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Form Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* ── Personal ── */}
            {activeSection === 'personal' && (
              <View style={styles.section}>
                <Field label="Full Name" required>
                  <TextInput style={styles.input} value={fullName} onChangeText={setFullName}
                    placeholder="Enter full name" placeholderTextColor={AppColors.textTertiary} editable={!saving} />
                </Field>
                <Row>
                  <Field label="Date of Birth" hint="YYYY-MM-DD" flex>
                    <TextInput style={styles.input} value={dateOfBirth} onChangeText={setDateOfBirth}
                      placeholder="2020-01-15" placeholderTextColor={AppColors.textTertiary} editable={!saving} />
                  </Field>
                </Row>
                <Field label="Gender">
                  <OptionPicker options={GENDER_OPTIONS} value={gender} onChange={setGender} disabled={saving} />
                </Field>
                <Row>
                  <Field label="Mother Tongue" flex>
                    <TextInput style={styles.input} value={motherTongue} onChangeText={setMotherTongue}
                      placeholder="e.g. Hindi" placeholderTextColor={AppColors.textTertiary} editable={!saving} />
                  </Field>
                  <Field label="Nationality" flex>
                    <TextInput style={styles.input} value={nationality} onChangeText={setNationality}
                      placeholder="e.g. Indian" placeholderTextColor={AppColors.textTertiary} editable={!saving} />
                  </Field>
                </Row>
                <Field label="Aadhaar (Last 4 digits)">
                  <TextInput style={styles.input} value={aadhaarLast4} onChangeText={setAadhaarLast4}
                    placeholder="1234" placeholderTextColor={AppColors.textTertiary}
                    keyboardType="numeric" maxLength={4} editable={!saving} />
                </Field>
                <Field label="Address">
                  <TextInput style={[styles.input, styles.textArea]} value={address} onChangeText={setAddress}
                    placeholder="Full address" placeholderTextColor={AppColors.textTertiary}
                    multiline textAlignVertical="top" editable={!saving} />
                </Field>
              </View>
            )}

            {/* ── Academic ── */}
            {activeSection === 'academic' && (
              <View style={styles.section}>
                <Field label="Class" required>
                  <OptionPicker options={CLASS_OPTIONS} value={selectedClass} onChange={setSelectedClass} disabled={saving} />
                </Field>
                <Row>
                  <Field label="Roll Number" flex>
                    <TextInput style={styles.input} value={rollNumber} onChangeText={setRollNumber}
                      placeholder="e.g. PG-01" placeholderTextColor={AppColors.textTertiary} editable={!saving} />
                  </Field>
                  <Field label="Admission Date" hint="YYYY-MM-DD" flex>
                    <TextInput style={styles.input} value={admissionDate} onChangeText={setAdmissionDate}
                      placeholder="2024-06-01" placeholderTextColor={AppColors.textTertiary} editable={!saving} />
                  </Field>
                </Row>
                <Field label="Status">
                  <OptionPicker options={STATUS_OPTIONS} value={status} onChange={setStatus} disabled={saving} />
                </Field>
              </View>
            )}

            {/* ── Father ── */}
            {activeSection === 'father' && (
              <View style={styles.section}>
                <Field label="Full Name">
                  <TextInput style={styles.input} value={fatherName} onChangeText={setFatherName}
                    placeholder="Father's full name" placeholderTextColor={AppColors.textTertiary} editable={!saving} />
                </Field>
                <Row>
                  <Field label="Phone Number" flex>
                    <TextInput style={styles.input} value={fatherPhone} onChangeText={setFatherPhone}
                      placeholder="+91 98765 43210" placeholderTextColor={AppColors.textTertiary}
                      keyboardType="phone-pad" editable={!saving} />
                  </Field>
                  <Field label="Email" flex>
                    <TextInput style={styles.input} value={fatherEmail} onChangeText={setFatherEmail}
                      placeholder="father@email.com" placeholderTextColor={AppColors.textTertiary}
                      keyboardType="email-address" autoCapitalize="none" editable={!saving} />
                  </Field>
                </Row>
                <Row>
                  <Field label="Occupation" flex>
                    <TextInput style={styles.input} value={fatherOccupation} onChangeText={setFatherOccupation}
                      placeholder="e.g. Engineer" placeholderTextColor={AppColors.textTertiary} editable={!saving} />
                  </Field>
                  <Field label="Work Location" flex>
                    <TextInput style={styles.input} value={fatherWorkLocation} onChangeText={setFatherWorkLocation}
                      placeholder="e.g. Bangalore" placeholderTextColor={AppColors.textTertiary} editable={!saving} />
                  </Field>
                </Row>
              </View>
            )}

            {/* ── Mother ── */}
            {activeSection === 'mother' && (
              <View style={styles.section}>
                <Field label="Full Name">
                  <TextInput style={styles.input} value={motherName} onChangeText={setMotherName}
                    placeholder="Mother's full name" placeholderTextColor={AppColors.textTertiary} editable={!saving} />
                </Field>
                <Row>
                  <Field label="Phone Number" flex>
                    <TextInput style={styles.input} value={motherPhone} onChangeText={setMotherPhone}
                      placeholder="+91 98765 43211" placeholderTextColor={AppColors.textTertiary}
                      keyboardType="phone-pad" editable={!saving} />
                  </Field>
                  <Field label="Email" flex>
                    <TextInput style={styles.input} value={motherEmail} onChangeText={setMotherEmail}
                      placeholder="mother@email.com" placeholderTextColor={AppColors.textTertiary}
                      keyboardType="email-address" autoCapitalize="none" editable={!saving} />
                  </Field>
                </Row>
                <Row>
                  <Field label="Occupation" flex>
                    <TextInput style={styles.input} value={motherOccupation} onChangeText={setMotherOccupation}
                      placeholder="e.g. Teacher" placeholderTextColor={AppColors.textTertiary} editable={!saving} />
                  </Field>
                  <Field label="Work Location" flex>
                    <TextInput style={styles.input} value={motherWorkLocation} onChangeText={setMotherWorkLocation}
                      placeholder="e.g. Bangalore" placeholderTextColor={AppColors.textTertiary} editable={!saving} />
                  </Field>
                </Row>
              </View>
            )}

            {/* ── Guardian ── */}
            {activeSection === 'guardian' && (
              <View style={styles.section}>
                <Field label="Full Name">
                  <TextInput style={styles.input} value={guardianName} onChangeText={setGuardianName}
                    placeholder="Guardian's full name" placeholderTextColor={AppColors.textTertiary} editable={!saving} />
                </Field>
                <Row>
                  <Field label="Phone Number" flex>
                    <TextInput style={styles.input} value={guardianPhone} onChangeText={setGuardianPhone}
                      placeholder="+91 98765 00000" placeholderTextColor={AppColors.textTertiary}
                      keyboardType="phone-pad" editable={!saving} />
                  </Field>
                  <Field label="Relation" flex>
                    <TextInput style={styles.input} value={guardianRelation} onChangeText={setGuardianRelation}
                      placeholder="e.g. Uncle" placeholderTextColor={AppColors.textTertiary} editable={!saving} />
                  </Field>
                </Row>
              </View>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => !saving && onClose()} activeOpacity={0.7} disabled={saving}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} activeOpacity={0.7} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={AppColors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color={AppColors.gold} />
                  <Text style={styles.saveText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Small helper components ──────────────────────────────────────────────────

function Field({
  label,
  required,
  hint,
  flex,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  flex?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={[fieldStyles.wrap, flex && { flex: 1 }]}>
      <Text style={fieldStyles.label}>
        {label}
        {required ? <Text style={fieldStyles.required}> *</Text> : null}
        {hint ? <Text style={fieldStyles.hint}>  {hint}</Text> : null}
      </Text>
      {children}
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={fieldStyles.row}>{children}</View>;
}

function OptionPicker({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <View style={fieldStyles.optionsRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          style={[fieldStyles.optionBtn, value === opt.value && fieldStyles.optionBtnActive]}
          onPress={() => onChange(opt.value)}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text style={[fieldStyles.optionText, value === opt.value && fieldStyles.optionTextActive]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: 18 },
  row: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '700', color: AppColors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  required: { color: '#E05A5A' },
  hint: { fontSize: 11, fontWeight: '400', color: AppColors.textTertiary, textTransform: 'none' },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: AppColors.background, borderWidth: 1.5, borderColor: AppColors.blueLight },
  optionBtnActive: { backgroundColor: AppColors.primaryBlue, borderColor: AppColors.primaryBlue },
  optionText: { fontSize: 13, fontWeight: '600', color: AppColors.textSecondary },
  optionTextActive: { color: AppColors.white, fontWeight: '700' },
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,30,50,0.55)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '93%',
    ...AppShadows.floatingShadow,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.blueLight,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsScroll: {
    maxHeight: 64,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.blueLight,
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: AppColors.background,
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
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    gap: 0,
  },
  input: {
    backgroundColor: AppColors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: AppColors.textPrimary,
    borderWidth: 1.5,
    borderColor: AppColors.blueLight,
  },
  textArea: {
    minHeight: 90,
    paddingTop: 12,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.blueLight,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: AppColors.background,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.textSecondary,
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: AppColors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...AppShadows.floatingShadow,
  },
  saveText: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.white,
  },
});
