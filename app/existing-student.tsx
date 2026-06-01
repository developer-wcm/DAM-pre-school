import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../constants/admissionTheme';

export default function ExistingStudentScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    parentPhone: '',
    dateOfBirth: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return formData.studentId.length > 0 && 
           formData.studentName.length > 0 && 
           formData.parentPhone.length >= 10 &&
           formData.dateOfBirth.length > 0;
  };

  const handleVerify = () => {
    if (!isFormValid()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    // Simulate verification process - navigate to account pending
    Alert.alert(
      'Details Submitted!',
      'Your information has been submitted for verification. Please wait for admin approval.',
      [
        {
          text: 'Continue',
          onPress: () => router.push('/account-pending')
        }
      ]
    );
  };

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Existing Student</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.illustrationWrapper}>
            <LinearGradient colors={[COLORS.secondary, COLORS.primary]} style={styles.illustrationBox}>
              <Ionicons name="school" size={52} color={COLORS.white} />
            </LinearGradient>
          </View>

          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>
            Enter your details to access your{'\n'}child's dashboard and school information.
          </Text>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Student ID */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Student ID *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., PS-2025-001"
                value={formData.studentId}
                onChangeText={(text) => handleInputChange('studentId', text.toUpperCase())}
                autoCapitalize="characters"
                placeholderTextColor={COLORS.gray}
              />
            </View>

            {/* Student Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Student Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Priya Kumar"
                value={formData.studentName}
                onChangeText={(text) => handleInputChange('studentName', text)}
                autoCapitalize="words"
                placeholderTextColor={COLORS.gray}
              />
            </View>

            {/* Parent Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Parent Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., +91 98765 43210"
                value={formData.parentPhone}
                onChangeText={(text) => handleInputChange('parentPhone', text)}
                keyboardType="phone-pad"
                placeholderTextColor={COLORS.gray}
              />
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date of Birth *</Text>
              <TextInput
                style={styles.input}
                placeholder="DD/MM/YYYY"
                value={formData.dateOfBirth}
                onChangeText={(text) => handleInputChange('dateOfBirth', text)}
                keyboardType="numeric"
                placeholderTextColor={COLORS.gray}
              />
            </View>
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            activeOpacity={isFormValid() ? 0.85 : 1}
            style={{ width: '100%' }}
            onPress={handleVerify}
          >
            <LinearGradient
              colors={isFormValid() ? [COLORS.primary, COLORS.primaryLight] : [COLORS.buttonDisabled, COLORS.buttonDisabled]}
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0 }}
              style={styles.verifyButton}
            >
              <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
              <Text style={styles.verifyButtonText}>Verify & Continue</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Help Text */}
          <View style={styles.helpSection}>
            <Text style={styles.helpText}>
              Can't find your details?{' '}
              <Text style={styles.helpLink}>Contact school admin</Text>
            </Text>
            
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.newAdmissionBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/(dashboard)/admission/step-1')}
            >
              <View style={styles.newAdmissionIcon}>
                <Ionicons name="person-add-outline" size={20} color={COLORS.secondary} />
              </View>
              <Text style={styles.newAdmissionText}>Apply for New Admission</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
  },
  headerSpacer: { width: 40 },

  // Content
  content: { 
    flex: 1, 
    alignItems: 'center', 
    paddingHorizontal: 28,
    paddingTop: 20,
    gap: 20 
  },

  // Illustration
  illustrationWrapper: {
    borderRadius: 28,
    padding: 5,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 8,
  },
  illustrationBox: {
    width: 100,
    height: 100,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Text
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: COLORS.textPrimary, 
    letterSpacing: -0.5 
  },
  subtitle: { 
    fontSize: 15, 
    color: COLORS.textSecondary, 
    textAlign: 'center', 
    lineHeight: 23 
  },

  // Form
  formContainer: {
    width: '100%',
    gap: 16,
    marginTop: 8,
  },
  inputGroup: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },

  // Verify Button
  verifyButton: {
    width: '100%',
    borderRadius: 50,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  verifyButtonText: { 
    color: COLORS.white, 
    fontSize: 17, 
    fontWeight: '700', 
    letterSpacing: 0.3 
  },

  // Help Section
  helpSection: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
  },
  helpText: { 
    fontSize: 13, 
    color: COLORS.textSecondary, 
    textAlign: 'center' 
  },
  helpLink: { 
    color: COLORS.primary, 
    fontWeight: '600', 
    textDecorationLine: 'underline' 
  },

  // Divider
  divider: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    width: '100%' 
  },
  dividerLine: { 
    flex: 1, 
    height: 1, 
    backgroundColor: COLORS.lightGray 
  },
  dividerText: { 
    fontSize: 13, 
    color: COLORS.gray 
  },

  // New Admission Button
  newAdmissionBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  newAdmissionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newAdmissionText: { 
    flex: 1, 
    fontSize: 15, 
    fontWeight: '600', 
    color: COLORS.textPrimary 
  },
});