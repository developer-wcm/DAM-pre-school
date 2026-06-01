import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/admissionTheme';
import { useAdmission } from '../../../context/admission';

const TOTAL_STEPS = 5;
const CURRENT_STEP = 4;

interface DocItem {
  id: string;
  label: string;
  required: boolean;
  accent: string; // icon background color
  icon: string;
}

interface UploadedFile {
  uri: string;
  name: string;
  type: 'image' | 'file';
}

type TCGrade = 'JUNIOR_KG' | 'SENIOR_KG' | null;

// ─── Document definitions ────────────────────────────────────────────────────
const STUDENT_DOCS: DocItem[] = [
  { id: 'birth_cert',   label: 'Birth Certificate',                      required: true,  accent: '#7B6FE8', icon: '📄' },
  { id: 'aadhar_child', label: 'Aadhaar Card (Masked Aadhaar Card)',    required: true,  accent: '#E05A5A', icon: '🪪' },
  { id: 'student_photo', label: 'PP-Size Photograph',                     required: true,  accent: '#3AAF72', icon: '🖼️' },
  { id: 'medical_cert', label: 'Medical Fitness Certificate',            required: true,  accent: '#3AAF72', icon: '�' },
  { id: 'school_tc',    label: 'School TC',                              required: false, accent: '#F5A623', icon: '�' },
];

const FATHER_DOCS: DocItem[] = [
  { id: 'father_aadhar', label: 'Aadhaar Card',        required: true,  accent: '#E05A5A', icon: '🪪' },
  { id: 'father_pan',    label: 'PAN Card',            required: false, accent: '#7B6FE8', icon: '💳' },
  { id: 'father_photo',  label: 'Passport Size Photo', required: true,  accent: '#3AAF72', icon: '🖼️' },
];

const MOTHER_DOCS: DocItem[] = [
  { id: 'mother_aadhar', label: 'Aadhaar Card',        required: true,  accent: '#E05A5A', icon: '🪪' },
  { id: 'mother_pan',    label: 'PAN Card',            required: false, accent: '#7B6FE8', icon: '💳' },
  { id: 'mother_photo',  label: 'Passport Size Photo', required: true,  accent: '#F5A623', icon: '🖼️' },
];

const SIBLING_DOCS: DocItem[] = [
  { id: 'sibling_id', label: 'Sibling School ID / TC', required: false, accent: '#7B6FE8', icon: '🎒' },
  { id: 'sibling_rc', label: 'Sibling Report Card',    required: false, accent: '#3AAF72', icon: '📊' },
];

const FAMILY_DOCS: DocItem[] = [
  { id: 'family_photo', label: 'Family Photograph', required: false, accent: '#F5A623', icon: '👨‍👩‍👧' },
];

const GUARDIAN_DOCS: DocItem[] = [
  { id: 'guardian_aadhar', label: 'Aadhaar Card',        required: true,  accent: '#E05A5A', icon: '🪪' },
  { id: 'guardian_pan',    label: 'PAN Card',            required: false, accent: '#7B6FE8', icon: '💳' },
  { id: 'guardian_photo',  label: 'Passport Size Photo', required: true,  accent: '#3AAF72', icon: '🖼️' },
];

const CERT_DOCS: DocItem[] = [
  { id: 'vaccination', label: 'Vaccination Certificate', required: false, accent: '#3AAF72', icon: '💉' },
  { id: 'caste_cert',  label: 'Caste Certificate',       required: false, accent: '#7B6FE8', icon: '📜' },
  { id: 'income_cert', label: 'Income Certificate',      required: false, accent: '#E05A5A', icon: '📑' },
];

// ─── Step indicator ──────────────────────────────────────────────────────────
function StepIndicator({ current, total, label }: { current: number; total: number; label: string }) {
  return (
    <View style={styles.stepIndicatorWrapper}>
      <View style={styles.stepDots}>
        {Array.from({ length: total }).map((_, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === current;
          const isDone = stepNum < current;
          return (
            <View key={i} style={styles.stepDotGroup}>
              <View style={[styles.stepDot, isActive && styles.stepDotActive, isDone && styles.stepDotDone]}>
                {isDone ? (
                  <Text style={styles.stepDotMark}>✓</Text>
                ) : isActive ? (
                  <Text style={styles.stepDotMark}>{stepNum}</Text>
                ) : null}
              </View>
              {i < total - 1 && (
                <View style={[styles.stepLine, isDone && styles.stepLineDone]} />
              )}
            </View>
          );
        })}
      </View>
      <View style={styles.stepLabelBox}>
        <Text style={styles.stepLabel}>Step {current} of {total}: {label}</Text>
      </View>
    </View>
  );
}

// ─── Upload action sheet ─────────────────────────────────────────────────────
function UploadSheet({
  visible,
  docLabel,
  hasFile,
  onCamera,
  onGallery,
  onFile,
  onRemove,
  onClose,
}: {
  visible: boolean;
  docLabel: string;
  hasFile: boolean;
  onCamera: () => void;
  onGallery: () => void;
  onFile: () => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>{docLabel}</Text>
        <Text style={styles.sheetSubtitle}>Choose how to upload this document</Text>

        <TouchableOpacity style={styles.sheetOption} onPress={onCamera} activeOpacity={0.8}>
          <View style={[styles.sheetOptionIcon, { backgroundColor: COLORS.offWhite }]}>
            <Text style={styles.sheetOptionEmoji}>📷</Text>
          </View>
          <View style={styles.sheetOptionText}>
            <Text style={styles.sheetOptionLabel}>Take Photo</Text>
            <Text style={styles.sheetOptionDesc}>Use camera to capture document</Text>
          </View>
          <Text style={styles.sheetArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sheetOption} onPress={onGallery} activeOpacity={0.8}>
          <View style={[styles.sheetOptionIcon, { backgroundColor: COLORS.successLight }]}>
            <Text style={styles.sheetOptionEmoji}>🖼️</Text>
          </View>
          <View style={styles.sheetOptionText}>
            <Text style={styles.sheetOptionLabel}>Photo Library</Text>
            <Text style={styles.sheetOptionDesc}>Choose an image from your gallery</Text>
          </View>
          <Text style={styles.sheetArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sheetOption} onPress={onFile} activeOpacity={0.8}>
          <View style={[styles.sheetOptionIcon, { backgroundColor: COLORS.warningLight }]}>
            <Text style={styles.sheetOptionEmoji}>📄</Text>
          </View>
          <View style={styles.sheetOptionText}>
            <Text style={styles.sheetOptionLabel}>Browse Files</Text>
            <Text style={styles.sheetOptionDesc}>Upload PDF or any document file</Text>
          </View>
          <Text style={styles.sheetArrow}>›</Text>
        </TouchableOpacity>

        {hasFile && (
          <TouchableOpacity style={[styles.sheetOption, { borderBottomWidth: 0 }]} onPress={onRemove} activeOpacity={0.8}>
            <View style={[styles.sheetOptionIcon, { backgroundColor: COLORS.errorLight }]}>
              <Text style={styles.sheetOptionEmoji}>🗑️</Text>
            </View>
            <View style={styles.sheetOptionText}>
              <Text style={[styles.sheetOptionLabel, { color: '#C0392B' }]}>Remove Document</Text>
              <Text style={styles.sheetOptionDesc}>Delete the uploaded file</Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.sheetCancelBtn} onPress={onClose} activeOpacity={0.8}>
          <Text style={styles.sheetCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Single upload box (full-width dashed box with centered icon + text) ──
function UploadBox({
  doc,
  file,
  onPress,
}: {
  doc: DocItem;
  file?: UploadedFile;
  onPress: () => void;
}) {
  const uploaded = !!file;

  return (
    <View style={styles.uploadBoxWrapper}>
      {/* Label with asterisk */}
      <Text style={styles.uploadBoxLabel}>
        {doc.label.toUpperCase()}
        {doc.required && <Text style={styles.required}> *</Text>}
      </Text>

      {/* Dashed upload box */}
      <TouchableOpacity
        style={[styles.uploadBox, uploaded && styles.uploadBoxDone]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {file?.type === 'image' ? (
          <Image source={{ uri: file.uri }} style={styles.uploadBoxThumb} />
        ) : (
          <>
            {/* Centered icon circle */}
            <View style={[styles.uploadIconCircle, { backgroundColor: uploaded ? '#E8F4EC' : doc.accent + '22' }]}>
              <Text style={[styles.uploadIconText, { color: uploaded ? '#3AAF72' : doc.accent }]}>
                {uploaded ? '✓' : doc.icon}
              </Text>
            </View>

            {/* Text below icon */}
            <Text style={styles.uploadBoxMainText}>
              {uploaded ? 'Uploaded' : doc.label.includes('Photo') ? 'Tap to upload photo' : 'Tap to browse files'}
            </Text>
            <Text style={styles.uploadBoxHint}>
              {uploaded ? file!.name : doc.label.includes('Photo') ? 'JPG, PNG only' : 'PDF, JPG, PNG'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Transfer Certificate with grade selector ───────────────────────────────
function TransferCertificateSection({
  doc,
  file,
  tcGrade,
  onGradeSelect,
  onPress,
}: {
  doc: DocItem;
  file?: UploadedFile;
  tcGrade: TCGrade;
  onGradeSelect: (grade: TCGrade) => void;
  onPress: () => void;
}) {
  const uploaded = !!file;
  const isTCRequired = tcGrade === 'JUNIOR_KG' || tcGrade === 'SENIOR_KG';

  return (
    <View style={styles.uploadBoxWrapper}>
      {/* Warning banner for TC requirement */}
      <View style={styles.tcWarningBanner}>
        <Text style={styles.tcWarningIcon}>⚠️</Text>
        <Text style={styles.tcWarningText}>
          Transfer Certificate mandatory for Junior KG & Senior KG from previous school.
        </Text>
      </View>

      {/* Label with conditional asterisk */}
      <Text style={styles.uploadBoxLabel}>
        TRANSFER CERTIFICATE
        {isTCRequired && <Text style={styles.required}> *</Text>}
      </Text>

      {/* Grade selector pills */}
      <View style={styles.tcGradeSelector}>
        <TouchableOpacity
          style={[styles.tcGradePill, tcGrade === 'JUNIOR_KG' && styles.tcGradePillActive]}
          onPress={() => onGradeSelect('JUNIOR_KG')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tcGradePillText, tcGrade === 'JUNIOR_KG' && styles.tcGradePillTextActive]}>
            JUNIOR KG
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tcGradePill, tcGrade === 'SENIOR_KG' && styles.tcGradePillActive]}
          onPress={() => onGradeSelect('SENIOR_KG')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tcGradePillText, tcGrade === 'SENIOR_KG' && styles.tcGradePillTextActive]}>
            SENIOR KG
          </Text>
        </TouchableOpacity>
      </View>

      {/* Upload box */}
      <TouchableOpacity
        style={[styles.uploadBox, uploaded && styles.uploadBoxDone]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {file?.type === 'image' ? (
          <Image source={{ uri: file.uri }} style={styles.uploadBoxThumb} />
        ) : (
          <>
            <View style={[styles.uploadIconCircle, { backgroundColor: uploaded ? '#E8F4EC' : '#F5A62322' }]}>
              <Text style={[styles.uploadIconText, { color: uploaded ? '#3AAF72' : '#F5A623' }]}>
                {uploaded ? '✓' : '📄'}
              </Text>
            </View>
            <Text style={styles.uploadBoxMainText}>
              {uploaded ? 'Uploaded' : 'Tap to upload Transfer Certificate'}
            </Text>
            <Text style={styles.uploadBoxHint}>
              {uploaded ? file!.name : 'PDF, JPG, PNG'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Document section card ───────────────────────────────────────────────────
function DocSection({
  title,
  icon,
  iconBg,
  docs,
  files,
  onSlotPress,
  optional,
  tcGrade,
  onTcGradeSelect,
  subtitle,
}: {
  title: string;
  icon: string;
  iconBg: string;
  docs: DocItem[];
  files: Record<string, UploadedFile>;
  onSlotPress: (doc: DocItem) => void;
  optional?: boolean;
  tcGrade?: TCGrade;
  onTcGradeSelect?: (grade: TCGrade) => void;
  subtitle?: string;
}) {
  const uploadedCount = docs.filter((d) => files[d.id]).length;
  const allDone = uploadedCount === docs.length;

  return (
    <View style={styles.card}>
      {/* Card header */}
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconCircle, { backgroundColor: iconBg }]}>
          <Text style={styles.cardIcon}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>
            {title}
            {optional && <Text style={styles.optionalTag}> (Optional)</Text>}
          </Text>
          <Text style={styles.cardSubtitle}>
            {subtitle || `${uploadedCount}/${docs.length} uploaded`}
          </Text>
        </View>
        <View style={[styles.progressPill, allDone && styles.progressPillDone]}>
          <Text style={[styles.progressPillText, allDone && styles.progressPillTextDone]}>
            {uploadedCount}/{docs.length}
          </Text>
        </View>
      </View>

      {/* Document boxes */}
      {docs.map((doc) => {
        // Special handling for Transfer Certificate
        if (doc.id === 'school_tc' && tcGrade !== undefined && onTcGradeSelect) {
          return (
            <TransferCertificateSection
              key={doc.id}
              doc={doc}
              file={files[doc.id]}
              tcGrade={tcGrade}
              onGradeSelect={onTcGradeSelect}
              onPress={() => onSlotPress(doc)}
            />
          );
        }
        
        return (
          <UploadBox
            key={doc.id}
            doc={doc}
            file={files[doc.id]}
            onPress={() => onSlotPress(doc)}
          />
        );
      })}
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function AdmissionStep4() {
  const router = useRouter();
  const { admissionData, updateAdmissionData } = useAdmission();
  const insets = useSafeAreaInsets();

  const { files, tcGrade } = admissionData;
  const [activeDoc, setActiveDoc] = useState<DocItem | null>(null);

  const setTcGrade = (grade: TCGrade) => {
    updateAdmissionData({ tcGrade: grade });
  };

  const saveFile = (docId: string, file: UploadedFile) => {
    const newFiles = { ...files, [docId]: file };
    updateAdmissionData({ files: newFiles });
    setActiveDoc(null);
  };

  const removeFile = (docId: string) => {
    const newFiles = { ...files };
    delete newFiles[docId];
    updateAdmissionData({ files: newFiles });
    setActiveDoc(null);
  };

  const handleCamera = async () => {
    if (!activeDoc) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera access is needed to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      saveFile(activeDoc.id, {
        uri: asset.uri,
        name: asset.fileName ?? `photo_${Date.now()}.jpg`,
        type: 'image',
      });
    }
  };

  const handleGallery = async () => {
    if (!activeDoc) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Photo library access is needed.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      saveFile(activeDoc.id, {
        uri: asset.uri,
        name: asset.fileName ?? `image_${Date.now()}.jpg`,
        type: 'image',
      });
    }
  };

  const handleFile = async () => {
    if (!activeDoc) return;
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*',
             'application/msword',
             'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      saveFile(activeDoc.id, { uri: asset.uri, name: asset.name, type: 'file' });
    }
  };

  const allRequired = [
    ...STUDENT_DOCS, ...FATHER_DOCS, ...MOTHER_DOCS,
  ]
    .filter((d) => d.required)
    .every((d) => files[d.id]);

  return (
    <LinearGradient colors={['#F5F7FA', '#E8EAED', '#F0F2F5']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Admission</Text>
          <View style={styles.headerSpacer} />
        </View>

        <StepIndicator current={CURRENT_STEP} total={TOTAL_STEPS} label="Document Upload" />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info banner */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerIcon}>ℹ️</Text>
            <Text style={styles.infoBannerText}>
              Tap any tile to upload via camera, gallery, or file browser.
              Required documents are marked <Text style={styles.required}>*</Text>.
            </Text>
          </View>

          <DocSection 
            title="Student Documents" 
            icon="🎒" 
            iconBg="#EDE9F6" 
            docs={STUDENT_DOCS} 
            files={files} 
            onSlotPress={setActiveDoc}
            tcGrade={tcGrade}
            onTcGradeSelect={setTcGrade}
          />
          <DocSection title="Father's Documents"   icon="👨" iconBg="#EDE9F6" docs={FATHER_DOCS}  files={files} onSlotPress={setActiveDoc} />
          <DocSection title="Mother's Documents"   icon="👩" iconBg="#FCE8F0" docs={MOTHER_DOCS}  files={files} onSlotPress={setActiveDoc} />
          <DocSection title="Family Photograph"    icon="📷" iconBg="#FFF3E0" docs={FAMILY_DOCS}  files={files} onSlotPress={setActiveDoc} optional />
          <DocSection 
            title="Guardian's Documents" 
            icon="👤" 
            iconBg="#E8F4EC" 
            docs={GUARDIAN_DOCS} 
            files={files} 
            onSlotPress={setActiveDoc} 
            optional 
            subtitle="If parents are not available"
          />

          {/* Important Notes Section */}
          <View style={styles.importantNotesCard}>
            <View style={styles.importantNotesHeader}>
              <View style={styles.importantNotesIcon}>
                <Text style={styles.importantNotesIconText}>⚠️</Text>
              </View>
              <Text style={styles.importantNotesTitle}>Important Notes</Text>
            </View>

            <View style={styles.importantNotesList}>
              <View style={styles.importantNoteItem}>
                <View style={styles.noteIconWrapper}>
                  <Text style={styles.noteIcon}>📷</Text>
                </View>
                <Text style={styles.noteText}>
                  <Text style={styles.noteTextBold}>Carry 3 PP-size photos</Text> when visiting the school in person.
                </Text>
              </View>

              <View style={styles.importantNoteItem}>
                <View style={styles.noteIconWrapper}>
                  <Text style={styles.noteIcon}>🆔</Text>
                </View>
                <Text style={styles.noteText}>
                  <Text style={styles.noteTextBold}>Photo ID accepted:</Text> Voter ID, Passport, Driving Licence, Aadhaar.
                </Text>
              </View>

              <View style={styles.importantNoteItem}>
                <View style={styles.noteIconWrapper}>
                  <Text style={styles.noteIcon}>🏠</Text>
                </View>
                <Text style={styles.noteText}>
                  <Text style={styles.noteTextBold}>Address proof accepted:</Text> Voter ID, Masked Aadhaar, Passport, Ration Card.
                </Text>
              </View>
            </View>
          </View>

          {!allRequired && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>
                Please upload all required documents before proceeding.
              </Text>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom buttons */}
        <View style={[styles.stickyBottom, { bottom: insets.bottom + 16 }]}> 
          <TouchableOpacity style={styles.backBtnBottom} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.nextBtnWrapper}
            activeOpacity={0.85}
            onPress={() => router.push('/(dashboard)/admission/step-5' as any)}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextBtn}
            >
              <Text style={styles.nextBtnText}>Next Step</Text>
              <View style={styles.nextArrowCircle}>
                <Text style={styles.nextArrow}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Upload sheet */}
      {activeDoc && (
        <UploadSheet
          visible={!!activeDoc}
          docLabel={activeDoc.label}
          hasFile={!!files[activeDoc.id]}
          onCamera={handleCamera}
          onGallery={handleGallery}
          onFile={handleFile}
          onRemove={() => activeDoc && removeFile(activeDoc.id)}
          onClose={() => setActiveDoc(null)}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6, elevation: 2,
  },
  backIcon: { fontSize: 18, color: COLORS.primary, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, flex: 1 },
  headerSpacer: { width: 36 },

  // Step indicator
  stepIndicatorWrapper: { paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  stepDots: { flexDirection: 'row', alignItems: 'center' },
  stepDotGroup: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.lightGray,
    justifyContent: 'center', alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: COLORS.secondary,
    shadowColor: COLORS.secondary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  stepDotDone: { backgroundColor: COLORS.success },
  stepDotMark: { fontSize: 13, fontWeight: '800', color: COLORS.white },
  stepLine: { flex: 1, height: 2, backgroundColor: COLORS.lightGray, marginHorizontal: 4 },
  stepLineDone: { backgroundColor: COLORS.success },
  stepLabelBox: {
    alignSelf: 'center', backgroundColor: COLORS.offWhite,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6,
  },
  stepLabel: { fontSize: 12, fontWeight: '600', color: COLORS.primary },

  // Scroll
  scrollContent: { paddingHorizontal: 20, paddingBottom: 140, gap: 16 },

  // Banners
  infoBanner: {
    flexDirection: 'row', backgroundColor: COLORS.offWhite,
    borderRadius: 14, padding: 14, gap: 10, alignItems: 'flex-start',
  },
  infoBannerIcon: { fontSize: 16 },
  infoBannerText: { flex: 1, fontSize: 12, color: COLORS.primary, lineHeight: 18 },
  warningBanner: {
    flexDirection: 'row', backgroundColor: COLORS.warningLight,
    borderRadius: 14, padding: 14, gap: 10, alignItems: 'flex-start',
    borderWidth: 1, borderColor: COLORS.warning,
  },
  warningIcon: { fontSize: 16 },
  warningText: { flex: 1, fontSize: 12, color: COLORS.secondaryDark, lineHeight: 18 },

  // Card
  card: {
    backgroundColor: COLORS.white, borderRadius: 24, padding: 20, gap: 14,
    shadowColor: COLORS.cardShadow, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  cardIcon: { fontSize: 18 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  cardSubtitle: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  optionalTag: { fontSize: 12, fontWeight: '400', color: COLORS.gray },
  progressPill: {
    backgroundColor: COLORS.offWhite, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1.5, borderColor: COLORS.lightGray,
  },
  progressPillDone: { backgroundColor: COLORS.successLight, borderColor: COLORS.success },
  progressPillText: { fontSize: 11, fontWeight: '700', color: COLORS.gray },
  progressPillTextDone: { color: COLORS.success },

  // Upload box (dashed border, centered icon + text)
  uploadBoxWrapper: { gap: 8 },
  uploadBoxLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.darkGray,
    letterSpacing: 0.5,
  },
  uploadBox: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    borderStyle: 'dashed',
    backgroundColor: COLORS.offWhite,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 10,
  },
  uploadBoxDone: {
    borderColor: COLORS.success,
    borderStyle: 'solid',
    backgroundColor: COLORS.successLight,
  },
  uploadBoxThumb: {
    width: '100%',
    height: 160,
    borderRadius: 12,
  },
  uploadIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadIconText: { fontSize: 28, fontWeight: '600' },
  uploadBoxMainText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  uploadBoxHint: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
  required: { color: COLORS.error },

  // Transfer Certificate specific
  tcWarningBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.warningLight,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    alignItems: 'flex-start',
    borderWidth: 1.5,
    borderColor: COLORS.warning,
    marginBottom: 8,
  },
  tcWarningIcon: { fontSize: 16 },
  tcWarningText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondaryDark,
    lineHeight: 18,
  },
  tcGradeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  tcGradePill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.white,
  },
  tcGradePillActive: {
    backgroundColor: COLORS.warningLight,
    borderColor: COLORS.secondary,
  },
  tcGradePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondaryDark,
    letterSpacing: 0.3,
  },
  tcGradePillTextActive: {
    color: COLORS.secondary,
  },

  // Bottom buttons
  stickyBottom: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 110,
    flexDirection: 'row',
    paddingVertical: 16,
    gap: 12,
    backgroundColor: 'transparent',
  },
  backBtnBottom: {
    flex: 1.2, borderRadius: 50, paddingVertical: 16,
    borderWidth: 2, borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
  nextBtnWrapper: {
    flex: 1.6, borderRadius: 50, overflow: 'hidden',
    shadowColor: COLORS.secondary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  nextBtn: {
    borderRadius: 50, paddingVertical: 16, paddingHorizontal: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  nextBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  nextArrowCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  nextArrow: { fontSize: 16, color: COLORS.white, fontWeight: '700' },

  // Upload sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12, gap: 4,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.lightGray, alignSelf: 'center', marginBottom: 16,
  },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 2 },
  sheetSubtitle: { fontSize: 12, color: COLORS.gray, marginBottom: 12 },
  sheetOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.offWhite,
  },
  sheetOptionIcon: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  sheetOptionEmoji: { fontSize: 20 },
  sheetOptionText: { flex: 1 },
  sheetOptionLabel: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  sheetOptionDesc: { fontSize: 12, color: COLORS.gray, marginTop: 1 },
  sheetArrow: { fontSize: 20, color: COLORS.lightGray },
  sheetCancelBtn: {
    marginTop: 12, backgroundColor: COLORS.offWhite, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
  },
  sheetCancelText: { fontSize: 15, fontWeight: '700', color: COLORS.primary },

  // Important Notes Section
  importantNotesCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  importantNotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  importantNotesIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.warningLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  importantNotesIconText: {
    fontSize: 16,
  },
  importantNotesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  importantNotesList: {
    gap: 16,
  },
  importantNoteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  noteIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  noteIcon: {
    fontSize: 14,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  noteTextBold: {
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
