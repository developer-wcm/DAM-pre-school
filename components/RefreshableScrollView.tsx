import React, { useState } from 'react';
import { RefreshControl, ScrollView, ScrollViewProps } from 'react-native';
import { COLORS } from '../constants/admissionTheme';
import { hapticFeedback } from '../utils/haptics';

interface RefreshableScrollViewProps extends ScrollViewProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function RefreshableScrollView({
  onRefresh,
  children,
  ...props
}: RefreshableScrollViewProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    hapticFeedback.light();

    try {
      await onRefresh();
      hapticFeedback.success();
    } catch (error) {
      console.error('Refresh error:', error);
      hapticFeedback.error();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      {...props}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={COLORS.primary}
          colors={[COLORS.primary, COLORS.secondary]}
          progressBackgroundColor={COLORS.white}
        />
      }
    >
      {children}
    </ScrollView>
  );
}
