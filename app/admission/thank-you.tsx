import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
    Animated,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/admissionTheme';
import { IMAGES } from '../../constants/images';

export default function ThankYouScreen() {
  const router = useRouter();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const checkmarkAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const emojiAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const cardRotateAnim = useRef(new Animated.Value(0)).current;

  // Mock data
  const applicationData = {
    studentName: 'Priya Kumar',
    class: 'Junior KG',
    submittedDate: '29 Apr 2026',
    referenceNumber: 'DMA-2026-00847',
    status: 'Under Review'
  };

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

    // Checkmark animation with delay
    setTimeout(() => {
      Animated.timing(checkmarkAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 300);

    // Emoji bounce animation
    setTimeout(() => {
      Animated.sequence([
        Animated.spring(emojiAnim, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(emojiAnim, {
          toValue: 0.9,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(emojiAnim, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
      ]).start();
    }, 600);

    // Title scale animation
    setTimeout(() => {
      Animated.spring(titleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }, 800);

    // Subtle card rotation animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(cardRotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(cardRotateAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation for circles
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <LinearGradient 
        colors={[COLORS.primary, COLORS.primaryLight, `${COLORS.secondary}40`]}
        style={styles.headerSection}
      >
        <Animated.View 
          style={[
            styles.headerContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* School Name */}
          <Text style={styles.schoolName}>DMA PRESCHOOL</Text>

          {/* Checkmark Circle */}
          <View style={styles.checkmarkContainer}>
            {/* Pulse circles */}
            <Animated.View 
              style={[
                styles.pulseCircle,
                styles.pulseCircleOuter,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.2],
                    outputRange: [0.3, 0.1]
                  })
                }
              ]}
            />
            <Animated.View 
              style={[
                styles.pulseCircle,
                styles.pulseCircleInner,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.2],
                    outputRange: [0.5, 0.2]
                  })
                }
              ]}
            />
            
            {/* Main logo circle */}
            <Animated.View
              style={[
                styles.checkmarkCircle,
                {
                  transform: [{ scale: checkmarkAnim }]
                }
              ]}
            >
              <Image 
                source={IMAGES.schoolLogo} 
                style={styles.schoolLogoImage}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          {/* Celebration Emoji */}
          <Animated.Text 
            style={[
              styles.celebrationEmoji,
              {
                transform: [{ scale: emojiAnim }]
              }
            ]}
          >
            🎉
          </Animated.Text>

          {/* Thank You Text */}
          <Animated.Text 
            style={[
              styles.thankYouTitle,
              {
                transform: [{ scale: titleAnim }]
              }
            ]}
          >
            Thank You for Applying!
          </Animated.Text>
          <Text style={styles.thankYouSubtitle}>
            We've received your admission request for{'\n'}
            <Text style={styles.studentNameHighlight}>{applicationData.studentName}</Text>. The school will review{'\n'}
            and contact you shortly.
          </Text>
        </Animated.View>
      </LinearGradient>

      {/* Content Section */}
      <View style={styles.contentWrapper}>
        <ScrollView 
          style={styles.contentSection}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Card */}
          <Animated.View 
            style={[
              styles.statusCard,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { 
                    rotateZ: cardRotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '1deg']
                    })
                  }
                ]
              }
            ]}
          >
            <View style={styles.statusContent}>
              <View style={styles.statusIcon}>
                <Text style={styles.statusEmoji}>⏳</Text>
              </View>
              <Text style={styles.statusText}>Pending Admin Approval</Text>
            </View>
          </Animated.View>

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
              <Text style={styles.summaryTitle}>Application Summary</Text>
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
        </ScrollView>

        {/* Bottom Buttons */}
        <Animated.View 
          style={[
            styles.bottomButtons,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.statusButton}
            activeOpacity={0.8}
            onPress={() => router.push('/admission/application-summary')}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.statusButtonGradient}
            >
              <Text style={styles.statusButtonText}>Application Summary</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.white 
  },

  // Header Section
  headerSection: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 20,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: '600',
    color: `${COLORS.white}CC`,
    letterSpacing: 2,
    marginBottom: 30,
    textAlign: 'center',
  },

  // Checkmark Animation
  checkmarkContainer: {
    position: 'relative',
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 2,
    borderColor: `${COLORS.white}40`,
  },
  pulseCircleOuter: {
    width: 140,
    height: 140,
  },
  pulseCircleInner: {
    width: 110,
    height: 110,
  },
  checkmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  schoolLogoImage: {
    width: 60,
    height: 60,
  },

  // Text Content
  celebrationEmoji: {
    fontSize: 32,
    marginBottom: 16,
  },
  thankYouTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  thankYouSubtitle: {
    fontSize: 15,
    color: `${COLORS.white}E6`,
    textAlign: 'center',
    lineHeight: 22,
  },
  studentNameHighlight: {
    fontWeight: '700',
    color: '#FFD54F',
  },

  // Content Section
  contentWrapper: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  contentSection: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Reduced for single button
  },

  // Status Card
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: `${COLORS.secondary}20`,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.warningLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusEmoji: { fontSize: 16 },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.warning,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
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
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  summaryDetails: { gap: 14 },
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${COLORS.warning}30`,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.warning,
  },

  // Bottom Buttons
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  statusButton: {
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  statusButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  statusButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});