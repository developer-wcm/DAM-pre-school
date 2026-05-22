import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ClassOption = {
  id: string;
  name: string;
  ageRange: string;
  description: string;
  icon: string;
  iconBg: string;
};

const CLASS_OPTIONS: ClassOption[] = [
  {
    id: 'play-group',
    name: 'Play Group',
    ageRange: 'Ages 2+',
    description: 'Early childhood',
    icon: '🌱',
    iconBg: '#E8F5E8',
  },
  {
    id: 'pre-kg',
    name: 'Pre-KG',
    ageRange: 'Ages 3+',
    description: 'Foundation stage',
    icon: '🎨',
    iconBg: '#FFF0E6',
  },
  {
    id: 'junior-kg',
    name: 'Junior KG',
    ageRange: 'Ages 4+',
    description: 'Primary prep',
    icon: '📚',
    iconBg: '#E6F3FF',
  },
  {
    id: 'senior-kg',
    name: 'Senior KG',
    ageRange: 'Ages 5+',
    description: 'Pre-primary final',
    icon: '🎓',
    iconBg: '#F0E6FF',
  },
];

export default function SelectClassScreen() {
  const router = useRouter();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedClass) {
      const selectedClassData = CLASS_OPTIONS.find(c => c.id === selectedClass);
      console.log('Navigating with:', {
        selectedClass,
        className: selectedClassData?.name
      });
      
      // Navigate to actual enter-class-id screen
      router.push({
        pathname: '/enter-class-id',
        params: {
          selectedClass,
          className: selectedClassData?.name || 'Selected Class'
        }
      });
    } else {
      console.log('No class selected');
    }
  };

  return (
    <LinearGradient colors={['#F8F9FF', '#EDF2F7', '#E2E8F0']} style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          {/* School icon */}
          <View style={styles.schoolIcon}>
            <Ionicons name="school" size={28} color="#1B3A6B" />
          </View>

          {/* Status indicator */}
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Ionicons name="person" size={14} color="#2ECC71" />
            <Text style={styles.statusText}>Teacher Account Verified</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>Select Your Assigned Class</Text>
          
          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Choose the class assigned to you by the{' '}
            <Text style={styles.principalText}>Principal</Text>. You'll only see your students.
          </Text>
        </View>

        {/* Class options */}
        <View style={styles.classContainer}>
          {CLASS_OPTIONS.map((classOption) => (
            <TouchableOpacity
              key={classOption.id}
              style={[
                styles.classCard,
                selectedClass === classOption.id && styles.classCardSelected
              ]}
              onPress={() => setSelectedClass(classOption.id)}
              activeOpacity={0.8}
            >
              {/* Class icon */}
              <View style={[styles.classIcon, { backgroundColor: classOption.iconBg }]}>
                <Text style={styles.classEmoji}>{classOption.icon}</Text>
              </View>

              {/* Class info */}
              <View style={styles.classInfo}>
                <Text style={styles.className}>{classOption.name}</Text>
                <Text style={styles.classDetails}>
                  {classOption.ageRange} • {classOption.description}
                </Text>
              </View>

              {/* Selection indicator */}
              <View style={styles.selectionArea}>
                {selectedClass === classOption.id ? (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </View>
                ) : (
                  <View style={styles.unselectedIndicator} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedClass && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!selectedClass}
          activeOpacity={selectedClass ? 0.8 : 1}
        >
          <LinearGradient
            colors={selectedClass ? ['#1B3A6B', '#DAA520'] : ['#CBD5E0', '#CBD5E0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={[
              styles.continueText,
              !selectedClass && styles.continueTextDisabled
            ]}>
              Continue to Class ID
            </Text>
            <Ionicons 
              name="arrow-forward" 
              size={18} 
              color={selectedClass ? "#FFFFFF" : "#9A9AB0"} 
            />
          </LinearGradient>
        </TouchableOpacity>

        {/* Footer note */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Assigned by <Text style={styles.footerBold}>Principal / Admin</Text> only.
          </Text>
          <Text style={styles.footerSubtext}>
            Contact support if you face any issues
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  schoolIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#1B3A6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2ECC71',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2ECC71',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  principalText: {
    fontWeight: '600',
    color: '#1B3A6B',
  },

  // Class options
  classContainer: {
    gap: 16,
    marginBottom: 32,
  },
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: '#1B3A6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  classCardSelected: {
    borderColor: '#1B3A6B',
    shadowOpacity: 0.15,
  },
  classIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  classEmoji: {
    fontSize: 28,
  },
  classInfo: {
    flex: 1,
    gap: 4,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  classDetails: {
    fontSize: 14,
    color: '#718096',
  },
  selectionArea: {
    width: 24,
    height: 24,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1B3A6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unselectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },

  // Continue button
  continueButton: {
    borderRadius: 50,
    marginBottom: 24,
    shadowColor: '#1B3A6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  continueButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  gradientButton: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  continueTextDisabled: {
    color: '#9A9AB0',
  },

  // Footer
  footer: {
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  footerBold: {
    fontWeight: '600',
    color: '#1B3A6B',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#A0AEC0',
    textAlign: 'center',
  },
});