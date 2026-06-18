// =============================================================
// Notification Context Provider
// Provides notifications, unread count, and CRUD to the whole app.
// =============================================================

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { AppState, AppStateStatus } from 'react-native'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { AppNotification } from '../types/notifications'
import {
  fetchNotifications,
  getUnreadCount,
  markAllRead,
  markNotificationRead,
  softDeleteAll,
  softDeleteNotification,
  subscribeToNewNotifications,
} from '../lib/notificationService'
import { useAuth } from './auth'

// ─── Context shape ────────────────────────────────────────────

interface NotificationContextType {
  notifications: AppNotification[]
  unreadCount: number
  loading: boolean
  refreshing: boolean
  /** Pull-to-refresh */
  refresh: () => Promise<void>
  /** Mark one notification as read (optimistic + persisted) */
  markRead: (id: string) => Promise<void>
  /** Mark every notification as read */
  markAllAsRead: () => Promise<void>
  /** Soft-delete one notification */
  deleteOne: (id: string) => Promise<void>
  /** Soft-delete every notification */
  deleteAll: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | null>(null)

// ─── Provider ─────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount]     = useState(0)
  const [loading, setLoading]             = useState(false)
  const [refreshing, setRefreshing]       = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // ── Load from DB ─────────────────────────────────────────────
  const load = useCallback(
    async (isRefreshing = false) => {
      if (!user?.id) return
      isRefreshing ? setRefreshing(true) : setLoading(true)

      const [notifs, count] = await Promise.all([
        fetchNotifications(user.id),
        getUnreadCount(user.id),
      ])
      setNotifications(notifs)
      setUnreadCount(count)
      setLoading(false)
      setRefreshing(false)
    },
    [user?.id]
  )

  // Initial load + re-load when app returns to foreground
  useEffect(() => {
    if (!user?.id) {
      setNotifications([])
      setUnreadCount(0)
      return
    }
    load()

    const appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') load()
    })
    return () => appStateSub.remove()
  }, [user?.id, load])

  // Real-time INSERT subscription – prepends new notifications instantly
  useEffect(() => {
    if (!user?.id) return

    channelRef.current = subscribeToNewNotifications(user.id, (n) => {
      setNotifications((prev) => [n, ...prev])
      if (!n.is_read) setUnreadCount((c) => c + 1)
    })

    return () => {
      channelRef.current?.unsubscribe()
    }
  }, [user?.id])

  // ── Mutation helpers (optimistic UI) ─────────────────────────

  const markRead = useCallback(
    async (id: string) => {
      const target = notifications.find((n) => n.id === id)
      if (!target || target.is_read) return

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      )
      setUnreadCount((c) => Math.max(0, c - 1))
      await markNotificationRead(id)
    },
    [notifications]
  )

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true, read_at: n.read_at ?? new Date().toISOString() }))
    )
    setUnreadCount(0)
    await markAllRead(user.id)
  }, [user?.id])

  const deleteOne = useCallback(
    async (id: string) => {
      const target = notifications.find((n) => n.id === id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      if (target && !target.is_read) setUnreadCount((c) => Math.max(0, c - 1))
      await softDeleteNotification(id)
    },
    [notifications]
  )

  const deleteAll = useCallback(async () => {
    if (!user?.id) return
    setNotifications([])
    setUnreadCount(0)
    await softDeleteAll(user.id)
  }, [user?.id])

  const refresh = useCallback(() => load(true), [load])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshing,
        refresh,
        markRead,
        markAllAsRead,
        deleteOne,
        deleteAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider')
  return ctx
}
