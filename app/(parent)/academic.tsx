import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../../constants/admissionTheme';
import { useChild } from '../../context/child';
import { getIndianHolidays, IndianHoliday } from '../../lib/indianHolidays';
import { supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type AttStatus = 'present' | 'absent' | 'late';

interface DayData {
  date: number;
  attendance: AttStatus | null;
  isToday: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isWeekend: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toYMD(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getDayColor(d: DayData) {
  if (d.isToday) return COLORS.white;
  if (d.isHoliday) return '#FF6B9D';
  if (d.attendance === 'present') return COLORS.success;
  if (d.attendance === 'absent') return COLORS.error;
  if (d.attendance === 'late') return '#FFA500';
  if (d.isWeekend) return '#9CA3AF';
  return COLORS.textPrimary;
}

function getDayBg(d: DayData) {
  if (d.isToday) return COLORS.primary;
  if (d.isHoliday) return '#FFE8F0';
  if (d.attendance === 'present') return '#E8F8F0';
  if (d.attendance === 'absent') return '#FFE8E8';
  if (d.attendance === 'late') return '#FFF4E6';
  return 'transparent';
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ParentAcademicScreen() {
  const { activeChild } = useChild();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  const [attendance, setAttendance] = useState<Record<string, AttStatus>>({});
  const [holidays, setHolidays] = useState<IndianHoliday[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!activeChild?.id || !activeChild.school_id) return;
    setLoading(true);

    const monthStart = toYMD(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0).getDate();
    const monthEnd = toYMD(viewYear, viewMonth, lastDay);

    const todayKey = toYMD(today.getFullYear(), today.getMonth(), today.getDate());

    const [attRes, holidaysData] = await Promise.all([
      supabase
        .from('attendance')
        .select('date, status')
        .eq('student_id', activeChild.id)
        .gte('date', monthStart)
        .lte('date', monthEnd),
      getIndianHolidays(activeChild.school_id, todayKey).catch(() => [] as IndianHoliday[]),
    ]);

    const attMap: Record<string, AttStatus> = {};
    for (const row of attRes.data ?? []) {
      attMap[row.date] = row.status as AttStatus;
    }
    setAttendance(attMap);
    setHolidays(holidaysData);
    setLoading(false);
    setRefreshing(false);
  }, [activeChild?.id, activeChild?.school_id, viewYear, viewMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchData(); }, [fetchData]);

  // ── Calendar layout ──────────────────────────────────────────────────────

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayKey = toYMD(today.getFullYear(), today.getMonth(), today.getDate());

  // Build a set of holiday date strings for this month
  const holidaySet = new Set<string>();
  const holidayNameMap: Record<string, string> = {};
  for (const h of holidays) {
    const start = new Date(h.date);
    const end = h.date_to ? new Date(h.date_to) : start;
    const cur = new Date(start);
    while (cur <= end) {
      const key = cur.toISOString().split('T')[0];
      holidaySet.add(key);
      holidayNameMap[key] = h.name;
      cur.setDate(cur.getDate() + 1);
    }
  }

  const days: DayData[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const key = toYMD(viewYear, viewMonth, d);
    const weekday = new Date(viewYear, viewMonth, d).getDay();
    days.push({
      date: d,
      attendance: attendance[key] ?? null,
      isToday: key === todayKey,
      isHoliday: holidaySet.has(key),
      holidayName: holidayNameMap[key],
      isWeekend: weekday === 0 || weekday === 6,
    });
  }

  // Stats
  const presentCount = Object.values(attendance).filter((s) => s === 'present').length;
  const absentCount  = Object.values(attendance).filter((s) => s === 'absent').length;
  const lateCount    = Object.values(attendance).filter((s) => s === 'late').length;
  const holidayCount = days.filter((d) => d.isHoliday && !d.isWeekend).length;

  // Upcoming holidays (from today forward, next 5)
  const upcomingHolidays = holidays
    .filter((h) => (h.date_to ?? h.date) >= todayKey)
    .slice(0, 5);

  // Month navigation
  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Calendar</Text>
          <View style={styles.subtitleRow}>
            <Ionicons name="calendar" size={14} color={COLORS.primary} />
            <Text style={styles.headerSubtitle}>
              {activeChild?.full_name ? `${activeChild.full_name}'s` : 'Attendance &'} School Calendar
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Calendar Card */}
        <View style={styles.calendarCard}>
          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity style={styles.navButton} onPress={prevMonth} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.monthText}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
            <TouchableOpacity style={styles.navButton} onPress={nextMonth} activeOpacity={0.7}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Weekday Headers */}
          <View style={styles.weekdayRow}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <Text key={day} style={styles.weekdayText}>{day}</Text>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 30 }} />
          ) : (
            <View style={styles.calendarGrid}>
              {/* Empty cells before month start */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.dayCell} />
              ))}

              {days.map((day) => (
                <View key={day.date} style={styles.dayCell}>
                  <View style={[styles.dayCircle, { backgroundColor: getDayBg(day) }]}>
                    <Text style={[styles.dayText, { color: getDayColor(day), fontWeight: day.isToday ? '800' : '600' }]}>
                      {day.date}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendRow}>
              {[
                { color: COLORS.success, label: 'Present' },
                { color: COLORS.error,   label: 'Absent'  },
                { color: '#FFA500',      label: 'Late'    },
              ].map(({ color, label }) => (
                <View key={label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: color }]} />
                  <Text style={styles.legendText}>{label}</Text>
                </View>
              ))}
            </View>
            <View style={styles.legendRow}>
              {[
                { color: '#FF6B9D', label: 'Holiday' },
                { color: '#9CA3AF', label: 'Weekend' },
                { color: COLORS.primary, label: 'Today' },
              ].map(({ color, label }) => (
                <View key={label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: color }]} />
                  <Text style={styles.legendText}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Monthly Attendance Stats */}
        <Text style={styles.sectionTitle}>{MONTH_NAMES[viewMonth]} Attendance</Text>
        <View style={styles.statsGrid}>
          {[
            { icon: 'checkmark-circle', bg: '#E8F8F0', color: COLORS.success, count: presentCount, label: 'Present' },
            { icon: 'close-circle',     bg: '#FFE8E8', color: COLORS.error,   count: absentCount,  label: 'Absent'  },
            { icon: 'time',             bg: '#FFF4E6', color: '#FFA500',      count: lateCount,    label: 'Late'    },
            { icon: 'umbrella',         bg: '#FFE8F0', color: '#FF6B9D',      count: holidayCount, label: 'Holidays'},
          ].map(({ icon, bg, color, count, label }) => (
            <View key={label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: bg }]}>
                <Ionicons name={icon as any} size={24} color={color} />
              </View>
              <Text style={styles.statNumber}>{count}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Upcoming Holidays */}
        {upcomingHolidays.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Upcoming Holidays</Text>
            <View style={styles.eventsList}>
              {upcomingHolidays.map((h, idx) => {
                const start = new Date(h.date);
                const isMultiDay = h.date_to && h.date_to !== h.date;
                const daysUntil = Math.ceil(
                  (start.getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)
                );
                const isToday = daysUntil === 0;
                const badgeColor = isToday ? COLORS.error : '#FF6B9D';
                return (
                  <View key={idx} style={styles.eventCard}>
                    <View style={[styles.eventDateBox, { backgroundColor: '#FFE8F0', borderLeftColor: badgeColor }]}>
                      <Text style={[styles.eventMonth, { color: badgeColor }]}>
                        {MONTH_NAMES[start.getMonth()].slice(0, 3).toUpperCase()}
                      </Text>
                      <Text style={[styles.eventDay, { color: badgeColor }]}>{start.getDate()}</Text>
                    </View>
                    <View style={styles.eventContent}>
                      <View style={styles.eventHeader}>
                        <Text style={styles.eventTitle} numberOfLines={1}>{h.name}</Text>
                        <View style={[styles.eventTypeBadge, { backgroundColor: '#FFE8F0' }]}>
                          <Text style={[styles.eventTypeText, { color: badgeColor }]}>HOLIDAY</Text>
                        </View>
                      </View>
                      <Text style={styles.eventDescription}>
                        {isToday ? 'Today' : `${daysUntil} day${daysUntil !== 1 ? 's' : ''} away`}
                        {isMultiDay ? ` • ${h.days} days` : ''}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: COLORS.background,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerSubtitle: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, gap: 20 },

  calendarCard: {
    backgroundColor: COLORS.white, borderRadius: 24, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 4,
  },
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20,
  },
  navButton: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center',
  },
  monthText: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  weekdayRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  weekdayText: {
    fontSize: 12, fontWeight: '600', color: COLORS.textLight, width: 36, textAlign: 'center',
  },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  dayCell: { width: '13.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  dayCircle: {
    width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
  },
  dayText: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },

  legend: {
    marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0', gap: 8,
  },
  legendRow: { flexDirection: 'row', justifyContent: 'space-around' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, fontWeight: '500', color: COLORS.textSecondary },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginTop: 4 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    flex: 1, minWidth: '47%', backgroundColor: COLORS.white, borderRadius: 16,
    padding: 16, alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  statIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },

  eventsList: { gap: 12 },
  eventCard: {
    flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 16,
    padding: 16, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  eventDateBox: {
    width: 56, paddingVertical: 8, borderRadius: 12, alignItems: 'center',
    justifyContent: 'center', borderLeftWidth: 4,
  },
  eventMonth: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  eventDay: { fontSize: 20, fontWeight: '800' },
  eventContent: { flex: 1, gap: 4 },
  eventHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  eventTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  eventTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  eventTypeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  eventDescription: { fontSize: 13, fontWeight: '500', color: COLORS.textLight },
});
