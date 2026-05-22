import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/admissionTheme';

export default function ParentDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('My Child');

  // Mock data
  const childData = {
    name: 'Priya Kumar',
    class: 'JUNIOR KG',
    id: 'PS-2025-001',
    avatar: '👧', // Using emoji as placeholder
    attendance: {
      present: 17,
      total: 20,
      percentage: 85,
      period: 'Feb 2026'
    },
    fees: {
      amount: 35000,
      status: 'OUTSTANDING',
      nextDue: 'March 15, 2026'
    },
    progress: {
      title: 'Term 1 Assessment',
      rating: 4,
      status: 'Very Good'
    }
  };

  const CircularProgress = ({ percentage, size = 60 }: { percentage: number; size?: number }) => {
    return (
      <View style={[styles.circularProgress, { width: size, height: size }]}>
        <View style={[styles.progressBackground, { width: size, height: size, borderRadius: size / 2 }]} />
        <View style={[styles.progressForeground, { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          transform: [{ rotate: `${(percentage / 100) * 360}deg` }]
        }]} />
        <View style={[styles.progressInner, { 
          width: size - 8, 
          height: size - 8, 
          borderRadius: (size - 8) / 2 
        }]}>
          <Text style={styles.progressText}>{percentage}%</Text>
        </View>
      </View>
    );
  };

  const StarRating = ({ rating, maxRating = 5 }: { rating: number; maxRating?: number }) => {
    return (
      <View style={styles.starContainer}>
        {Array.from({ length: maxRating }).map((_, index) => (
          <Ionicons
            key={index}
            name="star"
            size={16}
            color={index < rating ? COLORS.secondary : COLORS.lightGray}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>{childData.avatar}</Text>
            </View>
          </View>
          
          <Text style={styles.childName}>{childData.name}</Text>
          
          <View style={styles.classIdContainer}>
            <View style={styles.classBadge}>
              <Text style={styles.classText}>{childData.class}</Text>
            </View>
            <Text style={styles.idText}>ID: {childData.id}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.bookApptButton} activeOpacity={0.8}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bookApptGradient}
              >
                <Ionicons name="calendar" size={16} color={COLORS.white} />
                <Text style={styles.bookApptText}>Book Appt.</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.calendarButton} activeOpacity={0.8}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
              <Text style={styles.calendarText}>Calendar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cards Section */}
        <View style={styles.cardsSection}>
          {/* Attendance Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <View style={styles.attendanceIcon}>
                  <Text style={styles.iconDot}>•</Text>
                </View>
                <Text style={styles.cardTitle}>ATTENDANCE</Text>
              </View>
              <CircularProgress percentage={childData.attendance.percentage} />
            </View>
            
            <View style={styles.attendanceDetails}>
              <Text style={styles.attendanceNumbers}>
                {childData.attendance.present} / {childData.attendance.total}
              </Text>
              <Text style={styles.attendancePeriod}>
                Days present • {childData.attendance.period}
              </Text>
            </View>
          </View>

          {/* Fee Status Card */}
          <View style={styles.card}>
            <View style={styles.feeHeader}>
              <Text style={styles.feeStatusLabel}>FEE STATUS</Text>
              <View style={styles.outstandingBadge}>
                <Text style={styles.outstandingText}>{childData.fees.status}</Text>
              </View>
            </View>
            
            <View style={styles.feeAmount}>
              <Text style={styles.currencySymbol}>₹</Text>
              <Text style={styles.amountText}>{childData.fees.amount.toLocaleString()}</Text>
            </View>
            
            <Text style={styles.nextDueText}>
              Next due: {childData.fees.nextDue}
            </Text>
          </View>

          {/* Latest Progress Card */}
          <View style={styles.card}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>LATEST PROGRESS</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.lightGray} />
            </View>
            
            <View style={styles.progressContent}>
              <View style={styles.progressIcon}>
                <Ionicons name="star" size={20} color={COLORS.secondary} />
              </View>
              <View style={styles.progressDetails}>
                <Text style={styles.progressTitle}>{childData.progress.title}</Text>
                <View style={styles.progressRating}>
                  <StarRating rating={childData.progress.rating} />
                  <Text style={styles.progressStatus}>{childData.progress.status}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.recentActivity}>
          <Text style={styles.recentActivityTitle}>Recent Activity</Text>
          {/* Add recent activity items here if needed */}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'My Child' && styles.navItemActive]}
          onPress={() => setActiveTab('My Child')}
        >
          <Ionicons 
            name="heart" 
            size={20} 
            color={activeTab === 'My Child' ? COLORS.primary : COLORS.gray} 
          />
          <Text style={[
            styles.navText, 
            activeTab === 'My Child' && styles.navTextActive
          ]}>
            My Child
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'Fees' && styles.navItemActive]}
          onPress={() => setActiveTab('Fees')}
        >
          <Ionicons 
            name="card" 
            size={20} 
            color={activeTab === 'Fees' ? COLORS.primary : COLORS.gray} 
          />
          <Text style={[
            styles.navText, 
            activeTab === 'Fees' && styles.navTextActive
          ]}>
            Fees
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'Academic' && styles.navItemActive]}
          onPress={() => setActiveTab('Academic')}
        >
          <Ionicons 
            name="calendar" 
            size={20} 
            color={activeTab === 'Academic' ? COLORS.primary : COLORS.gray} 
          />
          <Text style={[
            styles.navText, 
            activeTab === 'Academic' && styles.navTextActive
          ]}>
            Academic
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'Account' && styles.navItemActive]}
          onPress={() => setActiveTab('Account')}
        >
          <Ionicons 
            name="person" 
            size={20} 
            color={activeTab === 'Account' ? COLORS.primary : COLORS.gray} 
          />
          <Text style={[
            styles.navText, 
            activeTab === 'Account' && styles.navTextActive
          ]}>
            Account
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF', // Softer light blue-white background
  },
  scrollView: {
    flex: 1,
  },

  // Profile Section
  profileSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    backgroundColor: 'linear-gradient(135deg, #F8F9FF 0%, #EEF2FF 100%)', // Subtle gradient
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 3,
    borderColor: COLORS.secondary + '20', // Subtle gold border
  },
  avatarEmoji: {
    fontSize: 40,
  },
  childName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary, // Navy blue for name
    marginBottom: 12,
  },
  classIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  classBadge: {
    backgroundColor: COLORS.secondary, // Gold background
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  classText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white, // White text on gold
    letterSpacing: 0.5,
  },
  idText: {
    fontSize: 14,
    color: COLORS.primary, // Navy blue for ID
    fontWeight: '600',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  bookApptButton: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  bookApptGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  bookApptText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  calendarButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: COLORS.secondary, // Gold border
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarText: {
    color: COLORS.secondary, // Gold text
    fontSize: 16,
    fontWeight: '700',
  },

  // Cards Section
  cardsSection: {
    paddingHorizontal: 20,
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.offWhite, // Subtle border
  },

  // Attendance Card
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attendanceIcon: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
  },
  iconDot: {
    fontSize: 8,
    color: COLORS.success,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary, // Navy blue for titles
    letterSpacing: 1,
  },
  attendanceDetails: {
    alignItems: 'flex-start',
  },
  attendanceNumbers: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary, // Navy blue for numbers
    marginBottom: 4,
  },
  attendancePeriod: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Circular Progress
  circularProgress: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressBackground: {
    position: 'absolute',
    borderWidth: 4,
    borderColor: COLORS.offWhite,
  },
  progressForeground: {
    position: 'absolute',
    borderWidth: 4,
    borderColor: COLORS.success,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  progressInner: {
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
  },

  // Fee Card
  feeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  feeStatusLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary, // Navy blue for labels
    letterSpacing: 1,
  },
  outstandingBadge: {
    backgroundColor: COLORS.errorLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  outstandingText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.error,
    letterSpacing: 0.5,
  },
  feeAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.secondary, // Gold for currency
    marginRight: 4,
  },
  amountText: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary, // Navy blue for amount
  },
  nextDueText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Progress Card
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary, // Navy blue for labels
    letterSpacing: 1,
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.secondary + '20', // Light gold background
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.secondary + '30',
  },
  progressDetails: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary, // Navy blue for title
    marginBottom: 4,
  },
  progressRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  progressStatus: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Recent Activity
  recentActivity: {
    padding: 20,
    paddingBottom: 100, // Space for bottom nav
  },
  recentActivityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary, // Navy blue for section title
    marginBottom: 16,
  },

  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.offWhite,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    // Active state styling handled by text/icon colors
  },
  navText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  navTextActive: {
    color: COLORS.primary, // Navy blue for active
  },
});