import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ConfirmationModal from '../components/ConfirmationModal';
import RescheduleModal from '../components/RescheduleModal';
import { COLORS } from '../constants/admissionTheme';
import { useAuth } from '../context/auth';
import { supabase } from '../lib/supabase';

interface Teacher {
  id: string;
  full_name: string;
  role: string;
}

interface Appointment {
  id: string;
  teacher_id: string;
  teacherName: string;
  teacherAvatar: string;
  subject: string;
  date: string;       // display string "Feb 25, 2026"
  date_iso: string;   // YYYY-MM-DD for DB updates
  time: string;
  topic: string;
  status: 'requested' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed';
}

function formatDateForDisplay(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function parseDateToISO(input: string): string | null {
  const d = new Date(input);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

export default function ParentAppointmentsScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [topic, setTopic] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [booking, setBooking] = useState(false);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [confirmationData, setConfirmationData] = useState<{
    teacherName: string;
    date: string;
    time: string;
    topic: string;
    type: 'booking' | 'reschedule';
  } | null>(null);

  // ── Fetch teachers ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!profile?.school_id) return;
    supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('school_id', profile.school_id)
      .eq('role', 'teacher')
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setTeachers(data as Teacher[]);
          setSelectedTeacher(data[0] as Teacher);
        }
        setLoadingTeachers(false);
      });
  }, [profile?.school_id]);

  // ── Fetch appointments ──────────────────────────────────────────────────────
  const fetchAppointments = useCallback(async () => {
    if (!user?.id) return;
    setLoadingAppointments(true);
    const { data, error } = await supabase
      .from('appointments')
      .select('id, teacher_id, teacher_name, date, time_slot, topic, status')
      .eq('parent_id', user.id)
      .order('date', { ascending: true });

    if (!error && data) {
      setAppointments(
        data.map((row: any) => ({
          id: row.id,
          teacher_id: row.teacher_id,
          teacherName: row.teacher_name,
          teacherAvatar: '👩‍🏫',
          subject: 'Teacher',
          date: formatDateForDisplay(row.date),
          date_iso: row.date,
          time: row.time_slot,
          topic: row.topic,
          status: row.status,
        }))
      );
    }
    setLoadingAppointments(false);
  }, [user?.id]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const upcomingAppointments = appointments.filter(
    (a) => !['completed', 'cancelled'].includes(a.status)
  );
  const pastAppointments = appointments.filter(
    (a) => ['completed', 'cancelled'].includes(a.status)
  );
  const displayedAppointments = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  // ── Book appointment ────────────────────────────────────────────────────────
  const handleBookAppointment = async () => {
    if (!selectedTeacher || !selectedDate || !selectedTime || !topic.trim()) {
      setErrorMessage('Please fill in all fields');
      return;
    }
    const dateISO = parseDateToISO(selectedDate);
    if (!dateISO) {
      setErrorMessage('Invalid date — try "Feb 25, 2026"');
      return;
    }
    if (!user?.id || !profile) return;

    setBooking(true);
    const { error } = await supabase.from('appointments').insert({
      school_id: profile.school_id,
      parent_id: user.id,
      parent_name: profile.full_name ?? '',
      teacher_id: selectedTeacher.id,
      teacher_name: selectedTeacher.full_name,
      student_name: '',
      date: dateISO,
      time_slot: selectedTime,
      topic: topic.trim(),
      status: 'requested',
    });
    setBooking(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setShowBookingModal(false);
    setConfirmationData({
      teacherName: selectedTeacher.full_name,
      date: selectedDate,
      time: selectedTime,
      topic: topic.trim(),
      type: 'booking',
    });
    setShowConfirmationModal(true);
  };

  // ── Reschedule ──────────────────────────────────────────────────────────────
  const handleReschedulePress = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowRescheduleModal(true);
  };

  const handleRescheduleSubmit = async (newDate: string, newTime: string, reason?: string) => {
    if (!selectedAppointment) return;
    const dateISO = parseDateToISO(newDate) ?? newDate;

    const { error } = await supabase
      .from('appointments')
      .update({
        date: dateISO,
        time_slot: newTime,
        status: 'rescheduled',
        reschedule_reason: reason ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedAppointment.id);

    setShowRescheduleModal(false);
    if (!error) {
      setConfirmationData({
        teacherName: selectedAppointment.teacherName,
        date: newDate,
        time: newTime,
        topic: selectedAppointment.topic,
        type: 'reschedule',
      });
      setShowConfirmationModal(true);
    }
  };

  // ── Confirmation close ──────────────────────────────────────────────────────
  const handleConfirmationClose = () => {
    setShowConfirmationModal(false);
    if (confirmationData?.type === 'booking') {
      setSelectedDate('');
      setSelectedTime('');
      setTopic('');
    }
    if (confirmationData?.type === 'reschedule') {
      setSelectedAppointment(null);
    }
    setConfirmationData(null);
    fetchAppointments();
  };

  // ── Cancel appointment ──────────────────────────────────────────────────────
  const handleCancelAppointment = async (appointmentId: string) => {
    await supabase
      .from('appointments')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', appointmentId);
    fetchAppointments();
  };

  // ── Status helpers ──────────────────────────────────────────────────────────
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return COLORS.success;
      case 'requested': return COLORS.warning;
      case 'rescheduled': return COLORS.warning;
      case 'completed': return COLORS.textSecondary;
      case 'cancelled': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'confirmed': return COLORS.successLight;
      case 'requested': return COLORS.warningLight;
      case 'rescheduled': return COLORS.warningLight;
      case 'completed': return COLORS.offWhite;
      case 'cancelled': return COLORS.errorLight;
      default: return COLORS.offWhite;
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'requested') return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Appointments</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowBookingModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Tab Toggle */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {/* Appointments List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loadingAppointments ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} />
        ) : displayedAppointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyTitle}>No {activeTab} appointments</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'upcoming'
                ? "Book an appointment with your child's teacher"
                : 'Your past appointments will appear here'}
            </Text>
            {activeTab === 'upcoming' && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowBookingModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyButtonText}>Book Appointment</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          displayedAppointments.map((appointment) => (
            <View key={appointment.id} style={styles.appointmentCard}>
              {/* Teacher Info */}
              <View style={styles.teacherRow}>
                <View style={styles.teacherAvatar}>
                  <Text style={styles.teacherAvatarEmoji}>{appointment.teacherAvatar}</Text>
                </View>
                <View style={styles.teacherInfo}>
                  <View style={styles.teacherNameRow}>
                    <Text style={styles.teacherName}>{appointment.teacherName}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusBg(appointment.status) },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(appointment.status) },
                        ]}
                      >
                        ● {getStatusLabel(appointment.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.teacherSubject}>{appointment.subject}</Text>
                </View>
              </View>

              {/* Appointment Details */}
              <View style={styles.detailsBox}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.detailText}>
                    {appointment.date} • {appointment.time}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="chatbox-outline" size={18} color={COLORS.textSecondary} />
                  <Text style={styles.detailText}>Topic: {appointment.topic}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              {(appointment.status === 'requested' || appointment.status === 'rescheduled') && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    activeOpacity={0.8}
                    onPress={() => handleCancelAppointment(appointment.id)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rescheduleButton}
                    activeOpacity={0.8}
                    onPress={() => handleReschedulePress(appointment)}
                  >
                    <Text style={styles.rescheduleButtonText}>Reschedule</Text>
                  </TouchableOpacity>
                </View>
              )}

              {appointment.status === 'confirmed' && (
                <TouchableOpacity style={styles.viewDetailsButton} activeOpacity={0.8}>
                  <Ionicons name="information-circle" size={18} color={COLORS.primary} />
                  <Text style={styles.viewDetailsText}>View Details</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Booking Modal */}
      {showBookingModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book Appointment</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowBookingModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Select Teacher */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Select Teacher</Text>
                {loadingTeachers ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : teachers.length === 0 ? (
                  <Text style={styles.errorText}>No teachers found for your school.</Text>
                ) : (
                  <View style={styles.teacherSelector}>
                    {teachers.map((teacher) => (
                      <TouchableOpacity
                        key={teacher.id}
                        style={[
                          styles.teacherOption,
                          selectedTeacher?.id === teacher.id && styles.teacherOptionActive,
                        ]}
                        onPress={() => setSelectedTeacher(teacher)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.teacherOptionEmoji}>👩‍🏫</Text>
                        <View style={styles.teacherOptionInfo}>
                          <Text style={styles.teacherOptionName}>{teacher.full_name}</Text>
                          <Text style={styles.teacherOptionSubject}>Teacher</Text>
                        </View>
                        {selectedTeacher?.id === teacher.id && (
                          <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Select Date */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Preferred Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Feb 25, 2026"
                  placeholderTextColor={COLORS.gray}
                  value={selectedDate}
                  onChangeText={(text) => { setSelectedDate(text); setErrorMessage(''); }}
                />
              </View>

              {/* Select Time */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Preferred Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 10:00 AM"
                  placeholderTextColor={COLORS.gray}
                  value={selectedTime}
                  onChangeText={(text) => { setSelectedTime(text); setErrorMessage(''); }}
                />
              </View>

              {/* Topic */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Topic / Reason</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="What would you like to discuss?"
                  placeholderTextColor={COLORS.gray}
                  value={topic}
                  onChangeText={(text) => { setTopic(text); setErrorMessage(''); }}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
              ) : null}

              <TouchableOpacity
                style={[styles.bookButton, booking && { opacity: 0.6 }]}
                onPress={handleBookAppointment}
                activeOpacity={0.85}
                disabled={booking}
              >
                {booking ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.bookButtonText}>Request Appointment</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Confirmation Modal */}
      {showConfirmationModal && confirmationData && (
        <ConfirmationModal
          visible={showConfirmationModal}
          onClose={handleConfirmationClose}
          appointmentData={confirmationData}
          type={confirmationData.type}
        />
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedAppointment && (
        <RescheduleModal
          visible={showRescheduleModal}
          onClose={() => setShowRescheduleModal(false)}
          appointment={selectedAppointment as any}
          onSubmit={handleRescheduleSubmit}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  // Tab Toggle
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: COLORS.white,
    borderRadius: 50,
    padding: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 50,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 12,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Appointment Card
  appointmentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    gap: 16,
  },

  // Teacher Row
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  teacherAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teacherAvatarEmoji: {
    fontSize: 32,
  },
  teacherInfo: {
    flex: 1,
    gap: 4,
  },
  teacherNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  teacherName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  teacherSubject: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Details Box
  detailsBox: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    flex: 1,
  },

  // Action Buttons
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.lightGray,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  rescheduleButton: {
    flex: 1,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  rescheduleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 12,
    paddingVertical: 14,
  },
  viewDetailsText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Form
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.offWhite,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  textArea: {
    minHeight: 80,
  },

  // Teacher Selector
  teacherSelector: {
    gap: 12,
  },
  teacherOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.offWhite,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  teacherOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  teacherOptionEmoji: {
    fontSize: 32,
  },
  teacherOptionInfo: {
    flex: 1,
    gap: 2,
  },
  teacherOptionName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  teacherOptionSubject: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },

  // Book Button
  bookButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  bookButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Error Text
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
});
