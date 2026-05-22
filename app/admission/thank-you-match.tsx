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

export default function ThankYouMatchScreen() {
  const router = useRouter();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const checkmarkAnim = useRef(new Animated.Value(0)).current;
  const emojiAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start entrance animations
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

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
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section with Gradient */}
      <LinearGradient 
        colors={[COLORS.primary, COLORS.primaryLight, `${COLORS.secondary}60`]}
        style={styles.headerSection}
      >
        <Animated.View 
          style={[
            styles.headerContent,
            { opacity: fadeAnim }
          ]}
        >
          {/* School Name */}
          <Text style={styles.schoolName}>DMA PRESCHOOL</Text>

          {/* Checkmark Circle */}
          <View style={styles.checkmarkContainer}>
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
            <Text style={styles.studentNameHighlight}>Priya Kumar</Text>. The school will review{'\n'}
            and contact you shortly.
          </Text>
        </Animated.View>
      </LinearGradient>

      {/* Content Section */}
      <ScrollView 
        style={styles.contentSection}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <Animated.View 
          style={[
            styles.statusCard,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.statusContent}>
            <View style={styles.statusIcon}>
              <Text style={styles.statusEmoji}>⏳</Text>
            </View>
            <Text style={styles.statusText}>Pending Admin Approval</Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity 
          style={styles.summaryButton}
          activeOpacity={0.8}
          onPress={() => router.push('/admission/application-summary')}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.summaryButtonGradient}
          >
            <Text style={styles.summaryButtonText}>Application Summary</Text>
          </LinearGradient>
        </TouchableOpacity>
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

  // Checkmark
  checkmarkContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  thankYouSubtitle: {
    fontSize: 14,
    color: `${COLORS.white}E6`,
    textAlign: 'center',
    lineHeight: 20,
  },
  studentNameHighlight: {
    fontWeight: '700',
    color: '#FFD54F',
  },

  // Content Section
  contentSection: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
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

  // Bottom Button
  bottomButtons: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  summaryButton: {
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  summaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  summaryButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});