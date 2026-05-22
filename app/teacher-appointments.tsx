import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/admissionTheme';

interface Appointment {
  id: string;
  parentName: string;
  parentAvatar: string;
  studentName: string;
  date: string;
  time: string;
  topic: string;
  status: 'requested' | 'confirmed';
}

export default function TeacherAppointmentsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const appointments: Appointment[] = [
    {
      id: '1',
      parentName: 'Mrs. Sunita Kumar',
      parentAvatar: '👩',
      studentName: 'Priya Kumar',
      date: 'Oct 24, 2023',
      time: '10:00 AM',
      topic: 'Behavioral concerns',
      status: 'requested',
    },
    {
      id: '2',
      parentName: 'Mr. Arjun Singh',
      parentAvatar: '👨',
      studentName: 'Rohan Singh',
      date: 'Oct 25, 2023',
      time: '2:00 PM',
      topic: 'Annual Review',
      status: 'confirmed',
    },
  ];

  const upcomingAppointments = appointments.filter(a => activeTab === 'upcoming');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Appointments</Text>
        <TouchableOpacity style={styles.calendarButton} activeOpacity={0.7}>
          <Ionicons name="calendar" size={24} color={COLORS.primary} />
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
        {upcomingAppointments.map((appointment) => (
          <View key={appointment.id} style={styles.appointmentCard}>
            {/* Parent Info */}
            <View style={styles.parentRow}>
              <View style={styles.parentAvatar}>
                <Text style={styles.parentAvatarEmoji}>{appointment.parentAvatar}</Text>
              </View>
              <View style={styles.parentInfo}>
                <View style={styles.parentNameRow}>
                  <Text style={styles.parentName}>{appointment.parentName}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: appointment.status === 'confirmed' ? COLORS.successLight : COLORS.warningLight }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: appointment.status === 'confirmed' ? COLORS.success : COLORS.warning }
                    ]}>
                      ● {appointment.status === 'confirmed' ? 'Confirmed' : 'Requested'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.studentName}>for {appointment.studentName}</Text>
              </View>
            </View>

            {/* Appointment Details */}
            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                <Text style={styles.detailText}>{appointment.date} • {appointment.time}</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="chatbox-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.detailText}>Topic: {appointment.topic}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            {appointment.status === 'requested' ? (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.confirmButton} activeOpacity={0.8}>
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rescheduleButton} activeOpacity={0.8}>
                  <Text style={styles.rescheduleButtonText}>Reschedule</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.notesButton} activeOpacity={0.8}>
                <Ionicons name="pencil" size={18} color={COLORS.primary} />
                <Text style={styles.notesButtonText}>Add Notes for Meeting</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

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
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  calendarButton: {
    width: 44,
    height: 44,
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

  // Parent Row
  parentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  parentAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  parentAvatarEmoji: {
    fontSize: 32,
  },
  parentInfo: {
    flex: 1,
    gap: 4,
  },
  parentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  parentName: {
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
  studentName: {
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
  confirmButton: {
    flex: 1,
    backgroundColor: COLORS.successLight,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.success,
  },
  rescheduleButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.lightGray,
  },
  rescheduleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },

  // Notes Button
  notesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 12,
    paddingVertical: 14,
  },
  notesButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
