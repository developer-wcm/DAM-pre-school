import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <LinearGradient colors={['#EDE9F6', '#F0EEF8', '#EAF0F8']} style={styles.container}>
      {/* Decorative background shapes */}
      <View style={[styles.blob, styles.blobTopLeft]} />
      <View style={[styles.blob, styles.blobBottomRight]} />
      <View style={styles.triangle} />
      <View style={styles.star} />
      <View style={[styles.dot, styles.dotGreen]} />
      <View style={[styles.dot, styles.dotPurple]} />

      {/* Center content */}
      <View style={styles.centerContent}>
        <View style={styles.iconContainer}>
          <Ionicons name="school" size={44} color="#7B6FE8" />
        </View>
        <Text style={styles.title}>DMA PreSchool</Text>
        <Text style={styles.subtitle}>Managing little learners, effortlessly</Text>
      </View>

      {/* Bottom actions */}
      <View style={styles.bottomContent}>
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={() => router.push('/role-selection')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#7B6FE8', '#6EC6C6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.loginText}>
          Already have an account?{' '}
          <Text style={styles.loginLink} onPress={() => router.push('/login')}>
            Log in
          </Text>
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  blob: { position: 'absolute', borderRadius: 999, opacity: 0.35 },
  blobTopLeft: { width: 110, height: 110, backgroundColor: '#C4B5F4', top: 60, left: -40 },
  blobBottomRight: { width: 80, height: 80, backgroundColor: '#A8D8EA', bottom: 160, right: -20 },
  triangle: {
    position: 'absolute', top: 180, right: 60,
    width: 0, height: 0,
    borderLeftWidth: 30, borderRightWidth: 30, borderBottomWidth: 52,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: '#B8E0D4', opacity: 0.5,
  },
  star: {
    position: 'absolute', bottom: 260, left: 50,
    width: 40, height: 40, backgroundColor: '#F4C2A1',
    opacity: 0.4, transform: [{ rotate: '20deg' }], borderRadius: 4,
  },
  dot: { position: 'absolute', width: 12, height: 12, borderRadius: 6 },
  dotGreen: { backgroundColor: '#7DD4B0', top: 52, right: 70 },
  dotPurple: { backgroundColor: '#A89BE8', top: 52, right: 90 },

  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  iconContainer: {
    width: 90, height: 90, borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#9B8FE0', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 6, marginBottom: 8,
  },
  title: { fontSize: 30, fontWeight: '800', color: '#1A1A2E', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: '#7A7A9D', textAlign: 'center', lineHeight: 22 },

  bottomContent: { gap: 20, alignItems: 'center' },
  getStartedButton: {
    width: '100%', borderRadius: 50, overflow: 'hidden',
    shadowColor: '#7B6FE8', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  gradientButton: {
    paddingVertical: 18, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  getStartedText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  loginText: { fontSize: 14, color: '#5A5A7A' },
  loginLink: { color: '#7B6FE8', fontWeight: '600' },
});
