import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DEFAULT_SCHOOL_ID, DEFAULT_SCHOOL_NAME } from '../constants/school';

export default function FindSchoolScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role?: string }>();

  useEffect(() => {
    router.replace({
      pathname: '/sign-up',
      params: {
        role: role ?? 'parent',
        schoolId: DEFAULT_SCHOOL_ID,
        schoolName: DEFAULT_SCHOOL_NAME,
      },
    });
  }, [role, router]);

  return (
    <LinearGradient colors={['#EDE9F6', '#F0EEF8', '#EAF0F8']} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Ionicons name="school" size={40} color="#7B6FE8" />
        </View>
        <Text style={styles.title}>Loading school access...</Text>
        <Text style={styles.subtitle}>
          DMA PreSchool uses one school profile, so we are taking you directly to sign up.
        </Text>
        <ActivityIndicator color="#7B6FE8" />
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 16,
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9B8FE0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#7A7A9D',
    textAlign: 'center',
    lineHeight: 22,
  },
  backBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  backText: {
    color: '#5B4FD4',
    fontWeight: '700',
  },
});
