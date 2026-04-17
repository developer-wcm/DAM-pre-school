import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AdmissionStep2() {
  const router = useRouter();
  return (
    <LinearGradient colors={['#EDE9F6', '#F0EEF8', '#EAF0F8']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>Step 2 — Coming Soon</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 },
  text: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  backBtn: {
    backgroundColor: '#7B6FE8',
    borderRadius: 50,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  backText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
