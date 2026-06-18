// =============================================================
// Push Notification Helpers – typed wrappers around the edge function
// =============================================================

import { supabase } from './supabase'
import type { SendNotificationPayload, SendNotificationResult } from '../types/notifications'

// ─── Core invoke ─────────────────────────────────────────────

async function invokeSendPush(
  payload: SendNotificationPayload
): Promise<SendNotificationResult> {
  const { data, error } = await supabase.functions.invoke<SendNotificationResult>(
    'send-push',
    { body: payload }
  )
  if (error) {
    console.warn('[Push] invokeSendPush error:', error.message)
    return { sent: 0, stored: 0, errors: [error.message] }
  }
  return data ?? { sent: 0, stored: 0 }
}

// ─── Public API ───────────────────────────────────────────────

/**
 * Send a notification to every user matching one or more roles within a school.
 */
export async function sendPushToRoles(
  payload: Omit<SendNotificationPayload, 'user_ids'> & {
    roles: NonNullable<SendNotificationPayload['roles']>
    school_id: string
  }
): Promise<SendNotificationResult> {
  return invokeSendPush(payload)
}

/**
 * Send a notification to specific users by their auth user IDs.
 */
export async function sendPushToUsers(
  payload: Omit<SendNotificationPayload, 'roles'> & {
    user_ids: NonNullable<SendNotificationPayload['user_ids']>
  }
): Promise<SendNotificationResult> {
  return invokeSendPush(payload)
}

// ─── Role convenience helpers ─────────────────────────────────

/** Notify every parent at a school */
export async function notifyParents(
  schoolId: string,
  title: string,
  body: string,
  payload: Omit<SendNotificationPayload, 'roles' | 'school_id' | 'title' | 'body'>
): Promise<SendNotificationResult> {
  return invokeSendPush({ roles: ['parent'], school_id: schoolId, title, body, ...payload })
}

/** Notify every teacher at a school */
export async function notifyTeachers(
  schoolId: string,
  title: string,
  body: string,
  payload: Omit<SendNotificationPayload, 'roles' | 'school_id' | 'title' | 'body'>
): Promise<SendNotificationResult> {
  return invokeSendPush({ roles: ['teacher'], school_id: schoolId, title, body, ...payload })
}

/** Notify every admin / principal at a school */
export async function notifyAdmins(
  schoolId: string,
  title: string,
  body: string,
  payload: Omit<SendNotificationPayload, 'roles' | 'school_id' | 'title' | 'body'>
): Promise<SendNotificationResult> {
  return invokeSendPush({ roles: ['admin', 'principal'], school_id: schoolId, title, body, ...payload })
}

/** Notify all roles at a school (school-wide broadcast) */
export async function notifyAll(
  schoolId: string,
  title: string,
  body: string,
  payload: Omit<SendNotificationPayload, 'roles' | 'school_id' | 'title' | 'body'>
): Promise<SendNotificationResult> {
  return invokeSendPush({
    roles: ['admin', 'principal', 'teacher', 'parent'],
    school_id: schoolId,
    title,
    body,
    ...payload,
  })
}
