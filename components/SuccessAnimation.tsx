import LottieView from 'lottie-react-native';
import React, { useEffect, useRef } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/admissionTheme';

interface SuccessAnimationProps {
  visible: boolean;
  message?: string;
  onComplete?: () => void;
  duration?: number;
}

export function SuccessAnimation({
  visible,
  message = 'Success!',
  onComplete,
  duration = 2000,
}: SuccessAnimationProps) {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (visible) {
      animationRef.current?.play();

      const timer = setTimeout(() => {
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, onComplete]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LottieView
            ref={animationRef}
            source={require('../assets/animations/success.json')}
            autoPlay
            loop={false}
            style={styles.animation}
          />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

// Alternative: Simple checkmark animation without Lottie file
export function SimpleSuccessAnimation({
  visible,
  message = 'Success!',
  onComplete,
  duration = 2000,
}: SuccessAnimationProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, onComplete]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.checkmarkContainer}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  animation: {
    width: 120,
    height: 120,
  },
  checkmarkContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkmark: {
    fontSize: 48,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  message: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: 8,
  },
});
