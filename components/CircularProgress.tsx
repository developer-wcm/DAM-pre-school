import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
  /** 0–100 */
  percent: number;
  size?: number;
  strokeWidth?: number;
  /** gradient start/end (defaults to navy→blue) */
  colors?: [string, string];
  trackColor?: string;
  /** big centered label, defaults to `${percent}%` */
  label?: string;
  subLabel?: string;
  labelColor?: string;
  duration?: number;
}

export default function CircularProgress({
  percent,
  size = 96,
  strokeWidth = 9,
  colors = ['#1E3A5F', '#3A9BD5'],
  trackColor = 'rgba(255,255,255,0.25)',
  label,
  subLabel,
  labelColor = '#FFFFFF',
  duration = 900,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: clamped,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [clamped, duration, anim]);

  const strokeDashoffset = anim.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="cpGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors[0]} />
            <Stop offset="1" stopColor={colors[1]} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#cpGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={[styles.label, { color: labelColor, fontSize: size * 0.27 }]}>
          {label ?? `${Math.round(clamped)}%`}
        </Text>
        {subLabel ? (
          <Text style={[styles.subLabel, { color: labelColor }]}>{subLabel}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center' },
  label: { fontWeight: '900' },
  subLabel: { fontSize: 10, fontWeight: '600', opacity: 0.8, marginTop: 1 },
});
