import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { AppColors, AppShadows } from '../../constants/theme';
import { useAuth } from '../../context/auth';
import { supabase } from '../../lib/supabase';

interface ClassFeeData {
  class: string;
  studentCount: number;
  collected: number;
  total: number;
  percentage: number;
}

interface OverdueStudent {
  id: string;
  full_name: string;
  class: string;
  amount: number;
  months_overdue: number;
}

interface FeeStats {
  expected: number;
  collected: number;
  due: number;
  percentage: number;
}

interface Student {
  id: string;
  full_name: string;
  class: string;
}

interface FeeRecord {
  id: string;
  label: string;
  amount: number;
  paid: boolean;
  due_date: string | null;
  installment_plan: string | null;
  installment_number: number | null;
}

const CLASS_COLORS: Record<string, string> = {
  PG: '#DAA520',
  PKG: '#E05A5A',
  JKG: '#1E3A5F',
  SKG: '#2A9D6E',
};

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function FeesScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const schoolId = profile?.school_id;

  const [stats, setStats] = useState<FeeStats>({
    expected: 0,
    collected: 0,
    due: 0,
    percentage: 0,
  });
  const [classData, setClassData] = useState<ClassFeeData[]>([]);
  const [overdueStudents, setOverdueStudents] = useState<OverdueStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Payment Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentFees, setStudentFees] = useState<FeeRecord[]>([]);
  const [selectedFees, setSelectedFees] = useState<Set<string>>(new Set());
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Cheque'>('Cash');
  const [transactionId, setTransactionId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingFees, setLoadingFees] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  async function fetchFeeData() {
    if (!schoolId) return;

    try {
      // Fetch all students with their fee data
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, full_name, class')
        .eq('school_id', schoolId)
        .eq('status', 'active');

      if (studentsError) throw studentsError;

      // Fetch all fees (exclude parent records)
      const { data: fees, error: feesError } = await supabase
        .from('fees')
        .select('student_id, amount, paid, due_date, installment_number')
        .eq('school_id', schoolId)
        .neq('installment_number', 0); // Exclude parent records

      if (feesError) throw feesError;

      // Calculate overall stats
      const totalExpected = fees?.reduce((sum, f) => sum + Number(f.amount), 0) || 0;
      const totalCollected = fees?.filter((f) => f.paid).reduce((sum, f) => sum + Number(f.amount), 0) || 0;
      const totalDue = totalExpected - totalCollected;
      const percentage = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

      setStats({
        expected: totalExpected,
        collected: totalCollected,
        due: totalDue,
        percentage,
      });

      // Calculate class-wise data
      const classFees: Record<string, { collected: number; total: number; count: number }> = {};

      students?.forEach((student) => {
        if (!student.class) return;
        
        if (!classFees[student.class]) {
          classFees[student.class] = { collected: 0, total: 0, count: 0 };
        }
        classFees[student.class].count += 1;

        const studentFees = fees?.filter((f) => f.student_id === student.id) || [];
        const studentTotal = studentFees.reduce((sum, f) => sum + Number(f.amount), 0);
        const studentCollected = studentFees.filter((f) => f.paid).reduce((sum, f) => sum + Number(f.amount), 0);

        classFees[student.class].total += studentTotal;
        classFees[student.class].collected += studentCollected;
      });

      const classDataArray: ClassFeeData[] = Object.entries(classFees).map(([cls, data]) => ({
        class: cls,
        studentCount: data.count,
        collected: data.collected,
        total: data.total,
        percentage: data.total > 0 ? Math.round((data.collected / data.total) * 100) : 0,
      }));

      setClassData(classDataArray);

      // Find overdue students
      const today = new Date().toISOString().split('T')[0];
      const overdueData: OverdueStudent[] = [];

      students?.forEach((student) => {
        const studentOverdueFees = fees?.filter(
          (f) => f.student_id === student.id && !f.paid && f.due_date && f.due_date < today
        ) || [];

        if (studentOverdueFees.length > 0) {
          const totalOverdue = studentOverdueFees.reduce((sum, f) => sum + Number(f.amount), 0);
          const oldestDueDate = studentOverdueFees.reduce((oldest, f) => {
            return !oldest || (f.due_date && f.due_date < oldest) ? f.due_date : oldest;
          }, '');

          const monthsOverdue = oldestDueDate
            ? Math.floor((new Date().getTime() - new Date(oldestDueDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
            : 0;

          overdueData.push({
            id: student.id,
            full_name: student.full_name,
            class: student.class,
            amount: totalOverdue,
            months_overdue: monthsOverdue,
          });
        }
      });

      // Sort by amount descending
      overdueData.sort((a, b) => b.amount - a.amount);
      setOverdueStudents(overdueData.slice(0, 10)); // Top 10 overdue
    } catch (error) {
      console.error('Error fetching fee data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchFeeData();
  }, [schoolId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFeeData();
  }, [schoolId]);

  const getClassLabel = (classCode: string) => {
    const labels: Record<string, string> = {
      PG: 'Play Group',
      PKG: 'Pre-KG',
      JKG: 'Junior KG',
      SKG: 'Senior KG',
    };
    return labels[classCode] || classCode;
  };

  async function loadAllStudents() {
    if (!schoolId) return;
    
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, class')
        .eq('school_id', schoolId)
        .eq('status', 'active')
        .order('full_name');

      if (error) throw error;
      setAllStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  }

  async function loadStudentFees(studentId: string) {
    if (!schoolId) return;
    
    setLoadingFees(true);
    try {
      const { data, error } = await supabase
        .from('fees')
        .select('*')
        .eq('student_id', studentId)
        .eq('school_id', schoolId)
        .neq('installment_number', 0)
        .order('due_date', { ascending: true });

      if (error) throw error;

      const records: FeeRecord[] = (data ?? []).map((f: any) => ({
        id: f.id,
        label: f.label ?? f.description ?? 'Fee',
        amount: Number(f.amount),
        paid: Boolean(f.paid),
        due_date: f.due_date ?? null,
        installment_plan: f.installment_plan ?? null,
        installment_number: f.installment_number ?? null,
      }));

      setStudentFees(records);
    } catch (error) {
      console.error('Error loading student fees:', error);
    } finally {
      setLoadingFees(false);
    }
  }

  function openPaymentModal() {
    loadAllStudents();
    setPaymentModalVisible(true);
  }

  function closePaymentModal() {
    setPaymentModalVisible(false);
    setSelectedStudent(null);
    setStudentFees([]);
    setSelectedFees(new Set());
    setPaymentMethod('Cash');
    setTransactionId('');
    setSearchQuery('');
  }

  function selectStudent(student: Student) {
    setSelectedStudent(student);
    setSearchQuery('');
    loadStudentFees(student.id);
  }

  function toggleFeeSelection(feeId: string) {
    const newSelected = new Set(selectedFees);
    if (newSelected.has(feeId)) {
      newSelected.delete(feeId);
    } else {
      newSelected.add(feeId);
    }
    setSelectedFees(newSelected);
  }

  async function handleSubmitPayment() {
    if (!selectedStudent || selectedFees.size === 0) {
      Alert.alert('Error', 'Please select at least one fee to pay');
      return;
    }

    setSubmittingPayment(true);
    try {
      const updates = Array.from(selectedFees).map((feeId) => ({
        id: feeId,
        paid: true,
        paid_date: new Date().toISOString().split('T')[0],
        payment_method: paymentMethod,
        transaction_id: transactionId || null,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('fees')
          .update({
            paid: update.paid,
            paid_date: update.paid_date,
            payment_method: update.payment_method,
            transaction_id: update.transaction_id,
          })
          .eq('id', update.id);

        if (error) throw error;
      }

      Alert.alert('Success', 'Payment recorded successfully');
      closePaymentModal();
      fetchFeeData(); // Refresh the dashboard
    } catch (error) {
      console.error('Error recording payment:', error);
      Alert.alert('Error', 'Failed to record payment. Please try again.');
    } finally {
      setSubmittingPayment(false);
    }
  }

  const filteredStudents = allStudents.filter((s) =>
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unpaidFees = studentFees.filter((f) => !f.paid);
  const totalSelectedAmount = studentFees
    .filter((f) => selectedFees.has(f.id))
    .reduce((sum, f) => sum + f.amount, 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primaryBlue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.primaryBlue} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Fee Management</Text>
            <Text style={styles.headerSubtitle}>Academic Year 2025-26</Text>
          </View>
          <TouchableOpacity style={styles.calendarBtn} activeOpacity={0.7}>
            <Ionicons name="calendar-outline" size={24} color={AppColors.primaryBlue} />
          </TouchableOpacity>
        </View>

        {/* Collection Circle */}
        <View style={styles.collectionCard}>
          <View style={styles.circleContainer}>
            {/* Background Circle */}
            <View style={styles.circleBackground} />
            
            {/* Progress Circle - using a simple approximation */}
            <View style={styles.circleProgressContainer}>
              <View
                style={[
                  styles.circleProgress,
                  {
                    transform: [{ rotate: `${(stats.percentage * 3.6) - 90}deg` }],
                  },
                ]}
              />
            </View>
            
            {/* Center Content */}
            <View style={styles.circleContent}>
              <Text style={styles.percentageText}>{stats.percentage}%</Text>
              <Text style={styles.percentageLabel}>COLLECTED</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>EXPECTED</Text>
              <Text style={styles.statValue}>{formatCurrency(stats.expected)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>COLLECTED</Text>
              <Text style={[styles.statValue, { color: AppColors.success }]}>
                {formatCurrency(stats.collected)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>DUE</Text>
              <Text style={[styles.statValue, { color: AppColors.error }]}>
                {formatCurrency(stats.due)}
              </Text>
            </View>
          </View>
        </View>

        {/* Class-wise Collection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Class-wise Collection</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {classData.map((item) => (
            <View key={item.class} style={styles.classCard}>
              <View style={styles.classHeader}>
                <View>
                  <Text style={styles.className}>{getClassLabel(item.class)}</Text>
                  <Text style={styles.classStudents}>{item.studentCount} Students</Text>
                </View>
                <View style={styles.classPercentageBadge}>
                  <Text style={styles.classPercentageText}>{item.percentage}%</Text>
                </View>
              </View>

              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${item.percentage}%`,
                        backgroundColor: CLASS_COLORS[item.class] || AppColors.primaryBlue,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.classFooter}>
                <Text style={styles.classAmount}>{formatCurrency(item.collected)}</Text>
                <Text style={styles.classTotal}>{formatCurrency(item.total)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Overdue Students */}
        {overdueStudents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.overdueHeader}>
              <Text style={styles.overdueTitle}>Overdue Students</Text>
              <View style={styles.overdueBadge}>
                <Text style={styles.overdueBadgeText}>{overdueStudents.length}</Text>
              </View>
            </View>

            {overdueStudents.map((student) => (
              <TouchableOpacity
                key={student.id}
                style={styles.overdueCard}
                activeOpacity={0.7}
                onPress={() => router.push(`/(dashboard)/student-profile?id=${student.id}`)}
              >
                <View style={styles.overdueLeft}>
                  <View style={styles.overdueAvatar}>
                    <Text style={styles.overdueAvatarText}>{getInitials(student.full_name)}</Text>
                  </View>
                  <View style={styles.overdueInfo}>
                    <Text style={styles.overdueName}>{student.full_name}</Text>
                    <Text style={styles.overdueClass}>{student.class}</Text>
                    <View style={styles.overdueWarning}>
                      <Ionicons name="alert-circle" size={12} color={AppColors.error} />
                      <Text style={styles.overdueWarningText}>
                        {student.months_overdue} {student.months_overdue === 1 ? 'month' : 'months'} overdue
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.overdueRight}>
                  <Text style={styles.overdueAmount}>{formatCurrency(student.amount)}</Text>
                  <Ionicons name="chevron-forward" size={20} color={AppColors.textLight} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Record Payment Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={styles.fab} 
          activeOpacity={0.85}
          onPress={openPaymentModal}
        >
          <Ionicons name="card-outline" size={24} color={AppColors.white} />
          <Text style={styles.fabText}>Record Payment</Text>
        </TouchableOpacity>
      </View>

      {/* Payment Modal */}
      <Modal
        visible={paymentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closePaymentModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Payment</Text>
              <TouchableOpacity onPress={closePaymentModal} activeOpacity={0.7}>
                <Ionicons name="close" size={28} color={AppColors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Student Selection */}
              {!selectedStudent ? (
                <View style={styles.studentSelectionSection}>
                  <Text style={styles.sectionLabel}>Select Student</Text>
                  
                  {/* Search Bar */}
                  <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color={AppColors.textSecondary} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search student by name..."
                      placeholderTextColor={AppColors.textTertiary}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>

                  {/* Student List */}
                  <ScrollView style={styles.studentList} nestedScrollEnabled>
                    {filteredStudents.map((student) => (
                      <TouchableOpacity
                        key={student.id}
                        style={styles.studentItem}
                        onPress={() => selectStudent(student)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.studentAvatar}>
                          <Text style={styles.studentAvatarText}>
                            {getInitials(student.full_name)}
                          </Text>
                        </View>
                        <View style={styles.studentInfo}>
                          <Text style={styles.studentName}>{student.full_name}</Text>
                          <Text style={styles.studentClass}>{getClassLabel(student.class)}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={AppColors.textLight} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ) : (
                <View style={styles.paymentSection}>
                  {/* Selected Student */}
                  <View style={styles.selectedStudentCard}>
                    <View style={styles.selectedStudentInfo}>
                      <View style={styles.studentAvatar}>
                        <Text style={styles.studentAvatarText}>
                          {getInitials(selectedStudent.full_name)}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.selectedStudentName}>{selectedStudent.full_name}</Text>
                        <Text style={styles.selectedStudentClass}>
                          {getClassLabel(selectedStudent.class)}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedStudent(null);
                        setStudentFees([]);
                        setSelectedFees(new Set());
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.changeStudentText}>Change</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Fee Selection */}
                  <Text style={styles.sectionLabel}>Select Fees to Pay</Text>
                  
                  {loadingFees ? (
                    <ActivityIndicator size="small" color={AppColors.primaryBlue} style={{ marginVertical: 20 }} />
                  ) : unpaidFees.length === 0 ? (
                    <View style={styles.noFeesCard}>
                      <Ionicons name="checkmark-circle" size={48} color={AppColors.success} />
                      <Text style={styles.noFeesText}>All fees paid!</Text>
                    </View>
                  ) : (
                    <View style={styles.feesList}>
                      {unpaidFees.map((fee) => (
                        <TouchableOpacity
                          key={fee.id}
                          style={[
                            styles.feeItem,
                            selectedFees.has(fee.id) && styles.feeItemSelected,
                          ]}
                          onPress={() => toggleFeeSelection(fee.id)}
                          activeOpacity={0.7}
                        >
                          <View style={[
                            styles.feeCheckbox,
                            selectedFees.has(fee.id) && { backgroundColor: AppColors.primaryBlue }
                          ]}>
                            {selectedFees.has(fee.id) && (
                              <Ionicons name="checkmark" size={18} color={AppColors.white} />
                            )}
                          </View>
                          <View style={styles.feeInfo}>
                            <Text style={styles.feeLabel}>{fee.label}</Text>
                            {fee.installment_plan && (
                              <Text style={styles.feeInstallment}>
                                {fee.installment_plan} - Installment {fee.installment_number}
                              </Text>
                            )}
                            {fee.due_date && (
                              <Text style={styles.feeDueDate}>
                                Due: {new Date(fee.due_date).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </Text>
                            )}
                          </View>
                          <Text style={styles.feeAmount}>{formatCurrency(fee.amount)}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {unpaidFees.length > 0 && selectedFees.size > 0 && (
                    <>
                      {/* Payment Method */}
                      <Text style={styles.sectionLabel}>Payment Method</Text>
                      <View style={styles.paymentMethods}>
                        {(['Cash', 'UPI', 'Card', 'Cheque'] as const).map((method) => (
                          <TouchableOpacity
                            key={method}
                            style={[
                              styles.paymentMethodBtn,
                              paymentMethod === method && styles.paymentMethodBtnActive,
                            ]}
                            onPress={() => setPaymentMethod(method)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.paymentMethodText,
                                paymentMethod === method && styles.paymentMethodTextActive,
                              ]}
                            >
                              {method}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* Transaction ID */}
                      {paymentMethod !== 'Cash' && (
                        <View style={styles.transactionIdSection}>
                          <Text style={styles.sectionLabel}>Transaction ID (Optional)</Text>
                          <TextInput
                            style={styles.transactionInput}
                            placeholder="Enter transaction ID"
                            placeholderTextColor={AppColors.textTertiary}
                            value={transactionId}
                            onChangeText={setTransactionId}
                          />
                        </View>
                      )}

                      {/* Total Amount */}
                      <View style={styles.totalCard}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalAmount}>{formatCurrency(totalSelectedAmount)}</Text>
                      </View>

                      {/* Submit Button */}
                      <TouchableOpacity
                        style={[styles.submitBtn, submittingPayment && styles.submitBtnDisabled]}
                        onPress={handleSubmitPayment}
                        disabled={submittingPayment}
                        activeOpacity={0.8}
                      >
                        {submittingPayment ? (
                          <ActivityIndicator size="small" color={AppColors.white} />
                        ) : (
                          <Text style={styles.submitBtnText}>Record Payment</Text>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.background,
  },
  scrollContent: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: AppColors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 4,
  },
  calendarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...AppShadows.cardShadow,
  },

  // Collection Circle
  collectionCard: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    ...AppShadows.cardShadow,
  },
  circleContainer: {
    position: 'relative',
    width: 160,
    height: 160,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleBackground: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 12,
    borderColor: AppColors.blueLight,
  },
  circleProgressContainer: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
  },
  circleProgress: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 12,
    borderColor: 'transparent',
    borderTopColor: AppColors.primaryBlue,
    borderRightColor: AppColors.primaryBlue,
  },
  circleContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 40,
    fontWeight: '800',
    color: AppColors.primaryBlue,
  },
  percentageLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.textSecondary,
    letterSpacing: 1,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.primaryBlue,
  },

  // Class Card
  classCard: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...AppShadows.cardShadow,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  className: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  classStudents: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  classPercentageBadge: {
    backgroundColor: AppColors.successLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  classPercentageText: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.success,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: AppColors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  classFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.success,
  },
  classTotal: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },

  // Overdue
  overdueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  overdueTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginRight: 8,
  },
  overdueBadge: {
    backgroundColor: AppColors.errorLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  overdueBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.error,
  },
  overdueCard: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...AppShadows.cardShadow,
  },
  overdueLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  overdueAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  overdueAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.error,
  },
  overdueInfo: {
    flex: 1,
  },
  overdueName: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  overdueClass: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  overdueWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  overdueWarningText: {
    fontSize: 12,
    color: AppColors.error,
    fontWeight: '600',
    marginLeft: 4,
  },
  overdueRight: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
  },
  overdueAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.error,
    marginRight: 8,
  },

  // FAB
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    left: 20,
  },
  fab: {
    backgroundColor: AppColors.primaryBlue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 50,
    ...AppShadows.elevatedShadow,
  },
  fabText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: AppColors.textPrimary,
  },

  // Student Selection
  studentSelectionSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textSecondary,
    marginBottom: 12,
    marginTop: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: AppColors.textPrimary,
  },
  studentList: {
    maxHeight: 300,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: AppColors.background,
    borderRadius: 12,
    marginBottom: 8,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.white,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  studentClass: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 2,
  },

  // Payment Section
  paymentSection: {
    marginBottom: 20,
  },
  selectedStudentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AppColors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  selectedStudentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedStudentName: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  selectedStudentClass: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  changeStudentText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.primaryBlue,
  },

  // Fees List
  noFeesCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noFeesText: {
    fontSize: 16,
    color: AppColors.textSecondary,
    marginTop: 12,
  },
  feesList: {
    marginBottom: 16,
  },
  feeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: AppColors.background,
    borderRadius: 12,
    marginBottom: 8,
  },
  feeItemSelected: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: AppColors.primaryBlue,
  },
  feeCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: AppColors.textSecondary,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feeInfo: {
    flex: 1,
  },
  feeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  feeInstallment: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  feeDueDate: {
    fontSize: 12,
    color: AppColors.textTertiary,
    marginTop: 2,
  },
  feeAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginLeft: 12,
  },

  // Payment Methods
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  paymentMethodBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: AppColors.background,
    borderWidth: 2,
    borderColor: AppColors.background,
  },
  paymentMethodBtnActive: {
    backgroundColor: '#EEF2FF',
    borderColor: AppColors.primaryBlue,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  paymentMethodTextActive: {
    color: AppColors.primaryBlue,
  },

  // Transaction ID
  transactionIdSection: {
    marginBottom: 16,
  },
  transactionInput: {
    backgroundColor: AppColors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: AppColors.textPrimary,
  },

  // Total
  totalCard: {
    backgroundColor: AppColors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: AppColors.primaryBlue,
  },

  // Submit
  submitBtn: {
    backgroundColor: AppColors.primaryBlue,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
