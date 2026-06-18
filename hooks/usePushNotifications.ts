// =============================================================
// usePushNotifications – device registration + deep-link routing
// =============================================================

import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { useRouter } from 'expo-router'
import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'
import { deactivatePushToken } from '../lib/notificationService'
import type { NotificationCategory } from '../types/notifications'

const EAS_PROJECT_ID = '2af89656-d00c-4120-aacf-5e9c24c773b3'

// expo-notifications remote push was removed from Expo Go in SDK 53; skip setup there
const isExpoGo = Constants.appOwnership === 'expo'

// ─── Android notification channels ───────────────────────────
const ANDROID_CHANNELS: Notifications.NotificationChannelInput[] = [
  {
    name: 'Emergency Alerts',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 250, 500],
    lightColor: '#E74C3C',
    sound: 'default',
    enableLights: true,
    enableVibrate: true,
    showBadge: true,
  },
  {
    name: 'Fee Notifications',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#DAA520',
    sound: 'default',
    enableLights: true,
    enableVibrate: true,
    showBadge: true,
  },
  {
    name: 'Attendance',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250],
    lightColor: '#4A90D9',
    sound: 'default',
    enableVibrate: true,
    showBadge: true,
  },
  {
    name: 'Announcements',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250],
    lightColor: '#1E3A5F',
    sound: 'default',
    enableVibrate: true,
    showBadge: true,
  },
  {
    name: 'General',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200],
    lightColor: '#4A90D9',
    sound: 'default',
    showBadge: true,
  },
]

const CHANNEL_IDS = ['emergency', 'fees', 'attendance', 'announcements', 'general']

// Foreground: show alerts + sound + badge for all notifications
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  })
}

// ─── Token acquisition ────────────────────────────────────────

async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null

  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') return null

  if (Platform.OS === 'android') {
    for (let i = 0; i < ANDROID_CHANNELS.length; i++) {
      await Notifications.setNotificationChannelAsync(CHANNEL_IDS[i], ANDROID_CHANNELS[i])
    }
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID })
    return data
  } catch (e) {
    console.error('[Push] getExpoPushTokenAsync failed:', e)
    return null
  }
}

// ─── Deep-link navigation ─────────────────────────────────────

type Role = string | null

function navigateForNotification(
  router: ReturnType<typeof useRouter>,
  data: Record<string, unknown> | undefined,
  role: Role
): void {
  const category = data?.category as NotificationCategory | undefined
  const screen   = data?.screen   as string | undefined
  const sid      = data?.studentId as string | undefined

  const isAdmin = role === 'admin' || role === 'principal'

  // screen overrides category-based routing when set
  const target = screen ?? category

  switch (target) {
    // ── check-in / check-out / attendance ──
    case 'child_check_in':
    case 'child_check_out':
    case 'attendance_update':
      if (role === 'parent') router.push('/(parent)/academic')
      else if (role === 'teacher') router.push('/(teacher)/attendance')
      else if (isAdmin) router.push('/(dashboard)/attendance')
      break

    case 'attendance_reminder':
      if (role === 'teacher') router.push('/(teacher)/attendance')
      break

    case 'attendance_pending':
      if (isAdmin) router.push('/(dashboard)/attendance')
      break

    case 'attendance':
      if (isAdmin) router.push('/(dashboard)/attendance')
      else if (role === 'teacher') router.push('/(teacher)/attendance')
      else if (role === 'parent') router.push('/(parent)/academic')
      break

    // ── fees ──
    case 'fee_reminder':
      if (role === 'parent') router.push('/(parent)/fees')
      else if (isAdmin) router.push('/(dashboard)/outstanding-fees')
      break

    case 'fee_payment_success':
      if (role === 'parent') router.push('/(parent)/fees')
      break

    case 'fee_received':
      if (isAdmin) router.push('/(dashboard)/fees')
      break

    case 'fees':
      if (isAdmin) router.push('/(dashboard)/outstanding-fees')
      else if (role === 'parent') router.push('/(parent)/fees')
      break

    // ── students ──
    case 'new_registration':
    case 'students':
      if (isAdmin) {
        if (sid) router.push(`/(dashboard)/student-profile?id=${sid}` as any)
        else router.push('/(dashboard)/students')
      }
      break

    case 'student-profile':
      if (isAdmin && sid) router.push(`/(dashboard)/student-profile?id=${sid}` as any)
      break

    // ── homework / progress ──
    case 'homework_assigned':
    case 'daily_report_reminder':
      if (role === 'parent') router.push('/(parent)/academic')
      else if (role === 'teacher') router.push('/(teacher)/progress')
      break

    // ── events / meetings ──
    case 'event_reminder':
    case 'meeting_reminder':
      if (isAdmin) router.push('/(dashboard)/events-calendar')
      break

    // ── announcements ──
    case 'school_announcement':
    case 'new_announcement':
      // Navigate to the notifications screen for the user's role
      if (isAdmin) router.push('/(dashboard)/notifications')
      else if (role === 'teacher') router.push('/(teacher)/notifications')
      else if (role === 'parent') router.push('/(parent)/notifications')
      break

    // ── emergency – always go to notifications ──
    case 'emergency_alert':
      if (isAdmin) router.push('/(dashboard)/notifications')
      else if (role === 'teacher') router.push('/(teacher)/notifications')
      else if (role === 'parent') router.push('/(parent)/notifications')
      break

    // ── parent message ──
    case 'parent_message':
    case 'complaint':
    case 'support_request':
      if (isAdmin) router.push('/(dashboard)/notifications')
      else if (role === 'teacher') router.push('/(teacher)/notifications')
      break

    // ── photo upload ──
    case 'photo_upload':
      if (role === 'parent') router.push('/(parent)/academic')
      break

    default:
      // Fallback: open role-appropriate notifications screen
      if (isAdmin) router.push('/(dashboard)/notifications')
      else if (role === 'teacher') router.push('/(teacher)/notifications')
      else if (role === 'parent') router.push('/(parent)/notifications')
  }
}

// ─── Hook ─────────────────────────────────────────────────────

export function usePushNotifications(
  userId: string | null,
  role: string | null,
  schoolId: string | null
) {
  const router = useRouter()
  const foregroundSub = useRef<Notifications.EventSubscription | null>(null)
  const responseSub   = useRef<Notifications.EventSubscription | null>(null)
  const prevUserId    = useRef<string | null>(null)

  // Token cleanup on sign-out
  useEffect(() => {
    if (userId) {
      prevUserId.current = userId
    } else if (prevUserId.current) {
      deactivatePushToken(prevUserId.current)
      prevUserId.current = null
    }
  }, [userId])

  useEffect(() => {
    if (!userId || isExpoGo) return

    // Register / refresh token in DB
    getExpoPushToken().then(async (token) => {
      if (!token) return
      await supabase.from('push_tokens').upsert(
        {
          user_id:    userId,
          token,
          role,
          school_id:  schoolId,
          platform:   Platform.OS,
          device_name: Device.deviceName ?? null,
          is_active:  true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
    })

    // Cold-start: app was killed, user tapped notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        navigateForNotification(
          router,
          response.notification.request.content.data as Record<string, unknown>,
          role
        )
      }
    })

    // Foreground: notification arrived while app is open
    foregroundSub.current = Notifications.addNotificationReceivedListener((_notification) => {
      // Badge / channel already handled by the notification handler above.
      // The NotificationContext real-time subscription will prepend it to the list.
    })

    // Tap response: background / foreground tap
    responseSub.current = Notifications.addNotificationResponseReceivedListener((response) => {
      navigateForNotification(
        router,
        response.notification.request.content.data as Record<string, unknown>,
        role
      )
    })

    return () => {
      foregroundSub.current?.remove()
      responseSub.current?.remove()
    }
  }, [userId, role, schoolId, router])
}
