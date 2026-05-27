import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/admissionTheme';
import { IMAGES } from '../constants/images';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Background decorative elements */}
      <View style={[styles.decorativeCircle, styles.topLeftCircle]} />
      <View style={[styles.decorativeCircle, styles.topRightDots]} />
      <View style={[styles.decorativeCircle, styles.bottomRightCircle]} />
      <View style={[styles.decorativeShape, styles.triangleShape]} />
      <View style={[styles.decorativeShape, styles.squareShape]} />
      <View style={[styles.decorativeCircle, styles.midLeftCircle]} />
      <View style={[styles.decorativeCircle, styles.smallDot1]} />
      <View style={[styles.decorativeCircle, styles.smallDot2]} />
      <View style={[styles.decorativeShape, styles.hexagonShape]} />

      {/* Main content */}
      <View style={styles.content}>
        {/* Logo container */}
        <View style={styles.logoContainer}>
          <Image 
            source={IMAGES.schoolLogo}
            style={styles.schoolLogo}
            contentFit="contain"
            transition={300}
            cachePolicy="memory-disk"
          />
        </View>

        {/* School name */}
        <Text style={styles.schoolName}>David & Mary Academy</Text>
        
        {/* Tagline */}
        <Text style={styles.tagline}>Managing little learners, effortlessly</Text>
      </View>

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={() => router.push('/privacy-notice')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.getStartedText}>Get Started →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  
  // Enhanced decorative elements
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.15,
  },
  decorativeShape: {
    position: 'absolute',
    opacity: 0.12,
  },
  topLeftCircle: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.secondary,
    top: 60,
    left: -40,
  },
  topRightDots: {
    width: 12,
    height: 12,
    backgroundColor: COLORS.primary,
    top: 80,
    right: 60,
  },
  bottomRightCircle: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.secondaryLight,
    bottom: 180,
    right: -25,
  },
  midLeftCircle: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.primaryLight,
    top: '45%',
    left: -20,
  },
  smallDot1: {
    width: 8,
    height: 8,
    backgroundColor: COLORS.secondary,
    top: 120,
    right: 100,
  },
  smallDot2: {
    width: 6,
    height: 6,
    backgroundColor: COLORS.primary,
    bottom: 250,
    left: 80,
  },
  triangleShape: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 20,
    borderRightWidth: 20,
    borderBottomWidth: 35,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.secondarySoft,
    top: 200,
    right: 40,
    transform: [{ rotate: '15deg' }],
  },
  squareShape: {
    width: 30,
    height: 30,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 6,
    bottom: 300,
    left: 50,
    transform: [{ rotate: '25deg' }],
  },
  hexagonShape: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.secondarySoft,
    borderRadius: 8,
    top: '35%',
    right: 30,
    transform: [{ rotate: '45deg' }],
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  logoContainer: {
    width: 160,
    height: 160,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    padding: 20,
  },
  schoolLogo: {
    width: '100%',
    height: '100%',
  },
  schoolName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '400',
  },

  bottomSection: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  getStartedButton: {
    width: '100%',
    borderRadius: 50,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  gradientButton: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
  },
  getStartedText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
