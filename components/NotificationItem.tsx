// =============================================================
// NotificationItem – single card in the notification center
// =============================================================

import { Ionicons } from '@expo/vector-icons'
import React, { memo } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { AppColors, AppShadows } from '../constants/theme'
import { CATEGORY_META } from '../types/notifications'
import type { AppNotification } from '../types/notifications'

// ─── Time helper ─────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diffMs   = Date.now() - new Date(iso).getTime()
  const diffMin  = Math.floor(diffMs / 60_000)
  const diffHr   = Math.floor(diffMin / 60)
  const diffDay  = Math.floor(diffHr / 24)

  if (diffMin < 1)  return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr  < 24) return `${diffHr}h ago`
  if (diffDay === 1) return 'Yesterday'
  if (diffDay < 7)  return `${diffDay}d ago`
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short',
  })
}

// ─── Component ───────────────────────────────────────────────

interface Props {
  notification: AppNotification
  onPress: (n: AppNotification) => void
  onDelete: (id: string) => void
}

function NotificationItem({ notification: n, onPress, onDelete }: Props) {
  const meta = CATEGORY_META[n.category] ?? {
    icon: 'notifications-outline',
    color: AppColors.primaryBlue,
    bg:    AppColors.blueLight,
    label: 'Notification',
  }

  return (
    <View style={[styles.card, !n.is_read && styles.unread]}>
      {/* Unread dot */}
      {!n.is_read && <View style={styles.unreadDot} />}

      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.75}
        onPress={() => onPress(n)}
      >
        {/* Icon */}
        <View style={[styles.iconBubble, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon as any} size={22} color={meta.color} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, !n.is_read && styles.titleBold]}
              numberOfLines={1}
            >
              {n.title}
            </Text>
            <Text style={styles.time}>{timeAgo(n.created_at)}</Text>
          </View>
          <Text style={styles.body} numberOfLines={2}>
            {n.body}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.chip, { backgroundColor: meta.bg }]}>
              <Text style={[styles.chipText, { color: meta.color }]}>{meta.label}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Delete */}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onDelete(n.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close" size={16} color={AppColors.textTertiary} />
      </TouchableOpacity>
    </View>
  )
}

export default memo(NotificationItem)

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    backgroundColor: AppColors.white,
    borderRadius:    16,
    padding:         14,
    marginBottom:    10,
    ...AppShadows.cardShadow,
  },
  unread: {
    backgroundColor: '#F0F7FF',
  },
  unreadDot: {
    position:        'absolute',
    top:             16,
    left:            8,
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: '#3498DB',
  },
  row: {
    flex:      1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap:       12,
  },
  iconBubble: {
    width:          44,
    height:         44,
    borderRadius:   22,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  content: {
    flex: 1,
    gap:  3,
  },
  titleRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:             8,
  },
  title: {
    flex:      1,
    fontSize:  14,
    fontWeight: '500',
    color:     AppColors.textPrimary,
  },
  titleBold: {
    fontWeight: '700',
  },
  time: {
    fontSize:  11,
    color:     AppColors.textTertiary,
    flexShrink: 0,
  },
  body: {
    fontSize:   13,
    color:      AppColors.textSecondary,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop:     4,
  },
  chip: {
    borderRadius:    8,
    paddingHorizontal: 8,
    paddingVertical:   2,
  },
  chipText: {
    fontSize:   10,
    fontWeight: '700',
  },
  deleteBtn: {
    width:          28,
    height:         28,
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      -2,
    flexShrink:     0,
  },
})
