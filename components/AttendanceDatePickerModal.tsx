import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/admissionTheme';

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MIN_YEAR = 2020;

function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export interface AttendanceDatePickerModalProps {
  visible: boolean;
  mode: 'daily' | 'monthly';
  focusDate: Date;
  onClose: () => void;
  onApply: (date: Date) => void;
}

export default function AttendanceDatePickerModal({
  visible,
  mode,
  focusDate,
  onClose,
  onApply,
}: AttendanceDatePickerModalProps) {
  const insets = useSafeAreaInsets();
  const maxYear = new Date().getFullYear() + 1;

  const [year, setYear] = useState(focusDate.getFullYear());
  const [month, setMonth] = useState(focusDate.getMonth());
  const [day, setDay] = useState(focusDate.getDate());

  useEffect(() => {
    if (!visible) return;
    setYear(focusDate.getFullYear());
    setMonth(focusDate.getMonth());
    setDay(focusDate.getDate());
  }, [visible, focusDate]);

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = maxYear; y >= MIN_YEAR; y -= 1) {
      list.push(y);
    }
    return list;
  }, [maxYear]);

  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);

  useEffect(() => {
    if (day > daysInMonth) {
      setDay(daysInMonth);
    }
  }, [day, daysInMonth]);

  const handleApply = () => {
    const next =
      mode === 'monthly'
        ? new Date(year, month, 1)
        : new Date(year, month, Math.min(day, daysInMonth));
    onApply(next);
    onClose();
  };

  const jumpToToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setDay(now.getDate());
  };

  const previewLabel =
    mode === 'monthly'
      ? new Date(year, month, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      : new Date(year, month, day).toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>
              {mode === 'daily' ? 'Select date' : 'Select month & year'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.preview}>{previewLabel}</Text>

          <TouchableOpacity style={styles.todayBtn} onPress={jumpToToday} activeOpacity={0.85}>
            <Ionicons name="today-outline" size={18} color={COLORS.primary} />
            <Text style={styles.todayBtnText}>Go to today</Text>
          </TouchableOpacity>

          <View style={styles.pickerRow}>
            {mode === 'daily' && (
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Day</Text>
                <Picker
                  selectedValue={day}
                  onValueChange={(value) => setDay(Number(value))}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((value) => (
                    <Picker.Item key={value} label={`${value}`} value={value} />
                  ))}
                </Picker>
              </View>
            )}

            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Month</Text>
              <Picker
                selectedValue={month}
                onValueChange={(value) => setMonth(Number(value))}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {MONTH_LABELS.map((label, index) => (
                  <Picker.Item key={label} label={label} value={index} />
                ))}
              </Picker>
            </View>

            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Year</Text>
              <Picker
                selectedValue={year}
                onValueChange={(value) => setYear(Number(value))}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {years.map((value) => (
                  <Picker.Item key={value} label={`${value}`} value={value} />
                ))}
              </Picker>
            </View>
          </View>

          <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.9}>
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 32, 44, 0.45)',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.lightGray,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.primarySoft,
    marginBottom: 8,
  },
  todayBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 16,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  picker: {
    height: Platform.OS === 'ios' ? 180 : 52,
  },
  pickerItem: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 4,
  },
  applyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
