import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
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

export default function EditStudentModal({
  visible,
  student,
  onClose,
  onSuccess,
}: EditStudentModalProps) {
  const [fullName, setFullName] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  // Initialize form when student changes
  React.useEffect(() => {
    if (student) {
      setFullName(student.full_name);
      setSelectedClass(student.class);
      setRollNumber(student.roll_number || '');
      setDateOfBirth(student.date_of_birth || '');
      setGender(student.gender || '');
      setStatus(student.status);
    }
  }, [student]);

  const handleSave = async () => {
    // Validation
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Please enter student name');
      return;
    }

    if (!selectedClass) {
      Alert.alert('Validation Error', 'Please select a class');
      return;
    }

    // Validate date format if provided (YYYY-MM-DD)
    if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      Alert.alert(
        'Validation Error',
        'Please enter date in YYYY-MM-DD format (e.g., 2020-05-15)'
      );
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
          gender: gender || null,
          status: status,
        })
        .eq('id', student?.id);

      if (error) throw error;

      Alert.alert('Success', 'Student updated successfully', [
        {
          text: 'OK',
          onPress: () => {
            onSuccess();
            onClose();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error updating student:', error);
      Alert.alert('Error', error.message || 'Failed to update student');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  if (!student) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Student</Text>
            <TouchableOpacity
              onPress={handleClose}
              disabled={saving}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={AppColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Full Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Full Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter full name"
                placeholderTextColor={AppColors.textTertiary}
                editable={!saving}
              />
            </View>

            {/* Class Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Class <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.optionsRow}>
                {CLASS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionBtn,
                      selectedClass === option.value && styles.optionBtnActive,
                    ]}
                    onPress={() => setSelectedClass(option.value)}
                    disabled={saving}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedClass === option.value && styles.optionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Roll Number */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Roll Number</Text>
              <TextInput
                style={styles.input}
                value={rollNumber}
                onChangeText={setRollNumber}
                placeholder="Enter roll number"
                placeholderTextColor={AppColors.textTertiary}
                editable={!saving}
              />
            </View>

            {/* Date of Birth */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Date of Birth</Text>
              <TextInput
                style={styles.input}
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                placeholder="YYYY-MM-DD (e.g., 2020-05-15)"
                placeholderTextColor={AppColors.textTertiary}
                editable={!saving}
              />
              <Text style={styles.helperText}>Format: YYYY-MM-DD</Text>
            </View>

            {/* Gender */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.optionsRow}>
                {GENDER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionBtn,
                      gender === option.value && styles.optionBtnActive,
                    ]}
                    onPress={() => setGender(option.value)}
                    disabled={saving}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        gender === option.value && styles.optionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Status */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.optionsRow}>
                {STATUS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionBtn,
                      status === option.value && styles.optionBtnActive,
                    ]}
                    onPress={() => setStatus(option.value)}
                    disabled={saving}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        status === option.value && styles.optionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleClose}
              disabled={saving}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.7}
            >
              {saving ? (
                <ActivityIndicator size="small" color={AppColors.white} />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 8,
  },
  required: {
    color: '#E05A5A',
  },
  input: {
    backgroundColor: AppColors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: AppColors.textPrimary,
    borderWidth: 1,
    borderColor: AppColors.background,
  },
  helperText: {
    fontSize: 12,
    color: AppColors.textTertiary,
    marginTop: 6,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: AppColors.background,
    borderWidth: 1,
    borderColor: AppColors.background,
  },
  optionBtnActive: {
    backgroundColor: AppColors.primaryBlue,
    borderColor: AppColors.primaryBlue,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  optionTextActive: {
    color: AppColors.white,
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.background,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: AppColors.background,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textSecondary,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: AppColors.primaryBlue,
    alignItems: 'center',
    ...AppShadows.cardShadow,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.white,
  },
});
