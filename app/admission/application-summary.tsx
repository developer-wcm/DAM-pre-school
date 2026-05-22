import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/admissionTheme';

export default function ApplicationSummaryScreen() {
  const router = useRouter();
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [showExitButton, setShowExitButton] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Mock data
  const applicationData = {
    studentName: 'Priya Kumar',
    class: 'Junior KG',
    submittedDate: '29 Apr 2026',
    referenceNumber: 'DMA-2026-00847',
    status: 'Under Review'
  };

  const nextSteps = [
    {
      step: '1',
      title: 'Application Received',
      description: 'Your documents are safely submitted.',
      completed: true,
      icon: 'checkmark-circle',
      color: COLORS.success
    },
    {
      step: '2',
      title: 'Admin Reviews Application',
      description: 'School admin verifies your details within 2–3 working days.',
      completed: false,
      icon: 'person-circle',
      color: COLORS.warning
    },
    {
      step: '3',
      title: 'School Contacts You',
      description: 'You\'ll receive a call or message from the school.',
      completed: false,
      icon: 'call',
      color: COLORS.primary
    },
    {
      step: '4',
      title: 'Approval Code Sent',
      description: 'A 6-digit code is sent via SMS / WhatsApp / Email.',
      completed: false,
      icon: 'mail',
      color: COLORS.secondary
    },
    {
      step: '5',
      title: 'Access Your Dashboard',
      description: 'Enter the code to unlock your child\'s full profile.',
      completed: false,
      icon: 'apps',
      color: COLORS.success
    }
  ];

  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const toggleStep = (index: number) => {
    setExpandedStep(expandedStep === index ? null : index);
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    
    if (isCloseToBottom && !showExitButton) {
      setShowExitButton(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Application Summary</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content Section */}
      <ScrollView 
        style={styles.contentSection}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Application Summary */}
        <Animated.View 
          style={[
            styles.summaryCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIcon}>
              <Ionicons name="document-text" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.summaryTitle}>Application Details</Text>
          </View>

          <View style={styles.summaryDetails}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Student</Text>
              <Text style={styles.summaryValue}>{applicationData.studentName}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Class</Text>
              <Text style={styles.summaryValue}>{applicationData.class}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Submitted</Text>
              <Text style={styles.summaryValue}>{applicationData.submittedDate}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.summaryRow} 
              activeOpacity={0.7}
              onPress={() => console.log('Reference number copied')}
            >
              <Text style={styles.summaryLabel}>Ref. No.</Text>
              <View style={styles.referenceContainer}>
                <Text style={styles.summaryValue}>{applicationData.referenceNumber}</Text>
                <Ionicons name="copy-outline" size={14} color={COLORS.secondary} />
              </View>
            </TouchableOpacity>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Status</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{applicationData.status}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* What Happens Next */}
        <Animated.View 
          style={[
            styles.nextStepsCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.nextStepsTitle}>What Happens Next</Text>
          
          {nextSteps.map((step, index) => (
            <TouchableOpacity
              key={index}
              style={styles.stepItem}
              activeOpacity={0.8}
              onPress={() => toggleStep(index)}
            >
              <View style={styles.stepHeader}>
                <View style={[
                  styles.stepNumber, 
                  { backgroundColor: step.completed ? step.color : COLORS.lightGray }
                ]}>
                  {step.completed ? (
                    <Ionicons name="checkmark" size={14} color={COLORS.white} />
                  ) : (
                    <Text style={[
                      styles.stepNumberText, 
                      { color: step.completed ? COLORS.white : COLORS.gray }
                    ]}>
                      {step.step}
                    </Text>
                  )}
                </View>
                
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
                
                <View style={[styles.stepIcon, { backgroundColor: step.color + '20' }]}>
                  <Ionicons name={step.icon as any} size={16} color={step.color} />
                </View>
              </View>
              
              {expandedStep === index && (
                <View style={styles.stepExpanded}>
                  <Text style={styles.stepExpandedText}>
                    {step.completed 
                      ? "✅ This step has been completed successfully."
                      : "⏳ This step is pending and will be processed soon."
                    }
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Notification Info */}
        <Animated.View 
          style={[
            styles.notificationCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.notificationContent}>
            <View style={styles.notificationIcon}>
              <Ionicons name="notifications" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.notificationText}>
              We'll notify you via SMS, WhatsApp & Email as soon as your application is approved.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Exit Button - Only shown after scrolling to bottom */}
      {showExitButton && (
        <Animated.View 
          style={[
            styles.bottomButton,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.exitButton}
            activeOpacity={0.8}
            onPress={() => router.replace('/')}
          >
            <Ionicons name="log-out-outline" size={18} color={COLORS.white} />
            <Text style={styles.exitButtonText}>Exit</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },

  // Content Section
  contentSection: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 120,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.successLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  summaryDetails: { gap: 12 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  referenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadge: {
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.warning,
  },

  // Next Steps Card
  nextStepsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  nextStepsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 18,
    textAlign: 'center',
  },
  stepItem: {
    marginBottom: 14,
    borderRadius: 12,
    padding: 12,
    backgroundColor: COLORS.offWhite + '50',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray,
  },
  stepContent: { flex: 1 },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  stepDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  stepExpanded: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  stepExpandedText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },

  // Notification Card
  notificationCard: {
    backgroundColor: COLORS.successLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
    marginBottom: 20,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  notificationText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.primary,
    lineHeight: 20,
    fontWeight: '500',
  },

  // Bottom Exit Button
  bottomButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.error,
    borderRadius: 50,
    paddingVertical: 18,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  exitButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
