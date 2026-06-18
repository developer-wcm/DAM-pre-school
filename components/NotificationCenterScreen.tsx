// =============================================================
// NotificationCenterScreen – shared notification inbox
// Used by Admin, Teacher, and Parent role screens.
// =============================================================

import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { AppColors, AppShadows } from '../constants/theme'
import { useNotifications } from '../context/notifications'
import type { AppNotification, NotificationCategory } from '../types/notifications'
import NotificationItem from './NotificationItem'

// ─── Date grouping ────────────────────────────────────────────

function groupLabel(iso: string): string {
  const today    = new Date()
  const date     = new Date(iso)
  const diffDays = Math.floor(
    (today.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0)) / 86_400_000
  )
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7)   return `${diffDays} days ago`
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

interface Section {
  title: string
  data:  AppNotification[]
}

function toSections(notifs: AppNotification[]): Section[] {
  const map = new Map<string, AppNotification[]>()
  for (const n of notifs) {
    const label = groupLabel(n.created_at)
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(n)
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }))
}

// ─── Notification tap → navigate ──────────────────────────────

type Role = 'admin' | 'principal' | 'teacher' | 'parent'

function getNavTarget(
  category: NotificationCategory,
  data: AppNotification['data'],
  role: Role
): string | null {
  const isAdmin = role === 'admin' || role === 'principal'
  const sid     = data?.studentId

  switch (category) {
    case 'child_check_in':
    case 'child_check_out':
    case 'attendance_update':
      return role === 'parent'  ? '/(parent)/academic'      :
             role === 'teacher' ? '/(teacher)/attendance'   :
             isAdmin            ? '/(dashboard)/attendance' : null

    case 'attendance_reminder':
      return role === 'teacher' ? '/(teacher)/attendance' : null

    case 'attendance_pending':
      return isAdmin ? '/(dashboard)/attendance' : null

    case 'fee_reminder':
      return role === 'parent' ? '/(parent)/fees'              :
             isAdmin           ? '/(dashboard)/outstanding-fees' : null

    case 'fee_payment_success':
      return role === 'parent' ? '/(parent)/fees' : null

    case 'fee_received':
      return isAdmin ? '/(dashboard)/fees' : null

    case 'new_registration':
      if (isAdmin) return sid ? `/(dashboard)/student-profile?id=${sid}` : '/(dashboard)/students'
      return null

    case 'homework_assigned':
      return role === 'parent'  ? '/(parent)/academic'    :
             role === 'teacher' ? '/(teacher)/progress'   : null

    case 'daily_report_reminder':
      return role === 'teacher' ? '/(teacher)/progress' : null

    case 'event_reminder':
    case 'meeting_reminder':
      return isAdmin ? '/(dashboard)/events-calendar' : null

    default:
      return null
  }
}

// ─── Props ───────────────────────────────────────────────────

interface Props {
  role: Role
  title?: string
  backTarget?: string
}

// ─── Screen ──────────────────────────────────────────────────

export default function NotificationCenterScreen({
  role,
  title = 'Notifications',
  backTarget,
}: Props) {
  const router = useRouter()
  const {
    notifications,
    unreadCount,
    loading,
    refreshing,
    refresh,
    markRead,
    markAllAsRead,
    deleteOne,
    deleteAll,
  } = useNotifications()

  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const filtered = useMemo(
    () => (filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications),
    [notifications, filter]
  )

  const sections = useMemo(() => toSections(filtered), [filtered])

  // ── Handlers ─────────────────────────────────────────────────

  const handlePress = useCallback(
    (n: AppNotification) => {
      markRead(n.id)
      const target = getNavTarget(n.category, n.data, role)
      if (target) router.push(target as any)
    },
    [markRead, role, router]
  )

  const handleDelete = useCallback(
    (id: string) => deleteOne(id),
    [deleteOne]
  )

  const handleDeleteAll = useCallback(() => {
    Alert.alert(
      'Clear All',
      'Remove all notifications? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: deleteAll },
      ]
    )
  }, [deleteAll])

  // ── Render helpers ────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: AppNotification }) => (
      <NotificationItem
        notification={item}
        onPress={handlePress}
        onDelete={handleDelete}
      />
    ),
    [handlePress, handleDelete]
  )

  const renderSectionHeader = useCallback(
    ({ section }: { section: Section }) => (
      <Text style={styles.sectionLabel}>{section.title}</Text>
    ),
    []
  )

  const ListEmpty = (
    <View style={styles.emptyBox}>
      <Ionicons name="notifications-off-outline" size={64} color={AppColors.textLight} />
      <Text style={styles.emptyTitle}>
        {filter === 'unread' ? 'No unread notifications' : 'All caught up!'}
      </Text>
      <Text style={styles.emptyBody}>
        {filter === 'unread'
          ? 'Switch to All to see past notifications.'
          : 'New notifications will appear here.'}
      </Text>
    </View>
  )

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (backTarget ? router.push(backTarget as any) : router.back())}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={AppColors.primaryBlue} />
        </TouchableOpacity>

        <View style={styles.headerMid}>
          <Text style={styles.headerTitle}>{title}</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>

        {/* Mark all read */}
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.headerAction} activeOpacity={0.7}>
            <Ionicons name="checkmark-done" size={20} color={AppColors.primaryBlue} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Filter tabs ────────────────────────────────────── */}
      <View style={styles.filterRow}>
        {(['all', 'unread'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? `All (${notifications.length})` : `Unread (${unreadCount})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── List ───────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={AppColors.primaryBlue} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={ListEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={AppColors.primaryBlue}
            />
          }
          ListFooterComponent={
            notifications.length > 0 ? (
              <TouchableOpacity
                style={styles.clearAllBtn}
                onPress={handleDeleteAll}
                activeOpacity={0.75}
              >
                <Ionicons name="trash-outline" size={16} color={AppColors.error} />
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingTop:       56,
    paddingBottom:    14,
    paddingHorizontal: 16,
    backgroundColor:  AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.blueLight,
    gap: 10,
  },
  backBtn: {
    width:          38,
    height:         38,
    borderRadius:   19,
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: AppColors.blueLight,
  },
  headerMid: {
    flex:          1,
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  headerTitle: {
    fontSize:   20,
    fontWeight: '800',
    color:      AppColors.textPrimary,
  },
  unreadBadge: {
    backgroundColor:  AppColors.error,
    borderRadius:     10,
    paddingHorizontal: 8,
    paddingVertical:   2,
  },
  unreadBadgeText: {
    color:      '#FFF',
    fontSize:   11,
    fontWeight: '800',
  },
  headerAction: {
    width:          38,
    height:         38,
    borderRadius:   19,
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: AppColors.blueLight,
  },
  filterRow: {
    flexDirection:    'row',
    paddingHorizontal: 16,
    paddingVertical:   12,
    gap:               8,
    backgroundColor:  AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.blueLight,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical:    7,
    borderRadius:       20,
    backgroundColor:   AppColors.blueLight,
  },
  filterTabActive: {
    backgroundColor: AppColors.primaryBlue,
  },
  filterText: {
    fontSize:   13,
    fontWeight: '600',
    color:      AppColors.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  loadingBox: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  listContent: {
    padding:    16,
    paddingBottom: 80,
  },
  sectionLabel: {
    fontSize:     12,
    fontWeight:   '700',
    color:        AppColors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom:  8,
    marginTop:     16,
  },
  emptyBox: {
    alignItems:   'center',
    paddingTop:   80,
    gap:          12,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize:   18,
    fontWeight: '700',
    color:      AppColors.textPrimary,
    textAlign:  'center',
  },
  emptyBody: {
    fontSize:  13,
    color:     AppColors.textSecondary,
    textAlign: 'center',
  },
  clearAllBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
    marginTop:      24,
    paddingVertical: 12,
    borderRadius:   12,
    borderWidth:     1,
    borderColor:    AppColors.error,
  },
  clearAllText: {
    color:      AppColors.error,
    fontSize:   13,
    fontWeight: '700',
  },
})
