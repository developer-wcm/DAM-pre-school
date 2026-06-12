import React, { useEffect, useRef } from 'react';
import { Animated, DimensionValue, StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS } from '../constants/admissionTheme';

interface SkeletonLoaderProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonLoaderProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        style,
        { opacity },
      ]}
    />
  );
}

// Pre-built skeleton patterns
export function CardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <SkeletonLoader width={60} height={60} borderRadius={16} />
        <View style={styles.cardHeaderText}>
          <SkeletonLoader width="70%" height={20} />
          <SkeletonLoader width="50%" height={14} style={{ marginTop: 8 }} />
        </View>
      </View>
      <SkeletonLoader width="100%" height={16} style={{ marginTop: 16 }} />
      <SkeletonLoader width="80%" height={16} style={{ marginTop: 8 }} />
    </View>
  );
}

export function ListItemSkeleton() {
  return (
    <View style={styles.listItem}>
      <SkeletonLoader width={50} height={50} borderRadius={25} />
      <View style={styles.listItemText}>
        <SkeletonLoader width="60%" height={18} />
        <SkeletonLoader width="40%" height={14} style={{ marginTop: 6 }} />
      </View>
      <SkeletonLoader width={24} height={24} borderRadius={12} />
    </View>
  );
}

export function DashboardSkeleton() {
  return (
    <View style={styles.dashboard}>
      {/* Header */}
      <View style={styles.dashboardHeader}>
        <SkeletonLoader width={120} height={24} />
        <SkeletonLoader width={80} height={20} style={{ marginTop: 8 }} />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <SkeletonLoader width={40} height={40} borderRadius={12} />
          <SkeletonLoader width="60%" height={24} style={{ marginTop: 12 }} />
          <SkeletonLoader width="80%" height={14} style={{ marginTop: 6 }} />
        </View>
        <View style={styles.statCard}>
          <SkeletonLoader width={40} height={40} borderRadius={12} />
          <SkeletonLoader width="60%" height={24} style={{ marginTop: 12 }} />
          <SkeletonLoader width="80%" height={14} style={{ marginTop: 6 }} />
        </View>
      </View>

      {/* List Items */}
      <View style={{ marginTop: 24 }}>
        <SkeletonLoader width={150} height={20} style={{ marginBottom: 16 }} />
        <ListItemSkeleton />
        <ListItemSkeleton />
        <ListItemSkeleton />
      </View>
    </View>
  );
}

export function FormSkeleton() {
  return (
    <View style={styles.form}>
      <SkeletonLoader width="40%" height={16} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="100%" height={56} borderRadius={14} style={{ marginBottom: 16 }} />
      
      <SkeletonLoader width="40%" height={16} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="100%" height={56} borderRadius={14} style={{ marginBottom: 16 }} />
      
      <SkeletonLoader width="40%" height={16} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="100%" height={56} borderRadius={14} style={{ marginBottom: 24 }} />
      
      <SkeletonLoader width="100%" height={56} borderRadius={50} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.lightGray,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardHeaderText: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  listItemText: {
    flex: 1,
  },
  dashboard: {
    padding: 20,
  },
  dashboardHeader: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  form: {
    padding: 20,
  },
});
