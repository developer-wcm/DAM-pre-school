import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEFAULT_SCHOOL_ID } from '../constants/school';
import { AppColors, AppFonts, AppShadows, AppSizes } from '../constants/theme';
import { useAuth } from '../context/auth';
import { supabase } from '../lib/supabase';

// ─── Types ─────────────────────────────────────────────────────────────────────

type AppointmentStatus = 'requested' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed';
type MeetingType = 'parent_teacher' | 'teacher_admin';
type TabId = 'upcoming' | 'past';

interface Appointment {
  id: string;
  meeting_type: MeetingType;
  parent_name: string | null;
  parent_id: string | null;
  student_name: string;
  date: string;
  time_slot: string;
  topic: string;
  status: AppointmentStatus;
  notes: string | null;
  requester_role: string;
}

const TIME_SLOTS = [
  '08:00 AM – 08:30 AM', '08:30 AM – 09:00 AM', '09:00 AM – 09:30 AM',
  '09:30 AM – 10:00 AM', '10:00 AM – 10:30 AM', '10:30 AM – 11:00 AM',
  '11:00 AM – 11:30 AM', '11:30 AM – 12:00 PM', '12:00 PM – 12:30 PM',
  '02:00 PM – 02:30 PM', '02:30 PM – 03:00 PM', '03:00 PM – 03:30 PM',
  '03:30 PM – 04:00 PM',
];

function getUpcomingDates() {
  const dates: { label: string; value: string }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push({
      value: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
    });
  }
  return dates;
}

function formatDateTime(date: string, slot: string) {
  const d = new Date(date + 'T00:00:00');
  const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${dateStr} • ${slot.split('–')[0].trim()}`;
}

function isPast(date: string) {
  return new Date(date + 'T23:59:59') < new Date();
}

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; bg: string; text: string; icon: any }> = {
  requested:   { label: 'Requested',   bg: '#FFF7ED', text: '#D97706', icon: 'time-outline' },
  confirmed:   { label: 'Confirmed',   bg: '#F0FDF4', text: '#16A34A', icon: 'checkmark-circle' },
  rescheduled: { label: 'Rescheduled', bg: '#EFF6FF', text: '#2563EB', icon: 'calendar-outline' },
  cancelled:   { label: 'Cancelled',   bg: '#FEF2F2', text: '#DC2626', icon: 'close-circle-outline' },
  completed:   { label: 'Completed',   bg: '#F5F3FF', text: '#7C3AED', icon: 'checkmark-done-outline' },
};

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ['#7B6FE8', '#2A9D6E', '#E05A5A', '#D4822A', '#2563EB', '#0891B2'];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ─── New Request Modal (teacher → admin/principal) ─────────────────────────────

function NewRequestModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (date: string, slot: string, topic: string) => void;
}) {
  const DATES = getUpcomingDates();
  const [selectedDate, setSelectedDate] = useState(DATES[1].value);
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[6]);
  const [topic, setTopic] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      setTopic('');
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 70, friction: 10 }).start();
    } else {
      slideAnim.setValue(600);
    }
  }, [visible]);

  function handleSubmit() {
    if (!topic.trim()) {
      Alert.alert('Topic required', 'Please describe what you would like to discuss.');
      return;
    }
    setSubmitting(true);
    onSubmit(selectedDate, selectedSlot, topic.trim());
    setSubmitting(false);
  }

  const dateLabel = DATES.find((d) => d.value === selectedDate)?.label ?? selectedDate;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={rStyles.overlay}>
        <Animated.View style={[rStyles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={rStyles.handle} />
          <Text style={rStyles.title}>Request Meeting</Text>
          <Text style={rStyles.sub}>Request a meeting with your school's <Text style={rStyles.subBold}>Admin / Principal</Text>.</Text>

          <Text style={rStyles.fieldLabel}>Select Date <Text style={rStyles.req}>*</Text></Text>
          <TouchableOpacity style={rStyles.picker} onPress={() => { setShowDatePicker((v) => !v); setShowSlotPicker(false); }} activeOpacity={0.8}>
            <Ionicons name="calendar-outline" size={18} color="#7B6FE8" />
            <Text style={rStyles.pickerText}>{dateLabel}</Text>
            <Ionicons name={showDatePicker ? 'chevron-up' : 'chevron-down'} size={18} color={AppColors.textTertiary} />
          </TouchableOpacity>
          {showDatePicker && (
            <View style={rStyles.dropdown}>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {DATES.map((d) => (
                  <TouchableOpacity
                    key={d.value}
                    style={[rStyles.dropItem, d.value === selectedDate && rStyles.dropItemActive]}
                    onPress={() => { setSelectedDate(d.value); setShowDatePicker(false); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[rStyles.dropItemText, d.value === selectedDate && rStyles.dropItemTextActive]}>{d.label}</Text>
                    {d.value === selectedDate && <Ionicons name="checkmark" size={16} color="#7B6FE8" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={[rStyles.fieldLabel, { marginTop: 14 }]}>Select Time <Text style={rStyles.req}>*</Text></Text>
          <TouchableOpacity style={rStyles.picker} onPress={() => { setShowSlotPicker((v) => !v); setShowDatePicker(false); }} activeOpacity={0.8}>
            <Ionicons name="time-outline" size={18} color="#7B6FE8" />
            <Text style={rStyles.pickerText}>{selectedSlot}</Text>
            <Ionicons name={showSlotPicker ? 'chevron-up' : 'chevron-down'} size={18} color={AppColors.textTertiary} />
          </TouchableOpacity>
          {showSlotPicker && (
            <View style={rStyles.dropdown}>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {TIME_SLOTS.map((slot) => (
                  <TouchableOpacity
                    key={slot}
                    style={[rStyles.dropItem, slot === selectedSlot && rStyles.dropItemActive]}
                    onPress={() => { setSelectedSlot(slot); setShowSlotPicker(false); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[rStyles.dropItemText, slot === selectedSlot && rStyles.dropItemTextActive]}>{slot}</Text>
                    {slot === selectedSlot && <Ionicons name="checkmark" size={16} color="#7B6FE8" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={[rStyles.fieldLabel, { marginTop: 14 }]}>Topic <Text style={rStyles.req}>*</Text></Text>
          <TextInput
            style={rStyles.reasonInput}
            value={topic}
            onChangeText={setTopic}
            placeholder="e.g., Classroom supplies, schedule change"
            placeholderTextColor={AppColors.textLight}
            multiline
          />

          <TouchableOpacity style={rStyles.submitBtn} onPress={handleSubmit} disabled={submitting} activeOpacity={0.88}>
            <LinearGradient colors={['#7B6FE8', '#4ADE80']} style={rStyles.submitGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {submitting
                ? <ActivityIndicator color="#FFF" size="small" />
                : <>
                    <Text style={rStyles.submitText}>Send Request</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFF" />
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={rStyles.cancelBtn} activeOpacity={0.7}>
            <Text style={rStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Reschedule Modal ──────────────────────────────────────────────────────────

function RescheduleModal({
  visible,
  appointment,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onSubmit: (date: string, slot: string, reason: string) => void;
}) {
  const DATES = getUpcomingDates();
  const [selectedDate, setSelectedDate] = useState(DATES[1].value);
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[6]);
  const [reason, setReason] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 70, friction: 10 }).start();
    } else {
      slideAnim.setValue(600);
    }
  }, [visible]);

  function handleSubmit() {
    setSubmitting(true);
    onSubmit(selectedDate, selectedSlot, reason);
    setSubmitting(false);
  }

  const dateLabel = DATES.find((d) => d.value === selectedDate)?.label ?? selectedDate;

  if (!appointment) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={rStyles.overlay}>
        <Animated.View style={[rStyles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={rStyles.handle} />
          <Text style={rStyles.title}>Reschedule Meeting</Text>
          <Text style={rStyles.sub}>
            Suggest a new time for your meeting with{' '}
            <Text style={rStyles.subBold}>
              {appointment.meeting_type === 'parent_teacher' ? appointment.parent_name : 'Admin / Principal'}
            </Text>.
          </Text>

          <Text style={rStyles.fieldLabel}>Select New Date <Text style={rStyles.req}>*</Text></Text>
          <TouchableOpacity style={rStyles.picker} onPress={() => { setShowDatePicker((v) => !v); setShowSlotPicker(false); }} activeOpacity={0.8}>
            <Ionicons name="calendar-outline" size={18} color="#7B6FE8" />
            <Text style={rStyles.pickerText}>{dateLabel}</Text>
            <Ionicons name={showDatePicker ? 'chevron-up' : 'chevron-down'} size={18} color={AppColors.textTertiary} />
          </TouchableOpacity>
          {showDatePicker && (
            <View style={rStyles.dropdown}>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {DATES.map((d) => (
                  <TouchableOpacity
                    key={d.value}
                    style={[rStyles.dropItem, d.value === selectedDate && rStyles.dropItemActive]}
                    onPress={() => { setSelectedDate(d.value); setShowDatePicker(false); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[rStyles.dropItemText, d.value === selectedDate && rStyles.dropItemTextActive]}>{d.label}</Text>
                    {d.value === selectedDate && <Ionicons name="checkmark" size={16} color="#7B6FE8" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={[rStyles.fieldLabel, { marginTop: 14 }]}>Select New Time <Text style={rStyles.req}>*</Text></Text>
          <TouchableOpacity style={rStyles.picker} onPress={() => { setShowSlotPicker((v) => !v); setShowDatePicker(false); }} activeOpacity={0.8}>
            <Ionicons name="time-outline" size={18} color="#7B6FE8" />
            <Text style={rStyles.pickerText}>{selectedSlot}</Text>
            <Ionicons name={showSlotPicker ? 'chevron-up' : 'chevron-down'} size={18} color={AppColors.textTertiary} />
          </TouchableOpacity>
          {showSlotPicker && (
            <View style={rStyles.dropdown}>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {TIME_SLOTS.map((slot) => (
                  <TouchableOpacity
                    key={slot}
                    style={[rStyles.dropItem, slot === selectedSlot && rStyles.dropItemActive]}
                    onPress={() => { setSelectedSlot(slot); setShowSlotPicker(false); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[rStyles.dropItemText, slot === selectedSlot && rStyles.dropItemTextActive]}>{slot}</Text>
                    {slot === selectedSlot && <Ionicons name="checkmark" size={16} color="#7B6FE8" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={[rStyles.fieldLabel, { marginTop: 14 }]}>Reason for rescheduling <Text style={rStyles.optional}>(optional)</Text></Text>
          <TextInput
            style={rStyles.reasonInput}
            value={reason}
            onChangeText={setReason}
            placeholder="e.g., Change in schedule"
            placeholderTextColor={AppColors.textLight}
            multiline
          />

          <TouchableOpacity style={rStyles.submitBtn} onPress={handleSubmit} disabled={submitting} activeOpacity={0.88}>
            <LinearGradient colors={['#7B6FE8', '#4ADE80']} style={rStyles.submitGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {submitting
                ? <ActivityIndicator color="#FFF" size="small" />
                : <>
                    <Text style={rStyles.submitText}>Send Reschedule Request</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFF" />
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={rStyles.cancelBtn} activeOpacity={0.7}>
            <Text style={rStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Notes Modal ───────────────────────────────────────────────────────────────

function NotesModal({
  visible,
  appointment,
  onClose,
  onSave,
}: {
  visible: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onSave: (notes: string) => void;
}) {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && appointment) setNotes(appointment.notes ?? '');
  }, [visible, appointment]);

  function handleSave() {
    setSaving(true);
    onSave(notes);
    setSaving(false);
  }

  if (!appointment) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={rStyles.overlay}>
        <View style={[rStyles.sheet, { paddingBottom: 30 }]}>
          <View style={rStyles.handle} />
          <Text style={rStyles.title}>Meeting Notes</Text>
          <Text style={rStyles.sub}>
            Notes for meeting with{' '}
            <Text style={rStyles.subBold}>
              {appointment.meeting_type === 'parent_teacher' ? appointment.parent_name : 'Admin / Principal'}
            </Text>
          </Text>
          <TextInput
            style={[rStyles.reasonInput, { height: 120, marginTop: 16 }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes about this meeting…"
            placeholderTextColor={AppColors.textLight}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity style={[rStyles.submitBtn, { marginTop: 16 }]} onPress={handleSave} disabled={saving} activeOpacity={0.88}>
            <LinearGradient colors={['#7B6FE8', '#4ADE80']} style={rStyles.submitGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={rStyles.submitText}>Save Notes</Text>}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={rStyles.cancelBtn} activeOpacity={0.7}>
            <Text style={rStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Appointment Card ──────────────────────────────────────────────────────────

function AppointmentCard({
  item,
  onConfirm,
  onReschedule,
  onAddNotes,
  onCancel,
}: {
  item: Appointment;
  onConfirm: () => void;
  onReschedule: () => void;
  onAddNotes: () => void;
  onCancel: () => void;
}) {
  const statusCfg = STATUS_CONFIG[item.status];
  const past = isPast(item.date);
  const isWithAdmin = item.meeting_type === 'teacher_admin';
  const otherPartyName = isWithAdmin ? 'Admin / Principal' : (item.parent_name ?? 'Parent');
  const bg = avatarColor(otherPartyName);

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.header}>
        <View style={[cardStyles.avatar, { backgroundColor: bg }]}>
          {isWithAdmin
            ? <Ionicons name="shield-checkmark" size={20} color="#FFF" />
            : <Text style={cardStyles.avatarText}>{getInitials(otherPartyName)}</Text>}
        </View>
        <View style={cardStyles.headerInfo}>
          <Text style={cardStyles.parentName} numberOfLines={1}>{otherPartyName}</Text>
          {!isWithAdmin && item.student_name ? (
            <Text style={cardStyles.studentName}>for {item.student_name}</Text>
          ) : (
            <Text style={cardStyles.studentName}>{isWithAdmin ? 'Your request' : ''}</Text>
          )}
        </View>
        <View style={[cardStyles.statusBadge, { backgroundColor: statusCfg.bg }]}>
          <Ionicons name={statusCfg.icon} size={12} color={statusCfg.text} />
          <Text style={[cardStyles.statusText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
        </View>
      </View>

      <View style={cardStyles.detailBox}>
        <View style={cardStyles.detailRow}>
          <Ionicons name="calendar-outline" size={15} color="#7B6FE8" />
          <Text style={cardStyles.detailText}>{formatDateTime(item.date, item.time_slot)}</Text>
        </View>
        {item.topic ? (
          <View style={cardStyles.detailRow}>
            <Ionicons name="chatbox-outline" size={15} color="#7B6FE8" />
            <Text style={cardStyles.detailText}>Topic: {item.topic}</Text>
          </View>
        ) : null}
      </View>

      {!past && item.status === 'requested' && item.meeting_type === 'parent_teacher' && (
        <View style={cardStyles.actionRow}>
          <TouchableOpacity style={cardStyles.confirmBtn} onPress={onConfirm} activeOpacity={0.8}>
            <Text style={cardStyles.confirmText}>Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity style={cardStyles.rescheduleBtn} onPress={onReschedule} activeOpacity={0.8}>
            <Text style={cardStyles.rescheduleText}>Reschedule</Text>
          </TouchableOpacity>
        </View>
      )}
      {!past && (item.status === 'requested' || item.status === 'rescheduled') && item.meeting_type === 'teacher_admin' && (
        <View style={cardStyles.actionRow}>
          <TouchableOpacity style={cardStyles.rescheduleBtn} onPress={onReschedule} activeOpacity={0.8}>
            <Text style={cardStyles.rescheduleText}>Suggest New Time</Text>
          </TouchableOpacity>
          <TouchableOpacity style={cardStyles.cancelSmallBtn} onPress={onCancel} activeOpacity={0.8}>
            <Text style={cardStyles.cancelSmallText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
      {!past && item.status === 'confirmed' && (
        <TouchableOpacity style={cardStyles.notesBtn} onPress={onAddNotes} activeOpacity={0.8}>
          <Ionicons name="pencil-outline" size={16} color="#7B6FE8" />
          <Text style={cardStyles.notesText}>Add Notes for Meeting</Text>
        </TouchableOpacity>
      )}
      {!past && item.status === 'rescheduled' && item.meeting_type === 'parent_teacher' && (
        <View style={cardStyles.actionRow}>
          <TouchableOpacity style={cardStyles.confirmBtn} onPress={onConfirm} activeOpacity={0.8}>
            <Text style={cardStyles.confirmText}>Confirm New Time</Text>
          </TouchableOpacity>
          <TouchableOpacity style={cardStyles.cancelSmallBtn} onPress={onCancel} activeOpacity={0.8}>
            <Text style={cardStyles.cancelSmallText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
      {(past || item.status === 'completed') && (
        <TouchableOpacity style={cardStyles.notesBtn} onPress={onAddNotes} activeOpacity={0.8}>
          <Ionicons name="document-text-outline" size={16} color="#7B6FE8" />
          <Text style={cardStyles.notesText}>{item.notes ? 'View Notes' : 'Add Meeting Notes'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function TeacherAppointmentsScreen() {
  const router = useRouter();
  const { profile, user } = useAuth();
  const insets = useSafeAreaInsets();
  const schoolId = profile?.school_id ?? DEFAULT_SCHOOL_ID;

  const [tab, setTab] = useState<TabId>('upcoming');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [newRequestVisible, setNewRequestVisible] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [notesTarget, setNotesTarget] = useState<Appointment | null>(null);

  const fetchAppointments = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, meeting_type, parent_name, parent_id, student_name, date, time_slot, topic, status, notes, requester_role')
        .eq('teacher_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setAppointments((data ?? []) as Appointment[]);
    } catch (e) {
      console.error('[TeacherAppointments]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchAppointments(); }, [fetchAppointments]);

  const filtered = appointments.filter((a) =>
    tab === 'upcoming' ? !isPast(a.date) && a.status !== 'cancelled' && a.status !== 'completed'
                       : isPast(a.date) || a.status === 'completed' || a.status === 'cancelled'
  );

  async function handleNewRequest(date: string, slot: string, topic: string) {
    if (!user?.id || !profile) return;
    const { error } = await supabase.from('appointments').insert({
      school_id: schoolId,
      meeting_type: 'teacher_admin',
      requester_role: 'teacher',
      teacher_id: user.id,
      teacher_name: profile.full_name ?? '',
      parent_id: null,
      parent_name: null,
      student_name: '',
      date,
      time_slot: slot,
      topic,
      status: 'requested',
    });
    setNewRequestVisible(false);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    Alert.alert('Request Sent', 'Your meeting request has been sent to the admin / principal.');
    fetchAppointments();
  }

  async function handleConfirm(appt: Appointment) {
    await supabase.from('appointments').update({ status: 'confirmed' }).eq('id', appt.id);
    setAppointments((prev) => prev.map((a) => a.id === appt.id ? { ...a, status: 'confirmed' } : a));
  }

  async function handleRescheduleSubmit(date: string, slot: string, reason: string) {
    if (!rescheduleTarget) return;
    await supabase.from('appointments').update({
      status: 'rescheduled',
      date,
      time_slot: slot,
      reschedule_reason: reason,
    }).eq('id', rescheduleTarget.id);
    setRescheduleTarget(null);
    fetchAppointments();
  }

  async function handleNotesSave(notes: string) {
    if (!notesTarget) return;
    await supabase.from('appointments').update({ notes }).eq('id', notesTarget.id);
    setAppointments((prev) => prev.map((a) => a.id === notesTarget.id ? { ...a, notes } : a));
    setNotesTarget(null);
  }

  async function handleCancel(appt: Appointment) {
    Alert.alert('Cancel Appointment', 'Are you sure you want to cancel this appointment?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', appt.id);
          fetchAppointments();
        },
      },
    ]);
  }

  const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 82 : 64;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={AppColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Appointments</Text>
        <TouchableOpacity onPress={() => setNewRequestVisible(true)} style={styles.calIconWrap} activeOpacity={0.7}>
          <Ionicons name="add" size={24} color="#7B6FE8" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabWrap}>
        <View style={styles.tabPill}>
          {(['upcoming', 'past'] as TabId[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
              activeOpacity={0.8}
            >
              {tab === t
                ? <LinearGradient colors={['#7B6FE8', '#9B6FE8']} style={styles.tabActiveGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={styles.tabLabelActive}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                  </LinearGradient>
                : <Text style={styles.tabLabel}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
              }
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7B6FE8" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 16 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7B6FE8" />}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <AppointmentCard
              item={item}
              onConfirm={() => handleConfirm(item)}
              onReschedule={() => setRescheduleTarget(item)}
              onAddNotes={() => setNotesTarget(item)}
              onCancel={() => handleCancel(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Ionicons name="calendar-outline" size={40} color="#C4B5FD" />
              </View>
              <Text style={styles.emptyTitle}>No {tab} appointments</Text>
              <Text style={styles.emptySub}>
                {tab === 'upcoming'
                  ? 'Parent meeting requests and your own requests to admin will appear here.'
                  : 'Completed and cancelled meetings will appear here.'}
              </Text>
            </View>
          }
        />
      )}

      <NewRequestModal
        visible={newRequestVisible}
        onClose={() => setNewRequestVisible(false)}
        onSubmit={handleNewRequest}
      />
      <RescheduleModal
        visible={!!rescheduleTarget}
        appointment={rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        onSubmit={handleRescheduleSubmit}
      />
      <NotesModal
        visible={!!notesTarget}
        appointment={notesTarget}
        onClose={() => setNotesTarget(null)}
        onSave={handleNotesSave}
      />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F0FF' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 10,
    backgroundColor: '#F3F0FF',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center', ...AppShadows.cardShadow,
  },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: AppFonts.extraBold, color: AppColors.textPrimary },
  calIconWrap: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center', ...AppShadows.cardShadow,
  },
  tabWrap: { paddingHorizontal: 16, paddingBottom: 12 },
  tabPill: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: AppSizes.radiusPill, padding: 4, ...AppShadows.cardShadow },
  tab: { flex: 1, borderRadius: AppSizes.radiusPill, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  tabActive: {},
  tabActiveGrad: { width: '100%', alignItems: 'center', paddingVertical: 10, borderRadius: AppSizes.radiusPill },
  tabLabel: { fontSize: AppFonts.sizeMedium, fontWeight: AppFonts.medium, color: AppColors.textTertiary },
  tabLabelActive: { fontSize: AppFonts.sizeMedium, fontWeight: AppFonts.bold, color: '#FFF' },
  listContent: { paddingHorizontal: 16, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: AppFonts.sizeLarge, fontWeight: AppFonts.semiBold, color: AppColors.textSecondary },
  emptySub: { fontSize: AppFonts.sizeMedium, color: AppColors.textTertiary, textAlign: 'center', paddingHorizontal: 32 },
});

const cardStyles = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, gap: 12, ...AppShadows.cardShadow },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: AppFonts.sizeMedium, fontWeight: AppFonts.bold, color: '#FFF' },
  headerInfo: { flex: 1 },
  parentName: { fontSize: AppFonts.sizeLarge, fontWeight: AppFonts.bold, color: AppColors.textPrimary },
  studentName: { fontSize: AppFonts.sizeSmall, color: '#7B6FE8', fontWeight: AppFonts.medium, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: AppSizes.radiusPill },
  statusText: { fontSize: 11, fontWeight: AppFonts.semiBold },
  detailBox: { backgroundColor: '#F8F7FF', borderRadius: 14, padding: 12, gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: AppFonts.sizeMedium, color: AppColors.textSecondary },
  actionRow: { flexDirection: 'row', gap: 10 },
  confirmBtn: { flex: 1, backgroundColor: '#E6FAF4', borderRadius: AppSizes.radiusPill, alignItems: 'center', paddingVertical: 12 },
  confirmText: { fontSize: AppFonts.sizeMedium, fontWeight: AppFonts.bold, color: '#16A34A' },
  rescheduleBtn: { flex: 1, backgroundColor: '#F3F0FF', borderRadius: AppSizes.radiusPill, alignItems: 'center', paddingVertical: 12, borderWidth: 1, borderColor: '#DDD6FE' },
  rescheduleText: { fontSize: AppFonts.sizeMedium, fontWeight: AppFonts.semiBold, color: AppColors.textSecondary },
  cancelSmallBtn: { flex: 1, backgroundColor: '#FEF2F2', borderRadius: AppSizes.radiusPill, alignItems: 'center', paddingVertical: 12 },
  cancelSmallText: { fontSize: AppFonts.sizeMedium, fontWeight: AppFonts.semiBold, color: '#DC2626' },
  notesBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F3F0FF', borderRadius: AppSizes.radiusPill, paddingVertical: 12 },
  notesText: { fontSize: AppFonts.sizeMedium, fontWeight: AppFonts.bold, color: '#7B6FE8' },
});

const rStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: AppFonts.extraBold, color: AppColors.textPrimary, textAlign: 'center' },
  sub: { fontSize: AppFonts.sizeMedium, color: AppColors.textTertiary, textAlign: 'center', marginTop: 6, marginBottom: 4, lineHeight: 22 },
  subBold: { fontWeight: AppFonts.bold, color: AppColors.textPrimary },
  fieldLabel: { fontSize: AppFonts.sizeMedium, fontWeight: AppFonts.semiBold, color: AppColors.textSecondary, marginBottom: 8, marginTop: 14 },
  req: { color: '#7B6FE8' },
  optional: { fontWeight: AppFonts.regular, color: AppColors.textTertiary },
  picker: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8F7FF', borderRadius: AppSizes.radiusPill,
    borderWidth: 1, borderColor: '#DDD6FE', paddingHorizontal: 16, paddingVertical: 13,
  },
  pickerText: { flex: 1, fontSize: AppFonts.sizeMedium, color: AppColors.textPrimary, fontWeight: AppFonts.medium },
  dropdown: { backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#DDD6FE', marginTop: 4, overflow: 'hidden', ...AppShadows.cardShadow },
  dropItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 11 },
  dropItemActive: { backgroundColor: '#F3F0FF' },
  dropItemText: { fontSize: AppFonts.sizeMedium, color: AppColors.textSecondary },
  dropItemTextActive: { color: '#7B6FE8', fontWeight: AppFonts.semiBold },
  reasonInput: {
    backgroundColor: '#F8F7FF', borderRadius: 16, borderWidth: 1, borderColor: '#DDD6FE',
    paddingHorizontal: 16, paddingVertical: 13, fontSize: AppFonts.sizeMedium, color: AppColors.textPrimary, minHeight: 56,
  },
  submitBtn: { borderRadius: AppSizes.radiusPill, overflow: 'hidden', marginTop: 20 },
  submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  submitText: { fontSize: AppFonts.sizeLarge, fontWeight: AppFonts.bold, color: '#FFF' },
  cancelBtn: { alignItems: 'center', paddingVertical: 14 },
  cancelText: { fontSize: AppFonts.sizeMedium, fontWeight: AppFonts.semiBold, color: '#7B6FE8' },
});
