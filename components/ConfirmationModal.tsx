import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS } from '../constants/admissionTheme';
import { triggerHaptic } from '../utils/haptics';
import GradientButton from './GradientButton';

interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  appointmentData: {
    teacherName: string;
    date: string;
    time: string;
    topic: string;
  };
  type: 'booking' | 'reschedule';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  onClose,
  appointmentData,
  type,
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  // Animate modal entrance
  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Animate modal exit
  const animateOut = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  // Handle done button press with haptic feedback
  const handleDone = () => {
    triggerHaptic('light');
    animateOut(() => {
      onClose();
    });
  };

  // Handle tap outside to dismiss
  const handleOverlayPress = () => {
    animateOut(() => {
      onClose();
    });
  };

  // Trigger animation when visible becomes true
  useEffect(() => {
    if (visible) {
      animateIn();
    }
  }, [visible]);

  const title =
    type === 'booking'
      ? 'Appointment Requested!'
      : 'Reschedule Request Sent!';

  const message =
    type === 'booking'
      ? 'Your appointment request has been sent to the teacher. You will be notified once it is confirmed.'
      : 'Your reschedule request has been sent to the teacher. You will be notified once it is confirmed.';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDone}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={handleOverlayPress}
          testID="confirmation-modal-overlay"
        >
          <Animated.View
            style={[
              styles.content,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
            onStartShouldSetResponder={() => true}
            testID="confirmation-modal-content"
          >
            <Ionicons
              name="calendar-outline"
              size={64}
              color="#7B6FE8"
              style={styles.icon}
            />

            <Text style={styles.title}>{title}</Text>

            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Teacher:</Text>
                <Text style={styles.detailValue}>
                  {appointmentData.teacherName}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>{appointmentData.date}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time:</Text>
                <Text style={styles.detailValue}>{appointmentData.time}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Topic:</Text>
                <Text style={styles.detailValue}>{appointmentData.topic}</Text>
              </View>
            </View>

            <Text style={styles.message}>{message}</Text>

            <GradientButton label="Done" onPress={handleDone} />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlayTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  icon: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  detailsBox: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    width: '100%',
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    width: 60,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  message: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ConfirmationModal;
