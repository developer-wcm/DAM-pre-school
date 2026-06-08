import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, ViewStyle } from 'react-native';

interface AnimatedProgressBarProps {
  /** 0–100 */
  percent: number;
  color: string;
  trackColor?: string;
  height?: number;
  duration?: number;
  style?: ViewStyle;
}

export default function AnimatedProgressBar({
  percent,
  color,
  trackColor = '#EEF2F7',
  height = 7,
  duration = 800,
  style,
}: AnimatedProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: clamped,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clamped, duration, anim]);

  const width = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: trackColor }, style]}>
      <Animated.View style={{ width, height, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: 'hidden', width: '100%' },
});
