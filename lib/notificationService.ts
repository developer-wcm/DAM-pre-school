// =============================================================
// Notification Service – all Supabase CRUD for notifications
// =============================================================

import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { AppNotification } from '../types/notifications'

const PAGE_SIZE = 40

// ─── Fetch ────────────────────────────────────────────────────

export async function fetchNotifications(
  userId: string,
  onlyUnread = false,
  page = 0
): Promise<AppNotification[]> {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (onlyUnread) query = query.eq('is_read', false)

  const { data, error } = await query
  if (error) {
    console.error('[NotificationService] fetch:', error.message)
    return []
  }
  return (data ?? []) as AppNotification[]
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .eq('is_deleted', false)

  if (error) return 0
  return count ?? 0
}

// ─── Mutations ────────────────────────────────────────────────

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id)
  if (error) console.error('[NotificationService] markRead:', error.message)
}

export async function markAllRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false)
    .eq('is_deleted', false)
  if (error) console.error('[NotificationService] markAllRead:', error.message)
}

export async function softDeleteNotification(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_deleted: true })
    .eq('id', id)
  if (error) console.error('[NotificationService] delete:', error.message)
}

export async function softDeleteAll(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_deleted: true })
    .eq('user_id', userId)
    .eq('is_deleted', false)
  if (error) console.error('[NotificationService] deleteAll:', error.message)
}

// ─── Push token lifecycle ─────────────────────────────────────

export async function deactivatePushToken(userId: string): Promise<void> {
  const { error } = await supabase
    .from('push_tokens')
    .update({ is_active: false })
    .eq('user_id', userId)
  if (error) console.error('[NotificationService] deactivateToken:', error.message)
}

// ─── Real-time subscription ───────────────────────────────────

export function subscribeToNewNotifications(
  userId: string,
  onNew: (n: AppNotification) => void
): RealtimeChannel {
  return supabase
    .channel(`user_notifs_${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onNew(payload.new as AppNotification)
    )
    .subscribe()
}
