import { COLORS } from '@/constants/admissionTheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type Holiday = {
  id: string;
  name: string;
  date: string;
  type: 'public' | 'school';
};

export default function SettingsScreen() {
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');

  const [holidays, setHolidays] = useState<Holiday[]>([
    { id: '1', name: 'Republic Day', date: 'Jan 26, 2026', type: 'public' },
    { id: '2', name: 'Holi', date: 'Mar 14, 2026', type: 'public' },
    { id: '3', name: 'Good Friday', date: 'Apr 18, 2026', type: 'public' },
    { id: '4', name: 'Summer Break', date: 'May 1-31, 2026', type: 'school' },
  ]);

  const settingsSections = [
    {
      title: 'School Information',
      items: [
        { icon: 'business', label: 'School Name', value: 'DAM Pre-School', action: 'edit' },
        { icon: 'location', label: 'Address', value: 'Mumbai, India', action: 'edit' },
        { icon: 'call', label: 'Contact Number', value: '+91 98765 43210', action: 'edit' },
        { icon: 'mail', label: 'Email', value: 'admin@dampreschool.com', action: 'edit' },
      ],
    },
    {
      title: 'Academic Settings',
      items: [
        { icon: 'calendar', label: 'Academic Year', value: '2025-2026', action: 'edit' },
        { icon: 'time', label: 'School Timings', value: '9:00 AM - 3:00 PM', action: 'edit' },
        { icon: 'people', label: 'Class Strength', value: 'Max 30 students', action: 'edit' },
      ],
    },
  ];

  const handleAddHoliday = () => {
    if (!holidayName.trim() || !holidayDate.trim()) {
      Alert.alert('Missing Information', 'Please fill in both holiday name and date.');
      return;
    }

    const newHoliday: Holiday = {
      id: Date.now().toString(),
      name: holidayName.trim(),
      date: holidayDate.trim(),
      type: 'school',
    };

    setHolidays([...holidays, newHoliday]);
    setHolidayName('');
    setHolidayDate('');
    setShowHolidayModal(false);

    Alert.alert('Success', 'Holiday has been added successfully!');
  };

  const handleDeleteHoliday = (id: string) => {
    Alert.alert('Delete Holiday', 'Are you sure you want to delete this holiday?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setHolidays(holidays.filter((h) => h.id !== id));
          Alert.alert('Deleted', 'Holiday has been deleted.');
        },
      },
    ]);
  };

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.settingsCard}>
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex}>
                  <TouchableOpacity
                    style={styles.settingItem}
                    activeOpacity={0.7}
                    onPress={() => Alert.alert('Edit', `Edit ${item.label}`)}
                  >
                    <View style={styles.settingIcon}>
                      <Ionicons name={item.icon as any} size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.settingInfo}>
                      <Text style={styles.settingLabel}>{item.label}</Text>
                      <Text style={styles.settingValue}>{item.value}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                  </TouchableOpacity>
                  {itemIndex < section.items.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Holidays Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Holidays</Text>
            <TouchableOpacity
              style={styles.addBtn}
              activeOpacity={0.8}
              onPress={() => setShowHolidayModal(true)}
            >
              <Ionicons name="add" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.holidaysList}>
            {holidays.map((holiday) => (
              <View key={holiday.id} style={styles.holidayCard}>
                <View style={styles.holidayIcon}>
                  <Ionicons name="calendar" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.holidayInfo}>
                  <Text style={styles.holidayName}>{holiday.name}</Text>
                  <Text style={styles.holidayDate}>{holiday.date}</Text>
                </View>
                <View
                  style={[
                    styles.holidayTypeBadge,
                    {
                      backgroundColor:
                        holiday.type === 'public' ? COLORS.primarySoft : COLORS.successLight,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.holidayTypeText,
                      { color: holiday.type === 'public' ? COLORS.primary : COLORS.success },
                    ]}
                  >
                    {holiday.type === 'public' ? 'Public' : 'School'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteIconBtn}
                  onPress={() => handleDeleteHoliday(holiday.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Add Holiday Modal */}
      <Modal
        visible={showHolidayModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHolidayModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Holiday</Text>
              <TouchableOpacity
                onPress={() => setShowHolidayModal(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Holiday Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Holiday Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Independence Day"
                placeholderTextColor={COLORS.gray}
                value={holidayName}
                onChangeText={setHolidayName}
              />
            </View>

            {/* Holiday Date Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Aug 15, 2026"
                placeholderTextColor={COLORS.gray}
                value={holidayDate}
                onChangeText={setHolidayDate}
              />
            </View>

            {/* Add Button */}
            <TouchableOpacity activeOpacity={0.85} onPress={handleAddHoliday}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addHolidayButton}
              >
                <Ionicons name="add-circle" size={18} color={COLORS.white} />
                <Text style={styles.addHolidayButtonText}>Add Holiday</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 20,
  },

  // Header
  header: {
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },

  // Section
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Settings Card
  settingsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  settingValue: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 12,
  },

  // Holidays List
  holidaysList: {
    gap: 10,
  },
  holidayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  holidayIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  holidayInfo: {
    flex: 1,
  },
  holidayName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  holidayDate: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  holidayTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  holidayTypeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deleteIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Input Group
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: COLORS.offWhite,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 2,
    borderColor: 'transparent',
  },

  // Add Holiday Button
  addHolidayButton: {
    borderRadius: 50,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  addHolidayButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
