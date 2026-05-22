import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants/admissionTheme';

interface PaymentRecord {
  id: string;
  month: string;
  year: string;
  amount: number;
  status: 'paid' | 'overdue' | 'pending' | 'partial';
  receiptNumber?: string;
  dueDate?: string;
  partialAmount?: number;
}

export default function ParentFeesScreen() {
  // Mock data - replace with actual data from Supabase
  const totalFee = 70000;
  const paidAmount = 35000;
  const outstandingAmount = 35000;
  const paymentPercentage = (paidAmount / totalFee) * 100;

  const paymentHistory: PaymentRecord[] = [
    {
      id: '1',
      month: 'June',
      year: '2025',
      amount: 7000,
      status: 'paid',
      receiptNumber: 'RCP-00001',
    },
    {
      id: '2',
      month: 'July',
      year: '2025',
      amount: 7000,
      status: 'overdue',
      dueDate: '05 July 2025',
    },
    {
      id: '3',
      month: 'August',
      year: '2025',
      amount: 7000,
      status: 'pending',
      dueDate: '05 Aug 2025',
    },
    {
      id: '4',
      month: 'Sept',
      year: '2025',
      amount: 7000,
      status: 'partial',
      partialAmount: 3000,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return COLORS.success;
      case 'overdue':
        return COLORS.error;
      case 'pending':
        return '#FFA500';
      case 'partial':
        return '#FF8C00';
      default:
        return COLORS.textLight;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return '✓';
      case 'overdue':
        return '!';
      case 'pending':
        return '⏱';
      case 'partial':
        return '◐';
      default:
        return '';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#E8F8F0';
      case 'overdue':
        return '#FFE8E8';
      case 'pending':
        return '#FFF4E6';
      case 'partial':
        return '#FFE8D6';
      default:
        return '#F5F5F5';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fee Summary</Text>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarEmoji}>👧</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Academic Year Badge */}
        <View style={styles.yearBadge}>
          <Text style={styles.yearText}>2025-26 • </Text>
          <Text style={styles.classText}>Junior KG</Text>
        </View>

        {/* Fee Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Academic Fee</Text>
          <Text style={styles.totalAmount}>₹{totalFee.toLocaleString('en-IN')}</Text>

          <View style={styles.amountRow}>
            <View style={styles.amountBox}>
              <View style={styles.amountHeader}>
                <View style={styles.greenDot} />
                <Text style={styles.amountLabel}>Paid</Text>
              </View>
              <Text style={styles.paidAmount}>₹{paidAmount.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.amountBox}>
              <View style={styles.amountHeader}>
                <View style={styles.redDot} />
                <Text style={styles.amountLabel}>Outstanding</Text>
              </View>
              <Text style={styles.outstandingAmount}>₹{outstandingAmount.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>{Math.round(paymentPercentage)}% Paid</Text>
            <Text style={styles.goalLabel}>Goal: 100%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${paymentPercentage}%` }]} />
          </View>
        </View>

        {/* Payment History Section */}
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Payment History</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.downloadLink}>Download Statement</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Records */}
        <View style={styles.paymentList}>
          {paymentHistory.map((payment, index) => (
            <View key={payment.id}>
              <View style={styles.paymentRow}>
                <View style={[styles.statusIcon, { backgroundColor: getStatusBgColor(payment.status) }]}>
                  <Text style={[styles.statusIconText, { color: getStatusColor(payment.status) }]}>
                    {getStatusIcon(payment.status)}
                  </Text>
                </View>

                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentMonth}>{payment.month} {payment.year}</Text>
                  {payment.receiptNumber && (
                    <Text style={styles.paymentDetail}>{payment.receiptNumber}</Text>
                  )}
                  {payment.dueDate && (
                    <Text style={styles.paymentDetail}>Due: {payment.dueDate}</Text>
                  )}
                  {payment.partialAmount && (
                    <Text style={styles.paymentDetail}>₹{payment.partialAmount.toLocaleString('en-IN')} Paid</Text>
                  )}
                </View>

                <View style={styles.paymentRight}>
                  <Text style={styles.paymentAmount}>₹{payment.amount.toLocaleString('en-IN')}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(payment.status) }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>

              {index < paymentHistory.length - 1 && (
                <View style={styles.timelineLine} />
              )}
            </View>
          ))}
        </View>

        {/* Contact Button */}
        <TouchableOpacity style={styles.contactButton} activeOpacity={0.8}>
          <Ionicons name="headset" size={20} color={COLORS.primary} />
          <Text style={styles.contactText}>Contact School for Fee Queries</Text>
        </TouchableOpacity>

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFE8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },

  // Year Badge
  yearBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
  },
  yearText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  classText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textLight,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 20,
  },
  amountRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  amountBox: {
    flex: 1,
  },
  amountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  paidAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.success,
  },
  outstandingAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.error,
  },
  progressSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  goalLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textLight,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: 4,
  },

  // History Header
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  downloadLink: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Payment List
  paymentList: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconText: {
    fontSize: 18,
    fontWeight: '700',
  },
  paymentInfo: {
    flex: 1,
    gap: 2,
  },
  paymentMonth: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  paymentDetail: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textLight,
  },
  paymentRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timelineLine: {
    width: 2,
    height: 20,
    backgroundColor: '#F0F0F0',
    marginLeft: 19,
    marginVertical: 4,
  },

  // Contact Button
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: COLORS.primarySoft,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  contactText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
