import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/admissionTheme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  emoji?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: any;
}

export function EmptyState({
  icon,
  emoji,
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Icon or Emoji */}
      <View style={styles.iconContainer}>
        {emoji ? (
          <Text style={styles.emoji}>{emoji}</Text>
        ) : (
          <Ionicons
            name={icon || 'file-tray-outline'}
            size={64}
            color={COLORS.gray}
          />
        )}
      </View>

      {/* Text */}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {/* Action Button */}
      {actionLabel && onAction && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAction}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionGradient}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Pre-built empty states
export function NoStudentsEmpty({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      emoji="👨‍🎓"
      title="No Students Yet"
      description="Start by adding students to your class to see them here."
      actionLabel="Add Student"
      onAction={onAction}
    />
  );
}

export function NoDataEmpty({ title, description }: { title?: string; description?: string }) {
  return (
    <EmptyState
      icon="file-tray-outline"
      title={title || 'No Data Available'}
      description={description || 'There is no data to display at the moment.'}
    />
  );
}

export function NoResultsEmpty({ onClear }: { onClear?: () => void }) {
  return (
    <EmptyState
      icon="search-outline"
      title="No Results Found"
      description="Try adjusting your search or filters to find what you're looking for."
      actionLabel="Clear Filters"
      onAction={onClear}
    />
  );
}

export function NoNotificationsEmpty() {
  return (
    <EmptyState
      emoji="🔔"
      title="No Notifications"
      description="You're all caught up! Check back later for new updates."
    />
  );
}

export function NoAttendanceEmpty({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      emoji="📋"
      title="No Attendance Records"
      description="Start marking attendance to see records here."
      actionLabel="Mark Attendance"
      onAction={onAction}
    />
  );
}

export function NoFeesEmpty() {
  return (
    <EmptyState
      emoji="💰"
      title="No Fee Records"
      description="Fee information will appear here once available."
    />
  );
}

export function OfflineEmpty({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon="cloud-offline-outline"
      title="You're Offline"
      description="Please check your internet connection and try again."
      actionLabel="Retry"
      onAction={onRetry}
    />
  );
}

export function ErrorEmpty({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon="alert-circle-outline"
      title="Something Went Wrong"
      description="We couldn't load the data. Please try again."
      actionLabel="Retry"
      onAction={onRetry}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  actionButton: {
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    gap: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
});
