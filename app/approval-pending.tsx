import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ApprovalPendingScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  const handleCheckStatus = () => {
    setChecking(true);
    // Simulate a status check — replace with real API call
    setTimeout(() => setChecking(false), 1500);
  };

  return (
    <LinearGradient colors={['#EDE9F6', '#F0EEF8', '#EAF0F8']} style={styles.container}>
      {/* Top label */}
      <Text style={styles.topLabel}>DMA PRESCHOOL</Text>

      {/* Center content */}
      <View style={styles.centerContent}>
        {/* Clock icon */}
        <View style={styles.clockCircle}>
          <Text style={styles.clockEmoji}>🕐</Text>
        </View>

        <Text style={styles.title}>Account Pending</Text>
        <Text style={styles.subtitle}>
          {"Your registration is being reviewed by the school administrator. You'll be notified once approved."}
        </Text>

        {/* Notification info box */}
        <View style={styles.infoBox}>
          <Text style={styles.bellEmoji}>🔔</Text>
          <Text style={styles.infoText}>
            {"You'll receive a notification when your account is approved."}
          </Text>
        </View>
      </View>

      {/* Bottom actions */}
      <View style={styles.bottomContent}>
        <TouchableOpacity
          style={styles.checkButton}
          onPress={handleCheckStatus}
          activeOpacity={0.85}
        >
          {checking ? (
            <ActivityIndicator color="#3D3AB0" size="small" />
          ) : (
            <Text style={styles.checkButtonText}>Check Status  ↻</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/')} activeOpacity={0.7}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 56,
    paddingBottom: 44,
    justifyContent: 'space-between',
  },

  // Top label
  topLabel: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2.5,
    color: '#A0A0C0',
  },

  // Center
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 8,
  },
  clockCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8E4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  clockEmoji: {
    fontSize: 44,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#7A7A9D',
    textAlign: 'center',
    lineHeight: 23,
  },

  // Info box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#DFF0FF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  bellEmoji: {
    fontSize: 18,
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#3A5A9A',
    lineHeight: 20,
    fontWeight: '500',
  },

  // Bottom
  bottomContent: {
    gap: 16,
    alignItems: 'center',
  },
  checkButton: {
    width: '100%',
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#3D3AB0',
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    minHeight: 56,
  },
  checkButtonText: {
    color: '#3D3AB0',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  signOutText: {
    fontSize: 15,
    color: '#E05A5A',
    fontWeight: '600',
  },
});
