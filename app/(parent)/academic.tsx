import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants/admissionTheme';

interface DayStatus {
  date: number;
  status?: 'present' | 'absent' | 'halfday' | 'holiday' | 'break' | 'today';
}

interface Event {
  id: string;
  date: string;
  day: string;
  month: string;
  title: string;
  description: string;
  type: 'event' | 'holiday';
  icon?: string;
}

export default function ParentAcademicScreen() {
  const [currentMonth] = useState('February');
  const [currentYear] = useState('2026');

  // Mock calendar data for February 2026
  const calendarDays: DayStatus[] = [
    // Week 1
    { date: 2, status: 'present' },
    { date: 3, status: 'absent' },
    { date: 4, status: 'present' },
    { date: 5, status: 'present' },
    { date: 6, status: 'present' },
    { date: 7 },
    { date: 8 },
    // Week 2
    { date: 9, status: 'present' },
    { date: 10, status: 'today' },
    { date: 11 },
    { date: 12, status: 'break' },
    { date: 13 },
    { date: 14 },
    { date: 15 },
    // Week 3
    { date: 16, status: 'break' },
    { date: 17 },
    { date: 18 },
    { date: 19, status: 'holiday' },
    { date: 20 },
    { date: 21 },
    { date: 22 },
    // Week 4
    { date: 23 },
    { date: 24 },
    { date: 25 },
    { date: 26, status: 'holiday' },
    { date: 27 },
    { date: 28 },
  ];

  const attendanceStats = {
    present: 15,
    absent: 2,
    halfDay: 1,
    holidays: 2,
  };

  const upcomingEvents: Event[] = [
    {
      id: '1',
      date: '14',
      day: 'FEB',
      month: 'FEB',
      title: "Valentine's Day",
      description: 'Classroom celebration & craft time',
      type: 'event',
    },
    {
      id: '2',
      date: '19',
      day: 'FEB',
      month: 'FEB',
      title: 'Shivaji Jayanti',
      description: 'School Closed',
      type: 'holiday',
      icon: '🚩',
    },
  ];

  const getDayColor = (status?: string) => {
    switch (status) {
      case 'present':
        return COLORS.success;
      case 'absent':
        return COLORS.error;
      case 'halfday':
        return '#FFA500';
      case 'holiday':
        return '#FF6B9D';
      case 'break':
        return '#60A5FA';
      case 'today':
        return COLORS.primary;
      default:
        return COLORS.textPrimary;
    }
  };

  const getDayBgColor = (status?: string) => {
    switch (status) {
      case 'present':
        return '#E8F8F0';
      case 'absent':
        return '#FFE8E8';
      case 'halfday':
        return '#FFF4E6';
      case 'holiday':
        return '#FFE8F0';
      case 'break':
        return '#E0F2FE';
      case 'today':
        return COLORS.primary;
      default:
        return 'transparent';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Calendar</Text>
          <View style={styles.subtitleRow}>
            <Ionicons name="calendar" size={14} color={COLORS.primary} />
            <Text style={styles.headerSubtitle}>Priya's Attendance & School Events</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar Card */}
        <View style={styles.calendarCard}>
          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity style={styles.navButton} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.monthText}>{currentMonth} {currentYear}</Text>
            <TouchableOpacity style={styles.navButton} activeOpacity={0.7}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Weekday Headers */}
          <View style={styles.weekdayRow}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <Text key={day} style={styles.weekdayText}>{day}</Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {/* Empty cells for days before month starts (Feb 2026 starts on Sunday) */}
            {[28, 29, 30, 31].map((date) => (
              <View key={`prev-${date}`} style={styles.dayCell}>
                <Text style={styles.prevMonthDay}>{date}</Text>
              </View>
            ))}

            {/* Actual month days */}
            {calendarDays.map((day) => (
              <TouchableOpacity 
                key={day.date} 
                style={styles.dayCell}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.dayCircle,
                  day.status && { backgroundColor: getDayBgColor(day.status) }
                ]}>
                  <Text style={[
                    styles.dayText,
                    day.status && { 
                      color: day.status === 'today' ? COLORS.white : getDayColor(day.status),
                      fontWeight: day.status === 'today' ? '700' : '600'
                    }
                  ]}>
                    {day.date}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Empty cells for next month */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((date) => (
              <View key={`next-${date}`} style={styles.dayCell}>
                <Text style={styles.nextMonthDay}>{date}</Text>
              </View>
            ))}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
                <Text style={styles.legendText}>Present</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.error }]} />
                <Text style={styles.legendText}>Absent</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FFA500' }]} />
                <Text style={styles.legendText}>Half Day</Text>
              </View>
            </View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FF6B9D' }]} />
                <Text style={styles.legendText}>Holiday</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#60A5FA' }]} />
                <Text style={styles.legendText}>Break</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.primary, borderWidth: 2, borderColor: COLORS.primary }]} />
                <Text style={styles.legendText}>Today</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Attendance Summary */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>February Attendance</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#E8F8F0' }]}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            </View>
            <Text style={styles.statNumber}>{attendanceStats.present}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FFE8E8' }]}>
              <Ionicons name="close-circle" size={24} color={COLORS.error} />
            </View>
            <Text style={styles.statNumber}>{attendanceStats.absent}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FFF4E6' }]}>
              <Ionicons name="time" size={24} color="#FFA500" />
            </View>
            <Text style={styles.statNumber}>{attendanceStats.halfDay}</Text>
            <Text style={styles.statLabel}>Half Day</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="umbrella" size={24} color="#60A5FA" />
            </View>
            <Text style={styles.statNumber}>{attendanceStats.holidays}</Text>
            <Text style={styles.statLabel}>Holidays</Text>
          </View>
        </View>

        {/* Upcoming Events */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
        </View>

        <View style={styles.eventsList}>
          {upcomingEvents.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <View style={[
                styles.eventDate,
                { 
                  backgroundColor: event.type === 'holiday' ? COLORS.errorLight : COLORS.secondarySoft,
                  borderLeftWidth: 4,
                  borderLeftColor: event.type === 'holiday' ? COLORS.error : COLORS.secondary
                }
              ]}>
                <Text style={[styles.eventMonth, { color: event.type === 'holiday' ? COLORS.error : COLORS.secondary }]}>
                  {event.month}
                </Text>
                <Text style={[styles.eventDay, { color: event.type === 'holiday' ? COLORS.error : COLORS.secondary }]}>
                  {event.date}
                </Text>
              </View>

              <View style={styles.eventContent}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <View style={[
                    styles.eventTypeBadge,
                    { backgroundColor: event.type === 'holiday' ? COLORS.errorLight : COLORS.secondarySoft }
                  ]}>
                    <Text style={[
                      styles.eventTypeText,
                      { color: event.type === 'holiday' ? COLORS.error : COLORS.secondary }
                    ]}>
                      {event.type === 'holiday' ? 'HOLIDAY' : 'EVENT'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.eventDescription}>{event.description}</Text>
              </View>

              {event.icon && (
                <View style={styles.eventIconCircle}>
                  <Text style={styles.eventIcon}>{event.icon}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },

  // Calendar Card
  calendarCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
    width: 36,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  dayCell: {
    width: '13.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  prevMonthDay: {
    fontSize: 13,
    fontWeight: '500',
    color: '#D0D0D0',
  },
  nextMonthDay: {
    fontSize: 13,
    fontWeight: '500',
    color: '#D0D0D0',
  },
  legend: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },

  // Section Header
  sectionHeader: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // Events List
  eventsList: {
    gap: 12,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  eventDate: {
    width: 56,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventMonth: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  eventDay: {
    fontSize: 20,
    fontWeight: '800',
  },
  eventContent: {
    flex: 1,
    gap: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  eventTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  eventTypeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  eventDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textLight,
  },
  eventIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF4E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventIcon: {
    fontSize: 20,
  },
});
