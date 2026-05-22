import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS } from '../constants/admissionTheme';
import { generateDateOptions, generateTimeOptions } from '../utils/dateTimeHelpers';
import { triggerHaptic } from '../utils/haptics';
import GradientButton from './GradientButton';

interface Appointment {
  id: string;
  teacherName: string;
  teacherAvatar: string;
  subject: string;
  date: string;
  time: string;
  topic: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

interface RescheduleModalProps {
  visible: boolean;
  onClose: () => void;
  appointment: Appointment;
  onSubmit: (newDate: string, newTime: string, reason?: string) => void;
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({
  visible,
  onClose,
  appointment,
  onSubmit,
}) => {
  const [slideAnim] = useState(new Animated.Value(600));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Animate modal entrance (slide up from bottom)
  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 9,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Animate modal exit
  const animateOut = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  // Trigger animateIn when visible becomes true
  useEffect(() => {
    if (visible) {
      animateIn();
    }
  }, [visible]);

  // Handle date picker selection
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setShowDatePicker(false);
    setErrorMessage('');
  };

  // Handle time picker selection
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setShowTimePicker(false);
    setErrorMessage('');
  };

  // Validate and submit reschedule request
  const handleSubmit = () => {
    setErrorMessage('');

    if (!selectedDate) {
      setErrorMessage('Please select a date');
      return;
    }

    if (!selectedTime) {
      setErrorMessage('Please select a time');
      return;
    }

    triggerHaptic('medium');
    animateOut(() => {
      onSubmit(selectedDate, selectedTime, reason);
      // Reset form
      setSelectedDate('');
      setSelectedTime('');
      setReason('');
      setErrorMessage('');
    });
  };

  // Handle close button
  const handleClose = () => {
    triggerHaptic('light');
    animateOut(() => {
      onClose();
      // Reset form
      setSelectedDate('');
      setSelectedTime('');
      setReason('');
      setErrorMessage('');
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={handleClose}
        >
          <Animated.View
            style={[
              styles.content,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Modal Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Reschedule Appointment</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Current Appointment Info */}
              <View style={styles.currentInfoBox}>
                <Text style={styles.currentInfoTitle}>CURRENT APPOINTMENT</Text>
                <View style={styles.currentInfoRow}>
                  <Text style={styles.currentInfoLabel}>Teacher:</Text>
                  <Text style={styles.currentInfoValue}>{appointment.teacherName}</Text>
                </View>
                <View style={styles.currentInfoRow}>
                  <Text style={styles.currentInfoLabel}>Date:</Text>
                  <Text style={styles.currentInfoValue}>{appointment.date}</Text>
                </View>
                <View style={styles.currentInfoRow}>
                  <Text style={styles.currentInfoLabel}>Time:</Text>
                  <Text style={styles.currentInfoValue}>{appointment.time}</Text>
                </View>
                <View style={styles.currentInfoRow}>
                  <Text style={styles.currentInfoLabel}>Topic:</Text>
                  <Text style={styles.currentInfoValue}>{appointment.topic}</Text>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* New Date & Time Selection */}
              <Text style={styles.sectionTitle}>Select New Date & Time</Text>

              {/* Date Picker Trigger */}
              <TouchableOpacity
                style={styles.pickerTrigger}
                onPress={() => {
                  triggerHaptic('light');
                  setShowDatePicker(true);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
                <Text
                  style={[
                    styles.pickerTriggerText,
                    !selectedDate && styles.pickerTriggerPlaceholder,
                  ]}
                >
                  {selectedDate || 'Select Date'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={COLORS.gray} />
              </TouchableOpacity>

              {/* Time Picker Trigger */}
              <TouchableOpacity
                style={styles.pickerTrigger}
                onPress={() => {
                  triggerHaptic('light');
                  setShowTimePicker(true);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={24} color={COLORS.primary} />
                <Text
                  style={[
                    styles.pickerTriggerText,
                    !selectedTime && styles.pickerTriggerPlaceholder,
                  ]}
                >
                  {selectedTime || 'Select Time'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={COLORS.gray} />
              </TouchableOpacity>

              {/* Optional Reason Input */}
              <TextInput
                style={styles.reasonInput}
                placeholder="Reason for rescheduling (optional)"
                placeholderTextColor={COLORS.gray}
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={4}
              />

              {/* Error Message */}
              {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
              ) : null}

              {/* Submit Button */}
              <GradientButton
                label="Send Reschedule Request"
                onPress={handleSubmit}
                style={styles.submitButton}
              />
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <View style={styles.pickerModalContainer}>
            <TouchableOpacity
              style={styles.pickerModalOverlay}
              activeOpacity={1}
              onPress={() => setShowDatePicker(false)}
            />
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.pickerCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Select Date</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (selectedDate) {
                      setShowDatePicker(false);
                    }
                  }}
                >
                  <Text style={styles.pickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <Picker
                selectedValue={selectedDate}
                onValueChange={handleDateSelect}
              >
                <Picker.Item label="Select a date" value="" />
                {generateDateOptions().map((date) => (
                  <Picker.Item key={date} label={date} value={date} />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {/* Time Picker Modal */}
        {showTimePicker && (
          <View style={styles.pickerModalContainer}>
            <TouchableOpacity
              style={styles.pickerModalOverlay}
              activeOpacity={1}
              onPress={() => setShowTimePicker(false)}
            />
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.pickerCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Select Time</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (selectedTime) {
                      setShowTimePicker(false);
                    }
                  }}
                >
                  <Text style={styles.pickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <Picker
                selectedValue={selectedTime}
                onValueChange={handleTimeSelect}
              >
                <Picker.Item label="Select a time" value="" />
                {generateTimeOptions().map((time) => (
                  <Picker.Item key={time} label={time} value={time} />
                ))}
              </Picker>
            </View>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentInfoBox: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 8,
  },
  currentInfoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  currentInfoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  currentInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    width: 60,
  },
  currentInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.offWhite,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  pickerTriggerText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  pickerTriggerPlaceholder: {
    color: COLORS.gray,
  },
  reasonInput: {
    backgroundColor: COLORS.offWhite,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '600',
    marginBottom: 12,
  },
  submitButton: {
    marginTop: 8,
  },
  pickerModalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    justifyContent: 'flex-end',
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  pickerContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  pickerCancel: {
    fontSize: 16,
    color: COLORS.error,
    fontWeight: '600',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  pickerDone: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default RescheduleModal;
