import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
import { useAuth } from '../../context/auth';
import { supabase } from '../../lib/supabase';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

type EventItem = {
  id: number | string;
  title: string;
  subtitle: string;
  type: string;
  date: string;
  dateObject: Date;
  month: string;
  day: string;
  accent: string;
  bg: string;
  pillBg: string;
  time?: string;
};

const EVENT_TYPE_STYLES: Record<string, { accent: string; bg: string; pillBg: string }> = {
  HOLIDAY: {
    accent: '#FF6B5F',
    bg: '#FFF2F0',
    pillBg: '#FFE2DF',
  },
  EVENT: {
    accent: '#4F31E8',
    bg: '#F0EBFF',
    pillBg: '#E4DCFF',
  },
  DEFAULT: {
    accent: '#4F31E8',
    bg: '#F0EBFF',
    pillBg: '#E4DCFF',
  },
};

function parseEventData(item: any): EventItem {
  const rawDate = item.date ?? item.event_date ?? item.event_datetime ?? item.start_date ?? item.start_datetime;
  const parsedDate = rawDate ? new Date(rawDate) : new Date();
  const validDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  const day = String(validDate.getDate());
  const month = validDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const type = String(item.type ?? item.event_type ?? 'EVENT').toUpperCase();
  const subtitleParts = [item.subtitle ?? item.description ?? item.details ?? item.location].filter(Boolean);
  if (item.start_time) subtitleParts.unshift(item.start_time);
  const subtitle = subtitleParts.join(' · ');
  const style = EVENT_TYPE_STYLES[type] ?? EVENT_TYPE_STYLES.DEFAULT;

  return {
    id: item.id,
    title: String(item.title ?? item.name ?? 'Untitled event'),
    subtitle: subtitle || 'No additional details',
    type,
    date: rawDate ? String(rawDate) : validDate.toISOString(),
    dateObject: validDate,
    month,
    day,
    accent: style.accent,
    bg: style.bg,
    pillBg: style.pillBg,
    time: String(item.start_time ?? item.time ?? ''),
  };
}

function generateCalendarDays(monthDate: Date, eventDays: Set<string>) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = firstWeekday;
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const days: Array<{ label: string; muted?: boolean; selected?: boolean; eventDot?: boolean }> = [];
  const today = new Date();

  for (let i = prevMonthDays; i > 0; i -= 1) {
    days.push({ label: String(prevMonthLastDay - i + 1), muted: true });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const isToday =
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day;
    days.push({
      label: String(day),
      selected: isToday,
      eventDot: eventDays.has(String(day)),
    });
  }

  while (days.length % 7 !== 0) {
    days.push({ label: String(days.length - daysInMonth - prevMonthDays + 1), muted: true });
  }

  return days;
}

export default function EventsCalendarScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const schoolId = profile?.school_id || '';
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [type, setType] = useState<'EVENT' | 'HOLIDAY'>('EVENT');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const eventDays = useMemo(
    () => new Set(events.filter((event) => event.dateObject.getMonth() === currentMonth.getMonth() && event.dateObject.getFullYear() === currentMonth.getFullYear()).map((event) => event.day)),
    [events, currentMonth]
  );

  const filteredEvents = useMemo(
    () => events.filter((event) => event.dateObject.getMonth() === currentMonth.getMonth() && event.dateObject.getFullYear() === currentMonth.getFullYear()),
    [events, currentMonth]
  );

  const calendarDays = useMemo(() => generateCalendarDays(currentMonth, eventDays), [currentMonth, eventDays]);
  const monthTitle = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Fetch events and holidays in parallel
      const [eventsResult, holidaysResult] = await Promise.all([
        supabase
          .from('events')
          .select('*')
          .eq('school_id', schoolId)
          .order('date', { ascending: true }),
        supabase
          .from('holidays')
          .select('*')
          .eq('school_id', schoolId)
          .order('date', { ascending: true }),
      ]);

      if (eventsResult.error) throw eventsResult.error;
      if (holidaysResult.error) throw holidaysResult.error;

      // Convert events and holidays to EventItem format
      const events = (eventsResult.data ?? []).map(parseEventData);
      const holidays = (holidaysResult.data ?? []).map((holiday: any) => {
        const startDate = holiday.date ? new Date(holiday.date) : null;
        const endDate = holiday.date_to ? new Date(holiday.date_to) : null;
        const startStr = startDate
          ? startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
          : '';
        const endStr = endDate
          ? endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
          : '';
        const daysCount = typeof holiday.days === 'number'
          ? holiday.days
          : (startDate && endDate)
            ? Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
            : 1;
        const rangeSubtitle = endStr ? `${startStr} — ${endStr} (${daysCount} day${daysCount > 1 ? 's' : ''})` : `${startStr} (${daysCount} day${daysCount > 1 ? 's' : ''})`;

        return parseEventData({
          id: holiday.id,
          title: holiday.name,
          description: rangeSubtitle,
          type: 'HOLIDAY',
          date: holiday.date,
          event_date: holiday.date,
          start_time: null,
        });
      });

      // Merge and sort by date
      const allEvents = [...events, ...holidays].sort(
        (a, b) => a.dateObject.getTime() - b.dateObject.getTime()
      );

      setEvents(allEvents);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      Alert.alert('Unable to load events', error.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async () => {
    if (!title.trim() || !date.trim()) {
      Alert.alert('Missing fields', 'Please enter an event title and date.');
      return;
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      Alert.alert('Invalid date', 'Please use YYYY-MM-DD format.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('events').insert([
        {
          school_id: schoolId,
          title: title.trim(),
          description: subtitle.trim() || null,
          type,
          date: parsedDate.toISOString(),
          start_time: time.trim() || null,
        },
      ]);
      if (error) throw error;
      setShowModal(false);
      setTitle('');
      setSubtitle('');
      setTime('');
      setType('EVENT');
      setDate('');
      fetchEvents();
    } catch (error: any) {
      console.error('Error adding event:', error);
      Alert.alert('Unable to add event', error.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = (eventId: number | string) => {
    Alert.alert('Delete event', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('events').delete().eq('id', eventId);
            if (error) throw error;
            setEvents((prev) => prev.filter((event) => event.id !== eventId));
          } catch (error: any) {
            console.error('Error deleting event:', error);
            Alert.alert('Unable to delete event', error.message || 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIcon} activeOpacity={0.75} onPress={() => router.back()} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={21} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>Academic Calendar</Text>
          <TouchableOpacity activeOpacity={0.75} onPress={() => setCurrentMonth(new Date())}>
            <Text style={styles.todayText}>Today</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.monthHeader}>
          <TouchableOpacity style={styles.monthNav} activeOpacity={0.75} onPress={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>
            <Ionicons name="chevron-back" size={18} color="#A5A3B8" />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{monthTitle}</Text>
          <TouchableOpacity style={styles.monthNav} activeOpacity={0.75} onPress={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>
            <Ionicons name="chevron-forward" size={18} color="#A5A3B8" />
          </TouchableOpacity>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((day) => (
              <Text key={day} style={styles.weekday}>
                {day}
              </Text>
            ))}
          </View>
          <View style={styles.daysGrid}>
            {calendarDays.map((day, index) => (
              <View key={`${day.label}-${index}`} style={styles.dayCell}>
                <View style={[styles.dayMarker, day.muted && styles.softDay, day.selected && styles.selectedDay]}>
                  <Text style={[styles.dayText, day.muted && styles.mutedDayText, day.selected && styles.activeDayText]}>{day.label}</Text>
                </View>
                {day.eventDot && <View style={styles.eventDot} />}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Events This Month</Text>
          <Text style={styles.sectionCount}>({filteredEvents.length})</Text>
        </View>

        {loading ? (
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#4F31E8" />
          </View>
        ) : (
          <View style={styles.eventList}>
            {filteredEvents.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={[styles.dateBadge, { backgroundColor: event.bg }]}> 
                  <Text style={[styles.dateMonth, { color: event.accent }]}>{event.month}</Text>
                  <Text style={[styles.dateDay, { color: event.accent }]}>{event.day}</Text>
                </View>
                <View style={styles.eventInfo}>
                  <View style={[styles.typePill, { backgroundColor: event.pillBg }]}> 
                    <Text style={[styles.typeText, { color: event.accent }]}>{event.type}</Text>
                  </View>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventSubtitle}>{event.subtitle}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteEvent(event.id)} style={styles.deleteButton} activeOpacity={0.7}>
                  <Ionicons name="trash-outline" size={20} color="#E05A5A" />
                </TouchableOpacity>
              </View>
            ))}
            {filteredEvents.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No events yet. Add one using the button below.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.addButton} activeOpacity={0.85} onPress={() => setShowModal(true)} accessibilityLabel="Add event">
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Event</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.textInput}
              placeholder="Event title"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={styles.textInput}
              placeholder="YYYY-MM-DD"
              value={date}
              onChangeText={setDate}
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={styles.textInput}
              placeholder="Time (optional)"
              value={time}
              onChangeText={setTime}
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Subtitle / location"
              value={subtitle}
              onChangeText={setSubtitle}
              placeholderTextColor="#9CA3AF"
              multiline
            />

            <View style={styles.typePickerRow}>
              {(['EVENT', 'HOLIDAY'] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.typeOption, type === option && styles.typeOptionActive]}
                  onPress={() => setType(option)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.typeOptionText, type === option && styles.typeOptionTextActive]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleAddEvent} activeOpacity={0.85} disabled={saving}>
              <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Event'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EDFF',
  },
  scrollContent: {
    paddingTop: 58,
    paddingHorizontal: 26,
    paddingBottom: 108,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
  },
  title: {
    color: '#171729',
    fontSize: 16,
    fontWeight: '800',
  },
  todayText: {
    color: '#4F31E8',
    fontSize: 13,
    fontWeight: '800',
  },
  monthHeader: {
    marginTop: 31,
    marginBottom: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 34,
  },
  monthNav: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    color: '#171729',
    fontSize: 18,
    fontWeight: '800',
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    paddingTop: 21,
    paddingHorizontal: 20,
    paddingBottom: 19,
    shadowColor: '#B69DE0',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.09,
    shadowRadius: 22,
    elevation: 2,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  weekday: {
    width: 28,
    textAlign: 'center',
    color: '#B8B6C8',
    fontSize: 10,
    fontWeight: '800',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 15,
    justifyContent: 'space-between',
  },
  dayCell: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  softDay: {
    backgroundColor: '#F7F6FA',
  },
  selectedDay: {
    backgroundColor: '#4F31E8',
    shadowColor: '#4F31E8',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 4,
  },
  dayText: {
    color: '#656979',
    fontSize: 13,
    fontWeight: '700',
  },
  mutedDayText: {
    color: '#DCD9E6',
  },
  activeDayText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  eventDot: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4F31E8',
  },
  sectionHeader: {
    marginTop: 31,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: '#171729',
    fontSize: 16,
    fontWeight: '900',
  },
  sectionCount: {
    color: '#A9A6B8',
    fontSize: 15,
    fontWeight: '800',
  },
  eventList: {
    gap: 13,
  },
  eventCard: {
    minHeight: 84,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    paddingVertical: 14,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#B69DE0',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
  },
  dateBadge: {
    width: 56,
    height: 56,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 17,
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '900',
  },
  dateDay: {
    marginTop: 1,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 24,
  },
  eventInfo: {
    flex: 1,
  },
  typePill: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginBottom: 5,
  },
  typeText: {
    fontSize: 8,
    fontWeight: '900',
  },
  eventTitle: {
    color: '#171729',
    fontSize: 14,
    fontWeight: '900',
  },
  eventSubtitle: {
    color: '#8F8D9D',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  deleteButton: {
    marginLeft: 10,
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#FFF4F4',
  },
  emptyState: {
    marginTop: 20,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#6B7280',
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    right: 27,
    bottom: 73,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F31E8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F31E8',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.34,
    shadowRadius: 14,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  textInput: {
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    padding: 14,
    color: '#1F2937',
    marginBottom: 12,
    fontSize: 14,
  },
  textArea: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  typePickerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
  },
  typeOptionActive: {
    backgroundColor: '#4F31E8',
  },
  typeOptionText: {
    color: '#4F31E8',
    fontWeight: '800',
  },
  typeOptionTextActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#4F31E8',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
