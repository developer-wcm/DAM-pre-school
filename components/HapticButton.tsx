import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableOpacityProps,
    View,
    ViewStyle,
} from 'react-native';
import { COLORS } from '../constants/admissionTheme';
import { hapticFeedback } from '../utils/haptics';

interface HapticButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  hapticType?: 'light' | 'medium' | 'heavy';
  style?: ViewStyle;
}

export function HapticButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  hapticType = 'medium',
  style,
  ...props
}: HapticButtonProps) {
  const handlePress = () => {
    if (!disabled && !loading) {
      hapticFeedback[hapticType]();
      onPress();
    }
  };

  const buttonStyle = [
    styles.button,
    styles[`${size}Button`],
    variant === 'outline' && styles.outlineButton,
    variant === 'text' && styles.textButton,
    (disabled || loading) && styles.disabledButton,
    style,
  ];

  const textStyle = [
    styles.text,
    styles[`${size}Text`],
    variant === 'secondary' && styles.secondaryText,
    variant === 'outline' && styles.outlineText,
    variant === 'text' && styles.textButtonText,
    (disabled || loading) && styles.disabledText,
  ];

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        style={[styles.buttonWrapper, style]}
        {...props}
      >
        <LinearGradient
          colors={
            disabled || loading
              ? [COLORS.buttonDisabled, COLORS.buttonDisabled]
              : [COLORS.primary, COLORS.primaryLight]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.button, styles[`${size}Button`]]}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <View style={styles.content}>
              {icon}
              <Text style={textStyle}>{title}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        style={[styles.buttonWrapper, style]}
        {...props}
      >
        <LinearGradient
          colors={
            disabled || loading
              ? [COLORS.buttonDisabled, COLORS.buttonDisabled]
              : [COLORS.secondary, COLORS.secondaryLight]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.button, styles[`${size}Button`]]}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <View style={styles.content}>
              {icon}
              <Text style={textStyle}>{title}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={buttonStyle}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? COLORS.primary : COLORS.textSecondary} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={textStyle}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonWrapper: {
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  button: {
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  mediumButton: {
    paddingVertical: 16,
    paddingHorizontal: 28,
  },
  largeButton: {
    paddingVertical: 20,
    paddingHorizontal: 36,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  textButton: {
    backgroundColor: 'transparent',
  },
  disabledButton: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  secondaryText: {
    color: COLORS.white,
  },
  outlineText: {
    color: COLORS.primary,
  },
  textButtonText: {
    color: COLORS.primary,
  },
  disabledText: {
    color: COLORS.gray,
  },
});
