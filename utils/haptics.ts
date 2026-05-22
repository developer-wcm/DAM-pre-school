import * as Haptics from 'expo-haptics';

/**
 * Haptic feedback utility for consistent tactile feedback across the app
 */

export const hapticFeedback = {
  /**
   * Light impact - for subtle interactions like taps
   */
  light: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  /**
   * Medium impact - for standard button presses
   */
  medium: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  /**
   * Heavy impact - for important actions
   */
  heavy: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  /**
   * Success feedback - for successful operations
   */
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /**
   * Warning feedback - for warnings or cautions
   */
  warning: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  /**
   * Error feedback - for errors or failures
   */
  error: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  /**
   * Selection feedback - for picker/selector changes
   */
  selection: () => {
    Haptics.selectionAsync();
  },
};

/**
 * Haptic-enabled TouchableOpacity wrapper
 * Usage: <HapticTouchable onPress={...}>
 */
export const triggerHaptic = (
  type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection' = 'medium'
) => {
  hapticFeedback[type]();
};
